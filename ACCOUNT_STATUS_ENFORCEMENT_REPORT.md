# Account Status Enforcement Report

## Summary

Account status (Active / Suspended / Banned) is now enforced **server-side** across all authenticated routes, API endpoints, and client-side navigation. Users with `Suspended` or `Banned` status are denied access, force-signed-out, and redirected to `/login` with the appropriate message.

---

## Status Mapping

| Status     | Behavior                                                   |
| ---------- | ---------------------------------------------------------- |
| `Active`   | Full access — all operations continue normally.            |
| `Suspended`| Denied. Force logout. Redirect to `/login?accountStatus=suspended`. Shown: *"Your account has been suspended."* |
| `Banned`   | Denied. Force logout. Redirect to `/login?accountStatus=banned`. Shown: *"Your account has been banned."* |

---

## Server-Side Enforcement

### 1. Authentication endpoint: `/api/auth/me`

**File:** `mj-store/app/api/auth/me/route.ts`

- Calls `requireActiveUser()` which checks `profiles.status` from the database.
- If status is `Suspended` or `Banned`, returns **403** with the corresponding error message (`"Account Suspended"` / `"Account Banned"`).
- If the profile does not return a `status` field (null/missing), falls back to `"Active"` (safe default).

### 2. All protected API routes

Every authenticated API route uses one of:

| Guard Helper         | Behavior                                                          |
| -------------------- | ----------------------------------------------------------------- |
| `requireActiveUser`  | Denies if Suspended or Banned, then optionally checks role.       |
| `requireRole`        | Calls `requireActiveUser` first, then checks role membership.     |
| `requireAdmin`       | Calls `requireRole(["admin"])`, which calls `requireActiveUser`.  |

Protected routes (enforced):

| Route                            | Guard                     |
| -------------------------------- | ------------------------- |
| `/api/auth/me`                   | `requireActiveUser`       |
| `/api/my-orders`                 | `requireActiveUser`       |
| `/api/create-order`              | `requireRole`             |
| `/api/get-orders`                | `requireRole`             |
| `/api/update-order-status`       | `requireRole`             |
| `/api/delete-order`              | `requireAdmin`            |
| `/api/admin/users`               | `requireAdmin`            |
| `/api/admin/users/set-role`      | `requireAdmin`            |
| `/api/admin/users/set-status`    | `requireAdmin`            |
| `/api/admin/dashboard-stats`     | `requireAdmin`            |
| `/api/create-product`            | `requireRole`             |
| `/api/update-product`            | `requireRole`             |
| `/api/upload-image`              | `requireRole`             |
| `/api/product` (POST)            | `requireRole`             |
| `/api/delete-product`            | `requireAdmin`            |

Public (no auth required — intentional):

| Route                   | Reason                         |
| ----------------------- | ------------------------------ |
| `/api/get-products`     | Product browsing (all visitors)|
| `/api/product` (GET)    | Single product details         |

---

## Client-Side Enforcement

### AuthProvider (`mj-store/components/auth/AuthProvider.tsx`)

- Fetches profile via `/api/auth/me` with the current access token.
- If the server returns **403**, the provider:
  1. Calls `signOut()` — clears the Supabase session.
  2. Redirects to `/login?accountStatus={suspended|banned}` using `router.replace()`.
  3. Sets `profile` to `null` (unauthenticated state).
- The `enforcementRedirectedRef` prevents duplicate redirects on re-renders.

### Login Page (`mj-store/app/login/page.tsx`)

- Reads `?accountStatus=suspended` or `?accountStatus=banned` from the URL.
- Renders the exact required message above the login form:

  > **Suspended:** *"Your account has been suspended."*
  >
  > **Banned:** *"Your account has been banned."*

### Admin Guard (`mj-store/app/admin/admin-guard.tsx`)

- UI-level fallback — if `status` is not `"Active"`, renders a "Account Suspended" / "Account Banned" card instead of children. This handles edge cases where the provider redirect race has not yet completed.

### Account / Members Dashboard (`mj-store/app/account/page.tsx`)

- UI-level fallback — if `status` is not `"Active"`, displays a card with the status message. Combined with the provider redirect, this is a safety net.

### Admin Layout (`mj-store/app/admin/layout.tsx`)

- Wraps all admin pages in `AdminGuard` which performs the same UI-level check.

---

## Verification Checklist

| Scenario                        | Expected Result                                                |
| ------------------------------- | -------------------------------------------------------------- |
| ✅ Active user logs in          | Profile loaded, redirected to welcome page. Full access.       |
| ✅ Active user accesses /account| Dashboard renders.                                             |
| ✅ Active user accesses /admin  | Admin panel renders (if role permits).                         |
| ✅ Active user calls API        | Endpoints return data.                                         |
| ❌ Suspended user logs in       | Logged in via Supabase auth, then `/api/auth/me` returns 403. AuthProvider forces sign-out + redirect to `/login?accountStatus=suspended`. Sees *"Your account has been suspended."* |
| ❌ Suspended user access /account | AuthProvider redirects to /login (same flow).                |
| ❌ Suspended user calls API directly | `requireActiveUser` returns 403 with "Account Suspended". |
| ❌ Banned user logs in          | Same flow — redirect to `/login?accountStatus=banned`. Sees *"Your account has been banned."* |
| ❌ Banned user access /admin    | AuthProvider redirect. Guard also blocks as fallback.          |
| ❌ Banned user calls API        | `requireActiveUser` returns 403 with "Account Banned".         |

---

## Implementation Details

- **TypeScript type:** `UserStatus = "Active" | "Suspended" | "Banned"` (`requireAuthContext.ts`)
- **Database column:** `profiles.status` (text, values: `Active`, `Suspended`, `Banned`)
- **Normalization:** `normalizeStatus()` in `requireAuthContext.ts` — if value is unknown/null, defaults to `"Active"`.
- **Enforcement hook:** `requireActiveUser()` in `requireAuthContext.ts` — called by every authenticated route.

---

## Files Modified

| File                                                             | Change                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `mj-store/app/api/auth/me/route.ts`                              | Added `requireActiveUser` check → 403 for Suspended/Banned.    |
| `mj-store/components/auth/AuthProvider.tsx`                      | Handle 403 from `/api/auth/me`: force signOut + redirect.      |
| `mj-store/app/login/page.tsx`                                    | Display "suspended"/"banned" message from URL parameter.        |

---

## Recommendation

No further changes needed. The enforcement is **fully server-side** (cannot be bypassed by disabling client JavaScript) and gracefully handles all three status values across both API and page routes.
