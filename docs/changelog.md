# Shattered Veil — Changelog

Condensed implementation notes for every polish/depth round. Newest entries at the bottom. For the current architecture and live systems, see `replit.md`.

## v29 — Story Quests rework

11-quest spine, presented in playable order in the Codex. New JJK-flavored milestones:

- `s8` Schoolyard Assessment — pledge a Covenant + win 3 sanctioned duels
- `s9` Echoes Across the Veil — win 5 Duelist's Circle matches
- `s10` The Inherited Technique — reach Warden grade + bloodmark expressions
- `s11` Unfolded Territory — survive a domain expansion encounter

The original `s7` Dream Devourer remains the final chapter.

## v30 — Forge Your Hero contrast

Forced dark-navy gradient + light text on every card inside `.create-bg`. Personal Quote required alongside Hero Name.

## v31 — Battle screen polish

- **Tactical lane bar** (`.battle-lane`) — 5 hex-styled tiles (Vanguard / Front / Mid / Skirmish / Backline) shown above the team grid. Read-only visualization for now: ally tokens auto-place in Front, foes split between Skirmish (first 2) and Backline. Sets up future movement + range modifiers (NinjaRPG-inspired). Targeted enemy gets a red glow `.target-mark`.
- **Contrast pass** — entity card rows for player/pet/ally/enemy in battle now use `.battle-entity-row` (dark navy gradient with `!important`), eliminating parchment `T.c2` leaks. Targeted enemy row gets `.is-target` (crimson). Element Summary buttons use `.battle-element-summary-btn` (with `.enemy` variant) for legible light text on dark.
- **NinjaRPG integration scope** — the zip's full hex+three.js+drizzle combat engine (12,691 lines) was *not* ported; incompatible with our single-component architecture. We lifted the *idea* (positional combat, range tiles) as a visual layer.

## v32 — Custom portraits (`pl.portrait`)

URL string on the player, validated by `isValidPortraitURL` (accepts `http(s)://` + `data:image/(png|jpeg|gif|webp|avif|apng)`, ≤800 chars, SVG blocked). Rendered via `portraitOverlay(url)` layered over a fallback (`<container relative>{fallback}{portraitOverlay(url)}</container>` — never short-circuit). Animated GIFs work natively.

## v33 — Title screen

Single pulsing `⚔ Enter the Rift` CTA + six lore pillars (`.title-pillars`, 3→2 responsive). Multiplayer/Admin/Load buttons removed (`loadGame()` retained for post-death flow).

## v34 — Avatar & icon polish

`playerAvatar(cid, fallbackIc, portraitUrl, sex)` is the single render source for the player (emoji → class png → custom overlay). Used in HUD, battle player row, lane ally token, world/submap. Class picker bumped to 40×40 with class-color glow; bloodmark icons wrapped in 36×36 radial-glow badge.

## v35 — Popup contrast

`.popup-modal` (in `game.css`) owns colors with `!important` to override caller inline styles. `popupEl` JSX sets layout only.

## v36 — Gender-variant class portraits

Every class has `class/<id>.png` (M) + `class/<id>_f.png` (F). `classPortraitUrl(cid, sex)` + female → male `onError` fallback via `data-sex`/`data-fb` (no infinite loop). All 5 callsites pass `pl?.sex`.

## v37 — Color polish pass

Premium gold edges on parchment cards via `::before` hairlines, gold-to-crimson dividers under page-panel headers, town service grid with `data-cat` color glow (commerce/combat/social/mystic/nature), tactile hover on stat tiles + `.bs` buttons. JSX touched only on town `svc-card`. CSS in `v37 — COLOR POLISH PASS` block.

## v38 — The Veilcourt (global chat)

Backend `/api/veilcourt/messages` (in-memory ring buffer), polling client (8s closed / 3s open), modal with portrait+name+class/rank/covenant/bloodmark tags, stable identity in `localStorage["sv_chat_id"]`. See `replit.md` for the live architecture.

## v39 — Crossfade portraits + Sien Risetsu rework

`CrossfadePortrait` helper (~line 3050) layered M/F pngs with 480ms opacity dissolve instead of `key`-swap hard cut. Used in class-pick thumbnails, Identity preview, custom-portrait fallback bg. Repainted koen/koen_f (blazing) and shouei/shouei_f (cold) twin portraits at 1024×1024.

## v40 — Positional combat + viewport fit

5 lanes (Vanguard/Front/Mid/Skirmish/Backline). One free move per turn (`btl.moved`). `actionRange(act)` returns 1 (melee) or 4 (ranged/AoE/copy/ult). Range gate in `bAct` + distance modifier (×1.10 point-blank, ×1.12 long-shot). Lane bar UI reads real `plPos`/`pos`. Viewport fix: all wrappers become flex-column with `.cd.page-panel` as internal scroller. CSS in `v40 — POSITIONAL COMBAT + VIEWPORT FIT PASS` block.

## v41 — Procedural background music

Self-contained `music.js` module with `createMusicPlayer()` + `trackForScreen(scr, opts)`. Lazy AudioContext, schedules one full loop ahead. 4 hand-written looping tracks (title 70 BPM, travel 116, battle 144, town 92). HUD `🎵`/`🔇` toggle persists via `localStorage["sv_music_muted"]`.

## v42 — Enemy AI movement + boss music

Per-enemy free move before action: melee advances, ranged retreats, support stays. Symmetric distance modifier on enemy hits. Added boss track (158 BPM, E minor). `trackForScreen(scr, { battleType })` routes; `BOSS_BATTLE_TYPES = {boss, fieldboss, rift, outpost}`.

## v43 — SFX engine + audio settings

7-cue procedural SFX bank (hit/heal/levelup/victory/defeat/menu/cast) with separate `sfxGain` node. Wired into `bAct` + enemy turn (try/catch wrapped). Audio settings panel in `sub === "menu"` with mute toggles + 0–100% volume sliders. Persists `sv_sfx_muted`, `sv_music_vol`, `sv_sfx_vol`.

## v44 — Critical hits (luck-based)

Crit chance = `min(0.25, st.lck × 0.012)`, ×1.5 damage. New `crit` SFX. Wired into `attackWithWeapon`, skill damage, copy damage. Skipped: ult, heals, gambler multiplier.

## v45 — Enemy crits

Symmetric mirror: `min(0.20, (enemy.lck || enemy.lvl × 0.6) × 0.010)`. Single roll per enemy attack, ×1.5 damage, log + SFX.

## v46 — Layout compaction + swim icon + fish-while-swimming

Painted swim PNG replaces 🏊 emoji. `canFish = nearOcean || onOcean` (was just `nearOcean`). World map vertical fit via CSS caps so d-pad + log stay onscreen.

## v47 — Battle unification + world ergonomic pass

Fixed parchment leak on `.battle-action-btn` — every button forced to dark navy gradient + gold border via `!important`. Element identity now lives in colored *text*. World HUD compacted on map screen. Map grid expanded `min(46dvh,360px)` → `min(62dvh,540px)`. Floating ergonomic d-pad introduced (later removed in v52).

## v48 — Atmospheric audio + map richness + slow portrait fade

Music engine rewrite: only `sine`/`triangle` voices, longer attack/release, ambient delay/echo bus, lower tempos, fixed track-overlap bug via per-track `musicBus`. Wider map grid (VW 14→19, VH 9→11). Player tile gets rotating gold conic aura ring + atlas treatment. Portrait crossfade slowed 480ms → 1200ms.

## v49 — Lane+entity merger + action button overflow fix

Lane bar tokens render portrait + truncated name + HP/MP bars (the lane IS the panel). Click-on-token = info popup ("Sorcerer Dossier"). `.battle-top-grid` hidden via CSS. Action button text overflow fixed (`white-space: normal !important`).

## v50 — Painted enemy portraits + element icons

Generated 58 images in 37s via 6 parallel `generateImage` calls: 18 transparent element sigils (`public/el/<el>.png`) + 40 boss portraits (`public/boss/<bossKey>.png`, one per `OUTPOST_BOSS_TEMPLATES` + `RIFT_BOSS_TEMPLATES`). New `ELEMENT_ICON_PATH(el)` / `BOSS_PORTRAIT_PATH(key)` helpers + `<ElementIcon>` component with `onError` emoji fallback. `ElementTag` and lane tokens auto-pick up the art. Foe lane tokens carry a `portraitSrc` field; `renderRichToken` renders `.ent-portrait-img` for foes (`.is-boss-portrait` modifier when boss). Sorcerer Dossier portrait box bumped 56→72px. CSS in `v50 — PAINTED ENEMY PORTRAITS + ELEMENT ICONS` block. Wild beasts intentionally untouched (fall back to element PNG).

## v51 — Click-to-move world map + per-class auras

