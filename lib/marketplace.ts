/* Marketplace P2P: mapeo de collection_items → forma "HV item" que ya consumen
   ProductCard/ItemArt/TradingCard/Price, + helpers de fetch (client-side, RLS). */
import { supabaseBrowser } from "./supabase-browser";
import { rarityInfo } from "./rarities";

const OWNER_JOIN = "profiles!collection_items_owner_id_fkey(handle, full_name, avatar_url)";

/* una fila de collection_items (con el join del dueño) → item para la UI */
export function itemFromCollection(row: any) {
  const ri = row.rarity ? rarityInfo(row.game, row.rarity) : null;
  const photos: string[] = row.photo_urls || [];
  const price = row.price_usd != null ? Number(row.price_usd) : 0;
  const owner = row.profiles || row.owner || {};
  return {
    id: row.id,
    uuid: row.id,
    collectionId: row.id,
    type: "single",
    game: row.game || undefined,
    name: row.name,
    set: row.set_name || undefined,
    number: row.card_number || undefined,
    rarity: ri ? ri.tier : undefined,
    rarityCode: row.rarity || undefined,
    rarityName: ri ? ri.label : undefined,
    rarityShort: ri ? ri.short : undefined,
    foil: row.is_foil || undefined,
    usd: price,
    img: photos[0] || undefined,
    photos,
    cond: row.condition || undefined,
    conditions: row.condition ? [[row.condition, price, 1]] : undefined,
    forSale: row.for_sale,
    status: row.status,
    qualitySeal: row.quality_seal || undefined,
    grade: row.grade || undefined,
    description: row.description || undefined,
    ownerId: row.owner_id,
    ownerHandle: owner.handle || undefined,
    ownerName: owner.full_name || undefined,
    ownerAvatar: owner.avatar_url || undefined,
    createdAt: row.created_at,
  };
}

/* listings públicos a la venta (RLS solo deja ver approved+for_sale) */
export async function fetchMarketplaceListings() {
  const { data, error } = await supabaseBrowser().from("collection_items")
    .select(`*, ${OWNER_JOIN}`)
    .eq("for_sale", true).eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return { items: [], error: error.message };
  return { items: (data || []).map(itemFromCollection), error: null };
}

/* un listing por id (con dueño) */
export async function fetchListing(id: string) {
  const { data } = await supabaseBrowser().from("collection_items")
    .select(`*, ${OWNER_JOIN}`).eq("id", id).single();
  return data ? itemFromCollection(data) : null;
}

/* perfil público por handle (vista segura); fallback al propio perfil aunque
   sea privado, ya que el dueño sí puede leer su fila por RLS */
export async function fetchProfileByHandle(handle: string) {
  const sb = supabaseBrowser();
  const { data } = await sb.from("public_profiles").select("*").eq("handle", handle).maybeSingle();
  if (data) return data;
  const own = await sb.from("profiles")
    .select("id, handle, full_name, bio, avatar_url, banner_url, instagram, top_card_ids")
    .eq("handle", handle).maybeSingle();
  return own.data || null;
}

/* directorio de coleccionistas públicos, con un preview de su binder */
export async function fetchCollectors() {
  const sb = supabaseBrowser();
  const [{ data: profiles }, { data: items }] = await Promise.all([
    sb.from("public_profiles").select("*").order("created_at", { ascending: false }).limit(60),
    sb.from("collection_items").select("owner_id, photo_urls, for_sale, status")
      .or("and(for_sale.eq.true,status.eq.approved),and(for_sale.eq.false,status.eq.posted)")
      .order("created_at", { ascending: false }),
  ]);
  const byOwner: any = {};
  (items || []).forEach((it: any) => {
    const o = (byOwner[it.owner_id] = byOwner[it.owner_id] || { count: 0, forSale: 0, thumbs: [] });
    o.count++; if (it.for_sale) o.forSale++;
    const t = (it.photo_urls || [])[0];
    if (t && o.thumbs.length < 4) o.thumbs.push(t);
  });
  return (profiles || []).map((p: any) => ({ ...p, ...(byOwner[p.id] || { count: 0, forSale: 0, thumbs: [] }) }));
}

/* binder público de un dueño: showcase posteado + ventas aprobadas */
export async function fetchOwnerBinder(ownerId: string) {
  const { data } = await supabaseBrowser().from("collection_items")
    .select(`*, ${OWNER_JOIN}`)
    .eq("owner_id", ownerId)
    .or("and(for_sale.eq.true,status.eq.approved),and(for_sale.eq.false,status.eq.posted)")
    .order("created_at", { ascending: false });
  return (data || []).map(itemFromCollection);
}
