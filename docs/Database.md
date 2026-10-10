> Backend update: Firebase Authentication, Firestore and Cloud Storage replace the earlier Supabase design. See [current deployment details](Deployment.md). SQL/RLS notes below describe the retired design, not the active backend.

# Database

Use the migration in `supabase/migrations`. Private tables: businesses, conversations, uploads, extracted_figures, assumptions, report_versions, jobs and private_embeddings. Public reference knowledge: reference_versions and reference_chunks. Embeddings use pgvector with 1536 dimensions.

Each private table has RLS and owner-scoped SELECT policies. Writes require authenticated server routes using the service role after explicit ownership checks. Composite owner/business foreign keys reject cross-owner relationships. Job enqueueing uses a per-owner advisory lock for atomic quotas. Workers claim jobs using SKIP LOCKED leases.

The DATABASE_URL is server-side only. No password is supplied in source. A dedicated test-project integration script checks owner reads, cross-user/anonymous denial and privileged-job access denial. Run it after migrating the actual project.
