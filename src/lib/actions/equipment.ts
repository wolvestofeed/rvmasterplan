'use server';

import { db } from '../db';
import { equipment } from '../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getEquipment() {
    const { userId } = await auth();
    if (!userId) return [];

    return await db.select().from(equipment).where(eq(equipment.userId, userId));
}

export async function addEquipment(data: {
    name: string, category?: string, cost?: number,
    isEssential?: boolean, isPurchased?: boolean,
    watts?: number, hoursPerDay?: number, runsOnInverter?: boolean
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = Date.now().toString();
    await db.insert(equipment).values({
        id,
        userId,
        ...data,
        cost: data.cost ? String(data.cost) : null,
        watts: data.watts ? String(data.watts) : null,
        hoursPerDay: data.hoursPerDay ? String(data.hoursPerDay) : null,
    });

    // Both setup and power pages rely on this table
    revalidatePath('/calculators/setup');
    revalidatePath('/calculators/power/system');
    return id;
}

export async function deleteEquipment(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(equipment).where(eq(equipment.id, id));
    revalidatePath('/calculators/setup');
    revalidatePath('/calculators/power/system');
}
