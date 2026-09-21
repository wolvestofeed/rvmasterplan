# Cash Flow Statement for RV MasterPlan (formerly "iTable")

**Status:** approved 2026-09-21, Phase 1 in progress on branch `feature/cash-flow-statement`
**Decisions:** built into RV MasterPlan (no separate app); second Clerk account for real numbers, existing admin account stays the demo author; Plan vs Actual is Phase 2; IRA/401k stay as negative receipts out of gross income; page is available on the full plan behind feature flag `cash_flow`.
**Source of truth:** `RWB Budget 2026 - 2027.xlsx` (Cash Flow Statement tabs)
**Original outline:** `~/Documents/WTF Publishing/iTable/docs/OUTLINE.md`

---

## 1. What the spreadsheet actually is

The workbook is one idea repeated: a **12-month cash-flow statement** where every line is a
row, every month is a column, and the bottom rolls cash forward.

```
Cash on Hand (beginning of month)          ← last month's ending cash
+ Cash Receipts        (income lines; IRA/401k deductions entered as NEGATIVE receipts)
= Total Cash Available
- Cash Paid Out        (group 1: housing, insurance, utilities, food, phone, subs...)
- Additional Expenses  (group 2: rent, util & services, Adobe...)
= Total Cash Paid Out
= Monthly Net Cash
= Cash Position (end of month)             → feeds next month
```

Things it does beyond the grid, all of which iTable should keep:

| Spreadsheet feature | Where | What it does |
|---|---|---|
| Yearly summary + % of total outflow per line | cols R, S | tells you what share each bill is of total spend |
| Group shares | U24, U34 | "owner expense" vs "living" split of outflow |
| Owner-expense monthly burden | V23, X23 | annualized mortgage+insurance+tax ÷ 12 |
| Paycheck calculator | W10:AA11 | hourly × 2080 → gross → /26 → 26.4% tax → net monthly |
| Scenarios by tab-copying | `Cash Flow 2025`, `2025-trailer`, `2025 MU`, `2027 Budget` | same year, different assumptions |
| One-time purchase block | rows 53–66 | trailer price, accessories, down payment, financed amount, 7-month campground cost |
| Seasonal lines | LPEA (electric), property tax (Mar), propane (Feb), registration (Jan) | not every line is flat |
| Retirement split | `Retirement` tab | 50/30/20 of take-home, % of income ladder |
| Compounding projections | `Investment Calc` | Simple IRA, Live Oak savings, gold at an APY with monthly contributions |
| Metal holdings | `Metal` | oz held, cost basis, 28% collectibles cap-gains + CO 4.55% |
| Daily room-rental income | `Rm Rental $Chart` | per-room day rates, daily totals, monthly total, avg/day |
| Bill Schedule | empty tab | the feature you wanted but never built |

Quirks worth fixing in the app rather than copying: all four statement tabs still say
"Fiscal year begins 1/1/23"; the income `Total` row has a hard-coded 0 in the EST column;
`F48` uses a different formula than its neighbors. Scenario tabs are full copies, so a fix
in one never reaches the others.

## 2. What to take from RV MasterPlan

RVMP is Next.js 15 / React 19 / TypeScript / Tailwind 4 / shadcn, Neon Postgres via Drizzle,
Clerk auth, Recharts, react-pdf. Directly reusable:

- **Components:** `KpiBlock`, `KpiValue` (auto-shrinking number), `CategoryBreakdown`
  (bar list with % and total row), `HeaderHero`, the shadcn set (table, dialog, tabs, form).
- **Helpers:** `formatCurrency`, `formatNumber`, `calculateLoanPayment`, `calculateTotalInterest`.
- **PDF:** `src/lib/pdf/` styles + `PdfTable` + `LivingBudgetReport` (already a month-by-month
  budget-vs-actual table with variance colors).
- **Purchase calculator page** → becomes iTable's "Purchase Plan" (the trailer block).
- **Power system page** → the appliance list (`ElectricalDevice {watts, hoursPerDay}`) and
  `getTotalDailyConsumption()` in Wh/day.
- **Receipt OCR** (`/api/extract-receipt`, Gemini) if we ever want photo-to-cell entry.

