'use server';

import { db } from '../db';
import { equipmentItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getEquipment() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select().from(equipmentItems).where(eq(equipmentItems.userId, userId));
}

export async function addEquipment(data: {
    name: string, category?: string, cost?: number,
    isEssential?: boolean, isPurchased?: boolean,
    watts?: number, hoursPerDay?: number, runsOnInverter?: boolean
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = Date.now().toString();
    await db.insert(equipmentItems).values({
        id,
        userId,
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
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
    revalidatePath('/calculators/setup');
    revalidatePath('/calculators/power/system');
}
