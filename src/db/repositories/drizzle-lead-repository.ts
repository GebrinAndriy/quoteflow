import { and, asc, desc, eq } from "drizzle-orm";
import { LeadConflictError, type Lead, type LeadRepository } from "@/domain/leads/lead";
import type { StatusChange } from "@/domain/leads/transition-lead";
import type { Database } from "../database";
import { leadStatusChanges, leads } from "../schema";
import { isUuid } from "./is-uuid";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

type LeadRow = typeof leads.$inferSelect;

export function createDrizzleLeadRepository(db: Database): LeadRepository {
  async function loadHistory(leadId: string): Promise<StatusChange[]> {
    const rows = await db
      .select()
      .from(leadStatusChanges)
      .where(eq(leadStatusChanges.leadId, leadId))
      .orderBy(asc(leadStatusChanges.at));
    return rows.map((r) => ({
      from: r.fromStatus,
      to: r.toStatus,
      at: r.at,
      ...(r.note ? { note: r.note } : {}),
    }));
  }

  return {
    async create(lead) {
      const [inserted] = await db
        .insert(leads)
        .values({
          businessId: lead.businessId,
          serviceId: lead.serviceId,
          customerName: lead.customerName,
          phone: lead.phone,
          comment: lead.comment ?? null,
          input: lead.input,
          quote: lead.quote,
          total: lead.quote.total,
          idempotencyKey: lead.idempotencyKey,
        })
        .onConflictDoNothing({ target: leads.idempotencyKey })
        .returning();

      if (inserted) {
        return { lead: toLead(inserted, []), created: true };
      }

      const [existing] = await db
        .select()
        .from(leads)
        .where(eq(leads.idempotencyKey, lead.idempotencyKey))
        .limit(1);
      if (!existing || existing.businessId !== lead.businessId) {
        throw new Error("Idempotency key is already used by another business");
      }
      return { lead: toLead(existing, await loadHistory(existing.id)), created: false };
    },

    async findById(businessId, leadId) {
      if (!isUuid(businessId) || !isUuid(leadId)) return null;
      const [row] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, leadId), eq(leads.businessId, businessId)))
        .limit(1);
      return row ? toLead(row, await loadHistory(row.id)) : null;
    },

    async listByBusiness(businessId, options = {}) {
      if (!isUuid(businessId)) return [];
      const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const filters = [eq(leads.businessId, businessId)];
      if (options.status) filters.push(eq(leads.status, options.status));

      const rows = await db
        .select()
        .from(leads)
        .where(and(...filters))
        .orderBy(desc(leads.createdAt))
        .limit(limit);

      return rows.map(toSummary);
    },

    async saveTransition(businessId, leadId, change) {
      await db.transaction(async (tx) => {
        // Compare-and-set on the old status: two managers clicking at once cannot both win.
        const updated = await tx
          .update(leads)
          .set({ status: change.to, updatedAt: change.at })
          .where(
            and(
              eq(leads.id, leadId),
              eq(leads.businessId, businessId),
              eq(leads.status, change.from),
            ),
          )
          .returning({ id: leads.id });

        if (updated.length === 0) {
          throw new LeadConflictError();
        }

        await tx.insert(leadStatusChanges).values({
          leadId,
          fromStatus: change.from,
          toStatus: change.to,
          note: change.note ?? null,
          at: change.at,
        });
      });
    },
  };
}

function toSummary(row: Omit<LeadRow, "input">) {
  return {
    id: row.id,
    businessId: row.businessId,
    serviceId: row.serviceId,
    customerName: row.customerName,
    phone: row.phone,
    comment: row.comment,
    quote: row.quote,
    status: row.status,
    createdAt: row.createdAt,
  };
}

function toLead(row: LeadRow, history: StatusChange[]): Lead {
  return { ...toSummary(row), input: row.input, history };
}
