import { beforeEach, describe, expect, it } from "vitest";
import { fakeAccounts, fakeHasher } from "./fakes.test-utils";
import { signIn } from "./sign-in";
import { signUp } from "./sign-up";

let deps: { accounts: ReturnType<typeof fakeAccounts>; hasher: ReturnType<typeof fakeHasher> };

beforeEach(async () => {
  deps = { accounts: fakeAccounts(), hasher: fakeHasher() };
  await signUp(deps, {
    email: "owner@example.com",
    password: "correct horse battery",
    businessName: "Blinds",
    slug: "blinds",
  });
});

describe("signIn", () => {
  it("accepts the right password, ignoring email case", async () => {
    expect(await signIn(deps, "Owner@Example.com", "correct horse battery")).toEqual({
      userId: "user-1",
    });
  });

  it("rejects a wrong password", async () => {
    expect(await signIn(deps, "owner@example.com", "wrong")).toBeNull();
  });

  it("still checks a password for an unknown email", async () => {
    expect(await signIn(deps, "nobody@example.com", "correct horse battery")).toBeNull();
    expect(deps.hasher.verifyCalls).toBe(1);
  });
});
