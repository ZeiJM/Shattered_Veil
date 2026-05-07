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

## Gender-variant class portraits (v36)

Every class now has both a male portrait (`public/class/<id>.png`) and a female variant (`public/class/<id>_f.png`) — 42 painted portraits total, all 1024×1024, painterly dark-fantasy style matching the existing aesthetic.

- **`classPortraitUrl(cid, sex)` helper** (~line 3047) — single source of truth: returns `_f.png` for `sex==="female"`, base png otherwise. Uses `BASE_URL` so it works under any artifact prefix.
- **`playerAvatar(cid, fallbackIc, portraitUrl, sex)`** — gained a 4th `sex` param. Female portrait failures auto-fall back to the male png via `data-sex` / `data-fb` dataset flags (no infinite loop), then to the class emoji if both are missing.
- **All 5 callsites updated** to pass `pl?.sex`: HUD avatar, world map "you are here", submap player tile, battle player row, battle lane ally token (also added `sex` to `allyTokens[0]`).
- **Forge Your Hero rotation** — new `previewSex` state with a 2.2s `setInterval` that toggles M/F while `scr === "create"`. The class picker thumbnails (~line 5852) animate between both variants so players see both options exist before locking in. Once the player picks a sex on the Identity step, the larger preview card (~line 5895) and the custom-portrait fallback (~line 5924) commit to `cSex`.
- **Stats Appearance card** (~line 6228) and the rest of the in-game UI use `pl.sex` directly — once committed in `createChar()`, the gender-correct portrait shows everywhere automatically.

## Popup contrast fix (v35)

The universal popup modal (`setPopup({...})`) was using `color: T.tx` (parchment dark ink `#18120a`) on a hardcoded dark navy background — body text was nearly invisible. Now self-contained via the `.popup-modal` CSS class in `game.css` (~end of file): dark navy gradient bg + light text (`#e8eeff`), gold Cinzel title, and gold-gradient choice buttons with dark text. All inherit-color rules use `!important` so inline `T.tx`/`T.dm` from caller-provided `popup.node` content gets overridden. Inline styles in the `popupEl` JSX (~line 5752) now only set layout, never colors.

## Avatar & icon polish (v34)

- **`playerAvatar(cid, fallbackIc, portraitUrl)` helper** (~line 3046) — single source of truth for rendering the player figure. Layers (bottom→top, all `position:absolute`): emoji fallback → class portrait png (with `onError` that hides itself) → custom-URL overlay. Parent must be `position:relative; overflow:hidden`. If the class png 404s the emoji shows; if the custom URL fails the class png shows.
- **Where it renders**: HUD avatar (~5764, bumped to 36×36 with class-color glow ring), battle player row (~6616, bumped to 32×32 with class-color border), battle lane ally token (~6605, only the player token uses `tok.classId`; pet/foe tokens still emoji+overlay), world map "you are here" (~6534, suppressed when swimming → falls back to 🏊+overlay), submap "you are here" (~6898).
- **Why this matters**: previously the HUD/map showed the class *emoji* (e.g. 🛡 for paladin) as the visible identity even after the player picked a portrait at character creation. Now they always see the same painted class portrait (or their custom one) across creation → HUD → map → battle.
- **Class picker (Forge Your Hero)** ~line 5848: portrait thumbnails bumped from 32×32 → 40×40 with class-color glow shadow + thicker border. Removed the redundant emoji prefix on class names since the portrait already carries the visual identity.
- **Bloodmark icons** ~line 5870: emoji is now wrapped in a 36×36 circular badge with a radial bloodmark-color glow, ring border, inset highlight, and `drop-shadow` filter — much more "premium" feel than the bare 20px emoji.

## Title screen (v33)

Stripped to a single CTA in anticipation of the online migration. **Removed**: Multiplayer button, Admin Panel button + entire admin modal JSX block, the three Load Save buttons, version number, WASD/spacebar instructions. The `loadGame()` function and save persistence remain in the codebase (used by post-death continue flows); only the title-screen entrypoint to manual loads was cut.

