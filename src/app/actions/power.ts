"use server";

import { db } from "@/lib/db";
import { electricalDevices, solarEquipment, dailySolarLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getRvId } from "@/lib/actions/auth-helpers";

// --- Electrical Devices ---
export async function getElectricalDevices() {
    try {
        const { rvId } = await getRvId();
        if (!rvId) return { success: false, data: [] };
        const data = await db.query.electricalDevices.findMany({ where: eq(electricalDevices.rvId, rvId) });
        return { success: true, data };
    } catch (e) { return { success: false, error: "Failed to fetch" }; }
}

export async function addElectricalDevice(values: any) {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };
        if (!rvId) return { error: "RV Profile not found" };

        await db.insert(electricalDevices).values({
            id: Date.now().toString(),
            rvId,
            name: values.name,
            groupType: values.group,
            category: values.category,
            watts: values.watts?.toString(),
            hoursPerDay: values.hoursPerDay?.toString()
        });
        revalidatePath('/calculators/power/system');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function updateElectricalDevice(id: string, values: any) {
    try {
        const { isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };

        await db.update(electricalDevices).set({
            name: values.name,
            groupType: values.group,
            category: values.category,
            watts: values.watts?.toString(),
            hoursPerDay: values.hoursPerDay?.toString()
        }).where(eq(electricalDevices.id, id));
        revalidatePath('/calculators/power/system');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function deleteElectricalDevice(id: string) {
    try {
        const { isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };
        await db.delete(electricalDevices).where(eq(electricalDevices.id, id));
        revalidatePath('/calculators/power/system');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

// --- Solar Equipment ---
export async function getSolarEquipment() {
    try {
        const { rvId } = await getRvId();
        if (!rvId) return { success: false, data: [] };
        const data = await db.query.solarEquipment.findMany({ where: eq(solarEquipment.rvId, rvId) });
        return { success: true, data };
    } catch (e) { return { success: false, error: "Failed to fetch" }; }
}

export async function addSolarEquipment(values: any) {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };
        if (!rvId) return { error: "RV Profile not found" };

        await db.insert(solarEquipment).values({
            id: Date.now().toString(),
            rvId,
            make: values.make,
            model: values.model,
            equipmentType: values.equipmentType,
            specs: values.specs,
            quantity: values.quantity || 1,
            price: values.price?.toString(),
            wattage: values.wattage?.toString(),
            weight: values.weight?.toString()
        });
        revalidatePath('/calculators/power/system');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function updateSolarEquipment(id: string, values: any) {
    try {
        const { isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };

        await db.update(solarEquipment).set({
            make: values.make,
            model: values.model,
            equipmentType: values.equipmentType,
            specs: values.specs,
            quantity: values.quantity || 1,
            price: values.price?.toString(),
            wattage: values.wattage?.toString(),
            weight: values.weight?.toString()
        }).where(eq(solarEquipment.id, id));
        revalidatePath('/calculators/power/system');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function deleteSolarEquipment(id: string) {
    try {
        const { isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };
        await db.delete(solarEquipment).where(eq(solarEquipment.id, id));
        revalidatePath('/calculators/power/system');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

// --- Daily Solar Logs ---
export async function getDailySolarLogs() {
    try {
        const { rvId } = await getRvId();
        if (!rvId) return { success: false, data: [] };
        const data = await db.query.dailySolarLogs.findMany({ where: eq(dailySolarLogs.rvId, rvId) });
        return { success: true, data };
    } catch (e) { return { success: false, error: "Failed to fetch" }; }
}

export async function addDailySolarLog(values: any) {
    try {
        const { rvId, isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };
        if (!rvId) return { error: "RV Profile not found" };

        await db.insert(dailySolarLogs).values({
            id: Date.now().toString(),
            rvId,
            date: values.date,
            weatherCondition: values.weatherCondition,
            sunHours: values.sunHours?.toString(),
            generatedWh: values.generatedWh?.toString()
        });
        revalidatePath('/calculators/power/system');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function updateDailySolarLog(id: string, values: any) {
    try {
        const { isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };

        await db.update(dailySolarLogs).set({
            date: values.date,
            weatherCondition: values.weatherCondition,
            sunHours: values.sunHours?.toString(),
            generatedWh: values.generatedWh?.toString()
        }).where(eq(dailySolarLogs.id, id));
        revalidatePath('/calculators/power/system');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function deleteDailySolarLog(id: string) {
    try {
        const { isDemo } = await getRvId();
        if (isDemo) return { error: "Guest Mode is Read-Only!" };
        await db.delete(dailySolarLogs).where(eq(dailySolarLogs.id, id));
        revalidatePath('/calculators/power/system');
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}
