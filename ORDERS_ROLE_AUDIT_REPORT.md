# ORDERS_ROLE_AUDIT_REPORT.md

## Scope
Audit and implementation updates for **Orders Admin** behavior:
1) Fix “Created At: Unknown”
2) Allow **Moderator** to update order status (but not delete)
3) Add “Handled By” audit fields + badge:
   - `handled_by`
   - `handled_by_name`
   - `handled_at`
4) Ensure server-side enforcement (not UI-only)

---

## 1) Created At fix (“Unknown” → real timestamp)
### Admin UI
- `app/admin/orders/page.tsx`
  - Added `created_at` support in `OrderRecord`
  - Added `formatOrderTimestamp()` and now renders:
    - `Created At: {formatOrderTimestamp(order.created_at)}`
  - Fallback to `N/A` when missing/invalid

### API normalization
- `app/api/get-orders/route.ts`
  - Added best-effort normalization for `created_at` by scanning the row for a column whose name contains:
    - `created` AND (`at` OR `date`)
  - Returns `created_at` as `created_at` in the JSON response for the UI

> This is a “safe” approach in case the DB column name differs from what the UI expects, while still displaying a correct created timestamp when present.

---

## 2) Moderator can update status; delete remains admin-only (server-side)
### Server-side enforcement (required)
- `app/api/update-order-status/route.ts`
  - Changed authorization from admin-only to:
    - `requireRole(req, ["admin","moderator"])`
  - Moderators can update order status.

### UI enforcement (extra safety/UX)
- `app/admin/orders/page.tsx`
  - Status dropdown is enabled for:
    - `admin OR moderator`
  - Delete button is visible only for:
    - `admin`
  - Client-side handler guard also blocks moderators from calling delete.

### Delete endpoint remains admin-only
- `app/api/delete-order/route.ts`
  - Still calls `requireAdmin(req)`
  - Therefore moderators cannot delete orders server-side.

---

## 3) Handled By audit fields + badge
### Migration (backward compatible)
- `supabase/migrations/20260613_orders_handled_by_fields.sql`
  - Adds nullable columns:
    - `handled_by uuid`
    - `handled_by_name text`
    - `handled_at timestamptz`

### Status update writes audit fields
- `app/api/update-order-status/route.ts`
  - On every status change it now updates:
    - `status`
    - `handled_by` = actor `ctx.userId`
    - `handled_by_name` = `profiles.full_name` for the actor
    - `handled_at` = `new Date().toISOString()`

### Admin UI renders badge
- `app/admin/orders/page.tsx`
  - If `order.handled_by` exists:
    - Shows a premium purple card:
      - “Handled By”
      - actor name
      - formatted `handled_at`

---

## 4) Role behavior matrix (effective)
| Role | Update Status | Delete Order | Created At | Handled By badge |
|---|---|---|---|---|
| Admin | ✓ | ✓ | ✓ | ✓ |
| Moderator | ✓ | ✗ | ✓ | ✓ |
| Suspended/Banned | blocked by auth/status guards elsewhere | ✗ | ✗ | ✗ |

---

## Verification to run
- Run: `npm --prefix mj-store run build`
- Fix any TypeScript errors if compilation fails
