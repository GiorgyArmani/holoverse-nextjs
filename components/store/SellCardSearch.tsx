"use client";
/* Buscador de cartas para el flujo de venta del cliente.
   Usa el mismo motor que el alta de productos del admin (Scryfall / TCGdex /
   apitcg) y muestra el precio de mercado como referencia para el vendedor. */
import React, { useState, useEffect, useRef } from "react";
import { scryfallAutocomplete, scryfallPrints } from "../../lib/scryfall";
import { tcgdexSearch, tcgdexCard } from "../../lib/tcgdex";
import { onePieceSearch } from "../../lib/apitcg";
import { HV } from "../../lib/data";
import { Icon } from "./ui";

const GAMES = [
  { code: "mtg", label: "Magic", ph: "Buscá tu carta… ej: Ragavan, Nimble Pilferer" },
  { code: "poke", label: "Pokémon", ph: "Buscá tu carta… ej: Charizard ex" },
  { code: "op", label: "One Piece", ph: "Buscá tu carta… ej: Monkey D. Luffy" },
];

function MarketPrice({ usd, usdFoil }: any) {
  if (usd == null && usdFoil == null) return <span className="muted" style={{ fontSize: 10.5 }}>sin ref. de mercado</span>;
  const v = usd ?? usdFoil;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--violet)" }}>
      {HV.fmtArs(HV.ars(v))}
      <span className="muted" style={{ fontWeight: 500 }}> · {HV.fmtUsd(v)}{usd != null && usdFoil != null ? ` · foil ${HV.fmtUsd(usdFoil)}` : ""}</span>
    </span>
  );
}

function ResultCard({ c, onClick }: any) {
  return (
    <button onClick={onClick} title={`${c.name} — agregar a la lista`}
      style={{ flexShrink: 0, width: 124, textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 8, cursor: "pointer", color: "var(--text)", transition: "border-color .15s, transform .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-glow)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
      {c.thumb || c.image
        ? <img src={c.thumb || c.image} alt={c.name} style={{ width: "100%", borderRadius: 8, display: "block" }} loading="lazy" />
        : <span style={{ display: "grid", placeItems: "center", aspectRatio: "5/7", fontSize: 10, color: "var(--text-4)", border: "1px dashed var(--border)", borderRadius: 8 }}>sin imagen</span>}
      <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 7, fontFamily: "var(--font-display)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
      {(c.set_name || c.card_number) && <div className="muted" style={{ fontSize: 10, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.set_name}{c.card_number ? ` · ${c.card_number}` : ""}</div>}
      <div style={{ marginTop: 4 }}><MarketPrice usd={c.usd} usdFoil={c.usd_foil} /></div>
    </button>
  );
}

export default function SellCardSearch({ onPick }: any) {
  const [game, setGame] = useState("mtg");
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState<string[]>([]); // sugerencias de nombre (Magic)
  const [results, setResults] = useState<any>(null); // cartas para elegir
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const debounce = useRef<any>(null);

  useEffect(() => { setQ(""); setSugs([]); setResults(null); setError(""); }, [game]);

  useEffect(() => {
    clearTimeout(debounce.current);
    setError("");
    if (q.trim().length < 2) { setSugs([]); if (game !== "mtg") setResults(null); return; }
    debounce.current = setTimeout(async () => {
      setBusy(true);
      if (game === "mtg") {
        setSugs(await scryfallAutocomplete(q));
      } else if (game === "poke") {
        setResults(await tcgdexSearch(q));
      } else {
        const { cards, error: err } = await onePieceSearch(q);
        setResults(cards); setError(err || "");
      }
      setBusy(false);
    }, 380);
    return () => clearTimeout(debounce.current);
  }, [q, game]);

  // Magic: elegir un nombre → cargar sus impresiones (cada una con su precio)
  const chooseName = async (name: string) => {
    setQ(name); setSugs([]); setBusy(true);
    setResults(await scryfallPrints(name));
    setBusy(false);
  };

  // Pokémon: la grilla trae thumbs; al elegir, traemos el detalle con precio
  const pickPoke = async (c: any) => {
    setBusy(true);
    const card = await tcgdexCard(c.id);
    setBusy(false);
    if (card) { onPick({ game: "poke", ...card }); setQ(""); setResults(null); }
  };

  const pick = (c: any) => { onPick(c); setQ(""); setResults(null); setSugs([]); };

  const g = GAMES.find((x) => x.code === game)!;

  return (
    <div className="panel" style={{ padding: 16, background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <div className="eyebrow" style={{ marginBottom: 10, fontSize: 11 }}>Buscá tu carta · referencia de precio</div>

      {/* selector de juego */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {GAMES.map((x) => (
          <button key={x.code} onClick={() => setGame(x.code)}
            style={{ flex: 1, padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)",
              border: `1px solid ${game === x.code ? "var(--border-glow)" : "var(--border)"}`,
              background: game === x.code ? "var(--accent-soft)" : "transparent",
              color: game === x.code ? "var(--text)" : "var(--text-3)" }}>
            {x.label}
          </button>
        ))}
      </div>

      {/* input */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}><Icon name="search" size={16} /></span>
        <input className="input" value={q} onChange={(e) => { setQ(e.target.value); if (game === "mtg") setResults(null); }}
          placeholder={g.ph} style={{ paddingLeft: 38 }} />
        {game === "mtg" && sugs.length > 0 && (
          <div className="panel" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30, maxHeight: 240, overflowY: "auto", padding: 6, boxShadow: "var(--shadow-lg)" }}>
            {sugs.map((s) => (
              <button key={s} onClick={() => chooseName(s)}
                style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: 0, color: "var(--text)", padding: "9px 11px", borderRadius: 8, cursor: "pointer", fontSize: 13.5 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {busy && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Buscando…</p>}
      {error && <p style={{ fontSize: 13, marginTop: 10, color: "#ff8a8a" }}>{error}</p>}
      {results && results.length === 0 && !busy && !error && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Sin resultados con ese nombre.</p>}

      {results && results.length > 0 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 12, paddingBottom: 6 }}>
          {results.map((c: any) => (
            <ResultCard key={c.id} c={c} onClick={() => (game === "poke" ? pickPoke(c) : pick({ game, ...c, usd: game === "op" ? null : c.usd }))} />
          ))}
        </div>
      )}

      <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 10 }}>
        Precios de mercado de referencia (Scryfall / TCGdex). La oferta final la define Holoverse tras revisar tus fotos.
      </span>
    </div>
  );
}
