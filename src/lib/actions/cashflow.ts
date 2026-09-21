'use server';

import { db } from '@/lib/db';
import { cfScenarios, cfSections, cfLineItems, cfCells, cfCalculators } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { getActiveUserId, requireAuth } from './auth-helpers';
import { cloneScenarioRows } from '@/lib/cashflow/db-clone';
import { DEFAULT_SECTIONS } from '@/lib/cashflow/constants';
import type { CfScenario, CfSection, CfLineItem, CfCell, CfCalculator, ScenarioBundle, SectionKind, Recurrence, CalculatorType } from '@/lib/cashflow/types';

const PATH = '/calculators/cashflow';

// ─── Row → domain converters (numeric columns arrive as strings) ─────────────
function toScenario(r: typeof cfScenarios.$inferSelect): CfScenario {
    return { id: r.id, name: r.name, year: r.year, openingCash: Number(r.openingCash), isPrimary: r.isPrimary, clonedFromId: r.clonedFromId, notes: r.notes };
}
function toSection(r: typeof cfSections.$inferSelect): CfSection {
    return { id: r.id, scenarioId: r.scenarioId, kind: r.kind as SectionKind, name: r.name, sortOrder: r.sortOrder };
}
function toLine(r: typeof cfLineItems.$inferSelect): CfLineItem {
    return { id: r.id, scenarioId: r.scenarioId, sectionId: r.sectionId, name: r.name, category: r.category, dueDay: r.dueDay, recurrence: r.recurrence as Recurrence, sortOrder: r.sortOrder, archived: r.archived, notes: r.notes };
}
function toCell(r: typeof cfCells.$inferSelect): CfCell {
    return { id: r.id, scenarioId: r.scenarioId, lineItemId: r.lineItemId, month: r.month, planned: Number(r.planned), actual: r.actual === null ? null : Number(r.actual), paid: r.paid, note: r.note };
}
function toCalc(r: typeof cfCalculators.$inferSelect): CfCalculator {
    return { id: r.id, scenarioId: r.scenarioId, lineItemId: r.lineItemId, type: r.type as CalculatorType, name: r.name, params: (r.params || {}) as Record<string, unknown> };
}

/** Throws unless the scenario belongs to userId. */
async function ownScenario(scenarioId: string, userId: string) {
    const s = await db.query.cfScenarios.findFirst({ where: and(eq(cfScenarios.id, scenarioId), eq(cfScenarios.userId, userId)) });
    if (!s) throw new Error('Scenario not found');
    return s;
}

// ─── Scenarios ───────────────────────────────────────────────────────────────
export async function getScenarios() {
    try {
        const activeId = await getActiveUserId();
        const rows = await db.select().from(cfScenarios).where(eq(cfScenarios.userId, activeId));
        const data = rows.map(toScenario).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.year - a.year || a.name.localeCompare(b.name));
        return { success: true as const, data };
    } catch (error) {
        console.error('getScenarios:', error);
        return { success: false as const, error: 'Failed to load scenarios' };
    }
}

export async function getScenarioBundle(scenarioId: string) {
    try {
        const activeId = await getActiveUserId();
        const s = await db.query.cfScenarios.findFirst({ where: and(eq(cfScenarios.id, scenarioId), eq(cfScenarios.userId, activeId)) });
        if (!s) return { success: false as const, error: 'Scenario not found' };
        const [sections, lines, cells, calcs] = await Promise.all([
            db.select().from(cfSections).where(eq(cfSections.scenarioId, scenarioId)),
            db.select().from(cfLineItems).where(eq(cfLineItems.scenarioId, scenarioId)),
            db.select().from(cfCells).where(eq(cfCells.scenarioId, scenarioId)),
            db.select().from(cfCalculators).where(eq(cfCalculators.scenarioId, scenarioId)),
        ]);
        const data: ScenarioBundle = {
            scenario: toScenario(s),
            sections: sections.map(toSection),
            lineItems: lines.map(toLine),
            cells: cells.map(toCell),
            calculators: calcs.map(toCalc),
        };
        return { success: true as const, data };
    } catch (error) {
        console.error('getScenarioBundle:', error);
        return { success: false as const, error: 'Failed to load scenario' };
    }
}

export async function createScenario(input: { name: string; year: number; openingCash: number; notes?: string }) {
    try {
        const userId = await requireAuth();
        const existing = await db.select({ id: cfScenarios.id }).from(cfScenarios).where(eq(cfScenarios.userId, userId));
        const id = randomUUID();
        await db.insert(cfScenarios).values({
            id, userId, name: input.name.trim() || `${input.year} Budget`, year: input.year,
            openingCash: String(input.openingCash || 0), isPrimary: existing.length === 0, notes: input.notes ?? null,
        });
        await db.insert(cfSections).values(DEFAULT_SECTIONS.map(s => ({ id: randomUUID(), scenarioId: id, ...s })));
        revalidatePath(PATH);
        return { success: true as const, data: { id } };
    } catch (error) {
        console.error('createScenario:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to create scenario' };
    }
}

