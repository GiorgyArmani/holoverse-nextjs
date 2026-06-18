"use client";
/* Carrito y checkout. Sin pasarela de pago todavía: cierra la compra creando
   el pedido (pending) y lleva a la página de seguimiento, donde se coordina el
   pago a mano por chat. Invitados: se les crea una cuenta para ver la post-compra. */
import React, { useState } from "react";
import { HV } from "../../lib/data";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { useHV } from "./context";
import { Icon, Btn, QtyStepper, Price, Field, GameTag } from "./ui";
import { ItemArt } from "./art";

function Stepper({ step }: any) {
  const steps = ["Carrito", "Datos", "Confirmar"];
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

const PAY_OPTIONS = [
  ["transfer", "Transferencia bancaria", "Te pasamos CBU/alias por el chat"],
  ["mercado_pago", "Mercado Pago", "Te enviamos un link o alias de MP"],
  ["cash", "Efectivo", "Al retirar o contra entrega"],
  ["crypto", "Cripto (USDT / USDC)", "Coordinamos la wallet por el chat"],
];

export default function CartCheckout() {
  const { cart, nav, cartCount, user, profile, clearCart, showToast } = useHV();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("ship");
  const [pay, setPay] = useState("transfer");
  const [busy, setBusy] = useState(false);

  // datos del comprador / cuenta
  const [buyerName, setBuyerName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  const shipUsd = method === "pickup" ? 0 : HV.shipUsd;

  const canContinue = () => {
    if (!buyerName.trim()) return false;
    if (!user && (!email.trim() || password.length < 6)) return false;
    if (method === "ship" && (!address.trim() || !city.trim())) return false;
    return true;
  };

  const placeOrder = async () => {
    setBusy(true);
    const sb = supabaseBrowser();
    const items = cart.map((r) => ({ product_id: r.item.uuid, condition: r.condition || null, quantity: r.qty }));
    const order = {
      delivery: method, payment_pref: pay,
      ship_name: buyerName.trim() || null,
      ship_address: method === "ship" ? address.trim() || null : null,
      ship_city: method === "ship" ? city.trim() || null : null,
      ship_zip: method === "ship" ? zip.trim() || null : null,
    };
    const post = (payload: any) => fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const finish = (j: any) => { clearCart(); showToast("¡Pedido creado! Coordiná el pago en el chat."); nav("order", { id: j.orderId }); };

    try {
      if (user) {
        const { data: { session } } = await sb.auth.getSession();
        const r = await post({ mode: "auth", accessToken: session?.access_token, order, items });
        const j = await r.json();
        if (!r.ok) { showToast(j.error || "No pudimos cerrar la compra"); setBusy(false); return; }
        finish(j); return;
      }
      // invitado
      const r = await post({ mode: "guest", email: email.trim(), password, fullName: buyerName.trim(), order, items });
      const j = await r.json();
      if (r.status === 409 && j.error === "already_registered") {
        // el email ya tiene cuenta → intentamos loguear con esa contraseña y reintentar
        const { data: signIn, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error || !signIn.session) { showToast("Ese email ya tiene cuenta. Verificá la contraseña o iniciá sesión."); setBusy(false); return; }
        const r2 = await post({ mode: "auth", accessToken: signIn.session.access_token, order, items });
        const j2 = await r2.json();
        if (!r2.ok) { showToast(j2.error || "No pudimos cerrar la compra"); setBusy(false); return; }
        finish(j2); return;
      }
      if (!r.ok) { showToast(j.error || "No pudimos cerrar la compra"); setBusy(false); return; }
      await sb.auth.signInWithPassword({ email: email.trim(), password }); // dejarlo logueado para la post-compra
      finish(j);
    } catch (e: any) {
      showToast("Error de red al cerrar la compra"); setBusy(false);
    }
  };

  if (cartCount === 0) {
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
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 24 }}>Finalizar compra</h1>
      <Stepper step={step} />

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
              {/* cuenta */}
              <div className="panel panel-pad">
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>Tus datos</h3>
                {!user
                  ? <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Te creamos una cuenta para que sigas tu pedido y coordines el pago. ¿Ya tenés cuenta? <button onClick={() => nav("account")} style={{ background: "transparent", border: 0, color: "var(--violet)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, padding: 0 }}>Iniciá sesión</button>.</p>
                  : <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Comprando como <b style={{ color: "var(--text)" }}>{user.email}</b>.</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ gridColumn: "1 / -1" }}><Field label="Nombre y apellido" value={buyerName} onChange={(e: any) => setBuyerName(e.target.value)} placeholder="Lucía Fernández" /></div>
                  {!user && <Field label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="vos@email.com" />}
                  {!user && <Field label="Contraseña (nueva cuenta)" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="mín. 6 caracteres" />}
                </div>
              </div>

              {/* entrega */}
              <div className="panel panel-pad">
                <h3 style={{ fontSize: 17, marginBottom: 16 }}>Método de entrega</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["ship", "truck", "Envío a domicilio", "Nacional e internacional · asegurado"], ["pickup", "box", "Retiro en local", "Gratis · Banfield, Buenos Aires"]].map(([id, ic, t, sub]) => (
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
                    <div style={{ gridColumn: "1 / -1" }}><Field label="Dirección" value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="Av. Hipólito Yrigoyen 1234" /></div>
                    <Field label="Ciudad / Localidad" value={city} onChange={(e: any) => setCity(e.target.value)} placeholder="Banfield" />
                    <Field label="Código postal" value={zip} onChange={(e: any) => setZip(e.target.value)} placeholder="B1828" />
                  </div>
                  <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>El detalle final de envío (nacional o internacional) lo coordinamos por el chat del pedido.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="panel panel-pad">
                <h3 style={{ fontSize: 17, marginBottom: 4 }}>¿Cómo querés pagar?</h3>
                <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Todavía no tenemos pago online. Elegí un método y coordinamos por el chat; ahí podés subir tu comprobante.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PAY_OPTIONS.map(([id, t, sub]) => (
                    <button key={id} onClick={() => setPay(id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: `1px solid ${pay === id ? "var(--border-glow)" : "var(--border)"}`, background: pay === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: `5px solid ${pay === id ? "var(--violet)" : "var(--surface-hi)"}`, background: "var(--bg)" }} />
                      <span style={{ flex: 1 }}><b style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{t}</b><span className="muted" style={{ fontSize: 12.5, display: "block" }}>{sub}</span></span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel panel-pad">
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Revisá tu pedido</h3>
                <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
                  <div>{cartCount} artículo{cartCount !== 1 ? "s" : ""} · {method === "pickup" ? "Retiro en Banfield" : `Envío a ${city || "tu domicilio"}`}</div>
                  <div>A nombre de <b style={{ color: "var(--text)" }}>{buyerName || "—"}</b></div>
                  <div>Pago: <b style={{ color: "var(--text)" }}>{(PAY_OPTIONS.find((p) => p[0] === pay) || [])[1]}</b></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Summary shipUsd={step >= 1 ? shipUsd : 0}>
          {step < 2 ? (
            <Btn variant="holo" block size="lg" disabled={step === 1 && !canContinue()} onClick={() => setStep(step + 1)}>
              {step === 0 ? "Continuar" : "Continuar al pago"}<Icon name="arrow" size={17} />
            </Btn>
          ) : (
            <Btn variant="holo" block size="lg" disabled={busy} onClick={placeOrder}>
              {busy ? "Creando pedido…" : "Confirmar pedido"}<Icon name="arrow" size={17} />
            </Btn>
          )}
          {step > 0 && <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setStep(step - 1)} disabled={busy}>Volver</button>}
          {step === 2 && <p className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 12 }}>Al confirmar se crea el pedido como pendiente de pago.</p>}
        </Summary>
      </div>
    </div>
  );
}
