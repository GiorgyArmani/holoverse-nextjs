"use client";
/* Holoverse — Panel de administración (estilo menú Final Fantasy).
   Shell: sidebar + ruteo de pestañas. Cada sección vive en components/admin/.
   La estética (clases ff-*) está en app/globals.css. */
import React, { useState, useRef } from "react";
import DashTab from "./admin/DashTab";
import ProductsTab from "./admin/ProductsTab";
import OrdersTab from "./admin/OrdersTab";
import SubmissionsTab from "./admin/SubmissionsTab";
import MarketplaceTab from "./admin/MarketplaceTab";
import SettingsTab from "./admin/SettingsTab";

const NAV = [
  ["dash", "Resumen", "◈"],
  ["products", "Productos", "❖"],
  ["orders", "Pedidos", "✦"],
  ["subs", "Compras", "✧"],
  ["marketplace", "Marketplace", "◊"],
  ["settings", "Configuración", "◆"],
];
const TITLES: any = {
  dash: "Resumen del reino", products: "Inventario de la bóveda",
  orders: "Pedidos de la tienda", subs: "Compras a clientes",
  marketplace: "Marketplace P2P · auditoría", settings: "Configuración",
};

export default function AdminPanel({ adminName, dash }: { adminName: string; dash?: any }) {
  const [tab, setTab] = useState("dash");
  const [toast, setToast] = useState("");
  const timer = useRef<any>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  };

  return (
    <div className="ff-root">
      <aside className="ff-side">
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)", padding: "4px 10px 0" }}>
          <span style={{ width: 30, height: 30, borderRadius: 4, background: "linear-gradient(160deg,#efe0ae,#a8843a)", display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50% 50% 50% 0", background: "#140f23", transform: "rotate(45deg)" }} />
          </span>
          <span style={{ fontFamily: "var(--font-title)", fontWeight: 800, fontSize: 14, letterSpacing: ".2em", textTransform: "uppercase", color: "#f1e7c8" }}>Holoverse</span>
        </a>
        <div className="ff-eyebrow" style={{ padding: "14px 12px 8px" }}>✦ Grimorio del admin ✦</div>
        <hr className="ff-hr" style={{ margin: "0 6px 10px" }} />
        <nav style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {NAV.map(([id, label, gem]) => (
            <button key={id} className={`ff-item${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>
              <span className="ff-cursor">▶</span>
              <span style={{ color: "#d9c489", fontSize: 13 }}>{gem}</span>
              {label}
            </button>
          ))}
        </nav>
        <hr className="ff-hr" style={{ margin: "10px 6px" }} />
        <div style={{ padding: "6px 12px 4px" }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis" }}>✦ {adminName}</div>
          <a href="/" className="ff-btn ff-btn-sm" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>Ver tienda</a>
        </div>
      </aside>

      <main style={{ padding: "30px 30px 90px", minWidth: 0 }}>
        <div style={{ marginBottom: 22 }}>
          <div className="ff-eyebrow" style={{ marginBottom: 6 }}>Holoverse · Administración</div>
          <h1 className="ff-h" style={{ fontSize: "clamp(20px, 2.6vw, 28px)" }}>{TITLES[tab]}</h1>
          <hr className="ff-hr" style={{ marginTop: 14 }} />
        </div>
        {tab === "dash" && <DashTab d={dash} goTo={setTab} />}
        {tab === "products" && <ProductsTab toast={showToast} />}
        {tab === "orders" && <OrdersTab toast={showToast} />}
        {tab === "subs" && <SubmissionsTab toast={showToast} />}
        {tab === "marketplace" && <MarketplaceTab toast={showToast} />}
        {tab === "settings" && <SettingsTab toast={showToast} />}
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "linear-gradient(170deg, rgba(38,42,92,.96), rgba(13,14,30,.98))", border: "1px solid rgba(216,196,137,.5)", borderRadius: 4, padding: "12px 22px", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05), 0 14px 34px rgba(0,0,0,.5)", fontSize: 14, fontWeight: 600, color: "#f1e7c8" }} className="fade-up">
          ✦ {toast}
        </div>
      )}
    </div>
  );
}
