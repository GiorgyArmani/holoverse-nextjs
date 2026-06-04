# Holoverse — Base de datos (Supabase)

## Cómo aplicarla

1. Creá el proyecto en [supabase.com](https://supabase.com) (región `sa-east-1` / São Paulo es la más cercana a Buenos Aires).
2. En el **SQL Editor**, ejecutá en orden:
   - `migrations/20260603000001_init.sql` (esquema, RLS, triggers, storage)
   - `migrations/20260603000002_seed.sql` (catálogo actual)
3. Copiá `Project URL` y `anon key` (Settings → API) a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. **Crear tu cuenta admin**: registrate normalmente en la app (o en Authentication → Add user), y después en SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'matt@mrmcapitalgroup.com';
   ```

## Modelo

| Tabla | Qué guarda |
|---|---|
| `profiles` | 1:1 con `auth.users`. Rol (`customer`/`admin`) y crédito en tienda (ARS). Se crea solo al registrarse. |
| `products` | Catálogo completo: singles, sellado y accesorios. Flags de admin: `is_hot` (hot sale, con `sale_price_usd` opcional), `is_new`, `is_preorder` + `release_date` (pre-release de sellado), `is_active` (ocultar sin borrar). |
| `product_conditions` | Solo singles: precio y stock por condición (NM/LP/MP/HP). |
| `sell_submissions` | El cliente nos vende: estado `pending → accepted/rejected → paid`, payout (efectivo o crédito +10%), notas del cliente y del admin, oferta final. |
| `sell_submission_items` | Cada carta que declara el cliente (juego, set, condición, foil, precio pedido, fotos) + contraoferta del admin y link al producto publicado si se acepta. |
| `orders` / `order_items` | Pedidos con snapshot de precio y tipo de cambio (`fx_rate`) al momento de comprar. |
| `wishlist_items` | Deseos por usuario. |
| `site_settings` | Fila única: cotización USD→ARS, umbral de envío gratis, costo de envío, texto del anuncio. Editable desde el admin. |

## Reglas de negocio automáticas (triggers)

- **Stock**: al insertar `order_items` se descuenta stock (por condición si es single, del producto si no); si el pedido pasa a `cancelled` se repone. Los `CHECK (stock >= 0)` frenan la sobreventa.
- **Crédito +10%**: cuando una venta de cliente pasa a `paid` con payout `store_credit`, se acredita `offer_total_ars × 1.10` automáticamente.
- **Anti-escalación**: un cliente no puede cambiarse el rol ni el crédito aunque edite su perfil.

## Seguridad (RLS)

- Catálogo y settings: lectura pública (anon), escritura solo admin.
- Ventas de clientes: el dueño crea y solo puede editar mientras está `pending`; el admin ve todo, acepta/rechaza/paga.
- Pedidos: el dueño crea y ve los suyos; solo el admin cambia estados.
- Storage: `product-images` público (escribe admin) · `submission-photos` privado, cada cliente sube a su carpeta `<uid>/...` y solo él + admin pueden ver.

## Flujo "el cliente nos vende un single"

1. Cliente crea `sell_submission` + items con fotos (`pending`).
2. Admin lo ve en su listado, revisa la info/fotos, carga `offer_price_usd` por item y `offer_total_ars`.
3. Admin pasa a `accepted` (o `rejected` con `admin_notes` como motivo).
4. Al recibir las cartas, admin marca `paid` → si el payout es crédito, se acredita +10% solo.
5. Admin publica la carta: crea el `product` (+ su condición) y guarda el id en `listed_product_id`.

## Próximos pasos (app)

- `npm i @supabase/supabase-js @supabase/ssr` y cliente en `lib/supabase.ts`.
- Reemplazar `HV.*` (mock) por queries a `products`/`product_conditions` (el campo `sku` mapea a los ids actuales s1/b1/a1).
- Login/registro con Supabase Auth y panel `/admin` protegido con `is_admin()`.
