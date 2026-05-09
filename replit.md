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

- `artifacts/shattered-veil/src/Game.jsx` — entire game logic + JSX (~8800 lines)
- `artifacts/shattered-veil/src/game.css` — complete visual stylesheet (~5800 lines), parchment/navy/crimson aesthetic
- `artifacts/shattered-veil/src/music.js` — procedural music + SFX engine
- `artifacts/shattered-veil/src/App.tsx` — renders `<Game />`
- `artifacts/shattered-veil/src/main.tsx` — React entry point
- `artifacts/shattered-veil/public/` — painted assets (`title-veil.png`, `class/`, `boss/`, `el/`, `bm/`, `biome/`, `poi/`, `sky/`, `res/`, `ui/`, `forge-hall.png`, `swim-icon.png`, `battle-arena.png`, `battle-rift.png`, `battle-forest.png`)
- `artifacts/api-server/src/routes/veilcourt.ts` — global chat + DM threads + roster + presence

## Architecture decisions

- Single massive component: all game state (player, map, battle, UI) lives in one `Game` component using many `useState`/`useCallback`/`useMemo` hooks.
- Theme object `T` controls inline style colors throughout: parchment palette (`bg:#f5ead0`, `tx:#18120a`, etc.) for non-battle screens; battle screen forced dark via `!important` CSS.
- No build-time CSS-in-JS — theme colors are applied inline via JSX, with `game.css` setting structural/layout rules and using `!important` to override inline styles for context-specific sections (`.battle-bg`, `.hud-shell`).
- Map: 300×300 tile grid (90000 tiles), biome-based generation, stored in state.
- Saves: JSON-serialized to `localStorage` (`sv_save_0/1/2`).

## Game Systems

### Bloodmarks
- 8 ancestral lineage traits: Veil-Veined, Stormborn, Ashblood, Ironblooded, Rootbound, Voidtouched, Goldensoul, Mirrorborn — stat traits only, no passive (`BLOODMARKS` array, helpers `getBM(id)`).
- 4 class-innate bloodmarks per class (`CLASS_BM_TEMPLATES` × `buildClassBloodmarks(cls)` → ids `cs_<classId>_<slot>`) — passive only, 0 stats.
- Applied in `projectedEffStatsFor` (stat bonuses) and on passive-check hooks in battle.
- Chosen at character creation (step 2 of 3-step flow). Skipping is allowed.
- **Inherited by heirs** at succession with ~1-in-7 chance of mutation.
- Displayed in HUD badge + Stats panel card. Painted PNG sigils in `public/bm/<id>.png`.

### Ranks
- 7 progression tiers: Wanderer → Acolyte → Disciple → Seeker → Warden → Archon → Fractured.
- Defined in `RANKS` array, helpers `getRank(level)` / `getNextRankLevel(level)`.
- Rank-up triggered in `giveXP` level-up loop; applies bonus stats directly to `pl.st`.

### Covenants
- 5 factions: Veilwatch, Iron Crown, Embersong Circle, Silkweb Guild, Tidecall Conclave.
- Defined in `COVENANTS` array, helper `getCV(id)`. Joined/renounced at the **Covenant Hall** town service (200G to renounce).
- Each generation starts without a covenant — must pledge anew.

### Relic Crafting
- 8 recipes using shards and fragments → consumable items at the **Relic Crafting** town service.
- Recipes: Veil Tonic, Mana Crystal, Elixir of Iron, Void Draught, Cleansing Dust, Repel Incense, War Talisman, Void Shard Bomb.

