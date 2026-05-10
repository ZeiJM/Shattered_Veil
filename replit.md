# Shattered Veil — Chronicles of the Rift

A rich, single-page browser RPG with a 300×300 procedurally-generated world, 16 classes, 8 Bloodmarks, 5 Covenants, 7 Ranks, 16 elements, towns, rifts, turn-based combat, spellbooks, pets, equipment, dynasty succession, relic crafting, and story quests — all in one React component.

> **Changelog history** lives in [`docs/changelog.md`](docs/changelog.md). This file holds the living architecture, systems, and preferences only.

## Run & Operate

- `pnpm --filter @workspace/shattered-veil run dev` — run the game (workflow: `artifacts/shattered-veil: web`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React 18 + Vite 7 (port from `PORT` env, default 21515)
- API server: Express (Veilcourt chat backend) — see `artifacts/api-server`
- Saves: localStorage (3 slots)
- Fonts: Cinzel (headers), Crimson Text (body narrative), Nunito (UI)

## Where things live

- `artifacts/shattered-veil/src/Game.jsx` — entire game logic + JSX (~9700 lines)
- `artifacts/shattered-veil/src/game.css` — complete visual stylesheet (~8700 lines), parchment/navy/crimson aesthetic
- `artifacts/shattered-veil/src/music.js` — procedural music + SFX engine
- `artifacts/shattered-veil/src/battle/` — combat helpers (`derivedStats.js`, `statusEffects.js`, `classRoles.js`, `enemyBossIdentity.js`, `arena/ArenaBoard.jsx`, `arena/arenaMaps.js`)
- `artifacts/shattered-veil/src/App.tsx` — renders `<Game />`
- `artifacts/shattered-veil/src/main.tsx` — React entry point
- `artifacts/shattered-veil/public/` — painted assets (`title-veil.png`, `class/`, `boss/`, `el/`, `bm/`, `biome/`, `poi/`, `sky/`, `res/`, `ui/`, `forge-hall.png`, `swim-icon.png`, `battle-arena.png`, `battle-rift.png`, `battle-forest.png`)
- `artifacts/api-server/src/routes/veilcourt.ts` — global chat + DM threads + roster + presence

## Architecture decisions

- Single massive component: all game state (player, map, battle, UI) lives in one `Game` component using many `useState`/`useCallback`/`useMemo` hooks.
- Theme object `T` controls inline style colors throughout: parchment palette (`bg:#f5ead0`, `tx:#18120a`, etc.) for non-battle screens; battle screen forced dark via `!important` CSS.
- No build-time CSS-in-JS — theme colors are applied inline via JSX, with `game.css` setting structural/layout rules and using `!important` to override inline styles for context-specific sections (`.battle-bg`, `.hud-shell`).
- World map is a **fixed 15×9 viewport** that re-renders centered on `pos.x,pos.y` every move (player at column 7, row 4 by design). Not scrollable. Underlying data is the full 300×300 (90000-tile) grid.
- Battle arena uses **cartesian (x,y) coordinates with a square-tile renderer** (v94+, `.sv-arena-grid-sq`). All combat math (movement range, LoS, AoE) is cartesian.
- Saves: JSON-serialized to `localStorage` (`sv_save_0/1/2`).

## Game Systems

### Bloodmarks (20-pool, v87+)
- 20 ancestral lineage traits — original 8 (Veil-Veined, Stormborn, Ashblood, Ironblooded, Rootbound, Voidtouched, Goldensoul, Mirrorborn) plus 12 new lineages (some with mild stat tradeoffs). Stat traits only, no passive (`BLOODMARKS` array, helpers `getBM(id)`).
- 4 class-innate bloodmarks per class (`CLASS_BM_TEMPLATES` × `buildClassBloodmarks(cls)` → ids `cs_<classId>_<slot>`) — passive only, 0 stats.
- Character creation samples 4 of `BLOODMARKS` from a stable shuffled order. Skipping is allowed.
- **Unbound Soul** (no HUD tag): when `pl.bloodmark` is `null`, `projectedEffStatsFor` adds `+2 LCK` and `+8 MP`. Higher mutation chance at succession (1-in-3 vs 1-in-7).
- Inherited by heirs at succession with mutation chance. Painted PNG sigils in `public/bm/<id>.png`.

### Ranks
- 7 progression tiers: Wanderer → Acolyte → Disciple → Seeker → Warden → Archon → Fractured.
- Defined in `RANKS` array, helpers `getRank(level)` / `getNextRankLevel(level)`.

### Covenants
- 5 factions: Veilwatch, Iron Crown, Embersong Circle, Silkweb Guild, Tidecall Conclave.
- Joined/renounced at the **Covenant Hall** town service (200G to renounce). Each generation starts without a covenant — must pledge anew.

### Marriage → Heir Prestige (v87+)
- **No forced succession.** Aging stat-drift removed; phase names rebranded as career chapters.
- Bond at a tavern → `pl.marriedAt = timerNow` → 30 days later the line offers an heir; first 2 may be declined (resets `marriedAt`, increments `pl.heirDeclines`); 3rd is forced. `startSuccession` clears both fields on the heir.
- HUD chip shows `Heir prestige · X/30` when bonded.

### Relic Crafting
- 8 recipes using shards and fragments → consumable items at the **Relic Crafting** town service (Veil Tonic, Mana Crystal, Elixir of Iron, Void Draught, Cleansing Dust, Repel Incense, War Talisman, Void Shard Bomb).

### Story Quests
- 11-quest spine with JJK-flavored late chapters: `s8` Schoolyard Assessment (pledge a Covenant + win 3 sanctioned duels), `s9` Echoes Across the Veil (5 Duelist's Circle wins), `s10` The Inherited Technique, `s11` Unfolded Territory.

### Duelist's Circle (PvP-prep)
- Town service `duel` (🤺) — sanctioned 1-on-1 sparring vs an AI sorcerer. `pl.duelTier` scales opponent + reward. Same engine, same `startBattle([e], "duel")` entrypoint — only the opponent payload changes (AI now, real-player snapshot later).

### The Veilcourt — global chat + DMs
Lore-framed always-on global chat (a shared scrying basin — works in dungeons/rifts too).

- **Backend** (`artifacts/api-server/src/routes/veilcourt.ts`): public messages (in-memory ring buffer of 200), `threads` Map for 1-on-1 and group DMs (1–8 participants, find-or-reuse by sorted participantsKey, leaving = dissolving server-side), presence/roster (online <90s window), name lookup, @mention resolution, 1.5s/player rate limit, zod-validated identity (portraits ≤800 chars, SVG rejected). Endpoints: `GET/POST /messages`, `GET /roster`, `POST /presence`, `GET /lookup?name=`, `GET /dm?pid=`, `POST /dm/thread`, `POST /dm/thread/:id/message`, `POST /dm/thread/:id/leave`.
- **Frontend** (`Game.jsx`): single 3.5s open / 9s closed `setInterval` calls messages + DM + presence in lockstep. Stable identity in `localStorage["sv_chat_id"]`. Public + Private tabs. `chatThreads` + `chatDmThreadId` drive DM views. `chatDmReadUpTo` map persisted to `localStorage["sv_chat_thread_read"]`. @mentions render as `.veil-mention` pills (gold default, crimson `is-self`); self-mention rows get `.is-mention-me` + separate `chatMentions` badge.
- **Future**: DB persistence (drizzle+postgres), per-covenant sub-channels, WebSocket upgrade, moderation queue.

## Combat Layer (current state, post-Pass 14)

Engine is cartesian-coord battle on a square-tile renderer. Save shape unchanged across all combat passes. Helpers live in `src/battle/`:

- **Derived stats** (`derivedStats.js`) — `getCritChance`, `getCritDamageMultiplier`, `getAccuracy`, `getEvasion`, `getMoveStat`, `getFieldAttunement`, `getStatusPower`, `getStatusResist`, `getGuardStrength`, `getHealingPower`, `getVeilGenerationModifier`. Bundle: `getDerivedCombatStats`. Combat Profile pill strip in the battle HUD: Crit · Acc · Eva · Move · SP · SR · Heal.
- **Status effects** (`statusEffects.js`) — 29 canonical statuses, 22-entry alias map, helpers for normalize/apply/remove/cleanse/tick. Categories: buff / debuff / dot / control / vulnerability / defensive / field / expiring.
- **Class roles** (`classRoles.js`) — 21 distinct primary roles (Tank, Barrier Bulwark, Field Tank, Sustain Bruiser, Crit Striker, Assassin, DoT Duelist, Ranger, Long-Range Caster, Burst Caster, Void Debuffer, Healer, Sustain Support, Buff Support, Tempo Controller, Status Controller, Area Disruptor, Debuff Controller, Mirror Controller, Adaptive Shifter, Risk/Reward). Per-skill range/shape metadata stamped via `stampSkillListCombatMeta`. Range tiers: Self / Melee / Close / Mid / Long / Global. Display tag normalized via `getDisplayRangeTag`.
- **Enemy/Boss identity** (`enemyBossIdentity.js`) — 40 boss identities (20 outpost + 20 rift), 12 archetype families, 12 shared boss-field templates, per-boss arena preference, dramatic battle-log narration. Field activation gated to fresh phase transitions (72%/38% HP) or one-time openers for cataclysm/tempest/abyssal archetypes.
- **Arena** (`arena/ArenaBoard.jsx`, `arena/arenaMaps.js`) — square-tile board with portraits on tiles. Per-boss arena overrides via `BOSS_PREFERRED_ARENA`. Painted backgrounds (`battle-arena.png`, `battle-rift.png`, `battle-forest.png`) faded to opacity 0.18 (v95) so square grid stays readable.

### Player action toolkit
- **Combat tab**: Steady Strike (free, 0 MP, ATK×0.6, range 1, can trigger Veilflare Impact), Flurry Strike (free, 2–6 hits at ATK×0.3 each, one Veilflare roll per action), weapon strikes, Guard, copied skill, on-hand gear.
- **Veil Magic tab**: class spell toolkit — damage, control, support, debuffs.
- **Tactical tab** (⚓): Veil Anchor, Field Sever, Brace, Overchannel I/II/III (×1.5 / ×2.0 / ×2.5 — III gated to >50% HP), Focus Breath (3 MP → Veilflare Focus 2 turns). All share `btl.tacticalBuffs.overchannelMult`.
- **Items tab**: equipped consumables.
- **Veilbreak tab**: signature climax, charged when requirements met (in any order).

### Veilflare Impact
- 15% per Steady/Flurry action; +50% damage; applies/refreshes Veilflare Focus (3 turns: +10% crit, +Field Attunement, +20% next Veil Magic OR Veilbreak — consumed once). Battle-only, no save shape change.

### Field Attunement & Field Clash
- Field Attunement: derived `MAG×0.6 + LCK×0.3 + level×0.5 + ctx`. Pill strip in battle HUD.
- Field Clash: 5 outcomes (domination / split / fracture / backlash / collapse) when player Veilbreak meets an enemy field. Transient state on `btl.fieldClash` / `btl.tacticalBuffs` / `btl.enemyField` — never persisted.

## Visual Aesthetic (Veilbound-inspired)

- **Background**: Deep navy/void starfield with crimson + gold aurora glows
- **Panels**: Parchment gradient cards (`#f5ead0 → #ecdfc0`) with tan borders and dark ink text
- **HUD**: Always dark navy (overrides parchment context via `!important`)
- **Battle screen**: Dark navy/void with crimson borders, forced via `!important` on `.battle-bg .cd`
- **Map screen**: Time-of-day painted sky background (`public/sky/h00.png ... h23.png`), refreshed every 60s, with crossfade. Phase indicator pill (Midnight / Sunrise / Golden hour / etc) inline beside "World" heading.
- **Fonts**: Cinzel 900 for titles, Cinzel 600 for section headers, Crimson Text for narrative, Nunito for UI

## User preferences

- Visual style: parchment + navy + crimson (Veilbound-inspired)
- Keep single-artifact architecture — all in one `Game.jsx`
- JJK-flavor lore (innate techniques, sorcerer grades, domain expansions / unfolded territory) but kept subtle — no curse-energy or curse-user terminology
- End goal is a multiplayer PvP adventure — design new systems with PvP in mind even while single-player remains the default

## Gotchas

- `Game.jsx` exceeds Babel's 500KB deoptimization threshold — HMR is slower than normal, be patient after edits.
- Battle screen colors must use `!important` in CSS to override inline `T.*` parchment colors.
- `hud-shell` must use `!important` — it's inside `.shell-bg .cd` which would otherwise apply parchment styling.
- `startSuccession` must be declared before line ~3550 (was a TDZ bug when first migrated).
- `index.css` is intentionally minimal — no Tailwind (the original template had placeholder `red` values).
- The local `covenant` useState is declared but the live covenant is tracked inside `pl.covenant` — safe to leave as-is.
- Custom portrait fallback: always render the fallback first then layer `portraitOverlay(url)` on top; never short-circuit with `portrait ? <img> : <fallback>` — the overlay needs the fallback underneath in case the URL fails.
- World map "off-center" feeling on mobile is the side rail consuming horizontal space, not the map itself — the map IS centered on `pos.x,pos.y` by design (15-col fixed viewport). Fix mobile rail compaction (v95) instead of touching map math.
- Action card titles: keep `word-break: keep-all` + `hyphens: none` (v95) or long names like "Thornwood Longbow" hyphenate mid-word.
- Mobile command dock labels: don't add `display:none` on `.battle-tab-nm` at narrow widths — leaves an icon-only dock that nobody can read (v94 regression, fixed in v95).

## Future combat hooks (queued, not built)

- Crit damage modifier from gear/passives (`critDamage` field), crit-on-status passives (Phoenix burns always crit, etc).
- Per-skill `range` overrides finer than the current el-based heuristic.
- Veilcourt covenant sub-channels + WebSocket upgrade.
- A11y on new clickable HUD spans (Enter/Space + `tabIndex`).
- Real enemy/boss field activation AI; per-class Field Attunement affinity table; brace mechanical effect on enemy field DoT; fractured-tile gameplay (per-tile DoT + Veil Magic gain).
- Full action economy split (movement / action / minor action) — Focus Breath currently still consumes the player's main action.
- Full crit stat rebalance (Monk crit specialization, Flurry scaling with speed/crit, gear/passive crit rework).
- Enemy use of tactical actions; boss counters to Overchannel; tactical cooldowns.
- Wire the v95 `.is-fx-*` target-foreshadow color tokens (red/green/blue/gold) into the action targeting JSX so previewed tiles telegraph intent.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- See [`docs/changelog.md`](docs/changelog.md) for the full v29–v96 implementation history (per-pass details for v80 Field Foundation, v81 Field Attunement/Clash, v82 Steady/Flurry/Veilflare, v83 Derived Stats, v84 Class Roles, v85 Boss Identity, v86 Hex→Square, v87 20-Bloodmark/Heir Timer, v88 Pass 14, v89–v95 mobile/UX repairs, v96 Targeting/Intent/Effect-Tag/Card-UI rebuild).
