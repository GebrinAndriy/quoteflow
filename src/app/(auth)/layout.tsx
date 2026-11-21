import type { ReactNode } from "react";
import { LANDING_EXAMPLES } from "@/app/_landing/landing-examples";
import { Receipt } from "@/components/receipt";
import { PlumblineLogo } from "@/components/plumbline-logo";

const [example] = LANDING_EXAMPLES;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      <div className="flex flex-col px-4 py-5 sm:px-8 lg:px-20">
        <PlumblineLogo />
        <main className="mx-auto flex w-full max-w-md flex-1 animate-rise flex-col justify-center gap-8 py-12">
          {children}
        </main>
      </div>
      <aside aria-hidden className="hidden flex-col justify-center gap-10 bg-ink px-16 py-20 text-paper lg:flex">
        <div className="w-full max-w-sm -rotate-[1.5deg] self-center text-ink">
          <Receipt businessName="Home Studio" quote={example.quote} baseDetail={example.detail} />
        </div>
        <p className="max-w-sm self-center font-serif text-2xl leading-snug">
          Your customers see the price before they call. You get the request with that price on it.
        </p>
      </aside>
    </div>
  );
}
