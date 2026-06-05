"use client";
/* Pedidos: filtro por estado, cambio de estado, detalle de items. */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { fmtArs, fmtUsd, fmtDate, Badge, ORDER_STATUS } from "./ui";

export default function OrdersTab({ toast }: any) {
  const [orders, setOrders] = useState<any>(null);
  const [statusF, setStatusF] = useState("all");

  const load = async () => {
    const { data, error } = await supabaseBrowser().from("orders")
      .select("*, order_items(*), profiles!orders_user_id_fkey(email, full_name)")
      .order("created_at", { ascending: false });
    if (error) toast("Error cargando pedidos: " + error.message);
    setOrders(data || []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (o: any, status: string) => {
    const { error } = await supabaseBrowser().from("orders").update({ status }).eq("id", o.id);
    if (error) toast("Error: " + error.message);
    else { toast(`${o.order_number} → ${ORDER_STATUS[status][0]}`); load(); }
  };

  if (orders === null) return <p className="muted">Invocando pedidos…</p>;
  const filtered = orders.filter((o: any) => statusF === "all" || o.status === statusF);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select className="input" style={{ width: 180 }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="all">Todos los estados</option>
          {Object.keys(ORDER_STATUS).map((s) => <option key={s} value={s}>{ORDER_STATUS[s][0]}</option>)}
        </select>
        <span className="muted" style={{ fontSize: 13 }}>{filtered.length} pedidos</span>
      </div>
      {filtered.length === 0 ? <div className="ff-panel" style={{ padding: 46, textAlign: "center" }}><p className="muted">No hay pedidos acá.</p></div> :
        filtered.map((o: any) => (
          <div key={o.id} className="ff-panel" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{o.order_number}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {fmtDate(o.created_at)} · {o.profiles?.full_name || o.profiles?.email || "—"} · {o.delivery === "pickup" ? "Retiro" : `Envío: ${[o.ship_address, o.ship_city].filter(Boolean).join(", ") || "—"}`}
                </div>
              </div>
              <Badge map={ORDER_STATUS} k={o.status} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{fmtArs(o.total_ars)}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{fmtUsd(o.total_usd)} · fx {Number(o.fx_rate)}</div>
              </div>
              <select className="input" style={{ width: 150 }} value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                {Object.keys(ORDER_STATUS).map((s) => <option key={s} value={s}>{ORDER_STATUS[s][0]}</option>)}
              </select>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10, borderTop: "1px solid rgba(216,196,137,.15)", paddingTop: 10 }}>
              {(o.order_items || []).map((oi: any) => `${oi.quantity}× ${oi.product_name}${oi.condition ? ` (${oi.condition})` : ""}`).join(" · ") || "Sin items"}
            </div>
          </div>
        ))}
    </div>
  );
}