**Kept/added**:
- Single `⚔ Enter the Rift` button (`.title-cta`) — pulsing gold CTA that goes straight to character creation in single mode. Subtitle reads "Online persistence and live PvP coming soon — your bloodline begins here."
- Six **lore pillars** (`.title-pillars` grid, 3-col → 2-col under 520px) replacing the flat chip strip: 16 Sorcerer Classes, 8 Bloodmarks, Unfolded Territories, 5 Rival Covenants, A Living Continent, Dynasty Succession. Each tile has a glowing icon corner-glow, gold-accented Cinzel title, and an italic Crimson teaser.
- Stronger eyebrow (`.title-eyebrow`, 0.55em letter-spacing) and a punched-up tagline: *"The sky tore open a hundred years ago. The dead walked out of it. You inherited what bled through."* (final clause in gold via inline span).
- All new styles live in `game.css` under the "New title screen (v33)" block (~line 485). Old `.feature-chip` / `.title-feature-row` rules left in place — still referenced by `.title-bg-art .feature-chip` overrides at line 123 and harmless to keep until they're confirmed unused elsewhere.

## Custom portrait (v32)

- **`pl.portrait`** — optional URL string on the player. Persisted automatically with the rest of `pl` via the existing JSON save flow.
- **Helpers** (~line 3040): `isValidPortraitURL(u)` accepts `http(s)://…` and `data:image/(png|jpeg|gif|webp|avif|apng)` (≤800 chars; SVG data URIs explicitly blocked to avoid XSS). `portraitOverlay(url)` returns an absolutely-positioned `<img>` with `referrerPolicy="no-referrer"` and an `onError` that hides itself.
- **Fallback architecture (important)** — every render site uses the layered pattern: container is `position:relative; overflow:hidden`, the *fallback* (class emoji / class portrait png) is rendered first as a normal child, and `portraitOverlay(url)` is rendered as an absolutely-positioned sibling on top. When the image fails to load, the overlay hides itself and the fallback remains visible. Do **not** use `portraitOverlay(url) || fallback` — the overlay JSX is always truthy when the URL is valid, so the fallback would never render.
- **Set at character creation** — Identity step (~line 5905) has a "Custom Portrait URL" field with a 56×56 live preview. Blank → uses class portrait. Stored into `pl.portrait` in `createChar()` (~line 3852).
- **Edit later** — Stats sub-panel (~line 6207) has an Appearance card: paste a URL (commits on blur) or hit "Reset to Class Art".
- **Where it renders**: HUD avatar (~line 5759), battle player row icon (~line 6602), battle lane ally token (~line 6591), world map "you are here" tile (~line 6520, suppressed when swimming), and submap player tile (~line 6885). All five sites fall back to the class emoji if the portrait is unset or the image fails to load.
- **Animated GIFs** work natively via `<img>`; no extra wiring needed.

## Forge Your Hero contrast (v30)

Inline `T.c1`/`T.c2` (parchment) backgrounds on cards inside `.create-bg` were defeating the dark-navy `.cd` baseline and making yellow/light-blue text unreadable. All class cards, bloodmark cards, name/quote inputs, and the interaction preview buttons now force a dark navy gradient with light text (`#e8eeff` body, `#cfd6ee` labels, class color for headers). Personal Quote is now **required** alongside Hero Name to begin — Begin button stays disabled until both are filled, with a poetic prompt under the button when the quote is empty.

## Gotchas

- `Game.jsx` exceeds Babel's 500KB deoptimization threshold — HMR is slower than normal, be patient after edits.
- Battle screen colors must use `!important` in CSS to override inline `T.*` parchment colors.
- `hud-shell` must use `!important` — it's inside `.shell-bg .cd` which would otherwise apply parchment styling.
- `startSuccession` must be declared before line ~3550 (was a TDZ bug when first migrated).
- `index.css` is intentionally minimal — no Tailwind (the original template had placeholder `red` values).
- The local `covenant` useState (line ~3034) is declared but the live covenant is tracked inside `pl.covenant` — safe to leave as-is.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
