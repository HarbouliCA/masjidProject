# منصة مسجد النور — Masjid an-Nour Platform

Arabic-first (RTL) management platform for the Comunitat Islàmica del Solsonès —
one ledger, two books (المسجد + المدرسة), built with Next.js 15 + Firebase.

## Prerequisites

- Node.js **>= 18.18.0** (see `engines` in `package.json`).
- A Firebase project (`masjid-nour`) with Firestore + Auth (custom claims `role`, `familyId`).

## Environment variables

Copy `.env.example` to `.env.local` (dev) and `.env.production` (hosting) and fill in:

| Variable | When | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` … `APP_ID` | build time | Firebase client config (inlined into the client bundle) |
| `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY` | build time | App Check (reCAPTCHA v3 site key) |
| `FIREBASE_SERVICE_ACCOUNT` | runtime | Server-only Admin SDK JSON (server actions: user/role management) |
| `GOOGLE_APPLICATION_CREDENTIALS` | runtime | Alternative: path to the service-account key file |

> `NEXT_PUBLIC_*` are baked in at **build time**; `FIREBASE_SERVICE_ACCOUNT` /
> `GOOGLE_APPLICATION_CREDENTIALS` are read at **runtime** by server actions.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000/ar
npm run typecheck
npm run lint
npm test           # vitest unit tests
npm run test:rules # Firestore rules tests (needs emulator)
```

## Building

```bash
npm run build
```

`next.config.ts` sets `output: "standalone"`, so the build also emits a
self-contained server at `.next/standalone/` (no `node_modules` required on the
target machine).

## Deploying to Hostinger (VPS / Node.js)

This is a Node.js app, so use a **VPS** plan (or a Node.js-enabled plan) — not
the PHP-only shared hosting.

1. **Build** on the server (or build locally and upload the artifacts):

   ```bash
   npm ci
   NEXT_PUBLIC_FIREBASE_API_KEY=… \
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=… \
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=masjid-nour \
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=… \
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=… \
   NEXT_PUBLIC_FIREBASE_APP_ID=… \
   NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY=… \
   npm run build
   ```

   Or store them in `.env.production` and run `npm run build`.

2. **Assemble the standalone output** (copies `public/` and `.next/static/`):

   ```bash
   npm run deploy:copy
   ```

3. **Set runtime env** (for server actions). Provide `FIREBASE_SERVICE_ACCOUNT`
   as a JSON string in the process environment (e.g. in the PM2 ecosystem file,
   or `export` before starting).

4. **Run with PM2**:

   ```bash
   npm i -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save && pm2 startup
   ```

   The app listens on `PORT=3000` bound to `0.0.0.0`.

5. **Reverse proxy (Nginx / Hostinger)** — forward a domain (or subdomain) to
   `127.0.0.1:3000`:

   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

   Then enable HTTPS via Hostinger's SSL / Certbot.

### Updating an existing deployment

```bash
git pull
npm ci
npm run build
npm run deploy:copy
pm2 restart masjid-nour
```

## Data import

See `scripts/import-excel.ts` (dry-run by default; `--write` seeds Firestore).
Service-account credentials are required only for the import and deploy scripts,
never bundled into the client.
