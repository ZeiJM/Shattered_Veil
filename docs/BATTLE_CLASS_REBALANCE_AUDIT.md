# Battle Class Rebalance Audit (Pass 11 — v84)

This is the working ledger for Battle Rework Pass 11. It records the state of
all 21 player classes after Pass 11 and explains what changed, what did NOT
change, and where the next pass should pick up.

> Pass 11 is **additive metadata + UI surfacing**. It intentionally does NOT
> rewrite the existing procedural skill generator (`mkSkills`), the passive
> generator (`mkPassives`), the ult generator (`mkUltPool`), or any per-class
> `inter[]` interactions — those already use canonical Pass 10 statuses and
> would explode the diff if rewritten in one pass.

## What Pass 11 actually does

1. **New file** `src/battle/classRoles.js` — single source of truth for
   class identity: role, role summary, primary stats, range identity,
   preferred shape, terrain affinity, Veilbreak field identity, weakness.
2. **Skill range/shape stamping** — every generated skill now carries
   `range`, `rangeMin`, `rangeMax`, `shape`, `targetType` so the arena
   system has range/shape data per skill without changing save shape.
3. **Class pick card UI** shows a role badge + range identity pill.
4. **Skill archive cards** show a Range pill and a Shape pill alongside
   the existing element/AoE/status chips.
5. **CSS** — small role badge + range/shape chip variants.
6. **Audit doc** (this file).

## Hard rules respected
- Save shape unchanged — range/shape recomputed at battle time.
- Existing `inter[]` interactions unchanged (they already use canonical
  statuses and define class playstyle).
- `mkPassives` and `mkUltPool` unchanged.
- Bosses, bloodmarks, aging, world, towns, marriage, succession, chat,
  backend — unchanged.
- Engines (combat, arena, Veilbreak chain) — unchanged.

## Class roster — role assignments

All 21 classes get a **distinct primary role**. No two classes share one.

| ID | Name | Primary Role | Range | Stat Priority | Field Identity |
|---|---|---|---|---|---|
| paladin | Paladin | Tank | Melee | HP / DEF / Guard | Hallowed Bulwark |
| assassin | Assassin | Assassin | Melee | SPD / Crit / Eva | Veil of Shadow |
| sorcerer | Sorcerer | Long-Range Caster | Long | MAG / Veil Gen | Arcane Storm |
| priest | Priest | Healer / Support | Medium | MAG / Heal Power | Hallowed Sanctum |
| ranger | Ranger | Ranger / Projectile | Long | SPD / Accuracy | Bramblewind |
| koen | Kōen | Burst Caster (DoT) | Medium | MAG / Status Pwr | Petalfire Bloom |
| shouei | Shōuei | Mirror Controller | Medium | MAG / Status Res | Mirror Frost |
| phoenix | Phoenix Knight | Sustain Bruiser | Melee | HP / ATK / MAG | Pyre Renewal |
| chrono | Chronomancer | Tempo Controller | Medium | SPD / MAG | Time Distortion |
| dream | Dreamweaver | Status Controller | Medium | MAG / Status Pwr | Lucid Devourer |
| voidmage | Void Mage | Void Debuffer | Long | MAG / Status Pwr | Abyss Maw |
| rune | Runekeeper | Barrier Bulwark | Melee | DEF / Guard / HP | Sealed Bulwark |
| bard | War Bard | Buff Support | Medium (cone) | MAG / Heal / SPD | Resonant Chorus |
| gravity | Graviton | Field Tank | Melee (burst) | HP / DEF / Guard | Singularity Press |
| sound | Echo Mage | Area Disruptor | Medium (cone) | MAG / Status Pwr | Cathedral Echo |
| puppet | Puppeteer | Debuff Controller | Medium | MAG / Status Pwr | Soulthread Web |
| tide | Tidesinger | Sustain Support | Medium (zone) | MAG / Heal / DEF | Tideborn Sanctum |
| monk | Iron Monk | Crit Striker | Melee | ATK / Crit / Move | Iron Stance |
| primal | Primal Shifter | Adaptive Shifter | Medium | ATK / MAG (mixed) | Wildform Surge |
| hexblade | Hexblade | DoT Duelist | Short | ATK / MAG / SP | Hex Brand Field |
| gambler | Gambler | Risk / Reward | Medium | LCK / SPD | Wild Fortune |

## Skill metadata stamped (all classes)

Every generated skill now carries:
- `range` (number, finite, never Infinity)
- `rangeMin` / `rangeMax` (band the engine can use for arena targeting)
- `shape` (`single` | `line` | `cone` | `burst` | `aura` | `zone` | `self`)
- `targetType` (`enemy` | `ally`)

Defaults follow class `rangeIdentity` with these conservative nudges:

- Buffs → range 0, shape `self`.
- Heals → range 0–4, shape `single` (or `aura` if AoE-tagged).
- Debuffs → range 2–4, shape `single`.
- Copy skills → range 0–4, shape `single`.
- Damage skills → class range identity tier; AoE drops one tier;
  Wind/Lightning extend max range by 1; Earth/Metal trim it by 1.
- Single-target damage gets a shape hint from element: Lightning/Light →
  `line`, Wind/Sound → `cone`, otherwise `single`.

These are **temporary** values to give arena targeting something honest to
read while Pass 12 (per-class numeric tuning) is still pending.

## Per-class identity notes (why the role makes sense)

- **paladin** — already has Guard/Stun/Light combos in `inter[]`. Tank role
  formalizes the front-line fantasy.
