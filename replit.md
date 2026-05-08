# Shattered Veil — Chronicles of the Rift

A rich, single-page browser RPG with a 300×300 procedurally-generated world, 16 classes, 8 Bloodmarks, 5 Covenants, 7 Ranks, 16 elements, towns, rifts, turn-based combat, spellbooks, pets, equipment, dynasty succession, relic crafting, and story quests — all in one React component.

## Run & Operate

- `pnpm --filter @workspace/shattered-veil run dev` — run the game (workflow: `artifacts/shattered-veil: web`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React 18 + Vite 7 (port from `PORT` env, default 21515)
- No backend — localStorage saves (3 slots)
- Fonts: Cinzel (headers), Crimson Text (body narrative), Nunito (UI)

## Where things live

- `artifacts/shattered-veil/src/Game.jsx` — entire game logic + JSX (~7200 lines)
- `artifacts/shattered-veil/src/game.css` — complete visual stylesheet (~1080 lines), parchment/navy/crimson aesthetic
- `artifacts/shattered-veil/src/App.tsx` — renders `<Game />`
- `artifacts/shattered-veil/src/main.tsx` — React entry point

## Architecture decisions

- Single massive component: all game state (player, map, battle, UI) lives in one `Game` component using many `useState`/`useCallback`/`useMemo` hooks.
- Theme object `T` controls inline style colors throughout: parchment palette (`bg:#f5ead0`, `tx:#18120a`, etc.) for non-battle screens; battle screen forced dark via `!important` CSS.
- No build-time CSS-in-JS — theme colors are applied inline via JSX, with `.game.css` setting structural/layout rules and using `!important` to override inline styles for context-specific sections (`.battle-bg`, `.hud-shell`).
- Map: 300×300 tile grid (90000 tiles), biome-based generation, stored in state.
- Saves: JSON-serialized to `localStorage` (`sv_save_0/1/2`).

## Game Systems (v28)

### Bloodmarks
- 8 fantasy lineage traits: Veil-Veined, Stormborn, Ashblood, Ironblooded, Rootbound, Voidtouched, Goldensoul, Mirrorborn
- Defined in `BLOODMARKS` array (~line 270), helpers `getBM(id)`
- Applied in `projectedEffStatsFor` (stat bonuses) and on passive-check hooks in battle
- Chosen at character creation (step 2 of 3-step flow)
- **Inherited by heirs** at succession with ~1-in-7 chance of mutation
- Displayed in HUD badge + Stats panel card

### Ranks
- 7 progression tiers: Wanderer → Acolyte → Disciple → Seeker → Warden → Archon → Fractured
- Defined in `RANKS` array (~line 283), helpers `getRank(level)` / `getNextRankLevel(level)`
- Rank-up triggered in `giveXP` level-up loop; applies bonus stats directly to `pl.st`
- Displayed in HUD badge + Stats panel card with level milestone

### Covenants
- 5 factions: Veilwatch, Iron Crown, Embersong Circle, Silkweb Guild, Tidecall Conclave
- Defined in `COVENANTS` array (~line 294), helper `getCV(id)`
- Applied in `projectedEffStatsFor` (stat bonuses)
- Joined/renounced at the **Covenant Hall** town service (200G to renounce)
- Each generation starts without a covenant — must pledge anew
- Displayed in HUD badge + Stats panel card

### Relic Crafting
- 8 recipes using shards and fragments → consumable items
- Available at the **Relic Crafting** town service
- Recipes: Veil Tonic, Mana Crystal, Elixir of Iron, Void Draught, Cleansing Dust, Repel Incense, War Talisman, Void Shard Bomb

## Visual Aesthetic (Veilbound-inspired)

- **Background**: Deep navy/void starfield with crimson + gold aurora glows
- **Panels**: Parchment gradient cards (`#f5ead0 → #ecdfc0`) with tan borders and dark ink text
- **HUD**: Always dark navy (overrides parchment context via `!important`)
- **Battle screen**: Dark navy/void with crimson borders, forced via `!important` on `.battle-bg .cd`
- **Fonts**: Cinzel 900 for titles, Cinzel 600 for section headers, Crimson Text for narrative, Nunito for UI

## User preferences

- Visual style: parchment + navy + crimson (Veilbound-inspired)
- Keep single-artifact architecture — all in one `Game.jsx`
- JJK-flavor lore (innate techniques, sorcerer grades, domain expansions / unfolded territory) but kept subtle — no curse-energy or curse-user terminology
- End goal is a multiplayer PvP adventure — design new systems with PvP in mind even while single-player remains the default

## Story Quests (v29)

11-quest spine, presented in playable order in the Codex. New JJK-flavored milestones:
- `s8` Schoolyard Assessment — pledge a Covenant + win 3 sanctioned duels
- `s9` Echoes Across the Veil — win 5 Duelist's Circle matches
- `s10` The Inherited Technique — reach Warden grade + bloodmark expressions
- `s11` Unfolded Territory — survive a domain expansion encounter
The original `s7` Dream Devourer remains the final chapter.

## Duelist's Circle (PvP-prep)

Town service `duel` (icon 🤺) — sanctioned 1-on-1 sparring vs an AI sorcerer. Tracks `pl.duelTier` (0+) which scales opponent level and reward (gold/XP/relic shard). Wins also progress `s8` (when player has a Covenant) and `s9` story quests. Architecture sketch for live PvP:
- Same client-side battle engine, same `startBattle([e], "duel")` entrypoint — only the opponent payload changes (AI rolled now, real-player snapshot later)
- Server contract (TBD): match request with `{ tier, covenant, level }` → returns opponent snapshot `{ class, stats, skills, bloodmark }`
- Result POST: `{ winnerId, turns, finalEf, opponentId }` for ladder/rank updates
- Free tier: client-side only for now — UI explicitly says "matchmaking when PvP servers are live"

## Visual assets

- `public/title-veil.png` — painted hero artwork (cloaked sorcerer, torn veil sky, glowing runes) used as the title screen background. Layered under a darkening gradient so the UI text remains readable. Generated 2026-05-07.
- `public/town-square.png` — twilight town backdrop, currently unused, available for future town/inn redesign.
- `public/class/<id>.png` — 21 unique painted class portraits (one per CLS entry: paladin, assassin, sorcerer, priest, ranger, koen, shouei, phoenix, chrono, dream, voidmage, rune, bard, gravity, sound, puppet, tide, monk, primal, hexblade, gambler). Used in the class-pick grid (32×32 thumbnails) and Identity step (96×96 hero card). Wired via `import.meta.env.BASE_URL + "class/" + id + ".png"` so the URL works under any artifact path prefix.
- `public/battle-arena.png`, `public/battle-rift.png`, `public/battle-forest.png` — painted 16:9 battle backdrops. Picked by `btl.type` at battle render time: `rift`/`boss`/`fieldboss` → rift; `wild`/`beast` → forest; default → arena. Layered behind UI as a fixed `.battle-arena-img` div with `.battle-arena-veil` darkening on top, both `z-index: 0`. Battle UI wrapper sits at `z-index: 1`.

## Battle screen polish (v31)

- **Tactical lane bar** (`.battle-lane`) — 5 hex-styled tiles (Vanguard / Front / Mid / Skirmish / Backline) shown above the team grid. Read-only visualization for now: ally tokens auto-place in Front, foes split between Skirmish (first 2) and Backline. Sets up next session's actual movement + range modifiers (NinjaRPG-inspired). Targeted enemy gets a red glow `.target-mark`.
- **Contrast pass** — entity card rows for player/pet/ally/enemy in battle now use `.battle-entity-row` (dark navy gradient with `!important`), eliminating parchment `T.c2` leaks. Targeted enemy row gets `.is-target` (crimson). Element Summary buttons use `.battle-element-summary-btn` (with `.enemy` variant) for legible light text on dark.
- **NinjaRPG integration scope** — the zip's full hex+three.js+drizzle combat engine (12,691 lines) was *not* ported; incompatible with our single-component architecture. We lifted the *idea* (positional combat, range tiles) as a visual layer. Real movement + distance damage modifiers + targeting actions are queued for the next focused round.

## The Veilcourt — global chat (v38)

Lore-framed always-on global chat (a shared scrying basin, not a physical tavern — chat works in dungeons/rifts too). Persistent messaging via the api-server, no auth.

- **Backend** (`artifacts/api-server/src/routes/veilcourt.ts`): `GET /api/veilcourt/messages?since=<id>` and `POST /api/veilcourt/messages` (zod-validated payload with player identity: name, classId/className/classColor, sex, portrait, rank, bloodmark, covenant). In-memory ring buffer (200 msgs), 1.5s per-player rate limit, online-count tracker. No DB yet.
- **Frontend** (`Game.jsx`): HUD `💬` button with unread badge; modal at fixed 560×720 with header/log/composer regions. Polls 8s closed / 3s open. Stable identity in `localStorage["sv_chat_id"]`. Send payload includes full identity so other clients render rich message cards without lookup. `chatEl` mounted alongside `{popupEl}` at 5 sites (shell/map/battle/outpost+rift/town).
- **Future**: DB persistence (drizzle+postgres), per-covenant sub-channels (data model already carries `covenant`), WebSocket upgrade, moderation queue.

## Color polish pass (v37)

Focused, additive polish on the highest-traffic non-battle screens. No identity change — still parchment+navy+crimson. All new rules live in a single `v37 — COLOR POLISH PASS` block at the end of `game.css` (~line 1370+).

- **Premium gold edge** on every parchment `.cd` card (shell-bg / town-bg / map-bg / outpost-bg / rift-bg): inset top highlight + subtle gold inner ring + a thin gold-to-transparent gradient hairline across the top via `::before`. Gives the parchment a tooled-leather feel instead of a flat tan rectangle.
- **Page panel headers** (`.page-panel > div:first-child`) get an automatic gold-to-crimson divider underneath the title row — works on Equipment / Stats / Veil Archive / Story / Manual sub-pages without per-page edits.
- **Town service grid** — the 12+ identical parchment tiles now have:
  - **Per-category color glow** via `data-cat` attribute set in JSX (~line 6979). Categories: `commerce` (gold), `combat` (crimson), `social` (warm amber), `mystic` (violet), `nature` (green). The `SVC_CAT` map (~line 6945) routes each service id to its category.
  - **Tactile hover state**: lifts 2px, gains a category-tinted glow ring + outer shadow, border brightens to gold/category color.
  - **Better idle state**: parchment gradient + inset highlight + outer shadow (was flat `T.c2` with `T.bd` border). Icon bumped from 16→18px with drop-shadow; name uses Cinzel + dark ink + warm text-shadow for legibility.
- **Stats stat tiles** (`.stats-page .stats-grid > div`) — same parchment gradient + gold hairline + hover lift treatment.
- **Generic `.bs` parchment buttons** in shell/town contexts get a gold border + inset highlight + subtle outer shadow, with a brighter hover state. Fixes the previously-flat `T.c2`-backed back buttons.
- **Town header card + timer card** — inline parchment overrides replaced with subtle navy↔crimson gradient (header) and parchment gradient (timers), both gold-bordered.

JSX changes are minimal: only the town `svc-card` markup was retouched to add `data-cat`, `.svc-ic`, `.svc-nm` classes and drop redundant inline color/background (CSS owns it now). Stats / equipment / sub-page headers are styled purely from the appended CSS — no JSX edits needed.

## v40 – v45 — Combat depth + audio engine

Compact appendix. All five rounds layered on the same battle loop without state-shape breaks.

### v40 — Positional combat + viewport fit
- **Lanes 0–4** (Vanguard / Front / Mid / Skirmish / Backline). Player default `plPos = 1`, pet on Vanguard, ally behind. Enemies seed at `pos: 3` (first 2) and `pos: 4` (rest).
- **One free move per turn** (`moved` flag, reset on turn flip in `previewBattleState` + timer-skip setBtl).
- **`actionRange(act, idx)`** returns 1 (melee: plain strike, Null/Physical skill) or 4 (ranged/AoE/copy/ult/heal/buff). Auto-derived from existing skill data.
- **Range gate** in `bAct`: melee at distance > range aborts with "Out of range — move closer or use a ranged ability." Copy + ult never gated.
- **Distance modifier**: `+10%` point-blank (range 1 + dist 1) and `+12%` long-shot (range ≥ 4 + dist ≥ 3), multiplied into `encounterProfile.playerDamage` at top of `bAct`.
- **Lane bar UI** + `.battle-range-readout` strip read real `plPos`/`pos`. Lanes 0-2 clickable to move when `!btl.moved`; foe tokens click to set target.
- **Viewport fit**: `html, body, #root, .pg { overflow: hidden; height: 100dvh }`; all wrappers (`shell/town/map/outpost/rift/battle`) become flex-column with `.cd.page-panel` as internal scroller. CSS lives in the `v40 — POSITIONAL COMBAT + VIEWPORT FIT PASS` block at end of `game.css`.
- **PvP-ready**: `pos`, `plPos`, `moved`, `actionRange` all serializable + deterministic.

### v41 — Procedural background music
- Self-contained `music.js` module: `createMusicPlayer()` + `trackForScreen(scr, opts)`. Lazy AudioContext on first `play()` (autoplay rules). Schedules one full loop ahead, re-arms 300ms before loop end.
- **4 hand-written looping tracks** (Chrono Trigger flavor): title (70 BPM, A minor, Aeolian pad), travel (116 BPM, C major `C-G-Am-F`), battle (144 BPM, E minor `Em-C-D-B7` with kick), town (92 BPM, F major).
- Helpers: `scheduleNote(ctx, dest, type, freq, detune, t0, dur, gain)` with chiptune ADSR; `scheduleKick(ctx, dest, t0, gain)` (140→45Hz sine sweep).
- Single `useRef(createMusicPlayer())` at top of `Game()` (~line 3024). Two effects: one resumes ctx on first user gesture; another swaps tracks on `scr` change. HUD `🎵`/`🔇` toggle persists via `localStorage["sv_music_muted"]`.

### v42 — Enemy AI movement + boss music
- Per-enemy free move before action: melee skills (Null el) advance to lane 3 if at dist > 2; ranged (non-Null el) retreat to lane 4 if at dist < 2; support skills never move. One lane shift per turn, no crossing to player side.
- **Symmetric distance modifier**: melee at dist 1 → ×1.10, ranged at dist ≥ 3 → ×1.12, applied to `ed`. Pet/ally hits skip this branch (already ×0.7).
- Implemented inside the existing enemy `forEach` (~line 5235) — no new state.
- **Boss track** added: 158 BPM, E natural minor, `Em-Bm-C-D` with grittier sawtooth counter-melody. `BOSS_BATTLE_TYPES = {boss, fieldboss, rift, outpost}`. `trackForScreen(scr, { battleType })` routes; deps array includes `btl?.type` so music swaps mid-battle. Required hoisting `const [btl, setBtl]` above the music hooks.

### v43 — SFX engine + audio settings
- 7-cue procedural SFX bank in `music.js`, separate `sfxGain` node so music+SFX have independent volume + mute: `hit` (filtered noise burst), `heal` (sine bell dyad), `levelup` (CEGC square fanfare), `victory` (held CEG triad), `defeat` (descending sawtooth A3→A2), `menu` (square click), `cast` (rising sine sweep).
- API: `playSfx(name)`, `setSfxMuted/isSfxMuted`, `setMusicVolume/setSfxVolume/get*`. Persists `sv_sfx_muted`, `sv_music_vol`, `sv_sfx_vol`.
- **Wired everywhere in `bAct` + enemy turn** (all `try/catch`-wrapped, all positioned after early-return validation): strike/w2 → hit; guard → menu; mend → heal; skill → heal if `t === heal|support` else cast; copy/ult → cast; enemy hit on player (gated `ed > 0 && type !== "train"`) → hit. Meta cues: giveXP level-up → levelup; victory branches → victory; defeat → defeat; sub change → menu chirp.
- **Audio settings panel** in `sub === "menu"` (~line 6777): two rows (Music + SFX) each with mute toggle + 0-100% range slider (gold accentColor) + percent readout. Toggling SFX off→on plays a feedback chirp.
- TDZ note: `subRef = useRef(null)` declared above hooks, populated via `useEffect` placed after the `const [sub, setSub]` declaration (~line 3084).

### v44 — Critical hits (luck-based)
- Crit chance = `min(0.25, st.lck × 0.012)` — caps at 25% (~20+ lck). Damage ×1.5 with new `crit` SFX (1760→880Hz square stab + high-passed noise crack).
- Wired into 3 damage paths: `attackWithWeapon` (one roll before the multi-hit loop, gated `!isShieldWeapon`), skill damage (one roll on `base` before `targets.forEach` so AoE shares the crit and SFX fires once), copy damage (same single-roll on `copyBase`).
- Skipped: ult (already a power moment), heals (no analog), gambler class gamble multiplier (would double-roll).
- Stacks multiplicatively with existing `armorCritChance` (×1.28). Log line `💥 Critical hit! ×1.5` via `logInfo`.

### v45 — Enemy crits
- Symmetric mirror of v44 on the enemy turn (~line 5331 area, immediately before `up.chp -= ed`). One roll per enemy attack: `enemyCritChance = min(0.20, (enemy.lck || enemy.lvl * 0.6) × 0.010)` — slightly tamer than the player cap (20% vs 25%) since enemies attack more often. On crit, `ed = floor(ed * 1.5)`, log `💥 Enemy critical!`, plays the `crit` SFX. Gated `ed > 0 && btl.type !== "train"` matching the existing damage-application condition.
- No new state, no new fields — uses `enemy.lck` if present, otherwise derives a soft estimate from `enemy.lvl`. Pet/ally-targeted enemy hits skip the crit branch (those go through the separate ×0.7 path and don't read `ed` for the player's chp).

### v46 — Layout compaction + swim icon + fish-while-swimming
- **Swim icon**: replaced the bare 🏊 emoji on the map's player tile with a generated painted PNG (`public/swim-icon.png`). Layered as a full-cell `<img>` with `objectFit: cover` + cyan drop-shadow; preserves the existing custom-portrait overlay on top so player identity still reads through when in ocean tiles.
- **Fishing while swimming**: previously the action button explicitly excluded ocean tiles (`!tile || tile.bio !== "ocean"`), so once you stepped into the water you couldn't cast. Now `canFish = nearOcean || onOcean` — the button shows "Fish" both adjacent to and standing in ocean, with the same cooldown countdown.
- **World map vertical fit** (the actual fix for "can't scroll past the up arrow"): the map grid was uncapped and stretched to 500px square at full width, pushing the d-pad + status + log offscreen below the viewport (and `.pg` is `overflow: hidden` from v40). Capped via CSS to `min(46dvh, 360px)`, with a `@media (max-height: 720px)` step down to `min(40dvh, 300px)`. D-pad tiles 34→30px (28px on short screens), action bar (HP/MP/music) buttons shrunk to 24px tall single-line, log card maxHeight 132→96 (72 on short screens), legend pills 8→7px, status card padding tightened.
- **Battle compaction**: lane tile min-height 38→36 on short screens, tokens 30→26→22px, action buttons min-height 38→32px, range readout font 9→8px, combat title 14→11px. Layered onto the v40 viewport-fit block.
- All rules in a single appended `v46 — WORLD + BATTLE LAYOUT COMPACTION PASS` block at end of `game.css`. JSX touched only at the swim icon line (~6915) and the action button (~6921, wrapped in IIFE for the new `canFish` derived value).

### v47 — Battle unification + world ergonomic pass
- **Battle button parchment leak fixed.** All `.battle-action-btn` were inline-styled with parchment-ish colors (`T.c2` cream, `T.ok+"15"` pale green, `ELC[el]+"12"` element tints) which clashed with the dark battle backdrop. v47 forces every action button to one dark navy gradient + gold border via `!important` overrides — element identity now lives in the colored *text* inside the button (which the JSX already renders via `ELC[sk.el]`), not the button background. Veil Expansion (ult) keeps the gold treatment as a deliberate exception (it's the climax button) — selector `.battle-action-btn[style*="pulse"]` matches the inline `animation: pulse 1s infinite` on the ult.
- **Battle section frames** wrapped in subtle dark cards (`rgba(8,14,30,0.45)` bg + thin gold border), section titles in Cinzel uppercase with gold underline. Action grid `auto-fit minmax(160px, 1fr)` for clean wrapping. Help-chip `?` repositioned as a small gold circle in top-right.
- **World HUD compacted** on map screen specifically (`.map-bg .hud-shell`): smaller name/sub fonts, thinner HP/MP/XP bars, tighter quick-nav buttons. Saved ~50px vertical.
- **Map grid expanded** from `min(46dvh, 360px)` → `min(62dvh, 540px)` (down to 54dvh on short screens). Now actually fills the parchment area instead of being a tiny square in the middle.
- **Floating ergonomic d-pad** (`.map-dpad-wrap`) — repositioned to bottom-right of the page-panel as an absolute-positioned floating control panel. 42px tiles in a navy-glass card with gold border + drop shadow. Center action button is colored by state: gold pulsing for `is-poi` (Enter), cyan for `is-fish` (Fish/cooldown), muted purple for `is-idle` (·). JSX touched only for the d-pad block (~6920) — wrapped in IIFE that derives `centerCls` from `hasPoi`/`canFish`.
- **Legend pills hidden by default**, expand on hover of the page-panel. Map log shrunk to 80px (60 short).
- All in one appended `v47 — BATTLE UNIFICATION + WORLD ERGONOMIC PASS` block at end of `game.css` (~line 1955+).

### Future combat hooks (queued, not built)
- Crit damage modifier from gear/passives (`critDamage` field), crit-on-status passives (Phoenix burns always crit, etc).
- Enemy lane-1 charge attack (boss steps into Front for one big hit, retreats).
- Player back-step interrupt when a melee enemy advances.
- Per-skill `range` overrides (finer than the current el-based heuristic).
- Music intensity layer — heartbeat tom on the active battle track when player HP < 30% (the scheduling model supports stacking instruments mid-loop).
- Veilcourt covenant sub-channels + WebSocket upgrade.

## Compact change history (v30 – v39)

Earlier polish rounds, condensed. Refer back here when touching any of these areas.

- **v30 — Forge Your Hero contrast.** Forced dark-navy gradient + light text on every card inside `.create-bg`. Personal Quote required alongside Hero Name.
- **v32 — Custom portraits (`pl.portrait`).** URL string on the player, validated by `isValidPortraitURL` (accepts `http(s)://` + `data:image/(png|jpeg|gif|webp|avif|apng)`, ≤800 chars, SVG blocked). Rendered via `portraitOverlay(url)` layered over a fallback (`<container relative>{fallback}{portraitOverlay(url)}</container>` — never short-circuit). Animated GIFs work natively.
- **v33 — Title screen.** Single pulsing `⚔ Enter the Rift` CTA + six lore pillars (`.title-pillars`, 3→2 responsive). Multiplayer/Admin/Load buttons removed (`loadGame()` retained for post-death flow).
- **v34 — Avatar & icon polish.** `playerAvatar(cid, fallbackIc, portraitUrl, sex)` is the single render source for the player (emoji → class png → custom overlay). Used in HUD, battle player row, lane ally token, world/submap. Class picker bumped to 40×40 with class-color glow; bloodmark icons wrapped in 36×36 radial-glow badge.
- **v35 — Popup contrast.** `.popup-modal` (in `game.css`) owns colors with `!important` to override caller inline styles. `popupEl` JSX sets layout only.
- **v36 — Gender-variant class portraits.** Every class has `class/<id>.png` (M) + `class/<id>_f.png` (F). `classPortraitUrl(cid, sex)` + female → male `onError` fallback via `data-sex`/`data-fb` (no infinite loop). All 5 callsites pass `pl?.sex`.
- **v37 — Color polish pass.** Premium gold edges on parchment cards via `::before` hairlines, gold-to-crimson dividers under page-panel headers, town service grid with `data-cat` color glow (commerce/combat/social/mystic/nature), tactile hover on stat tiles + `.bs` buttons. JSX touched only on town `svc-card`.
- **v38 — The Veilcourt** (global chat — see dedicated section above). Backend `/api/veilcourt/messages` (in-memory ring buffer), polling client (8s closed / 3s open), modal with portrait+name+class/rank/covenant/bloodmark tags, stable identity in `localStorage["sv_chat_id"]`.
- **v39 — Crossfade portraits + Sien Risetsu rework.** `CrossfadePortrait` helper (~line 3050) layered M/F pngs with 480ms opacity dissolve instead of `key`-swap hard cut. Used in class-pick thumbnails, Identity preview, custom-portrait fallback bg. Repainted koen/koen_f (blazing) and shouei/shouei_f (cold) twin portraits at 1024×1024.

## Gotchas

- `Game.jsx` exceeds Babel's 500KB deoptimization threshold — HMR is slower than normal, be patient after edits.
- Battle screen colors must use `!important` in CSS to override inline `T.*` parchment colors.
- `hud-shell` must use `!important` — it's inside `.shell-bg .cd` which would otherwise apply parchment styling.
- `startSuccession` must be declared before line ~3550 (was a TDZ bug when first migrated).
- `index.css` is intentionally minimal — no Tailwind (the original template had placeholder `red` values).
- The local `covenant` useState (line ~3034) is declared but the live covenant is tracked inside `pl.covenant` — safe to leave as-is.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
