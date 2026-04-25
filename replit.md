# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## JB Jewellery Collection — `artifacts/jb-jewellery`

Full-stack e-commerce site for JB Jewellery Collection built with React + Vite.

### Features
- **Homepage**: Marquee, Hero Slider, Category Rows, JB Exclusive, Shop Your Vibe (vibe-1.png–vibe-5.png), Bestsellers, New Arrivals, ShopUnderBudget, ComboDeals, Reviews, TrustBadges (animated GIFs)
- **Auth**: Firebase Auth + localStorage fallback (demo mode). AuthContext with login/signup/logout/resetPassword. AuthModal with login/signup/forgot-password tabs
- **Cart**: CartContext with clearCart, CartDrawer with checkout button → /checkout
- **Checkout**: 3-step (Address → Review → WhatsApp) with coupon codes (JBFIRST/FLAT100/WELCOME20), tax (5%), and free shipping above ₹399
- **Orders**: WhatsApp message builder, localStorage order storage, invoice PDF via jsPDF
- **Admin Panel** (`/admin`): Dashboard with recharts, Orders management, Products CRUD, Customers view, Coupons management, Settings (SEO, Footer, Social links, Reviews)
- **Site Settings** (`/admin/settings`): Manage SEO meta tags, footer info (about, address, location, phone, email, copyright), social links (Instagram/Facebook/WhatsApp/Twitter), and customer reviews. Stored in `localStorage` under `jb-site-settings`. Footer & Reviews components consume `useSiteSettings()` from `SiteSettingsContext`.
- **My Orders** (`/my-orders`): Order history with status timeline, PDF invoice download, WhatsApp support

### Tech Stack
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui components
- Framer Motion (animations)
- Firebase Auth + Firestore (optional; falls back to localStorage)
- jsPDF (invoice generation)
- Recharts (admin dashboard charts)
- wouter (routing)

### Key Constants to Update
- `src/lib/orders.ts` → `WA_NUMBER = '919999999999'` (replace with real WhatsApp number)
- Firebase env vars: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.

### Demo Mode (no Firebase)
- Login with any email containing "admin" → admin role
- Orders stored in localStorage `jb-orders`
- Users stored in localStorage `jb-user`
- Cart stored in localStorage `jb-cart`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## Email Templates

The API server ships **38 email templates** total, all rendered via the shared `emailBase` shell using inline CSS, table layouts and inline SVG icons (no emojis), so they render correctly in every major email client.

- `artifacts/api-server/src/lib/mailer.ts` — Zoho SMTP transport (`smtp.zoho.in:465`), shared primitives (`emailBase`, `iconCircle`, `buttonLink`, `icon`, `formatPrice`), and the original 7 transactional templates: `order_received` (full invoice), `admin_new_order`, `order_confirmed`, `order_shipped`, `order_delivered`, `new_arrival`, `restock`.
- `artifacts/api-server/src/lib/mailer-templates.ts` — generic `renderGenericEmail(opts)` builder + `TEMPLATE_REGISTRY` of 31 additional templates: `welcome`, `otp_verification`, `order_confirmation`, `payment_success`, `payment_failed`, `invoice_receipt`, `shipping_dispatch`, `out_for_delivery`, `delivered_v2`, `order_cancelled`, `refund_initiated`, `refund_completed`, `return_request`, `exchange_request`, `abandoned_cart`, `promotional_offer`, `discount_coupon`, `new_arrival_v2`, `review_request`, `wishlist_reminder`, `back_in_stock`, `low_stock_customer`, `password_reset`, `password_changed`, `login_alert`, `support_reply`, `contact_response`, `newsletter_subscription`, `unsubscribe_confirmation`, `admin_low_stock`, `admin_new_signup`. Also exports a 12-hour login-alert cooldown (`shouldSendLoginAlert` / `markLoginAlertSent`, in-memory `Map`) and convenience senders (`sendWelcomeEmail`, `sendLoginAlertEmail`, `sendPasswordResetEmail`, `sendPasswordChangedEmail`, `sendAdminNewSignupEmail`).
- `artifacts/api-server/src/routes/email-templates.ts` — admin endpoints (`GET /api/admin/email-templates`, `GET /:key/preview`, `POST /:key/send`) protected by `simpleAdminMiddleware`. Lists legacy + registry templates side by side. Powers the admin Email page at `/admin/email`.
- `artifacts/api-server/src/routes/auth.ts` — wires the new flows:
  - `POST /api/auth/register` → fires welcome email + admin new-signup alert.
  - `POST /api/auth/login` → fires login-alert email (with 12 h cooldown, skipped for admin role) including IP and user-agent.
  - `PATCH /api/auth/password` → fires password-changed alert.
  - `POST /api/auth/forgot-password` → always returns 200 (non-enumeration), emails a 30-minute one-time reset link via `crypto.randomBytes` (in-memory token store).
  - `POST /api/auth/reset-password` → consumes token, updates password, emails a password-changed alert.
