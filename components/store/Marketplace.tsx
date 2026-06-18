"use client";
/* Marketplace P2P + perfiles de coleccionista (Fase 1).
   - MarketplaceBrowse: grilla pública de listings aprobados a la venta.
   - CollectorProfile: perfil público (@handle) con top cards + binder estilo IG.
   - ListingDetail: detalle de un item con sello de calidad. */
import React, { useState, useEffect } from "react";
import { HV } from "../../lib/data";
import { useHV } from "./context";
import { Icon, Btn, Price, GameTag } from "./ui";
import { ItemArt } from "./art";
import { fetchMarketplaceListings, fetchListing, fetchProfileByHandle, fetchOwnerBinder } from "../../lib/marketplace";

/* ---------------- sello de calidad ---------------- */
export function SealBadge({ grade, size = "sm" }: any) {
  return (
    <span className="badge badge-holo" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: size === "lg" ? 12 : 10.5, padding: size === "lg" ? "6px 11px" : "4px 8px" }}>
      <Icon name="shield" size={size === "lg" ? 14 : 12} solid />Sello Holoverse{grade ? ` · ${grade}` : ""}
    </span>
  );
}

/* ---------------- tarjeta de listing (marketplace) ---------------- */
function MarketplaceCard({ item }: any) {
  const { nav } = useHV();
  const [hover, setHover] = useState(false);
  return (
    <div className="fade-up" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => nav("listing", { id: item.collectionId })}
      style={{ cursor: "pointer", borderRadius: 18, padding: 12, background: hover ? "var(--surface)" : "transparent",
        border: `1px solid ${hover ? "var(--border-strong)" : "transparent"}`, transform: hover ? "translateY(-4px)" : "none",
        transition: "transform .2s, border-color .2s, background .2s" }}>
      <div style={{ position: "relative" }}>
        <ItemArt item={item} />
        {item.qualitySeal && <div style={{ position: "absolute", top: 8, left: 8 }}><SealBadge grade={item.grade} /></div>}
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          {item.game ? <GameTag game={item.game} /> : <span className="gtag muted">Carta</span>}
          {item.cond && <span className="muted" style={{ fontSize: 11.5 }}>{item.cond}{item.foil ? " · foil" : ""}</span>}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, lineHeight: 1.18, minHeight: 34 }}>{item.name}</div>
        <button onClick={(e) => { e.stopPropagation(); item.ownerHandle && nav("profile", { handle: item.ownerHandle }); }}
          className="muted" style={{ background: "transparent", border: 0, padding: 0, cursor: item.ownerHandle ? "pointer" : "default", fontSize: 12, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 5, color: "var(--violet)" }}>
          {item.ownerHandle ? `@${item.ownerHandle}` : (item.ownerName || "Coleccionista")}
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 }}>
          <Price usd={item.usd} size={17} />
          <span className="btn btn-sm" style={{ pointerEvents: "none" }}>Ver<Icon name="arrow" size={13} /></span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- celda binder (cuadrada, estilo Instagram) ---------------- */
function BinderCell({ item, onClick }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: "relative", aspectRatio: "1/1", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", padding: 0 }}>
      {item.img
        ? <img src={item.img} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        : <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--text-4)", fontSize: 11, padding: 8, textAlign: "center" }}>{item.name}</span>}
      {item.qualitySeal && <span style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: 99, background: "var(--purple-chrome)", backgroundSize: "220% 100%", display: "grid", placeItems: "center", color: "#1a1030", boxShadow: "0 2px 8px rgba(0,0,0,.4)" }} title="Sello Holoverse"><Icon name="shield" size={12} solid /></span>}
      {item.forSale && <span className="badge" style={{ position: "absolute", top: 6, right: 6, background: "rgba(10,10,18,.78)", backdropFilter: "blur(6px)", fontSize: 10, padding: "3px 7px" }}>{HV.fmtUsd(item.usd)}</span>}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 8px 7px", background: "linear-gradient(transparent, rgba(8,5,15,.86))", opacity: hover ? 1 : 0, transition: "opacity .2s" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-display)" }}>{item.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)" }}>{item.forSale ? "A la venta" : "Colección"}{item.cond ? ` · ${item.cond}` : ""}</div>
      </div>
    </button>
  );
}

function BinderGrid({ items }: any) {
  const { nav } = useHV();
  if (!items.length) return <div className="panel" style={{ padding: 50, textAlign: "center" }}><p className="muted">Todavía no hay cartas en este binder.</p></div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(116px, 1fr))", gap: 8 }}>
      {items.map((it: any) => <BinderCell key={it.collectionId} item={it} onClick={() => nav("listing", { id: it.collectionId })} />)}
    </div>
  );
}

/* ---------------- marketplace público ---------------- */
const SORTS = [["recent", "Más nuevos"], ["price-asc", "Precio: menor a mayor"], ["price-desc", "Precio: mayor a menor"]];

export function MarketplaceBrowse() {
  const [items, setItems] = useState<any>(null);
  const [game, setGame] = useState("all");
  const [sort, setSort] = useState("recent");

  useEffect(() => { fetchMarketplaceListings().then(({ items }) => setItems(items)); }, []);

  let list = items ? items.slice() : [];
  if (game !== "all") list = list.filter((x: any) => x.game === game);
  if (sort === "price-asc") list.sort((a: any, b: any) => a.usd - b.usd);
  if (sort === "price-desc") list.sort((a: any, b: any) => b.usd - a.usd);

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Comunidad · P2P verificado</div>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>Marketplace de coleccionistas</h1>
        <p className="muted" style={{ fontSize: 14.5, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>Cartas de la comunidad, auditadas y selladas por Holoverse. Compra con la garantía de que nosotros mediamos y despachamos.</p>
      </div>

      {/* toolbar */}
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

      {items === null ? <p className="muted">Cargando marketplace…</p>
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
    </div>
  );
}

/* ---------------- perfil público del coleccionista ---------------- */
export function CollectorProfile({ handle }: any) {
  const { nav } = useHV();
  const [profile, setProfile] = useState<any>(undefined); // undefined=loading, null=no existe
  const [binder, setBinder] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    fetchProfileByHandle(handle).then(async (p) => {
      if (!alive) return;
      setProfile(p || null);
      if (p) setBinder(await fetchOwnerBinder(p.id));
    });
    return () => { alive = false; };
  }, [handle]);

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
              <span>{binder.length} cartas · {forSale.length} a la venta</span>
            </div>
          </div>
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

        {/* binder */}
        <div style={{ marginTop: 30 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Binder</div>
          <BinderGrid items={binder} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- detalle de un listing ---------------- */
export function ListingDetail({ id }: any) {
  const { nav, showToast } = useHV();
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
              <span className="muted" style={{ fontSize: 11, display: "block" }}>Vendido por</span>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14 }}>{item.ownerHandle ? `@${item.ownerHandle}` : (item.ownerName || "Coleccionista")}</span>
            </span>
          </button>

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
                <Btn variant="holo" block size="lg" disabled onClick={() => showToast("La compra en el marketplace llega muy pronto")}>
                  Comprar · disponible pronto<Icon name="arrow" size={16} />
                </Btn>
                <p className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 10 }}>Holoverse media la operación y despacha desde su oficina.</p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 4 }}>Pieza de colección</div>
                <p className="muted" style={{ fontSize: 13 }}>Esta carta está en exhibición, no a la venta.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
