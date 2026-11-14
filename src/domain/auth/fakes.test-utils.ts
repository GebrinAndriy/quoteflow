import {
  EmailTakenError,
  SlugTakenError,
  type AccountRepository,
  type NewOwner,
  type PasswordHasher,
} from "./account";

export function fakeHasher(): PasswordHasher & { verifyCalls: number } {
  const hasher = {
    verifyCalls: 0,
    hash: async (password: string) => `hashed:${password}`,
    verify: async (password: string, hash: string | null) => {
      hasher.verifyCalls++;
      return hash === `hashed:${password}`;
    },
  };
  return hasher;
}

export function fakeAccounts(): AccountRepository & { owners: NewOwner[] } {
  const owners: NewOwner[] = [];
  return {
    owners,
    async findUserByEmail(email) {
      const index = owners.findIndex((o) => o.email === email);
      return index === -1 ? null : { id: `user-${index + 1}`, ...owners[index] };
    },
    async createOwner(owner) {
      if (owners.some((o) => o.email === owner.email)) throw new EmailTakenError();
      if (owners.some((o) => o.business.slug === owner.business.slug)) throw new SlugTakenError();
      owners.push(owner);
      return { userId: `user-${owners.length}` };
    },
    findOwnedBusiness: async () => null,
  };
}