export async function cloneScenario(scenarioId: string, name?: string) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        const id = await cloneScenarioRows(scenarioId, userId, { name });
        revalidatePath(PATH);
        return { success: true as const, data: { id } };
    } catch (error) {
        console.error('cloneScenario:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to clone scenario' };
    }
}

export async function updateScenario(scenarioId: string, patch: { name?: string; year?: number; openingCash?: number; notes?: string | null }) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.update(cfScenarios).set({
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.year !== undefined ? { year: patch.year } : {}),
            ...(patch.openingCash !== undefined ? { openingCash: String(patch.openingCash) } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            updatedAt: new Date(),
        }).where(eq(cfScenarios.id, scenarioId));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('updateScenario:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update scenario' };
    }
}

export async function setPrimaryScenario(scenarioId: string) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.update(cfScenarios).set({ isPrimary: false }).where(eq(cfScenarios.userId, userId));
        await db.update(cfScenarios).set({ isPrimary: true }).where(eq(cfScenarios.id, scenarioId));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('setPrimaryScenario:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to set primary' };
    }
}

export async function deleteScenario(scenarioId: string) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        // Explicit child deletes so this works even if the FK cascade is missing.
        await db.delete(cfCells).where(eq(cfCells.scenarioId, scenarioId));
        await db.delete(cfCalculators).where(eq(cfCalculators.scenarioId, scenarioId));
        await db.delete(cfLineItems).where(eq(cfLineItems.scenarioId, scenarioId));
        await db.delete(cfSections).where(eq(cfSections.scenarioId, scenarioId));
        await db.delete(cfScenarios).where(eq(cfScenarios.id, scenarioId));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('deleteScenario:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete scenario' };
    }
}

// ─── Sections ────────────────────────────────────────────────────────────────
export async function addSection(scenarioId: string, input: { kind: SectionKind; name: string }) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        const existing = await db.select({ sortOrder: cfSections.sortOrder }).from(cfSections).where(eq(cfSections.scenarioId, scenarioId));
        const id = randomUUID();
        await db.insert(cfSections).values({ id, scenarioId, kind: input.kind, name: input.name, sortOrder: existing.length });
        revalidatePath(PATH);
        return { success: true as const, data: { id } };
    } catch (error) {
        console.error('addSection:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to add section' };
    }
}

export async function renameSection(scenarioId: string, sectionId: string, name: string) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.update(cfSections).set({ name }).where(and(eq(cfSections.id, sectionId), eq(cfSections.scenarioId, scenarioId)));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('renameSection:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to rename section' };
    }
}

// ─── Line items ──────────────────────────────────────────────────────────────
export interface LineItemInput {
    sectionId: string;
    name: string;
    category: string;
    dueDay: number | null;
    recurrence: Recurrence;
    notes?: string | null;
    /** Optional: fill all 12 months with this amount on create. */
    fillAmount?: number;
}

export async function addLineItem(scenarioId: string, input: LineItemInput) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        const siblings = await db.select({ sortOrder: cfLineItems.sortOrder }).from(cfLineItems).where(eq(cfLineItems.sectionId, input.sectionId));
        const maxOrder = siblings.reduce((m, s) => Math.max(m, s.sortOrder), -1);
        const id = randomUUID();
        await db.insert(cfLineItems).values({
            id, scenarioId, sectionId: input.sectionId, name: input.name.trim(), category: input.category || 'Other',
            dueDay: input.dueDay ?? null, recurrence: input.recurrence || 'monthly', sortOrder: maxOrder + 1, notes: input.notes ?? null,
        });
        if (input.fillAmount) {
            await db.insert(cfCells).values(Array.from({ length: 12 }, (_, month) => ({
                id: randomUUID(), scenarioId, lineItemId: id, month, planned: String(input.fillAmount),
            })));
        }
        revalidatePath(PATH);
        return { success: true as const, data: { id } };
    } catch (error) {
        console.error('addLineItem:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to add line' };
    }
}

export async function updateLineItem(scenarioId: string, lineItemId: string, patch: Partial<Omit<LineItemInput, 'fillAmount'>> & { archived?: boolean }) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.update(cfLineItems).set({
            ...(patch.sectionId !== undefined ? { sectionId: patch.sectionId } : {}),
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.category !== undefined ? { category: patch.category } : {}),
            ...(patch.dueDay !== undefined ? { dueDay: patch.dueDay } : {}),
            ...(patch.recurrence !== undefined ? { recurrence: patch.recurrence } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            ...(patch.archived !== undefined ? { archived: patch.archived } : {}),
        }).where(and(eq(cfLineItems.id, lineItemId), eq(cfLineItems.scenarioId, scenarioId)));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('updateLineItem:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update line' };
    }
}

