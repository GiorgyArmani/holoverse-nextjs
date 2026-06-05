"use client";
/* Fila editable del inventario + editor de condiciones (singles). */
import React, { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { revalidateHome } from "../../lib/revalidate-home";
import { rarityInfo } from "../../lib/rarities";
import { Input, Toggle, ImageField, GAME_LABEL, TYPE_LABEL, stockOf } from "./ui";

function ConditionsEditor({ product, onSaved, toast }: any) {
  const [rows, setRows] = useState((product.product_conditions || []).map((c: any) => ({ condition: c.condition, price_usd: c.price_usd, stock: c.stock })));
  const [busy, setBusy] = useState(false);
  const set = (i: number, k: string, v: any) => setRows((r: any) => r.map((x: any, j: number) => j === i ? { ...x, [k]: v } : x));
  const used = rows.map((r: any) => r.condition);

  const save = async () => {
    setBusy(true);
    const sb = supabaseBrowser();
    await sb.from("product_conditions").delete().eq("product_id", product.id);
    const clean = rows.filter((r: any) => r.condition && r.price_usd !== "" && r.price_usd != null)
      .map((r: any) => ({ product_id: product.id, condition: r.condition, price_usd: Number(r.price_usd), stock: Number(r.stock) || 0 }));
    const { error } = clean.length ? await sb.from("product_conditions").insert(clean) : { error: null } as any;
    setBusy(false);
    if (error) toast("Error: " + error.message);
    else { toast("Condiciones guardadas"); revalidateHome(); onSaved(); }
  };

  return (
    <div>
      <span className="ff-eyebrow" style={{ display: "block", marginBottom: 10 }}>Condiciones · precio y stock</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r: any, i: number) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select className="input" style={{ width: 80 }} value={r.condition} onChange={(e) => set(i, "condition", e.target.value)}>
              {["NM", "LP", "MP", "HP"].map((c) => <option key={c} value={c} disabled={used.includes(c) && r.condition !== c}>{c}</option>)}
            </select>
            <input className="input" style={{ width: 110 }} type="number" step="0.01" min="0" value={r.price_usd} onChange={(e) => set(i, "price_usd", e.target.value)} placeholder="USD" />
            <input className="input" style={{ width: 80 }} type="number" min="0" value={r.stock} onChange={(e) => set(i, "stock", e.target.value)} placeholder="Stock" />
            <button className="ff-btn ff-btn-sm" onClick={() => setRows((x: any) => x.filter((_: any, j: number) => j !== i))}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {rows.length < 4 && <button className="ff-btn ff-btn-sm" onClick={() => setRows((r: any) => [...r, { condition: ["NM", "LP", "MP", "HP"].find((c) => !used.includes(c)), price_usd: "", stock: 0 }])}>+ Condición</button>}
        <button className="ff-btn ff-btn-sm ff-btn-gold" disabled={busy} onClick={save}>{busy ? "Guardando…" : "Guardar condiciones"}</button>
      </div>
    </div>
  );
}

