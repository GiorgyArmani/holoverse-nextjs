"use client";
/* Cuenta: auth (login/registro) + perfil, pedidos, deseos y ventas (Supabase). */
import React, { useState, useEffect } from "react";
import { HV } from "../../lib/data";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { useHV } from "./context";
import { Icon, Btn, Field, Price, QtyStepper } from "./ui";
import { ItemArt } from "./art";
import ProductCard from "./ProductCard";
import SellCardSearch from "./SellCardSearch";
import { notifyAdmin } from "../../lib/notify-admin";

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
  const tabs = [["orders", "Pedidos"], ["store", "Mi tienda"], ["wishlist", "Deseos"], ["sell", "Vender"], ["details", "Cuenta"]];

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
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {isAdmin && <a href="/admin" className="btn btn-sm btn-ghost" style={{ display: "inline-flex" }}><Icon name="bolt" size={14} />Panel de administración</a>}
            <button className="btn btn-sm btn-ghost" onClick={signOut} style={{ display: "inline-flex" }}><Icon name="close" size={14} />Cerrar sesión</button>
          </div>
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
                <button key={o.id} onClick={() => nav("order", { id: o.id })} className="panel" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", cursor: "pointer", textAlign: "left", width: "100%", color: "inherit" }}>
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
                  <Icon name="chevron" size={16} style={{ color: "var(--text-3)" }} />
                </button>
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

      {tab === "store" && <SellerStoreTab />}

      {tab === "sell" && <SellTab subs={subs} onSubmitted={refresh} />}

      {tab === "details" && <DetailsTab onSaved={() => loadAccount(user.id)} onSignOut={signOut} />}
    </div>
  );
}

/* ---------------- vender cartas (sell_submissions) ---------------- */
const CONDITIONS = [["NM", "Casi nueva"], ["LP", "Poco jugada"], ["MP", "Jugada"], ["HP", "Muy jugada"]];
const GAME_NAME: any = { mtg: "Magic", poke: "Pokémon", op: "One Piece" };

function SellItemRow({ it, onChange, onRemove, onAddPhotos, onRemovePhoto }: any) {
  const fileRef = React.useRef<any>(null);
  const set = (k: string, v: any) => onChange({ ...it, [k]: v });
  const ref = it.market_usd ?? it.market_usd_foil;
  return (
    <div className="panel" style={{ padding: 14, background: "var(--surface-2)", display: "flex", gap: 14, flexWrap: "wrap" }}>
      {/* thumb */}
      <div style={{ width: 58, height: 80, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)", background: "var(--surface-3)", display: "grid", placeItems: "center" }}>
        {it.image ? <img src={it.image} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="search" size={16} style={{ color: "var(--text-4)" }} />}
      </div>

      <div style={{ flex: 1, minWidth: 220 }}>
        {/* nombre + ref de mercado */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {it.manual
              ? <input className="input" value={it.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre de la carta" style={{ fontSize: 14, padding: "7px 10px" }} />
              : <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14.5 }}>{it.name}</div>}
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{GAME_NAME[it.game]}{it.set_name ? ` · ${it.set_name}` : ""}{it.card_number ? ` · ${it.card_number}` : ""}</div>
          </div>
          {ref != null && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="muted" style={{ fontSize: 10.5 }}>Mercado</div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 13, color: "var(--violet)" }}>{HV.fmtArs(HV.ars(ref))}</div>
            </div>
          )}
        </div>

        {/* controles */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          {it.manual && (
            <select className="input" value={it.game} onChange={(e) => set("game", e.target.value)} style={{ width: "auto", padding: "7px 10px", fontSize: 13 }}>
              {Object.entries(GAME_NAME).map(([c, l]: any) => <option key={c} value={c}>{l}</option>)}
            </select>
          )}
          <select className="input" value={it.condition} onChange={(e) => set("condition", e.target.value)} style={{ width: "auto", padding: "7px 10px", fontSize: 13 }} title="Condición">
            {CONDITIONS.map(([c, l]) => <option key={c} value={c}>{c} · {l}</option>)}
          </select>
          <button onClick={() => set("is_foil", !it.is_foil)} style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)", border: `1px solid ${it.is_foil ? "var(--border-glow)" : "var(--border)"}`, background: it.is_foil ? "var(--accent-soft)" : "transparent", color: it.is_foil ? "var(--text)" : "var(--text-3)" }}>Foil</button>
          <QtyStepper value={it.quantity} onChange={(v: number) => set("quantity", v)} />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>Precio US$</span>
            <input className="input" type="number" min="0" step="0.01" value={it.asking_usd} onChange={(e) => set("asking_usd", e.target.value)} placeholder={ref != null ? String(ref) : "—"} style={{ width: 90, padding: "7px 10px", fontSize: 13 }} />
          </label>
        </div>

        {/* fotos */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          {it.photos.map((p: any) => (
            <div key={p.path} style={{ position: "relative", width: 46, height: 46 }}>
              <img src={p.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              <button onClick={() => onRemovePhoto(it.key, p)} title="Quitar foto" style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-3)", color: "var(--text)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}><Icon name="close" size={10} /></button>
            </div>
          ))}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e: any) => { onAddPhotos(it.key, e.target.files); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={it.uploading} className="btn btn-ghost btn-sm" style={{ borderStyle: "dashed" }}>
            <Icon name={it.uploading ? "spark" : "plus"} size={14} />{it.uploading ? "Subiendo…" : "Fotos"}
          </button>
        </div>
      </div>

      <button onClick={() => onRemove(it.key)} title="Quitar carta" className="btn btn-icon btn-sm" style={{ alignSelf: "flex-start" }}><Icon name="close" size={15} /></button>
    </div>
  );
}

