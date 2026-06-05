"use client";
/* Inventario: búsqueda + filtros (tipo, juego, rareza, estado,
   stock, flags) + orden + alta de producto. */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { RARITIES } from "../../lib/rarities";
import { findImageForSingle } from "../../lib/bulk-images";
import { stockOf } from "./ui";
import ProductRow from "./ProductRow";
import NewProductForm from "./NewProductForm";

const SORTS: any = {
  recent: ["Más recientes", (a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at)],
  name: ["Nombre A–Z", (a: any, b: any) => a.name.localeCompare(b.name)],
  "price-asc": ["Precio ↑", (a: any, b: any) => Number(a.price_usd) - Number(b.price_usd)],
  "price-desc": ["Precio ↓", (a: any, b: any) => Number(b.price_usd) - Number(a.price_usd)],
  "stock-asc": ["Menos stock primero", (a: any, b: any) => stockOf(a) - stockOf(b)],
};

const initialFilters = { q: "", type: "all", game: "all", rarity: "all", vis: "all", stock: "all", flag: "all", sort: "recent" };

export default function ProductsTab({ toast }: any) {
  const [products, setProducts] = useState<any>(null);
  const [fl, setFl] = useState<any>(initialFilters);
  const [showNew, setShowNew] = useState(false);
  const [bulk, setBulk] = useState("");
  const set = (k: string, v: any) => setFl((x: any) => ({ ...x, [k]: v, ...(k === "game" ? { rarity: "all" } : {}) }));

  const load = async () => {
    const { data, error } = await supabaseBrowser().from("products")
      .select("*, product_conditions(condition, price_usd, stock)")
      .order("created_at", { ascending: true });
    if (error) toast("Error cargando productos: " + error.message);
    setProducts(data || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = (products || [])
    .filter((p: any) => fl.type === "all" || p.type === fl.type)
    .filter((p: any) => fl.game === "all" || p.game === fl.game)
    .filter((p: any) => fl.rarity === "all" || p.rarity === fl.rarity)
    .filter((p: any) => fl.vis === "all" || (fl.vis === "on" ? p.is_active : !p.is_active))
    .filter((p: any) => {
      if (fl.stock === "all") return true;
      const s = stockOf(p);
      if (fl.stock === "in") return s > 0;
      if (fl.stock === "out") return s === 0;
      return s > 0 && s <= 3; // low
    })
    .filter((p: any) => {
      if (fl.flag === "all") return true;
      if (fl.flag === "hot") return p.is_hot;
      if (fl.flag === "new") return p.is_new;
      if (fl.flag === "pre") return p.is_preorder;
      return p.sale_price_usd != null; // sale
    })
    .filter((p: any) => !fl.q || (p.name + " " + (p.sku || "") + " " + (p.set_name || "") + " " + (p.category || "")).toLowerCase().includes(fl.q.toLowerCase()))
    .sort(SORTS[fl.sort][1]);

  const rarities = fl.game === "all" ? [] : (RARITIES[fl.game] || []);
  const dirty = JSON.stringify(fl) !== JSON.stringify(initialFilters);

  /* bulk: buscar imagen para todos los singles sin foto (match exacto set+número) */
  const fillImages = async () => {
    const targets = (products || []).filter((p: any) => p.type === "single" && !p.image_url);
    if (!targets.length) { toast("No hay singles sin imagen ✦"); return; }
    const misses: string[] = [];
    let done = 0, found = 0;
    for (const p of targets) {
      setBulk(`${done + 1}/${targets.length}: ${p.name.slice(0, 28)}…`);
      const img = await findImageForSingle(p);
      if (img) {
        const { error } = await supabaseBrowser().from("products").update({ image_url: img }).eq("id", p.id);
        if (!error) found++; else misses.push(p.name);
      } else misses.push(p.name);
      done++;
    }
    setBulk("");
    toast(`✦ ${found} imágenes agregadas${misses.length ? ` · sin match: ${misses.slice(0, 3).join(", ")}${misses.length > 3 ? ` y ${misses.length - 3} más` : ""}` : ""}`);
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="ff-panel" style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input className="input" style={{ width: 230 }} placeholder="Buscar nombre, SKU, set…" value={fl.q} onChange={(e) => set("q", e.target.value)} />
        <select className="input" style={{ width: 120 }} value={fl.type} onChange={(e) => set("type", e.target.value)}>
          <option value="all">Tipo: todos</option><option value="single">Singles</option><option value="sealed">Sellado</option><option value="accessory">Accesorios</option>
        </select>
        <select className="input" style={{ width: 130 }} value={fl.game} onChange={(e) => set("game", e.target.value)}>
          <option value="all">Juego: todos</option><option value="mtg">Magic</option><option value="poke">Pokémon</option><option value="op">One Piece</option>
        </select>
        <select className="input" style={{ width: 170 }} value={fl.rarity} onChange={(e) => set("rarity", e.target.value)} disabled={!rarities.length} title={rarities.length ? "" : "Elegí un juego primero"}>
          <option value="all">{rarities.length ? "Rareza: todas" : "Rareza (elegí juego)"}</option>
          {rarities.map((r: any) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </select>
        <select className="input" style={{ width: 130 }} value={fl.vis} onChange={(e) => set("vis", e.target.value)}>
          <option value="all">Estado: todos</option><option value="on">Visibles</option><option value="off">Ocultos</option>
        </select>
        <select className="input" style={{ width: 140 }} value={fl.stock} onChange={(e) => set("stock", e.target.value)}>
          <option value="all">Stock: todos</option><option value="in">Con stock</option><option value="low">Stock bajo (≤3)</option><option value="out">Sin stock</option>
        </select>
        <select className="input" style={{ width: 130 }} value={fl.flag} onChange={(e) => set("flag", e.target.value)}>
          <option value="all">Flags: todos</option><option value="hot">🔥 Hot</option><option value="new">Nuevos</option><option value="pre">Preventas</option><option value="sale">En oferta</option>
        </select>
        <select className="input" style={{ width: 170 }} value={fl.sort} onChange={(e) => set("sort", e.target.value)}>
          {Object.keys(SORTS).map((s) => <option key={s} value={s}>Orden: {SORTS[s][0]}</option>)}
        </select>
        <span className="muted" style={{ fontSize: 13 }}>{filtered.length} de {(products || []).length}</span>
        {dirty && <button className="ff-btn ff-btn-sm" onClick={() => setFl(initialFilters)}>Limpiar</button>}
        <span style={{ flex: 1 }} />
        {bulk
          ? <span className="muted" style={{ fontSize: 12.5 }}>🖼 Buscando {bulk}</span>
          : <button className="ff-btn" onClick={fillImages} title="Busca imagen en Scryfall / TCGdex / apitcg para cada single sin foto">🖼 Completar imágenes</button>}
        <button className="ff-btn ff-btn-gold" onClick={() => setShowNew(!showNew)}>✦ Nuevo producto</button>
      </div>

      {showNew && <NewProductForm onSaved={load} toast={toast} onClose={() => setShowNew(false)} />}
      {products === null ? <p className="muted">Invocando catálogo…</p> :
        filtered.length === 0 ? <div className="ff-panel" style={{ padding: 46, textAlign: "center" }}><p className="muted">Ningún producto coincide con los filtros.</p></div> :
        filtered.map((p: any) => <ProductRow key={p.id} p={p} onSaved={load} toast={toast} />)}
    </div>
  );
}
