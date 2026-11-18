const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => String(PERSIAN_DIGITS.indexOf(d) + ARABIC_DIGITS.indexOf(d) + 1));
}

/** Normalizes Iranian mobile numbers to 09xxxxxxxxx, or returns null if invalid. */
export function normalizeIranMobile(input: string): string | null {
  const digits = toEnglishDigits(input).replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+98|0098|98|0)?(9\d{9})$/);
  return match ? `0${match[1]}` : null;
}
