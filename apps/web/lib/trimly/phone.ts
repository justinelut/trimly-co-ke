/**
 * Kenyan mobile number normalisation.
 *
 * Paystack accepts the "0712345678" form for M-Pesa STK push, but customers
 * type their numbers in three common formats — normalise here, never inside
 * a route handler.
 */

/**
 * Normalises a Kenyan mobile number into the "0712345678" form that
 * Paystack's mobile_money charge expects.
 *
 * Accepted inputs:
 *   "0712345678"     → "0712345678"
 *   "+254712345678"  → "0712345678"
 *   "254712345678"   → "0712345678"
 *   "0712 345 678"   → "0712345678"   (spaces and dashes stripped)
 *
 * Throws on anything that does not look like a Kenyan mobile number.
 */
export function normalisePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-()]/g, "");

  // +254712345678 → 0712345678
  if (stripped.startsWith("+254") && stripped.length === 13) {
    return "0" + stripped.slice(4);
  }
  // 254712345678 → 0712345678
  if (stripped.startsWith("254") && stripped.length === 12) {
    return "0" + stripped.slice(3);
  }
  // 0712345678 → 0712345678 (already normalised)
  if (stripped.startsWith("0") && stripped.length === 10) {
    return stripped;
  }

  throw new Error(
    `Could not normalise phone "${raw}". Expected formats: 0712345678, +254712345678, or 254712345678.`
  );
}

/**
 * Light-weight Safaricom + Airtel prefix check. Paystack accepts any Kenyan
 * mobile money number; this is just a UX hint before the STK push.
 */
export function isLikelyMpesaNumber(normalised: string): boolean {
  // Safaricom prefixes: 0700–0729 and 0740–0749 and 0790–0799 (approximate)
  // Airtel and Telkom now also have M-Pesa-compatible numbers via interop.
  if (normalised.length !== 10 || !normalised.startsWith("0")) return false;
  const prefix = normalised.slice(0, 4);
  return /^07[0-9]{2}$/.test(prefix);
}
