import { assertNever } from "@/lib/assert-never";
import { createPricingStrategy } from "./create-pricing-strategy";
import { QuoteInputError } from "./errors";
import type { Money, Quote, QuoteInput, QuoteLine, Service, Surcharge } from "./types";
import { validateService } from "./validate-service";

export function calculateQuote(
  service: Service,
  input: QuoteInput,
  selectedSurchargeIds: readonly string[] = [],
): Quote {
  // Services come from the DB, so a bad row must fail loudly instead of quoting a wrong price.
  validateService(service);

  const base = createPricingStrategy(service.rule).basePrice(input);
  const lines: QuoteLine[] = [{ label: service.name, amount: base }];

  // The same option can arrive twice (double click), charge it once.
  for (const id of new Set(selectedSurchargeIds)) {
    const surcharge = service.surcharges.find((s) => s.id === id);
    if (!surcharge) {
      throw new QuoteInputError("Selected option is not available for this service");
    }
    lines.push({ label: surcharge.label, amount: surchargeAmount(surcharge, base) });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total };
}

function surchargeAmount(surcharge: Surcharge, base: Money): Money {
  switch (surcharge.kind) {
    case "flat":
      return surcharge.amount;
    case "percent":
      return Math.round((base * surcharge.percent) / 100);
    default:
      return assertNever(surcharge);
  }
}
