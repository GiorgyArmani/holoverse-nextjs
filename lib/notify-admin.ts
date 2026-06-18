/* Helper de cliente: dispara un aviso al admin (best-effort, no bloquea la UI). */
import { supabaseBrowser } from "./supabase-browser";

export async function notifyAdmin(kind: string, payload: any = {}) {
  try {
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (!session) return;
    await fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ kind, ...payload }),
    });
  } catch { /* no rompemos la UX por un email */ }
}
