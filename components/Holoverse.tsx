"use client";
import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { HV } from "../lib/data";
import { HoloTilt, LiquidChrome } from "./effects";

/* Holoverse — shared components & context. Exports to window. */


const HVCtx = createContext(null);
const useHV = () => useContext(HVCtx);

/* ---------------- icons (inline, minimal) ---------------- */
function Icon({ name, size = 18, stroke = 1.7, style, solid }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: solid ? "currentColor" : "url(#ic-chrome)", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.2l2 12.5a2 2 0 0 0 2 1.7h8.6a2 2 0 0 0 2-1.6L21 7H5.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
    heart: <path d="M20.8 5.6a5.4 5.4 0 0 0-7.6 0L12 6.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6l1.2 1.2L12 22l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    chevronD: <path d="m6 9 6 6 6-6" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    filter: <path d="M3 5h18M6 12h12M10 19h4" />,
    check: <path d="m20 6-11 11L4 12" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />,
    truck: <><path d="M3 6h12v9H3zM15 9h4l2 3v3h-6" /><circle cx="7" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /></>,
    spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
    box: <><path d="M3 8l9-5 9 5-9 5-9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    zoom: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></>,
    star: <path d="m12 3 2.6 5.6L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7L12 3Z" />
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---------------- buttons ---------------- */
function Btn({ variant = "", size = "", block, children, className = "", ...rest }) {
  const cls = ["btn", variant && `btn-${variant}`, size && `btn-${size}`, block && "btn-block", className].filter(Boolean).join(" ");
  return <button className={cls} {...rest}>{children}</button>;
}

/* ---------------- game tag ---------------- */
function GameTag({ game, withLabel = true }) {
  const g = HV.GAMES[game];
  if (!g) return null;
  return <span className="gtag"><span className={`dot ${g.cls}`} />{withLabel && g.short}</span>;
}

/* ---------------- price (ARS primary / USD secondary) ---------------- */
function Price({ usd, size = 18, align = "left" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : "flex-start", lineHeight: 1.1 }}>
      <span className="price-ars" style={{ fontSize: size }}>{HV.fmtArs(HV.ars(usd))}</span>
      <span className="price-usd">{HV.fmtUsd(usd)}</span>
    </div>);

}

/* ---------------- badges row ---------------- */
function ProductBadges({ item }) {
  const out = [];
  if (item.preorder) out.push(<span key="p" className="badge badge-preorder">Preventa</span>);
  if (item.hot) out.push(<span key="h" className="badge badge-hot">🔥 Hot</span>);
  if (item.new) out.push(<span key="n" className="badge badge-new">Nuevo</span>);
  if (item.low) out.push(<span key="l" className="badge badge-low">Stock bajo</span>);
  return out.length ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{out}</div> : null;
}

/* ---------------- the trading-card placeholder ---------------- */
function TradingCard({ item, foil, compact, flat }) {
  const isFoil = foil ?? item.foil;
  const g = HV.GAMES[item.game];
  const card =
  <div className={`tcard${isFoil ? " foil" : ""}`}>
      {item.img ? (
        <img className="tcard-img" src={item.img} alt={`${item.name} · ${item.set}`} loading="lazy" draggable={false} />
      ) : (<>
        {!compact && <span className="tcard-mono">{item.setCode} · {item.number}</span>}
        <div className="tcard-art" style={compact ? { inset: 6 } : undefined} />
        <div className="tcard-sym">
          <span className={`dot ${g.cls}`} style={{ width: 12, height: 12 }} />
        </div>
        {!compact && <div className="tcard-meta">
          <div className="tcard-name">{item.name}</div>
          <div className="tcard-sub">{item.set}</div>
        </div>}
      </>)}
    </div>;

  if (compact || flat) return card;
  return <HoloTilt rainbow={true} radius={12} max={item.rarity === "mythic" ? 16 : 12}>{card}</HoloTilt>;
}

/* ---------------- sealed / box placeholder ---------------- */
function BoxArt({ item, compact }) {
  const g = HV.GAMES[item.game];
  if (compact) {
    return (
      <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 8, overflow: "hidden",
        background: "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 8px, transparent 8px 16px), radial-gradient(120% 90% at 70% 0%, rgba(139,125,255,.28), transparent 55%), linear-gradient(160deg,#1a1a26,#101019)",
        border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
        <span className={`dot ${g.cls}`} style={{ width: 14, height: 14 }} />
      </div>);

  }
  return (
    <HoloTilt rainbow={true} radius={14}>
    <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden",
        background: "repeating-linear-gradient(135deg, rgba(230,228,245,.045) 0 10px, transparent 10px 20px), radial-gradient(120% 90% at 70% 0%, rgba(166,139,255,.3), transparent 55%), linear-gradient(160deg,#221b34,#14101f)",
        border: "1px solid var(--border)" }}>
      <span className="tcard-mono" style={{ position: "absolute", top: 12, left: 13 }}>{item.setCode} · SELLADO</span>
      <div style={{ position: "absolute", left: "18%", right: "18%", top: "20%", bottom: "20%", borderRadius: 8,
          border: "1px solid var(--border-strong)", background: "linear-gradient(160deg, rgba(230,228,245,.06), transparent)",
          display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <span className={`dot ${g.cls}`} style={{ width: 18, height: 18, margin: "0 auto 10px" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, padding: "0 8px" }}>{item.set}</div>
          <div className="muted" style={{ fontSize: 10, marginTop: 4, fontFamily: "ui-monospace,monospace" }}>box render →</div>
        </div>
      </div>
    </div>
    </HoloTilt>);

}

/* ---------------- accessory placeholder ---------------- */
function AccArt({ item, compact }) {
  if (compact) {
    return (
      <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 8, overflow: "hidden",
        background: "repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 8px, transparent 8px 16px), linear-gradient(160deg,#191923,#101018)",
        border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
        <span style={{ width: 20, height: 20, borderRadius: 6, background: "var(--holo-soft)", border: "1px solid var(--border-strong)" }} />
      </div>);

  }
  return (
    <HoloTilt rainbow={false} radius={14}>
    <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden",
        background: "repeating-linear-gradient(135deg, rgba(230,228,245,.04) 0 11px, transparent 11px 22px), linear-gradient(160deg,#1d1730,#14101f)",
        border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
      <span className="tcard-mono" style={{ position: "absolute", top: 12, left: 13 }}>{item.cat.toUpperCase()}</span>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 10px", background: "var(--holo-soft)", border: "1px solid var(--border-strong)" }} />
        <div className="muted" style={{ fontSize: 10, fontFamily: "ui-monospace,monospace" }}>{item.color}</div>
      </div>
    </div>
    </HoloTilt>);

}

function ItemArt({ item, compact }) {
  if (item.type === "single") return <TradingCard item={item} compact={compact} />;
  if (item.type === "sealed") return <BoxArt item={item} compact={compact} />;
  return <AccArt item={item} compact={compact} />;
}

/* ---------------- product card ---------------- */
function ProductCard({ item, style }) {
  const { nav, addToCart, cardStyle } = useHV();
  const [hover, setHover] = useState(false);
  const goPDP = () => nav(item.type === "single" ? "single" : item.type === "sealed" ? "sealed" : "sealed", { id: item.id });
  const elevated = cardStyle === "elevated";
  return (
    <div
      className="fade-up"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={goPDP}
      style={{
        cursor: "pointer", borderRadius: 18, padding: 12,
        background: elevated ? "linear-gradient(180deg, var(--surface-2), var(--surface))" : hover ? "var(--surface)" : "transparent",
        border: `1px solid ${hover ? "var(--border-strong)" : elevated ? "var(--border)" : "transparent"}`,
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover ? `var(--shadow), 0 0 0 1px ${item.rarity === "mythic" ? "rgba(166,139,255,.55)" : item.rarity === "rare" ? "rgba(201,169,255,.4)" : "rgba(214,210,235,.18)"}, 0 12px 44px ${item.rarity === "mythic" ? "rgba(124,92,255,.4)" : "rgba(124,92,255,.18)"}` : "none",
        transition: "transform .2s ease, box-shadow .2s ease, border-color .2s, background .2s",
        ...style
      }}>
      
      <div style={{ position: "relative" }}>
        <ItemArt item={item} />
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}><ProductBadges item={item} /></div>
        <button
          className="btn btn-icon" aria-label="Wishlist"
          onClick={(e) => {e.stopPropagation();}}
          style={{ position: "absolute", bottom: 8, right: 8, opacity: hover ? 1 : 0, transition: "opacity .2s", background: "rgba(10,10,18,.7)", backdropFilter: "blur(6px)" }}>
          <Icon name="heart" size={15} /></button>
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          {item.game ? <GameTag game={item.game} /> : <span className="gtag muted">{item.cat}</span>}
          {item.rarity && <span className={`rar rar-${item.rarity}`}>{{ common: "Común", uncommon: "Infrecuente", rare: "Rara", mythic: "Chase" }[item.rarity]}</span>}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, lineHeight: 1.18, minHeight: 34, textWrap: "pretty" }}>{item.name}</div>
        {item.set && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{item.set} · {item.number}</div>}
        {item.kind && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{item.kind}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
          <Price usd={item.usd} size={17} />
          <button
            className={`btn ${hover ? "btn-holo" : ""} btn-sm`}
            onClick={(e) => {e.stopPropagation();addToCart(item);}}
            style={{ transition: "all .2s" }}>
            <Icon name="plus" size={14} />Agregar</button>
        </div>
      </div>
    </div>);

}

