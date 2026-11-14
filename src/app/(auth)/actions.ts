"use server";

import { redirect } from "next/navigation";
import { getRepositories } from "@/db/get-repositories";
import { signIn } from "@/domain/auth/sign-in";
import { signUp } from "@/domain/auth/sign-up";
import { endSession, startSession } from "@/lib/auth/current-owner";
import { scryptHasher } from "@/lib/auth/scrypt-hasher";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { signInSchema, signUpSchema } from "./auth-schemas";

export type AuthFormState = { fieldErrors: FieldErrors; message?: string };

const fieldsOf = (formData: FormData, names: string[]) =>
  Object.fromEntries(names.map((name) => [name, formData.get(name) ?? undefined]));

export async function signUpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(
    fieldsOf(formData, ["email", "password", "businessName", "slug"]),
  );
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { accounts } = getRepositories();
  const result = await signUp({ accounts, hasher: scryptHasher }, parsed.data);
  if (!result.ok) return { fieldErrors: { [result.field]: result.message } };

  await startSession(result.userId);
  redirect("/dashboard");
}

export async function signInAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(fieldsOf(formData, ["email", "password"]));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { accounts } = getRepositories();
  const user = await signIn({ accounts, hasher: scryptHasher }, parsed.data.email, parsed.data.password);
  // One message for both cases, so the form does not reveal which emails are registered.
  if (!user) return { fieldErrors: {}, message: "Wrong email or password" };

  await startSession(user.userId);
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
