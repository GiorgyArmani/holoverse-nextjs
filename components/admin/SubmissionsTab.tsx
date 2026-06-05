"use client";
/* Compras a clientes: ofertar / rechazar / marcar pagada
   (pagada + crédito dispara el bono +10% vía trigger en la DB). */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { fmtArs, fmtDate, Badge, SUB_STATUS } from "./ui";

function SubmissionRow({ s, onChanged, toast }: any) {
  const [offer, setOffer] = useState(s.offer_total_ars ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const update = async (patch: any, msg: string) => {
    setBusy(true);
    const { data: { user } } = await supabaseBrowser().auth.getUser();
    const { error } = await supabaseBrowser().from("sell_submissions")
      .update({ ...patch, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", s.id);
    setBusy(false);
    if (error) toast("Error: " + error.message);
    else { toast(msg); onChanged(); }
  };

  return (
    <div className="ff-panel" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5 }}>{s.profiles?.full_name || s.profiles?.email || "—"}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {fmtDate(s.created_at)} · {s.payout === "store_credit" ? "Crédito (+10%)" : "Efectivo"}{s.customer_notes ? ` · «${s.customer_notes}»` : ""}
          </div>
        </div>
        {s.offer_total_ars != null && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{fmtArs(s.offer_total_ars)}</span>}
        <Badge map={SUB_STATUS} k={s.status} />
      </div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 10, borderTop: "1px solid rgba(216,196,137,.15)", paddingTop: 10 }}>
        {(s.sell_submission_items || []).map((i: any) => `${i.quantity}× ${i.name}`).join(" · ") || "Sin items"}
      </div>
      {s.status === "pending" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input className="input" style={{ width: 160 }} type="number" min="0" placeholder="Oferta total ARS" value={offer} onChange={(e) => setOffer(e.target.value)} />
          <button className="ff-btn ff-btn-sm ff-btn-gold" disabled={busy || offer === ""} onClick={() => update({ status: "accepted", offer_total_ars: Number(offer) }, "Oferta enviada ✦")}>Enviar oferta</button>
          <input className="input" style={{ width: 220 }} placeholder="Motivo de rechazo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="ff-btn ff-btn-sm" disabled={busy} style={{ color: "#ff8a8a", borderColor: "rgba(255,138,138,.4)" }} onClick={() => update({ status: "rejected", admin_notes: reason || null }, "Lista rechazada")}>Rechazar</button>
        </div>
      )}
      {s.status === "accepted" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted" style={{ fontSize: 12.5 }}>
            Al marcar pagada{s.payout === "store_credit" ? ` se acreditan ${fmtArs(Number(s.offer_total_ars || 0) * 1.1)} (+10%) al cliente` : ", registrá el pago en efectivo por fuera"}.
          </span>
          <button className="ff-btn ff-btn-sm ff-btn-gold" disabled={busy} onClick={() => update({ status: "paid" }, "Marcada como pagada ✦")}>Marcar pagada</button>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsTab({ toast }: any) {
  const [subs, setSubs] = useState<any>(null);

  const load = async () => {
    const { data, error } = await supabaseBrowser().from("sell_submissions")
      .select("*, sell_submission_items(*), profiles!sell_submissions_user_id_fkey(email, full_name)")
      .order("created_at", { ascending: false });
    if (error) toast("Error cargando compras: " + error.message);
    setSubs(data || []);
  };
  useEffect(() => { load(); }, []);

  if (subs === null) return <p className="muted">Invocando…</p>;
  if (!subs.length) return <div className="ff-panel" style={{ padding: 46, textAlign: "center" }}><p className="muted">No hay listas de venta de clientes.</p></div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {subs.map((s: any) => <SubmissionRow key={s.id} s={s} onChanged={load} toast={toast} />)}
    </div>
  );
}
