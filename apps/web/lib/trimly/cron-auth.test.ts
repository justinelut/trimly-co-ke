/**
 * Unit tests for the cron bearer-token verifier.
 *
 * The cron endpoints are not exposed publicly (ClusterIP service, no
 * Ingress), but a misconfigured Network Policy or future "open to the
 * internet" mistake would let any pod hit them. This test pins down the
 * exact behaviour so future refactors don't accidentally weaken the auth.
 *
 * Run with `TZ=UTC yarn vitest run apps/web/lib/trimly/cron-auth.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyCronBearer } from "./cron-auth";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let originalSecret: string | undefined;

beforeEach(() => {
  originalSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe("verifyCronBearer", () => {
  it("accepts the exact secret", () => {
    expect(verifyCronBearer(`Bearer ${SECRET}`)).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(verifyCronBearer(null)).toBe(false);
    expect(verifyCronBearer("")).toBe(false);
  });

  it("rejects when the header does not use the Bearer scheme", () => {
    expect(verifyCronBearer(SECRET)).toBe(false); // no prefix
    expect(verifyCronBearer(`Basic ${SECRET}`)).toBe(false);
    expect(verifyCronBearer(`bearer ${SECRET}`)).toBe(false); // case-sensitive
  });

  it("rejects a wrong secret of the same length", () => {
    const wrongSameLength = "ffffffff".repeat(8); // 64 hex chars, same length as SECRET
    expect(verifyCronBearer(`Bearer ${wrongSameLength}`)).toBe(false);
  });

  it("rejects a wrong secret of a different length without throwing", () => {
    expect(() => verifyCronBearer(`Bearer short`)).not.toThrow();
    expect(verifyCronBearer(`Bearer short`)).toBe(false);
    expect(verifyCronBearer(`Bearer ${SECRET}extra`)).toBe(false);
  });

  it("rejects extra whitespace around the token", () => {
    // We strip with .trim() so leading/trailing whitespace inside the
    // header value is OK, but if the token itself differs after trim, fail.
    expect(verifyCronBearer(`Bearer  ${SECRET}`)).toBe(false); // double-space after Bearer
    expect(verifyCronBearer(`Bearer ${SECRET} `)).toBe(true); // trailing space trimmed
  });

  it("fails closed when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronBearer(`Bearer ${SECRET}`)).toBe(false);
  });

  it("fails closed when CRON_SECRET is the empty string", () => {
    process.env.CRON_SECRET = "";
    expect(verifyCronBearer(`Bearer ${SECRET}`)).toBe(false);
  });

  it("is constant-time-safe — never throws on partial inputs", () => {
    expect(() => verifyCronBearer("Bearer")).not.toThrow();
    expect(() => verifyCronBearer("Bearer ")).not.toThrow();
    expect(() => verifyCronBearer(`Bearer ${"a".repeat(SECRET.length - 1)}`)).not.toThrow();
    expect(() => verifyCronBearer(`Bearer ${"a".repeat(SECRET.length + 1)}`)).not.toThrow();
  });
});
