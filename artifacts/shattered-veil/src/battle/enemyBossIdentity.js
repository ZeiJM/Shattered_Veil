// Pass 12 — Enemy & Boss Identity Layer.
// Pure metadata + helpers. Additive only. No engine rewrite, no save-shape
// change. Game.jsx imports the helpers below to (a) emit boss intro/phase
// narration, (b) pick a per-boss preferred arena, (c) activate boss-owned
// Veilbreak fields that route through the existing Field Clash code, and
// (d) tag generic enemies with an archetype family for log presentation.
//
// All numbers/strings are conservative; this pass does not rebalance boss
// damage or HP. Pass 13+ will tune signature mechanics now that identity
// is in place.

// ── Archetypes (12) ─────────────────────────────────────────────────────
// Each archetype carries: id, label, role, movementBias (advance/hold/
// flank/reposition), rangePref (melee/short/medium/long/global), weakness
// hint, behaviorHints (for tooltips), and fieldDefault (key into
// BOSS_FIELD_TEMPLATES).
export const ENEMY_ARCHETYPES = {
  fortress: { id: "fortress", label: "Fortress", role: "Heavy Tank",
    movementBias: "hold", rangePref: "melee",
    weakness: "Mobile pressure / sustained ranged Veil Magic",
    behaviorHints: ["Plants and refuses ground", "Layers Fortify before striking"],
    fieldDefault: "bulwark" },
  siege_brute: { id: "siege_brute", label: "Siege Brute", role: "Crushing Bruiser",
    movementBias: "advance", rangePref: "melee",
    weakness: "Kiting and freeze/slow control",
    behaviorHints: ["Closes the gap before swinging", "Telegraphs heavy charges"],
    fieldDefault: "groundquake" },
  predator: { id: "predator", label: "Predator", role: "Bleed Hunter",
    movementBias: "flank", rangePref: "melee",
    weakness: "Burst burn / barrier-stacking guards",
    behaviorHints: ["Stacks Bleed before commit", "Hunts wounded prey"],
    fieldDefault: "huntmark" },
  tempest: { id: "tempest", label: "Tempest", role: "Mobile Caster",
    movementBias: "reposition", rangePref: "long",
    weakness: "Forced melee / silence chains",
    behaviorHints: ["Keeps distance", "Chains Haste with bursts"],
    fieldDefault: "stormveil" },
  hexweaver: { id: "hexweaver", label: "Hexweaver", role: "Status Controller",
    movementBias: "hold", rangePref: "medium",
    weakness: "Cleanse + brute force damage races",
    behaviorHints: ["Silence/Confuse before damage", "Stacks barriers"],
    fieldDefault: "hexlace" },
  rotcourt: { id: "rotcourt", label: "Rotcourt", role: "DoT Stacker",
    movementBias: "hold", rangePref: "short",
    weakness: "Veil Tonics + cleanse-on-status passives",
    behaviorHints: ["Layers Poison/Curse", "Punishes lingering players"],
    fieldDefault: "miasma" },
  abyssal: { id: "abyssal", label: "Abyssal", role: "Void Disruptor",
    movementBias: "reposition", rangePref: "medium",
    weakness: "Light/Sound damage + nullify",
    behaviorHints: ["Drowns enemy buffs", "Shifts to backline mid-fight"],
    fieldDefault: "voidrift" },
  radiant: { id: "radiant", label: "Radiant", role: "Judgment Striker",
    movementBias: "advance", rangePref: "medium",
    weakness: "Dark/blind effects",
    behaviorHints: ["Telegraphs heavy strikes", "Empowers self before judgment"],
    fieldDefault: "judgmentglare" },
  tide: { id: "tide", label: "Tide", role: "Zone Drowner",
    movementBias: "hold", rangePref: "medium",
    weakness: "Lightning and freeze locks",
    behaviorHints: ["Seals tiles in water", "Slows then crushes"],
    fieldDefault: "tide" },
  cryomancer: { id: "cryomancer", label: "Cryomancer", role: "Freeze Caster",
    movementBias: "hold", rangePref: "long",
    weakness: "Fire damage + cleanse",
    behaviorHints: ["Freezes before nuking", "Builds Ice barriers"],
    fieldDefault: "rime" },
  dreamweaver: { id: "dreamweaver", label: "Dreamweaver", role: "Sleep / Confuse Mystic",
    movementBias: "reposition", rangePref: "medium",
    weakness: "Sound and immunity to mind effects",
    behaviorHints: ["Lulls then feasts", "Refuses direct exchanges"],
    fieldDefault: "lull" },
  cataclysm: { id: "cataclysm", label: "Cataclysm", role: "Apocalyptic Threat",
    movementBias: "advance", rangePref: "global",
    weakness: "Tactical Anchor + sustain healers",
    behaviorHints: ["Channels area-wide ruin", "Phase 2 escalates dramatically"],
    fieldDefault: "cataclysm" },
};

