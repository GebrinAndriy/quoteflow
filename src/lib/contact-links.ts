export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function addressLines(address: string): string[] {
  return address.split("\n").filter(Boolean);
}

export function mapsHref(address: string): string {
  const query = encodeURIComponent(addressLines(address).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
