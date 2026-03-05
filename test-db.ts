import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_U2SHwtbgK0kr@ep-proud-thunder-akx2oh3o-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require");

async function check() {
    console.log("--- Equipment Items ---");
    const items = await sql`SELECT * FROM equipment_items ORDER BY created_at DESC LIMIT 5`;
    console.log(items.length ? items : "No new equipment items found");

    console.log("--- Daily Solar Logs ---");
    const solarLogs = await sql`SELECT * FROM daily_solar_logs ORDER BY created_at DESC LIMIT 5`;
    console.log(solarLogs.length ? solarLogs : "No solar logs");
}

check().catch(console.error);
