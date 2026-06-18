/* Avisos al admin por email para eventos disparados desde el cliente
   (nueva lista de venta, carta enviada a auditar). Requiere sesión válida
   para evitar abuso; siempre envía a ADMIN_NOTIFY_EMAILS (no a destinatarios
   arbitrarios). El email se manda por SMTP (lib/email). */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins, adminEmailLayout } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const sb = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "invalid token" }, { status: 401 });
  const actor = data.user.email || "usuario";

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad body" }, { status: 400 }); }

  let subject = "", html = "", kind = "admin", title = "", note = "";
  if (body.kind === "sell_submission") {
    subject = "🟣 Nueva lista de venta de cliente";
    kind = "admin_sell_submission"; title = "Nueva lista de venta de cliente";
    note = `${actor} · ${body.count ?? "—"} cartas`;
    html = adminEmailLayout(title, [
      ["Cliente", actor],
      ["Cartas", String(body.count ?? "—")],
      ["Pago", body.payout === "cash" ? "Efectivo" : "Crédito en tienda"],
    ], "Revisala en el panel → Compras.");
  } else if (body.kind === "marketplace_listing") {
    subject = "🟣 Nueva carta para auditar (marketplace)";
    kind = "admin_listing"; title = "Carta enviada a consignación";
    note = `${actor} · ${body.name || "—"}`;
    html = adminEmailLayout(title, [
      ["Vendedor", actor],
      ["Carta", body.name || "—"],
      ["Precio", body.price ? `US$${body.price}` : "—"],
    ], "Auditala y aprobala en el panel → Marketplace.");
  } else {
    return NextResponse.json({ error: "unknown kind" }, { status: 400 });
  }

  await notifyAdmins({ subject, html, kind, title, body: note });
  return NextResponse.json({ ok: true });
}
