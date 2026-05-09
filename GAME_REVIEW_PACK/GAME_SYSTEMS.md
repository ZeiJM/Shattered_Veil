# Game Systems

Source of truth for every system below is `source/shattered-veil/Game.jsx`. Approximate line numbers given for navigation; everything is in one component.

## Combat

Turn-based, positional, on a 5-lane bar.

- **Lanes** (`.battle-lane`): Vanguard (0) / Front (1) / Mid (2) / Skirmish (3) / Backline (4). Player starts in Front; foes split between Skirmish/Backline. Allies stay in Front.
- **Free move per turn**: `btl.moved` flag. `actionRange(act)` returns 1 for melee, 4 for ranged/AoE/copy/ult. Acting outside range is gated in `bAct`.
- **Distance modifiers**: ×1.10 point-blank (same lane), ×1.12 long-shot (max range), symmetric for enemy hits.
- **Crits**: `min(0.25, st.lck × 0.012)` chance, ×1.5 base damage. Enemy mirror: `min(0.20, lck × 0.010)`. Gear effect `crit_damage` adds +15% per piece (caps at ×2.10 with full set).
- **Status effects**: burn, bleed, slow, stun, sleep, blind, weaken, fortify, barrier, empower, confuse — all driven by skill `fx` field + duration.
- **Boss charge attack**: every boss (`enemy.boss === true`) at distance ≥ 3 with no `chargeCD` has 32% chance to telegraph (0 dmg this turn). Next turn they advance to player's lane and hit ×1.6. 3-turn cooldown.
- **Back-step interrupt**: when a melee enemy advances AND `!btl.moved` AND `s2.spd > enemy.spd` AND player not already at lane 0–1, player auto-retreats one lane. Consumes the free move; enemy holds lane (loses point-blank bonus).
- **Low-HP heartbeat**: `setInterval(1400ms)` plays an `sfxHeartbeat` sub-bass cue when `pl.chp/pl.mhp < 0.30` (skipped during training duels).
- **Action regions** (battle screen, ~v57 tabs): `battleSection` state with 4 tabs — Veil (skills), Combat (attacks/ult/copy/move), Items (inventory consumables), Aux (equip/draw/swap/spellbook). Only the active tab is mounted-visible.
- **Battle backgrounds**: `btl.type` picks between painted PNGs — `rift`/`boss`/`fieldboss` → battle-rift, `wild`/`beast` → battle-forest, default → battle-arena.

## Classes

21 classes, all defined in the `CLS` array (top of `Game.jsx`).

Each class entry carries:
- `id`, `nm`, `ic` (emoji fallback), `el` (primary element), `cl` (color hex)
- `st` (base stats: hp, mp, atk, def, spd, mag, lck)
- `ds` (description), `stR` / `skR` (rank thresholds)
- `inter` array — signature class interactions (chains like "use a Gravity skill after applying Slow → +30% power"). At character creation `pickAssignedInteractions(shuffled, 1, c.id)` rolls **one per run** (changed from two in v72).

Class roster: paladin, assassin, sorcerer, priest, ranger, koen, shouei, phoenix, chrono, dream, voidmage, rune, bard, gravity, sound, puppet, tide, monk, primal, hexblade, gambler.

