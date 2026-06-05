"use client";
/* Páginas de detalle: single (condiciones NM/LP/MP/HP) y sellado/accesorio. */
import React, { useState } from "react";
import { HV } from "../../lib/data";
import { useHV } from "./context";
import { Icon, Btn, GameTag, QtyStepper, ProductBadges, SectionHead } from "./ui";
import { TradingCard, BoxArt, AccArt } from "./art";
import ProductCard from "./ProductCard";

function Breadcrumb({ trail }: any) {
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

function MetaRow({ k, v, accent }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="muted" style={{ fontSize: 13.5 }}>{k}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-display)", color: accent || "var(--text)" }}>{v}</span>
    </div>
  );
}

function RelatedRail({ items, title }: any) {
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

export function SinglePDP({ id }: any) {
  const { addToCart, toggleWish, isWished } = useHV();
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
              <span className={`rar rar-${item.rarity}`}>{item.rarityName || HV.rarityLabel(item.rarity)}</span>
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
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10, color: isWished(item) ? "var(--violet)" : undefined }} onClick={() => toggleWish(item)}>
                <Icon name="heart" size={16} solid={isWished(item)} />{isWished(item) ? "En tu lista de deseos" : "Guardar en deseos"}</button>
            </div>

            {/* metadata */}
            <div className="panel panel-pad" style={{ marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Detalles de la carta</div>
              <MetaRow k="Set" v={item.set} />
              <MetaRow k="Código" v={item.setCode} />
              <MetaRow k="N° de carta" v={"#" + item.number} />
              <MetaRow k="Rareza" v={item.rarityName || HV.rarityLabel(item.rarity)} accent={item.rarity === "rare" ? "var(--gold)" : item.rarity === "uncommon" ? "var(--cyan)" : undefined} />
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

export function SealedPDP({ id }: any) {
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