Arrow d-pad collapsed to a single 64px floating action button. New `autoMoveTarget` state (~line 3230); tile `onClick` sets target, a `setTimeout(160ms)` greedy-step effect calls `move(±1, 0)` toward it. WASD always wins (`setAutoMoveTarget(null)` before each manual step). POIs don't auto-enter — action button changes to "Enter" and waits. Per-class aura tints for all 21 classes via `data-cls` + CSS variables `--aura-c1 / --aura-c2 / --aura-spd` (paladin gold, assassin red, sorcerer violet, etc). Special overlays: phoenix/hexblade blurred bloom; voidmage/gravity conic-gradient sectors; chrono 6-spoke dial. Hover hint on traversable tiles. CSS in `v51 — CLICK-TO-MOVE WORLD MAP + PER-CLASS AURAS` block.

## v52 — Wider map + left rail layout + dblclick/Space POI entry

`VW` 19→27, `VH` 11→13. Map page-panel becomes a 2-col grid: 168px left rail + 1fr map. Rail holds (top→bottom): big contextual ACTION button (gold pulse for POI, cyan for fish, red for stop), HP/MP/Sound triplet, tile status card, meta strip (repel/missions/rumor), bottom-anchored legend, hint line. Floating d-pad hidden via CSS. `onDoubleClick` sets `autoEnterRef.current = true` + autoMoveTarget — on arrival, autoMove effect calls `enterPoiRef.current()` via `setTimeout(80ms)`. `enterPoi` now self-routes hostile/outpost/rift types so Space works for every POI category. Mobile fallback: rail flips to flex-row above map. CSS in `v52 — WIDER MAP + LEFT RAIL LAYOUT` block.

## v53 — Time-of-day painted sky background

24 painted Veilbound landscapes in `public/sky/h00.png ... h23.png` (16:9, ~1MB each), torn-veil skies over silhouettes of ruined sorcerer cities, hour-appropriate lighting (deep night → dawn → noon → golden hour → sunset → dusk → night). `skyHour` initialised from `new Date().getHours()`, refreshed every 60s. Layered like battle arena: fixed `.map-sky-img` (background-image inline) + `.map-sky-veil` darkening overlay, both `z-index: 0`. Slow 60s ken-burns drift, 1.2s opacity crossfade between hours. Parchment tan replaced with translucent navy/violet glass + gold edges + `backdrop-filter: blur(2px)`. CSS in `v53 — TIME-OF-DAY SKY BACKGROUND` block.

## v54 — Time-of-day phase indicator + world-tile tint harmony

Phase badge beside "World" heading: pill with phase icon, Cinzel gold label ("Midnight" / "Sunrise" / "Golden hour" / ...), sub-line with local 12h clock + flavor. 11 phases mapped from 24 hours via `useMemo` next to `skyHour` (midnight 0–3 → predawn 4–5 → sunrise 6–7 → morning 8–11 → noon 12 → afternoon 13–14 → golden 15–16 → sunset 17 → dusk 18–19 → twilight 20 → night 21–23). `sky-phase-<key>` className on `.map-bg` drives `--sky-tint` + `--sky-glow` CSS vars. World grid gets an `::after` glaze layer (`mix-blend-mode: soft-light`) — warms tiles at golden hour, cools them at midnight. Tile tokens stay above via `z-index: 2`. CSS in `v54 — TIME-OF-DAY PHASE INDICATOR + WORLD-TILE TINT HARMONY` block.

## v55 — Combat depth pass

Four queued combat hooks shipped together, all additive. **Boss charge attack**: at distance ≥ 3 with no `chargeCD`, 32% chance to telegraph (`🐉 coils for a devastating charge…`, 0 damage that turn). Next turn boss advances to player's lane and hits ×1.6 (`💢 CHARGES`); 3-turn cooldown. New fields: `enemy.charging`, `enemy.chargeCD`. Wired via existing `enemy.boss` flag — all 40 outpost/rift bosses get it free. **Back-step interrupt**: when a melee enemy advances AND `!btl.moved` AND `s2.spd > enemy.spd` AND `plPos < 2`, player auto-retreats one lane (`🦶 You back-step the advance`); enemy holds lane (lost point-blank bonus); consumes the free move. **Crit damage from gear** (`crit_damage` fx): new armor effect, +15% per piece to crit multiplier (1.5 → 2.10 at 4 pieces). Derived as `armorCritDmgBoost` next to `armorCritChance` (~4540), wired into weapon (4653) + skill (4845) crit paths. Crit log now shows actual multiplier. **Low-HP heartbeat**: new `sfxHeartbeat` cue in `music.js` (lub-dub sub-bass, 90→48Hz / 110→60Hz). `useEffect` `setInterval(1400ms)` plays it when `btl && btl.type !== "train" && pl.chp/pl.mhp < 0.30`. Routes through existing `sfxGain` bus.

## v56 — Title polish + dual-music kill + world visibility + rail card fix

- **Audio**: removed legacy `<audio>` + `introAudioRef` + `TITLE_THEME_SRC` (235KB base64 wav, file shrunk 925KB→690KB) AND the 87-line "Adaptive ambient music" useEffect that was spinning up its own AudioContext alongside `music.js` — that parallel synth was the actual dual-playback source. `music.js` engine is now the SOLE music source.
- **Title**: removed "Online persistence…" sub-line, condensed sizes (h1 52→44, padding tighter), reworked all 6 pillar copies (e.g. "A Living Continent" → "Continent of the Veil"), staggered fade-up animation on hero + each pillar (`titleHeroIn` / `titlePillarIn` keyframes), 8 floating ember motes (`.title-embers > span` with `ember` keyframe).
- **World**: VW/VH `27,13` → `21,11` for bigger character resolution, sky veil lightened (~50%), `.map-sky-img` opacity 0.95→1.0, page-panel translucency boosted (0.78→0.58 alpha + 3px backdrop blur), drifting ambient mote layer via `.map-bg::after` + `mapMotesDrift` 38s keyframe.
- **Rail tile card**: replaced inline-styled `.sb-line-card` with proper `.map-rail-tile` 2-line layout (`.map-rail-tile-name` Cinzel gold + `.map-rail-tile-type` pill).

`prefers-reduced-motion` fallback included. CSS in `v56 — TITLE POLISH + WORLD VISIBILITY + RAIL TILE CARD` block.

## v57 — Tabbed battle action regions + lane glow containment

- **Tabs**: new `battleSection` state (`'veil' | 'combat' | 'items' | 'aux'`), segmented control rendered above the action grid (icon + name + count badge, gold-active state, hides name labels on narrow screens). Each `.battle-section` gated via inline `display: none/block` so only one region is mounted-visible at a time — the right column no longer scrolls; ALL info bubbles preserved (just deferred to their tab).
- **Glow fix** (the "blue lines across the screen"): `.battle-lane-tile.lane-player-here` cyan ring + `.lane-clickable:hover` gold ring were emitting outer box-shadows that streaked vertically into the action card below. Tightened both shadows from `0 0 0 1px ... 0 0 12px` outer → `inset 0 0 0 1px ... 0 0 6px`, added `isolation: isolate; position: relative; z-index: 2` to `.battle-bg .battle-lane`, plus `isolation: isolate` on `.battle-viewport`.

CSS in `v57 — TABBED BATTLE ACTIONS + LANE GLOW CONTAINMENT` block.

## v58 — Title pillars redesign + CTA soften

Pillars upgraded from flat dark cards to themed glass tiles. Each card carries a `data-pillar` attr (`classes`/`bloodmark`/`domain`/`covenant`/`continent`/`heir`) which sets two CSS vars (`--pl-c1` / `--pl-c2`) for the accent color (crimson / violet / cyan / amber / green / gold). Each card has: hexagonal icon frame (clip-path) with conic-gradient ring slowly rotating around it (9s linear), large background sigil watermark drifting/scaling on hover, four gold filigree corner notches that grow on hover, diagonal sheen sweep that crosses the card on hover (0.85s cubic-bezier), accent-tinted radial blob in the top-right, accent-tinted shadow ring, and accent-tinted inset glow. CTA dropped: `title-button-stack` margin-top 8px → 26px, and `.title-cta` opacity 1 → 0.92 + 2px backdrop-blur so the painted hero artwork + tagline read through it (hover restores opacity 1). New sigil glyphs per pillar (❖ ❈ ❂ ✜ ✦ ♛). `prefers-reduced-motion` disables the spinning ring + sheen sweep. CSS in `v58 — TITLE PILLARS REDESIGN + CTA SOFTEN` block.

## v59 — Forge Your Hero: backdrop, animations, slower portrait swap with shimmer

