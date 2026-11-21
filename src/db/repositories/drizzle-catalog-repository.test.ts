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

async function createBusiness(slug = "blinds-dublin") {
  return catalog.createBusiness({ slug, name: "Blinds Dublin", telegramChatId: null });
}

describe("businesses", () => {
  it("finds a business by slug", async () => {
    const created = await createBusiness();
    expect(await catalog.findBusinessBySlug("blinds-dublin")).toEqual(created);
  });

  it("returns null for an unknown slug", async () => {
    expect(await catalog.findBusinessBySlug("nope")).toBeNull();
  });

  it("connects and disconnects a Telegram chat of one business only", async () => {
    const own = await createBusiness();
    await createBusiness("other");

    await catalog.setTelegramChat(own.id, { id: "123456789", name: "@olena" });
    expect(await catalog.findBusinessBySlug("blinds-dublin")).toMatchObject({
      telegramChatId: "123456789",
      telegramChatName: "@olena",
    });
    expect(await catalog.findBusinessBySlug("other")).toMatchObject({ telegramChatId: null });

    await catalog.setTelegramChat(own.id, null);
    expect(await catalog.findBusinessBySlug("blinds-dublin")).toMatchObject({
      telegramChatId: null,
      telegramChatName: null,
    });
  });

  it("creates a business without contacts", async () => {
    expect(await createBusiness()).toMatchObject({ phone: null, address: null });
  });

  it("sets and clears the contacts of one business only", async () => {
    const own = await createBusiness();
    await createBusiness("other");

    await catalog.setContacts(own.id, { phone: "+353854927104", address: "42 Grafton Street\nDublin 2" });
    expect(await catalog.findBusinessBySlug("blinds-dublin")).toMatchObject({
      phone: "+353854927104",
      address: "42 Grafton Street\nDublin 2",
    });
    expect(await catalog.findBusinessBySlug("other")).toMatchObject({ phone: null, address: null });

    await catalog.setContacts(own.id, { phone: null, address: null });
    expect(await catalog.findBusinessBySlug("blinds-dublin")).toMatchObject({ phone: null, address: null });
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

  it("hides and shows a service only for its own business", async () => {
    const own = await createBusiness();
    const other = await createBusiness("other");
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: own.id, name: "A", rule, surcharges: [] });

    await catalog.setServiceActive(other.id, service.id, false);
    expect(await catalog.listActiveServices(own.id)).toEqual([service]);

    await catalog.setServiceActive(own.id, service.id, false);
    expect(await catalog.listActiveServices(own.id)).toEqual([]);
    expect(await catalog.listAllServices(own.id)).toEqual([{ ...service, isActive: false }]);
    expect(await catalog.listAllServices(other.id)).toEqual([]);
  });

  it("updates the name and rule but keeps surcharges and visibility", async () => {
    const business = await createBusiness();
    const surcharges = [{ id: "install", label: "Installation", kind: "flat", amount: 50_000 }] as const;
    const service = await catalog.createService({
      businessId: business.id,
      name: "Roller blinds",
      rule: { kind: "per_area", ratePerSqm: 50_000 },
      surcharges: [...surcharges],
    });

    const updated = await catalog.updateService(business.id, service.id, {
      name: "Day-night blinds",
      rule: { kind: "fixed", price: 90_000 },
    });

    expect(updated).toBe(true);
    expect(await catalog.listAllServices(business.id)).toEqual([
      { id: service.id, name: "Day-night blinds", rule: { kind: "fixed", price: 90_000 }, surcharges, isActive: true },
    ]);
  });

  it("does not update another business's service", async () => {
    const own = await createBusiness();
    const other = await createBusiness("other");
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: other.id, name: "Foreign", rule, surcharges: [] });

    expect(await catalog.updateService(own.id, service.id, { name: "Mine now", rule })).toBe(false);
    expect(await catalog.updateService(own.id, "not-a-uuid", { name: "Mine now", rule })).toBe(false);
    expect((await catalog.listAllServices(other.id))[0].name).toBe("Foreign");
  });

  it("refuses to update to an invalid rule", async () => {
    const business = await createBusiness();
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: business.id, name: "A", rule, surcharges: [] });

    await expect(
      catalog.updateService(business.id, service.id, { name: "A", rule: { kind: "fixed", price: 0 } }),
    ).rejects.toThrow(PricingConfigError);
  });

  it("adds options in order and removes one by id", async () => {
    const business = await createBusiness();
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: business.id, name: "A", rule, surcharges: [] });
    const install = { id: "install", label: "Installation", kind: "flat", amount: 50_000 } as const;
    const urgent = { id: "urgent", label: "Urgent", kind: "percent", percent: 20 } as const;
    const night = { id: "night", label: "Night", kind: "flat", amount: 10_000 } as const;

    for (const option of [install, urgent, night]) {
      expect(await catalog.addSurcharge(business.id, service.id, option)).toBe("added");
    }
    await catalog.removeSurcharge(business.id, service.id, "urgent");
    expect((await catalog.findService(business.id, service.id))?.surcharges).toEqual([install, night]);

    await catalog.removeSurcharge(business.id, service.id, "install");
    await catalog.removeSurcharge(business.id, service.id, "night");
    expect((await catalog.findService(business.id, service.id))?.surcharges).toEqual([]);
  });

  it("does not lose options added at the same time", async () => {
    const business = await createBusiness();
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: business.id, name: "A", rule, surcharges: [] });

    await Promise.all(
      ["a", "b", "c"].map((id) =>
        catalog.addSurcharge(business.id, service.id, { id, label: id, kind: "flat", amount: 100 }),
      ),
    );

    expect((await catalog.findService(business.id, service.id))?.surcharges).toHaveLength(3);
  });

  it("stops at the option limit and ignores other businesses", async () => {
    const own = await createBusiness();
    const other = await createBusiness("other");
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: own.id, name: "A", rule, surcharges: [] });
    const option = (id: string) => ({ id, label: id, kind: "flat", amount: 100 }) as const;

    for (let i = 0; i < 10; i++) await catalog.addSurcharge(own.id, service.id, option(`o${i}`));

    expect(await catalog.addSurcharge(own.id, service.id, option("extra"))).toBe("limit_reached");
    expect(await catalog.addSurcharge(other.id, service.id, option("x"))).toBe("not_found");
    await catalog.removeSurcharge(other.id, service.id, "o0");
    expect((await catalog.findService(own.id, service.id))?.surcharges).toHaveLength(10);
  });

  it("refuses an invalid option", async () => {
    const business = await createBusiness();
    const rule = { kind: "fixed", price: 1_000 } as const;
    const service = await catalog.createService({ businessId: business.id, name: "A", rule, surcharges: [] });

    await expect(
      catalog.addSurcharge(business.id, service.id, { id: "x", label: "Bad", kind: "percent", percent: 500 }),
    ).rejects.toThrow(PricingConfigError);
  });

  it("treats a malformed id as not found", async () => {
    const business = await createBusiness();
    expect(await catalog.findService(business.id, "not-a-uuid")).toBeNull();
  });
});