Each class has gender-variant painted portraits (`<id>.png` + `<id>_f.png`) used at every render site through `playerAvatar(cid, fallbackIc, portraitUrl, sex)`. Custom portrait URLs validated by `isValidPortraitURL` (≤800 chars, http(s)/data:image/*, SVG blocked).

Per-class skill pools live in the `<class>:[heal/buff/debuff/damage]` arrays — 4 names per category, instantiated into actual skill objects with element/power/fx via the spellbook system.

## Enemies

Two main pools:

- **OUTPOST_BOSS_TEMPLATES** + **RIFT_BOSS_TEMPLATES** — 40 named bosses with painted portraits in `public/boss/<bossKey>.png`. Each carries `key`, `name`, `el`, `passiveKey`, `supportBias`, `debuffBias`, `hp`, `atk`, `def`, `spd`, `mag`, and a `skills[]` array of 4 mixed (damage/debuff/support).
- **Wild beasts** — element-keyed simpler enemies; portraits fall back to the element sigil PNG (no boss art).
- **Roaming "dev" boss** (`devPos`) — wanders the map with its own POI marker (`💀`).

`enemyTurn` chooses between move (melee advance / ranged retreat / support hold) and an action; mirrors the player's distance modifier rules.

## Items / Equipment

- **Inventory** (`inv` state): array of `{ id, nm, ic, ef, v, qty, ... }`. Effects: `heal`, `mp`, `repel`, `crit_damage`, `fortify`, etc. Quantity-stacked.
- **Equipment slots**: 4 armor pieces + 1 weapon. Armor effects stack (e.g. `crit_damage` × 4 pieces). Weapon defines element + base atk.
- **Relics**: shards (`pl.shards`) + fragments (`pl.fragments`) → 8 relic recipes craftable at the **Relic Crafting** town service: Veil Tonic, Mana Crystal, Elixir of Iron, Void Draught, Cleansing Dust, Repel Incense, War Talisman, Void Shard Bomb.
- **Currencies on the player**: `gold`, `bank`, `loan`, `fragments`, `shards`, `fish` (ledger map by species).
- **Effective stats**: `effSt(pl)` aggregates base + bloodmark + covenant + rank + armor + temporary buffs. `projectedEffStatsFor` is the same for hypothetical previews (creation step).

## Map / World

- **Grid**: `MW = MH = 300`, `mData` is a flat `MW * MH` array of tile objects `{ x, y, bio, poi?, ... }`.
- **Biomes** (10): plains, forest, mountain, desert, snow, swamp, coast, volcanic, void, jungle. Each has a painted tile texture in `public/biome/<biome>.png` rendered as the tile background, plus a base color tint.
- **Ocean** is rendered with a handcrafted radial gradient (no texture). The player gets a swim icon and slow drown when standing on ocean tiles.
- **Viewport**: `VW × VH` = 15×9 tiles around the player (cap 820×540 px). Player tile gets a per-class aura (3-layer: edge bleed + animated conic ring + breathing inset border, all driven by `--aura-c1`/`--aura-c2`/`--aura-spd` CSS vars).
- **Movement**: WASD/arrows step one tile; click any tile to auto-walk via `autoMoveTarget` + a `setTimeout(160ms)` greedy-step effect; double-click a POI to walk + auto-enter on arrival (via `autoEnterRef`).
- **Time of day**: `skyHour` (0–23) refreshed every 60s, drives a painted sky background (`public/sky/h<HH>.png`) with crossfade and a phase indicator (`Midnight` / `Predawn` / `Sunrise` / `Morning` / `Noon` / `Afternoon` / `Golden hour` / `Sunset` / `Dusk` / `Twilight` / `Night`). Tiles get a soft-light glaze tinted by the phase.
- **POIs** (`poiArtUrl(type)`): town, hostile, outpost, rift, ruin, shrine, treasure, beast, den, dev. Each has a painted full-tile scene in `public/poi/<key>.png`.
- **Compass + events** (v74): rail card above the Veilcourt button shows nearest town + nearest non-town POI with direction + Manhattan distance; rail card below shows the latest 2 log entries.

## Towns

12+ town services in a colored grid (categories: commerce / combat / social / mystic / nature). Each service routes to a dedicated modal screen.

Services include: shops (weapons / armor / consumables), inn, bank, guild (missions), covenant hall, relic crafting, tavern (rumors), succession, duelist's circle (PvP-prep), and identity/portrait management.

## Bosses

Bosses are the spice of the game's combat. Every entry in the two boss-template arrays gets the v55 charge-attack mechanic for free via the `enemy.boss` flag. Painted boss portraits drive the lane token (`renderRichToken` adds `.is-boss-portrait` modifier) and the Sorcerer Dossier popup.

Outpost bosses are tied to outpost POIs; rift bosses to rift POIs. The roaming dev boss wanders the map (`devPos`), advertised by the `💀` icon and a separate POI category.

## Story Quests

11-quest spine with explicit ordering in the Codex:

| ID | Title | Trigger |
|---|---|---|
| s1–s6 | Origin chain | Various early-game beats |
| s7 | Dream Devourer | Final chapter |
| s8 | Schoolyard Assessment | Pledge a Covenant + win 3 sanctioned duels |
| s9 | Echoes Across the Veil | Win 5 Duelist's Circle matches |
| s10 | The Inherited Technique | Reach Warden grade + bloodmark expressions |
| s11 | Unfolded Territory | Survive a domain expansion encounter |

Quests progress automatically off existing battle/town hooks — no separate quest engine.

## UI

- **HUD** (always visible outside title/creation): portrait + name/class/rank/bloodmark/covenant tags on the left, HP/MP/XP bars on the right (v73 2-col layout), painted resource tiles (gold / frag / shard / fish), then bank / loan, then nav buttons. Every tile and tag is a `.hud-clickable` button that opens an info popup (v73).
- **Popups** (`popupEl` + `setPopup`): structured modal with `text` + optional `node` + optional `choices[]`. Used for everything from stat panels to chat profiles.
- **Notifications** (`notiEl` + `notify(text)`): brief toast at the top.
- **Tooltips** (`tipEl` + `setTip`): hover hint for tiles.
- **Veilcourt chat** (`chatEl`): always-on global chat modal with Public / Private tabs, mounted at 5 sites. See "Chat / multiplayer" below.
- **Battle UI**: lane bar at top (clickable for movement), then per-tab action grid, then per-entity card rows. Element identity lives in colored *text* (no parchment leak — every battle button forced dark navy via `!important`).

## Chat / Multiplayer (single backend artifact)

`api-server/src/routes/veilcourt.ts` exposes:

- `GET /api/veilcourt/messages?since=<id>` — public ring buffer (last 200).
- `POST /api/veilcourt/messages` — post (zod-validated payload includes full identity snapshot).
- `GET /api/veilcourt/roster` — players seen in last 90s.
- `POST /api/veilcourt/presence` — heartbeat + identity refresh.
- `GET /api/veilcourt/lookup?name=` — typeahead for DM start.
- `GET /api/veilcourt/dm?pid=` — all threads containing the caller.
- `POST /api/veilcourt/dm/thread` — find-or-create by sorted participant key (1–8 players).
- `POST /api/veilcourt/dm/thread/:id/message` — post to a thread.
- `POST /api/veilcourt/dm/thread/:id/leave` — dissolves the thread server-side for everyone.

In-memory state only, no DB. 1.5s/player rate limit. Portraits ≤800 chars, SVG rejected.

Frontend polls in lockstep (one `setInterval` 3.5s open / 9s closed) for messages + DM + presence. Chat input swallows global keydown so WASD typed into the composer doesn't leak to the map.

## Save / Load

- 3 manual save slots: `localStorage["sv_save_0/1/2"]`, JSON-serialized snapshot of the entire game state object.
- Auto-save triggers on town entry (and a few other anchor points).
- `loadGame()` is retained mainly for the post-death flow.
- No DB. No cloud save. No auth.
- Other persisted keys: `sv_chat_id` (stable identity for chat), `sv_chat_thread_read` (DM read state by threadId), `sv_music_muted` / `sv_sfx_muted` / `sv_music_vol` / `sv_sfx_vol` (audio settings).

## Audio

`source/shattered-veil/music.js` is a self-contained Web Audio engine.

- `createMusicPlayer()` returns the singleton player; lazy-creates the AudioContext on first user gesture.
- `trackForScreen(scr, { battleType })` picks a procedural track. Tracks: title (70 BPM), travel (116 BPM), battle (144 BPM), boss battle (158 BPM, E minor), town (92 BPM). `BOSS_BATTLE_TYPES = {boss, fieldboss, rift, outpost}` routes battles to the boss track.
- Schedules one full loop ahead, per-track musicBus to prevent overlap on screen change.
- Voices restricted to `sine`/`triangle` with long attack/release + ambient delay/echo bus for an atmospheric feel.
- SFX bank (separate `sfxGain` node): `hit`, `heal`, `levelup`, `victory`, `defeat`, `menu`, `cast`, `crit`, `heartbeat`. Wired into `bAct` + `enemyTurn` (try/catch wrapped — audio failures never break combat).
- HUD `🎵`/`🔇` toggle + audio settings panel (`sub === "menu"`) for mute + 0–100% volume sliders.

## Per-generation succession

When the player dies, the run ends. The next generation inherits:

- Bloodmark (with ~1-in-7 mutation chance)
- Bank gold (partial)
- Relic shards (partial)

Everything else (level, equipment, covenant, story progress, map exploration) resets per generation. Generation count + lineage history is preserved.
