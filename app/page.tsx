import Holoverse from "../components/Holoverse";
import { getCatalog } from "../lib/catalog";

// ISR: la home se sirve cacheada; el admin dispara /api/revalidate al guardar
// (revalidate de 1h como red de seguridad por si esa llamada falla)
export const revalidate = 3600;

export default async function Page() {
  const catalog = await getCatalog();
  return <Holoverse catalog={catalog} />;
}
