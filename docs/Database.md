# Database

The Prisma schema lives in `database/schema.prisma` and maps the SaaS domain:

- Users and Supabase identity mapping
- Projects and PRDs
- Messages and AI usage
- Templates and exports
- Credits
- Teams and members
- Billing records
- Activity logs
- Version history

Use `npm run db:migrate` for local migration development and `npm run db:push` for quick schema syncs.
