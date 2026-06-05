"use client";
/* Cuenta: auth (login/registro) + perfil, pedidos, deseos y ventas (Supabase). */
import React, { useState, useEffect } from "react";
import { HV } from "../../lib/data";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { useHV } from "./context";
import { Icon, Btn, Field, Price } from "./ui";
import { ItemArt } from "./art";
import ProductCard from "./ProductCard";

const ORDER_STATUS = {
  pending:    { label: "Pendiente",  color: "var(--gold)" },
  paid:       { label: "Pagado",     color: "var(--violet)" },
  processing: { label: "Procesando", color: "var(--violet)" },
  shipped:    { label: "Enviado",    color: "var(--cyan)" },
  delivered:  { label: "Entregado",  color: "var(--good)" },
  cancelled:  { label: "Cancelado",  color: "#ff7a7a" },
};
const SUB_STATUS = {
  pending:  { label: "Pendiente de revisión", color: "var(--gold)" },
  accepted: { label: "Oferta enviada",        color: "var(--cyan)" },
  rejected: { label: "Rechazada",             color: "#ff7a7a" },
  paid:     { label: "Pagada",                color: "var(--good)" },
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "";
const AUTH_ERRORS = {
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese email.",
  "Email not confirmed": "Confirmá tu email antes de ingresar (revisá tu casilla).",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
};

function StatusBadge({ s }: any) {
  if (!s) return null;
  return <span className="badge" style={{ color: s.color, borderColor: s.color + "55", background: s.color + "14" }}><span className="dot" style={{ background: s.color }} />{s.label}</span>;
}

/* ---------------- login / registro ---------------- */
function AuthScreen() {
  const { showToast } = useHV();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const sb = supabaseBrowser();
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) setErr(AUTH_ERRORS[error.message] || error.message);
      else showToast("¡Bienvenido de vuelta al Holoverse!");
    } else {
      const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
      if (error) setErr(AUTH_ERRORS[error.message] || error.message);
      else if (!data.session) setConfirmSent(true);
      else showToast("¡Cuenta creada! Ya estás en el Holoverse.");
    }
    setBusy(false);
  };

  if (confirmSent) {
    return (
      <div className="wrap" style={{ padding: "90px 28px", maxWidth: 520 }}>
        <div className="panel panel-pad fade-up" style={{ textAlign: "center", padding: "46px 30px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--holo)", display: "grid", placeItems: "center", margin: "0 auto 20px", color: "#0a0a12" }}><Icon name="check" size={30} stroke={3} solid /></div>
          <h1 style={{ fontSize: 26, marginBottom: 10 }}>Revisá tu email</h1>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>Te enviamos un enlace de confirmación a <b style={{ color: "var(--text)" }}>{email}</b>. Confirmá tu cuenta y volvé a ingresar.</p>
          <Btn variant="ghost" style={{ marginTop: 22 }} onClick={() => { setConfirmSent(false); setMode("login"); }}>Volver a ingresar</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "70px 28px 90px", maxWidth: 460 }}>
      <div className="panel gloss fade-up" style={{ position: "relative", overflow: "hidden", padding: "34px 30px" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, borderRadius: "50%", background: "var(--holo)", filter: "blur(90px)", opacity: .2 }} />
        <div style={{ position: "relative" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{mode === "login" ? "Entrá a la bóveda" : "Nueva cuenta"}</div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
          <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>{mode === "login" ? "Tus pedidos, deseos y crédito te esperan." : "Pedidos, lista de deseos, crédito +10% por vendernos cartas."}</p>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && <Field label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lucía Fernández" required />}
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" required />
            <Field label="Contraseña" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" required minLength={6} />
            {err && <div style={{ fontSize: 13.5, color: "#ff7a7a", background: "rgba(255,122,122,.08)", border: "1px solid rgba(255,122,122,.3)", borderRadius: 10, padding: "10px 14px" }}>{err}</div>}
            <Btn variant="holo" size="lg" block disabled={busy} type="submit">
              {busy ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear cuenta"}<Icon name="arrow" size={16} />
            </Btn>
          </form>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 18, textAlign: "center" }}>
            {mode === "login" ? "¿Primera vez en el Holoverse? " : "¿Ya tenés cuenta? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }} style={{ background: "transparent", border: 0, color: "var(--violet)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, padding: 0 }}>
              {mode === "login" ? "Creá tu cuenta" : "Iniciá sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- cuenta (logueado) ---------------- */
export default function Account() {
  const { user, authReady } = useHV();
  if (!authReady) return <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}><p className="muted">Cargando…</p></div>;
  if (!user) return <AuthScreen />;
  return <AccountPanel />;
}

