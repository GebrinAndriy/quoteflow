import { describe, expect, it } from "vitest";
import { formatMoney } from "./format-money";

// Intl uses non-breaking spaces as thousand separators.
const normalize = (s: string) => s.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("formats kopiykas as hryvnias", () => {
    expect(normalize(formatMoney(150_050))).toBe("1 500,50 ₴");
  });

  it("formats zero", () => {
    expect(normalize(formatMoney(0))).toBe("0,00 ₴");
  });
});
