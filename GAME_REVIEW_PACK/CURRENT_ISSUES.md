# Current Issues, Known Bugs, and Deferred Work

This list is curated from the changelog, code review notes, and skim of the source. The codebase contains **no** literal `TODO` / `FIXME` / `XXX` / `HACK` / `BUG` comment markers — issues live here and in `docs/changelog.md` instead.

## Known limitations (deliberate, but worth knowing)

1. **`Game.jsx` is one giant ~8880-line component.** All state lives in one component via dozens of `useState` hooks. This is an explicit user preference ("keep single-artifact architecture — all in one Game.jsx"), not an oversight. Consequences:
   - Babel deopt threshold (500KB) is exceeded — HMR is noticeably slower than usual.
   - Code review tooling and AI agents have to be careful about context window.
   - Refactoring out a chunk requires care because state coupling is implicit.

2. **No backend persistence.** The Veilcourt chat backend is in-memory only (Express + Maps + ring buffers). On server restart all messages, threads, and roster vanish. The save game is localStorage-only — wiping browser storage destroys all progress.

3. **No authentication.** Chat identity is a stable client-generated ID in `localStorage["sv_chat_id"]`. Anyone clearing localStorage gets a new identity and can impersonate anyone by setting `name`. There is no auth layer planned for the free tier — the project framing is "single-player, with optional shared chat".

4. **PvP is mocked.** Duelist's Circle uses the same battle engine but the opponent is AI-rolled. A server contract for real PvP matchmaking is sketched in `docs/replit.md` but not implemented.

## Accessibility gaps (flagged by code review, deferred)

5. **HUD clickable spans are mouse-only.** The v73 round made portrait, name, class, generation, age stage, day, and rank/bloodmark/covenant tags clickable for info popups, but several were implemented as `<span>` / `<div>` with `onClick` rather than `<button>`. They lack `tabIndex`, `onKeyDown` for Enter/Space, and `aria-label`. Resource tiles and back buttons did get proper `<button>` semantics; only the inline tag spans are outstanding.

6. **No focus rings on the new clickable HUD bubbles** — relies on the `.hud-clickable` hover state, which doesn't help keyboard users.

## Dead state / cleanup

7. **`showFishLedger` / `setShowFishLedger`** — the v73 round replaced the inline fish ledger dropdown with a popup and stopped mounting the toggle, but the state hook itself was left in place. Safe to leave but harmless to remove.

8. **Local `covenant` useState** (~line 3034) is declared but the live covenant is tracked inside `pl.covenant`. Documented in `docs/replit.md` Gotchas — kept for now to avoid touching unrelated render paths.

9. **Scaffold leftovers in `src/components/ui/` and `src/pages/`** — the artifact was bootstrapped from a shadcn-style template. The game does not import from either directory; they could be deleted but were left to keep the artifact swap-friendly.

## Visual / UX rough edges

10. **`replit.md` was bloating** until the v74 fold — it's now slim, but as new vNN rounds land, take care to write changelog entries to `docs/changelog.md` instead of growing `replit.md` again.

11. **Battle screen on narrow viewports** — the v52/v56 changes balanced map vs. battle for desktop. Mobile fallback works but has not been QAed at <540px after v73's two-column HUD layout. The v73 code review explicitly recommended a quick visual QA pass at small widths.

12. **Older battle Aux dropdowns required a sed pass** to receive the `.battle-aux-dropdown` class. If a future round adds a 5th dropdown to the same `aux` tab, remember to add the class manually — there is no shared component (the IIFE wraps four parallel JSX trees).

## Architectural ideas queued, not built

(From `docs/replit.md` "Future combat hooks" + various changelog entries.)

13. **Crit damage from passives** (`critDamage` field on bloodmarks/class innates) — only gear currently feeds the multiplier; passive sources were sketched but not wired.

14. **Crit-on-status passives** (e.g., "Phoenix burns always crit") — not implemented.

15. **Per-skill `range` overrides** — currently range is a heuristic from the action's element/category. A `range` field on individual skill objects would let designers tune per-spell.

16. **Veilcourt covenant sub-channels** — the data model already carries `covenant` on every message; channel filtering is not yet exposed in the UI.

17. **WebSocket upgrade for chat** — currently HTTP polling at 3.5s open / 9s closed.

18. **Veilcourt moderation queue** — none. Anyone can post anything; no profanity filter, no report flow, no admin panel.

19. **Database persistence (Drizzle + Postgres)** for chat, leaderboards, save games — sketched, not implemented.

## Save / data shape risks

20. **No save migration system.** `localStorage` save slots are raw JSON of the live state object. Adding a new top-level field to the player or game state, then loading an old save, gives you `undefined` for that field. Most state additions in v29–v74 were additive and tolerant of `undefined`, but there's no versioning header in the save blob and no migration framework — a renamed or removed field would silently corrupt loads.

21. **Bloodmark IDs are strings.** Heir inheritance and save/load both round-trip the ID, including the dynamically-built `cs_<classId>_<slot>` IDs. `getBM(id)` reconstructs class-specifics on demand from `CLS`, so renaming a class id in `CLS` would break inheritance from old saves that reference the old ID.

22. **Veilcourt rate-limit is per-player by ID, not by IP.** A client clearing `sv_chat_id` between every message bypasses the 1.5s limit.

## Reviewer should pay attention to

- **`bAct` and `enemyTurn`** in `Game.jsx` — these are the combat heart and the most state-mutation-dense functions in the codebase.
- **`projectedEffStatsFor` / `effSt`** — single source of truth for stat aggregation. Bugs here ripple into damage formulas, HP caps, and creation-step previews.
- **`startSuccession`** — must be declared above its first usage (~line 3550); flagged as a TDZ bug history in `docs/replit.md` Gotchas.
- **The IIFE-wrapped HUD block** (~line 6964) — single biggest JSX block, lots of clickable handlers, all sharing scope with the outer `Game` component.
- **CSS specificity** — `.battle-bg` and `.hud-shell` rely heavily on `!important` to override the parchment `T.*` palette. Adding new dark-context UI without `!important` will get parchment-leaked.

## What's NOT a known issue

- The game is fully playable end-to-end (title → creation → world → towns → combat → death → succession → next generation).
- No build errors, no TypeScript errors, no runtime crashes reported.
- All v74 changes were verified by the architect code review pass and a screenshot.
