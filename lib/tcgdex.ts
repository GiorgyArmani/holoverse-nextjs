/* Cliente de TCGdex (Pokémon TCG). Gratis, sin API key, CORS abierto.
   Docs: https://tcgdex.dev — imágenes en assets.tcgdex.net (webp). */

const BASE = "https://api.tcgdex.net/v2/en";

/* rarezas de TCGdex (texto libre) → nuestros códigos de Pokémon */
function mapRarity(r: string | undefined) {
  const s = (r || "").toLowerCase();
  if (!s) return "rare";
  if (s === "common") return "common";
  if (s === "uncommon") return "uncommon";
  if (s.includes("special illustration")) return "sir";
  if (s.includes("illustration")) return "ir";
  if (s.includes("ace spec")) return "ace";
  if (s.includes("double")) return "dr";
  if (s.includes("ultra")) return "ur";
  if (s.includes("hyper") || s.includes("rainbow") || s.includes("secret") || s.includes("gold")) return "hr";
  if (s.includes("promo")) return "promo";
  if (s.includes("rare")) return "rare"; // holo rare, shiny rare, etc.
  return "rare";
}

/* mejor precio de mercado disponible (si TCGdex lo trae) */
function bestPrice(c: any): number | null {
  const tp = c.pricing?.tcgplayer;
  if (tp) {
    for (const k of ["holofoil", "normal", "reverse-holofoil", "1st-edition-holofoil"]) {
      const m = tp[k]?.marketPrice ?? tp[k]?.midPrice;
      if (m) return Number(m);
    }
  }
  const cm = c.pricing?.cardmarket;
  if (cm?.trendPrice || cm?.avg30) return Number(cm.trendPrice || cm.avg30);
  return null;
}

/* busca cartas por nombre (cada impresión ya es una carta distinta) */
export async function tcgdexSearch(q: string) {
  if (q.trim().length < 2) return [];
  try {
    const r = await fetch(`${BASE}/cards?name=${encodeURIComponent(q.trim())}`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j || []).slice(0, 60).map((c: any) => ({
      id: c.id,
      name: c.name,
      thumb: c.image ? `${c.image}/low.webp` : "",
    }));
  } catch { return []; }
}

/* detalle completo de una carta → forma lista para el formulario */
export async function tcgdexCard(id: string) {
  try {
    const r = await fetch(`${BASE}/cards/${id}`);
    if (!r.ok) return null;
    const c = await r.json();
    const official = c.set?.cardCount?.official;
    return {
      id: c.id,
      name: c.name,
      set_name: c.set?.name || "",
      set_code: (c.set?.id || "").toUpperCase(),
      card_number: official ? `${c.localId}/${official}` : String(c.localId || ""),
      rarity: mapRarity(c.rarity),
      rarityRaw: c.rarity || "",
      image: c.image ? `${c.image}/high.webp` : "",
      usd: bestPrice(c),
    };
  } catch { return null; }
}
