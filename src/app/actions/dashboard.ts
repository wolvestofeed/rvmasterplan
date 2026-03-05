"use server";

import { db } from "@/lib/db";
import { documents, eventsAndLogs, equipmentItems, userProfiles, users } from "@/lib/db/schema";
import { eq, isNotNull, gte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export type DashboardEvent = {
    id: string;
    title: string;
    desc: string;
    rawDate: Date;
    date: string; // Formatted date string
    color: string;
    source: "document" | "event" | "equipment" | "subscription";
};

export async function getDashboardEvents(): Promise<{ success: boolean; data?: DashboardEvent[]; error?: string }> {
    try {
        const { userId } = await auth();
        const activeId = userId || "demo_user";

        const aggregatedEvents: DashboardEvent[] = [];

        // 1. Fetch upcoming Document Renewals
        const docs = await db.query.documents.findMany({
            where: eq(documents.userId, activeId),
        });

        docs.forEach(doc => {
            if (doc.renewalDate) {
                const dateObj = new Date(doc.renewalDate);
                // Only show if it's in the future (or very recent past)
                aggregatedEvents.push({
                    id: doc.id,
                    title: `${doc.title} Renewal`,
                    desc: doc.renewalCost && Number(doc.renewalCost) > 0 ? `Estimated Cost: $${Number(doc.renewalCost).toFixed(2)}` : "Document renewal due.",
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: "text-blue-500", // Blue for admin/paperwork
                    source: "document"
                });
            }
        });

        // 2. Fetch Manually Scheduled Events (Maintenance, Reminders)
        const events = await db.query.eventsAndLogs.findMany({
            where: eq(eventsAndLogs.userId, activeId)
        });

        events.forEach(evt => {
            if (evt.scheduledDate && evt.status === "Upcoming") {
                const dateObj = new Date(evt.scheduledDate);
                aggregatedEvents.push({
                    id: evt.id,
                    title: evt.title,
                    desc: evt.notes || `${evt.eventType} Scheduled`,
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: evt.eventType === 'Maintenance' ? "text-amber-500" : "text-purple-500",
                    source: "event"
                });
            }
        });

        // 3. Fetch Equipment Purchase Deadlines
        const items = await db.query.equipmentItems.findMany({
            where: eq(equipmentItems.userId, activeId)
        });

        items.forEach(item => {
            if (item.purchaseDeadline && !item.isAcquired) {
                const dateObj = new Date(item.purchaseDeadline);
                aggregatedEvents.push({
                    id: item.id,
                    title: `Purchase Deadline: ${item.name}`,
                    desc: `Planned Acquisition. Est Cost: $${item.cost || '0'}`,
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: "text-emerald-500", // Green for purchases/inventory
                    source: "equipment"
                });
            }
        });

        // 4. Fetch User Subscription Renewal
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, activeId)
        });

        if (profile?.subscriptionRenewalDate) {
            const dateObj = new Date(profile.subscriptionRenewalDate);
            aggregatedEvents.push({
                id: profile.id,
                title: "RV MasterPlan Subscription",
                desc: `Premium Membership Renewal`,
                rawDate: dateObj,
                date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                color: "text-slate-800", // Distinct color for core app subscription
                source: "subscription"
            });
        }

        // Sort chronologically and return
        aggregatedEvents.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

        return { success: true, data: aggregatedEvents };

    } catch (error) {
        console.error("Error fetching dashboard events:", error);
        return { success: false, error: "Failed to load events" };
    }
}