What RVMP does **not** have, so iTable builds fresh:

- No month-column grid; its budget page is a list of expense rows plus a bar chart.
- No scenarios or what-if comparison.
- No electricity rate and no kWh anywhere. Energy is watt-hours only, never dollars.
- No CSV/JSON/xlsx export, only PDF.
- Schema drift: `expenses` drops `group`, `quantity`, `tax` on write. Don't inherit that.

## 3. Recommendation: build it into RV MasterPlan

Yes. A separate app would re-create auth, database, hosting, PDF and the component library
that RVMP already has, and the cash-flow statement is a genuinely good product feature for
RV planners (the "buy the trailer vs. stay put" tabs in your workbook are exactly the
what-if every RV buyer runs). Three conditions make it work:

1. **New tables, not the `expenses` table.** The existing Living Budget stores one row per
   expense per month and silently drops fields. The statement needs a line × month grid with
   scenarios. Add `cf_scenarios`, `cf_line_items`, `cf_cells` beside it and leave the
   Living Budget page as-is. Later, Plan vs Actual can pull actuals from `expenses` by
   category and month, which turns the two pages into one system instead of two.
2. **A wide layout for the grid page.** The 264px sidebar plus `max-w-6xl` content leaves
   too little room for 12 month columns. The Cash Flow route gets a collapsed-sidebar,
   full-width variant of the dashboard layout.
3. **Product vs. personal.** The statement, scenarios, paycheck, purchase plan, energy line
   and accounts/projections are product features. Gold cap-gains and the room-rental tracker
   are personal and stay in the spreadsheet unless they generalize cleanly.

### Your personal account vs. the demo seed

Today: your Clerk user has `publicMetadata.role = "admin"`, and `publishToDemo()` in
`src/app/actions/admin.ts` clones the admin's rows into `demo_user`. Using that account for
real Austin numbers would leak them into the demo on the next publish.

Plan: keep the existing account as the **demo-author account**, and create a second Clerk
user for **real life** (a plus-address like `lonewolf+austin@wolvestofeed.com` works). Activate
it from the admin page with `toggleUserSubscription`, no Stripe needed. It gets its own
`rv_vehicles` row (the trailer in Austin), its own appliance list, and its own scenarios.
Nothing in `publishToDemo` touches it. If you ever want a demo scenario, build it on the
author account and publish as usual.

## 4. Feature outline

### Phase 1 — replaces the spreadsheet
- **Cash Flow page** (`/calculators/cashflow`, sidebar item "Cash Flow Statement",
  feature flag `cash_flow`): the grid. Sticky line-name column, 12 month columns, Year
  total, % of outflow. Group headers (Receipts / Cash Paid Out / Additional) collapsible with
  subtotals. Computed rows (Total Available, Total Out, Net, EOM Cash) read-only and
  highlighted. Negative EOM cash flagged red. Current month highlighted, past months dimmed.
- **Cell editing** like a spreadsheet: click or arrow into a cell, type, Enter/Tab moves on.
  Row actions: fill right, clear, annual amount in month X, 12-value seasonal profile.
- **Line items**: name, group, category (reuse `ExpenseCategory`), due day, recurrence
  (monthly / annual / seasonal / from-calculator), notes. Drag to reorder. Archive, not delete.
- **Scenarios**: list, clone, rename, set one as primary. Each owns its year, opening cash
  and line items. Replaces tab-copying.
- **Paycheck calculator**: hourly or salary → gross annual → per period → tax % → net
  monthly, pre-tax deductions either as negative receipts (your convention) or netted.
  Feeds the Primary Income line.
- **Group burden / share**: annualized monthly burden and share of total outflow per group
  (the `U`/`V`/`X` side calcs).
- **Bills view** (the empty `Bill Schedule` tab): this month's lines by due day, amount, paid
  toggle, "cash after remaining bills", next 14 days strip. This is the daily tool.
- **Charts**: EOM cash line, net cash bars, outflow breakdown via `CategoryBreakdown`.
- **Import** the workbook as seed data, one scenario per statement tab.
- **Export** xlsx / CSV (RVMP has none today; both are small additions).