// ── Shared boss field templates ─────────────────────────────────────────
// One per archetype family. Each is consumed by buildBossFieldOpts() to
// produce a record vbPlaceholderEnemyField will instantiate. Conservative
// `chain` values keep field intensity within the existing Field Clash
// math (light/heavy at chain >= 6).
export const BOSS_FIELD_TEMPLATES = {
  bulwark:       { name: "Bulwark Decree",   element: "Earth",     chain: 5, hint: "Stay mobile and pull from range while it's planted." },
  groundquake:   { name: "Quaking Ground",   element: "Earth",     chain: 6, hint: "Heavy tremors — keep shifting tiles or be crushed." },
  huntmark:      { name: "Hunter's Mark",    element: "Dark",      chain: 5, hint: "Bleed compounds while marked — guard, cleanse, or burst it down." },
  stormveil:     { name: "Stormveil",        element: "Lightning", chain: 6, hint: "Lightning lashes the open arena — close the gap." },
  hexlace:       { name: "Hex Lace",         element: "Arcane",    chain: 5, hint: "Status chances spike sharply — cleanse and brute through." },
  miasma:        { name: "Rotbloom Miasma",  element: "Poison",    chain: 6, hint: "Toxic fog — Cleansing Dust before pushing in." },
  voidrift:      { name: "Void Rift",        element: "Void",      chain: 6, hint: "Buffs decay quickly — recommit them under pressure." },
  judgmentglare: { name: "Judgment Glare",   element: "Light",     chain: 5, hint: "Heavy expose telegraphs — bait the strike then punish." },
  tide:          { name: "Tidedrown",        element: "Water",     chain: 6, hint: "Slowed every step — break free with Lightning or Fire." },
  rime:          { name: "Rime Cathedral",   element: "Ice",       chain: 6, hint: "Freeze pulses — cleanse Ice or stay mobile." },
  lull:          { name: "Lull Cathedral",   element: "Psychic",   chain: 5, hint: "Sleep / Confuse risk — keep one Sound or Light skill ready." },
  cataclysm:     { name: "Cataclysm Halo",   element: "Arcane",    chain: 7, hint: "Arena-wide ruin — Brace and Anchor before the second phase." },
};

