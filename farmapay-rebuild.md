# Farmapay Rebuild Plan (La Botica)

## Goal

Rebuild the entire Farmapay system (frontend and backend) from scratch with a focus on modern architecture, high performance (Vite + React + Tailwind v4 + shadcn/ui), custom "La Botica" design tokens (Bordeaux primary, no dark mode), PWA support, and integration with the AbacatePay payment processor.

## Project Type

WEB PLATFORM (React Frontend + Fastify/Prisma Backend)

## Success Criteria

- [ ] Complete replacement of MaxiPago with AbacatePay (PIX + Card).
- [ ] New UI using shadcn/ui and custom La Botica design tokens.
- [ ] Ultra-performant, mobile-first public checkout flow.
- [ ] Full PWA capabilities (installable, offline fallback).
- [ ] Backend rebuilt with clean architecture, proper layered separation.
- [ ] Admin panel with customizable logo support.

## Tech Stack

**Frontend:**

- **Framework:** React 19 + Vite (High performance dev & build)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Accessible, headless components)
- **State Management:** React Query (Server state), Zustand (Global UI state)
- **Form Handling:** React Hook Form + Zod (Strict validation)
- **Routing:** React Router v7
- **PWA:** vite-plugin-pwa

**Backend:**

- **Framework:** Fastify (High performance Node.js web framework)
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Supabase)
- **Validation:** Zod + fastify-type-provider-zod
- **Authentication:** JWT (Role-based: Admin, Manager, Attendant)

**Payment Processor:**

- AbacatePay (API + Webhooks)

## Design System (La Botica)

- **Primary Color:** Bordeaux (Vinho/Bordô) - Custom HSL tokens.
- **Theme:** Light mode only (No dark mode).
- **Typography:** Custom sans-serif stack ensuring high readability.
- **Geometry:** Clean, sharp edges with subtle rounding (`rounded-md` max) to reflect a premium, health-focused brand.

## File Structure Strategy

**Frontend (`/frontend/src`):**

- `/components/ui`: shadcn components
- `/components/shared`: Reusable business components
- `/features`: Domain-driven modules (e.g., `/features/checkout`, `/features/admin`)
- `/hooks`: Custom React hooks
- `/lib`: Utility functions, API clients
- `/pages`: Route entry points
- `/store`: Zustand stores

**Backend (`/backend/src`):**

- `/controllers`: Request handlers
- `/services`: Business logic (e.g., `abacatepay.service.ts`)
- `/routes`: Fastify route definitions
- `/schemas`: Zod schemas for validation
- `/middlewares`: Auth, error handling

---

## Tasks Breakdown

### Phase 1: Foundation (Backend)

- [ ] Task 1.1: Initialize new Fastify backend with TypeScript, Prisma, and Zod. → Verify: `npm run dev` starts gracefully.
- [ ] Task 1.2: Define Prisma Schema (Profiles, Customers, Orders, Links, Transactions). → Verify: `npx prisma db push` succeeds.
- [ ] Task 1.3: Implement Auth Service and Routes (JWT, Roles). → Verify: Postman login returns valid JWT token.

### Phase 2: Foundation (Frontend & Design System)

- [ ] Task 2.1: Initialize new Vite React project with Tailwind v4 and React Router. → Verify: Local server runs `http://localhost:5173`.
- [ ] Task 2.2: Setup shadcn/ui and inject "La Botica" Bordeaux tokens (disable dark mode). → Verify: Global CSS reflects branding.
- [ ] Task 2.3: Implement PWA configuration (`vite-plugin-pwa`). → Verify: App manifests generate properly in build.

### Phase 3: Core Integration (AbacatePay)

- [ ] Task 3.1: Implement AbacatePay Service in backend (Create Customer, Create Billing, Check Status). → Verify: Unit tests/logs confirm successful sandbox API calls.
- [ ] Task 3.2: Implement AbacatePay Webhook handlers (`billing.paid`, etc.) with security verification. → Verify: Simulated webhooks update order status in DB.

### Phase 4: Implementation - Admin & Management

- [ ] Task 4.1: Build unified Layout with Sidebar (Role-based access). → Verify: Admin sees settings, attendants do not.
- [ ] Task 4.2: Implement Dashboard and Reports (Metrics logic + UI). → Verify: Charts render correct mock data.
- [ ] Task 4.3: Implement Customers and Team Management CRUD. → Verify: Can add, edit, and view customers/staff.
- [ ] Task 4.4: Implement Payment Links Management (Create AbacatePay billings). → Verify: Link generation returns valid AbacatePay URL.
- [ ] Task 4.5: Implement Settings page (Custom Logo Upload via Supabase Storage). → Verify: Uploaded logo displays in Sidebar and Checkout.

### Phase 5: Implementation - Checkout Flow (Public)

- [ ] Task 5.1: Build Public Checkout Page (Ultra-fast, mobile-first design). → Verify: Page loads instantly, Lighthouse score > 90.
- [ ] Task 5.2: Integrate AbacatePay checkout logic (PIX QR Code generation + Card payment interface if native, or redirect if required). → Verify: User can select payment method.
- [ ] Task 5.3: Implement post-payment success/failure screens. → Verify: Polling or redirect displays correct final status.

### Phase X: Verification

- [ ] Run backend lint & type check.
- [ ] Run frontend lint & type check.
- [ ] Run Lighthouse Audit on Checkout (Mobile + Desktop).
- [ ] Verify PWA installability.
- [ ] Verify Webhook security (prevent spoofing).

## Done When

- [ ] All code runs seamlessly in development mode.
- [ ] A test purchase completes successfully through AbacatePay in sandbox.
- [ ] Custom branding is exclusively La Botica Bordeaux.
