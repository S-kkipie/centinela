import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Use the direct/session connection (5432) for DDL — the transaction pooler
// (6543) does not run migrations reliably.
const pool = new Pool({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();

console.log("migrations applied");
