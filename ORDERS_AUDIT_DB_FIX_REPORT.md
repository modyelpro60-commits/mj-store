# ORDERS_AUDIT_DB_FIX_REPORT.md

## Problem
Runtime error: **“Could not find the 'handled_at' column of 'orders' in the schema cache”**.

Root cause confirmed via live DB inspection (pre-fix):
- Live `orders` table did **not** contain:
  - `handled_by`
  - `handled_by_name`
  - `handled_at`
- Additionally, `created_at` was also missing from the live `orders` table, causing the admin UI to show “Created At: Unknown”.

Code + UI were updated before the DB migration was actually applied.

---

## Live Supabase orders table verification (PostgREST)

### Pre-fix verification
Using PostgREST:
- `GET /rest/v1/orders?select=*&limit=1`

Returned row keys:
- `customer_name, customer_phone, id, price, product_id, product_name, status`

And checks:
- `HAS_handled_by=False`
- `HAS_handled_by_name=False`
- `HAS_handled_at=False`

### Migration application performed
Applied the updated migration SQL (updated in this repo):
- `mj-store/supabase/migrations/20260613_orders_handled_by_fields.sql`

### Post-fix verification (current)
Re-ran the same PostgREST check:
- `GET /rest/v1/orders?select=*&limit=1`

Returned row keys now include:
- `created_at, handled_at, handled_by, handled_by_name, ...`

And checks:
- `HAS_handled_by=True`
- `HAS_handled_by_name=True`
- `HAS_handled_at=True`

**Conclusion:** Required audit/timestamp columns now exist in the live schema.

---

## Required DB fixes (in repo)
Updated migration:
- `mj-store/supabase/migrations/20260613_orders_handled_by_fields.sql`

Now adds:
- `created_at timestamptz default now()`
- `handled_by uuid null`
- `handled_by_name text null`
- `handled_at timestamptz null`

---

## API/UI readiness (code-side)
### Update order status (role enforcement + audit writes)
- `mj-store/app/api/update-order-status/route.ts`
  - Authorization: `requireRole(req, ["admin","moderator"])`
  - Writes:
    - `status`
    - `handled_by = ctx.userId`
    - `handled_by_name = profiles.full_name`
    - `handled_at = new Date().toISOString()`

### Get orders (ensures UI fields are present)
- `mj-store/app/api/get-orders/route.ts`
  - Normalizes:
    - `created_at` (best-effort column-name heuristic)
    - `handled_*` from the row

### Delete order (admin-only)
- `mj-store/app/api/delete-order/route.ts`
  - Still calls `requireAdmin(req)` → moderators cannot delete

### Admin Orders UI
- `mj-store/app/admin/orders/page.tsx`
  - Displays:
    - `Created At: {formatted created_at}` (fallback `N/A`)
    - “Handled By” purple badge when `handled_by` exists
  - Shows status dropdown for admin + moderator
  - Shows delete button only for admin

---

## Verification remaining (requires real moderator/admin session tokens)
Because role-guarded endpoints require a valid user bearer token, I verified:
- **Schema correctness** (columns exist) via PostgREST ✅
- **Endpoint logic correctness** via code changes ✅

To fully complete the behavioral matrix, you should re-test in your app with real accounts:
- Moderator:
  - ✅ update order status
  - ✅ “Handled By” badge appears
  - ✗ delete order
- Admin:
  - ✅ update order status
  - ✅ delete order

---

## Files impacted by code + schema updates
- `mj-store/app/api/update-order-status/route.ts`
- `mj-store/app/api/get-orders/route.ts`
- `mj-store/app/admin/orders/page.tsx`
- `mj-store/supabase/migrations/20260613_orders_handled_by_fields.sql`