/* ---------------- qty stepper ---------------- */
function QtyStepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 999, background: "var(--surface-2)" }}>
      <button className="btn btn-icon" style={{ border: 0, background: "transparent" }} onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" size={15} /></button>
      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</span>
      <button className="btn btn-icon" style={{ border: 0, background: "transparent" }} onClick={() => onChange(Math.min(max, value + 1))}><Icon name="plus" size={15} /></button>
    </div>);

}

/* ---------------- HEADER ---------------- */
const NAV_GAMES = [
{ id: "mtg", label: "Magic" },
{ id: "poke", label: "Pokémon" },
{ id: "op", label: "One Piece" }];


function Header() {
  const { nav, route, cartCount, openSearch, menuOpen, toggleMenu } = useHV();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40,
      background: scrolled ? "rgba(8,8,13,.82)" : "rgba(8,8,13,.4)",
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`, transition: "all .3s" }}>
      {/* announcement bar */}
      <div style={{ background: "var(--holo)", backgroundSize: "200% 100%", animation: "holoShift 8s linear infinite" }}>
        <div className="wrap hv-announce" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "7px 0", color: "#1a1030", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: ".02em" }}>
          <Icon name="truck" size={15} solid /> Envío asegurado gratis +$80.000 · Retiro en Palermo · Preventas abiertas
        </div>
      </div>
      <div className="wrap" style={{ display: "flex", alignItems: "center", gap: 18, height: 70 }}>
        <Logo onClick={() => nav("home")} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <button onClick={openSearch} className="hv-search-trigger"
          style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", padding: "10px 18px", borderRadius: 12, fontSize: 13.5, width: "min(460px, 100%)", cursor: "pointer" }}>
            <Icon name="search" size={16} /> Buscá cartas, sets, productos…
          </button>
        </div>
        <button className="btn btn-icon" onClick={openSearch} aria-label="Search" style={{ display: "none" }} data-mobile-search><Icon name="search" size={18} /></button>
        <button className="btn btn-icon" onClick={() => nav("account")} aria-label="Account"><Icon name="user" size={18} /></button>
        <button className="btn btn-icon" onClick={() => nav("cart")} aria-label="Cart" style={{ position: "relative" }}>
          <Icon name="cart" size={18} />
          {cartCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--holo)", color: "#0a0a12", fontSize: 11, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 99, display: "grid", placeItems: "center", padding: "0 4px", fontFamily: "var(--font-display)" }}>{cartCount}</span>}
        </button>
        <button className="hv-menu-toggle" onClick={toggleMenu} aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="hv-menu">
          <span className={`hv-burger${menuOpen ? " open" : ""}`}><i /><i /></span>
          <span className="hv-menu-label">{menuOpen ? "Cerrar" : "Menú"}</span>
        </button>
      </div>
    </header>);

}

function Logo({ onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, background: "transparent", border: 0, padding: 0 }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--purple-chrome)", backgroundSize: "220% 100%", animation: "holoShift 7s linear infinite", display: "grid", placeItems: "center", boxShadow: "0 4px 18px rgba(124,92,255,.45), inset 0 1px 0 rgba(255,255,255,.5)" }}>
        <span style={{ width: 13, height: 13, borderRadius: "50% 50% 50% 0", background: "#140f23", transform: "rotate(45deg)" }} />
      </span>
      <span className="chrome-name" style={{ fontFamily: "var(--font-title)", fontWeight: 800, fontSize: 18, letterSpacing: ".26em", textTransform: "uppercase", paddingLeft: 2 }}>Holoverse</span>
    </button>);

}

/* ---------------- FOOTER ---------------- */
function Footer() {
  const { nav } = useHV();
  const cols = [
  { h: "Tienda", items: ["Magic: The Gathering", "Pokémon", "One Piece", "Producto sellado", "Accesorios", "Preventas"] },
  { h: "Coleccionistas", items: ["Vendénos", "Envíos de grading", "Compra de singles", "Alertas de wantlist", "Guía de condición"] },
  { h: "Soporte", items: ["Envíos y retiro", "Devoluciones", "Seguir pedido", "Contacto", "Preguntas"] }];

  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 80, background: "linear-gradient(180deg, transparent, rgba(139,125,255,.04))" }}>
      <div className="wrap" style={{ padding: "56px 28px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 40 }} className="hv-footer-grid">
          <div>
            <Logo onClick={() => nav("home")} />
            <p className="muted" style={{ fontSize: 13.5, marginTop: 16, maxWidth: 260, lineHeight: 1.6 }}>
              El hogar holográfico para coleccionistas y jugadores de TCG. Singles frescos, producto sellado y accesorios de Magic, Pokémon y One Piece.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
              <span className="gtag"><span className="dot dot-mtg" /></span>
              <span className="gtag"><span className="dot dot-poke" /></span>
              <span className="gtag"><span className="dot dot-op" /></span>
            </div>
          </div>
          {cols.map((c) =>
          <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>{c.h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {c.items.map((i) => <a key={i} className="muted" style={{ fontSize: 13.5 }} onClick={() => nav("browse")} role="button">{i}</a>)}
              </div>
            </div>
          )}
        </div>
        <hr className="divider" style={{ margin: "40px 0 22px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="muted" style={{ fontSize: 12.5 }}>© 2026 Holoverse TCG · Buenos Aires, Argentina · Precios en ARS y USD</span>
          <span className="muted" style={{ fontSize: 12.5, display: "flex", gap: 18 }}><span>Privacidad</span><span>Términos</span><span>Garantía de autenticidad</span></span>
        </div>
      </div>
    </footer>);

}

/* ---------------- toast ---------------- */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60,
      background: "var(--surface-3)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "12px 20px",
      boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }} className="fade-up">
      <span style={{ width: 22, height: 22, borderRadius: 99, background: "var(--holo)", display: "grid", placeItems: "center", color: "#0a0a12" }}><Icon name="check" size={14} stroke={2.5} solid /></span>
      {msg}
    </div>);

}



/* ------------------------------------------------------------------ */

/* Holoverse — Staggered full-screen menu (CSS-driven). window.StaggeredMenu */
function StaggeredMenu({ open, onClose }) {
  const { nav } = useHV();
  const items = [
    { label: "Magic", route: "browse", params: { game: "mtg" } },
    { label: "Pokémon", route: "browse", params: { game: "poke" } },
    { label: "One Piece", route: "browse", params: { game: "op" } },
    { label: "Sellado", route: "browse", params: { type: "sealed" } },
    { label: "Accesorios", route: "browse", params: { type: "acc" } },
    { label: "Vender", route: "account", params: {} },
    { label: "Cuenta", route: "account", params: {} },
  ];
  const socials = ["Instagram", "Discord", "TikTok", "YouTube"];
  const go = (it) => { onClose(); nav(it.route, it.params); };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`sm-root${open ? " sm-open" : ""}`} aria-hidden={!open}>
      <div className="sm-scrim" onClick={onClose} />
      <div className="sm-prelayer sm-p1" />
      <div className="sm-prelayer sm-p2" />
      <aside className="sm-panel" id="hv-menu" aria-label="Menú principal">
        <div className="sm-eyebrow">Explorar el Holoverse</div>
        <ul className="sm-list">
          {items.map((it, i) => (
            <li className="sm-li" key={it.label}>
              <button className="sm-item" style={{ transitionDelay: open ? `${0.26 + i * 0.06}s` : "0s" }} onClick={() => go(it)}>
                <span className="sm-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="sm-label">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sm-socials">
          <div className="sm-socials-title">Seguinos</div>
          <div className="sm-socials-row">
            {socials.map((s) => <a key={s} className="sm-soc" href="#" onClick={(e) => e.preventDefault()}>{s}</a>)}
          </div>
        </div>
      </aside>
    </div>
  );
}



/* ------------------------------------------------------------------ */

/* Holoverse — "Prisma", el familiar holográfico de la bóveda (mascota original). window.Prisma */
function Prisma() {
  const { openSearch } = useHV();
  const tips = [
    "¡Bienvenido a la bóveda! ✦",
    "¿Buscás algo puntual? Tocame y te ayudo.",
    "Llegaron nuevos chase esta semana ✦",
    "Los cofres sellados tienen preventa abierta.",
    "Guardo tus cartas en mi bolsito ✦",
  ];
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setI((x) => (x + 1) % tips.length), 5200);
    return () => clearInterval(t);
  }, [open]);
  return (
    <div className="prisma-wrap">
      {open && (
        <div className="prisma-bubble fade-up">
          <button className="prisma-x" onClick={() => setOpen(false)} aria-label="Cerrar"><Icon name="close" size={12} /></button>
          <div className="prisma-name">Prisma</div>
          <div className="prisma-msg">{tips[i]}</div>
          <button className="prisma-cta" onClick={openSearch}><Icon name="search" size={13} solid /> Buscar cartas</button>
        </div>
      )}
      <div className="prisma-sprite" role="button" tabIndex={0} aria-label="Prisma, tu hada de luz" onClick={() => setOpen((o) => !o)}>
        <span className="pf-wing pf-w1" />
        <span className="pf-wing pf-w2" />
        <span className="pf-wing pf-w3" />
        <span className="pf-wing pf-w4" />
        <span className="pf-halo" />
        <span className="pf-core" />
        <span className="pf-spark pf-s1" />
        <span className="pf-spark pf-s2" />
        <span className="pf-spark pf-s3" />
        <span className="pf-trail pf-t1" />
        <span className="pf-trail pf-t2" />
        <span className="pf-trail pf-t3" />
        <span className="pf-trail pf-t4" />
      </div>
    </div>
  );
}



/* ------------------------------------------------------------------ */

/* Holoverse — Homepage (RPG-flavored landing) */
function ChapterHead({ ch, eyebrow, title, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
        <span className="chapter-num">{ch}</span>
        <div>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
          <h2 style={{ fontSize: "clamp(26px, 3.2vw, 38px)" }}>{title}</h2>
        </div>
      </div>
      {action && <button onClick={onAction} className="btn btn-ghost btn-sm">{action}<Icon name="arrow" size={15} /></button>}
    </div>
  );
}

function HudChip({ icon, children }) {
  return (
    <div className="hud-chip">
      <span style={{ display: "grid", placeItems: "center" }}><Icon name={icon} size={15} /></span>
      <span>{children}</span>
    </div>
  );
}

/* ---- the fanned "hand" of featured cards (your loot) — auto-cycling ---- */
function HeroCardFan({ cards }) {
  const { nav } = useHV();
  const [focus, setFocus] = useState(Math.floor(cards.length / 2));
  const [paused, setPaused] = useState(false);
  const n = cards.length;
  const feat = cards[focus];
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setFocus((f) => (f + 1) % n), 2300);
    return () => clearInterval(t);
  }, [paused, n]);
  return (
    <div
      className="hv-fan"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: "relative", minHeight: 540, display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", width: 430, height: 430, borderRadius: "50%", background: "var(--purple-grad)", filter: "blur(100px)", opacity: .38 }} />
      <div style={{ position: "relative", width: 440, height: 480 }}>
        {cards.map((c, i) => {
          const mid = (n - 1) / 2;
          const off = i - mid;
          const isF = i === focus;
          const rot = off * 12;
          const tx = off * 68;
          const ty = Math.abs(off) * 30 - (isF ? 44 : 0);
          return (
            <div key={c.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => nav("single", { id: c.id })}
              style={{
                position: "absolute", left: "50%", top: "50%", width: 222, marginLeft: -111, marginTop: -155,
                transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${isF ? 1.16 : 1})`,
                transformOrigin: "50% 120%", transition: "transform .5s cubic-bezier(.2,.8,.2,1), filter .35s",
                zIndex: isF ? 30 : 10 - Math.abs(off), cursor: "pointer",
                filter: isF ? "drop-shadow(0 30px 56px rgba(0,0,0,.65))" : "brightness(.78) drop-shadow(0 16px 30px rgba(0,0,0,.5))",
              }}>
              <div className={`loot loot-${c.rarity}`}><TradingCard item={c} foil flat /></div>
            </div>
          );
        })}
      </div>
      <div className="panel gloss" style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 372, padding: "14px 20px", backdropFilter: "blur(10px)", background: "rgba(26,21,41,.86)", borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GameTag game={feat.game} />
            <span className={`rar rar-${feat.rarity}`} style={{ fontSize: 10 }}>{feat.rarity === "mythic" ? "Chase" : ""}</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, marginTop: 4 }}>{feat.name.split("(")[0].trim()}</div>
        </div>
        <Price usd={feat.usd} size={16} align="right" />
      </div>
      {/* progress dots */}
      <div style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 7, zIndex: 40 }}>
        {cards.map((_, i) => (
          <button key={i} onClick={() => setFocus(i)} aria-label={`Carta ${i + 1}`}
            style={{ width: i === focus ? 24 : 8, height: 8, borderRadius: 99, border: 0, cursor: "pointer", transition: "all .3s", background: i === focus ? "var(--holo)" : "var(--surface-3)" }} />
        ))}
      </div>
    </div>
  );
}

