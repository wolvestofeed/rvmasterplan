'use server';

import { db } from '../db';
import { waterActivities, tankLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveUserId, requireAuth } from './auth-helpers';

export async function getWaterActivities() {
    const activeId = await getActiveUserId();
    return await db.select().from(waterActivities).where(eq(waterActivities.userId, activeId));
}

export async function addWaterActivity(data: { name: string, category: string, gallonsPerUse: number, timesPerDay: number }) {
    const activeId = await requireAuth();

    const id = Date.now().toString();
    await db.insert(waterActivities).values({
        id,
        userId: activeId,
        ...data,
        gallonsPerUse: String(data.gallonsPerUse),
        timesPerDay: String(data.timesPerDay)
    });

    revalidatePath('/calculators/water');
    return id;
}

export async function deleteWaterActivity(id: string) {
    await requireAuth();
    await db.delete(waterActivities).where(eq(waterActivities.id, id));
    revalidatePath('/calculators/water');
}

export async function getTankLogs() {
    const activeId = await getActiveUserId();
    return await db.select().from(tankLogs)
        .where(eq(tankLogs.userId, activeId))
        .orderBy(desc(tankLogs.date));
}

export async function addTankLog(data: { date: string, type: string, tank: string, volume: number }) {
    const activeId = await requireAuth();

    const id = Date.now().toString();
    await db.insert(tankLogs).values({
        id,
        userId: activeId,
        ...data,
        volume: String(data.volume)
    });

    revalidatePath('/calculators/water');
    return id;
}
