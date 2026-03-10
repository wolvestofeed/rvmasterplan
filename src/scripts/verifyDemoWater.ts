import { db } from "../lib/db";
import { waterActivities } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function verifyDemoWater() {
    const DEMO_ID = "demo_user";

    const acts = await db.query.waterActivities.findMany({
        where: eq(waterActivities.userId, DEMO_ID)
    });

    console.log(`Found ${acts.length} water activities for Demo User.`);
    console.log(acts);
    process.exit(0);
}

verifyDemoWater().catch(console.error);