// ── Boss identities ─────────────────────────────────────────────────────
// 40 entries (20 outpost + 20 rift). Each: arch (archetype id), arena
// (preferred arena id, must exist in arenaMaps), intro / phase1 / phase2
// (battle-log narration fragments — appended to the boss name), field
// (key into BOSS_FIELD_TEMPLATES), counter (counterplay hint string).
//
// Intro lines are written to read as: "✦ <Boss Name> <intro>"
// Phase lines read as: "👹 <Boss Name> <phase1>" / "⚠️ <Boss Name> <phase2>"
export const BOSS_IDENTITIES = {
  // ── OUTPOST BOSSES ────────────────────────────────────────────────────
  ironjaw:      { arch: "fortress",    arena: "broken_shrine",       intro: "plants its halberd and refuses to yield.",        phase1: "locks the line — every blow rings true.",         phase2: "abandons restraint and swings to kill.",            field: "bulwark",        counter: "Pull from range while it's planted." },
  silkweave:    { arch: "hexweaver",   arena: "abyssal_expanse",     intro: "raises gloved hands — strings shimmer in the air.", phase1: "begins twisting your reflexes with thread.",      phase2: "casts the curtain wide — the stage is hers.",       field: "hexlace",        counter: "Cleanse statuses early; never drift to sleep." },
  blazefury:    { arch: "predator",    arena: "ruined_courtyard",    intro: "erupts in a corona of cinders and roars.",        phase1: "ignites in earnest — sparks chase you down.",     phase2: "becomes a wildfire — the arena begins to burn.",    field: "huntmark",       counter: "Stack barrier; punish during haste downtime." },
  scylla:       { arch: "rotcourt",    arena: "moonlit_forest_hollow", intro: "hisses through fanged smile — the brood stirs.", phase1: "floods the air with venom motes.",                phase2: "sheds her court — every wound now festers.",        field: "miasma",         counter: "Carry Cleansing Dust; don't linger in mist." },
  gravewatch:   { arch: "hexweaver",   arena: "broken_shrine",       intro: "tolls a soundless bell — the air goes cold.",     phase1: "rings the mourning bell — your tempo slows.",     phase2: "reflects every hex back at its sender.",            field: "voidrift",       counter: "Avoid Sound/Dark while reflect is up." },
  stormmarshal: { arch: "tempest",     arena: "abyssal_expanse",     intro: "levels a crackling pike — sparks ride the wind.", phase1: "calls the tempest — every step crackles.",        phase2: "ascends in a halo of lightning — judgment falls.",  field: "stormveil",      counter: "Force melee; silence to break chain casts." },
  thornmatron:  { arch: "rotcourt",    arena: "moonlit_forest_hollow", intro: "unfurls thorned vines that hiss like serpents.", phase1: "weaves a verdant choir — the briars sing.",      phase2: "crowns herself in thorns — the court bleeds.",      field: "miasma",         counter: "Burst before regen stacks compound." },
  chalkseer:    { arch: "fortress",    arena: "broken_shrine",       intro: "chalks a sigil into the stone — runes ignite.",   phase1: "etches new wards — your spells go quiet.",        phase2: "shatters the seal — raw arcana spills out.",        field: "hexlace",        counter: "Spam basics during silence; burst when sigils crack." },
  floodjudge:   { arch: "tide",        arena: "rift_crater",         intro: "raises a black gavel above the rising tide.",     phase1: "renders verdict — the floor floods.",             phase2: "unleashes the leviathan beneath the law.",          field: "tide",           counter: "Stay mobile; lightning breaks tide locks." },
  hushsaint:    { arch: "hexweaver",   arena: "broken_shrine",       intro: "presses a finger to bone-white lips.",            phase1: "summons the silent nave — words die mid-cast.",   phase2: "opens the mute procession — the world stills.",     field: "voidrift",       counter: "Use weapons + items while silenced." },
  sandreaver:   { arch: "siege_brute", arena: "ruined_courtyard",    intro: "drags a stone maw through the dust.",             phase1: "rips up the quarry floor — debris flies.",        phase2: "becomes the avalanche itself.",                     field: "groundquake",    counter: "Kite the charge; punish the recovery." },
  glacierabbot: { arch: "cryomancer",  arena: "abyssal_expanse",     intro: "breathes frost across his prayer beads.",         phase1: "raises the white chapel of ice.",                 phase2: "intones the cold benediction — the floor freezes.", field: "rime",           counter: "Burn through the chapel; cleanse Freeze fast." },
  sunlancer:    { arch: "radiant",     arena: "broken_shrine",       intro: "levels a lance of dawnlight at your throat.",     phase1: "calls the dayshield — judgment looms.",           phase2: "declares mercyless noon — the sky burns down.",     field: "judgmentglare",  counter: "Bait the strike, sidestep, retaliate hard." },
  velvetfang:   { arch: "predator",    arena: "moonlit_forest_hollow", intro: "melts into the shadow between heartbeats.",    phase1: "begins the royal stalk — you can't see her.",     phase2: "sings the throat hymn — silence falls on prey.",    field: "huntmark",       counter: "Light/Fire skills strip her evasion." },
  mirebishop:   { arch: "rotcourt",    arena: "moonlit_forest_hollow", intro: "opens a censer that smells of grave-water.",   phase1: "preaches the rot sermon — toxin builds.",         phase2: "calls last communion — the swamp answers.",         field: "miasma",         counter: "Cleanse aggressively; don't tank poison ticks." },
  windvicar:    { arch: "tempest",     arena: "abyssal_expanse",     intro: "levitates on a cushion of howling wind.",         phase1: "opens the tailwind rite — speed doubles.",        phase2: "calls gale communion — the arena gusts.",           field: "stormveil",      counter: "Anchor and brace — prevent the kite." },
  steelmatron:  { arch: "fortress",    arena: "ruined_courtyard",    intro: "strikes a chain-baton against her armor.",        phase1: "calls citadel orders — the line tightens.",       phase2: "begins the anvil march — there is no retreat.",     field: "bulwark",        counter: "Burst her before fortify chains stack." },
  lunacensor:   { arch: "dreamweaver", arena: "abyssal_expanse",     intro: "drops a moonpale mask over a featureless face.",  phase1: "projects the dreamscreen — your aim wanders.",    phase2: "erases the court — your spells forget their names.", field: "lull",          counter: "Sound or Light burst breaks her dreamhold." },
  brazenidol:   { arch: "siege_brute", arena: "ruined_courtyard",    intro: "groans awake — molten brass weeps from its eyes.", phase1: "breathes the forge — the floor warps.",          phase2: "becomes the kiln — the arena glows red.",           field: "groundquake",    counter: "Water/Ice negate; avoid prolonged melee." },
  gravechorus:  { arch: "hexweaver",   arena: "broken_shrine",       intro: "lifts a choir of bone — the dirge begins.",       phase1: "intones the dirge of nails — bleed compounds.",   phase2: "tolls the last bell — the chamber rings.",          field: "voidrift",       counter: "Stop bleed stacks; silence the chorus when possible." },

  // ── RIFT BOSSES ───────────────────────────────────────────────────────
  entropy:        { arch: "cataclysm",   arena: "abyssal_expanse",       intro: "unfolds — the weave of the world flinches.",      phase1: "the engine turns — your stats decay each beat.",  phase2: "crowns itself in collapse — reality buckles.",      field: "cataclysm",      counter: "Anchor + sustain; never let it free-cast." },
  time:           { arch: "abyssal",     arena: "abyssal_expanse",       intro: "slows the moment — your breath falls behind.",    phase1: "opens the hourglass — your turns stretch thin.",  phase2: "levies the future tax — your cooldowns lengthen.",  field: "voidrift",       counter: "Brace and act on tempo — don't waste big skills." },
  null:           { arch: "abyssal",     arena: "abyssal_expanse",       intro: "sits the throne of unwritten things.",            phase1: "speaks null wave — your buffs dissolve.",         phase2: "declares sovereign rupture — the law breaks.",      field: "voidrift",       counter: "Reapply buffs after each pulse; burst windows are short." },
  reality:        { arch: "dreamweaver", arena: "abyssal_expanse",       intro: "warps the floor into a wrong angle.",             phase1: "twists the lattice — your aim misreads.",         phase2: "folds the world — the arena flips wrong.",          field: "lull",           counter: "Trust melee strikes when ranged math lies." },
  primal:         { arch: "predator",    arena: "moonlit_forest_hollow", intro: "draws breath that shakes the earth.",             phase1: "molts — its hide thickens, its strikes deepen.",  phase2: "begins the devouring stampede — flee or fall.",     field: "huntmark",       counter: "Bait the stampede, sidestep, then burst." },
  starhunger:     { arch: "cataclysm",   arena: "abyssal_expanse",       intro: "opens a maw lined with constellations.",          phase1: "pulls a meteor — the ceiling burns.",             phase2: "opens orbit — debris rains for many turns.",        field: "cataclysm",      counter: "Anchor + sustain; LoS won't save you." },
  mourningaxis:   { arch: "hexweaver",   arena: "broken_shrine",         intro: "spins on a soundless axis — bells ring backwards.", phase1: "tolls the bell of undoing — buffs falter.",      phase2: "completes the requiem spin — silence reigns.",      field: "hexlace",        counter: "Cleanse silence aggressively; weapons remain free." },
  crownofice:     { arch: "cryomancer",  arena: "abyssal_expanse",       intro: "crowns itself in white hunger — the air freezes.", phase1: "declares starfrost edict — freeze chance spikes.", phase2: "calls winter collapse — the floor turns to mirror.", field: "rime",          counter: "Fire burst + cleanse; never tank a Freeze." },
  deepjudge:      { arch: "tide",        arena: "rift_crater",           intro: "rises from black water — sea pressure hits first.", phase1: "renders abyss verdict — the tide rises.",        phase2: "summons the black undertow — drowning begins.",     field: "tide",           counter: "Stay mobile; lightning + status cleanse." },
  dreamcaul:      { arch: "dreamweaver", arena: "abyssal_expanse",       intro: "swaddles the chamber in velvet hush.",            phase1: "unfurls lull cathedral — sleep risk soars.",      phase2: "feasts on thought — your skill list dims.",         field: "lull",           counter: "Sound/Light burst; carry sleep cleanse." },
  gravitomb:      { arch: "siege_brute", arena: "abyssal_expanse",       intro: "plants its weight — the floor sinks an inch.",    phase1: "calls the weight of ages — every step costs.",    phase2: "opens singularity bite — gravity itself bites.",    field: "groundquake",    counter: "Trade ranged damage; never melee a singularity." },
  sunkenarchive:  { arch: "abyssal",     arena: "abyssal_expanse",       intro: "unrolls scrolls written in Voidtongue.",          phase1: "reads forgotten script — your skills go silent.", phase2: "redacts the future — your turns get rewritten.",    field: "voidrift",       counter: "Use weapons during silence; brute through scripts." },
  voidcathedral:  { arch: "abyssal",     arena: "abyssal_expanse",       intro: "raises a saintless wall — the choir is empty.",   phase1: "intones black mass — defenses thin.",             phase2: "declares apostate rupture — the wall fails inward.", field: "voidrift",      counter: "Stack barriers; cleanse expose between hits." },
  glassleviathan: { arch: "radiant",     arena: "abyssal_expanse",       intro: "unfolds a body of mirror-glass and dawn.",        phase1: "raises mirrorhide — your spells reflect back.",   phase2: "breathes prismatic bite — a thousand cuts.",        field: "judgmentglare",  counter: "Avoid Light skills until reflect drops." },
  plagestar:      { arch: "rotcourt",    arena: "moonlit_forest_hollow", intro: "radiates a fevered halo — the air turns septic.", phase1: "draws the toxic halo — poison stacks deepen.",    phase2: "calls septic rain — the arena rots.",               field: "miasma",         counter: "Cleansing Dust + range; don't dawdle in the halo." },
  tempestoracle:  { arch: "tempest",     arena: "abyssal_expanse",       intro: "reads the storm and points at your future.",      phase1: "chains the forecast — speed and stuns combine.",  phase2: "calls sky break — lightning blinds and crushes.",   field: "stormveil",      counter: "Silence early; force the oracle into melee." },
  namelessforge:  { arch: "fortress",    arena: "broken_shrine",         intro: "hammers an unnamed shape into the air.",          phase1: "recalls anvil memory — every blow stuns.",        phase2: "pours molten decree — the floor turns hot.",        field: "bulwark",        counter: "Kite during stun chains; burst between hammers." },
  verdantmaw:     { arch: "predator",    arena: "moonlit_forest_hollow", intro: "unhinges a jaw lined with bramble fangs.",        phase1: "feasts on roots — its hide regenerates.",         phase2: "swings the canopy slam — the ground caves.",        field: "huntmark",       counter: "Bleed cleanse + burst windows during regen lulls." },
  blackhorizon:   { arch: "abyssal",     arena: "abyssal_expanse",       intro: "draws a black line across the arena's edge.",     phase1: "cuts the horizon — line damage rises.",           phase2: "declares starless fall — light dies entirely.",     field: "voidrift",       counter: "Light skills counter; stay off the cut line." },
  palegeometry:   { arch: "hexweaver",   arena: "abyssal_expanse",       intro: "draws perfect angles in the air with nothing.",   phase1: "steals an angle — your aim drifts wrong.",        phase2: "completes the theorem — the floor proves itself.",  field: "hexlace",        counter: "Cleanse confuse; trust melee when math lies." },
};

