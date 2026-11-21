import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{10,15}$/, "Enter a phone number, e.g. +353871234567"));
