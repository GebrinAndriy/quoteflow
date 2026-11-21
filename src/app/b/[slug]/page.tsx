import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlumblineLogo } from "@/components/plumbline-logo";
import { BusinessContacts } from "./business-contacts";
import { previewDescription, previewTitle } from "./link-preview";
import { loadBusinessPage } from "./load-business-page";
import { QuoteForm } from "./quote-form";

export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadBusinessPage(slug);
  if (!page) notFound();

  const title = previewTitle(page.business.name);
  const description = previewDescription(page.services);
  const url = `/b/${page.business.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "Plumbline", locale: "en_IE" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function BusinessPage({ params }: PageProps<"/b/[slug]">) {
  return (
    <div className="flex flex-1 flex-col pb-28 lg:pb-0">
      <Suspense fallback={<PageSkeleton />}>
        {params.then(({ slug }) => (
          <BusinessQuote slug={slug} />
        ))}
      </Suspense>
      <footer className="mt-auto flex items-center justify-center gap-2 border-t border-rule py-6 text-xs text-muted">
        Made with <PlumblineLogo className="h-5 w-auto" />
      </footer>
    </div>
  );
}

async function BusinessQuote({ slug }: { slug: string }) {
  const page = await loadBusinessPage(slug);
  if (!page) notFound();
  const { business, services } = page;

  return (
    <>
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:px-8 sm:py-12">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{business.name}</h1>
            <p className="mt-3 max-w-2xl text-muted sm:text-lg">
              Choose a service, enter the details and see the exact price. Send a request — we&apos;ll call you back.
            </p>
          </div>
          <BusinessContacts phone={business.phone} address={business.address} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        {services.length > 0 ? (
          <QuoteForm businessName={business.name} businessSlug={business.slug} services={services} />
        ) : (
          <p className="text-muted">This business has no services yet.</p>
        )}
      </main>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-4 px-4 py-12 sm:px-8" aria-busy="true">
      <div className="h-12 w-1/2 rounded bg-disabled" />
      <div className="h-5 w-2/3 rounded bg-disabled" />
      <div className="mt-8 h-96 w-full rounded-card bg-disabled" />
    </div>
  );
}
