import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { targetBudgets } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    const existingBudgets = await db.select().from(targetBudgets).where(eq(targetBudgets.userId, "admin_robert"));
    console.log("Found:", existingBudgets.length);
    console.log(existingBudgets);
}
main();
