import { QuoteInputError } from "./errors";
import type { Money, PricingKind, PricingRule, QuoteInput } from "./types";

export interface PricingStrategy {
  basePrice(input: QuoteInput): Money;
}

type RuleOf<K extends PricingKind> = Extract<PricingRule, { kind: K }>;
type InputOf<K extends PricingKind> = Extract<QuoteInput, { kind: K }>;

const CM2_PER_SQM = 10_000;

export function perAreaStrategy(rule: RuleOf<"per_area">): PricingStrategy {
  return {
    basePrice(input) {
      const { widthCm, heightCm, quantity } = expectInput(input, "per_area");
      assertPositive(widthCm, "widthCm");
      assertPositive(heightCm, "heightCm");
      assertPositiveInteger(quantity, "quantity");

      const areaSqm = ((widthCm * heightCm) / CM2_PER_SQM) * quantity;
      const price = Math.round(areaSqm * rule.ratePerSqm);
      return Math.max(price, rule.minimumTotal ?? 0);
    },
  };
}

export function perHourStrategy(rule: RuleOf<"per_hour">): PricingStrategy {
  return {
    basePrice(input) {
      const { hours } = expectInput(input, "per_hour");
      assertPositive(hours, "hours");

      const billableHours = Math.max(hours, rule.minimumHours ?? 0);
      return Math.round(billableHours * rule.ratePerHour);
    },
  };
}

export function fixedStrategy(rule: RuleOf<"fixed">): PricingStrategy {
  return {
    basePrice(input) {
      const { quantity } = expectInput(input, "fixed");
      assertPositiveInteger(quantity, "quantity");

      return rule.price * quantity;
    },
  };
}

function expectInput<K extends PricingKind>(
  input: QuoteInput,
  kind: K,
): InputOf<K> {
  if (input.kind !== kind) {
    throw new QuoteInputError(`Expected "${kind}" input, got "${input.kind}"`);
  }
  // TS can't narrow a union by a generic K, the check above makes this safe.
  return input as InputOf<K>;
}

function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new QuoteInputError(`${field} must be a positive number`);
  }
}

function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new QuoteInputError(`${field} must be a positive integer`);
  }
}
