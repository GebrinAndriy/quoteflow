import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CatalogRepository } from "@/domain/catalog/catalog";
import { PricingConfigError } from "@/domain/pricing/errors";
import type { Database } from "../database";
import { services } from "../schema";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleCatalogRepository } from "./drizzle-catalog-repository";

let db: Database;
let close: () => Promise<void>;
let catalog: CatalogRepository;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  catalog = createDrizzleCatalogRepository(db);
}, 30_000);

afterEach(() => close());

async function createBusiness(slug = "blinds-kyiv") {
  return catalog.createBusiness({ slug, name: "Blinds Kyiv", telegramChatId: null });
}

describe("businesses", () => {
  it("finds a business by slug", async () => {
    const created = await createBusiness();
    expect(await catalog.findBusinessBySlug("blinds-kyiv")).toEqual(created);
  });

  it("returns null for an unknown slug", async () => {
    expect(await catalog.findBusinessBySlug("nope")).toBeNull();
  });
});

describe("services", () => {
  it("stores the pricing rule and surcharges as they were given", async () => {
    const business = await createBusiness();
    const service = await catalog.createService({
      businessId: business.id,
      name: "Roller blinds",
      rule: { kind: "per_area", ratePerSqm: 50_000, minimumTotal: 20_000 },
      surcharges: [{ id: "install", label: "Installation", kind: "flat", amount: 50_000 }],
    });

    expect(await catalog.findService(business.id, service.id)).toEqual(service);
  });

  it("refuses to save an invalid pricing rule", async () => {
    const business = await createBusiness();
    await expect(
      catalog.createService({
        businessId: business.id,
        name: "Broken",
        rule: { kind: "fixed", price: -100 },
        surcharges: [],
      }),
    ).rejects.toThrow(PricingConfigError);
  });

  it("lists only active services of the given business", async () => {
    const own = await createBusiness();
    const other = await createBusiness("other");
    const rule = { kind: "fixed", price: 1_000 } as const;

    const active = await catalog.createService({ businessId: own.id, name: "A", rule, surcharges: [] });
    const hidden = await catalog.createService({ businessId: own.id, name: "B", rule, surcharges: [] });
    await catalog.createService({ businessId: other.id, name: "C", rule, surcharges: [] });
    await db.update(services).set({ isActive: false }).where(eq(services.id, hidden.id));

    expect(await catalog.listActiveServices(own.id)).toEqual([active]);
  });

  it("does not return another business's service", async () => {
    const own = await createBusiness();
    const other = await createBusiness("other");
    const service = await catalog.createService({
      businessId: other.id,
      name: "Foreign",
      rule: { kind: "fixed", price: 1_000 },
      surcharges: [],
    });

    expect(await catalog.findService(own.id, service.id)).toBeNull();
  });

  it("treats a malformed id as not found", async () => {
    const business = await createBusiness();
    expect(await catalog.findService(business.id, "not-a-uuid")).toBeNull();
  });
});
