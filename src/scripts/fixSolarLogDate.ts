import { db } from '../lib/db/index';
import { dailySolarLogs, rvVehicles } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function main() {
    const rv = await db.query.rvVehicles.findFirst({ where: eq(rvVehicles.userId, 'demo_user') });
    if (!rv) { console.log('No demo RV found'); process.exit(1); }

    const logs = await db.select().from(dailySolarLogs).where(eq(dailySolarLogs.rvId, rv.id));
    console.log('All solar logs:', JSON.stringify(logs.map(l => ({ id: l.id, date: l.date })), null, 2));

    // Find the bad one — has a timestamp instead of plain date (renders as Invalid Date in UI)
    const bad = logs.find(l => l.date && String(l.date).includes('T'));
    if (!bad) { console.log('No bad date found'); process.exit(0); }

    console.log('Fixing:', bad.id, 'date was:', bad.date);
    await db.update(dailySolarLogs).set({ date: new Date('2026-03-04') }).where(eq(dailySolarLogs.id, bad.id));
    console.log('Fixed — set to 2026-03-04');
    process.exit(0);
}

main().catch(console.error);
