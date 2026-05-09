// ─────────────────────────────────────────────────────────────────────────
// BIG ARENA FOUNDATION — DATA MODULE (Pass 2, foundation only)
// ─────────────────────────────────────────────────────────────────────────
// Pure data + small selectors. NO imports from Game.jsx, NO React.
// Nothing in here changes existing combat math, save shape, or balance.
// All gameplay metadata is *future* metadata — read by tooltips/visuals
// only in this pass. See TODOs at the bottom.
// ─────────────────────────────────────────────────────────────────────────

// ── Terrain catalogue ──
// Movement cost is informational only in this pass.
// `bonusHint` is a SHORT label shown in tooltips; no rule applies it yet.
export const TERRAIN = {
  normal: {
    label: "Open Ground",
    ds: "Even footing. No special bonus.",
    cls: "sv-arena-tile-normal",
    moveCost: 1,
  },
  scorched: {
    label: "Scorched Earth",
    ds: "Smouldering ground. Fire-aligned attackers find their resonance here.",
    cls: "sv-arena-tile-scorched",
    moveCost: 1,
    rare: true,
    bonusHint: "Ember Vein — Fire skills +8% damage.",
  },
  water: {
    label: "Shallow Water",
    ds: "Slow to wade through. Lightning arcs find their conductor.",
    cls: "sv-arena-tile-water",
    moveCost: 2,
    bonusHint: "Stillwater Mirror — Lightning skills +6% damage.",
  },
  forest: {
    label: "Tangled Brush",
    ds: "Dense growth. Nature-aligned sorcerers draw quiet sustain.",
    cls: "sv-arena-tile-forest",
    moveCost: 1,
    rare: true,
    bonusHint: "Verdant Pulse — Heal/support skills +8% healing.",
  },
  stone: {
    label: "Runed Flagstone",
    ds: "Hard footing with old runic seams. Earth/Metal techniques root well.",
    cls: "sv-arena-tile-stone",
    moveCost: 1,
    bonusHint: "Runed Flagstone — Earth/Metal skills +6% damage.",
  },
  highGround: {
    label: "Moonlit Crest",
    ds: "Raised terrace. A clean line for ranged techniques.",
    cls: "sv-arena-tile-highground",
    moveCost: 1,
    bonusHint: "Moonlit Crest — Ranged skills +5% damage.",
  },
  brokenVeil: {
    label: "Broken Veil Font",
    ds: "The Veil is paper-thin here. Veil Magic chains advance faster.",
    cls: "sv-arena-tile-brokenveil",
    moveCost: 1,
    rare: true,
    bonusHint: "Broken Veil Font — Veil Magic chain +1 step on cast.",
  },
  hallowed: {
    label: "Hallowed Ring",
    ds: "Old prayer-marks. Healing techniques bloom stronger.",
    cls: "sv-arena-tile-hallowed",
    moveCost: 1,
    rare: true,
    bonusHint: "Hallowed Ring — Heal/support skills +8% healing.",
  },
  shadowed: {
    label: "Shadowed Seal",
    ds: "Light is reluctant here. Dark and Void resonate.",
    cls: "sv-arena-tile-shadowed",
    moveCost: 1,
    bonusHint: "Shadowed Seal — Dark/Void skills +8% damage.",
  },
  stormcharged: {
    label: "Storm Sigil",
    ds: "Static crackles in the air. Lightning skills find sharper edges.",
    cls: "sv-arena-tile-stormcharged",
    moveCost: 1,
    rare: true,
    bonusHint: "Storm Sigil — Lightning/Sound skills +6% crit chance.",
  },
  gravityWell: {
    label: "Gravity Well",
    ds: "Heavier than it looks. Movement is reluctant; Veilbreak fields anchor here.",
    cls: "sv-arena-tile-gravity",
    moveCost: 2,
    rare: true,
    bonusHint: "Gravity Well — Movement +1 step cost (already enforced).",
  },
  bloodstone: {
    label: "Bloodstone Scar",
    ds: "Drinks the wounded. Physical attackers exchange a sliver of HP for bite.",
    cls: "sv-arena-tile-bloodstone",
    moveCost: 1,
    rare: true,
    bonusHint: "Bloodstone Scar — Physical strikes +8% damage, lose 2 HP.",
  },
};

export const TERRAIN_KEYS = Object.keys(TERRAIN);
export const RARE_TERRAIN_KEYS = TERRAIN_KEYS.filter(k => TERRAIN[k].rare);
export const isRareTerrain = (key) => !!(TERRAIN[key] && TERRAIN[key].rare);

