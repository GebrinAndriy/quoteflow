import type { Money } from "@/domain/pricing/types";

const uah = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  // Node and browsers ship different ICU data: "₴" vs "грн" would break hydration.
  currencyDisplay: "narrowSymbol",
});

export function formatMoney(kopiykas: Money): string {
  return uah.format(kopiykas / 100);
}
