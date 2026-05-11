# Trimly — Deployment Guide

Everything Trimly runs on a single K3s server. There is no Vercel, no Supabase, no Cloudflare R2.

| Component | Where it runs |
|---|---|
| Next.js app | K3s `Deployment` in namespace `trimly-co-ke` |
| Postgres 16 | K3s `StatefulSet` in namespace `trimly-co-ke` |
| MinIO (S3) | K3s `StatefulSet` in namespace `trimly-co-ke` |
| Cron jobs | K3s `CronJob` resources in namespace `trimly-co-ke` |
| TLS | Traefik + Let's Encrypt (resolver `le`) |
| Image registry | `ghcr.io/<owner>/trimly-co-ke` |

Project name (per AGENTS.md): **`trimly-co-ke`** — derived from `trimly.co.ke`.

---

## 1. One-time bootstrap (server-side)

These commands run **once**, by the operator, on the K3s control-plane node.

### 1.1 Create the namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 1.2 Create the GHCR image pull secret

The Next.js image lives at `ghcr.io/<owner>/trimly-co-ke`. If the GHCR package is **private**, K3s needs credentials. Generate a GitHub Personal Access Token (classic) with **`read:packages`** scope, then:

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --namespace=trimly-co-ke \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<your-PAT> \
  --docker-email=<your-email>
```

> If the GHCR package is set to **public** (Settings → Packages → trimly-co-ke → Change visibility), skip this step and remove the `imagePullSecrets` block from `deploy.yaml` and `migrate-job.yaml`.

### 1.3 Create the application Secret

Real secret values are applied imperatively — **never committed to git**. Example (replace every `...` with a real value):

```bash
POSTGRES_PWD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
MINIO_ROOT_PWD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
CRON_SECRET="$(openssl rand -hex 32)"

kubectl create secret generic trimly-co-ke-secret \
  --namespace=trimly-co-ke \
  --from-literal=POSTGRES_PASSWORD="${POSTGRES_PWD}" \
  --from-literal=DATABASE_URL="postgres://trimly-co-ke:${POSTGRES_PWD}@trimly-co-ke-db:5432/trimly-co-ke_db?schema=public" \
  --from-literal=NEXTAUTH_SECRET="${NEXTAUTH_SECRET}" \
  --from-literal=PAYSTACK_SECRET_KEY="sk_live_..." \
  --from-literal=PAYSTACK_WEBHOOK_SECRET="..." \
  --from-literal=RESEND_API_KEY="re_..." \
  --from-literal=AT_USERNAME="..." \
  --from-literal=AT_API_KEY="..." \
  --from-literal=MINIO_ROOT_USER="trimly_admin" \
  --from-literal=MINIO_ROOT_PASSWORD="${MINIO_ROOT_PWD}" \
  --from-literal=STORAGE_ACCESS_KEY="..." \
  --from-literal=STORAGE_SECRET_KEY="..." \
  --from-literal=GOOGLE_CLIENT_ID="...apps.googleusercontent.com" \
  --from-literal=GOOGLE_CLIENT_SECRET="..." \
  --from-literal=POSTHOG_KEY="phc_..." \
  --from-literal=POSTHOG_HOST="https://eu.posthog.com" \
  --from-literal=SENTRY_DSN="https://...@sentry.io/..." \
  --from-literal=CRON_SECRET="${CRON_SECRET}"
```

Save those values into your password manager **before** you close the terminal — Kubernetes Secrets are base64, not encrypted at rest, but you cannot recover them in plaintext from `kubectl get secret` without `-o jsonpath` + `base64 -d` rituals, so just keep them somewhere safe.

### 1.4 Apply the persistent infrastructure

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
```

Wait until Postgres and MinIO are `Running`:

```bash
kubectl get pods -n trimly-co-ke -w
```

### 1.5 Create the MinIO bucket and app-scoped credentials

The MinIO `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` you set in step 1.3 do **not** auto-create themselves — they need to be provisioned inside MinIO. Easiest path: shell into the MinIO pod and use `mc`:

```bash
kubectl exec -it -n trimly-co-ke trimly-co-ke-minio-0 -- sh

# inside the pod:
mc alias set local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb local/trimly-co-ke-uploads
mc anonymous set download local/trimly-co-ke-uploads   # public read for served assets
mc admin user svcacct add local "$MINIO_ROOT_USER" \
  --access-key "<STORAGE_ACCESS_KEY-from-secret>" \
  --secret-key "<STORAGE_SECRET_KEY-from-secret>"
exit
```

### 1.6 Point DNS at the K3s server

In your DNS provider, add A records pointing to the K3s server IP:

| Host | Type | Value |
|---|---|---|
| `trimly.co.ke` | A | `<K3S_SERVER_IP>` |
| `www.trimly.co.ke` | A | `<K3S_SERVER_IP>` |
| `storage.trimly.co.ke` | A | `<K3S_SERVER_IP>` |

Traefik + Let's Encrypt will issue certs automatically the first time a request hits each hostname.

### 1.7 First image build & deploy

After pushing the repo to GitHub, set these repo secrets at **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | The private key for an `ubuntu` user on the K3s server that has `kubectl` access |
| `SERVER_IP` | Public IP of the K3s server |

The workflow will run on the next push to `main` and:

1. Build the Docker image
2. Push to `ghcr.io/<owner>/trimly-co-ke:<sha>` and `:latest`
3. SSH in, `kubectl apply` the manifests, set the new image tag, and wait for rollout

### 1.8 Initial Prisma migration

After the first successful deploy, run the migration job:

