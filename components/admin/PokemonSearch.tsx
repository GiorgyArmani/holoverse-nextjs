"use client";
/* Buscador TCGdex para el alta de singles de Pokémon:
   tipeás el nombre → elegís la carta/edición → autocompleta el formulario. */
import React, { useState, useEffect, useRef } from "react";
import { tcgdexSearch, tcgdexCard } from "../../lib/tcgdex";

export default function PokemonSearch({ onPick }: { onPick: (c: any) => void }) {
  const [q, setQ] = useState("");
  const [cards, setCards] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<any>(null);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setCards(null); return; }
    debounce.current = setTimeout(async () => {
      setBusy(true);
      setCards(await tcgdexSearch(q));
      setBusy(false);
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [q]);

  const choose = async (id: string) => {
    setBusy(true);
    const card = await tcgdexCard(id);
    setBusy(false);
    if (card) onPick(card);
  };

  return (
    <div style={{ marginBottom: 18, padding: "14px 16px", border: "1px dashed rgba(216,196,137,.4)", borderRadius: 4, background: "rgba(216,196,137,.04)" }}>
      <span className="ff-eyebrow" style={{ display: "block", marginBottom: 8 }}>⚡ Importar desde TCGdex (Pokémon)</span>
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscá una carta de Pokémon… ej: Charizard" />

      {busy && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Buscando cartas…</p>}
      {cards && cards.length === 0 && !busy && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Sin resultados con ese nombre.</p>}

      {cards && cards.length > 0 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 12, paddingBottom: 6 }}>
          {cards.map((c: any) => (
            <button key={c.id} onClick={() => choose(c.id)} title={`${c.name} · ${c.id} — click para autocompletar`}
              style={{ flexShrink: 0, width: 110, textAlign: "left", background: "transparent", border: "1px solid rgba(216,196,137,.25)", borderRadius: 4, padding: 7, cursor: "pointer", color: "var(--text)", transition: "border-color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(216,196,137,.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(216,196,137,.25)")}>
              {c.thumb ? <img src={c.thumb} alt={c.name} style={{ width: "100%", borderRadius: 3 }} loading="lazy" />
                : <span style={{ display: "grid", placeItems: "center", aspectRatio: "5/7", fontSize: 10, color: "var(--text-4)", border: "1px dashed rgba(216,196,137,.2)", borderRadius: 3 }}>sin imagen</span>}
              <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 5, fontFamily: "var(--font-display)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
              <div className="muted" style={{ fontSize: 9.5 }}>{c.id}</div>
            </button>
          ))}
        </div>
      )}
      <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 8 }}>TCGdex es gratis y sin API key. Si trae precio de mercado lo carga; si no, ponelo a mano. La imagen queda hotlinkeada — podés reemplazarla subiendo la tuya.</span>
    </div>
  );
}
