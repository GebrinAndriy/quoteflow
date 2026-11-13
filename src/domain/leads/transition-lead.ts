import { canTransition, type LeadStatus } from "./lead-status";

export type StatusChange = {
  from: LeadStatus;
  to: LeadStatus;
  at: Date;
  note?: string;
};

type WithStatus = {
  status: LeadStatus;
  history: readonly StatusChange[];
};

export class LeadTransitionError extends Error {
  constructor(
    readonly from: LeadStatus,
    readonly to: LeadStatus,
  ) {
    super(`Cannot move lead from "${from}" to "${to}"`);
    this.name = "LeadTransitionError";
  }
}

export function transitionLead<T extends WithStatus>(
  lead: T,
  to: LeadStatus,
  at: Date,
  note?: string,
): T {
  if (!canTransition(lead.status, to)) {
    throw new LeadTransitionError(lead.status, to);
  }

  const change: StatusChange = { from: lead.status, to, at, ...(note ? { note } : {}) };
  return { ...lead, status: to, history: [...lead.history, change] };
}
