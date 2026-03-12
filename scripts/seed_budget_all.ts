import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { expenses, targetBudgets, users } from "../src/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Local storage backup values corresponding to the "10k" legacy array
const MOCK_BUDGET_TARGETS = [
    { month: 1, amount: 2500 },
    { month: 2, amount: 2500 },
    { month: 3, amount: 2500 },
    { month: 4, amount: 2500 },
    { month: 5, amount: 2500 },
    { month: 6, amount: 2500 },
    { month: 7, amount: 2500 },
    { month: 8, amount: 2500 },
    { month: 9, amount: 2500 },
    { month: 10, amount: 2500 },
    { month: 11, amount: 2500 },
    { month: 12, amount: 2500 },
];

async function main() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log("Seeding all users with default Living Budget structure...");

    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    // Get all valid users + the demo_user pseudo-id constraint
    const allUsers = await db.select().from(users);
    const userIds = [...allUsers.map(u => u.id), "demo_user"];

    const currentYear = new Date().getFullYear();

    try {
        for (const userId of userIds) {
            console.log(`Processing Target Budgets for user: ${userId}`);

            const existingBudgets = await db.select().from(targetBudgets).where(
                eq(targetBudgets.userId, userId)
            );

            if (existingBudgets.length === 0) {
                console.log(`No active budgets found for ${userId}. Bootstrapping 12 months...`);
                // Insert default budget distribution
                for (const b of MOCK_BUDGET_TARGETS) {
                    await db.insert(targetBudgets).values({
                        id: uuidv4(),
                        userId,
                        month: b.month,
                        year: currentYear,
                        amount: String(b.amount)
                    });
                }
                console.log(`Successfully bootstrapped ${userId}.`);
            } else {
                console.log(`User ${userId} already has ${existingBudgets.length} budgets. Skipping.`);
            }
        }

        console.log("Database Budget Reseed complete!");

    } catch (e: any) {
        console.error("Error reseeding budgets:", e.message);
    }
}

main();
