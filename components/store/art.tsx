"use client";
/* Renders de producto: carta (con holo tilt), caja sellada y accesorio. */
import React from "react";
import { HV } from "../../lib/data";
import { HoloTilt } from "../effects";

/* ---------------- the trading-card placeholder ---------------- */
export function TradingCard({ item, foil, compact, flat }: any) {
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
export function BoxArt({ item, compact }: any) {
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
export function AccArt({ item, compact }: any) {
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

export function ItemArt({ item, compact }: any) {
  if (item.type === "single") return <TradingCard item={item} compact={compact} />;
  if (item.type === "sealed") return <BoxArt item={item} compact={compact} />;
  return <AccArt item={item} compact={compact} />;
}
