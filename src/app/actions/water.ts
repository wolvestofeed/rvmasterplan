"use server";

import { db } from "@/lib/db";
import { waterSystems, waterActivities, tankLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveUserId, requireAuth, getRvId } from "@/lib/actions/auth-helpers";
import { getCachedDemoWaterSystem, getCachedDemoWaterActivities, getCachedDemoTankLogs } from "@/lib/actions/demo-cache";

export async function getWaterSystem() {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return getCachedDemoWaterSystem();
        if (!rvId) return { success: false, error: "No RV profile found" };

        const system = await db.select().from(waterSystems).where(eq(waterSystems.rvId, rvId)).limit(1);

        if (!system.length) {
            return {
                success: true, data: {
                    freshWaterCapacity: 40,
                    grayWaterCapacity: 30,
                    blackWaterCapacity: 30
                }
            };
        }

        return {
            success: true, data: {
                freshWaterCapacity: Number(system[0].freshCapacityGal) || 40,
                grayWaterCapacity: Number(system[0].grayCapacityGal) || 30,
                blackWaterCapacity: Number(system[0].blackCapacityGal) || 30
            }
        };
    } catch (error) {
        console.error("Error fetching water system:", error);
        return { success: false, error: "Failed to fetch water system" };
    }
}

export async function updateWaterSystem(data: { freshCapacityGal: number, grayCapacityGal: number, blackCapacityGal: number }) {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return { success: false, error: "Guest Mode is Read-Only!" };
        if (!rvId) return { success: false, error: "No RV profile found" };

        await db.insert(waterSystems)
            .values({
                id: randomUUID(),
                rvId,
                freshCapacityGal: data.freshCapacityGal.toString(),
                grayCapacityGal: data.grayCapacityGal.toString(),
                blackCapacityGal: data.blackCapacityGal.toString(),
            })
            .onConflictDoUpdate({
                target: waterSystems.rvId,
                set: {
                    freshCapacityGal: data.freshCapacityGal.toString(),
                    grayCapacityGal: data.grayCapacityGal.toString(),
                    blackCapacityGal: data.blackCapacityGal.toString(),
                    updatedAt: new Date(),
                },
            });

        revalidatePath("/calculators/water");
        return { success: true };
    } catch (error) {
        console.error("Error saving water system:", error);
        return { success: false, error: "Failed to save water system" };
    }
}

export async function getWaterActivities() {
    try {
        const activeId = await getActiveUserId();
        if (activeId === "demo_user" || activeId.startsWith("guest_")) return getCachedDemoWaterActivities();
        const results = await db.select().from(waterActivities).where(eq(waterActivities.userId, activeId)).limit(500);
        return { success: true, data: results };
    } catch (error) {
        console.error("Error fetching water activities:", error);
        return { success: false, error: "Failed to fetch water activities" };
    }
}

export async function addWaterActivity(data: { name: string; category: string; gallonsPerUse: number; timesPerDay: number }) {
    try {
        const userId = await requireAuth();

        await db.insert(waterActivities).values({
            id: randomUUID(),
            userId: userId,
            name: data.name,
            category: data.category,
            gallonsPerUse: data.gallonsPerUse.toString(),
            timesPerDay: data.timesPerDay.toString()
        });

        revalidatePath("/calculators/water");
        return { success: true };
    } catch (error) {
        console.error("Error saving water activity:", error);
        return { success: false, error: "Failed to save water activity" };
    }
}

export async function updateWaterActivity(id: string, data: { name: string; category: string; gallonsPerUse: number; timesPerDay: number }) {
    try {
        const userId = await requireAuth();

        await db.update(waterActivities)
            .set({
                name: data.name,
                category: data.category,
                gallonsPerUse: data.gallonsPerUse.toString(),
                timesPerDay: data.timesPerDay.toString()
            })
            .where(and(eq(waterActivities.id, id), eq(waterActivities.userId, userId)));

        revalidatePath("/calculators/water");
        return { success: true };
    } catch (error) {
        console.error("Error updating water activity:", error);
        return { success: false, error: "Failed to update water activity" };
    }
}

export async function deleteWaterActivity(id: string) {
    try {
        const userId = await requireAuth();
        await db.delete(waterActivities).where(and(eq(waterActivities.id, id), eq(waterActivities.userId, userId)));
        revalidatePath("/calculators/water");
        return { success: true };
    } catch (error) {
        console.error("Error deleting water activity:", error);
        return { success: false, error: "Failed to delete water activity" };
    }
}

export async function getTankLogs() {
    try {
        const activeId = await getActiveUserId();
        if (activeId === "demo_user" || activeId.startsWith("guest_")) return getCachedDemoTankLogs();
        const results = await db.select().from(tankLogs).where(eq(tankLogs.userId, activeId)).limit(500);
        return { success: true, data: results };
    } catch (error) {
        console.error("Error fetching tank logs:", error);
        return { success: false, error: "Failed to fetch tank logs" };
    }
}

export async function addTankLog(data: { date: string, type: 'Dump' | 'Fill', tank: 'Fresh' | 'Gray' | 'Black', volume: number }) {
    try {
        const userId = await requireAuth();

        await db.insert(tankLogs).values({
            id: randomUUID(),
            userId: userId,
            date: data.date,
            type: data.type,
            tank: data.tank,
            volume: data.volume.toString()
        });

        revalidatePath("/calculators/water");
        return { success: true };
    } catch (error) {
        console.error("Error saving tank log:", error);
        return { success: false, error: "Failed to save tank log" };
    }
}
