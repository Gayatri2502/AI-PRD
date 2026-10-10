> Backend update: Firebase Authentication, Firestore and Cloud Storage replace the earlier Supabase design. See [current deployment details](Deployment.md). SQL/RLS notes below describe the retired design, not the active backend.

# Architecture

Next.js serves the landing/auth screens and single dashboard. Supabase Auth provides verified user identities. Server routes validate sessions and own-business access before using a server-only service client. RLS permits users to read only their records; direct client mutations are denied.

Signed uploads go to private Storage. PostgreSQL jobs retain payload, progress, attempts and lease. A separate worker runs provider adapters, parsers, extraction, vector indexing and report rendering. Provider errors produce visible failed/retry states; configuration failures are never mocked as success.

Financial calculations are pure deterministic TypeScript with Decimal.js. React preview, PDF, Word and Excel share the same validated model. Style settings do not change results. Excel contains explicit input, opening-balance, loan and projected-statement formulas.

Public reference versions/chunks and private user embeddings are separate tables. Public references carry provenance; private retrieval is constrained by auth.uid() and business ownership. Uploads, extracted figures, conversations, assumptions and report versions carry owner/business composite references.
