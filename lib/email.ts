/* Emails de Holoverse: TODO sale por nuestro SMTP (nodemailer) con el branding
   de la tienda. Cubre avisos al admin + los emails de auth (confirmación,
   bienvenida, recuperación, magic link, cambio de email, invitación) que
   reemplazan a los que mandaba Supabase. SOLO server-side.
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

/* Envío genérico por SMTP. Lo usan el hook de auth y los avisos al admin. */
export async function sendMail(to: string | string[], subject: string, html: string, text?: string) {
  const tx = transporter();
  if (!tx) {
    console.warn("[email] SMTP_* sin configurar — se saltea el envío:", subject);
    return { ok: false, skipped: true } as const;
  }
  try {
    await tx.sendMail({ from: fromAddr(), to, subject, html, text: text || htmlToText(html) });
    return { ok: true } as const;
  } catch (e: any) {
    console.error("[email] error enviando:", e?.message || e);
    return { ok: false, error: e?.message } as const;
  }
}

/* fallback de texto plano simple (mejora la entregabilidad / accesibilidad) */
function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
  const to = await adminEmails();
  if (!to.length) {
    console.warn("[email] ningún admin con email en la DB — se saltea:", subject);
    return { ok: false, skipped: true } as const;
  }
  return sendMail(to, subject, html);
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

/* ============================================================
   BRANDING — shell de email de Holoverse
   Tablas + estilos inline (lo único que respetan los clientes de
   correo). Paleta de la tienda: índigo profundo, violeta, oro, holo.
   ============================================================ */
const C = {
  bg:      "#090b18",
  card:    "#121527",
  card2:   "#181b30",
  border:  "#2a2740",
  borderG: "#3a3357",
  text:    "#f4f2fa",
  muted:   "#a39cbe",
  faint:   "#6b6286",
  violet:  "#a68bff",
  violetD: "#7c5cff",
  gold:    "#e6cd8f",
};
const SITE = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.holoversetcg.store").replace(/\/$/, "");

/* wordmark + glow superior */
function header() {
  return `
  <tr><td style="padding:38px 40px 8px;text-align:center">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:700;letter-spacing:.26em;color:${C.gold};text-transform:uppercase">H O L O V E R S E</div>
    <div style="margin:12px auto 0;width:120px;height:3px;border-radius:999px;background:linear-gradient(115deg,#c8d2ff,#a68bff 40%,#d9b8ff 70%,#c9a9ff)"></div>
  </td></tr>`;
}

function footer(note?: string) {
  return `
  <tr><td style="padding:8px 40px 34px">
    <div style="border-top:1px solid ${C.border};padding-top:22px;text-align:center">
      ${note ? `<p style="margin:0 0 14px;color:${C.faint};font-size:12.5px;line-height:1.6">${note}</p>` : ""}
      <p style="margin:0 0 6px;color:${C.muted};font-size:13px;font-weight:600">Holoverse · La bóveda de cartas TCG</p>
      <p style="margin:0;color:${C.faint};font-size:12px;line-height:1.7">
        Magic · Pokémon · One Piece<br/>
        <a href="${SITE()}" style="color:${C.violet};text-decoration:none">${SITE().replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </td></tr>`;
}

