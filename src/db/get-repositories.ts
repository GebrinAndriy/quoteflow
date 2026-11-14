import "server-only";
import { getDb } from "./client";
import { createDrizzleAccountRepository } from "./repositories/drizzle-account-repository";
import { createDrizzleCatalogRepository } from "./repositories/drizzle-catalog-repository";
import { createDrizzleLeadRepository } from "./repositories/drizzle-lead-repository";
import { createDrizzleSessionRepository } from "./repositories/drizzle-session-repository";

export function getRepositories() {
  const db = getDb();
  return {
    accounts: createDrizzleAccountRepository(db),
    catalog: createDrizzleCatalogRepository(db),
    leads: createDrizzleLeadRepository(db),
    sessions: createDrizzleSessionRepository(db),
  };
}
