import { z } from "zod";
import type { BusinessContacts } from "@/domain/catalog/catalog";
import { phoneSchema } from "@/lib/phone-schema";

export const MAX_ADDRESS_LINES = 5;

const phone = z
  .string()
  .optional()
  .transform((text) => text?.trim() || undefined)
  .pipe(phoneSchema.optional());

const address = z
  .string()
  .optional()
  .transform((text) =>
    (text ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  )
  .refine((lines) => lines.length <= MAX_ADDRESS_LINES, `Use at most ${MAX_ADDRESS_LINES} lines`)
  .refine((lines) => lines.every((line) => line.length <= 100), "Each line can have at most 100 characters");

export const contactsFormSchema = z
  .object({ phone, address })
  .transform(({ phone, address }): BusinessContacts => ({
    phone: phone ?? null,
    address: address.length > 0 ? address.join("\n") : null,
  }));
