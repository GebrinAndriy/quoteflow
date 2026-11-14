import { describe, expect, it } from "vitest";
import { parseLeadForm } from "./lead-request-schema";

const serviceId = "6f1c2b9e-3d4a-4f5b-9c8d-1e2f3a4b5c6d";
const idempotencyKey = "0b8e4c1a-7f2d-4e3b-a9c6-5d4e3f2a1b0c";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const v of [value].flat()) data.append(name, v);
  }
  return data;
}

const valid = {
  serviceId,
  idempotencyKey,
  customerName: "  Olena  ",
  phone: "+38 (050) 123-45-67",
  kind: "per_area",
  widthCm: "150",
  heightCm: "200.5",
  quantity: "2",
  surchargeIds: ["install", "motor"],
};

describe("parseLeadForm", () => {
  it("turns form fields into a typed lead request", () => {
    expect(parseLeadForm(form(valid))).toEqual({
      ok: true,
      request: {
        serviceId,
        idempotencyKey,
        customerName: "Olena",
        phone: "+380501234567",
        input: { kind: "per_area", widthCm: 150, heightCm: 200.5, quantity: 2 },
        surchargeIds: ["install", "motor"],
      },
    });
  });

  it("keeps only the fields of the chosen pricing kind", () => {
    const result = parseLeadForm(form({ ...valid, kind: "per_hour", hours: "3" }));
    expect(result.ok && result.request.input).toEqual({ kind: "per_hour", hours: 3 });
  });

  it("drops an empty comment", () => {
    const result = parseLeadForm(form({ ...valid, comment: "   " }));
    expect(result.ok && result.request.comment).toBeUndefined();
  });

  it("reports errors next to the fields that caused them", () => {
    const result = parseLeadForm(
      form({ ...valid, customerName: "", phone: "call me", widthCm: "-5", quantity: "1.5" }),
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.fieldErrors).sort()).toEqual([
      "customerName",
      "phone",
      "quantity",
      "widthCm",
    ]);
  });

  it("rejects an unknown pricing kind", () => {
    const result = parseLeadForm(form({ ...valid, kind: "per_banana" }));
    expect(result.ok).toBe(false);
  });

  it("rejects a missing idempotency key", () => {
    const data = form(valid);
    data.delete("idempotencyKey");
    expect(parseLeadForm(data).ok).toBe(false);
  });
});
