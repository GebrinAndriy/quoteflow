"use client";

import {
  startTransition,
  useActionState,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Service } from "@/domain/pricing/types";
import { formatMoney } from "@/lib/format-money";
import { submitLeadAction, type LeadFormState } from "./actions";
import { Field } from "./field";
import { EMPTY_FIELDS, previewQuote, type QuoteFields } from "./preview-quote";
import { QuoteSummary } from "./quote-summary";
import { ServiceFields } from "./service-fields";

type QuoteFormProps = { businessSlug: string; services: Service[] };

const IDLE: LeadFormState = { status: "idle" };

export function QuoteForm(props: QuoteFormProps) {
  // A new key remounts the form, which is the only way to reset useActionState.
  const [attempt, setAttempt] = useState(0);
  return <QuoteRequest key={attempt} {...props} onReset={() => setAttempt((n) => n + 1)} />;
}

function QuoteRequest({
  businessSlug,
  services,
  onReset,
}: QuoteFormProps & { onReset: () => void }) {
  const [serviceId, setServiceId] = useState(services[0].id);
  const [fields, setFields] = useState<QuoteFields>(EMPTY_FIELDS);
  const [surchargeIds, setSurchargeIds] = useState<string[]>([]);
  const [contact, setContact] = useState({ customerName: "", phone: "", comment: "" });
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const idempotencyKey = useRef<string | null>(null);

  const [state, formAction, pending] = useActionState(
    async (previous: LeadFormState, formData: FormData) => {
      // One key per attempt: a retry after a lost response returns the same lead instead of a duplicate.
      idempotencyKey.current ??= crypto.randomUUID();
      formData.set("idempotencyKey", idempotencyKey.current);
      const next = await submitLeadAction(businessSlug, previous, formData);
      if (next.status === "sent") idempotencyKey.current = null;
      return next;
    },
    IDLE,
  );

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const quote = useMemo(
    () => previewQuote(service, fields, surchargeIds),
    [service, fields, surchargeIds],
  );

  if (state.status === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
        <h2 className="text-lg font-semibold">Request sent</h2>
        <p className="mt-1">
          We will call you back soon. Your price: <strong>{formatMoney(state.total)}</strong>
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 text-sm font-medium underline underline-offset-4 hover:no-underline"
        >
          Send another request
        </button>
      </div>
    );
  }

  // Hide an error as soon as the customer edits that field, not only after the next submit.
  const errors = Object.fromEntries(
    Object.entries(state.status === "error" ? state.fieldErrors : {}).filter(
      ([field]) => !editedFields.includes(field),
    ),
  );

  function markEdited(field: string) {
    setEditedFields((edited) => (edited.includes(field) ? edited : [...edited, field]));
  }

  function selectService(id: string) {
    setServiceId(id);
    setSurchargeIds([]);
  }

  // Not <form action>: React resets the form after an action and unticks controlled checkboxes.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setEditedFields([]);
    startTransition(() => formAction(formData));
  }

  function updateContact(name: keyof typeof contact, value: string) {
    markEdited(name);
    setContact((c) => ({ ...c, [name]: value }));
  }

  function toggleSurcharge(id: string, checked: boolean) {
    setSurchargeIds((ids) => (checked ? [...ids, id] : ids.filter((x) => x !== id)));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="kind" value={service.rule.kind} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Service</span>
        <select
          name="serviceId"
          value={serviceId}
          onChange={(e) => selectService(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <ServiceFields
        kind={service.rule.kind}
        fields={fields}
        errors={errors}
        onChange={(name, value) => {
          markEdited(name);
          setFields((f) => ({ ...f, [name]: value }));
        }}
      />

      {service.surcharges.length > 0 && (
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Options</legend>
          {service.surcharges.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="surchargeIds"
                value={s.id}
                checked={surchargeIds.includes(s.id)}
                onChange={(e) => toggleSurcharge(s.id, e.target.checked)}
                className="size-4"
              />
              {s.label}
            </label>
          ))}
        </fieldset>
      )}

      <QuoteSummary quote={quote} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Your name"
          name="customerName"
          autoComplete="name"
          required
          value={contact.customerName}
          onChange={(e) => updateContact("customerName", e.target.value)}
          error={errors.customerName}
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          value={contact.phone}
          onChange={(e) => updateContact("phone", e.target.value)}
          error={errors.phone}
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Comment (optional)</span>
        <textarea
          name="comment"
          rows={3}
          maxLength={1000}
          value={contact.comment}
          onChange={(e) => updateContact("comment", e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {state.status === "error" && (state.message || Object.keys(errors).length > 0) && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message ?? "Please check the highlighted fields"}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !quote}
        className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