- **Background**: generated `public/forge-hall.png` (16:9 painted Veilbound forge chamber — vaulted stone, glowing rune sigils, soul-fire altar, torn violet veil overhead). Wired via `.create-bg-art` with darkening linear-gradient overlay (same pattern as title-bg-art), `background-position: center 35%`.
- **Ember motes**: `.create-embers` fixed layer (z:1, pointer-events:none) with 10 spans drifting upward via `createEmber` keyframe (14–19s durations, 6%–95% horizontal positions).
- **Stagger fade-in**: `.create-anim` wrapper runs `createIn` (1.0s blur+scale fade) on the intro-shell; `.create-class-grid > .cd` cards run `createCardIn` with per-nth-child delays from 0.10s → 0.46s. Class card hover lifts 2px with gold glow ring. `.create-title` gets gold textShadow + 0.04em letter-spacing.
- **CrossfadePortrait rework**: transition 1200ms → 2200ms; both layers now also crossfade `filter: blur(2px) brightness(0.85)` + `transform: scale(1.04)` so the inactive image dims+pulls back instead of just fading; added `pulseKey` React state + `prevSexRef` so a `.cf-shimmer` span (keyed by pulseKey) is mounted once per swap and runs `cfShimmerSweep` (1.1s diagonal gold sheen, mix-blend-mode: screen, z:3 over the wrapper). Autoswap interval slowed 2200ms → 4500ms so the Identity preview breathes.

`prefers-reduced-motion` disables all v59 animations. CSS in `v59 — FORGE YOUR HERO` block.

## v60 — Bloodmark step rework: 8 PNG sigils + 4 class-specific Innate marks + drifting glyph background

- **PNG icons**: generated 8 transparent sigil PNGs in `public/bm/` (filenames match the actual BLOODMARKS ids). Rendered via new `BM_ICON_PATH(id)` helper inside a `.bm-ic-frame` colored radial circle, with the original emoji as `.bm-ic-glyph` fallback layer.
- **Class-specific bloodmarks**: new `CLASS_BM_TEMPLATES` array (4 archetypes — Edge/Bulwark/Tempo/Conduit covering offensive/defensive/utility/signature roles) and `buildClassBloodmarks(cls)` that instantiates 4 themed marks per class with id `cs_<classId>_<slot>`, naming each `<ClassName> <Suffix>` (e.g. `Phoenix Edge`, `Voidmage Conduit`). Stats and passive descriptions reference the class name in flavor text.
- **getBM rework**: now resolves both shared (BLOODMARKS array) and `cs_*` IDs by reconstructing class-specifics on demand from CLS — `pl.bloodmark` remains a simple string ID so save/load and heir inheritance both survive.
- **UI**: bloodmark step now splits into two sections — `★ Innate to <Class>` (4 class-specifics with gold INNATE corner badge, gold border-image filigree, and a rotating conic-gradient ring around the icon frame via `.bm-innate .bm-ic-frame::after`) and `Ancestral Lineage` (4 shared marks, deterministically sampled per class via a tiny LCG-seed sort so re-entering the step shows the same 4).
- **Background animation**: `.bm-step-bg` layer with 12 drifting rune-glyph spans (content via `::before`, palette of 6 fantasy glyphs in muted accent colors, 21–28s drift+rotate keyframe `bmGlyphDrift`) sits behind the section grid. `prefers-reduced-motion` disables both the rune drift and the innate ring spin.

CSS in `v60 — BLOODMARK STEP` block.

## v61 — Identity step compact 2-col layout

Replaced the multi-card "Starting Interaction Preview" (with 2 example interaction buttons + filler explainer) on step 2 with a single tight `Unique Class Interactions` card — pip + Cinzel header + one italic line: *"Two interactions are rolled randomly each run from this class's signature pool. They complement the <Class>'s playstyle — different runs, different combos."* Moved the *"A sorcerer is shaped by what they would die saying. Choose your words."* prompt out of the conditional bottom-of-page slot and placed it permanently directly under the Personal Quote input. Restructured step 2 as a 2-col grid (left: portrait + class title + bloodmark + interactions blurb; right: name + quote + portrait URL + sex + buttons), maxWidth 340 → 640, tightened input padding 9→7 and label margins 10→8, custom-portrait label collapsed to single line — whole step now fits in one viewport without scroll. Mobile (<560px) flips back to single column. CSS in `v61 — IDENTITY STEP COMPACT 2-COL LAYOUT` block.

## v62 — World map redesign: painted biome textures + inner-border player aura

Generated 10 painted top-down biome tile textures in a single `generateImage` call: `public/biome/{plains,forest,mountain,desert,snow,swamp,coast,volcanic,void,jungle}.png` (1:1, painted fantasy atlas style — gold-green grasslands, dark emerald pines, gray-tan crags, ochre dunes, white-blue snowfields, murky reedy marsh, turquoise shoreline, basalt with lava cracks, violet void with starlit rifts, vibrant jungle canopy). New `BIOME_TX_PATH(bio)` + `BIOME_TX_BIOMES` set near `worldTileVisual`. Each non-ocean tile now layers (top-down): glow tint → ridge highlight → painted texture (`url() center/cover`) → tinted base color. Ocean keeps its handcrafted radial gradient. **Map dimensions** VW/VH 21×11 → 15×9 (~96 fewer tiles, each ~40% larger by area). Grid aspect ratio 19:11 → 15:9. Cap raised 760×460 → 820×540.

**Inner-border player aura** replaces the v48 circular ring: three-layer system that hugs the rounded square tile shape — (1) `::before` cross-axis edge glow that bleeds inward from all four sides using stacked linear-gradients with `mix-blend-mode: screen`; (2) `.player-aura-ring` becomes an animated conic-gradient sweeping along the inner border via the standard mask trick (`mask-composite: exclude`), rotating per `--aura-spd`; (3) `::after` 1px breathing inset border with a synced `box-shadow` glow (`playerInnerBorderBreath` keyframe). All three pull color from existing per-class `--aura-c1` / `--aura-c2` vars — no new class definitions needed. Removed the old phoenix/hexblade/voidmage/gravity/chrono `.player-aura-ring` overrides since the universal conic ring is now the consistent motif. Bigger player tile content: `font-size: 18px`, portrait imgs forced `100%/100% object-fit: cover` with a small drop-shadow. Added per-tile paper-grain overlay so painted PNGs read as atlas vignettes.

## v69 — Veilcourt overhaul: tabs, roster, DMs, @mentions

Removed the v65 collapsible mini-dock on the map left rail; replaced with a single `.veil-quick-open-btn` that opens the full Veilcourt directly. Header rewrite: the active-sorcerer count is now a clickable pill that opens a `chatRosterEl` modal listing every online player (portrait, class, rank, covenant, mention/DM action buttons). New tab bar in chat header: **📢 Public** (existing global feed) and **✉ Private** (DM threads). Private tab shows either a thread list (sorted by latest, with unread badge per thread) or an active thread view (back/profile/composer); a "type a sorcerer's name to start a chat" input lives at the top so you can initiate DMs without scrolling. Profile dossier modal got a gold **✉ Send DM** action and an **@ Mention** shortcut.

**@mentions**: server scans every public message for `@Name`, resolves via `playerIdByName`, attaches `mentions: [playerId]` array; client renders matching tokens as `.veil-mention` pills (gold default, crimson `is-self` when matched against `pl.name`), highlights the message row with `.is-mention-me` (left crimson rule + tinted bg), and bumps a separate `chatMentions` badge that's distinct from regular unread count. Each public message bubble now has tiny `@` and `✉` quick-action buttons in the meta row.

**Backend additions** to `artifacts/api-server/src/routes/veilcourt.ts`: `playersById` + `playerIdByName` Maps, `POST /presence` heartbeat (in-band identity refresh), `GET /roster` (online <90s window), `POST/GET /dm` (separate ring buffer of 1500), `GET /lookup?name=` for the typeahead. Same zod-validated identity schema everywhere; portraits capped at 800 chars, SVG rejected; same 1.5s rate limit.

**Polling consolidation**: one `setInterval` (3.5s open / 9s closed) calls messages + DM + presence in lockstep. DM unread tracked client-side via `chatDmReadUpTo` map persisted to `localStorage["sv_chat_dm_read"]`; auto-marked read when the matching thread is open.

## v70 — Veilcourt threads + group DMs