// ── Destructible objects ──
// `onDestroy` is a *planned* effect string; no engine reads it yet.
export const OBJECTS = {
  crackedPillar: {
    nm: "Cracked Pillar",
    hp: 18,
    blocksMovement: true,
    blocksLineOfSight: true,
    destructible: true,
    onDestroy: "Falling debris hits adjacent tiles for a small physical hit.",
    cls: "sv-arena-object-pillar",
    glyph: "▟",
  },
  fallenTree: {
    nm: "Fallen Tree",
    hp: 12,
    blocksMovement: true,
    blocksLineOfSight: false,
    destructible: true,
    onDestroy: "Splinters scatter; nature regen briefly leaks onto adjacent tiles.",
    cls: "sv-arena-object-tree",
    glyph: "🌲",
  },
  shrineLantern: {
    nm: "Shrine Lantern",
    hp: 8,
    blocksMovement: false,
    blocksLineOfSight: false,
    destructible: true,
    onDestroy: "Hallowed light scatters; small heal pulses on the tile.",
    cls: "sv-arena-object-lantern",
    glyph: "🏮",
  },
  riftCrystal: {
    nm: "Rift Crystal",
    hp: 22,
    blocksMovement: false,
    blocksLineOfSight: false,
    destructible: true,
    onDestroy: "Releases a burst of Void; chain charge briefly accelerates for the breaker.",
    cls: "sv-arena-object-crystal",
    glyph: "◆",
  },
  stoneWall: {
    nm: "Stone Wall",
    hp: 30,
    blocksMovement: true,
    blocksLineOfSight: true,
    destructible: true,
    onDestroy: "Collapses into rubble; the tile becomes Cracked Flagstone.",
    cls: "sv-arena-object-wall",
    glyph: "▮",
  },
  brokenStatue: {
    nm: "Broken Statue",
    hp: 16,
    blocksMovement: true,
    blocksLineOfSight: true,
    destructible: true,
    onDestroy: "Old wards shatter; a Hallowed bonus tile appears on the next floor.",
    cls: "sv-arena-object-statue",
    glyph: "⛩",
  },
  cursedSeal: {
    nm: "Cursed Seal",
    hp: 24,
    blocksMovement: false,
    blocksLineOfSight: false,
    destructible: true,
    onDestroy: "Curse releases. Adjacent enemies suffer a small Dark resonance.",
    cls: "sv-arena-object-seal",
    glyph: "✷",
  },
};

// ── Background themes (visual class only) ──
export const ARENA_THEMES = {
  courtyard: { cls: "sv-arena-theme-courtyard", label: "Ruined Courtyard" },
  rift:      { cls: "sv-arena-theme-rift",      label: "Rift Crater" },
  forest:    { cls: "sv-arena-theme-forest",    label: "Moonlit Forest" },
  shrine:    { cls: "sv-arena-theme-shrine",    label: "Broken Shrine" },
  abyss:     { cls: "sv-arena-theme-abyss",     label: "Abyssal Expanse" },
};

// ── Helpers used by templates ──
const rect = (cols, rows) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));
const tile = (x, y, type) => ({ x, y, type });
const obj  = (x, y, key) => ({ x, y, key, id: `o_${x}_${y}_${key}` });

