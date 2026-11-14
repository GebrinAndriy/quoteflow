import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { PasswordHasher } from "@/domain/auth/account";

const PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function derive(password: string, salt: Buffer, params: typeof PARAMS): Promise<Buffer> {
  const options: ScryptOptions = { ...params, maxmem: 128 * params.N * params.r * 2 };
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

// Parameters are stored with each hash, so they can be raised later without breaking old passwords.
function encode(params: typeof PARAMS, salt: Buffer, key: Buffer): string {
  return ["scrypt", params.N, params.r, params.p, salt.toString("base64"), key.toString("base64")].join("$");
}

function decode(hash: string) {
  const [algorithm, n, r, p, salt, key] = hash.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return null;
  return {
    params: { N: Number(n), r: Number(r), p: Number(p) },
    salt: Buffer.from(salt, "base64"),
    key: Buffer.from(key, "base64"),
  };
}

let dummyHash: Promise<string> | undefined;

export const scryptHasher: PasswordHasher = {
  async hash(password) {
    const salt = randomBytes(SALT_LENGTH);
    return encode(PARAMS, salt, await derive(password, salt, PARAMS));
  },

  async verify(password, hash) {
    dummyHash ??= scryptHasher.hash("dummy password for unknown users");
    const decoded = decode(hash ?? (await dummyHash));
    if (!decoded) return false;

    const key = await derive(password, decoded.salt, decoded.params);
    return hash !== null && key.length === decoded.key.length && timingSafeEqual(key, decoded.key);
  },
};
