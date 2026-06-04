# ROLE_ENFORCEMENT_REPORT.md

## What this fixes
Implements the requested **Role & Status Enforcement System** so that:
- **Suspended** and **Banned** users:
  - can sign in, but are blocked from dashboard/admin/checkout/order access
  - receive “Account Suspended” / “Account Banned” messaging
- **Dashboard shows the real role** (Admin / Moderator / Helper / User), not “Customer”
- **Role permissions are enforced server-side on APIs** (not only via hidden UI)

## Files modified
### Auth / status data plumbing
- `app/api/auth/me/route.ts`
  - Added `profile.status` to the JSON payload returned to the frontend.
- `components/auth/AuthProvider.tsx`
  - Exposed `status` in the Auth context.

### Server-side enforcement utilities
- `app/lib/auth/requireAuthContext.ts`
  - Added `requireActiveUser()` / `requireRole()` helpers:
    - Blocks `status === "Suspended"` / `status === "Banned"`
    - Normalizes legacy roles

### Server-side admin enforcement
- `app/lib/auth/requireAdmin.ts`
  - Now uses `requireRole(req, ["admin"])` so suspended/banned admins can’t hit admin APIs.

### Server-side API permissions (role + status)
- `app/api/auth/me/route.ts` (status field)
- `app/api/my-orders/route.ts`
  - Uses `requireActiveUser(req)` (blocks Suspended/Banned)
- `app/api/create-order/route.ts`
  - Uses `requireRole(req, ["user","helper","moderator","admin"])` (blocks Suspended/Banned)
- `app/api/get-orders/route.ts`
  - Allowed roles: `admin`, `moderator`
- `app/api/create-product/route.ts`
  - Allowed roles: `admin`, `moderator`
- `app/api/update-product/route.ts`
  - Allowed roles: `admin`, `moderator`
- `app/api/upload-image/route.ts`
  - Allowed roles: `admin`, `moderator`
- `app/api/product/route.ts`
  - Allowed roles: `admin`, `moderator`

> Note: “delete” and “update-order-status” endpoints were already admin-only via `requireAdmin`, which is now also status-aware.

### UI gating + dashboard role/status display
- `components/auth/StorefrontNavbar.tsx`
  - Navbar auth visibility fixed for new role names (User/Helper/Moderator/Admin) + legacy `customer`.
- `components/members/useMyOrders.ts`
  - Fast-fails on Suspended/Banned from Auth context.
- `app/admin/admin-guard.tsx`
  - Suspended/Banned blocked from admin pages.
  - Admin + Moderator allowed by layout (role configurable).
- `app/admin/layout.tsx`
  - Allows `admin` and `moderator` in the admin layout shell.
- `app/admin/users/page.tsx`
  - Admin-only (role/status gating in UI; server APIs already enforce admin-only).
- `app/account/page.tsx`
  - Dashboard role labels updated to real roles (User/Helper/Moderator/Admin)
  - Suspended/Banned users get “Account Suspended/Banned” screen.
- `app/checkout/checkout-client.tsx`
  - Shows “Account Suspended/Banned” message and sends Authorization header to create-order.

### Moderator admin UI restrictions (UX only; server is authoritative)
- `app/admin/products/page.tsx`
  - Moderator cannot delete products (UI disable + handler guard).
- `app/admin/orders/page.tsx`
  - Moderator cannot change status nor delete orders (UI disable + handler guards).

## Permissions matrix (requested)
Legend:
- ✓ allowed
- ✗ not allowed

### Status gating
| Status | Dashboard | Checkout | Orders | Admin console / user management |
|---|---:|---:|---:|---:|
| Active | ✓ | ✓ | ✓ | ✓ (Admin only) |
| Suspended | ✗ (shown message) | ✗ (shown message) | ✗ (API blocks) | ✗ |
| Banned | ✗ (shown message) | ✗ (shown message) | ✗ (API blocks) | ✗ |

### Role permissions
| Role | Browsing | Orders | Account | Create products | Edit products | Delete products | View orders | Delete orders | Update order status | Manage users/roles |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| User | ✓ | ✓ (via my-orders) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Helper | ✓ | ✓ (via my-orders) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Moderator | ✓ | ✓ (via my-orders) | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Server-side enforcement coverage
Server-side enforcement is done in:
- `requireAuthContext.ts` (`requireActiveUser`, `requireRole`)
- All critical APIs updated to call `requireActiveUser` / `requireRole` / `requireAdmin`:
  - `my-orders`, `create-order`, `get-orders`, `create-product`, `update-product`, `upload-image`, `product`
  - Admin-only behaviors continue to be enforced by `requireAdmin` (and now also checks status)

## Tests / verification performed
- Ran Next.js build verification:
  - `npm --prefix mj-store run build`
  - Result: **Compiled successfully**, **TypeScript stage finished successfully**, static pages generated, routes listed (no build failures shown in output).

## Known constraints / notes
- UI gating mirrors server-side enforcement. Server-side is the source of truth for blocked actions.
