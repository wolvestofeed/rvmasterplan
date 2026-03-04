"use server";

import { db } from "@/lib/db";
import { eventsAndLogs, users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const FALLBACK_USER_ID = "guest_user";

export async function addManualEvent(data: {
    title: string;
    eventType: string; // 'Routine Maintenance', 'Repair', 'Reminder', etc.
    scheduledDate: Date;
    notes?: string;
}) {
    try {
        await ensureGuestUser();

        const newEvent = await db.insert(eventsAndLogs).values({
            id: Math.random().toString(36).substring(2, 10),
            userId: FALLBACK_USER_ID,
            title: data.title,
            eventType: data.eventType,
            scheduledDate: data.scheduledDate,
            status: "Upcoming",
            notes: data.notes
        }).returning();

        revalidatePath("/dashboard");
        return { success: true, data: newEvent[0] };
    } catch (error) {
        console.error("Error adding event:", error);
        return { success: false, error: "Failed to add event" };
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
