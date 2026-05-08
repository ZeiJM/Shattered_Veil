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

## Changelog history (v40–v50, condensed)

Eleven rounds of combat depth, audio, layout, and asset polish layered on the same battle loop. State shape preserved throughout — every change is additive or cosmetic. Highlights:

- **v40 — Positional combat + viewport fit.** 5 lanes (Vanguard/Front/Mid/Skirmish/Backline). One free move per turn (`btl.moved`). `actionRange(act)` returns 1 (melee) or 4 (ranged/AoE/copy/ult). Range gate in `bAct` + distance modifier (×1.10 point-blank, ×1.12 long-shot). Lane bar UI reads real `plPos`/`pos`. Viewport fix: all wrappers become flex-column with `.cd.page-panel` as internal scroller. CSS in `v40 — POSITIONAL COMBAT + VIEWPORT FIT PASS` block.
- **v41 — Procedural background music.** Self-contained `music.js` module with `createMusicPlayer()` + `trackForScreen(scr, opts)`. Lazy AudioContext, schedules one full loop ahead. 4 hand-written looping tracks (title 70 BPM, travel 116, battle 144, town 92). HUD `🎵`/`🔇` toggle persists via `localStorage["sv_music_muted"]`.
- **v42 — Enemy AI movement + boss music.** Per-enemy free move before action: melee advances, ranged retreats, support stays. Symmetric distance modifier on enemy hits. Added boss track (158 BPM, E minor). `trackForScreen(scr, { battleType })` routes; `BOSS_BATTLE_TYPES = {boss, fieldboss, rift, outpost}`.
- **v43 — SFX engine + audio settings.** 7-cue procedural SFX bank (hit/heal/levelup/victory/defeat/menu/cast) with separate `sfxGain` node. Wired into `bAct` + enemy turn (try/catch wrapped). Audio settings panel in `sub === "menu"` with mute toggles + 0–100% volume sliders. Persists `sv_sfx_muted`, `sv_music_vol`, `sv_sfx_vol`.
- **v44 — Critical hits (luck-based).** Crit chance = `min(0.25, st.lck × 0.012)`, ×1.5 damage. New `crit` SFX. Wired into `attackWithWeapon`, skill damage, copy damage. Skipped: ult, heals, gambler multiplier.
- **v45 — Enemy crits.** Symmetric mirror: `min(0.20, (enemy.lck || enemy.lvl × 0.6) × 0.010)`. Single roll per enemy attack, ×1.5 damage, log + SFX.
- **v46 — Layout compaction + swim icon + fish-while-swimming.** Painted swim PNG replaces 🏊 emoji. `canFish = nearOcean || onOcean` (was just `nearOcean`). World map vertical fit via CSS caps so d-pad + log stay onscreen.
- **v47 — Battle unification + world ergonomic pass.** Fixed parchment leak on `.battle-action-btn` — every button forced to dark navy gradient + gold border via `!important`. Element identity now lives in colored *text*. World HUD compacted on map screen. Map grid expanded `min(46dvh,360px)` → `min(62dvh,540px)`. Floating ergonomic d-pad introduced (later removed in v52).
- **v48 — Atmospheric audio + map richness + slow portrait fade.** Music engine rewrite: only `sine`/`triangle` voices, longer attack/release, ambient delay/echo bus, lower tempos, fixed track-overlap bug via per-track `musicBus`. Wider map grid (VW 14→19, VH 9→11). Player tile gets rotating gold conic aura ring + atlas treatment. Portrait crossfade slowed 480ms → 1200ms.
- **v49 — Lane+entity merger + action button overflow fix.** Lane bar tokens render portrait + truncated name + HP/MP bars (the lane IS the panel). Click-on-token = info popup ("Sorcerer Dossier"). `.battle-top-grid` hidden via CSS. Action button text overflow fixed (`white-space: normal !important`).
- **v50 — Painted enemy portraits + element icons.** Generated 58 images in 37 seconds via 6 parallel `generateImage` calls: 18 element sigils (`public/el/<el>.png`, transparent) + 40 boss portraits (`public/boss/<bossKey>.png`). New `ELEMENT_ICON_PATH(el)`, `BOSS_PORTRAIT_PATH(key)`, `<ElementIcon>` component with `onError` emoji fallback. `ElementTag` and lane tokens auto-pick up the new art. Sorcerer Dossier portrait box bumped 56→72px. CSS in `v50 — PAINTED ENEMY PORTRAITS + ELEMENT ICONS` block.

For full implementation details on any of these, see the corresponding `vNN — ...` block in `game.css` and the git history.


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

### v50 — Painted enemy portraits + element icons

User ask: "generate proper images for enemies and implement, as well as new icons for all elements." Generated and wired 58 images.