function SellTab({ subs, onSubmitted }: any) {
  const { user, showToast } = useHV();
  const [items, setItems] = useState<any[]>([]);
  const [payout, setPayout] = useState("store_credit");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const seq = React.useRef(0);
  const newKey = () => `it-${seq.current++}`;

  const addFromSearch = (c: any) => {
    setItems((prev) => [...prev, {
      key: newKey(), manual: false, game: c.game, name: c.name,
      set_name: c.set_name || "", card_number: c.card_number || "",
      image: c.thumb || c.image || "",
      market_usd: c.usd ?? null, market_usd_foil: c.usd_foil ?? null,
      condition: "NM", is_foil: c.is_foil || false, quantity: 1,
      asking_usd: c.usd != null ? String(c.usd) : "", photos: [], uploading: false,
    }]);
    showToast(`${c.name} agregada a tu lista`);
  };

  const addManual = () => setItems((prev) => [...prev, {
    key: newKey(), manual: true, game: "mtg", name: "", set_name: "", card_number: "", image: "",
    market_usd: null, market_usd_foil: null, condition: "NM", is_foil: false, quantity: 1, asking_usd: "", photos: [], uploading: false,
  }]);

  const updateItem = (next: any) => setItems((prev) => prev.map((it) => it.key === next.key ? next : it));
  const removeItem = (key: string) => setItems((prev) => prev.filter((it) => it.key !== key));

  const addPhotos = async (key: string, fileList: any) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, uploading: true } : it));
    const sb = supabaseBrowser();
    const uploaded: any[] = [];
    for (const file of files as any[]) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
      const { error } = await sb.storage.from("submission-photos").upload(path, file, { cacheControl: "31536000" });
      if (error) { showToast("Error subiendo foto: " + error.message); continue; }
      uploaded.push({ path, preview: URL.createObjectURL(file) });
    }
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, uploading: false, photos: [...it.photos, ...uploaded] } : it));
  };

  const removePhoto = async (key: string, photo: any) => {
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, photos: it.photos.filter((p: any) => p.path !== photo.path) } : it));
    await supabaseBrowser().storage.from("submission-photos").remove([photo.path]);
  };

  const totalRef = items.reduce((n, it) => n + (it.asking_usd ? Number(it.asking_usd) * it.quantity : 0), 0);

  const submit = async () => {
    const valid = items.filter((it) => it.name.trim());
    if (!valid.length) { showToast("Agregá al menos una carta a tu lista"); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: sub, error } = await sb.from("sell_submissions")
      .insert({ user_id: user.id, payout, customer_notes: notes || null, status: "pending" })
      .select().single();
    if (error) { showToast("No pudimos enviar tu lista: " + error.message); setBusy(false); return; }
    const rows = valid.map((it) => ({
      submission_id: sub.id, game: it.game, name: it.name.trim(),
      set_name: it.set_name || null, card_number: it.card_number || null,
      condition: it.condition, is_foil: it.is_foil, quantity: it.quantity,
      asking_price_usd: it.asking_usd === "" ? null : Number(it.asking_usd),
      photo_urls: it.photos.length ? it.photos.map((p: any) => p.path) : null,
    }));
    const { error: e2 } = await sb.from("sell_submission_items").insert(rows);
    if (e2) { showToast("Error guardando los items: " + e2.message); setBusy(false); return; }
    notifyAdmin("sell_submission", { count: valid.reduce((n: number, it: any) => n + it.quantity, 0), payout });
    setItems([]); setNotes("");
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
          <p className="muted" style={{ fontSize: 14, marginBottom: 18, lineHeight: 1.6 }}>Buscá cada carta para tener una referencia de precio de mercado, ajustá la condición y subí fotos del estado real. La revisamos y te enviamos una oferta. Pagamos en efectivo o +10% en crédito.</p>

          <SellCardSearch onPick={addFromSearch} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {items.length === 0
              ? <div className="panel" style={{ padding: "22px 16px", textAlign: "center", background: "var(--surface-2)", borderStyle: "dashed" }}><p className="muted" style={{ fontSize: 13 }}>Tu lista está vacía. Buscá una carta arriba para agregarla.</p></div>
              : items.map((it) => <SellItemRow key={it.key} it={it} onChange={updateItem} onRemove={removeItem} onAddPhotos={addPhotos} onRemovePhoto={removePhoto} />)}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
            <button onClick={addManual} className="btn btn-ghost btn-sm"><Icon name="plus" size={14} />Agregar a mano</button>
            {totalRef > 0 && <div className="muted" style={{ fontSize: 12.5 }}>Tu lista pide aprox. <b style={{ color: "var(--text)" }}>{HV.fmtArs(HV.ars(totalRef))}</b> · {HV.fmtUsd(totalRef)}</div>}
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 11 }}>Forma de pago</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="hv-2col">
              {[["store_credit", "Crédito en tienda", "+10% extra sobre la oferta"], ["cash", "Efectivo", "Pago en 48h tras aceptar"]].map(([id, t, sub2]) => (
                <button key={id} onClick={() => setPayout(id)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `1px solid ${payout === id ? "var(--border-glow)" : "var(--border)"}`, background: payout === id ? "var(--accent-soft)" : "var(--surface-2)" }}>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 13.5 }}>{t}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub2}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condición general, detalles, etc." />
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

