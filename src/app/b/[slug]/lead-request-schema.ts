import { z } from "zod";
import type { LeadRequest } from "@/domain/leads/submit-lead";
import { MAX_DIMENSION_CM, MAX_HOURS, MAX_QUANTITY } from "@/domain/pricing/strategies";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";

const dimension = z.coerce
  .number({ error: "Enter a number" })
  .positive("Must be greater than 0")
  .max(MAX_DIMENSION_CM, `At most ${MAX_DIMENSION_CM} cm`);

const quantity = z.coerce
  .number({ error: "Enter a number" })
  .int("Must be a whole number")
  .min(1, "At least 1")
  .max(MAX_QUANTITY, `At most ${MAX_QUANTITY}`);

const quoteInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("per_area"), widthCm: dimension, heightCm: dimension, quantity }),
  z.object({
    kind: z.literal("per_hour"),
    hours: z.coerce
      .number({ error: "Enter a number" })
      .positive("Must be greater than 0")
      .max(MAX_HOURS, `At most ${MAX_HOURS} hours`),
  }),
  z.object({ kind: z.literal("fixed"), quantity }),
]);

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{10,15}$/, "Enter a phone number, e.g. +380501234567"));

const leadRequestSchema = z.object({
  serviceId: z.uuid("Choose a service"),
  customerName: z.string().trim().min(2, "Enter your name").max(100, "Name is too long"),
  phone,
  comment: z
    .string()
    .trim()
    .max(1000, "Comment is too long")
    .transform((value) => value || undefined)
    .optional(),
  input: quoteInputSchema,
  surchargeIds: z.array(z.string().max(64)).max(20),
  idempotencyKey: z.uuid(),
}) satisfies z.ZodType<LeadRequest>;

export type ParsedLeadForm =
  | { ok: true; request: LeadRequest }
  | { ok: false; fieldErrors: FieldErrors };

export function parseLeadForm(formData: FormData): ParsedLeadForm {
  const text = (name: string) => formData.get(name) ?? undefined;

  const result = leadRequestSchema.safeParse({
    serviceId: text("serviceId"),
    customerName: text("customerName"),
    phone: text("phone"),
    comment: text("comment"),
    input: {
      kind: text("kind"),
      widthCm: text("widthCm"),
      heightCm: text("heightCm"),
      quantity: text("quantity"),
      hours: text("hours"),
    },
    surchargeIds: formData.getAll("surchargeIds"),
    idempotencyKey: text("idempotencyKey"),
  });

  return result.success
    ? { ok: true, request: result.data }
    : { ok: false, fieldErrors: toFieldErrors(result.error) };
}
