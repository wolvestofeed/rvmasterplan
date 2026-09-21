/**
 * Export a scenario as an .xlsx that looks like the original spreadsheet,
 * with live SUM formulas so it keeps working after download.
 * Client-side only (uses SheetJS + a browser download).
 */
import * as XLSX from 'xlsx';
import { MONTHS_SHORT } from './constants';
import { sortByOrder } from './compute';
import type { ScenarioBundle } from './types';

type Cell = XLSX.CellObject | number | string | null;

const COL = (i: number) => XLSX.utils.encode_col(i);
const FIRST_MONTH_COL = 2; // A=line, B=due, C..N = months, O=year, P=% out
const YEAR_COL = FIRST_MONTH_COL + 12;
const PCT_COL = YEAR_COL + 1;
const monthCol = (m: number) => COL(FIRST_MONTH_COL + m);

export function buildWorkbook(bundle: ScenarioBundle): XLSX.WorkBook {
    const rows: Cell[][] = [];
    const push = (r: Cell[]) => { rows.push(r); return rows.length; }; // returns 1-based row number
    const f = (formula: string): XLSX.CellObject => ({ t: 'n', f: formula });
    const sumRow = (row: number, from: number, to: number) => `SUM(${monthCol(0)}${from}:${monthCol(11)}${to})`;

    push([`Cash Flow Statement — ${bundle.scenario.name}`]);
    push([]);
    push(['Line', 'Due', ...MONTHS_SHORT, 'Year', '% Out']);

    // Opening cash row
    const openingRow = push(['Cash on Hand (beginning of month)', null, bundle.scenario.openingCash, ...Array(11).fill(null), null, null]);
    push([]);

    const sections = sortByOrder(bundle.sections);
    const cellsByLine = new Map<string, Map<number, number>>();
    for (const c of bundle.cells) {
        let m = cellsByLine.get(c.lineItemId); if (!m) { m = new Map(); cellsByLine.set(c.lineItemId, m); }
        m.set(c.month, c.planned);
    }

    const sectionTotalRows: { kind: string; row: number }[] = [];
    let totalOutRow = 0;
    const receipts = sections.filter(s => s.kind === 'receipts');
    const outflow = sections.filter(s => s.kind === 'outflow');

    const writeSection = (s: typeof sections[number]) => {
        push([s.name]);
        const lines = sortByOrder(bundle.lineItems.filter(l => l.sectionId === s.id && !l.archived));
        const first = rows.length + 1;
        for (const l of lines) {
            const vals = Array.from({ length: 12 }, (_, m) => cellsByLine.get(l.id)?.get(m) ?? 0);
            const r = rows.length + 1;
            push([l.name, l.dueDay ?? null, ...vals, f(`SUM(${monthCol(0)}${r}:${monthCol(11)}${r})`), null]);
        }
        const last = rows.length;
        const totalRow = rows.length + 1;
        push(['Total', null, ...MONTHS_SHORT.map((_, m) => f(lines.length ? `SUM(${monthCol(m)}${first}:${monthCol(m)}${last})` : '0')), f(`SUM(${monthCol(0)}${totalRow}:${monthCol(11)}${totalRow})`), null]);
        sectionTotalRows.push({ kind: s.kind, row: totalRow });
        push([]);
        return { first, last, totalRow, lineCount: lines.length };
    };

    const receiptRefs = receipts.map(writeSection);
    const totalAvailRow = push(['Total Cash Available (before cash out)', null,
        ...MONTHS_SHORT.map((_, m) => f(`${monthCol(m)}${openingRow}${receiptRefs.map(r => `+${monthCol(m)}${r.totalRow}`).join('')}`)),
        null, null]);
    push([]);

    const outRefs = outflow.map(writeSection);
    totalOutRow = push(['Total Cash Paid Out', null,
        ...MONTHS_SHORT.map((_, m) => f(outRefs.length ? outRefs.map(r => `${monthCol(m)}${r.totalRow}`).join('+') : '0')),
        f(`SUM(${monthCol(0)}${rows.length + 1}:${monthCol(11)}${rows.length + 1})`), null]);
    const netRow = push(['Monthly Net Cash', null,
        ...MONTHS_SHORT.map((_, m) => f(`${receiptRefs.map(r => `${monthCol(m)}${r.totalRow}`).join('+') || '0'}-${monthCol(m)}${totalOutRow}`)),
        f(`SUM(${monthCol(0)}${rows.length + 1}:${monthCol(11)}${rows.length + 1})`), null]);
    const endRow = push(['Cash Position (end of month)', null,
        ...MONTHS_SHORT.map((_, m) => f(`${monthCol(m)}${totalAvailRow}-${monthCol(m)}${totalOutRow}`)),
        null, null]);

    // Opening cash for Feb..Dec = previous month's ending cash
    for (let m = 1; m < 12; m++) rows[openingRow - 1][FIRST_MONTH_COL + m] = f(`${monthCol(m - 1)}${endRow}`);
    // % of outflow for every outflow line and section total
    for (const ref of outRefs) {
        for (let r = ref.first; r <= ref.last; r++) rows[r - 1][PCT_COL] = { t: 'n', f: `IF($${COL(YEAR_COL)}$${totalOutRow}=0,0,${COL(YEAR_COL)}${r}/$${COL(YEAR_COL)}$${totalOutRow})`, z: '0.0%' };
        rows[ref.totalRow - 1][PCT_COL] = { t: 'n', f: `IF($${COL(YEAR_COL)}$${totalOutRow}=0,0,${COL(YEAR_COL)}${ref.totalRow}/$${COL(YEAR_COL)}$${totalOutRow})`, z: '0.0%' };
    }
    void netRow; void sumRow;

    const ws = XLSX.utils.aoa_to_sheet(rows as unknown[][]);
    ws['!cols'] = [{ wch: 38 }, { wch: 5 }, ...Array(12).fill({ wch: 11 }), { wch: 12 }, { wch: 8 }];
    ws['!freeze'] = { xSplit: 2, ySplit: 3 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, bundle.scenario.name.slice(0, 31).replace(/[\\/?*[\]:]/g, ' ') || 'Cash Flow');
    return wb;
}

export function downloadWorkbook(bundle: ScenarioBundle) {
    const wb = buildWorkbook(bundle);
    XLSX.writeFile(wb, `${bundle.scenario.name.replace(/[^\w\- ]+/g, '')} cash flow.xlsx`);
}
