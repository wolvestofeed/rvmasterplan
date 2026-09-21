/**
 * One-off importer: reads the personal budget workbook and creates one cash-flow
 * scenario per "Cash Flow Statement" tab for the given Clerk user.
 *
 *   npx tsx src/scripts/importCashFlowWorkbook.ts <clerkUserId> "<path/to/workbook.xlsx>" [--replace]
 *
 * Layout it expects (matches "RWB Budget 2026 - 2027.xlsx"):
 *   B1 = "Cash Flow Statement", months in E..P, labels in column B,
 *   D6 = opening cash, receipts rows 9-16, cash paid out rows 21-38, additional expenses rows 42-46.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });

import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { cfScenarios, cfSections, cfLineItems, cfCells, users } from '../lib/db/schema';

const MONTH_COLS = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
const BLOCKS = [
    { kind: 'receipts' as const, name: 'Cash Receipts', rows: [9, 16] as const, order: 0 },
    { kind: 'outflow' as const, name: 'Cash Paid Out', rows: [21, 38] as const, order: 1 },
    { kind: 'outflow' as const, name: 'Additional Expenses', rows: [42, 46] as const, order: 2 },
];

const CATEGORY_RULES: [RegExp, string][] = [
    [/income|paycheck|salary|check|refund|sale|liquidation/i, 'Income'],
    [/ira|401k|retire|saving/i, 'Retirement & Savings'],
    [/mortgage|rent(?!al)|property tax|hoa/i, 'Housing'],
    [/lpea|electric|util|water|sewer|trash|transfer station/i, 'Utilities'],
    [/propane/i, 'Propane'],
    [/internet|mobile|verizon|t ?mobile|phone|cable/i, 'Phone & Internet'],
    [/insur|state farm|geico|progressive|anthem|dental/i, 'Insurance'],
    [/medical|doctor|hospital|supplement|maska|health/i, 'Health'],
    [/food|grocer/i, 'Food'],
    [/\bgas\b|fuel|registration|truck|auto|parking/i, 'Fuel & Vehicle'],
    [/adobe|godaddy|website|prime|netflix|subscri/i, 'Subscriptions'],
    [/campground|park permit/i, 'Campground'],
    [/tax|fee/i, 'Taxes & Fees'],
];
const categorize = (name: string) => CATEGORY_RULES.find(([re]) => re.test(name))?.[1] ?? 'Other';

function cellNum(ws: XLSX.WorkSheet, addr: string): number {
    const c = ws[addr]; if (!c) return 0;
    const v = typeof c.v === 'number' ? c.v : Number(c.v);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}
function cellStr(ws: XLSX.WorkSheet, addr: string): string {
    const c = ws[addr]; return c && c.v !== undefined && c.v !== null ? String(c.v).trim() : '';
}

async function main() {
    const [userId, file, ...flags] = process.argv.slice(2);
    if (!userId || !file) { console.error('usage: importCashFlowWorkbook.ts <clerkUserId> <workbook.xlsx> [--replace]'); process.exit(1); }
    const replace = flags.includes('--replace');
    // Imported after dotenv has run, since the db client reads DATABASE_URL at module load.
    const { db } = await import('../lib/db');

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) { console.error(`No user with id ${userId}. Sign in once so the Clerk webhook creates the row.`); process.exit(1); }

    const wb = XLSX.readFile(file, { cellFormula: false });
    const existing = await db.select().from(cfScenarios).where(eq(cfScenarios.userId, userId));
    if (replace && existing.length) {
        console.log(`Deleting ${existing.length} existing scenario(s)…`);
        await db.delete(cfScenarios).where(eq(cfScenarios.userId, userId));
    }
    let hasPrimary = !replace && existing.some(s => s.isPrimary);

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (cellStr(ws, 'B1') !== 'Cash Flow Statement') continue;
        const yearMatch = sheetName.match(/(20\d{2})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        const openingCash = cellNum(ws, 'D6');

        const scenarioId = randomUUID();
        const isPrimary = !hasPrimary; hasPrimary = true;
        await db.insert(cfScenarios).values({ id: scenarioId, userId, name: sheetName.trim(), year, openingCash: String(openingCash), isPrimary, notes: `Imported from ${file.split('/').pop()} › ${sheetName}` });

        let lineCount = 0, cellCount = 0;
        for (const block of BLOCKS) {
            const sectionId = randomUUID();
            await db.insert(cfSections).values({ id: sectionId, scenarioId, kind: block.kind, name: block.name, sortOrder: block.order });
            let sortOrder = 0;
            for (let r = block.rows[0]; r <= block.rows[1]; r++) {
                const name = cellStr(ws, `B${r}`);
                if (!name) continue;
                const values = MONTH_COLS.map(col => cellNum(ws, `${col}${r}`));
                if (values.every(v => v === 0)) continue;
                const nonZero = values.filter(v => v !== 0);
                const recurrence = nonZero.length === 1 ? 'annual' : (nonZero.length === 12 && nonZero.every(v => v === nonZero[0]) ? 'monthly' : 'seasonal');
                const lineId = randomUUID();
                await db.insert(cfLineItems).values({ id: lineId, scenarioId, sectionId, name, category: categorize(name), recurrence, sortOrder: sortOrder++ });
                await db.insert(cfCells).values(values.map((planned, month) => ({ id: randomUUID(), scenarioId, lineItemId: lineId, month, planned: String(planned) })));
                lineCount++; cellCount += 12;
            }
        }
        console.log(`✓ "${sheetName}" → scenario ${year}${isPrimary ? ' (primary)' : ''}: ${lineCount} lines, ${cellCount} cells, opening cash ${openingCash}`);
    }
    console.log('Done.');
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
