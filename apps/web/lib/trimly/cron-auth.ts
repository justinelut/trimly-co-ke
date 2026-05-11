/**
 * Bearer-token auth shared by every /api/cron/* route.
 *
 * The K8s CronJob pods send `Authorization: Bearer ${CRON_SECRET}` where
 * CRON_SECRET is a 32-byte hex value held in the trimly-co-ke Kubernetes
 * Secret AND mounted into the Next.js pod. Same secret on both sides;
 * timing-safe compared here.
 *
 * Why bearer + shared secret instead of mTLS or signed payloads:
 *   - The endpoint is internal (ClusterIP only — never exposed by Ingress)
 *   - The threat model is "rogue pod inside the cluster" — bearer suffices
 *   - Operational simplicity beats marginal hardening for an internal call
 */
import crypto from "node:crypto";

const BEARER_PREFIX = "Bearer ";

/**
 * Returns true if the request carries a valid bearer that matches
 * CRON_SECRET. Fail-closed on missing config (server misconfiguration
 * MUST NOT accept unauthenticated cron triggers).
 */
export function verifyCronBearer(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) return false;
  const provided = authHeader.slice(BEARER_PREFIX.length).trim();
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    // eslint-disable-next-line no-console
    console.error("[cron-auth] CRON_SECRET is not set — refusing all cron requests");
    return false;
  }
  if (provided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
