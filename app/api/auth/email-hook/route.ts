/* Send Email Hook de Supabase Auth.
   Cuando está configurado, Supabase DEJA de mandar sus propios emails y nos
   pasa el payload acá: nosotros renderizamos el email con el branding de
   Holoverse y lo enviamos por NUESTRO SMTP (lib/email → nodemailer).

   Configuración en Supabase → Authentication → Hooks → "Send Email":
     - URL: https://TU-DOMINIO/api/auth/email-hook
     - Secret: lo genera Supabase; pegalo en .env.local como SEND_EMAIL_HOOK_SECRET
   Requiere también NEXT_PUBLIC_SUPABASE_URL (ya lo tenés) para armar el link de
   verificación, y el SMTP_* de siempre. */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { authEmail, sendMail } from "../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");

/* Verificación Standard Webhooks (mismo esquema que usa Supabase).
   Devuelve true si la firma valida, o si no hay secret configurado (dev). */
function verify(raw: string, headers: Headers): boolean {
  const secretEnv = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secretEnv) {
    console.warn("[email-hook] SEND_EMAIL_HOOK_SECRET sin configurar — se omite la verificación de firma.");
    return true;
  }
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  // el secret viene como "v1,whsec_<base64>" o "whsec_<base64>" o el base64 pelado
  const base64Secret = secretEnv.replace(/^v1,/, "").replace(/^whsec_/, "");
  let key: Buffer;
  try { key = Buffer.from(base64Secret, "base64"); } catch { return false; }

  const signed = `${id}.${ts}.${raw}`;
  const expected = crypto.createHmac("sha256", key).update(signed).digest("base64");

  // el header es "v1,<sig> v1,<sig2> ..."
  return sigHeader.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      return sig.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch { return false; }
  });
}

type Payload = {
  user: { id: string; email: string; user_metadata?: { full_name?: string; name?: string } };
  email_data: {
    token: string;
    token_hash: string;
    token_hash_new?: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    new_email?: string;
  };
};

/* link de verificación que entiende Supabase */
function verifyLink(d: Payload["email_data"], tokenHash: string) {
  const params = new URLSearchParams({
    token: tokenHash,
    type: d.email_action_type,
    redirect_to: d.redirect_to || d.site_url || "",
  });
  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
}

export async function POST(req: Request) {
  const raw = await req.text();

  if (!verify(raw, req.headers)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Payload;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad body" }, { status: 400 }); }

  const { user, email_data: d } = payload || ({} as Payload);
  if (!user?.email || !d?.email_action_type) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const action = d.email_action_type as any;
  const name = user.user_metadata?.full_name || user.user_metadata?.name;
  const link = verifyLink(d, d.token_hash);

  const built = authEmail(action, { link, code: d.token, name, newEmail: d.new_email });
  if (!built) {
    console.warn("[email-hook] acción de auth desconocida:", action);
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const res = await sendMail(user.email, built.subject, built.html);
  if (!res.ok) {
    // 500 → Supabase reintenta. Si el SMTP no está configurado evitamos loop.
    if ((res as any).skipped) return NextResponse.json({ ok: false, skipped: true });
    return NextResponse.json({ error: (res as any).error || "send failed" }, { status: 500 });
  }
  return NextResponse.json({});
}
