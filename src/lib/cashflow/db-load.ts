/**
 * Row → domain conversion and scenario loading, including the year-to-year
 * opening-cash link. Plain module (not "use server") so the actions stay thin and
 * scripts can load a scenario the same way the page does. Callers pass the owning
 * userId; nothing here checks auth.
 */
import { db } from '@/lib/db';
import { cfScenarios, cfSections, cfLineItems, cfCells, cfCalculators } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { computeStatement } from './compute';
import type { CfScenario, CfSection, CfLineItem, CfCell, CfCalculator, ScenarioBundle, OpeningSource, SectionKind, Recurrence, CalculatorType } from './types';

// ─── Row → domain converters (numeric columns arrive as strings) ─────────────
export function toScenario(r: typeof cfScenarios.$inferSelect): CfScenario {
    return { id: r.id, name: r.name, year: r.year, openingCash: Number(r.openingCash), isPrimary: r.isPrimary, clonedFromId: r.clonedFromId, openingSourceScenarioId: r.openingSourceScenarioId, notes: r.notes };
}
export function toSection(r: typeof cfSections.$inferSelect): CfSection {
    return { id: r.id, scenarioId: r.scenarioId, kind: r.kind as SectionKind, name: r.name, sortOrder: r.sortOrder };
}
export function toLine(r: typeof cfLineItems.$inferSelect): CfLineItem {
    return { id: r.id, scenarioId: r.scenarioId, sectionId: r.sectionId, name: r.name, category: r.category, dueDay: r.dueDay, recurrence: r.recurrence as Recurrence, sortOrder: r.sortOrder, archived: r.archived, notes: r.notes };
}
export function toCell(r: typeof cfCells.$inferSelect): CfCell {
    return { id: r.id, scenarioId: r.scenarioId, lineItemId: r.lineItemId, month: r.month, planned: Number(r.planned), actual: r.actual === null ? null : Number(r.actual), paid: r.paid, note: r.note };
}
export function toCalc(r: typeof cfCalculators.$inferSelect): CfCalculator {
    return { id: r.id, scenarioId: r.scenarioId, lineItemId: r.lineItemId, type: r.type as CalculatorType, name: r.name, params: (r.params || {}) as Record<string, unknown> };
}

// ─── Year-to-year opening cash ───────────────────────────────────────────────
/** Longest chain of linked years we will follow (2026 → 2027 → … ). Writes only
 *  allow links to earlier years, so cycles cannot be stored; this is a backstop. */
const MAX_LINK_DEPTH = 12;

/** Load everything a scenario needs, resolving its prior-year link recursively. */
export async function loadBundle(row: typeof cfScenarios.$inferSelect, userId: string, depth = 0): Promise<ScenarioBundle> {
    const [sections, lines, cells, calcs] = await Promise.all([
        db.select().from(cfSections).where(eq(cfSections.scenarioId, row.id)),
        db.select().from(cfLineItems).where(eq(cfLineItems.scenarioId, row.id)),
        db.select().from(cfCells).where(eq(cfCells.scenarioId, row.id)),
        db.select().from(cfCalculators).where(eq(cfCalculators.scenarioId, row.id)),
    ]);
    const bundle: ScenarioBundle = {
        scenario: toScenario(row),
        sections: sections.map(toSection),
        lineItems: lines.map(toLine),
        cells: cells.map(toCell),
        calculators: calcs.map(toCalc),
    };
    if (row.openingSourceScenarioId) bundle.openingSource = await resolveOpeningSource(row.openingSourceScenarioId, userId, depth);
    return bundle;
}

/** December ending cash of an earlier-year scenario the user owns, or null if it
 *  cannot be resolved (deleted, someone else's, or the chain is too deep). */
export async function resolveOpeningSource(sourceId: string, userId: string, depth = 0): Promise<OpeningSource | null> {
    if (depth >= MAX_LINK_DEPTH) return null;
    const src = await db.query.cfScenarios.findFirst({ where: and(eq(cfScenarios.id, sourceId), eq(cfScenarios.userId, userId)) });
    if (!src) return null;
    const computed = computeStatement(await loadBundle(src, userId, depth + 1));
    return { scenarioId: src.id, name: src.name, year: src.year, endingCash: Math.round(computed.totals.endingCash * 100) / 100 };
}

/** Throws unless `sourceId` is a scenario the user owns with a year earlier than `year`. */
export async function validateOpeningSource(userId: string, selfId: string | null, sourceId: string, year: number) {
    if (sourceId === selfId) throw new Error('A scenario cannot carry forward from itself');
    const src = await db.query.cfScenarios.findFirst({ where: and(eq(cfScenarios.id, sourceId), eq(cfScenarios.userId, userId)) });
    if (!src) throw new Error('Source scenario not found');
    if (src.year >= year) throw new Error(`Opening cash can only carry forward from an earlier year (${src.name} is ${src.year})`);
    return src;
}
