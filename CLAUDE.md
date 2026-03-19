# RV MasterPlan (RVMP)

Full-stack RV lifestyle management app for tracking power systems, water systems, budgets, fuel economy, documents, and equipment. SaaS model with Stripe subscriptions.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5 (strict mode)
- **Database**: Neon serverless PostgreSQL via Drizzle ORM (`drizzle-orm/neon-http`)
- **Auth**: Clerk (`@clerk/nextjs`) — middleware at `src/middleware.ts`
- **Payments**: Stripe subscriptions + webhooks via Svix
- **File Uploads**: Uploadthing + Vercel Blob
- **AI**: Google Gemini via AI SDK (`@ai-sdk/google`) — receipt extraction only
- **UI**: Shadcn/ui (New York style, neutral base, CSS variables) + Tailwind CSS 4 + Lucide icons
- **Forms**: React Hook Form + Zod 4 validation
- **Charts**: Recharts
- **PDF**: @react-pdf/renderer — React component-based PDF generation
- **Toasts**: Sonner
- **Routing**: wouter (used alongside Next.js App Router)
- **Date utils**: date-fns

## Project Structure

```
src/
  middleware.ts                # Clerk auth middleware — protects /admin routes
  app/
    layout.tsx                 # Root layout: ClerkProvider → SessionGuard → DemoAuthProvider → TooltipProvider
    globals.css                # Tailwind 4 + Shadcn theme vars + brand color tokens
    page.tsx                   # Public homepage (marketing/landing)
    free-trial/page.tsx        # Free trial signup page
    renew/page.tsx             # Subscription renewal page (redirected to when expired)
    (dashboard)/               # Authenticated route group
      layout.tsx               # Dashboard shell: auth check → subscription guard → Sidebar + main content
      admin/page.tsx           # Admin panel
      dashboard/page.tsx       # Main user dashboard (events timeline)
      weather/page.tsx         # Weather, sun & moon
      calculators/
        purchase/page.tsx      # RV purchase cost calculator
        setup/page.tsx         # RV setup budget tracker
        budget/page.tsx        # Monthly living budget
        power/system/page.tsx  # Power & solar calculator
        water/page.tsx         # Water usage calculator
      fuel-economy/page.tsx    # Fuel economy tracker
      documents/page.tsx       # Document manager
      reports/master/page.tsx  # Master PDF report generator
      settings/page.tsx        # User settings
      welcome/page.tsx         # First-time welcome flow
      contact/page.tsx         # Contact form
    actions/                   # Server actions (called from pages)
      admin.ts                 # System settings, user management
      contact.ts               # Contact form
      dashboard.ts             # Dashboard events aggregation
      documents.ts             # Document CRUD
      equipment.ts             # Equipment CRUD
      events.ts                # Events/logs CRUD
      expenses.ts              # Expense tracking
      financials.ts            # Purchase financial data
      power.ts                 # Power system, devices, solar equipment, solar logs
      profiles.ts              # User profile management
      stripe.ts                # Stripe checkout, portal, subscription management
      water.ts                 # Water system, activities, tank logs
      weather.ts               # Weather API integration
    api/
      apply-code/route.ts      # Promo code application
      extract-receipt/route.ts # Gemini AI receipt parsing
      uploadthing/             # File upload endpoints (core.ts + route.ts)
      webhooks/clerk/route.ts  # Clerk webhook handler
      webhooks/stripe/route.ts # Stripe webhook handler
  components/
    auth/
      demo-provider.tsx        # Context provider for demo/guest mode
      session-guard.tsx        # Guards session state on client side
    expenses/
      ReceiptScanner.tsx       # AI-powered receipt scanning component
    layout/
      header-hero.tsx          # Page header/hero component
      sidebar.tsx              # Fixed left sidebar navigation (264px wide)
    ui/                        # Shadcn components (badge, button, card, dialog, form, input, kpi-block, kpi-value, label, progress, scroll-area, select, skeleton, sonner, switch, table, tabs, tooltip)
  lib/
    db/
      index.ts                 # Drizzle DB client (neon-http driver)
      schema.ts                # Complete database schema + relations
    actions/
      auth-helpers.ts          # getActiveUserId, isReadOnly, requireAuth, getRvId
      budget.ts                # Budget-specific DB queries
      equipment.ts             # Equipment-specific DB queries
      water.ts                 # Water-specific DB queries
    constants/
      brand.ts                 # CHART_COLORS palette for Recharts
    utils.ts                   # cn(), formatCurrency(), formatNumber(), calculateLoanPayment(), calculateTotalInterest()
    uploadthing.ts             # Uploadthing config
    pdf/
      styles.ts                # Shared PDF brand StyleSheet
      utils.ts                 # pdfImageUrl, formatCurrency helpers
      MasterCover.tsx          # Master Plan cover page
      components/              # Shared PDF components (PageHeader, PageFooter, MetricRow, PdfTable, SectionTitle)
      reports/                 # Report documents (Dashboard, Documents, FuelEconomy, LivingBudget, PowerSolar, PurchaseCalc, SetupBudget, Water, MasterPlan)
  types/
    index.ts                   # All TypeScript interfaces (Financial, Water, Setup, Power, Solar, Expense, Budget types)
  data/
    mockData.ts                # Static/demo data
  scripts/                     # One-off DB scripts (run with tsx)
    seed_budget_all.ts
    seedEquipment.ts
    seedAdminData.ts
    fixDemoUser.ts
    forcePublishDemo.ts
    listUsers.ts
    migrateAdmin.ts
    verifyDemoWater.ts
```

