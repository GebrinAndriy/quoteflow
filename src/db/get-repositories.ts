import "server-only";
import { getDb } from "./client";
import { createDrizzleCatalogRepository } from "./repositories/drizzle-catalog-repository";
import { createDrizzleLeadRepository } from "./repositories/drizzle-lead-repository";

export function getRepositories() {
  const db = getDb();
  return {
    catalog: createDrizzleCatalogRepository(db),
    leads: createDrizzleLeadRepository(db),
  };
}
