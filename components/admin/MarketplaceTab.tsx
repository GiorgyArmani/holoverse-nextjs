"use client";
/* Marketplace P2P: cola de auditoría de cartas en consignación.
   Recibir → Aprobar (con sello + grade + snapshot de comisión) / Rechazar.
   Al aprobar, un trigger en la DB notifica a quien la tenga en su wishlist. */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { fmtUsd, fmtDate, GAME_LABEL } from "./ui";

const STATUS: any = {
  submitted: ["Por recibir", "#e8c878"], received: ["Recibida", "#7fd8f2"],
  approved: ["A la venta", "#9fe8b0"], rejected: ["Rechazada", "#ff8a8a"],
  withdrawn: ["Retirada", "#9a93b8"], sold: ["Vendida", "#9fe8b0"],
};

function MarketRow({ it, commission, selfId, onChanged, toast }: any) {
  const [grade, setGrade] = useState(it.grade || "NM verificada");
  const [seal, setSeal] = useState(it.quality_seal ?? true);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const photos: string[] = it.photo_urls || [];
  const owner = it.profiles || {};

  const patch = async (data: any, msg: string) => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("collection_items")
      .update({ ...data, reviewed_by: selfId, reviewed_at: new Date().toISOString() }).eq("id", it.id);
    setBusy(false);
    if (error) toast("Error: " + error.message); else { toast(msg); onChanged(); }
  };

  return (
    <div className="ff-panel" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {photos.length ? photos.slice(0, 3).map((p) => (
            <a key={p} href={p} target="_blank" rel="noreferrer" style={{ width: 54, height: 74, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(216,196,137,.3)", display: "block" }}>
              <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </a>
          )) : <span style={{ width: 54, height: 74, borderRadius: 4, border: "1px dashed rgba(216,196,137,.3)", display: "grid", placeItems: "center", fontSize: 9, color: "var(--text-4)" }}>sin fotos</span>}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{it.name}{it.is_foil ? " ✦ foil" : ""}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {[GAME_LABEL[it.game], it.set_name, it.card_number, it.condition].filter(Boolean).join(" · ")}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            @{owner.handle || "—"} · {owner.full_name || owner.email || "—"} · {fmtDate(it.created_at)}
          </div>
          {it.description && <div className="muted" style={{ fontSize: 12.5, marginTop: 6, fontStyle: "italic" }}>«{it.description}»</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{it.price_usd != null ? fmtUsd(it.price_usd) : "—"}</div>
          <div className="muted" style={{ fontSize: 11 }}>comisión {it.commission_pct ?? commission}% → neto {it.price_usd != null ? fmtUsd(Number(it.price_usd) * (1 - (it.commission_pct ?? commission) / 100)) : "—"}</div>
          <span style={{ marginTop: 6, display: "inline-block", fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 4, border: `1px solid ${(STATUS[it.status] || [])[1] + "66"}`, color: (STATUS[it.status] || [])[1] }}>{(STATUS[it.status] || [it.status])[0]}</span>
        </div>
      </div>

      {it.status === "submitted" && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="ff-btn ff-btn-sm" disabled={busy} onClick={() => patch({ status: "received" }, "Marcada como recibida")}>Marcar recibida</button>
          <button className="ff-btn ff-btn-sm" disabled={busy} style={{ color: "#ff8a8a", borderColor: "rgba(255,138,138,.4)" }} onClick={() => patch({ status: "rejected", audit_notes: reason || null }, "Rechazada")}>Rechazar</button>
          <input className="input" style={{ flex: 1, maxWidth: 240 }} placeholder="Motivo de rechazo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}

      {it.status === "received" && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid rgba(216,196,137,.15)", paddingTop: 12 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            <input type="checkbox" checked={seal} onChange={(e) => setSeal(e.target.checked)} /> Sello Holoverse
          </label>
          <input className="input" style={{ width: 170 }} placeholder="Grade / condición" value={grade} onChange={(e) => setGrade(e.target.value)} />
          <button className="ff-btn ff-btn-sm ff-btn-gold" disabled={busy} onClick={() => patch({ status: "approved", quality_seal: seal, grade: grade.trim() || null, commission_pct: commission }, "Aprobada ✦ — notificamos a la wishlist")}>✦ Aprobar y publicar</button>
          <input className="input" style={{ flex: 1, maxWidth: 200 }} placeholder="Motivo de rechazo" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="ff-btn ff-btn-sm" disabled={busy} style={{ color: "#ff8a8a", borderColor: "rgba(255,138,138,.4)" }} onClick={() => patch({ status: "rejected", audit_notes: reason || null }, "Rechazada")}>Rechazar</button>
        </div>
      )}
    </div>
  );
}

export default function MarketplaceTab({ toast }: any) {
  const [items, setItems] = useState<any>(null);
  const [statusF, setStatusF] = useState("queue");
  const [commission, setCommission] = useState(10);
  const [selfId, setSelfId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabaseBrowser().from("collection_items")
      .select("*, profiles!collection_items_owner_id_fkey(handle, full_name, email)")
      .eq("for_sale", true)
      .order("created_at", { ascending: false });
    if (error) toast("Error cargando marketplace: " + error.message);
    setItems(data || []);
  };
  useEffect(() => {
    load();
    supabaseBrowser().auth.getUser().then(({ data }) => setSelfId(data.user?.id || null));
    supabaseBrowser().from("site_settings").select("marketplace_commission_pct").eq("id", 1).single()
      .then(({ data }: any) => { if (data?.marketplace_commission_pct != null) setCommission(Number(data.marketplace_commission_pct)); });
  }, []);

  if (items === null) return <p className="muted">Invocando…</p>;
  const filtered = items.filter((it: any) =>
    statusF === "all" ? true : statusF === "queue" ? ["submitted", "received"].includes(it.status) : it.status === statusF);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select className="input" style={{ width: 200 }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="queue">Cola (por revisar)</option>
          <option value="all">Todas</option>
          {Object.keys(STATUS).map((s) => <option key={s} value={s}>{STATUS[s][0]}</option>)}
        </select>
        <span className="muted" style={{ fontSize: 13 }}>{filtered.length} cartas · comisión {commission}%</span>
      </div>
      {filtered.length === 0 ? <div className="ff-panel" style={{ padding: 46, textAlign: "center" }}><p className="muted">No hay cartas en consignación acá.</p></div> :
        filtered.map((it: any) => <MarketRow key={it.id} it={it} commission={commission} selfId={selfId} onChanged={load} toast={toast} />)}
    </div>
  );
}
