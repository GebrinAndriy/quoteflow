import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          New to QuoteFlow?{" "}
          <Link href="/sign-up" className="font-medium underline underline-offset-4">
            Create your business
          </Link>
        </p>
      </div>
      <SignInForm />
    </>
  );
}
