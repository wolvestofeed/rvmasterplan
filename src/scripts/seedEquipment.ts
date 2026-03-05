import { db } from "../lib/db";
import { equipmentItems } from "../lib/db/schema";
import { mockSetupItems } from "../data/mockData";
import { eq } from "drizzle-orm";

async function main() {
    const ADMIN_ID = "admin_robert";

    console.log("Checking existing equipment for admin...");
    const existing = await db.query.equipmentItems.findMany({
        where: eq(equipmentItems.userId, ADMIN_ID)
    });

    if (existing.length > 0) {
        console.log(`Admin already has ${existing.length} items. Skipping seed.`);
        return;
    }

    console.log(`Seeding ${mockSetupItems.length} items for admin...`);

    for (const item of mockSetupItems) {
        await db.insert(equipmentItems).values({
            id: Date.now().toString() + Math.random().toString(),
            userId: ADMIN_ID,
            name: item.name,
            category: item.category,
            priority: item.priority || "Nice to Have",
            cost: item.cost.toString(),
            weight: item.weight?.toString() || "0",
            isAcquired: item.acquired,
            notes: item.notes,
            purchaseDeadline: item.purchaseDeadline
                ? new Date(item.purchaseDeadline + "T12:00:00")
                : null
        });
    }

    console.log("Seeding complete! Admin now has the equipment data.");
    console.log("You can now click 'Publish to Demo Mode' in your admin panel to push this to the live demo.");
}

main().catch(console.error);
