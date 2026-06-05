"use client";
/* Carrito y checkout (por ahora demo: no escribe en la DB todavía). */
import React, { useState } from "react";
import { HV } from "../../lib/data";
import { useHV } from "./context";
import { Icon, Btn, QtyStepper, Price, Field, GameTag } from "./ui";
import { ItemArt } from "./art";

function Stepper({ step }: any) {
  const steps = ["Carrito", "Envío", "Pago", "Listo"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 30 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-display)",
              background: i < step ? "var(--holo)" : i === step ? "var(--surface-3)" : "var(--surface-2)",
              border: `1px solid ${i === step ? "var(--border-glow)" : "var(--border)"}`, color: i < step ? "#0a0a12" : i === step ? "var(--text)" : "var(--text-3)" }}>
              {i < step ? <Icon name="check" size={13} stroke={3} solid /> : i + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)", color: i <= step ? "var(--text)" : "var(--text-3)" }} className="hv-step-label">{s}</span>
          </div>
          {i < steps.length - 1 && <span style={{ flex: 1, height: 1, background: i < step ? "var(--violet)" : "var(--border)", maxWidth: 60 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function LineItem({ row, editable }: any) {
  const { setQty, removeFromCart } = useHV();
  const price = row.condition ? (row.item.conditions.find((c) => c[0] === row.condition)?.[1] ?? row.item.usd) : row.item.usd;
  return (
    <div style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
      <div style={{ width: 56, flexShrink: 0 }}><ItemArt item={row.item} compact /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          {row.item.game && <GameTag game={row.item.game} withLabel={false} />}
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.item.name}</span>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>{row.item.set || row.item.cat}{row.condition && ` · ${row.condition}`}{row.item.preorder && " · Pre-order"}</div>
      </div>
      {editable ? <QtyStepper value={row.qty} onChange={(q) => setQty(row.key, q)} /> : <span className="muted" style={{ fontSize: 13 }}>×{row.qty}</span>}
      <div style={{ width: 120, textAlign: "right" }}><Price usd={price * row.qty} size={15} align="right" /></div>
      {editable && <button className="btn btn-icon btn-sm" onClick={() => removeFromCart(row.key)} style={{ background: "transparent", border: 0, color: "var(--text-3)" }}><Icon name="close" size={16} /></button>}
    </div>
  );
}

function Row({ k, v, free }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-2)" }}>
      <span>{k}</span>
      {free ? <span style={{ color: "var(--good)", fontWeight: 600 }}>Gratis</span> : <span style={{ color: "var(--text)", fontWeight: 600 }}>{HV.fmtArs(HV.ars(v))} <span className="price-usd">/ {HV.fmtUsd(v)}</span></span>}
    </div>
  );
}

function Summary({ children, shipUsd = 0 }: any) {
  const { cartTotalUsd } = useHV();
  const sub = cartTotalUsd;
  const total = sub + shipUsd;
  return (
    <div className="panel panel-pad" style={{ position: "sticky", top: 96 }}>
      <h3 style={{ fontSize: 17, marginBottom: 16 }}>Resumen del pedido</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 14 }}>
        <Row k="Subtotal" v={sub} />
        <Row k="Envío" v={shipUsd} free={shipUsd === 0} />
        <Row k="Impuestos" v={0} free />
      </div>
      <hr className="divider" style={{ margin: "16px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 16 }}>Total</span>
        <Price usd={total} size={22} align="right" />
      </div>
      <div style={{ marginTop: 18 }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-3)", justifyContent: "center" }}><Icon name="shield" size={14} />Pago seguro · autenticidad garantizada</div>
    </div>
  );
}

