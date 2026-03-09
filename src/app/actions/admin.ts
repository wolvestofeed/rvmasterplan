"use server";

import { db } from "@/lib/db";
import {
    users, userProfiles, documents, equipmentItems, eventsAndLogs, rvVehicles,
    powerSystems, waterSystems, waterActivities, tankLogs, incomes, expenses,
    electricalDevices, solarEquipment, dailySolarLogs, financialData
} from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { systemSettings } from "@/lib/db/schema";

// --- Admin Stats ---
export async function getAdminStats() {
    try {
        const [userCount] = await db.select({ count: count() }).from(users);
        const [docCount] = await db.select({ count: count() }).from(documents);
        const [equipCount] = await db.select({ count: count() }).from(equipmentItems);
        const [eventCount] = await db.select({ count: count() }).from(eventsAndLogs);

        const activeProfiles = await db.query.userProfiles.findMany({
            where: eq(userProfiles.subscriptionStatus, 'active')
        });

        return {
            success: true,
            data: {
                totalUsers: userCount.count,
                activeSubscriptions: activeProfiles.length,
                totalDocuments: docCount.count,
                totalEquipment: equipCount.count,
                totalEvents: eventCount.count,
            }
        };
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return { success: false, error: "Failed to load stats" };
    }
}

// --- Get System Settings ---
export async function getSystemSettings() {
    try {
        let settings = await db.query.systemSettings.findFirst({
            where: eq(systemSettings.id, "global")
        });

        if (!settings) {
            const [newSettings] = await db.insert(systemSettings).values({
                id: "global"
            }).returning();
            settings = newSettings;
        }

        return { success: true, data: settings };
    } catch (error) {
        console.error("Error fetching system settings:", error);
        return { success: false, error: "Failed to load settings" };
    }
}

// --- Update System Settings ---
export async function updateSystemSettings(updates: Partial<typeof systemSettings.$inferInsert>) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== "admin") return { success: false, error: "Unauthorized" };

        await db.update(systemSettings)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(systemSettings.id, "global"));

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error updating system settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

// --- Get All Users with Profiles ---
export async function getAllUsers() {
    try {
        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            createdAt: users.createdAt,
            firstName: userProfiles.firstName,
            lastName: userProfiles.lastName,
            subscriptionStatus: userProfiles.subscriptionStatus,
            subscriptionRenewalDate: userProfiles.subscriptionRenewalDate,
        })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

        return { success: true, data: allUsers };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: "Failed to load users" };
    }
}

// --- Toggle User Subscription ---
export async function toggleUserSubscription(userId: string) {
    try {
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, userId)
        });

        if (!profile) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            await db.insert(userProfiles).values({
                id: Math.random().toString(36).substring(2, 10),
                userId,
                subscriptionStatus: 'active',
                subscriptionRenewalDate: defaultDate,
            });
        } else {
            const newStatus = profile.subscriptionStatus === 'active' ? 'inactive' : 'active';
            await db.update(userProfiles)
                .set({ subscriptionStatus: newStatus })
                .where(eq(userProfiles.userId, userId));
        }

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error toggling subscription:", error);
        return { success: false, error: "Failed to toggle subscription" };
    }
}

