/* Cierre de compra (sin pasarela de pago todavía).
   - Invitado: crea la cuenta con email ya confirmado para que tenga acceso
     a la post-compra (seguimiento + chat).
   - Logueado: valida el access token.
   En ambos casos los precios se recalculan en el server desde la DB (no se
   confía en el cliente) y la orden queda en estado 'pending' para que el admin
   confirme el pago a mano. */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins, adminEmailLayout } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local (Settings → API → service_role) y reiniciá el server." },
      { status: 500 }
    );
  }
  const admin = createClient(URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }
  const { mode, email, password, fullName, accessToken, order, items } = body || {};

  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });

  // ---- resolver el usuario ----
  let userId: string | null = null;
  let buyerEmail: string | null = null;
  if (mode === "auth") {
    if (!accessToken) return NextResponse.json({ error: "Sesión inválida, volvé a iniciar sesión." }, { status: 401 });
    const a = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await a.auth.getUser(accessToken);
    if (error || !data.user) return NextResponse.json({ error: "Sesión inválida, volvé a iniciar sesión." }, { status: 401 });
    userId = data.user.id;
    buyerEmail = data.user.email || null;
  } else {
    if (!email || !password) return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName || null },
    });
    if (error || !created?.user) {
      const already = /registered|exists|already/i.test(error?.message || "");
      return NextResponse.json(
        { error: already ? "already_registered" : (error?.message || "No pudimos crear la cuenta") },
        { status: already ? 409 : 400 }
      );
    }
    userId = created.user.id;
    buyerEmail = email;
  }

  // ---- recalcular precios desde la DB (catálogo + marketplace) ----
  const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
  const listingIds = [...new Set(items.map((i: any) => i.marketplace_listing_id).filter(Boolean))];
  if (!productIds.length && !listingIds.length) return NextResponse.json({ error: "Items inválidos" }, { status: 400 });

  const [{ data: prods, error: pErr }, { data: listings, error: lErr }, { data: settings }] = await Promise.all([
    productIds.length ? admin.from("products").select("id, name, type, price_usd, sale_price_usd, product_conditions(condition, price_usd)").in("id", productIds) : Promise.resolve({ data: [], error: null } as any),
    listingIds.length ? admin.from("collection_items").select("id, name, owner_id, price_usd, for_sale, status, sold_order_id, payout_method").in("id", listingIds) : Promise.resolve({ data: [], error: null } as any),
    admin.from("site_settings").select("usd_ars_rate, flat_shipping_usd, marketplace_commission_pct").eq("id", 1).single(),
  ]);
  if (pErr) return NextResponse.json({ error: "No pudimos leer el catálogo: " + pErr.message }, { status: 500 });
  if (lErr) return NextResponse.json({ error: "No pudimos leer el marketplace: " + lErr.message }, { status: 500 });

  const byId: any = {}; (prods || []).forEach((p: any) => { byId[p.id] = p; });
  const byListing: any = {}; (listings || []).forEach((l: any) => { byListing[l.id] = l; });

  const rows: any[] = [];
  const soldListings: any[] = []; // { listing, unit }
  let subtotal = 0;
  for (const it of items) {
    if (it.marketplace_listing_id) {
      const l = byListing[it.marketplace_listing_id];
      if (!l) return NextResponse.json({ error: "Una carta del marketplace ya no está disponible." }, { status: 409 });
      if (!l.for_sale || l.status !== "approved" || l.sold_order_id) return NextResponse.json({ error: `${l.name} ya no está disponible.` }, { status: 409 });
      if (l.owner_id === userId) return NextResponse.json({ error: "No podés comprar tu propia carta." }, { status: 400 });
      const unit = Number(l.price_usd || 0);
      subtotal += unit;
      rows.push({ product_id: null, marketplace_listing_id: l.id, product_name: l.name, condition: null, quantity: 1, unit_price_usd: unit });
      soldListings.push({ listing: l, unit });
    } else {
      const p = byId[it.product_id];
      if (!p) return NextResponse.json({ error: "Un producto ya no está disponible. Actualizá tu carrito." }, { status: 409 });
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      let unit: number;
      if (it.condition) {
        const c = (p.product_conditions || []).find((x: any) => x.condition === it.condition);
        if (!c) return NextResponse.json({ error: `Condición no disponible para ${p.name}.` }, { status: 409 });
        unit = Number(c.price_usd);
      } else {
        unit = Number(p.sale_price_usd ?? p.price_usd);
      }
      subtotal += unit * qty;
      rows.push({ product_id: p.id, marketplace_listing_id: null, product_name: p.name, condition: it.condition || null, quantity: qty, unit_price_usd: unit });
    }
  }

  const fx = Number(settings?.usd_ars_rate || 1010);
  const commissionPct = Number(settings?.marketplace_commission_pct ?? 10);
  const delivery = order?.delivery === "pickup" ? "pickup" : "ship";
  const shipping = delivery === "pickup" ? 0 : Number(settings?.flat_shipping_usd || 0);
  const total = subtotal + shipping;

  // ---- crear la orden + items (service role: RLS bypass, user_id explícito) ----
  const { data: ord, error: oErr } = await admin.from("orders").insert({
    user_id: userId,
    status: "pending",
    delivery,
    payment_pref: order?.payment_pref || null,
    ship_name: order?.ship_name || null,
    ship_address: order?.ship_address || null,
    ship_city: order?.ship_city || null,
    ship_zip: order?.ship_zip || null,
    subtotal_usd: subtotal,
    shipping_usd: shipping,
    total_usd: total,
    fx_rate: fx,
    total_ars: total * fx,
  }).select("id, order_number").single();
  if (oErr || !ord) return NextResponse.json({ error: "No pudimos crear el pedido: " + (oErr?.message || "") }, { status: 500 });

  const { error: iErr } = await admin.from("order_items").insert(rows.map((r) => ({ ...r, order_id: ord.id })));
  if (iErr) {
    await admin.from("orders").delete().eq("id", ord.id); // rollback manual
    return NextResponse.json({ error: "No pudimos guardar los items: " + iErr.message }, { status: 500 });
  }

  // ---- reservar las cartas vendidas + crear las liquidaciones (pendientes) ----
  for (const s of soldListings) {
    const l = s.listing;
    // reserva condicional (best-effort anti doble-venta): solo si sigue aprobada y libre
    await admin.from("collection_items").update({ status: "sold", sold_order_id: ord.id })
      .eq("id", l.id).eq("status", "approved").is("sold_order_id", null);
    const net = Math.round(s.unit * (1 - commissionPct / 100) * 100) / 100;
    const creditArs = l.payout_method === "store_credit" ? Math.round(net * fx * 1.1 * 100) / 100 : null;
    await admin.from("seller_payouts").insert({
      listing_id: l.id, order_id: ord.id, seller_id: l.owner_id, card_name: l.name,
      gross_usd: s.unit, commission_pct: commissionPct, net_usd: net,
      method: l.payout_method, credit_ars: creditArs, status: "pending",
    });
  }

  // ---- aviso al admin por email (best-effort, no bloquea la respuesta) ----
  const nItems = rows.reduce((n, r) => n + r.quantity, 0);
  const isMarket = soldListings.length > 0;
  await notifyAdmins({
    subject: isMarket ? "🟢 Compra con cartas del marketplace" : "🟢 Nuevo pedido en la tienda",
    kind: isMarket ? "admin_sale" : "admin_order",
    title: isMarket ? "Venta en el marketplace" : "Nuevo pedido",
    body: `${ord.order_number} · ${nItems} item(s) · US$${total.toFixed(2)}`,
    html: adminEmailLayout(isMarket ? "Compra (incluye marketplace)" : "Nuevo pedido", [
      ["Pedido", ord.order_number],
      ["Comprador", buyerEmail || "—"],
      ["Items", String(nItems)],
      ["Total", `US$${total.toFixed(2)} · $${Math.round(total * fx).toLocaleString("es-AR")}`],
      ["Entrega", delivery === "pickup" ? "Retiro en Banfield" : "Envío"],
      ["Pago", order?.payment_pref || "a coordinar"],
      ...(isMarket ? [["Marketplace", `${soldListings.length} carta(s) vendida(s) → liquidación pendiente`] as [string, string]] : []),
    ], "Confirmá el pago y gestionalo en el panel → Pedidos."),
  }).catch(() => {});

  return NextResponse.json({ orderId: ord.id, orderNumber: ord.order_number });
}
