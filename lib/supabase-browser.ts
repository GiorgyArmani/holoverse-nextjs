/* Cliente Supabase del navegador (sesión en cookies, compartida con el server) */
import { createBrowserClient } from "@supabase/ssr";

let _client: any = null;

export function supabaseBrowser() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
