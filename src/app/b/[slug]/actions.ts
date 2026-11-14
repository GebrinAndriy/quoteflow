"use server";

import { getRepositories } from "@/db/get-repositories";
import { submitLead } from "@/domain/leads/submit-lead";
import type { Money } from "@/domain/pricing/types";
import type { FieldErrors } from "@/lib/field-errors";
import { parseLeadForm } from "./lead-request-schema";

export type LeadFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors: FieldErrors }
  | { status: "sent"; total: Money };

export async function submitLeadAction(
  businessSlug: string,
  _previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  // Hidden from people with CSS; simple bots fill every field they find.
  if (formData.get("website")) {
    return { status: "sent", total: 0 };
  }

  const parsed = parseLeadForm(formData);
  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors };
  }

  try {
    const result = await submitLead(getRepositories(), businessSlug, parsed.request);
    if (!result.ok) {
      return { status: "error", message: result.message, fieldErrors: {} };
    }
    return { status: "sent", total: result.total };
  } catch (error) {
    console.error("Failed to submit lead", error);
    return {
      status: "error",
      message: "Something went wrong on our side, please try again",
      fieldErrors: {},
    };
  }
}
