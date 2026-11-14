import {
  EmailTakenError,
  SlugTakenError,
  normalizeEmail,
  type AccountRepository,
  type PasswordHasher,
} from "./account";

export type SignUpInput = {
  email: string;
  password: string;
  businessName: string;
  slug: string;
};

export type SignUpResult =
  | { ok: true; userId: string }
  | { ok: false; field: "email" | "slug"; message: string };

type Deps = { accounts: AccountRepository; hasher: PasswordHasher };

export async function signUp({ accounts, hasher }: Deps, input: SignUpInput): Promise<SignUpResult> {
  try {
    const { userId } = await accounts.createOwner({
      email: normalizeEmail(input.email),
      passwordHash: await hasher.hash(input.password),
      business: { slug: input.slug, name: input.businessName },
    });
    return { ok: true, userId };
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { ok: false, field: "email", message: error.message };
    }
    if (error instanceof SlugTakenError) {
      return { ok: false, field: "slug", message: error.message };
    }
    throw error;
  }
}
