# Architecture

AI PRD is a Next.js App Router SaaS application. Supabase handles authentication and storage, Prisma owns PostgreSQL access, OpenAI powers PRD generation, Stripe handles subscriptions, and Vercel hosts the app.

## Main Areas

- Marketing route group for landing, pricing, templates, FAQ, contact, and footer content.
- Auth pages for login, signup, password reset, email verification redirect, and protected route middleware.
- Dashboard for recent projects, templates, credits, analytics, team, and billing entry points.
- Workspace with left navigation, central PRD editor, and right AI assistant.
- API layer for AI, projects, exports, billing, and webhooks.
