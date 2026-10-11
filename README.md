# Folio Finance

A focused Indian business-lending workspace for **Business Project Reports** and **CMA Reports**. This repository replaces the former software-PRD/document-library application.

## Run locally

Requires Node.js 22.13+ (tested with Node 26), npm, a Firebase project and API providers for external processing.

```sh
npm ci
cp .env.example .env.local
# Fill .env.local locally. Never commit real credentials.
npm run dev -- --port 3100
# In a second terminal:
npm run worker
```

Set the Firebase public web configuration and server-only service-account variables. Enable email/password authentication and private Cloud Storage. Deploy the included Firestore/Storage rules. Add your hosting domain to Firebase Authentication's authorized domains. See [deployment instructions](docs/Deployment.md).

Missing provider credentials produce configuration errors. Firebase database/auth connectivity has been checked; file storage and hosted processing must be validated separately. No cloud Supabase resources are deleted by this migration.

## What is implemented

- Landing, authentication/recovery and one responsive dashboard, with saved reports in the dashboard.
- Browser microphone recording, audio uploads, editable transcripts, typed conversation, one-question discovery and optional device speech. English, Hindi, Marathi and mixed-language transcription depends on the selected STT model; device voices vary.
- Direct authenticated uploads to private Firebase Storage; multi-file/folder inputs; searchable PDF, image/scanned PDF OCR, Word, Excel and CSV parsing. Important extracted figures retain file, location, period, unit, supporting quote and confidence. Users review figures and apply them to their assumptions/accounts.
- Durable Firestore jobs with leases, progress, retries, owner checks and daily quotas; a separate worker runs transcription, extraction, formatting analysis and report generation. Vercel starts an owner-scoped worker after enqueueing; a persistent worker or scheduler is needed to recover interrupted jobs.
- Decimal-based calculations, historical/provisional/estimated/projected labels, project funding, P&L, balance sheets, operating working capital, cash/funds movements, monthly loan schedules, ratios, DSCR and break-even. Financial errors block generation.
- PDF, editable DOCX and formula-based XLSX exports. Three original styles. PDF tables are split into bounded page batches with repeated headers and landscape pages for wide schedules. PDF embeds a licensed Devanagari font. Charts can be disabled.
- Versioned public-reference ingestion and cosine-similarity retrieval from Firestore, separate from owner-scoped private document embeddings. Source URLs, hashes, retrieval time, pages and metadata are retained. External processing requires explicit consent.

## Provider configuration

Set `FIREBASE_AI_MODEL` to use the enabled Firebase AI Logic Gemini backend for conversation, extraction assistance, transcription and OCR. A live structured discovery check passed with `gemini-3.5-flash-lite`. This does not configure embeddings. App Check/abuse protection and provider retention must be reviewed before public release.


Speech, chat, embeddings and OCR are replaceable OpenAI-compatible HTTP adapters. Set each `*_BASE_URL`, `*_API_KEY` and `*_MODEL`. Base URLs include the API version, for example `https://provider.example/v1`. STT uses `/audio/transcriptions`, chat/vision OCR use `/chat/completions`, and embeddings use `/embeddings`. The selected embedding model must return 1536 dimensions; changing dimensions requires reindexing. Provider capacity, pricing, retention and language support must be reviewed for the selected account.

No private audio/documents are sent to providers until the user permits external processing. Printed instructions inside documents and websites are treated as data. A separate review step is required for extracted financial values and final assumptions.

## Reference knowledge

```sh
npm run references:fetch
npm run references:ingest
```

The crawler checks robots.txt, waits between requests, follows a small allowlist of related lending paths, and records failures. Raw third-party files remain ignored by Git. `reference-material/manifest.json` records provenance. Full PDFs are not redistributed. Retrieved sample figures and company information are not used as business data. The supplied universal product PRD is not a financial-report template.

See [reference notes](docs/References.md), [calculation methods](docs/Financial-methods.md), [deployment](docs/Deployment.md), and [validation status](docs/Validation.md).

## Validation

```sh
npm run typecheck
npm test
npm run build
npm run samples
# Explicitly opted-in Firebase integration checks:
ALLOW_INTEGRATION_TESTS=true node --env-file=.env.local --import tsx tests/firebase-live.ts
```

Tests use fictional new, trading and service scenarios. Mock-provider tests validate adapters; they are not evidence of live provider performance. Sample exports are written outside the repository to `../../outputs/finance-samples`.

## Financial scope and limitations

The default forecast is an explicitly confirmed assumption model, not statistical forecasting. Working capital uses 365-day cycles. Existing term loans require individual balances/rates/remaining terms. Opening revolving debt is maintained at its confirmed balance and rate; additional borrowing, seasonal cash budgets, changing interest rates, balloon loans and lender-specific CMA classifications require further modelling. No universal MPBF method or ratio benchmark is assumed. Historical DSCR is omitted without a term-interest split.

Capitalised moratorium interest is added to asset cost and loan principal under the selected assumption; confirm accounting/tax eligibility with the accountant. Tax is an effective-rate assumption, not a tax computation. Negative closing cash blocks reports. Lender-specific assessment is applied only after a source and user confirmation; this is not independent verification or a sanction.

Reports are drafts for review, even after inputs are confirmed. Folio is not a licensed CA and does not issue audit opinions, certificates or loan approvals.

## Security

Client Firestore reads/writes are denied. Authenticated Node routes verify Firebase session cookies and owner filters; optimistic draft writes and processing quotas use Firestore transactions. Storage creates are restricted to the signed-in owner and a server-registered upload. Downloads use 60-second signed links. Keep credentials server-only. See the validation record before treating this as a public production service.

### Folio voice assistant

Set `FIREBASE_CHAT_MODEL=gemini-3.5-flash` for conversation and narrative reasoning. `FIREBASE_AI_MODEL` remains the base model for transcription and other multimodal processing; if the chat override is absent, chat uses that base model. Keys stay in the existing Firebase configuration. Tap Folio to begin a hands-free turn-taking conversation and tap again to end. Visible feedback distinguishes microphone permission, listening, transcription, reasoning and spoken playback. Audio playback uses the browser’s device voices, not Gemini native audio. Language, uploads and transcript history are collapsed by default. Consent and an authenticated session are required.
