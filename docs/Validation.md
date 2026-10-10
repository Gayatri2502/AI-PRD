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
