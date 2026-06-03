# IMPLEMENTATION_REPORT.md — MJ Store Users Management

## Database changes
### 1) Added `profiles.status`
- **Migration:** `mj-store/supabase/migrations/20260610_profiles_add_status.sql`
- **Column:** `public.profiles.status`
- **Type/Default:** `text NOT NULL DEFAULT 'Active'`
- **Constraint:** `status in ('Active','Suspended','Banned')`

### 2) Normalized profile roles to the Users Management spec
- **Migration:** `mj-store/supabase/migrations/20260611_profiles_customer_to_user.sql`
- **Default role:** `customer -> user`
- **Backfill:** updates `profiles.role = 'customer'` to `'user'`
- **Trigger update:** updates `public.handle_new_user_profile()` so newly created users are assigned role `'user'` unless on the admin allowlist (then `'admin'`)

## Files modified / added
### Admin navigation
- **Modified:** `mj-store/app/admin/admin-shell.tsx`
  - Added **Users** entry in the admin sidebar.

### Users admin UI
- **Added:** `mj-store/app/admin/users/page.tsx`
  - `/admin/users` page with:
    - Search by name/email (via API search)
    - Role filter (User/Helper/Moderator/Admin)
    - Status filter (Active/Suspended/Banned)
    - Responsive layout (desktop table + mobile cards)
    - Role dropdown + Status dropdown per user
    - Server-enforced protections reflected in UI (disabled options for self)

### Admin API endpoints
- **Added:** `mj-store/app/api/admin/users/route.ts`
  - `GET /api/admin/users`
  - Supports query params: `search`, `role`, `status`, `limit`
  - Returns: `{ id, full_name, email, role, status, created_at, orders_count }`
  - **Orders count logic:** counts `orders` rows where `orders.customer_name = profiles.full_name`
    - Matches existing app logic used by `/api/my-orders`.

- **Added:** `mj-store/app/api/admin/users/set-role/route.ts`
  - `POST /api/admin/users/set-role`
  - Body: `{ userId, role }`
  - Validates allowed transitions per spec (undirected adjacency):
    - User ↔ Helper
    - User ↔ Moderator
    - User ↔ Admin
    - Helper ↔ Moderator
    - Moderator ↔ Admin
  - **Self-protection:** prevents an admin from removing their own Admin role.

- **Added:** `mj-store/app/api/admin/users/set-status/route.ts`
  - `POST /api/admin/users/set-status`
  - Body: `{ userId, status }`
  - **Self-protection:** prevents an admin from suspending/baning themselves.

## Security rules
- **Non-admin access protection**
  - All admin API routes require `requireAdmin(req)` (server-side).
  - `/admin/users` is also protected by `AdminGuard` + `AdminLayout` (client-side redirect if role !== `admin`).

- **Admin protections**
  - Admin cannot suspend/ban themselves:
    - enforced in `set-status` route.
  - Admin cannot remove their own Admin role:
    - enforced in `set-role` route.

## Role system
- Stored in `public.profiles.role` as:
  - `user`, `helper`, `moderator`, `admin`
- Default new users:
  - role `'user'`
- Admin promotion:
  - derived from existing admin allowlist trigger/seed (still sets role to `'admin'`).

## Status system
- Stored in `public.profiles.status`:
  - `Active` (default), `Suspended`, `Banned`
- Admin can change any user’s status via `POST /api/admin/users/set-status`.

## Build / testing
- **Build command:** `npm --prefix mj-store run build`
- **Result:** `next build` completed successfully with **no TypeScript/build errors**.
