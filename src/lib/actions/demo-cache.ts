/**
 * Centralized cache for demo user data.
 * All functions use unstable_cache with tag "demo-data" so a single
 * revalidateTag("demo-data") in publishToDemo() busts everything at once.
 */

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
    userProfiles, rvVehicles, solarEquipment, electricalDevices,
    waterSystems, waterActivities, tankLogs, financialData,
    documents, eventsAndLogs, equipmentItems, expenses, targetBudgets,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const DEMO_ID = "demo_user";
const CACHE_OPTS = { tags: ["demo-data"], revalidate: false } as const;

// ─── RV ID helper (internal, used by RV-scoped caches) ──────────────────────
async function getDemoRvId() {
    const rv = await db.query.rvVehicles.findFirst({ where: eq(rvVehicles.userId, DEMO_ID) });
    return rv?.id;
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getCachedDemoProfile = unstable_cache(
    async () => {
        const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, DEMO_ID) });
        if (!profile) return { success: false as const, error: "Demo profile not found" };
        return { success: true as const, data: profile };
    },
    ["demo-profile"],
    CACHE_OPTS
);

// ─── RV Vehicle ───────────────────────────────────────────────────────────────
export const getCachedDemoRVVehicle = unstable_cache(
    async () => {
        const data = await db.query.rvVehicles.findFirst({ where: eq(rvVehicles.userId, DEMO_ID) });
        return { success: true as const, data: data ?? null };
    },
    ["demo-rv-vehicle"],
    CACHE_OPTS
);

// ─── Solar Equipment ─────────────────────────────────────────────────────────
export const getCachedDemoSolarEquipment = unstable_cache(
    async () => {
        const rvId = await getDemoRvId();
        if (!rvId) return { success: true as const, data: [] };
        const data = await db.query.solarEquipment.findMany({ where: eq(solarEquipment.rvId, rvId) });
        return { success: true as const, data };
    },
    ["demo-solar-equipment"],
    CACHE_OPTS
);

// ─── Electrical Devices ───────────────────────────────────────────────────────
export const getCachedDemoElectricalDevices = unstable_cache(
    async () => {
        const rvId = await getDemoRvId();
        if (!rvId) return { success: true as const, data: [] };
        const data = await db.query.electricalDevices.findMany({ where: eq(electricalDevices.rvId, rvId) });
        return { success: true as const, data };
    },
    ["demo-electrical-devices"],
    CACHE_OPTS
);

// ─── Water System ─────────────────────────────────────────────────────────────
export const getCachedDemoWaterSystem = unstable_cache(
    async () => {
        const rvId = await getDemoRvId();
        if (!rvId) return { success: true as const, data: null };
        const data = await db.query.waterSystems.findFirst({ where: eq(waterSystems.rvId, rvId) });
        return { success: true as const, data: data ?? null };
    },
    ["demo-water-system"],
    CACHE_OPTS
);

// ─── Water Activities ─────────────────────────────────────────────────────────
export const getCachedDemoWaterActivities = unstable_cache(
    async () => {
        const data = await db.query.waterActivities.findMany({ where: eq(waterActivities.userId, DEMO_ID) });
        return { success: true as const, data };
    },
    ["demo-water-activities"],
    CACHE_OPTS
);

// ─── Tank Logs ────────────────────────────────────────────────────────────────
export const getCachedDemoTankLogs = unstable_cache(
    async () => {
        const data = await db.query.tankLogs.findMany({ where: eq(tankLogs.userId, DEMO_ID) });
        return { success: true as const, data };
    },
    ["demo-tank-logs"],
    CACHE_OPTS
);

// ─── Financial Data ───────────────────────────────────────────────────────────
export const getCachedDemoFinancialData = unstable_cache(
    async () => {
        const rvId = await getDemoRvId();
        if (!rvId) return { success: true as const, data: null };
        const data = await db.query.financialData.findFirst({ where: eq(financialData.rvId, rvId) });
        return { success: true as const, data: data ?? null };
    },
    ["demo-financial-data"],
    CACHE_OPTS
);

// ─── Dashboard Events ─────────────────────────────────────────────────────────
export const getCachedDemoDashboardEvents = unstable_cache(
    async () => {
        const [docs, events, items, profile] = await Promise.all([
            db.query.documents.findMany({ where: eq(documents.userId, DEMO_ID) }),
            db.query.eventsAndLogs.findMany({ where: eq(eventsAndLogs.userId, DEMO_ID) }),
            db.query.equipmentItems.findMany({ where: eq(equipmentItems.userId, DEMO_ID) }),
            db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, DEMO_ID) }),
        ]);

        const aggregatedEvents: {
            id: string; title: string; desc: string;
            rawDate: Date; date: string; color: string;
            source: "document" | "event" | "equipment" | "subscription";
        }[] = [];

        docs.forEach(doc => {
            if (doc.renewalDate) {
                const dateObj = new Date(doc.renewalDate);
                aggregatedEvents.push({
                    id: doc.id,
                    title: `${doc.title} Renewal`,
                    desc: doc.renewalCost && Number(doc.renewalCost) > 0
                        ? `Estimated Cost: $${Number(doc.renewalCost).toFixed(2)}`
                        : "Document renewal due.",
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: "text-blue-500",
                    source: "document",
                });
            }
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
                    color: evt.eventType === "Maintenance" ? "text-amber-500" : "text-purple-500",
                    source: "event",
                });
            }
        });

        items.forEach(item => {
            if (item.purchaseDeadline && !item.isAcquired) {
                const dateObj = new Date(item.purchaseDeadline);
                aggregatedEvents.push({
                    id: item.id,
                    title: `Purchase Deadline: ${item.name}`,
                    desc: `Planned Acquisition. Est Cost: $${item.cost || "0"}`,
                    rawDate: dateObj,
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                    color: "text-emerald-500",
                    source: "equipment",
                });
            }
        });

        if (profile?.subscriptionRenewalDate) {
            const dateObj = new Date(profile.subscriptionRenewalDate);
            aggregatedEvents.push({
                id: profile.id,
                title: "RV MasterPlan Subscription",
                desc: "Premium Membership Renewal",
                rawDate: dateObj,
                date: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                color: "text-slate-800",
                source: "subscription",
            });
        }

        aggregatedEvents.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        return { success: true as const, data: aggregatedEvents };
    },
    ["demo-dashboard-events"],
    CACHE_OPTS
);

// ─── Expenses (parameterized by year) ────────────────────────────────────────
export const getCachedDemoExpenses = unstable_cache(
    async (year: number) => {
        const data = await db.select().from(expenses)
            .where(and(eq(expenses.userId, DEMO_ID), eq(expenses.year, year)));
        return data;
    },
    ["demo-expenses"],
    CACHE_OPTS
);

// ─── Target Budgets (parameterized by year) ───────────────────────────────────
export const getCachedDemoTargetBudgets = unstable_cache(
    async (year: number) => {
        const data = await db.select().from(targetBudgets)
            .where(and(eq(targetBudgets.userId, DEMO_ID), eq(targetBudgets.year, year)));
        return data;
    },
    ["demo-target-budgets"],
    CACHE_OPTS
);
