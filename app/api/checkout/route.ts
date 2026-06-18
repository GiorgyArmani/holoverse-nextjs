/* Cierre de compra (sin pasarela de pago todavía).
   - Invitado: crea la cuenta con email ya confirmado para que tenga acceso
     a la post-compra (seguimiento + chat).
   - Logueado: valida el access token.
   En ambos casos los precios se recalculan en el server desde la DB (no se
   confía en el cliente) y la orden queda en estado 'pending' para que el admin
   confirme el pago a mano. */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  if (mode === "auth") {
    if (!accessToken) return NextResponse.json({ error: "Sesión inválida, volvé a iniciar sesión." }, { status: 401 });
    const a = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await a.auth.getUser(accessToken);
    if (error || !data.user) return NextResponse.json({ error: "Sesión inválida, volvé a iniciar sesión." }, { status: 401 });
    userId = data.user.id;
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
  }

  // ---- recalcular precios desde la DB ----
  const ids = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
  if (!ids.length) return NextResponse.json({ error: "Items inválidos" }, { status: 400 });

  const [{ data: prods, error: pErr }, { data: settings }] = await Promise.all([
    admin.from("products").select("id, name, type, price_usd, sale_price_usd, product_conditions(condition, price_usd)").in("id", ids),
    admin.from("site_settings").select("usd_ars_rate, flat_shipping_usd").eq("id", 1).single(),
  ]);
  if (pErr) return NextResponse.json({ error: "No pudimos leer el catálogo: " + pErr.message }, { status: 500 });

  const byId: any = {};
  (prods || []).forEach((p: any) => { byId[p.id] = p; });

  const rows: any[] = [];
  let subtotal = 0;
  for (const it of items) {
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
    rows.push({ product_id: p.id, product_name: p.name, condition: it.condition || null, quantity: qty, unit_price_usd: unit });
  }

  const fx = Number(settings?.usd_ars_rate || 1010);
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

  return NextResponse.json({ orderId: ord.id, orderNumber: ord.order_number });
}