/* ---------------- mi tienda (marketplace P2P + perfil social) ---------------- */
const LISTING_STATUS: any = {
  posted:    { label: "En tu binder",       color: "var(--cyan)" },
  submitted: { label: "Enviá a la oficina", color: "var(--gold)" },
  received:  { label: "Recibida",           color: "var(--violet)" },
  approved:  { label: "A la venta ✦",       color: "var(--good)" },
  rejected:  { label: "Rechazada",          color: "#ff7a7a" },
  withdrawn: { label: "Retirada",           color: "var(--text-3)" },
  sold:      { label: "Vendida",            color: "var(--good)" },
};
const COND_OPTS = [["NM", "Casi nueva"], ["LP", "Poco jugada"], ["MP", "Jugada"], ["HP", "Muy jugada"]];

async function uploadCollectionPhoto(userId: string, file: any, showToast: any) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from("collection-photos").upload(path, file, { upsert: true, cacheControl: "31536000" });
  if (error) { showToast("Error subiendo imagen: " + error.message); return null; }
  return sb.storage.from("collection-photos").getPublicUrl(path).data.publicUrl;
}

function ProfileEditor() {
  const { user, profile, nav, loadAccount, showToast } = useHV();
  const [f, setF] = useState({
    handle: profile?.handle || "", bio: profile?.bio || "", instagram: profile?.instagram || "",
    avatar_url: profile?.avatar_url || "", banner_url: profile?.banner_url || "",
    // nuevos perfiles arrancan públicos para aparecer en el marketplace
    profile_public: profile?.handle ? !!profile?.profile_public : true,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));

  const upImg = async (k: string, file: any) => { if (!file) return; const url = await uploadCollectionPhoto(user.id, file, showToast); if (url) set(k, url); };

  const save = async () => {
    if (!f.handle.trim()) { showToast("Elegí un @handle para tu tienda"); return; }
    setBusy(true);
    const handle = f.handle.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
    const { error } = await supabaseBrowser().from("profiles")
      .update({ handle, bio: f.bio || null, instagram: f.instagram || null, avatar_url: f.avatar_url || null, banner_url: f.banner_url || null, profile_public: f.profile_public })
      .eq("id", user.id);
    setBusy(false);
    if (error) showToast(/duplicate|unique/i.test(error.message) ? "Ese @handle ya está tomado" : error.message);
    else { showToast("Perfil guardado ✦"); loadAccount(user.id); }
  };

  return (
    <div className="panel panel-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16 }}>Tu perfil de coleccionista</h3>
        {profile?.handle && <button className="btn btn-ghost btn-sm" onClick={() => nav("profile", { handle: profile.handle })}><Icon name="eye" size={14} />Ver perfil público</button>}
      </div>
      {/* banner + avatar */}
      <div style={{ position: "relative", marginBottom: 54 }}>
        <label style={{ display: "block", height: 120, borderRadius: 14, cursor: "pointer", overflow: "hidden", border: "1px solid var(--border)", background: f.banner_url ? `center/cover url(${f.banner_url})` : "var(--holo)" }}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e: any) => upImg("banner_url", e.target.files?.[0])} />
          <span style={{ position: "absolute", top: 10, right: 12, fontSize: 11.5, background: "rgba(10,10,18,.7)", padding: "4px 10px", borderRadius: 999, color: "#fff" }}>Cambiar banner</span>
        </label>
        <label style={{ position: "absolute", left: 18, bottom: -34, width: 76, height: 76, borderRadius: "50%", border: "3px solid var(--surface)", cursor: "pointer", overflow: "hidden", background: f.avatar_url ? `center/cover url(${f.avatar_url})` : "var(--holo)", display: "grid", placeItems: "center", color: "#0a0a12" }}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e: any) => upImg("avatar_url", e.target.files?.[0])} />
          {!f.avatar_url && <Icon name="plus" size={18} solid />}
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="hv-2col">
        <Field label="@handle (URL de tu tienda)" value={f.handle} onChange={(e: any) => set("handle", e.target.value)} placeholder="lucia.tcg" />
        <Field label="Instagram (opcional)" value={f.instagram} onChange={(e: any) => set("instagram", e.target.value)} placeholder="@holoverse.tcg" />
        <label style={{ display: "block", gridColumn: "1 / -1" }}>
          <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 7, fontWeight: 600 }}>Bio</span>
          <textarea className="input" rows={3} value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Contá qué coleccionás…" style={{ resize: "vertical" }} />
        </label>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer" }}>
        <button onClick={() => set("profile_public", !f.profile_public)} style={{ width: 42, height: 24, borderRadius: 999, border: 0, cursor: "pointer", background: f.profile_public ? "var(--holo)" : "var(--surface-3)", position: "relative", flexShrink: 0 }}>
          <span style={{ position: "absolute", top: 2, left: f.profile_public ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
        </button>
        <span style={{ fontSize: 13.5 }}>Perfil público (visible en el marketplace)</span>
      </label>
      <Btn variant="primary" style={{ marginTop: 18 }} disabled={busy} onClick={save}>{busy ? "Guardando…" : "Guardar perfil"}</Btn>
    </div>
  );
}