## Database Schema

17 tables centered around a **User → RV Vehicle** hierarchy:

| Table | Key | Relates To |
|---|---|---|
| `users` | `id` (text, Clerk ID) | Has one profile, many RVs, equipment, documents, events |
| `user_profiles` | `userId` (unique FK) | Subscription status, plan type, location, hero image |
| `rv_vehicles` | `userId` FK | Has one power/water/financial system, many devices/equipment/logs |
| `power_systems` | `rvId` (unique FK) | Battery, solar, inverter capacity |
| `electrical_devices` | `rvId` FK | Name, group (Essential/Non-essential), category, watts, hours/day |
| `solar_equipment` | `rvId` FK | Make/model, type, specs, wattage, weight, price |
| `daily_solar_logs` | `rvId` FK | Date, weather condition, sun hours, generated Wh |
| `water_systems` | `rvId` (unique FK) | Fresh/gray/black tank capacities |
| `water_activities` | `userId` FK | Name, category, gallons/use, times/day |
| `tank_logs` | `userId` FK | Date, type (Dump/Fill), tank, volume |
| `financial_data` | `rvId` (unique FK) | Purchase price, loan terms, fees |
| `equipment_items` | `userId` FK | Setup purchases: name, category, priority, cost, weight, acquired |
| `documents` | `userId` FK | Title, file type/URL, renewal date/cost |
| `events_and_logs` | `userId` FK | Events with type, status, tags (jsonb), metrics (jsonb) |
| `incomes` | `userId` FK | Income sources with amounts |
| `expenses` | `userId` FK | Expense tracking with fuel/propane/receipt support |
| `target_budgets` | `userId` FK | Monthly budget targets |
| `system_settings` | `id` = 'global' | Demo mode, maintenance mode, feature flags |

**Important**: All `numeric` columns store as strings in Drizzle. Always `Number()` cast when reading, `.toString()` when writing.

## Auth & Access Control Pattern

Three-tier access model in `src/lib/actions/auth-helpers.ts`:

1. **`getActiveUserId()`** — returns Clerk userId or `"demo_user"` fallback. Use for all read operations.
2. **`isReadOnly()`** — true for unauthenticated, demo, or guest users. Use for UI gating.
3. **`requireAuth()`** — throws if demo/guest. Use at top of every write action.
4. **`getRvId()`** — cached. Returns `{ rvId, isDemo }` for current user's first RV.

**Admin detection**: Via Clerk `publicMetadata.role === "admin"` (checked in dashboard layout).

**Subscription guard**: Dashboard layout checks `subscriptionStatus === "active"` and `subscriptionRenewalDate > now()`. Redirects to `/renew` if expired/inactive.

**Feature flags**: Stored in `system_settings.featureFlags` (jsonb). Passed to Sidebar to show/hide nav items.

## Server Action Patterns

All server actions follow this consistent pattern:

```typescript
"use server";
// 1. Import db, schema tables, drizzle operators, revalidatePath
// 2. Import auth helpers from @/lib/actions/auth-helpers

// READ actions:
export async function getXxx() {
  try {
    const activeId = await getActiveUserId();  // or getRvId() for RV-scoped data
    const results = await db.select()...       // or db.query...
    return { success: true, data: results };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Human-readable message" };
  }
}

// WRITE actions:
export async function updateXxx(data: { ... }) {
  try {
    const userId = await requireAuth();        // Throws for demo/guest
    // For RV-scoped: const { rvId, isDemo } = await getRvId(); if (isDemo) return error;
    await db.insert/update/delete...
    revalidatePath("/relevant/path");
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Human-readable message" };
  }
}
```

**Return shape is always `{ success: boolean, data?: T, error?: string }`.**

IDs are generated with `randomUUID()` (Node crypto). Numeric fields stored/read as strings (Drizzle `numeric` type).

## UI & Styling

