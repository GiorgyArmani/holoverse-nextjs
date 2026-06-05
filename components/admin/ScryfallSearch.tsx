"use client";
/* Buscador Scryfall para el alta de singles de Magic:
   tipeás el nombre → elegís la impresión → autocompleta el formulario. */
import React, { useState, useEffect, useRef } from "react";
import { scryfallAutocomplete, scryfallPrints } from "../../lib/scryfall";
import { fmtUsd } from "./ui";

export default function ScryfallSearch({ onPick }: { onPick: (c: any) => void }) {
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState<string[]>([]);
  const [prints, setPrints] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<any>(null);

  // autocomplete con debounce (cortesía de rate-limit de Scryfall)
  useEffect(() => {
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setSugs([]); return; }
    debounce.current = setTimeout(async () => setSugs(await scryfallAutocomplete(q)), 350);
    return () => clearTimeout(debounce.current);
  }, [q]);

  const choose = async (name: string) => {
    setQ(name); setSugs([]); setBusy(true);
    setPrints(await scryfallPrints(name));
    setBusy(false);
  };

  return (
    <div style={{ marginBottom: 18, padding: "14px 16px", border: "1px dashed rgba(216,196,137,.4)", borderRadius: 4, background: "rgba(216,196,137,.04)" }}>
      <span className="ff-eyebrow" style={{ display: "block", marginBottom: 8 }}>⚡ Importar desde Scryfall</span>
      <div style={{ position: "relative" }}>
        <input className="input" value={q} onChange={(e) => { setQ(e.target.value); setPrints(null); }}
          placeholder="Buscá una carta de Magic… ej: Sol Ring" />
        {sugs.length > 0 && (
          <div className="ff-panel" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30, maxHeight: 240, overflowY: "auto", padding: 6 }}>
            {sugs.map((s) => (
              <button key={s} onClick={() => choose(s)} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: 0, color: "var(--text)", padding: "8px 10px", borderRadius: 3, cursor: "pointer", fontSize: 13.5 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(216,196,137,.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {busy && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Buscando impresiones…</p>}

      {prints && prints.length === 0 && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>No encontramos impresiones en papel de esa carta.</p>}

      {prints && prints.length > 0 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 12, paddingBottom: 6 }}>
          {prints.map((c: any) => (
            <button key={c.id} onClick={() => onPick(c)} title="Click para autocompletar el formulario"
              style={{ flexShrink: 0, width: 132, textAlign: "left", background: "transparent", border: "1px solid rgba(216,196,137,.25)", borderRadius: 4, padding: 8, cursor: "pointer", color: "var(--text)", transition: "border-color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(216,196,137,.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(216,196,137,.25)")}>
              {c.thumb ? <img src={c.thumb} alt={c.set_name} style={{ width: "100%", borderRadius: 3 }} loading="lazy" />
                : <span style={{ display: "grid", placeItems: "center", aspectRatio: "5/7", fontSize: 10, color: "var(--text-4)" }}>sin imagen</span>}
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, fontFamily: "var(--font-display)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.set_name}</div>
              <div className="muted" style={{ fontSize: 10.5 }}>{c.set_code} · #{c.card_number} · {c.released?.slice(0, 4)}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: "#d9c489", fontWeight: 700 }}>
                {c.usd ? fmtUsd(c.usd) : "—"}{c.usd_foil ? ` · foil ${fmtUsd(c.usd_foil)}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
      <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 8 }}>Precios de mercado de Scryfall (se actualizan a diario). La imagen queda hotlinkeada a su CDN — podés reemplazarla subiendo la tuya.</span>
    </div>
  );
}
