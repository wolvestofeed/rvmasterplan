# RV MasterPlan (RVMP)

Full-stack RV lifestyle management app for tracking power systems, water systems, budgets, fuel economy, documents, and equipment.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5
- **Database**: Neon serverless PostgreSQL via Drizzle ORM
- **Auth**: Clerk (`@clerk/nextjs`)
- **Payments**: Stripe (subscriptions, webhooks via Svix)
- **File Uploads**: Uploadthing + Vercel Blob
- **AI**: Google Gemini via AI SDK (`@ai-sdk/google`) — used for receipt extraction
- **UI**: Shadcn/ui (New York style, neutral base color, CSS variables) + Tailwind CSS 4 + Lucide icons
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PDF**: @react-pdf/renderer — React component-based PDF generation (`src/lib/pdf/`)
- **Toasts**: Sonner

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout (Clerk provider, theme)
    globals.css             # Global styles + Tailwind
    page.tsx                # Homepage
    (dashboard)/            # Authenticated route group
      layout.tsx            # Dashboard shell
      admin/
      calculators/
        budget/
        power/system/
        water/
        setup/
      dashboard/
      documents/
      fuel-economy/
      reports/
      settings/
      welcome/
    actions/                # Server actions (stripe.ts, etc.)
    api/
      extract-receipt/      # Gemini-powered receipt parsing
      uploadthing/
      webhooks/clerk/
      webhooks/stripe/
  components/
    auth/
    expenses/
    layout/
    ui/                     # Shadcn components
  lib/
    db/
      index.ts              # Drizzle DB connection
      schema.ts             # Full database schema
    actions/                # DB action functions (budget.ts, etc.)
    utils.ts
    uploadthing.ts
    pdf/                    # PDF report system (@react-pdf/renderer)
      styles.ts             # Shared brand StyleSheet
      utils.ts              # pdfImageUrl, formatCurrency helpers
      MasterCover.tsx       # Master Plan cover page
      components/           # Shared PDF components (PageHeader, MetricRow, PdfTable, SectionTitle)
      reports/              # Department report documents (DashboardReport, LivingBudgetReport, PowerSolarReport, ...)
  types/
    index.ts                # TypeScript interfaces
  data/                     # Static/demo data
```

## Key Files

- **DB Schema**: `src/lib/db/schema.ts` — all tables and relations
- **DB Connection**: `src/lib/db/index.ts`
- **Global CSS**: `src/app/globals.css`
- **Path alias**: `@/*` maps to `./src/*`

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npx drizzle-kit push` — push schema changes to Neon
- `npx drizzle-kit studio` — open Drizzle Studio (DB browser)
- `npx shadcn add <component>` — add Shadcn UI components

## Environment

- `.env.development` and `.env.production` for environment-specific vars
- `.env.local` for local overrides (used by drizzle.config.ts)
- Keys: CLERK_*, DATABASE_URL, UPLOADTHING_TOKEN, STRIPE_*, GOOGLE_API_KEY
- **Never commit .env files**

## Deployment

- GitHub repo: `wolvestofeed/rvmasterplan`
- Hosted on Vercel (auto-deploys from `main`)
- Database: Neon serverless PostgreSQL

## Conventions

- App Router with server components by default
- Server actions in `src/app/actions/` for mutations
- Drizzle ORM for all database queries (no raw SQL)
- Shadcn/ui components in `src/components/ui/`
- TypeScript strict mode
- Build currently configured to ignore TS and ESLint errors (`next.config.ts`)
