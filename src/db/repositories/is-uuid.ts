import { z } from "zod";

const uuidSchema = z.uuid();

// Postgres throws on malformed uuids; treating them as "not found" keeps that a 404, not a 500.
export function isUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}
