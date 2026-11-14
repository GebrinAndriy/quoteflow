import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getRepositories } from "@/db/get-repositories";
import { replaceSession, sessionExpiry, validateSession } from "@/domain/auth/session";
import { generateSessionToken, hashSessionToken } from "./session-token";

const SESSION_COOKIE = "qf_session";

export async function startSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const previousToken = cookieStore.get(SESSION_COOKIE)?.value;
  const token = generateSessionToken();
  const expiresAt = sessionExpiry(new Date());
  await replaceSession(
    getRepositories().sessions,
    previousToken ? hashSessionToken(previousToken) : null,
    hashSessionToken(token),
    { userId, expiresAt },
  );

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await getRepositories().sessions.delete(hashSessionToken(token));
  cookieStore.delete(SESSION_COOKIE);
}

// cache() dedupes the lookup when several components of one render need the owner.
export const getCurrentOwner = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // Expiry depends on the current time, so this must never be part of a prerender.
  await connection();
  const { sessions, accounts } = getRepositories();
  const session = await validateSession(sessions, hashSessionToken(token), new Date());
  if (!session) return null;

  return { userId: session.userId, business: await accounts.findOwnedBusiness(session.userId) };
});

export async function requireOwner() {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/sign-in");
  return owner;
}