// ── Arena templates ──
// Coordinates are 0-indexed: x is column (0..cols-1), y is row (0..rows-1).
// `shape` is a 2D mask (rows x cols) where 1 = valid tile, 0 = void/out-of-bounds.
export const ARENA_TEMPLATES = [
  {
    id: "ruined_courtyard",
    name: "Ruined Courtyard",
    ds: "A cracked plaza where a sorcery duel once split the floor.",
    cols: 12,
    rows: 10,
    theme: "courtyard",
    shape: rect(12, 10),
    playerSpawns: [{ x: 1, y: 5 }, { x: 1, y: 4 }, { x: 1, y: 6 }],
    enemySpawns:  [{ x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 6 }, { x: 9, y: 3 }, { x: 9, y: 7 }],
    terrain: [
      tile(5, 4, "stone"), tile(6, 4, "stone"), tile(5, 5, "stone"), tile(6, 5, "stone"),
      tile(3, 2, "highGround"), tile(8, 7, "highGround"),
      tile(2, 8, "scorched"), tile(9, 1, "scorched"),
      tile(6, 0, "brokenVeil"),
    ],
    destructibles: [
      obj(4, 3, "crackedPillar"), obj(7, 6, "crackedPillar"),
      obj(5, 7, "stoneWall"),
      obj(8, 2, "brokenStatue"),
    ],
  },
  {
    id: "rift_crater",
    name: "Rift Crater",
    ds: "A bowl-shaped tear in reality. Footing slips toward the centre.",
    cols: 14,
    rows: 10,
    theme: "rift",
    // Irregular: corners trimmed to suggest a crater shape.
    shape: (() => {
      const m = rect(14, 10);
      const trim = [
        [0,0],[0,1],[1,0],
        [12,0],[13,0],[13,1],
        [0,8],[0,9],[1,9],
        [12,9],[13,9],[13,8],
      ];
      trim.forEach(([x,y]) => { m[y][x] = 0; });
      return m;
    })(),
    playerSpawns: [{ x: 2, y: 5 }, { x: 2, y: 4 }],
    enemySpawns:  [{ x: 11, y: 4 }, { x: 11, y: 5 }, { x: 10, y: 3 }, { x: 10, y: 6 }],
    terrain: [
      tile(7, 4, "brokenVeil"), tile(7, 5, "brokenVeil"), tile(6, 4, "brokenVeil"),
      tile(7, 6, "gravityWell"), tile(6, 5, "gravityWell"),
      tile(3, 7, "shadowed"), tile(10, 2, "shadowed"),
    ],
    destructibles: [
      obj(5, 3, "riftCrystal"), obj(8, 6, "riftCrystal"),
      obj(7, 1, "cursedSeal"),
    ],
  },
  {
    id: "moonlit_forest_hollow",
    name: "Moonlit Forest Hollow",
    ds: "Pale moss between dark trunks. Sound travels strangely.",
    cols: 12,
    rows: 10,
    theme: "forest",
    shape: rect(12, 10),
    playerSpawns: [{ x: 1, y: 5 }, { x: 1, y: 4 }],
    enemySpawns:  [{ x: 10, y: 4 }, { x: 10, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 3 }],
    terrain: [
      tile(2, 2, "forest"), tile(3, 2, "forest"), tile(2, 3, "forest"),
      tile(8, 7, "forest"), tile(9, 7, "forest"), tile(8, 8, "forest"),
      tile(5, 5, "hallowed"), tile(6, 4, "water"),
      tile(4, 8, "shadowed"),
    ],
    destructibles: [
      obj(3, 5, "fallenTree"), obj(7, 5, "fallenTree"),
      obj(6, 2, "shrineLantern"), obj(6, 8, "shrineLantern"),
    ],
  },
  {
    id: "broken_shrine",
    name: "Broken Shrine",
    ds: "Half-collapsed sanctum. Pillars cast long shadows across hallowed stone.",
    cols: 10,
    rows: 8,
    theme: "shrine",
    shape: rect(10, 8),
    playerSpawns: [{ x: 1, y: 4 }, { x: 1, y: 3 }],
    enemySpawns:  [{ x: 8, y: 3 }, { x: 8, y: 4 }, { x: 7, y: 2 }, { x: 7, y: 5 }],
    terrain: [
      tile(4, 3, "hallowed"), tile(5, 3, "hallowed"), tile(4, 4, "hallowed"), tile(5, 4, "hallowed"),
      tile(2, 1, "stone"), tile(7, 6, "stone"),
      tile(0, 0, "shadowed"), tile(9, 7, "shadowed"),
    ],
    destructibles: [
      obj(3, 2, "crackedPillar"), obj(6, 5, "crackedPillar"),
      obj(4, 0, "shrineLantern"), obj(5, 7, "shrineLantern"),
      obj(0, 4, "brokenStatue"),
    ],
  },
  {
    id: "abyssal_expanse",
    name: "Abyssal Expanse",
    ds: "A boss arena suspended over the dark. The floor is fractured into islands.",
    cols: 16,
    rows: 12,
    theme: "abyss",
    // Heavily irregular: drop chunks of the perimeter and a central canyon.
    shape: (() => {
      const m = rect(16, 12);
      // perimeter chips
      [[0,0],[1,0],[0,1],[15,0],[14,0],[15,1],[0,11],[1,11],[0,10],[15,11],[14,11],[15,10]]
        .forEach(([x,y]) => { m[y][x] = 0; });
      // central canyon
      for (let y = 4; y <= 7; y++) { m[y][7] = 0; m[y][8] = 0; }
      // restore two narrow bridges
      m[5][7] = 1; m[6][8] = 1;
      return m;
    })(),
    playerSpawns: [{ x: 2, y: 6 }, { x: 2, y: 5 }, { x: 2, y: 7 }],
    enemySpawns:  [{ x: 13, y: 5 }, { x: 13, y: 6 }, { x: 12, y: 4 }, { x: 12, y: 7 }, { x: 11, y: 3 }, { x: 11, y: 8 }],
    terrain: [
      tile(7, 5, "brokenVeil"), tile(8, 6, "brokenVeil"),
      tile(4, 2, "stormcharged"), tile(11, 9, "stormcharged"),
      tile(3, 9, "bloodstone"), tile(12, 2, "bloodstone"),
      tile(5, 6, "gravityWell"), tile(10, 5, "gravityWell"),
      tile(6, 1, "shadowed"), tile(9, 10, "shadowed"),
    ],
    destructibles: [
      obj(4, 4, "stoneWall"), obj(11, 7, "stoneWall"),
      obj(6, 9, "riftCrystal"), obj(9, 2, "riftCrystal"),
      obj(2, 2, "cursedSeal"), obj(13, 9, "cursedSeal"),
      obj(5, 8, "crackedPillar"), obj(10, 3, "crackedPillar"),
    ],
  },
];

