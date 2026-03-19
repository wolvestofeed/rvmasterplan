"use server";

import { db } from "@/lib/db";
import { equipmentItems } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getActiveUserId, requireAuth } from "@/lib/actions/auth-helpers";

export async function getEquipmentItems() {
    try {
        const activeId = await getActiveUserId();

        const items = await db.query.equipmentItems.findMany({
            where: eq(equipmentItems.userId, activeId),
            orderBy: [desc(equipmentItems.createdAt)],
            limit: 500,
        });

        return { success: true, data: items };
    } catch (error) {
        console.error("Error fetching equipment items:", error);
        return { success: false, error: "Failed to fetch equipment items" };
    }
}

export async function addEquipmentItem(data: {
    name: string;
    category: string;
    priority: string;
    cost: string;
    weight?: string;
    isAcquired: boolean;
    purchaseDeadline?: Date | null;
    notes?: string;
}) {
    try {
        const activeId = await requireAuth();

        const newItem = await db.insert(equipmentItems).values({
            id: randomUUID(),
            userId: activeId,
            name: data.name,
            category: data.category,
            priority: data.priority,
            cost: data.cost,
            weight: data.weight || "0",
            isAcquired: data.isAcquired,
            purchaseDeadline: data.purchaseDeadline || null,
            notes: data.notes
        }).returning();

        revalidatePath("/calculators/setup");
        return { success: true, data: newItem[0] };
    } catch (error) {
        console.error("Error adding equipment item:", error);
        return { success: false, error: "Failed to add equipment item" };
    }
}

export async function updateEquipmentItem(id: string, data: {
    name: string;
    category: string;
    priority: string;
    cost: string;
    weight?: string;
    isAcquired: boolean;
    purchaseDeadline?: Date | null;
    notes?: string;
}) {
    try {
        await requireAuth();

        const updatedItem = await db.update(equipmentItems)
            .set({
                name: data.name,
                category: data.category,
                priority: data.priority,
                cost: data.cost,
                weight: data.weight || "0",
                isAcquired: data.isAcquired,
                purchaseDeadline: data.purchaseDeadline || null,
                notes: data.notes
            })
            .where(eq(equipmentItems.id, id))
            .returning();

        revalidatePath("/calculators/setup");
        return { success: true, data: updatedItem[0] };
    } catch (error) {
        console.error("Error updating equipment item:", error);
        return { success: false, error: "Failed to update equipment item" };
    }
}

export async function deleteEquipmentItem(id: string) {
    try {
        await requireAuth();

        await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
        revalidatePath("/calculators/setup");
        return { success: true };
    } catch (error) {
        console.error("Error deleting equipment item:", error);
        return { success: false, error: "Failed to delete equipment item" };
    }
}
