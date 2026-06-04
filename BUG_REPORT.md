# Full QA Audit Report

## Roles Audited
- **Admin** — has access to all pages, API endpoints, and admin actions
- **Moderator** — has limited admin access (no users page, no delete, no role/status management)
- **User** — regular authenticated user (account dashboard, checkout, own orders)
- **Guest** — unauthenticated visitor (public pages only)

## Scope
Every page, every API route, every permission guard, and every navigation flow was audited by reading the full source code.

---

## BUG-001: `AdminGuard` does not reject Suspended/Banned — only blocks role mismatch

**Severity:** High  
**Affected:** All admin pages (`/admin/*`)  
**File:** `mj-store/app/admin/admin-guard.tsx`

**Description:**  
`AdminGuard` checks `role` membership but does not check `status`. There's a separate `if (status && status !== "Active")` fallback render, but **no redirect** to `/login`. The Suspended/Banned user sees a static "Account Suspended" / "Account Banned" card, but they are never force-redirected to `/login`.

**Root cause:** The status check only renders a message, it doesn't call `router.replace("/login")` or `signOut()`. The `AuthProvider` may clear their profile, but the user can still manually navigate to other pages and get stuck.

**Fix:** Add `router.replace("/login")` in the status check, similar to how role check redirects.

**Code reference (lines ~30-40):**
```tsx
if (!isLoading && status && status !== "Active") {
  // Should call router.replace("/login") here
  // Currently only renders a message
```

---

## BUG-002: `AdminGuard` allows moderator to view Users page when `allowedRoles` defaults to `["admin"]`

**Severity:** Medium  
**Affected:** `/admin/users`  
**File:** `mj-store/app/admin/layout.tsx`

**Description:**  
`AdminLayout` passes `allowedRoles={["admin", "moderator"]}` to `AdminGuard`, which means **moderators can see the Users page**. The Users page itself has a client-side check (`if (role !== "admin") router.replace("/")`) as a safety net, but the layout-level guard should also prevent this.

**Impact:** Moderators briefly see admin-only content before the client-side redirect fires.

**Fix:** Either remove `"moderator"` from the layout's `allowedRoles`, or move the role check to the layout/guard.

---

## BUG-003: `AdminGuard` has a flash of "Redirecting…" for unauthorized roles before redirect

**Severity:** Low (UX)  
**Affected:** All admin pages for user/helper roles  
**File:** `mj-store/app/admin/admin-guard.tsx`

**Description:**  
When `allowedRoles` excludes the current role, a "Redirecting…" card is rendered while `useEffect` prepares `router.replace("/")`. This causes a visible flash.

**Fix:** Return `<></>` (null fragment) when role check fails, with the redirect happening in the effect.

---

## BUG-004: `UsersPage` client-side guard `router.replace("/")` is not paired with `status` redirect

**Severity:** Low  
**Affected:** `/admin/users`  
**File:** `mj-store/app/admin/users/page.tsx`

**Description:**  
The users page guards against non-admin roles (`if (role !== "admin") router.replace("/")`) and checks `status !== "Active"` but does **nothing** for Suspended/Banned — it just returns early without any redirect or message.

**Root cause:** Line ~95:
```tsx
if (status && status !== "Active") return;
```
This silently stops rendering but doesn't redirect the user or show any UI.

**Fix:** Add a redirect or error card for Suspended/Banned users.

---

## BUG-005: `DashboardStats` route requires `requireAdmin` but `requireAdmin` calls `requireRole(["admin"])` which does NOT reject Suspended/Banned

**Severity:** Critical — needs verification  
**Affected:** `GET /api/admin/dashboard-stats`  
**File:** `mj-store/app/api/admin/dashboard-stats/route.ts`

**Description:**  
`requireAdmin` calls `requireRole(["admin"])` which calls `requireActiveUser(req, ["admin"])`. `requireActiveUser` DOES check status first (`if status === "Suspended"` / `"Banned"` throw forbidden). So this is **actually safe**, but the pattern is inconsistent with how `AdminGuard` works (no status check there).

**Verdict:** ✅ NOT a bug (server-side is correct). Noted for consistency.

---

## BUG-006: Welcome page redirects to homepage (`/`) instead of keeping user on the site

**Severity:** Low (UX)  
**Affected:** `/welcome`  
**File:** `mj-store/app/welcome/page.tsx`

