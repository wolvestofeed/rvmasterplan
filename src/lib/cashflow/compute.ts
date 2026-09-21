/**
 * Pure statement math. No React, no DB.
 * Everything that displays a number (grid, charts, bills, xlsx, PDF) reads from here
 * so the app never disagrees with itself.
 *
 * Mirrors the spreadsheet:
 *   Cash on Hand (BOM) + Receipts = Total Cash Available
 *   Total Cash Available − Cash Paid Out = Cash Position (EOM) → next month's BOM
 */

import type { CfCell, CfLineItem, CfSection, ScenarioBundle, SectionKind, StatementMode } from './types';

export interface LineComputed {
    lineItemId: string;
    sectionId: string;
    kind: SectionKind;
    monthly: number[];      // 12 values
    yearTotal: number;
    pctOfOutflow: number;   // share of total outflow (0-1); 0 for receipts
}

export interface SectionComputed {
    sectionId: string;
    kind: SectionKind;
    name: string;
    monthly: number[];
    yearTotal: number;
    pctOfOutflow: number;   // 0-1
    monthlyBurden: number;  // yearTotal / 12 ("Owner Expense → Monthly Burden" on the sheet)
}

export interface MonthComputed {
    month: number;          // 0-11
    opening: number;        // Cash on Hand (beginning of month)
    receipts: number;
    totalAvailable: number;
    outflow: number;        // Total Cash Paid Out
    net: number;            // Monthly Net Cash
    ending: number;         // Cash Position (end of month)
}

export interface StatementComputed {
    months: MonthComputed[];
    sections: SectionComputed[];
    lines: LineComputed[];
    totals: {
        openingCash: number;
        receipts: number;
        outflow: number;
        net: number;
        endingCash: number;
    };
    lowestEnding: { month: number; value: number };
    firstNegativeMonth: number | null;
}

const ZERO12 = () => Array<number>(12).fill(0);

/** Value a cell contributes under the given mode. In 'actual' mode a cell with
 *  no actual yet falls back to its planned value, so partial months still add up. */
export function cellValue(cell: CfCell | undefined, mode: StatementMode = 'planned'): number {
    if (!cell) return 0;
    if (mode === 'actual' && cell.actual !== null && cell.actual !== undefined) return cell.actual;
    return cell.planned || 0;
}

/** Index cells by lineItemId → month → cell. */
export function indexCells(cells: CfCell[]): Map<string, Map<number, CfCell>> {
    const m = new Map<string, Map<number, CfCell>>();
    for (const c of cells) {
        let inner = m.get(c.lineItemId);
        if (!inner) { inner = new Map(); m.set(c.lineItemId, inner); }
        inner.set(c.month, c);
    }
    return m;
}

