import type { CatalogRepository } from "../catalog/catalog";
import { calculateQuote } from "../pricing/calculate-quote";
import { QuoteInputError } from "../pricing/errors";
import type { Money, Quote, QuoteInput } from "../pricing/types";
import type { LeadRepository } from "./lead";

export type LeadRequest = {
  serviceId: string;
  customerName: string;
  phone: string;
  comment?: string;
  input: QuoteInput;
  surchargeIds: string[];
  idempotencyKey: string;
};

export type SubmitLeadResult =
  | { ok: true; leadId: string; total: Money }
  | { ok: false; reason: "not_found" | "invalid_input"; message: string };

type Deps = { catalog: CatalogRepository; leads: LeadRepository };

export async function submitLead(
  { catalog, leads }: Deps,
  businessSlug: string,
  request: LeadRequest,
): Promise<SubmitLeadResult> {
  const business = await catalog.findBusinessBySlug(businessSlug);
  const service = business && (await catalog.findService(business.id, request.serviceId));
  if (!business || !service) {
    return { ok: false, reason: "not_found", message: "This service is no longer available" };
  }

  let quote: Quote;
  try {
    // The price shown in the browser is only a preview; the saved one is always recalculated here.
    quote = calculateQuote(service, request.input, request.surchargeIds);
  } catch (error) {
    if (error instanceof QuoteInputError) {
      return { ok: false, reason: "invalid_input", message: error.message };
    }
    throw error;
  }

  const { lead } = await leads.create({
    businessId: business.id,
    serviceId: service.id,
    customerName: request.customerName,
    phone: request.phone,
    comment: request.comment,
    input: request.input,
    quote,
    idempotencyKey: request.idempotencyKey,
  });

  return { ok: true, leadId: lead.id, total: lead.quote.total };
}
