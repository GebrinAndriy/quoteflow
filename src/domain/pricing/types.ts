// Integer kopiykas: floats lose precision on money.
export type Money = number;

export type PricingRule =
  | { kind: "per_area"; ratePerSqm: Money; minimumTotal?: Money }
  | { kind: "per_hour"; ratePerHour: Money; minimumHours?: number }
  | { kind: "fixed"; price: Money };

export type PricingKind = PricingRule["kind"];

export type Surcharge = {
  id: string;
  label: string;
} & ({ kind: "flat"; amount: Money } | { kind: "percent"; percent: number });

export type QuoteInput =
  | { kind: "per_area"; widthCm: number; heightCm: number; quantity: number }
  | { kind: "per_hour"; hours: number }
  | { kind: "fixed"; quantity: number };

export type Service = {
  id: string;
  name: string;
  rule: PricingRule;
  surcharges: Surcharge[];
};

export type QuoteLine = {
  label: string;
  amount: Money;
};

export type Quote = {
  lines: QuoteLine[];
  total: Money;
};