function HeroGridStage({ chase }) {
  const { nav } = useHV();
  return (
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "center" }}>
      <div style={{ position: "absolute", inset: "10% -6%", background: "var(--purple-grad)", filter: "blur(90px)", opacity: .3, borderRadius: "50%" }} />
      {chase.map((c, i) => (
        <div key={c.id} onClick={() => nav("single", { id: c.id })}
          style={{ position: "relative", cursor: "pointer", transform: i === 1 ? "translateY(-18px) scale(1.06)" : "translateY(14px)", transition: "transform .35s", zIndex: i === 1 ? 2 : 1 }}>
          <div className={`loot loot-${c.rarity}`}><TradingCard item={c} foil flat /></div>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const { nav, heroLayout } = useHV();
  const fan = [HV.byId("s16"), HV.byId("s14"), HV.byId("s13"), HV.byId("s15"), HV.byId("s17")];
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: "min(860px, 92vh)", display: "flex", alignItems: "center" }}>
      {/* liquid chrome backdrop */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <LiquidChrome baseColor={[0.11, 0.09, 0.17]} speed={0.42} amplitude={0.45} frequencyX={3} frequencyY={2} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,5,15,.94) 0%, rgba(8,5,15,.74) 42%, rgba(8,5,15,.30) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,5,15,.55), transparent 26%, rgba(8,5,15,.92))" }} />
      </div>

      <div className="wrap" style={{ position: "relative", zIndex: 1, width: "100%", paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 50, alignItems: "center" }} className="hv-hero-grid">
          <div className="fade-up">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <span className="badge badge-holo">Temporada 1</span>
              <span className="badge"><span className="dot" style={{ background: "var(--good)", boxShadow: "0 0 8px var(--good)" }} />Bóveda abierta</span>
            </div>
            <h1 style={{ fontSize: "clamp(42px, 6vw, 76px)", lineHeight: .96, marginBottom: 20 }}>
              Las joyas viven<br />en el <span className="platinum-text" style={{ fontWeight: 800 }}>HOLOVERSE</span>.
            </h1>
            <p style={{ fontSize: 17, color: "var(--text-2)", maxWidth: 480, lineHeight: 1.6, marginBottom: 30 }}>
              Entrá a la bóveda y armá tu colección. Singles chase calificados a mano, cofres sellados y equipamiento de Magic, Pokémon y One Piece. Drops nuevos cada semana.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Btn variant="holo" size="lg" onClick={() => nav("browse", { type: "single" })}>Empezar la cacería<Icon name="arrow" size={17} /></Btn>
              <Btn variant="ghost" size="lg" onClick={() => nav("browse", { type: "sealed" })}>Abrir cofres sellados</Btn>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <HudChip icon="bolt">Despacho el mismo día</HudChip>
              <HudChip icon="shield">Autenticidad garantizada</HudChip>
              <HudChip icon="spark">Drops cada semana</HudChip>
            </div>
          </div>
          <div>{heroLayout === "grid" ? <HeroGridStage chase={fan.slice(0, 3)} /> : <HeroCardFan cards={fan} />}</div>
        </div>
      </div>
    </section>
  );
}