export async function deleteLineItem(scenarioId: string, lineItemId: string) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.delete(cfCells).where(and(eq(cfCells.lineItemId, lineItemId), eq(cfCells.scenarioId, scenarioId)));
        await db.update(cfCalculators).set({ lineItemId: null }).where(eq(cfCalculators.lineItemId, lineItemId));
        await db.delete(cfLineItems).where(and(eq(cfLineItems.id, lineItemId), eq(cfLineItems.scenarioId, scenarioId)));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('deleteLineItem:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete line' };
    }
}

/** Persist a new order for the lines of one section. */
export async function reorderLineItems(scenarioId: string, orderedIds: string[]) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        for (let i = 0; i < orderedIds.length; i++) {
            await db.update(cfLineItems).set({ sortOrder: i }).where(and(eq(cfLineItems.id, orderedIds[i]), eq(cfLineItems.scenarioId, scenarioId)));
        }
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('reorderLineItems:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to reorder' };
    }
}

// ─── Cells ───────────────────────────────────────────────────────────────────
export interface CellPlannedInput { lineItemId: string; month: number; planned: number }

/** Upsert planned values for many cells at once (single edit, fill right, calculator apply). */
export async function setCellsPlanned(scenarioId: string, items: CellPlannedInput[]) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        if (items.length === 0) return { success: true as const };
        const lineIds = [...new Set(items.map(i => i.lineItemId))];
        const owned = await db.select({ id: cfLineItems.id }).from(cfLineItems).where(and(eq(cfLineItems.scenarioId, scenarioId), inArray(cfLineItems.id, lineIds)));
        const ownedSet = new Set(owned.map(o => o.id));
        for (const it of items) {
            if (!ownedSet.has(it.lineItemId) || it.month < 0 || it.month > 11) continue;
            const planned = String(Number.isFinite(it.planned) ? it.planned : 0);
            await db.insert(cfCells)
                .values({ id: randomUUID(), scenarioId, lineItemId: it.lineItemId, month: it.month, planned })
                .onConflictDoUpdate({ target: [cfCells.lineItemId, cfCells.month], set: { planned } });
        }
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('setCellsPlanned:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to save cells' };
    }
}

export async function setCellPaid(scenarioId: string, lineItemId: string, month: number, paid: boolean) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.insert(cfCells)
            .values({ id: randomUUID(), scenarioId, lineItemId, month, planned: '0', paid })
            .onConflictDoUpdate({ target: [cfCells.lineItemId, cfCells.month], set: { paid } });
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('setCellPaid:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update' };
    }
}

export async function setCellNote(scenarioId: string, lineItemId: string, month: number, note: string | null) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.insert(cfCells)
            .values({ id: randomUUID(), scenarioId, lineItemId, month, planned: '0', note })
            .onConflictDoUpdate({ target: [cfCells.lineItemId, cfCells.month], set: { note } });
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('setCellNote:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update' };
    }
}

// ─── Calculators ─────────────────────────────────────────────────────────────
export async function saveCalculator(scenarioId: string, input: { id?: string; lineItemId: string | null; type: CalculatorType; name: string; params: Record<string, unknown> }) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        const id = input.id ?? randomUUID();
        if (input.id) {
            await db.update(cfCalculators).set({ lineItemId: input.lineItemId, name: input.name, params: input.params, updatedAt: new Date() })
                .where(and(eq(cfCalculators.id, id), eq(cfCalculators.scenarioId, scenarioId)));
        } else {
            await db.insert(cfCalculators).values({ id, scenarioId, lineItemId: input.lineItemId, type: input.type, name: input.name, params: input.params });
        }
        if (input.lineItemId) {
            await db.update(cfLineItems).set({ recurrence: 'calculated' }).where(and(eq(cfLineItems.id, input.lineItemId), eq(cfLineItems.scenarioId, scenarioId)));
        }
        revalidatePath(PATH);
        return { success: true as const, data: { id } };
    } catch (error) {
        console.error('saveCalculator:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to save calculator' };
    }
}

export async function deleteCalculator(scenarioId: string, calculatorId: string) {
    try {
        const userId = await requireAuth();
        await ownScenario(scenarioId, userId);
        await db.delete(cfCalculators).where(and(eq(cfCalculators.id, calculatorId), eq(cfCalculators.scenarioId, scenarioId)));
        revalidatePath(PATH);
        return { success: true as const };
    } catch (error) {
        console.error('deleteCalculator:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete calculator' };
    }
}
