"use client";
/* Browse / categorías + resultados de búsqueda, con filtros laterales. */
import React, { useState } from "react";
import { HV } from "../../lib/data";
import { useHV } from "./context";
import { Icon } from "./ui";
import ProductCard from "./ProductCard";

function FilterGroup({ title, children, open: open0 = true }: any) {
  const [open, setOpen] = useState(open0);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 0" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "transparent", border: 0, color: "var(--text)", padding: 0, cursor: "pointer" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--text-3)" }}><Icon name="chevronD" size={16} /></span>
      </button>
      {open && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>}
    </div>
  );
}

function Check({ label, count, checked, onChange, swatch }: any) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13.5, color: checked ? "var(--text)" : "var(--text-2)" }}>
      <span onClick={onChange} style={{ width: 18, height: 18, borderRadius: 6, border: `1px solid ${checked ? "transparent" : "var(--border-strong)"}`, background: checked ? "var(--holo)" : "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0, color: "#0a0a12" }}>
        {checked && <Icon name="check" size={12} stroke={3} solid />}
      </span>
      {swatch && <span className="dot" style={{ width: 9, height: 9, background: swatch, boxShadow: `0 0 8px ${swatch}` }} />}
      <span onClick={onChange} style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="muted" style={{ fontSize: 12 }}>{count}</span>}
    </label>
  );
}

