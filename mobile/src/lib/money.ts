/**
 * Integer-cent South African Rand (ZAR) formatters.
 * NEVER perform floating-point arithmetic on balances in UI components.
 */

export function formatZarCents(cents: number, includeCurrencyCode = false): string {
  const safeCents = Math.trunc(cents);
  const sign = safeCents < 0 ? "-" : "";
  const abs = Math.abs(safeCents);
  const rands = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  const grouped = rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const suffix = includeCurrencyCode ? " ZAR" : "";
  return `${sign}R ${grouped}.${remainder}${suffix}`;
}

export function generateIdempotencyKey(prefix = "sahara"): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${hex}`;
}
