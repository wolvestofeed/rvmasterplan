"use server";

import { db } from "@/lib/db";
import { documents, eventsAndLogs, equipmentItems, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveUserId } from "@/lib/actions/auth-helpers";
import { getCachedDemoDashboardEvents } from "@/lib/actions/demo-cache";

export type DashboardEvent = {
    id: string;
    title: string;
    desc: string;
    rawDate: Date;
    date: string;
    color: string;
    source: "document" | "event" | "equipment" | "subscription";
};

export async function getDashboardEvents(): Promise<{ success: boolean; data?: DashboardEvent[]; error?: string }> {
    try {
        const activeId = await getActiveUserId();
        if (activeId === "demo_user" || activeId.startsWith("guest_")) return getCachedDemoDashboardEvents();

        const aggregatedEvents: DashboardEvent[] = [];

        // Fire all 4 queries in parallel instead of sequentially
        const [docs, events, items, profile] = await Promise.all([
            db.query.documents.findMany({
                where: eq(documents.userId, activeId),
            }),
            db.query.eventsAndLogs.findMany({
                where: eq(eventsAndLogs.userId, activeId),
            }),
            db.query.equipmentItems.findMany({
                where: eq(equipmentItems.userId, activeId),
            }),
            db.query.userProfiles.findFirst({
                where: eq(userProfiles.userId, activeId),
            }),
        ]);

        // 1. Document Renewals
        docs.forEach(doc => {
            if (doc.renewalDate) {
                const dateObj = new Date(doc.renewalDate);
                aggregatedEvents.push({
                    id: doc.id,
                    title: `${doc.title} Renewal`,
                    desc: doc.renewalCost && Number(doc.renewalCost) > 0 ? `Estimated Cost: $${Number(doc.renewalCost).toFixed(2)}` : "Document renewal due.",
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: "text-blue-500",
                    source: "document"
                });
            }
        });

        // 2. Manually Scheduled Events (Maintenance, Reminders)
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

        // 3. Equipment Purchase Deadlines
        items.forEach(item => {
            if (item.purchaseDeadline && !item.isAcquired) {
                const dateObj = new Date(item.purchaseDeadline);
                aggregatedEvents.push({
                    id: item.id,
                    title: `Purchase Deadline: ${item.name}`,
                    desc: `Planned Acquisition. Est Cost: $${item.cost || '0'}`,
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: "text-emerald-500",
                    source: "equipment"
                });
            }
        });

        // 4. Subscription Renewal
        if (profile?.subscriptionRenewalDate) {
            const dateObj = new Date(profile.subscriptionRenewalDate);
            aggregatedEvents.push({
                id: profile.id,
                title: "RV MasterPlan Subscription",
                desc: `Premium Membership Renewal`,
                rawDate: dateObj,
                date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                color: "text-slate-800",
                source: "subscription"
            });
        }

        aggregatedEvents.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

        return { success: true, data: aggregatedEvents };

    } catch (error) {
        console.error("Error fetching dashboard events:", error);
        return { success: false, error: "Failed to load events" };
    }
}
