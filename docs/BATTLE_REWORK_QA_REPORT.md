# Battle Rework QA Report — Passes 1–14

This is the consolidated QA pass for the Shattered Veil battle rework (Passes 1–14, v75 → v88). Earlier per-pass audits live alongside it: `BATTLE_CLASS_REBALANCE_AUDIT.md` (Pass 11) and `BATTLE_ENEMY_BOSS_REBALANCE_AUDIT.md` (Pass 12). Implementation history is in `changelog.md`.

## Summary of the Battle Rework

The battle layer was rebuilt incrementally across 14 passes while preserving save shape and the single-`Game.jsx` architecture:

- **Pass 1–3** — Cartesian arena coordinates, Tactical Step movement, range/AoE preview math.
- **Pass 4–6** — Destructible terrain, rare terrain bonuses, arena maps + ArenaBoard rendering.
- **Pass 7** — Veilbreak chain rebuilt as **unordered requirements** (any order; primes when all met).
- **Pass 8** — Field Attunement (derived stat), Field Clash (5 outcomes), Tactical Actions tab (Veil Anchor, Field Sever, Brace, Overchannel I).
- **Pass 9** — Steady Strike, Flurry Strike, Veilflare Impact + Veilflare Focus; Tactical tab finalized (Overchannel I/II/III, Focus Breath).
- **Pass 10** — `derivedStats.js` + `statusEffects.js` (29 canonical statuses, 22-entry alias map). Combat Profile pill strip.
- **Pass 11** — `classRoles.js`: 21 distinct class roles + per-skill range/shape metadata. Skill stamping at battle start ensures old saves get the metadata lazily.
- **Pass 12** — `enemyBossIdentity.js`: 12 archetype families, 40 boss identities, per-boss arena preference, dramatic boss intro/phase/counterplay narration.
- **Pass 13 Phase 1 (v86)** — Hex arena grid, portraits on tiles, lane HUD removed.
- **Pass 13 Phase 2 (v87)** — Bloodmark pool 8 → 20, aging stat-drift removed, marriage→heir prestige timer.
- **Pass 14 (v88)** — Final integration QA: outdated manual text rewritten, mobile CSS safeguards, forced-succession hardening, save migration for old bonded saves, this report.

## Systems Checked

| System | Status | Notes |
|---|---|---|
| Hex arena rendering | ✅ | Portraits via `unit.portraitSrc`, square fallback retained |
| Movement / Tactical Step | ✅ | Counts toward unordered Veilbreak requirement `useTacticalAction` |
| Range / AoE preview | ✅ | Pass 11 metadata stamped on `pl.skills` at `startBattle` |
| Destructible objects | ✅ | Visual + safe damage handling; no crash path observed |
| Rare terrain bonuses | ✅ | Tile glow + log entry |
| Veilbreak unordered requirements | ✅ | Pass 7 — `vbApplyAction` reducer; manual updated in Pass 14 |
| Veilbreak field activation | ✅ | Per-class field record + duration countdown |
| Field Attunement | ✅ | Pill in Combat Profile strip; `getFieldAttunement` helper |
| Field Clash | ✅ | 5 outcomes, transient `btl.fieldClash`; placeholder enemy fields drive demos |
| Tactical Actions | ✅ | Veil Anchor, Field Sever, Brace, Overchannel I/II/III, Focus Breath |
| Steady Strike | ✅ | Free, 0 MP, ATK×0.6 |
| Flurry Strike | ✅ | Free, 2–6 hits, ATK×0.3 each, single Veilflare roll per action |
| Veilflare Impact | ✅ | 15% per action; +50% damage; applies Veilflare Focus |
| Veilflare Focus | ✅ | 3-turn buff: +crit, +Field Attunement, +20% next Veil Magic / Veilbreak (consumed once) |
| Derived combat stats | ✅ | Pill strip + tooltips (Pass 10 `DERIVED_STAT_TOOLTIPS`) |
| Canonical status effects | ✅ | 29 statuses + 22 aliases; `applyStatusEffect` refresh-only (no stacking) |
| 21 class roles | ✅ | `CLASS_ROLES`; role badge + range identity on creation card |
| 40 boss identities | ✅ | Intro line + counterplay hint at battle open; phase pulse on transitions |
| 20-bloodmark pool | ✅ | 4 of 20 offered at creation; class-innate marks unchanged |
| Unbound Soul (no bloodmark) | ✅ | Hidden +2 LCK / +8 MP; mutation 1-in-3 vs 1-in-7; spontaneous lineage on heir |
| Aging stat drift removed | ✅ | `AGE_PHASES` mults all 1.0; `ageDay` no longer caps at 31 |
| Heir prestige timer | ✅ | Bond → 30 days → offer; 2 declines allowed; 3rd is forced (cannot be deferred) |
| Save migration (pre-v87 bonded) | ✅ | Pass 14 — seeds `marriedAt = timerNow` once; no retroactive forcing |
| Mobile battle layout | ✅ | Pass 14 CSS safeguards: action grid wraps, log scrolls, tabs collapse to icons ≤480px |

