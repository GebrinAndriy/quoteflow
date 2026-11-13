import { describe, expect, it } from "vitest";
import { createPricingStrategy } from "./create-pricing-strategy";
import { QuoteInputError } from "./errors";
import { MAX_DIMENSION_CM, MAX_HOURS, MAX_QUANTITY } from "./strategies";

describe("per_area strategy", () => {
  const strategy = createPricingStrategy({ kind: "per_area", ratePerSqm: 50_000 });

  it("multiplies area in square metres by rate and quantity", () => {
    const price = strategy.basePrice({
      kind: "per_area",
      widthCm: 150,
      heightCm: 200,
      quantity: 2,
    });
    expect(price).toBe(300_000);
  });

  it("rounds to whole kopiykas", () => {
    const cheap = createPricingStrategy({ kind: "per_area", ratePerSqm: 12_345 });
    expect(cheap.basePrice({ kind: "per_area", widthCm: 10, heightCm: 10, quantity: 1 })).toBe(123);
  });

  it("applies the minimum total to small orders", () => {
    const withMinimum = createPricingStrategy({
      kind: "per_area",
      ratePerSqm: 50_000,
      minimumTotal: 20_000,
    });
    expect(
      withMinimum.basePrice({ kind: "per_area", widthCm: 30, heightCm: 30, quantity: 1 }),
    ).toBe(20_000);
  });

  it.each([
    { widthCm: 0, heightCm: 100, quantity: 1 },
    { widthCm: -10, heightCm: 100, quantity: 1 },
    { widthCm: 100, heightCm: Number.NaN, quantity: 1 },
    { widthCm: 100, heightCm: 100, quantity: 1.5 },
    { widthCm: 100, heightCm: 100, quantity: 0 },
    { widthCm: MAX_DIMENSION_CM + 1, heightCm: 100, quantity: 1 },
    { widthCm: 100, heightCm: 100, quantity: MAX_QUANTITY + 1 },
    { widthCm: Number.POSITIVE_INFINITY, heightCm: 100, quantity: 1 },
  ])("rejects invalid measurements %o", (measurements) => {
    expect(() => strategy.basePrice({ kind: "per_area", ...measurements })).toThrow(
      QuoteInputError,
    );
  });
});

describe("per_hour strategy", () => {
  it("charges for fractional hours", () => {
    const strategy = createPricingStrategy({ kind: "per_hour", ratePerHour: 40_000 });
    expect(strategy.basePrice({ kind: "per_hour", hours: 1.5 })).toBe(60_000);
  });

  it("bills at least the minimum hours", () => {
    const strategy = createPricingStrategy({
      kind: "per_hour",
      ratePerHour: 40_000,
      minimumHours: 2,
    });
    expect(strategy.basePrice({ kind: "per_hour", hours: 1 })).toBe(80_000);
  });

  it.each([0, -1, Number.NaN, MAX_HOURS + 1])("rejects %s hours", (hours) => {
    const strategy = createPricingStrategy({ kind: "per_hour", ratePerHour: 40_000 });
    expect(() => strategy.basePrice({ kind: "per_hour", hours })).toThrow(QuoteInputError);
  });
});

describe("fixed strategy", () => {
  it("multiplies price by quantity", () => {
    const strategy = createPricingStrategy({ kind: "fixed", price: 150_000 });
    expect(strategy.basePrice({ kind: "fixed", quantity: 3 })).toBe(450_000);
  });

  it.each([0, -2, 1.5, MAX_QUANTITY + 1])("rejects quantity %s", (quantity) => {
    const strategy = createPricingStrategy({ kind: "fixed", price: 150_000 });
    expect(() => strategy.basePrice({ kind: "fixed", quantity })).toThrow(QuoteInputError);
  });
});

describe("input that does not match the rule", () => {
  it("is rejected instead of producing a wrong price", () => {
    const strategy = createPricingStrategy({ kind: "per_area", ratePerSqm: 50_000 });
    expect(() => strategy.basePrice({ kind: "per_hour", hours: 2 })).toThrow(QuoteInputError);
  });
});
