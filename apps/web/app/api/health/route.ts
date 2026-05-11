/**
 * GET /api/health
 *
 * Lightweight liveness/readiness probe for the K8s deployment manifests.
 *
 * Returns 200 when the database is reachable, 503 otherwise. Used by:
 *   - k8s/deploy.yaml (readiness, liveness, startup probes)
 *
 * Cal.diy did not ship a health endpoint; Trimly's K8s deployment needs one,
 * so this file is part of the Trimly port. It is intentionally minimal —
 * a SELECT 1 query is the cheapest possible reachability check and avoids
 * exercising any business logic.
 *
 * This is a Trimly-only addition and does not affect any existing Cal route.
 */
import { NextResponse } from "next/server";

import { prisma } from "@calcom/prisma";

export const dynamic = "force-dynamic"; // never cache the health response
export const runtime = "nodejs"; // Prisma requires the Node runtime, not Edge

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    // Don't leak the error message — log server-side, return a generic 503.
    // eslint-disable-next-line no-console
    console.error("[health] db unreachable", err);
    return NextResponse.json({ status: "db_error" }, { status: 503 });
  }
}
