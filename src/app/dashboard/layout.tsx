import type { ReactNode } from "react";
import { signOutAction } from "../(auth)/actions";
import { DashboardNav } from "./dashboard-nav";
import { PlumblineLogo } from "@/components/plumbline-logo";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3.5 sm:px-8">
          <PlumblineLogo href="/dashboard" className="h-7 w-auto sm:h-8" />
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <DashboardNav />
          </div>
          <form action={signOutAction}>
            <button type="submit" className="text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-8 sm:py-12">{children}</main>
    </>
  );
}
