import { assertNever } from "@/lib/assert-never";
import {
  fixedStrategy,
  perAreaStrategy,
  perHourStrategy,
  type PricingStrategy,
} from "./strategies";
import type { PricingRule } from "./types";

export function createPricingStrategy(rule: PricingRule): PricingStrategy {
  switch (rule.kind) {
    case "per_area":
      return perAreaStrategy(rule);
    case "per_hour":
      return perHourStrategy(rule);
    case "fixed":
      return fixedStrategy(rule);
    default:
      return assertNever(rule);
  }
}