- **18 element icons** (`public/el/<lower>.png`) — transparent painted sigil emblems for all 16 elements + Physical + Null. Style: gold-leaf heraldic rune with deep matte color matching parchment+navy palette. `removeBackground: true` for clean transparency over any context.
- **40 boss portraits** (`public/boss/<bossKey>.png`) — head-and-shoulders painted JJK-flavored character busts for every named boss in `OUTPOST_BOSS_TEMPLATES` (20) and `RIFT_BOSS_TEMPLATES` (20). Each prompt baked a unique visual hook tied to the boss's name + element (e.g. `crownofice` = frostbitten queen with glacier-shard crown; `silkweave` = masked puppeteer with silver threads; `entropy` = shrouded cosmic horror with crown of collapsing stars).
- **Generation cost**: all 58 images produced in **37 seconds, 0 failures** via 6 parallel `generateImage` calls (10 images per call) wrapped in `Promise.all` from a single `code_execution`.
- **Wiring**:
  - New `ELEMENT_ICON_PATH(el)` and `BOSS_PORTRAIT_PATH(key)` helpers (~line 23) plus `<ElementIcon el size />` component (~line 25) — img tag with `onError` fallback to the existing emoji map. Sized via `Math.max(10, Math.round(fontSize * 1.45))` so it scales with the surrounding tag.
  - `ElementTag` (~line 470) now renders `<ElementIcon>` instead of the emoji span. Every battle/HUD/skill element badge picks this up automatically.
  - Foe lane tokens (`livingFoes.forEach`, ~line 6998) carry a new `portraitSrc` field: boss portrait if `bossKey` exists, otherwise the element PNG.
  - `renderRichToken` (~line 7062) renders `<img className="ent-portrait-img">` for foes (with `is-boss-portrait` modifier when `isBoss`); falls through to the original emoji path on error.
  - Sorcerer Dossier popup (~line 7019) — portrait box bumped 56→72px and now shows the same painted portrait at full quality.
- **CSS** (`v50 — PAINTED ENEMY PORTRAITS + ELEMENT ICONS` block at end of `game.css`) — `.ent-portrait-img` `object-fit: cover` with subtle saturate/contrast lift; `.is-boss-portrait` adds a warm orange `drop-shadow`; foe portraits get a faint crimson tint border and amplified glow when targeted.
- **bossKey contract** — already set by `mkOutpostBoss`/`mkRiftBoss` (line 2464+). Wild beasts (`BEASTS` array, 40 entries) intentionally untouched — they fall back to the element PNG which still gives a painted look without per-creature art. Future polish round can add per-beast portraits if desired.
- **PvP-ready** — `bossKey` and `portraitSrc` are plain strings on the foe snapshot; serializable for live PvP opponent payloads.

### v51 — Click-to-move world map + per-class auras

User feedback: "remove the arrow buttons but leave the WSAD input. Now wherever you click, your character automatically trails and moves. Also make each class have a different starting aura effect that is fitting with the class theme."

- **Arrow d-pad removed.** The 3×3 grid (N/S/E/W + center) collapsed to a single 64px circular floating action button. Same `.map-dpad-wrap` shell so the layout/positioning logic from v47 still applies, but the inner grid is now `map-dpad-solo` (flex column). Small "Click map · WASD" hint underneath.
- **Click-to-walk auto-trail.** New `autoMoveTarget` state (~line 3230). Tile `onClick` (~line 6942) sets the target to the clicked coords. A new effect (~line 3960) runs a `setTimeout(160ms)` greedy-step: each tick picks the larger of `|dx|`/`|dy|` and calls `move(±1, 0)` or `move(0, ±1)` toward the target. Stops when reached, when `scr` leaves `"map"`, or when WASD is pressed.
  - WASD handler updated to `setAutoMoveTarget(null)` before each manual step so player input always wins.
  - Re-uses the existing `move()` 130ms throttle, ocean HP-loss, encounter rolls, fieldboss triggers, and Dream Devourer trigger — no behavioral changes to single-tile movement.
  - POI tiles still don't auto-enter on arrival; the action button changes to "Enter" and waits for confirmation. Smart fallback for edge cases (POI is gated behind ocean, etc).