### Brand Design System
- **Background**: `#f8fbf5` (light sage) — used as `bg-[#f8fbf5]` everywhere
- **Surface**: `#f1f6ea` (sidebar, cards) — `bg-[#f1f6ea]`
- **Primary**: `#2a4f3f` (dark forest green) — headings, accents, use as `text-brand-primary`
- **Primary Dark**: `#1a3a2d` — hover states, use as `hover:bg-brand-primary-dark`
- **Accent**: `#8ca163` (sage green) — CTA buttons, use as `bg-[#8ca163] hover:bg-[#7a8e52]`
- **Border**: `#e0e8d5` (soft green-gray) — use as `border-[#e0e8d5]`
- **Blue accent**: `#3b82f6` — links, charts, active nav items, `text-brand-blue-accent`
- **Blue soft**: `#eef2f6` — light blue backgrounds, `bg-brand-blue-soft`
- **Solar accent**: `#f59e0b` (amber) — solar/energy features, `text-brand-solar`
- CSS custom properties defined in `globals.css` under `@theme inline` block
- Shadows: `shadow-brand` and `shadow-brand-lg` custom shadow tokens

### Global CSS (`globals.css`)
- Tailwind CSS 4 with `@import "tailwindcss"` + `@import "tw-animate-css"` + `@import "shadcn/tailwind.css"`
- Uploadthing styles imported: `@import "@uploadthing/react/styles.css"`
- Brand color tokens defined in `@theme inline` block (accessible as `bg-brand-primary`, `text-brand-accent`, etc.)
- Shadcn theme vars (oklch format) in `:root` and `.dark` blocks
- Body background hardcoded to `#f8fbf5`
- Dark mode variant: `@custom-variant dark (&:is(.dark *))`

### Layout
- Fixed left sidebar: 264px (`w-64`), content area: `ml-64`, max-width `max-w-6xl`
- Fonts: Geist Sans + Geist Mono (Google Fonts via `next/font`)
- Loading states: Skeleton components in `loading.tsx` files
- Root layout provider chain: `ClerkProvider → html → body → SessionGuard → DemoAuthProvider → TooltipProvider → children + Toaster`

### HeaderHero Component (`components/layout/header-hero.tsx`)
Every dashboard page uses `<HeaderHero>` at the top:
- Props: `title`, `description`, `imageUrl?` (defaults to brand header), `imageClass?`, `hideOverlay?`, `children?`
- 21:9 aspect ratio, max 400px height, rounded-xl, with semi-transparent title box overlay
- Title box: `bg-white/70` with frosted glass effect, positioned top-left
- Title uses `text-brand-primary` for consistent branding
- Supports optional children for overlaying custom content (e.g., upload buttons on Dashboard)

