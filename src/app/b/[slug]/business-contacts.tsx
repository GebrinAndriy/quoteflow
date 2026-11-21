import type { BusinessContacts as Contacts } from "@/domain/catalog/catalog";
import { addressLines, mapsHref, phoneHref } from "@/lib/contact-links";
import { formatPhone } from "@/lib/format-phone";

export function BusinessContacts({ phone, address }: Contacts) {
  if (!phone && !address) return null;

  return (
    <address className="flex flex-col gap-3 text-[15px] not-italic sm:min-w-56">
      {phone && (
        <a href={phoneHref(phone)} className="text-lg font-semibold tabular-nums underline-offset-4 hover:underline">
          {formatPhone(phone)}
        </a>
      )}
      {address && (
        <div className="flex flex-col gap-1">
          <p className="text-muted">
            {addressLines(address).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <a
            href={mapsHref(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start font-semibold text-accent underline-offset-4 hover:underline"
          >
            Open in Maps →
          </a>
        </div>
      )}
    </address>
  );
}
