# Contributing

Thanks for helping build Daily Chaos Chess.

This project works best when contributions make the daily loop sharper, funnier,
clearer, or more dramatic without muddying the underlying architecture.

## Before you start

- read [README.md](../README.md)
- skim [progress.md](../progress.md) for current direction and gotchas
- check whether an issue is already labeled `good first issue` or `help wanted`

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Useful verification commands:

```bash
pnpm typecheck
pnpm test:unit
pnpm test:bdd
pnpm build
```

## Architecture expectations

- keep domain rules and use cases inside the clean architecture boundaries
- treat the Three.js scene as a renderer, not the source of truth
- prefer small, demoable improvements over broad platform work
- when adding behavior, update tests or feature specs when it matters
- keep new visual assets decorative unless they are backed by real world state

## Good contribution shapes

- polish the 3D board without breaking the canonical model
- improve history/replay legibility
- make prompt submission and voting clearer
- add tasteful chaos props, lighting, or animation
- tighten admin adjudication flows
- improve docs for contributors

## Pull requests

- explain the user or contributor problem solved
- mention any tradeoffs
- include screenshots for UI changes when possible
- list the verification commands you ran
