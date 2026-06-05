import Holoverse from "../components/Holoverse";
import { getCatalog } from "../lib/catalog";

// catálogo siempre fresco: los cambios del admin se ven al instante
export const dynamic = "force-dynamic";

export default async function Page() {
  const catalog = await getCatalog();
  return <Holoverse catalog={catalog} />;
}
