"use client";
/* Pedidos: filtro por estado, confirmar pago, nº de seguimiento, chat con el
   cliente (comprobantes / guías) y cambio de estado. */
import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { fmtArs, fmtUsd, fmtDate, Badge, ORDER_STATUS } from "./ui";
import OrderChat from "../store/OrderChat";

function OrderRow({ o, selfId, onChanged, toast }: any) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState(o.tracking_code || "");
  const [busy, setBusy] = useState(false);

  const patch = async (data: any, msg: string) => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("orders").update(data).eq("id", o.id);
    setBusy(false);
    if (error) toast("Error: " + error.message);
    else { toast(msg); onChanged(); }
  };

  return (
    <div className="ff-panel" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{o.order_number}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {fmtDate(o.created_at)} · {o.profiles?.full_name || o.profiles?.email || "—"} · {o.delivery === "pickup" ? "Retiro" : `Envío: ${[o.ship_address, o.ship_city].filter(Boolean).join(", ") || "—"}`}
            {o.payment_pref ? ` · paga: ${o.payment_pref}` : ""}
          </div>
        </div>
        <Badge map={ORDER_STATUS} k={o.status} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{fmtArs(o.total_ars)}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>{fmtUsd(o.total_usd)} · fx {Number(o.fx_rate)}</div>
        </div>
        <select className="input" style={{ width: 150 }} value={o.status} onChange={(e) => patch({ status: e.target.value }, `${o.order_number} → ${ORDER_STATUS[e.target.value][0]}`)}>
          {Object.keys(ORDER_STATUS).map((s) => <option key={s} value={s}>{ORDER_STATUS[s][0]}</option>)}
        </select>
        <button className="ff-btn ff-btn-sm" onClick={() => setOpen((v) => !v)}>{open ? "Cerrar" : "Gestionar"}</button>
      </div>

      <div className="muted" style={{ fontSize: 12.5, marginTop: 10, borderTop: "1px solid rgba(216,196,137,.15)", paddingTop: 10 }}>
        {(o.order_items || []).map((oi: any) => `${oi.quantity}× ${oi.product_name}${oi.condition ? ` (${oi.condition})` : ""}${oi.marketplace_listing_id ? " ◊ marketplace" : ""}`).join(" · ") || "Sin items"}
      </div>

      {open && (
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }} className="hv-acc-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {o.status === "pending" && (
              <button className="ff-btn ff-btn-gold" disabled={busy} onClick={() => patch({ status: "paid" }, `${o.order_number}: pago confirmado ✦`)}>✦ Confirmar pago</button>
            )}
            <div>
              <span className="ff-eyebrow" style={{ display: "block", marginBottom: 6 }}>Nº de seguimiento del envío</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" style={{ flex: 1 }} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Ej: CA123456789AR" />
                <button className="ff-btn ff-btn-sm" disabled={busy} onClick={() => patch({ tracking_code: tracking.trim() || null }, "Seguimiento guardado")}>Guardar</button>
              </div>
              <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 5 }}>El cliente lo ve en su página de seguimiento al pasar a «Enviado».</span>
            </div>
          </div>
          <div>
            <span className="ff-eyebrow" style={{ display: "block", marginBottom: 6 }}>Chat con el cliente</span>
            <OrderChat orderId={o.id} ownerId={o.user_id} selfId={selfId} customerName={o.profiles?.full_name || "Cliente"} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersTab({ toast }: any) {
  const [orders, setOrders] = useState<any>(null);
  const [statusF, setStatusF] = useState("all");
  const [selfId, setSelfId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabaseBrowser().from("orders")
      .select("*, order_items(*), profiles!orders_user_id_fkey(email, full_name)")
      .order("created_at", { ascending: false });
    if (error) toast("Error cargando pedidos: " + error.message);
    setOrders(data || []);
  };
  useEffect(() => {
    load();
    supabaseBrowser().auth.getUser().then(({ data }) => setSelfId(data.user?.id || null));
  }, []);

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
        filtered.map((o: any) => <OrderRow key={o.id} o={o} selfId={selfId} onChanged={load} toast={toast} />)}
    </div>
  );
}
