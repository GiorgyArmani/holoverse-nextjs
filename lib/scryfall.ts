/* Cliente de la API de Scryfall (Magic: The Gathering).
   Gratis, sin API key, CORS abierto. Docs: https://scryfall.com/docs/api
   Cortesía: requests debounced (ellos piden 50–100ms entre llamadas). */

const BASE = "https://api.scryfall.com";

/* La rareza de Scryfall mapea directo a nuestros códigos de MTG;
   special/bonus (The List, etc.) los tratamos como chase. */
const RARITY_MAP: any = { common: "common", uncommon: "uncommon", rare: "rare", mythic: "mythic", special: "mythic", bonus: "mythic" };

function mapCard(c: any) {
  // cartas de dos caras: la imagen vive en card_faces[0]
  const img = c.image_uris || c.card_faces?.[0]?.image_uris || {};
  return {
    id: c.id,
    name: c.name,
    set_name: c.set_name,
    set_code: (c.set || "").toUpperCase(),
    card_number: c.collector_number,
    rarity: RARITY_MAP[c.rarity] || "rare",
    image: img.normal || img.large || img.png || "",
    thumb: img.small || img.normal || "",
    usd: c.prices?.usd ? Number(c.prices.usd) : null,
    usd_foil: c.prices?.usd_foil ? Number(c.prices.usd_foil) : null,
    released: c.released_at,
    finishes: c.finishes || [],
  };
}

/* sugerencias de nombre mientras se tipea */
export async function scryfallAutocomplete(q: string): Promise<string[]> {
  if (q.trim().length < 2) return [];
  try {
    const r = await fetch(`${BASE}/cards/autocomplete?q=${encodeURIComponent(q)}`);
    if (!r.ok) return [];
    const j = await r.json();
    return j.data || [];
  } catch { return []; }
}

/* todas las impresiones (ediciones) de una carta por nombre exacto */
export async function scryfallPrints(name: string) {
  try {
    const q = encodeURIComponent(`!"${name}" game:paper`);
    const r = await fetch(`${BASE}/cards/search?q=${q}&unique=prints&order=released`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.data || []).map(mapCard);
  } catch { return []; }
}
