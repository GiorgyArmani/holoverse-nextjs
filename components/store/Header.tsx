"use client";
/* Header sticky: barra de anuncio, logo, búsqueda, cuenta, carrito y menú. */
import React, { useState, useEffect } from "react";
import { HV } from "../../lib/data";
import { useHV } from "./context";
import { Icon } from "./ui";

export function Logo({ onClick }: any) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, background: "transparent", border: 0, padding: 0 }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--purple-chrome)", backgroundSize: "220% 100%", animation: "holoShift 7s linear infinite", display: "grid", placeItems: "center", boxShadow: "0 4px 18px rgba(124,92,255,.45), inset 0 1px 0 rgba(255,255,255,.5)" }}>
        <span style={{ width: 13, height: 13, borderRadius: "50% 50% 50% 0", background: "#140f23", transform: "rotate(45deg)" }} />
      </span>
      <span className="chrome-name" style={{ fontFamily: "var(--font-title)", fontWeight: 800, fontSize: 18, letterSpacing: ".26em", textTransform: "uppercase", paddingLeft: 2 }}>Holoverse</span>
    </button>);
}

export default function Header() {
  const { nav, cartCount, openSearch, menuOpen, toggleMenu } = useHV();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40,
      background: scrolled ? "rgba(8,8,13,.82)" : "rgba(8,8,13,.4)",
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`, transition: "all .3s" }}>
      {/* announcement bar */}
      <div style={{ background: "var(--announce-bg, var(--holo))", backgroundSize: "200% 100%", animation: "holoShift 8s linear infinite" }}>
        <div className="wrap hv-announce" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "7px 0", color: "var(--announce-text, #1a1030)", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: ".02em" }}>
          <Icon name="truck" size={15} solid /> {HV.announcement}
        </div>
      </div>
      <div className="wrap hv-header-row" style={{ display: "flex", alignItems: "center", gap: 18, height: 70 }}>
        <Logo onClick={() => nav("home")} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <button onClick={openSearch} className="hv-search-trigger"
          style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", padding: "10px 18px", borderRadius: 12, fontSize: 13.5, width: "min(460px, 100%)", cursor: "pointer" }}>
            <Icon name="search" size={16} /> Buscá cartas, sets, productos…
          </button>
        </div>
        <button className="btn btn-icon" onClick={openSearch} aria-label="Search" style={{ display: "none" }} data-mobile-search><Icon name="search" size={18} /></button>
        <button className="btn btn-icon" onClick={() => nav("account")} aria-label="Account"><Icon name="user" size={18} /></button>
        <button className="btn btn-icon" onClick={() => nav("cart")} aria-label="Cart" style={{ position: "relative" }}>
          <Icon name="cart" size={18} />
          {cartCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--holo)", color: "#0a0a12", fontSize: 11, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 99, display: "grid", placeItems: "center", padding: "0 4px", fontFamily: "var(--font-display)" }}>{cartCount}</span>}
        </button>
        <button className="hv-menu-toggle" onClick={toggleMenu} aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="hv-menu">
          <span className={`hv-burger${menuOpen ? " open" : ""}`}><i /><i /></span>
          <span className="hv-menu-label">{menuOpen ? "Cerrar" : "Menú"}</span>
        </button>
      </div>
    </header>);
}
