"use client";
/* Header sticky: barra de anuncio, logo, búsqueda, cuenta, carrito y menú. */
import React, { useState, useEffect, useCallback } from "react";
import { HV } from "../../lib/data";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { useHV } from "./context";
import { Icon } from "./ui";

const fmtAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "recién"; if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`; return `${Math.floor(s / 86400)} d`;
};

function NotificationBell() {
  const { user, nav } = useHV();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabaseBrowser().from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setItems(data || []);
  }, [user]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [user, load]);

  if (!user) return null;
  const unread = items.filter((n) => !n.read).length;

  const toggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread) {
      await supabaseBrowser().from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      setItems((xs) => xs.map((n) => ({ ...n, read: true })));
    }
  };
  const go = (n: any) => {
    setOpen(false);
    if (n.kind && String(n.kind).startsWith("admin_")) { window.location.href = "/admin"; return; }
    if (n.listing_id) nav("listing", { id: n.listing_id });
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="btn btn-icon" onClick={toggle} aria-label="Notificaciones" style={{ position: "relative" }}>
        <Icon name="bell" size={18} />
        {unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--holo)", color: "#0a0a12", fontSize: 10.5, fontWeight: 800, minWidth: 17, height: 17, borderRadius: 99, display: "grid", placeItems: "center", padding: "0 4px", fontFamily: "var(--font-display)" }}>{unread}</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 45 }} />
          <div className="panel" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 46, width: 320, maxHeight: 420, overflowY: "auto", boxShadow: "var(--shadow-lg)", padding: 8 }}>
            <div className="eyebrow" style={{ padding: "8px 10px" }}>Notificaciones</div>
            {items.length === 0 ? <p className="muted" style={{ fontSize: 13, padding: "12px 10px" }}>No tenés notificaciones.</p>
              : items.map((n) => (
                <button key={n.id} onClick={() => go(n)} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "10px 11px", borderRadius: 10, cursor: n.listing_id ? "pointer" : "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--violet)", marginTop: 1 }}><Icon name="spark" size={14} /></span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, display: "block" }}>{n.title}</span>
                      {n.body && <span className="muted" style={{ fontSize: 12, display: "block", marginTop: 1 }}>{n.body}</span>}
                      <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 2 }}>{fmtAgo(n.created_at)}</span>
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

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
        <NotificationBell />
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
