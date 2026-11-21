import { describe, expect, it } from "vitest";
import { toFieldErrors } from "@/lib/field-errors";
import { contactsFormSchema } from "./contacts-schema";

describe("contactsFormSchema", () => {
  it("stores the phone without spaces and the address one line per row", () => {
    const parsed = contactsFormSchema.parse({
      phone: " +353 85 492 7104 ",
      address: "  42 Grafton Street \r\n\nDublin 2\n D02 R590  \n",
    });
    expect(parsed).toEqual({ phone: "+353854927104", address: "42 Grafton Street\nDublin 2\nD02 R590" });
  });

  it("clears both contacts when the fields are empty", () => {
    expect(contactsFormSchema.parse({ phone: "  ", address: " \n " })).toEqual({ phone: null, address: null });
    expect(contactsFormSchema.parse({})).toEqual({ phone: null, address: null });
  });

  it("rejects a phone that is not a number and an address that is too long", () => {
    const result = contactsFormSchema.safeParse({ phone: "call me", address: "a\nb\nc\nd\ne\nf" });
    expect(result.success).toBe(false);
    expect(Object.keys(toFieldErrors(result.error!))).toEqual(["phone", "address"]);
  });
});
