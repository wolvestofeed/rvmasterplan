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

// --- Seed Admin User ---
export async function seedAdminUser() {
    const ADMIN_ID = "admin_robert";
    const ADMIN_EMAIL = "robseeds@gmail.com";

    try {
        const existing = await db.query.users.findFirst({
            where: eq(users.id, ADMIN_ID)
        });

        if (existing) {
            return { success: false, error: "Admin user already exists" };
        }

        // 1. Create user
        await db.insert(users).values({ id: ADMIN_ID, email: ADMIN_EMAIL });

        // 2. Create profile
        const renewalDate = new Date();
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        await db.insert(userProfiles).values({
            id: "profile_admin",
            userId: ADMIN_ID,
            firstName: "Robert",
            lastName: "Bogatin",
            subscriptionStatus: "active",
            subscriptionRenewalDate: renewalDate,
        });

        // 3. Replicate equipment
        const equipmentData = [
            { name: "Weight Distribution / Sway Control Kit", category: "TOWING", cost: "649.99", weight: "75.5", isAcquired: true, notes: "e2 Hitch Round Bar" },
            { name: "Leveling Plates (Sets of ten)", category: "TOWING", cost: "39.99", weight: "15.0", isAcquired: true },
            { name: "Chocks", category: "TOWING", cost: "24.99", weight: "8.0", isAcquired: true },
            { name: "Brake Control Kit", category: "BRAKES", cost: "349.99", weight: "5.2", isAcquired: true },
            { name: "Water Storage Bladder", category: "WATER", cost: "129.99", weight: "12.5", isAcquired: false },
            { name: "20V Battery Transfer Water Pump", category: "WATER", cost: "89.99", weight: "6.8", isAcquired: false },
            { name: "EcoFlow DELTA Pro Solar Generator (PV400W)", category: "ENERGY", cost: "1799.99", weight: "99.2", isAcquired: false },
            { name: "Extra Battery", category: "ENERGY", cost: "899.99", weight: "45.0", isAcquired: false },
        ];

        for (let i = 0; i < equipmentData.length; i++) {
            await db.insert(equipmentItems).values({
                id: `admin_equip_${i + 1}`,
                userId: ADMIN_ID,
                name: equipmentData[i].name,
                category: equipmentData[i].category,
                cost: equipmentData[i].cost,
                weight: equipmentData[i].weight,
                isAcquired: equipmentData[i].isAcquired ?? false,
                notes: equipmentData[i].notes || null,
            });
        }

        // 4. Replicate documents
        const docData = [
            { title: "Vehicle Registration", fileType: "pdf", renewalDate: new Date("2027-05-01"), renewalCost: "535.15" },
            { title: "RV Insurance Policy", fileType: "pdf", renewalDate: new Date("2027-01-15"), renewalCost: "705.00" },
            { title: "Extended Warranty", fileType: "pdf", renewalDate: new Date("2029-05-01"), renewalCost: "0" },
        ];

        for (let i = 0; i < docData.length; i++) {
            await db.insert(documents).values({
                id: `admin_doc_${i + 1}`,
                userId: ADMIN_ID,
                title: docData[i].title,
                fileType: docData[i].fileType,
                renewalDate: docData[i].renewalDate,
                renewalCost: docData[i].renewalCost,
            });
        }

        // 5. Replicate events/logs
        const eventData = [
            { eventType: "Maintenance", title: "Tire Pressure Inspection", status: "Upcoming", scheduledDate: new Date("2026-04-15"), notes: "Check all 4 tires + spare" },
            { eventType: "Reminder", title: "Water Filter Replacement", status: "Upcoming", scheduledDate: new Date("2026-06-01"), notes: "Replace inline water filter" },
            { eventType: "Tank Dump", title: "Black & Gray Tank Dump", status: "Upcoming", scheduledDate: new Date("2026-03-20"), notes: "Full dump station service" },
        ];

        for (let i = 0; i < eventData.length; i++) {
            await db.insert(eventsAndLogs).values({
                id: `admin_event_${i + 1}`,
                userId: ADMIN_ID,
                eventType: eventData[i].eventType,
                title: eventData[i].title,
                status: eventData[i].status,
                scheduledDate: eventData[i].scheduledDate,
                notes: eventData[i].notes,
            });
        }

        revalidatePath("/admin");
        return { success: true, message: "Admin user Robert Bogatin created with full demo data replica." };
    } catch (error) {
        console.error("Error seeding admin user:", error);
        return { success: false, error: String(error) };
    }
}