Backend rewrite of `artifacts/api-server/src/routes/veilcourt.ts`: replaced flat 1-on-1 DM ring buffer with a `threads: Map<UUID, VeilThread>` model. Each thread carries `participants[]` (full identity snapshot per player), `participantIds[]`, sorted `participantsKey` (for find-or-reuse), `createdAt`, `createdBy`, and `messages[]`. New endpoints: `GET /api/veilcourt/dm?pid=` returns all threads containing the caller (with messages inlined); `POST /api/veilcourt/dm/thread` find-or-creates by sorted participant key (1–8 players, dedup'd, requires self in list); `POST /api/veilcourt/dm/thread/:id/message` posts to a thread (404 if dissolved, 403 if not a member, same 1.5s/player rate limit); `POST /api/veilcourt/dm/thread/:id/leave` deletes the thread server-side for everyone (no soft-leave — leaving = dissolving, by design). Old `/dm` POST/GET endpoints removed.

Frontend (`Game.jsx`): state replaces `chatDms` + `chatDmThread` (counterpart playerId) with `chatThreads` (full thread objects) + `chatDmThreadId` (UUID); `chatDmReadUpTo` localStorage key migrated to `sv_chat_thread_read` (keyed by threadId). New helpers: `veilcourtDmFetch`, `sendDm`, `openDmThreadById`, `openOrCreateDmWith(playerId)`, `startDmByNames` (parses comma/semicolon list, parallel `playerIdByName` lookups via `/lookup`), `leaveDmThread`. Derived `dmThreads` is sorted by latest message and exposes `{ id, others[], last, unread, isGroup, label, participants }`; `lookupIdentity` walks `chatThreads.participants[]` instead of public message log.

**JSX**: thread list rows render as 2-button `.veilcourt-thread-row` (thread button + crimson leave button), with a `.veilcourt-group-pill` `GROUP` tag and group-count badge over the head portrait for multi-party threads.

## v71 — Map/HUD polish + painted POI tiles

7-part overhaul focused on the world-map screen and HUD ergonomics. Additive only — no state-shape changes.

- **POI tile art** — 10 painted full-square scenes in `public/poi/<key>.png` (town, hostile, outpost, rift, ruin, shrine, treasure, beast, den, dev). New `POI_ART_KEY` map + `poiArtUrl(type)` helper above `worldTileVisual` (~line 2881). Tile cell render layers `url(poi/<key>.png) center/cover` above the biome texture for any tile with a POI or the roaming-boss marker; emoji `cellLabel` is suppressed when art is present. Wild-beast emoji and biome decor remain as fallbacks.
- **Cohesive biomes** — regenerated all 10 biome PNGs in `public/biome/` for tighter seam-to-seam continuity.
- **Map dashboard slimmed** — removed the `mdb-seg-world` and `mdb-seg-coords` segments. A small Cinzel-gold `.map-locale-label` ("World") sits above the dashboard bar instead.
- **Coords moved to the rail tile-info card** — new `.map-rail-tile-coords` line below the tile name/type, with 📍 icon + Cinzel-gold value.
- **HUD bars relocated** — HP/MP/XP moved out of the full-width `.hud-bars-strip` into a new compact `.hud-char-bars` block stacked vertically inside `.hud-char-info`. Tag (HP/MP/XP) + 6px bar + numeric, all at 8–9px so they fit alongside the portrait without stealing room from the resource box.
- **Legend redesign** — `.legend-pill-art` replaces emoji pills with image-backed thumbnails (18px swatch from `poi/<key>.png` + Cinzel label). Same 10 categories.
- **Sound submenu tooltip** — `navBtn("music", …)` label now reads literally "sound.on" / "sound.off" per request.
- **Fish quick-button** — replaced the rail's sound quick-button (redundant with the submenu) with an inline Fish action next to HP/MP. Calls `runFishing()` when `nearOcean || onOcean` and not on cooldown; shows `Fish · 6s` countdown during CD; toasts "No water nearby" otherwise.
- **Chat input no longer pipes through to map** — the global keydown handler bails on `chatOpenRef.current` OR an active INPUT/TEXTAREA/contentEditable target.

CSS: `v71 — MAP/HUD POLISH PASS` block.

## v72 — Bloodmark tier separation + single skill interaction

- **Two clearly-different bloodmark tiers.** Class-innate bloodmarks (`CLASS_INNATES` via `buildClassBloodmarks`) now grant a passive but **0 stats** (`stat: {}`). Generic ancestral lineages (`BLOODMARKS`) give 2–3 balanced stat traits and **no passive** (the `passive`/`passiveDesc` fields were removed from each entry). The negative `hp:-10` on Void-Touched is gone — no ancestral lineage carries a downside. Skipping (no bloodmark) is still allowed.
- **Card UI auto-adapts.** `renderCard` and the Stats-page bloodmark card now branch on `bm.passiveDesc`: shows the passive box if present, otherwise a dashed "Ancestral lineage — stat traits only" plate. Stat row branches on `Object.keys(bm.stat).length` and falls back to "No stat bonus — passive only" for class-innate cards.
- **Skill interactions: 1 per run.** `createChar` now calls `pickAssignedInteractions(shuffled, 1, c.id)` (was 2). Identity-step copy reads "Only one interaction is rolled randomly each run…". Battle logic (`evaluateInteractions`, `getReadyInteractions`) iterates `pl.inter` so the smaller list is handled automatically.
- **Bloodmark step text fixed.** Header now reads "It shapes your passive abilities." The "You may skip this step" line moved from `T.dm` (which vanished into the dark step bg) to a warm `#ffd98a` italic pill with a subtle navy chip and gold border.

## v73 — HUD redesign + clickable info popups + readable buttons

Multi-part HUD/UX polish round. Deliberate, additive, no state-shape changes.

- **Painted resource icons**: 6 hand-generated PNG sigils replace flat emoji on the HUD resource tiles. Files in `public/res/{gold,frag,shard,fish,bank,loan}.png`. New `resIc(name, emoji)` inline helper renders an `<img>` with an emoji `onError` fallback. The `hud-shell-v73` class scopes new sizing (24×24 icon slot, drop-shadow), tile gradients, and per-resource border tint.
- **Char-info 2-column layout**: HP/MP/XP bars moved out from below the text rows into a right-side column (`.hud-char-info-cols { grid-template-columns: minmax(0,1fr) 128px }`). Bubble is shorter and visually balanced; bars get their own dark-navy boxed strip. Mobile (<540px) falls back to a single column.
- **Fish moved to primary row**: now sits beside SHD on the same row (gold / frag / shard / fish), no longer in the secondary row. Click opens a fullscreen popup with the species ledger (`hud-fish-ledger-popup`) instead of an inline `<details>`-style dropdown.
- **Everything is clickable for an info popup**:
  - Portrait + hero name → "A {class} of generation N, currently {stage} on day {n} of their span."
  - Class · Gen · Stage/Day → 3 separate clickable spans, each with its own popup.
  - Rank / Bloodmark / Covenant tags → full description + bonus / passive trait listing.
  - Gold / Frag / Shard / Fish / Bank / Loan tiles → lore + carried amount.
  - Spouse tile keeps its existing detail popup.
  - All clickable elements get a `.hud-clickable` class with hover brightness + text-shadow.
- **Standardised tag pills** (rank, bloodmark, covenant): `.hud-shell-v73 .hud-tag` is now a unified Cinzel uppercase 9px pill, 999px radius, color/border-color driven by the live entity's `cl`. Hover gives a glow ring matching the tag color.
- **Title text bumps**: `h1` 44→56px (mobile fallback 42px), tagline 14→17px, eyebrow 10→12px, pillar headers 11→13px, pillar descriptions 10→12px, CTA 16→19px.
- **Char-creation back buttons**: both back buttons given explicit `background: rgba(14,22,46,0.85); color: #cfd6ee; border: 1px solid rgba(212,173,64,0.45)`. Was previously `background: T.c2` (parchment) which made the white inherited button text invisible.
- **Battle Auxiliary Actions dropdowns**: each of the 4 dropdown panels (Equip Item / Draw Weapon / Swap Skill / Spellbook) tagged with `className="battle-aux-dropdown"` and inline bg replaced from `T.c1` (parchment) → `rgba(10,16,38,0.95)` + `color: #e6ecff`. CSS overrides `.battle-aux-dropdown > div[style*="cursor"]` so each row gets a navy gradient + gold border + hover glow.

CSS in `v73 — TITLE TYPOGRAPHY + HUD REDESIGN + READABLE BUTTONS` block.

## v74 — Map header + rail compass/events relocate

- **Phase chip moved inline next to "World"** — gold-bordered glass pill (icon + phase name + local clock) sits at the right end of the map heading row.
- **Compass moved into the rail, above the Veilcourt button** — `.map-rail-compass` two-line card: 🧭 nearest town and ⌖ nearest non-town POI, each with direction + Manhattan distance.
- **Events moved into the rail, below the Veilcourt button** — `.map-rail-events` shows the latest two log entries as left-bordered pills (latest highlighted gold; `EVENT|`-tagged entries get a warm orange border). Empty state reads "— quiet —".
- **Top dashboard bar removed entirely** (`.map-dashboard-bar` deleted from map JSX) — the map grid reclaims that vertical space.

Swim icon: regenerated `public/swim-icon.png` with a transparent background (no more white halo at the edges).

CSS in `v74 — MAP HEADER + RAIL COMPASS/EVENTS RELOCATE` block.

## v75 — Battle rework foundation pass 1

Player-facing rename + battle UI tidy + readiness signaling. No combat math, balance, save shape, or backend changes.

- **"Veil Expansion" → "Veilbreak"** in every player-facing string (HUD chain pill, action card sub-label, spellbook section titles + archive, codex/help text, succession/inheritance notes, notifications). Internal identifiers (`pl.ult`, `veilExpansionDetailText`, `gu_*` ids, save fields, archive keys) deliberately untouched — a deeper migration is parked for the save-versioning pass.
- **Battle tab strip cleanup** — the count badges next to "Combat Actions" and "Veil Magic" are dropped (set `ct: null`); Items still shows its tiny consumable count. The descriptor sub-spans under the section titles ("{n} equipped", "Basic actions") are removed for a cleaner header line.
- **Turn head + aux strip cleanup** — "Pick an action region." removed from the player-turn caption (enemy turn keeps "Await enemy actions."). "Loadout changes end turn" removed from the Auxiliary Actions sub-label.
- **Readiness glow** — interaction chips and Veilbreak chain segments now carry semantic class names (`.battle-ready-chip.is-ready`, `.veilbreak-chain-step.is-complete/.is-current/.is-ready`). New CSS adds soft pulsing box-shadows: complete steps get a green halo, current step pulses violet, ready state pulses gold. Same for the "primed" interaction chips beside the chain.
- **Battle log groups & line types** — round groups now classify as `log-player`, `log-enemy`, `log-effect` (for Skill Interaction / Event lines), or `log-veilbreak` (gold halo when a Veilbreak fires). Per-line content is tagged via regex: `line-miss` (italic, dim), `line-crit` (gold bold), `line-passive` (lavender), `line-status` (mint). Titles use Cinzel uppercase. Existing Copy button preserved.
- **Standardized action card typography** — all eight action buttons (strike / w2 / guard / mend / copy / ult / each Veil Magic / consumables) read at the same scale via `.battle-bg .battle-action-btn > div` rules: 11px title row, 9px detail rows desktop / 10/8px mobile. The inline `fontSize: 7` chaos is overridden cleanly without rewriting JSX.
- **TODO planning block** — a 50-line comment block was added in `Game.jsx` just above `buildGroupedBattleLog` documenting the next foundation pass for *large* arena combat (variable sizes 12x8 / 14x10 / 16x12 / irregular, terrain + destructibles, Veilbreak field overlays, Field Clash, new Field Attunement stat, range/area shapes, movement stat). Explicit note: the previous 5x3 grid sketch is superseded — future maps are large arenas.

CSS in lines following the `.battle-log-entry.log-loss` rule (new `.log-player/.log-enemy/.log-veilbreak`, `.battle-log-title`, `.battle-log-line.line-*`, `.veilbreak-chain-step.*`, `.battle-ready-chip.is-ready`, `.battle-bg .battle-action-btn > div` typography pass).

## v76 — Battle Rework Pass 2: Big Arena Foundation

Non-destructive groundwork for future tactical arena combat. The current lane-style battle remains the source of truth; this pass adds a visual prototype + future-proof data model only.

**New files**
- `artifacts/shattered-veil/src/battle/arena/arenaMaps.js` — terrain catalogue (12 types), destructible-object catalogue (7 kinds), 5 arena templates (Ruined Courtyard 12×10, Rift Crater 14×10 irregular, Moonlit Forest Hollow 12×10, Broken Shrine 10×8, Abyssal Expanse 16×12 boss arena with central canyon + bridges), `pickArenaTemplate(ctx)` selector.
- `artifacts/shattered-veil/src/battle/arena/arenaEngine.js` — pure helpers: `getArenaTemplateForBattle`, `createInitialArenaState`, `getValidTiles`, `getMovementRange` (BFS with terrain costs), `getSkillRangeTiles` (Manhattan), `getAreaShapeTiles` (single/burst/ring/line/cone), `isTileBlocked`, `getTerrainAt`, `getObjectsAt`, `assignSpawns`. Zero global state.
- `artifacts/shattered-veil/src/battle/arena/ArenaBoard.jsx` — visual grid panel: variable-size grid, irregular shape mask, terrain tints, destructible glyphs, unit tokens with HP bar, rare-tile glow, Veilbreak field overlay placeholder, hover/click tooltip, movement-range preview, mobile-tightened tile sizing.

**Modified files**
- `artifacts/shattered-veil/src/Game.jsx` — imports the new module; adds `arenaCollapsed` state; mounts `<ArenaBoard>` between `battle-info-card` and `battle-lower-grid` inside a `try/catch` so a preview failure can never crash the live battle. Includes TODO comments for the next pass (real `mv` stat, real `{x,y}` positions, active Veilbreak field hookup).
- `artifacts/shattered-veil/src/game.css` — appended `sv-arena-*` CSS block (~190 lines): dark mystical palette, terrain tints, rare-tile + Veilbreak field animations, primed-Veilbreak pulse on player tile, mobile breakpoint at 720px.
- `docs/changelog.md` — this entry.

**Foundation only / not implemented**
- Combat math, balance, status effects, save shape, character creation, world map, towns, marriage, succession, chat, and backend are all unchanged.
- Movement, skill range, AoE shapes, destructible damage, terrain bonuses, rare-tile triggers, Veilbreak field domination, Field Clash, and Field Attunement exist as data + helpers + visuals only — no rule yet reads them.
- Active Veilbreak field is intentionally `null`; player tile pulses when ult is primed.

**Validation**
- Vite HMR applied cleanly across all edits; no new console errors.
- Battle screen renders the preview; lane bar above + action card below remain fully usable.
- Crash-proof: try/catch around the mount block returns `null` on any error.
- Mobile layout: tile size clamps to 14–22px when `window.innerWidth < 720`, panel padding tightened.

**Risky areas for next pass**
- Replacing `btl.plPos` (lane 0–4) and `e.pos` (lane 3–4) with real arena `{x,y}` positions will touch the entire combat dispatcher.
- Wiring per-skill `range`/`shape` requires editing every entry in the skill catalogue.
- Veilbreak field activation needs a transient battle-state slot for `activeField` + duration ticking inside the existing turn loop.

## v77 — Battle Rework Pass 3 (Tactical Step + arena positions)

The arena layer goes from preview to live. A real `{x,y}` position is initialized for every battle unit at `startBattle`, and the player can shift across the board with a new **Tactical Step** action — without any change to lane combat, damage math, or enemy AI.

**Arena state**

- New `btl.arena` slot, populated in `startBattle`. Carries the template, terrain/object maps, shape mask, and a `units` map: `{ player: {x,y,facing}, enemies: { [id]: {x,y,facing} }, ally?, pet? }`.
- Lane positions (`btl.plPos`, `e.pos`) are deliberately **untouched** — the existing range gate, distance modifier, and enemy turn logic all keep working unchanged.
- Init is wrapped in `try/catch` and falls back to `arena: null`; the ArenaBoard mount further falls back to spawn-on-the-fly so the panel still renders if init failed.

**Movement stat**

- New helper `getUnitMoveRange({ spd, classId, isBoss, kind })` in `arenaEngine.js`. Base 3, +1 at SPD 14, +2 at SPD 19, −1 at SPD ≤ 8, capped at 2 for slow tank classes (`gravity`, `monk`, `rune`), +1 for bosses, pets get one less. Min 1.
- Displayed only inside the arena panel and on the Tactical Step card — no global stat sheet changes.

**Tactical Step**

- New combat action card "👣 Tactical Step" in the Combat Actions tab, placed right after Guard. Only renders if `btl.arena` is initialized.
- Tap once to enter movement mode → arena highlights every reachable tile (BFS, terrain costs respected, blocked tiles skipped, occupied tiles refused). Tap a glowing tile to commit. Tap the action again to cancel.
- Mirrors `bMove`'s contract: consumes the per-turn `moved` flag, **does not** end the player's main action, costs no MP, deals no damage, does not run any interaction triggers.
- Battle log: `"<name> shifted across the arena to (x,y) — <Terrain>."`. "Already moved this turn." / "Cannot reach that tile." for failures.

**ArenaBoard**

- New props `moveMode`, `onTileSelect`, `moveModeHint`. When `moveMode` is on, the grid grows a dashed outline, valid tiles glow blue and pulse, occupied tiles get a darken filter, and clicking a valid tile commits via `onTileSelect`.
- Hover tooltip behavior unchanged outside move mode.
- Mount block now reads positions from `btl.arena.units` (player + enemies by id, plus ally/pet if present), with safe fallback to spawn slots.

**CSS**

- Appended `sv-arena-tag-move`, `sv-arena-movemode-banner`, `sv-arena-grid.sv-arena-movement-mode`, `sv-arena-tile-move-valid`, `sv-arena-tile-move-selected`, `sv-arena-tile-occupied`, `sv-arena-confirm-move`, plus two keyframes (`sv-arena-tile-move-pulse`, `sv-arena-move-pulse`).

**Intentionally not yet built (TODOs left in code)**

- Enemy movement AI on the arena layer.
- Per-skill range + AoE shape enforcement.
- Destructible object damage and line-of-sight blocking.
- Splitting movement and main action into distinct phases.
- Terrain bonus triggers and Veilbreak field movement effects.
- Boss-arena specific mechanics (canyon edges, bridges).

## v78 — Battle Rework Pass 4 (Skill targeting + range/area layer)

Adds the arena targeting layer that finally connects the visual battlefield to combat actions. Strictly additive — damage math, save shape, character creation, world map, towns, succession, chat, and the backend are all untouched. The existing flow (lane positions, `actionRange`, `bAct`) keeps running unchanged; the new layer is a soft visual + click-to-aim wrapper on top.

**New file: `artifacts/shattered-veil/src/battle/arena/arenaTargeting.js`**

- Pure module — no React, no Game.jsx coupling.
- `getActionMeta({ act, skill, weapon, ult, copied, actor })` resolves any battle action to a metadata shape `{ range, shape, radius, targetType, requiresLineOfSight, canTargetObjects, terrainInteraction, needsTarget }`.
- `getSkillMeta(skill)` infers safe defaults from existing fields (`t`, `el`, `aoe`, `n`) — no skill data was rewritten in this pass. Heuristic shape sniff: `nova/ring/wave/pulse` → burst; `lance/beam/line/bolt/pierce/arrow/bullet/ray` → line; `cone/fan/gust/spray/breath/sweep/cleave` → cone. Heal/buff with `aura/mantle/hymn/aegis` lift to aura; otherwise self.
- Geometry primitives: `getTilesInRange`, `getBurstTiles`, `getLineTiles`, `getConeTiles`, `getAuraTiles`, `getGlobalTiles`.
- `hasLineOfSight(origin, target, arena)` — Bresenham raycast. A tile blocks LoS when its `objectMap` entry maps to an `OBJECTS` def with `blocksLineOfSight: true`.
- `getValidTargetTiles(caster, meta, arenaState)` — returns the click-eligible tiles for an aim, filtered by range, target type, LoS, and presence of the right unit class.
- `getAffectedTiles(caster, target, meta, arenaState)` — projects the chosen aim through the action's shape (single, burst, line, cone, aura, zone, global, self).
- `getUnitsOnAffectedTiles`, `getLosBlockedTiles`, `describeShape`, `describeTarget` for HUD use.
- Per-action defaults (when no skill metadata exists): single-target elemental skills R5 with LoS; physical strike R1 no LoS; AoE damage burst R4 radius 1 (radius 2 for ring-named skills); cone R3; line R5 with LoS; heals R4 single ally (or self-burst when AoE); self/buff/guard/mend → no aim required.

**ArenaBoard**

- New optional props `targetingMode`, `validTargetKeys`, `affectedKeys`, `losBlockedKeys`, `selectedTargetKey`, `onTargetSelect`, `onTargetHover`, `targetingHint`. Mutually compatible with Pass 3 `moveMode`.
- Tile classes added: `sv-arena-tile-target-valid`, `sv-arena-tile-target-selected`, `sv-arena-tile-area-preview`, `sv-arena-tile-out-of-range`, `sv-arena-tile-los-blocked`, `sv-arena-tile-has-object`. The grid grows `sv-arena-targeting-mode` and a `Select target` meta tag while aiming.
- Click on a valid target tile fires `onTargetSelect({x,y})`. Hover fires `onTargetHover({x,y})` so the affected-area preview updates live.

**Game.jsx wiring**

- New imports from `./battle/arena/arenaTargeting.js`. New state `arenaTargeting = { act, idx, hover } | null` (reset on `startBattle`).
- `arenaActionMetaFor(act, idx)` resolves the current action to metadata using the equipped skill list and weapon.
- `tryAimAction(act, idx, fallbackFire)` is the new click wrapper: if the arena is missing, the player has no `units.player`, or the action does not need a target, it calls `fallbackFire()` immediately (which keeps the existing `bAct` behaviour). Otherwise it opens aim mode. Clicking the same action again toggles aim off.
- `confirmArenaTarget(tile)` reads the tile, sets `btlTarget` to the enemy on that tile (when applicable), and defers `bAct` to the next tick so the target update commits first.
- Action button handlers wrapped: Veil Magic skill, Strike (w1), Off-hand (w2), and Copy now route through `tryAimAction(...)` before falling back to `bAct(...)`. Mend, Guard, Veilbreak, Tactical Step, Items, and Aux actions remain direct (self/global/no-target).
- Each Veil Magic card now carries small range/shape/target/LoS badges (`R<n>`, `Burst 2`, `Enemy`, `LoS`) computed from the metadata helper. The aimed skill card title gets a 🎯 marker while aim is active.
- Targeting visuals computed on the fly inside the ArenaBoard mount block (valid keys, affected keys, LoS blocked keys, selected key, hint string).

**CSS**

- Appended Pass 4 block: `sv-arena-tag-target`, `sv-arena-targeting-banner`, `sv-arena-grid.sv-arena-targeting-mode`, the five new tile state classes, `sv-arena-card-badges` + `.is-range/.is-shape/.is-target/.is-los`, `sv-arena-confirm-target`, `sv-arena-cancel-target`, two new keyframes (`sv-arena-target-pulse`, `sv-arena-target-tile-pulse`).
- LoS-blocked tiles paint a 45° red hash overlay; out-of-range tiles dim and desaturate; valid target tiles pulse warm-orange; affected tiles glow soft amber under the target.

**Soft enforcement & safety**

- Out-of-range / LoS-blocked tiles are visual-only — they do not click. Clicking still routes through `bAct`, which keeps the v40 lane-based range gate as the actual combat enforcement.
- Every entry point is guarded so any failure (no arena, missing skill, geometry throw) silently falls back to the existing `bAct` flow. Battle never gets stuck behind the new layer.
- All skill data is unchanged — metadata is inferred. Future passes can author explicit `range`/`shape` fields on each skill in `mkSkills` and the inference will be bypassed.

**Intentionally not yet built (TODOs in code)**

- Per-skill explicit metadata authored on each entry in `mkSkills`.
- Hard range enforcement that refuses out-of-range attacks even when targeting is cancelled.
- True enemy AI on the arena layer (movement + range selection).
- Destructible object damage resolution + `onDestroy` triggers.
- Terrain bonus triggers when a skill lands on rare terrain.
- Veilbreak field area control + Field Clash territory split.
- Movement-affecting status effects (root, knockback) integrated into targeting.
- Boss-specific arena mechanics (canyon edges, phase walls, bridges).

## v79 — Big Arena Pass 6 (terrain bonuses go live)

Pass 6 is the first round where rare terrain tiles **actually do something** in combat. All bonuses are deliberately small (5–10%) and additive on top of the existing damage/heal flow — nothing in the base damage math, save shape, character creation, world map, towns, succession, chat, or backend changed.

### New pure module

- `src/battle/arena/arenaTerrain.js` — caster-side terrain bonus catalogue + helpers. Pure data, no React. Each entry carries a flavor name (Ember Vein, Verdant Pulse, Storm Sigil, …), a tagline, log-flavor + log-result lines, the trigger gate, and a clamp-protected bonus value. Helpers: `getTerrainKeyAt`, `getTerrainBonusForUnit`, `getActiveTerrainBonusesFor`, `describeActionFromSkill/Strike`, `applyTerrainBonusPreview`, `applyTerrainBonusToAction`, `clampBonusValue`, `describeTerrainBonus`.

### Bonus catalogue (all caster-side this pass)

- **Ember Vein** (scorched) — Fire skills +8% damage.
- **Verdant Pulse** (forest) — Heal/support skills +8% healing.
- **Stillwater Mirror** (water) — Lightning skills +6% damage.
- **Runed Flagstone** (stone) — Earth/Metal skills +6% damage.
- **Moonlit Crest** (highGround) — Ranged (range ≥ 4) skills +5% damage.
- **Broken Veil Font** (brokenVeil) — Veil Magic chain +1 step on cast (capped at full chain).
- **Hallowed Ring** (hallowed) — Heal/support skills +8% healing.
- **Shadowed Seal** (shadowed) — Dark/Void/Curse skills +8% damage.
- **Storm Sigil** (stormcharged) — Lightning/Sound skills +6% crit chance (independent roll, stacks softly with luck crit).
- **Bloodstone Scar** (bloodstone) — Physical strikes +8% damage but caster pays 2 HP (clamped — never kills self).
- **Gravity Well** (gravityWell) — tooltip-only this pass; movement reluctance already enforced upstream.

### Wired into `bAct`

- Terrain key for the caster's tile is read once per action, with a `_terrainBonusLogged` guard so AoE skills only log the trigger flavor + mechanical line once.
- Sites touched: weapon strike (after luck crit), skill damage `base` (post crit roll), skill heal `h` (post devotion), Mend's regen-per-turn `regenEf.v`, and the Veilbreak chain progress block (Broken Veil Font extra step).
- All bonus values pass through `clampBonusValue` (per-type clamps: dmg/heal 0.85–1.20, crit add ≤ 12%, veil extra 0–1, hp cost 0–8) so future data tweaks can't accidentally break combat.
- Defeated/missing units, missing arena state, and missing player position all early-out cleanly.

### Visuals & readability

- **Action-card hint** — Veil Magic skill cards now show a gold "✦ <flavor>" badge when the player's current tile would buff that skill. Fully guarded — no badge if no arena, no terrain, or no match.
- **Tooltip polish** — `ArenaBoard` tooltip drops the "Future bonus:" prefix (bonuses are real now). Each rare-tile `bonusHint` in `arenaMaps.js` now reads as a self-contained line: flavor name + concrete effect.
- **CSS** — new `.sv-arena-card-badge.is-terrain` (gold pulse), promoted `.sv-arena-tooltip-bonus` (gold left-rule), and `.sv-arena-tile-rare-bonus::after` glow hook for tiles with implemented bonuses.

### Future work (queued, not built)

- Enemy AI seeking terrain advantage tiles.
- Boss-specific arenas with scripted rare tiles.
- Veilbreak ult activation creating temporary terrain zones.
- Field Clash splitting arena terrain by ownership.
- Full class-affinity matrix per class (currently coarse buckets).
- Element-reaction matrix (Fire+Water synergies, etc.).
- Status-effect interactions on rare tiles (e.g. Bloodstone amplifies Bleed).
- Destructible-object → terrain transitions (e.g. shattered Pillar leaves Bloodstone).
- Codex / tutorial page documenting all terrain bonuses.

## v80 — Battle Rework Pass 7: Unordered Veilbreak Requirements + Field Foundation

Reworks Veilbreak charging from a strict ordered combo into 2/3/4 unordered conditions that don't reset on unrelated actions. Adds the foundation for active battlefield "fields" that linger after a Veilbreak is cast, with end-of-round ticks and an arena overlay. Field Clash and Field Attunement are intentionally deferred to Pass 8.

### Player-facing

- **Unordered Veilbreak conditions.** Each Veilbreak now lists 2 (chain ≤ 4), 3 (chain = 5), or 4 (chain ≥ 6) requirements such as "Cast a Fire skill", "Deal 60+ damage in one action", "Apply a status to an enemy", "Use a Tactical Step", or "Guard". Conditions can be completed in any order and **stay completed** until you cast the Veilbreak — unrelated moves no longer wipe progress.
- **Active fields.** Casting a Veilbreak instantiates a battlefield field (e.g. Ember Pyre, Verdant Bloom, Tide Surge, Voidscar) tinted by the ult's element. Each field lasts 2–3 turns, ticks once per player action with a flavor effect (recurring DoT/HoT/buff) and shows up as a glowing arena overlay + a top-of-action banner with remaining turns.
- **HUD.** Battle info strip and spellbook both show requirement chips with check marks, replacing the old `→ → →` chain. The arena board glows in the field's element tint while the field is active.
- **Tactical Step counts.** Moving on the arena board now satisfies the `Use a Tactical Step` condition without ending the turn or affecting other progress.

### Architecture

- **New module** — `artifacts/shattered-veil/src/battle/arena/veilbreakChain.js`. Pure, testable. Exports:
  - `VB_REQ_TYPES` — registry of requirement types (icon + matcher fn).
  - `buildRequirementsForUlt(ult)` — deterministic per-ult selection (id-seeded, count derived from `ult.chain`).
  - `buildFieldForUlt(ult)` — element → theme/recurring-effect mapping, returns the field template (name, description, theme, intensity, duration, recurring effect spec).
  - `evaluateRequirementMatch(req, ctx)` / `applyActionToRequirements(reqs, ctx, round)` — unordered evaluator; returns `{reqs, anyChange, newlyFulfilled}`.
  - `isReadyFromRequirements`, `summarizeRequirements`, `ensureBattleVeilbreakState`, `instantiateActiveField`, `tickActiveField`, `describeFieldRecurring`.
- **`btl.veilbreak`** — transient battle state `{ ultId, requirements:[...] }`. Each requirement carries `{id, type, label, description, fulfilled, fulfilledAtRound, params}`.
- **`btl.activeField`** — transient `{ fieldName, fieldDescription, owner, visualTheme, intensity, elementTags, duration, remainingTurns, recurringEffect, appliedAtTn }`.
- **Save shape unchanged.** `pl.ult.chain` / `pl.ult.combo` are preserved untouched. `btl.chainProg` is now derived (= count of fulfilled requirements) so any older read sites still see a sensible number.
- **Action ctx capture (`Game.jsx` bAct).** Snapshot HP & log length at action start, then derive `castElement / skillType / dealtDamage / defeatedEnemy / spentHP / appliedStatuses / wasCrit / terrainKey / usedTerrainBonus` after the action resolves and feed it to `applyActionToRequirements`.
- **Field tick.** End of every player action: tick the field (if not the activation action), apply recurring effect, decrement `remainingTurns`, log per-turn flavor + remaining count, fade when 0. Guarded with `appliedAtTn` to prevent React-strict double ticks.
- **`bTacticalStep` hook.** Credits `useTacticalAction` independently of the chain-eval path so movement doesn't end the turn or roll the field.
- **`ArenaBoard`** — wrapper now appends `sv-arena-field-active sv-arena-field-<theme>` (radial overlay tint + box-shadow pulse) and `sv-veilbreak-ready` (gold halo when primed without a field). Field tag shows remaining turns inline.
- **CSS** — `.veilbreak-req-chip`, `.veilbreak-req-step` (+ `is-complete` / `is-ready`), `.sv-veilbreak-field-banner` with per-element variants, arena overlay variants per theme (fire/nature/shadow/light/storm/void/water/earth), keyframes for ready-pulse and field-pulse.

### Out of scope (deferred to Pass 8)

- Field Clash (overlapping enemy + player fields negotiate per-tile dominance).
- Field Attunement (passive/perk that lets specific classes interact with friendly fields, e.g. tile-tagged buffs, pull tiles into terrain bonuses).
- Per-skill `range` overrides on requirement matching.
- WebSocket Veilcourt upgrade.

### Notes / gotchas

- `Game.jsx` is now ~8900 lines — Babel deopt warning is normal; HMR is slow but clean.
- Requirement evaluator is wrapped in try/catch — combat never crashes if a requirement matcher throws.
- Field tick uses `appliedAtTn` keyed to the post-action turn number; do **not** tick on the same turn the field was instantiated, otherwise duration would be 1 short.
- `pl.ult.combo` is intentionally NOT removed — keeping save back-compat means players migrating from v79 still load cleanly.

## v81 — Battle Rework Pass 8: Field Attunement, Field Clash & Tactical Actions

Pass 8 closes the field-vs-field loop opened in Pass 7. The battle screen now
exposes a real **Field Attunement** stat, full **Field Clash** resolution
(domination / split / fracture / backlash / collapse), and four anti-field
**Tactical Actions** the player can weave between strikes and Veilbreaks.

### Field Attunement (derived stat)
- Formula: `MAG × 0.6 + LCK × 0.3 + level × 0.5`, plus contextual bonuses for
  heavy-intensity fields, rare/broken-veil terrain, the Veil Anchor buff, and
  matching elements. Clamped to `[1, 999]`, displayed to one decimal.
- Lives in `getFieldAttunement(unit, ctx)` inside `veilbreakChain.js` — pure,
  defensive (missing stats default to safe values), never throws.
- Surfaced as a compact pill row beside the Veilbreak banner in the battle
  info-strip (also shows the enemy's attunement when an enemy field is up).

### Field Clash (5 outcomes)
- `resolveFieldClash(incoming, existing, attIn, attEx)` returns
  `{outcome, winner, loser, intensity, log[], aftermath}`.
- Outcome thresholds (with ±3 variance and a 5% "mutual collapse" wildcard):
  - **Domination** (`|diff| ≥ 10`) — winner replaces the loser; +1 duration.
  - **Split Field** (`|diff| ≥ 5`) — both fields persist for ~3 turns;
    arena tiles paint with two competing themes.
  - **Fracture** (`|diff| < 5`) — both fields shave duration; sparse
    fractured tiles flicker across the grid.
  - **Backlash** (`diff ≤ -10`) — incoming caster takes a small HP/MP recoil
    and the failed field never instantiates.
  - **Collapse** (5% chance) — both fields shatter; tiles fracture briefly.
- Triggered automatically when a player Veilbreak is cast while an enemy
  field is on the arena. Same-owner re-cast still refreshes (no clash).
- Aftermath state lives on `btl.fieldClash` (transient, ticks down each
  player action via `tickFieldClash`).

### Anti-field Tactical Actions
Routed through new `bAct` branches (no save shape changes; everything lives
on `btl.tacticalBuffs`). Each ends the player turn and credits the
`useTacticalAction` Veilbreak requirement.
- **⚓ Veil Anchor** (6 MP) — +6 Field Attunement and +1 duration on the
  next field/clash. Consumed on activation/clash.
- **✂ Field Sever** (8 MP) — trims an enemy field's remaining duration by 1.
  Disabled when no enemy field is present.
- **🛡 Brace Against Field** (2 MP) — flags the next round as braced;
  surfaced in the log when an enemy field would tick.
- **🩸 Overchannel I** (8 HP) — the next damaging Veil Magic skill OR
  Veilbreak deals ×1.5. Consumed once. Floor at 1 HP — never lethal.

### Enemy field placeholders
Real enemy/boss field activation arrives in a later pass. To exercise the
clash loop today, a training-only **"Test: Spawn Enemy Field"** action is
exposed under the new Tactical tab (gated by `btl.type === "train"`).
`instantiatePlaceholderEnemyField` produces a safe, dramatic field record
matching the shape of a player Veilbreak field.

### UI
- New **Tactical** battle tab (⚓) sits alongside Combat / Veil Magic / Items.
  Tab badge dot when any tactical buff is currently primed.
- Field Attunement pill strip + enemy field banner + Field Clash banner
  (5 themed variants) all stack neatly under the Veilbreak banner.
- `ArenaBoard` accepts new `enemyField` and `fieldClash` props and renders:
  arena-root glow per outcome, "split-field" alternating tile shading
  (A/B chequer using each side's theme), and sparse fractured-tile flicker.

### Files touched
- `artifacts/shattered-veil/src/battle/arena/veilbreakChain.js` — new pure
  helpers + `TACTICAL_ACTIONS` catalogue (~270 new lines).
- `artifacts/shattered-veil/src/Game.jsx` — imports, bAct branches, ult
  clash detection, Overchannel hooks, enemy-field tick + clash decay,
  preview state, info-strip Attunement pills, Tactical tab.
- `artifacts/shattered-veil/src/battle/arena/ArenaBoard.jsx` — `enemyField`
  + `fieldClash` props, banner tags, split/fracture tile classes.
- `artifacts/shattered-veil/src/game.css` — Pass 8 styles (~140 lines).

### Out of scope (future passes)
- Real boss/enemy field activation AI, per-class field affinity tables,
  fractured-tile gameplay (per-tile DoT + Veil Magic gain), Overchannel II/III,
  per-rare-terrain interactions, brace mechanical effect on enemy field DoT.

## v82 — Pass 9: Steady Strike, Flurry Strike, Veilflare Impact, Tactical kit cleanup

Goal: give the player satisfying baseline combat options when MP, cooldowns,
or Veil Magic are limited; add the original Veilflare perfect-impact mechanic;
finalize the Tactical tab from Pass 8.

### Steady Strike (`steady`)
- Free, reliable basic attack — 0 MP, 0 Veil Magic, range 1, single-target.
- Damage ≈ `ATK × 0.6 - DEF × 0.28`, modest vs class skills.
- Rolls one crit (shared helper) and one Veilflare Impact check (15%).

### Flurry Strike (`flurry`)
- 0 MP multi-hit; rolls 2–6 hits via `2 + floor(rand × 5)`.
- Damage per hit ≈ `ATK × 0.3 - DEF × 0.18`, crit per hit.
- One Veilflare Impact roll for the whole action (applied to last landed hit).
- Loop breaks when target falls — no log spam, no negative damage.

### Veilflare Impact (the original "perfect-impact" mechanic — NOT "Black Flash")
- 15% per Steady or per Flurry action (fixed for now). +50% bonus damage.
- Applies / refreshes Veilflare Focus on the player.
- Dramatic two-line battle log: "The strike landed at the exact fracture-point
  of the Veil." → "Veilflare Impact erupted through the battlefield (+50% damage)."
- Single trigger per action — guarded by `_vfState.triggered`.

### Veilflare Focus (battle buff)
- Stored as a `np.efx` entry: `{ id:"veilflare_focus", nm, ic:"✦", type:"buff",
  dur:3, tl:3, justApplied }` — battle-only, cleaned with the rest of `efx`
  on victory. **No save shape change.**
- Effects: +10% crit (helper), +Field Attunement (auto via existing efx-buff
  attunement code path), +20% next damaging Veil Magic OR Veilbreak (consumed
  once in either path).
- Refreshes on Veilflare Impact and on Focus Breath; never stacks.

### Tactical tab — final layout (7 actions, all wired)
| Action | Cost | Effect |
|---|---|---|
| Veil Anchor | 6 MP | +6 Field Attunement & +1 dur on next clash. |
| Field Sever | 8 MP | -1 enemy-field duration (gated on enemy field). |
| Brace Against Field | 2 MP | Halves incoming field tick next round. |
| Overchannel I | 8 HP | ×1.5 next Veil Magic / Veilbreak. |
| Overchannel II | 16 HP | ×2.0 next Veil Magic / Veilbreak. |
| Overchannel III | 28 HP | ×2.5 next; **gated to >50% HP**. Card carries `sv-action-card-risk`. |
| Focus Breath | 3 MP | Apply Veilflare Focus (2 turns). |

- All Overchannel tiers share the same `tacticalBuffs.overchannelMult` slot
  (one active at a time — UI shows "Already active" if you try to stack).
- All Overchannel branches share one `bAct` body (`tact_overchannel` |
  `_2` | `_3`) reading `mult` + `hpCost` from the catalogue.
- Cannot reduce the player below 1 HP (`np.chp = max(1, ...)`).

### Crit helpers (temporary — full rebalance deferred to Pass 10)
- `getCritChance()` — `clamp(0, 0.6, 0.05 + LCK×0.012 + armorCritChance + (Veilflare Focus ? 0.10 : 0))`.
- `getCritDamageMultiplier()` — `1.5 + armorCritDmgBoost`.
- `rollCrit()` — single per-call probability test.
- Lives inline in `bAct` so it shares the per-call armor crit values already
  computed at line ~4934. No global state.

### Range / arena targeting
- `actionRange("steady"/"flurry")` returns 1; range gate now blocks both with
  the existing "Out of range — move closer..." message.
- `arenaTargeting.getActionMeta` routes `steady`/`flurry` through `getStrikeMeta`,
  so the existing aim/target overlay works unchanged.

### UI / CSS
- Two new combat cards in the Combat tab (Steady Strike / Flurry Strike) sit
  right after the weapon cards; the existing weapon-strike card remains.
- Cards add `sv-action-card-veilflare-ready` glow + pulse when Veilflare Focus
  is active on the player.
- Tactical cards now carry `sv-action-card-overchannel`,
  `sv-action-card-focus`, `sv-action-card-field-control`,
  `sv-action-card-risk`, `sv-action-card-disabled-reason`.

### Save shape
- Unchanged. Veilflare Focus rides on `np.efx` (battle-transient — cleared on
  victory just like every other efx). Tactical buffs ride on `btl.tacticalBuffs`
  which `saveGame` already does not serialize.

### Files touched
- `artifacts/shattered-veil/src/battle/arena/veilbreakChain.js` —
  `TACTICAL_ACTIONS` extended with overchannel_2 / overchannel_3 / focus_breath
  + new metadata fields (`overchannelMult`, `risk`, `requiresHpAbovePct`,
  `grantsVeilflareFocus`) + Pass 10 TODO list.
- `artifacts/shattered-veil/src/battle/arena/arenaTargeting.js` —
  `getActionMeta` recognizes `steady` / `flurry`.
- `artifacts/shattered-veil/src/Game.jsx` — crit + Veilflare helpers,
  `bAct` branches for `steady` / `flurry` / `tact_overchannel_2` /
  `tact_overchannel_3` / `tact_focus`, range-gate extension, Veil Magic
  & Veilbreak Focus boost, tactical UI mapping update, two new combat cards.
- `artifacts/shattered-veil/src/game.css` — Pass 9 card styles
  (~70 lines, glow + pulse keyframes + tactical category colors).

### Out of scope (future passes)
- Full action economy split (movement / action / minor action) — Focus Breath
  still consumes the player's main action.
- Full crit stat rebalance (gear/passive crit rework, Monk crit specialization).
- Flurry scaling with speed / crit stats.
- Enemy use of tactical actions; boss counters to Overchannel.
- Tactical cooldowns; full status-effect cleanup; manual/tutorial updates.
