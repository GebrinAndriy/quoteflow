import { beforeEach, describe, expect, it } from "vitest";
import { fakeAccounts, fakeHasher } from "./fakes.test-utils";
import { signUp, type SignUpInput } from "./sign-up";

let deps: { accounts: ReturnType<typeof fakeAccounts>; hasher: ReturnType<typeof fakeHasher> };

beforeEach(() => {
  deps = { accounts: fakeAccounts(), hasher: fakeHasher() };
});

const input: SignUpInput = {
  email: "  Owner@Example.com ",
  password: "correct horse battery",
  businessName: "Blinds Kyiv",
  slug: "blinds-kyiv",
};

describe("signUp", () => {
  it("creates the owner with a normalized email and a hashed password", async () => {
    const result = await signUp(deps, input);

    expect(result).toEqual({ ok: true, userId: "user-1" });
    expect(deps.accounts.owners[0]).toEqual({
      email: "owner@example.com",
      passwordHash: "hashed:correct horse battery",
      business: { slug: "blinds-kyiv", name: "Blinds Kyiv" },
    });
  });

  it("reports a taken email on the email field", async () => {
    await signUp(deps, input);
    const result = await signUp(deps, { ...input, email: "OWNER@example.com", slug: "other" });

    expect(result).toMatchObject({ ok: false, field: "email" });
  });

  it("reports a taken address on the slug field", async () => {
    await signUp(deps, input);
    const result = await signUp(deps, { ...input, email: "second@example.com" });

    expect(result).toMatchObject({ ok: false, field: "slug" });
  });
});
