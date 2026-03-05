"use server";

import { db } from "@/lib/db";
import { eventsAndLogs, users } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function addManualEvent(data: {
    title: string;
    eventType: string; // 'Routine Maintenance', 'Repair', 'Reminder', etc.
    scheduledDate: Date;
    notes?: string;
}) {
    try {
        const { userId } = await auth();
        const activeId = userId || "demo_user";
        if (!userId || activeId === "demo_user") {
            return { success: false, error: "Saving is disabled in Demo Mode." };
        }

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

