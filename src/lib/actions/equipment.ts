'use server';

import { db } from '../db';
import { equipmentItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { getActiveUserId, requireAuth } from './auth-helpers';

export async function getEquipment() {
    const activeId = await getActiveUserId();
    return await db.select().from(equipmentItems).where(eq(equipmentItems.userId, activeId));
}

export async function addEquipment(data: {
    name: string, category?: string, cost?: number,
    isEssential?: boolean, isPurchased?: boolean,
    watts?: number, hoursPerDay?: number, runsOnInverter?: boolean
}) {
    const activeId = await requireAuth();

    const id = randomUUID();
    await db.insert(equipmentItems).values({
        id,
        userId: activeId,
        name: data.name,
        category: data.category,
        cost: data.cost ? String(data.cost) : null,
        weight: '0',
        notes: data.watts ? `${data.watts}W, ${data.hoursPerDay || 0}h/day` : null,
    });

    revalidatePath('/calculators/setup');
    revalidatePath('/calculators/power/system');
    return id;
}

export async function deleteEquipment(id: string) {
    await requireAuth();
    await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
    revalidatePath('/calculators/setup');
    revalidatePath('/calculators/power/system');
}
