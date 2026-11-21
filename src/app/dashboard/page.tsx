import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import type { Business } from "@/domain/catalog/catalog";
import { LEAD_STATUSES, type LeadStatus } from "@/domain/leads/lead-status";
import { requireOwner } from "@/lib/auth/current-owner";
import { ContactsForm } from "./contacts-form";
import { CopyLink } from "./copy-link";
import { LeadStats, StatusFilter } from "./lead-overview";
import { LeadRow } from "./lead-row";
import { TelegramSettings } from "./telegram-settings";

const PAGE_SIZE = 50;

// An unknown ?status= shows all requests instead of an error page.
const filterSchema = z.enum(LEAD_STATUSES).optional().catch(undefined);

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {searchParams.then(({ status }) => (
        <OwnerDashboard status={filterSchema.parse(status)} />
      ))}
    </Suspense>
  );
}

async function OwnerDashboard({ status }: { status?: LeadStatus }) {
  const { business } = await requireOwner();
  if (!business) return <p className="text-muted">This account has no business.</p>;

  const { leads } = getRepositories();
  const [totals, list] = await Promise.all([
    leads.summarizeByStatus(business.id),
    leads.listByBusiness(business.id, { status, limit: PAGE_SIZE }),
  ]);

  return (
    <>
      <PageHeader business={business} />
      <LeadStats totals={totals} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="requests-title" className="flex min-w-0 flex-col gap-4">
          <h2 id="requests-title" className="font-serif text-2xl font-medium">
            Requests
          </h2>
          <StatusFilter current={status} totals={totals} />
          {list.length > 0 ? (
            <ul className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-white">
              {list.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </ul>
          ) : (
            <EmptyState filtered={status !== undefined} slug={business.slug} />
          )}
        </section>
        <aside className="flex flex-col gap-4">
          <ContactsForm contacts={{ phone: business.phone, address: business.address }} />
          <TelegramSettings chatId={business.telegramChatId} chatName={business.telegramChatName} />
        </aside>
      </div>
    </>
  );
}

function PageHeader({ business }: { business: Business }) {
  const path = `/b/${business.slug}`;
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.13em] text-accent uppercase">Your page</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{business.name}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href={path} className="text-sm font-medium underline-offset-4 hover:underline">
          {path}
        </Link>
        <CopyLink path={path} />
      </div>
    </div>
  );
}

function EmptyState({ filtered, slug }: { filtered: boolean; slug: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-dashed border-rule bg-surface p-8 text-center">
      {filtered ? (
        <p className="text-muted">No requests with this status.</p>
      ) : (
        <>
          <p className="font-serif text-xl">No requests yet</p>
          <p className="text-muted">
            Share <span className="font-medium text-ink">/b/{slug}</span> in your bio or messages. Requests land here with
            the price on them.
          </p>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy className="flex animate-pulse flex-col gap-10">
      <div className="h-14 w-72 rounded-field bg-surface" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-card bg-surface" />
        ))}
      </div>
      <div className="h-80 rounded-card bg-surface" />
    </div>
  );
}