### Story Quests
- 11-quest spine in playable order. Final chapter is `s7` Dream Devourer.
- JJK-flavored milestones: `s8` Schoolyard Assessment (pledge a Covenant + win 3 sanctioned duels), `s9` Echoes Across the Veil (win 5 Duelist's Circle matches), `s10` The Inherited Technique (Warden grade + bloodmark expressions), `s11` Unfolded Territory (survive a domain expansion encounter).

### Duelist's Circle (PvP-prep)
- Town service `duel` (icon 🤺) — sanctioned 1-on-1 sparring vs an AI sorcerer. `pl.duelTier` (0+) scales opponent level + reward (gold/XP/relic shard). Wins progress `s8` (with Covenant) and `s9`.
- Same client-side battle engine, same `startBattle([e], "duel")` entrypoint — only the opponent payload changes (AI rolled now, real-player snapshot later).
- Server contract (TBD): match request `{ tier, covenant, level }` → opponent snapshot `{ class, stats, skills, bloodmark }`. Result POST: `{ winnerId, turns, finalEf, opponentId }` for ladder/rank updates.

### The Veilcourt — global chat + DMs
Lore-framed always-on global chat (a shared scrying basin — works in dungeons/rifts too).

- **Backend** (`artifacts/api-server/src/routes/veilcourt.ts`): public messages (in-memory ring buffer of 200), `threads` Map for 1-on-1 and group DMs (1–8 participants, find-or-reuse by sorted participantsKey, leaving = dissolving server-side), presence/roster (online <90s window), name lookup, @mention resolution, 1.5s/player rate limit, zod-validated identity (portraits ≤800 chars, SVG rejected). Endpoints: `GET/POST /messages`, `GET /roster`, `POST /presence`, `GET /lookup?name=`, `GET /dm?pid=`, `POST /dm/thread`, `POST /dm/thread/:id/message`, `POST /dm/thread/:id/leave`.
- **Frontend** (`Game.jsx`): single 3.5s open / 9s closed `setInterval` calls messages + DM + presence in lockstep. Stable identity in `localStorage["sv_chat_id"]`. Public + Private tabs in chat header. `chatThreads` (full thread objects) + `chatDmThreadId` (UUID) drive DM views. `chatDmReadUpTo` map persisted to `localStorage["sv_chat_thread_read"]` (keyed by threadId). @mentions render as `.veil-mention` pills (gold default, crimson `is-self`); messages with self-mention get `.is-mention-me` row treatment + separate `chatMentions` badge. `chatEl` mounted alongside `{popupEl}` at 5 sites.
- **Future**: DB persistence (drizzle+postgres), per-covenant sub-channels (data model already carries `covenant`), WebSocket upgrade, moderation queue.

## Visual Aesthetic (Veilbound-inspired)

- **Background**: Deep navy/void starfield with crimson + gold aurora glows
- **Panels**: Parchment gradient cards (`#f5ead0 → #ecdfc0`) with tan borders and dark ink text
- **HUD**: Always dark navy (overrides parchment context via `!important`)
- **Battle screen**: Dark navy/void with crimson borders, forced via `!important` on `.battle-bg .cd`
- **Map screen**: Time-of-day painted sky background (`public/sky/h00.png ... h23.png`), refreshed every 60s, with crossfade. Phase indicator pill (Midnight / Sunrise / Golden hour / etc) sits inline beside the "World" heading.
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

## Battle Rework Pass 13 (v86) — Hex Arena Grid + Portraits on Tiles + UI Polish (Phase 1)

Massive battle UI redesign — visual hex grid (offset rows + clip-path), portraits on tiles, removal of the top 5-lane HUD strip, larger arena tiles, layout overflow fixes, and cleaner action button chrome. **Additive only** — no save shape change, no engine math changes, no rebalance. Cartesian `(x,y)` coordinates still drive all combat (movement range, LoS, AoE); only the rendering layer is hex.

- **`battle/arena/ArenaBoard.jsx`** — row-by-row hex layout (`.sv-arena-grid-hex` modifier). Tile size bumped from `clamp(560/cols, 22, 36)` → `clamp(820/cols, 42, 64)` (mobile `clamp(380/cols, 26, 38)`). Each unit now renders `<img class="sv-arena-unit-portrait">` from `unit.portraitSrc` (with icon fallback). Old square code path preserved for safety.
- **`Game.jsx` units array** — each unit carries `portraitSrc`: player → `pl.portrait` (validated) or `classPortraitUrl(pl.cid, pl.sex)`; ally → `classPortraitUrl(ally.cid, ally.sex)`; enemy → `BOSS_PORTRAIT_PATH(bossKey)` or `ELEMENT_ICON_PATH(el)`.
- **`Game.jsx` lane HUD removed** (line ~9070) — the bulky 5-tile Vanguard/Front/Mid/Skirmish/Backline strip is gone. Hex board is now the sole source for movement & targeting. `plLane`, `bMove`, `renderRichToken`, `openEntityInfoPopup` helpers retained — damage formulas and dossier popups still consume them. A compact `battle-range-readout` pill (lane + target distance + move availability + hex-click hint) lives where the strip was.
- **`game.css` Pass 13 block** (additive, ~210 lines): clip-path hex tiles, painted parchment/navy radial-gradient backdrop, animated glow rings (move-valid, target-valid, target-selected, foe `is-target`), portrait `object-fit: cover` inside hex clip with per-kind ring colours. Restyled `.battle-tab.v66` (gold active state, hover lift, corner badge) and `.battle-action-grid` (`auto-fill minmax(150px, 1fr)`, hover lift + gold inner ring). Layout overflow fix: `.battle-actions-card { max-height: 52vh; overflow-y: auto }`. Defensive `.battle-bg .battle-lane { display: none !important }`.
- **Phase 1 only** — does NOT include AI-generated arena background images, full hex-distance/AoE math overhaul, or per-class action card colour overhaul. Those land in Pass 13 Phase 2.

## Battle Rework Pass 12 (v85) — Enemy & Boss Identity Layer

40 boss identities (20 outpost + 20 rift), 12 archetype families, 12 shared boss-field templates routed through the existing Pass 8 Field Clash engine, per-boss arena preference, and dramatic battle-log narration. **Additive only** — no engine rewrite, no save-shape change, no rebalance of existing skills/HP/damage. Existing AI helpers left intact (`chooseEnemySkill`, `chooseBossSignatureSkill`, `BOSS_STYLE_BY_KEY`, `BOSS_PHASE_EFFECTS`, `mkOutpostBoss`, `mkRiftBoss`).

- **`battle/enemyBossIdentity.js`** — single source of truth: `ENEMY_ARCHETYPES` (12 families with role/movementBias/rangePref/weakness/behaviorHints/fieldDefault), `BOSS_FIELD_TEMPLATES` (12 archetype-shared field records), `BOSS_IDENTITIES` (40 entries with arch + arena + intro + phase1/phase2 phrases + field key + counterplay hint). Pure helpers: `getBossIdentity`, `getBossArchetype`, `getBossIntroLine`, `getBossPhaseLine`, `getBossCounterplayHint`, `getBossPreferredArenaId`, `shouldActivateBossField`, `buildBossFieldOpts`, `describeBossFieldHint`, `markBossFieldActivated`, `getEnemyArchetype`, `getEnemyArchetypeId`. All return `null` rather than throwing on missing keys.
- **Game.jsx wiring** (six surgical insertions, all guarded):
  - `applyBossPhasePressure` uses `ebiGetBossPhaseLine(next, "p1"/"p2")` for the narration phrase, falling back to `familyFx.*.msg`.
  - `startBattle` arena ctx carries `bossKey` so per-boss preferred arenas can win over the generic `isBoss → abyssal_expanse` default.
  - Initial battle log emits boss intro line + counterplay hint after the "Battle begins!" header.
  - Enemy-turn loop activates boss fields via `ebiShouldActivateBossField` → `vbPlaceholderEnemyField` → log narration + hint; `previewPlayerTurnState` threads `enemyField` so the clash engine picks them up next tick.
- **`battle/arena/arenaMaps.js`** — inline `BOSS_PREFERRED_ARENA` (40 entries) consulted at the top of `pickArenaTemplate(ctx)`. Falls through to existing branches when no override exists.
- **Boss field activation gating** — fires only on a fresh phase transition (72% / 38% HP) or a one-time opener for `cataclysm` / `tempest` / `abyssal` archetypes (after `bossTurns >= 4`). Per-boss cooldown via `enemy.bossFieldCdUntilTurn` (transient battle-only — never persisted to save).
- **CSS** — additive block: `.sv-boss-intro-banner`, `.sv-boss-phase-pulse`, `.sv-boss-warning-telegraph`, `.sv-enemy-archetype-badge` (+ 12 archetype colour variants).
- **Audit doc**: see `docs/BATTLE_ENEMY_BOSS_REBALANCE_AUDIT.md` for the per-boss table, archetype mapping, safeguards, and Pass 13+ risk list.

## Battle Rework Pass 11 (v84) — Class Roles + Skill Range/Shape Metadata

Distinct role identity for all 21 player classes plus per-skill range/shape metadata for the arena. **Additive only** — no engine rewrites, no save shape change, existing `inter[]` / `mkPassives` / `mkUltPool` left intact (they already use canonical Pass 10 statuses).

- **`battle/classRoles.js`** — single source of truth: `ROLE_META` (21 distinct roles), `RANGE_TIER` (melee/short/medium/long/global), `CLASS_ROLES` (per class: `role`, `roleSummary`, `primaryStats`, `rangeIdentity`, `preferredShape`, `terrainAffinity`, `fieldIdentity`, `weakness`, `vbTheme`). Pure-function helpers: `getClassRole`, `getRoleMeta`, `inferSkillRange`, `inferSkillShape`, `stampSkillCombatMeta`, `stampSkillListCombatMeta`, `rangeLabel`, `shapeLabel`. All finite math; no `Infinity`/`NaN`.
- **Skill stamping** — `mkSkills` calls `stampSkillListCombatMeta(sk, c.id)` before return; `startBattle` re-stamps `pl.skills` on entry so old saves get `range`/`rangeMin`/`rangeMax`/`shape`/`targetType` lazily. Stamping never overwrites explicitly-set fields.
- **Class pick card** (creation step 0) shows colored role badge + range identity pill + role summary blurb.
- **Skill archive cards** show two new chips: Range (Self/Melee/Short N/Med N/Long N/Global) and Shape (Single/Line/Cone/Burst/Aura/Zone/Self/Global).
- **Distinct primary roles** (no two classes share one): Tank · Barrier Bulwark · Field Tank · Sustain Bruiser · Crit Striker · Assassin · DoT Duelist · Ranger/Projectile · Long-Range Caster · Burst Caster · Void Debuffer · Healer · Sustain Support · Buff Support · Tempo Controller · Status Controller · Area Disruptor · Debuff Controller · Mirror Controller · Adaptive Shifter · Risk/Reward.
- **Audit doc**: see `docs/BATTLE_CLASS_REBALANCE_AUDIT.md` for the per-class table, rationale, safeguards, and Pass 12 risk list.
- **CSS** — additive block: `.sv-role-badge`, `.sv-role-range-pill`, `.sv-skill-range-chip`, `.sv-skill-shape-chip`.

## Battle Rework Pass 10 (v83) — Derived Combat Stats + Status Cleanup Foundation

Two foundational systems landed together to keep run count down. **Save shape unchanged** — both modules are non-breaking layers on top of existing combat.

- **`battle/derivedStats.js`** — central helpers for derived battle stats: `getCritChance`, `getCritDamageMultiplier`, `getAccuracy`, `getEvasion`, `getMoveStat`, `getFieldAttunement` (re-exported from Pass 8), `getStatusPower`, `getStatusResist`, `getGuardStrength`, `getHealingPower`, `getVeilGenerationModifier`. Bundle: `getDerivedCombatStats(unit, ctx)`. All formulas TEMPORARY (commented), full balance is Pass 11.
- **`battle/statusEffects.js`** — canonical 29-entry status list (`CANONICAL_STATUSES`), 22-entry alias map (`STATUS_ALIASES`), helpers: `normalizeStatusEffect`, `getStatusMeta`, `getStatusTooltip`, `getStatusVisualClass`, `hasStatus`, `calculateStatusChance`, `canApplyStatus` (consumes Nullify), `applyStatusEffect` (refresh, no stacking), `removeStatusEffect`, `cleanseStatus`, `tickStatusEffects` (returns events, doesn't mutate hp), `STATUS_LOG_PHRASES`.
- **Existing `FXS` array unchanged** — all skills/passives keep working. The new module is metadata + helpers; Pass 11 will migrate call sites.
- **Combat Profile pill strip** in the battle HUD (under Field Attunement row, always visible, wraps on narrow screens): Crit · Acc · Eva · Move · SP · SR · Heal. Tooltips from `DERIVED_STAT_TOOLTIPS`.
- **Crit pipeline unified** — Pass 9's inline `getCritChance`/`getCritDamageMultiplier` in `bAct` now route through `dsGetCritChance`/`dsGetCritDamage` (with `_critCtx` carrying armor + Veilflare Focus flag), so Steady/Flurry/Veilflare and the Combat Profile strip all read from one place. Pre-existing weapon-strike inline crit at line ~5111 left as-is — Pass 11 will unify.
- **New CSS**: `sv-combat-profile-strip`, `sv-combat-profile-pill` (variants `is-crit`/`is-evade`/`is-move`/`is-field`/`is-status`), `sv-status-chip` + category variants (`-buff`/`-debuff`/`-dot`/`-control`/`-vulnerability`/`-defensive`/`-field`/`-expiring`/`-tooltip`).

## Battle Rework Pass 9 (v82) — Steady Strike, Flurry Strike, Veilflare Impact

- **Steady Strike** (`bAct("steady")`) — free 0 MP basic attack, range 1, ATK×0.6, one crit + one Veilflare roll.
- **Flurry Strike** (`bAct("flurry")`) — free 2–6 quick hits, ATK×0.3 each, crit per hit, ONE Veilflare roll per action.
- **Veilflare Impact** — original perfect-impact mechanic (NOT "Black Flash"). 15% per Steady/Flurry action; +50% damage; applies/refreshes Veilflare Focus.
- **Veilflare Focus** — battle buff in `np.efx` (`id:"veilflare_focus"`, dur 3): +10% crit, +Field Attunement, +20% next Veil Magic OR Veilbreak (consumed once). Battle-only — no save shape change.
- **Tactical tab final**: Veil Anchor, Field Sever, Brace, Overchannel I/II/III (×1.5 / ×2.0 / ×2.5 — III gated to >50% HP), Focus Breath (3 MP → Veilflare Focus 2 turns). All share `btl.tacticalBuffs.overchannelMult` (one active at a time).
- Crit helpers (`getCritChance`, `getCritDamageMultiplier`, `rollCrit`) live inline in `bAct` — temporary; full rebalance is Pass 10.
- New CSS classes: `sv-action-card-steady-strike`, `sv-action-card-flurry-strike`, `sv-action-card-veilflare-ready` (gold pulse), `sv-action-card-overchannel`, `sv-action-card-focus`, `sv-action-card-risk`, `sv-action-card-disabled-reason`.

## Battle Rework Pass 8 (v81) — Field Attunement, Field Clash, Tactical Actions

- **Field Attunement** — derived stat `MAG×0.6 + LCK×0.3 + level×0.5 + ctx bonuses`; pill strip in battle HUD.
- **Field Clash** — 5 outcomes (domination / split / fracture / backlash / collapse) when player Veilbreak meets an enemy field. State lives on `btl.fieldClash` (transient, ticks per action).
- **Tactical Actions tab** (⚓): Veil Anchor (+6 attunement & +1 dur next clash), Field Sever (-1 enemy field turn), Brace Against Field (halve next-round pressure), Overchannel I (8 HP → next Veil Magic / Veilbreak ×1.5).
- All new transient combat state lives under `btl.tacticalBuffs`, `btl.enemyField`, `btl.fieldClash` — **no save shape change**.
- Enemy fields are placeholders today; training-only "Test: Spawn Enemy Field" action exercises the clash loop until real enemy AI lands.

## Future combat hooks (queued, not built)

- Crit damage modifier from gear/passives (`critDamage` field), crit-on-status passives (Phoenix burns always crit, etc).
- Per-skill `range` overrides (finer than the current el-based heuristic).
- Veilcourt covenant sub-channels + WebSocket upgrade.
- A11y on new clickable HUD spans (Enter/Space + `tabIndex`).
- Real enemy/boss field activation AI; per-class Field Attunement affinity table; brace mechanical effect on enemy field DoT; fractured-tile gameplay (per-tile DoT + Veil Magic gain).
- Full action economy split (movement / action / minor action) — Focus Breath currently still consumes the player's main action.
- Full crit stat rebalance (Monk crit specialization, Flurry scaling with speed/crit, gear/passive crit rework).
- Enemy use of tactical actions; boss counters to Overchannel; tactical cooldowns.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- See [`docs/changelog.md`](docs/changelog.md) for the full v29–v74 implementation history.
