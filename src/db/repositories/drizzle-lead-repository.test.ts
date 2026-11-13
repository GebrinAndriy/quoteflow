import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LeadConflictError, type LeadRepository, type NewLead } from "@/domain/leads/lead";
import { transitionLead } from "@/domain/leads/transition-lead";
import { calculateQuote } from "@/domain/pricing/calculate-quote";
import type { QuoteInput } from "@/domain/pricing/types";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleCatalogRepository } from "./drizzle-catalog-repository";
import { createDrizzleLeadRepository } from "./drizzle-lead-repository";

let close: () => Promise<void>;
let leads: LeadRepository;
let makeLead: (overrides?: Partial<NewLead>) => NewLead;
let otherBusinessId: string;

beforeEach(async () => {
  const testDb = await createTestDb();
  close = testDb.close;
  const catalog = createDrizzleCatalogRepository(testDb.db);
  leads = createDrizzleLeadRepository(testDb.db);

  const business = await catalog.createBusiness({ slug: "blinds", name: "Blinds", telegramChatId: null });
  const other = await catalog.createBusiness({ slug: "other", name: "Other", telegramChatId: null });
  otherBusinessId = other.id;
  const service = await catalog.createService({
    businessId: business.id,
    name: "Roller blinds",
    rule: { kind: "per_area", ratePerSqm: 50_000 },
    surcharges: [],
  });

  const input: QuoteInput = { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 1 };
  let counter = 0;
  makeLead = (overrides = {}) => ({
    businessId: business.id,
    serviceId: service.id,
    customerName: "Olena",
    phone: "+380501234567",
    input,
    quote: calculateQuote(service, input),
    idempotencyKey: `key-${++counter}`,
    ...overrides,
  });
}, 30_000);

afterEach(() => close());

const at = new Date("2026-11-13T10:00:00Z");

describe("create", () => {
  it("saves a new lead with status new and the quote snapshot", async () => {
    const { lead, created } = await leads.create(makeLead());

    expect(created).toBe(true);
    expect(lead.status).toBe("new");
    expect(lead.quote.total).toBe(150_000);
    expect(await leads.findById(lead.businessId, lead.id)).toEqual(lead);
  });

  it("returns the existing lead when the same form is submitted twice", async () => {
    const draft = makeLead({ idempotencyKey: "same" });
    const first = await leads.create(draft);
    const second = await leads.create(draft);

    expect(second.created).toBe(false);
    expect(second.lead.id).toBe(first.lead.id);
    expect(await leads.listByBusiness(draft.businessId)).toHaveLength(1);
  });

  it("does not leak a lead through a key reused by another business", async () => {
    await leads.create(makeLead({ idempotencyKey: "shared" }));
    await expect(
      leads.create(makeLead({ idempotencyKey: "shared", businessId: otherBusinessId })),
    ).rejects.toThrow();
  });
});

describe("findById", () => {
  it("is scoped to the business", async () => {
    const { lead } = await leads.create(makeLead());
    expect(await leads.findById(otherBusinessId, lead.id)).toBeNull();
  });
});

describe("saveTransition", () => {
  it("persists the new status and its history", async () => {
    const { lead } = await leads.create(makeLead());
    const contacted = transitionLead(lead, "contacted", at, "Called back");

    await leads.saveTransition(lead.businessId, lead.id, contacted.history[0]);

    const saved = await leads.findById(lead.businessId, lead.id);
    expect(saved?.status).toBe("contacted");
    expect(saved?.history).toEqual([{ from: "new", to: "contacted", at, note: "Called back" }]);
  });

  it("rejects a change based on a stale status", async () => {
    const { lead } = await leads.create(makeLead());
    const change = transitionLead(lead, "contacted", at).history[0];

    await leads.saveTransition(lead.businessId, lead.id, change);
    await expect(leads.saveTransition(lead.businessId, lead.id, change)).rejects.toThrow(
      LeadConflictError,
    );

    expect((await leads.findById(lead.businessId, lead.id))?.history).toHaveLength(1);
  });
});

describe("listByBusiness", () => {
  it("filters by status and returns the newest first", async () => {
    const { lead: older } = await leads.create(makeLead());
    const { lead: newer } = await leads.create(makeLead());
    const { lead: contacted } = await leads.create(makeLead());
    await leads.saveTransition(
      contacted.businessId,
      contacted.id,
      transitionLead(contacted, "contacted", at).history[0],
    );

    const fresh = await leads.listByBusiness(older.businessId, { status: "new" });
    expect(fresh.map((l) => l.id)).toEqual([newer.id, older.id]);
  });

  it("does not include other businesses' leads", async () => {
    await leads.create(makeLead());
    expect(await leads.listByBusiness(otherBusinessId)).toEqual([]);
  });
});