export const ARENA_BY_ID = ARENA_TEMPLATES.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

// Pass 12 — per-boss preferred arena overrides. Kept inline (instead of
// importing from enemyBossIdentity.js) so this module stays a leaf with
// no cross-package coupling. Keys must match BOSS_IDENTITIES bossKey.
const BOSS_PREFERRED_ARENA = {
  ironjaw: "broken_shrine", silkweave: "abyssal_expanse", blazefury: "ruined_courtyard",
  scylla: "moonlit_forest_hollow", gravewatch: "broken_shrine", stormmarshal: "abyssal_expanse",
  thornmatron: "moonlit_forest_hollow", chalkseer: "broken_shrine", floodjudge: "rift_crater",
  hushsaint: "broken_shrine", sandreaver: "ruined_courtyard", glacierabbot: "abyssal_expanse",
  sunlancer: "broken_shrine", velvetfang: "moonlit_forest_hollow", mirebishop: "moonlit_forest_hollow",
  windvicar: "abyssal_expanse", steelmatron: "ruined_courtyard", lunacensor: "abyssal_expanse",
  brazenidol: "ruined_courtyard", gravechorus: "broken_shrine",
  entropy: "abyssal_expanse", time: "abyssal_expanse", null: "abyssal_expanse",
  reality: "abyssal_expanse", primal: "moonlit_forest_hollow", starhunger: "abyssal_expanse",
  mourningaxis: "broken_shrine", crownofice: "abyssal_expanse", deepjudge: "rift_crater",
  dreamcaul: "abyssal_expanse", gravitomb: "abyssal_expanse", sunkenarchive: "abyssal_expanse",
  voidcathedral: "abyssal_expanse", glassleviathan: "abyssal_expanse", plagestar: "moonlit_forest_hollow",
  tempestoracle: "abyssal_expanse", namelessforge: "broken_shrine", verdantmaw: "moonlit_forest_hollow",
  blackhorizon: "abyssal_expanse", palegeometry: "abyssal_expanse",
};

// Pick a template from a small context object.
// Context shape is intentionally loose so callers don't need to know the data
// model: { isBoss?, isRift?, biomeHint?, enemyCount?, seed?, bossKey? }.
export function pickArenaTemplate(ctx = {}) {
  const seed = Number(ctx.seed || 0) || 0;
  // Pass 12 — boss identity arena preference wins over the generic boss
  // default. Falls through if the boss key has no override or the named
  // arena is missing.
  if (ctx.bossKey && BOSS_PREFERRED_ARENA[ctx.bossKey] && ARENA_BY_ID[BOSS_PREFERRED_ARENA[ctx.bossKey]]) {
    return ARENA_BY_ID[BOSS_PREFERRED_ARENA[ctx.bossKey]];
  }
  if (ctx.isBoss) return ARENA_BY_ID.abyssal_expanse;
  if (ctx.isRift) return ARENA_BY_ID.rift_crater;
  const biome = String(ctx.biomeHint || "").toLowerCase();
  if (biome.includes("forest") || biome.includes("wood") || biome.includes("grove")) return ARENA_BY_ID.moonlit_forest_hollow;
  if (biome.includes("shrine") || biome.includes("temple") || biome.includes("ruin")) return ARENA_BY_ID.broken_shrine;
  // default rotates through the two "normal" templates by seed for a bit of variety.
  const fallback = [ARENA_BY_ID.ruined_courtyard, ARENA_BY_ID.broken_shrine];
  return fallback[Math.abs(seed) % fallback.length];
}

// ─────────────────────────────────────────────────────────────────────────
// FUTURE TODOs (do not implement in this pass):
//  - Move skill range/shape data onto each skill in Game.jsx skill catalogue.
//  - Add destructible-object damage flow (route Strike/skills against objects).
//  - Hook terrain bonuses + rare tile triggers into damage/heal/charge math.
//  - Add Veilbreak field zones from each ult template (ult.fieldShape).
//  - Field Clash resolution + Field Attunement derived stat.
//  - Replace lane positions on player/enemies with {x,y} world positions.
// ─────────────────────────────────────────────────────────────────────────