### Card Component (`components/ui/card.tsx`)
Customized Shadcn card with brand styling:
- `rounded-2xl border-2 border-brand-primary/20 bg-white shadow-[4px_4px_12px_rgba(0,0,0,0.15)]`
- Subcomponents: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`
- Uses `data-slot` attributes for Shadcn compatibility

### KPI Components (`components/ui/kpi-block.tsx`, `kpi-value.tsx`)
Custom metric display system used across all calculator pages:
- **KpiBlock**: Wrapper with gradient variants — `primary` (green), `accent` (sage), `solar` (amber), `water` (blue)
  - Each variant: `bg-gradient-to-br from-white/90 via-white/40 to-{color}/30 border-2 border-{color}/20`
  - Consistent shadow: `shadow-[4px_4px_12px_rgba(0,0,0,0.15)]`
  - Has matching `KpiBlockSkeleton` for loading states
- **KpiValue**: Client component with auto-sizing — measures text width via ResizeObserver, scales font down proportionally (min 14px) to prevent overflow

### Sidebar (`components/layout/sidebar.tsx`)
- Client component with `usePathname()` for active state highlighting
- Nav items defined as static array with optional `featureKey` for feature flag filtering
- Starter plan hides "RV Living Budget" and "Fuel Economy"
- Active state: `bg-blue-100/50 text-blue-700 font-semibold`
- Hover state: `hover:bg-[#e6ecd9] hover:text-slate-900`
- Nav links: uppercase, `text-xs tracking-wide font-medium`
- Admin section: shown only when `user.publicMetadata.role === 'admin'`
- Session section (signed in): Contact link + Log Out button
- Footer area: UserButton with name/role display (signed in) or Guest avatar with Sign In button (signed out)
- Logout clears `sessionStorage.removeItem("rvmp-session-active")` before `signOut()`

### Landing Page Footer (inline in `app/page.tsx`)
- `bg-slate-900` with inverted logo, copyright "Wolves to Feed Publishing", Contact link
- Not a shared component — lives directly in the landing page

### Page Structure Pattern
Dashboard pages consistently follow this structure:
```tsx
"use client";
// 1. Imports: UI components, server actions, icons, hooks
// 2. State declarations (useState for all data)
// 3. useEffect → call server actions → set state
// 4. Return JSX:
//    <HeaderHero title="..." description="..." />
//    <KpiBlock> grid for summary metrics
//    <Card> sections for detailed content
//    Modals via <Dialog> for CRUD operations
```

### Component Conventions
- Shadcn/ui: `npx shadcn add <component>` — lives in `src/components/ui/`
- All pages are client components (use `"use client"`) that call server actions via `useEffect`
- Charts use `CHART_COLORS` from `src/lib/constants/brand.ts` (8-color palette: blue, teal, emerald, amber, violet, rose, red, slate)
- Toasts via `toast()` from Sonner (success/error notifications)
- Modals use Shadcn `<Dialog>` with controlled open state
- Buttons: primary actions use `bg-brand-primary hover:bg-brand-primary-dark text-white`

## Admin & Database Controls

### Admin Panel (`app/(dashboard)/admin/page.tsx`)
- Protected by Clerk `publicMetadata.role === "admin"` (checked in middleware + dashboard layout)
- Functions in `app/actions/admin.ts`:
  - `getAdminStats()` — aggregate counts across all tables
  - `getSystemSettings()` / `updateSystemSettings()` — global config (demo mode, maintenance mode, feature flags)
  - `getAllUsers()` — user list with profiles (left join)
  - `toggleUserSubscription()` — activate/deactivate user subscriptions
  - `deleteUser()` — cascading delete of all user data (documents, equipment, events, profile, user)
  - `publishToDemo()` — copies admin's complete data to `demo_user` (clones all tables with new IDs)

### User Permission Model
| Role | Read | Write | Admin |
|---|---|---|---|
| Unauthenticated (demo_user) | All data (demo) | Blocked | No |
| Guest (`guest_*`) | All data (demo) | Blocked | No |
| Subscriber (active) | Own data | Own data | No |
| Subscriber (expired/inactive) | Redirected to /renew | Blocked | No |
| Admin | All data | All data | Full |

### Subscription Plans
- **Starter Pack**: `planType = 'starter'`, one-time $20, 3 months access, limited features (no Living Budget, no Fuel Economy)
- **Monthly Pro**: `planType = 'full'`, $10/month, all features
- **Annual Pro**: `planType = 'full'`, $60/year, all features
- Free trial: Separate flow at `/free-trial`
- Stripe product IDs hardcoded in landing page checkout buttons

## Commands

```bash
npm run dev          # Start dev server (clears .next/cache first)
npm run dev:clean    # Full clean dev start (rm -rf .next)
npm run build        # Production build
npm run lint         # ESLint
npx drizzle-kit push    # Push schema changes to Neon (no migrations, direct push)
npx drizzle-kit studio  # Open Drizzle Studio DB browser
npx shadcn add <name>   # Add Shadcn UI component
npx tsx src/scripts/<script>.ts  # Run one-off DB scripts
```

## Environment Variables

- `.env.development` / `.env.production` for environment-specific
- `.env.local` for local overrides (used by drizzle.config.ts)
- Required keys: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `DATABASE_URL`, `UPLOADTHING_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `GOOGLE_API_KEY`
- **Never commit .env files**

## Deployment

- **GitHub**: `wolvestofeed/rvmasterplan`
- **Hosting**: Vercel (auto-deploys from `main`)
- **Database**: Neon serverless PostgreSQL
- **Schema management**: `drizzle-kit push` (no migration files, direct push)

## Critical Rules

1. **Server components by default**. Only add `"use client"` when you need hooks, event handlers, or browser APIs.
2. **Always use the auth helpers**. Never call `auth()` directly in actions — use `getActiveUserId()`, `requireAuth()`, or `getRvId()`.
3. **Return `{ success, data?, error? }` from all server actions**. This is the universal return shape.
4. **Numeric fields are strings in Drizzle**. Cast with `Number()` on read, `.toString()` on write.
5. **No raw SQL**. Use Drizzle query builder or relational queries only.
6. **revalidatePath()** after every write to bust Next.js cache.
7. **Upsert pattern** for singleton records (power_systems, water_systems, financial_data): use `db.insert().onConflictDoUpdate()`.
8. **Build ignores TS/ESLint errors** (`next.config.ts`). Don't rely on the build to catch type issues — check types yourself.
9. **Brand colors**: Use the defined CSS custom properties or hex values (`#f8fbf5`, `#f1f6ea`, `#2a4f3f`, `#8ca163`, `#e0e8d5`). Don't introduce new arbitrary colors.
10. **Feature flags**: Check `featureFlags` before adding/showing new calculator or tool sections. New features may need a flag in `system_settings`.
