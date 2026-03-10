import { db } from "../lib/db";

async function listUsers() {
    const users = await db.query.users.findMany();
    console.log("All Users in DB:");
    users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}`));
    process.exit(0);
}

listUsers().catch(console.error);
