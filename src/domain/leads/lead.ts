import type { Quote, QuoteInput } from "../pricing/types";
import type { LeadStatus } from "./lead-status";
import type { StatusChange } from "./transition-lead";

export type Lead = {
  id: string;
  businessId: string;
  serviceId: string | null;
  customerName: string;
  phone: string;
  comment: string | null;
  input: QuoteInput;
  quote: Quote;
  status: LeadStatus;
  createdAt: Date;
  history: StatusChange[];
};

export type LeadSummary = Omit<Lead, "history" | "input">;

export type NewLead = {
  businessId: string;
  serviceId: string;
  customerName: string;
  phone: string;
  comment?: string;
  input: QuoteInput;
  quote: Quote;
  idempotencyKey: string;
};

export class LeadConflictError extends Error {
  constructor() {
    super("Lead was changed by someone else, reload and try again");
    this.name = "LeadConflictError";
  }
}

export interface LeadRepository {
  /** Returns the existing lead when the idempotency key was already used. */
  create(lead: NewLead): Promise<{ lead: Lead; created: boolean }>;
  findById(businessId: string, leadId: string): Promise<Lead | null>;
  listByBusiness(
    businessId: string,
    options?: { status?: LeadStatus; limit?: number },
  ): Promise<LeadSummary[]>;
  /** Throws LeadConflictError if the lead's status changed since it was read. */
  saveTransition(businessId: string, leadId: string, change: StatusChange): Promise<void>;
}
