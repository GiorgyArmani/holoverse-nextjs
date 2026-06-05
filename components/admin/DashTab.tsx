"use client";
/* Resumen del reino: stats + últimos pedidos + compras pendientes + stock bajo.
   Los datos llegan del servidor (app/admin/page.tsx) ya validada la sesión. */
import React from "react";
import { fmtArs, fmtDate, Badge, ORDER_STATUS } from "./ui";

function StatCard({ label, value, sub }: any) {
  return (
    <div className="ff-panel ff-stat ff-corner">
      <span className="ff-eyebrow">{label}</span>
      <b>{value}</b>
      {sub && <span className="muted" style={{ fontSize: 12 }}>{sub}</span>}
    </div>
  );
}

export default function DashTab({ d, goTo }: any) {
  if (!d) return <p className="muted">Sin datos del resumen — recargá la página.</p>;
  const pendingOrders = d.orders.filter((o: any) => ["pending", "paid", "processing"].includes(o.status));
  const revenue = d.orders.filter((o: any) => o.status !== "cancelled").reduce((n: number, o: any) => n + Number(o.total_ars || 0), 0);
  const pendingSubs = d.subs.filter((s: any) => s.status === "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ff-btn ff-btn-sm" onClick={() => window.location.reload()}>⟳ Actualizar resumen</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <StatCard label="Productos" value={d.active} sub={`${d.total} en total · ${d.total - d.active} ocultos`} />
        <StatCard label="Pedidos por atender" value={pendingOrders.length} sub="pendiente / pagado / procesando" />
        <StatCard label="Ventas (no canceladas)" value={fmtArs(revenue)} sub={`${d.orders.length} pedidos`} />
        <StatCard label="Compras por revisar" value={pendingSubs.length} sub="listas de clientes" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }} className="hv-checkout-grid">
        <div className="ff-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <h3 className="ff-h" style={{ fontSize: 13 }}>Últimos pedidos</h3>
            <button className="ff-btn ff-btn-sm" onClick={() => goTo("orders")}>Ver todos</button>
          </div>
          <hr className="ff-hr" style={{ margin: "8px 0 4px" }} />
          {d.orders.length === 0 ? <p className="muted" style={{ fontSize: 13, padding: "14px 0" }}>Aún no hay pedidos.</p> :
            d.orders.slice(0, 6).map((o: any) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(216,196,137,.12)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5 }}>{o.order_number}</span>
                <span className="muted" style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.profiles?.full_name || o.profiles?.email || "—"} · {fmtDate(o.created_at)}</span>
                <Badge map={ORDER_STATUS} k={o.status} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{fmtArs(o.total_ars)}</span>
              </div>
            ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="ff-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h3 className="ff-h" style={{ fontSize: 13 }}>Compras pendientes</h3>
              <button className="ff-btn ff-btn-sm" onClick={() => goTo("subs")}>Revisar</button>
            </div>
            <hr className="ff-hr" style={{ margin: "8px 0 4px" }} />
            {pendingSubs.length === 0 ? <p className="muted" style={{ fontSize: 13, padding: "14px 0" }}>Nada por revisar ✦</p> :
              pendingSubs.slice(0, 5).map((s: any) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(216,196,137,.12)" }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{s.profiles?.full_name || s.profiles?.email || "—"}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{fmtDate(s.created_at)}</span>
                </div>
              ))}
          </div>
          <div className="ff-panel" style={{ padding: "18px 20px" }}>
            <h3 className="ff-h" style={{ fontSize: 13, marginBottom: 6 }}>Stock bajo (sellado / acc.)</h3>
            <hr className="ff-hr" style={{ margin: "8px 0 4px" }} />
            {d.low.length === 0 ? <p className="muted" style={{ fontSize: 13, padding: "14px 0" }}>Todo abastecido ✦</p> :
              d.low.map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(216,196,137,.12)", fontSize: 13 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  <b style={{ color: p.stock === 0 ? "#ff8a8a" : "#e8c878", fontFamily: "var(--font-display)" }}>{p.stock}</b>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
