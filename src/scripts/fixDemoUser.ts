import { db } from "../lib/db";
import { users, userProfiles, documents, equipmentItems, eventsAndLogs, rvVehicles } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const DEMO_ID = "demo_user";

    // 1. Check if demo_user exists in users table
    const demoUserRow = await db.query.users.findFirst({
        where: eq(users.id, DEMO_ID)
    });

    if (!demoUserRow) {
        console.log("Inserting demo_user into users table...");
        await db.insert(users).values({
            id: DEMO_ID,
            email: "demo@rvmasterplan.com"
        });
    }

    // 2. Check userProfiles
    const demoProfileRow = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, DEMO_ID)
    });

    if (!demoProfileRow) {
        console.log("Inserting demo_user into userProfiles table...");
        // Give demo user a far future expiration
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 10);

        await db.insert(userProfiles).values({
            id: crypto.randomUUID(),
            userId: DEMO_ID,
            subscriptionStatus: "active",
            subscriptionRenewalDate: futureDate,
            firstName: "Demo",
            lastName: "User"
        });
    }

    console.log("demo_user base records verified.");

    // 3. Check Admin Data Counts
    const ADMIN_ID = "admin_robert";
    const docs = await db.query.documents.findMany({ where: eq(documents.userId, ADMIN_ID) });
    const equip = await db.query.equipmentItems.findMany({ where: eq(equipmentItems.userId, ADMIN_ID) });
    const events = await db.query.eventsAndLogs.findMany({ where: eq(eventsAndLogs.userId, ADMIN_ID) });
    const rvs = await db.query.rvVehicles.findMany({ where: eq(rvVehicles.userId, ADMIN_ID) });

    console.log("--- ADMIN DATA COUNTS ---");
    console.log(`Documents: ${docs.length}`);
    console.log(`Equipment: ${equip.length}`);
    console.log(`Events: ${events.length}`);
    console.log(`RVs: ${rvs.length}`);
}

main().catch(console.error);
