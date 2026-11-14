"use client";

import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { signInAction, type AuthFormState } from "../actions";

const INITIAL: AuthFormState = { fieldErrors: {} };

export function SignInForm() {
  const { state, onSubmit, pending } = useFormSubmit(signInAction, INITIAL);
  const errors = state.fieldErrors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      {state.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </PrimaryButton>
    </form>
  );
}
