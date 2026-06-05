"use client";
/* Menú full-screen escalonado (CSS-driven). */
import React from "react";
import { useHV } from "./context";

export default function StaggeredMenu({ open, onClose }: any) {
  const { nav } = useHV();
  const items = [
    { label: "Magic", route: "browse", params: { game: "mtg" } },
    { label: "Pokémon", route: "browse", params: { game: "poke" } },
    { label: "One Piece", route: "browse", params: { game: "op" } },
    { label: "Sellado", route: "browse", params: { type: "sealed" } },
    { label: "Accesorios", route: "browse", params: { type: "acc" } },
    { label: "Vender", route: "account", params: {} },
    { label: "Cuenta", route: "account", params: {} },
  ];
  const socials = ["Instagram", "Discord", "TikTok", "YouTube"];
  const go = (it) => { onClose(); nav(it.route, it.params); };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`sm-root${open ? " sm-open" : ""}`} aria-hidden={!open}>
      <div className="sm-scrim" onClick={onClose} />
      <div className="sm-prelayer sm-p1" />
      <div className="sm-prelayer sm-p2" />
      <aside className="sm-panel" id="hv-menu" aria-label="Menú principal">
        <div className="sm-eyebrow">Explorar el Holoverse</div>
        <ul className="sm-list">
          {items.map((it, i) => (
            <li className="sm-li" key={it.label}>
              <button className="sm-item" style={{ transitionDelay: open ? `${0.26 + i * 0.06}s` : "0s" }} onClick={() => go(it)}>
                <span className="sm-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="sm-label">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sm-socials">
          <div className="sm-socials-title">Seguinos</div>
          <div className="sm-socials-row">
            {socials.map((s) => <a key={s} className="sm-soc" href="#" onClick={(e) => e.preventDefault()}>{s}</a>)}
          </div>
        </div>
      </aside>
    </div>
  );
}