**Description:**  
After a successful login or registration, the welcome page shows a 2-second animation, then redirects to `/` (homepage) regardless of user role. It should redirect to `/account` for logged-in users.

**Fix:** After welcome animation, redirect to `/account` instead of `/`.

---

## BUG-007: Logout does NOT clear the URL `?accountStatus` param

**Severity:** Low  
**Affected:** `/login` page  
**File:** `mj-store/app/login/page.tsx`

**Description:**  
When a Suspended/Banned user clicks "Login", they are redirected to `/login?accountStatus=suspended`. If they then click "Create an account" link and come back, the param persists. If a different user logs in, they'd still see the message from the previous session.

**Fix:** Clear `?accountStatus` from URL on successful login submission (before fetch), or use `router.replace("/login")` without params after successful login.

---

## BUG-008: Register page auto-signs in without checking profile status

**Severity:** Medium  
**Affected:** `/register`  
**File:** `mj-store/app/register/page.tsx`

**Description:**  
Registration creates a profile with **no status column** set (defaults to `null`). In the profile insert trigger/migration, the default should be `'Active'`. `normalizeStatus()` handles null by returning `"Active"`, **but** if a banned user somehow re-registers with the same email (Supabase might allow it), they'd get auto-signed-in.

**Impact:** Low, since new registrations always default to Active. But if a status is explicitly set to `'Banned'` during registration somehow, the user would be immediately blocked only at first `/api/auth/me` call (server-side), not at registration time.

**Fix:** Add a server-side API call to check profile status immediately after registration, similar to login.

---

## BUG-009: Checkout page uses `useEffect` to log out Banned users — silent sign-out

**Severity:** Medium  
**Affected:** `/checkout`  
**File:** `mj-store/app/checkout/checkout-client.tsx`

**Description:**  
Lines 43-48:
```tsx
if (status === "Banned") {
  void (async () => {
    await signOut();
  })();
}
```
This fires **after** render, silently signing out without explanation. There's already a suspended/banned guard in JSX but it only checks `status && status !== "Active"`. The effect fires and logs out without the user knowing why.

**Fix:** Remove the `useEffect` sign-out logic — the JSX guard already blocks the UI and the login handler `/api/auth/me` will handle status enforcement.

---

## BUG-010: `create-order` API uses Supabase anon key instead of service role

**Severity:** High  
**Affected:** `POST /api/create-order`  
**File:** `mj-store/app/api/create-order/route.ts`

**Description:**  
Line 7-10:
```tsx
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```
The create-order endpoint uses the **anonymous key** instead of the service role key. If Row Level Security (RLS) is enabled on the `orders` table, this may silently fail for authenticated users or succeed for unauthenticated users.

**Severity:** If RLS is enabled, `create-order` may fail for all users. If RLS is disabled, unauthenticated users can create orders.

**Fix:** Use `SUPABASE_SERVICE_ROLE_KEY` instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## BUG-011: Navbar shows "Account" + "Admin" + "Logout" buttons but the admin nav item links to `/admin` which is blocked by `AdminGuard` for moderators — but it shouldn't be

**Severity:** Low (UX)  
**Affected:** Navbar `StorefrontNavbar.tsx`  
**File:** `mj-store/components/auth/StorefrontNavbar.tsx`

**Description:**  
Line 48-49:
```tsx
const isUserLikeRole =
    navRole === "user" || navRole === "customer" || navRole === "helper";
const isStaff = navRole === "admin" || navRole === "moderator";
```
Moderators see the "Admin" button, and `AdminLayout` allows moderators (`allowedRoles: ["admin", "moderator"]`), so this is actually **correct**. Moving on.

---

## BUG-012: Admin Shell bottom nav is missing a padding/spacer on mobile for content at bottom of page

**Severity:** Medium (UX)  
**Affected:** All admin pages on mobile  
**File:** `mj-store/app/admin/admin-shell.tsx`

**Description:**  
The fixed bottom nav bar (`fixed bottom-0 left-0 right-0 z-50 lg:hidden`) does not account for bottom spacing. The admin content (`{children}`) scrolls behind the 60px nav bar at the bottom, causing text/buttons at the bottom of the page to be hidden behind the nav.

**Fix:** Add `pb-16 lg:pb-0` to the container that wraps `<main>`.