/* botón holo (gradiente violeta, texto oscuro) — table-based para Outlook */
function button(label: string, href: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px auto 4px">
    <tr><td align="center" bgcolor="#8b6cff" style="border-radius:999px;background:linear-gradient(115deg,#c8d2ff,#a68bff 42%,#c9a9ff)">
      <a href="${href}" target="_blank" style="display:inline-block;padding:15px 38px;font-family:'Space Grotesk',Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:.02em;color:#0a0a12;text-decoration:none;border-radius:999px">${label}</a>
    </td></tr>
  </table>`;
}

/* shell completo. bodyHtml = contenido interno ya formateado. */
export function storeEmailLayout(opts: {
  preheader?: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  bodyHtml?: string;
  cta?: { label: string; href: string };
  altLink?: string;     // muestra el link crudo como fallback del botón
  footerNote?: string;
}) {
  const { preheader, eyebrow, heading, intro, bodyHtml, cta, altLink, footerNote } = opts;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/><meta name="supported-color-schemes" content="dark"/>
<title>${heading}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg}">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:30px 14px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.border};border-radius:22px;overflow:hidden">
      ${header()}
      <tr><td style="padding:18px 40px 30px">
        ${eyebrow ? `<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${C.violet};font-weight:700;margin-bottom:12px">${eyebrow}</div>` : ""}
        <h1 style="margin:0 0 14px;font-family:'Space Grotesk',Arial,sans-serif;font-size:26px;line-height:1.25;color:${C.text};font-weight:700">${heading}</h1>
        ${intro ? `<p style="margin:0 0 22px;color:${C.muted};font-size:15px;line-height:1.65">${intro}</p>` : ""}
        ${bodyHtml || ""}
        ${cta ? `<div style="text-align:center;margin:26px 0 14px">${button(cta.label, cta.href)}</div>` : ""}
        ${cta && altLink ? `<p style="margin:14px 0 0;color:${C.faint};font-size:12px;line-height:1.6;text-align:center">¿No funciona el botón? Copiá y pegá este enlace:<br/><a href="${altLink}" style="color:${C.violet};text-decoration:none;word-break:break-all">${altLink}</a></p>` : ""}
      </td></tr>
      ${footer(footerNote)}
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* recuadro de código OTP (para reautenticación / códigos) */
function otpBox(code: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px auto 10px">
    <tr><td style="background:${C.card2};border:1px solid ${C.borderG};border-radius:14px;padding:18px 34px">
      <div style="font-family:'Space Grotesk',Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:.34em;color:${C.gold};text-align:center">${code}</div>
    </td></tr>
  </table>`;
}

/* ============================================================
   PLANTILLAS DE AUTH (reemplazan los emails de Supabase)
   ============================================================ */
type AuthAction =
  | "signup" | "magiclink" | "recovery" | "invite"
  | "email_change" | "email_change_current" | "email_change_new"
  | "reauthentication";

/* Construye el subject + html branded para cada acción de auth.
   `link` ya viene armado (verify URL de Supabase). `code` = OTP token. */
export function authEmail(action: AuthAction, ctx: { link: string; code?: string; name?: string; newEmail?: string }) {
  const { link, code, name, newEmail } = ctx;
  const hi = name ? `${name}, ` : "";

  switch (action) {
    case "signup":
      return {
        subject: "✦ Bienvenido a Holoverse — confirmá tu cuenta",
        html: storeEmailLayout({
          preheader: "Confirmá tu email para activar tu cuenta en Holoverse.",
          eyebrow: "Nueva cuenta",
          heading: "Bienvenido al Holoverse ✦",
          intro: `${hi}tu cuenta está casi lista. Confirmá tu email y entrá a la bóveda: pedidos, lista de deseos, crédito en tienda y tu propio binder para vender cartas.`,
          cta: { label: "Confirmar mi cuenta", href: link },
          altLink: link,
          footerNote: "Si no creaste esta cuenta, ignorá este email y no pasará nada.",
        }),
      };
    case "magiclink":
      return {
        subject: "Tu acceso mágico a Holoverse",
        html: storeEmailLayout({
          preheader: "Entrá a Holoverse con un solo clic.",
          eyebrow: "Iniciar sesión",
          heading: "Entrá a la bóveda",
          intro: `${hi}usá este enlace para iniciar sesión al instante. Vence en 1 hora y solo funciona una vez.`,
          cta: { label: "Iniciar sesión", href: link },
          altLink: link,
          footerNote: "Si no pediste este acceso, ignorá este email.",
        }),
      };
    case "recovery":
      return {
        subject: "Restablecé tu contraseña · Holoverse",
        html: storeEmailLayout({
          preheader: "Elegí una nueva contraseña para tu cuenta de Holoverse.",
          eyebrow: "Seguridad",
          heading: "Restablecé tu contraseña",
          intro: `${hi}recibimos un pedido para cambiar tu contraseña. Tocá el botón para elegir una nueva. El enlace vence en 1 hora.`,
          cta: { label: "Cambiar contraseña", href: link },
          altLink: link,
          footerNote: "Si no pediste esto, ignorá el email: tu contraseña actual sigue intacta.",
        }),
      };
    case "invite":
      return {
        subject: "Te invitaron a Holoverse ✦",
        html: storeEmailLayout({
          preheader: "Aceptá tu invitación a Holoverse.",
          eyebrow: "Invitación",
          heading: "Te abrieron las puertas de la bóveda",
          intro: `${hi}alguien de Holoverse te invitó a sumarte. Aceptá la invitación y definí tu contraseña para empezar.`,
          cta: { label: "Aceptar invitación", href: link },
          altLink: link,
        }),
      };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        subject: "Confirmá el cambio de email · Holoverse",
        html: storeEmailLayout({
          preheader: "Confirmá tu nueva dirección de email.",
          eyebrow: "Seguridad",
          heading: "Confirmá tu nuevo email",
          intro: `${hi}para vincular ${newEmail ? `<b style="color:${C.text}">${newEmail}</b> ` : ""}a tu cuenta de Holoverse, confirmá el cambio con este enlace.`,
          cta: { label: "Confirmar nuevo email", href: link },
          altLink: link,
          footerNote: "Si no pediste cambiar tu email, contactanos: tu cuenta podría estar en riesgo.",
        }),
      };
    case "reauthentication":
      return {
        subject: "Tu código de verificación · Holoverse",
        html: storeEmailLayout({
          preheader: `Tu código de verificación es ${code || ""}.`,
          eyebrow: "Verificación",
          heading: "Tu código de seguridad",
          intro: `${hi}ingresá este código para confirmar tu identidad. Vence en pocos minutos.`,
          bodyHtml: code ? otpBox(code) : "",
          footerNote: "Si no pediste este código, ignorá este email.",
        }),
      };
  }
}

/* Email de bienvenida (post-confirmación). Distinto del de creación de cuenta:
   se manda cuando el usuario YA confirmó y está adentro. */
export function welcomeEmail(ctx: { name?: string }) {
  const hi = ctx.name ? `${ctx.name}, ` : "";
  const perks: [string, string][] = [
    ["Tu bóveda", "Seguí tus pedidos, tu crédito en tienda y tu lista de deseos."],
    ["Armá tu binder", "Subí tu colección y vendé cartas en el marketplace con auditoría de Holoverse."],
    ["+10% en crédito", "Vendénos cartas y cobrá un 10% extra si lo tomás como crédito en tienda."],
  ];
  const bodyHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${perks.map(([t, d]) => `
    <tr><td style="padding:11px 0;border-bottom:1px solid ${C.border}">
      <div style="font-family:'Space Grotesk',Arial,sans-serif;font-weight:700;font-size:14.5px;color:${C.text}">${t}</div>
      <div style="color:${C.muted};font-size:13.5px;line-height:1.55;margin-top:3px">${d}</div>
    </td></tr>`).join("")}
  </table>`;
  return {
    subject: "Ya sos parte del Holoverse ✦",
    html: storeEmailLayout({
      preheader: "Tu cuenta está activa. Esto es lo que podés hacer.",
      eyebrow: "Cuenta activada",
      heading: `¡Bienvenido al Holoverse! ✦`,
      intro: `${hi}tu cuenta ya está activa. Esto es lo que te espera dentro de la bóveda:`,
      bodyHtml,
      cta: { label: "Explorar el catálogo", href: `${SITE()}/browse` },
    }),
  };
}

/* layout HTML para los avisos al admin — ahora con el branding de la tienda */
export function adminEmailLayout(title: string, rows: [string, string][], note?: string) {
  const items = rows.map(([k, v]) => `
    <tr>
      <td style="padding:7px 14px 7px 0;color:${C.muted};font-size:13.5px;white-space:nowrap">${k}</td>
      <td style="padding:7px 0;font-weight:600;color:${C.text};font-size:13.5px">${v}</td>
    </tr>`).join("");
  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:${C.card2};border:1px solid ${C.border};border-radius:14px">
      <tr><td style="padding:16px 18px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">${items}</table>
      </td></tr>
    </table>`;
  return storeEmailLayout({
    eyebrow: "Panel de administración",
    heading: title,
    intro: note,
    bodyHtml,
    cta: { label: "Abrir el panel", href: `${SITE()}/admin` },
    footerNote: "Notificación automática del sistema de avisos al admin.",
  });
}
