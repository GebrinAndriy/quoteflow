import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">QuoteFlow</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Instant price quotes and lead management for small service businesses. Customers see the
        price before they call, owners get every request in one place.
      </p>
      <Link
        href="/b/demo"
        className="w-fit rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Try the demo calculator
      </Link>
    </main>
  );
}
