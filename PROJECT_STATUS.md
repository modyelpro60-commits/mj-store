# MJ Store — Project Status Report
> Generated: 2026-06-09 | Source of truth: current codebase only

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + Bearer tokens) |
| Animations | Framer Motion 12 |
| Icons | Lucide React 1.17 |
| Toasts | Sonner 2.0.7 + React Hot Toast 2.6.0 |
| Email (OTP) | Resend or Brevo (configurable) |
| i18n | Custom hook/dictionary system (en/ar/fr) |

---

## Database Schema (21 Migrations Applied)

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | User profiles | id, email, full_name, role, status, phone, phone_verified |
| `products` | Store products | id, name, description, full_description, price, image, category, badge, sales_count, is_active |
| `product_features` | Product feature bullets | id, product_id, name, sort_order |
| `orders` | Customer orders | id, user_id, product_id, product_name, price, status, customer_name, handled_by |
| `cart_items` | Shopping cart | id, user_id, product_id, quantity |
| `product_reviews` | Reviews + replies | id, product_id, user_id, rating, comment |
| `chat_rooms` | Support chat rooms | id, customer_name, status, order_id |
| `chat_messages` | Chat messages | id, room_id, sender_id, message |
| `activity_logs` | Admin audit trail | id, actor_id, action, target_type, target_id |
| `otp_verifications` | Email OTP codes | identifier, code, verified, expires_at, attempts |
| `admin_allowlist` | Auto-admin emails | email (case-insensitive) |

### Roles & Statuses
- **Roles**: `admin`, `moderator`, `user` (auto-assigned at register; admin if email in allowlist)
- **Statuses**: `Active`, `Suspended`, `Banned` (enforced on every API call)

---

## Pages & Routes

### Storefront (Public / Auth Required)

| Route | Component | Status |
|---|---|---|
| `/` | `app/page.tsx` | ✅ Complete — server-rendered, products + hero + stats |
| `/login` | `app/login/page.tsx` | ✅ Complete — status enforcement, redirect on login |
| `/register` | `app/register/page.tsx` | ✅ Complete — OTP email flow, Arabic RTL |
| `/welcome` | `app/welcome/page.tsx` | ✅ Complete |
| `/product/[id]` | `app/product/[id]/page.tsx` | ✅ Complete — features, reviews, buy button |
| `/cart` | `app/cart/page.tsx` | ✅ Complete |
| `/checkout` | `app/checkout/checkout-client.tsx` | ✅ Complete — payment form, phone, chat redirect |
| `/account` | `app/account/page.tsx` | ✅ Complete — profile, orders, stats |
| `/chat` | `app/chat/page.tsx` | ✅ Complete — live chat interface |

### Admin Panel (admin / moderator only)

| Route | Component | Status |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | ✅ Complete — KPIs, orders timeline, quick actions |
| `/admin/products` | `app/admin/products/page.tsx` | ✅ Complete — CRUD with features |
| `/admin/orders` | `app/admin/orders/page.tsx` | ✅ Complete — status management |
| `/admin/users` | `app/admin/users/page.tsx` | ✅ Complete — search, role/status updates |
| `/admin/chat` | `app/admin/chat/page.tsx` | ✅ Complete — support chat interface |
| `/admin/logs` | `app/admin/logs/page.tsx` | ✅ Complete — activity audit log |

---

## API Routes

### Auth & User
| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/auth/me` | GET | Get current user + profile | Optional |
| `/api/register` | POST | Create account (post-OTP) | No |
| `/api/verify/send` | POST | Send OTP email | No |
| `/api/verify/check` | POST | Verify OTP code | No |

### Products
| Endpoint | Method | Purpose | Auth Required |
|---|---|---|---|
| `/api/get-products` | GET | All products with features | No |
| `/api/product` | GET | Single product | No |
| `/api/create-product` | POST | Create product | admin/moderator |
| `/api/update-product` | PATCH | Update product | admin/moderator |
| `/api/delete-product` | DELETE | Delete product | admin/moderator |
| `/api/product/[id]/reviews` | GET/POST | Product reviews | GET: No, POST: user |
| `/api/product/[id]/reviews/[reviewId]` | PATCH | Edit review | user (own) |
| `/api/product/[id]/reviews/[reviewId]/reply` | POST | Reply to review | admin/moderator |

### Cart
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/cart` | GET | Get cart items with product details |
| `/api/cart` | POST | Add item (increments qty if exists) |
| `/api/cart` | PATCH | Set absolute quantity (0 = remove) |
| `/api/cart` | DELETE | Remove item or clear cart |