/* ---- realms (choose your world) ---- */
function RealmTiles() {
  const { nav } = useHV();
  const realms = [
    { id: "mtg", label: "Magic", realm: "El reino arcano", sub: "Modern · Commander · Standard", color: "var(--g-mtg)" },
    { id: "poke", label: "Pokémon", realm: "Tierras salvajes", sub: "Scarlet & Violet · Vintage", color: "var(--g-poke)" },
    { id: "op", label: "One Piece", realm: "Mar abierto", sub: "OP-01 a OP-09 · Líderes", color: "var(--g-op)" },
  ];
  return (
    <section className="wrap" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="eyebrow" style={{ marginBottom: 18 }}>Elegí tu mundo</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="hv-tiles">
        {realms.map((t) => (
          <button key={t.id} onClick={() => nav("browse", { game: t.id })} className="realm-tile" style={{ "--realm": t.color }}>
            <div className="realm-glow" style={{ background: t.color }} />
            <span className="realm-crest" style={{ "--realm": t.color }}><span /></span>
            <div className="realm-realm">{t.realm}</div>
            <h3 style={{ fontSize: 24, marginTop: 2 }}>{t.label}</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 5 }}>{t.sub}</p>
            <div className="realm-enter">Entrar <Icon name="arrow" size={15} /></div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Rail({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }} className="hv-rail">
      {items.map((it) => <ProductCard key={it.id} item={it} />)}
    </div>
  );
}

function SellCTA() {
  const { nav } = useHV();
  return (
    <section className="wrap" style={{ marginTop: 72 }}>
      <div className="panel gloss hv-sellcta" style={{ position: "relative", overflow: "hidden", padding: "48px 44px", display: "grid", gridTemplateColumns: "1fr auto", gap: 30, alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "var(--holo-soft)", opacity: .6 }} />
        <div style={{ position: "relative" }}>
          <div className="quest-tag" style={{ marginBottom: 14 }}><Icon name="spark" size={13} solid /> Misión secundaria</div>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", maxWidth: 560, marginBottom: 12 }}>Vendé tu colección a Holoverse y recibí crédito en tienda +10%.</h2>
          <p className="muted" style={{ fontSize: 15, maxWidth: 520, lineHeight: 1.6 }}>Singles, sellado y slabs de los tres juegos. Cotización al instante, etiqueta de envío asegurada gratis, pago en 48 horas.</p>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn variant="primary" size="lg" onClick={() => nav("account")}>Aceptar misión<Icon name="arrow" size={17} /></Btn>
          <Btn variant="ghost" onClick={() => nav("browse")}>Ver recompensas</Btn>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { nav } = useHV();
  const fresh = HV.SINGLES.slice(0, 5);
  const sealed = HV.SEALED.slice(0, 5);
  return (
    <div>
      <Hero />
      <div style={{ marginTop: 48 }}><RealmTiles /></div>

      <section className="wrap" style={{ marginTop: 64 }}>
        <ChapterHead ch="01" eyebrow="Botín recién llegado" title="Singles frescos" action="Ver singles" onAction={() => nav("browse", { type: "single" })} />
        <Rail items={fresh} />
      </section>

      <div className="band band-edge band-violet band-glowtop" style={{ marginTop: 72, padding: "60px 0" }}>
        <section className="wrap">
          <ChapterHead ch="02" eyebrow="Cofres por abrir" title="Producto sellado" action="Ver sellado" onAction={() => nav("browse", { type: "sealed" })} />
          <Rail items={sealed} />
        </section>
      </div>

      <section className="wrap" style={{ marginTop: 72 }}>
        <ChapterHead ch="03" eyebrow="Equipamiento" title="Accesorios y gear" action="Ver accesorios" onAction={() => nav("browse", { type: "acc" })} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }} className="hv-acc-grid">
          {HV.ACCESSORIES.slice(0, 4).map((it) => <ProductCard key={it.id} item={it} />)}
        </div>
      </section>

      <SellCTA />
    </div>
  );
}


function SectionHead(props) { return <ChapterHead ch="✦" {...props} />; }


/* ------------------------------------------------------------------ */

/* Holoverse — Browse / Category + Search results */
function FilterGroup({ title, children, open: open0 = true }) {
  const [open, setOpen] = useState(open0);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 0" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "transparent", border: 0, color: "var(--text)", padding: 0, cursor: "pointer" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--text-3)" }}><Icon name="chevronD" size={16} /></span>
      </button>
      {open && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>}
    </div>
  );
}

function Check({ label, count, checked, onChange, swatch }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13.5, color: checked ? "var(--text)" : "var(--text-2)" }}>
      <span onClick={onChange} style={{ width: 18, height: 18, borderRadius: 6, border: `1px solid ${checked ? "transparent" : "var(--border-strong)"}`, background: checked ? "var(--holo)" : "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0, color: "#0a0a12" }}>
        {checked && <Icon name="check" size={12} stroke={3} solid />}
      </span>
      {swatch && <span className="dot" style={{ width: 9, height: 9, background: swatch, boxShadow: `0 0 8px ${swatch}` }} />}
      <span onClick={onChange} style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="muted" style={{ fontSize: 12 }}>{count}</span>}
    </label>
  );
}

