# MODERATOR_ACCESS_REPORT.md

## Goal
Fix moderator admin access issues:
- Moderator should see the **Admin** navbar button
- Moderator should be able to access:
  - `/admin` dashboard
  - `/admin/products` (manage products, but not delete)
  - `/admin/orders` (view orders, but not change status or delete)
- Moderator must NOT access:
  - `/admin/users` (no user management / no role changes)
- Admin permissions must remain unchanged

## What changed

### 1) Navbar: show Admin button for moderator
**File:** `mj-store/components/auth/StorefrontNavbar.tsx`  
**Change:** Render the Admin link when `role === "admin" || role === "moderator"` (previously only `admin`).

### 2) Admin access guard: allow moderators in admin shell
**File:** `mj-store/app/admin/admin-guard.tsx`  
**Change:** Removed the hard-coded `role !== "admin"` redirect and made it respect `allowedRoles` prop.

**File:** `mj-store/app/admin/layout.tsx`  
**Change:** Parent admin layout now passes `allowedRoles={["admin","moderator"]}`.

### 3) Sensitive page: restrict `/admin/users` to admin-only
**File:** `mj-store/app/admin/users/page.tsx`  
**Change:** UI+client redirect for non-admin roles and suspended/banned status.

> Note: the underlying user-management APIs already require server-side admin via `requireAdmin`, so moderators cannot actually manage users even if they hit the page route.

### 4) Moderator UI restrictions (products + orders)
**Files:**
- `mj-store/app/admin/products/page.tsx`
  - Moderator cannot delete products (UI disable + handler guard)
- `mj-store/app/admin/orders/page.tsx`
  - Moderator cannot change order status or delete orders (UI disable + handler guard)

## Permissions matrix (effective behavior)
| Role | Navbar Admin button | /admin | /admin/products | /admin/orders | /admin/users |
|---|---|---|---|---|---|
| admin | ✓ | ✓ | ✓ (full) | ✓ (full) | ✓ |
| moderator | ✓ | ✓ | ✓ (no delete) | ✓ (no status change, no delete) | ✗ |
| suspended/banned | (blocked by guard pages) | ✗ | ✗ | ✗ | ✗ |

## Server-side protection notes
Critical admin actions are enforced server-side in API routes via:
- `requireAdmin` (admin-only; also status-aware)
- `requireRole` / `requireActiveUser` added to non-admin/admin-sensitive endpoints earlier

## Verification performed
- Ran `npm --prefix mj-store run build`
- Next build compiled successfully and TypeScript stage completed.
