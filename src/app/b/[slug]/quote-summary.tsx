import type { Quote } from "@/domain/pricing/types";
import { formatMoney } from "@/lib/format-money";

export function QuoteSummary({ quote }: { quote: Quote | null }) {
  if (!quote) {
    return (
      <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        Fill in the details to see the price.
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900" aria-live="polite">
      <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        {quote.lines.map((line) => (
          <li key={line.label} className="flex justify-between gap-4">
            <span>{line.label}</span>
            <span className="tabular-nums">{formatMoney(line.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-zinc-300 pt-3 text-lg font-semibold dark:border-zinc-700">
        <span>Total</span>
        <span className="tabular-nums">{formatMoney(quote.total)}</span>
      </p>
    </div>
  );
}