export default function CartCheckout() {
  const { cart, nav, cartCount } = useHV();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("ship");
  const [pay, setPay] = useState("card");
  const shipUsd = method === "pickup" ? 0 : HV.shipUsd;

  if (cartCount === 0 && step < 3) {
    return (
      <div className="wrap" style={{ padding: "100px 28px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", margin: "0 auto 20px", color: "var(--text-3)" }}><Icon name="cart" size={28} /></div>
        <h1 style={{ fontSize: 30, marginBottom: 10 }}>Tu carrito está vacío</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Singles chase, cajas selladas y gear te esperan en el Holoverse.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="holo" onClick={() => nav("browse", { type: "single" })}>Ver singles</Btn>
          <Btn variant="ghost" onClick={() => nav("browse", { type: "sealed" })}>Ver sellado</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 30, maxWidth: 1080 }}>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 24 }}>{step === 3 ? "Pedido confirmado" : "Finalizar compra"}</h1>
      {step < 3 && <Stepper step={step} />}

      {step === 3 ? (
        <div className="panel panel-pad fade-up" style={{ textAlign: "center", padding: "56px 30px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--holo)", display: "grid", placeItems: "center", margin: "0 auto 22px", color: "#0a0a12", boxShadow: "var(--glow-violet)" }}><Icon name="check" size={34} stroke={3} solid /></div>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>¡Gracias! Ya estás en el Holoverse.</h2>
          <p className="muted" style={{ fontSize: 15, marginBottom: 6 }}>Pedido <b style={{ color: "var(--text)" }}>#HV-20682</b> confirmado. Te enviamos el comprobante.</p>
          <p className="muted" style={{ fontSize: 14, marginBottom: 28 }}>{method === "pickup" ? "Listo para retirar en Palermo en 24h." : "Despachando desde Buenos Aires hoy."}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn variant="primary" onClick={() => nav("account")}>Seguir pedido</Btn>
            <Btn variant="ghost" onClick={() => nav("home")}>Seguir comprando</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 36, alignItems: "start" }} className="hv-checkout-grid">
          <div>
            {step === 0 && (
              <div className="panel panel-pad">
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>Carrito · {cartCount} art.</h3>
                {cart.map((row) => <LineItem key={row.key} row={row} editable />)}
              </div>
            )}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="panel panel-pad">
                  <h3 style={{ fontSize: 17, marginBottom: 16 }}>Método de entrega</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[["ship", "truck", "Envío a domicilio", "Desde $4.50 · 2–4 días"], ["pickup", "box", "Retiro en local", "Gratis · Palermo, CABA"]].map(([id, ic, t, sub]) => (
                      <button key={id} onClick={() => setMethod(id)} style={{ textAlign: "left", padding: 16, borderRadius: 14, cursor: "pointer", border: `1px solid ${method === id ? "var(--border-glow)" : "var(--border)"}`, background: method === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                        <span style={{ color: "var(--violet)", display: "block", marginBottom: 10 }}><Icon name={ic} size={20} /></span>
                        <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14.5 }}>{t}</div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {method === "ship" && (
                  <div className="panel panel-pad">
                    <h3 style={{ fontSize: 17, marginBottom: 16 }}>Dirección de envío</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Nombre" defaultValue="Lucía" />
                      <Field label="Apellido" defaultValue="Fernández" />
                      <div style={{ gridColumn: "1 / -1" }}><Field label="Dirección" placeholder="Av. Santa Fe 1234" /></div>
                      <Field label="Ciudad" defaultValue="Buenos Aires" />
                      <Field label="Código postal" placeholder="C1059" />
                    </div>
                  </div>
                )}
              </div>
            )}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="panel panel-pad">
                  <h3 style={{ fontSize: 17, marginBottom: 16 }}>Pago</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                    {[["card", "Tarjeta de crédito / débito", "Visa · Mastercard · hasta 6 cuotas"], ["mp", "Mercado Pago", "Pagá con tu saldo de MP"], ["crypto", "Cripto (USDT / USDC)", "Pagá en stablecoins"]].map(([id, t, sub]) => (
                      <button key={id} onClick={() => setPay(id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `1px solid ${pay === id ? "var(--border-glow)" : "var(--border)"}`, background: pay === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", border: `5px solid ${pay === id ? "var(--violet)" : "var(--surface-hi)"}`, background: "var(--bg)" }} />
                        <span style={{ flex: 1 }}><b style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{t}</b><span className="muted" style={{ fontSize: 12.5, display: "block" }}>{sub}</span></span>
                      </button>
                    ))}
                  </div>
                  {pay === "card" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ gridColumn: "1 / -1" }}><Field label="Número de tarjeta" placeholder="4242 4242 4242 4242" /></div>
                      <Field label="Vencimiento" placeholder="MM / AA" />
                      <Field label="CVC" placeholder="123" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Summary shipUsd={step >= 1 ? shipUsd : 0}>
            <Btn variant="holo" block size="lg" onClick={() => setStep(step + 1)}>
              {step === 0 ? "Finalizar compra" : step === 1 ? "Continuar al pago" : "Confirmar pedido"}<Icon name="arrow" size={17} />
            </Btn>
            {step > 0 && <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setStep(step - 1)}>Volver</button>}
          </Summary>
        </div>
      )}
    </div>
  );
}
