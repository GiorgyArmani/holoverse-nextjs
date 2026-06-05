"use client";
/* Holoverse — app shell de la tienda: router interno, carrito, auth y wishlist.
   Cada sección vive en components/store/. */
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { hydrateHV } from "../lib/data";
import { supabaseBrowser } from "../lib/supabase-browser";
import { HVCtx } from "./store/context";
import { Toast } from "./store/ui";
import Header from "./store/Header";
import Footer from "./store/Footer";
import StaggeredMenu from "./store/Menu";
import Prisma from "./store/Prisma";
import Home from "./store/Home";

/* solo Home entra en el bundle inicial; el resto se baja al navegar */
function ScreenLoading() {
  return <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}><p className="muted">Invocando…</p></div>;
}
const lazy = (loader: any) => dynamic(loader, { loading: ScreenLoading });
const Browse = lazy(() => import("./store/Browse"));
const SearchResults = lazy(() => import("./store/Browse").then((m) => m.SearchResults));
const SinglePDP = lazy(() => import("./store/PDP").then((m) => m.SinglePDP));
const SealedPDP = lazy(() => import("./store/PDP").then((m) => m.SealedPDP));
const CartCheckout = lazy(() => import("./store/Cart"));
const Account = lazy(() => import("./store/Account"));
const SearchOverlay = dynamic(() => import("./store/SearchOverlay"));

const ACCENTS = {
  holo:   { violet: "#8b7dff" },
  violet: { violet: "#8b7dff" },
  cyan:   { violet: "#4fdcff" },
  pink:   { violet: "#ff7ac8" },
};

function Placeholder({ title }: any) {
  return (
    <div className="wrap" style={{ padding: "120px 28px", textAlign: "center" }}>
      <div className="eyebrow">Holoverse</div>
      <h1 style={{ fontSize: 40, marginTop: 12 }}>{title}</h1>
      <p className="muted" style={{ marginTop: 12 }}>Pantalla en construcción.</p>
    </div>
  );
}

export default function App({ catalog }: { catalog?: any }) {
  hydrateHV(catalog); // catálogo real de Supabase (o mock si la DB no respondió)
  const t: any = { heroLayout: "stage", cardStyle: "minimal", density: "regular", accent: "holo" };
  const [view, setView] = useState({ route: "home", params: {} });
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef(null);

  /* ---- catálogo fresco: al volver a la pestaña, re-pedimos el catálogo
     al server (router.refresh actualiza las props sin perder carrito/estado) ---- */
  const router = useRouter();
  const lastRefresh = useRef(Date.now());
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh.current < 10_000) return; // throttle 10s
      lastRefresh.current = Date.now();
      router.refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [router]);

  /* ---- auth (Supabase) ---- */
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wishlist, setWishlist] = useState([]); // product uuids
  const [authReady, setAuthReady] = useState(false);

  const loadAccount = async (uid) => {
    const sb = supabaseBrowser();
    const [{ data: prof }, { data: wl }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).single(),
      sb.from("wishlist_items").select("product_id").eq("user_id", uid),
    ]);
    setProfile(prof || null);
    setWishlist((wl || []).map((w) => w.product_id));
  };

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      if (data.user) loadAccount(data.user.id);
      setAuthReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) loadAccount(u.id);
      else { setProfile(null); setWishlist([]); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabaseBrowser().auth.signOut(); showToast("Sesión cerrada"); nav("home"); };

  const toggleWish = async (item) => {
    if (!user) { showToast("Iniciá sesión para guardar deseos"); nav("account"); return; }
    if (!item.uuid) return;
    const sb = supabaseBrowser();
    if (wishlist.includes(item.uuid)) {
      setWishlist((w) => w.filter((u) => u !== item.uuid));
      await sb.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", item.uuid);
    } else {
      setWishlist((w) => [...w, item.uuid]);
      await sb.from("wishlist_items").insert({ user_id: user.id, product_id: item.uuid });
      showToast(`${item.name.split("(")[0].trim()} guardado en deseos`);
    }
  };

  const nav = (route, params = {}) => { setView({ route, params }); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "instant" }); };

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const addToCart = (item, qty = 1, condition = null) => {
    setCart((c) => {
      const key = item.id + (condition ? ":" + condition : "");
      const found = c.find((x) => x.key === key);
      if (found) return c.map((x) => x.key === key ? { ...x, qty: x.qty + qty } : x);
      return [...c, { key, item, qty, condition }];
    });
    showToast(`Agregaste ${item.name.split("(")[0].trim()} al carrito`);
  };
  const removeFromCart = (key) => setCart((c) => c.filter((x) => x.key !== key));
  const setQty = (key, qty) => setCart((c) => c.map((x) => x.key === key ? { ...x, qty } : x));
  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartTotalUsd = cart.reduce((n, x) => {
    const price = x.condition ? (x.item.conditions.find((cd) => cd[0] === x.condition)?.[1] ?? x.item.usd) : x.item.usd;
    return n + price * x.qty;
  }, 0);

  // apply accent tweak
  useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS.holo;
    document.documentElement.style.setProperty("--accent", a.violet);
    document.documentElement.style.setProperty("--violet", a.violet);
  }, [t.accent]);

  const ctx = {
    route: view.route, params: view.params, nav,
    cart, cartCount, addToCart, removeFromCart, setQty, cartTotalUsd,
    openSearch: () => setSearchOpen(true), closeSearch: () => setSearchOpen(false),
    menuOpen, toggleMenu: () => setMenuOpen((o) => !o), closeMenu: () => setMenuOpen(false),
    showToast, cardStyle: t.cardStyle, heroLayout: t.heroLayout, density: t.density, tweaks: t,
    user, profile, authReady, signOut, loadAccount,
    wishlist, toggleWish, isWished: (item) => !!item.uuid && wishlist.includes(item.uuid),
  };

  const SCREENS = {
    home: Home, browse: Browse, search: SearchResults,
    single: SinglePDP, sealed: SealedPDP, cart: CartCheckout, account: Account,
  };
  const Screen = SCREENS[view.route] || (() => <Placeholder title={view.route} />);

  return (
    <HVCtx.Provider value={ctx}>
      <div className="hv-app">
        <Header />
        <main className="hv-main">
          <Screen key={view.route + JSON.stringify(view.params)} {...view.params} />
        </main>
        <Footer />
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      <StaggeredMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Prisma />
      <Toast msg={toast} />
    </HVCtx.Provider>
  );
}
