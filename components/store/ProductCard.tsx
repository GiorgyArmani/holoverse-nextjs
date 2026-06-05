"use client";
/* Card de producto del catálogo (rail, browse, wishlist). */
import React, { useState } from "react";
import { useHV } from "./context";
import { Icon, GameTag, Price, ProductBadges } from "./ui";
import { ItemArt } from "./art";

export default function ProductCard({ item, style }: any) {
  const { nav, addToCart, cardStyle, toggleWish, isWished } = useHV();
  const [hover, setHover] = useState(false);
  const wished = isWished(item);
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
          onClick={(e) => {e.stopPropagation();toggleWish(item);}}
          style={{ position: "absolute", bottom: 8, right: 8, opacity: hover || wished ? 1 : 0, transition: "opacity .2s", background: "rgba(10,10,18,.7)", backdropFilter: "blur(6px)", color: wished ? "var(--violet)" : undefined }}>
          <Icon name="heart" size={15} solid={wished} /></button>
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          {item.game ? <GameTag game={item.game} /> : <span className="gtag muted">{item.cat}</span>}
          {item.rarity && <span className={`rar rar-${item.rarity}`}>{item.rarityShort || { common: "Common", uncommon: "Uncommon", rare: "Rare", mythic: "Chase" }[item.rarity]}</span>}
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
