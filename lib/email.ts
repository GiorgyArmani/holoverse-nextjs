/* Avisos al admin: email (SMTP/nodemailer) + notificación in-app.
   Los destinatarios = usuarios con role='admin' en la DB (leídos con service
   role, cacheados 5 min). SOLO server-side.
   SMTP en .env.local: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
   (opcional SMTP_SECURE=true para 465), NOTIFY_FROM. */
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

let _tx: nodemailer.Transporter | null = null;
function transporter() {
  if (_tx) return _tx;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  _tx = nodemailer.createTransport({
    host, port,
    secure: port === 465 || process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return _tx;
}

/* Remitente: por defecto "Holoverse <SMTP_USER>"; se sobreescribe con NOTIFY_FROM. */
const fromAddr = () => {
  if (process.env.NOTIFY_FROM) return process.env.NOTIFY_FROM;
  const user = process.env.SMTP_USER || "";
  return user ? `Holoverse <${user}>` : "";
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* perfiles admin (id + email) cacheados */
let _admins: { at: number; rows: { id: string; email: string | null }[] } | null = null;
async function adminProfiles() {
  if (_admins && Date.now() - _admins.at < 300_000) return _admins.rows;
  let rows: { id: string; email: string | null }[] = [];
  const sb = serviceClient();
  if (sb) {
    try {
      const { data } = await sb.from("profiles").select("id, email").eq("role", "admin");
      rows = data || [];
    } catch (e: any) {
      console.error("[email] no pude leer admins de la DB:", e?.message || e);
    }
  }
  _admins = { at: Date.now(), rows };
  return rows;
}

async function adminEmails() {
  const emails = (await adminProfiles()).map((r) => r.email).filter(Boolean) as string[];
  return emails.length ? emails : (process.env.ADMIN_NOTIFY_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function sendAdminEmail(subject: string, html: string) {
  const tx = transporter();
  const to = await adminEmails();
  if (!tx || !to.length) {
    console.warn("[email] SMTP_* sin configurar o ningún admin con email en la DB — se saltea:", subject);
    return { ok: false, skipped: true } as const;
  }
  try {
    await tx.sendMail({ from: fromAddr(), to, subject, html });
    return { ok: true } as const;
  } catch (e: any) {
    console.error("[email] error enviando:", e?.message || e);
    return { ok: false, error: e?.message } as const;
  }
}

/* notificación in-app a todos los admins (filas en notifications) */
export async function notifyAdminsInApp(kind: string, title: string, body?: string, listingId?: string | null) {
  const sb = serviceClient();
  if (!sb) return;
  const rows = await adminProfiles();
  if (!rows.length) return;
  try {
    await sb.from("notifications").insert(rows.map((r) => ({
      user_id: r.id, kind, title, body: body || null, listing_id: listingId || null,
    })));
  } catch (e: any) {
    console.error("[email] notif in-app admin:", e?.message || e);
  }
}

/* combo: email + in-app a los admins */
export async function notifyAdmins(opts: { subject: string; html: string; kind?: string; title?: string; body?: string; listingId?: string | null }) {
  await notifyAdminsInApp(opts.kind || "admin", opts.title || opts.subject, opts.body, opts.listingId);
  return sendAdminEmail(opts.subject, opts.html);
}

/* layout HTML simple para los avisos */
export function adminEmailLayout(title: string, rows: [string, string][], note?: string) {
  const items = rows.map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;color:#8a8a99">${k}</td><td style="padding:5px 0;font-weight:600;color:#15111f">${v}</td></tr>`).join("");
  return `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:540px;color:#15111f">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8b7dff;font-weight:700">Holoverse</div>
    <h2 style="margin:6px 0 4px;font-size:20px">${title}</h2>
    ${note ? `<p style="color:#555;margin:0 0 16px;font-size:14px">${note}</p>` : ""}
    <table style="border-collapse:collapse;font-size:14px">${items}</table>
    <p style="color:#aaa;font-size:12px;margin-top:22px">Notificación automática · Panel de administración → /admin</p>
  </div>`;
}