### Phase 2 — what the spreadsheet couldn't do
- **Plan vs Actual** per cell, view toggle Plan / Actual / Variance. Actuals can be typed
  or pulled from the Living Budget `expenses` rows by category and month.
- **Year rollover**: December EOM cash becomes next year's opening cash; copy lines forward.
- **Scenario compare**: overlay EOM cash lines, yearly totals with deltas, line-by-line diff.
- **Purchase Plan** from the existing Purchase Calculator: price, accessories, down payment,
  APR, term, purchase month → writes one cash-out cell and a loan-payment line
  (`calculateLoanPayment` already exists).
- **Energy line** from the Power page: `getTotalDailyConsumption()` Wh/day × $/kWh + fixed
  monthly charge, with an optional 12-month usage multiplier for Austin summers. Adds the
  first electricity-rate input RVMP has ever had.
- **PDF report** reusing `LivingBudgetReport` layout in `src/lib/pdf/reports/`.

### Phase 3 — balances and projections
- **Accounts & holdings**: name, balance, APY, monthly contribution → 1/2/5-year projection
  (`Investment Calc`). Gold as an account with oz and cost basis if it generalizes.
- **Retirement split**: 50/30/20 of net monthly, % of income ladder (`Retirement`).

## 5. Surfaces

```
┌ RV MasterPlan › Cash Flow Statement ─────────────────────────────────────────┐
│ [Scenario ▾ 2026 Austin]  [Grid] [Bills] [Charts]  [Calculators ▾] [Export ▾]│
├───────────────────────┬──────┬──────┬──────┬─────┬──────┬──────┬────────┬───┤
│ Line                  │ Due  │ JAN  │ FEB  │ ... │ DEC  │ Year │ % out  │   │
├───────────────────────┼──────┼──────┼──────┼─────┼──────┼──────┼────────┼───┤
│ Cash on Hand (BOM)    │      │ 7000 │ 9673 │     │36072 │      │        │   │
│ ▾ Cash Receipts       │      │      │      │     │      │      │        │   │
│   Primary Income  fx  │ 15   │10539 │10539 │     │10539 │126464│        │   │
│   IRA Deduction       │      │ -500 │ -500 │     │ -500 │ -6000│        │   │
│   Total Cash Available│      │16039 │18712 │     │45111 │115464│        │   │
│ ▾ Cash Paid Out       │      │      │      │     │      │      │  67%   │   │
│   Rent                │ 1    │ 1800 │ 1800 │     │ 1800 │ 21600│  28.2% │   │
│   Electric (fx Power) │ 12   │  172 │  162 │     │  150 │  1432│   1.9% │   │
│   ...                 │      │      │      │     │      │      │        │   │
│ Monthly Net Cash      │      │ 2673 │ 2477 │     │ 2840 │ 31912│        │   │
│ Cash Position (EOM)   │      │ 9673 │12150 │     │38912 │      │        │   │
└───────────────────────┴──────┴──────┴──────┴─────┴──────┴──────┴────────┴───┘
```

- **Grid** tab: the statement. Sidebar collapses to icons on this route. Phone view shows
  one month column with a month picker.
- **Bills** tab: this month by due date, paid toggles, cash after bills.
- **Charts** tab: EOM cash, net cash, outflow breakdown; scenario overlay in Phase 2.
- **Calculators** drawer: Paycheck, Purchase Plan, Energy, Group Burden. Each writes back
  to a line item.
- **Dashboard** gets one new KPI block: current-month EOM cash from the primary scenario.

## 6. Data model

```
cf_scenarios   { id, userId, name, year, fiscalStart, openingCash, isPrimary, clonedFromId? }
cf_sections    { id, scenarioId, kind: 'receipts' | 'outflow', name, order }
cf_line_items  { id, sectionId, name, category, dueDay?, recurrence, calcRef?, order, archived }
cf_cells       { lineItemId, month 0-11, planned, actual?, paid?, note? }
cf_calculators { id, scenarioId, type: 'paycheck'|'purchase'|'energy', params jsonb }
cf_accounts    { id, userId, name, kind, balance, apy, monthlyContribution, costBasis? }  // Phase 3
```

