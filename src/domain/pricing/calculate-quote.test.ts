import { describe, expect, it } from "vitest";
import { calculateQuote } from "./calculate-quote";
import { QuoteInputError } from "./errors";
import type { QuoteInput, Service } from "./types";

const rollerBlinds: Service = {
  id: "roller-blinds",
  name: "Roller blinds",
  rule: { kind: "per_area", ratePerSqm: 50_000 },
  surcharges: [
    { id: "install", label: "Installation", kind: "flat", amount: 50_000 },
    { id: "urgent", label: "Urgent order", kind: "percent", percent: 20 },
  ],
};

// 3 m² → 1500 UAH base
const windowInput: QuoteInput = { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 1 };

describe("calculateQuote", () => {
  it("returns a single base line when no surcharges are selected", () => {
    expect(calculateQuote(rollerBlinds, windowInput)).toEqual({
      lines: [{ label: "Roller blinds", amount: 150_000 }],
      total: 150_000,
    });
  });

  it("itemises flat and percent surcharges", () => {
    const quote = calculateQuote(rollerBlinds, windowInput, ["install", "urgent"]);

    expect(quote.lines).toEqual([
      { label: "Roller blinds", amount: 150_000 },
      { label: "Installation", amount: 50_000 },
      { label: "Urgent order", amount: 30_000 },
    ]);
    expect(quote.total).toBe(230_000);
  });

  it("takes percent surcharges from the base price only, so they do not compound", () => {
    const quote = calculateQuote(rollerBlinds, windowInput, ["urgent", "install"]);
    expect(quote.total).toBe(230_000);
  });

  it("counts a surcharge selected twice only once", () => {
    const quote = calculateQuote(rollerBlinds, windowInput, ["install", "install"]);
    expect(quote.total).toBe(200_000);
  });

  it("rejects unknown surcharges", () => {
    expect(() => calculateQuote(rollerBlinds, windowInput, ["free-delivery"])).toThrow(
      QuoteInputError,
    );
  });
});