// --- Sync Full Demo Data to Admin ---
export async function syncAdminDemoData() {
    const ADMIN_ID = "admin_robert";

    try {
        // Check admin exists
        const existing = await db.query.users.findFirst({
            where: eq(users.id, ADMIN_ID)
        });
        if (!existing) {
            return { success: false, error: "Admin user not found. Seed admin first." };
        }

        let seeded: string[] = [];

        // --- 1. RV Vehicle ---
        const existingRV = await db.query.rvVehicles.findFirst({
            where: eq(rvVehicles.userId, ADMIN_ID)
        });
        if (!existingRV) {
            await db.insert(rvVehicles).values({
                id: "admin_rv_1",
                userId: ADMIN_ID,
                type: "Travel Trailer",
                year: 2026,
                make: "Dutchmen",
                model: "Aspen Trail LE 21RD",
                lengthFeet: "21",
                dryWeightLbs: "3600",
                gvwrLbs: "5500",
            });

            // Power system for the RV
            await db.insert(powerSystems).values({
                id: "admin_power_1",
                rvId: "admin_rv_1",
                batteryCapacityAh: "300",
                batteryVoltage: "12",
                solarCapacityWatts: "800",
                inverterWattage: "3600",
            });

            // Water system for the RV
            await db.insert(waterSystems).values({
                id: "admin_water_1",
                rvId: "admin_rv_1",
                freshCapacityGal: "52",
                grayCapacityGal: "42",
                blackCapacityGal: "42",
            });
            seeded.push("RV Vehicle + Power System + Water System");
        }

        // --- 2. Water Activities ---
        const existingWA = await db.query.waterActivities.findFirst({
            where: eq(waterActivities.userId, ADMIN_ID)
        });
        if (!existingWA) {
            const activities = [
                { name: "Washing Dishes", category: "Kitchen", gallonsPerUse: "2.5", timesPerDay: "2" },
                { name: "Shower", category: "Bathroom", gallonsPerUse: "5.0", timesPerDay: "1" },
                { name: "Toilet Flush", category: "Bathroom", gallonsPerUse: "1.0", timesPerDay: "4" },
                { name: "Brushing Teeth", category: "Bathroom", gallonsPerUse: "0.5", timesPerDay: "2" },
                { name: "Drinking Water", category: "Drinking", gallonsPerUse: "0.5", timesPerDay: "1" },
            ];
            for (let i = 0; i < activities.length; i++) {
                await db.insert(waterActivities).values({
                    id: `admin_wa_${i + 1}`,
                    userId: ADMIN_ID,
                    ...activities[i],
                });
            }
            seeded.push(`${activities.length} Water Activities`);
        }

        // --- 3. Tank Logs ---
        const existingTL = await db.query.tankLogs.findFirst({
            where: eq(tankLogs.userId, ADMIN_ID)
        });
        if (!existingTL) {
            const logs = [
                { date: "2026-02-15", type: "Dump", tank: "Black", volume: "38" },
                { date: "2026-02-15", type: "Dump", tank: "Gray", volume: "40" },
                { date: "2026-02-20", type: "Fill", tank: "Fresh", volume: "52" },
                { date: "2026-03-01", type: "Dump", tank: "Black", volume: "32" },
                { date: "2026-03-01", type: "Dump", tank: "Gray", volume: "35" },
                { date: "2026-03-01", type: "Fill", tank: "Fresh", volume: "52" },
            ];
            for (let i = 0; i < logs.length; i++) {
                await db.insert(tankLogs).values({
                    id: `admin_tl_${i + 1}`,
                    userId: ADMIN_ID,
                    ...logs[i],
                });
            }
            seeded.push(`${logs.length} Tank Logs`);
        }

        // --- 4. Incomes (Living Budget) ---
        const existingInc = await db.query.incomes.findFirst({
            where: eq(incomes.userId, ADMIN_ID)
        });
        if (!existingInc) {
            const incomeData = [
                { source: "Remote Work Salary", amount: "5500", isFixed: true },
                { source: "Freelance Writing", amount: "800", isFixed: false },
                { source: "YouTube / Content", amount: "350", isFixed: false },
            ];
            for (let i = 0; i < incomeData.length; i++) {
                await db.insert(incomes).values({
                    id: `admin_inc_${i + 1}`,
                    userId: ADMIN_ID,
                    ...incomeData[i],
                });
            }
            seeded.push(`${incomeData.length} Income Sources`);
        }

        // --- 5. Expenses (Living Budget) ---
        const existingExp = await db.query.expenses.findFirst({
            where: eq(expenses.userId, ADMIN_ID)
        });
        if (!existingExp) {
            const expenseData = [
                { name: "RV Loan Payment", category: "Housing", amount: "312", isFixed: true },
                { name: "RV Insurance", category: "Housing", amount: "59", isFixed: true },
                { name: "Campground / Membership", category: "Housing", amount: "450", isFixed: false },
                { name: "Groceries", category: "Food", amount: "400", isFixed: false },
                { name: "Dining Out", category: "Food", amount: "150", isFixed: false },
                { name: "Fuel / Gas", category: "Transportation", amount: "300", isFixed: false },
                { name: "Propane", category: "Utilities", amount: "40", isFixed: false },
                { name: "Cell / Internet (Starlink)", category: "Utilities", amount: "120", isFixed: true },
                { name: "Health Insurance", category: "Healthcare", amount: "425", isFixed: true },
                { name: "RV Maintenance Fund", category: "Maintenance", amount: "150", isFixed: false },
                { name: "Entertainment / Activities", category: "Lifestyle", amount: "100", isFixed: false },
                { name: "Pet Care", category: "Lifestyle", amount: "75", isFixed: false },
            ];
            for (let i = 0; i < expenseData.length; i++) {
                await db.insert(expenses).values({
                    id: `admin_exp_${i + 1}`,
                    userId: ADMIN_ID,
                    ...expenseData[i],
                });
            }
            seeded.push(`${expenseData.length} Expenses`);
        }

        // --- 6. Update Equipment with full priority data ---
        // Delete old equipment and re-insert with proper priority + weight
        await db.delete(equipmentItems).where(eq(equipmentItems.userId, ADMIN_ID));
        const fullEquipment = [
            { name: "Weight Distribution / Sway Control Kit", category: "TOWING", cost: "649.99", weight: "75.5", priority: "Must Have", isAcquired: true, notes: "e2 Hitch Round Bar" },
            { name: "Leveling Plates (Sets of ten)", category: "TOWING", cost: "39.99", weight: "15.0", priority: "Must Have", isAcquired: true },
            { name: "Chocks", category: "TOWING", cost: "24.99", weight: "8.0", priority: "Must Have", isAcquired: true },
            { name: "Brake Control Kit", category: "BRAKES", cost: "349.99", weight: "5.2", priority: "Must Have", isAcquired: true },
            { name: "Water Storage Bladder", category: "WATER", cost: "129.99", weight: "12.5", priority: "Must Have", isAcquired: false },
            { name: "20V Battery Transfer Water Pump", category: "WATER", cost: "89.99", weight: "6.8", priority: "Must Have", isAcquired: false },
            { name: "EcoFlow DELTA Pro Solar Generator", category: "ENERGY", cost: "2499.00", weight: "99.0", priority: "Must Have", isAcquired: false, notes: "3600W Output, MPPT, 5 AC / 6 USB / 2 DC Ports" },
            { name: "EcoFlow DELTA Pro Battery", category: "ENERGY", cost: "1599.00", weight: "84.0", priority: "Must Have", isAcquired: false, notes: "3600Wh, 300Ah, LFP, 3500 Cycles" },
            { name: "EcoFlow PV400 Solar Panel (x2)", category: "ENERGY", cost: "1798.00", weight: "25.0", priority: "Must Have", isAcquired: false, notes: "400W ea, 23% Eff, Flexible Monocrystalline" },
            { name: "Inline Water Filter", category: "WATER", cost: "34.99", weight: "2.0", priority: "Must Have", isAcquired: true },
            { name: "Sewer Hose Kit", category: "PLUMBING", cost: "49.99", weight: "5.5", priority: "Must Have", isAcquired: true },
            { name: "Surge Protector 30A", category: "ELECTRICAL", cost: "89.99", weight: "3.2", priority: "Must Have", isAcquired: true },
            { name: "Starlink Mini", category: "IT/COMMS", cost: "599.00", weight: "2.4", priority: "Must Have", isAcquired: true, notes: "RV internet connectivity" },
            { name: "Fire Extinguisher (2-pack)", category: "SAFETY", cost: "39.99", weight: "6.0", priority: "Must Have", isAcquired: true },
            { name: "First Aid Kit", category: "SAFETY", cost: "24.99", weight: "3.0", priority: "Must Have", isAcquired: true },
            { name: "Toolbox (RV Essentials)", category: "MAINTENANCE", cost: "89.99", weight: "18.0", priority: "Nice to Have", isAcquired: true },
            { name: "Awning Lights", category: "ACCESSORIES", cost: "29.99", weight: "1.5", priority: "Nice to Have", isAcquired: false },
            { name: "Outdoor Folding Table", category: "ACCESSORIES", cost: "69.99", weight: "12.0", priority: "Nice to Have", isAcquired: false },
        ];
        for (let i = 0; i < fullEquipment.length; i++) {
            await db.insert(equipmentItems).values({
                id: `admin_equip_${i + 1}`,
                userId: ADMIN_ID,
                name: fullEquipment[i].name,
                category: fullEquipment[i].category,
                cost: fullEquipment[i].cost,
                weight: fullEquipment[i].weight,
                priority: fullEquipment[i].priority,
                isAcquired: fullEquipment[i].isAcquired,
                notes: fullEquipment[i].notes || null,
            });
        }
        seeded.push(`${fullEquipment.length} Equipment Items (full specs + priorities)`);

        revalidatePath("/admin");
        revalidatePath("/dashboard");
        return {
            success: true,
            message: `Synced to admin account: ${seeded.join(", ")}`
        };
    } catch (error) {
        console.error("Error syncing admin demo data:", error);
        return { success: false, error: String(error) };
    }
}

