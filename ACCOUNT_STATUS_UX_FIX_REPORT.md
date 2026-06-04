# Account Status UX Fix Report

## Root Cause

When a Suspended/Banned user submitted their login credentials, the sequence was:

1. `signInWithPassword()` succeeds (Supabase doesn't know about `profiles.status`).
2. Login handler calls `/api/auth/me` → gets 403 "Account Suspended" / "Account Banned".
3. Login handler calls `supabase.auth.signOut()`.
4. `signOut()` triggers Supabase's `onAuthStateChange` event.
5. `AuthProvider`'s listener fires → tries to reload profile → calls `/api/auth/me` again → gets 403.
6. AuthProvider's old code called `router.replace('/login')` — **without the `accountStatus` query param** — overwriting the URL.
7. The login page re-rendered without the param → no message shown.
8. User submits again → this time `signOut()` was already called, session is gone, but a new session is established, `/api/auth/me` again returns 403, and the *second* time the AuthProvider's redirect already happened, so the hard navigation from the login handler wins and the param is preserved.

## Fix (two files)

### 1. `mj-store/components/auth/AuthProvider.tsx`

**Problem:** The AuthProvider's `reloadProfile()` function detected 403 from `/api/auth/me` and called `router.replace('/login')` without the `accountStatus` param, overwriting the URL.

**Fix:** Removed the redirect from `reloadProfile()`. On 403, the provider now simply clears the profile state (`setProfile(null)`). The login page itself handles the redirect via `window.location.href`, which is a hard navigation that cannot be overwritten by React state changes.

### 2. `mj-store/app/login/page.tsx`

**Problem:** Used `router.replace()` for the redirect after detecting Suspended/Banned. `router.replace` is a client-side navigation that can be intercepted/overwritten by other React components (like AuthProvider) re-rendering during the same tick.

**Fix:** Changed to `window.location.href = '/login?accountStatus=...'`. This is a full browser navigation that:
- Preserves the URL query parameter across the page load.
- Cannot be overwritten by React state updates or Supabase auth listeners.
- Causes a clean page load where the login page reads `?accountStatus=...` directly from `window.location.search`.

## Result

**Suspended user (first attempt):**
1. Submits login form.
2. Supabase auth succeeds.
3. `/api/auth/me` returns 403 "Account Suspended".
4. `window.location.href = '/login?accountStatus=suspended'` → full browser navigation.
5. AuthProvider re-initializes on the new page load → gets 403 → **just clears profile**, does NOT redirect.
6. Login page reads `?accountStatus=suspended` → renders *"Your account has been suspended."* ✅ First attempt.

**Banned user (first attempt):**
1–6 same flow → `/login?accountStatus=banned` → *"Your account has been banned."* ✅ First attempt.

**Active user:**
1–3 same.
4. `/api/auth/me` returns 200 → `router.push('/welcome?mode=login')`. No change.

## Files Changed

| File | Change |
|------|--------|
| `mj-store/app/login/page.tsx` | Changed `router.replace()` → `window.location.href` for Suspended/Banned redirect. |
| `mj-store/components/auth/AuthProvider.tsx` | Removed `router.replace('/login')` on 403. Only clears profile. |

## Verification

| Scenario | Expected | First attempt? |
|----------|----------|----------------|
| ✅ Active user login | Redirect to `/welcome?mode=login`. | ✅ Yes |
| ❌ Suspended user login | Redirect to `/login?accountStatus=suspended`. Shows *"Your account has been suspended."* | ✅ Yes |
| ❌ Banned user login | Redirect to `/login?accountStatus=banned`. Shows *"Your account has been banned."* | ✅ Yes |