const SORTS = [
  { id: "featured", label: "Destacados" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
  { id: "name", label: "Nombre A–Z" },
];

function BrowseShell({ title, eyebrow, initial = {}, query }: any) {
  const { density } = useHV();
  const [games, setGames] = useState(initial.game ? [initial.game] : []);
  const [types, setTypes] = useState(initial.type ? [initial.type] : []);
  const [rarities, setRarities] = useState([]);
  const [conds, setConds] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [onlyStock, setOnlyStock] = useState(false);
  const [onlyPre, setOnlyPre] = useState(false);
  const [sort, setSort] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  const toggle = (setter, arr) => (v) => setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  let items = HV.all.slice();
  if (query) items = items.filter((x) => (x.name + " " + (x.set || "") + " " + (x.cat || "")).toLowerCase().includes(query.toLowerCase()));
  if (games.length) items = items.filter((x) => games.includes(x.game));
  if (types.length) items = items.filter((x) => types.includes(x.type));
  if (rarities.length) items = items.filter((x) => x.rarity && rarities.includes(x.rarity));
  if (onlyStock) items = items.filter((x) => !x.preorder);
  if (onlyPre) items = items.filter((x) => x.preorder);
  items = items.filter((x) => x.usd <= maxPrice);
  if (sort === "price-asc") items.sort((a, b) => a.usd - b.usd);
  if (sort === "price-desc") items.sort((a, b) => b.usd - a.usd);
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));

  const cols = density === "comfy" ? 3 : density === "dense" ? 5 : 4;
  const activeChips = [
    ...games.map((g) => ({ k: "g" + g, label: HV.GAMES[g].short, clear: () => setGames(games.filter((x) => x !== g)) })),
    ...types.map((t) => ({ k: "t" + t, label: t === "single" ? "Singles" : t === "sealed" ? "Sellado" : "Accesorios", clear: () => setTypes(types.filter((x) => x !== t)) })),
    ...rarities.map((r) => ({ k: "r" + r, label: HV.rarityLabel(r), clear: () => setRarities(rarities.filter((x) => x !== r)) })),
  ];
  const clearAll = () => { setGames([]); setTypes([]); setRarities([]); setConds([]); setMaxPrice(2000); setOnlyStock(false); setOnlyPre(false); };

  const Sidebar = ({ mobile }: any) => (
    <aside style={{ width: mobile ? "100%" : 244, flexShrink: 0 }} className={mobile ? undefined : "hv-filters"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}><Icon name="filter" size={16} />Filtros</span>
        {(activeChips.length > 0 || onlyPre || onlyStock) && <button onClick={clearAll} className="muted" style={{ background: "transparent", border: 0, fontSize: 12.5, cursor: "pointer", color: "var(--violet)" }}>Limpiar</button>}
      </div>
      <FilterGroup title="Juego">
        {Object.values(HV.GAMES).map((g: any) => <Check key={g.id} label={g.label} swatch={g.color} count={HV.all.filter((x) => x.game === g.id).length} checked={games.includes(g.id)} onChange={() => toggle(setGames, games)(g.id)} />)}
      </FilterGroup>
      <FilterGroup title="Tipo de producto">
        {[["single", "Cartas sueltas"], ["sealed", "Producto sellado"], ["acc", "Accesorios"]].map(([id, l]) => <Check key={id} label={l} count={HV.all.filter((x) => x.type === id).length} checked={types.includes(id)} onChange={() => toggle(setTypes, types)(id)} />)}
      </FilterGroup>
      <FilterGroup title="Rareza">
        {[["common", "Common"], ["uncommon", "Uncommon"], ["rare", "Rare"], ["mythic", "Mythic / Chase"]].map(([id, l]) => <Check key={id} label={l} checked={rarities.includes(id)} onChange={() => toggle(setRarities, rarities)(id)} />)}
      </FilterGroup>
      <FilterGroup title="Precio (USD)" open={true}>
        <input type="range" min="10" max="2000" step="10" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} style={{ width: "100%", accentColor: "var(--violet)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-2)" }}><span>US$10</span><span style={{ fontWeight: 700, color: "var(--text)" }}>hasta US${maxPrice}</span></div>
      </FilterGroup>
      <FilterGroup title="Disponibilidad">
        <Check label="En stock" checked={onlyStock} onChange={() => setOnlyStock(!onlyStock)} />
        <Check label="Preventas" checked={onlyPre} onChange={() => setOnlyPre(!onlyPre)} />
      </FilterGroup>
    </aside>
  );

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 20 }}>
      <div style={{ marginBottom: 26 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-sm hv-mobile-filter-btn" style={{ display: "none" }} onClick={() => setMobileFilters(true)}><Icon name="filter" size={15} />Filtros</button>
              <span className="muted" style={{ fontSize: 13.5 }}><b style={{ color: "var(--text)" }}>{items.length}</b> productos</span>
              {activeChips.map((c) => (
                <button key={c.k} onClick={c.clear} className="badge" style={{ cursor: "pointer", textTransform: "none", letterSpacing: 0, fontSize: 12.5, fontFamily: "var(--font-body)", color: "var(--text)" }}>{c.label}<Icon name="close" size={12} /></button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm" onClick={() => setSortOpen(!sortOpen)}>Orden: {SORTS.find((s) => s.id === sort).label}<Icon name="chevronD" size={14} /></button>
              {sortOpen && (
                <div className="panel" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 20, minWidth: 200, padding: 6, boxShadow: "var(--shadow)" }}>
                  {SORTS.map((s) => (
                    <button key={s.id} onClick={() => { setSort(s.id); setSortOpen(false); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", textAlign: "left", background: sort === s.id ? "var(--surface-3)" : "transparent", border: 0, color: "var(--text)", padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13.5 }}>
                      {s.label}{sort === s.id && <Icon name="check" size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* grid */}
          {items.length ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }} className="hv-browse-grid">
              {items.map((it) => <ProductCard key={it.id} item={it} />)}
            </div>
          ) : (
            <div className="panel" style={{ padding: 60, textAlign: "center" }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Sin resultados</h3>
              <p className="muted" style={{ fontSize: 14 }}>Probá quitar un filtro o ampliar el rango de precio.</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={clearAll}>Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      {mobileFilters && (
        <div onClick={() => setMobileFilters(false)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(5,5,9,.6)", backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "min(320px, 86vw)", background: "var(--surface)", borderRight: "1px solid var(--border)", padding: "20px 20px 40px", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 18 }}>Filtros</h3>
              <button className="btn btn-icon btn-sm" onClick={() => setMobileFilters(false)}><Icon name="close" size={16} /></button>
            </div>
            <Sidebar mobile />
            <button className="btn btn-holo btn-block" style={{ marginTop: 18 }} onClick={() => setMobileFilters(false)}>Ver {items.length} productos</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Browse(params) {
  const titleMap = { mtg: "Magic: The Gathering", poke: "Pokémon", op: "One Piece" };
  let title = "Ver todo", eyebrow = "Catálogo";
  if (params.game) { title = titleMap[params.game]; eyebrow = "Juego de cartas"; }
  else if (params.type === "sealed") { title = "Producto sellado y preventas"; eyebrow = "Cajas · ETBs · Bundles"; }
  else if (params.type === "acc") { title = "Accesorios y gear"; eyebrow = "Protegé tu colección"; }
  else if (params.type === "single") { title = "Cartas sueltas"; eyebrow = "Chase · staples · comunes"; }
  return <BrowseShell title={title} eyebrow={eyebrow} initial={params} />;
}

export function SearchResults(params) {
  return <BrowseShell title={params.q ? `Resultados para “${params.q}”` : "Búsqueda"} eyebrow="Búsqueda" query={params.q} />;
}
