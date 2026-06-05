"use client";
/* Alta de producto: campos según tipo, rarezas reales por juego,
   imagen por URL o subida al bucket. Singles crean su condición NM inicial. */
import React, { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { RARITIES } from "../../lib/rarities";
import { Input, Select, Toggle, ImageField, GAME_LABEL } from "./ui";
import ScryfallSearch from "./ScryfallSearch";
import PokemonSearch from "./PokemonSearch";
import OnePieceSearch from "./OnePieceSearch";

export default function NewProductForm({ onSaved, toast, onClose }: any) {
  const [f, setF] = useState<any>({ type: "single", game: "mtg", name: "", sku: "", set_name: "", set_code: "", card_number: "", rarity: "rare", kind: "", category: "", variant_color: "", price_usd: "", stock: 0, image_url: "", is_foil: false, is_preorder: false, release_date: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const setGame = (g: string) => setF((x: any) => ({ ...x, game: g, rarity: (RARITIES[g] || []).find((r: any) => r.tier === "rare")?.code || "" }));
  const rarities = RARITIES[f.game] || [];

  /* impresión elegida en Scryfall → autocompleta el formulario */
  const applyScryfall = (c: any) => {
    setF((x: any) => ({
      ...x,
      name: c.name, set_name: c.set_name, set_code: c.set_code, card_number: c.card_number,
      rarity: c.rarity, image_url: c.image || x.image_url,
      is_foil: x.is_foil || (!c.usd && !!c.usd_foil), // solo-foil → marcar foil
      price_usd: ((x.is_foil || (!c.usd && !!c.usd_foil)) ? (c.usd_foil ?? c.usd) : (c.usd ?? c.usd_foil)) ?? x.price_usd,
    }));
    toast(`${c.name} (${c.set_code}) importado de Scryfall ✦`);
  };

  /* carta elegida en TCGdex (Pokémon) → autocompleta el formulario */
  const applyPokemon = (c: any) => {
    setF((x: any) => ({
      ...x,
      name: c.name, set_name: c.set_name, set_code: c.set_code, card_number: c.card_number,
      rarity: c.rarity, image_url: c.image || x.image_url,
      price_usd: c.usd ?? x.price_usd,
    }));
    toast(`${c.name} (${c.set_code}) importado de TCGdex ✦${c.usd ? "" : " — sin precio de mercado, cargalo a mano"}`);
  };

  /* carta elegida en apitcg (One Piece) → autocompleta el formulario */
  const applyOnePiece = (c: any) => {
    setF((x: any) => ({
      ...x,
      name: c.name, set_name: c.set_name, set_code: c.set_code, card_number: c.card_number,
      rarity: c.rarity, image_url: c.image || x.image_url,
    }));
    toast(`${c.name} (${c.card_number}) importado de apitcg ✦ — cargá el precio a mano`);
  };

  const save = async () => {
    if (!f.name || f.price_usd === "") { toast("Completá al menos nombre y precio"); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    const row: any = {
      type: f.type, name: f.name, sku: f.sku || null, price_usd: Number(f.price_usd),
      stock: Number(f.stock) || 0, image_url: f.image_url || null,
      game: f.type === "accessory" ? null : f.game,
      set_name: f.set_name || null, set_code: f.set_code || null,
      card_number: f.type === "single" ? f.card_number || null : null,
      rarity: f.type === "single" ? f.rarity || null : null,
      is_foil: f.type === "single" ? f.is_foil : false,
      kind: f.type === "sealed" ? f.kind || null : null,
      is_preorder: f.type === "sealed" ? f.is_preorder : false,
      release_date: f.type === "sealed" && f.is_preorder && f.release_date ? f.release_date : null,
      category: f.type === "accessory" ? f.category || null : null,
      variant_color: f.type === "accessory" ? f.variant_color || null : null,
    };
    const { data, error } = await sb.from("products").insert(row).select().single();
    if (!error && f.type === "single" && data) {
      await sb.from("product_conditions").insert({ product_id: data.id, condition: "NM", price_usd: Number(f.price_usd), stock: Number(f.stock) || 0 });
    }
    setBusy(false);
    if (error) toast("Error: " + error.message);
    else { toast(`${f.name} creado ✦`); onSaved(); onClose(); }
  };

  return (
    <div className="ff-panel ff-corner" style={{ padding: 22, borderColor: "rgba(216,196,137,.55)" }}>
      <h3 className="ff-h" style={{ fontSize: 14, marginBottom: 4, textAlign: "center" }}>Forjar nuevo producto</h3>
      <hr className="ff-hr" style={{ margin: "10px 0 18px" }} />
      {f.type === "single" && f.game === "mtg" && <ScryfallSearch onPick={applyScryfall} />}
      {f.type === "single" && f.game === "poke" && <PokemonSearch onPick={applyPokemon} />}
      {f.type === "single" && f.game === "op" && <OnePieceSearch onPick={applyOnePiece} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="hv-acc-grid">
        <Select label="Tipo" value={f.type} onChange={(e: any) => set("type", e.target.value)}>
          <option value="single">Single</option><option value="sealed">Sellado</option><option value="accessory">Accesorio</option>
        </Select>
        {f.type !== "accessory" && (
          <Select label="Juego" value={f.game} onChange={(e: any) => setGame(e.target.value)}>
            <option value="mtg">Magic</option><option value="poke">Pokémon</option><option value="op">One Piece</option>
          </Select>
        )}
        <Input label="SKU (opcional)" value={f.sku} onChange={(e: any) => set("sku", e.target.value)} placeholder="s19" />
        <Input label="Precio USD" type="number" step="0.01" min="0" value={f.price_usd} onChange={(e: any) => set("price_usd", e.target.value)} />
        <Input label="Nombre" style={{ gridColumn: "span 2" }} value={f.name} onChange={(e: any) => set("name", e.target.value)} />
        {f.type !== "accessory" && <Input label="Set" value={f.set_name} onChange={(e: any) => set("set_name", e.target.value)} />}
        {f.type !== "accessory" && <Input label="Código de set" value={f.set_code} onChange={(e: any) => set("set_code", e.target.value)} placeholder="MH3" />}
        {f.type === "single" && <Input label="N° de carta" value={f.card_number} onChange={(e: any) => set("card_number", e.target.value)} placeholder="138/303" />}
        {f.type === "single" && (
          <Select label={`Rareza (${GAME_LABEL[f.game]})`} value={f.rarity} onChange={(e: any) => set("rarity", e.target.value)}>
            {rarities.map((r: any) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </Select>
        )}
        {f.type === "sealed" && <Input label="Contenido" value={f.kind} onChange={(e: any) => set("kind", e.target.value)} placeholder="Caja booster · 24 sobres" />}
        {f.type === "accessory" && <Input label="Categoría" value={f.category} onChange={(e: any) => set("category", e.target.value)} placeholder="Fundas" />}
        {f.type === "accessory" && <Input label="Variante / color" value={f.variant_color} onChange={(e: any) => set("variant_color", e.target.value)} />}
        <Input label={f.type === "single" ? "Stock inicial (NM)" : "Stock"} type="number" min="0" value={f.stock} onChange={(e: any) => set("stock", e.target.value)} />
        {f.type === "sealed" && f.is_preorder && <Input label="Fecha de salida" type="date" value={f.release_date} onChange={(e: any) => set("release_date", e.target.value)} />}
        <div style={{ gridColumn: "span 2" }}>
          <ImageField value={f.image_url} onChange={(v: any) => set("image_url", v)} toast={toast} hint={f.sku || f.name} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
        {f.type === "single" && <Toggle label="Foil" checked={f.is_foil} onChange={() => set("is_foil", !f.is_foil)} />}
        {f.type === "sealed" && <Toggle label="Preventa" checked={f.is_preorder} onChange={() => set("is_preorder", !f.is_preorder)} />}
        <span style={{ flex: 1 }} />
        <button className="ff-btn" onClick={onClose}>Cancelar</button>
        <button className="ff-btn ff-btn-gold" disabled={busy} onClick={save}>{busy ? "Forjando…" : "✦ Crear producto"}</button>
      </div>
    </div>
  );
}
