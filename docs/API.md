> Backend update: Firebase Authentication, Firestore and Cloud Storage replace the earlier Supabase design. See [current deployment details](Deployment.md). SQL/RLS notes below describe the retired design, not the active backend.

# API

`GET /api/workspace` returns the authenticated user's single workspace, conversations, uploads, figures, jobs and report versions. `POST /api/workspace` supports create, revision-checked save, signed upload preparation/completion, conversation, transcript correction, figure review, report generation and failed-job retry. Ownership is derived from the verified session.

`GET /api/workspace/download?id=<report UUID>&format=pdf|docx|xlsx` verifies ownership and redirects to a private signed URL expiring in 60 seconds.

`GET /api/auth/callback` exchanges a Supabase PKCE code and redirects to the dashboard or password recovery screen.

Legacy general-document/Firebase API routes return 410. Only Project Report and CMA report values pass validation.
