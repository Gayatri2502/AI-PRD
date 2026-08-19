# Contributing

Use npm scripts from `package.json`.

1. Configure `.env.local` with Supabase, database, OpenAI, and Stripe values.
2. Run `npm install`.
3. Run `npm run db:push` to sync the Prisma schema.
4. Run `npm run dev`.
5. Before shipping, run `npm run typecheck` and `npm run build`.
