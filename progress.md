Original prompt: Build v1 as a Next.js app on Vercel with a strict clean-architecture split: domain rules and use cases in the center, adapters around them, and the 3D board as a replaceable presentation layer. Use Turso as the system of record, admin-assisted daily turn resolution first, and an explicit feature flag to switch specific environments into full auto later.

# Progress

## What exists
- Next.js App Router app with clean architecture across `src/domain`, `src/application`, `src/infrastructure`, and `src/app`.
- BDD feature coverage for the core turn loop, including a deliberately funny chaos scenario.
- Homepage redesigned into a near full-screen board stage with a small scroll cue into the prompt feed.
- Three.js board upgraded with real CC0 environment assets from Kenney Castle Kit under `public/assets/kenney/castle-kit/`.

## What works
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:bdd`
- `pnpm typecheck` after Next route types are generated

## Current polish direction
- Visual style is aiming for a minimal editorial shell inspired by `mdht.vercel.app`.
- Board staging is aiming for a full-canvas theatrical feel inspired by `chess-3d-mja9.vercel.app`.
- Imported props remain decorative only; canonical game state still comes from structured `WorldState`.

## Known gotchas
- Fresh clones need Next route types generated before `tsc` checks the `.next/types` include set.
- Auth is still a lightweight demo adapter, which is intentional for v1.
- Auto execution is deterministic and bounded, not an AI game-master yet.

## Next good steps
- Make `pnpm typecheck` self-sufficient with `next typegen`.
- Replace remaining procedural chaos props with a more cohesive CC0 fantasy/ritual pack.
- Add a proper replay animation for turn-to-turn board mutations on the history page.