function AccountPanel() {
  const { user, profile, nav, signOut, wishlist, loadAccount } = useHV();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState(null);
  const [subs, setSubs] = useState(null);
  const tabs = [["orders", "Pedidos"], ["wishlist", "Deseos"], ["sell", "Vender"], ["details", "Cuenta"]];

  const refresh = async () => {
    const sb = supabaseBrowser();
    const [o, s] = await Promise.all([
      sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      sb.from("sell_submissions").select("*, sell_submission_items(*)").order("created_at", { ascending: false }),
    ]);
    setOrders(o.data || []);
    setSubs(s.data || []);
  };
  useEffect(() => { refresh(); }, []);

  const wishItems = wishlist.map((u) => HV.byUuid(u)).filter(Boolean);
  const displayName = profile?.full_name || user.email.split("@")[0];
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const credit = Number(profile?.store_credit_ars || 0);
  const isAdmin = profile?.role === "admin";

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
      {/* profile header */}
      <div className="panel gloss" style={{ position: "relative", overflow: "hidden", padding: "28px 30px", marginBottom: 26, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ position: "absolute", top: -40, right: -20, width: 200, height: 200, borderRadius: "50%", background: "var(--holo)", filter: "blur(80px)", opacity: .2 }} />
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--holo)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#0a0a12", flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 26 }}>{displayName}</h1>
            {isAdmin && <span className="badge badge-holo">Admin</span>}
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 3 }}>Coleccionista · Miembro desde {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}</p>
          {isAdmin && <a href="/admin" className="btn btn-sm btn-ghost" style={{ marginTop: 12, display: "inline-flex" }}><Icon name="bolt" size={14} />Panel de administración</a>}
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[["Pedidos", orders ? orders.length : "…"], ["Crédito", HV.fmtArs(credit)], ["Deseos", wishItems.length]].map(([k, v]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>{v}</div>
              <div className="muted" style={{ fontSize: 12 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 26, overflowX: "auto" }}>
        {tabs.map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "transparent", border: 0, borderBottom: `2px solid ${tab === id ? "var(--violet)" : "transparent"}`, color: tab === id ? "var(--text)" : "var(--text-3)", padding: "12px 16px", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>

      {tab === "orders" && (
        orders === null ? <p className="muted">Cargando pedidos…</p> :
        orders.length === 0 ? (
          <div className="panel" style={{ padding: 60, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Todavía no tenés pedidos</h3>
            <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>Tu primer botín te está esperando en la bóveda.</p>
            <Btn variant="holo" onClick={() => nav("browse")}>Explorar el catálogo<Icon name="arrow" size={15} /></Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.map((o) => {
              const thumbs = (o.order_items || []).map((oi) => HV.byUuid(oi.product_id)).filter(Boolean).slice(0, 4);
              const nItems = (o.order_items || []).reduce((n, oi) => n + oi.quantity, 0);
              return (
                <div key={o.id} className="panel" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  {thumbs.length > 0 && (
                    <div style={{ display: "flex" }}>
                      {thumbs.map((it, i) => (
                        <div key={it.uuid + i} style={{ width: 40, marginLeft: i ? -14 : 0, border: "2px solid var(--surface)", borderRadius: 8 }}><ItemArt item={it} compact /></div>
                      ))}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{o.order_number}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{fmtDate(o.created_at)} · {nItems} art. · {o.delivery === "pickup" ? "Retiro en local" : "Envío"}</div>
                  </div>
                  <StatusBadge s={ORDER_STATUS[o.status]} />
                  <Price usd={Number(o.total_usd)} size={16} align="right" />
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "wishlist" && (
        wishItems.length === 0 ? (
          <div className="panel" style={{ padding: 60, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Tu lista de deseos está vacía</h3>
            <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>Tocá el corazón en cualquier producto para guardarlo acá.</p>
            <Btn variant="ghost" onClick={() => nav("browse")}>Explorar el catálogo</Btn>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }} className="hv-rail">
            {wishItems.map((it) => <ProductCard key={it.id} item={it} />)}
          </div>
        )
      )}

      {tab === "sell" && <SellTab subs={subs} onSubmitted={refresh} />}

      {tab === "details" && <DetailsTab onSaved={() => loadAccount(user.id)} onSignOut={signOut} />}
    </div>
  );
}

/* ---------------- vender cartas (sell_submissions) ---------------- */
function SellTab({ subs, onSubmitted }: any) {
  const { user, showToast } = useHV();
  const [list, setList] = useState("");
  const [payout, setPayout] = useState("store_credit");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const lines = list.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { showToast("Agregá al menos una carta a la lista"); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: sub, error } = await sb.from("sell_submissions")
      .insert({ user_id: user.id, payout, customer_notes: notes || null, status: "pending" })
      .select().single();
    if (error) { showToast("No pudimos enviar tu lista: " + error.message); setBusy(false); return; }
    const items = lines.map((l) => {
      const m = l.match(/^(\d+)\s*[xX]?\s+(.+)$/);
      return { submission_id: sub.id, quantity: m ? +m[1] : 1, name: m ? m[2] : l };
    });
    const { error: e2 } = await sb.from("sell_submission_items").insert(items);
    if (e2) { showToast("Error guardando los items: " + e2.message); setBusy(false); return; }
    setList(""); setNotes("");
    showToast("¡Lista enviada! Te respondemos con una oferta en 48h.");
    setBusy(false);
    onSubmitted();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, alignItems: "start" }} className="hv-checkout-grid">
        <div className="panel panel-pad">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Cotización en 48h</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Vendé tus cartas a Holoverse</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 22, lineHeight: 1.6 }}>Pegá tu lista (una carta por línea, ej: «2 Ragavan, Nimble Pilferer»). La revisamos y te enviamos una oferta. Pagamos en efectivo o +10% en crédito.</p>
          <textarea className="input" rows={5} value={list} onChange={(e) => setList(e.target.value)} placeholder={"1 Ragavan, Nimble Pilferer\n4 Charizard ex (151)\n2 Monkey D. Luffy Leader…"} style={{ resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 13 }} />
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 11 }}>Forma de pago</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["store_credit", "Crédito en tienda", "+10% extra sobre la oferta"], ["cash", "Efectivo", "Pago en 48h tras aceptar"]].map(([id, t, sub2]) => (
                <button key={id} onClick={() => setPayout(id)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `1px solid ${payout === id ? "var(--border-glow)" : "var(--border)"}`, background: payout === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 13.5 }}>{t}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub2}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condición general, fotos, etc." />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="holo" disabled={busy} onClick={submit}>{busy ? "Enviando…" : "Enviar lista"}<Icon name="arrow" size={16} /></Btn>
          </div>
        </div>
        <div className="panel panel-pad">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Por qué vendernos</h3>
          {[["bolt", "Respuesta en 48h", "Revisamos tu lista y te ofertamos rápido"], ["shield", "Calificación justa", "Evaluación de condición transparente"], ["truck", "Envío gratis", "Etiqueta asegurada prepaga ida y vuelta"], ["spark", "+10% en crédito", "Sumá a tu pago para nuevas compras"]].map(([ic, t, d]) => (
            <div key={t} style={{ display: "flex", gap: 13, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--violet)", flexShrink: 0 }}><Icon name={ic} size={16} /></span>
              <div><div style={{ fontWeight: 600, fontFamily: "var(--font-display)", fontSize: 14 }}>{t}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>

      {subs && subs.length > 0 && (
        <div className="panel panel-pad">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Tus listas enviadas</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {subs.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 600, fontFamily: "var(--font-display)", fontSize: 14 }}>{fmtDate(s.created_at)} · {(s.sell_submission_items || []).reduce((n, i) => n + i.quantity, 0)} cartas</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{s.payout === "store_credit" ? "Crédito en tienda (+10%)" : "Efectivo"}{s.admin_notes ? ` · «${s.admin_notes}»` : ""}</div>
                </div>
                {s.offer_total_ars != null && <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>{HV.fmtArs(Number(s.offer_total_ars))}</span>}
                <StatusBadge s={SUB_STATUS[s.status]} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- datos de la cuenta ---------------- */
function DetailsTab({ onSaved, onSignOut }: any) {
  const { user, profile, showToast } = useHV();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);
    if (error) showToast("No pudimos guardar: " + error.message);
    else { showToast("Datos guardados"); onSaved(); }
    setBusy(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 760 }} className="hv-checkout-grid">
      <div className="panel panel-pad">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Perfil</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Field label="Email" value={user.email} disabled />
          <Field label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 5555 0000" />
        </div>
        <Btn variant="primary" style={{ marginTop: 18 }} disabled={busy} onClick={save}>{busy ? "Guardando…" : "Guardar cambios"}</Btn>
      </div>
      <div className="panel panel-pad">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Crédito y sesión</h3>
        <div className="panel" style={{ padding: "16px 18px", marginBottom: 16, background: "var(--surface-2)" }}>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>Crédito en tienda</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24 }}>{HV.fmtArs(Number(profile?.store_credit_ars || 0))}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Se acredita automáticamente cuando nos vendés cartas con pago en crédito.</div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={onSignOut}><Icon name="close" size={15} />Cerrar sesión</button>
      </div>
    </div>
  );
}