function ListingComposer({ onCreated }: any) {
  const { user, showToast } = useHV();
  const [draft, setDraft] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = React.useRef<any>(null);

  const startFrom = (c: any) => setDraft({
    game: c.game, name: c.name, set_name: c.set_name || "", card_number: c.card_number || "", rarity: c.rarity || null,
    is_foil: c.is_foil || false, condition: "NM", description: "", for_sale: false, payout_method: "store_credit",
    price: c.usd != null ? String(c.usd) : "", marketUsd: c.usd ?? null,
    photos: c.image ? [c.image] : [], uploading: false,
  });
  const startManual = () => setDraft({ game: "mtg", name: "", set_name: "", card_number: "", rarity: null, is_foil: false, condition: "NM", description: "", for_sale: false, payout_method: "store_credit", price: "", marketUsd: null, photos: [], uploading: false });
  const set = (k: string, v: any) => setDraft((d: any) => ({ ...d, [k]: v }));

  const addPhotos = async (list: any) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    set("uploading", true);
    const urls: string[] = [];
    for (const file of files as any[]) { const u = await uploadCollectionPhoto(user.id, file, showToast); if (u) urls.push(u); }
    setDraft((d: any) => ({ ...d, uploading: false, photos: [...d.photos, ...urls] }));
  };

  const publish = async () => {
    if (!draft.name.trim()) { showToast("Poné el nombre de la carta"); return; }
    if (draft.for_sale && draft.price === "") { showToast("Poné un precio para vender"); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().from("collection_items").insert({
      owner_id: user.id, game: draft.game, name: draft.name.trim(), set_name: draft.set_name || null,
      card_number: draft.card_number || null, rarity: draft.rarity || null, is_foil: draft.is_foil,
      condition: draft.condition, description: draft.description || null, photo_urls: draft.photos.length ? draft.photos : null,
      for_sale: draft.for_sale, price_usd: draft.for_sale && draft.price !== "" ? Number(draft.price) : null,
      payout_method: draft.payout_method || "store_credit",
      status: draft.for_sale ? "submitted" : "posted",
    });
    setBusy(false);
    if (error) { showToast("Error: " + error.message); return; }
    if (draft.for_sale) notifyAdmin("marketplace_listing", { name: draft.name.trim(), price: draft.price });
    showToast(draft.for_sale ? "¡Listo! Enviá la carta a la oficina para auditarla." : "Agregada a tu binder ✦");
    setDraft(null); onCreated();
  };

  return (
    <div className="panel panel-pad">
      <h3 style={{ fontSize: 16, marginBottom: 6 }}>Publicar una carta</h3>
      <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Buscá tu carta para autocompletar (con referencia de precio), subí fotos reales y elegí si va a tu colección o a la venta.</p>

      {!draft ? (
        <>
          <SellCardSearch onPick={startFrom} />
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={startManual}><Icon name="plus" size={14} />Cargar a mano</button>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="hv-2col">
            <div style={{ gridColumn: "1 / -1" }}><Field label="Nombre" value={draft.name} onChange={(e: any) => set("name", e.target.value)} /></div>
            <Field label="Set" value={draft.set_name} onChange={(e: any) => set("set_name", e.target.value)} />
            <Field label="N°" value={draft.card_number} onChange={(e: any) => set("card_number", e.target.value)} />
            <label style={{ display: "block" }}>
              <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 7, fontWeight: 600 }}>Juego</span>
              <select className="input" value={draft.game || "mtg"} onChange={(e) => set("game", e.target.value)}><option value="mtg">Magic</option><option value="poke">Pokémon</option><option value="op">One Piece</option></select>
            </label>
            <label style={{ display: "block" }}>
              <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 7, fontWeight: 600 }}>Condición</span>
              <select className="input" value={draft.condition} onChange={(e) => set("condition", e.target.value)}>{COND_OPTS.map(([c, l]) => <option key={c} value={c}>{c} · {l}</option>)}</select>
            </label>
          </div>

          <label style={{ display: "block" }}>
            <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 7, fontWeight: 600 }}>Descripción (opcional)</span>
            <textarea className="input" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalles del estado, ediciones, etc." style={{ resize: "vertical" }} />
          </label>

          {/* fotos */}
          <div>
            <span className="muted" style={{ fontSize: 12.5, display: "block", marginBottom: 8, fontWeight: 600 }}>Fotos</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {draft.photos.map((p: string, i: number) => (
                <div key={p} style={{ position: "relative", width: 56, height: 56 }}>
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                  <button onClick={() => set("photos", draft.photos.filter((_: any, j: number) => j !== i))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface-3)", color: "var(--text)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}><Icon name="close" size={10} /></button>
                </div>
              ))}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e: any) => { addPhotos(e.target.files); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} disabled={draft.uploading} className="btn btn-ghost btn-sm" style={{ borderStyle: "dashed" }}><Icon name={draft.uploading ? "spark" : "plus"} size={14} />{draft.uploading ? "Subiendo…" : "Fotos"}</button>
            </div>
          </div>

          {/* foil + a la venta */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => set("is_foil", !draft.is_foil)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)", border: `1px solid ${draft.is_foil ? "var(--border-glow)" : "var(--border)"}`, background: draft.is_foil ? "var(--accent-soft)" : "transparent", color: draft.is_foil ? "var(--text)" : "var(--text-3)" }}>Foil</button>
            <button onClick={() => set("for_sale", !draft.for_sale)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)", border: `1px solid ${draft.for_sale ? "var(--border-glow)" : "var(--border)"}`, background: draft.for_sale ? "var(--accent-soft)" : "transparent", color: draft.for_sale ? "var(--text)" : "var(--text-3)" }}>{draft.for_sale ? "✦ A la venta" : "Solo colección"}</button>
            {draft.for_sale && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>Precio US$</span>
                <input className="input" type="number" min="0" step="0.01" value={draft.price} onChange={(e) => set("price", e.target.value)} placeholder={draft.marketUsd != null ? String(draft.marketUsd) : "—"} style={{ width: 100 }} />
              </label>
            )}
            {draft.for_sale && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="muted" style={{ fontSize: 13 }}>Cobrar como</span>
                <select className="input" value={draft.payout_method} onChange={(e) => set("payout_method", e.target.value)} style={{ width: "auto" }}>
                  <option value="store_credit">Crédito en tienda (+10%)</option>
                  <option value="cash">Efectivo</option>
                </select>
              </label>
            )}
          </div>
          {draft.for_sale && <p className="muted" style={{ fontSize: 12 }}>Comisión de Holoverse al vender: {HV.commissionPct}% · cobrás US$ {draft.price ? (Number(draft.price) * (1 - HV.commissionPct / 100)).toFixed(2) : "—"} neto{draft.payout_method === "store_credit" ? " (+10% de bonus si lo tomás como crédito)" : ""}.</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="holo" disabled={busy} onClick={publish}>{busy ? "Publicando…" : draft.for_sale ? "Publicar a la venta" : "Agregar al binder"}<Icon name="arrow" size={15} /></Btn>
            <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={busy}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SellerStoreTab() {
  const { user, profile, loadAccount, showToast } = useHV();
  const [mine, setMine] = useState<any>(null);
  const [wish, setWish] = useState<any>(null);
  const [payouts, setPayouts] = useState<any>(null);

  const loadBinder = async () => {
    const { data } = await supabaseBrowser().from("collection_items").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setMine(data || []);
  };
  const loadWish = async () => {
    const { data } = await supabaseBrowser().from("card_wishlist").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setWish(data || []);
  };
  const loadPayouts = async () => {
    const { data } = await supabaseBrowser().from("seller_payouts").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    setPayouts(data || []);
  };
  useEffect(() => { loadBinder(); loadWish(); loadPayouts(); }, []);

  const topIds: string[] = profile?.top_card_ids || [];
  const toggleTop = async (id: string) => {
    const next = topIds.includes(id) ? topIds.filter((x) => x !== id) : [...topIds, id].slice(0, 8);
    await supabaseBrowser().from("profiles").update({ top_card_ids: next }).eq("id", user.id);
    loadAccount(user.id);
  };
  const withdraw = async (it: any) => {
    const { error } = await supabaseBrowser().from("collection_items").update({ status: "withdrawn" }).eq("id", it.id);
    if (error) showToast("No se pudo retirar: " + error.message); else { showToast("Carta retirada"); loadBinder(); }
  };

  const addWish = async (c: any) => {
    const { error } = await supabaseBrowser().from("card_wishlist").insert({ user_id: user.id, name: c.name, game: c.game || null });
    if (error) showToast("Error: " + error.message); else { showToast(`Te avisamos cuando se liste ${c.name}`); loadWish(); }
  };
  const delWish = async (id: string) => { await supabaseBrowser().from("card_wishlist").delete().eq("id", id); loadWish(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {!profile?.handle && (
        <div className="panel panel-pad" style={{ borderColor: "var(--border-glow)" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Bienvenido a la comunidad</div>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Armá tu tienda de coleccionista</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Elegí tu @handle, personalizá tu perfil y empezá a postear tu colección o a vender cartas. Holoverse audita, sella y media cada venta.</p>
        </div>
      )}

      <ProfileEditor />
      <ListingComposer onCreated={loadBinder} />

      {/* mi binder */}
      <div className="panel panel-pad">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Mi binder {mine ? `· ${mine.length}` : ""}</h3>
        {mine === null ? <p className="muted">Cargando…</p>
          : mine.length === 0 ? <p className="muted" style={{ fontSize: 13.5 }}>Todavía no publicaste ninguna carta.</p>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mine.map((it: any) => {
                const st = LISTING_STATUS[it.status] || { label: it.status, color: "var(--text-3)" };
                const img = (it.photo_urls || [])[0];
                const isTop = topIds.includes(it.id);
                return (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <div style={{ width: 44, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                      {img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14 }}>{it.name}{it.is_foil ? " ✦" : ""}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{[it.set_name, it.condition, it.for_sale ? HV.fmtUsd(Number(it.price_usd || 0)) : "Colección"].filter(Boolean).join(" · ")}</div>
                    </div>
                    <StatusBadge s={st} />
                    <button onClick={() => toggleTop(it.id)} title="Fijar como Top card" className="btn btn-icon btn-sm" style={{ color: isTop ? "var(--gold)" : "var(--text-3)" }}><Icon name="star" size={15} solid={isTop} /></button>
                    {["posted", "submitted", "rejected"].includes(it.status) && <button onClick={() => withdraw(it)} className="btn btn-ghost btn-sm">Retirar</button>}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* mis ventas / liquidaciones */}
      {payouts && payouts.length > 0 && (
        <div className="panel panel-pad">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Mis ventas</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {payouts.map((p: any) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 600, fontFamily: "var(--font-display)", fontSize: 14 }}>{p.card_name || "Carta"}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{fmtDate(p.created_at)} · {p.method === "store_credit" ? "Crédito en tienda (+10%)" : "Efectivo"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>{HV.fmtUsd(Number(p.net_usd))} neto</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>de {HV.fmtUsd(Number(p.gross_usd))} · {p.commission_pct}% comisión</div>
                </div>
                <StatusBadge s={p.status === "paid" ? { label: "Pagada", color: "var(--good)" } : { label: "Pendiente", color: "var(--gold)" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* alertas de cartas (wishlist) */}
      <div className="panel panel-pad">
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>Alertas de cartas</h3>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>Buscá una carta y te avisamos cuando alguien la liste en el marketplace.</p>
        <SellCardSearch onPick={addWish} />
        {wish && wish.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {wish.map((w: any) => (
              <span key={w.id} className="badge" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12.5, fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                {w.name}
                <button onClick={() => delWish(w.id)} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", padding: 0, display: "grid", placeItems: "center" }}><Icon name="close" size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </div>
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
