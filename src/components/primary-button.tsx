import type { ButtonHTMLAttributes } from "react";

export const primaryButtonClass =
  "rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export function PrimaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${primaryButtonClass} ${className ?? ""}`} {...props} />;
}
