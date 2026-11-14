import { describe, expect, it } from "vitest";
import type { Service } from "@/domain/pricing/types";
import { EMPTY_FIELDS, previewQuote } from "./preview-quote";

const cleaning: Service = {
  id: "s1",
  name: "Apartment cleaning",
  rule: { kind: "per_hour", ratePerHour: 40_000, minimumHours: 2 },
  surcharges: [{ id: "windows", label: "Windows", kind: "percent", percent: 25 }],
};

describe("previewQuote", () => {
  it("calculates the price from what the customer typed", () => {
    const quote = previewQuote(cleaning, { ...EMPTY_FIELDS, hours: "3" }, ["windows"]);
    expect(quote?.total).toBe(150_000);
  });

  it("returns null while a required field is empty", () => {
    expect(previewQuote(cleaning, EMPTY_FIELDS, [])).toBeNull();
  });

  it("returns null for a value that is not a number", () => {
    expect(previewQuote(cleaning, { ...EMPTY_FIELDS, hours: "abc" }, [])).toBeNull();
  });
});
