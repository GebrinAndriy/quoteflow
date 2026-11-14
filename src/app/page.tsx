import Link from "next/link";
import { primaryButtonClass } from "@/components/primary-button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">QuoteFlow</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Instant price quotes and lead management for small service businesses. Customers see the
        price before they call, owners get every request in one place.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/sign-up" className={primaryButtonClass}>
          Create your business
        </Link>
        <Link href="/b/demo" className="font-medium underline underline-offset-4">
          Try the demo calculator
        </Link>
        <Link href="/sign-in" className="font-medium underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </main>
  );
}
