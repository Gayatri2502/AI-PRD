# Firebase + Vercel deployment

The active backend uses Firebase Authentication, Firestore and private Cloud Storage. Supabase is no longer used by application routes.

1. Enable Firebase email/password sign-in. Add localhost and your final hosting domain to Authentication → Settings → Authorized domains. Configure recovery/verification email templates and delivery.
2. Copy `.env.example` to `.env.local`. Set the public web configuration and server-only service account. Never commit service account secrets. Use a least-privilege account with Authentication, Firestore and the selected storage bucket access.
3. Provision a Firebase Storage bucket and set both `FIREBASE_STORAGE_BUCKET` and `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`. Cloud Storage may require billing; check your account before enabling a paid plan.
4. Deploy `firestore.rules`, `firestore.indexes.json` and `storage.rules` with `firebase deploy --only firestore,storage --project YOUR_PROJECT`. Storage rules use Firestore upload registrations; enable the required cross-service rule permission when Firebase requests it.
5. Configure each AI provider's URL, key and model. No provider is silently substituted. Index the public references with `npm run references:ingest` after setting the embedding provider.
6. Link this repo to a Vercel project and set the environment variables for its Preview/Production environments. Do not upload `.env.local` as a source file. Run `vercel deploy` for a preview, review it, then promote the reviewed deployment.
7. Run the live Firebase integration checks below and complete a browser upload/report workflow before public launch.

## Background work

New jobs trigger an owner-scoped `after()` worker after the HTTP response. Work remains durable in Firestore with a ten-minute lease, three automatic attempts and progress. Vercel handlers request 300 seconds, subject to the account's runtime limits. Long OCR batches should use the persistent `npm run worker` process on a separate Node host. A terminated invocation is recovered by that worker.

`GET /api/jobs/run` runs one queued job and requires `Authorization: Bearer CRON_SECRET`. Configure a scheduler or a persistent worker for retries and interrupted work; no scheduler is silently enabled or billed. Keep this secret server-only and at least 32 random bytes. Do not use a public URL containing the secret.

Uploads travel directly from the Firebase-authenticated browser to Cloud Storage (25 MB maximum). This avoids Vercel's 4.5 MB function body limit. The server verifies the registered owner and actual file size before processing. Downloads use a 60-second signed URL.

## Validation

```sh
npm run typecheck
npm test
npm run build
ALLOW_INTEGRATION_TESTS=true node --env-file=.env.local --import tsx tests/firebase-live.ts
```

The live script creates unique fictional test records/users and removes only those records. It checks Firebase sessions, owner filters, optimistic revision writes, queue ownership and direct-client read denial. Storage, email delivery and paid provider workflows require additional live checks.

## Operational limits

Firestore documents have a 1 MiB limit. Keep financial histories and narrative inputs bounded; very large report calculations should be externalised to private Storage before scaling. Current reference retrieval scans a small versioned public corpus using cosine similarity; migrate to indexed vector search for a large corpus. Configure budget alerts, provider limits, monitoring, backups and a retention/deletion policy before opening public registration.

References: [Vercel payload limits](https://vercel.com/docs/functions/limitations), [Firebase cross-service rules](https://firebase.google.com/docs/rules/manage-deploy).
