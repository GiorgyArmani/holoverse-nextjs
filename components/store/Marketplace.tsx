"use client";
/* Marketplace P2P + perfiles de coleccionista (Fase 1).
   - MarketplaceBrowse: grilla pública de listings aprobados a la venta.
   - CollectorProfile: perfil público (@handle) con top cards + binder estilo IG.
   - ListingDetail: detalle de un item con sello de calidad. */
import React, { useState, useEffect, useCallback } from "react";
import { useHV } from "./context";
import { Icon, Btn, Price, GameTag } from "./ui";
import { ItemArt } from "./art";
import { fetchMarketplaceListings, fetchListing, fetchProfileByHandle, fetchOwnerBinder, fetchCollectors } from "../../lib/marketplace";
import { followCounts, isFollowing, toggleFollow, likeInfo, toggleLike, fetchComments, addComment, deleteComment } from "../../lib/social";

const fmtAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "recién"; if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`; return `${Math.floor(s / 86400)} d`;
};

/* botón de like reutilizable */
function LikeButton({ itemId, size = "md" }: any) {
  const { user, nav } = useHV();
  const [st, setSt] = useState({ count: 0, liked: false });
  useEffect(() => { if (itemId) likeInfo(itemId, user?.id).then(setSt); }, [itemId, user?.id]);
  const toggle = async (e: any) => {
    e.stopPropagation();
    if (!user) { nav("account"); return; }
    const liked = st.liked;
    setSt((s) => ({ liked: !liked, count: s.count + (liked ? -1 : 1) }));
    await toggleLike(itemId, user.id, liked);
  };
  return (
    <button onClick={toggle} className="btn btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: st.liked ? "var(--violet)" : undefined, borderColor: st.liked ? "var(--border-glow)" : undefined }}>
      <Icon name="heart" size={size === "lg" ? 17 : 15} solid={st.liked} />{st.count > 0 ? st.count : "Me gusta"}
    </button>
  );
}

/* sección de comentarios */
function CommentsSection({ itemId }: any) {
  const { user, nav, showToast } = useHV();
  const [comments, setComments] = useState<any>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { fetchComments(itemId).then(setComments); }, [itemId]);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!user) { nav("account"); return; }
    if (!text.trim() || busy) return;
    setBusy(true);
    const { error } = await addComment(itemId, user.id, text);
    setBusy(false);
    if (error) showToast(error.message); else { setText(""); load(); }
  };

  return (
    <div style={{ marginTop: 26 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Comentarios {comments ? `· ${comments.length}` : ""}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={user ? "Escribí un comentario…" : "Iniciá sesión para comentar"} disabled={!user} style={{ flex: 1 }} />
        <Btn variant="holo" disabled={busy || !text.trim()} onClick={send}>Enviar</Btn>
      </div>
      {comments === null ? <p className="muted" style={{ fontSize: 13 }}>Cargando…</p>
        : comments.length === 0 ? <p className="muted" style={{ fontSize: 13.5 }}>Todavía no hay comentarios. ¡Sé el primero!</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {comments.map((c: any) => {
              const a = c.actor || {};
              const initials = (a.full_name || a.handle || "?").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => a.handle && nav("profile", { handle: a.handle })} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: a.avatar_url ? `center/cover url(${a.avatar_url})` : "var(--holo)", border: 0, cursor: a.handle ? "pointer" : "default", display: "grid", placeItems: "center", color: "#0a0a12", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-display)" }}>{!a.avatar_url && initials}</button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 13.5 }}>{a.full_name || (a.handle ? `@${a.handle}` : "Coleccionista")}</span>
                      <span className="muted" style={{ fontSize: 11.5 }}>{fmtAgo(c.created_at)}</span>
                      {user?.id === c.user_id && <button onClick={async () => { await deleteComment(c.id); load(); }} className="muted" style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: 11.5, marginLeft: "auto" }}>Borrar</button>}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ---------------- sello de calidad ---------------- */
export function SealBadge({ grade, size = "sm" }: any) {
  return (
    <span className="badge badge-holo" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: size === "lg" ? 12 : 10.5, padding: size === "lg" ? "6px 11px" : "4px 8px" }}>
      <Icon name="shield" size={size === "lg" ? 14 : 12} solid />Sello Holoverse{grade ? ` · ${grade}` : ""}
    </span>
  );
}

/* ---------------- tarjeta de listing / binder (estilo tienda) ---------------- */
function MarketplaceCard({ item, hideOwner }: any) {
  const { nav } = useHV();
  const [hover, setHover] = useState(false);
  return (
    <div className="fade-up" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => nav("listing", { id: item.collectionId })}
      style={{ cursor: "pointer", borderRadius: 18, padding: 12, background: hover ? "var(--surface)" : "transparent",
        border: `1px solid ${hover ? "var(--border-strong)" : "transparent"}`, transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover ? "var(--shadow), 0 12px 44px rgba(124,92,255,.22)" : "none",
        transition: "transform .2s, border-color .2s, background .2s, box-shadow .2s" }}>
      <div style={{ position: "relative" }}>
        <ItemArt item={item} />
        {item.qualitySeal && <div style={{ position: "absolute", top: 8, left: 8 }}><SealBadge grade={item.grade} /></div>}
        {!item.forSale && <span className="badge" style={{ position: "absolute", top: 8, right: 8, background: "rgba(10,10,18,.78)", backdropFilter: "blur(6px)", fontSize: 10 }}>Colección</span>}
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          {item.game ? <GameTag game={item.game} /> : <span className="gtag muted">Carta</span>}
          {item.cond && <span className="muted" style={{ fontSize: 11.5 }}>{item.cond}{item.foil ? " · foil" : ""}</span>}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, lineHeight: 1.18, minHeight: 34 }}>{item.name}</div>
        {item.set && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{item.set}{item.number ? ` · ${item.number}` : ""}</div>}
        {!hideOwner && (
          <button onClick={(e) => { e.stopPropagation(); item.ownerHandle && nav("profile", { handle: item.ownerHandle }); }}
            className="muted" style={{ background: "transparent", border: 0, padding: 0, cursor: item.ownerHandle ? "pointer" : "default", fontSize: 12, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 5, color: "var(--violet)" }}>
            {item.ownerHandle ? `@${item.ownerHandle}` : (item.ownerName || "Coleccionista")}
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 }}>
          {item.forSale ? <Price usd={item.usd} size={17} /> : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text-2)" }}>En exhibición</span>}
          <span className={`btn btn-sm ${hover ? "btn-holo" : ""}`} style={{ pointerEvents: "none" }}>Ver<Icon name="arrow" size={13} /></span>
        </div>
      </div>
    </div>
  );
}

function BinderGrid({ items, hideOwner }: any) {
  if (!items.length) return <div className="panel" style={{ padding: 50, textAlign: "center" }}><p className="muted">Todavía no hay cartas en este binder.</p></div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }} className="hv-browse-grid">
      {items.map((it: any) => <MarketplaceCard key={it.collectionId} item={it} hideOwner={hideOwner} />)}
    </div>
  );
}

/* ---------------- tarjeta de coleccionista (directorio) ---------------- */
function CollectorCard({ c }: any) {
  const { nav } = useHV();
  const initials = (c.full_name || c.handle || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <button onClick={() => nav("profile", { handle: c.handle })} className="panel fade-up"
      style={{ textAlign: "left", cursor: "pointer", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}>
      {/* banner */}
      <div style={{ height: 70, background: c.banner_url ? `center/cover url(${c.banner_url})` : "var(--holo)" }} />
      <div style={{ padding: "0 16px 16px", marginTop: -26 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid var(--surface)", background: c.avatar_url ? `center/cover url(${c.avatar_url})` : "var(--holo)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, color: "#0a0a12", fontSize: 19 }}>
          {!c.avatar_url && initials}
        </div>
        <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{c.full_name || c.handle}</div>
        <div className="muted" style={{ fontSize: 12.5, color: "var(--violet)" }}>@{c.handle}</div>
        {c.bio && <div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.bio}</div>}
        {/* mini binder */}
        {c.thumbs?.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 10 }}>
            {c.thumbs.map((t: string, i: number) => <span key={i} style={{ aspectRatio: "1/1", borderRadius: 6, background: `center/cover url(${t})`, border: "1px solid var(--border)" }} />)}
          </div>
        )}
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{c.count} cartas{c.forSale ? ` · ${c.forSale} a la venta` : ""}</div>
      </div>
    </button>
  );
}

/* ---------------- marketplace público ---------------- */
const SORTS = [["recent", "Más nuevos"], ["price-asc", "Precio: menor a mayor"], ["price-desc", "Precio: mayor a menor"]];

export function MarketplaceBrowse() {
  const { nav, user } = useHV();
  const [view, setView] = useState("collectors"); // arranca en la comunidad
  const [items, setItems] = useState<any>(null);
  const [collectors, setCollectors] = useState<any>(null);
  const [game, setGame] = useState("all");
  const [sort, setSort] = useState("recent");

  useEffect(() => { fetchMarketplaceListings().then(({ items }) => setItems(items)); fetchCollectors().then(setCollectors); }, []);

  let list = items ? items.slice() : [];
  if (game !== "all") list = list.filter((x: any) => x.game === game);
  if (sort === "price-asc") list.sort((a: any, b: any) => a.usd - b.usd);
  if (sort === "price-desc") list.sort((a: any, b: any) => b.usd - a.usd);

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Comunidad · P2P verificado</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>Marketplace de coleccionistas</h1>
          <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>Explorá los binders de la comunidad y comprá cartas auditadas y selladas por Holoverse. Nosotros mediamos y despachamos.</p>
        </div>
        <Btn variant="holo" onClick={() => nav("account")}>{user ? "Mi tienda" : "Armá tu tienda"}<Icon name="store" size={16} /></Btn>
      </div>

      {/* tabs comunidad / a la venta */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        {[["collectors", "Coleccionistas"], ["listings", "A la venta"]].map(([id, l]) => (
          <button key={id} onClick={() => setView(id)} style={{ background: "transparent", border: 0, borderBottom: `2px solid ${view === id ? "var(--violet)" : "transparent"}`, color: view === id ? "var(--text)" : "var(--text-3)", padding: "10px 14px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)", cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {view === "collectors" ? (
        collectors === null ? <p className="muted">Cargando coleccionistas…</p>
          : collectors.length === 0 ? (
            <div className="panel" style={{ padding: 60, textAlign: "center" }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Todavía no hay perfiles públicos</h3>
              <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>Sé el primero: armá tu tienda, hacé tu perfil público y mostrá tu colección.</p>
              <Btn variant="holo" onClick={() => nav("account")}>Armá tu tienda<Icon name="arrow" size={15} /></Btn>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
              {collectors.map((c: any) => <CollectorCard key={c.id} c={c} />)}
            </div>
          )
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["all", "Todos"], ["mtg", "Magic"], ["poke", "Pokémon"], ["op", "One Piece"]].map(([id, l]) => (
                <button key={id} onClick={() => setGame(id)} className="badge" style={{ cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 13, fontFamily: "var(--font-body)", color: game === id ? "var(--text)" : "var(--text-3)", borderColor: game === id ? "var(--border-glow)" : "var(--border)", background: game === id ? "var(--accent-soft)" : "transparent" }}>{l}</button>
              ))}
            </div>
            <select className="input" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
            </select>
          </div>
          {items === null ? <p className="muted">Cargando…</p>
            : list.length === 0 ? (
              <div className="panel" style={{ padding: 60, textAlign: "center" }}>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Todavía no hay cartas listadas</h3>
                <p className="muted" style={{ fontSize: 14 }}>Sé el primero: armá tu tienda desde tu cuenta y listá tus cartas.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }} className="hv-browse-grid">
                {list.map((it: any) => <MarketplaceCard key={it.collectionId} item={it} />)}
              </div>
            )}
        </>
      )}
    </div>
  );
}

/* ---------------- perfil público del coleccionista ---------------- */
export function CollectorProfile({ handle }: any) {
  const { nav, user } = useHV();
  const [profile, setProfile] = useState<any>(undefined); // undefined=loading, null=no existe
  const [binder, setBinder] = useState<any[]>([]);
  const [foll, setFoll] = useState({ followers: 0, following: 0 });
  const [iFollow, setIFollow] = useState(false);
  const [fBusy, setFBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchProfileByHandle(handle).then(async (p) => {
      if (!alive) return;
      setProfile(p || null);
      if (p) {
        setBinder(await fetchOwnerBinder(p.id));
        followCounts(p.id).then((c) => alive && setFoll(c));
        isFollowing(p.id, user?.id).then((v) => alive && setIFollow(v));
      }
    });
    return () => { alive = false; };
  }, [handle, user?.id]);

  const isSelf = user && profile && user.id === profile.id;
  const doFollow = async () => {
    if (!user) { nav("account"); return; }
    if (isSelf) return;
    setFBusy(true);
    await toggleFollow(profile.id, user.id, iFollow);
    setIFollow(!iFollow);
    setFoll((f) => ({ ...f, followers: f.followers + (iFollow ? -1 : 1) }));
    setFBusy(false);
  };

  if (profile === undefined) return <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}><p className="muted">Cargando perfil…</p></div>;
  if (profile === null) return (
    <div className="wrap" style={{ padding: "100px 28px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Perfil no encontrado</h1>
      <p className="muted" style={{ marginBottom: 22 }}>Este coleccionista no existe o su perfil es privado.</p>
      <Btn variant="ghost" onClick={() => nav("marketplace")}>Ir al marketplace</Btn>
    </div>
  );

  const name = profile.full_name || profile.handle;
  const initials = (name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const topIds: string[] = profile.top_card_ids || [];
  const topCards = topIds.map((id) => binder.find((b) => b.collectionId === id)).filter(Boolean);
  const forSale = binder.filter((b) => b.forSale);
  const showcase = binder.filter((b) => !b.forSale);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* banner */}
      <div style={{ height: 200, background: profile.banner_url ? `center/cover no-repeat url(${profile.banner_url})` : "var(--holo)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(8,5,15,.6))" }} />
      </div>
      <div className="wrap" style={{ marginTop: -52, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
          <div style={{ width: 104, height: 104, borderRadius: "50%", border: "4px solid var(--bg)", background: profile.avatar_url ? `center/cover url(${profile.avatar_url})` : "var(--holo)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "#0a0a12", flexShrink: 0, overflow: "hidden" }}>
            {!profile.avatar_url && initials}
          </div>
          <div style={{ flex: 1, minWidth: 200, paddingBottom: 6 }}>
            <h1 style={{ fontSize: 28 }}>{name}</h1>
            <div className="muted" style={{ fontSize: 14, marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "var(--violet)" }}>@{profile.handle}</span>
              {profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}><Icon name="instagram" size={14} />{profile.instagram}</a>}
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 8, fontSize: 13.5 }}>
              <span><b style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{foll.followers}</b> <span className="muted">seguidores</span></span>
              <span><b style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{foll.following}</b> <span className="muted">siguiendo</span></span>
              <span><b style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{binder.length}</b> <span className="muted">cartas</span></span>
            </div>
          </div>
          {!isSelf && (
            <div style={{ paddingBottom: 6 }}>
              <Btn variant={iFollow ? "ghost" : "holo"} disabled={fBusy} onClick={doFollow}>{iFollow ? "Siguiendo ✓" : "Seguir"}{!iFollow && <Icon name="plus" size={15} />}</Btn>
            </div>
          )}
        </div>
        {profile.bio && <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 16, maxWidth: 620, lineHeight: 1.6 }}>{profile.bio}</p>}

        {/* top cards */}
        {topCards.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>✦ Top cards</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {topCards.map((it: any) => <MarketplaceCard key={it.collectionId} item={it} />)}
            </div>
          </div>
        )}

        {/* a la venta */}
        {forSale.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>✦ A la venta · {forSale.length}</div>
            <BinderGrid items={forSale} hideOwner />
          </div>
        )}

        {/* colección / showcase */}
        <div style={{ marginTop: 30 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Colección{showcase.length ? ` · ${showcase.length}` : ""}</div>
          <BinderGrid items={showcase} hideOwner />
        </div>
      </div>
    </div>
  );
}

/* ---------------- detalle de un listing ---------------- */
export function ListingDetail({ id }: any) {
  const { nav, showToast, addToCart, user } = useHV();
  const [item, setItem] = useState<any>(undefined);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => { fetchListing(id).then((it) => setItem(it || null)); }, [id]);

  if (item === undefined) return <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}><p className="muted">Cargando…</p></div>;
  if (item === null) return (
    <div className="wrap" style={{ padding: "100px 28px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Carta no encontrada</h1>
      <Btn variant="ghost" onClick={() => nav("marketplace")}>Ir al marketplace</Btn>
    </div>
  );

  const photos: string[] = item.photos?.length ? item.photos : [];
  const main = photos[activePhoto];

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <button onClick={() => nav("marketplace")} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}><Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} />Marketplace</button>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 440px) 1fr", gap: 40, alignItems: "start" }} className="hv-pdp-grid">
        {/* galería */}
        <div style={{ position: "sticky", top: 96 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-2)", aspectRatio: "5/7" }}>
            {main
              ? <img src={main} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%" }}><ItemArt item={item} /></div>}
          </div>
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {photos.map((p, i) => (
                <button key={p} onClick={() => setActivePhoto(i)} style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", border: `2px solid ${i === activePhoto ? "var(--border-glow)" : "var(--border)"}`, padding: 0, cursor: "pointer" }}>
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          {item.qualitySeal && <div style={{ marginBottom: 14 }}><SealBadge grade={item.grade} size="lg" /></div>}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {item.game && <GameTag game={item.game} />}
            {item.rarityName && <span className={`rar rar-${item.rarity}`}>{item.rarityName}</span>}
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3.4vw, 34px)", marginBottom: 6 }}>{item.name}</h1>
          <div className="muted" style={{ fontSize: 14 }}>{[item.set, item.number, item.cond, item.foil ? "Foil" : null].filter(Boolean).join(" · ")}</div>

          <button onClick={() => item.ownerHandle && nav("profile", { handle: item.ownerHandle })}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 18, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: item.ownerHandle ? "pointer" : "default" }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: item.ownerAvatar ? `center/cover url(${item.ownerAvatar})` : "var(--holo)", flexShrink: 0 }} />
            <span style={{ textAlign: "left" }}>
              <span className="muted" style={{ fontSize: 11, display: "block" }}>{item.forSale ? "Vendido por" : "De la colección de"}</span>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14 }}>{item.ownerHandle ? `@${item.ownerHandle}` : (item.ownerName || "Coleccionista")}</span>
            </span>
          </button>

          <div style={{ marginTop: 16 }}><LikeButton itemId={item.collectionId} size="lg" /></div>

          {item.description && <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 18, lineHeight: 1.6 }}>{item.description}</p>}

          <div className="panel panel-pad" style={{ marginTop: 22 }}>
            {item.forSale ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>Precio</div>
                    <Price usd={item.usd} size={26} />
                  </div>
                  {item.qualitySeal ? <span className="muted" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="shield" size={14} />Autenticada</span>
                    : <span className="muted" style={{ fontSize: 12 }}>En auditoría</span>}
                </div>
                {item.status !== "approved" ? (
                  <Btn variant="holo" block size="lg" disabled>{item.status === "sold" ? "Vendida" : "En auditoría"}</Btn>
                ) : user && user.id === item.ownerId ? (
                  <Btn variant="ghost" block size="lg" disabled>Es tu carta</Btn>
                ) : (
                  <Btn variant="holo" block size="lg" onClick={() => { addToCart(item, 1); nav("cart"); }}>
                    Comprar<Icon name="arrow" size={16} />
                  </Btn>
                )}
                <p className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 10 }}>Holoverse media la operación, audita y despacha desde su oficina. El pago se coordina por el chat del pedido.</p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 4 }}>Pieza de colección</div>
                <p className="muted" style={{ fontSize: 13 }}>Esta carta está en exhibición, no a la venta.</p>
              </div>
            )}
          </div>

          <CommentsSection itemId={item.collectionId} />
        </div>
      </div>
    </div>
  );
}
