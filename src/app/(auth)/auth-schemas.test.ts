import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth-schemas";

const valid = {
  email: "owner@example.com",
  password: "correct horse",
  businessName: " Blinds Kyiv ",
  slug: " Blinds-Kyiv ",
};

describe("signUpSchema", () => {
  it("accepts valid input and normalizes the address", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      ...valid,
      businessName: "Blinds Kyiv",
      slug: "blinds-kyiv",
    });
  });

  it.each(["ab", "-blinds", "blinds-", "блайнди", "blinds kyiv", "a".repeat(41)])(
    "rejects the address %j",
    (slug) => {
      expect(signUpSchema.safeParse({ ...valid, slug }).success).toBe(false);
    },
  );

  it("rejects short and very long passwords", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "x".repeat(129) }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "owner@" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires both fields", () => {
    expect(signInSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });
});
