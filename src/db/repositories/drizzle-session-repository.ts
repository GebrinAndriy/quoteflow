import { eq } from "drizzle-orm";
import type { SessionRepository } from "@/domain/auth/session";
import type { Database } from "../database";
import { sessions } from "../schema";

export function createDrizzleSessionRepository(db: Database): SessionRepository {
  return {
    async create(tokenHash, { userId, expiresAt }) {
      await db.insert(sessions).values({ tokenHash, userId, expiresAt });
    },

    async find(tokenHash) {
      const [row] = await db
        .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
        .from(sessions)
        .where(eq(sessions.tokenHash, tokenHash))
        .limit(1);
      return row ?? null;
    },

    async delete(tokenHash) {
      await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    },
  };
}
