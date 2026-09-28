/**
 * Applies one additive cf_* migration file to the database statement by statement,
 * skipping anything that already exists.
 *   npx tsx src/scripts/applyCashFlowMigration.ts [drizzle/0005_cash_flow_year_link.sql]
 * Defaults to drizzle/0004_cash_flow.sql (the original cf_* tables).
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    const before = await sql`select table_name from information_schema.tables where table_schema='public' and table_name like 'cf\_%' order by 1`;
    console.log('before:', before.map((r) => r.table_name));
    const file = process.argv[2] ?? 'drizzle/0004_cash_flow.sql';
    console.log('applying', file);
    const stmts = readFileSync(file, 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
    for (const st of stmts) {
        const label = st.slice(0, 72).replace(/\s+/g, ' ');
        try { await sql.query(st); console.log('ok  ', label); }
        catch (e) { if (e instanceof Error && /already exists/.test(e.message)) console.log('skip', label); else throw e; }
    }
    const after = await sql`select table_name from information_schema.tables where table_schema='public' and table_name like 'cf\_%' order by 1`;
    console.log('after:', after.map((r) => r.table_name));
    const idx = await sql`select indexname from pg_indexes where tablename like 'cf\_%' order by 1`;
    console.log('indexes:', idx.map((r) => r.indexname));
    const cols = await sql`select column_name from information_schema.columns where table_name = 'cf_scenarios' order by ordinal_position`;
    console.log('cf_scenarios columns:', cols.map((r) => r.column_name));
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
