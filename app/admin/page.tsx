import { supabaseRSC } from "../../lib/supabase-server";
import AdminPanel from "../../components/Admin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
};

function Denied({ title, msg }: { title: string; msg: string }) {
  return (
    <div className="wrap" style={{ padding: "120px 28px", textAlign: "center", maxWidth: 520 }}>
      <div className="eyebrow">Holoverse · Admin</div>
      <h1 style={{ fontSize: 34, marginTop: 12 }}>{title}</h1>
      <p className="muted" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>{msg}</p>
      <a href="/" className="btn btn-holo" style={{ marginTop: 26, display: "inline-flex" }}>Volver a la tienda</a>
    </div>
  );
}

export default async function AdminPage() {
  const sb = supabaseRSC();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return <Denied title="Iniciá sesión" msg="Para entrar al panel tenés que iniciar sesión desde la tienda (ícono de usuario) con una cuenta de administrador." />;
  }

  const { data: profile } = await sb.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return <Denied title="Acceso restringido" msg="Tu cuenta no tiene permisos de administración. Si creés que es un error, contactá al dueño de la tienda." />;
  }

  // el resumen se arma en el servidor (la sesión ya está validada acá)
  const [total, active, low, orders, subs] = await Promise.all([
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    sb.from("products").select("name, stock").neq("type", "single").lte("stock", 3).eq("is_active", true).order("stock").limit(6),
    sb.from("orders").select("id, order_number, status, total_ars, created_at, profiles!orders_user_id_fkey(email, full_name)").order("created_at", { ascending: false }).limit(50),
    sb.from("sell_submissions").select("id, status, created_at, offer_total_ars, profiles!sell_submissions_user_id_fkey(email, full_name)").order("created_at", { ascending: false }).limit(50),
  ]);

  const dash = {
    total: total.count ?? 0,
    active: active.count ?? 0,
    low: low.data || [],
    orders: orders.data || [],
    subs: subs.data || [],
  };

  return <AdminPanel adminName={profile.full_name || user.email} dash={dash} />;
}
