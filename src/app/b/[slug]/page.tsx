import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRepositories } from "@/db/get-repositories";
import { QuoteForm } from "./quote-form";

export default function BusinessPage({ params }: PageProps<"/b/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <Suspense fallback={<PageSkeleton />}>
        {params.then(({ slug }) => (
          <BusinessQuote slug={slug} />
        ))}
      </Suspense>
    </main>
  );
}

async function BusinessQuote({ slug }: { slug: string }) {
  const { catalog } = getRepositories();
  const business = await catalog.findBusinessBySlug(slug);
  if (!business) notFound();

  const services = await catalog.listActiveServices(business.id);

  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Get an instant price and leave a request, we will call you back.
        </p>
      </header>
      {services.length > 0 ? (
        <QuoteForm businessSlug={business.slug} services={services} />
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">This business has no services yet.</p>
      )}
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true">
      <div className="h-9 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-5 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-64 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
