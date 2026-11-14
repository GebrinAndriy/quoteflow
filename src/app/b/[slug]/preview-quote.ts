import { assertNever } from "@/lib/assert-never";
import { calculateQuote } from "@/domain/pricing/calculate-quote";
import { QuoteInputError } from "@/domain/pricing/errors";
import type { PricingKind, Quote, QuoteInput, Service } from "@/domain/pricing/types";

export type QuoteFields = {
  widthCm: string;
  heightCm: string;
  quantity: string;
  hours: string;
};

export const EMPTY_FIELDS: QuoteFields = { widthCm: "", heightCm: "", quantity: "1", hours: "" };

export function toQuoteInput(kind: PricingKind, fields: QuoteFields): QuoteInput {
  switch (kind) {
    case "per_area":
      return {
        kind,
        widthCm: Number(fields.widthCm),
        heightCm: Number(fields.heightCm),
        quantity: Number(fields.quantity),
      };
    case "per_hour":
      return { kind, hours: Number(fields.hours) };
    case "fixed":
      return { kind, quantity: Number(fields.quantity) };
    default:
      return assertNever(kind);
  }
}

// Returns null while the customer is still typing, the form shows a hint instead of an error.
export function previewQuote(
  service: Service,
  fields: QuoteFields,
  surchargeIds: readonly string[],
): Quote | null {
  try {
    return calculateQuote(service, toQuoteInput(service.rule.kind, fields), surchargeIds);
  } catch (error) {
    if (error instanceof QuoteInputError) return null;
    throw error;
  }
}
