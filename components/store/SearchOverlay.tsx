"use client";
/* Overlay de búsqueda global (Cmd-K style). */
import React, { useState, useEffect, useRef } from "react";
import { HV } from "../../lib/data";
import { useHV } from "./context";
import { Icon, Price } from "./ui";
import { ItemArt } from "./art";

export default function SearchOverlay({ onClose }: any) {
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(5,5,9,.7)", backdropFilter: "blur(8px)", padding: "10vh 14px 0" }}>
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
