"use client";
/* Buscador apitcg.com para el alta de singles de One Piece:
   tipeás el nombre → elegís la carta → autocompleta el formulario. */
import React, { useState, useEffect, useRef } from "react";
import { onePieceSearch } from "../../lib/apitcg";

export default function OnePieceSearch({ onPick }: { onPick: (c: any) => void }) {
  const [q, setQ] = useState("");
  const [cards, setCards] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const debounce = useRef<any>(null);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setCards(null); setError(""); return; }
    debounce.current = setTimeout(async () => {
      setBusy(true);
      const { cards: cs, error: err } = await onePieceSearch(q);
      setCards(cs); setError(err || "");
      setBusy(false);
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [q]);

  return (
    <div style={{ marginBottom: 18, padding: "14px 16px", border: "1px dashed rgba(216,196,137,.4)", borderRadius: 4, background: "rgba(216,196,137,.04)" }}>
      <span className="ff-eyebrow" style={{ display: "block", marginBottom: 8 }}>⚡ Importar desde apitcg (One Piece)</span>
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscá una carta de One Piece… ej: Luffy" />

      {busy && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Buscando cartas…</p>}
      {error && <p style={{ fontSize: 13, marginTop: 10, color: "#ff8a8a" }}>{error}</p>}
      {cards && cards.length === 0 && !busy && !error && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Sin resultados con ese nombre.</p>}

      {cards && cards.length > 0 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 12, paddingBottom: 6 }}>
          {cards.map((c: any) => (
            <button key={c.id} onClick={() => onPick(c)} title={`${c.name} · ${c.card_number} — click para autocompletar`}
              style={{ flexShrink: 0, width: 110, textAlign: "left", background: "transparent", border: "1px solid rgba(216,196,137,.25)", borderRadius: 4, padding: 7, cursor: "pointer", color: "var(--text)", transition: "border-color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(216,196,137,.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(216,196,137,.25)")}>
              {c.thumb ? <img src={c.thumb} alt={c.name} style={{ width: "100%", borderRadius: 3 }} loading="lazy" />
                : <span style={{ display: "grid", placeItems: "center", aspectRatio: "5/7", fontSize: 10, color: "var(--text-4)", border: "1px dashed rgba(216,196,137,.2)", borderRadius: 3 }}>sin imagen</span>}
              <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 5, fontFamily: "var(--font-display)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
              <div className="muted" style={{ fontSize: 9.5 }}>{c.card_number} · {c.rarityRaw}</div>
            </button>
          ))}
        </div>
      )}
      <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 8 }}>apitcg no trae precios de mercado — cargá el tuyo a mano. La imagen queda hotlinkeada; podés reemplazarla subiendo la tuya.</span>
    </div>
  );
}
