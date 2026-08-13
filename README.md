# حَكي

Next.js + Prisma + PostgreSQL (Supabase).

## Vercel + Supabase

For a Vercel/serverless deployment, set `DATABASE_URL` to the **Supabase Shared Pooler — Transaction mode** connection string (port `6543`).

The application automatically adds the Prisma settings required for Supabase transaction pooling:

- `pgbouncer=true`
- `connection_limit=1`
- `connect_timeout=15`

Do not use the Supabase direct connection (`db.*.supabase.co:5432`) on Vercel's IPv4-only runtime.

## Important when deploying a new Vercel project

Environment variables belong to the Vercel project. If this ZIP is deployed as a new project, add `DATABASE_URL` in that new project's Settings → Environment Variables before testing the app.


## Vercel + Supabase
Set both `DATABASE_URL` (Transaction pooler, port 6543) and `DIRECT_URL` (Session pooler, port 5432). Prisma uses `DIRECT_URL` for `db push` during the build, while the app uses `DATABASE_URL` at runtime.
