/* Cliente Supabase para Server Components (lee la sesión desde cookies) */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseRSC() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: () => {}, // los Server Components no pueden escribir cookies; lo hace el middleware
      },
    }
  );
}
