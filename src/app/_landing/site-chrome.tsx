import Link from "next/link";
import { primaryButtonClass } from "@/components/primary-button";
import { PlumblineLogo } from "@/components/plumbline-logo";

export const DEMO_PATH = "/b/demo";

const navLink = "text-[15px] text-muted transition-colors hover:text-ink";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-20 lg:py-5">
        <div className="flex items-center gap-12">
          <PlumblineLogo />
          <nav aria-label="Main" className="hidden gap-7 md:flex">
            <a href="#how-it-works" className={navLink}>
              How it works
            </a>
            <Link href={DEMO_PATH} className={navLink}>
              Demo
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="rounded-field border border-ink px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface">
            Sign in
          </Link>
          <Link href="/sign-up" className={`${primaryButtonClass} hidden text-sm sm:block`}>
            Create your business
          </Link>
        </div>
      </div>
    </header>
  );
}

export function CallToAction({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 ${className}`}>
      <Link href="/sign-up" className={`${primaryButtonClass} text-center`}>
        Create your business
      </Link>
      <Link href={DEMO_PATH} className="text-center font-semibold text-accent underline-offset-4 hover:underline">
        See a demo page →
      </Link>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-20">
        <PlumblineLogo className="h-7 w-auto" />
        <p className="text-sm text-muted">Instant quotes and requests for small service businesses.</p>
        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <Link href={DEMO_PATH} className="hover:underline">
            Demo page
          </Link>
          <Link href="/sign-in" className="hover:underline">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
