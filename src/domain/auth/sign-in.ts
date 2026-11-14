import { normalizeEmail, type AccountRepository, type PasswordHasher } from "./account";

type Deps = { accounts: AccountRepository; hasher: PasswordHasher };

export async function signIn(
  { accounts, hasher }: Deps,
  email: string,
  password: string,
): Promise<{ userId: string } | null> {
  const user = await accounts.findUserByEmail(normalizeEmail(email));
  // Verify even without a user: the same response time for unknown emails and wrong passwords.
  const valid = await hasher.verify(password, user?.passwordHash ?? null);
  return user && valid ? { userId: user.id } : null;
}
