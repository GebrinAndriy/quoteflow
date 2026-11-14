import { asc, eq } from "drizzle-orm";
import { EmailTakenError, SlugTakenError, type AccountRepository } from "@/domain/auth/account";
import type { Database } from "../database";
import { businesses, users } from "../schema";
import { isUuid } from "./is-uuid";

export function createDrizzleAccountRepository(db: Database): AccountRepository {
  return {
    async findUserByEmail(email) {
      const [row] = await db
        .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return row ?? null;
    },

    async createOwner({ email, passwordHash, business }) {
      // ON CONFLICT instead of a pre-check: two sign-ups racing for one email cannot both pass.
      return db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email, passwordHash })
          .onConflictDoNothing({ target: users.email })
          .returning({ id: users.id });
        if (!user) throw new EmailTakenError();

        const [created] = await tx
          .insert(businesses)
          .values({ ownerId: user.id, slug: business.slug, name: business.name })
          .onConflictDoNothing({ target: businesses.slug })
          .returning({ id: businesses.id });
        if (!created) throw new SlugTakenError();

        return { userId: user.id };
      });
    },

    async findOwnedBusiness(userId) {
      if (!isUuid(userId)) return null;
      const [row] = await db
        .select({
          id: businesses.id,
          slug: businesses.slug,
          name: businesses.name,
          telegramChatId: businesses.telegramChatId,
        })
        .from(businesses)
        .where(eq(businesses.ownerId, userId))
        .orderBy(asc(businesses.createdAt))
        .limit(1);
      return row ?? null;
    },
  };
}
