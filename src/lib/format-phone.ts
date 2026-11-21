const IRISH_MOBILE = /^\+353(8\d)(\d{3})(\d{4})$/;
const IRISH_MOBILE_NATIONAL = /^0(8\d)(\d{3})(\d{4})$/;

// Groups an Irish mobile number the way people read it aloud; any other number is shown as stored.
export function formatPhone(phone: string): string {
  const international = IRISH_MOBILE.exec(phone);
  if (international) return `+353 ${international.slice(1).join(" ")}`;
  const national = IRISH_MOBILE_NATIONAL.exec(phone);
  return national ? `0${national.slice(1).join(" ")}` : phone;
}
