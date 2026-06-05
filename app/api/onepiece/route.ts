/* Proxy de apitcg.com (One Piece) — la API key vive en el servidor.
   GET /api/onepiece?q=luffy → { data: [cartas crudas de apitcg] } */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const key = process.env.APITCG_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "Falta APITCG_API_KEY en .env.local — registrate gratis en apitcg.com/platform y reiniciá el server." },
      { status: 500 }
    );
  }
  if (q.trim().length < 2) return NextResponse.json({ data: [] });

  try {
    const r = await fetch(
      `https://www.apitcg.com/api/one-piece/cards?name=${encodeURIComponent(q.trim())}&limit=40`,
      { headers: { "x-api-key": key }, next: { revalidate: 3600 } }
    );
    if (!r.ok) {
      const msg = r.status === 401 || r.status === 403 ? "API key inválida o vencida (revisá apitcg.com/platform)" : `apitcg respondió ${r.status}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const j = await r.json();
    return NextResponse.json({ data: j.data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: "No se pudo contactar a apitcg.com" }, { status: 502 });
  }
}
