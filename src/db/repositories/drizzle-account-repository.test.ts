import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EmailTakenError, SlugTakenError, type AccountRepository } from "@/domain/auth/account";
import type { SessionRepository } from "@/domain/auth/session";
import type { Database } from "../database";
import { users } from "../schema";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleAccountRepository } from "./drizzle-account-repository";
import { createDrizzleCatalogRepository } from "./drizzle-catalog-repository";
import { createDrizzleSessionRepository } from "./drizzle-session-repository";

let db: Database;
let close: () => Promise<void>;
let accounts: AccountRepository;
let sessions: SessionRepository;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  accounts = createDrizzleAccountRepository(db);
  sessions = createDrizzleSessionRepository(db);
}, 30_000);

afterEach(() => close());

const owner = {
  email: "owner@example.com",
  passwordHash: "scrypt$hash",
  business: { slug: "blinds", name: "Blinds" },
};

describe("accounts", () => {
  it("creates an owner together with their business", async () => {
    const { userId } = await accounts.createOwner(owner);

    expect(await accounts.findUserByEmail("owner@example.com")).toEqual({
      id: userId,
      email: "owner@example.com",
      passwordHash: "scrypt$hash",
    });
    expect(await accounts.findOwnedBusiness(userId)).toMatchObject({ slug: "blinds", name: "Blinds" });
  });

  it("rejects a taken email", async () => {
    await accounts.createOwner(owner);
    await expect(
      accounts.createOwner({ ...owner, business: { slug: "other", name: "Other" } }),
    ).rejects.toThrow(EmailTakenError);
  });

  it("does not keep the user when the business address is taken", async () => {
    await createDrizzleCatalogRepository(db).createBusiness({
      slug: "blinds",
      name: "Someone else",
      telegramChatId: null,
    });

    await expect(accounts.createOwner(owner)).rejects.toThrow(SlugTakenError);
    expect(await db.select().from(users)).toEqual([]);
  });

  it("finds no business for a user who owns none", async () => {
    expect(await accounts.findOwnedBusiness("not-a-uuid")).toBeNull();
  });
});

describe("sessions", () => {
  it("stores, finds and deletes a session", async () => {
    const { userId } = await accounts.createOwner(owner);
    const expiresAt = new Date("2026-12-14T12:00:00Z");

    await sessions.create("token-hash", { userId, expiresAt });
    expect(await sessions.find("token-hash")).toEqual({ userId, expiresAt });

    await sessions.delete("token-hash");
    expect(await sessions.find("token-hash")).toBeNull();
  });
});
