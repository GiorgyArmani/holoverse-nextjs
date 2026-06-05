/* Rarezas reales por TCG (etiquetas en inglés).
   `tier` mapea cada rareza a common/uncommon/rare/mythic para
   los efectos visuales (CSS rar-*, loot-*) y los filtros del front. */

export const RARITIES: any = {
  mtg: [
    { code: "common",   label: "Common",      short: "Common",   tier: "common" },
    { code: "uncommon", label: "Uncommon",    short: "Uncommon", tier: "uncommon" },
    { code: "rare",     label: "Rare",        short: "Rare",     tier: "rare" },
    { code: "mythic",   label: "Mythic Rare", short: "Mythic",   tier: "mythic" },
  ],
  poke: [
    { code: "common",   label: "Common",                     short: "Common",   tier: "common" },
    { code: "uncommon", label: "Uncommon",                   short: "Uncommon", tier: "uncommon" },
    { code: "rare",     label: "Rare",                       short: "Rare",     tier: "rare" },
    { code: "dr",       label: "Double Rare",                short: "RR",       tier: "rare" },
    { code: "ace",      label: "ACE SPEC Rare",              short: "ACE",      tier: "rare" },
    { code: "ir",       label: "Illustration Rare",          short: "IR",       tier: "rare" },
    { code: "ur",       label: "Ultra Rare",                 short: "UR",       tier: "mythic" },
    { code: "sir",      label: "Special Illustration Rare",  short: "SIR",      tier: "mythic" },
    { code: "hr",       label: "Hyper Rare",                 short: "HR",       tier: "mythic" },
    { code: "promo",    label: "Promo",                      short: "Promo",    tier: "mythic" },
  ],
  op: [
    { code: "c",   label: "Common (C)",         short: "C",     tier: "common" },
    { code: "uc",  label: "Uncommon (UC)",      short: "UC",    tier: "uncommon" },
    { code: "r",   label: "Rare (R)",           short: "R",     tier: "rare" },
    { code: "sr",  label: "Super Rare (SR)",    short: "SR",    tier: "rare" },
    { code: "l",   label: "Leader (L)",         short: "L",     tier: "mythic" },
    { code: "sec", label: "Secret Rare (SEC)",  short: "SEC",   tier: "mythic" },
    { code: "sp",  label: "Special (SP)",       short: "SP",    tier: "mythic" },
    { code: "tr",  label: "Treasure Rare (TR)", short: "TR",    tier: "mythic" },
    { code: "mr",  label: "Manga Rare",         short: "Manga", tier: "mythic" },
    { code: "alt", label: "Alt Art / Parallel", short: "Alt",   tier: "mythic" },
  ],
};

const TIERS = ["common", "uncommon", "rare", "mythic"];

/* Busca la rareza por juego; tolera códigos legacy (tiers) y juegos sin lista. */
export function rarityInfo(game: any, code: any) {
  if (!code) return null;
  const list = RARITIES[game] || [];
  const hit = list.find((r: any) => r.code === code)
    || Object.values(RARITIES).flat().find((r: any) => (r as any).code === code);
  if (hit) return hit;
  // código desconocido: si es un tier viejo lo usamos tal cual, si no cae en "rare"
  return { code, label: code, short: code, tier: TIERS.includes(code) ? code : "rare" };
}