export default function ProductRow({ p, onSaved, toast }: any) {
  const [f, setF] = useState({ name: p.name, price_usd: p.price_usd, sale_price_usd: p.sale_price_usd ?? "", stock: p.stock, is_hot: p.is_hot, is_new: p.is_new, is_preorder: p.is_preorder, is_active: p.is_active, image_url: p.image_url ?? "" });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  const save = async () => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("products").update({
      name: f.name, price_usd: Number(f.price_usd), sale_price_usd: f.sale_price_usd === "" ? null : Number(f.sale_price_usd),
      stock: Number(f.stock) || 0, is_hot: f.is_hot, is_new: f.is_new, is_preorder: f.is_preorder, is_active: f.is_active,
      image_url: f.image_url || null,
    }).eq("id", p.id);
    setBusy(false);
    if (error) toast("Error: " + error.message);
    else { toast(`${f.name} guardado`); revalidateHome(); onSaved(); }
  };

  /* eliminar definitivo; si tiene pedidos asociados la FK lo bloquea → sugerir deslistar.
     .select() devuelve las filas borradas: si vuelve vacío, el RLS lo bloqueó en silencio. */
  const del = async () => {
    if (!window.confirm(`¿Eliminar definitivamente «${p.name}»?\n\nEsta acción no se puede deshacer. Si solo querés sacarlo de la tienda, usá el toggle «Visible».`)) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().from("products").delete().eq("id", p.id).select("id");
    setBusy(false);
    if (error) {
      console.error("[admin] delete product:", error);
      toast(error.code === "23503" || error.message.includes("foreign key")
        ? "No se puede eliminar: tiene pedidos o ventas asociadas. Desactivá «Visible» para deslistarlo."
        : `Error al eliminar: ${error.message} (código ${error.code || "?"})`);
    } else if (!data || data.length === 0) {
      toast("La base no permitió el borrado: tu sesión no tiene permisos de admin activos. Cerrá sesión y volvé a entrar.");
    } else { toast(`${p.name} eliminado de la bóveda`); revalidateHome(); onSaved(); }
  };

  const totalStock = stockOf(p);
  const ri = p.rarity ? rarityInfo(p.game, p.rarity) : null;

  return (
    <div className="ff-panel" style={{ padding: "14px 18px", opacity: f.is_active ? 1 : .55 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {f.image_url ? <img src={f.image_url} alt="" style={{ width: 34, height: 47, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(216,196,137,.3)" }} />
          : <span style={{ width: 34, height: 47, borderRadius: 3, border: "1px dashed rgba(216,196,137,.25)", flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {p.sku && <span className="muted" style={{ fontFamily: "ui-monospace,monospace", fontSize: 11 }}>{p.sku}</span>}
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5 }}>{p.name}</span>
            {ri && <span style={{ fontSize: 10.5, color: "#d9c489", border: "1px solid rgba(216,196,137,.4)", borderRadius: 3, padding: "1px 7px", fontWeight: 700 }}>{ri.short}</span>}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {TYPE_LABEL[p.type]}{p.game ? ` · ${GAME_LABEL[p.game]}` : ""}{p.set_name ? ` · ${p.set_name}` : ""}{p.category ? ` · ${p.category}` : ""} · stock {totalStock}
          </div>
        </div>
        <Input style={{ width: 100 }} label="Precio USD" type="number" step="0.01" min="0" value={f.price_usd} onChange={(e: any) => set("price_usd", e.target.value)} />
        <Input style={{ width: 100 }} label="Oferta USD" type="number" step="0.01" min="0" value={f.sale_price_usd} onChange={(e: any) => set("sale_price_usd", e.target.value)} placeholder="—" />
        {p.type !== "single" && <Input style={{ width: 80 }} label="Stock" type="number" min="0" value={f.stock} onChange={(e: any) => set("stock", e.target.value)} />}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Toggle label="Hot" checked={f.is_hot} onChange={() => set("is_hot", !f.is_hot)} />
          <Toggle label="Nuevo" checked={f.is_new} onChange={() => set("is_new", !f.is_new)} />
          {p.type === "sealed" && <Toggle label="Preventa" checked={f.is_preorder} onChange={() => set("is_preorder", !f.is_preorder)} />}
          <Toggle label="Visible" checked={f.is_active} onChange={() => set("is_active", !f.is_active)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ff-btn ff-btn-sm" onClick={() => setOpen(!open)}>{open ? "Cerrar" : "Detalles"}</button>
          <button className="ff-btn ff-btn-sm ff-btn-gold" disabled={busy} onClick={save}>{busy ? "…" : "Guardar"}</button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(216,196,137,.18)", display: "grid", gridTemplateColumns: p.type === "single" ? "1fr 1fr" : "1fr", gap: 18 }} className="hv-checkout-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Nombre" value={f.name} onChange={(e: any) => set("name", e.target.value)} />
            <ImageField value={f.image_url} onChange={(v: any) => set("image_url", v)} toast={toast} hint={p.sku || p.name} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <button className="ff-btn ff-btn-sm" disabled={busy} style={{ color: "#ff8a8a", borderColor: "rgba(255,138,138,.45)" }} onClick={del}>✕ Eliminar producto</button>
              <span className="muted" style={{ fontSize: 11.5 }}>Para deslistarlo sin borrarlo, apagá «Visible» y guardá.</span>
            </div>
          </div>
          {p.type === "single" && <ConditionsEditor product={p} onSaved={onSaved} toast={toast} />}
        </div>
      )}
    </div>
  );
}
