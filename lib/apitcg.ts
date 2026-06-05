/* Mapeo de cartas de apitcg.com (One Piece) → forma del formulario.
   La búsqueda pasa por /api/onepiece (proxy con la API key en el server). */

/* rarezas de apitcg → nuestros códigos de One Piece */
const RARITY: any = {
  C: "c", UC: "uc", R: "r", SR: "sr", SEC: "sec", L: "l",
  P: "sp", "SP CARD": "sp", SP: "sp", TR: "tr",
};

export function mapOnePiece(c: any) {
  const rawSet = c.set?.name || "";
  const bracket = rawSet.match(/\[(.+?)\]/);       // "ROMANCE DAWN [OP-01]" → OP-01
  return {
    id: c.id || c.code,
    name: c.name,
    set_name: rawSet.replace(/\s*\[.+?\]\s*/, "").trim() || rawSet,
    set_code: bracket ? bracket[1] : "",
    card_number: c.code,                            // ej: OP01-003
    rarity: RARITY[(c.rarity || "").toUpperCase().trim()] || "r",
    rarityRaw: c.rarity || "",
    image: c.images?.large || c.images?.small || "",
    thumb: c.images?.small || c.images?.large || "",
  };
}

export async function onePieceSearch(q: string) {
  if (q.trim().length < 2) return { cards: [], error: null };
  try {
    const r = await fetch(`/api/onepiece?q=${encodeURIComponent(q.trim())}`);
    const j = await r.json();
    if (!r.ok) return { cards: [], error: j.error || `Error ${r.status}` };
    return { cards: (j.data || []).map(mapOnePiece), error: null };
  } catch {
    return { cards: [], error: "No se pudo buscar en apitcg" };
  }
}