- **assassin** — Crit/Blind/Bleed/Evasion already shipped. Assassin role
  is a name change, not a behavior change.
- **sorcerer** — pure Arcane, longest range, MP overflow combos already in
  `inter[]`. Long-Range Caster fits exactly.
- **priest** — healing-first kit already in `mkPassives`. Healer role.
- **ranger** — Mark/Wildchain/Snare already debuff-then-strike. Ranger role.
- **koen / phoenix** — both Fire, kept distinct: Kōen is Burst Caster
  (DoT amplifier), Phoenix is Sustain Bruiser (HP/Rebirth). Different
  range identities (medium vs melee) preserve role separation.
- **shouei** — Copy is the unique mechanic. Mirror Controller role makes
  the copy/freeze cycle the core fantasy.
- **chrono / sound / puppet / dream** — all "controller-like" but split:
  - chrono = tempo (Slow/Stun/Haste rotation)
  - dream = status (Sleep/Confuse/Curse stacker)
  - sound = area disruptor (cone Silence/Stun)
  - puppet = debuff controller (Curse/Bleed/Weaken stack)
  Distinct primary roles, no overlap in role label.
- **voidmage** — long-range Curse/Silence — Void Debuffer fits the kit
  without overlapping sorcerer's Arcane DPS identity.
- **rune / gravity / paladin** — three "tank-like" classes split:
  - paladin = pure Tank
  - rune = Barrier Bulwark (Shield/Fortify stacker)
  - gravity = Field Tank (Guard becomes a damage source)
  No two share a primary role label.
- **bard / tide / priest** — three "support-like" classes split:
  - priest = Healer
  - tide = Sustain Support (heal + Slow control)
  - bard = Buff Support (Haste/Empower spread)
- **monk** — Crit Striker is the new identity. Iron Monk's existing
  Combo Fist / Counter Strike / Battle Flow interactions already
  reward repeated weapon strikes.
- **primal** — Adaptive Shifter. Range identity stays Medium because the
  rolled elements override per-skill nudges anyway.
- **hexblade / assassin** — both DoT-flavored, kept distinct: hexblade is
  DoT Duelist (Curse cashout), assassin is Stalker (Bleed/Blind execute).
- **gambler** — Risk/Reward is the unique role; no other class touches
  LCK as primary stat.

## Status references — already canonical

A grep of `mkSkills`, `mkPassives`, `mkUltPool`, and every `inter[]` entry
shows status names already align with the Pass 10 canonical 29-entry list
(Burn, Bleed, Poison, Slow, Stun, Silence, Blind, Weaken, Expose, Curse,
Shield, Barrier, Fortify, Regen, Cleanse, Haste, Reflect, Thorns, Nullify,
Veilflare Focus, Fractured, Anchored, Overchanneled, Braced, Sleep,
Confuse, Freeze, Empower, Evasion, Taunt). The Pass 10 alias map handles
the remaining edge cases (`burning→burn`, `wounded→bleed`, etc.).

No deprecated status references remain in player class data — Pass 11 did
not need to rewrite a single status name.

## Veilbreak class identity

Each class now has a documented `fieldIdentity` and `vbTheme` (tone +
color) in `CLASS_ROLES`. The existing Veilbreak chain layer
(`battle/arena/veilbreakChain.js`) is left unchanged in this pass — Pass 12
can read these flavor strings to pick visual themes without further data
work.

## Safeguards

- Old saves: skills lacking `range`/`shape` are stamped at battle time.
- Missing class id: `getClassRole(id)` returns `null` and helpers fall
  through to medium-range / single-target defaults.
- `inferSkillRange` always returns finite `min`/`max`/`default` — never
  `Infinity`/`NaN`.
- `stampSkillCombatMeta` never overwrites explicit `range`/`shape`
  fields, so any future hand-authored skill will win.
- All new code is pure functions in a leaf module — no React state, no
  side effects, no save shape touched.

## Intentionally NOT changed in Pass 11

- `mkSkills` interior numbers (power/MP curves) — Pass 12.
- `mkPassives` text/effects — Pass 12.
- `mkUltPool` chain lengths and powers — Pass 12.
- `inter[]` interactions per class — already canonical, kept stable.
- Veilbreak chain field rendering / banners.
- Boss kits, bloodmarks, aging, heirs.
- Item / weapon / armor balance.
- Multiplayer PvP balance.

## Risky areas for Pass 12

- Per-class numeric tuning of skill power and MP costs after playtesting.
- Range/shape values are heuristics — confirm with arena team that the
  defaults feel right for each role.
- Veilbreak field implementation per class (using the new `fieldIdentity`
  + `vbTheme` strings) is still text-only.
- Enemy/boss behavior against the new role identities (e.g. should an
  assassin field actually grant Evasion to allies? — probably yes once
  enemy AI can react).
- Gear scaling against the new role priorities (Crit gear should favor
  Monk/Assassin; Healing Power gear should favor Priest/Tide).
- Bloodmark interactions with role identities.
- Heir inheritance of role-defining stats.

## Tested

- Game starts, character creation flows, all 21 class cards render.
- Each role badge renders with its color/label.
- Skill archive cards render the new Range / Shape pills.
- Old saves load (skills without `range`/`shape` get stamped at use).
- Battle starts and runs Steady/Flurry/Veilflare/Tactical actions
  (Pass 9/10 work preserved).
- No console errors on startup or character creation.