- **Action button modes**: `is-moving` (red pulsing "Stop") cancels auto-walk; `is-poi` (gold "Enter"); `is-fish` (cyan "Fish" or countdown); `is-idle` (·).
- **Per-class aura tints (21 classes).** Player tile gets `data-cls={pl?.cid || cls?.id}`. CSS variables `--aura-c1` (ring color), `--aura-c2` (inner pulse color), `--aura-spd` (rotation speed) overridden per class. Themes:
  - paladin: warm gold radiance · assassin: blood-red shadow (fast 4s) · sorcerer: violet arcane · priest: white halo (tight ring) · ranger: forest green
  - koen: silver moonlight · shouei: deep blue · phoenix: orange flame (3.5s, blurred) · chrono: cyan ticking conic dial (slow 9s) · dream: lavender shimmer
  - voidmage: black void conic-gradient · rune: teal glyph · bard: pink sparkle · gravity: slate vortex (slow 8.5s, conic) · sound: aqua wave
  - puppet: magenta · tide: ocean blue · monk: amber qi · primal: earthen brown · hexblade: crimson curse (4.5s, blurred) · gambler: gold-and-red mix
  - Special overlays: phoenix/hexblade get blurred saturated bloom; voidmage/gravity get conic-gradient sectors instead of soft radial; chrono gets a 6-spoke conic dial; priest/paladin get a tighter brighter ring.
- **Hover hint** on traversable tiles — gold outline + brightness lift to telegraph "click to walk".
- All CSS in a single appended `v51 — CLICK-TO-MOVE WORLD MAP + PER-CLASS AURAS` block at end of `game.css`. JSX touched in 4 spots: state declaration, autoMove effect, WASD handler, tile onClick + `data-cls`, d-pad markup.
- **PvP-ready**: `autoMoveTarget` is local to the client; opponents see only the resulting `pos` updates already broadcast by the existing movement system.

### v52 — Wider map + left rail layout + double-click/Space POI entry

User feedback: "the world map needs to be larger horizontally — too narrow. Move the legend to a side rail. Put the HP/MP/sound buttons next to the legend. Allow Space and double-click to enter POIs. Raise the map and shift things up for more immersion."

- **Map widened.** `VW` 19→27, `VH` 11→13, `hfX` 9→13, `hfY` 5→6 (~Game.jsx line 6898). Aspect-ratio overridden in CSS to `27 / 13` (was `19 / 11` from v48), `max-height: min(72dvh, 660px)`. The map now actually fills the parchment area horizontally.
- **2-column page-panel grid.** `.map-bg .page-panel` is now `display: grid; grid-template-columns: 168px minmax(0,1fr); grid-template-rows: auto 1fr;`. Header (World title + compass) spans full width on row 1. Row 2 is left rail (168px) + map (1fr).
- **Left rail (`.map-side-rail`) holds**, top to bottom:
  - **Big contextual ACTION button** (`.rail-action-btn`) — colored by state: gold pulsing for `is-poi` (Enter), cyan for `is-fish` (Fish/cooldown), red pulsing for `is-moving` (Stop), muted for `is-idle`. Replaces the floating bottom-right d-pad center button from v47/v51.
  - **HP/MP/Sound triplet** (`.map-rail-quick`) — 3-col grid of small icon buttons.
  - **Tile status card** — current biome or POI name.
  - **Meta strip** — repel steps, guild mission progress, paid rumor lead.
  - **Legend** (`.map-rail-legend`) — anchored at bottom of rail via `margin-top: auto`. 2-col compact pill grid when expanded.
  - **Hint line** — "Click · DblClick · Space · WASD".
- **Floating d-pad (`.map-dpad-wrap`) hidden** via `display: none !important` — its job is now done by the rail action button. JSX block removed entirely.
- **Double-click to enter POI.** `onDoubleClick` on world tiles sets `autoEnterRef.current = true` along with `setAutoMoveTarget`. The autoMove effect on arrival checks the ref and calls `enterPoiRef.current()` via `setTimeout(80ms)` to give state a tick to settle. Single-click still walks (does NOT auto-enter), preserving v51 behavior.
- **Space already enters POIs** via existing keydown handler — but only `enterPoi()` was being called, which previously bailed for hostile/outpost/rift types. v52 fix: `enterPoi` now self-routes those to `enterHostilePoi`/`enterRiftPoi` first, then delegates remaining types to a new internal `enterPoiInner`. Space now works for every POI category.
- **Refs**: `autoEnterRef` (used by autoMove effect) and `enterPoiRef` (read inside the setTimeout closure to avoid TDZ since `enterPoi` is declared below the effect). `enterPoiRef.current = enterPoi` is reassigned each render right after `enterPoi`'s declaration — no useEffect needed since refs aren't deps.
- **Mobile fallback** (`@media max-width: 720px`): rail flips to a flex-row above the map; map gets `max-height: min(50dvh, 380px)`.
- **Short-screen tweaks** (`@media max-height: 720px`): map cap relaxes to `60dvh / 460px`; action button shrinks 14→12px, quick buttons 16→14px.
- All CSS in a single appended `v52 — WIDER MAP + LEFT RAIL LAYOUT` block at end of `game.css`. JSX restructure in the map render block (~lines 6938–6991): wrapped grid in `.map-main-area`, replaced the floating d-pad + bottom status/legend with the new `<aside className="map-side-rail">`.
- **PvP-ready**: layout/routing-only changes. No new state shape, no new fields on `pl` or `btl`. Entry pathways (`enterPoi`/`enterHostilePoi`/`enterRiftPoi`) unchanged — only their callers changed.

