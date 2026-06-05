"use client";
/* Piezas de UI compartidas de la tienda: íconos, botones, precios,
   badges, stepper, fields, toast y encabezados de sección. */
import React, { useState } from "react";
import { HV } from "../../lib/data";

/* ---------------- icons (inline, minimal) ---------------- */
export function Icon({ name, size = 18, stroke = 1.7, style, solid }: any) {
  const p: any = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: solid ? "currentColor" : "url(#ic-chrome)", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style };
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
export function Btn({ variant = "", size = "", block, children, className = "", ...rest }: any) {
  const cls = ["btn", variant && `btn-${variant}`, size && `btn-${size}`, block && "btn-block", className].filter(Boolean).join(" ");
  return <button className={cls} {...rest}>{children}</button>;
}

/* ---------------- game tag ---------------- */
export function GameTag({ game, withLabel = true }: any) {
  const g = HV.GAMES[game];
  if (!g) return null;
  return <span className="gtag"><span className={`dot ${g.cls}`} />{withLabel && g.short}</span>;
}

/* ---------------- price (ARS primary / USD secondary) ---------------- */
export function Price({ usd, size = 18, align = "left" }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : "flex-start", lineHeight: 1.1 }}>
      <span className="price-ars" style={{ fontSize: size }}>{HV.fmtArs(HV.ars(usd))}</span>
      <span className="price-usd">{HV.fmtUsd(usd)}</span>
    </div>);
}

/* ---------------- badges row ---------------- */
export function ProductBadges({ item }: any) {
  const out = [];
  if (item.preorder) out.push(<span key="p" className="badge badge-preorder">Preventa</span>);
  if (item.hot) out.push(<span key="h" className="badge badge-hot">🔥 Hot</span>);
  if (item.new) out.push(<span key="n" className="badge badge-new">Nuevo</span>);
  if (item.low) out.push(<span key="l" className="badge badge-low">Stock bajo</span>);
  return out.length ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{out}</div> : null;
}

/* ---------------- qty stepper ---------------- */
export function QtyStepper({ value, onChange, min = 1, max = 99 }: any) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 999, background: "var(--surface-2)" }}>
      <button className="btn btn-icon" style={{ border: 0, background: "transparent" }} onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" size={15} /></button>
      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</span>
      <button className="btn btn-icon" style={{ border: 0, background: "transparent" }} onClick={() => onChange(Math.min(max, value + 1))}><Icon name="plus" size={15} /></button>
    </div>);
}

/* ---------------- form field ---------------- */
export function Field({ label, ...rest }: any) {
  return (
    <label style={{ display: "block" }}>
      <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 7, fontWeight: 600 }}>{label}</span>
      <input className="input" {...rest} />
    </label>
  );
}

/* ---------------- toast ---------------- */
export function Toast({ msg }: any) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60,
      background: "var(--surface-3)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "12px 20px",
      boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }} className="fade-up">
      <span style={{ width: 22, height: 22, borderRadius: 99, background: "var(--holo)", display: "grid", placeItems: "center", color: "#0a0a12" }}><Icon name="check" size={14} stroke={2.5} solid /></span>
      {msg}
    </div>);
}

/* ---------------- section headers (capítulos RPG) ---------------- */
export function ChapterHead({ ch, eyebrow, title, action, onAction }: any) {
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

export function SectionHead(props: any) { return <ChapterHead ch="✦" {...props} />; }

export function HudChip({ icon, children }: any) {
  return (
    <div className="hud-chip">
      <span style={{ display: "grid", placeItems: "center" }}><Icon name={icon} size={15} /></span>
      <span>{children}</span>
    </div>
  );
}