const SORTS = [
  { id: "featured", label: "Destacados" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
  { id: "name", label: "Nombre A–Z" },
];

function BrowseShell({ title, eyebrow, initial = {}, query }) {
  const { density } = useHV();
  const [games, setGames] = useState(initial.game ? [initial.game] : []);
  const [types, setTypes] = useState(initial.type ? [initial.type] : []);
  const [rarities, setRarities] = useState([]);
  const [conds, setConds] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [onlyStock, setOnlyStock] = useState(false);
  const [onlyPre, setOnlyPre] = useState(false);
  const [sort, setSort] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  const toggle = (setter, arr) => (v) => setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  let items = HV.all.slice();
  if (query) items = items.filter((x) => (x.name + " " + (x.set || "") + " " + (x.cat || "")).toLowerCase().includes(query.toLowerCase()));
  if (games.length) items = items.filter((x) => games.includes(x.game));
  if (types.length) items = items.filter((x) => types.includes(x.type));
  if (rarities.length) items = items.filter((x) => x.rarity && rarities.includes(x.rarity));
  if (onlyStock) items = items.filter((x) => !x.preorder);
  if (onlyPre) items = items.filter((x) => x.preorder);
  items = items.filter((x) => x.usd <= maxPrice);
  if (sort === "price-asc") items.sort((a, b) => a.usd - b.usd);
  if (sort === "price-desc") items.sort((a, b) => b.usd - a.usd);
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));

  const cols = density === "comfy" ? 3 : density === "dense" ? 5 : 4;
  const activeChips = [
    ...games.map((g) => ({ k: "g" + g, label: HV.GAMES[g].short, clear: () => setGames(games.filter((x) => x !== g)) })),
    ...types.map((t) => ({ k: "t" + t, label: t === "single" ? "Singles" : t === "sealed" ? "Sellado" : "Accesorios", clear: () => setTypes(types.filter((x) => x !== t)) })),
    ...rarities.map((r) => ({ k: "r" + r, label: HV.rarityLabel(r), clear: () => setRarities(rarities.filter((x) => x !== r)) })),
  ];
  const clearAll = () => { setGames([]); setTypes([]); setRarities([]); setConds([]); setMaxPrice(2000); setOnlyStock(false); setOnlyPre(false); };

  const Sidebar = ({ mobile }) => (
    <aside style={{ width: mobile ? "100%" : 244, flexShrink: 0 }} className={mobile ? undefined : "hv-filters"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}><Icon name="filter" size={16} />Filtros</span>
        {(activeChips.length > 0 || onlyPre || onlyStock) && <button onClick={clearAll} className="muted" style={{ background: "transparent", border: 0, fontSize: 12.5, cursor: "pointer", color: "var(--violet)" }}>Limpiar</button>}
      </div>
      <FilterGroup title="Juego">
        {Object.values(HV.GAMES).map((g) => <Check key={g.id} label={g.label} swatch={g.color} count={HV.all.filter((x) => x.game === g.id).length} checked={games.includes(g.id)} onChange={() => toggle(setGames, games)(g.id)} />)}
      </FilterGroup>
      <FilterGroup title="Tipo de producto">
        {[["single", "Cartas sueltas"], ["sealed", "Producto sellado"], ["acc", "Accesorios"]].map(([id, l]) => <Check key={id} label={l} count={HV.all.filter((x) => x.type === id).length} checked={types.includes(id)} onChange={() => toggle(setTypes, types)(id)} />)}
      </FilterGroup>
      <FilterGroup title="Rareza">
        {[["common", "Común"], ["uncommon", "Infrecuente"], ["rare", "Rara"], ["mythic", "Mítica / Chase"]].map(([id, l]) => <Check key={id} label={l} checked={rarities.includes(id)} onChange={() => toggle(setRarities, rarities)(id)} />)}
      </FilterGroup>
      <FilterGroup title="Precio (USD)" open={true}>
        <input type="range" min="10" max="2000" step="10" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} style={{ width: "100%", accentColor: "var(--violet)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-2)" }}><span>US$10</span><span style={{ fontWeight: 700, color: "var(--text)" }}>hasta US${maxPrice}</span></div>
      </FilterGroup>
      <FilterGroup title="Disponibilidad">
        <Check label="En stock" checked={onlyStock} onChange={() => setOnlyStock(!onlyStock)} />
        <Check label="Preventas" checked={onlyPre} onChange={() => setOnlyPre(!onlyPre)} />
      </FilterGroup>
    </aside>
  );

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 20 }}>
      <div style={{ marginBottom: 26 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-sm hv-mobile-filter-btn" style={{ display: "none" }} onClick={() => setMobileFilters(true)}><Icon name="filter" size={15} />Filtros</button>
              <span className="muted" style={{ fontSize: 13.5 }}><b style={{ color: "var(--text)" }}>{items.length}</b> productos</span>
              {activeChips.map((c) => (
                <button key={c.k} onClick={c.clear} className="badge" style={{ cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 12.5, fontFamily: "var(--font-body)", color: "var(--text)" }}>{c.label}<Icon name="close" size={12} /></button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm" onClick={() => setSortOpen(!sortOpen)}>Orden: {SORTS.find((s) => s.id === sort).label}<Icon name="chevronD" size={14} /></button>
              {sortOpen && (
                <div className="panel" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 20, minWidth: 200, padding: 6, boxShadow: "var(--shadow)" }}>
                  {SORTS.map((s) => (
                    <button key={s.id} onClick={() => { setSort(s.id); setSortOpen(false); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", textAlign: "left", background: sort === s.id ? "var(--surface-3)" : "transparent", border: 0, color: "var(--text)", padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13.5 }}>
                      {s.label}{sort === s.id && <Icon name="check" size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* grid */}
          {items.length ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }} className="hv-browse-grid">
              {items.map((it) => <ProductCard key={it.id} item={it} />)}
            </div>
          ) : (
            <div className="panel" style={{ padding: 60, textAlign: "center" }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Sin resultados</h3>
              <p className="muted" style={{ fontSize: 14 }}>Probá quitar un filtro o ampliar el rango de precio.</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={clearAll}>Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      {mobileFilters && (
        <div onClick={() => setMobileFilters(false)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(5,5,9,.6)", backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "min(320px, 86vw)", background: "var(--surface)", borderRight: "1px solid var(--border)", padding: "20px 20px 40px", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 18 }}>Filtros</h3>
              <button className="btn btn-icon btn-sm" onClick={() => setMobileFilters(false)}><Icon name="close" size={16} /></button>
            </div>
            <Sidebar mobile />
            <button className="btn btn-holo btn-block" style={{ marginTop: 18 }} onClick={() => setMobileFilters(false)}>Ver {items.length} productos</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Browse(params) {
  const titleMap = { mtg: "Magic: The Gathering", poke: "Pokémon", op: "One Piece" };
  let title = "Ver todo", eyebrow = "Catálogo";
  if (params.game) { title = titleMap[params.game]; eyebrow = "Juego de cartas"; }
  else if (params.type === "sealed") { title = "Producto sellado y preventas"; eyebrow = "Cajas · ETBs · Bundles"; }
  else if (params.type === "acc") { title = "Accesorios y gear"; eyebrow = "Protegé tu colección"; }
  else if (params.type === "single") { title = "Cartas sueltas"; eyebrow = "Chase · staples · comunes"; }
  return <BrowseShell title={title} eyebrow={eyebrow} initial={params} />;
}

function SearchResults(params) {
  return <BrowseShell title={params.q ? `Resultados para “${params.q}”` : "Búsqueda"} eyebrow="Búsqueda" query={params.q} />;
}




/* ------------------------------------------------------------------ */

/* Holoverse — Single card & Sealed product detail pages */
function Breadcrumb({ trail }) {
  const { nav } = useHV();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-3)", marginBottom: 24, flexWrap: "wrap" }}>
      {trail.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevron" size={13} />}
          {t.to ? <button onClick={() => nav(t.to[0], t.to[1])} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", fontSize: 13, padding: 0 }}>{t.label}</button> : <span style={{ color: "var(--text-2)" }}>{t.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function MetaRow({ k, v, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="muted" style={{ fontSize: 13.5 }}>{k}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-display)", color: accent || "var(--text)" }}>{v}</span>
    </div>
  );
}

function RelatedRail({ items, title }) {
  const { nav } = useHV();
  if (!items.length) return null;
  return (
    <section className="wrap" style={{ marginTop: 64 }}>
      <SectionHead eyebrow="También te puede interesar" title={title} action="Ver todo" onAction={() => nav("browse")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }} className="hv-rail">
        {items.slice(0, 5).map((it) => <ProductCard key={it.id} item={it} />)}
      </div>
    </section>
  );
}

function SinglePDP({ id }) {
  const { addToCart, nav } = useHV();
  const item = HV.byId(id) || HV.SINGLES[0];
  const [cond, setCond] = useState(item.conditions[0][0]);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const condRow = item.conditions.find((c) => c[0] === cond);
  const usd = condRow[1];
  const stock = condRow[2];
  const related = HV.SINGLES.filter((s) => s.game === item.game && s.id !== item.id);
  const condNames = { NM: "Casi nueva", LP: "Poco jugada", MP: "Moderadamente jugada", HP: "Muy jugada" };

  return (
    <div>
      <div className="wrap" style={{ paddingTop: 28 }}>
        <Breadcrumb trail={[{ label: "Inicio", to: ["home", {}] }, { label: HV.gameLabel(item.game), to: ["browse", { game: item.game }] }, { label: item.set, to: ["browse", { game: item.game }] }, { label: item.name }]} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 440px) 1fr", gap: 56, alignItems: "start" }} className="hv-pdp-grid">
          {/* card display */}
          <div style={{ position: "sticky", top: 96 }} className="hv-pdp-media">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -24, background: "var(--holo)", filter: "blur(70px)", opacity: item.rarity === "mythic" ? .28 : .12, borderRadius: "50%" }} />
              <div onClick={() => setZoom(true)} style={{ position: "relative", maxWidth: 360, margin: "0 auto", cursor: "zoom-in", boxShadow: "var(--shadow-lg)", borderRadius: 14 }}>
                <TradingCard item={item} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => setZoom(true)}><Icon name="zoom" size={15} />Zoom</button>
              <button className="btn btn-sm btn-ghost"><Icon name="eye" size={15} />Ver dorso</button>
            </div>
          </div>
          {/* info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <GameTag game={item.game} />
              <span className={`rar rar-${item.rarity}`}>{HV.rarityLabel(item.rarity)}</span>
              {item.foil && <span className="badge badge-holo">Foil</span>}
              {item.hot && <span className="badge badge-hot">🔥 Hot</span>}
            </div>
            <h1 style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginBottom: 8 }}>{item.name}</h1>
            <p className="muted" style={{ fontSize: 15, marginBottom: 26 }}>{item.set} · #{item.number}</p>

            <div className="panel panel-pad" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>{condNames[cond]} · {stock} en stock</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="price-ars" style={{ fontSize: 34 }}>{HV.fmtArs(HV.ars(usd))}</span>
                    <span className="price-usd" style={{ fontSize: 16 }}>{HV.fmtUsd(usd)}</span>
                  </div>
                </div>
                {stock <= 3 && <span className="badge badge-low">Solo quedan {stock}</span>}
              </div>

              {/* condition selector */}
              <div className="eyebrow" style={{ marginBottom: 10, fontSize: 11 }}>Condición</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {item.conditions.map(([c, p, s]) => (
                  <button key={c} onClick={() => setCond(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: `1px solid ${cond === c ? "var(--border-glow)" : "var(--border)"}`, background: cond === c ? "var(--accent-soft)" : "var(--surface-2)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: `5px solid ${cond === c ? "var(--violet)" : "var(--surface-hi)"}`, background: "var(--bg)", transition: "border-color .2s", flexShrink: 0 }} />
                      <span><b style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{c}</b> <span className="muted" style={{ fontSize: 13 }}>· {condNames[c]}</span></span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="muted" style={{ fontSize: 12 }}>{s} disp.</span>
                      <span className="price-ars" style={{ fontSize: 15 }}>{HV.fmtArs(HV.ars(p))}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <QtyStepper value={qty} onChange={setQty} max={stock} />
                <Btn variant="holo" size="lg" block onClick={() => addToCart(item, qty, cond)}><Icon name="cart" size={17} />Agregar al carrito</Btn>
              </div>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }}><Icon name="heart" size={16} />Guardar en deseos</button>
            </div>

            {/* metadata */}
            <div className="panel panel-pad" style={{ marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Detalles de la carta</div>
              <MetaRow k="Set" v={item.set} />
              <MetaRow k="Código" v={item.setCode} />
              <MetaRow k="N° de carta" v={"#" + item.number} />
              <MetaRow k="Rareza" v={HV.rarityLabel(item.rarity)} accent={item.rarity === "rare" ? "var(--gold)" : item.rarity === "uncommon" ? "var(--cyan)" : undefined} />
              <MetaRow k="Acabado" v={item.foil ? "Holofoil" : "Normal"} />
              <MetaRow k="Autenticidad" v="✓ Verificado por Holoverse" accent="var(--good)" />
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {[["truck", "Envíos desde Buenos Aires"], ["shield", "Calificada y revisada"], ["bolt", "Despacho el mismo día antes de las 15h"]].map(([ic, t]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <span style={{ color: "var(--violet)" }}><Icon name={ic} size={16} /></span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <RelatedRail items={related} title={`Más de ${HV.gameLabel(item.game)}`} />

      {zoom && (
        <div onClick={() => setZoom(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(5,5,9,.85)", backdropFilter: "blur(10px)", display: "grid", placeItems: "center", padding: 40 }}>
          <button className="btn btn-icon" style={{ position: "absolute", top: 24, right: 24 }}><Icon name="close" size={20} /></button>
          <div className="fade-up" style={{ width: "min(420px, 80vw)" }} onClick={(e) => e.stopPropagation()}>
            <TradingCard item={item} />
          </div>
        </div>
      )}
    </div>
  );
}

function SealedPDP({ id }) {
  const { addToCart } = useHV();
  const item = HV.byId(id) || HV.SEALED[0];
  const [qty, setQty] = useState(1);
  const isAcc = item.type === "acc";
  const related = (isAcc ? HV.ACCESSORIES : HV.SEALED).filter((x) => x.id !== item.id);

  return (
    <div>
      <div className="wrap" style={{ paddingTop: 28 }}>
        <Breadcrumb trail={[{ label: "Inicio", to: ["home", {}] }, { label: isAcc ? "Accesorios" : "Sellado", to: ["browse", { type: item.type }] }, { label: item.name }]} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 460px) 1fr", gap: 56, alignItems: "start" }} className="hv-pdp-grid">
          <div style={{ position: "sticky", top: 96 }} className="hv-pdp-media">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -10, background: "var(--holo)", filter: "blur(70px)", opacity: .14, borderRadius: "50%" }} />
              <div style={{ position: "relative", boxShadow: "var(--shadow-lg)", borderRadius: 16 }}>
                {isAcc ? <AccArt item={item} /> : <BoxArt item={item} />}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ aspectRatio: "1/1", borderRadius: 10, border: `1px solid ${i === 0 ? "var(--border-glow)" : "var(--border)"}`, background: "var(--surface-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <span className="muted" style={{ fontSize: 9, fontFamily: "ui-monospace,monospace" }}>vista {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {item.game && <GameTag game={item.game} />}
              {item.cat && <span className="gtag muted">{item.cat}</span>}
              <ProductBadges item={item} />
            </div>
            <h1 style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginBottom: 8 }}>{item.name}</h1>
            <p className="muted" style={{ fontSize: 15, marginBottom: 26 }}>{item.kind || item.color}</p>

            {item.preorder && (
              <div className="panel panel-pad" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(79,220,255,.3)", background: "linear-gradient(180deg, rgba(79,220,255,.06), transparent)" }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(79,220,255,.12)", display: "grid", placeItems: "center", color: "var(--cyan)", flexShrink: 0 }}><Icon name="spark" size={20} /></span>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14.5 }}>Preventa · llega {item.releases}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Reservá ahora, pagá hoy. Precio de lanzamiento fijo, stock garantizado.</div>
                </div>
              </div>
            )}

            <div className="panel panel-pad" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
                <span className="price-ars" style={{ fontSize: 34 }}>{HV.fmtArs(HV.ars(item.usd))}</span>
                <span className="price-usd" style={{ fontSize: 16 }}>{HV.fmtUsd(item.usd)}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <QtyStepper value={qty} onChange={setQty} />
                <Btn variant="holo" size="lg" block onClick={() => addToCart(item, qty)}>
                  <Icon name="cart" size={17} />{item.preorder ? "Reservar ahora" : "Agregar al carrito"}
                </Btn>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                {[["truck", "Envío gratis +$80.000"], ["shield", "Garantía sellado de fábrica"]].map(([ic, t]) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-2)" }}><span style={{ color: "var(--violet)" }}><Icon name={ic} size={15} /></span>{t}</div>
                ))}
              </div>
            </div>

            <div className="panel panel-pad">
              <div className="eyebrow" style={{ marginBottom: 8 }}>Detalles</div>
              {item.set && <MetaRow k="Set" v={item.set} />}
              {item.setCode && <MetaRow k="Código" v={item.setCode} />}
              {item.kind && <MetaRow k="Contenido" v={item.kind} />}
              {item.cat && <MetaRow k="Categoría" v={item.cat} />}
              {item.color && <MetaRow k="Variante" v={item.color} />}
              <MetaRow k="Disponibilidad" v={item.preorder ? "Preventa" : "En stock"} accent={item.preorder ? "var(--cyan)" : "var(--good)"} />
            </div>
          </div>
        </div>
      </div>
      <RelatedRail items={related} title={isAcc ? "Más accesorios" : "Más producto sellado"} />
    </div>
  );
}




/* ------------------------------------------------------------------ */

/* Holoverse — Cart & checkout */
function Stepper({ step }) {
  const steps = ["Carrito", "Envío", "Pago", "Listo"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 30 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-display)",
              background: i < step ? "var(--holo)" : i === step ? "var(--surface-3)" : "var(--surface-2)",
              border: `1px solid ${i === step ? "var(--border-glow)" : "var(--border)"}`, color: i < step ? "#0a0a12" : i === step ? "var(--text)" : "var(--text-3)" }}>
              {i < step ? <Icon name="check" size={13} stroke={3} solid /> : i + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)", color: i <= step ? "var(--text)" : "var(--text-3)" }} className="hv-step-label">{s}</span>
          </div>
          {i < steps.length - 1 && <span style={{ flex: 1, height: 1, background: i < step ? "var(--violet)" : "var(--border)", maxWidth: 60 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function LineItem({ row, editable }) {
  const { setQty, removeFromCart } = useHV();
  const price = row.condition ? (row.item.conditions.find((c) => c[0] === row.condition)?.[1] ?? row.item.usd) : row.item.usd;
  return (
    <div style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
      <div style={{ width: 56, flexShrink: 0 }}><ItemArt item={row.item} compact /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          {row.item.game && <GameTag game={row.item.game} withLabel={false} />}
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.item.name}</span>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>{row.item.set || row.item.cat}{row.condition && ` · ${row.condition}`}{row.item.preorder && " · Pre-order"}</div>
      </div>
      {editable ? <QtyStepper value={row.qty} onChange={(q) => setQty(row.key, q)} /> : <span className="muted" style={{ fontSize: 13 }}>×{row.qty}</span>}
      <div style={{ width: 120, textAlign: "right" }}><Price usd={price * row.qty} size={15} align="right" /></div>
      {editable && <button className="btn btn-icon btn-sm" onClick={() => removeFromCart(row.key)} style={{ background: "transparent", border: 0, color: "var(--text-3)" }}><Icon name="close" size={16} /></button>}
    </div>
  );
}

function Summary({ children, shipUsd = 0 }) {
  const { cartTotalUsd } = useHV();
  const sub = cartTotalUsd;
  const total = sub + shipUsd;
  return (
    <div className="panel panel-pad" style={{ position: "sticky", top: 96 }}>
      <h3 style={{ fontSize: 17, marginBottom: 16 }}>Resumen del pedido</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 14 }}>
        <Row k="Subtotal" v={sub} />
        <Row k="Envío" v={shipUsd} free={shipUsd === 0} />
        <Row k="Impuestos" v={0} free />
      </div>
      <hr className="divider" style={{ margin: "16px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 16 }}>Total</span>
        <Price usd={total} size={22} align="right" />
      </div>
      <div style={{ marginTop: 18 }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-3)", justifyContent: "center" }}><Icon name="shield" size={14} />Pago seguro · autenticidad garantizada</div>
    </div>
  );
}
function Row({ k, v, free }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-2)" }}>
      <span>{k}</span>
      {free ? <span style={{ color: "var(--good)", fontWeight: 600 }}>Gratis</span> : <span style={{ color: "var(--text)", fontWeight: 600 }}>{HV.fmtArs(HV.ars(v))} <span className="price-usd">/ {HV.fmtUsd(v)}</span></span>}
    </div>
  );
}

function Field({ label, ...rest }) {
  return (
    <label style={{ display: "block" }}>
      <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 7, fontWeight: 600 }}>{label}</span>
      <input className="input" {...rest} />
    </label>
  );
}

function CartCheckout() {
  const { cart, nav, cartCount } = useHV();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("ship");
  const [pay, setPay] = useState("card");
  const shipUsd = method === "pickup" ? 0 : 4.5;

  if (cartCount === 0 && step < 3) {
    return (
      <div className="wrap" style={{ padding: "100px 28px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", margin: "0 auto 20px", color: "var(--text-3)" }}><Icon name="cart" size={28} /></div>
        <h1 style={{ fontSize: 30, marginBottom: 10 }}>Tu carrito está vacío</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Singles chase, cajas selladas y gear te esperan en el Holoverse.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="holo" onClick={() => nav("browse", { type: "single" })}>Ver singles</Btn>
          <Btn variant="ghost" onClick={() => nav("browse", { type: "sealed" })}>Ver sellado</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 30, maxWidth: 1080 }}>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 24 }}>{step === 3 ? "Pedido confirmado" : "Finalizar compra"}</h1>
      {step < 3 && <Stepper step={step} />}

      {step === 3 ? (
        <div className="panel panel-pad fade-up" style={{ textAlign: "center", padding: "56px 30px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--holo)", display: "grid", placeItems: "center", margin: "0 auto 22px", color: "#0a0a12", boxShadow: "var(--glow-violet)" }}><Icon name="check" size={34} stroke={3} solid /></div>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>¡Gracias! Ya estás en el Holoverse.</h2>
          <p className="muted" style={{ fontSize: 15, marginBottom: 6 }}>Pedido <b style={{ color: "var(--text)" }}>#HV-20682</b> confirmado. Te enviamos el comprobante.</p>
          <p className="muted" style={{ fontSize: 14, marginBottom: 28 }}>{method === "pickup" ? "Listo para retirar en Palermo en 24h." : "Despachando desde Buenos Aires hoy."}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn variant="primary" onClick={() => nav("account")}>Seguir pedido</Btn>
            <Btn variant="ghost" onClick={() => nav("home")}>Seguir comprando</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 36, alignItems: "start" }} className="hv-checkout-grid">
          <div>
            {step === 0 && (
              <div className="panel panel-pad">
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>Carrito · {cartCount} art.</h3>
                {cart.map((row) => <LineItem key={row.key} row={row} editable />)}
              </div>
            )}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="panel panel-pad">
                  <h3 style={{ fontSize: 17, marginBottom: 16 }}>Método de entrega</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[["ship", "truck", "Envío a domicilio", "Desde $4.50 · 2–4 días"], ["pickup", "box", "Retiro en local", "Gratis · Palermo, CABA"]].map(([id, ic, t, sub]) => (
                      <button key={id} onClick={() => setMethod(id)} style={{ textAlign: "left", padding: 16, borderRadius: 14, cursor: "pointer", border: `1px solid ${method === id ? "var(--border-glow)" : "var(--border)"}`, background: method === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                        <span style={{ color: "var(--violet)", display: "block", marginBottom: 10 }}><Icon name={ic} size={20} /></span>
                        <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14.5 }}>{t}</div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {method === "ship" && (
                  <div className="panel panel-pad">
                    <h3 style={{ fontSize: 17, marginBottom: 16 }}>Dirección de envío</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Nombre" defaultValue="Lucía" />
                      <Field label="Apellido" defaultValue="Fernández" />
                      <div style={{ gridColumn: "1 / -1" }}><Field label="Dirección" placeholder="Av. Santa Fe 1234" /></div>
                      <Field label="Ciudad" defaultValue="Buenos Aires" />
                      <Field label="Código postal" placeholder="C1059" />
                    </div>
                  </div>
                )}
              </div>
            )}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="panel panel-pad">
                  <h3 style={{ fontSize: 17, marginBottom: 16 }}>Pago</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                    {[["card", "Tarjeta de crédito / débito", "Visa · Mastercard · hasta 6 cuotas"], ["mp", "Mercado Pago", "Pagá con tu saldo de MP"], ["crypto", "Cripto (USDT / USDC)", "Pagá en stablecoins"]].map(([id, t, sub]) => (
                      <button key={id} onClick={() => setPay(id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `1px solid ${pay === id ? "var(--border-glow)" : "var(--border)"}`, background: pay === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", border: `5px solid ${pay === id ? "var(--violet)" : "var(--surface-hi)"}`, background: "var(--bg)" }} />
                        <span style={{ flex: 1 }}><b style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{t}</b><span className="muted" style={{ fontSize: 12.5, display: "block" }}>{sub}</span></span>
                      </button>
                    ))}
                  </div>
                  {pay === "card" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ gridColumn: "1 / -1" }}><Field label="Número de tarjeta" placeholder="4242 4242 4242 4242" /></div>
                      <Field label="Vencimiento" placeholder="MM / AA" />
                      <Field label="CVC" placeholder="123" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Summary shipUsd={step >= 1 ? shipUsd : 0}>
            <Btn variant="holo" block size="lg" onClick={() => setStep(step + 1)}>
              {step === 0 ? "Finalizar compra" : step === 1 ? "Continuar al pago" : "Confirmar pedido"}<Icon name="arrow" size={17} />
            </Btn>
            {step > 0 && <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setStep(step - 1)}>Volver</button>}
          </Summary>
        </div>
      )}
    </div>
  );
}