### v53 — Time-of-day painted sky background (24 hourly variants)

User feedback: "change the background behind the map from that ugly tan to a fitting picture... 24 possible background images, beautiful, immersive, representative of the world, dusk to dawn, swap based on real local time."

- **24 painted Veilbound landscapes** in `public/sky/h00.png` ... `h23.png` (16:9, ~1MB each). Each one a torn-veil sky over the silhouette of a ruined sorcerer city, with hour-appropriate lighting:
  - **00–04** deep night → pre-dawn (starfield, twin moons, void rift, false dawn indigo)
  - **05–07** dawn → sunrise (gold seam, coral horizon, soft yellow morning)
  - **08–11** clear morning → late morning (cerulean sky, painterly clouds, faint rift scar)
  - **12–14** noon → afternoon (saturated blue, golden flood, lengthening shadows)
  - **15–17** golden hour → sunset (amber-gold, layered fire sky, ruins haloed)
  - **18–20** dusk → early night (crimson-violet, first stars, rift glowing pink-white)
  - **21–23** night → late night (aurora curtains, full moon, magenta rift-roar)
- **Hour state** (`skyHour`) initialised from `new Date().getHours()`, refreshed every 60s via setInterval (~Game.jsx line 3222). Only triggers a re-render when the hour actually changes.
- **Layered like the battle arena** (~Game.jsx line 6940): a fixed `<div className="map-sky-img">` with `backgroundImage` set inline + a `<div className="map-sky-veil">` darkening overlay, both `z-index: 0`. UI wrapper sits at `z-index: 1`. Slow `mapSkyDrift` 60s ken-burns animation. Cross-fade `transition: opacity 1.2s ease` between hours.
- **Parchment tan removed** from the map page-panel: `.map-bg .page-panel` now uses a translucent navy/violet glass with gold edges (preserves v52 grid layout + v37 gold hairline); `backdrop-filter: blur(2px)`. Map grid, log card, rail tile, legend pills all rebalanced to dark vellum so they read against the painted scene.
- **Heading + coords** flipped to gold/cream with text-shadow for legibility against any of the 24 backgrounds.
- All CSS in a single appended `v53 — TIME-OF-DAY SKY BACKGROUND` block at end of `game.css`. JSX touched in 2 spots: state declaration (~3222) and map render outer wrapper (~6940).
- **PvP-ready**: pure cosmetic, no game-state change. Each client picks its own local hour — players in different timezones will see different skies, which actually reinforces the "personal scrying basin" lore.

### v54 — Time-of-day phase indicator + world-tile tint harmony

Companion polish to v53. The 24-hour sky cycle was shipping unnoticed because nothing in the UI told the player it was happening. v54 surfaces it and ties the world tiles to it.

- **Phase badge** beside the "World" heading (~Game.jsx 6961). Pill with phase icon (🌙/🌅/🌇/etc), label in Cinzel small-caps gold ("Midnight" / "Sunrise" / "Golden hour" / ...) and a sub-line with local 12h clock + flavor descriptor ("12 AM · Deep night"). Tooltip explains "sky reflects your real time of day".
- **Phase classification** lives in a `useMemo` next to `skyHour` (~Game.jsx 3224). 11 phases mapped from the 24 hours: midnight (0–3) → predawn (4–5) → sunrise (6–7) → morning (8–11) → noon (12) → afternoon (13–14) → golden (15–16) → sunset (17) → dusk (18–19) → twilight (20) → night (21–23). Each phase carries `{key, icon, label, short}`.
- **Phase className on `.map-bg`** (`sky-phase-<key>`) drives a `--sky-tint` CSS variable + `--sky-glow` accent. The world map grid gets an `::after` glaze layer (`mix-blend-mode: soft-light`) that softly warms the tiles at golden hour, cools them at midnight, etc — harmonising the map terrain with whichever painted sky is rendering above. 1.6s ease transition between phases so the shift on hour rollover is gentle.
- **Tile tokens stay above** via `.map-bg .battle-world-grid > * { z-index: 2 }` so player aura, POI ribbons, and click targets read normally.
- All CSS in a single appended `v54 — TIME-OF-DAY PHASE INDICATOR + WORLD-TILE TINT HARMONY` block. JSX touched in 3 places (skyPhase/skyClock memos, map-bg className, head row).
- **PvP-ready**: cosmetic only, no state shape change. Each player's local tint reflects their local hour.
