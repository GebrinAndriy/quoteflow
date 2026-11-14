import type { z } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

// Keyed by the last path part, so a nested field's error shows next to its own input.
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path.at(-1) ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}