/* ------------------------------------------------------------------ */

/* Holoverse — Account / order history */
const ORDERS = [
  { id: "HV-20571", date: "28 may 2026", status: "Entregado", total: 64.0, items: ["s1"], n: 1 },
  { id: "HV-20419", date: "12 may 2026", status: "Enviado", total: 183.99, items: ["b4", "a3"], n: 3 },
  { id: "HV-20288", date: "30 abr 2026", status: "Preventa", total: 359.0, items: ["b1"], n: 1 },
  { id: "HV-20104", date: "09 abr 2026", status: "Entregado", total: 78.0, items: ["s3"], n: 1 },
];
const STATUS_COLOR = { Entregado: "var(--good)", Enviado: "var(--cyan)", Preventa: "var(--gold)", Procesando: "var(--violet)" };

function Account() {
  const { nav } = useHV();
  const [tab, setTab] = useState("orders");
  const tabs = [["orders", "Pedidos"], ["wishlist", "Deseos"], ["sell", "Vender"], ["details", "Cuenta"]];
  const wishlist = [HV.byId("s2"), HV.byId("s9"), HV.byId("b3"), HV.byId("s11")];

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
      {/* profile header */}
      <div className="panel gloss" style={{ position: "relative", overflow: "hidden", padding: "28px 30px", marginBottom: 26, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ position: "absolute", top: -40, right: -20, width: 200, height: 200, borderRadius: "50%", background: "var(--holo)", filter: "blur(80px)", opacity: .2 }} />
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--holo)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#0a0a12", flexShrink: 0 }}>LF</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 26 }}>Lucía Fernández</h1>
            <span className="badge badge-holo">Nivel 12</span>
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 3 }}>Coleccionista · Miembro desde 2024</p>
          <div style={{ marginTop: 12, maxWidth: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--font-display)", color: "var(--text-3)", marginBottom: 5 }}>
              <span>XP 2.840 / 3.500</span>
              <span>Nivel 13</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ width: "81%", height: "100%", background: "var(--holo)", backgroundSize: "200% 100%", animation: "holoShift 6s linear infinite" }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[["Pedidos", ORDERS.length], ["Crédito", "$24.500"], ["Deseos", wishlist.length]].map(([k, v]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>{v}</div>
              <div className="muted" style={{ fontSize: 12 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 26, overflowX: "auto" }}>
        {tabs.map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "transparent", border: 0, borderBottom: `2px solid ${tab === id ? "var(--violet)" : "transparent"}`, color: tab === id ? "var(--text)" : "var(--text-3)", padding: "12px 16px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>

      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ORDERS.map((o) => (
            <div key={o.id} className="panel" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: -8 }}>
                {o.items.map((id, i) => (
                  <div key={id} style={{ width: 40, marginLeft: i ? -14 : 0, border: "2px solid var(--surface)", borderRadius: 8 }}><ItemArt item={HV.byId(id)} compact /></div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{o.id}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{o.date} · {o.n} art.</div>
              </div>
              <span className="badge" style={{ color: STATUS_COLOR[o.status], borderColor: STATUS_COLOR[o.status] + "55", background: STATUS_COLOR[o.status] + "14" }}><span className="dot" style={{ background: STATUS_COLOR[o.status] }} />{o.status}</span>
              <Price usd={o.total} size={16} align="right" />
              <button className="btn btn-sm btn-ghost" onClick={() => nav(HV.byId(o.items[0]).type === "single" ? "single" : "sealed", { id: o.items[0] })}>Ver<Icon name="chevron" size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {tab === "wishlist" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }} className="hv-rail">
          {wishlist.map((it) => <ProductCard key={it.id} item={it} />)}
        </div>
      )}

      {tab === "sell" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, alignItems: "start" }} className="hv-checkout-grid">
          <div className="panel panel-pad">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Cotización al instante</div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Vendé tus cartas a Holoverse</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 22, lineHeight: 1.6 }}>Pegá una decklist o buscá cartas para armar tu lista de venta. Pagamos en efectivo o +10% en crédito. Etiqueta asegurada gratis, pago en 48h.</p>
            <textarea className="input" rows="5" placeholder={"1 Ragavan, Nimble Pilferer\n4 Charizard ex (151)\n2 Monkey D. Luffy Leader…"} style={{ resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 13 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn variant="holo">Cotizar al instante<Icon name="arrow" size={16} /></Btn>
              <Btn variant="ghost">Subir colección CSV</Btn>
            </div>
          </div>
          <div className="panel panel-pad">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Por qué vendernos</h3>
            {[["bolt", "Cotización al instante", "Precios de compra en vivo de +40k cartas"], ["shield", "Calificación justa", "Evaluación de condición transparente"], ["truck", "Envío gratis", "Etiqueta asegurada prepaga ida y vuelta"], ["spark", "+10% en crédito", "Sumá a tu pago para nuevas compras"]].map(([ic, t, d]) => (
              <div key={t} style={{ display: "flex", gap: 13, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--violet)", flexShrink: 0 }}><Icon name={ic} size={16} /></span>
                <div><div style={{ fontWeight: 600, fontFamily: "var(--font-display)", fontSize: 14 }}>{t}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 760 }} className="hv-checkout-grid">
          <div className="panel panel-pad">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Perfil</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Nombre completo" defaultValue="Lucía Fernández" />
              <Field label="Email" defaultValue="lucia.f@email.com" />
              <Field label="Teléfono" defaultValue="+54 11 5555 0000" />
            </div>
          </div>
          <div className="panel panel-pad">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Preferencias</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Moneda" defaultValue="ARS + USD" />
              <Field label="Juego predeterminado" defaultValue="Magic: The Gathering" />
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--text-2)", marginTop: 4 }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, background: "var(--holo)", display: "grid", placeItems: "center", color: "#0a0a12" }}><Icon name="check" size={12} stroke={3} solid /></span>
                Avisarme cuando vuelva el stock de mis deseos
              </label>
            </div>
            <Btn variant="primary" style={{ marginTop: 18 }}>Guardar cambios</Btn>
          </div>
        </div>
      )}
    </div>
  );
}