// ── Generic enemy archetype mapping ────────────────────────────────────
// Routes the existing 8 enemy archetypeKey values + element fallback into
// one of the 12 archetype families above. Pure.
const GENERIC_ARCH_MAP = {
  mauler:    "siege_brute",
  bulwark:   "fortress",
  reaper:    "predator",
  hexcaller: "hexweaver",
  warden:    "fortress",
  oracle:    "hexweaver",
  mirage:    "dreamweaver",
  venin:     "rotcourt",
};

// ── Helpers ────────────────────────────────────────────────────────────
export function getBossIdentity(bossKey) {
  if (!bossKey) return null;
  return BOSS_IDENTITIES[bossKey] || null;
}

export function getBossArchetype(bossKey) {
  const id = getBossIdentity(bossKey);
  if (!id) return null;
  return ENEMY_ARCHETYPES[id.arch] || null;
}

export function getBossPreferredArenaId(bossKey) {
  const id = getBossIdentity(bossKey);
  return id ? id.arena : null;
}

export function getBossCounterplayHint(bossKey) {
  const id = getBossIdentity(bossKey);
  return id ? id.counter : null;
}

// Returns a pre-formatted intro line ready to push into the battle log,
// or null if the boss has no registered identity.
export function getBossIntroLine(enemy) {
  if (!enemy || !enemy.boss) return null;
  const id = getBossIdentity(enemy.bossKey);
  if (!id) return null;
  const nm = enemy.name || "The boss";
  return "✦ " + nm + " " + id.intro;
}