// --- Delete User ---
export async function deleteUser(userId: string) {
    try {
        await db.delete(documents).where(eq(documents.userId, userId));
        await db.delete(equipmentItems).where(eq(equipmentItems.userId, userId));
        await db.delete(eventsAndLogs).where(eq(eventsAndLogs.userId, userId));
        await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
        await db.delete(users).where(eq(users.id, userId));

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}

// --- Publish Data to Demo Mode ---
export async function publishToDemo() {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Verify they are an admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (user.publicMetadata?.role !== "admin") return { success: false, error: "Unauthorized" };

    const ADMIN_ID = userId;
    const DEMO_ID = "demo_user";

    try {
        // 1. Delete all existing demo data
        await db.delete(documents).where(eq(documents.userId, DEMO_ID));
        await db.delete(equipmentItems).where(eq(equipmentItems.userId, DEMO_ID));
        await db.delete(eventsAndLogs).where(eq(eventsAndLogs.userId, DEMO_ID));
        await db.delete(waterActivities).where(eq(waterActivities.userId, DEMO_ID));
        await db.delete(tankLogs).where(eq(tankLogs.userId, DEMO_ID));
        await db.delete(incomes).where(eq(incomes.userId, DEMO_ID));
        await db.delete(expenses).where(eq(expenses.userId, DEMO_ID));

        // For RV and its related systems:
        const existingDemoRV = await db.query.rvVehicles.findFirst({
            where: eq(rvVehicles.userId, DEMO_ID)
        });
        if (existingDemoRV) {
            const rvId = existingDemoRV.id;
            await db.delete(powerSystems).where(eq(powerSystems.rvId, rvId));
            await db.delete(waterSystems).where(eq(waterSystems.rvId, rvId));
            await db.delete(electricalDevices).where(eq(electricalDevices.rvId, rvId));
            await db.delete(solarEquipment).where(eq(solarEquipment.rvId, rvId));
            await db.delete(dailySolarLogs).where(eq(dailySolarLogs.rvId, rvId));
            await db.delete(financialData).where(eq(financialData.rvId, rvId));
            await db.delete(rvVehicles).where(eq(rvVehicles.userId, DEMO_ID));
        }

        // 2. Query all admin data
        const adminDocs = await db.query.documents.findMany({ where: eq(documents.userId, ADMIN_ID) });
        const adminEquip = await db.query.equipmentItems.findMany({ where: eq(equipmentItems.userId, ADMIN_ID) });
        const adminEvents = await db.query.eventsAndLogs.findMany({ where: eq(eventsAndLogs.userId, ADMIN_ID) });
        const adminWA = await db.query.waterActivities.findMany({ where: eq(waterActivities.userId, ADMIN_ID) });
        const adminTL = await db.query.tankLogs.findMany({ where: eq(tankLogs.userId, ADMIN_ID) });
        const adminInc = await db.query.incomes.findMany({ where: eq(incomes.userId, ADMIN_ID) });
        const adminExp = await db.query.expenses.findMany({ where: eq(expenses.userId, ADMIN_ID) });
        const adminRV = await db.query.rvVehicles.findFirst({ where: eq(rvVehicles.userId, ADMIN_ID) });

        let powerSys, waterSys, electricDevs, solarEquip, solarLogs, financials;
        if (adminRV) {
            const rvId = adminRV.id;
            powerSys = await db.query.powerSystems.findFirst({ where: eq(powerSystems.rvId, rvId) });
            waterSys = await db.query.waterSystems.findFirst({ where: eq(waterSystems.rvId, rvId) });
            electricDevs = await db.query.electricalDevices.findMany({ where: eq(electricalDevices.rvId, rvId) });
            solarEquip = await db.query.solarEquipment.findMany({ where: eq(solarEquipment.rvId, rvId) });
            solarLogs = await db.query.dailySolarLogs.findMany({ where: eq(dailySolarLogs.rvId, rvId) });
            financials = await db.query.financialData.findFirst({ where: eq(financialData.rvId, rvId) });
        }

        // 3. Insert as Demo Data
        // Helper to safely strip timestamps and apply new IDs
        const cloneData = (dataArray: any[]) => {
            return dataArray.map((row) => {
                const { id, createdAt, updatedAt, ...rest } = row as any;
                return {
                    ...rest,
                    id: crypto.randomUUID(),
                    userId: DEMO_ID
                };
            });
        };

        if (adminDocs.length > 0) await db.insert(documents).values(cloneData(adminDocs));
        if (adminEquip.length > 0) await db.insert(equipmentItems).values(cloneData(adminEquip));
        if (adminEvents.length > 0) await db.insert(eventsAndLogs).values(cloneData(adminEvents));
        if (adminWA.length > 0) await db.insert(waterActivities).values(cloneData(adminWA));
        if (adminTL.length > 0) await db.insert(tankLogs).values(cloneData(adminTL));
        if (adminInc.length > 0) await db.insert(incomes).values(cloneData(adminInc));
        if (adminExp.length > 0) await db.insert(expenses).values(cloneData(adminExp));

        if (adminRV) {
            const newRvId = crypto.randomUUID();
            const { id: _, createdAt: __, updatedAt: ___, ...rvData } = adminRV as any;
            await db.insert(rvVehicles).values({ id: newRvId, ...rvData, userId: DEMO_ID });

            if (powerSys) {
                const { id: _, rvId: __, updatedAt: ___, ...pData } = powerSys as any;
                await db.insert(powerSystems).values({ id: crypto.randomUUID(), rvId: newRvId, ...pData });
            }
            if (waterSys) {
                const { id: _, rvId: __, updatedAt: ___, ...wData } = waterSys as any;
                await db.insert(waterSystems).values({ id: crypto.randomUUID(), rvId: newRvId, ...wData });
            }
            if (financials) {
                const { id: _, rvId: __, updatedAt: ___, ...fData } = financials as any;
                await db.insert(financialData).values({ id: crypto.randomUUID(), rvId: newRvId, ...fData });
            }

            // Clone collections
            const cloneRvArray = (dataArray: any[]) => {
                return dataArray.map((row) => {
                    const { id, createdAt, updatedAt, rvId, ...rest } = row as any;
                    return {
                        ...rest,
                        id: crypto.randomUUID(),
                        rvId: newRvId
                    };
                });
            };

            if (electricDevs && electricDevs.length > 0) await db.insert(electricalDevices).values(cloneRvArray(electricDevs));
            if (solarEquip && solarEquip.length > 0) await db.insert(solarEquipment).values(cloneRvArray(solarEquip));
            if (solarLogs && solarLogs.length > 0) await db.insert(dailySolarLogs).values(cloneRvArray(solarLogs));
        }

        revalidatePath("/", "layout");
        return { success: true, message: "Live data successfully published to Demo Mode!" };
    } catch (error) {
        console.error("Error publishing to demo:", error);
        return { success: false, error: "Failed to publish data to demo mode." };
    }
}
