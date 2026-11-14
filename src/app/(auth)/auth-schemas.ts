import { z } from "zod";

const email = z.email("Enter a valid email").max(254);

export const signUpSchema = z.object({
  email,
  // Upper bound keeps a huge password from turning scrypt into a cheap DoS.
  password: z.string().min(8, "At least 8 characters").max(128, "At most 128 characters"),
  businessName: z.string().trim().min(2, "Enter the business name").max(100, "Name is too long"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
      "3–40 characters: latin letters, digits and hyphens, not at the start or end",
    ),
});

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});
