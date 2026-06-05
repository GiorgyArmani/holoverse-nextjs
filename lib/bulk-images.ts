/* Búsqueda masiva de imágenes para singles sin foto.
   Cada juego usa su API: MTG→Scryfall, Pokémon→TCGdex, OP→apitcg (proxy).
   Estrategia conservadora: match exacto por set+número — mejor un
   faltante que una imagen equivocada. */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stripParens = (s: string) => (s || "").split(" (")[0].trim();

/* MTG: /cards/{set}/{collector_number} es match exacto; fuzzy por nombre de fallback */
async function scryfallImage(p: any) {
  const num = (p.card_number || "").split("/")[0].trim();
  const urls: string[] = [];
  if (p.set_code && num) urls.push(`https://api.scryfall.com/cards/${p.set_code.toLowerCase()}/${encodeURIComponent(num)}`);
  urls.push(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(stripParens(p.name))}`);
  for (const u of urls) {
    try {
      const r = await fetch(u);
      if (!r.ok) continue;
      const c = await r.json();
      const img = c.image_uris || c.card_faces?.[0]?.image_uris || {};
      if (img.normal || img.large) return img.normal || img.large;
    } catch {}
  }
  return null;
}

/* Pokémon: matcheamos el set por nombre y armamos el id exacto {set}-{localId} */
let tcgdexSetsCache: any = null;
async function tcgdexImage(p: any) {
  try {
    if (!tcgdexSetsCache) {
      const r = await fetch("https://api.tcgdex.net/v2/en/sets");
      tcgdexSetsCache = r.ok ? await r.json() : [];
    }
    const set = tcgdexSetsCache.find((s: any) => (s.name || "").toLowerCase() === (p.set_name || "").toLowerCase());
    if (!set) return null;
    const localId = (p.card_number || "").split("/")[0].trim();
    const r = await fetch(`https://api.tcgdex.net/v2/en/cards/${set.id}-${localId}`);
    if (!r.ok) return null;
    const c = await r.json();
    return c.image ? `${c.image}/high.webp` : null;
  } catch { return null; }
}

/* One Piece: buscamos por la última palabra del nombre y matcheamos el code exacto */
async function onePieceImage(p: any) {
  try {
    const words = stripParens(p.name).split(/\s+/);
    const q = words[words.length - 1];
    const r = await fetch(`/api/onepiece?q=${encodeURIComponent(q)}`);
    if (!r.ok) return null;
    const j = await r.json();
    const hit = (j.data || []).find((c: any) => c.code === p.card_number);
    return hit?.images?.large || hit?.images?.small || null;
  } catch { return null; }
}

export async function findImageForSingle(p: any) {
  await sleep(130); // cortesía con los rate limits
  if (p.game === "mtg") return scryfallImage(p);
  if (p.game === "poke") return tcgdexImage(p);
  if (p.game === "op") return onePieceImage(p);
  return null;
}
