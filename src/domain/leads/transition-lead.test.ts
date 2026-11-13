import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, isLeadStatus, LEAD_STATUSES } from "./lead-status";
import { LeadTransitionError, transitionLead, type StatusChange } from "./transition-lead";

const at = new Date("2026-11-13T10:00:00Z");

function newLead() {
  return { id: "lead-1", status: "new" as const, history: [] as StatusChange[] };
}

describe("lead status rules", () => {
  it("follows the sales funnel", () => {
    expect(canTransition("new", "contacted")).toBe(true);
    expect(canTransition("contacted", "quoted")).toBe(true);
    expect(canTransition("quoted", "won")).toBe(true);
  });

  it("does not allow skipping steps", () => {
    expect(canTransition("new", "won")).toBe(false);
    expect(canTransition("new", "quoted")).toBe(false);
  });

  it("treats won as final", () => {
    expect(allowedTransitions("won")).toEqual([]);
  });

  it("lets a lost lead be reopened", () => {
    expect(canTransition("lost", "contacted")).toBe(true);
  });

  it("allows losing a lead at any open stage", () => {
    for (const status of ["new", "contacted", "quoted"] as const) {
      expect(canTransition(status, "lost")).toBe(true);
    }
  });

  it("never allows a transition to the same status", () => {
    for (const status of LEAD_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("recognises valid status strings only", () => {
    expect(isLeadStatus("quoted")).toBe(true);
    expect(isLeadStatus("archived")).toBe(false);
    expect(isLeadStatus(42)).toBe(false);
  });
});

describe("transitionLead", () => {
  it("changes status and records the change in history", () => {
    const lead = transitionLead(newLead(), "contacted", at, "Called, will measure on Monday");

    expect(lead.status).toBe("contacted");
    expect(lead.history).toEqual([
      { from: "new", to: "contacted", at, note: "Called, will measure on Monday" },
    ]);
  });

  it("does not mutate the original lead", () => {
    const original = newLead();
    transitionLead(original, "contacted", at);

    expect(original.status).toBe("new");
    expect(original.history).toEqual([]);
  });

  it("keeps the other lead fields", () => {
    expect(transitionLead(newLead(), "contacted", at).id).toBe("lead-1");
  });

  it("rejects a forbidden transition", () => {
    expect(() => transitionLead(newLead(), "won", at)).toThrow(LeadTransitionError);
  });
});