/* ------------------------------------------------------------------ */

/* Holoverse — app shell: router, cart, search, tweaks */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroLayout": "stage",
  "cardStyle": "minimal",
  "accent": "holo",
  "density": "regular"
}/*EDITMODE-END*/;

const ACCENTS = {
  holo:   { violet: "#8b7dff" },
  violet: { violet: "#8b7dff" },
  cyan:   { violet: "#4fdcff" },
  pink:   { violet: "#ff7ac8" },
};

/* ---------------- search overlay ---------------- */
function SearchOverlay({ onClose }) {
  const { nav } = useHV();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);
  const results = q.trim().length
    ? HV.all.filter((x) => (x.name + " " + (x.set || "") + " " + (x.cat || "")).toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  const trending = ["Charizard ex", "Ragavan", "One Piece OP-09", "151 ETB", "Prism Sleeves"];
  const submit = () => { nav("search", { q }); onClose(); };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(5,5,9,.7)", backdropFilter: "blur(8px)", paddingTop: "10vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="panel fade-up" style={{ maxWidth: 640, margin: "0 auto", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={20} style={{ color: "var(--text-3)" }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Buscá cartas, sets, sellado, accesorios…" style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "var(--text)", fontSize: 17, fontFamily: "var(--font-body)" }} />
          <button className="btn btn-icon btn-sm" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div style={{ padding: 16 }}>
          {results.length > 0 ? results.map((r) => (
            <button key={r.id} onClick={() => { nav(r.type === "single" ? "single" : "sealed", { id: r.id }); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "10px 12px", borderRadius: 12, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{ width: 40, height: 56, flexShrink: 0 }}><ItemArt item={r} compact /></span>
              <span style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 14, display: "block" }}>{r.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>{r.game ? HV.gameLabel(r.game) : r.cat} · {r.set || r.color}</span>
              </span>
              <Price usd={r.usd} size={14} align="right" />
            </button>
          )) : (
            <div>
              <div className="eyebrow" style={{ padding: "6px 12px 12px" }}>Búsquedas populares</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 12px 8px" }}>
                {trending.map((t) => <button key={t} onClick={() => setQ(t)} className="badge" style={{ cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 13, fontFamily: "var(--font-body)" }}>{t}</button>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- placeholder for screens still in progress ---------------- */
function Placeholder({ title }) {
  return (
    <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}>
      <div className="eyebrow">Holoverse</div>
      <h1 style={{ fontSize: 40, marginTop: 12 }}>{title}</h1>
      <p className="muted" style={{ marginTop: 12 }}>Pantalla en construcción.</p>
    </div>
  );
}

/* ---------------- root ---------------- */
function App() {
  const t: any = { heroLayout: "stage", cardStyle: "minimal", density: "regular", accent: "holo" };
  const setTweak = (..._a: any[]) => {};
  const [view, setView] = useState({ route: "home", params: {} });
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef(null);

  const nav = (route, params = {}) => { setView({ route, params }); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "instant" }); };

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const addToCart = (item, qty = 1, condition = null) => {
    setCart((c) => {
      const key = item.id + (condition ? ":" + condition : "");
      const found = c.find((x) => x.key === key);
      if (found) return c.map((x) => x.key === key ? { ...x, qty: x.qty + qty } : x);
      return [...c, { key, item, qty, condition }];
    });
    showToast(`Agregaste ${item.name.split("(")[0].trim()} al carrito`);
  };
  const removeFromCart = (key) => setCart((c) => c.filter((x) => x.key !== key));
  const setQty = (key, qty) => setCart((c) => c.map((x) => x.key === key ? { ...x, qty } : x));
  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartTotalUsd = cart.reduce((n, x) => {
    const price = x.condition ? (x.item.conditions.find((cd) => cd[0] === x.condition)?.[1] ?? x.item.usd) : x.item.usd;
    return n + price * x.qty;
  }, 0);

  // apply accent tweak
  useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS.holo;
    document.documentElement.style.setProperty("--accent", a.violet);
    document.documentElement.style.setProperty("--violet", a.violet);
  }, [t.accent]);

  const ctx = {
    route: view.route, params: view.params, nav,
    cart, cartCount, addToCart, removeFromCart, setQty, cartTotalUsd,
    openSearch: () => setSearchOpen(true), closeSearch: () => setSearchOpen(false),
    menuOpen, toggleMenu: () => setMenuOpen((o) => !o), closeMenu: () => setMenuOpen(false),
    showToast, cardStyle: t.cardStyle, heroLayout: t.heroLayout, density: t.density, tweaks: t,
  };

  const SCREENS = {
    home: Home, browse: Browse, search: SearchResults,
    single: SinglePDP, sealed: SealedPDP, cart: CartCheckout, account: Account,
  };
  const Screen = SCREENS[view.route] || (() => <Placeholder title={view.route} />);

  return (
    <HVCtx.Provider value={ctx}>
      <div className="hv-app">
        <Header />
        <main className="hv-main">
          <Screen key={view.route + JSON.stringify(view.params)} {...view.params} />
        </main>
        <Footer />
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      <StaggeredMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Prisma />
      <Toast msg={toast} />

      
    </HVCtx.Provider>
  );
}


export default App;
