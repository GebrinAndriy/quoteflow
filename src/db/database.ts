import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

// Driver-agnostic, so repositories run the same on Neon and on in-memory PGlite in tests.
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
