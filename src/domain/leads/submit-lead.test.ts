import { beforeEach, describe, expect, it } from "vitest";
import type { Business, CatalogRepository } from "../catalog/catalog";
import type { Service } from "../pricing/types";
import type { Lead, LeadRepository } from "./lead";
import { submitLead, type LeadRequest } from "./submit-lead";

const blinds: Business = { id: "b1", slug: "blinds", name: "Blinds", telegramChatId: null };
const other: Business = { id: "b2", slug: "other", name: "Other", telegramChatId: null };

const rollerBlinds: Service = {
  id: "s1",
  name: "Roller blinds",
  rule: { kind: "per_area", ratePerSqm: 50_000 },
  surcharges: [{ id: "install", label: "Installation", kind: "flat", amount: 30_000 }],
};
const foreignService: Service = { ...rollerBlinds, id: "s2" };

function fakeCatalog(): CatalogRepository {
  const servicesByBusiness: Record<string, Service[]> = {
    [blinds.id]: [rollerBlinds],
    [other.id]: [foreignService],
  };
  return {
    findBusinessBySlug: async (slug) => [blinds, other].find((b) => b.slug === slug) ?? null,
    findService: async (businessId, serviceId) =>
      servicesByBusiness[businessId]?.find((s) => s.id === serviceId) ?? null,
    listActiveServices: async (businessId) => servicesByBusiness[businessId] ?? [],
    createBusiness: async () => {
      throw new Error("not used");
    },
    createService: async () => {
      throw new Error("not used");
    },
  };
}

function fakeLeads(): LeadRepository & { saved: Lead[] } {
  const saved: Lead[] = [];
  const keys = new Map<string, Lead>();
  return {
    saved,
    async create(draft) {
      const existing = keys.get(draft.idempotencyKey);
      if (existing) return { lead: existing, created: false };
      const lead: Lead = {
        ...draft,
        id: `lead-${saved.length + 1}`,
        comment: draft.comment ?? null,
        status: "new",
        createdAt: new Date(),
        history: [],
      };
      saved.push(lead);
      keys.set(draft.idempotencyKey, lead);
      return { lead, created: true };
    },
    findById: async () => null,
    listByBusiness: async () => [],
    saveTransition: async () => {},
  };
}

let deps: { catalog: CatalogRepository; leads: ReturnType<typeof fakeLeads> };

beforeEach(() => {
  deps = { catalog: fakeCatalog(), leads: fakeLeads() };
});

function request(overrides: Partial<LeadRequest> = {}): LeadRequest {
  return {
    serviceId: rollerBlinds.id,
    customerName: "Olena",
    phone: "+380501234567",
    input: { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 1 },
    surchargeIds: ["install"],
    idempotencyKey: "key-1",
    ...overrides,
  };
}

describe("submitLead", () => {
  it("saves the lead with a quote calculated on the server", async () => {
    const result = await submitLead(deps, "blinds", request());

    expect(result).toEqual({ ok: true, leadId: "lead-1", total: 180_000 });
    expect(deps.leads.saved[0].quote.lines).toEqual([
      { label: "Roller blinds", amount: 150_000 },
      { label: "Installation", amount: 30_000 },
    ]);
  });

  it("does not create a second lead when the form is sent twice", async () => {
    const first = await submitLead(deps, "blinds", request());
    const second = await submitLead(deps, "blinds", request());

    expect(second).toEqual(first);
    expect(deps.leads.saved).toHaveLength(1);
  });

  it("rejects an unknown business", async () => {
    const result = await submitLead(deps, "nope", request());
    expect(result).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("rejects a service that belongs to another business", async () => {
    const result = await submitLead(deps, "blinds", request({ serviceId: foreignService.id }));

    expect(result).toMatchObject({ ok: false, reason: "not_found" });
    expect(deps.leads.saved).toHaveLength(0);
  });

  it("rejects input that does not fit the pricing rule", async () => {
    const result = await submitLead(deps, "blinds", request({ input: { kind: "per_hour", hours: 2 } }));
    expect(result).toMatchObject({ ok: false, reason: "invalid_input" });
  });

  it("rejects an option the service does not offer", async () => {
    const result = await submitLead(deps, "blinds", request({ surchargeIds: ["gold-plating"] }));

    expect(result).toMatchObject({ ok: false, reason: "invalid_input" });
    expect(deps.leads.saved).toHaveLength(0);
  });
});
