import { describe, expect, it } from "vitest";
import { changeLeadStatus } from "./change-lead-status";
import { LeadConflictError, type LeadRepository } from "./lead";
import type { LeadStatus } from "./lead-status";
import type { StatusChange } from "./transition-lead";

const now = new Date("2026-11-14T12:00:00Z");

function fakeLeads(status: LeadStatus) {
  const saved: StatusChange[] = [];
  const repository: Pick<LeadRepository, "saveTransition"> = {
    async saveTransition(_businessId, _leadId, change) {
      if (change.from !== status) throw new LeadConflictError();
      status = change.to;
      saved.push(change);
    },
  };
  return { leads: repository as LeadRepository, saved };
}

const request = { businessId: "b1", leadId: "l1" };

describe("changeLeadStatus", () => {
  it("saves an allowed change with its time and note", async () => {
    const { leads, saved } = fakeLeads("new");

    const result = await changeLeadStatus(
      leads,
      { ...request, from: "new", to: "contacted", note: "Called back" },
      now,
    );

    expect(result).toEqual({ ok: true });
    expect(saved).toEqual([{ from: "new", to: "contacted", at: now, note: "Called back" }]);
  });

  it("rejects a change the funnel does not allow without touching storage", async () => {
    const { leads, saved } = fakeLeads("new");

    expect(await changeLeadStatus(leads, { ...request, from: "new", to: "won" }, now)).toEqual({
      ok: false,
      reason: "forbidden",
    });
    expect(saved).toEqual([]);
  });

  it("reports a conflict when the lead changed since the owner saw it", async () => {
    const { leads } = fakeLeads("lost");

    expect(await changeLeadStatus(leads, { ...request, from: "new", to: "contacted" }, now)).toEqual({
      ok: false,
      reason: "conflict",
    });
  });

  it("does not hide unexpected storage errors", async () => {
    const leads = {
      saveTransition: async () => {
        throw new Error("connection lost");
      },
    } as unknown as LeadRepository;

    await expect(
      changeLeadStatus(leads, { ...request, from: "new", to: "contacted" }, now),
    ).rejects.toThrow("connection lost");
  });
});
