import { and, asc, eq } from "drizzle-orm";
import type { Business, CatalogRepository } from "@/domain/catalog/catalog";
import type { Service } from "@/domain/pricing/types";
import { validateService } from "@/domain/pricing/validate-service";
import type { Database } from "../database";
import { businesses, services } from "../schema";
import { isUuid } from "./is-uuid";

type BusinessRow = typeof businesses.$inferSelect;
type ServiceRow = typeof services.$inferSelect;

export function createDrizzleCatalogRepository(db: Database): CatalogRepository {
  return {
    async findBusinessBySlug(slug) {
      const [row] = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
      return row ? toBusiness(row) : null;
    },

    async createBusiness(business) {
      const [row] = await db.insert(businesses).values(business).returning();
      return toBusiness(row);
    },

    async listActiveServices(businessId) {
      if (!isUuid(businessId)) return [];
      const rows = await db
        .select()
        .from(services)
        .where(and(eq(services.businessId, businessId), eq(services.isActive, true)))
        .orderBy(asc(services.createdAt));
      return rows.map(toService);
    },

    async findService(businessId, serviceId) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return null;
      const [row] = await db
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, serviceId),
            eq(services.businessId, businessId),
            eq(services.isActive, true),
          ),
        )
        .limit(1);
      return row ? toService(row) : null;
    },

    async createService({ businessId, name, rule, surcharges }) {
      validateService({ id: "new", name, rule, surcharges });
      const [row] = await db.insert(services).values({ businessId, name, rule, surcharges }).returning();
      return toService(row);
    },
  };
}

function toBusiness(row: BusinessRow): Business {
  return { id: row.id, slug: row.slug, name: row.name, telegramChatId: row.telegramChatId };
}

function toService(row: ServiceRow): Service {
  return { id: row.id, name: row.name, rule: row.rule, surcharges: row.surcharges };
}
