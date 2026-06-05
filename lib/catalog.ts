/* Catálogo desde Supabase → forma que ya consume el front (HV items) */
import { supabaseServer } from "./supabase";
import { rarityInfo } from "./rarities";

const COND_ORDER = { NM: 0, LP: 1, MP: 2, HP: 3 };
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// "2026-07-01" → "Jul 2026"
const fmtRelease = (d) => {
  if (!d) return undefined;
  const [y, m] = d.split("-");
  return `${MONTHS[+m - 1]} ${y}`;
};

// orden natural de SKUs: s1…s18, b1…b8, a1…a8 (como el mock)
const TYPE_ORDER = { single: 0, sealed: 1, acc: 2 };
const skuNum = (sku) => parseInt(String(sku || "").replace(/\D/g, ""), 10) || 0;

function mapRow(row) {
  const ri = row.rarity ? rarityInfo(row.game, row.rarity) : null;
  const conditions = (row.product_conditions || [])
    .slice()
    .sort((a, b) => (COND_ORDER[a.condition] ?? 9) - (COND_ORDER[b.condition] ?? 9))
    .map((c) => [c.condition, Number(c.price_usd), c.stock]);

  const totalStock = row.type === "single"
    ? conditions.reduce((n, c) => n + c[2], 0)
    : row.stock;

  return {
    id: row.sku || row.id,          // el front navega con el sku
    uuid: row.id,                   // id real de la DB (pedidos, wishlist)
    type: row.type === "accessory" ? "acc" : row.type,
    game: row.game || undefined,
    name: row.name,
    set: row.set_name || undefined,
    setCode: row.set_code || undefined,
    number: row.card_number || undefined,
    // rarity = tier visual (common/uncommon/rare/mythic); code/name = rareza real del TCG
    rarity: ri ? ri.tier : undefined,
    rarityCode: row.rarity || undefined,
    rarityName: ri ? ri.label : undefined,
    rarityShort: ri ? ri.short : undefined,
    kind: row.kind || undefined,
    cat: row.category || undefined,
    color: row.variant_color || undefined,
    usd: Number(row.sale_price_usd ?? row.price_usd),
    foil: row.is_foil || undefined,
    hot: row.is_hot || undefined,
    new: row.is_new || undefined,
    preorder: row.is_preorder || undefined,
    releases: fmtRelease(row.release_date),
    img: row.image_url || undefined,
    stock: totalStock,
    low: !row.is_preorder && totalStock > 0 && totalStock <= 3 ? true : undefined,
    conditions: conditions.length ? conditions : undefined,
    createdAt: row.created_at,
  };
}

export async function getCatalog() {
  const sb = supabaseServer();
  const [prod, settings] = await Promise.all([
    sb.from("products")
      .select("*, product_conditions(condition, price_usd, stock)")
      .eq("is_active", true),
    sb.from("site_settings").select("*").eq("id", 1).single(),
  ]);

  if (prod.error) {
    console.error("[catalog] error leyendo products:", prod.error.message);
    return null; // el front cae al mock
  }
  if (settings.error) console.error("[catalog] error leyendo site_settings:", settings.error.message);

  // lo más nuevo primero dentro de cada tipo (el seed empata en created_at
  // y desempata por sku, conservando el orden curado s1…s18)
  const items = prod.data
    .map(mapRow)
    .sort((a, b) =>
      (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)
      || +new Date(b.createdAt) - +new Date(a.createdAt)
      || skuNum(a.id) - skuNum(b.id)
    );

  const s = settings.data;
  return {
    items,
    settings: s ? {
      usdArsRate: Number(s.usd_ars_rate),
      announcement: s.announcement,
      flatShippingUsd: Number(s.flat_shipping_usd),
      freeShippingThresholdArs: Number(s.free_shipping_threshold_ars),
    } : null,
  };
}
