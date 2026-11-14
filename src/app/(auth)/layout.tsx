import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        QuoteFlow
      </Link>
      {children}
    </main>
  );
}
