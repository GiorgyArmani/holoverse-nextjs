"use client";
/* Configuración del sitio: cotización, envío, anuncio (site_settings). */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { Input } from "./ui";

export default function SettingsTab({ toast }: any) {
  const [f, setF] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabaseBrowser().from("site_settings").select("*").eq("id", 1).single()
      .then(({ data, error }: any) => {
        if (error) toast("Error cargando configuración: " + error.message);
        setF(data || {});
      });
  }, []);

  if (!f) return <p className="muted">Invocando…</p>;
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  const save = async () => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("site_settings").update({
      usd_ars_rate: Number(f.usd_ars_rate), flat_shipping_usd: Number(f.flat_shipping_usd),
      free_shipping_threshold_ars: Number(f.free_shipping_threshold_ars), announcement: f.announcement,
    }).eq("id", 1);
    setBusy(false);
    if (error) toast("Error: " + error.message);
    else toast("Configuración guardada ✦");
  };

  return (
    <div className="ff-panel ff-corner" style={{ padding: 24, maxWidth: 640 }}>
      <h3 className="ff-h" style={{ fontSize: 14, textAlign: "center" }}>Configuración del reino</h3>
      <hr className="ff-hr" style={{ margin: "12px 0 20px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Cotización USD → ARS" type="number" step="0.01" min="0" value={f.usd_ars_rate} onChange={(e: any) => set("usd_ars_rate", e.target.value)} />
        <Input label="Costo de envío (USD)" type="number" step="0.01" min="0" value={f.flat_shipping_usd} onChange={(e: any) => set("flat_shipping_usd", e.target.value)} />
        <Input label="Envío gratis desde (ARS)" type="number" min="0" value={f.free_shipping_threshold_ars} onChange={(e: any) => set("free_shipping_threshold_ars", e.target.value)} style={{ gridColumn: "span 2" }} />
        <Input label="Barra de anuncio" value={f.announcement || ""} onChange={(e: any) => set("announcement", e.target.value)} style={{ gridColumn: "span 2" }} />
      </div>
      <button className="ff-btn ff-btn-gold" style={{ marginTop: 20 }} disabled={busy} onClick={save}>{busy ? "Guardando…" : "✦ Guardar configuración"}</button>
    </div>
  );
}
