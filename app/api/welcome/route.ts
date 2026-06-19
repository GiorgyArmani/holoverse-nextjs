/* Email de bienvenida (post-confirmación), branded y por nuestro SMTP.
   Pensado para engancharse como Database Webhook de Supabase:
     Database → Webhooks → Create
       - Tabla: auth.users  ·  Evento: UPDATE
       - URL: https://TU-DOMINIO/api/welcome
       - HTTP header: x-welcome-secret: <valor de WELCOME_HOOK_SECRET>
   Solo dispara cuando email_confirmed_at pasa de null → seteado (recién
   confirmada la cuenta), así no se manda dos veces. */
import { NextResponse } from "next/server";
import { welcomeEmail, sendMail } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  type?: string;
  record?: { email?: string; email_confirmed_at?: string | null; raw_user_meta_data?: { full_name?: string; name?: string } };
  old_record?: { email_confirmed_at?: string | null };
};

export async function POST(req: Request) {
  const secret = process.env.WELCOME_HOOK_SECRET;
  if (secret && req.headers.get("x-welcome-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad body" }, { status: 400 }); }

  const rec = body.record;
  if (!rec?.email) return NextResponse.json({ error: "no email" }, { status: 400 });

  // disparar solo en la transición a confirmado (no en cada update del usuario)
  const justConfirmed = !!rec.email_confirmed_at && !body.old_record?.email_confirmed_at;
  if (!justConfirmed) return NextResponse.json({ ok: true, skipped: "not just confirmed" });

  const name = rec.raw_user_meta_data?.full_name || rec.raw_user_meta_data?.name;
  const { subject, html } = welcomeEmail({ name });
  const res = await sendMail(rec.email, subject, html);
  if (!res.ok && !(res as any).skipped) {
    return NextResponse.json({ error: (res as any).error || "send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
