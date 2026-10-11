# Validation — 10 October 2026

## Passed

- Production Next.js build and TypeScript checks after Firebase migration.
- 13 automated tests: fictional new, trading and service scenarios; funding, cash, balance-sheet and loan reconciliations; unknown inputs; moratorium and existing debt; lender-method confirmation; unit/style invariance; extraction failures/conflicts; PDF/DOCX/XLSX generation; mock provider contracts.
- Live Firebase connection to Authentication and Firestore in `folio-documents-20261007`.
- Opted-in live suite: temporary user/custom-token login, session-cookie verification, owner filtering, concurrent revision protection, quota ownership and direct client-read denial. Synthetic records are cleaned after the test.
- Firestore rules and index exemptions deployed to the live Firebase project. Existing unrelated indexes were preserved.
- All four requested public reference sources retrieved, with hashes and retrieval metadata in the manifest.

## Dependency audit

`npm audit fix` applied compatible updates. The remaining audit reports 20 findings (12 high, 8 moderate), including transitive gRPC, build-tool CSS/pattern parsers, and document-library dependencies. Suggested automatic fixes include breaking upgrades/downgrades; these were not forced. Dependency remediation and reachability review remain release gates.

## Pending before public launch

- Private Storage provisioning/configuration and deployment of its rules. Firebase CLI is authenticated, but the project has billing disabled and no buckets. User approval of a billing plan is pending. File upload/download round trips are not yet validated.
- Vercel CLI 63.1.2 is authenticated and linked to `folio-finance` with GitHub integration. The initial preview reached Ready. Firebase AI Logic was then enabled and a live structured discovery test succeeded using fictional business data; the updated preview is deployed separately.
- Live multilingual audio/OCR checks and embedding provider setup. Firebase AI Logic conversation has passed a live structured-output check; remaining automated provider tests use mock HTTP responses.
- Public reference embedding ingestion, scheduled recovery of interrupted jobs, operational monitoring, backups, retention/deletion and billing controls.
- Final visual QA of all regenerated document pages and spreadsheet recalculation. Earlier samples caught and corrected repayment pagination and historical DSCR formula issues; do not treat sample binary generation as complete layout certification.

This is an implemented application undergoing integration validation, not a certified production financial service. Financial drafts require human review; no CA certification or loan sanction is implied.

## Authentication, voice and AI usage update — 11 October 2026

- Fixed a deployed Firebase Admin import failure: `jwks-rsa` loaded an ESM-only `jose` using CommonJS. Pin its nested dependency to compatible `jose` 5 and run deployment on Node 24 (required by Firebase SDK 13).
- Same-origin validation compares the request's public Host with Origin, rather than Next's internal bind URL. Cross-origin and missing-origin session requests remain rejected.
- Auth forms explain duplicate accounts, allow existing passwords on sign-in, and retain the created-account state if secure-session establishment needs a retry.
- API consumers reject HTML gateway responses with a readable service error instead of attempting JSON parsing.
- Firebase AI response metadata feeds private per-user, per-UTC-day token counters. The dashboard distinguishes measured tokens from the application's 100 daily processing requests. This is not the provider's project-wide remaining quota. Counts start with this release; prior usage cannot be reconstructed. Failed requests without returned usage metadata cannot be counted.
- Recorded voice is transcribed through an authenticated, consent-gated endpoint, maximum 4 MB, sharing the daily request allowance. Audio is held in request memory, sent to the configured provider, and not saved to Firebase Storage. The editable transcript is returned for review. The endpoint is synchronous and retryable; long audio/file-upload jobs still require Storage.
- Landing page includes an original SVG illustration, an accessible four-step interactive diagram, reduced-motion styles, and a real AI example using a fixed fictional business. Live examples require sign-in and count against the daily request allowance.
- Local production-server checks with real Firebase: session HTTP 200, authenticated workspace HTTP 200, unauthenticated workspace JSON HTTP 401, AI output and positive provider token accounting. Temporary accounts and usage records are removed afterwards.
- Voice endpoint successfully transcribed Google's public Brooklyn Bridge WAV reference. Source: https://docs.cloud.google.com/speech-to-text/docs/v1/sync-recognize. A failed local text-to-speech fixture was found to contain no audio; empty recordings and no-speech responses now receive explicit handling.
- Deployment verification is separate from these local checks; use `SMOKE_ORIGIN=https://your-domain SMOKE_AI=1 node --env-file=.env.local --import tsx scripts/check-deployed-auth.ts` after deployment. Optional `SMOKE_AUDIO` points to a WAV fixture; `SMOKE_AUDIO_EXPECT` supplies the expected phrase (default Brooklyn Bridge).
- Remaining: private file storage requires bucket provisioning/billing; provider App Check and broader multilingual speech accuracy evaluation are still required before unrestricted public rollout.
