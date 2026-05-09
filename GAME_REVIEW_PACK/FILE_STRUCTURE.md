# File Structure

This pack mirrors only the source code, configs, and docs needed to understand the project. Painted PNGs, audio, lockfiles, builds, and dependencies are excluded.

## Real project layout (relevant parts)

```
shattered-veil-monorepo/
├── artifacts/
│   ├── shattered-veil/             ← the game (web artifact)
│   │   ├── src/
│   │   │   ├── Game.jsx            ← entire game logic + JSX (~8880 lines)
│   │   │   ├── game.css            ← stylesheet (~5878 lines)
│   │   │   ├── music.js            ← procedural music + SFX engine
│   │   │   ├── App.tsx             ← renders <Game />
│   │   │   ├── main.tsx            ← React entry
│   │   │   ├── index.css           ← intentionally minimal (no Tailwind)
│   │   │   ├── components/ui/      ← shadcn-style scaffold (UNUSED by Game.jsx)
│   │   │   └── pages/              ← scaffold leftover (UNUSED)
│   │   ├── public/                 ← painted PNG assets (EXCLUDED from pack)
│   │   │   ├── title-veil.png, forge-hall.png, town-square.png, swim-icon.png
│   │   │   ├── battle-arena.png, battle-rift.png, battle-forest.png
│   │   │   ├── class/<id>.png, class/<id>_f.png   (21 classes × 2 sex variants)
│   │   │   ├── boss/<bossKey>.png                 (40 painted bosses)
│   │   │   ├── el/<element>.png                   (18 element sigils)
│   │   │   ├── bm/<bloodmarkId>.png               (8 bloodmark sigils)
│   │   │   ├── biome/<biome>.png                  (10 painted biome textures)
│   │   │   ├── poi/<poiKey>.png                   (10 painted POI tile scenes)
│   │   │   ├── sky/h00.png … h23.png              (24 hourly painted skies)
│   │   │   ├── res/{gold,frag,shard,fish,bank,loan}.png  (HUD resource icons)
│   │   │   └── ui/                                (assorted UI icons)
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   ├── api-server/                 ← Express backend for global chat
│   │   └── src/
│   │       ├── index.ts            ← server entry
│   │       ├── app.ts              ← Express app wiring
│   │       ├── routes/
│   │       │   ├── index.ts        ← route registration
│   │       │   ├── health.ts       ← /api/healthz
│   │       │   └── veilcourt.ts    ← global chat + DM threads + roster + presence
│   │       └── lib/logger.ts
│   └── mockup-sandbox/             ← design exploration sandbox (not game)
├── lib/                            ← shared workspace libs (codegen output, hooks, etc — not game-relevant)
├── docs/
│   └── changelog.md                ← v29–v74 condensed implementation history
├── package.json                    ← root task orchestration
├── pnpm-workspace.yaml             ← workspace + dependency catalog
├── tsconfig.base.json              ← shared TS strict defaults
├── tsconfig.json                   ← solution config for libs only
└── replit.md                       ← living architecture + preferences README
```

## What's in this pack (`GAME_REVIEW_PACK/`)

```
GAME_REVIEW_PACK/
├── PROJECT_OVERVIEW.md             ← what this game is + read order
├── FILE_STRUCTURE.md               ← this file
├── GAME_SYSTEMS.md                 ← combat / classes / enemies / items / map / save / etc.
├── CURRENT_ISSUES.md               ← known bugs, TODOs, deferred items
├── docs/
│   ├── replit.md                   ← living architecture README
│   └── changelog.md                ← v29–v74 implementation history
└── source/
    ├── shattered-veil/
    │   ├── Game.jsx                ← THE game (single-component, all logic + JSX)
    │   ├── game.css                ← THE stylesheet (vNN block markers map to changelog)
    │   ├── music.js                ← procedural audio engine
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   ├── index.html
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── tsconfig.json
    ├── api-server/
    │   ├── index.ts
    │   ├── app.ts
    │   ├── package.json
    │   ├── routes/
    │   │   ├── index.ts
    │   │   ├── health.ts
    │   │   └── veilcourt.ts        ← chat + DM threads + roster + presence
    │   └── lib/logger.ts
    └── workspace/
        ├── package.json            ← root scripts
        ├── pnpm-workspace.yaml     ← catalog pins (no secrets)
        ├── tsconfig.base.json
        └── tsconfig.json
```

## What was deliberately excluded

- `node_modules/`, `.git/`, `dist/`, build/cache folders.
- All painted PNG assets (`artifacts/shattered-veil/public/**`) — totals dozens of MB. Filenames + paths are documented above so the reviewer knows what each asset slot is.
- `pnpm-lock.yaml`.
- Any audio files (the engine generates audio at runtime, no audio assets ship).
- `.env*` files, `.replit`, `.replit-artifact/` files — none contained secrets relevant to game logic, but excluded for safety.
- `attached_assets/`, `lib/` codegen outputs, the mockup-sandbox artifact.
- `node_modules`, lockfiles, and any bundled output.

## Key entry points

- **Run the game (dev):** `pnpm --filter @workspace/shattered-veil run dev` (Vite, port from `PORT` env, default 21515).
- **Run the API server:** `pnpm --filter @workspace/api-server run dev`.
- **React entry:** `src/main.tsx` → `App.tsx` → `<Game />` (the entire game).
- **Backend entry:** `src/index.ts` → `app.ts` → `routes/index.ts` → `routes/veilcourt.ts`.
