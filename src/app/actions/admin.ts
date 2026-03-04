"use server";

import { db } from "@/lib/db";
import { users, userProfiles, documents, equipmentItems, eventsAndLogs, rvVehicles, powerSystems, waterSystems, waterActivities, tankLogs, incomes, expenses } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    const ADMIN_ID = "admin_robert";
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
            await db.delete(powerSystems).where(eq(powerSystems.rvId, existingDemoRV.id));
            await db.delete(waterSystems).where(eq(waterSystems.rvId, existingDemoRV.id));
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

        let powerSys, waterSys;
        if (adminRV) {
            powerSys = await db.query.powerSystems.findFirst({ where: eq(powerSystems.rvId, adminRV.id) });
            waterSys = await db.query.waterSystems.findFirst({ where: eq(waterSystems.rvId, adminRV.id) });
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
            const { id, createdAt, updatedAt, ...rvData } = adminRV as any;
            await db.insert(rvVehicles).values({ id: newRvId, ...rvData, userId: DEMO_ID });

            if (powerSys) {
                const { id: _, rvId: __, createdAt: ___, updatedAt: ____, ...pData } = powerSys as any;
                await db.insert(powerSystems).values({ id: crypto.randomUUID(), rvId: newRvId, ...pData });
            }
            if (waterSys) {
                const { id: _, rvId: __, createdAt: ___, updatedAt: ____, ...wData } = waterSys as any;
                await db.insert(waterSystems).values({ id: crypto.randomUUID(), rvId: newRvId, ...wData });
            }
        }

        revalidatePath("/", "layout");
        return { success: true, message: "Live data successfully published to Demo Mode!" };
    } catch (error) {
        console.error("Error publishing to demo:", error);
        return { success: false, error: "Failed to publish data to demo mode." };
    }
}
