/* Avisa al server que el catálogo cambió → regenera la home cacheada.
   Fire-and-forget: si falla, el revalidate de 1h de la home lo cubre. */
export function revalidateHome() {
  fetch("/api/revalidate", { method: "POST" }).catch(() => {});
}
