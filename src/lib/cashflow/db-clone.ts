/**
 * Shared clone logic for scenarios. Used by the cloneScenario / rollForwardScenario
 * actions and by admin publishToDemo. Not a "use server" module on purpose: it takes
 * a target userId, so it must never be exposed as a callable action.
 */
import { db } from '@/lib/db';
import { cfScenarios, cfSections, cfLineItems, cfCells, cfCalculators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { rollForwardValues } from './compute';
import type { Recurrence } from './types';

export interface CloneScenarioOptions {
    name?: string;
    isPrimary?: boolean;
    /** undefined = point at the source scenario; null = no lineage. */
    clonedFromId?: string | null;
    /** Year for the copy. Defaults to the source's year. */
    year?: number;
    /** Opening-cash link for the copy. undefined = same link as the source; null = none. */
    openingSourceScenarioId?: string | null;
    /** Roll-forward mode: planned amounts are projected per line with rollForwardValues
     *  (monthly lines fill empty months with their latest amount, everything else keeps
     *  its months); paid flags, actuals and cell notes are dropped. */
    rollForward?: boolean;
}

export async function cloneScenarioRows(sourceScenarioId: string, targetUserId: string, opts: CloneScenarioOptions = {}) {
    const src = await db.query.cfScenarios.findFirst({ where: eq(cfScenarios.id, sourceScenarioId) });
    if (!src) throw new Error('Scenario not found');

    const [sections, lines, cells, calcs] = await Promise.all([
        db.select().from(cfSections).where(eq(cfSections.scenarioId, sourceScenarioId)),
        db.select().from(cfLineItems).where(eq(cfLineItems.scenarioId, sourceScenarioId)),
        db.select().from(cfCells).where(eq(cfCells.scenarioId, sourceScenarioId)),
        db.select().from(cfCalculators).where(eq(cfCalculators.scenarioId, sourceScenarioId)),
    ]);

    const newScenarioId = randomUUID();
    await db.insert(cfScenarios).values({
        id: newScenarioId,
        userId: targetUserId,
        name: opts.name ?? `${src.name} (copy)`,
        year: opts.year ?? src.year,
        openingCash: src.openingCash,
        isPrimary: opts.isPrimary ?? false,
        clonedFromId: opts.clonedFromId === undefined ? src.id : opts.clonedFromId,
        openingSourceScenarioId: opts.openingSourceScenarioId === undefined ? src.openingSourceScenarioId : opts.openingSourceScenarioId,
        notes: src.notes,
    });

    const sectionMap = new Map<string, string>();
    if (sections.length) {
        await db.insert(cfSections).values(sections.map(s => {
            const id = randomUUID(); sectionMap.set(s.id, id);
            return { id, scenarioId: newScenarioId, kind: s.kind, name: s.name, sortOrder: s.sortOrder };
        }));
    }
    const lineMap = new Map<string, string>();
    if (lines.length) {
        await db.insert(cfLineItems).values(lines.map(l => {
            const id = randomUUID(); lineMap.set(l.id, id);
            return {
                id, scenarioId: newScenarioId, sectionId: sectionMap.get(l.sectionId)!,
                name: l.name, category: l.category, dueDay: l.dueDay, recurrence: l.recurrence,
                sortOrder: l.sortOrder, archived: l.archived, notes: l.notes,
            };
        }));
    }
    if (opts.rollForward) {
        // Scrub the whole source year line by line and write next year's planned cells.
        const byLine = new Map<string, number[]>();
        for (const c of cells) {
            const arr = byLine.get(c.lineItemId) ?? Array<number>(12).fill(0);
            arr[c.month] = Number(c.planned) || 0;
            byLine.set(c.lineItemId, arr);
        }
        const newCells: (typeof cfCells.$inferInsert)[] = [];
        for (const l of lines) {
            const values = rollForwardValues(l.recurrence as Recurrence, byLine.get(l.id) ?? []);
            values.forEach((planned, month) => {
                if (planned) newCells.push({ id: randomUUID(), scenarioId: newScenarioId, lineItemId: lineMap.get(l.id)!, month, planned: String(planned) });
            });
        }
        if (newCells.length) await db.insert(cfCells).values(newCells);
    } else if (cells.length) {
        await db.insert(cfCells).values(cells.map(c => ({
            id: randomUUID(), scenarioId: newScenarioId, lineItemId: lineMap.get(c.lineItemId)!,
            month: c.month, planned: c.planned, actual: c.actual, paid: c.paid, note: c.note,
        })));
    }
    if (calcs.length) {
        await db.insert(cfCalculators).values(calcs.map(c => ({
            id: randomUUID(), scenarioId: newScenarioId,
            lineItemId: c.lineItemId ? (lineMap.get(c.lineItemId) ?? null) : null,
            type: c.type, name: c.name, params: c.params,
        })));
    }
    return newScenarioId;
}

/** Copy every scenario of one user to another, keeping year-to-year opening-cash links
 *  pointing inside the copied set. Links to scenarios outside the set are dropped. */
export async function cloneScenariosForUser(sourceUserId: string, targetUserId: string) {
    const scenarios = await db.select().from(cfScenarios).where(eq(cfScenarios.userId, sourceUserId));
    const idMap = new Map<string, string>();
    // Sources have earlier years than the scenarios that depend on them, so year order
    // guarantees a source is copied before anything that links to it.
    for (const sc of [...scenarios].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))) {
        const link = sc.openingSourceScenarioId ? (idMap.get(sc.openingSourceScenarioId) ?? null) : null;
        const newId = await cloneScenarioRows(sc.id, targetUserId, { name: sc.name, isPrimary: sc.isPrimary, clonedFromId: null, openingSourceScenarioId: link });
        idMap.set(sc.id, newId);
    }
    return idMap;
}

export async function deleteScenariosForUser(userId: string) {
    // cf_* children cascade from cf_scenarios
    await db.delete(cfScenarios).where(eq(cfScenarios.userId, userId));
}
