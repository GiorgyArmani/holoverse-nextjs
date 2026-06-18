"use client";
/* Liquidaciones a vendedores del marketplace. Pago manual: al marcar "pagada",
   si el vendedor eligió crédito en tienda, un trigger le acredita el monto. */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { fmtArs, fmtUsd, fmtDate } from "./ui";

export default function PayoutsTab({ toast }: any) {
  const [rows, setRows] = useState<any>(null);
  const [statusF, setStatusF] = useState("pending");
  const [selfId, setSelfId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabaseBrowser().from("seller_payouts")
      .select("*, profiles!seller_payouts_seller_id_fkey(handle, full_name, email)")
      .order("created_at", { ascending: false });
    if (error) toast("Error cargando liquidaciones: " + error.message);
    setRows(data || []);
  };
  useEffect(() => {
    load();
    supabaseBrowser().auth.getUser().then(({ data }) => setSelfId(data.user?.id || null));
  }, []);

  const markPaid = async (p: any) => {
    const { error } = await supabaseBrowser().from("seller_payouts")
      .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: selfId }).eq("id", p.id);
    if (error) toast("Error: " + error.message);
    else { toast(p.method === "store_credit" ? "Pagada ✦ — crédito acreditado al vendedor" : "Marcada como pagada ✦"); load(); }
  };

  if (rows === null) return <p className="muted">Invocando…</p>;
  const filtered = rows.filter((r: any) => statusF === "all" || r.status === statusF);
  const pendingTotal = rows.filter((r: any) => r.status === "pending").reduce((n: number, r: any) => n + Number(r.net_usd), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select className="input" style={{ width: 180 }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagadas</option>
          <option value="all">Todas</option>
        </select>
        <span className="muted" style={{ fontSize: 13 }}>{filtered.length} liquidaciones · pendiente {fmtUsd(pendingTotal)}</span>
      </div>
      {filtered.length === 0 ? <div className="ff-panel" style={{ padding: 46, textAlign: "center" }}><p className="muted">No hay liquidaciones acá.</p></div> :
        filtered.map((p: any) => {
          const owner = p.profiles || {};
          return (
            <div key={p.id} className="ff-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5 }}>{p.card_name || "—"}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  @{owner.handle || "—"} · {owner.full_name || owner.email || "—"} · {fmtDate(p.created_at)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{fmtUsd(p.net_usd)} neto</div>
                <div className="muted" style={{ fontSize: 11.5 }}>de {fmtUsd(p.gross_usd)} · {p.commission_pct}% comisión · {p.method === "store_credit" ? `crédito ${p.credit_ars ? fmtArs(p.credit_ars) : ""}` : "efectivo"}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 4, border: `1px solid ${p.status === "paid" ? "#9fe8b0" : "#e8c878"}66`, color: p.status === "paid" ? "#9fe8b0" : "#e8c878" }}>{p.status === "paid" ? "Pagada" : "Pendiente"}</span>
              {p.status === "pending" && <button className="ff-btn ff-btn-sm ff-btn-gold" onClick={() => markPaid(p)}>✦ Marcar pagada</button>}
            </div>
          );
        })}
    </div>
  );
}
