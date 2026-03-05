'use server';

import { db } from '../db';
import { equipmentItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getEquipment() {
    const { userId } = await auth();
    const activeId = userId || "demo_user";

    return await db.select().from(equipmentItems).where(eq(equipmentItems.userId, activeId));
}

export async function addEquipment(data: {
    name: string, category?: string, cost?: number,
    isEssential?: boolean, isPurchased?: boolean,
    watts?: number, hoursPerDay?: number, runsOnInverter?: boolean
}) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    const id = Date.now().toString();
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
    const { userId } = await auth();
    if (!userId || userId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
    revalidatePath('/calculators/setup');
    revalidatePath('/calculators/power/system');
}