## Bugs Fixed in Pass 14

1. **Forced succession was bypassable** — when the heir prestige timer reached the 3rd (forced) offer, the legacy-transition popup still showed "Return to world", letting the player defer indefinitely. `startSuccession` now suppresses that button when called with `reason === "heir_prestige"` and `heirDeclines >= 2`, or when reason is `age` / `death`.
2. **Heir-offer popup could clobber other modals** — the v87 effect only suppressed when popup type was already `succession`/`heir_offer`. Now it gates on `scr === "battle"`, `btl`, and any active popup so it cannot interrupt mid-fight or overwrite an unrelated dialog.
3. **Old bonded saves had no path into the new timer** — pre-v87 saves with a `spouse` set but no `marriedAt`/`heirDeclines` would never trigger the heir cycle unless the player rebonded. Pass 14 adds a one-shot migration that seeds `marriedAt = timerNow` and `heirDeclines = 0` when the effect first sees that shape. Migration is non-destructive and skipped if either field is already present.
4. **Outdated manual section title** — "The Veil, the Expansions, and the End of Time" implied the old Veil-Expansion battle skill; renamed to "The Veil, the Unfolded Territories, and the End of Time" (reflecting JJK-flavor lore that's actually shipped).
5. **"What Kind of Game" still mentioned a forced lifespan** — rewritten to describe the bond → heir flow.
6. **"Combat at a Glance" + "Battle Options"** — refreshed for the hex arena, Tactical tab, Steady/Flurry/Veilflare, Field/Clash mechanics.
7. **"Veil Magic and Veilbreaks"** — old text said Veilbreaks were "charged by exact chain orders". Updated to describe the unordered-requirement system (Pass 7) and the field/clash flow (Pass 8).
8. **Battle tab label** — `"Combat Actions"` shortened to `"Combat"` for consistency with the other tabs (`Veil Magic` / `Tactical` / `Items`).

## Manual / Help Sections Updated

- "The Veil, the Unfolded Territories, and the End of Time" (renamed)
- "What Kind of Game This Is" (lifespan language removed)
- "Combat at a Glance" (hex arena + positioning + fields)
- "Battle Options" (Combat / Veil Magic / Tactical / Items / Veilbreak / Veilflare Impact)
- "Veil Magic and Veilbreaks" (unordered requirements; field on cast; clash)
- "Aging, the Stat Curve, and Death" (already updated in v87 — verified)
- Bloodmark blurb (already updated in v87 — verified, lists all 20)
- HUD age chip + Stats panel "Heir Prestige" card (verified intact from v87)

## Mobile / Responsive Changes (Pass 14, additive)

Appended a single CSS block at the bottom of `game.css`. All rules scoped to `.battle-bg`:

- `.battle-actions-card` — `max-height: 52vh; overflow-y: auto` (46vh on phones).
- `.battle-log` — `max-height: 38vh; overflow-y: auto` (30vh on phones).
- `.sv-combat-profile-strip` — wraps cleanly on narrow viewports.
- `@media (max-width: 720px)` — action grid drops to `minmax(132px, 1fr)`; tab/profile font sizes shrink slightly.
- `@media (max-width: 480px)` — action grid drops to `minmax(112px, 1fr)`; tab labels hide (icons only); min-width on tabs preserved.
- Popups capped at `min(96vw, 560px)` so they never overflow the viewport.

No HUD or non-battle screen styling was changed.

## Save / Load Compatibility Fixes

| Concern | Status |
|---|---|
| New v88 save round-trips | ✅ |
| v87 save loads without crash | ✅ |
| Pre-v87 saves with `spouse` but no `marriedAt` | ✅ — Pass 14 one-shot migration |
| Pre-Pass-11 saves missing skill `range`/`shape` metadata | ✅ — `startBattle` re-stamps via `stampSkillListCombatMeta` |
| Missing arena `units[].portraitSrc` | ✅ — ArenaBoard falls back to icon |
| Missing `btl.fieldClash` / `btl.tacticalBuffs` | ✅ — all reads use optional chaining + defaults |
| Missing canonical status metadata | ✅ — `getStatusMeta` returns null and FXS fallback applies |
| Pending heir offer + load | ✅ — guarded by `scr === "battle"` and active-popup checks; safe |

## What Was Tested

- Manual code-search audit for outdated terms (`Veil Expansion`, `Day 31`, `lifeStage`, `Pick an action region`, `Loadout changes end turn`, `life-stage`).
- Workflow restart after each batch of edits — Vite picked up changes via HMR with no errors.
- Architect code review (Pass 13 Phase 2) — three findings raised and fixed in Pass 14: forced-succession bypass, heir-offer interruption, save-migration gap.
- Pass 14 manual rewrites confirmed in-file at the corrected line numbers.

## What Could Not Be Tested in This Pass

The following were not exercised end-to-end in a runtime browser session — they are deferred to a future playtest pass:

- Live boss phase transition narration on every one of the 40 boss identities.
- Field Clash in production (currently exercised by the Pass 8 placeholder enemy field; real boss field activation gated to phase-transition / opener triggers).
- Mobile usability on a real device (CSS rules verified by inspection, not by capture).
- Save/load round-trip on a true pre-v75 save (the migration paths exist; no archived save was available).

## Known Issues Remaining

1. **Two orphaned helpers** — `ageCurvePopupText` and `ageGraphRows` in `Game.jsx` are now unused. Left in place to keep the v87/v88 diff surgical. Safe to delete in a follow-up cleanup pass.
2. **`veilExpansionDetailText` is still the internal name** for the Veilbreak detail popup. Player-facing string is correct ("Veilbreak: …"). Renaming is a wide refactor — deliberately deferred per the Pass 14 rule against aggressive internal renames.
3. **Veilbreak `chainText`** in the popup still renders requirement positions with arrows (`A → B → C`). The reducer is unordered, so this is misleading. A small follow-up should switch the join character from `" → "` to `" + "` or `" / "`.
4. **No painted PNG sigils** for several of the 12 new bloodmark IDs in `public/bm/`. Glyph fallback handles it; a future asset pass should add icons.
5. **Tactical Action economy** — Focus Breath still consumes the player's main action. The Pass 8/9 backlog notes a future minor-action split.
6. **Enemy AI does not yet use Tactical Actions or counter Overchannel.** Listed in the existing future-hooks section of `replit.md`.

## Recommended Next Small Repair Prompt (if desired)

> **Pass 15 micro-cleanup (low risk):**
> 1. Delete the orphaned `ageGraphRows` and `ageCurvePopupText` helpers from `Game.jsx`.
> 2. In `veilExpansionDetailText`, change `chainText`'s join string from `" → "` to `" + "` so it stops implying a fixed order.
> 3. Add painted sigils for the 12 new bloodmarks (`ironblooded`, `wraithkin`, `moonborn`, `emberheart`, `ashenlung`, `duskblooded`, `sageblooded`, `wolfborn`, `clayheart`, `silverveined`, `ravenkin`, `boundless`) — keep the existing 32×32 style.

## Notes for Future Multiplayer Readiness

These observations are *for future planning only*. Pass 14 implements no multiplayer.

- `startBattle([e], "duel")` already accepts an opponent payload — the server contract sketch in `replit.md` (Duelist's Circle section) is the natural seam.
- All transient battle state (`btl.fieldClash`, `btl.tacticalBuffs`, `btl.enemyField`, Veilflare Focus) lives off-save by design, so per-match server authoritative state is straightforward.
- Pass 11's per-skill `range` / `rangeMin` / `rangeMax` / `shape` metadata is server-replicable — useful for an authoritative move validator.
- Veilcourt already has a tested 1-on-1 / group DM model in `artifacts/api-server/src/routes/veilcourt.ts`; the same `participantsKey` pattern can host duel match channels.
- TODO markers are scattered across `Game.jsx` for future server-authoritative combat, PvP balance, backend account saves, deeper heir genetics, and class expansion.
