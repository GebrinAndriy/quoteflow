import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import type { Database } from "./database";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { db?: Database };

// One pool per process: Next dev reloads modules on every change and would otherwise leak connections.
export function getDb(): Database {
  if (!globalForDb.db) {
    // Neon's pooler runs PgBouncer in transaction mode, which does not support prepared statements.
    const client = postgres(getServerEnv().DATABASE_URL, { max: 5, prepare: false });
    globalForDb.db = drizzle(client, { schema });
  }
  return globalForDb.db;
}
