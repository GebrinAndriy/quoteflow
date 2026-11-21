import { describe, expect, it } from "vitest";
import { formatPhone } from "./format-phone";

describe("formatPhone", () => {
  it("groups an Irish mobile number", () => {
    expect(formatPhone("+353871234567")).toBe("+353 87 123 4567");
  });

  it("groups an Irish mobile number written without the country code", () => {
    expect(formatPhone("0854927104")).toBe("085 492 7104");
  });

  it("leaves other numbers as they are", () => {
    expect(formatPhone("+4915112345678")).toBe("+4915112345678");
    expect(formatPhone("+35312345678")).toBe("+35312345678");
  });
});
