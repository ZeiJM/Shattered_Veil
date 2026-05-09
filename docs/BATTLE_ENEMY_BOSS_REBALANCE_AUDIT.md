# Battle Rework Pass 12 — Enemy & Boss Identity Audit

Pass 12 introduces an **identity layer** for the existing enemy and boss
roster. It is **additive only**: no engine rewrite, no save-shape change,
no rebalancing of existing skills, HP, or damage numbers. Existing AI
helpers (`chooseEnemySkill`, `chooseBossSignatureSkill`,
`applyBossPhasePressure`, `BOSS_STYLE_BY_KEY`, `BOSS_PHASE_EFFECTS`,
`mkEnemy`, archetype variants, `mkOutpostBoss`, `mkRiftBoss`) remain in
place and continue to drive turn-to-turn behaviour.

The new module — `artifacts/shattered-veil/src/battle/enemyBossIdentity.js`
— is a pure metadata + helpers layer that gives the existing systems:

1. **12 archetype families** that summarise *role identity* across the
   roster (independent of the 8 generic AI archetypeKeys that already
   exist).
2. **40 per-boss identity records** (20 outpost + 20 rift) covering
   archetype, preferred arena, intro / phase 1 / phase 2 narration,
   shared boss field template, and counterplay hint.
3. **12 shared boss-field templates** (one per archetype) that route
   through the existing `vbPlaceholderEnemyField` / Field Clash code so
   bosses can finally activate Veilbreak fields of their own — without
   touching the Pass 8 clash engine.
4. **Pure helpers** for log narration, archetype lookup, field
   activation gating, and arena routing.

## What changed in Game.jsx

Six surgical insertions, all guarded with `try / catch` or null checks:

| # | Location | Change |
|---|----------|--------|
| 1 | `import` block (~line 62) | Add `from './battle/enemyBossIdentity.js'`. |
| 2 | `applyBossPhasePressure` (~line 2900) | Use `ebiGetBossPhaseLine(next, "p1"/"p2")` for narration phrase. Falls back to `familyFx.*.msg`. |
| 3 | `startBattle` arena ctx (~line 4730) | Pass `bossKey: _bossEnemy?.bossKey` into `createInitialArenaState(ctx)`. |
| 4 | `startBattle` initial log (~line 4786) | Append boss intro line + counterplay hint after the "Battle begins!" header. |
| 5 | Enemy turn loop (~line 6310) | Track `_ebiEnemyFieldEturn`; on `ebiShouldActivateBossField` fire `vbPlaceholderEnemyField` and emit narration. |
| 6 | `previewPlayerTurnState` (~line 6482) | Thread `enemyField: _ebiEnemyFieldEturn` so activated fields persist to next turn and trigger Field Clash. |

`arenaMaps.js` gets a single addition: a `BOSS_PREFERRED_ARENA` lookup
table consulted at the top of `pickArenaTemplate(ctx)` — kept inline so
the arena module stays a leaf with no cross-package coupling.

`game.css` gets one additive block (`.sv-boss-intro-banner`,
`.sv-boss-phase-pulse`, `.sv-boss-warning-telegraph`,
`.sv-enemy-archetype-badge` + 12 colour variants). No existing rules
modified.

## Boss field activation gating

`shouldActivateBossField(enemy, btl)` returns `true` only when **all** of:

- `enemy.boss === true` and a registered identity exists.
- `btl.enemyField` is `null` (never stomp an existing field).
- `enemy.bossFieldCdUntilTurn <= btl.tn` (per-boss cooldown, default 4 turns).
- One of:
  - **Phase 1 trigger** — `hpPhaseFlags.phase1` was set this tick and `_bossFieldP1Done` is not yet true.
  - **Phase 2 trigger** — `hpPhaseFlags.phase2` was set this tick and `_bossFieldP2Done` is not yet true.
  - **Opener trigger** — only for `cataclysm` / `tempest` / `abyssal` archetypes, when `bossTurns >= 4` and the opener has not fired.

`markBossFieldActivated(enemy, tn, cd)` returns a shallow-patched copy
that records the matching `_bossField*Done` flag and sets the cooldown.
All three flags + the cooldown live on the **transient** battle enemy
object — they are never persisted to save state.

## Archetypes & roster mapping

| Archetype     | Role              | Bosses |
|---------------|-------------------|--------|
| fortress      | Heavy Tank        | ironjaw, chalkseer, steelmatron, namelessforge |
| siege_brute   | Crushing Bruiser  | sandreaver, brazenidol, gravitomb |
| predator      | Bleed Hunter      | blazefury, velvetfang, primal, verdantmaw |
| tempest       | Mobile Caster     | stormmarshal, windvicar, tempestoracle |
| hexweaver     | Status Controller | silkweave, gravewatch, hushsaint, gravechorus, mourningaxis, palegeometry |
| rotcourt      | DoT Stacker       | scylla, thornmatron, mirebishop, plagestar |
| abyssal       | Void Disruptor    | time, null, sunkenarchive, voidcathedral, blackhorizon |
| radiant       | Judgment Striker  | sunlancer, glassleviathan |
| tide          | Zone Drowner      | floodjudge, deepjudge |
| cryomancer    | Freeze Caster     | glacierabbot, crownofice |
| dreamweaver   | Sleep / Confuse   | lunacensor, reality, dreamcaul |
| cataclysm     | Apocalyptic       | entropy, starhunger |

Generic enemies inherit an archetype family via `getEnemyArchetypeId`:
existing `archetypeKey` (mauler, bulwark, reaper, hexcaller, warden,
oracle, mirage, venin) maps directly; un-keyed enemies fall back to an
element-based heuristic. **Nothing about generic-enemy combat behaviour
changed in this pass** — the helper exists for log presentation and
future codex/HUD use.

## Safeguards

- All new helpers are **pure** and return `null` rather than throwing
  when given missing keys. The wiring sites consult them defensively
  (`if (id) ...`).
- The boss-field activation block is wrapped in `try / catch`.
- The only Game.jsx change to `applyBossPhasePressure` swaps the log
  *narration phrase*; the effect application (`addOrRefreshEffect`) and
  the rift-family `empower` bonus are unchanged.
- `arenaMaps.js` falls through to the existing `isBoss` /
  `isRift` branches when a boss key has no preferred arena registered
  or the named arena ID is missing.
- All tracking flags (`_bossFieldP1Done`, `_bossFieldP2Done`,
  `_bossFieldOpenerDone`, `bossFieldCdUntilTurn`) are battle-only and
  never written into the save shape.

## Pass 13+ risk list (deliberately not built here)

- Per-archetype **AI movement bias** wiring — today the `movementBias`
  metadata is read-only.
- Per-boss **status resistance** (e.g. shorten Stun on bosses) — would
  touch `applyStatusEffect` call sites; needs Pass 10 status system to
  finish migrating first.
- Per-archetype **Field Attunement** affinity table.
- Boss **counter-actions** to player Tactical actions
  (Anchor / Brace / Overchannel).
- Real **boss-skill range overrides** — Pass 11 inferred ranges from
  element; per-boss-signature ranges would tighten the arena play.
- **Audio cues** for boss intro / phase pulses (currently
  text + CSS only).
- **Codex / pre-battle preview UI** that surfaces archetype, weakness,
  and counterplay before combat starts.
