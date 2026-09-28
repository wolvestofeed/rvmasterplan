/**
 * Read-only: prints every cash-flow scenario for a user the way the page loads it,
 * including the resolved year-to-year opening-cash link and December ending cash.
 *   npx tsx src/scripts/inspectCashFlowScenarios.ts <clerkUserId>
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
import { eq } from 'drizzle-orm';

async function main() {
    const userId = process.argv[2];
    if (!userId) { console.error('usage: inspectCashFlowScenarios.ts <clerkUserId>'); process.exit(1); }
    // Imported after dotenv has run, since the db client reads DATABASE_URL at module load.
    const { db } = await import('../lib/db');
    const { cfScenarios } = await import('../lib/db/schema');
    const { loadBundle } = await import('../lib/cashflow/db-load');
    const { computeStatement } = await import('../lib/cashflow/compute');

    const rows = await db.select().from(cfScenarios).where(eq(cfScenarios.userId, userId));
    for (const row of rows.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))) {
        const bundle = await loadBundle(row, userId);
        const c = computeStatement(bundle);
        const link = row.openingSourceScenarioId
            ? (bundle.openingSource ? `linked → ${bundle.openingSource.name} (${bundle.openingSource.year}) Dec ending ${bundle.openingSource.endingCash}` : 'linked → UNRESOLVED (using stored amount)')
            : 'manual';
        console.log(`${row.year}  ${row.name}${row.isPrimary ? ' ★' : ''}`);
        console.log(`   opening ${c.totals.openingCash.toFixed(2)}  [${link}]  stored ${row.openingCash}`);
        console.log(`   receipts ${c.totals.receipts.toFixed(2)}  out ${c.totals.outflow.toFixed(2)}  Dec ending ${c.totals.endingCash.toFixed(2)}${c.firstNegativeMonth !== null ? `  (negative from month ${c.firstNegativeMonth + 1})` : ''}`);
    }
    process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
