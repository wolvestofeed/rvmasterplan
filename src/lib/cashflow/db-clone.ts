/**
 * Shared clone logic for scenarios. Used by the cloneScenario action and by
 * admin publishToDemo. Not a "use server" module on purpose: it takes a target
 * userId, so it must never be exposed as a callable action.
 */
import { db } from '@/lib/db';
import { cfScenarios, cfSections, cfLineItems, cfCells, cfCalculators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function cloneScenarioRows(sourceScenarioId: string, targetUserId: string, opts: { name?: string; isPrimary?: boolean; clonedFromId?: string | null } = {}) {
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
        year: src.year,
        openingCash: src.openingCash,
        isPrimary: opts.isPrimary ?? false,
        clonedFromId: opts.clonedFromId === undefined ? src.id : opts.clonedFromId,
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
    if (cells.length) {
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

export async function deleteScenariosForUser(userId: string) {
    // cf_* children cascade from cf_scenarios
    await db.delete(cfScenarios).where(eq(cfScenarios.userId, userId));
}
