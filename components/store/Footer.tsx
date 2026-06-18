"use client";
/* Footer de la tienda. */
import React from "react";
import { useHV } from "./context";
import { Logo } from "./Header";
import { Icon } from "./ui";

const IG_URL = "https://www.instagram.com/holoverse.tcg/";

export default function Footer() {
  const { nav } = useHV();
  const cols = [
  { h: "Tienda", items: [
    ["Magic: The Gathering", "browse", { game: "mtg" }],
    ["Pokémon", "browse", { game: "poke" }],
    ["One Piece", "browse", { game: "op" }],
    ["Producto sellado", "browse", { type: "sealed" }],
    ["Accesorios", "browse", { type: "acc" }],
    ["Marketplace P2P", "marketplace", {}],
  ] },
  { h: "Cuenta", items: [
    ["Mi tienda", "account", {}],
    ["Vendénos tus cartas", "account", {}],
    ["Mis pedidos", "account", {}],
    ["Mi cuenta", "account", {}],
  ] }];

  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 80, background: "linear-gradient(180deg, transparent, rgba(139,125,255,.04))" }}>
      <div className="wrap" style={{ padding: "56px 28px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(2, 1fr)", gap: 40 }} className="hv-footer-grid">
          <div>
            <Logo onClick={() => nav("home")} />
            <p className="muted" style={{ fontSize: 13.5, marginTop: 16, maxWidth: 280, lineHeight: 1.6 }}>
              El hogar holográfico para coleccionistas y jugadores de TCG. Singles frescos, producto sellado y accesorios de Magic, Pokémon y One Piece. Envíos nacionales e internacionales desde Banfield, Buenos Aires.
            </p>
            <a href={IG_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 18, display: "inline-flex" }}>
              <Icon name="instagram" size={15} />@holoverse.tcg
            </a>
          </div>
          {cols.map((c) =>
          <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>{c.h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {c.items.map(([label, route, params]: any) => <a key={label} className="muted" style={{ fontSize: 13.5, cursor: "pointer" }} onClick={() => nav(route, params)} role="button">{label}</a>)}
              </div>
            </div>
          )}
        </div>
        <hr className="divider" style={{ margin: "40px 0 22px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="muted" style={{ fontSize: 12.5 }}>© 2026 Holoverse TCG · Banfield, Buenos Aires, Argentina · Precios en ARS y USD</span>
          <span className="muted" style={{ fontSize: 12.5 }}>Garantía de autenticidad</span>
        </div>
      </div>
    </footer>);
}