---

## BUG-013: No Next.js middleware — Suspended/Banned users can access protected pages directly via URL before `/api/auth/me` responds

**Severity:** Medium  
**Affected:** All client-side protected pages (`/account`, `/admin/*`, `/checkout`)

**Description:**  
There is no `middleware.ts` in this project. Suspended/Banned users who navigate directly to `/account`, `/admin`, or `/checkout` will see the page's protected content **before** the `AuthProvider`'s `/api/auth/me` call completes. The `isLoading` state is `true` during this period, and the page renders a loading state, but if the API call is slow, the user could briefly see the protected layout.

**Fix:** Add a `middleware.ts` that reads the Supabase session cookie and checks `profiles.status` before allowing access to protected routes. This is the only 100% server-side way to prevent even a flash of protected content.

---

## BUG-014: `useMyOrders` hook fetches orders via `customer_name` — fragile if name changes

**Severity:** Medium  
**Affected:** Members Dashboard, `/api/my-orders`  
**File:** `mj-store/app/api/my-orders/route.ts`

**Description:**  
Orders are matched to users by `customer_name` (string), not by `user_id`. If the user changes their full name, they lose access to their order history. The API currently handles this gracefully (returns empty), but the data model is fragile.

**Fix:** Add a `user_id` column to the `orders` table and match by that instead of customer name.

---

## BUG-015: Product details page has no `StorefrontNavbar`

**Severity:** Low (UX)  
**Affected:** `/product/[id]`  
**File:** `mj-store/app/product/[id]/page.tsx`

**Description:**  
The product detail page does not render the `StorefrontNavbar`, making it impossible to navigate back to other pages without using the browser's back button.

**Fix:** Add `<StorefrontNavbar />` at the top of the product detail page layout.

---

## BUG-016: Product details page trust section font sizes are fixed (`text-lg sm:text-2xl`) on mobile — needs responsive

**Severity:** Low (UX)  
**Fixed:** ✅ Already fixed in the last responsive pass (now uses `text-lg sm:text-2xl` and `p-5 sm:p-8`)

---

## Summary

| # | Severity | Area | Bug | Fixable? |
|---|----------|------|-----|----------|
| 1 | **High** | AdminGuard | Does not redirect Suspended/Banned to /login | ✅ Quick fix |
| 2 | Medium | Admin layout | Moderators can see Users page (client-side redirect only) | ✅ Quick fix |
| 3 | Low | AdminGuard | "Redirecting…" flash for unauthorized users | ✅ Quick fix |
| 4 | Low | Users page | Suspended/Banned silently stops rendering, no redirect | ✅ Quick fix |
| 5 | ✅ Safe | API | `requireAdmin` does check status (no bug) | — |
| 6 | Low | Welcome | Redirects to `/` instead of `/account` | ✅ Quick fix |
| 7 | Low | Login | `?accountStatus` param persists after successful login | ✅ Quick fix |
| 8 | Medium | Register | No status check after auto-sign-in | ✅ Should add |
| 9 | Medium | Checkout | Banned users get silently signed out via useEffect | ✅ Quick fix |
| 10 | **High** | API | `create-order` uses anon key instead of service role | ✅ Quick fix |
| 11 | ✅ Correct | Navbar | Moderators see Admin button — correct behavior | — |
| 12 | Medium | Admin shell | Mobile bottom nav hides content at page bottom | ✅ Quick fix |
| 13 | Medium | No middleware | Suspended/Banned can briefly see protected content | 🔧 Requires middleware |
| 14 | Medium | my-orders | Orders matched by customer_name (fragile) | 🔧 DB migration |
| 15 | Low | Product page | Missing navbar | ✅ Quick fix |
| 16 | ✅ Fixed | Product page | Trust section responsive | Already done |

### Critical (Fix Now):
1. **BUG-001**: AdminGuard should redirect Suspended/Banned to `/login`
2. **BUG-010**: `create-order` API uses anon key — switch to service role key

### High Priority:
3. **BUG-009**: Remove silent sign-out useEffect from checkout
4. **BUG-012**: Add bottom padding on admin mobile content

### Medium Priority:
5. **BUG-006**: Welcome page redirect to `/account` instead of `/`
6. **BUG-015**: Add StorefrontNavbar to product detail page
