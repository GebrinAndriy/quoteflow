import { describe, expect, it } from "vitest";
import { scryptHasher } from "./scrypt-hasher";
import { generateSessionToken, hashSessionToken } from "./session-token";

describe("scryptHasher", () => {
  it("verifies the password it hashed", async () => {
    const hash = await scryptHasher.hash("correct horse battery");

    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(await scryptHasher.verify("correct horse battery", hash)).toBe(true);
    expect(await scryptHasher.verify("correct horse batterY", hash)).toBe(false);
  });

  it("salts every hash", async () => {
    const [a, b] = await Promise.all([scryptHasher.hash("same"), scryptHasher.hash("same")]);
    expect(a).not.toBe(b);
  });

  it("returns false without a stored hash", async () => {
    expect(await scryptHasher.verify("dummy password for unknown users", null)).toBe(false);
  });

  it("returns false for a malformed hash", async () => {
    expect(await scryptHasher.verify("anything", "md5$abc")).toBe(false);
  });
});

describe("session tokens", () => {
  it("are random and stored only as a hash", () => {
    const token = generateSessionToken();

    expect(token).not.toBe(generateSessionToken());
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });
});
