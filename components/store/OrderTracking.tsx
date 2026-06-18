"use client";
/* Seguimiento de pedido post-compra: estado, instrucciones de pago manual,
   nº de seguimiento y chat con Holoverse para enviar comprobantes / guías. */
import React, { useState, useEffect, useCallback } from "react";
import { HV } from "../../lib/data";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { useHV } from "./context";
import { Icon, Btn, Price } from "./ui";
import OrderChat from "./OrderChat";

const STEPS = [
  ["pending", "Pendiente de pago", "Recibimos tu pedido. Coordiná el pago por el chat."],
  ["paid", "Pago confirmado", "Confirmamos tu pago. ¡Gracias!"],
  ["processing", "En preparación", "Estamos preparando tu pedido."],
  ["shipped", "Enviado", "Tu pedido va en camino."],
  ["delivered", "Entregado", "¡Disfrutá tu botín!"],
];
const PAY_LABEL: any = { transfer: "Transferencia bancaria", mercado_pago: "Mercado Pago", cash: "Efectivo", crypto: "Cripto (USDT/USDC)" };
const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) : "";

export default function OrderTracking({ id }: any) {
  const { user, nav, authReady } = useHV();
  const [order, setOrder] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabaseBrowser().from("orders")
      .select("*, order_items(*), profiles!orders_user_id_fkey(full_name, email)")
      .eq("id", id).single();
    if (data) setOrder(data); else setNotFound(true);
  }, [id]);

  // carga al montar (la sesión vive en la cookie aunque el contexto tarde un tick)
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  if (!authReady && !order) return <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}><p className="muted">Cargando…</p></div>;
  if (authReady && !user && !order) return (
    <div className="wrap" style={{ padding: "100px 28px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Iniciá sesión para ver tu pedido</h1>
      <p className="muted" style={{ marginBottom: 22 }}>Accedé a tu cuenta para seguir el estado y chatear con nosotros.</p>
      <Btn variant="holo" onClick={() => nav("account")}>Ir a mi cuenta</Btn>
    </div>
  );
  if (notFound) return (
    <div className="wrap" style={{ padding: "100px 28px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Pedido no encontrado</h1>
      <p className="muted" style={{ marginBottom: 22 }}>No pudimos encontrar este pedido en tu cuenta.</p>
      <Btn variant="ghost" onClick={() => nav("account")}>Mis pedidos</Btn>
    </div>
  );
  if (!order) return <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}><p className="muted">Cargando pedido…</p></div>;

  const cancelled = order.status === "cancelled";
  const currentIdx = STEPS.findIndex((s) => s[0] === order.status);
  const nItems = (order.order_items || []).reduce((n: number, i: any) => n + i.quantity, 0);
  const customerName = order.profiles?.full_name || order.profiles?.email?.split("@")[0] || "Cliente";

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 40, maxWidth: 1000 }}>
      <button onClick={() => nav("account")} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}><Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} />Mis pedidos</button>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Seguimiento</div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)" }}>Pedido {order.order_number}</h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{fmtDate(order.created_at)} · {nItems} art. · {order.delivery === "pickup" ? "Retiro en Banfield" : "Envío a domicilio"}</p>
        </div>
        <Price usd={Number(order.total_usd)} size={26} align="right" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 24, alignItems: "start" }} className="hv-checkout-grid">
        {/* izquierda: estado + items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel panel-pad">
            <h3 style={{ fontSize: 16, marginBottom: 18 }}>Estado del pedido</h3>
            {cancelled ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,122,122,.3)", background: "rgba(255,122,122,.08)" }}>
                <Icon name="close" size={18} style={{ color: "#ff7a7a" }} />
                <div><div style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>Pedido cancelado</div><div className="muted" style={{ fontSize: 12.5 }}>Escribinos por el chat si tenés dudas.</div></div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {STEPS.map((s, i) => {
                  const done = i < currentIdx, active = i === currentIdx;
                  return (
                    <div key={s[0]} style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0,
                          background: done ? "var(--holo)" : active ? "var(--surface-3)" : "var(--surface-2)",
                          border: `1px solid ${active ? "var(--border-glow)" : "var(--border)"}`, color: done ? "#0a0a12" : active ? "var(--violet)" : "var(--text-4)" }}>
                          {done ? <Icon name="check" size={13} stroke={3} solid /> : <span style={{ fontSize: 12, fontWeight: 700 }}>{i + 1}</span>}
                        </span>
                        {i < STEPS.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 26, background: done ? "var(--violet)" : "var(--border)" }} />}
                      </div>
                      <div style={{ paddingBottom: 18 }}>
                        <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14, color: active || done ? "var(--text)" : "var(--text-3)" }}>{s[1]}</div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{s[2]}</div>
                        {s[0] === "shipped" && order.tracking_code && active && (
                          <div style={{ marginTop: 6, fontSize: 12.5 }}>Seguimiento: <b style={{ color: "var(--text)", fontFamily: "ui-monospace, monospace" }}>{order.tracking_code}</b></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* instrucciones de pago (mientras está pendiente) */}
          {order.status === "pending" && (
            <div className="panel panel-pad" style={{ borderColor: "var(--border-glow)" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Falta el pago</div>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Coordiná el pago por el chat</h3>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                Elegiste pagar con <b style={{ color: "var(--text)" }}>{PAY_LABEL[order.payment_pref] || "el método a coordinar"}</b>. Escribinos por el chat para recibir los datos y <b style={{ color: "var(--text)" }}>subí tu comprobante</b> ahí mismo. En cuanto lo confirmemos, preparamos tu pedido.
              </p>
            </div>
          )}

          <div className="panel panel-pad">
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>Resumen</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(order.order_items || []).map((i: any) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
                  <span>{i.quantity}× {i.product_name}{i.condition ? ` · ${i.condition}` : ""}</span>
                  <span className="muted">{HV.fmtUsd(Number(i.unit_price_usd) * i.quantity)}</span>
                </div>
              ))}
              <hr className="divider" style={{ margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}><span className="muted">Subtotal</span><span>{HV.fmtUsd(Number(order.subtotal_usd))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}><span className="muted">Envío</span><span>{Number(order.shipping_usd) === 0 ? "Gratis" : HV.fmtUsd(Number(order.shipping_usd))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>Total</span>
                <Price usd={Number(order.total_usd)} size={18} align="right" />
              </div>
            </div>
          </div>
        </div>

        {/* derecha: chat */}
        <div style={{ position: "sticky", top: 96 }}>
          <OrderChat orderId={order.id} ownerId={order.user_id} selfId={user?.id} customerName={customerName} />
        </div>
      </div>
    </div>
  );
}
