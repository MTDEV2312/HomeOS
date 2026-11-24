# HomeOS - Backend Guidelines (Supabase)

This project uses **Supabase** (`@supabase/supabase-js`) for:
- **Database**: PostgreSQL with PostgREST (`supabase.from(...)`, `supabase.rpc(...)`) and Row-Level Security (RLS) scoped by household membership.
- **Authentication**: Email/password, OTP email verification, password reset, and user profile metadata (`user_metadata`).
- **Storage**: Public buckets (`avatars`, `household-documents`) protected by `storage.objects` RLS policies.
- **Realtime**: `postgres_changes` subscriptions via `supabase.channel(...)`.

## Environment Variables

Configure these in `.env.local` (never commit secrets):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Notes
- Client entrypoint: `src/lib/supabase.ts`
- Auth context: `src/lib/auth-context.tsx`
- Services: `src/services/*.ts`
- Tailwind CSS v4 (`^4.3.3`) is configured in `package.json`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
