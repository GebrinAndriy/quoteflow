"use client";

import { Field, inputClass } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { BusinessContacts } from "@/domain/catalog/catalog";
import { formatPhone } from "@/lib/format-phone";
import { saveContactsAction, type ContactsFormState } from "./contacts-actions";
import { MAX_ADDRESS_LINES } from "./contacts-schema";

const INITIAL: ContactsFormState = { fieldErrors: {} };

export function ContactsForm({ contacts }: { contacts: BusinessContacts }) {
  const { state, onSubmit, pending } = useFormSubmit(saveContactsAction, INITIAL);
  const errors = state.fieldErrors;

  return (
    <section aria-labelledby="contacts-title" className="flex flex-col gap-4 rounded-card border border-rule bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 id="contacts-title" className="font-serif text-xl font-medium">
          Contacts
        </h2>
        <p className="text-sm text-muted">Shown on your page, so customers can call or find you.</p>
      </div>
      <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+353 85 123 4567"
          defaultValue={contacts.phone ? formatPhone(contacts.phone) : ""}
          error={errors.phone}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Address (optional)</span>
          <textarea
            name="address"
            rows={MAX_ADDRESS_LINES - 1}
            autoComplete="street-address"
            placeholder={"42 Grafton Street\nDublin 2\nD02 R590"}
            defaultValue={contacts.address ?? ""}
            aria-invalid={errors.address ? true : undefined}
            aria-describedby={errors.address ? "address-error" : undefined}
            className={`${inputClass} resize-y`}
          />
          {errors.address && (
            <span id="address-error" className="animate-rise text-error">
              {errors.address}
            </span>
          )}
        </label>
        {state.message && (
          <p role="alert" className="animate-shake text-sm text-error">
            {state.message}
          </p>
        )}
        {state.saved && !pending && (
          <p role="status" className="text-sm text-success">
            Saved. Your page shows the new contacts.
          </p>
        )}
        <PrimaryButton type="submit" disabled={pending} className="self-start text-sm">
          {pending ? "Saving…" : "Save contacts"}
        </PrimaryButton>
      </form>
    </section>
  );
}
