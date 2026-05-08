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

## Compact change history (v50 – v57)

Most recent polish/depth rounds, condensed. Refer to git history for full diff context.

- **v50 — Painted enemy portraits + element icons.** Generated 58 images in 37s via 6 parallel `generateImage` calls: 18 transparent element sigils (`public/el/<el>.png`) + 40 boss portraits (`public/boss/<bossKey>.png`, one per `OUTPOST_BOSS_TEMPLATES` + `RIFT_BOSS_TEMPLATES`). New `ELEMENT_ICON_PATH(el)` / `BOSS_PORTRAIT_PATH(key)` helpers + `<ElementIcon>` component with `onError` emoji fallback. `ElementTag` and lane tokens auto-pick up the art. Foe lane tokens carry a `portraitSrc` field; `renderRichToken` renders `.ent-portrait-img` for foes (`.is-boss-portrait` modifier when boss). Sorcerer Dossier portrait box bumped 56→72px. CSS in `v50 — PAINTED ENEMY PORTRAITS + ELEMENT ICONS` block. Wild beasts intentionally untouched (fall back to element PNG).
- **v51 — Click-to-move world map + per-class auras.** Arrow d-pad collapsed to a single 64px floating action button. New `autoMoveTarget` state (~line 3230); tile `onClick` sets target, a `setTimeout(160ms)` greedy-step effect calls `move(±1, 0)` toward it. WASD always wins (`setAutoMoveTarget(null)` before each manual step). POIs don't auto-enter — action button changes to "Enter" and waits. Per-class aura tints for all 21 classes via `data-cls` + CSS variables `--aura-c1 / --aura-c2 / --aura-spd` (paladin gold, assassin red, sorcerer violet, etc). Special overlays: phoenix/hexblade blurred bloom; voidmage/gravity conic-gradient sectors; chrono 6-spoke dial. Hover hint on traversable tiles. CSS in `v51 — CLICK-TO-MOVE WORLD MAP + PER-CLASS AURAS` block.
- **v52 — Wider map + left rail layout + dblclick/Space POI entry.** `VW` 19→27, `VH` 11→13. Map page-panel becomes a 2-col grid: 168px left rail + 1fr map. Rail holds (top→bottom): big contextual ACTION button (gold pulse for POI, cyan for fish, red for stop), HP/MP/Sound triplet, tile status card, meta strip (repel/missions/rumor), bottom-anchored legend, hint line. Floating d-pad hidden via CSS. `onDoubleClick` sets `autoEnterRef.current = true` + autoMoveTarget — on arrival, autoMove effect calls `enterPoiRef.current()` via `setTimeout(80ms)`. `enterPoi` now self-routes hostile/outpost/rift types so Space works for every POI category. Mobile fallback: rail flips to flex-row above map. CSS in `v52 — WIDER MAP + LEFT RAIL LAYOUT` block.
- **v53 — Time-of-day painted sky background.** 24 painted Veilbound landscapes in `public/sky/h00.png ... h23.png` (16:9, ~1MB each), torn-veil skies over silhouettes of ruined sorcerer cities, hour-appropriate lighting (deep night → dawn → noon → golden hour → sunset → dusk → night). `skyHour` initialised from `new Date().getHours()`, refreshed every 60s. Layered like battle arena: fixed `.map-sky-img` (background-image inline) + `.map-sky-veil` darkening overlay, both `z-index: 0`. Slow 60s ken-burns drift, 1.2s opacity crossfade between hours. Parchment tan replaced with translucent navy/violet glass + gold edges + `backdrop-filter: blur(2px)`. CSS in `v53 — TIME-OF-DAY SKY BACKGROUND` block.
- **v54 — Time-of-day phase indicator + world-tile tint harmony.** Phase badge beside "World" heading: pill with phase icon, Cinzel gold label ("Midnight" / "Sunrise" / "Golden hour" / ...), sub-line with local 12h clock + flavor. 11 phases mapped from 24 hours via `useMemo` next to `skyHour` (midnight 0–3 → predawn 4–5 → sunrise 6–7 → morning 8–11 → noon 12 → afternoon 13–14 → golden 15–16 → sunset 17 → dusk 18–19 → twilight 20 → night 21–23). `sky-phase-<key>` className on `.map-bg` drives `--sky-tint` + `--sky-glow` CSS vars. World grid gets an `::after` glaze layer (`mix-blend-mode: soft-light`) — warms tiles at golden hour, cools them at midnight. Tile tokens stay above via `z-index: 2`. CSS in `v54 — TIME-OF-DAY PHASE INDICATOR + WORLD-TILE TINT HARMONY` block.
- **v55 — Combat depth pass.** Four queued combat hooks shipped together, all additive. **Boss charge attack**: at distance ≥ 3 with no `chargeCD`, 32% chance to telegraph (`🐉 coils for a devastating charge…`, 0 damage that turn). Next turn boss advances to player's lane and hits ×1.6 (`💢 CHARGES`); 3-turn cooldown. New fields: `enemy.charging`, `enemy.chargeCD`. Wired via existing `enemy.boss` flag — all 40 outpost/rift bosses get it free. **Back-step interrupt**: when a melee enemy advances AND `!btl.moved` AND `s2.spd > enemy.spd` AND `plPos < 2`, player auto-retreats one lane (`🦶 You back-step the advance`); enemy holds lane (lost point-blank bonus); consumes the free move. **Crit damage from gear** (`crit_damage` fx): new armor effect, +15% per piece to crit multiplier (1.5 → 2.10 at 4 pieces). Derived as `armorCritDmgBoost` next to `armorCritChance` (~4540), wired into weapon (4653) + skill (4845) crit paths. Crit log now shows actual multiplier. **Low-HP heartbeat**: new `sfxHeartbeat` cue in `music.js` (lub-dub sub-bass, 90→48Hz / 110→60Hz). `useEffect` `setInterval(1400ms)` plays it when `btl && btl.type !== "train" && pl.chp/pl.mhp < 0.30`. Routes through existing `sfxGain` bus.
- **v56 — Title polish + dual-music kill + world visibility + rail card fix.** **Audio**: removed legacy `<audio>` + `introAudioRef` + `TITLE_THEME_SRC` (235KB base64 wav, file shrunk 925KB→690KB) AND the 87-line "Adaptive ambient music" useEffect that was spinning up its own AudioContext alongside `music.js` — that parallel synth was the actual dual-playback source. `music.js` engine is now the SOLE music source. **Title**: removed "Online persistence…" sub-line, condensed sizes (h1 52→44, padding tighter), reworked all 6 pillar copies (e.g. "A Living Continent" → "Continent of the Veil"), staggered fade-up animation on hero + each pillar (`titleHeroIn` / `titlePillarIn` keyframes), 8 floating ember motes (`.title-embers > span` with `ember` keyframe). **World**: VW/VH `27,13` → `21,11` for bigger character resolution, sky veil lightened (`.map-sky-veil` darkening reduced ~50%), `.map-sky-img` opacity 0.95→1.0, page-panel translucency boosted (0.78→0.58 alpha + 3px backdrop blur), drifting ambient mote layer via `.map-bg::after` + `mapMotesDrift` 38s keyframe. **Rail tile card**: replaced inline-styled `.sb-line-card` with proper `.map-rail-tile` 2-line layout (`.map-rail-tile-name` Cinzel gold + `.map-rail-tile-type` pill), no more text-wrap awkwardness on town names like "Sunhaven Town". `prefers-reduced-motion` fallback included. CSS in `v56 — TITLE POLISH + WORLD VISIBILITY + RAIL TILE CARD` block.
- **v57 — Tabbed battle action regions + lane glow containment.** **Tabs**: new `battleSection` state ('veil' | 'combat' | 'items' | 'aux'), segmented control rendered above the action grid (icon + name + count badge, gold-active state, hides name labels on narrow screens). Each `.battle-section` gated via inline `display: none/block` so only one region is mounted-visible at a time — the right column no longer scrolls; ALL info bubbles preserved (just deferred to their tab). **Glow fix** (the "blue lines across the screen"): the `.battle-lane-tile.lane-player-here` cyan ring + `.lane-clickable:hover` gold ring were emitting outer box-shadows that streaked vertically into the action card below because the lane bar shares the lower-grid context with no isolation. Tightened both shadows from `0 0 0 1px ... 0 0 12px` outer → `inset 0 0 0 1px ... 0 0 6px`, added `isolation: isolate; position: relative; z-index: 2` to `.battle-bg .battle-lane`, plus `isolation: isolate` on `.battle-viewport`. CSS in `v57 — TABBED BATTLE ACTIONS + LANE GLOW CONTAINMENT` block.
