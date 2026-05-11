# Trimly — App-side integration checklist

This deployment infra assumes the Next.js app does five things. They are NOT optional — if any is missing, the cluster will misbehave.

## 1. Next.js standalone output (required for the Dockerfile)

In `apps/web/next.config.js`:

```js
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  // ... rest of config
};
```

Without this, the multi-stage Dockerfile in this repo will fail at the runner stage because `.next/standalone` won't exist.

## 2. Health endpoint

Implement `apps/web/app/api/health/route.ts` (App Router):

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ status: 'db_error' }, { status: 503 });
  }
}
```

Used by the K8s `readinessProbe`, `livenessProbe`, and `startupProbe`.

## 3. Cron endpoints

Two POST endpoints, both authenticated with `CRON_SECRET` as a bearer token:

```ts
// apps/web/app/api/cron/mpesa-renewal/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ... run the M-Pesa renewal cron logic (see Trimly brief §6.4)

  return NextResponse.json({ ok: true });
}
```

Same shape for `apps/web/app/api/cron/payment-reconciliation/route.ts`.

## 4. Storage client pointing at MinIO

In server-side storage code, use the AWS S3 SDK pointed at MinIO:

```ts
import { S3Client } from '@aws-sdk/client-s3';

export const storage = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,             // http://trimly-co-ke-minio:9000
  region: process.env.STORAGE_REGION ?? 'us-east-1',  // MinIO doesn't care, but the SDK requires a value
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
});
```

For URLs you embed in `<img src>`, build them from `STORAGE_PUBLIC_URL`:

```ts
const publicUrl = `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_BUCKET}/${key}`;
// e.g. https://storage.trimly.co.ke/trimly-co-ke-uploads/og/booking-abc123.png
```

## 5. Prisma binary targets (Alpine + linux-musl)

In `packages/prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

`linux-musl-openssl-3.0.x` matches `node:20-alpine`. Without this, `prisma generate` produces a binary that won't run inside the container and you'll get cryptic `Could not load query engine` errors on first request.

---

## .env.example (for local dev)

```env
# Database
DATABASE_URL="postgres://trimly-co-ke:password@127.0.0.1:5432/trimly-co-ke_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-only-not-for-production"

# Paystack (test keys)
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_WEBHOOK_SECRET=""

# Email / SMS
RESEND_API_KEY=""
AT_USERNAME=""
AT_API_KEY=""

# Storage (local MinIO via docker-compose, or skip during initial dev)
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_PUBLIC_URL="http://localhost:9000"
STORAGE_BUCKET="trimly-co-ke-uploads"
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""
STORAGE_REGION="us-east-1"
STORAGE_FORCE_PATH_STYLE="true"

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Observability
POSTHOG_KEY=""
POSTHOG_HOST="https://eu.posthog.com"
SENTRY_DSN=""

# Cron auth
CRON_SECRET="dev-cron-secret"
```
