# Shattered Veil — Project Overview

## What it is

**Shattered Veil — Chronicles of the Rift** is a single-page browser RPG built as one giant React component. The world is a 300×300 procedurally-generated continent of ruined sorcerer cities, drifting rifts, towns, and roaming bosses. The player picks one of 21 sorcerer classes, picks a bloodmark (innate technique), pledges a covenant, then explores, fights turn-based combat, levels up through 7 ranks, dies, and inherits to a new generation.

The aesthetic is JJK-flavored (sorcerer grades, innate techniques, "domain expansions" / unfolded territories) layered on a Veilbound-style painted parchment + navy + crimson visual identity.

## High-level architecture

- **Frontend:** one React 18 component (`Game.jsx`, ~8880 lines) holding ALL state via `useState`/`useMemo`/`useCallback`. Vite 7 dev server.
- **Backend:** small Express `api-server` artifact that powers the global chat ("the Veilcourt") + DM threads + roster + presence. In-memory state only (no DB).
- **Persistence:** localStorage. Three save slots (`sv_save_0/1/2`). Audio settings, chat identity, DM read state, music mute also kept in localStorage.
- **Audio:** `music.js` is a self-contained procedural music + SFX engine over the Web Audio API. Picks a track based on the current screen + battle type; SFX bus runs through a separate gain node.
- **Theming:** A single inline theme object `T` provides the parchment palette colors used across most UI; `game.css` overrides with `!important` for context-specific dark sections (HUD, battle, popups).

## How a typical session works

1. **Title screen** (painted hero artwork, 6 lore pillars, "Enter the Rift" CTA).
2. **Forge Your Hero** — 3 steps:
   1. Pick a class (21 painted portraits in a grid).
   2. Pick a bloodmark — either a class-innate technique (4 options) or an ancestral lineage (4 options sampled per-class).
   3. Identity — name, personal quote, sex, optional custom portrait URL.
3. **World map** — 300×300 grid, view of 15×9 painted biome tiles around the player. Click any tile to walk; double-click POIs to enter on arrival; WASD to step.
4. **POIs** the player can enter: town, hostile camp, outpost, rift, ruin, shrine, treasure, beast, den, roaming dev boss.
5. **Towns** offer ~12 services (shops, inn, bank, guild, covenant hall, relic crafting, tavern, duelist's circle, succession). Each service is its own modal screen.
6. **Battle** — turn-based on a 5-lane positional grid (Vanguard / Front / Mid / Skirmish / Backline). Player + ally + pet vs. up to N enemies. Free move per turn, range gates, distance modifiers, crits, status effects, ult charges.
7. **Death → Succession** — at 0 HP the run ends; the next generation inherits (with mutation chance) the bloodmark, plus partial bank gold and relic shards.
8. **The Veilcourt** — always-on global chat, modal accessible from any screen. Public + Private (DM threads, 1-on-1 or group up to 8). @mention badges, online roster.

## Main systems

| System | Where | Notes |
|---|---|---|
| Classes | `Game.jsx` `CLS` array (~21 entries) | Each defines stats, element, color, signature interactions, ult set. |
| Bloodmarks | `BLOODMARKS` (8 ancestral) + `CLASS_BM_TEMPLATES` × `buildClassBloodmarks` (4 innate per class) | Ancestral = stat traits only; innate = passive only. |
| Ranks | `RANKS` array, 7 tiers | Wanderer → Acolyte → Disciple → Seeker → Warden → Archon → Fractured. |
| Covenants | `COVENANTS` array, 5 factions | Joined at Covenant Hall; gives stat bonuses; ungoverned by default each generation. |
| Skills / Spells | Per-class arrays (`<class>:[heal/buff/debuff/damage]`), spellbook unlocks | Element-typed; AoE/single/buff/heal/debuff. |
| Items / Equipment | Inventory + 4-slot armor + weapon | Effects: heal, mp, repel, crit_damage, fortify, etc. |
| Combat | `bAct` + `enemyTurn` in `Game.jsx` | Positional lanes, range, crits, charge attacks, back-step interrupt, low-HP heartbeat. |
| Bosses | 40 painted boss portraits, `OUTPOST_BOSS_TEMPLATES` + `RIFT_BOSS_TEMPLATES` | Charge attack mechanic on all bosses. |
| Map / World | `MW`/`MH` 300, `mData` flat array of tiles | Biomes, painted tile textures, POI tile art, time-of-day painted skies. |
| Story Quests | 11-quest spine (`s1`–`s11`) | JJK-flavored milestones; final chapter `s7` Dream Devourer. |
| Duelist's Circle | Town service, scales by `pl.duelTier` | PvP-prep harness — same battle engine, AI opponent for now. |
| Save/Load | `localStorage` `sv_save_0/1/2` with JSON serialize | 3 manual slots; auto-save on town entry; load wired for post-death flow. |
| Audio | `music.js` | Procedural tracks per screen + SFX bank (hit/heal/levelup/victory/defeat/menu/cast/crit/heartbeat). User mute + volume settings. |
| Veilcourt chat | `api-server/src/routes/veilcourt.ts` + `Game.jsx` chat block | Public ring buffer (200), DM threads (1–8 participants), roster, presence, @mentions, name lookup. |

## Tech stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React 18 + Vite 7 (game)
- Express (api-server)
- No DB — fully in-memory backend
- Fonts: Cinzel (titles), Crimson Text (narrative), Nunito (UI)
- All visual assets are painted PNGs in `public/` (excluded from this pack — see `FILE_STRUCTURE.md`).

## Read order for a reviewer

1. `docs/replit.md` — current architecture, systems, gotchas, preferences (the README).
2. `docs/changelog.md` — full v29–v74 implementation history, condensed per round. Best place to understand *why* a piece of code looks the way it does.
3. `source/shattered-veil/Game.jsx` — the entire game (~8880 lines). Sections roughly in order: constants/data tables → helpers → React component with state → screens (title → create → shell → map → town → outpost/rift → battle).
4. `source/shattered-veil/game.css` — paired stylesheet. Look for the `vNN — ...` block markers to map CSS to changelog entries.
5. `source/shattered-veil/music.js` — audio engine.
6. `source/api-server/routes/veilcourt.ts` — the only non-trivial backend route.
