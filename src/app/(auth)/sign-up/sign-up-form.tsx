"use client";

import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { signUpAction, type AuthFormState } from "../actions";

const INITIAL: AuthFormState = { fieldErrors: {} };

export function SignUpForm() {
  const { state, onSubmit, pending } = useFormSubmit(signUpAction, INITIAL);
  const errors = state.fieldErrors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="Business name" name="businessName" required error={errors.businessName} />
      <Field
        label="Page address"
        name="slug"
        required
        autoCapitalize="none"
        placeholder="blinds-kyiv"
        error={errors.slug}
      />
      <p className="-mt-2 text-xs text-zinc-500">Customers will open your calculator at /b/your-address</p>
      <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={errors.password}
      />
      {state.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create business"}
      </PrimaryButton>
    </form>
  );
}
