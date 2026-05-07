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

First real multiplayer-aware system. Lore framing: a shared scrying basin where sorcerers commune across the rift — accessible **anywhere** (not gated to towns like NinjaRPG's Tavern). Persistent messaging via the api-server, no auth required.

### Backend (`artifacts/api-server/src/routes/veilcourt.ts`)

- `GET  /api/veilcourt/messages?since=<id>` — returns `{ messages, latestId, online }` for messages newer than `since`. Last 100 only.
- `POST /api/veilcourt/messages` — accepts `{ playerId, name, text, classId, className, classColor, sex, portrait, rank, bloodmark, covenant }` validated by zod. Sanitizes control chars, enforces 280 char text / 24 char name caps.
- **In-memory ring buffer** of last 200 messages. No DB yet — wipes on server restart. Easy upgrade path to drizzle/postgres when persistence matters.
- **Rate limit**: 1.5s between sends per `playerId`. Returns 429 with friendly error.
- **Online count**: tracked via `lastSendByPlayer` Map; pruned to entries newer than 30 min when it grows beyond 500.
- Seeded with one welcome system message on startup ("The scrying basin stirs…").
- `zod` added as runtime dep (`catalog:` version).

### Frontend (`artifacts/shattered-veil/src/Game.jsx`)

- **HUD button** `💬` appended to `.hud-quick-nav` (~line 5977). Navy gradient with gold border. Shows red animated `.hud-veilcourt-badge` with unread count when chat is closed.
- **Stable identity**: `veilcourtId` stored in `localStorage["sv_chat_id"]` — survives deaths, successions, and character swaps so other players consistently recognize you.
- **State**: `chatOpen`, `chatMsgs`, `chatLatestId`, `chatDraft`, `chatStatus`, `chatOnline`, `chatUnread` + refs (`chatLogRef`, `chatPollRef`, `chatLastIdRef`).
- **Polling**: 8s when modal closed (passive unread badge), 3s when open (live feel). Stops on title/create screens. Silent-fails when offline (game stays playable).
- **Send payload** packs the player's name, class id/name/color, sex, portrait URL (custom if set, else `classPortraitUrl(cid, sex)`), rank, bloodmark, covenant — so other clients render the full identity card without a profile lookup.
- **Modal** (`.veilcourt-modal`) — fixed-position 560×720 max card with three regions:
  - **Header** with the 🜂 sigil, "The Veilcourt" Cinzel title, online count, gold-to-crimson hairline divider.
  - **Log** — flex column of `.veilcourt-msg`. Each message renders a **56×56 portrait** (the user's actual class png with female/male variant + `_f` fallback chain, or custom portrait if they set one) next to a parchment-on-navy bubble with class-colored author name, class tag, rank tag, covenant tag (gold), bloodmark tag (violet). Own messages flip to row-reverse for chat-app feel. System messages get a warm amber bubble + italic text.
  - **Composer** — own portrait + name/class line at top (so the player sees how others see them), then input + gold "Send" button. Status row shows char count, send errors, and the Enter-to-send hint.
- **Render integration**: `chatEl` JSX added next to every `{popupEl}` mount (5 sites: shell, map, battle viewport, outpost/rift, town) via a single sed pass.

### Why "The Veilcourt" (not Tavern)

NinjaRPG's Tavern locks chat to physical village locations, which forces immersion-breaking travel just to talk. The Veilcourt is **always-on** because in-fiction it's a magical broadcast (the veil itself), not a building. This also keeps the game pleasant for players in solo dungeons / rifts who want to chat between fights. Lore hook for future: covenant-only sub-channels, whisper, and a higher-tier "Domain" channel only Wardens+ can speak in.

### Future (not built yet)

- DB persistence (drizzle + postgres) — current ring buffer is fine for low-traffic launch, swap when sessions need to outlive deploys.
- Optional moderation queue / report flag on each message.
- Per-covenant private channels (the data model already carries `covenant`).
- WebSocket upgrade — polling is honest for now (3s feels alive without a socket layer).

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

## v44 — Critical hits (luck-based)

Player damage actions can now critically hit, dealing **×1.5 damage** with a dedicated audio cue. Crit chance scales off the player's `lck` stat: `min(0.25, lck × 0.012)` — capped at 25%, so a level-1 character with 8 lck has ~9.6% crit, and a high-lck endgame build (~20+ lck) reaches the cap.

- **Wired into three damage paths**:
  - `attackWithWeapon` (strike / w2) — single d3 multiplier applied before the multi-hit loop, so all hits in that swing crit together.
  - `skill` damage branch — one roll per cast, multiplier applied to `base` so AoE targets all crit on the same roll (avoids spammy SFX).
  - `copy` damage branch — same single-roll pattern.
- **Skipped on purpose**: ult (already a power-fantasy moment), heal skills (no analog), and the gambler class's existing gamble multiplier (separate identity, would double-roll).
- **Stacks with the existing armor crit** (`armorCritChance` from gear). A swing can be both an armor-precision critical (×1.28) and a luck crit (×1.5), making lucky players in good gear genuinely terrifying.
- **Audio**: new `crit` SFX in `music.js` — sharp high-pitch square stab (1760 → 880 Hz) layered with a high-passed noise crack. Sits on top of the regular `hit` cue without muddying it.
- **Log line**: `💥 Critical hit! ×1.5` via `logInfo` so it visually pops in the battle log alongside other status info.

Future hooks: enemy crits (mirror the same formula on the enemy turn), crit damage modifier from gear/passives (`critDamage` field), crit-on-status passives (Phoenix's burning targets always crit, etc).

## v42 — Enemy AI movement + boss-variant battle music

### Enemy AI movement (closes the v40 positional-combat loop)

v40 gave the player real lane-based mechanics; v42 makes enemies use the same system. Each enemy makes a free movement decision before its action, based on the skill it just chose:

- **Melee enemies** (no element / `Null` element on the chosen skill) prefer distance 1. If they're at distance > 2 and standing on lane 4 (Backline), they step forward to lane 3 (Skirmish). Logged: "👣 X advances to the front line."
- **Ranged enemies** (any non-Null element on the chosen skill) prefer distance ≥ 3. If they're already at distance < 2 and standing on lane 3, they fall back to lane 4. Logged: "👣 X falls back to keep distance."
- **Support skills** never trigger movement (the enemy is buffing itself, position doesn't matter).
- **Symmetric distance damage modifier** mirrors the player's: melee at distance 1 → ×1.10 (point-blank), ranged at distance ≥ 3 → ×1.12 (long-shot). Multiplied directly into `ed` (enemy damage) for both `sk.pow` and basic-attack branches.
- Movement happens regardless of target (player/pet/ally), but the distance bonus only applies meaningfully to player-targeted hits since pet/ally don't have lanes (their damage is multiplied by 0.7 in a separate branch and never reads `enemyDistMult`).

Enemies still don't cross to the player's side (lanes 0-2) and can only shift one lane per turn — keeps the system readable for the player and prevents AI thrashing. Lane bar UI auto-reflects the new positions because it already reads `e.pos` from each enemy.

Implementation lives entirely inside the existing enemy `forEach` (~line 5235 in `Game.jsx`) — no new state, no new effects.

### Boss-variant battle music

Added a 5th procedural track `boss` to `music.js`:

- **158 BPM, E natural minor, Em - Bm - C - D progression.** Aggressive 16th-feel square lead with the same chord-tone arpeggio shape as the wild battle track but pitched darker and faster. Sawtooth counter-melody at -9 cents detune for extra grit, pounding 8th-note triangle bass that emphasizes root + octave-up + fifth (instead of the wild track's root+fifth pattern), kick on every beat.
- `BOSS_BATTLE_TYPES = new Set(["boss", "fieldboss", "rift", "outpost"])` — these encounter types route to the boss track.
- `trackForScreen(scr, opts = {})` now takes an options object: `{ battleType }`. Wild/beast/duel/pvp/train still get the standard battle loop; boss-tier encounters get the heavier track.
- `Game.jsx` passes `{ battleType: btl?.type }` at all three callsites (unlock effect, scr-change effect, mute toggle). The scr-change effect's deps array now includes `btl?.type` so the music swaps mid-battle if the encounter type ever changes.
- Required hoisting `const [btl, setBtl] = useState(null)` above the music hooks (~line 3029) so `btl?.type` is in lexical scope when the deps arrays evaluate. The original declaration at line 3063 was removed.

### Future positional-combat hooks

- Enemy lane-1 (cross-side) charge attack — strong skill that lets a boss step into the player's Front lane for one big hit, then retreats. Easy to add as a special skill flag.
- Player "back-step" interrupt — a defensive option that triggers when a melee enemy tries to advance.
- Per-skill range overrides — `sk.range` field on enemy skills (and player skills) for finer-grained control than the current el-based heuristic.

## v41 — Background music (Chrono Trigger flavor)

Procedural chiptune-style music engine. **No external assets, no licensing concerns** — entirely synthesized via the Web Audio API at runtime. Four hand-written looping tracks (title, travel, battle, town), each in the SNES JRPG mold.

### `artifacts/shattered-veil/src/music.js`

Self-contained module exporting `createMusicPlayer()` and `trackForScreen(scr)`.

- **Note frequency table** — equal-tempered A4=440 from C2 to C6, including all sharps used by the four tracks.
- **`scheduleNote(ctx, dest, type, freq, detune, startT, dur, peakGain)`** — schedules one oscillator note with a soft chiptune ADSR (12 ms attack, gentle decay, ramp-down release). Used by every melodic part.
- **`scheduleKick(ctx, dest, startT, peakGain)`** — pitched-down sine sweep (140 Hz → 45 Hz over 100 ms) for the battle track's kick drum.
- **Track data** — each track is `{ bpm, bars, instruments[], drumPattern? }`. Each instrument is `{ type, gain, detune, pattern }` where pattern is `[["NOTE", beats], ...]`. `null` notes = rests. Lead uses `square` (bright NES-ish), counter-melody/pads use `sine` or `sawtooth`, bass uses `triangle` (soft, SNES-ish).
- **`createMusicPlayer()`** returns `{ play(track), stop(), setMuted(m), isMuted(), currentTrack() }`.
  - Lazy-creates AudioContext on first `play()` (browser autoplay rules).
  - Schedules one full loop ahead, then re-arms via `setTimeout` 300 ms before loop end. Smooth seamless looping.
  - Mute persists in `localStorage["sv_music_muted"]`.
  - `play(null)` is a no-op so transitional screens (stats, equip, story) don't interrupt music.
- **`trackForScreen(scr)`** maps: `title`/`create` → title, `battle` → battle, `town` → town, `map`/`submap` → travel, anything else → `null` (keeps current track).

### Track design (Chrono Trigger nods)

- **Title (70 BPM, A minor)** — slow Aeolian progression `Am - F - G - Em` over 8 bars. Triangle lead with sustained 2-beat notes, sine pad on chord 3rd/5th, triangle bass alternating root/fifth. Atmospheric & contemplative — kin to "Schala's Theme" / the Chrono Trigger main intro.
- **Travel (116 BPM, C major)** — bright `C - G - Am - F` (the eternal classic). Square lead with 8th-note arpeggios + a held melodic phrase per bar, walking triangle bass on quarters. Hopeful adventure — "Wind Scene" energy.
- **Battle (144 BPM, E minor)** — driving `Em - C - D - B7`. Square lead with rhythmic 8ths and a longer phrase per 2-bar chord, sawtooth counter-melody at -7 cents detune for grit, pulsing 8th-note triangle bass alternating root + fifth + octave-up, and a kick on every beat. Tense but climbable.
- **Town (92 BPM, F major)** — warm `F - C - G - Am`. Triangle lead with a lilting melodic phrase per chord, sine pad, triangle bass arpeggiating root → fifth → octave → third. Cozy & inviting — "Peaceful Days" feel.

### Game.jsx integration

- Single `useRef(createMusicPlayer())` lives at the top of `Game()` (~line 3024).
- Two `useEffect`s: one registers a one-shot `pointerdown`/`keydown` listener that resumes the AudioContext on first user interaction; another swaps tracks whenever `scr` changes.
- HUD gets a `🎵`/`🔇` toggle next to the Veilcourt button (~line 6079). Mute persists across sessions.
- Audio is gated behind first user gesture per browser autoplay policy — title music begins the moment the user clicks anywhere on the title screen (which they will, to enter the rift).

### Future

- Per-encounter battle variant (boss vs wild) — easy: add `boss` track and route via `btl.type` in `trackForScreen`.
- Volume slider in the menu sub-panel — engine already exposes a `volume` constant and ramps cleanly.
- Custom track for the Veilcourt modal (mystic ambient pad).
- Layered intensity (e.g. add a tom layer when player HP < 30%) — the scheduling model supports stacking instruments mid-loop.

## v40 — Positional combat + viewport fit

Two big asks landed in one pass:

### Positional combat (battle)

Builds on v31's visual lane bar — now real tactical mechanics. Lanes 0-2 are the player/ally side (Vanguard / Front / Mid), 3-4 are the enemy side (Skirmish / Backline). Player default `pos = 1` (Front), pet drops on Vanguard, ally lands behind. Enemies seed at `pos: 3` (first 2) and `pos: 4` (rest) in `startBattle` (~line 4348).

- **Battle state** carries `plPos` and `moved` (one free move per turn). Reset to `false` whenever turn flips back to player — handled in `previewBattleState` (~line 5083) + the timer-skip setBtl (~line 3544).
- **`actionRange(act, idx)` helper** (~line 4374) returns 1 for melee (plain weapon strike, Null-element physical skill) or 4 for any ranged/elemental/AoE/copy/ult/heal/buff. Auto-derived from existing skill data — no per-skill annotation needed.
- **`bMove(toLane)` helper** (~line 4391) — repositions the player to lanes 0-2, sets `moved: true`, doesn't end turn.
- **Range gate** in `bAct` (~line 4406): if a melee strike/w2/skill is selected with distance > range, log "Out of range — move closer or use a ranged ability." and abort. Copy + ult are never gated (story/forbidden magic always reaches).
- **Distance damage modifier** (~line 4420) multiplies `encounterProfile.playerDamage` once at the top of bAct: `+10%` point-blank when range 1 + distance 1 ("Point-blank" log line), `+12%` long-shot when range ≥ 4 + distance ≥ 3 ("Long-shot" log line). Cleanly threads through every existing damage path because they all read from `encounterProfile.playerDamage`.
- **Lane bar UI** (~line 6838) now uses real `plPos` + foe `pos`. Allied lanes 0-2 are clickable to move when `!btl.moved`; foe tokens click to set target. Player-current lane gets a cyan glow (`.lane-player-here`); clickable lanes get a gold hover lift (`.battle-lane-tile.lane-clickable`).
- **`.battle-range-readout` strip** below the lane bar shows current lane, target name + distance, contextual point-blank/long-shot bonus chips, and move-availability status.

**Scope honest:** enemies don't move and are always treated as in-range for their own attacks. Adding enemy AI movement is the next focused round — current change touches only the player turn so the existing combat flow is unaffected.

### Fit-to-viewport pass

Goal: every screen fits 100dvh with no page-level scrolling. Achieved via a single appended CSS block (`v40 — POSITIONAL COMBAT + VIEWPORT FIT PASS` at end of `game.css`, ~line 1782+):

- `html, body, #root { overflow: hidden }` + `.pg { height: 100dvh; max-height: 100dvh; overflow: hidden }`.
- All wrapper variants (`.shell-bg .wr`, `.town-bg .wr`, `.map-bg .wr`, `.outpost-bg .wr`, `.rift-bg .wr`) become flex-column, viewport-locked containers. Their child `.cd.page-panel` is the internal scroller (`flex: 1; overflow-y: auto; min-height: 0`).
- `.battle-bg .wr.battle-viewport` switches from `min-height: 100vh` to `height: 100dvh` — battle log, action card, lane bar all share the screen via flex sizing.
- Town `.svc-grid` tightened to `minmax(72px, 1fr)` columns + smaller padding/icon so all 12+ services fit without scrolling.
- `.title-bg .wr / .create-bg .wr` keep `overflow-y: auto` as a fallback so character creation still works on tiny viewports.
- `@media (max-height: 720px)` compresses battle padding/lane height further for laptops.

### Future PvP hook for positional combat

The new `pos`, `plPos`, `moved`, and `actionRange` are all serializable + deterministic — drop them into the eventual server payload `{ class, stats, skills, bloodmark, pos, plPos }` and the existing battle engine becomes PvP-ready without further refactor.

## v43 — Combat SFX + audio settings panel

Procedural sound-effect bank built into the same `music.js` engine — single AudioContext, separate `sfxGain` node so music and SFX have independent volume + mute. All cues synthesized at runtime (zero assets):

- **Bank**: `hit` (filtered noise burst), `heal` (sine bell dyad), `levelup` (C-E-G-C square arpeggio fanfare), `victory` (held C-E-G triangle triad), `defeat` (descending sawtooth A3→A2), `menu` (short square click), `cast` (rising sine sweep).
- **API additions on `createMusicPlayer()`**: `playSfx(name)`, `setSfxMuted(m)`, `isSfxMuted()`, `setMusicVolume(v)`, `setSfxVolume(v)`, `getMusicVolume()`, `getSfxVolume()`. All persistence via `localStorage` (`sv_sfx_muted`, `sv_music_vol`, `sv_sfx_vol`).
- **Per-action wiring in `bAct` and the enemy turn** — every action now has audio feedback. All calls wrapped in `try/catch` so audio failures never break gameplay:
  - `strike` / `w2` weapon attacks → `hit`
  - `guard` → `menu` blip
  - `mend` → `heal`
  - `skill` → `heal` if `t === "heal"|"support"`, otherwise `cast`
  - `copy` and `ult` → `cast`
  - Enemy attack landing on player (`ed > 0`, non-train) → `hit`
  - Meta cues (already in this version): `giveXP` level-up → `levelup`; both victory branches → `victory`; defeat branch → `defeat`; `useEffect` on `sub` change → `menu` chirp.
- **Audio settings panel** lives in the menu sub-panel (`☰`). Two rows (Music + SFX), each with mute toggle + range slider (0-100%) + percent readout. Sliders use `accentColor: "#d4ad40"` for the gold theme. Toggling SFX off→on plays a feedback chirp.
- **Compatible with the v41 HUD music toggle** — both surfaces now share state via `musicMuted` / `sfxMuted` React state mirrored from the engine getters.

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
