/* Regenera la home cuando el admin cambia el catálogo (ISR on-demand) */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseRSC } from "../../../lib/supabase-server";

export async function POST() {
  const sb = await supabaseRSC();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ ok: false }, { status: 403 });

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