```bash
kubectl delete job trimly-co-ke-migrate -n trimly-co-ke --ignore-not-found
kubectl apply -f k8s/migrate-job.yaml
kubectl logs -f job/trimly-co-ke-migrate -n trimly-co-ke
```

---

## 2. Required GitHub Secrets

| Secret | Purpose | Example format |
|---|---|---|
| `SSH_PRIVATE_KEY` | SSH key into the K3s server (the matching public key must be in `~/.ssh/authorized_keys` for user `ubuntu`) | Full PEM, including `-----BEGIN ... PRIVATE KEY-----` lines |
| `SERVER_IP` | K3s server's public IP | `203.0.113.45` |
| `GITHUB_TOKEN` | Auto-provided by Actions | _(do not set manually)_ |

---

## 3. Required Kubernetes Secret keys (`trimly-co-ke-secret`)

| Key | Purpose |
|---|---|
| `POSTGRES_PASSWORD` | Postgres user password |
| `DATABASE_URL` | Full Prisma connection string |
| `NEXTAUTH_SECRET` | NextAuth session signing key |
| `PAYSTACK_SECRET_KEY` | Paystack server key (`sk_live_...`) |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack HMAC webhook secret |
| `RESEND_API_KEY` | Transactional email |
| `AT_USERNAME` | Africa's Talking SMS username |
| `AT_API_KEY` | Africa's Talking SMS key |
| `MINIO_ROOT_USER` | MinIO admin user |
| `MINIO_ROOT_PASSWORD` | MinIO admin password |
| `STORAGE_ACCESS_KEY` | App-scoped MinIO access key |
| `STORAGE_SECRET_KEY` | App-scoped MinIO secret key |
| `GOOGLE_CLIENT_ID` | NextAuth Google provider |
| `GOOGLE_CLIENT_SECRET` | NextAuth Google provider |
| `POSTHOG_KEY` | Analytics |
| `POSTHOG_HOST` | Analytics host (`https://eu.posthog.com`) |
| `SENTRY_DSN` | Error tracking |
| `CRON_SECRET` | Bearer token shared by CronJobs and the Next.js cron endpoints |

`PAYSTACK_PUBLIC_KEY` lives in the **ConfigMap**, not the Secret, since it's safe to expose to browsers.

---

## 4. Routine operations

### Tail logs

```bash
kubectl logs -f -n trimly-co-ke deployment/trimly-co-ke-deployment
kubectl logs -f -n trimly-co-ke statefulset/trimly-co-ke-db
kubectl logs -f -n trimly-co-ke statefulset/trimly-co-ke-minio
```

### Restart the app

```bash
kubectl rollout restart deployment/trimly-co-ke-deployment -n trimly-co-ke
```

### Run a Prisma migration

```bash
kubectl delete job trimly-co-ke-migrate -n trimly-co-ke --ignore-not-found
kubectl apply -f k8s/migrate-job.yaml
kubectl logs -f job/trimly-co-ke-migrate -n trimly-co-ke
```

### Trigger a CronJob ad-hoc (test M-Pesa renewal)

```bash
kubectl create job --from=cronjob/trimly-co-ke-mpesa-renewal \
  manual-mpesa-renewal-$(date +%s) -n trimly-co-ke
```

### Connect to Postgres from your laptop (debug only)

```bash
kubectl port-forward -n trimly-co-ke svc/trimly-co-ke-db 5432:5432
# in another terminal:
psql "postgres://trimly-co-ke:<pwd>@127.0.0.1:5432/trimly-co-ke_db"
```

### Open the MinIO console

```bash
kubectl port-forward -n trimly-co-ke svc/trimly-co-ke-minio 9001:9001
# then visit http://127.0.0.1:9001 and log in with MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
```

---

## 5. Rotating a secret

```bash
# 1. Generate the new value
NEW_NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# 2. Patch the Secret in-place
kubectl patch secret trimly-co-ke-secret -n trimly-co-ke \
  --type='json' \
  -p="[{\"op\":\"replace\",\"path\":\"/data/NEXTAUTH_SECRET\",\"value\":\"$(echo -n "${NEW_NEXTAUTH_SECRET}" | base64 -w0)\"}]"

# 3. Roll the pods so they pick up the new env values
kubectl rollout restart deployment/trimly-co-ke-deployment -n trimly-co-ke
```

---

## 6. Troubleshooting

### Pods stuck in `ImagePullBackOff`

- The GHCR package may be private and `ghcr-pull-secret` is missing or has a bad PAT. Recreate it (step 1.2).
- The PAT may have expired. Generate a new one with `read:packages`.

### Pods stuck in `CrashLoopBackOff`

- Almost always missing or wrong env values. `kubectl logs <pod> -n trimly-co-ke --previous` shows the last failure.
- For the web app, the first line is usually a Prisma connection error — verify `DATABASE_URL` resolves to `trimly-co-ke-db:5432` from inside the pod:
  `kubectl exec -it <pod> -n trimly-co-ke -- nc -zv trimly-co-ke-db 5432`

### TLS cert not issued

- Wait 60 seconds — Let's Encrypt's HTTP-01 challenge needs the DNS A record to be in place first.
- Check Traefik logs: `kubectl logs -n kube-system -l app.kubernetes.io/name=traefik`.
- Hitting Let's Encrypt rate limits during testing? Switch to the staging resolver temporarily in the Ingress annotations.

### Cron job not firing

- `kubectl get cronjobs -n trimly-co-ke` — check `LAST SCHEDULE`.
- `kubectl get jobs -n trimly-co-ke` — see which executions ran.
- Verify the K3s control plane runs at least version 1.27 (required for `spec.timeZone`).
