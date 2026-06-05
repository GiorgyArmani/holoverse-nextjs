"use client";
/* Piezas compartidas del panel admin: helpers de formato,
   mapas de estado y controles base (estética FF en globals.css). */
import React, { useState, useRef } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";

export const fmtArs = (n: any) => "$" + Math.round(Number(n || 0)).toLocaleString("es-AR");
export const fmtUsd = (n: any) => "US$" + Number(n || 0).toFixed(2);
export const fmtDate = (iso: any) => iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "";

export const GAME_LABEL: any = { mtg: "Magic", poke: "Pokémon", op: "One Piece" };
export const TYPE_LABEL: any = { single: "Single", sealed: "Sellado", accessory: "Accesorio" };
export const ORDER_STATUS: any = {
  pending: ["Pendiente", "#e8c878"], paid: ["Pagado", "#b9a6ff"], processing: ["Procesando", "#b9a6ff"],
  shipped: ["Enviado", "#7fd8f2"], delivered: ["Entregado", "#9fe8b0"], cancelled: ["Cancelado", "#ff8a8a"],
};
export const SUB_STATUS: any = {
  pending: ["Pendiente", "#e8c878"], accepted: ["Oferta enviada", "#7fd8f2"],
  rejected: ["Rechazada", "#ff8a8a"], paid: ["Pagada", "#9fe8b0"],
};

/* stock total: singles suman sus condiciones; el resto usa products.stock */
export const stockOf = (p: any) =>
  p.type === "single" ? (p.product_conditions || []).reduce((n: number, c: any) => n + c.stock, 0) : p.stock;

export function Badge({ map, k }: any) {
  const [label, color] = map[k] || [k, "#9a96b5"];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 3, fontSize: 11.5, fontWeight: 700, fontFamily: "var(--font-display)", color, border: `1px solid ${color}55`, background: `${color}14`, whiteSpace: "nowrap" }}>{label}</span>;
}

export function Input({ label, style, ...rest }: any) {
  return (
    <label style={{ display: "block", ...style }}>
      {label && <span className="ff-eyebrow" style={{ display: "block", marginBottom: 6 }}>{label}</span>}
      <input className="input" {...rest} />
    </label>
  );
}

export function Select({ label, style, children, ...rest }: any) {
  return (
    <label style={{ display: "block", ...style }}>
      {label && <span className="ff-eyebrow" style={{ display: "block", marginBottom: 6 }}>{label}</span>}
      <select className="input" {...rest}>{children}</select>
    </label>
  );
}

export function Toggle({ label, checked, onChange }: any) {
  return (
    <button onClick={onChange} className="ff-chip" style={{
      color: checked ? "#f0e2ad" : "var(--text-3)",
      borderColor: checked ? "rgba(216,196,137,.65)" : "rgba(216,196,137,.2)",
      background: checked ? "rgba(216,196,137,.13)" : "transparent" }}>
      {checked ? "✦ " : ""}{label}
    </button>
  );
}

/* imagen: URL externa o subida al bucket público `product-images` */
export function ImageField({ value, onChange, toast, hint }: any) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<any>(null);

  const upload = async (file: any) => {
    if (!file) return;
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safe = (hint || "prod").toString().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "prod";
    const path = `${safe}-${Date.now()}.${ext}`;
    const sb = supabaseBrowser();
    const { error } = await sb.storage.from("product-images").upload(path, file, { upsert: true, cacheControl: "31536000" });
    if (error) toast("Error subiendo imagen: " + error.message);
    else {
      const { data } = sb.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
      toast("Imagen subida al bucket ✓");
    }
    setBusy(false);
  };

  return (
    <div>
      <span className="ff-eyebrow" style={{ display: "block", marginBottom: 6 }}>Imagen</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {value ? (
          <img src={value} alt="" style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(216,196,137,.35)", flexShrink: 0 }} />
        ) : (
          <span style={{ width: 44, height: 60, borderRadius: 3, border: "1px dashed rgba(216,196,137,.3)", display: "grid", placeItems: "center", fontSize: 9, color: "var(--text-4)", flexShrink: 0 }}>sin img</span>
        )}
        <input className="input" style={{ flex: 1 }} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL externa o subí un archivo →" />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e: any) => upload(e.target.files?.[0])} />
        <button className="ff-btn ff-btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Subiendo…" : "Subir"}</button>
      </div>
      <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 5 }}>Ideal: .webp ~800px. Va al bucket público «product-images».</span>
    </div>
  );
}
