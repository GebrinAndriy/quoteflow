import type { Business } from "../catalog/catalog";

export type UserCredentials = { id: string; email: string; passwordHash: string };

export type NewOwner = {
  email: string;
  passwordHash: string;
  business: { slug: string; name: string };
};

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailTakenError";
  }
}

export class SlugTakenError extends Error {
  constructor() {
    super("This address is already taken");
    this.name = "SlugTakenError";
  }
}

export interface AccountRepository {
  findUserByEmail(email: string): Promise<UserCredentials | null>;
  /** Creates the user and their business atomically; throws EmailTakenError or SlugTakenError. */
  createOwner(owner: NewOwner): Promise<{ userId: string }>;
  findOwnedBusiness(userId: string): Promise<Business | null>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /** With a null hash it still does the same work and returns false, so timing does not reveal unknown emails. */
  verify(password: string, hash: string | null): Promise<boolean>;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
