/* Capa social: seguir, likes y comentarios. Client-side (RLS). */
import { supabaseBrowser } from "./supabase-browser";

/* -------- follows -------- */
export async function followCounts(profileId: string) {
  const sb = supabaseBrowser();
  const [{ count: followers }, { count: following }] = await Promise.all([
    sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
    sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  return { followers: followers || 0, following: following || 0 };
}

export async function isFollowing(targetId: string, userId?: string) {
  if (!userId) return false;
  const { data } = await supabaseBrowser().from("follows")
    .select("follower_id").eq("follower_id", userId).eq("following_id", targetId).maybeSingle();
  return !!data;
}

export async function toggleFollow(targetId: string, userId: string, following: boolean) {
  const sb = supabaseBrowser();
  if (following) return sb.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
  return sb.from("follows").insert({ follower_id: userId, following_id: targetId });
}

/* -------- likes -------- */
export async function likeInfo(itemId: string, userId?: string) {
  const sb = supabaseBrowser();
  const { count } = await sb.from("listing_likes").select("*", { count: "exact", head: true }).eq("item_id", itemId);
  let liked = false;
  if (userId) {
    const { data } = await sb.from("listing_likes").select("item_id").eq("item_id", itemId).eq("user_id", userId).maybeSingle();
    liked = !!data;
  }
  return { count: count || 0, liked };
}

export async function toggleLike(itemId: string, userId: string, liked: boolean) {
  const sb = supabaseBrowser();
  if (liked) return sb.from("listing_likes").delete().eq("item_id", itemId).eq("user_id", userId);
  return sb.from("listing_likes").insert({ item_id: itemId, user_id: userId });
}

/* -------- comentarios -------- */
export async function fetchComments(itemId: string) {
  const sb = supabaseBrowser();
  const { data: comments } = await sb.from("listing_comments").select("*").eq("item_id", itemId).order("created_at", { ascending: true });
  const ids = [...new Set((comments || []).map((c: any) => c.user_id))];
  const actors: any = {};
  if (ids.length) {
    const { data } = await sb.from("public_actors").select("*").in("id", ids);
    (data || []).forEach((a: any) => { actors[a.id] = a; });
  }
  return (comments || []).map((c: any) => ({ ...c, actor: actors[c.user_id] || null }));
}

export async function addComment(itemId: string, userId: string, body: string) {
  return supabaseBrowser().from("listing_comments").insert({ item_id: itemId, user_id: userId, body: body.trim() }).select().single();
}

export async function deleteComment(id: string) {
  return supabaseBrowser().from("listing_comments").delete().eq("id", id);
}
