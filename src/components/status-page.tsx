import type { ReactNode } from "react";
import { Overline } from "@/app/_landing/overline";
import { PlumblineLogo } from "@/components/plumbline-logo";

type StatusPageProps = {
  overline: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
};

export function StatusPage({ overline, title, children, actions }: StatusPageProps) {
  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-8 lg:px-20">
      <PlumblineLogo />
      <main className="mx-auto flex w-full max-w-xl flex-1 animate-rise flex-col justify-center gap-5 py-16">
        <Overline>{overline}</Overline>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        <div className="text-muted sm:text-lg">{children}</div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">{actions}</div>
      </main>
    </div>
  );
}

export const secondaryLinkClass = "text-center font-semibold text-accent underline-offset-4 hover:underline";
