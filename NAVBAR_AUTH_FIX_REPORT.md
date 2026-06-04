# NAVBAR_AUTH_FIX_REPORT.md

## Problem
Authenticated **Moderator** accounts were rendering **duplicate** auth actions in `StorefrontNavbar`:
- Account / Logout (user-like group)
- Account / Admin / Logout (admin group)

Expected:
- Moderator: **Account + Admin + Logout** (single auth group)
- Admin: **Account + Admin + Logout** (single auth group)
- User/Helper: **Account + Logout** (single auth group)
- Guest: **Login + Register**

## Root cause
`StorefrontNavbar` used overlapping role conditions:
- A “user-like” auth group rendered for `role === "moderator"` (via the user-like condition).
- A separate “admin” auth group rendered for `role === "moderator"` (because it checks `navRole === "admin" || navRole === "moderator"` after the moderator admin button fix).
This produced duplicated buttons.

## Fix (no styling changes; render-logic only)
File: `mj-store/components/auth/StorefrontNavbar.tsx`

### Change
- Updated the `isUserLikeRole` condition to **exclude moderator**:
  - Before: `user | customer | helper | moderator`
  - After:  `user | customer | helper`

So:
- User/Helper → renders only the user-like group (**Account + Logout**)
- Moderator/Admin → renders only the admin group (**Account + Admin + Logout**)

## Verification
- Ran `npm --prefix mj-store run build` successfully (compile + TypeScript stage completed).
