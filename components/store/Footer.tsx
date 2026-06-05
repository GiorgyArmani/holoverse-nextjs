"use client";
/* Footer de la tienda. */
import React from "react";
import { useHV } from "./context";
import { Logo } from "./Header";

export default function Footer() {
  const { nav } = useHV();
  const cols = [
  { h: "Tienda", items: ["Magic: The Gathering", "Pokémon", "One Piece", "Producto sellado", "Accesorios", "Preventas"] },
  { h: "Coleccionistas", items: ["Vendénos", "Envíos de grading", "Compra de singles", "Alertas de wantlist", "Guía de condición"] },
  { h: "Soporte", items: ["Envíos y retiro", "Devoluciones", "Seguir pedido", "Contacto", "Preguntas"] }];

  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 80, background: "linear-gradient(180deg, transparent, rgba(139,125,255,.04))" }}>
      <div className="wrap" style={{ padding: "56px 28px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 40 }} className="hv-footer-grid">
          <div>
            <Logo onClick={() => nav("home")} />
            <p className="muted" style={{ fontSize: 13.5, marginTop: 16, maxWidth: 260, lineHeight: 1.6 }}>
              El hogar holográfico para coleccionistas y jugadores de TCG. Singles frescos, producto sellado y accesorios de Magic, Pokémon y One Piece.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
              <span className="gtag"><span className="dot dot-mtg" /></span>
              <span className="gtag"><span className="dot dot-poke" /></span>
              <span className="gtag"><span className="dot dot-op" /></span>
            </div>
          </div>
          {cols.map((c) =>
          <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>{c.h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {c.items.map((i) => <a key={i} className="muted" style={{ fontSize: 13.5 }} onClick={() => nav("browse")} role="button">{i}</a>)}
              </div>
            </div>
          )}
        </div>
        <hr className="divider" style={{ margin: "40px 0 22px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="muted" style={{ fontSize: 12.5 }}>© 2026 Holoverse TCG · Buenos Aires, Argentina · Precios en ARS y USD</span>
          <span className="muted" style={{ fontSize: 12.5, display: "flex", gap: 18 }}><span>Privacidad</span><span>Términos</span><span>Garantía de autenticidad</span></span>
        </div>
      </div>
    </footer>);
}
