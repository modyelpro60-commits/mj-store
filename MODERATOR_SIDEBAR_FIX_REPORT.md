# MODERATOR_SIDEBAR_FIX_REPORT.md

## Goal
Fix moderator sidebar/header navigation so moderators:
- do **not** see the **Users** item anywhere in the admin UI
- cannot access `/admin/users` (server-side API protection remains in place; client-side page redirect is kept)

Expected navigation visibility:
- Admin: Overview, Products, Users, Orders
- Moderator: Overview, Products, Orders (no Users)

## Changes made

### 1) Hide `/admin/users` from admin sidebar + header nav
**File:** `mj-store/app/admin/admin-shell.tsx`

**What changed:**
- Filtered the `navItems` list so `/admin/users` is included **only when `role === "admin"`**.
- The same filter is applied for:
  - the left sidebar navigation
  - the top header “pill” navigation

So moderators will never be able to click “Users” from the admin chrome.

### 2) Keep `/admin/users` protected
**File:** `mj-store/app/admin/users/page.tsx`

- The page already redirects client-side if `role !== "admin"`.
- All user-management actions are backed by server-side protected APIs under:
  - `app/api/admin/users/*` (requires admin role)

## Permissions audit (effective)
| Role | Sidebar Users item | Can click Users link | Direct `/admin/users` route |
|---|---:|---:|---|
| admin | ✓ | ✓ | ✓ |
| moderator | ✗ | ✗ | ✗ (client redirect; APIs enforced server-side) |
| suspended/banned | ✗ (blocked by admin guard pages) | ✗ | ✗ |

## Verification
- Pending: final `npm --prefix mj-store run build` after UI changes.
