import { db } from "../lib/db";
import { users, userProfiles, documents, equipmentItems, eventsAndLogs, waterActivities, tankLogs, incomes, expenses, rvVehicles } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const OLD_ADMIN = "admin_robert";
    const NEW_ADMIN = "user_3AV8ZeJflzMw7PxzIb8aU8vm2U3";

    console.log(`Migrating data from ${OLD_ADMIN} to ${NEW_ADMIN}...`);

    // 1. Ensure NEW_ADMIN is in users and userProfiles tables
    // (In case the webhook didn't catch their signup properly)
    const newAdminRow = await db.query.users.findFirst({ where: eq(users.id, NEW_ADMIN) });
    if (!newAdminRow) {
        console.log("Creating new user row...");
        await db.insert(users).values({
            id: NEW_ADMIN,
            email: "robseeds@gmail.com",
            createdAt: new Date(),
        });
    }

    const newProfileRow = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, NEW_ADMIN) });
    if (!newProfileRow) {
        console.log("Creating new profile row...");
        await db.insert(userProfiles).values({
            id: crypto.randomUUID(),
            userId: NEW_ADMIN,
            subscriptionStatus: "active",
            firstName: "Robert",
            lastName: "Bogatin",
        });
    }

    // 2. Migrate records
    console.log("Migrating tables...");

    // We update all old records to point to the new ID
    const docs = await db.update(documents).set({ userId: NEW_ADMIN }).where(eq(documents.userId, OLD_ADMIN)).returning();
    const equips = await db.update(equipmentItems).set({ userId: NEW_ADMIN }).where(eq(equipmentItems.userId, OLD_ADMIN)).returning();
    const events = await db.update(eventsAndLogs).set({ userId: NEW_ADMIN }).where(eq(eventsAndLogs.userId, OLD_ADMIN)).returning();
    const water = await db.update(waterActivities).set({ userId: NEW_ADMIN }).where(eq(waterActivities.userId, OLD_ADMIN)).returning();
    const tanks = await db.update(tankLogs).set({ userId: NEW_ADMIN }).where(eq(tankLogs.userId, OLD_ADMIN)).returning();
    const incs = await db.update(incomes).set({ userId: NEW_ADMIN }).where(eq(incomes.userId, OLD_ADMIN)).returning();
    const exps = await db.update(expenses).set({ userId: NEW_ADMIN }).where(eq(expenses.userId, OLD_ADMIN)).returning();

    const rvs = await db.update(rvVehicles).set({ userId: NEW_ADMIN }).where(eq(rvVehicles.userId, OLD_ADMIN)).returning();

    console.log(`Migrated: ${docs.length} docs, ${equips.length} equipment, ${events.length} events, ${rvs.length} RVs`);
}

main().catch(console.error);
