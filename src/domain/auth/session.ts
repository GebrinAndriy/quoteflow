export type Session = { userId: string; expiresAt: Date };

export interface SessionRepository {
  create(tokenHash: string, session: Session): Promise<void>;
  find(tokenHash: string): Promise<Session | null>;
  delete(tokenHash: string): Promise<void>;
}

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function sessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export async function replaceSession(
  sessions: SessionRepository,
  previousTokenHash: string | null,
  tokenHash: string,
  session: Session,
): Promise<void> {
  if (previousTokenHash) await sessions.delete(previousTokenHash);
  await sessions.create(tokenHash, session);
}

export async function validateSession(
  sessions: SessionRepository,
  tokenHash: string,
  now: Date,
): Promise<Session | null> {
  const session = await sessions.find(tokenHash);
  if (!session) return null;

  if (session.expiresAt.getTime() <= now.getTime()) {
    await sessions.delete(tokenHash);
    return null;
  }
  return session;
}
