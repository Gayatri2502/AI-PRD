# AI PRD API

## Authentication

Protected routes use Supabase Auth cookies through `@supabase/ssr` middleware. Client flows live in `/login`, `/signup`, and `/forgot-password`.

## Routes

- `POST /api/ai`: runs a modular OpenAI prompt. Body: `{ kind, input, context? }`.
- `GET /api/projects`: returns the current user's projects.
- `POST /api/projects`: creates a project and initial PRD.
- `POST /api/export`: exports content as Markdown, HTML, JSON, or DOCX.
- `POST /api/billing/checkout`: creates a Stripe Checkout subscription session.
- `POST /api/stripe/webhook`: verifies and receives Stripe events.