export function sortByOrder<T extends { sortOrder: number; name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function computeStatement(bundle: ScenarioBundle, mode: StatementMode = 'planned'): StatementComputed {
    const { scenario } = bundle;
    const sections = sortByOrder(bundle.sections);
    const lineItems = sortByOrder(bundle.lineItems.filter(l => !l.archived));
    const byLine = indexCells(bundle.cells);

    // Per-line monthly values
    const sectionKind = new Map<string, SectionKind>(sections.map(s => [s.id, s.kind]));
    const lines: LineComputed[] = lineItems.map(li => {
        const cells = byLine.get(li.id);
        const monthly = ZERO12().map((_, m) => cellValue(cells?.get(m), mode));
        return {
            lineItemId: li.id,
            sectionId: li.sectionId,
            kind: sectionKind.get(li.sectionId) ?? 'outflow',
            monthly,
            yearTotal: monthly.reduce((a, b) => a + b, 0),
            pctOfOutflow: 0,
        };
    });

    // Per-section totals
    const sectionsComputed: SectionComputed[] = sections.map(s => {
        const monthly = ZERO12();
        for (const ln of lines) {
            if (ln.sectionId !== s.id) continue;
            for (let m = 0; m < 12; m++) monthly[m] += ln.monthly[m];
        }
        const yearTotal = monthly.reduce((a, b) => a + b, 0);
        return { sectionId: s.id, kind: s.kind, name: s.name, monthly, yearTotal, pctOfOutflow: 0, monthlyBurden: yearTotal / 12 };
    });

    // Month roll-forward
    const months: MonthComputed[] = [];
    let opening = scenario.openingCash || 0;
    for (let m = 0; m < 12; m++) {
        let receipts = 0, outflow = 0;
        for (const s of sectionsComputed) {
            if (s.kind === 'receipts') receipts += s.monthly[m];
            else outflow += s.monthly[m];
        }
        const totalAvailable = opening + receipts;
        const ending = totalAvailable - outflow;
        months.push({ month: m, opening, receipts, totalAvailable, outflow, net: receipts - outflow, ending });
        opening = ending;
    }

    const totalOutflow = months.reduce((a, mo) => a + mo.outflow, 0);
    const totalReceipts = months.reduce((a, mo) => a + mo.receipts, 0);
    if (totalOutflow > 0) {
        for (const ln of lines) if (ln.kind === 'outflow') ln.pctOfOutflow = ln.yearTotal / totalOutflow;
        for (const s of sectionsComputed) if (s.kind === 'outflow') s.pctOfOutflow = s.yearTotal / totalOutflow;
    }

    let lowest = { month: 0, value: months[0]?.ending ?? 0 };
    let firstNegativeMonth: number | null = null;
    for (const mo of months) {
        if (mo.ending < lowest.value) lowest = { month: mo.month, value: mo.ending };
        if (firstNegativeMonth === null && mo.ending < 0) firstNegativeMonth = mo.month;
    }

    return {
        months,
        sections: sectionsComputed,
        lines,
        totals: {
            openingCash: scenario.openingCash || 0,
            receipts: totalReceipts,
            outflow: totalOutflow,
            net: totalReceipts - totalOutflow,
            endingCash: months[11]?.ending ?? scenario.openingCash,
        },
        lowestEnding: lowest,
        firstNegativeMonth,
    };
}

/** Outflow by category for the year (for the breakdown chart). */
export function outflowByCategory(bundle: ScenarioBundle, computed: StatementComputed): { name: string; value: number }[] {
    const byId = new Map(bundle.lineItems.map(l => [l.id, l]));
    const acc = new Map<string, number>();
    for (const ln of computed.lines) {
        if (ln.kind !== 'outflow' || ln.yearTotal === 0) continue;
        const cat = byId.get(ln.lineItemId)?.category || 'Other';
        acc.set(cat, (acc.get(cat) || 0) + ln.yearTotal);
    }
    return [...acc.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/** Bills for one month: every non-archived line with a value that month, sorted by due day. */
export interface BillRow {
    lineItem: CfLineItem;
    section: CfSection;
    cell: CfCell | undefined;
    amount: number;
    paid: boolean;
}
export function billsForMonth(bundle: ScenarioBundle, month: number, mode: StatementMode = 'planned'): BillRow[] {
    const byLine = indexCells(bundle.cells);
    const sectionById = new Map(bundle.sections.map(s => [s.id, s]));
    const rows: BillRow[] = [];
    for (const li of bundle.lineItems) {
        if (li.archived) continue;
        const cell = byLine.get(li.id)?.get(month);
        const amount = cellValue(cell, mode);
        if (amount === 0) continue;
        const section = sectionById.get(li.sectionId);
        if (!section) continue;
        rows.push({ lineItem: li, section, cell, amount, paid: cell?.paid ?? false });
    }
    return rows.sort((a, b) => (a.lineItem.dueDay ?? 32) - (b.lineItem.dueDay ?? 32) || a.lineItem.name.localeCompare(b.lineItem.name));
}
