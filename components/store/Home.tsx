"use client";
/* Landing: hero con abanico de cartas, mundos, rails y CTA de venta. */
import React, { useState, useEffect, useRef } from "react";
import { HV } from "../../lib/data";
import { LiquidChrome } from "../effects";
import { useHV } from "./context";
import { Icon, Btn, GameTag, Price, ChapterHead, HudChip } from "./ui";
import { TradingCard } from "./art";
import ProductCard from "./ProductCard";

/* ---- the fanned "hand" of featured cards (your loot) — auto-cycling ---- */
function HeroCardFan({ cards }: any) {
  const { nav } = useHV();
  const [focus, setFocus] = useState(Math.floor(cards.length / 2));
  const [paused, setPaused] = useState(false);
  const [k, setK] = useState(1); // geometry scale: 1 on desktop, shrinks to fit narrow screens
  const wrapRef = useRef(null);
  const n = cards.length;
  const feat = cards[focus];
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setFocus((f) => (f + 1) % n), 2300);
    return () => clearInterval(t);
  }, [paused, n]);
  // the fan geometry is fixed-px; scale every measure to the available width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setK(Math.min(1, el.offsetWidth / 470));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: "relative", minHeight: 540 * k, display: "grid", placeItems: "center", maxWidth: "100%" }}>
      <div style={{ position: "absolute", width: 430 * k, height: 430 * k, borderRadius: "50%", background: "var(--purple-grad)", filter: "blur(100px)", opacity: .38 }} />
      <div style={{ position: "relative", width: 440 * k, height: 480 * k }}>
        {cards.map((c, i) => {
          const mid = (n - 1) / 2;
          const off = i - mid;
          const isF = i === focus;
          const rot = off * 12;
          const tx = off * 68 * k;
          const ty = (Math.abs(off) * 30 - (isF ? 44 : 0)) * k;
          return (
            <div key={c.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => nav("single", { id: c.id })}
              style={{
                position: "absolute", left: "50%", top: "50%", width: 222 * k, marginLeft: -111 * k, marginTop: -155 * k,
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
      <div className="panel gloss" style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: "min(372px, 96%)", padding: "14px 20px", backdropFilter: "blur(10px)", background: "rgba(26,21,41,.86)", borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 40 }}>
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

function HeroGridStage({ chase }: any) {
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
  const picks = ["s16", "s14", "s13", "s15", "s17"].map((id) => HV.byId(id)).filter(Boolean);
  const fan = picks.length >= 3 ? picks : HV.SINGLES.slice(0, 5);
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
          <button key={t.id} onClick={() => nav("browse", { game: t.id })} className="realm-tile" style={{ "--realm": t.color } as any}>
            <div className="realm-glow" style={{ background: t.color }} />
            <span className="realm-crest" style={{ "--realm": t.color } as any}><span /></span>
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

function Rail({ items }: any) {
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

export default function Home() {
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
