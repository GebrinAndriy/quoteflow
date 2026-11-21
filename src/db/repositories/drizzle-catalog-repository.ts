import { and, asc, eq, lt, sql } from "drizzle-orm";
import type { Business, CatalogRepository } from "@/domain/catalog/catalog";
import type { Service } from "@/domain/pricing/types";
import { MAX_SURCHARGES, validateService, validateSurcharge } from "@/domain/pricing/validate-service";
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

    async setTelegramChat(businessId, chat) {
      await db
        .update(businesses)
        .set({ telegramChatId: chat?.id ?? null, telegramChatName: chat?.name ?? null })
        .where(eq(businesses.id, businessId));
    },

    async setContacts(businessId, { phone, address }) {
      if (!isUuid(businessId)) return;
      await db.update(businesses).set({ phone, address }).where(eq(businesses.id, businessId));
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

    async listAllServices(businessId) {
      if (!isUuid(businessId)) return [];
      const rows = await db
        .select()
        .from(services)
        .where(eq(services.businessId, businessId))
        .orderBy(asc(services.createdAt));
      return rows.map((row) => ({ ...toService(row), isActive: row.isActive }));
    },

    async setServiceActive(businessId, serviceId, isActive) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return;
      await db
        .update(services)
        .set({ isActive })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));
    },

    async updateService(businessId, serviceId, { name, rule }) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return false;
      validateService({ id: serviceId, name, rule, surcharges: [] });
      const rows = await db
        .update(services)
        .set({ name, rule })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
        .returning({ id: services.id });
      return rows.length > 0;
    },

    // jsonb is changed in place by one UPDATE, so two tabs adding options cannot overwrite each other.
    async addSurcharge(businessId, serviceId, surcharge) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return "not_found";
      validateSurcharge(surcharge);
      const ownService = and(eq(services.id, serviceId), eq(services.businessId, businessId));
      const rows = await db
        .update(services)
        .set({ surcharges: sql`${services.surcharges} || ${JSON.stringify([surcharge])}::jsonb` })
        .where(and(ownService, lt(sql`jsonb_array_length(${services.surcharges})`, MAX_SURCHARGES)))
        .returning({ id: services.id });
      if (rows.length > 0) return "added";
      const [existing] = await db.select({ id: services.id }).from(services).where(ownService).limit(1);
      return existing ? "limit_reached" : "not_found";
    },

    async removeSurcharge(businessId, serviceId, surchargeId) {
      if (!isUuid(businessId) || !isUuid(serviceId)) return;
      await db
        .update(services)
        .set({
          surcharges: sql`coalesce(
            (select jsonb_agg(option order by position)
             from jsonb_array_elements(${services.surcharges}) with ordinality as t(option, position)
             where option->>'id' <> ${surchargeId}),
            '[]'::jsonb)`,
        })
        .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));
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
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    telegramChatId: row.telegramChatId,
    telegramChatName: row.telegramChatName,
    phone: row.phone,
    address: row.address,
  };
}

function toService(row: ServiceRow): Service {
  return { id: row.id, name: row.name, rule: row.rule, surcharges: row.surcharges };
}
