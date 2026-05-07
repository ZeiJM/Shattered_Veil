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

## Crossfade portraits + Sien Risetsu rework (v39)

- **`CrossfadePortrait` helper** (~line 3050, inside `Game`) — layered portrait component used for the M/F preview rotation in Forge Your Hero. Renders both the male and female pngs absolutely-positioned in the same wrapper, toggles `opacity` (480ms ease) instead of swapping `src` via React `key`. Result: gentle dissolve instead of a hard cut. Three sites use it: class-pick thumbnails (~6048), Identity preview card (~6091), custom-portrait fallback bg (~6120). Female `onError` auto-falls back to the male png via the same `data-sex`/`data-fb` pattern as `playerAvatar`.
- **Repainted Sien Risetsu twins**: `koen.png` / `koen_f.png` (blazing twin — scarlet silk + obsidian leather, ember petals, gold blossom hairpin on the female variant) and `shouei.png` / `shouei_f.png` (cold twin — silver-white hair, frost crystals, floating mirror-shard, silver blossom hairpin on the female variant). All four match the painterly Veilbound dark-fantasy aesthetic at 1024×1024.

## UI polish history (v30 – v36, condensed)

Earlier polish rounds — kept compact since the systems are stable. Refer back here when touching any of these areas.

- **v30 — Forge Your Hero contrast.** Forced dark-navy gradient + light text on every card inside `.create-bg` (class/bloodmark cards, inputs, interaction preview buttons) so yellow/cyan accents stay readable. Personal Quote is *required* alongside Hero Name to begin.
- **v32 — Custom portraits (`pl.portrait`).** Optional URL on the player, persisted via the JSON save flow. Helpers `isValidPortraitURL(u)` (accepts `http(s)://` + `data:image/(png|jpeg|gif|webp|avif|apng)`, ≤800 chars; SVG data URIs blocked) and `portraitOverlay(url)` (absolutely-positioned `<img>` with `referrerPolicy="no-referrer"` and an `onError` that hides itself). **Fallback rule**: every render site uses `<container position:relative overflow:hidden>{fallback}{portraitOverlay(url)}</container>` — the overlay is always truthy when the URL is valid, so do **not** short-circuit `overlay || fallback` (the fallback would never render). Set in the Identity step + Stats Appearance card. Animated GIFs work natively.
- **v33 — Title screen.** Stripped to a single pulsing `⚔ Enter the Rift` CTA (the Multiplayer / Admin / Load buttons + WASD instructions + version number were removed; `loadGame()` itself stays in code for post-death continue flows). Replaced the flat chip strip with six lore pillars (`.title-pillars`, 3→2 col responsive). Subtitle now references the online migration. Old `.feature-chip` rules are left in place but unused.
- **v34 — Avatar & icon polish.** `playerAvatar(cid, fallbackIc, portraitUrl, sex)` is the single source of truth for rendering the player. Layered bottom→top: emoji fallback → class portrait png → custom overlay. Used in HUD (36×36 + class-color glow), battle player row (32×32 + class-color border), battle lane ally token (only the player token uses `tok.classId`), world map (suppressed while swimming), and submap. Class-picker thumbnails bumped to 40×40 with class-color glow; bloodmark icons wrapped in a 36×36 circular badge with radial color glow.
- **v35 — Popup contrast.** The universal popup modal is now self-contained via `.popup-modal` in `game.css` (dark navy gradient bg + light text + gold Cinzel title + gold-gradient choice buttons). All `color`/`background` rules use `!important` to override caller-provided inline `T.tx`/`T.dm` colors inside `popup.node`. The `popupEl` JSX only sets layout, never colors.
- **v36 — Gender-variant class portraits.** Every class has both `class/<id>.png` (male) and `class/<id>_f.png` (female) — 42 painted portraits at 1024×1024. `classPortraitUrl(cid, sex)` is the single helper; `playerAvatar` falls back female → male via `data-sex`/`data-fb` flags (no infinite loop). All 5 in-game callsites pass `pl?.sex`. Forge Your Hero auto-rotates M↔F at 2.2s on the class-pick step (now via the v39 crossfade) so players see both options before committing; `pl.sex` is set on the Identity step and locked in `createChar()`.

## Gotchas

- `Game.jsx` exceeds Babel's 500KB deoptimization threshold — HMR is slower than normal, be patient after edits.
- Battle screen colors must use `!important` in CSS to override inline `T.*` parchment colors.
- `hud-shell` must use `!important` — it's inside `.shell-bg .cd` which would otherwise apply parchment styling.
- `startSuccession` must be declared before line ~3550 (was a TDZ bug when first migrated).
- `index.css` is intentionally minimal — no Tailwind (the original template had placeholder `red` values).
- The local `covenant` useState (line ~3034) is declared but the live covenant is tracked inside `pl.covenant` — safe to leave as-is.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