All tables carry `userId` like the rest of RVMP, so `publishToDemo`, `deleteUser` and the
admin stats extend naturally. Statement math (totals, available, net, EOM roll-forward,
% of outflow, group shares) lives in one pure module, `src/lib/cashflow/compute.ts`, so the
grid, charts, PDF and xlsx export all read the same numbers. `numeric` columns come back as
strings from Drizzle, so convert at the action boundary, as the other pages do.

## 7. Where it lands in the codebase

- `src/app/(dashboard)/calculators/cashflow/page.tsx` + `layout.tsx` (wide variant)
- `src/lib/actions/cashflow.ts` (server actions), `src/lib/cashflow/compute.ts` (pure math)
- `src/lib/db/schema.ts` + a new `drizzle/0004_cashflow.sql`
- `src/components/cashflow/` (grid, cell editor, bills list, scenario switcher, calculators)
- `src/components/layout/sidebar.tsx` nav item with `featureKey: "cash_flow"`
- `src/lib/pdf/reports/CashFlowReport.tsx`
- `src/scripts/importWorkbook.ts` (one-off seed from the xlsx)

## 8. Roadmap

### Setup
- [ ] Create the second Clerk user for real-life numbers; activate it from Admin → Users.
- [ ] Add `cash_flow` to the feature flags in Admin (defaults on).
- [x] Personal account is `user_3ApBI9FgXteHcUZbpfLf4owE1my` (lonewolf@wolvestofeed.com), admin role
      removed in Clerk, active full plan in `user_profiles`.
- [x] Seeded: **2026 Budget** (primary, live year, started from the 2027 lines) and **2027 Budget**
      (next forecast). 2025 tabs were dropped on purpose. No other pages are seeded from the
      spreadsheet; the cash-flow statement is the only feature being recreated.

### Phase 1 — replaces the spreadsheet
- [x] Schema: `cf_scenarios`, `cf_sections`, `cf_line_items`, `cf_cells`, `cf_calculators`
- [x] Pure statement math in `src/lib/cashflow/compute.ts`
- [x] Server actions in `src/lib/actions/cashflow.ts`
- [x] Cash Flow page at `/calculators/cashflow` with Statement / Bills / Charts tabs
- [x] Spreadsheet-style grid: sticky line column, 12 months, Year, % of outflow, group subtotals,
      computed rows, negative EOM cash flagged
- [x] Cell editing with Enter / arrow navigation, fill right, annual-in-month, clear row
- [x] Line item dialog: name, section, category, due day, recurrence, notes, archive
- [x] Scenarios: create, clone, rename, set primary, delete
- [x] Paycheck calculator writing to a receipts line
- [x] Group burden and share of outflow
- [x] Bills view: this month by due day, paid toggle, cash after remaining bills
- [x] Charts: EOM cash line, net cash bars, outflow breakdown
- [x] xlsx export with live formulas
- [x] Workbook import script
- [x] Sidebar item + feature flag + wide content container on this route
- [x] `publishToDemo` and `deleteUser` cover the new tables
- [ ] Dashboard KPI: current-month EOM cash from the primary scenario

### Phase 2 — beyond the spreadsheet
- [ ] **Add a year**: roll December ending cash into a new scenario for year+1, copy lines forward
      (first Phase 2 item, per Robert 2026-09-21)
- [ ] Plan vs Actual per cell (schema already has `actual`), view toggle Plan / Actual / Variance
- [ ] Pull actuals from Living Budget `expenses` by category and month
- [ ] Scenario compare: overlay EOM cash lines, yearly totals with deltas, line diff
- [ ] Purchase Plan calculator (price, down, APR, term, month → cash-out cell + loan line)
- [ ] Energy calculator (Power page Wh/day × $/kWh + fixed charge, 12-month multiplier)
- [ ] PDF report `CashFlowReport.tsx`
- [ ] Phone layout: single-month column with month picker

### Phase 3 — balances and projections
- [ ] Accounts & holdings with APY and monthly contribution → multi-year projection
- [ ] Retirement split (50/30/20 of net monthly)
