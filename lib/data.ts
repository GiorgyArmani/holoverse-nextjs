/* Holoverse mock catalog */
/* Holoverse mock catalog. Attaches to window.HV. */

  const USD = 1010; // ARS per USD, for display only

  // ---- helper to derive ARS from a USD price ----
  const ars = (usd) => Math.round(usd * USD);

  const SINGLES = [
    { id: "s1", type: "single", game: "mtg", name: "Ragavan, Nimble Pilferer", set: "Modern Horizons 2", setCode: "MH2", number: "138/303", rarity: "mythic", usd: 64.0, foil: true, hot: true, conditions: [["NM",64.0,3],["LP",58.5,5],["MP",49.0,2]] },
    { id: "s2", type: "single", game: "poke", name: "Charizard ex (Special Illustration)", set: "Obsidian Flames", setCode: "OBF", number: "215/197", rarity: "mythic", usd: 289.0, foil: true, hot: true, conditions: [["NM",289.0,1],["LP",255.0,2]] },
    { id: "s3", type: "single", game: "op", name: "Monkey D. Luffy (Leader Parallel)", set: "Romance Dawn", setCode: "OP-01", number: "OP01-003", rarity: "rare", usd: 78.0, foil: true, hot: true, img: "/luffy.jpeg", conditions: [["NM",78.0,4],["LP",69.0,3]] },
    { id: "s4", type: "single", game: "mtg", name: "Sheoldred, the Apocalypse", set: "Dominaria United", setCode: "DMU", number: "107/281", rarity: "mythic", usd: 71.5, foil: false, conditions: [["NM",71.5,6],["LP",64.0,4],["MP",55.0,3]] },
    { id: "s5", type: "single", game: "poke", name: "Mew ex (Full Art)", set: "151", setCode: "MEW", number: "205/165", rarity: "rare", usd: 42.0, foil: true, conditions: [["NM",42.0,8],["LP",37.5,5]] },
    { id: "s6", type: "single", game: "op", name: "Trafalgar Law (Super Rare)", set: "Paramount War", setCode: "OP-02", number: "OP02-069", rarity: "rare", usd: 36.0, foil: true, conditions: [["NM",36.0,7],["LP",31.0,4]] },
    { id: "s7", type: "single", game: "mtg", name: "Orcish Bowmasters", set: "Lord of the Rings", setCode: "LTR", number: "103/281", rarity: "rare", usd: 33.0, foil: false, low: true, conditions: [["NM",33.0,2],["LP",28.5,1]] },
    { id: "s8", type: "single", game: "poke", name: "Pikachu (Illustrator Promo)", set: "Promo", setCode: "PROMO", number: "001/SP", rarity: "mythic", usd: 1450.0, foil: true, conditions: [["LP",1450.0,1]] },
    { id: "s9", type: "single", game: "op", name: "Yamato (Alt Art)", set: "Pillars of Strength", setCode: "OP-03", number: "OP03-123", rarity: "mythic", usd: 96.0, foil: true, hot: true, conditions: [["NM",96.0,2],["LP",84.0,2]] },
    { id: "s10", type: "single", game: "mtg", name: "The One Ring", set: "Lord of the Rings", setCode: "LTR", number: "246/281", rarity: "mythic", usd: 54.0, foil: true, conditions: [["NM",54.0,4],["LP",47.0,3]] },
    { id: "s11", type: "single", game: "poke", name: "Giratina V (Alt Art)", set: "Lost Origin", setCode: "LOR", number: "186/196", rarity: "rare", usd: 88.0, foil: true, conditions: [["NM",88.0,3],["LP",78.0,2]] },
    { id: "s12", type: "single", game: "op", name: "Nico Robin (Parallel)", set: "Kingdoms of Intrigue", setCode: "OP-04", number: "OP04-089", rarity: "uncommon", usd: 14.0, foil: true, low: true, conditions: [["NM",14.0,9],["LP",11.5,6]] },
    { id: "s13", type: "single", game: "op", name: "Monkey D. Luffy (Magazine Promo SR)", set: "ONE PIECE magazine", setCode: "ST-21", number: "ST21-014", rarity: "mythic", usd: 52.0, foil: true, hot: true, img: "/luffy-ultra-rare.jpeg", conditions: [["NM",52.0,2],["LP",46.0,1]] },
    { id: "s14", type: "single", game: "op", name: "Boa Hancock (Alt Art)", set: "Awakening of the New Era", setCode: "OP-05", number: "OP05-091", rarity: "mythic", usd: 118.0, foil: true, hot: true, img: "/hancok.jpeg", conditions: [["NM",118.0,1],["LP",104.0,2]] },
    { id: "s15", type: "single", game: "op", name: "Edward Newgate (Alt Art)", set: "Paramount War", setCode: "OP-02", number: "OP02-004", rarity: "mythic", usd: 142.0, foil: true, new: true, img: "/new-gate.jpeg", conditions: [["NM",142.0,1]] },
    { id: "s16", type: "single", game: "poke", name: "Bulbasaur (Illustration Promo)", set: "Mega Evolution Promo", setCode: "MEP", number: "037", rarity: "rare", usd: 24.0, foil: true, new: true, img: "/bulbasaur.jpeg", conditions: [["NM",24.0,5],["LP",21.0,3]] },
    { id: "s17", type: "single", game: "poke", name: "Charmander (Illustration Promo)", set: "Mega Evolution Promo", setCode: "MEP", number: "038", rarity: "rare", usd: 26.0, foil: true, hot: true, img: "/charmander.jpeg", conditions: [["NM",26.0,4],["LP",22.5,2]] },
    { id: "s18", type: "single", game: "poke", name: "Squirtle (Illustration Promo)", set: "Mega Evolution Promo", setCode: "MEP", number: "039", rarity: "rare", usd: 22.0, foil: true, conditions: [["NM",22.0,6],["LP",19.0,3]], img: "/squirtle.jpeg" },
  ];

  const SEALED = [
    { id: "b1", type: "sealed", game: "mtg", name: "Modern Horizons 3 (Collector Booster Box)", set: "Modern Horizons 3", setCode: "MH3", usd: 359.0, kind: "Caja Collector · 12 sobres", preorder: true, releases: "Jul 2026" },
    { id: "b2", type: "sealed", game: "poke", name: "Surging Sparks (Elite Trainer Box)", set: "Surging Sparks", setCode: "SSP", usd: 54.99, kind: "ETB · 9 sobres + accesorios", new: true },
    { id: "b3", type: "sealed", game: "op", name: "OP-09 Emperors in the New World (Booster Box)", set: "Emperors in the New World", setCode: "OP-09", usd: 119.0, kind: "Caja booster · 24 sobres", preorder: true, releases: "Aug 2026" },
    { id: "b4", type: "sealed", game: "poke", name: "151 (Ultra Premium Collection)", set: "Scarlet & Violet 151", setCode: "MEW", usd: 129.99, kind: "UPC · 16 sobres + promos", hot: true },
    { id: "b5", type: "sealed", game: "mtg", name: "Bloomburrow (Play Booster Box)", set: "Bloomburrow", setCode: "BLB", usd: 124.0, kind: "Play Box · 36 sobres", low: true },
    { id: "b6", type: "sealed", game: "op", name: "OP-08 Two Legends (Booster Box)", set: "Two Legends", setCode: "OP-08", usd: 109.0, kind: "Caja booster · 24 sobres", new: true },
    { id: "b7", type: "sealed", game: "poke", name: "Prismatic Evolutions (Booster Bundle)", set: "Prismatic Evolutions", setCode: "PRE", usd: 26.99, kind: "Bundle · 6 sobres", hot: true },
    { id: "b8", type: "sealed", game: "mtg", name: "Foundations (Jumpstart Booster Box)", set: "Foundations", setCode: "FDN", usd: 99.0, kind: "Jumpstart · 24 sobres" },
  ];

  const ACCESSORIES = [
    { id: "a1", type: "acc", name: "Fundas Holoverse Prism (100u)", cat: "Fundas", usd: 9.99, color: "Iridescent", new: true },
    { id: "a2", type: "acc", name: "Dragon Shield Matte (100u)", cat: "Fundas", usd: 11.5, color: "Jet Black" },
    { id: "a3", type: "acc", name: "Carpeta Holoverse 12 bolsillos con cierre", cat: "Carpetas", usd: 34.0, color: "Nebula", hot: true },
    { id: "a4", type: "acc", name: "Álbum Ultra Pro 4 bolsillos Toploader", cat: "Carpetas", usd: 18.0, color: "Black" },
    { id: "a5", type: "acc", name: "Playmat Holoverse cosido (Voidscape)", cat: "Playmats", usd: 29.99, color: "Purple", new: true },
    { id: "a6", type: "acc", name: "Deck Box (Magnética 100+)", cat: "Deck Boxes", usd: 16.0, color: "Smoke" },
    { id: "a7", type: "acc", name: "Soporte para slabs graduados (5u)", cat: "Almacenamiento", usd: 12.0, color: "Clear" },
    { id: "a8", type: "acc", name: "Card case Holoverse Premium (35pt)", cat: "Almacenamiento", usd: 6.5, color: "Clear", low: true },
  ];

  const GAMES = {
    mtg:  { id: "mtg",  label: "Magic: The Gathering", short: "Magic", cls: "dot-mtg",  color: "var(--g-mtg)" },
    poke: { id: "poke", label: "Pokémon",              short: "Pokémon", cls: "dot-poke", color: "var(--g-poke)" },
    op:   { id: "op",   label: "One Piece",            short: "One Piece", cls: "dot-op",   color: "var(--g-op)" },
  };

  const all = [...SINGLES, ...SEALED, ...ACCESSORIES];

  export const HV: any = {
    USD, ars,
    SINGLES, SEALED, ACCESSORIES, GAMES,
    all,
    byId: (id) => all.find((x) => x.id === id),
    fmtArs: (n) => "$" + Math.round(n).toLocaleString("es-AR"),
    fmtUsd: (n) => "US$" + n.toFixed(2),
    gameLabel: (g) => (GAMES[g] ? GAMES[g].label : ""),
    rarityLabel: (r) => ({ common: "Común", uncommon: "Infrecuente", rare: "Rara", mythic: "Mítica / Chase" }[r] || r),
  };