// Returns the identity-specific phase narration fragment (without name
// prefix) so the existing applyBossPhasePressure can keep its emoji +
// effect-name suffix consistent. Phase argument is "p1" or "p2".
export function getBossPhaseLine(enemy, phase) {
  if (!enemy || !enemy.boss) return null;
  const id = getBossIdentity(enemy.bossKey);
  if (!id) return null;
  if (phase === "p1") return id.phase1 || null;
  if (phase === "p2") return id.phase2 || null;
  return null;
}

// Conservative gate for boss field activation. Fires only on a fresh
// phase transition or as a one-time opener for cataclysm/tempest/abyssal
// archetypes. Per-enemy cooldown lives on `enemy.bossFieldCdUntilTurn`
// (transient — battle-only). Never activates if an enemy field already
// occupies the arena.
export function shouldActivateBossField(enemy, btl) {
  if (!enemy || !enemy.boss) return false;
  if (!btl) return false;
  if (btl.enemyField) return false;
  const tn = btl.tn || 0;
  const cdUntil = enemy.bossFieldCdUntilTurn || 0;
  if (tn < cdUntil) return false;
  const id = getBossIdentity(enemy.bossKey);
  if (!id) return false;
  const flags = enemy.hpPhaseFlags || {};
  const justEnteredP1 = !!flags.phase1 && !flags.phase2 && !enemy._bossFieldP1Done;
  const justEnteredP2 = !!flags.phase2 && !enemy._bossFieldP2Done;
  // Opener is restricted to the pre-phase window so it can only fire once
  // per battle (consumed via _bossFieldOpenerDone in markBossFieldActivated,
  // which is itself gated to the !phase1 && !phase2 branch).
  const opener = (enemy.bossTurns || 0) >= 4 && !enemy._bossFieldOpenerDone &&
    !flags.phase1 && !flags.phase2 &&
    (id.arch === "cataclysm" || id.arch === "tempest" || id.arch === "abyssal");
  return justEnteredP1 || justEnteredP2 || opener;
}

