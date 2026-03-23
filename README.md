# Daily Chaos Chess

A daily internet spectacle where the crowd decides what the chessboard becomes
next.

Users submit prompts, vote once per turn, and come back after the daily cutoff
to see what became canon. The board is rendered in 3D, but the source of truth
is a structured world state that can be adjudicated, replayed, and evolved over
time.

## Why this repo exists

This project is built around a few non-negotiables:

- Next.js App Router on Vercel
- Turso as the primary database
- clean architecture with domain/use cases at the center
- BDD-first feature coverage with executable Gherkin specs
- admin-assisted adjudication first, with auto-execute as a future toggle

## Current product loop

1. Visitors see the current board, lore, prompt feed, and countdown.
2. Signed-in users submit one prompt for what should happen next.
3. Signed-in users vote once per turn.
4. At the daily cutoff the winning prompt is frozen.
5. An admin approves a bounded action script.
6. The world state updates, lore is published, and history stays replayable.

## Tech stack

- Next.js 15
- React 19
- React Three Fiber / Three.js
- Turso + Drizzle ORM
- Vitest
- Cucumber + Gherkin
- Playwright

## Project structure

```text
src/
  app/              Next.js routes, server actions, API handlers
  application/      Use cases and ports
  components/       UI and board presentation
  domain/           Entities, policies, factories, action engine
  infrastructure/   Turso, auth, moderation, dependency container
  presentation/     Shared view helpers
features/           BDD feature files
tests/              BDD steps, in-memory test adapters, unit/e2e tests
```

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Default local DB:

```bash
TURSO_DATABASE_URL=file:./local.db
```

## Verification

```bash
pnpm typecheck
pnpm test:unit
pnpm test:bdd
pnpm build
```

## Cron

The Vercel cron endpoint lives at:

```text
/api/cron/daily
```

Protect it with:

```bash
CRON_SECRET=...
```

Send:

```text
Authorization: Bearer <CRON_SECRET>
```

## Auth for v1

This repo currently uses a lightweight cookie-based demo auth layer so the core
loop is easy to test end to end. Anonymous users can read. Signed-in users can
submit prompts and vote. Admin cookie mode unlocks adjudication and automation
controls.

## License and hosting attribution

The codebase is intended to ship under `AGPL-3.0-only` so hosted modifiers must
offer source to network users. A separate branding policy can ask hosted
instances to link back to the original repo or project homepage. See
`BRANDING.md`.
