import { describe, expect, it } from "vitest";
import {
  SESSION_TTL_MS,
  replaceSession,
  sessionExpiry,
  validateSession,
  type Session,
  type SessionRepository,
} from "./session";

function fakeSessions(initial: Record<string, Session>): SessionRepository & { rows: Map<string, Session> } {
  const rows = new Map(Object.entries(initial));
  return {
    rows,
    create: async (hash, session) => void rows.set(hash, session),
    find: async (hash) => rows.get(hash) ?? null,
    delete: async (hash) => void rows.delete(hash),
  };
}

const now = new Date("2026-11-14T12:00:00Z");

describe("validateSession", () => {
  it("returns a session that has not expired", async () => {
    const session = { userId: "u1", expiresAt: sessionExpiry(now) };
    const sessions = fakeSessions({ abc: session });

    expect(await validateSession(sessions, "abc", now)).toEqual(session);
  });

  it("returns null for an unknown token", async () => {
    expect(await validateSession(fakeSessions({}), "abc", now)).toBeNull();
  });

  it("deletes an expired session", async () => {
    const sessions = fakeSessions({ abc: { userId: "u1", expiresAt: now } });

    expect(await validateSession(sessions, "abc", now)).toBeNull();
    expect(sessions.rows.has("abc")).toBe(false);
  });
});

describe("replaceSession", () => {
  it("removes the previous session so it does not linger in the database", async () => {
    const session = { userId: "u1", expiresAt: sessionExpiry(now) };
    const sessions = fakeSessions({ old: session });

    await replaceSession(sessions, "old", "new", session);

    expect([...sessions.rows.keys()]).toEqual(["new"]);
  });

  it("just creates a session when there was none", async () => {
    const sessions = fakeSessions({});

    await replaceSession(sessions, null, "new", { userId: "u1", expiresAt: sessionExpiry(now) });

    expect([...sessions.rows.keys()]).toEqual(["new"]);
  });
});

describe("sessionExpiry", () => {
  it("is 30 days from now", () => {
    expect(sessionExpiry(now).getTime() - now.getTime()).toBe(SESSION_TTL_MS);
  });
});