// Build the opts payload for vbPlaceholderEnemyField from a boss enemy.
// Returns null if the boss has no identity registered (caller falls back
// to the existing behaviour).
export function buildBossFieldOpts(enemy) {
  if (!enemy) return null;
  const id = getBossIdentity(enemy.bossKey);
  if (!id) return null;
  const tpl = BOSS_FIELD_TEMPLATES[id.field] || BOSS_FIELD_TEMPLATES.voidrift;
  return {
    id: enemy.bossKey + "_" + id.field,
    name: tpl.name,
    element: tpl.element,
    chain: tpl.chain,
    description: tpl.hint,
  };
}

export function describeBossFieldHint(enemy) {
  const id = getBossIdentity(enemy && enemy.bossKey);
  if (!id) return null;
  const tpl = BOSS_FIELD_TEMPLATES[id.field] || null;
  return tpl ? tpl.hint : null;
}

// Mark the activation flags on a boss enemy so shouldActivateBossField
// does not retrigger the same field. Returns a SHALLOW-PATCHED copy.
export function markBossFieldActivated(enemy, currentTn, cooldownTurns) {
  if (!enemy) return enemy;
  const flags = enemy.hpPhaseFlags || {};
  const next = { ...enemy };
  if (flags.phase2) next._bossFieldP2Done = true;
  else if (flags.phase1) next._bossFieldP1Done = true;
  else next._bossFieldOpenerDone = true;
  const tn = typeof currentTn === "number" ? currentTn : 0;
  const cd = typeof cooldownTurns === "number" ? cooldownTurns : 4;
  next.bossFieldCdUntilTurn = tn + cd;
  return next;
}

export function getEnemyArchetypeId(enemy) {
  if (!enemy) return null;
  if (enemy.boss) {
    const id = getBossIdentity(enemy.bossKey);
    if (id) return id.arch;
  }
  if (enemy.archetypeKey && GENERIC_ARCH_MAP[enemy.archetypeKey]) {
    return GENERIC_ARCH_MAP[enemy.archetypeKey];
  }
  const el = enemy.el || "";
  if (el === "Poison" || el === "Nature") return "rotcourt";
  if (el === "Ice")                       return "cryomancer";
  if (el === "Lightning" || el === "Wind") return "tempest";
  if (el === "Water")                     return "tide";
  if (el === "Light")                     return "radiant";
  if (el === "Void" || el === "Dark" || el === "Gravity") return "abyssal";
  if (el === "Psychic")                   return "dreamweaver";
  return "siege_brute";
}

export function getEnemyArchetype(enemy) {
  const aid = getEnemyArchetypeId(enemy);
  return aid ? ENEMY_ARCHETYPES[aid] : null;
}
