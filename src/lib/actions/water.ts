'use server';

import { db } from '../db';
import { waterActivities, tankLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getWaterActivities() {
    const { userId } = await auth();
    const activeId = userId || "demo_user";

    return await db.select().from(waterActivities).where(eq(waterActivities.userId, activeId));
}

export async function addWaterActivity(data: { name: string, category: string, gallonsPerUse: number, timesPerDay: number }) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    const id = Date.now().toString(); // simple ID generation
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
    const { userId } = await auth();
    if (!userId || userId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

    await db.delete(waterActivities).where(eq(waterActivities.id, id));
    revalidatePath('/calculators/water');
}

export async function getTankLogs() {
    const { userId } = await auth();
    const activeId = userId || "demo_user";

    return await db.select().from(tankLogs)
        .where(eq(tankLogs.userId, activeId))
        .orderBy(desc(tankLogs.date));
}

export async function addTankLog(data: { date: string, type: string, tank: string, volume: number }) {
    const { userId } = await auth();
    const activeId = userId || "demo_user";
    if (!userId || activeId === "demo_user") throw new Error("Saving is disabled in Demo Mode.");

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
