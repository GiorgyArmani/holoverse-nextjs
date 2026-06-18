/* Prueba de envío de email al admin. Abrí /api/notify-test en el navegador
   estando logueado como admin: manda un email de prueba a los admins (leídos
   de la DB) y devuelve el resultado del SMTP para diagnosticar. */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notifyAdmins, adminEmailLayout } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(URL, ANON, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  });

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Iniciá sesión como admin para probar." }, { status: 401 });

  const { data: prof } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ ok: false, error: "Solo un admin puede ejecutar la prueba." }, { status: 403 });

  const res = await notifyAdmins({
    subject: "✅ Prueba de notificaciones · Holoverse",
    kind: "admin_test",
    title: "Prueba de notificaciones",
    body: `Disparada por ${user.email || "—"} · si ves esto en la campanita, la notif in-app funciona ✦`,
    html: adminEmailLayout("Prueba de email", [
      ["Disparada por", user.email || "—"],
      ["Estado", "Si ves este email, el SMTP funciona ✦"],
    ], "Este es un email de prueba del sistema de avisos al admin."),
  });

  if (res.skipped) return NextResponse.json({ ok: false, hint: "Faltan credenciales SMTP en .env.local o no hay usuarios admin con email en la DB. Reiniciá el dev tras editar .env.local." });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error || "Falló el envío SMTP (revisá host/puerto/usuario/contraseña)." });
  return NextResponse.json({ ok: true, message: "Email de prueba enviado a los admins. Revisá la casilla (y spam)." });
}
