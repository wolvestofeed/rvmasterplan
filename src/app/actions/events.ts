"use server";

import { db } from "@/lib/db";
import { eventsAndLogs } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-helpers";

export async function addManualEvent(data: {
    title: string;
    eventType: string;
    scheduledDate: Date;
    notes?: string;
}) {
    try {
        const activeId = await requireAuth();

        const newEvent = await db.insert(eventsAndLogs).values({
            id: Math.random().toString(36).substring(2, 10),
            userId: activeId,
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