### Orders
| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/create-order` | POST | Create order from cart | user |
| `/api/my-orders` | GET | User's own orders | user |
| `/api/get-orders` | GET | All orders | admin |
| `/api/update-order-status` | PATCH | Change order status | admin |
| `/api/delete-order` | DELETE | Delete order | admin |

### Chat
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chat/rooms` | GET/POST | List / create chat rooms |
| `/api/chat/rooms/[roomId]` | GET | Room details |
| `/api/chat/rooms/[roomId]/messages` | GET/POST | Get / send messages |
| `/api/chat/rooms/[roomId]/confirm-payment` | POST | Mark payment confirmed |
| `/api/chat/upload` | POST | Upload file to chat |
| `/api/chat/unread` | GET | Unread count badge |

### Admin
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/dashboard-stats` | GET | KPIs (products, orders, revenue, best seller) |
| `/api/admin/users` | POST | List/search users |
| `/api/admin/users/set-role` | POST | Change user role |
| `/api/admin/users/set-status` | POST | Change user status |
| `/api/admin/logs` | GET | Activity audit logs |

### Misc
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/upload-image` | POST | Upload product image |
| `/api/checkout` | POST | Payment integration (stub) |

---

## Components

### Providers (Root Level)
- `AppProviders` → wraps LanguageProvider, AuthProvider, CartProvider, ChatProvider
- `AuthProvider` — Supabase session, profile, role, status, signOut, reloadProfile
- `CartProvider` — cart CRUD, localStorage pending-item restore, subtotal, count
- `LanguageProvider` — en/ar/fr switching, localStorage persistence

### Navigation
- `CommandBar` — floating capsule navbar, cart badge, chat icon, language picker, account dropdown, mobile menu

### Storefront
- `StorefrontHero` — hero section with CTA
- `ProductCard` — product grid card
- `ProductDetailsViewV2` — full product detail (features, reviews, buy)
- `FeaturedProductsGrid` / `FeaturedProductsSpotlight` — product grids
- `HomeLiveStats` — live stats pills (active/total customers, products)
- `HomeFooter` — footer

### UI
- `ConfirmModal` — reusable confirmation dialog
- `StatusDropdown` — Active/Suspended/Banned selector
- `Skeleton` — loading placeholder
- `PaymentModal` — payment confirmation modal
- `MJLogo` / `MJHeroBrand` — branding components
- `AuroraBackground`, `FloatingParticles`, `MouseGlow` — ambient effects

### Chat
- `LiveChat` — customer chat widget
- `ChatWorkspace` — admin/full chat interface
- `useChatUnread` — unread count hook

---

## Auth & Security

| Mechanism | Implementation |
|---|---|
| Registration | Email OTP (10-min TTL, 6 attempt limit) → Supabase user creation |
| Login | `supabase.auth.signInWithPassword` → JWT session |
| API Auth | `Authorization: Bearer <token>` on every protected route |
| Role Check | `requireRole(['admin','moderator'])` server-side utility |
| Status Check | `requireActiveUser()` — throws 403 if Suspended/Banned |
| Admin Access | Email in `admin_allowlist` table (case-insensitive) |
| Activity Audit | `logActivity()` on all admin mutations |

---

## i18n

- **Languages**: English (`en`), Arabic (`ar`), French (`fr`)
- **Storage**: `mj-store:language` in localStorage
- **Coverage**: ~389 keys covering all UI strings
- **Direction**: RTL handled for Arabic (register page confirmed RTL)

---

## Known Patterns

- **Graceful degradation**: `product_features` table absence handled everywhere
- **Soft failures**: Activity logging, feature inserts won't crash if table missing
- **Server Components**: Home page, product page — async data fetching
- **Client Components**: All interactive UI — `"use client"` directive
- **Legacy normalization**: `customer` role → `user`, legacy feature formats handled
- **Two toast libs**: Both `sonner` and `react-hot-toast` installed (potential redundancy)
