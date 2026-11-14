import { LeadConflictError, type LeadRepository } from "./lead";
import { canTransition, type LeadStatus } from "./lead-status";

export type StatusChangeRequest = {
  businessId: string;
  leadId: string;
  from: LeadStatus;
  to: LeadStatus;
  note?: string;
};

export type StatusChangeResult = { ok: true } | { ok: false; reason: "forbidden" | "conflict" };

// "from" is the status the owner saw on screen, so a change made meanwhile is reported, not overwritten.
export async function changeLeadStatus(
  leads: LeadRepository,
  request: StatusChangeRequest,
  now: Date,
): Promise<StatusChangeResult> {
  const { businessId, leadId, from, to, note } = request;
  if (!canTransition(from, to)) return { ok: false, reason: "forbidden" };

  try {
    await leads.saveTransition(businessId, leadId, { from, to, at: now, ...(note ? { note } : {}) });
    return { ok: true };
  } catch (error) {
    if (error instanceof LeadConflictError) return { ok: false, reason: "conflict" };
    throw error;
  }
}
