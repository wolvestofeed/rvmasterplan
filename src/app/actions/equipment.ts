"use server";

import { db } from "@/lib/db";
import { equipmentItems, users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";

const FALLBACK_USER_ID = "guest_user";

export async function getEquipmentItems() {
    try {
        await ensureGuestUser();

        const items = await db.query.equipmentItems.findMany({
            where: eq(equipmentItems.userId, FALLBACK_USER_ID),
            orderBy: [desc(equipmentItems.createdAt)]
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
        await ensureGuestUser();

        const newItem = await db.insert(equipmentItems).values({
            id: Math.random().toString(36).substring(2, 10),
            userId: FALLBACK_USER_ID,
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
        await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
        revalidatePath("/calculators/setup");
        return { success: true };
    } catch (error) {
        console.error("Error deleting equipment item:", error);
        return { success: false, error: "Failed to delete equipment item" };
    }
}


// --- Utility for Demo Mode ---
async function ensureGuestUser() {
    const existing = await db.query.users.findFirst({
        where: eq(users.id, FALLBACK_USER_ID)
    });

    if (!existing) {
        await db.insert(users).values({
            id: FALLBACK_USER_ID,
            email: "guest@rvmasterplan.com"
        });
    }
}
