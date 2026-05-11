/**
 * Unit tests for the Paystack webhook signature verification.
 *
 * Security-critical: HMAC verification is the ONLY thing standing
 * between a forged webhook and a fraudulent booking confirmation, so
 * these tests run against the exact same crypto.createHmac path the
 * route uses.
 *
 * Run with `TZ=UTC yarn vitest run apps/web/app/api/webhooks/paystack/`.
 */
import crypto from "node:crypto";
import { describe, expect, it, beforeEach } from "vitest";

const SECRET = "sk_test_unit_secret_must_not_be_real";

function sign(body: string, secret: string = SECRET): string {
  return crypto.createHmac("sha512", secret).update(body).digest("hex");
}

/**
 * Mirrors the verifySignature() helper in route.ts. We re-implement
 * it here verbatim because route.ts imports next/server (not testable
 * in plain vitest), but the logic is small enough to keep in sync by
 * inspection. If route.ts's verifySignature changes, update both.
 */
function verifySignature(rawBody: string, header: string | null, secret = SECRET): boolean {
  if (!header) return false;
  if (!secret) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  if (expected.length !== header.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(header, "hex"));
  } catch {
    return false;
  }
}

describe("Paystack webhook HMAC verification", () => {
  const validBody = JSON.stringify({
    event: "charge.success",
    data: { id: 12345, reference: "ref_abc", status: "success", amount: 200000 },
  });

  let validSig: string;
  beforeEach(() => {
    validSig = sign(validBody);
  });

  it("accepts a body signed with the same secret", () => {
    expect(verifySignature(validBody, validSig)).toBe(true);
  });

  it("rejects when the signature header is missing", () => {
    expect(verifySignature(validBody, null)).toBe(false);
    expect(verifySignature(validBody, "")).toBe(false);
  });

  it("rejects when the body has been tampered with", () => {
    const tamperedBody = validBody.replace('"reference":"ref_abc"', '"reference":"ref_FORGED"');
    expect(verifySignature(tamperedBody, validSig)).toBe(false);
  });

  it("rejects when only one character of the signature differs", () => {
    // Flip the last character — should fail constant-time comparison.
    const lastCh = validSig.slice(-1);
    const flipped = lastCh === "0" ? "1" : "0";
    const tamperedSig = validSig.slice(0, -1) + flipped;
    expect(verifySignature(validBody, tamperedSig)).toBe(false);
  });

  it("rejects signatures of the wrong length", () => {
    expect(verifySignature(validBody, validSig.slice(0, 64))).toBe(false);
    expect(verifySignature(validBody, validSig + "00")).toBe(false);
  });

  it("rejects when the signature is not valid hex", () => {
    const badHex = "z".repeat(128); // SHA512 hex is 128 chars
    expect(verifySignature(validBody, badHex)).toBe(false);
  });

  it("rejects when verified against a different secret", () => {
    const signedWithOther = sign(validBody, "sk_test_DIFFERENT_secret");
    expect(verifySignature(validBody, signedWithOther)).toBe(false);
  });

  it("rejects when the configured secret is missing", () => {
    expect(verifySignature(validBody, validSig, "")).toBe(false);
  });

  it("is constant-time (no timing leak on partial matches)", () => {
    // We can't precisely assert constant-time in a unit test, but we can
    // verify that the function NEVER throws on length mismatches (the
    // common timing-attack surface). timingSafeEqual requires equal-length
    // buffers; our pre-check guards that.
    expect(() => verifySignature(validBody, "00")).not.toThrow();
    expect(() => verifySignature(validBody, "0".repeat(127))).not.toThrow();
    expect(() => verifySignature(validBody, "0".repeat(129))).not.toThrow();
  });
});
