"use server";

import { db } from "@/lib/db";
import { waterSystems, waterActivities, tankLogs, rvVehicles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveUserId, requireAuth, getRvId } from "@/lib/actions/auth-helpers";

export async function getWaterSystem() {
    try {
        const { rvId } = await getRvId();
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
        const userId = await requireAuth();

        const rvs = await db.select().from(rvVehicles).where(eq(rvVehicles.userId, userId)).limit(1);
        if (!rvs.length) return { success: false, error: "No RV profile found" };
        const rvId = rvs[0].id;

        const existing = await db.select().from(waterSystems).where(eq(waterSystems.rvId, rvId)).limit(1);

        if (existing.length) {
            await db.update(waterSystems).set({
                freshCapacityGal: data.freshCapacityGal.toString(),
                grayCapacityGal: data.grayCapacityGal.toString(),
                blackCapacityGal: data.blackCapacityGal.toString(),
                updatedAt: new Date(),
            }).where(eq(waterSystems.rvId, rvId));
        } else {
            await db.insert(waterSystems).values({
                id: Date.now().toString(),
                rvId: rvId,
                freshCapacityGal: data.freshCapacityGal.toString(),
                grayCapacityGal: data.grayCapacityGal.toString(),
                blackCapacityGal: data.blackCapacityGal.toString(),
            });
        }

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
        const results = await db.select().from(waterActivities).where(eq(waterActivities.userId, activeId));
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
            id: Date.now().toString(),
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
        const results = await db.select().from(tankLogs).where(eq(tankLogs.userId, activeId));
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
            id: Date.now().toString(),
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
