"use server";

import { refresh } from "next/cache";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { contactsFormSchema } from "./contacts-schema";

export type ContactsFormState = { fieldErrors: FieldErrors; message?: string; saved?: boolean };

export async function saveContactsAction(
  _previous: ContactsFormState,
  formData: FormData,
): Promise<ContactsFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = contactsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await getRepositories().catalog.setContacts(business.id, parsed.data);
  refresh();
  return { fieldErrors: {}, saved: true };
}
