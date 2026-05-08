import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './game.css';


// ═══════════════════════════════════════════════════
// SHATTERED VEIL — Chronicles of the Rift v27
// ═══════════════════════════════════════════════════

const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const P = a => a[Math.floor(Math.random() * a.length)];
const C = (v, l, h) => Math.max(l, Math.min(h, v));
const ID = () => Math.random().toString(36).slice(2, 8);
const cyclePick = (arr, seed, mul = 1, add = 0) => arr[Math.abs(seed * mul + add) % arr.length];

// 16 ELEMENTS
const ELS = ["Fire","Water","Ice","Lightning","Earth","Wind","Light","Dark","Void","Nature","Metal","Poison","Psychic","Sound","Gravity","Arcane"];
const ELC = {Fire:"#e65100",Water:"#1565c0",Ice:"#4dd0e1",Lightning:"#ffd600",Earth:"#8d6e63",Wind:"#66bb6a",Light:"#fff176",Dark:"#9c27b0",Void:"#4a148c",Nature:"#2e7d32",Metal:"#78909c",Poison:"#ab47bc",Psychic:"#e040fb",Sound:"#26a69a",Gravity:"#455a64",Arcane:"#d500f9",Physical:"#90a4ae",Null:"#616161"};
const EL_IC = {"Fire":"🔥","Water":"💧","Ice":"❄️","Lightning":"⚡","Earth":"🪨","Wind":"🍃","Light":"✨","Dark":"🌑","Void":"🕳️","Nature":"🌿","Metal":"⚙️","Poison":"☠️","Psychic":"🧠","Sound":"🔔","Gravity":"🌀","Arcane":"💎","Physical":"⚔️","Null":"➖"};
const ELEMENT_ICON_PATH = (el) => `${import.meta.env.BASE_URL}el/${(el || "null").toLowerCase()}.png`;
const BOSS_PORTRAIT_PATH = (key) => `${import.meta.env.BASE_URL}boss/${key}.png`;
function ElementIcon({ el, size = 14, style }) {
  const safeEl = el || "Null";
  const [broken, setBroken] = React.useState(false);
  if (broken) return <span style={{ fontSize: Math.max(10, size - 2), lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}>{EL_IC[safeEl] || "➖"}</span>;
  return <img src={ELEMENT_ICON_PATH(safeEl)} alt={safeEl} draggable={false} onError={() => setBroken(true)} style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle", filter: "drop-shadow(0 0 2px rgba(0,0,0,0.4))", ...style }} />;
}
const EL_STR = {Fire:["Ice","Nature"],Water:["Fire","Poison"],Ice:["Wind","Nature"],Lightning:["Water","Metal"],Earth:["Lightning","Fire"],Wind:["Earth","Sound"],Light:["Dark","Void"],Dark:["Psychic","Light"],Void:["Light","Arcane"],Nature:["Water","Earth"],Metal:["Ice","Sound"],Poison:["Nature","Psychic"],Psychic:["Poison","Gravity"],Sound:["Psychic","Ice"],Gravity:["Wind","Lightning"],Arcane:["Void","Dark"]};
const FISH_TYPES = [
  {nm:"Ember Koi",el:"Fire",rr:3},{nm:"Lava Eel",el:"Fire",rr:2},
  {nm:"Tide Bass",el:"Water",rr:4},{nm:"Deep Angler",el:"Water",rr:2},
  {nm:"Frost Trout",el:"Ice",rr:3},{nm:"Glacier Pike",el:"Ice",rr:2},
  {nm:"Spark Minnow",el:"Lightning",rr:3},{nm:"Voltfin",el:"Lightning",rr:2},
  {nm:"Stone Carp",el:"Earth",rr:3},{nm:"Boulder Cod",el:"Earth",rr:2},
  {nm:"Breeze Salmon",el:"Wind",rr:3},
  {nm:"Halo Dace",el:"Light",rr:2},{nm:"Sunfin",el:"Light",rr:2},
  {nm:"Shadow Catfish",el:"Dark",rr:2},{nm:"Abyss Flounder",el:"Dark",rr:2},
  {nm:"Null Jellyfish",el:"Void",rr:1},{nm:"Rift Lamprey",el:"Void",rr:1},
  {nm:"Bloom Perch",el:"Nature",rr:3},{nm:"Vine Snapper",el:"Nature",rr:2},
  {nm:"Iron Barb",el:"Metal",rr:2},{nm:"Steel Marlin",el:"Metal",rr:2},
  {nm:"Toxic Puffer",el:"Poison",rr:2},
  {nm:"Mirage Shad",el:"Psychic",rr:1},
  {nm:"Echo Herring",el:"Sound",rr:2},
  {nm:"Dense Ray",el:"Gravity",rr:1},
  {nm:"Arcane Seahorse",el:"Arcane",rr:1},{nm:"Mystic Grouper",el:"Arcane",rr:1},
];
const EL_RES = {Fire:["Water","Earth"],Water:["Lightning","Nature"],Ice:["Fire","Metal"],Lightning:["Earth","Gravity"],Earth:["Wind","Nature"],Wind:["Ice","Gravity"],Light:["Psychic","Arcane"],Dark:["Light","Void"],Void:["Light","Arcane"],Nature:["Ice","Fire"],Metal:["Lightning","Sound"],Poison:["Water","Psychic"],Psychic:["Dark","Sound"],Sound:["Wind","Metal"],Gravity:["Psychic","Lightning"],Arcane:["Void","Dark"]};
const EL_WEAK_TO = ELS.reduce((acc, el) => { acc[el] = ELS.filter(src => (EL_STR[src] || []).includes(el)); return acc; }, {});
const INTERACTION_NAME_OVERRIDES = {
  guard_light:"Radiant Riposte", heal_setup:"Consecrated Opening", holy_bulwark:"Holy Bulwark", divine_smite:"Divine Smite", purify:"Purifying Grace", martyr:"Martyr's Resolve",
  dot_crit:"Mortal Wound", dark_chain:"Shadow Chain", ambush:"Ambush", blood_rush:"Blood Rush", blind_execute:"Blind Execute", shadow_step:"Shadow Step",
  tri_element:"Tri-Element Sigil", aoe_setup:"Cascade Burst", overflow:"Overflow", arcane_pierce:"Arcane Pierce", barrier_boost:"Barrier Boost", mage_spite:"Mage's Spite",
  heal_extend:"Grace Extension", smite_combo:"Sanctified Smite", overheal_shield:"Overflowing Grace", holy_siphon:"Holy Siphon", righteous:"Righteous Fury", devotion:"Devotion",
  mark_prey:"Mark Prey", nature_chain:"Wildchain", venom_strike:"Venom Strike", trap_combo:"Snare Rend", quick_draw:"Quick Draw", exploit_weakness:"Exploit Weakness",
  petal_storm:"Petal Storm", fan_flames:"Fan the Flames", sear:"Searing Pressure", ember_mend:"Ember Mend", blight:"Blight Bloom", smolder:"Smolder Guard",
  mirror_mastery:"Mirror Mastery", shatter_combo:"Shatter Combo", permafrost:"Permafrost", perfect_copy:"Perfect Copy", cold_dominion:"Cold Dominion", still_mirror:"Still Mirror",
  desperation:"Desperation", flame_strike:"Flame Strike", rebirth_surge:"Rebirth Surge", ember_recovery:"Ember Recovery", wildfire:"Wildfire", ash_harvest:"Ash Harvest",
  time_lock:"Time Lock", time_echo:"Time Echo", perfect_tempo:"Perfect Tempo", gravity_well:"Gravity Well", time_strip:"Time Strip", temporal_shield:"Temporal Shield",
  nightmare:"Nightmare Harvest", dark_illusion:"Devourer's Whisper", mind_break:"Mind Break", deep_nightmare:"Deep Nightmare", exploit_madness:"Exploit Madness", dream_ward:"Dream Ward",
  void_devour:"Void Devour", void_rend:"Void Rend", entropy:"Entropy Spiral", void_channel:"Void Channel", null_wave:"Null Wave", desperate_void:"Desperate Void",
  runic_slam:"Runic Slam", earth_ward:"Earth Ward", runic_foundation:"Runic Foundation", stored_energy:"Stored Energy", metal_bind:"Metal Bind", iron_fortress:"Iron Fortress",
  encore:"Encore", resonance:"Resonance", crescendo_buff:"Crescendo", dissonance:"Dissonance", rapid_verse:"Rapid Verse", harmony_share:"Harmony Share",
  gravity_crush:"Gravity Crush", quake_guard:"Quake Guard", singularity:"Singularity", crushing_pressure:"Crushing Pressure", heavy_strike:"Heavy Strike", gravity_wave:"Gravity Wave",
  echo_strike:"Echo Strike", crescendo:"Crescendo", shockwave:"Shockwave", reverb:"Reverb", sound_wave:"Sound Wave", amplify:"Amplify",
  web_combo:"Puppeteer's Web", thread_drain:"Thread Drain", tightened_strings:"Tightened Strings", exploit_weakness_dark:"Cruel Marionette", mind_puppet:"Mind Puppet", hidden_thread:"Hidden Thread",
  tidal_shatter:"Undertow Chorus", tidal_heal:"Tidal Embrace", healing_tide:"Healing Tide", deep_freeze:"Siren Undertow", wave_guard:"Breakwater Hymn", ocean_blessing:"Ocean Blessing",
  martial_flow:"Martial Flow", counter_strike:"Counter Strike", combo_fist:"Combo Fist", iron_fist:"Iron Fist", earth_fist:"Earth Fist", battle_flow:"Battle Flow",
  primal_surge:"Primal Surge", wild_magic:"Wild Magic", elemental_mastery:"Elemental Mastery", instinct:"Instinct", storm_caller:"Storm Caller", focused_shift:"Focused Shift",
  hex_feast:"Hex Feast", venom_curse:"Venom Curse", toxic_cycle:"Toxic Cycle", hex_strike:"Hex Strike", shadow_cut:"Shadow Cut", lingering_venom:"Lingering Venom",
  hot_streak:"Hot Streak", loaded_dice:"Loaded Dice", jackpot:"Jackpot", bounce_back:"Bounce Back", double_down:"Double Down", patience_pays:"Patience Pays"
};
function titleCaseWords(s) { return String(s || "").replace(/[_-]+/g, " ").replace(/\b\w/g, m => m.toUpperCase()).replace(/\s+/g, " ").trim(); }
function interactionDisplayName(key, ds) {
  const normalizedKey = String(key || "").trim().toLowerCase();
  if (INTERACTION_NAME_OVERRIDES[normalizedKey]) return INTERACTION_NAME_OVERRIDES[normalizedKey];
  if (normalizedKey) return titleCaseWords(normalizedKey);
  const lead = String(ds || "").split(":")[0].trim();
  return lead ? lead.charAt(0).toUpperCase() + lead.slice(1) : "Skill Interaction";
}
function normalizeAssignedInteractions(list) {
  const seen = new Set();
  return (list || []).filter(Boolean).map((x, i) => ({ ...x, k: x.k || ("interaction_" + i), nm: x.nm || interactionDisplayName(x.k, x.ds) })).filter(x => {
    const sig = String(x.k || x.nm || x.ds || "").trim().toLowerCase();
    if (!sig) return false;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}
const INTERACTION_PRIORITY_BY_CLASS = {
  paladin: {
    preferred: ["divine_smite", "holy_bulwark", "purify", "martyr"],
    discouraged: []
  },
  assassin: {
    preferred: ["ambush", "shadow_step", "blind_execute", "blood_rush"],
    discouraged: []
  },
  sorcerer: {
    preferred: ["tri_element", "overflow", "arcane_pierce", "mage_spite"],
    discouraged: []
  },
  priest: {
    preferred: ["smite_combo", "overheal_shield", "holy_siphon", "righteous"],
    discouraged: []
  },
  koen: {
    preferred: ["petal_storm", "fan_flames", "blight", "smolder"],
    discouraged: []
  },
  ranger: {
    preferred: ["mark_prey", "venom_strike", "quick_draw", "trap_combo"],
    discouraged: []
  },
  phoenix: {
    preferred: ["desperation", "flame_strike", "ember_recovery", "rebirth_surge"],
    discouraged: []
  },
  chrono: {
    preferred: ["time_lock", "time_echo", "perfect_tempo", "gravity_well"],
    discouraged: []
  },
  bard: {
    preferred: ["resonance", "rapid_verse", "harmony_share", "encore"],
    discouraged: []
  },
  sound: {
    preferred: ["echo_strike", "shockwave", "sound_wave", "amplify"],
    discouraged: []
  },
  dream: {
    preferred: ["nightmare", "deep_nightmare", "exploit_madness", "dream_ward"],
    discouraged: []
  },
  voidmage: {
    preferred: ["void_devour", "void_rend", "entropy", "void_channel"],
    discouraged: []
  },
  rune: {
    preferred: ["runic_slam", "runic_foundation", "stored_energy", "iron_fortress"],
    discouraged: []
  },
  gravity: {
    preferred: ["gravity_crush", "singularity", "crushing_pressure", "gravity_wave"],
    discouraged: []
  },
  shouei: {
    preferred: ["mirror_mastery", "shatter_combo", "permafrost", "perfect_copy", "cold_dominion", "still_mirror"],
    discouraged: []
  },
  puppet: {
    preferred: ["web_combo", "thread_drain", "tightened_strings", "mind_puppet"],
    discouraged: []
  },
  tide: {
    preferred: ["tidal_shatter", "tidal_heal", "healing_tide", "wave_guard"],
    discouraged: []
  },
  monk: {
    preferred: ["martial_flow", "counter_strike", "combo_fist", "battle_flow"],
    discouraged: []
  },
  primal: {
    preferred: ["primal_surge", "wild_magic", "focused_shift", "instinct", "storm_caller"],
    discouraged: []
  },
  hexblade: {
    preferred: ["hex_feast", "venom_curse", "hex_strike", "lingering_venom"],
    discouraged: []
  },
  gambler: {
    preferred: ["hot_streak", "loaded_dice", "double_down", "bounce_back"],
    discouraged: []
  }
};
function pickAssignedInteractions(list, count = 2, classId, seedOverride) {
  const normalized = normalizeAssignedInteractions(list);
  if (normalized.length <= count) return normalized.slice(0, count);
  const profile = INTERACTION_PRIORITY_BY_CLASS[classId] || null;
  const makeSeededRandom = (seedValue) => {
    let seed = 0;
    const src = String(seedValue == null ? "" : seedValue);
    for (let i = 0; i < src.length; i++) seed = ((seed * 31) + src.charCodeAt(i)) >>> 0;
    if (!seed) seed = 0x9e3779b9;
    return function() {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const shuffle = (arr, salt = "") => {
    const out = [...arr];
    const rnd = seedOverride == null ? Math.random : makeSeededRandom(String(seedOverride) + "|" + String(classId || "") + "|" + salt);
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  };
  if (!profile) return shuffle(normalized, "base").slice(0, count);
  const preferred = new Set(profile.preferred || []);
  const discouraged = new Set(profile.discouraged || []);
  const preferredPool = shuffle(normalized.filter(x => preferred.has(x.k)), "preferred");
  const neutralPool = shuffle(normalized.filter(x => !preferred.has(x.k) && !discouraged.has(x.k)), "neutral");
  const discouragedPool = shuffle(normalized.filter(x => discouraged.has(x.k)), "discouraged");
  return [...preferredPool, ...neutralPool, ...discouragedPool].slice(0, count);
}
function splitInteractionDescription(ds) {
  const txt = String(ds || "").trim();
  if (!txt) return { trigger: "No trigger data available.", effect: "No effect data available." };
  const m = txt.match(/^(.+?):\s*(.+)$/);
  if (m) return { trigger: m[1].trim(), effect: m[2].trim() };
  return { trigger: txt, effect: "Activates when the stated condition is met." };
}
function interactionPopupText(inter) {
  if (!inter) return "No interaction data available.";
  const nm = inter.nm || interactionDisplayName(inter.k, inter.ds);
  const parts = splitInteractionDescription(inter.ds || "");
  return [
    nm,
    "",
    "Trigger: " + parts.trigger,
    "Effect: " + parts.effect,
    "",
    "Primed interactions glow in the Tactical Readout. Glow means the precursor is already met. When the matching follow-up action is used, the interaction activates once, then resets until you prime it again.",
    "",
    "Tip: Assigned interactions are the only ones that can activate in battle."
  ].join("\n");
}
function hasBattleEffect(entity, fxId, opts) {
  const includeJustApplied = !opts || opts.includeJustApplied !== false;
  return ((entity?.efx) || []).some(ef => ef && ef.id === fxId && ((ef.tl == null) || ef.tl > 0) && (includeJustApplied || !ef.justApplied));
}
function hasAnyBattleEffect(entity, fxIds, opts) {
  return (fxIds || []).some(id => hasBattleEffect(entity, id, opts));
}
function estimateBattleSkillDamage(sk, actor, target, encounterMult = 1) {
  if (!sk || sk.t !== "damage" || !actor || !target) return null;
  const st = actor.st || actor;
  const base = ((sk.pow || 0) * 0.9 + (sk.el === "Physical" ? (st.atk || actor.atk || 0) * 0.9 : (st.mag || actor.mag || 0) * 0.84));
  return Math.max(1, Math.floor((base - (target.def || 0) * 0.14) * eMult(sk.el, target) * encounterMult));
}
function estimateBattleWeaponDamage(w, actor, target, encounterMult = 1) {
  if (!actor || !target) return null;
  if (w && w.isShield) return 0;
  const st = actor.st || actor;
  const fxKeys = gearEffects(w);
  const isPiercing = !!(w && fxKeys.includes("piercing"));
  return Math.max(1, Math.floor((((st.atk || actor.atk || 0) * 0.88) - (target.def || 0) * (isPiercing ? 0.12 : 0.3)) * eMult(w ? w.el : "Null", target) * encounterMult));
}

// elemental multiplier defined later with multi-element handling

// STATUS EFFECTS
const FXS = [
  {id:"burn",nm:"Burn",ic:"🔥",type:"dot",v:12,dur:3},{id:"freeze",nm:"Freeze",ic:"❄️",type:"skip",v:30,dur:2},
  {id:"poison",nm:"Poison",ic:"☠️",type:"dot",v:5,dur:5},{id:"stun",nm:"Stun",ic:"⚡",type:"skip",v:100,dur:1},
  {id:"confuse",nm:"Confuse",ic:"💫",type:"misc",v:0,dur:2},{id:"blind",nm:"Blind",ic:"🌑",type:"acc",v:30,dur:2},
  {id:"silence",nm:"Silence",ic:"🤐",type:"seal",v:0,dur:2},{id:"slow",nm:"Slow",ic:"🐌",type:"debuff",v:50,dur:3},
  {id:"weaken",nm:"Weaken",ic:"💔",type:"debuff",v:25,dur:3},{id:"expose",nm:"Expose",ic:"🔓",type:"debuff",v:25,dur:3},
  {id:"sleep",nm:"Sleep",ic:"💤",type:"skip",v:100,dur:2},{id:"bleed",nm:"Bleed",ic:"🩸",type:"dot",v:5,dur:4},
  {id:"curse",nm:"Curse",ic:"👁️",type:"debuff",v:15,dur:3},{id:"regen",nm:"Regen",ic:"💚",type:"hot",v:12,dur:3},
  {id:"shield",nm:"Shield",ic:"🛡️",type:"shield",v:40,dur:2},{id:"haste",nm:"Haste",ic:"💨",type:"buff",v:50,dur:3},
  {id:"empower",nm:"Empower",ic:"⬆️",type:"buff",v:25,dur:3},{id:"fortify",nm:"Fortify",ic:"🏰",type:"buff",v:25,dur:3},
  {id:"reflect",nm:"Reflect",ic:"🪞",type:"reflect",v:30,dur:2},{id:"barrier",nm:"Barrier",ic:"🔮",type:"shield",v:60,dur:1},
  {id:"thorns",nm:"Thorns",ic:"🌹",type:"counter",v:20,dur:3},{id:"nullify",nm:"Nullify",ic:"⭕",type:"immunity",v:0,dur:1},
  {id:"evasion",nm:"Evasion",ic:"👻",type:"dodge",v:40,dur:2},{id:"taunt",nm:"Taunt",ic:"😤",type:"misc",v:0,dur:2},
];
function FX(id) { return FXS.find(f => f.id === id); }

// BLOODMARKS — lineage traits chosen at character creation
const BLOODMARKS = [
  { id:"veilvein",  nm:"Veil-Veined",   ic:"✦",  cl:"#c688ff", stat:{mag:3,mp:25},        passive:"veil_surge",    ds:"An innate technique passed through the blood — your veins carry a thinner membrane between will and the Veil, and energy moves cheaper through you than through anyone else.",  passiveDesc:"Veil Surge: Your first Veil Magic each battle costs 0 MP." },
  { id:"stoneheart",nm:"Stoneheart",    ic:"🪨",  cl:"#9e8e78", stat:{def:3,hp:30},         passive:"iron_will",     ds:"An inherited body trait — your structure densifies under threat, the way some bloodlines reflexively reinforce themselves when their flame begins to gutter.",                  passiveDesc:"Iron Will: When HP drops below 25%, gain +15% effective DEF." },
  { id:"stormborn", nm:"Storm-Born",    ic:"⚡",  cl:"#ffd740", stat:{spd:4,atk:2},         passive:"lightning_step",ds:"An innate technique that runs the body's responses ahead of conscious thought. Your line moves before the moment lands — sometimes twice within it.",                            passiveDesc:"Lightning Step: 20% chance to act twice on any physical attack turn." },
  { id:"ashblood",  nm:"Ashblood",      ic:"🔥",  cl:"#ff7043", stat:{atk:3,mag:2},         passive:"ember_aura",    ds:"An inherited combustive technique. Heat rides quietly in your strikes, igniting on contact with anything tense enough to catch.",                                              passiveDesc:"Ember Aura: Physical attacks have a 15% chance to apply Burn for free." },
  { id:"frostmere", nm:"Frost-Mere",    ic:"❄️",  cl:"#80d8ff", stat:{mag:2,def:2,lck:1},  passive:"chill_field",   ds:"An ambient technique — the air around you cools without conscious cost, a passive territory of stillness that drags every enemy half a step behind.",                            passiveDesc:"Chill Field: Every 3rd turn, all enemies receive Slow at no MP cost." },
  { id:"voidtouched",nm:"Void-Touched", ic:"🌑",  cl:"#ce93d8", stat:{mag:4,hp:-10,lck:2}, passive:"void_gaze",     ds:"A rare ancestral imprint. Something on the other side of the Veil noticed your line once, and a thread of its silence has stayed in your eyes ever since.",                    passiveDesc:"Void Gaze: Damage skills have +10% chance to apply Silence." },
  { id:"goldensoul", nm:"Golden-Soul",  ic:"✨",  cl:"#f2c45c", stat:{lck:4,hp:15,mp:15},  passive:"fortune_flame", ds:"A subtle warping technique inherited from a charmed bloodline. Probability bends a little around your hands — coins land your way, doors stick on the right side.",            passiveDesc:"Fortune Flame: +20% gold from battles. +10% rare item drop chance." },
  { id:"tidesbrood", nm:"Tides-Brood", ic:"🌊",  cl:"#4dd0e1", stat:{mp:35,def:1,spd:1},  passive:"tidal_flow",    ds:"An innate cyclical technique. The deeper you are wounded, the more readily your reserves replenish — pressure becomes pressure converted.",                                  passiveDesc:"Tidal Flow: Recover 5 MP each time you take damage in battle." },
];
// PNG icon path for bloodmarks (filenames match bm.id)
const BM_ICON_PATH = (id) => (import.meta.env.BASE_URL || "/") + "bm/" + id + ".png";

// Class-specific bloodmark archetypes — each class instantiates 4 of these.
// Themed per class via cls.nm/cl/el. IDs encoded as cs_<classId>_<slot>.
const CLASS_BM_TEMPLATES = [
  { slot: 0, suffix: "Edge",    glyph: "⚔",
    statKey: "atk", statBonus: 4, secondary: "lck", secondaryBonus: 1,
    passive: "innate_strike",
    flavor: (c) => "An innate technique imprinted by your " + c.nm + " bloodline. Each opening strike carries the lineage's full weight.",
    desc:   (c) => c.nm + " Edge: First attack each battle deals +25% damage and cannot miss." },
  { slot: 1, suffix: "Bulwark", glyph: "🛡",
    statKey: "def", statBonus: 3, secondary: "hp", secondaryBonus: 25,
    passive: "innate_guard",
    flavor: (c) => "Your " + c.nm + " ancestors learned to densify the body the moment killing intent enters the room.",
    desc:   (c) => c.nm + " Bulwark: When struck above 50% HP, gain a 12% damage shield for 1 turn." },
  { slot: 2, suffix: "Tempo",   glyph: "⌁",
    statKey: "spd", statBonus: 4, secondary: "lck", secondaryBonus: 2,
    passive: "innate_tempo",
    flavor: (c) => "An inherited cadence — the " + c.nm + " line acts on the seam between heartbeats.",
    desc:   (c) => c.nm + " Tempo: 18% chance to act first regardless of speed comparison." },
  { slot: 3, suffix: "Conduit", glyph: "✦",
    statKey: "mag", statBonus: 3, secondary: "mp", secondaryBonus: 30,
    passive: "innate_conduit",
    flavor: (c) => "A signature unfolding. Your " + c.nm + " bloodline runs Veil energy at lower friction — most never feel it leave them.",
    desc:   (c) => c.nm + " Conduit: All skills cost 1 less MP (minimum 1)." },
];
function buildClassBloodmarks(cls) {
  if (!cls) return [];
  return CLASS_BM_TEMPLATES.map(t => ({
    id: "cs_" + cls.id + "_" + t.slot,
    nm: cls.nm + " " + t.suffix,
    ic: t.glyph,
    cl: cls.cl,
    cs: true,
    classId: cls.id,
    stat: { [t.statKey]: t.statBonus, [t.secondary]: t.secondaryBonus },
    passive: t.passive,
    ds: t.flavor(cls),
    passiveDesc: t.desc(cls),
  }));
}
function getBM(id) {
  if (!id) return null;
  const shared = BLOODMARKS.find(b => b.id === id);
  if (shared) return shared;
  if (id.indexOf("cs_") === 0) {
    const parts = id.split("_");
    // CLS is declared later in module-eval order, but getBM is only invoked at render time
    const cls = CLS.find(c => c.id === parts[1]);
    if (cls) return buildClassBloodmarks(cls).find(b => b.id === id) || null;
  }
  return null;
}

// RANKS — sorcerer grades, formally assessed by the covenants
const RANKS = [
  { nm:"Wanderer", min:1,  max:4,   ic:"🚶",  cl:"#aaaaaa", bonus:{}, ds:"Unranked. Untested. The covenants have not yet bothered to grade you, but the Veil already has your name on a list." },
  { nm:"Acolyte",  min:5,  max:9,   ic:"📿",  cl:"#78c7ff", bonus:{hp:10},          ds:"Grade four. Your first formal assessment is on file. The lower halls open to you, and an instructor has been quietly assigned." },
  { nm:"Disciple", min:10, max:14,  ic:"⚔️",  cl:"#66bb6a", bonus:{atk:2,def:1},    ds:"Grade three. Cleared for field assignments and rift entry. Restricted tomes can be requested. Most never advance past here." },
  { nm:"Seeker",   min:15, max:19,  ic:"🔍",  cl:"#ffd740", bonus:{mag:2,mp:20},     ds:"Grade two. The Veil thins around you in a way the assessors can measure. You are now expected to investigate, not merely survive." },
  { nm:"Warden",   min:20, max:24,  ic:"🛡️",  cl:"#ff9800", bonus:{def:3,hp:20},    ds:"Grade one. Trusted to hold a border alone. Wardens speak directly to the elders of every covenant — and are sometimes refused." },
  { nm:"Archon",   min:25, max:29,  ic:"🌟",  cl:"#f06292", bonus:{mag:3,atk:2,spd:2}, ds:"Special grade. Cited in the standing records of all five covenants. Capable of a partial Veil Expansion. Tracked, courted, feared." },
  { nm:"Fractured",min:30, max:999, ic:"✦",   cl:"#c688ff", bonus:{hp:30,mp:30,mag:4}, ds:"Beyond formal grade. One whose unfolded territory is permanent — the Veil no longer fully closes behind them. Few remain themselves at this height." },
];
function getRank(level) { return RANKS.find(r => level >= r.min && level <= r.max) || RANKS[0]; }
function getNextRankLevel(level) { const ci = RANKS.findIndex(r => level >= r.min && level <= r.max); return (ci >= 0 && ci < RANKS.length-1) ? RANKS[ci+1].min : null; }

// COVENANTS — the five sorcerer schools that train, grade, and dispatch veilworkers
const COVENANTS = [
  { id:"veilwatch",  nm:"The Veilwatch",      ic:"👁️", cl:"#c688ff", el:"Void",  statBonus:{mag:3,mp:20},    ds:"The oldest school, founded to study the Veil rather than wield it. They believe Veil Expansion should be observed, recorded, and — when necessary — quietly contained.",        guildBonus:"Rift missions grant +30% XP. Void element bonus stacks with class element bonus." },
  { id:"ironcrown",  nm:"Iron Crown",          ic:"👑",  cl:"#ff9800", el:"Earth", statBonus:{def:4,hp:25},    ds:"A traditionalist school of bound techniques and inherited weapons. Discipline first, talent second. Their assessors are notoriously hard to impress and harder to fool.",        guildBonus:"Outpost missions grant +40% gold. DEF gains +2 from all equipped armor pieces." },
  { id:"embersong",  nm:"Embersong Circle",    ic:"🔥",  cl:"#ff7043", el:"Fire",  statBonus:{atk:3,mag:2},    ds:"A combat-leaning school. They argue that an unfolded technique, openly used, is the only honest answer to a hostile Veil. They lose more students than they graduate.",          guildBonus:"Fire and Lightning skills deal +8% damage. Kill missions award bonus shards." },
  { id:"silkweb",    nm:"Silkweb Guild",       ic:"🕸️", cl:"#78c7ff", el:"Wind",  statBonus:{spd:4,lck:2},    ds:"A school of intelligence, infiltration, and quiet hands. They never expand a domain in public — they prefer to be the ones inside someone else's when it closes.",                guildBonus:"Evasion and dodge passives are 15% more effective. Arena challenge rewards doubled." },
  { id:"tidecall",   nm:"Tidecall Conclave",   ic:"🌊",  cl:"#4dd0e1", el:"Water", statBonus:{mp:30,mag:2},    ds:"A school of restorative technique and elemental balance. They mend what other covenants tear open, and quietly outlive most of them as a consequence.",                            guildBonus:"Healing skills are 20% more effective. Shrine blessings last an additional turn." },
];
function getCV(id) { return COVENANTS.find(c => c.id === id); }

// STATUS DESCRIPTIONS
const STATUS_DESC = {
  burn: "Deals 12 + 5% target max HP fire damage per turn for 3 turns. Scales with caster MAG.",
  freeze: "30% chance to skip the target's turn for 2 turns. Shatters on hit.",
  poison: "Deals 5 damage per turn, escalating +3 each tick, for 5 turns. Long and painful.",
  stun: "Target is paralyzed and skips their next turn. 100% skip chance.",
  confuse: "Target may attack allies or use random actions for 2 turns.",
  blind: "Reduces target's accuracy by 30% for 2 turns.",
  silence: "Seals skill usage for 2 turns. Target can only use weapons, Guard, items, and swap actions.",
  slow: "Reduces target's speed by 50% for 3 turns. Affects turn order.",
  weaken: "Reduces target's damage output by 25% for 3 turns.",
  expose: "Reduces target's defense by 25% for 3 turns. Increases damage taken.",
  sleep: "Target is asleep and skips turns for 2 turns. Breaks on damage.",
  bleed: "Deals 5 + 4% target max HP per turn for 4 turns. Ignores defense. Stacking bleeds add +2 flat dmg each.",
  curse: "Reduces all stats by 15% for 3 turns. Dark magic lingers.",
  regen: "Restores 12 HP per turn for 3 turns.",
  shield: "Reduces incoming damage by 40% for 2 turns.",
  haste: "Increases speed by 50% for 3 turns. Act first more often.",
  empower: "Increases damage output by 25% for 3 turns.",
  fortify: "Reduces incoming damage by 20% for 3 turns. Stacks with Shield.",
  reflect: "Returns 30% of damage taken back to attacker for 2 turns.",
  barrier: "Reduces incoming damage by 60% for 1 turn. Strongest defense.",
  thorns: "Deals 20% of damage taken back to melee attackers for 3 turns.",
  nullify: "Blocks the next status effect applied to you. 1 turn.",
  evasion: "40% chance to completely dodge incoming attacks for 2 turns.",
  taunt: "Forces enemies to target you for 2 turns. Draws aggro.",
  guard: "Reduces incoming damage by 20% for 3 turns. Basic defensive stance.",
};

const TAG_INFO = [
  { id: "damage", nm: "Damage", ds: "Direct HP loss." },
  { id: "aoe", nm: "AoE", ds: "Hits every living enemy." },
  { id: "heal", nm: "Heal", ds: "Restores HP." },
  { id: "buff", nm: "Buff", ds: "Improves your combat state or grants protection." },
  { id: "debuff", nm: "Debuff", ds: "Weakens the target or sets up combos." },
  { id: "dot", nm: "DoT", ds: "Deals damage over time each turn." },
  { id: "chain", nm: "Ult Chain", ds: "Use actions in the exact shown order to charge your ultimate. A wrong action resets progress." },
  { id: "status", nm: "Status", ds: "Burn, freeze, poison, stun, silence, copy/mirror, and similar effects apply extra pressure, control, or utility." },
];
function describeTags(sk) {
  if (!sk) return [];
  const tags = [];
  if (sk.t === "copy") tags.push("status");
  else if (sk.t) tags.push(sk.t);
  if (sk.aoe) tags.push("aoe");
  if (sk.fx) tags.push(FX(sk.fx)?.type === 'dot' ? 'dot' : 'status');
  return Array.from(new Set(tags));
}
function archiveTagInfoText(tagId) {
  const tag = TAG_INFO.find(t => t.id === tagId);
  return tag ? `${tag.nm}

${tag.ds}` : "No tag details available.";
}
function archiveEffectInfoText(effectId, durOverride) {
  if (!effectId) return "No effect details available.";
  const fx = FX(effectId);
  const nm = fx?.nm || effectId;
  const icon = fx?.ic ? (fx.ic + " ") : "";
  const desc = STATUS_DESC[effectId] || (nm + " effect.");
  const durText = durOverride ? `

Duration: ${durOverride} Turns` : "";
  return `${icon}${nm}

${desc}${durText}`;
}
function detectEffectKeysInText(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  return FXS.filter(f => lower.includes(f.id.toLowerCase()) || lower.includes(f.nm.toLowerCase())).map(f => f.id).slice(0, 3);
}
function tileDecor(tile) {
  if (!tile) return null;
  const b = tile.bio;
  const show = _h1(tile.x, tile.y) % 100;
  const pick = _h2(tile.x, tile.y);
  if (b === "forest") return show < 12 ? ["🍄","🌸","🐿️","🍂","🦌","🍃"][pick % 6] : null;
  if (b === "mountain") return show < 8 ? ["🪨","🦅","💎"][pick % 3] : null;
  if (b === "desert") return show < 7 ? ["🦂","🐪","💀"][pick % 3] : null;
  if (b === "snow") return show < 9 ? ["⛄","🐺","❅","✧"][pick % 4] : null;
  if (b === "swamp") return show < 8 ? ["🪷","🐸","🕸"][pick % 3] : null;
  if (b === "jungle") return show < 11 ? ["🦜","🐒","🌺","🦎"][pick % 4] : null;
  if (b === "volcanic") return show < 7 ? ["💀","🔶","🪨"][pick % 3] : null;
  if (b === "coast") return show < 6 ? ["🐚","🦀","🐟"][pick % 3] : null;
  if (b === "void") return show < 8 ? ["✦","💜","👁"][pick % 3] : null;
  if (b === "plains") return show < 10 ? ["🌾","🌻","🦋","🌼"][pick % 4] : null;
  return null;
}

// TOOLTIP COMPONENT
function Tooltip({ text, children, style }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({x:0,y:0});
  const ref = useRef(null);
  const tipId = useRef("tip_" + ID());
  const lastTouchRef = useRef(0);
  const toggleTip = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    window.dispatchEvent(new CustomEvent("sv-close-tooltips", { detail: tipId.current }));
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({x: r.left, y: r.top - 4});
    }
    setShow(s => !s);
  };
  const handleClick = (e) => {
    if (Date.now() - lastTouchRef.current < 320) return;
    toggleTip(e);
  };
  const handleTouchEnd = (e) => {
    lastTouchRef.current = Date.now();
    toggleTip(e);
  };
  useEffect(() => {
    const closeFromElsewhere = (ev) => {
      if (!ev || !ev.detail || ev.detail !== tipId.current) setShow(false);
    };
    window.addEventListener("sv-close-tooltips", closeFromElsewhere);
    return () => window.removeEventListener("sv-close-tooltips", closeFromElsewhere);
  }, []);
  useEffect(() => {
    if (!show) return;
    const close = () => setShow(false);
    const timer = setTimeout(() => window.addEventListener("click", close, { once: true }), 50);
    return () => { clearTimeout(timer); window.removeEventListener("click", close); };
  }, [show]);
  return (
    <span ref={ref} onClick={handleClick} onTouchEnd={handleTouchEnd} onPointerDown={e => e.stopPropagation()} style={{ cursor: "pointer", position: "relative", display: "inline-flex", touchAction: "manipulation", ...style }}>
      {children}
      {show && <span onClick={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()} style={{
        position: "fixed", left: Math.min(pos.x, window.innerWidth - 220), top: Math.max(4, pos.y - 50),
        background: "#1a1e38", border: "1px solid #3a3f62", borderRadius: 6, padding: "6px 10px",
        fontSize: 10, color: "#e4e4f0", maxWidth: 210, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
        lineHeight: 1.4, whiteSpace: "normal", pointerEvents: "auto"
      }}>{text}</span>}
    </span>
  );
}

// StatusTag - clickable status with tooltip
function StatusTag({ ef, showDur }) {
  const T = { bad: "#e53935", ok: "#43a047", wn: "#f9a825" };
  const desc = STATUS_DESC[ef.id] || (ef.nm + " effect for " + (ef.tl || ef.dur) + " turns.");
  const bgC = ef.type === "dot" ? T.bad + "22" : (ef.type === "buff" || ef.type === "hot" || ef.type === "shield" || ef.type === "dodge" || ef.type === "reflect" || ef.type === "counter" || ef.type === "immunity") ? T.ok + "22" : T.wn + "22";
  const txC = ef.type === "dot" ? T.bad : (ef.type === "buff" || ef.type === "hot" || ef.type === "shield" || ef.type === "dodge" || ef.type === "reflect" || ef.type === "counter" || ef.type === "immunity") ? T.ok : T.wn;
  return (
    <Tooltip text={<span><b>{ef.ic} {ef.nm}</b><br/>{desc}</span>}>
      <span className="tg" style={{ background: bgC, color: txC, fontSize: 6, cursor: "pointer" }}>
        {ef.ic}{ef.nm}{showDur !== false && ef.tl != null ? " · " + formatTurns(ef.tl) : ""}
      </span>
    </Tooltip>
  );
}

// ElementTag - clickable element showing strengths/weaknesses
function ElementTag({ el, showIcon = true, fontSize = 8 }) {
  const safeEl = el || "Null";
  const sec = elementSummarySections([safeEl], 3)[0] || { el: safeEl, dealMoreText: "None", takeMoreText: "None" };
  const popup = [
    safeEl,
    "",
    "Deals Additional Damage To: " + (sec.dealMoreText || "None"),
    "Takes Additional Damage From: " + (sec.takeMoreText || "None"),
    "",
    safeEl === "Null" ? "Null remains neutral at 100% in both directions." : "Only " + safeEl + "-aligned skills gain this attack advantage."
  ].join("\n");
  const iconSize = Math.max(10, Math.round(fontSize * 1.45));
  return (
    <Tooltip text={<span style={{ whiteSpace: "pre-wrap" }}>{popup}</span>}>
      <span className="tg" data-noswipe="1" style={{ background: (ELC[safeEl]||"#666") + "22", color: ELC[safeEl]||"#999", fontSize, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, pointerEvents: "auto" }}>
        {showIcon && <ElementIcon el={safeEl} size={iconSize} />}
        <span>{safeEl}</span>
      </span>
    </Tooltip>
  );
}

// 21 CLASSES (max 6 stars total per class for balance)
// Each class also has unique skill interactions (inter) instead of generic element-match
const CLS = [
  {id:"paladin",nm:"Paladin",ic:"🛡",el:"Light",el2:"Metal",st:{hp:140,mp:60,atk:15,def:16,spd:8,mag:11,lck:7},cl:"#fff176",ds:"Holy knight of radiant steel. Light/Metal bulwark who turns vows, judgment, and sanctified armor into frontline command.",stR:4,skR:2,inter:[{nm:"Radiant Riposte",ds:"Guard, then use a Light or Metal damage skill: +30% power and heal 10% HP",k:"guard_light"},{nm:"Consecrated Opening",ds:"Heal, then attack: target takes +20% damage for 1 turn",k:"heal_setup"},{nm:"Holy Bulwark",ds:"Guard twice in a row: gain Shield + Fortify",k:"holy_bulwark"},{nm:"Divine Smite",ds:"Hit a Stunned target with Light or Metal damage: +45% power",k:"divine_smite"},{nm:"Purifying Grace",ds:"While Shield is active, use a heal: the heal also cleanses 1 debuff",k:"purify"},{nm:"Martyr's Resolve",ds:"Below 40% HP, Guard: gain Regen for 3 turns",k:"martyr"}]},
  {id:"assassin",nm:"Assassin",ic:"🗡",el:"Dark",st:{hp:85,mp:75,atk:19,def:7,spd:21,mag:13,lck:14},cl:"#ce93d8",ds:"Nightblade executioner of pure Dark. Hunts isolated prey with poisons, blinds, ambushes, and ruthless finishers.",stR:4,skR:2,inter:[{nm:"Venom Finish",ds:"Apply Bleed or Poison, then attack: +35% crit damage",k:"dot_crit"},{nm:"Blackout",ds:"Use two Dark skills in a row: the second applies Blind",k:"dark_chain"},{nm:"Ambush",ds:"The first attack each battle is guaranteed to crit",k:"ambush"},{nm:"Blood Rush",ds:"Kill an enemy: gain Haste for 2 turns",k:"blood_rush"},{nm:"Blind Execute",ds:"Use a weapon strike on a Blinded target: +40% power",k:"blind_execute"},{nm:"Shadow Step",ds:"Use Evasion, then attack: that attack ignores 40% DEF",k:"shadow_step"}]},
  {id:"sorcerer",nm:"Sorcerer",ic:"🔮",el:"Arcane",st:{hp:78,mp:125,atk:6,def:6,spd:12,mag:23,lck:10},cl:"#d500f9",ds:"Pure Arcane archmage. Converts vast mana and refined spellcraft into burst casting, overflows, and elegant kill windows.",stR:1,skR:5,inter:[{nm:"Triune Casting",ds:"Use three different elements in a row: the third gains +40% power",k:"tri_element"},{nm:"Cataclysm Setup",ds:"Use a single-target skill, then an AoE skill: the AoE gains +20% power",k:"aoe_setup"},{nm:"Overflow",ds:"Spend 30 or more MP in one turn: your next skill costs 0 MP",k:"overflow"},{nm:"Arcane Pierce",ds:"Use two Arcane skills in a row: the second ignores 25% magic defense",k:"arcane_pierce"},{nm:"Barrier Conversion",ds:"Have Barrier active, then use a damage skill: +15% power",k:"barrier_boost"},{nm:"Mage's Spite",ds:"Hit a Silenced enemy with any spell: +50% power",k:"mage_spite"}]},
  {id:"priest",nm:"Priest",ic:"✝️",el:"Light",st:{hp:100,mp:110,atk:7,def:11,spd:10,mag:17,lck:12},cl:"#ffd54f",ds:"Beacon priest of covenant light. Pure Light support who restores, cleanses, wards, and punishes corruption with measured judgment and sacred pressure.",stR:2,skR:4,inter:[{nm:"Covenant Extension",ds:"Heal, then buff: the buff lasts +1 turn",k:"heal_extend"},{nm:"Radiant Judgment",ds:"Heal, then use a Light damage skill: +25% power and purge 1 enemy buff",k:"smite_combo"},{nm:"Grace Overflow",ds:"Heal a target already at full HP: the overheal becomes Shield instead",k:"overheal_shield"},{nm:"Holy Siphon",ds:"Have Regen active, then use a Light damage skill: heal for 15% of damage dealt",k:"holy_siphon"},{nm:"Righteous Fury",ds:"Cleanse a debuff, then attack: +20% power and apply Expose",k:"righteous"},{nm:"Devotion",ds:"Use three heals in one battle: all future heals gain +10% power",k:"devotion"}]},
  {id:"ranger",nm:"Ranger",ic:"🏹",el:"Nature",el2:"Wind",st:{hp:100,mp:72,atk:17,def:10,spd:17,mag:12,lck:12},cl:"#66bb6a",ds:"Versatile skirmisher of briar and gale. Nature/Wind hunter who sets up prey, then finishes with thornwind speed and precision.",stR:4,skR:2,inter:[{nm:"Mark Prey",ds:"Apply a debuff, then use a weapon strike: +30% power and apply Expose",k:"mark_prey"},{nm:"Wildchain",ds:"Use two Nature or Wind skills in a row: the second applies Poison",k:"nature_chain"},{nm:"Venom Strike",ds:"Hit a Poisoned target with a weapon strike: +25% power",k:"venom_strike"},{nm:"Snare Rend",ds:"Apply Slow, then attack: the attack also applies Bleed",k:"trap_combo"},{nm:"Quick Draw",ds:"Gain Haste, then use a weapon strike: the strike hits twice",k:"quick_draw"},{nm:"Exploit Weakness",ds:"Hit an Exposed target: gain +20% crit chance for that attack",k:"exploit_weakness"}]},
  {id:"koen",nm:"Kōen",ic:"🌸",el:"Fire",el2:"Nature",st:{hp:80,mp:115,atk:8,def:7,spd:14,mag:21,lck:11},cl:"#ff8a65",ds:"The Blazing Twin of Sien Risetsu. Fire/Nature caster who turns blossoms, burn pressure, and ruinous bloom into elegant explosive spell rhythm.",stR:2,skR:4,inter:[{nm:"Petal Storm",ds:"Use a Fire damage skill, then a Nature damage skill: the follow-up gains +30% power and becomes AoE",k:"petal_storm"},{nm:"Fan the Flames",ds:"Burn a target, then hit that same target again with Fire damage: +20% power and refresh Burn",k:"fan_flames"},{nm:"Searing Pressure",ds:"Use two Fire damage skills in a row: the second applies Expose",k:"sear"},{nm:"Ember Mend",ds:"Heal, then use a Fire damage skill: recover HP equal to 12% of damage dealt",k:"ember_mend"},{nm:"Blight Bloom",ds:"Apply Burn and Poison to the same target: both damage-over-time effects deal +40% tick damage",k:"blight"},{nm:"Smolder Guard",ds:"Guard, then use a Fire damage skill: that skill pierces 30% DEF",k:"smolder"}]},
  {id:"shouei",nm:"Shōuei",ic:"❄️",el:"Ice",el2:"Water",st:{hp:92,mp:98,atk:10,def:11,spd:15,mag:18,lck:10},cl:"#4dd0e1",ds:"The Cold Twin of the ancient and mysterious Sien Risetsu order. Shōuei wields a frost that doesn't burn — it erases. Twin flame of Kōen. Copies enemy abilities.",stR:3,skR:3,inter:[{nm:"Mirror Mastery",ds:"Use a copied skill, then use any copied skill again on a later copied action: the second copied use gains +40% power",k:"mirror_mastery"},{nm:"Shatter Combo",ds:"Freeze a target, then hit that same target with an Ice damage skill: +35% damage and consume Freeze",k:"shatter_combo"},{nm:"Permafrost",ds:"Use a Water skill, then an Ice damage skill: +22% power and applies Slow + Freeze",k:"permafrost"},{nm:"Perfect Copy",ds:"Use a copied skill that matches Shōuei's current attunement, is copied from a boss, or hits an element advantage: +24% base power",k:"perfect_copy"},{nm:"Cold Dominion",ds:"After you freeze an enemy in battle: Ice, Water, and copied damage skills gain +18% power",k:"cold_dominion"},{nm:"Still Mirror",ds:"Guard, then use a copied skill: that copied skill costs 0 MP and gains +15% power",k:"still_mirror"}]},
  {id:"phoenix",nm:"Phoenix Knight",ic:"🔥",el:"Fire",st:{hp:118,mp:80,atk:15,def:13,spd:12,mag:15,lck:9},cl:"#ff7043",ds:"Ash-forged Fire knight and remnant heir of Sien Risetsu. Fights through collapse, rebirth, and relentless flame pressure.",stR:4,skR:2,inter:[{nm:"Desperation",ds:"Drop below 30% HP: all Fire damage skills gain +40% power",k:"desperation"},{nm:"Cinder Rend",ds:"Burn a target, then use a weapon strike: the strike cashes out double Burn damage",k:"flame_strike"},{nm:"Rebirth Surge",ds:"Trigger Last Stand or revive: gain Empower + Regen for 3 turns",k:"rebirth_surge"},{nm:"Ember Recovery",ds:"Use two Fire skills in a row: the second heals 8% max HP",k:"ember_recovery"},{nm:"Wildfire Oath",ds:"Guard while an enemy is Burning: Burn spreads to all enemies",k:"wildfire"},{nm:"Ash Harvest",ds:"Kill an enemy with Fire damage: restore 15% max MP",k:"ash_harvest"}]},
  {id:"chrono",nm:"Chronomancer",ic:"⏳",el:"Arcane",el2:"Gravity",st:{hp:84,mp:108,atk:8,def:8,spd:19,mag:19,lck:11},cl:"#7e57c2",ds:"Arcane/Gravity time-savant. Controls tempo, delays, and compressed kill windows through speed magic and temporal pressure.",stR:2,skR:4,inter:[{nm:"Time Lock",ds:"Apply Slow, then deal damage: the target loses its next turn",k:"time_lock"},{nm:"Time Echo",ds:"Gain Haste on self, then attack: that attack hits twice at 60% each",k:"time_echo"},{nm:"Perfect Tempo",ds:"Use three different skills in a row without repeating: gain Haste for 2 turns",k:"perfect_tempo"},{nm:"Gravity Well",ds:"Use a Gravity skill on a Slowed target: +35% power and extend Slow by 1 turn",k:"gravity_well"},{nm:"Time Strip",ds:"Stun a target, then use an Arcane skill: ignore all target buffs",k:"time_strip"},{nm:"Temporal Shield",ds:"Guard, then gain Haste: Haste lasts +2 turns",k:"temporal_shield"}]},
  {id:"dream",nm:"Dreamweaver",ic:"🌙",el:"Psychic",st:{hp:86,mp:112,atk:7,def:8,spd:13,mag:21,lck:12},cl:"#ab47bc",ds:"Psychic medium bearing a sealed splinter of the Dream Devourer. Twists sleep, memory, and abyssal hunger into lucid battlecraft.",stR:2,skR:4,inter:[{nm:"Nightmare Harvest",ds:"Hit a Sleeping or Confused target with Psychic damage: +30% power and Sleep can linger 1 extra turn",k:"nightmare"},{nm:"Devourer's Whisper",ds:"Apply a debuff, then use a Null skill: +25% power and applies Curse",k:"dark_illusion"},{nm:"Mind Break",ds:"Use a Psychic damage skill after another Psychic skill: +18% power and 60% chance to Confuse",k:"mind_break"},{nm:"Deep Nightmare",ds:"Hit a target suffering both Sleep and Curse with Psychic damage: +34% power",k:"deep_nightmare"},{nm:"Exploit Madness",ds:"Use Psychic or Null damage on a Confused target: +26% power and applies Weaken",k:"exploit_madness"},{nm:"Dream Ward",ds:"Guard, then use a Psychic damage skill: +16% power and applies Sleep",k:"dream_ward"}]},
  {id:"voidmage",nm:"Void Mage",ic:"🕳️",el:"Void",st:{hp:76,mp:120,atk:6,def:6,spd:11,mag:24,lck:9},cl:"#4a148c",ds:"Forbidden Void savant. Abyssal executioner who devours buffs, silence windows, and cursed targets through void spellcraft.",stR:1,skR:5,inter:[{nm:"Void Devour",ds:"Use three Void skills in a row: the third devours 15% of target max HP",k:"void_devour"},{nm:"Void Rend",ds:"Silence an enemy, then use a Void damage skill: ignore 50% of their defense",k:"void_rend"},{nm:"Entropy",ds:"Apply Curse, then use a Void skill: +25% power and refresh Curse",k:"entropy"},{nm:"Void Channel",ds:"Have both Weaken and Curse on the same target: Void skills cost 30% less MP against that target",k:"void_channel"},{nm:"Null Wave",ds:"Use two Void skills in a row: the second has a 40% chance to Silence",k:"null_wave"},{nm:"Desperate Void",ds:"Drop below 20% HP: all Void skills gain +60% power",k:"desperate_void"}]},
  {id:"rune",nm:"Runekeeper",ic:"🔷",el:"Earth",el2:"Metal",st:{hp:118,mp:88,atk:13,def:15,spd:9,mag:14,lck:8},cl:"#78909c",ds:"Earth/Metal wardsmith. Fortress scribe who builds layered runic defenses, then converts stored protection into crushing seal-breaker blows.",stR:3,skR:3,inter:[{nm:"Runic Slam",ds:"Gain Shield or Fortify, then attack: that attack also applies Stun",k:"runic_slam"},{nm:"Earth Ward",ds:"Use two Earth or Metal skills in a row: the second grants Shield for 1 turn",k:"earth_ward"},{nm:"Runic Foundation",ds:"Guard, then use an Earth skill: +20% power",k:"runic_foundation"},{nm:"Stored Energy",ds:"Use three defensive actions in one battle: your next attack gains +50% power",k:"stored_energy"},{nm:"Metal Bind",ds:"Stun a target, then use a Metal skill: +30% power and extend Stun by 1 turn",k:"metal_bind"},{nm:"Iron Fortress",ds:"Have both Shield and Fortify active: reduce all damage taken by an extra 15%",k:"iron_fortress"}]},
  {id:"bard",nm:"War Bard",ic:"🎵",el:"Sound",el2:"Wind",st:{hp:94,mp:98,atk:11,def:10,spd:16,mag:16,lck:13},cl:"#26a69a",ds:"Battle minstrel of gale and rhythm. Sound/Wind hybrid who controls tempo, spreads party buffs, and turns momentum into explosive crescendos.",stR:3,skR:3,inter:[{nm:"Encore",ds:"Buff yourself or an ally, then debuff an enemy: the debuff lasts +2 turns",k:"encore"},{nm:"Resonance",ds:"Use a Sound skill, then a Wind skill: create Resonance for +20% all damage for 2 turns",k:"resonance"},{nm:"Crescendo",ds:"Use three buffs in one battle: future buffs last +1 turn",k:"crescendo_buff"},{nm:"Dissonance",ds:"Confuse a target, then use a Sound skill: +25% power and refresh Confuse chance",k:"dissonance"},{nm:"Rapid Verse",ds:"Have Haste active, then use a damage skill: hit twice at 50% each",k:"rapid_verse"},{nm:"Harmony Share",ds:"Debuff an enemy, then buff an ally: that buff also applies to one extra ally if present",k:"harmony_share"}]},
  {id:"gravity",nm:"Graviton",ic:"🌀",el:"Gravity",st:{hp:128,mp:78,atk:14,def:17,spd:7,mag:12,lck:8},cl:"#455a64",ds:"Pure Gravity juggernaut. Worldweight bruiser who bends space, denies movement, and turns defensive posture into collapse pressure.",stR:4,skR:2,inter:[{nm:"Gravity Crush",ds:"Apply Slow, then use a Gravity skill: +30% power and Stun for 1 turn",k:"gravity_crush"},{nm:"Quake Guard",ds:"Guard, then Guard again: the second Guard also deals 15% ATK damage to all enemies",k:"quake_guard"},{nm:"Singularity",ds:"Use three Guards in one battle: gain Barrier for 1 turn",k:"singularity"},{nm:"Crushing Pressure",ds:"Stun a target, then use a Gravity skill: +40% power",k:"crushing_pressure"},{nm:"Heavy Strike",ds:"Have Fortify active, then attack: that attack has a 30% chance to Slow",k:"heavy_strike"},{nm:"Gravity Wave",ds:"Use an AoE skill while Fortified: that AoE gains +25% power",k:"gravity_wave"}]},
  {id:"sound",nm:"Echo Mage",ic:"🔔",el:"Sound",st:{hp:86,mp:102,atk:9,def:9,spd:16,mag:19,lck:11},cl:"#26a69a",ds:"Pure Sound caster who weaponizes resonance, feedback, and silence. Cathedral-echo specialist who excels at tempo breaks and punishing disrupted foes.",stR:2,skR:4,inter:[{nm:"Echo Strike",ds:"Confuse a target, then use a Sound damage skill: hit twice at 50% each",k:"echo_strike"},{nm:"Crescendo",ds:"Use three Sound skills in one battle: the third Silences all enemies",k:"crescendo"},{nm:"Shockwave",ds:"Stun a target, then use a Sound skill: +30% power",k:"shockwave"},{nm:"Reverb",ds:"Use two Sound skills in a row: the second has a 40% chance to Confuse",k:"reverb"},{nm:"Sound Wave",ds:"Slow a target, then use a Sound skill: that skill becomes AoE",k:"sound_wave"},{nm:"Amplify",ds:"Have Reflect active, then use a Sound skill: reflected damage +50%",k:"amplify"}]},
  {id:"puppet",nm:"Puppeteer",ic:"🎭",el:"Dark",el2:"Psychic",st:{hp:88,mp:98,atk:12,def:9,spd:14,mag:18,lck:12},cl:"#8e24aa",ds:"Dark/Psychic puppeteer who wins by binding minds, stacking debuffs, and draining prey caught in soul-threads.",stR:3,skR:3,inter:[{nm:"Puppeteer's Web",ds:"Apply Curse, then Bleed: both damage-over-time effects deal +50% tick damage",k:"web_combo"},{nm:"Thread Drain",ds:"Apply Weaken, then deal damage: that hit also drains 8 MP",k:"thread_drain"},{nm:"Tightened Strings",ds:"Apply three debuffs in one battle: your next attack gains +45% power",k:"tightened_strings"},{nm:"Exploit Weakness",ds:"Use a Dark skill on a Weakened target: +30% power",k:"exploit_weakness_dark"},{nm:"Mind Puppet",ds:"Use a Psychic skill on a Cursed target: extend Curse by 2 turns",k:"mind_puppet"},{nm:"Hidden Thread",ds:"Guard, then apply a debuff: that debuff also applies Weaken for 1 turn",k:"hidden_thread"}]},
  {id:"tide",nm:"Tidesinger",ic:"🌊",el:"Water",el2:"Sound",st:{hp:106,mp:96,atk:10,def:12,spd:12,mag:17,lck:10},cl:"#0288d1",ds:"Sea-choir mage of tide and resonance. Water/Sound hybrid who bends currents, hymns, shields, and drowning pressure into flowing control.",stR:3,skR:3,inter:[{nm:"Undertow Chorus",ds:"Apply Slow, then use a Water or Sound damage skill: +28% power and restore 6 MP",k:"tidal_shatter"},{nm:"Tidal Embrace",ds:"Gain Shield, then heal: heal amount +40% and cleanse 1 debuff",k:"tidal_heal"},{nm:"Healing Tide",ds:"Use two Water or Sound support skills in a row: the second grants Regen for 2 turns",k:"healing_tide"},{nm:"Siren Undertow",ds:"Use a Sound skill on a Slowed target: guarantee Slow refresh and gain +25% power",k:"deep_freeze"},{nm:"Breakwater Hymn",ds:"Guard, then use a Water or Sound skill: heal 10% max HP and gain Shield",k:"wave_guard"},{nm:"Ocean Blessing",ds:"Use three heals or shields in one battle: future heals and shields gain +20% potency",k:"ocean_blessing"}]},
  {id:"monk",nm:"Iron Monk",ic:"👊",el:"Earth",st:{hp:122,mp:62,atk:18,def:14,spd:14,mag:10,lck:10},cl:"#8d6e63",ds:"Stone-body martial ascetic. Pure Earth brawler who strings guards, sutras, and stance discipline into brutal close-range pressure.",stR:5,skR:1,inter:[{nm:"Martial Flow",ds:"Use a weapon strike, then a skill: that skill scales from ATK instead of MAG",k:"martial_flow"},{nm:"Counter Strike",ds:"Guard, then use a weapon strike: +50% power and ignore 30% DEF",k:"counter_strike"},{nm:"Combo Fist",ds:"Use two weapon strikes in a row: the second gains +25% power",k:"combo_fist"},{nm:"Iron Fist",ds:"Stun a target, then use a weapon strike: +40% power",k:"iron_fist"},{nm:"Earth Fist",ds:"Have Fortify active, then use a weapon strike: 30% chance to Stun",k:"earth_fist"},{nm:"Battle Flow",ds:"Use three weapon strikes in one battle: gain Empower for 2 turns",k:"battle_flow"}]},
  {id:"primal",nm:"Primal Shifter",ic:"🐉",el:"Null",multiEl:true,st:{hp:102,mp:92,atk:13,def:11,spd:13,mag:17,lck:10},cl:"#ff6f00",ds:"Rolls 4 shifting elements each run, but always keeps a few core Null arts. Elemental attacks borrow techniques from the classes tied to its current roll.",stR:4,skR:3,inter:[{nm:"Primal Surge",ds:"Use 3 different shifted elements in one battle: the current elemental damage skill gains +35% power",k:"primal_surge"},{nm:"Wild Magic",ds:"Repeat the same element twice in a row: the second elemental damage skill gains +20% power and a random minor rider",k:"wild_magic"},{nm:"Elemental Mastery",ds:"Land damage with all 4 shifted elements in one battle: the next elemental damage skill gains +22% power and grants Barrier + Empower",k:"elemental_mastery"},{nm:"Instinct",ds:"Hit element advantage with an elemental damage skill: +20% power",k:"instinct"},{nm:"Storm Caller",ds:"Use a second AoE damage skill in the same battle: that AoE costs 25% less MP and gains +10% power",k:"storm_caller"},{nm:"Focused Shift",ds:"Guard, then use an elemental damage skill on your next offensive action: +15% power",k:"focused_shift"}]},
  {id:"hexblade",nm:"Hexblade",ic:"⚔️",el:"Poison",el2:"Dark",st:{hp:98,mp:88,atk:16,def:11,spd:13,mag:16,lck:11},cl:"#7b1fa2",ds:"Cursed duelist of venom and shadow. Poison/Dark hybrid who stacks afflictions, then cashes them out in brutal finishers.",stR:3,skR:3,inter:[{nm:"Hex Feast",ds:"Stack three damage-over-time effects on one target, then attack: +60% power",k:"hex_feast"},{nm:"Venom Curse",ds:"Apply Poison, then use a Dark skill: apply Curse for free",k:"venom_curse"},{nm:"Toxic Cycle",ds:"Apply Bleed, then Poison: refresh both and increase their tick damage by 20%",k:"toxic_cycle"},{nm:"Hex Strike",ds:"Use a weapon strike on a Cursed target: +30% power",k:"hex_strike"},{nm:"Shadow Cut",ds:"Use two Dark skills in a row: the second has a 40% chance to apply Bleed",k:"shadow_cut"},{nm:"Lingering Venom",ds:"Apply Weaken, then use a Poison skill: Poison duration +2 turns",k:"lingering_venom"}]},
  {id:"gambler",nm:"Gambler",ic:"🎲",el:"Arcane",el2:"Lightning",gamble:true,st:{hp:88,mp:82,atk:13,def:9,spd:15,mag:15,lck:18},cl:"#ffd600",ds:"Luck-bent Arcane/Lightning duelist. Rigs odds, swings between jackpots and misfires, and turns risk into explosive thunderbursts.",stR:3,skR:3,inter:[{nm:"Hot Streak",ds:"Win a lucky roll above 1.2×: your next skill costs 0 MP",k:"hot_streak"},{nm:"Loaded Dice",ds:"Use two skills in a row without a lucky roll: the third is guaranteed 1.5×",k:"loaded_dice"},{nm:"Jackpot",ds:"Win three lucky rolls in one battle: gain permanent +10% damage for that battle",k:"jackpot"},{nm:"Bounce Back",ds:"Roll below 0.8×: your next skill is guaranteed 1.3×",k:"bounce_back"},{nm:"Double Down",ds:"Use a weapon strike after a lucky roll: that strike deals double damage",k:"double_down"},{nm:"Patience Pays",ds:"After bad luck, Guard: restore 10% max MP",k:"patience_pays"}]},
];


function flavorPick(arr, seed) { return arr[Math.abs(seed) % arr.length]; }
const EL_WORDS = {
  Fire:["Cinder","Ember","Ashen","Inferno"], Water:["Tidal","Deepwater","Undertow","Mist"], Ice:["Rime","Frost","Glacial","Winter"], Lightning:["Storm","Volt","Thunder","Spark"],
  Earth:["Stone","Dust","Gravel","Root"], Wind:["Gale","Zephyr","Sky","Tempest"], Light:["Radiant","Dawn","Solar","Halo"], Dark:["Gloam","Night","Umbral","Shade"],
  Void:["Void","Null","Abyssal","Rift"], Nature:["Bloom","Wild","Verdant","Thorn"], Metal:["Iron","Steel","Forged","Titan"], Poison:["Venom","Blight","Toxic","Viper"],
  Psychic:["Dream","Mind","Astral","Veil"], Sound:["Echo","Resonant","Chorus","Sonic"], Gravity:["Graviton","Weight","Orbit","Singular"], Arcane:["Mystic","Runic","Aether","Arcanum"], Null:["Veiled","Pale","Silent","Hidden"]
};
const FX_WORDS = {
  burn:["Scorch","Kindle","Flare","Pyre"], freeze:["Rime","Frostbite","Shatter","Chill"], poison:["Venom","Blight","Toxin","Rot"], stun:["Shock","Crash","Bolt","Impact"],
  bleed:["Rend","Sever","Gash","Lacerate"], slow:["Snare","Drag","Weight","Drowse"], weaken:["Sunder","Sap","Crush","Frailty"], expose:["Fracture","Rupture","Open","Split"],
  blind:["Shade","Nightfall","Veil","Dusk"], confuse:["Discord","Delirium","Misrule","Static"], sleep:["Lull","Slumber","Dreamfall","Repose"], curse:["Hex","Doom","Malison","Bane"],
  regen:["Renewal","Bloom","Grace","Recovery"], shield:["Ward","Bulwark","Aegis","Shelter"], haste:["Quickening","Surge","Rush","Tempo"], empower:["Ascendance","Might","Crest","Surge"],
  fortify:["Bastion","Rampart","Bulwark","Hold"], reflect:["Mirror","Reversal","Prism","Return"], barrier:["Barrier","Sanctum","Halo","Wall"], thorns:["Briar","Thorn","Spine","Barb"],
  nullify:["Null","Silence","Seal","Ban"], evasion:["Afterimage","Slip","Fade","Phantom"], taunt:["Challenge","Provoke","Call","Roar"]
};
const CLASS_SKILL_NAME_THEMES = {
  paladin:{ heal:["Grace","Benediction","Mercy","Absolution"], buff:["Oath","Aegis","Bastion","Sanctuary"], debuff:["Censure","Sentence","Purge","Edict"], damage:["Smite","Judgement","Verdict","Dawnstrike"] },
  assassin:{ heal:["Bloodmend","Night Stitch","Red Quiet","Shadow Salve"], buff:["Veilstep","Murk Mantle","Ghost Rush","Nightcloak"], debuff:["Ruin Mark","Night Bane","Venom Mark","Execution Hex"], damage:["Sever","Ambush","Lacerate","Quietus"] },
  sorcerer:{ heal:["Astral Renewal","Prism Mend","Aether Surge","Starlit Grace"], buff:["Prism Ward","Arc Surge","Star Mantle","Aether Crown"], debuff:["Hexglass","Star Bane","Arcanum Break","Prism Curse"], damage:["Meteor","Nova","Vortex","Cataclysm"] },
  priest:{ heal:["Grace","Covenant Hymn","Mercy","Absolution"], buff:["Halo","Sanctuary","Benediction","Covenant Ward"], debuff:["Judgment","Rebuke","Censure","Light Sentence"], damage:["Ray","Judgment","Smite","Dawnfire"] },
  ranger:{ heal:["Field Mend","Wildroot Renewal","Huntrest","Trail Salve"], buff:["Predator's Pace","Windstep","Huntsman's Mantle","Wild Rally"], debuff:["Snare Mark","Thorn Hex","Venom Sign","Prey Mark"], damage:["Volley","Pierce","Barrage","Galeshot"] },
  koen:{ heal:["Ember Bloom","Petal Renewal","Scarlet Renewal","Hanabira Grace"], buff:["Bloomfire Mantle","Inferno Bloom","Scarlet Surge","Sunpetal Ward"], debuff:["Bloom Hex","Searing Blight","Scorch Bane","Petal Wither"], damage:["Inferno","Hanabira","Petalflare","Scarlet Bloomfall"] },
  shouei:{ heal:["Rime Mend","Mirror Melt","Frost Renewal","Silent Current"], buff:["Kagami Mantle","Rime Ward","Glacier Veil","Still Mirror"], debuff:["Frost Bind","Mirror Curse","Rime Hex","Cold Sentence"], damage:["Shard","Glacier","Shatter","Whiteout"] },
  phoenix:{ heal:["Ashen Renewal","Rebirth Grace","Embermend","Pyre Salve"], buff:["Cinder Halo","Wingguard","Pyre Mantle","Rebirth Ward"], debuff:["Ash Curse","Cinder Bane","Pyre Mark","Funeral Brand"], damage:["Pyre","Wingflare","Cinderfall","Ashburst"] },
  chrono:{ heal:["Recall","Rewind Grace","Second Chance","Time Mend"], buff:["Slipstream","Hourglass Ward","Paradox Mantle","Second Hand"], debuff:["Delay Mark","Paradox Bane","Clockbreak","Time Tax"], damage:["Paradox","Warp","Break","Hourstrike"] },
  dream:{ heal:["Lucid Renewal","Moonlit Grace","Dreammend","Velvet Rest"], buff:["Dream Veil","Lullaby Ward","Moon Mantle","Lucid Crown"], debuff:["Nightmare","Maw Whisper","Somnium Curse","Madness Bloom"], damage:["Reverie","Nightmare","Moonglass","Devourer"] },
  voidmage:{ heal:["Abyss Mend","Null Renewal","Vacuum Grace","Rift Salve"], buff:["Null Mantle","Abyss Ward","Void Crown","Rift Shelter"], debuff:["Entropy","Rift Bane","Abyss Curse","Null Edict"], damage:["Collapse","Devour","World Maw","Voidrend"] },
  rune:{ heal:["Seal Renewal","Rune Mend","Script Grace","Glyph Recovery"], buff:["Ward","Seal Mantle","Glyphwall","Rune Bastion"], debuff:["Seal Break","Script Bane","Etched Curse","Ward Tax"], damage:["Sigil","Glyph","Runeslam","Earthscript"] },
  bard:{ heal:["Refrain","Encore Grace","Cadence Mend","Ballad Renewal"], buff:["Chorus","March","Harmony Mantle","Crescendo Ward"], debuff:["Discord","Dissonance","Mute Verse","Tempo Break"], damage:["Aria","Refrain","Finale","Crescendo"] },
  gravity:{ heal:["Weightless Mend","Orbit Grace","Mass Renewal","Eventide Recovery"], buff:["Mass Mantle","Orbit Ward","Horizon Guard","Worldweight"], debuff:["Gravity Well","Orbit Tax","Pressure Mark","Collapse Bane"], damage:["Crush","Orbit","Singularity","Planetfall"] },
  sound:{ heal:["Resonant Mend","Echo Grace","Cathedral Renewal","Feedback Recovery"], buff:["Resonance","Echo Ward","Choir Mantle","Bellguard"], debuff:["Feedback","Mute Pulse","Dissonance","Sonic Bane"], damage:["Echo","Shockwave","Reverb","Worldsong"] },
  puppet:{ heal:["Thread Mend","Silk Repair","String Renewal","Soul Stitch"], buff:["Stringguard","Master's Mantle","Thread Ward","Stage Veil"], debuff:["Marionette Hex","Thread Bane","Soul String","Control Mark"], damage:["Threadrend","Curtainfall","Strings","Soul Lash"] },
  tide:{ heal:["Choir of Foam","Tide Renewal","Sea Grace","Blue Benediction"], buff:["Breakwater","Choir Ward","Siren Mantle","Ocean Guard"], debuff:["Undertow","Drowning Hymn","Current Bane","Siren Hex"], damage:["Undertow","Deluge","Breaker","Leviathan Hymn"] },
  monk:{ heal:["Breath Renewal","Temple Grace","Stone Mend","Lotus Recovery"], buff:["Stance","Iron Mantle","Temple Ward","Adamant Form"], debuff:["Palm Break","Discipline Mark","Stone Bane","Sutra Bind"], damage:["Palm","Rush","Fist","Heavenbreak"] },
  primal:{ heal:["Origin Renewal","Genesis Mend","Wild Grace","Firstblood Renewal"], buff:["Primal Nexus","Origin Mantle","Wild Surge","Genesis Guard"], debuff:["Chaos Howl","Rend Mark","Instinct Bane","Feral Break"], damage:["Genesis Fang","Rend","Tempest","Cataclysm"] },
  hexblade:{ heal:["Blood Feast","Maledict Renewal","Blightmend","Crimson Recovery"], buff:["Maledict Guard","Hex Mantle","Blight Ward","Scarlet Oath"], debuff:["Malediction","Venom Brand","Blight Curse","Ruin Mark"], damage:["Brand","Hexrend","Bloodletter","Banefall"] },
  gambler:{ heal:["Lucky Break","Jackpot Renewal","Second Chance","Loaded Grace"], buff:["Loaded Tempo","Ante Up","Wild Mantle","Fortune Ward"], debuff:["Bad Beat","Marked Odds","Crooked Hex","Rigged Curse"], damage:["Jackpot","Wildcard","High Roll","Thunder Flush"] }
};
function themedSkillName(orig, sk, clsId, idx) {
  const elWord = flavorPick(EL_WORDS[sk.el] || EL_WORDS.Null, idx);
  const fxKey = sk.fx2 || sk.fx || null;
  const fxWord = fxKey ? flavorPick(FX_WORDS[fxKey] || ["Burst","Lance","Pulse","Strike"], idx + 3) : null;
  const clsTheme = CLASS_SKILL_NAME_THEMES[clsId] || null;
  const pickClassWord = (kind, fallback) => {
    const arr = clsTheme && clsTheme[kind];
    if (arr && arr.length) return flavorPick(arr, idx + 5);
    return fallback;
  };
  if (sk.t === "copy") return "Mirror of Kagami";
  if (sk.t === "heal") {
    const healWord = pickClassWord("heal", flavorPick(["Maled","Renewal","Grace","Restoration"], idx + 1));
    return (sk.el !== "Null" ? elWord + " " : "") + healWord;
  }
  if (sk.t === "buff") {
    const buffWord = pickClassWord("buff", (fxWord || flavorPick(["Aura","Ward","Surge","Mantle"], idx + 2)));
    return (sk.el !== "Null" ? elWord + " " : "") + buffWord;
  }
  if (sk.t === "debuff") {
    const debuffWord = pickClassWord("debuff", (fxWord || flavorPick(["Hex","Bane","Wither","Affliction"], idx + 2)));
    return (sk.el !== "Null" ? elWord + " " : "") + debuffWord;
  }
  if (sk.t === "damage") {
    const noun = pickClassWord("damage", (fxWord || flavorPick(["Strike","Lance","Burst","Torrent","Volley"], idx + 4)));
    return (sk.aoe ? "Mass " : "") + (sk.el !== "Null" ? elWord + " " : "") + noun;
  }
  return orig;
}
const FX_WEAPON_PREFIX = {
  burn_on_hit:["Cinder","Ash","Scorch","Pyre"], freeze_on_hit:["Rime","Frost","Glacier","Chill"], poison_on_hit:["Venom","Blight","Toxin","Adder"],
  stun_on_hit:["Thunder","Shock","Crash","Tempest"], bleed_on_hit:["Rend","Gore","Sanguine","Sever"], lifesteal:["Reaver","Siphon","Leech","Harvest"],
  mp_drain:["Aether","Spellthief","Mana","Hex"], double_strike:["Twinfang","Split","Doubled","Mirror"], piercing:["Needle","Skewer","Impaler","Thorn"],
  heal_on_kill:["Harvest","Mercy","Reap","Lastlight"], crit_boost:["Gambit","Fortune","Chance","Lucky"], exp_boost:["Sage","Scholar","Pilgrim","Lore"],
  gold_boost:["Gilded","Coin","Prosper","Treasure"], thorns_on_hit:["Briar","Spine","Barb","Thorn"], shield_on_hit:["Ward","Guardian","Bastion","Keeper"],
  hp_regen:["Bloom","Vital","Maleder","Lifeward"], mp_regen:["Arcanum","Meditant","Runic","Aether"], def_boost:["Bastion","Stone","Bulwark","Iron"],
  spd_boost:["Swift","Gale","Quick","Slip"], lck_boost:["Fortune","Fate","Lucky","Chance"]
};
function themedWeaponName(w, tier) {
  const type = w.isShield ? flavorPick(["Aegis","Bulwark","Ward","Buckler"], tier) : (w.mag > w.atk ? flavorPick(["Rod","Wand","Staff","Scepter"], tier) : (w.spd >= 2 ? flavorPick(["Rapier","Dagger","Edge","Spear"], tier) : flavorPick(["Blade","Axe","Saber","Mace"], tier)));
  const prefixPool = w.fx ? (FX_WEAPON_PREFIX[w.fx] || (EL_WORDS[w.el] || EL_WORDS.Null)) : (EL_WORDS[w.el] || EL_WORDS.Null);
  const prefix = flavorPick(prefixPool, (tier || 1) + (w.atk || 0) + (w.mag || 0));
  return prefix + " " + type;
}

const FX_BURDEN = { burn:8, freeze:14, poison:9, stun:15, bleed:9, slow:8, weaken:8, expose:8, blind:9, confuse:11, sleep:14, curse:10, regen:9, shield:11, haste:10, empower:10, fortify:10, reflect:13, barrier:15, thorns:11, nullify:15, evasion:13, taunt:7, silence:13 };
function fxBurden(id){ return FX_BURDEN[id] || 8; }
function scaledDuration(id, mode){
  const heavy = new Set(["stun","freeze","sleep","silence","nullify","barrier","evasion","reflect"]);
  if (mode === "weaponShield") return 3 + R(0,1);
  if (heavy.has(id)) return mode === "heavy" ? 2 : 1;
  if (["burn","poison","bleed","regen","slow","weaken","expose","curse","thorns","fortify","haste","empower","shield"].includes(id)) return mode === "heavy" ? R(3,5) : R(2,3);
  return mode === "heavy" ? R(2,4) : R(1,2);
}
const ULT_CLASS_NAMES = {
  paladin:["Judgement of the First Dawn","Solar Testament","Bastion of the Final Oath","Crown of Radiant Verdict","Sanctum of the Last Oath","Heavenfall Adjudication","Dawnbringer's Dominion","Last Light Excommunication"],
  assassin:["Nightfall Severance","Throne of Shadows","Final Red Quietus","Crescent of the Silent Knife","Murder at Moon's End","Black Veil Decapitation","Court of Crimson Footsteps","The Last Unseen Cut"],
  sorcerer:["Astral Cataclysm","Arcanum Rupture","Prism of Oblivion","Meteoric Crownfall","Vortex of the Seventh Star","Eclipse of the Grand Arcanum","Heaven-Split Hex","Cosmic Glass Annihilation"],
  priest:["Covenant of Last Light","Cathedral of Mercy","Sacred Last Rites","Halo of the Dying Sun","Reliquary of Absolution","Benediction of the Final Covenant","Sanctified Worldshroud","The Final Miracle"],
  ranger:["Wild Hunt Dominion","Verdant Execution","Thorn-Crowned Tempest","Fangs of the Green Eclipse","Predator's Last Horizon","Canopy of Severed Winds","Kingdom of Briars","The Unerring Hunt"],
  koen:["Hanabira of the Scarlet Sun","Garden of the Last Cinder Bloom","Searing Crimson Bloom","Hanabira Cataclysm","Crown of Blazing Petals","Pyre of the Blooming World","Emberstorm Requiem","Inferno of Sien Risetsu"],
  shouei:["Mirror of Erased Winter","Cold Flame Requiem","Kagami of the Last Frost","Glass Moon Whiteout","Cathedral of Silent Snow","Frostflower Dissolution","Mirrorgrave Blizzard","Elegy of Sien Risetsu"],
  phoenix:["Ashen Sovereign Rebirth","Cinderwing Apotheosis","Pyre of the Last Knight","Crown of Immortal Embers","Ashfall Resurrection","Funeral Sun Ascendant","Wingbeat of the Burning King","Sien Risetsu Phoenix Rite"],
  chrono:["End of the Last Hour","Paradox Burial","Chronal Ruin","Clockface Catastrophe","Kingdom of Broken Seconds","Final Measure of Time","The Seventh Rewind","Eternity's Closing Bell"],
  dream:["Nightmare Sovereignty","Dream-Devourer Covenant","Moonlit Last Lullaby","Kingdom of Sleeping Teeth","The Final Reverie","Lunar Maw Catastrophe","Pale Sleep Dominion","Abyss of Velvet Eyes"],
  voidmage:["Abyssal Coronation","Null Throne Collapse","Last Mouth of the Rift","Vacuum King Devourer","The Hollow Horizon Opens","Cathedral of Nothing","Voidbirth Extinction","Entropic World Maw"],
  rune:["Runes of Final Sealing","Earthscript Dominion","Last Ward of Stone","Glyphstorm Entombment","Kingdom of Iron Runes","The Eighth Seal Falls","Bastion of the Buried World","Earthshard Excommunication"],
  bard:["Crescendo of the Final Sky","Resonant Dominion","Last Verse of War","Aria of the Broken Firmament","Choir of Ruined Kings","The World Ends in Chorus","Cathedral of Battle Songs","Encore of the Dying Wind"],
  gravity:["Singularity Judgement","Throne of Crushing Stars","Last Weight of Heaven","The Black Sun Descends","Crown of Impossible Mass","Planetfall Edict","Kingdom of Shattered Orbits","Worldweight of the Sky"],
  sound:["Cathedral of Echoes","Last Resonant Burial","Sonic Crownfall","Worldsong Detonation","The Seventh Reverberation","Choir of Broken Glass","Kingdom of Dissonant Thunder","Hush of the Final Bell"],
  puppet:["Grand Marionette Massacre","Strings of Final Ruin","Curtainfall Dominion","Theatre of Broken Souls","Kingmaker's Last String","Stage of Hollow Kings","Silkgrave Overture","Puppet God's Farewell"],
  tide:["Leviathan Hymn of the Last Sea","Undertow Coronation","Crown of the Drowning Choir","Kingdom Beneath the Tides","Siren Funeral Deluge","Oceanheart Catastrophe","Blue Cathedral Collapse","Tsunami of the Siren Choir"],
  monk:["Iron Lotus Catastrophe","Heaven-Breaking Palm","Last Temple Collapse","Fist of the Seventh Mountain","Kingdom of Empty Hands","Stoneblood Enlightenment","Palm of the Broken Gate","Earthshaker Ascetic Ruin"],
  primal:["Primal Apex Breaker","Cataclysm of First Beasts","Genesis of the Wild Flame","Kingdom of Ancient Fangs","The Howling World Returns","Crown of Four Tempests","Origin Beast Devastation","Nexus of the First Wilds"],
  hexblade:["Feast of the Scarlet Hex","Crown of Blighted Kings","Last Banefall","Throne of Corroded Blood","Poisonmoon Regicide","The Eighth Malediction","Hexstorm Communion","Bleak Harvest Dominion"],
  gambler:["Loaded Fate Extinction","House of Final Chances","Jackpot Apocalypse","Roulette of the Last Dawn","Crown of Crooked Fortune","All-In Armageddon","The Seventh Lucky Burial","Kingdom of Broken Odds"]
};
function ultimateNameFor(c, fx, chain, idx){
  const pool = ULT_CLASS_NAMES[c.id] || ["Cataclysm of the Shattered Veil","Final Veil Rupture","Apocalypse Canticle","Veilbreak of the End","Crown of the Last Sky","Doomsong of the Veil","Final Dominion of Ruin","Cathedral of the Last Veil"];
  const safeIdx = idx == null ? Math.floor(Math.random() * pool.length) : idx;
  return pool[safeIdx % pool.length];
}

function mkSkills(c) {
  const els = c.multiEl ? [...ELS].sort(() => Math.random() - 0.5).slice(0, 4) : [c.el, c.el2].filter(Boolean);
  const canNull = !c.multiEl || c.id === "primal";
  const sc = 1 + (c.st.mag * 0.01);
  const classThemes = {
    paladin:{damage:["stun","shield","expose"],buff:["shield","regen","fortify"],debuff:["weaken","expose"],suffix:["Smite","Judgment","Oath","Radiance","Sanctuary","Steel","Aegis","Purge"]},
    assassin:{damage:["bleed","poison","blind"],buff:["haste","evasion"],debuff:["bleed","poison","blind"],suffix:["Stab","Venom","Shadow","Mark","Eviscerate","Lacerate","Ambush","Cripple"]},
    sorcerer:{damage:["burn","stun","freeze"],buff:["empower","barrier"],debuff:["weaken","silence"],suffix:["Bolt","Wave","Nova","Torrent","Cascade","Vortex","Meteor","Prism"]},
    priest:{damage:["weaken","stun","silence"],buff:["regen","shield","barrier","empower"],debuff:["weaken","slow","silence"],suffix:["Ray","Grace","Hymn","Judgment","Radiance","Benediction","Prayer","Covenant"]},
    ranger:{damage:["poison","slow","bleed","expose"],buff:["haste","empower"],debuff:["poison","slow","expose"],suffix:["Shot","Trap","Vine","Volley","Snare","Barrage","Pierce","Gale"]},
    koen:{damage:["burn","burn","poison","expose"],buff:["empower","haste","regen"],debuff:["burn","weaken","expose","poison"],suffix:["Petal","Bloom","Hanabira","Flare","Inferno","Blossom","Scorch","Ember","Rosethorn","Sunpetal"]},
    shouei:{damage:["freeze","slow","bleed"],buff:["shield","barrier"],debuff:["freeze","slow","weaken"],suffix:["Frost","Mirror","Shard","Rime","Glacier","Crystal","Shatter","Frostbite"]},
    phoenix:{damage:["burn","burn","regen"],buff:["regen","empower","shield"],debuff:["burn","weaken"],suffix:["Flare","Rebirth","Wing","Pyre","Immolate","Rising","Cinder","Ignition"]},
    chrono:{damage:["slow","stun","weaken"],buff:["haste","evasion","empower"],debuff:["slow","stun","weaken"],suffix:["Loop","Break","Shift","Pulse","Rewind","Dilation","Warp","Paradox"]},
    dream:{damage:["sleep","confuse","curse","weaken"],buff:["empower","evasion","barrier"],debuff:["sleep","confuse","curse","weaken"],suffix:["Somnium","Reverie","Nightmare","Moonglass","Maw","Mirage","Trance","Devourer"]},
    voidmage:{damage:["curse","weaken","silence"],buff:["barrier","nullify"],debuff:["curse","weaken","silence"],suffix:["Collapse","Rift","Vacuum","Maw","Devour","Entropy","Abyss","Nullify"]},
    rune:{damage:["stun","weaken","shield"],buff:["fortify","shield","barrier"],debuff:["stun","weaken","expose"],suffix:["Seal","Sigil","Etch","Rune","Inscription","Glyph","Engrave","Ward"]},
    bard:{damage:["confuse","slow","weaken","expose"],buff:["haste","regen","empower"],debuff:["confuse","slow","weaken","expose"],suffix:["Chord","Refrain","Aria","Resonance","Ballad","Harmony","Discord","Tempo"]},
    gravity:{damage:["stun","slow","weaken"],buff:["fortify","barrier"],debuff:["stun","slow","weaken"],suffix:["Crush","Well","Pressure","Orbit","Collapse","Pull","Density","Impact"]},
    sound:{damage:["confuse","stun","slow","silence"],buff:["haste","reflect","evasion"],debuff:["confuse","stun","slow","silence"],suffix:["Echo","Pulse","Sonic","Hum","Shriek","Boom","Whisper","Feedback"]},
    puppet:{damage:["bleed","curse","weaken"],buff:["shield","empower"],debuff:["bleed","curse","weaken"],suffix:["Strings","Marionette","Thread","Command","Bind","Entangle","Control","Snare"]},
    tide:{damage:["slow","weaken","stun"],buff:["regen","shield","barrier"],debuff:["slow","weaken","confuse"],suffix:["Surge","Tide","Deluge","Current","Undertow","Hymn","Chorus","Breaker"]},
    monk:{damage:["stun","bleed","weaken"],buff:["fortify","haste","empower"],debuff:["stun","weaken","expose"],suffix:["Palm","Rush","Fist","Impact","Shatter","Stomp","Cleave","Break"]},
    primal:{damage:["burn","freeze","poison","stun","expose","weaken"],buff:["empower","haste","barrier","fortify"],debuff:["burn","freeze","poison","stun","slow","expose","weaken"],suffix:["Rend","Burst","Fracture","Claw","Surge","Eruption","Tempest","Fang","Howl","Genesis","Nexus","Cataclysm"]},
    hexblade:{damage:["poison","curse","bleed","weaken"],buff:["empower","thorns","shield"],debuff:["poison","curse","bleed","weaken"],suffix:["Hex","Brand","Sunder","Rend","Blight","Wither","Corrode","Fester"]},
    gambler:{damage:["burn","stun","confuse","expose"],buff:["empower","evasion","haste"],debuff:["confuse","blind","weaken"],suffix:["Jackpot","Wildcard","High Roll","Loaded Die","Bluff","Gambit","Ante","Thunder Flush"]},
  };
  const th = classThemes[c.id] || {damage:["burn","freeze","poison"],buff:["regen","shield"],debuff:["weaken","slow"],suffix:["Bolt","Wave","Lance","Storm","Ruin","Nova","Pierce","Fury"]};
  const mergeUnique = (groups) => { const seen = new Set(); return ([]).concat(...groups).filter(Boolean).filter(x => { const key = String(x).toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }); };
  const ELEMENT_THEME_DONORS = {
    Fire:["koen","phoenix"], Water:["tide","shouei"], Ice:["shouei"], Lightning:["sorcerer","sound"], Earth:["rune","monk"], Wind:["bard","ranger"],
    Light:["paladin","priest"], Dark:["assassin","puppet"], Void:["voidmage","dream"], Nature:["ranger","koen"], Metal:["rune","gravity"], Poison:["hexblade","assassin"],
    Psychic:["dream","puppet"], Sound:["bard","sound","tide"], Gravity:["chrono","gravity"], Arcane:["sorcerer","chrono"]
  };
  const donorIds = c.id === "primal" ? [...new Set((els || []).flatMap(el => ELEMENT_THEME_DONORS[el] || []).filter(id => classThemes[id]))] : [];
  const donorThemes = donorIds.map(id => classThemes[id]).filter(Boolean);
  const theme = c.id === "primal" ? {
    damage: mergeUnique([th.damage, ...donorThemes.map(x => x.damage)]),
    buff: mergeUnique([th.buff, ...donorThemes.map(x => x.buff)]),
    debuff: mergeUnique([th.debuff, ...donorThemes.map(x => x.debuff)]),
    suffix: mergeUnique([th.suffix, ...donorThemes.map(x => x.suffix)])
  } : th;
  const sk = [];
  const usedNames = new Set();
  const suffixPool = [...theme.suffix].sort(() => Math.random() - 0.5);
  var suffIdx = 0;
  for (var i = 0; i < 16; i++) {
    var isHeal = i === 4 || i === 11;
    var isBuff = i === 5 || i === 12;
    var isDebuff = i === 6 || i === 13;
    var isCopy = c.id === "shouei" && i === 15;
    var aoe = !isHeal && !isBuff && !isDebuff && !isCopy && i >= 10 && Math.random() > 0.68;
    var t = isCopy ? "copy" : isHeal ? "heal" : isBuff ? "buff" : isDebuff ? "debuff" : "damage";
    var isEffectHeavy = (i % 2 === 0);
    var pickEl = P(els);
    var forcePrimalNull = c.id === "primal" && (i === 5 || i === 6 || i === 12 || i === 14);
    var dreamNullBias = c.id === "dream";
    var sEl = forcePrimalNull ? "Null" : t === "buff" ? ((dreamNullBias ? Math.random() > 0.3 : Math.random() > 0.42) ? "Null" : pickEl) : t === "heal" ? ((dreamNullBias ? Math.random() > 0.25 : Math.random() > 0.35) ? "Null" : pickEl) : t === "debuff" ? ((dreamNullBias ? Math.random() > 0.42 : Math.random() > 0.5) ? "Null" : pickEl) : t === "copy" ? pickEl : (canNull && Math.random() > (c.id === "primal" ? 0.82 : dreamNullBias ? 0.78 : 0.9) ? "Null" : pickEl);
    var fx = null, fx2 = null, fxDur = null, fx2Dur = null;
    if (t === "damage") {
      fx = isEffectHeavy ? P(theme.damage) : (Math.random() > 0.62 ? P(theme.damage) : null);
      var burden = fx ? fxBurden(fx) : 0;
      var rawBase = isEffectHeavy ? R(24, 34) : R(38, 54);
      rawBase -= Math.floor(burden * (isEffectHeavy ? 0.7 : 0.5));
      if (c.id === "primal") rawBase += isEffectHeavy ? 7 : 10;
      if (c.id === "primal" && fx && isEffectHeavy) rawBase += 3;
      if (c.id === "dream" && sEl === "Null") rawBase += 3;
      if (!fx) rawBase += 4;
      if (aoe) rawBase = Math.floor(rawBase * (c.id === "primal" ? 0.84 : 0.78));
      var pow = Math.max(10, Math.floor(rawBase * sc));
      var mp = Math.max(6, Math.floor((pow / 5) + (fx ? burden / 3 : 0) + (aoe ? 3 : 0)));
      fxDur = fx ? scaledDuration(fx, isEffectHeavy ? "heavy" : "light") : null;
      var elPrefix = sEl === "Null" ? "" : sEl + " ";
      var nm = elPrefix + suffixPool[suffIdx % suffixPool.length]; suffIdx++;
      if (aoe) nm = "Mass " + nm;
      var base = nm; var u = 1; while (usedNames.has(nm)) { u++; nm = base + " " + ["II","III","IV","V"][u-2]; } usedNames.add(nm);
      nm = themedSkillName(nm, { t, el: sEl, fx, fx2, aoe }, c.id, i);
      sk.push({ id: c.id + "_s" + i, n: nm, el: sEl, pow, mp, t, fx, fx2, fxDur, fx2Dur, aoe, unlocked: false, equipped: false, lvl: 1 });
      continue;
    }
    if (t === "heal") {
      var healBase = R(26, 42) - (i % 3 === 0 ? 2 : 0);
      var pow = Math.max(18, Math.floor(healBase * (1 + c.st.mag * 0.02)));
      var mp = Math.max(8, Math.floor(pow / 4));
      var healNames = ["Heal","Restore","Maled","Rejuvenate","Salve","Balm","Renewal","Recovery"]; var nm = healNames[i % healNames.length];
      nm = themedSkillName(nm, { t, el: sEl, fx:null, fx2:null, aoe:false }, c.id, i);
      sk.push({ id: c.id + "_s" + i, n: nm, el: sEl, pow, mp, t, fx:null, fx2:null, fxDur:null, fx2Dur:null, aoe:false, unlocked:false, equipped:false, lvl:1 });
      continue;
    }
    if (t === "buff") {
      fx = P(theme.buff);
      fx2 = Math.random() > 0.48 ? P(theme.buff.filter(x => x !== fx)) : null;
      fxDur = scaledDuration(fx, fx2 ? "light" : "heavy");
      fx2Dur = fx2 ? scaledDuration(fx2, "light") : null;
      var burden = fxBurden(fx) + (fx2 ? Math.floor(fxBurden(fx2) * 0.6) : 0);
      var mp = Math.max(8, Math.floor(8 + burden / 2));
      var buffNames = ["Ward","Bolster","Aegis","Focus","Surge","Rally","Aura","Mantle"]; var nm = buffNames[i % buffNames.length];
      nm = themedSkillName(nm, { t, el: sEl, fx, fx2, aoe:false }, c.id, i);
      sk.push({ id: c.id + "_s" + i, n: nm, el: sEl, pow:0, mp, t, fx, fx2, fxDur, fx2Dur, aoe:false, unlocked:false, equipped:false, lvl:1 });
      continue;
    }
    if (t === "debuff") {
      fx = P(theme.debuff);
      fx2 = Math.random() > 0.52 ? P(theme.debuff.filter(x => x !== fx)) : null;
      fxDur = scaledDuration(fx, fx2 ? "light" : "heavy");
      fx2Dur = fx2 ? scaledDuration(fx2, "light") : null;
      var burden = fxBurden(fx) + (fx2 ? Math.floor(fxBurden(fx2) * 0.6) : 0);
      var mp = Math.max(8, Math.floor(8 + burden / 2));
      var debNames = ["Hex","Curse","Drain","Corrode","Fear","Wither","Bane","Afflict"]; var nm = debNames[i % debNames.length];
      nm = themedSkillName(nm, { t, el: sEl, fx, fx2, aoe:false }, c.id, i);
      sk.push({ id: c.id + "_s" + i, n: nm, el: sEl, pow:0, mp, t, fx, fx2, fxDur, fx2Dur, aoe:false, unlocked:false, equipped:false, lvl:1 });
      continue;
    }
    if (t === "copy") {
      sk.push({ id: c.id + "_s" + i, n: "Mirror of Kagami", el: sEl, pow:0, mp:16, t, fx:null, fx2:null, fxDur:null, fx2Dur:null, aoe:false, unlocked:false, equipped:false, lvl:1 });
    }
  }
  if (c.id === "primal") {
    const getEfDur = (id, fallback) => ((FX(id) && FX(id).dur) || fallback || 2);
    if (sk[5]) sk[5] = { ...sk[5], n: "Primal Nexus", el: "Null", t: "buff", fx: "empower", fx2: "barrier", fxDur: 2, fx2Dur: 1, aoe: false, mp: Math.max(8, sk[5].mp || 10), pow: 0 };
    if (sk[6]) sk[6] = { ...sk[6], n: "Chaos Howl", el: "Null", t: "debuff", fx: "weaken", fx2: "slow", fxDur: 3, fx2Dur: 2, aoe: false, mp: Math.max(8, sk[6].mp || 10), pow: 0 };
    if (sk[12]) sk[12] = { ...sk[12], n: "Origin Mantle", el: "Null", t: "buff", fx: "fortify", fx2: "haste", fxDur: 2, fx2Dur: 2, aoe: false, mp: Math.max(8, sk[12].mp || 10), pow: 0 };
    if (sk[14]) sk[14] = { ...sk[14], n: "Genesis Fang", el: "Null", t: "damage", pow: Math.max((sk[14].pow || 0), 66), mp: Math.max(10, sk[14].mp || 12), fx: sk[14].fx || "expose", fx2: null, fxDur: getEfDur(sk[14].fx || "expose", 2), fx2Dur: null, aoe: false };
  }
  var idx = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].sort(function(){ return Math.random() - 0.5; });
  for (var j = 0; j < 3; j++) { sk[idx[j]].unlocked = true; sk[idx[j]].equipped = true; }
  if (c.multiEl) sk._els = els;
  return sk;
}

function mkPassives(c) {
  const classPools = {
    paladin:[{ nm:"Solar Testament", ds:"Start battle with Shield for 2 turns and Light/Metal skills gain +8% power while Shield holds", ef:"start_shield" },{ nm:"Sanctified Steel", ds:"+12% Light/Metal and weapon damage", ef:"holy_edge" },{ nm:"Guardian Core", ds:"+18% max HP", ef:"hp" },{ nm:"Martyr Crown", ds:"Survive fatal blow once at 1 HP and gain Regen for 2 turns", ef:"laststand" }],
    assassin:[{ nm:"Backstab Instinct", ds:"+18% damage to Exposed or debuffed targets", ef:"assassin_bonus" },{ nm:"Blurstep", ds:"Start battle with Evasion for 2 turns", ef:"start_evasion" },{ nm:"Quietus Script", ds:"+20% crit chance and +10% damage against Blinded foes", ef:"crit" },{ nm:"Blood Rush", ds:"+4 Speed", ef:"spd" }],
    sorcerer:[{ nm:"Seventh Star Engine", ds:"+22% max MP and the first Arcane damage skill each battle gains +12% power", ef:"mp" },{ nm:"Arcane Overdrive", ds:"+16% spell damage", ef:"spell_boost" },{ nm:"Barrier Script", ds:"Start battle with Barrier for 1 turn", ef:"start_barrier" },{ nm:"Mana Well", ds:"Recover 4% MP each turn", ef:"mana_regen" }],
    priest:[{ nm:"Grace of Dawn", ds:"Start battle with Regen for 3 turns", ef:"start_regen" },{ nm:"Covenant Hymn", ds:"Healing skills gain +20% power and Light support costs 10% less MP", ef:"heal_boost" },{ nm:"Mercy Reliquary", ds:"+4 Defense and +10% cleanse strength", ef:"def" },{ nm:"Blessed Reserve", ds:"+15% max HP and MP", ef:"hybrid_pool" }],
    ranger:[{ nm:"Predator Mark", ds:"+15% damage after applying a debuff", ef:"setup_bonus" },{ nm:"Fleetfoot", ds:"+4 Speed", ef:"spd" },{ nm:"Wild Precision", ds:"+14% Nature/Wind damage", ef:"dual_elboost" },{ nm:"Canopy Veil", ds:"Start battle with Evasion for 2 turns and gain +8% crit chance while Evasion lasts", ef:"start_evasion" }],
    koen:[{ nm:"Bloomfire Heart", ds:"Burn effects deal +4 damage and burn-based skill interactions hit harder", ef:"burn_boost" },{ nm:"Scarlet Overgrowth", ds:"+18% spell damage, -2 Defense", ef:"glass" },{ nm:"Petal Velocity", ds:"+4 Speed", ef:"spd" },{ nm:"Hanabira Reservoir", ds:"+18% max MP", ef:"mp" }],
    shouei:[{ nm:"Perfect Recall", ds:"Copied skills keep 12 uses between battles", ef:"copy_mastery" },{ nm:"Mirror Skin", ds:"Start battle with Reflect for 2 turns", ef:"start_reflect" },{ nm:"Cold Focus", ds:"+14% Ice damage", ef:"elboost" },{ nm:"Frost Veil", ds:"+4 Defense", ef:"def" }],
    phoenix:[{ nm:"Ash Rebirth", ds:"Survive fatal blow once at 1 HP", ef:"laststand" },{ nm:"Cinderheart", ds:"Start battle with Regen for 3 turns", ef:"start_regen" },{ nm:"Blazing Edge", ds:"+14% Fire damage", ef:"elboost" },{ nm:"Warheat", ds:"+15% max HP", ef:"hp" }],
    chrono:[{ nm:"Time Dilation", ds:"Start battle with Haste for 3 turns", ef:"start_haste" },{ nm:"Perfect Sequence", ds:"Ultimate chains require 1 fewer step (min 3)", ef:"ult_chain_reduce" },{ nm:"Chrono Reserve", ds:"+18% max MP", ef:"mp" },{ nm:"Slipstream", ds:"+4 Speed", ef:"spd" }],
    dream:[{ nm:"Devourer's Echo", ds:"+18% damage to sleeping, confused, or cursed foes", ef:"dream_bonus" },{ nm:"Night Reservoir", ds:"+18% max MP and recover 3% MP each turn", ef:"mp" },{ nm:"Lucid Veil", ds:"Start battle with Evasion for 2 turns", ef:"start_evasion" },{ nm:"Oneiric Core", ds:"+14% Psychic damage", ef:"elboost" }],
    voidmage:[{ nm:"Entropy", ds:"Debuffs last +1 turn", ef:"debuff_plus" },{ nm:"Abyssal Reserve", ds:"+20% max MP", ef:"mp" },{ nm:"Null Mantle", ds:"Start battle with Nullify for 1 turn and gain +10% damage against buffed foes", ef:"start_nullify" },{ nm:"Vacuum Mind", ds:"+16% spell damage", ef:"spell_boost" }],
    rune:[{ nm:"Stone Script", ds:"Start battle with Fortify for 3 turns", ef:"start_fortify" },{ nm:"Chain Sigils", ds:"Skill interaction bonuses last until consumed", ef:"persistent_bonus" },{ nm:"Runed Armor", ds:"+4 Defense", ef:"def" },{ nm:"Bastion Scripture", ds:"+14% Earth/Metal damage and +8% weapon damage while Fortify is active", ef:"dual_elboost" }],
    bard:[{ nm:"Crescendo March", ds:"Start battle with Empower for 3 turns", ef:"start_empower" },{ nm:"Encore Engine", ds:"Buff skills cost 20% less MP and extend Haste by 1 turn", ef:"buff_discount" },{ nm:"Harmony Engine", ds:"+15% max HP and MP", ef:"hybrid_pool" },{ nm:"Tempo Step", ds:"+4 Speed", ef:"spd" }],
    gravity:[{ nm:"Event Horizon", ds:"+4 Defense and +15% Gravity damage", ef:"gravity_core" },{ nm:"Crushing Presence", ds:"Guard also grants Fortify for 2 turns", ef:"guard_fortify" },{ nm:"Titan Frame", ds:"+18% max HP", ef:"hp" },{ nm:"Worldweight Crown", ds:"Start battle with Barrier for 1 turn and the first Gravity hit gains +12% power", ef:"start_barrier" }],
    sound:[{ nm:"Cathedral Resonance", ds:"Status skills gain +10% trigger chance and Sound debuffs last +1 turn", ef:"status_boost" },{ nm:"Quick Tempo", ds:"+4 Speed", ef:"spd" },{ nm:"Echo Ward", ds:"Start battle with Reflect for 2 turns", ef:"start_reflect" },{ nm:"Sonic Focus", ds:"+14% Sound damage", ef:"elboost" }],
    puppet:[{ nm:"Prepared Threads", ds:"Start battle with Shield for 2 turns", ef:"start_shield" },{ nm:"Master Strings", ds:"+16% damage to debuffed foes", ef:"setup_bonus" },{ nm:"Soul Bobbin", ds:"+18% max MP and recover 3% MP after applying a debuff", ef:"mp" },{ nm:"Stagecraft", ds:"+20% crit chance", ef:"crit" }],
    tide:[{ nm:"Siren Choir", ds:"Slow, Confuse, and Freeze last +1 turn", ef:"water_control" },{ nm:"Tidal Guard", ds:"Start battle with Shield for 2 turns", ef:"start_shield" },{ nm:"Ocean Resonance", ds:"+15% max HP and MP", ef:"hybrid_pool" },{ nm:"Leviathan Resonance", ds:"+14% Water/Sound damage", ef:"dual_elboost" }],
    monk:[{ nm:"Iron Form", ds:"+4 Defense and +15% max HP", ef:"iron_form" },{ nm:"Flow State", ds:"+4 Speed", ef:"spd" },{ nm:"Combo Fist", ds:"Basic attacks gain +15% damage after Guard", ef:"monk_combo" },{ nm:"Mountain Sutra", ds:"Start battle with Fortify for 2 turns and regain 3 MP after guarding", ef:"start_fortify" }],
    primal:[{ nm:"Origin Pulse", ds:"First damaging skill each battle gains +30% power", ef:"first_spell_burst" },{ nm:"Apex Chimera", ds:"+10% all elemental damage and +8% Null damage", ef:"omni_boost" },{ nm:"Chaotic Reserve", ds:"+18% max MP", ef:"mp" },{ nm:"Catalyst Skin", ds:"Start battle with Barrier for 1 turn", ef:"start_barrier" }],
    hexblade:[{ nm:"Hex Feast", ds:"Deal +16% damage to cursed, poisoned, or bleeding foes", ef:"hex_bonus" },{ nm:"Blighted Steel", ds:"+14% Poison/Dark damage", ef:"dual_elboost" },{ nm:"Cruel Edge", ds:"+20% crit chance and +10% damage on cashout turns", ef:"crit" },{ nm:"Cursed Guard", ds:"Start battle with Thorns for 3 turns", ef:"start_thorns" }],
    gambler:[{ nm:"Loaded Fate", ds:"Lucky rolls favor high results slightly more", ef:"gambler_luck" },{ nm:"Loaded Storm", ds:"+14% Arcane/Lightning damage", ef:"dual_elboost" },{ nm:"Marked Deck", ds:"Start battle with Evasion for 2 turns and the first lucky trigger each battle restores 6 MP", ef:"start_evasion" },{ nm:"High Roller", ds:"+4 Speed and +10% payout on lucky triggers", ef:"spd" }],
  };
  const universalExtras = [
    { nm:"Execution Current", ds:"Deal +18% damage to enemies below 35% HP", ef:"finisher" },
    { nm:"Reflex Aegis", ds:"At low HP, gain Barrier for 1 turn once each battle", ef:"lowhp_barrier" },
    { nm:"Guardflow", ds:"Guard restores 3 MP and starts Guard at battle start", ef:"start_guard" },
    { nm:"Stoic Pulse", ds:"Guard restores 6% HP and adds 1 turn of Fortify", ef:"guard_heal" },
    { nm:"Hex Engine", ds:"Applying a debuff restores 5 MP once per action", ef:"debuff_surge" },
    { nm:"Momentum Cut", ds:"Dealing damage to an Exposed or Weakened foe grants +8% follow-up damage this turn", ef:"pressure_loop" },
    { nm:"Cull the Weak", ds:"Kills restore 8% HP and 6% MP", ef:"on_kill_surge" },
    { nm:"Wardbreaker", ds:"Damage to Shielded, Barriered, or Fortified foes is +14%", ef:"wardbreaker" },
    { nm:"Attrition Engine", ds:"Deal +12% damage to enemies suffering Burn, Poison, Bleed, or Slow", ef:"attrition_bonus" },
    { nm:"Tonic Savant", ds:"Consumables heal and strike 18% harder, and their positive buffs last +1 turn", ef:"item_mastery" },
    { nm:"Ward Siphon", ds:"When Guard or buffs grant Shield, Barrier, or Fortify, restore 4 MP", ef:"ward_siphon" },
    { nm:"Reserve Spark", ds:"While below 40% MP, spell damage is +14%", ef:"low_resource_edge" },
  ];
  const pool = ((classPools[c.id] || []).concat(universalExtras)).map((x, i) => ({ ...x, id: c.id + "_p" + i, unlocked: false, equipped: false }));
  const ri = R(0, pool.length - 1);
  pool[ri].unlocked = true;
  pool[ri].equipped = true;
  return pool;
}

// ULTIMATE GENERATOR
function mkUlt(c) {
  return P(mkUltPool(c));
}

function mkUltPool(c) {
  const classFx = {
    paladin:["stun","shield","fortify","weaken","regen","barrier","reflect","expose"],
    assassin:["bleed","blind","poison","slow","weaken","stun","curse","evasion"],
    sorcerer:["burn","stun","freeze","silence","weaken","barrier","empower","slow"],
    priest:["regen","weaken","shield","empower","fortify","barrier","cleanse","stun"],
    ranger:["poison","slow","bleed","expose","blind","haste","weaken","stun"],
    koen:["burn","expose","poison","empower","weaken","stun","haste","bleed"],
    shouei:["freeze","slow","shield","barrier","weaken","bleed","reflect","stun"],
    phoenix:["burn","regen","empower","shield","stun","weaken","fortify","barrier"],
    chrono:["slow","stun","haste","weaken","barrier","evasion","silence","expose"],
    dream:["sleep","confuse","curse","weaken","blind","silence","barrier","stun"],
    voidmage:["silence","curse","weaken","nullify","barrier","slow","stun","confuse"],
    rune:["stun","fortify","shield","barrier","weaken","expose","reflect","slow"],
    bard:["haste","confuse","empower","regen","slow","weaken","reflect","stun"],
    gravity:["stun","slow","weaken","fortify","barrier","taunt","expose","reflect"],
    sound:["confuse","stun","slow","silence","weaken","haste","reflect","blind"],
    puppet:["curse","bleed","weaken","expose","confuse","slow","poison","stun"],
    tide:["slow","shield","regen","confuse","barrier","weaken","fortify","silence"],
    monk:["stun","weaken","fortify","haste","shield","expose","bleed","barrier"],
    primal:["burn","stun","freeze","poison","weaken","haste","barrier","empower"],
    hexblade:["poison","curse","bleed","weaken","expose","stun","blind","thorns"],
    gambler:["confuse","burn","blind","weaken","haste","stun","empower","bleed"]
  };
  const fxList = (classFx[c.id] || ["burn","stun","freeze","curse","weaken","slow","confuse","shield"]).slice(0,8);
  return fxList.map((fx, idx) => {
    const ch = 4 + (idx % 5);
    const burden = fxBurden(fx);
    const raw = 150 + ch * 14 - Math.floor(burden * 2.2) + (idx % 2 === 0 ? 4 : -4);
    const pow = Math.max(105, raw);
    const fxDur = scaledDuration(fx, burden >= 12 ? "light" : "heavy");
    return {
      id: `${c.id}_ult_${idx}`,
      name: ultimateNameFor(c, fx, ch, idx),
      chain: ch,
      pow,
      el: c.el,
      ready: false,
      combo: Array.from({ length: ch }, () => R(0, 7)),
      fx,
      fxDur
    };
  });
}

// WEAPON GENERATOR - All weapons have BOTH damage and effects. Stronger dmg = weaker fx and vice versa. One rare type is pure damage.
const WPN_N = ["Iron Blade","Steel Sword","Crystal Wand","Hunting Bow","Shadow Dagger","War Hammer","Runic Axe","Flame Saber","Frost Edge","Thunder Spear","Holy Mace","Dark Scythe","Vine Whip","Storm Fan","Void Rod","Mithril Rapier","Dragon Fang","Phoenix Feather","Gravity Mace","Echo Bell","Star Edge","Moon Saber","Sun Rod","Prism Blade","Obsidian Katana","Coral Trident","Bone Staff","Amber Wand","Jade Spear","Onyx Dagger"];
const WPN_ACTIVE_FX = ["burn_on_hit","freeze_on_hit","poison_on_hit","stun_on_hit","bleed_on_hit","lifesteal","mp_drain","double_strike","piercing","heal_on_kill"];
const WPN_PASSIVE_FX = ["crit_boost","exp_boost","gold_boost","thorns_on_hit","shield_on_hit","hp_regen","mp_regen","def_boost","spd_boost","lck_boost"];
function mkWpn(tier) {
  const isRarePure = tier >= 4 && Math.random() > 0.92;
  const focusDmg = !isRarePure && Math.random() > 0.52;
  const el = Math.random() > 0.15 ? P(ELS) : "Null";
  const isPassive = !isRarePure && Math.random() > 0.62;
  const fx = isRarePure ? null : (isPassive ? P(WPN_PASSIVE_FX) : P(WPN_ACTIVE_FX));
  const burden = fx ? (fx.indexOf("_on_hit") >= 0 ? fxBurden(fx.replace("_on_hit","")) : ({lifesteal:10, mp_drain:8, double_strike:13, piercing:12, heal_on_kill:9, crit_boost:9, thorns_on_hit:11, shield_on_hit:11, hp_regen:8, mp_regen:8, def_boost:8, spd_boost:8, lck_boost:7, exp_boost:5, gold_boost:5}[fx] || 8)) : 0;
  const atk = isRarePure ? R(14 + tier*3, 20 + tier*4) : focusDmg ? Math.max(2, R(5 + tier, 9 + tier*2) - Math.floor(burden * 0.35)) : Math.max(1, R(2 + tier, 5 + tier) - Math.floor(burden * 0.25));
  const mag = isRarePure ? R(0, 2) : focusDmg ? Math.max(0, R(0, tier) - Math.floor(burden * 0.12)) : Math.max(0, R(1 + Math.floor(tier/2), 4 + tier) - Math.floor(burden * 0.08));
  const spd = isRarePure ? R(0, 2) : Math.max(-1, R(0, Math.min(tier, 3)) - (isPassive && burden >= 10 ? 1 : 0));
  const def = isPassive && fx === "def_boost" ? R(2, 3 + tier*2) : (isPassive && fx === "shield_on_hit" ? R(1, 2 + tier) : 0);
  const fxStrength = isRarePure ? 0 : (focusDmg ? 1 : (tier >= 3 ? 3 : 2));
  const fxDur = fx && fx.indexOf("_on_hit") >= 0 ? scaledDuration(fx.replace("_on_hit",""), focusDmg ? "light" : "heavy") : null;
  const proc = fx && fx.indexOf("_on_hit") >= 0 ? (focusDmg ? 0.22 : 0.35) : null;
  const baseWpn = { id: ID(), name: P(WPN_N), atk, mag, def, spd, dur: 100, maxDur: 100, el, fx, fxD: isRarePure ? "Pure damage — no effect" : (fx ? fx.replace(/_/g, " ") + (fxStrength >= 2 ? " +" : "") : ""), fxStr: fxStrength, fxDur, proc, price: atk * 7 + mag * 6 + Math.max(def,0) * 6 + R(20, 55) + (fx ? 18 + burden * 2 : 0), tier, rare: tier >= 4 || isRarePure, isPure: isRarePure };
  baseWpn.name = themedWeaponName(baseWpn, tier);
  return baseWpn;
}

// CONSUMABLES
const CONS = [
  { id: "hp1", nm: "Redleaf Draught", ef: "heal", v: 40, pr: 22, rare: false },
  { id: "hp2", nm: "Grand Redleaf Tonic", ef: "heal", v: 90, ef2: "regen", dur2: 2, pr: 58, rare: false },
  { id: "mp1", nm: "Mindspring Phial", ef: "mp", v: 30, pr: 24, rare: false },
  { id: "mp2", nm: "High Arcanum Phial", ef: "mp", v: 75, ef2: "empower", dur2: 2, pr: 62, rare: false },
  { id: "ant", nm: "Cleansing Salts", ef: "cleanse", v: 1, ef2: "regen", dur2: 2, pr: 18, rare: false },
  { id: "rep", nm: "Forgekeeper's Kit", ef: "repair", v: 100, pr: 45, rare: false },
  { id: "rev", nm: "Ashen Phoenix Tear", ef: "revive", v: 25, pr: 145, rare: true },
  { id: "shd", nm: "Bastion Tonic", ef: "shield", dur: 2, ef2: "fortify", dur2: 3, pr: 42, rare: false },
  { id: "spd", nm: "Gale Tonic", ef: "haste", dur: 3, ef2: "evasion", dur2: 2, pr: 38, rare: false },
  { id: "pow", nm: "Warfire Elixir", ef: "empower", dur: 3, ef2: "regen", dur2: 2, pr: 44, rare: false },
  { id: "bmb", nm: "Cinder Bomb", ef: "aoe", v: 28, ef2: "burn", dur2: 3, pr: 52, rare: false },
  { id: "smk", nm: "Veil Smoke Bomb", ef: "flee", v: 100, pr: 32, rare: false },
  { id: "nul", nm: "Null Sigil", ef: "nullify", dur: 2, ef2: "cleanse", pr: 78, rare: true },
  { id: "ber", nm: "Bloodrush Brew", ef: "empower", dur: 3, ef2: "haste", dur2: 2, pr: 88, rare: true },
  { id: "rpl", nm: "Wayfarer's Repel", ef: "repel", v: 40, pr: 42, rare: false },
];


function formatTurns(n) {
  return n + " Turn" + (n === 1 ? "" : "s");
}
function uniqList(arr) { return Array.from(new Set((arr || []).filter(Boolean))); }
function gearEffects(g) { return uniqList([g?.fx, g?.fx2].filter(Boolean)); }
function gearHas(g, fx) { return gearEffects(g).includes(fx); }
function gearEffectProc(g, fx, fallback = 0.25) {
  if (!g) return fallback;
  if (fx === g.fx) return g.proc || fallback;
  return g.proc2 || Math.max(0.14, (g.proc || fallback) - 0.06);
}
function gearEffectDur(g, fx, fallback) {
  if (!g) return fallback;
  if (fx === g.fx) return g.fxDur || fallback;
  return g.fxDur2 || fallback;
}
function resolveElementList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return uniqList(input.filter(Boolean));
  if (typeof input === "string") return uniqList([input]);
  const isAttuned = input.tempBattleEl !== undefined && input.tempBattleEl !== null;
  const raw = [isAttuned ? input.tempBattleEl : (input.el || input.baseEl), isAttuned ? (input.tempBattleEl2 || null) : (input.el2 || input.baseEl2)].concat(isAttuned ? (input.tempBonusEls || []) : (input.bonusEls || []), input.primalEls || []);
  return uniqList(raw.filter(Boolean));
}
function entityBattleElements(entity) {
  const isAttuned = entity && entity.tempBattleEl !== undefined && entity.tempBattleEl !== null;
  return resolveElementList(entity).filter(el => el && el !== "Physical" && (isAttuned || el !== "Null"));
}
function elementScoreList(entries, limit = 6, positive = true) {
  return entries
    .filter(x => positive ? x.score > 0 : x.score < 0)
    .sort((a, b) => (Math.abs(b.score) - Math.abs(a.score)) || a.el.localeCompare(b.el))
    .slice(0, limit);
}
function formatElementDelta(score) {
  return Math.abs(score) * 10 + "%";
}
function attackSummaryForElements(input, limit = 6) {
  const els = resolveElementList(input).filter(el => el && el !== "Null" && el !== "Physical");
  if (!els.length) return [];
  const scoreMap = {};
  ELS.forEach(targetEl => {
    let score = 0;
    els.forEach(el => {
      if ((EL_STR[el] || []).includes(targetEl)) score += 1;
    });
    if (score > 0) scoreMap[targetEl] = score;
  });
  return elementScoreList(Object.keys(scoreMap).map(el => ({ el, score: scoreMap[el] })), limit, true);
}
function defenseSummaryForElements(input, limit = 6) {
  const els = resolveElementList(input).filter(el => el && el !== "Null" && el !== "Physical");
  if (!els.length) return { takeMore: [] };
  const scoreMap = {};
  ELS.forEach(attackingEl => {
    let score = 0;
    els.forEach(el => {
      if ((EL_WEAK_TO[el] || []).includes(attackingEl)) score += 1;
    });
    if (score > 0) scoreMap[attackingEl] = score;
  });
  const entries = Object.keys(scoreMap).map(el => ({ el, score: scoreMap[el] }));
  return { takeMore: elementScoreList(entries, limit, true) };
}
function detailedMatchupLines(input, limit = 6) {
  const dealMore = attackSummaryForElements(input, limit);
  const defense = defenseSummaryForElements(input, limit);
  return {
    dealMore,
    takeMore: defense.takeMore,
    dealMoreText: dealMore.length ? dealMore.map(x => x.el + " (+" + formatElementDelta(x.score) + ")").join(", ") : "None",
    takeMoreText: defense.takeMore.length ? defense.takeMore.map(x => x.el + " (+" + formatElementDelta(x.score) + ")").join(", ") : "None",
  };
}
function compactMatchupText(input, limit = 2, includeLabel = false) {
  const sections = elementSummarySections(input, limit);
  const txt = sections.map(sec => {
    if (sec.el === "Null") return "Null: neutral with all elements";
    return sec.el + " → Deals Additional Damage To: " + sec.dealMoreText + " · Takes Additional Damage From: " + sec.takeMoreText;
  }).join(" | ");
  return includeLabel ? ("Matchup: " + txt + ".") : txt;
}
function elementMatchupText(input) {
  const sections = elementSummarySections(input, 3);
  if (!sections.length) return "No elemental affinity.";
  if (sections.length === 1 && sections[0].el === "Null") return "Null: neutral with all elements.";
  return sections.map(sec => sec.el + " — Deals Additional Damage To: " + sec.dealMoreText + "; Takes Additional Damage From: " + sec.takeMoreText).join(" | ") + ".";
}

function battleMatchupPopupText(name, element) {
  const hdr = name || "Action";
  const activeEls = resolveElementList(element).filter(x => x && x !== "Null" && x !== "Physical");
  if (!activeEls.length) return [hdr, "", "Element: Null", "Deals Additional Damage To: None", "Null interacts neutrally with all elements."].join("\n");
  const dealTargets = uniqList(activeEls.flatMap(src => EL_STR[src] || []));
  return [hdr, "", "Element: " + activeEls.join(" / "), "Deals Additional Damage To: " + (dealTargets.length ? dealTargets.join(", ") : "None"), "Unlisted elemental matchups remain neutral at 100%."].join("\n");
}
function skillPopupText(sk) {
  if (!sk) return "No skill data available.";
  const nm = sk.n || sk.name || "Skill";
  const typeParts = [];
  if (sk.t === "damage") typeParts.push("Damage");
  if (sk.t === "heal") typeParts.push("Heal");
  if (sk.t === "buff") typeParts.push("Buff");
  if (sk.t === "debuff") typeParts.push("Debuff");
  if (sk.t === "copy") typeParts.push("Copy");
  const typeLabel = typeParts.length ? typeParts.join(" + ") : "Skill";
  const el = sk.el || "Null";
  const dealTargets = el && el !== "Null" && el !== "Physical" ? uniqList((EL_STR[el] || [])) : [];
  const fxText = battleEffectBundleText(sk) || battleEffectButtonText(sk.fx, sk.fxDur) || "None";
  const lines = [
    nm,
    "",
    "Type: " + typeLabel,
    "Element: " + el,
    sk.pow != null ? ("Power: " + sk.pow + (sk.mp != null ? " · Cost: " + sk.mp + " MP" : "")) : (sk.mp != null ? ("Cost: " + sk.mp + " MP") : null),
    "Effect: " + fxText,
    "Deals Additional Damage To: " + (dealTargets.length ? dealTargets.join(", ") : "None"),
    el === "Null" || el === "Physical" ? "Null interacts neutrally with all elements." : "Unlisted elemental matchups remain neutral at 100%."
  ].filter(Boolean);
  return lines.join("\n");
}

function normalizeCopiedSkill(rawSkill, owner) {
  if (!rawSkill) return null;
  const kind = String(rawSkill.t || rawSkill.kind || "").toLowerCase();
  const baseType = kind === "support" ? "buff" : (kind === "status" ? "debuff" : (kind || "damage"));
  const guessedMp = rawSkill.mp != null
    ? rawSkill.mp
    : Math.max(4, Math.min(18,
        baseType === "damage" ? Math.ceil((rawSkill.pow || 12) * 0.28 + (rawSkill.aoe ? 4 : 0)) :
        baseType === "heal" ? Math.ceil((rawSkill.pow || 12) * 0.24 + 5) :
        baseType === "buff" ? 8 + (rawSkill.fx2 ? 2 : 0) :
        baseType === "debuff" ? 9 + (rawSkill.fx2 ? 2 : 0) :
        8
      ));
  return {
    ...rawSkill,
    n: rawSkill.n || rawSkill.name || "Copied Skill",
    t: baseType,
    el: rawSkill.el || "Null",
    mp: guessedMp,
    copiedFromBoss: !!(owner && owner.boss),
  };
}
function elementSummarySections(input, limit = 6) {
  const els = resolveElementList(input).filter(el => el && el !== "Null" && el !== "Physical");
  if (!els.length) {
    return [{
      el: "Null",
      dealMore: [],
      takeMore: [],
      dealMoreText: "None",
      takeMoreText: "None",
      neutral: true,
    }];
  }
  return els.map(el => {
    const lines = detailedMatchupLines([el], limit);
    return {
      el,
      dealMore: lines.dealMore,
      takeMore: lines.takeMore,
      dealMoreText: lines.dealMoreText,
      takeMoreText: lines.takeMoreText,
      neutral: !lines.dealMore.length && !lines.takeMore.length,
    };
  });
}

function elementInteractionScore(attackerEl, defenderInput) {
  if (!attackerEl || attackerEl === "Null" || attackerEl === "Physical") return 0;
  const defenders = resolveElementList(defenderInput).filter(el => el && el !== "Null" && el !== "Physical");
  if (!defenders.length) return 0;
  let score = 0;
  defenders.forEach(defEl => {
    if ((EL_STR[attackerEl] || []).includes(defEl)) score += 1;
  });
  return score;
}
function eMult(a, d) {
  if (!a || a === "Null" || a === "Physical") return 1;
  return C(1 + elementInteractionScore(a, d) * 0.1, 1, 1.3);
}
function renderMatchupItems(items, mode) {
  if (!items || !items.length) return <span style={{ color: "#aebadf" }}>None</span>;
  return items.map((x, i) => (
    <span key={mode + "_" + x.el + "_" + i} style={{ color: ELC[x.el] || "#d7def8", fontWeight: 700 }}>
      {x.el} <span style={{ color: mode === "resist" ? "#7fe3a2" : mode === "take" ? "#ff9aa8" : "#ffd77a" }}>{mode === "resist" ? "(-" : "(+"}{formatElementDelta(x.score)})</span>{i < items.length - 1 ? <span style={{ color: "#96a4ce", fontWeight: 400 }}>, </span> : null}
    </span>
  ));
}
function attackSummaryLines(input, limit = 6) {
  const els = resolveElementList(input).filter(el => el && el !== "Null" && el !== "Physical");
  if (!els.length) return { dealMore: [] };
  const scoreMap = {};
  ELS.forEach(targetEl => {
    let score = 0;
    els.forEach(el => {
      if ((EL_STR[el] || []).includes(targetEl)) score += 1;
    });
    if (score !== 0) scoreMap[targetEl] = score;
  });
  const entries = Object.keys(scoreMap).map(el => ({ el, score: scoreMap[el] }));
  return {
    dealMore: elementScoreList(entries, limit, true),
  };
}
function matchupListText(items, mode = "plus") {
  if (!items || !items.length) return "None";
  const prefix = mode === "minus" ? "-" : "+";
  return items.map(x => x.el + " (" + prefix + formatElementDelta(x.score) + ")").join(", ");
}
function boonListForPlayer(player) {
  if (!player) return [];
  const arr = [];
  if (player.generation && player.generation <= 1) return ["None"];
  if (player.legacyTrait?.nm) arr.push(player.legacyTrait.nm);
  if (player.geneticBoon?.nm) arr.push(player.geneticBoon.nm);
  (player.bonusEls || []).forEach(el => arr.push(el + " Resonance"));
  return uniqList(arr).length ? uniqList(arr) : ["None"];
}
const FIELD_BOSS_POOL = Array.from({length:20}, (_,i) => ({ id:"fb_"+(i+1), nm:["Ash Tyrant","Glass Stag","Howling Regent","Violet Warden","Cinder Archbishop","Thorn Leviathan","Mist Duelist","Stone Omen","Moon Harrower","Iron Oracle","Pale Huntmaster","Wild Choir","Dread Myrmidon","Null Wolf","Sunken Judge","Amber Widow","Storm Eater","Gloom Vicar","Blood Cypress","Ivory Butcher"][i], el: ELS[i % ELS.length] }));
function syncFieldBossPois(map, cycle, defeated) {
  const md = (map || []).map(t => t && t.poi?.type === "fieldboss" ? { ...t, poi: null } : { ...t });
  const alivePool = FIELD_BOSS_POOL.filter(b => !(defeated || {})[b.id]);
  const active = Math.min(3, alivePool.length);
  for (let i = 0; i < active; i++) {
    const boss = alivePool[Math.abs(cycle * 17 + i * 11) % alivePool.length];
    let placed = false;
    for (let tr = 0; tr < 900 && !placed; tr++) {
      const x = 2 + (Math.abs(cycle * 97 + i * 37 + tr * 13) % (MW - 4));
      const y = 2 + (Math.abs(cycle * 71 + i * 29 + tr * 17) % (MH - 4));
      const idx = y * MW + x;
      const tile = md[idx];
      if (!tile || tile.poi || tile.bio === "ocean") continue;
      if (START_TOWNS.some(tw => Math.abs(tw.x - x) + Math.abs(tw.y - y) <= 10)) continue;
      md[idx] = { ...tile, poi: { type: "fieldboss", nm: boss.nm, ic: "💀", bossKey: boss.id, el: boss.el } };
      placed = true;
    }
  }
  return md;
}
function moveFieldBossPois(map, playerPos) {
  const md = (map || []).map(t => ({ ...t }));
  const bosses = [];
  md.forEach((tile, idx) => { if (tile?.poi?.type === "fieldboss") bosses.push({ idx, tile, poi: tile.poi }); });
  bosses.forEach(({ idx, tile, poi }) => { md[idx] = { ...tile, poi: null }; });
  bosses.forEach(({ idx, tile, poi }, bi) => {
    let x = idx % MW, y = Math.floor(idx / MW);
    const dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for (let t = 0; t < 8; t++) {
      const [dx,dy] = dirs[Math.abs(_h1(x + bi + t, y + bi * 3 + t)) % dirs.length];
      const nx = C(x + dx, 0, MW - 1), ny = C(y + dy, 0, MH - 1), ni = ny * MW + nx;
      if (playerPos && playerPos.x === nx && playerPos.y === ny) continue;
      if (!md[ni] || md[ni].bio === "ocean" || md[ni].poi) continue;
      x = nx; y = ny; break;
    }
    const ni = y * MW + x;
    md[ni] = { ...md[ni], poi: poi };
  });
  return md;
}
function ensureSubmapBossAccess(tiles, bossX, bossY, startX = 0, startY = 0) {
  if (!tiles || !tiles.length) return tiles;
  const cols = 10;
  const reserve = (x, y) => {
    if (x < 0 || x >= cols || y < 0 || y >= cols) return;
    const idx = y * cols + x;
    const tile = tiles[idx];
    if (!tile || tile.type === "boss") return;
    tiles[idx] = { ...tile, type: "safe", enemies: undefined, reserved: true };
  };
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy]) => reserve(bossX + dx, bossY + dy));
  let cx = startX, cy = startY;
  reserve(cx, cy);
  while (cx !== bossX) {
    cx += bossX > cx ? 1 : -1;
    reserve(cx, cy);
  }
  while (cy !== bossY) {
    cy += bossY > cy ? 1 : -1;
    reserve(cx, cy);
  }
  return tiles;
}

function moveRoamingBossPos(cur, map, playerPos) {
  if (!cur || !map || !map.length) return cur;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1],[0,0]];
  for (let t = 0; t < 48; t++) {
    const roll = Math.random();
    const step = roll < 0.22 ? 3 : (roll < 0.62 ? 2 : 1);
    const [dx,dy] = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = C(cur.x + dx * step, 0, MW - 1), ny = C(cur.y + dy * step, 0, MH - 1), ni = ny * MW + nx;
    if (playerPos && playerPos.x === nx && playerPos.y === ny) continue;
    if (!map[ni]) continue;
    return { x: nx, y: ny };
  }
  return cur;
}
function moveSubMapThreats(sm) {
  if (!sm || !sm.tiles || !["hostile", "rift"].includes(sm.type)) return sm;
  const cols = 10;
  const rows = 10;
  const baseType = sm.type === "rift" ? "safe" : null;
  const originalTiles = sm.tiles.map(t => ({ ...t }));
  const clearedSet = new Set((sm.cleared || []).map(String));
  const roaming = originalTiles.filter(t => t.type === "encounter" && !clearedSet.has(t.x + "_" + t.y));
  if (!roaming.length) return sm;
  const occupied = new Set(originalTiles.filter(t => (t.reserved || (t.type && t.type !== "safe" && !(t.type === "encounter" && !clearedSet.has(t.x + "_" + t.y))))).map(t => t.x + "," + t.y));
  roaming.forEach((t, i) => {
    const dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for (let tries = 0; tries < 10; tries++) {
      const pick = Math.abs(_h2(t.x + i + tries, t.y + tries)) % dirs.length;
      const dx = dirs[pick][0], dy = dirs[pick][1];
      const nx = C(t.x + dx, 0, cols - 1), ny = C(t.y + dy, 0, rows - 1);
      const key = nx + "," + ny;
      if (occupied.has(key)) continue;
      if (sm.pos && sm.pos.x === nx && sm.pos.y === ny) continue;
      t.x = nx; t.y = ny; occupied.add(key); break;
    }
  });
  const nextTiles = Array.from({ length: cols * rows }, (_, i) => ({ x: i % cols, y: Math.floor(i / cols), type: baseType }));
  originalTiles.forEach(t => {
    if (t.type === "encounter" && !clearedSet.has(t.x + "_" + t.y)) return;
    nextTiles[t.y * cols + t.x] = { ...t };
  });
  roaming.forEach(t => { nextTiles[t.y * cols + t.x] = { ...t }; });
  return { ...sm, tiles: nextTiles };
}
function mkFieldBossFromPoi(poi, lvl) {
  const base = mkEnemy(C(Math.floor((lvl || 1) / 3) + 3, 3, 7));
  const name = poi?.nm || "Field Boss";
  const el = poi?.el || base.el;
  const hpScale = 2.9 + (lvl || 1) * 0.03;
  const monPassive = { ...P(BOSS_MONSTER_PASSIVES) };
  return { ...base, name, el, hp: Math.floor((base.mhp || base.hp) * hpScale), mhp: Math.floor((base.mhp || base.hp) * hpScale), atk: Math.floor(base.atk * 1.35), def: Math.floor(base.def * 1.4), spd: Math.floor(base.spd * 1.08), mag: Math.floor(base.mag * 1.25), xp: 120 + (lvl || 1) * 18, gold: 90 + (lvl || 1) * 12, boss: true, fieldBossKey: poi?.bossKey || name, monPassive: monPassive.nm, monPassiveKey: monPassive.id };
}
function renderMatchupInline(input, accent, variant) {
  const sections = elementSummarySections(input, 6);
  const tone = accent === "enemy" ? "#ffcfda" : accent === "ally" ? "#9ef0cc" : "#9fd6ff";
  const compact = variant === "battle";
  return (
    <div style={{ marginTop: 3, minWidth: 0, width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      {sections.length > 1 && (
        <div style={{ fontSize: compact ? 6.6 : 7, color: "#97a7d5", marginBottom: 3 }}>
          Swipe horizontally to view each element separately.
        </div>
      )}
      <div
        className={"matchup-scroll" + (compact ? " battle-compact" : "")}
        data-noswipe="1"
        style={{
          display: "block",
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          overflowX: "scroll",
          overflowY: "hidden",
          paddingBottom: compact ? 6 : 4,
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
          overscrollBehaviorX: "contain",
          scrollBehavior: "smooth",
          scrollSnapType: "x proximity",
          boxSizing: "border-box"
        }}
      >
        <div
          className={"matchup-strip" + (compact ? " battle-compact" : "")}
          style={{
            display: "inline-flex",
            flexWrap: "nowrap",
            width: "max-content",
            minWidth: "100%",
            gap: compact ? 6 : 7,
            alignItems: "stretch",
            paddingRight: compact ? 12 : 18,
            boxSizing: "border-box"
          }}
        >
          {sections.map((sec, idx) => (
            <div
              key={sec.el + "_" + idx}
              className={"matchup-card" + (compact ? " battle-compact" : "")}
              style={{
                minWidth: compact ? 150 : 198,
                maxWidth: compact ? 150 : 220,
                flex: "0 0 auto",
                padding: compact ? "5px 6px" : "6px 7px",
                borderRadius: 8,
                background: "rgba(8,12,28,0.28)",
                border: "1px solid rgba(255,255,255,0.06)",
                scrollSnapAlign: "start",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: compact ? 3 : 4 }}>
                <div style={{ fontSize: compact ? 7.5 : 8, fontWeight: 800, color: ELC[sec.el] || "#d7def8" }}>{sec.el}</div>
              </div>
              <div style={{ fontSize: compact ? 7.2 : 8, lineHeight: compact ? 1.35 : 1.45 }}>
                <span style={{ display:"block", fontSize:compact ? 7.2 : 8, fontWeight:700, marginBottom:1, letterSpacing:0.2, color: "#ffd77a" }}>Deals Additional Damage To</span>
                {renderMatchupItems(sec.dealMore, "deal")}
              </div>
              <div style={{ fontSize: compact ? 7.2 : 8, lineHeight: compact ? 1.35 : 1.45, marginTop: compact ? 3 : 4 }}>
                <span style={{ display:"block", fontSize:compact ? 7.2 : 8, fontWeight:700, marginBottom:1, letterSpacing:0.2, color: "#ff9aa8" }}>Takes Additional Damage From</span>
                {renderMatchupItems(sec.takeMore, "take")}
              </div>
              {sec.el !== "Null" && <div style={{ fontSize: compact ? 6.4 : 7, color: "#97a7d5", marginTop: compact ? 3 : 4 }}>Only {sec.el}-aligned skills gain that element's offensive bonus.</div>}
              {sec.el === "Null" && <div style={{ fontSize: compact ? 6.4 : 7, color: "#97a7d5", marginTop: compact ? 3 : 4 }}>Null remains neutral at 100% in both directions.</div>}
            </div>
          ))}
        </div>
      </div>
      {sections.length > 1 && <div style={{ fontSize: compact ? 6.6 : 7, color: "#97a7d5", marginTop: 3 }}>Each card is separate. Only the matching element's skills gain that card's offensive bonus.</div>}
    </div>
  );
}
const AGE_PHASES = [
  { key:"bloom", min:1, max:8, nm:"Early Bloom", ds:"Youthful vigor leans physical and swift.", mult:{ hp:1.03, mp:0.97, atk:1.12, def:1.03, spd:1.1, mag:0.93, lck:1.0 } },
  { key:"prime", min:9, max:18, nm:"Prime", ds:"Body and magic settle into balance.", mult:{ hp:1.06, mp:1.04, atk:1.06, def:1.05, spd:1.04, mag:1.06, lck:1.03 } },
  { key:"wisdom", min:19, max:24, nm:"Veil Wisdom", ds:"Strength softens while control and magic deepen.", mult:{ hp:1.0, mp:1.12, atk:0.98, def:1.03, spd:0.97, mag:1.16, lck:1.08 } },
  { key:"elder", min:25, max:30, nm:"Elder Veil", ds:"Arcane insight peaks as the body begins to fade.", mult:{ hp:0.95, mp:1.2, atk:0.9, def:1.0, spd:0.9, mag:1.24, lck:1.12 } },
  { key:"twilight", min:31, max:99, nm:"Twilight", ds:"A final day stands between legacy and silence.", mult:{ hp:0.9, mp:1.22, atk:0.86, def:0.96, spd:0.86, mag:1.28, lck:1.14 } },
];
function ageProfile(day) {
  const d = Math.max(1, day || 1);
  return AGE_PHASES.find(a => d >= a.min && d <= a.max) || AGE_PHASES[AGE_PHASES.length - 1];
}
function ageGraphRows() {
  return AGE_PHASES.slice(0, 4).map(p => ({ nm: p.nm, window: p.min + "-" + p.max, atk: p.mult.atk, mag: p.mult.mag, spd: p.mult.spd }));
}
const COMPANION_NAMES = {
  male:["Aren","Kael","Darian","Lucan","Marek","Orin","Soren","Tavian","Riven","Cyril","Eamon","Theron","Cassian","Nikol","Joren","Alaric","Rhydan","Vael","Corin","Orris","Leif","Bastian","Kellan","Rowe","Gideon","Milo","Oren","Silas","Veyn","Torin"],
  female:["Aria","Lyra","Selene","Mira","Nyra","Elara","Talia","Vessa","Celine","Nadia","Iris","Maela","Saphira","Orla","Vanya","Rhea","Astra","Liora","Seris","Kaia","Noelle","Eira","Velia","Thalia","Zaria","Mirae","Soraya","Ilena","Rin","Elowen"],
};
const COMPANION_NATURES = ["Bold","Calm","Devoted","Clever","Wild","Gentle","Ambitious","Mischievous","Patient","Fierce","Curious","Steady"];
const LEGACY_TRAITS = [
  { nm:"Heir of Embers", ds:"Your line learned to seize openings.", stat:"atk", mult:1.04 },
  { nm:"Quiet Scholar", ds:"Your line preserved a deeper veil sense.", stat:"mag", mult:1.05 },
  { nm:"Fleet Blood", ds:"Your line moves with instinctive speed.", stat:"spd", mult:1.04 },
  { nm:"Wardbound", ds:"Your line bears a natural guard.", stat:"def", mult:1.04 },
  { nm:"Fortune Mark", ds:"Your line bends odds a little more kindly.", stat:"lck", mult:1.05 },
  { nm:"Deep Lungs", ds:"Your line endures the long road.", stat:"hp", mult:1.05 },
  { nm:"Aether Vein", ds:"Your line carries richer reserves.", stat:"mp", mult:1.05 },
];
function mkCompanionOffer(seed, seek) {
  const pool = COMPANION_NAMES[seek] || COMPANION_NAMES.female;
  const name = pool[Math.abs(seed * 7 + 3) % pool.length];
  const el = ELS[Math.abs(seed * 5 + 11) % ELS.length];
  const el2Pick = ELS[Math.abs(seed * 9 + 19) % ELS.length];
  const nature = COMPANION_NATURES[Math.abs(seed * 11 + 5) % COMPANION_NATURES.length];
  const boonStat = ["atk","mag","spd","def","lck","hp","mp"][Math.abs(seed * 17 + 2) % 7];
  const base = { id:"cmp_" + seek + "_" + seed, sex:seek, nm:name, ic:seek === "male" ? "🧑" : "👩", el, el2: el2Pick !== el && (Math.abs(seed * 13 + 17) % 100 < 28) ? el2Pick : null, nature, boonStat, boonMult: (boonStat === "hp" || boonStat === "mp") ? 1.06 : 1.04, cycle: seed };
  const preview = rollGeneticBoon({ el, el2: base.el2 }, base, seed + 19);
  return { ...base, boonPreview: preview };
}
function buildCompanionQueue(cycle, seek, townKey) {
  const out = [];
  const start = Math.max(0, cycle - 4);
  const offset = String(townKey || "global").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  for (let i = start; i <= cycle; i++) out.push(mkCompanionOffer(i + offset, seek));
  return out.reverse();
}
function companionElementLabel(c) {
  return [c?.el, c?.el2].filter(Boolean).join(" / ") || "Neutral";
}
function legacyTraitFor(seed) {
  return { ...LEGACY_TRAITS[Math.abs(seed) % LEGACY_TRAITS.length] };
}
const GENETIC_PASSIVE_BOONS = [
  { id:"gp_spell", nm:"Astral Inheritance", ds:"Inherited passive: +8% spell damage.", type:"passive", passive:{ id:"gp_spell", nm:"Astral Inheritance", ds:"Inherited line: +8% spell damage.", ef:"lineage_spell_boost", unlocked:true, equipped:true } },
  { id:"gp_guard", nm:"Adamant Line", ds:"Inherited passive: start battle with Fortify for 2 Turns.", type:"passive", passive:{ id:"gp_guard", nm:"Adamant Line", ds:"Inherited line: start battle with Fortify for 2 Turns.", ef:"lineage_start_fortify", unlocked:true, equipped:true } },
  { id:"gp_surge", nm:"Quickblood", ds:"Inherited passive: +10% action speed pressure in battle.", type:"passive", passive:{ id:"gp_surge", nm:"Quickblood", ds:"Inherited line: speed-focused lineage pressure.", ef:"lineage_speed", unlocked:true, equipped:true } },
  { id:"gp_guardian", nm:"Guardian Pulse", ds:"Inherited passive: begin battle with Shield for 2 Turns.", type:"passive", passive:{ id:"gp_guardian", nm:"Guardian Pulse", ds:"Inherited line: begins battle guarded.", ef:"start_shield", unlocked:true, equipped:true } },
  { id:"gp_mirror", nm:"Mirror Blood", ds:"Inherited passive: begin battle with Reflect for 2 Turns.", type:"passive", passive:{ id:"gp_mirror", nm:"Mirror Blood", ds:"Inherited line: reflectively punishes pressure.", ef:"start_reflect", unlocked:true, equipped:true } },
];
const GENETIC_SKILL_BOONS = [
  { id:"gs_ember", type:"skill", skill:{ id:"legacy_ember", n:"Ancestor Ember", el:"Fire", pow:18, mp:12, t:"damage", fx:"burn", fxDur:2, unlocked:true, equipped:false, lvl:1 }, nm:"Ancestor Ember", ds:"Inherited Veil Magic: a reliable burn strike." },
  { id:"gs_tide", type:"skill", skill:{ id:"legacy_tide", n:"Heir's Undertow", el:"Water", pow:16, mp:12, t:"damage", fx:"slow", fxDur:3, unlocked:true, equipped:false, lvl:1 }, nm:"Heir's Undertow", ds:"Inherited Veil Magic: pressure through control." },
  { id:"gs_halo", type:"skill", skill:{ id:"legacy_halo", n:"Lineage Halo", el:"Light", pow:0, mp:11, t:"buff", fx:"shield", fxDur:2, fx2:"regen", fx2Dur:2, unlocked:true, equipped:false, lvl:1 }, nm:"Lineage Halo", ds:"Inherited Veil Magic: support from your bloodline." },
  { id:"gs_void", type:"skill", skill:{ id:"legacy_void", n:"Quiet Rift", el:"Void", pow:15, mp:13, t:"debuff", fx:"silence", fxDur:2, fx2:"weaken", fx2Dur:2, unlocked:true, equipped:false, lvl:1 }, nm:"Quiet Rift", ds:"Inherited Veil Magic: suppresses enemy tempo." },
  { id:"gs_bloom", type:"skill", skill:{ id:"legacy_bloom", n:"Bloomline Grace", el:"Nature", pow:0, mp:12, t:"buff", fx:"regen", fxDur:3, fx2:"fortify", fx2Dur:2, unlocked:true, equipped:false, lvl:1 }, nm:"Bloomline Grace", ds:"Inherited Veil Magic: steady restorative support." },
];
const GENETIC_ULT_BOONS = [
  { id:"gu_flare", kind:"ult", nm:"Veil Inheritance: Crimson Finale", ds:"Inherited rare Veil Expansion choice unlocked.", ult:{ id:"ult_inherited_flare", name:"Crimson Finale", pow:72, el:"Fire", fx:"burn", fxDur:3, chain:5, combo:[0,4,8,1,6], ready:false } },
  { id:"gu_tide", kind:"ult", nm:"Veil Inheritance: Leviathan Hymn", ds:"Inherited rare Veil Expansion choice unlocked.", ult:{ id:"ult_inherited_tide", name:"Leviathan Hymn", pow:68, el:"Water", fx:"slow", fxDur:4, chain:5, combo:[1,7,8,0,6], ready:false } },
  { id:"gu_null", kind:"ult", nm:"Veil Inheritance: Quiet Cataclysm", ds:"Inherited rare Veil Expansion choice unlocked.", ult:{ id:"ult_inherited_null", name:"Quiet Cataclysm", pow:74, el:"Void", fx:"silence", fxDur:2, chain:6, combo:[2,4,8,3,7,9], ready:false } },
];
function rollGeneticBoon(player, partner, seed) {
  const rareRoll = Math.abs(seed * 13 + 7) % 100;
  const partnerElements = [partner?.el, partner?.el2].filter(Boolean);
  const playerElements = resolveElementList(player);
  if (rareRoll < 8) {
    return { ...GENETIC_ULT_BOONS[Math.abs(seed * 5 + 17) % GENETIC_ULT_BOONS.length] };
  }
  const nature = partner?.nature || "";
  let category = Math.abs(seed) % 5;
  if (["Bold","Fierce","Ambitious"].includes(nature) && rareRoll < 55) category = rareRoll < 28 ? 0 : 1;
  else if (["Calm","Gentle","Patient","Devoted","Steady"].includes(nature) && rareRoll < 55) category = rareRoll < 30 ? 2 : 0;
  else if (["Clever","Curious","Mischievous","Wild"].includes(nature) && rareRoll < 60) category = rareRoll < 26 ? 3 : 1;
  if (category === 0) {
    const stat = partner?.boonStat || ["atk","mag","spd","def","lck","hp","mp"][Math.abs(seed*3) % 7];
    const mult = partner?.boonMult || ((stat === "hp" || stat === "mp") ? 1.06 : 1.04);
    return { kind:"stat", nm:"Bloodline Edge", ds:"Inherited stat growth: " + String(stat).toUpperCase() + " ×" + mult.toFixed(2), stat, mult };
  }
  if (category === 1) {
    const extra = partnerElements.find(el => !playerElements.includes(el)) || ELS[Math.abs(seed * 5 + 3) % ELS.length];
    const extra2 = rareRoll < 18 ? (ELS[Math.abs(seed * 7 + 9) % ELS.length]) : null;
    return { kind:"element", nm:"Resonant Blood", ds:"Inherited extra element: " + extra + (extra2 && extra2 !== extra ? (" with a latent echo of " + extra2) : "") + ".", element: extra, latentElement: (extra2 && extra2 !== extra) ? extra2 : null };
  }
  if (category === 2) {
    return { ...GENETIC_PASSIVE_BOONS[Math.abs(seed * 7 + 1) % GENETIC_PASSIVE_BOONS.length], kind:"passive" };
  }
  if (category === 3) {
    return { ...GENETIC_SKILL_BOONS[Math.abs(seed * 11 + 3) % GENETIC_SKILL_BOONS.length], kind:"skill" };
  }
  return { kind:"stat", nm:"Twin Legacy", ds:"Inherited paired growth: HP ×1.04 and MAG ×1.04.", pair:["hp","mag"], mult:1.04 };
}
function applyGeneticBoonToPlayer(basePlayer, boon) {
  if (!boon) return basePlayer;
  const next = { ...basePlayer, geneticBoon: boon };
  if (boon.kind === "stat" && next.st?.[boon.stat] != null) next.st = { ...next.st, [boon.stat]: Math.max(1, Math.floor(next.st[boon.stat] * (boon.mult || 1.04))) };
  if (boon.kind === "stat" && Array.isArray(boon.pair)) {
    const ns = { ...(next.st || {}) };
    boon.pair.forEach(stat => { if (ns[stat] != null) ns[stat] = Math.max(1, Math.floor(ns[stat] * (boon.mult || 1.04))); });
    next.st = ns;
  }
  if (boon.kind === "element" && boon.element) {
    const els = Array.from(new Set([...(next.bonusEls || []), boon.element].concat(boon.latentElement ? [boon.latentElement] : [])));
    next.bonusEls = els;
  }
  if (boon.kind === "passive" && boon.passive) {
    const passives = [...(next.passives || [])];
    if (!passives.some(p => p.id === boon.passive.id)) passives.push({ ...boon.passive });
    next.passives = passives;
  }
  if (boon.kind === "skill" && boon.skill) {
    const skills = [...(next.skills || [])];
    if (!skills.some(s => s.id === boon.skill.id)) skills.push({ ...boon.skill });
    next.skills = skills;
  }
  if (boon.kind === "ult" && boon.ult) {
    const pool = [...(next.ultPool || []), { ...boon.ult }];
    next.ultPool = pool.filter((u, idx, arr) => arr.findIndex(x => x.name === u.name) === idx);
  }
  return next;
}
function statInfoText(key) {
  const map = {
    hp:"HP governs how much damage you can take before falling. It also matters for effects that scale from max health, like Burn, Bleed, and some survival passives.",
    mp:"MP fuels Veil Magic, Maled, and copied skills. Higher MP lets you play more tactically and sustain longer fights.",
    atk:"ATK powers weapon strikes, shield-bashes, and Physical-element attacks. It matters most for martial classes and on-hand weapon pressure.",
    def:"DEF reduces incoming damage from attacks and many skills. It becomes especially valuable in Arena, Outpost, and Rift fights where battles last longer.",
    spd:"SPD influences turn tempo and helps you act before enemies. It also supports control, combo setup, and safer battle pacing.",
    mag:"MAG powers Veil Magic damage, healing, Maled scaling, and many status-based effects. It is the core stat for caster pressure and support depth.",
    lck:"LCK supports critical pressure, certain proc-based passives, and some reward-oriented effects. It adds subtle consistency and swing potential.",
  };
  const upper = String(key || "").toUpperCase();
  return upper + "\n\n" + (map[key] || "This stat influences your performance in battle and progression.");
}
function ageCurvePopupText(baseStats) {
  const b = baseStats || {};
  return "📈 Predicted Life Curve\n\n" + AGE_PHASES.slice(0, 4).map(function(p) {
    const hp = Math.max(1, Math.floor((b.hp || 1) * p.mult.hp));
    const mp = Math.max(1, Math.floor((b.mp || 1) * p.mult.mp));
    const atk = Math.max(1, Math.floor((b.atk || 1) * p.mult.atk));
    const mag = Math.max(1, Math.floor((b.mag || 1) * p.mult.mag));
    const spd = Math.max(1, Math.floor((b.spd || 1) * p.mult.spd));
    return p.nm + " — Days " + p.min + "-" + p.max + "\nHP " + hp + " · MP " + mp + " · ATK " + atk + " · MAG " + mag + " · SPD " + spd + "\n" + p.ds;
  }).join("\n\n");
}
function inheritedTraitCatalogText() {
  return `🧬 Possible Inherited Outcomes

Each new heir is uncertain. Bloodline outcomes are chance-based, not guaranteed. A child may inherit one or more of the following tendencies over many generations:

• Stat growth leaning (HP, MP, ATK, DEF, SPD, MAG, or LCK)
• An additional element or rare element pairing
• A bloodline passive
• A bloodline Veil Magic technique that can only enter the line through inheritance
• A rare Veil Expansion unlock or archived family choice
• An inherited signature shaped by the current companion's nature and elements
• Your predecessor's equipped Veil Expansion added to the available family choice pool

The child may emerge stronger, stranger, calmer, harsher, or simply different. No two lines should mature in exactly the same way.`;
}
const MONSTER_PASSIVE_INFO = {
  stonehide:"Stonehide: tougher hide grants higher defense.",
  bloodthirst:"Bloodthirst: deals more damage and becomes more dangerous at low HP.",
  phasehide:"Phase Hide: begins battle with Evasion already active.",
  riftward:"Rift Ward: begins battle with a short Barrier.",
  elderguard:"Elder Guard: begins battle with Fortify.",
  venomglands:"Venom Glands: more likely to inflict harmful effects.",
  quickfang:"Quickfang: naturally faster than average.",
  arcaneheart:"Arcane Heart: empowered by deeper magical reserves.",
  boss_aegis:"Boss Aegis: boss begins better protected and harder to break.",
  boss_overmind:"Overmind: boss magic and effect pressure are stronger.",
  boss_wrath:"Wrath of the Rift: boss damage grows more threatening as its HP drops.",
  boss_phase:"Phase Lord: boss begins evasive and faster than normal.",
  ironjaw_bastion:"Bastion of Ironjaw: begins fortified and grows harder to crack.",
  silkweave_grand_design:"Grand Design: opens with a barrier and layers control effects.",
  blazefury_wildfire:"Wildfire Heart: burn pressure rises and the boss surges when cornered.",
  scylla_venomcourt:"Venomcourt: poison and bleed pressure linger longer than usual.",
  gravewatch_toll:"Grave Toll: opens with reflection and punishes careless aggression.",
  entropy_engine:"Entropy Engine: the rift sovereign opens shielded and snowballs debuff pressure.",
  time_maw:"Time Maw: accelerates itself and drags battles into awkward tempo.",
  null_throne:"Null Throne: begins protected and suppresses status-heavy answers.",
  reality_lattice:"Reality Lattice: barrier and evasion keep the battlefield unstable.",
  primal_hunger:"Primal Hunger: becomes far more dangerous once wounded."
};
function passivePopupText(label, desc) {
  if (!label || label === "None") return "There is no passive for this character.";
  return (label || "Passive") + "\n\n" + (desc || "A unique ongoing trait that shapes this combatant's role in battle.");
}
function equippedPassiveFor(entity) {
  return (entity?.passives || []).find(x => x.equipped) || null;
}
function natureInfluenceText(nature) {
  const map = {
    Bold:"Bold companions lean heirs toward aggressive growth, weapon confidence, and pressure-oriented bloodlines.",
    Calm:"Calm companions favor steadier, more defensive or controlled inheritances.",
    Devoted:"Devoted companions stabilize support inheritances, loyal passives, and reliable bloodline protection.",
    Clever:"Clever companions are more likely to shape technical heirs with skill-leaning bloodline outcomes.",
    Wild:"Wild companions pull heirs toward volatile element spreads and rarer unstable boons.",
    Gentle:"Gentle companions lean lines toward sustain, support, and restorative inheritances.",
    Ambitious:"Ambitious companions push heirs toward stronger long-term ceilings and rarer inherited power.",
    Mischievous:"Mischievous companions add a little chaos: odd pairings, trickier boons, and swingier inheritances.",
    Patient:"Patient companions favor endurance, defensive stat leanings, and controlled growth.",
    Fierce:"Fierce companions nudge heirs toward offense, initiative, and forceful passives.",
    Curious:"Curious companions nudge heirs toward unusual skills, secondary elements, and magical experimentation.",
    Steady:"Steady companions support balanced heirs that avoid extreme weaknesses."
  };
  return map[nature] || "This temperament lightly shapes how the next heir's bloodline outcomes lean.";
}
function spouseDetailText(spouse) {
  if (!spouse) return "No bonded companion.";
  const bloodlineText = companionFieldDetailText(spouse, "bloodline");
  const growthText = companionFieldDetailText(spouse, "growth");
  return `${spouse.nm} — Bonded Companion

Elements: ${companionElementLabel(spouse)}
Nature: ${spouse.nature}
Search: ${spouse.sex === "male" ? "Seek Male" : "Seek Female"}

${bloodlineText}

${growthText}`;
}

function companionFieldDetailText(c, field) {
  const elementText = companionElementLabel(c);
  if (field === "elements") {
    return `${c.nm} — Elemental Resonance

Elements: ${elementText}

These elements enter the heir-bloodline pool when this companion is bonded. They can bias inherited element boons, rare pairings, matchup spread, and the overall feel of the next generation.`;
  }
  if (field === "nature") {
    return `${c.nm} — Nature

${c.nature}

${natureInfluenceText(c.nature)}`;
  }
  if (field === "bloodline") {
    const preview = c.boonPreview?.nm || "Unformed Bloodline";
    const desc = c.boonPreview?.ds || "A future heir can inherit stat growth, passives, Veil Magic, Veil Expansion choices, extra elements, or rarer mixed outcomes. Nothing is guaranteed.";
    const skillLine = c.boonPreview?.skill ? `
Inherited Veil Magic: ${c.boonPreview.skill.n} — ${c.boonPreview.skill.t === "heal" ? "Power" : "Power"} ${c.boonPreview.skill.pow || 0}, Cost ${c.boonPreview.skill.mp || 0} MP${c.boonPreview.skill.fx ? ", Effect: " + (FX(c.boonPreview.skill.fx)?.nm || c.boonPreview.skill.fx) : ""}.` : "";
    const ultLine = c.boonPreview?.ult ? `
Inherited Veil Expansion: ${c.boonPreview.ult.name} — ${c.boonPreview.ult.el}, Power ${c.boonPreview.ult.pow}, Chain ${c.boonPreview.ult.chain}, Effect ${FX(c.boonPreview.ult.fx)?.nm || c.boonPreview.ult.fx || "None"}.` : "";
    const passiveLine = (c.boonPreview?.passive && c.boonPreview?.type !== "passive") ? `
Inherited Passive: ${c.boonPreview.passive.nm} — ${c.boonPreview.passive.ds}` : "";
    return `${c.nm} — Bloodline Leaning

${preview}

${desc}${skillLine}${ultLine}${passiveLine}`;
  }
  if (field === "growth") {
    return `${c.nm} — Inherited Growth

Primary leaning: ${String(c.boonStat || "varied").toUpperCase()}${c.boonMult ? (" ×" + Number(c.boonMult).toFixed(2)) : ""}

This tells you which stat this companion most naturally pushes forward when a growth-style inheritance is rolled.`;
  }
  return `${c.nm}

A bonded companion is never just cosmetic. Their resonance changes what your next generation can become.`;
}
function veilExpansionDetailText(ult) {
  if (!ult) return "No Veil Expansion equipped.";
  const effectLine = ult.fx ? ((FX(ult.fx)?.ic || "⚡") + " " + (FX(ult.fx)?.nm || ult.fx) + (ult.fxDur ? " · " + ult.fxDur + " Turns" : "")) : "No secondary effect";
  const chainText = (ult.combo || []).map(v => ["Veil Magic 1","Veil Magic 2","Veil Magic 3","Veil Magic 4","On Hand Item 1","On Hand Item 2","Battle Item 1","Battle Item 2","Guard","Copied Skill"][v] || "?").join(" → ");
  return "🌟 " + ult.name + "\n\nElement: " + ult.el + "\nPower: " + ult.pow + " + MAG×2\nEffect: " + effectLine + "\nChain: " + chainText + "\n\nYour Motto is uttered before this Veil Expansion is unleashed in battle.";
}

function petPassiveTemplate(el) {
  const map = {
    Fire:{ nm:"Cinder Instinct", bonus:"damage", mult:1.14 }, Water:{ nm:"Mist Guard", bonus:"support", mult:1.16 }, Ice:{ nm:"Frostbite Rhythm", bonus:"fx", mult:1.12 }, Lightning:{ nm:"Quick Charge", bonus:"speed", mult:1.18 },
    Earth:{ nm:"Stone Hide", bonus:"guard", mult:1.14 }, Wind:{ nm:"Slipstream", bonus:"speed", mult:1.14 }, Light:{ nm:"Kind Halo", bonus:"support", mult:1.16 }, Dark:{ nm:"Night Pounce", bonus:"damage", mult:1.14 },
    Void:{ nm:"Void Pressure", bonus:"fx", mult:1.14 }, Nature:{ nm:"Bloomheart", bonus:"support", mult:1.18 }, Metal:{ nm:"Steel Temper", bonus:"guard", mult:1.14 }, Poison:{ nm:"Venom Sac", bonus:"fx", mult:1.16 },
    Psychic:{ nm:"Mind Nudge", bonus:"fx", mult:1.14 }, Sound:{ nm:"Battle Rhythm", bonus:"support", mult:1.14 }, Gravity:{ nm:"Heavy Paw", bonus:"damage", mult:1.12 }, Arcane:{ nm:"Aether Familiar", bonus:"support", mult:1.15 }
  };
  return map[el] || { nm:"Companion Instinct", bonus:"damage", mult:1.1 };
}
function applyGearPassiveStats(s, gear) {
  if (!gear) return;
  gearEffects(gear).forEach(fx => {
    if (fx === 'def_boost') s.def += 2;
    if (fx === 'spd_boost') s.spd += 2;
    if (fx === 'lck_boost') s.lck += 3;
    if (fx === 'crit_boost') s.lck += 4;
    if (fx === 'hp_regen') s.hp += 10;
    if (fx === 'mp_regen') s.mp += 8;
  });
}
function projectedEffStatsFor(player, equipmentSet, dayValue) {
  if (!player) return {};
  const s = { ...(player.st || {}) };
  const eqSet = equipmentSet || {};
  [eqSet.w1, eqSet.w2].forEach((w) => { if (w) { s.atk += w.atk || 0; s.mag += w.mag || 0; s.def += w.def || 0; s.spd += w.spd || 0; applyGearPassiveStats(s, w); } });
  [eqSet.helm, eqSet.body, eqSet.glv, eqSet.boot].forEach((a) => { if (a) { s.def += a.def || 0; s.hp += a.hp || 0; s.spd += a.spd || 0; applyGearPassiveStats(s, a); } });
  const activePassives = (player.passives || []).filter(pp => pp.equipped);
  activePassives.forEach(activePassive => {
    switch (activePassive?.ef) {
      case "hp": s.hp = Math.floor(s.hp * 1.18); break;
      case "mp": s.mp = Math.floor(s.mp * 1.2); break;
      case "hybrid_pool": s.hp = Math.floor(s.hp * 1.15); s.mp = Math.floor(s.mp * 1.15); break;
      case "spd": s.spd += 4; break;
      case "def": s.def += 4; break;
      case "crit": s.lck += 6; break;
      case "glass": s.mag = Math.floor(s.mag * 1.18); s.def = Math.max(1, s.def - 2); break;
      case "iron_form": s.def += 4; s.hp = Math.floor(s.hp * 1.15); break;
      case "gravity_core": s.def += 4; break;
      case "lineage_speed": s.spd += 3; break;
    }
  });
  const ageMult = ageProfile(dayValue).mult;
  Object.keys(ageMult).forEach(k => { if (s[k] != null) s[k] = Math.max(1, Math.floor(s[k] * ageMult[k])); });
  if (player.legacyTrait?.stat && s[player.legacyTrait.stat] != null) s[player.legacyTrait.stat] = Math.max(1, Math.floor(s[player.legacyTrait.stat] * (player.legacyTrait.mult || 1.03)));
  if (player.bloodmark) {
    const bm = getBM(player.bloodmark);
    if (bm && bm.stat) Object.entries(bm.stat).forEach(([k,v]) => { if (s[k] != null) s[k] = Math.max(1, s[k] + v); });
  }
  if (player.covenant) {
    const cv = COVENANTS.find(c => c.id === player.covenant);
    if (cv && cv.statBonus) Object.entries(cv.statBonus).forEach(([k,v]) => { if (s[k] != null) s[k] = Math.max(1, s[k] + v); });
  }
  if (player.generation && player.generation > 1) {
    const legacyScale = Math.min(1.12, 1 + (player.generation - 1) * 0.02);
    s.hp = Math.floor(s.hp * legacyScale);
    s.mp = Math.floor(s.mp * Math.min(1.1, 1 + (player.generation - 1) * 0.015));
  }
  return s;
}
function skillEffectBurden(sk) {
  if (!sk) return 0;
  let b = 0;
  if (sk.fx) b += fxBurden(sk.fx);
  if (sk.fx2) b += Math.floor(fxBurden(sk.fx2) * 0.7);
  if (sk.aoe) b += 6;
  return b;
}
function skillLevelScale(sk) {
  const pure = sk && sk.t === 'damage' && !sk.fx && !sk.fx2 && !sk.aoe;
  return pure ? (0.96 + ((sk?.lvl || 1) - 1) * 0.05) : (0.95 + ((sk?.lvl || 1) - 1) * 0.028);
}
function skillEffectChance(sk) {
  const burden = skillEffectBurden(sk);
  const base = 0.62 - Math.max(0, burden - 10) * 0.012 - (sk?.fx2 ? 0.04 : 0) - (sk?.aoe ? 0.05 : 0) + (((sk?.lvl || 1) - 1) * 0.018);
  return Math.max(0.34, Math.min(0.78, base));
}
function skillDurationValue(sk, fxKey, baseDur) {
  const heavy = new Set(["stun","freeze","sleep","silence","nullify","barrier","evasion","reflect"]);
  const lvl = sk?.lvl || 1;
  const bonus = lvl >= 8 ? 1 : 0;
  const base = baseDur || FX(fxKey)?.dur || 1;
  const cap = heavy.has(fxKey) ? 3 : 5;
  return Math.min(cap, base + bonus);
}
function upgradeSkillForBalance(sk) {
  const nextLvl = Math.min(10, (sk.lvl || 1) + 1);
  const pureDamage = sk.t === 'damage' && !sk.fx && !sk.fx2 && !sk.aoe;
  const pureHeal = sk.t === 'heal' && !sk.fx && !sk.fx2;
  const next = { ...sk, lvl: nextLvl };
  if (pureDamage) next.pow = (next.pow || 0) + 3;
  else if (pureHeal) next.pow = (next.pow || 0) + 4;
  else if (sk.t === 'damage') next.pow = (next.pow || 0) + 1;
  else if (sk.t === 'heal') next.pow = (next.pow || 0) + 2;
  if ((sk.fx || sk.fx2 || sk.t === 'buff' || sk.t === 'debuff') && (nextLvl === 4 || nextLvl === 7 || nextLvl === 10)) {
    if (next.fxDur) next.fxDur = Math.min(5, next.fxDur + 1);
    if (next.fx2Dur) next.fx2Dur = Math.min(5, next.fx2Dur + 1);
  }
  return next;
}
function itemEffectEntries(it) {
  if (!it) return [];
  return [
    it.ef ? { ef: it.ef, v: it.v, dur: it.dur, target: it.target } : null,
    it.ef2 ? { ef: it.ef2, v: it.v2, dur: it.dur2, target: it.target2 || it.target } : null,
  ].filter(Boolean);
}
function itemEffectSentence(entry) {
  if (!entry) return "";
  const ef = entry.ef, v = entry.v, dur = entry.dur;
  const durText = dur ? " for " + formatTurns(dur) : "";
  const map = {
    heal: "Restores " + v + " HP.",
    mp: "Restores " + v + " MP.",
    cleanse: "Removes active debuffs.",
    repair: "Fully restores durability on repairable equipped weapons.",
    revive: "Revives a fallen ally or player with " + v + "% HP.",
    shield: "Applies Shield" + durText + ", reducing incoming damage by 40%.",
    haste: "Applies Haste" + durText + ", increasing speed by 50%.",
    empower: "Applies Empower" + durText + ", increasing damage dealt by 25%.",
    aoe: "Deals " + v + " damage to all enemies.",
    flee: "Attempts to escape from battle immediately. Stronger in normal encounters than boss fights.",
    nullify: "Blocks the next incoming status effect completely, then expires.",
    berserk: "A volatile combat stimulant that heavily favors offense over safety for a short burst.",
    repel: "Halves random encounter rate for " + v + " steps.",
    fortify: "Applies Fortify" + durText + ", reducing incoming damage by 20%.",
    evasion: "Applies Evasion" + durText + ", granting a 40% chance to dodge attacks.",
    silence: "Silences the target" + durText + ", locking skill use while still allowing weapons, Guard, items, and swaps.",
    regen: "Applies Regen" + durText + ", restoring " + (v || FX("regen")?.v || 12) + " HP each turn.",
    burn: "Applies Burn" + durText + " (12 + 5% max HP damage per turn).",
    poison: "Applies Poison" + durText + " (damage escalates each turn).",
    bleed: "Applies Bleed" + durText + " (5 + 4% max HP damage per turn).",
    weaken: "Applies Weaken" + durText + " (-25% damage).",
    expose: "Applies Expose" + durText + " (-25% defense).",
    freeze: "Applies Freeze" + durText + " (30% skip chance).",
    stun: "Applies Stun" + durText + " (guaranteed skip).",
    fire_boost: "Your next Fire skill deals 50% more damage.",
  };
  return map[ef] || "Special utility item.";
}
function describeSingleWeaponEffect(fx, w) {
  const turns = gearEffectDur(w, fx, null);
  const proc = Math.round(gearEffectProc(w, fx, 0.25) * 100);
  const map = {
    burn_on_hit: "Burn on hit: " + proc + "% chance to apply Burn for " + formatTurns(turns || 3) + ".",
    freeze_on_hit: "Freeze on hit: " + proc + "% chance to apply Freeze for " + formatTurns(turns || 2) + ".",
    poison_on_hit: "Poison on hit: " + proc + "% chance to apply Poison for " + formatTurns(turns || 4) + ".",
    stun_on_hit: "Stun on hit: " + proc + "% chance to apply Stun for " + formatTurns(turns || 1) + ".",
    bleed_on_hit: "Bleed on hit: " + proc + "% chance to apply Bleed for " + formatTurns(turns || 3) + ".",
    lifesteal: "Lifesteal: restores a portion of damage dealt as HP.",
    mp_drain: "MP drain: restores a small burst of MP on hit.",
    double_strike: "Double strike: has a chance to hit again for reduced damage.",
    piercing: "Piercing: cuts through a large share of target defense.",
    heal_on_kill: "Heal on kill: restores a share of max HP after a kill.",
    crit_boost: "Crit boost: improves the chance of a harder weapon strike.",
    crit_damage: "Crit damage: critical hits land harder (+15% per piece).",
    exp_boost: "EXP boost: increases experience gains while equipped.",
    gold_boost: "Gold boost: increases gold gains while equipped.",
    thorns_on_hit: "Thorns: reflects part of incoming damage to attackers.",
    shield_on_hit: "Shield on hit: can grant Shield for a short duration.",
    hp_regen: "HP regen: adds passive health recovery while equipped.",
    mp_regen: "MP regen: adds passive mana recovery while equipped.",
    def_boost: "Defense boost: raises your defense while equipped.",
    spd_boost: "Speed boost: raises your speed while equipped.",
    lck_boost: "Luck boost: improves crit and lucky-effect performance.",
  };
  return map[fx] || (w?.fxD ? String(w.fxD) : "No special effect.");
}
function weaponEffectDetail(w) {
  if (!w) return "";
  if (w.name === "Kagami") return "Freeze on hit: 30% chance to apply Freeze for 2 Turns and copies the target's element onto Shōuei for the rest of the battle, once per unique target.";
  if (w.isPure) return "Pure damage weapon: higher raw damage, no special effect.";
  const fxLines = gearEffects(w).map(fx => describeSingleWeaponEffect(fx, w)).filter(Boolean);
  return fxLines.length ? fxLines.join(" Also: ") : (w.fxD ? String(w.fxD) : "No special effect.");
}
function battleEffectButtonText(effectId, dur, value) {
  const ef = FX(effectId);
  if (!effectId) return "";
  const turns = dur || ef?.dur || 0;
  const turnText = turns ? " · " + formatTurns(turns) : "";
  const map = {
    burn: "Burn 12 + 5% Max HP/Turn" + turnText,
    freeze: "Freeze 30% Skip" + turnText,
    poison: "Poison escalating DoT" + turnText,
    stun: "Stun 100% Skip" + turnText,
    confuse: "Confuse target actions" + turnText,
    blind: "Blind -30% Accuracy" + turnText,
    silence: "Silence skill lock" + turnText,
    slow: "Slow -50% Speed" + turnText,
    weaken: "Weaken -25% Damage" + turnText,
    expose: "Expose -25% Defense" + turnText,
    sleep: "Sleep skip on target" + turnText,
    bleed: "Bleed 5 + 4% Max HP/Turn" + turnText,
    curse: "Curse -15% All Stats" + turnText,
    regen: "Regen " + (value || ef?.v || 12) + " HP/Turn" + turnText,
    shield: "Shield -40% Damage" + turnText,
    haste: "Haste +50% Speed" + turnText,
    empower: "Empower +25% Damage" + turnText,
    fortify: "Fortify -20% Damage" + turnText,
    reflect: "Reflect 30% Return" + turnText,
    barrier: "Barrier -60% Damage" + turnText,
    thorns: "Thorns 20% Return" + turnText,
    nullify: "Nullify next status" + turnText,
    evasion: "Evasion 40% Dodge" + turnText,
    taunt: "Taunt enemy focus" + turnText,
    fire_boost: "Next Fire skill +50%"
  };
  if (map[effectId]) return ((ef?.ic ? ef.ic + " " : "") + map[effectId]).trim();
  return ((ef?.ic ? ef.ic + " " : "") + (ef?.nm || effectId) + turnText).trim();
}
function battleEffectBundleText(obj) {
  if (!obj) return "";
  const bits = [
    obj.fx ? battleEffectButtonText(obj.fx, obj.fxDur, obj.regenValue || obj.v) : null,
    obj.fx2 ? battleEffectButtonText(obj.fx2, obj.fx2Dur, obj.v2) : null,
    obj.aoe ? "Hits all enemies" : null
  ].filter(Boolean);
  return bits.join(" · ");
}

function inferConsumableOrigin(it) {
  if (!it) return "";
  if (it.origin) return it.origin;
  if (it.recipe || it.source === "fish") return "Fish Market";
  if ((it.nm || "").match(/Poultice|Tea|Sap|Root|Infusion|Paste|Balm/i)) return "Herbalist";
  if ((it.nm || "").match(/Elixir|Ampoule|Capsule|Volatile|Resin|Draught/i)) return "Alchemist";
  if (["repair","repel","flee","revive"].includes(it.ef)) return "Utility";
  return "Battle Kit";
}
function inferConsumableNiche(it) {
  const fx = [it?.ef, it?.ef2].filter(Boolean);
  if (fx.some(x => ["repair","repel","flee","revive"].includes(x))) return "Utility";
  if (fx.some(x => ["heal","mp","regen","cleanse"].includes(x)) && !fx.some(x => ["aoe","stun","burn","poison","bleed","expose","silence","freeze"].includes(x))) return "Sustain";
  if (fx.some(x => ["shield","barrier","fortify","nullify","evasion"].includes(x))) return "Guard";
  if (fx.some(x => ["aoe","stun","burn","poison","bleed","expose","silence","freeze","weaken"].includes(x))) return "Control/Burst";
  if (fx.some(x => ["haste","empower"].includes(x))) return "Tempo";
  return "Utility";
}
function itemEffectDetail(it) {
  if (!it) return "";
  if ((it.fx || it.fx2) && (it.slot || it.isShield || it.atk !== undefined)) return weaponEffectDetail(it);
  const lines = itemEffectEntries(it).map(itemEffectSentence).filter(Boolean);
  const tag = "[" + inferConsumableOrigin(it) + " · " + inferConsumableNiche(it) + "]";
  const core = lines.length ? lines.join(" Also: ") : (it.ds ? String(it.ds) : "Special utility item.");
  return tag + " " + core;
}

// SIGNATURE WEAPONS (unique per class, cannot be found elsewhere)
const SIG_WPN = {
  paladin:{name:"Aegis of First Dawn",atk:0,mag:4,def:9,spd:0,el:"Light",fx:"shield_on_hit",fxD:"shield on hit + steadfast ward",dur:100,maxDur:100,sig:true,isShield:true,proc:0.3,fxDur:3},
  assassin:{name:"Nightshade Fang",atk:11,mag:1,def:0,spd:3,el:"Dark",fx:"bleed_on_hit",fxD:"bleed on hit + surgical laceration",dur:100,maxDur:100,sig:true,proc:0.28,fxDur:2},
  sorcerer:{name:"Astral Prism",atk:2,mag:14,def:0,spd:1,el:"Arcane",fx:"mp_drain",fxD:"mp drain on hit",dur:100,maxDur:100,sig:true},
  priest:{name:"Staff of Absolution",atk:4,mag:12,def:2,spd:0,el:"Light",fx:"heal_on_kill",fxD:"heal on kill + sacred sustain",dur:100,maxDur:100,sig:true},
  ranger:{name:"Thornwood Longbow",atk:10,mag:3,def:0,spd:2,el:"Nature",fx:"poison_on_hit",fxD:"poison on hit",dur:100,maxDur:100,sig:true,proc:0.3,fxDur:3},
  koen:{name:"Scarlet Hanabira",atk:5,mag:13,def:0,spd:1,el:"Fire",fx:"burn_on_hit",fxD:"burn on hit",dur:100,maxDur:100,sig:true,proc:0.3,fxDur:3},
  shouei:{name:"Kagami",atk:6,mag:10,def:2,spd:1,el:"Ice",fx:"freeze_on_hit",fxD:"freeze on hit + mirrors target element for this battle (once per unique target)",dur:100,maxDur:100,sig:true,proc:0.26,fxDur:2},
  phoenix:{name:"Cinder Rebirth Blade",atk:10,mag:5,def:2,spd:0,el:"Fire",fx:"lifesteal",fxD:"lifesteal + ember recovery",dur:100,maxDur:100,sig:true},
  chrono:{name:"Hourglass Thorn",atk:4,mag:13,def:0,spd:4,el:"Gravity",fx:"stun_on_hit",fxD:"stun chance + temporal snag",dur:100,maxDur:100,sig:true,proc:0.22,fxDur:1},
  dream:{name:"Devourer's Lantern",atk:3,mag:14,def:0,spd:1,el:"Psychic",fx:"mp_drain",fxD:"drains MP on hit with dream-devouring pressure",dur:100,maxDur:100,sig:true},
  voidmage:{name:"Black Star Scepter",atk:2,mag:16,def:0,spd:0,el:"Void",fx:"mp_drain",fxD:"mp drain + void channel",dur:100,maxDur:100,sig:true},
  rune:{name:"Wardbreaker Bastion",atk:0,mag:4,def:10,spd:-1,el:"Earth",fx:"thorns_on_hit",fxD:"thorn ward + sealing bulwark",dur:100,maxDur:100,sig:true,isShield:true,proc:0.24,fxDur:4},
  bard:{name:"Resonance Lyre",atk:6,mag:10,def:0,spd:2,el:"Sound",fx:"stun_on_hit",fxD:"dissonant stun on hit",dur:100,maxDur:100,sig:true,proc:0.22,fxDur:1},
  gravity:{name:"Worldweight Aegis",atk:0,mag:3,def:11,spd:-1,el:"Gravity",fx:"stun_on_hit",fxD:"crushing slow-stun guard",dur:100,maxDur:100,sig:true,isShield:true,proc:0.22,fxDur:3},
  sound:{name:"Cathedral Bell",atk:4,mag:13,def:0,spd:3,el:"Sound",fx:"stun_on_hit",fxD:"resonant stun on hit",dur:100,maxDur:100,sig:true,proc:0.22,fxDur:1},
  puppet:{name:"Fatewires",atk:8,mag:11,def:0,spd:1,el:"Dark",fx:"bleed_on_hit",fxD:"curse-thread laceration",dur:100,maxDur:100,sig:true,proc:0.28,fxDur:2},
  tide:{name:"Undertow Guard",atk:0,mag:5,def:9,spd:0,el:"Water",fx:"shield_on_hit",fxD:"tidal shell + healing guard",dur:100,maxDur:100,sig:true,isShield:true,proc:0.28,fxDur:3},
  monk:{name:"Mountain Sutras",atk:13,mag:0,def:2,spd:2,el:"Earth",fx:"stun_on_hit",fxD:"stun on hit + combo pressure",dur:100,maxDur:100,sig:true,proc:0.22,fxDur:1},
  primal:{name:"Chaos Fang",atk:12,mag:12,def:0,spd:2,el:"Null",fx:"double_strike",fxD:"primal afterimages can double strike",dur:100,maxDur:100,sig:true},
  hexblade:{name:"Blightweaver",atk:10,mag:8,def:0,spd:1,el:"Poison",fx:"poison_on_hit",fxD:"poison + blight pressure",dur:100,maxDur:100,sig:true,proc:0.3,fxDur:3},
  gambler:{name:"Loaded Dice Blade",atk:8,mag:7,def:0,spd:2,el:"Arcane",fx:"crit_boost",fxD:"wild crit surges",dur:100,maxDur:100,sig:true},
};
function mkSigWpn(classId) { const s = SIG_WPN[classId]; if (!s) return mkWpn(1); return {...s, id: "sig_"+classId, price: 0, tier: 3, rare: true, isPure: false, fxStr: 2}; }

// SHIELDS (15 types - defensive, no/low damage)
const SHIELDS = [
  {name:"Wooden Buckler",atk:0,mag:0,def:6,spd:0,el:"Null",fx:"shield_on_hit",fxD:"Block 15% damage and form a ward for 3 turns.",proc:0.24,fxDur:3},
  {name:"Iron Aegis",atk:0,mag:0,def:10,spd:-1,el:"Metal",fx:"thorns_on_hit",fxD:"Reflect harm with thorned guard for 4 turns.",proc:0.22,fxDur:4},
  {name:"Crystal Ward",atk:0,mag:4,def:8,spd:0,el:"Arcane",fx:"shield_on_hit",fxD:"Barrier-rich warding shell for 3 turns.",proc:0.26,fxDur:3},
  {name:"Flame Buckler",atk:0,mag:0,def:7,spd:0,el:"Fire",fx:"burn_on_hit",fxD:"Ignites attackers with a 3-turn burn.",proc:0.28,fxDur:3},
  {name:"Frost Guard",atk:0,mag:2,def:9,spd:0,el:"Ice",fx:"freeze_on_hit",fxD:"Briefly locks attackers in frost for 2 turns.",proc:0.2,fxDur:2},
  {name:"Thunder Shield",atk:0,mag:0,def:8,spd:1,el:"Lightning",fx:"stun_on_hit",fxD:"Crackling guard that can stun for 1 turn.",proc:0.18,fxDur:1},
  {name:"Nature Barrier",atk:0,mag:3,def:7,spd:0,el:"Nature",fx:"hp_regen",fxD:"Steady regenerative shell over time.",proc:null,fxDur:null},
  {name:"Shadow Veil",atk:0,mag:2,def:6,spd:2,el:"Dark",fx:"lck_boost",fxD:"Shifting guard that improves evasive fortune.",proc:null,fxDur:null},
  {name:"Holy Bulwark",atk:0,mag:5,def:12,spd:-1,el:"Light",fx:"shield_on_hit",fxD:"Massive sanctified barrier for 4 turns.",proc:0.24,fxDur:4},
  {name:"Void Mirror",atk:0,mag:6,def:5,spd:0,el:"Void",fx:"thorns_on_hit",fxD:"Reflective void skin for 3 turns.",proc:0.2,fxDur:3},
  {name:"Captain's Round",atk:0,mag:0,def:8,spd:0,el:"Metal",fx:"stun_on_hit",fxD:"A crushing bash shield with 1-turn stun chance.",proc:0.18,fxDur:1},
  {name:"Bone Tower",atk:0,mag:0,def:14,spd:-2,el:"Null",fx:"thorns_on_hit",fxD:"Immovable pain-spine guard for 4 turns.",proc:0.2,fxDur:4},
  {name:"Wind Kite",atk:0,mag:2,def:5,spd:3,el:"Wind",fx:"lck_boost",fxD:"Fast evasive guard that favors dodging over force.",proc:null,fxDur:null},
  {name:"Gravity Wall",atk:0,mag:0,def:11,spd:-1,el:"Gravity",fx:"stun_on_hit",fxD:"Weighty barrier that can pin foes for 2 turns.",proc:0.2,fxDur:2},
  {name:"Psychic Disc",atk:0,mag:8,def:4,spd:1,el:"Psychic",fx:"stun_on_hit",fxD:"Mind-rattling disc that can disrupt attackers for 2 turns.",proc:0.18,fxDur:2},
];
function mkShield(tier) { const s = {...P(SHIELDS)}; s.id = ID(); s.dur = 100; s.maxDur = 100; s.def += R(0, tier*2); s.price = s.def * 8 + R(20,50); s.tier = tier; s.rare = tier >= 3; s.isShield = true; s.atk = 0; return s; }

// ARMOR PIECES (armorer stock and passive-stat gear)
const ARMOR_POOLS = {
  helm:[
    {name:'Warden Helm',slot:'helm',def:4,hp:10,spd:0,fx:'def_boost',fxD:'Steadies the head and raises defense while worn.'},
    {name:'Windcrest Circlet',slot:'helm',def:2,hp:4,spd:2,fx:'spd_boost',fxD:'A light circlet that sharpens movement and initiative.'},
    {name:'Moonveil Hood',slot:'helm',def:1,hp:6,spd:1,fx:'lck_boost',fxD:'Improves timing, luck, and critical composure.'},
    {name:'Oracle Visor',slot:'helm',def:2,hp:6,spd:0,fx:'crit_boost',fxD:'A sightline helm that improves precision and critical pressure.'},
    {name:'Sage Crown',slot:'helm',def:1,hp:8,spd:0,fx:'mp_regen',fxD:'Feeds a slow reserve of mana and steadies spellcasting.'},
  ],
  body:[
    {name:'Bulwark Cuirass',slot:'body',def:8,hp:24,spd:-1,fx:'def_boost',fxD:'Heavy body armor built to endure sustained pressure.'},
    {name:'Mistweave Coat',slot:'body',def:4,hp:14,spd:1,fx:'spd_boost',fxD:'Flexible protection that trades bulk for speed.'},
    {name:'Lifebloom Vest',slot:'body',def:5,hp:20,spd:0,fx:'hp_regen',fxD:'Encourages slow passive vitality recovery while worn.'},
    {name:'Spellguard Mantle',slot:'body',def:4,hp:12,spd:0,fx:'mp_regen',fxD:'A mantle lined with channels that support mana recovery.'},
    {name:'Lucky Brigandine',slot:'body',def:5,hp:16,spd:0,fx:'lck_boost',fxD:'Balanced armor that rewards risky but well-timed play.'},
  ],
  glv:[
    {name:'Runed Grips',slot:'glv',def:2,hp:0,spd:1,fx:'crit_boost',fxD:'Runes reinforce aim and improve critical pressure.'},
    {name:'Ironthread Gloves',slot:'glv',def:3,hp:6,spd:0,fx:'def_boost',fxD:'Reinforced gloves that steady guard and grip.'},
    {name:'Swiftfang Wraps',slot:'glv',def:1,hp:0,spd:2,fx:'spd_boost',fxD:'Quick wraps favored by duelists and scouts.'},
    {name:'Medic Handguards',slot:'glv',def:2,hp:4,spd:0,fx:'hp_regen',fxD:'Gentle restorative lining supports long fights and recovery.'},
    {name:'Starcall Mitts',slot:'glv',def:1,hp:0,spd:1,fx:'mp_regen',fxD:'Arcane stitching eases strain and restores a trickle of mana.'},
  ],
  boot:[
    {name:'Wayfarer Boots',slot:'boot',def:2,hp:8,spd:2,fx:'spd_boost',fxD:'Travel-worn boots built for quick repositioning.'},
    {name:'Stonegreaves',slot:'boot',def:4,hp:12,spd:-1,fx:'def_boost',fxD:'Heavy greaves that anchor the stance.'},
    {name:'Fortune Treads',slot:'boot',def:1,hp:4,spd:1,fx:'lck_boost',fxD:'Favorable footing for risky maneuvers.'},
    {name:'Hunter Soles',slot:'boot',def:2,hp:6,spd:1,fx:'crit_boost',fxD:'Boots that reward clean footwork and precise finishing blows.'},
    {name:'Aether Sandals',slot:'boot',def:1,hp:4,spd:2,fx:'mp_regen',fxD:'Light sandals that keep momentum and magical rhythm flowing.'},
  ]
};
function mkArmor(slot, tier) {
  const base = {...P(ARMOR_POOLS[slot])};
  const t = Math.max(1, tier||1);
  base.id = ID();
  base.el = 'Null';
  base.dur = 100;
  base.maxDur = 100;
  base.def += R(0, t);
  base.hp += R(0, t*4);
  base.spd += R(0, Math.min(1,t));
  base.price = 60 + (base.def||0)*8 + (base.hp||0)*2 + Math.max(0,(base.spd||0))*12 + (base.fx?22:0);
  base.tier = t;
  base.rare = t >= 3;
  return base;
}

function enhanceFoundGear(gear, source) {
  if (!gear || Math.random() > (source === 'rift' ? 0.7 : 0.4)) return gear;
  const g = { ...gear };
  if (g.slot) {
    const pool = ['hp_regen','mp_regen','def_boost','spd_boost','lck_boost','crit_boost','crit_damage'].filter(fx => fx !== g.fx);
    if (pool.length) g.fx2 = P(pool);
    if (source === 'rift') { g.def += 1; g.hp = (g.hp || 0) + 6; }
    g.rareMix = true;
    return g;
  }
  const current = gearEffects(g);
  const passivePool = WPN_PASSIVE_FX.filter(fx => !current.includes(fx) && !['exp_boost','gold_boost'].includes(fx));
  const activePool = WPN_ACTIVE_FX.filter(fx => !current.includes(fx) && fx !== 'heal_on_kill');
  const choosePassive = Math.random() < 0.58 || !!g.isShield;
  const pick = choosePassive ? P(passivePool) : P(activePool);
  if (pick) {
    g.fx2 = pick;
    if (pick.indexOf('_on_hit') >= 0) {
      g.proc2 = Math.max(0.14, (g.proc || 0.26) - 0.06);
      g.fxDur2 = Math.min(5, Math.max(2, (g.fxDur || FX(pick.replace('_on_hit',''))?.dur || 2)));
    }
    if (source === 'rift') {
      g.atk = (g.atk || 0) + (g.isShield ? 0 : 1);
      g.mag = (g.mag || 0) + (g.isShield ? 0 : 1);
      if (g.def != null) g.def += 1;
    }
    g.rareMix = true;
  }
  return g;
}
function mkRiftGear(lvl) {
  const roll = Math.random();
  const gear = roll < 0.4 ? mkWpn(R(2,4)) : roll < 0.65 ? mkShield(R(1,3)) : mkArmor(P(['helm','body','glv','boot']), R(1,3));
  return enhanceFoundGear(gear, 'rift');
}
function mkRandomGear() {
  const roll = Math.random();
  const gear = roll < 0.4 ? mkWpn(R(2,4)) : roll < 0.65 ? mkShield(R(1,3)) : mkArmor(P(['helm','body','glv','boot']), R(1,3));
  return enhanceFoundGear(gear, 'outpost');
}

// BEASTS (40 unique tameable creatures with 2 skills each)
const BEASTS = [
  {id:0,nm:"Ember Salamander",ic:"🦎",el:"Fire",hp:60,atk:14,def:6,spd:12,sk1:{n:"Flame Lick",pow:18,el:"Fire",fx:"burn"},sk2:{n:"Heat Shield",pow:0,el:"Fire",fx:"shield"}},
  {id:1,nm:"Frost Lynx",ic:"🐱",el:"Ice",hp:55,atk:16,def:5,spd:18,sk1:{n:"Ice Fang",pow:20,el:"Ice",fx:"freeze"},sk2:{n:"Chill Dash",pow:14,el:"Ice",fx:"slow"}},
  {id:2,nm:"Thunder Raptor",ic:"🦅",el:"Lightning",hp:50,atk:18,def:4,spd:22,sk1:{n:"Spark Dive",pow:22,el:"Lightning",fx:"stun"},sk2:{n:"Static Screech",pow:12,el:"Lightning",fx:"confuse"}},
  {id:3,nm:"Tide Serpent",ic:"🐍",el:"Water",hp:65,atk:12,def:8,spd:10,sk1:{n:"Tidal Coil",pow:16,el:"Water",fx:"slow"},sk2:{n:"Healing Mist",pow:20,el:"Water",fx:"regen"}},
  {id:4,nm:"Stone Tortoise",ic:"🐢",el:"Earth",hp:80,atk:8,def:16,spd:4,sk1:{n:"Rock Slam",pow:14,el:"Earth",fx:"stun"},sk2:{n:"Shell Guard",pow:0,el:"Earth",fx:"fortify"}},
  {id:5,nm:"Gale Falcon",ic:"🦅",el:"Wind",hp:45,atk:15,def:4,spd:24,sk1:{n:"Wind Slash",pow:18,el:"Wind",fx:null},sk2:{n:"Tailwind",pow:0,el:"Wind",fx:"haste"}},
  {id:6,nm:"Dawn Stag",ic:"🦌",el:"Light",hp:70,atk:10,def:10,spd:14,sk1:{n:"Holy Charge",pow:16,el:"Light",fx:"blind"},sk2:{n:"Radiant Heal",pow:22,el:"Light",fx:"regen"}},
  {id:7,nm:"Shadow Panther",ic:"🐈‍⬛",el:"Dark",hp:52,atk:20,def:4,spd:20,sk1:{n:"Dark Pounce",pow:24,el:"Dark",fx:"bleed"},sk2:{n:"Vanish",pow:0,el:"Dark",fx:"evasion"}},
  {id:8,nm:"Void Wisp",ic:"👻",el:"Void",hp:40,atk:8,def:3,spd:16,sk1:{n:"Null Beam",pow:20,el:"Void",fx:"silence"},sk2:{n:"Phase Shift",pow:0,el:"Void",fx:"evasion"}},
  {id:9,nm:"Grove Bear",ic:"🐻",el:"Nature",hp:85,atk:14,def:12,spd:6,sk1:{n:"Vine Maul",pow:18,el:"Nature",fx:"poison"},sk2:{n:"Nature's Embrace",pow:24,el:"Nature",fx:"regen"}},
  {id:10,nm:"Iron Beetle",ic:"🪲",el:"Metal",hp:75,atk:10,def:18,spd:5,sk1:{n:"Steel Charge",pow:14,el:"Metal",fx:"stun"},sk2:{n:"Iron Shell",pow:0,el:"Metal",fx:"fortify"}},
  {id:11,nm:"Venom Spider",ic:"🕷️",el:"Poison",hp:48,atk:16,def:5,spd:16,sk1:{n:"Toxic Bite",pow:16,el:"Poison",fx:"poison"},sk2:{n:"Web Trap",pow:10,el:"Poison",fx:"slow"}},
  {id:12,nm:"Mind Owl",ic:"🦉",el:"Psychic",hp:50,atk:10,def:6,spd:15,sk1:{n:"Psychic Gaze",pow:18,el:"Psychic",fx:"confuse"},sk2:{n:"Dream Pulse",pow:14,el:"Psychic",fx:"sleep"}},
  {id:13,nm:"Echo Bat",ic:"🦇",el:"Sound",hp:42,atk:14,def:4,spd:20,sk1:{n:"Sonic Screech",pow:16,el:"Sound",fx:"confuse"},sk2:{n:"Echo Heal",pow:16,el:"Sound",fx:"regen"}},
  {id:14,nm:"Dense Panda",ic:"🐼",el:"Gravity",hp:90,atk:12,def:14,spd:3,sk1:{n:"Gravity Slam",pow:20,el:"Gravity",fx:"slow"},sk2:{n:"Heavy Guard",pow:0,el:"Gravity",fx:"fortify"}},
  {id:15,nm:"Arcane Fox",ic:"🦊",el:"Arcane",hp:48,atk:12,def:5,spd:18,sk1:{n:"Mystic Bolt",pow:20,el:"Arcane",fx:"weaken"},sk2:{n:"Mana Gift",pow:0,el:"Arcane",fx:"empower"}},
  {id:16,nm:"Lava Hound",ic:"🐕",el:"Fire",hp:70,atk:16,def:8,spd:10,sk1:{n:"Magma Bite",pow:20,el:"Fire",fx:"burn"},sk2:{n:"Ash Cloud",pow:10,el:"Fire",fx:"blind"}},
  {id:17,nm:"Glacier Wolf",ic:"🐺",el:"Ice",hp:62,atk:18,def:6,spd:14,sk1:{n:"Frost Fang",pow:22,el:"Ice",fx:"freeze"},sk2:{n:"Howling Blizzard",pow:14,el:"Ice",fx:"slow"}},
  {id:18,nm:"Spark Chameleon",ic:"🦎",el:"Lightning",hp:44,atk:14,def:5,spd:20,sk1:{n:"Shock Tongue",pow:16,el:"Lightning",fx:"stun"},sk2:{n:"Camouflage",pow:0,el:"Lightning",fx:"evasion"}},
  {id:19,nm:"Coral Crab",ic:"🦀",el:"Water",hp:68,atk:10,def:14,spd:6,sk1:{n:"Pinch",pow:14,el:"Water",fx:"bleed"},sk2:{n:"Bubble Shield",pow:0,el:"Water",fx:"shield"}},
  {id:20,nm:"Crystal Moth",ic:"🦋",el:"Earth",hp:38,atk:8,def:4,spd:16,sk1:{n:"Dust Cloud",pow:12,el:"Earth",fx:"blind"},sk2:{n:"Crystal Dust",pow:0,el:"Earth",fx:"reflect"}},
  {id:21,nm:"Storm Hawk",ic:"🦅",el:"Wind",hp:46,atk:16,def:3,spd:22,sk1:{n:"Talon Strike",pow:20,el:"Wind",fx:"bleed"},sk2:{n:"Uplift",pow:0,el:"Wind",fx:"haste"}},
  {id:22,nm:"Sun Rabbit",ic:"🐇",el:"Light",hp:35,atk:6,def:4,spd:22,sk1:{n:"Light Hop",pow:12,el:"Light",fx:null},sk2:{n:"Sunbeam Heal",pow:20,el:"Light",fx:"regen"}},
  {id:23,nm:"Night Mare",ic:"🐴",el:"Dark",hp:65,atk:18,def:8,spd:16,sk1:{n:"Shadow Trample",pow:22,el:"Dark",fx:"curse"},sk2:{n:"Dark Mist",pow:10,el:"Dark",fx:"blind"}},
  {id:24,nm:"Rift Jellyfish",ic:"🪼",el:"Void",hp:35,atk:6,def:2,spd:12,sk1:{n:"Null Sting",pow:16,el:"Void",fx:"weaken"},sk2:{n:"Phase Guard",pow:0,el:"Void",fx:"nullify"}},
  {id:25,nm:"Vine Frog",ic:"🐸",el:"Nature",hp:50,atk:12,def:6,spd:14,sk1:{n:"Toxic Tongue",pow:14,el:"Nature",fx:"poison"},sk2:{n:"Leaf Shield",pow:0,el:"Nature",fx:"shield"}},
  {id:26,nm:"Steel Scorpion",ic:"🦂",el:"Metal",hp:58,atk:16,def:12,spd:8,sk1:{n:"Metal Sting",pow:18,el:"Metal",fx:"bleed"},sk2:{n:"Iron Carapace",pow:0,el:"Metal",fx:"fortify"}},
  {id:27,nm:"Toxic Newt",ic:"🦎",el:"Poison",hp:45,atk:12,def:6,spd:14,sk1:{n:"Acid Spit",pow:14,el:"Poison",fx:"poison"},sk2:{n:"Toxic Skin",pow:0,el:"Poison",fx:"thorns"}},
  {id:28,nm:"Dream Moth",ic:"🦋",el:"Psychic",hp:36,atk:8,def:4,spd:18,sk1:{n:"Sleep Dust",pow:10,el:"Psychic",fx:"sleep"},sk2:{n:"Mind Link",pow:0,el:"Psychic",fx:"empower"}},
  {id:29,nm:"Bell Toad",ic:"🐸",el:"Sound",hp:55,atk:10,def:8,spd:10,sk1:{n:"Croak Wave",pow:14,el:"Sound",fx:"slow"},sk2:{n:"Harmony Croak",pow:16,el:"Sound",fx:"regen"}},
  {id:30,nm:"Gravity Snail",ic:"🐌",el:"Gravity",hp:100,atk:6,def:20,spd:1,sk1:{n:"Weight Crush",pow:16,el:"Gravity",fx:"slow"},sk2:{n:"Dense Shell",pow:0,el:"Gravity",fx:"barrier"}},
  {id:31,nm:"Prismatic Sprite",ic:"✨",el:"Arcane",hp:30,atk:10,def:2,spd:20,sk1:{n:"Prism Shot",pow:18,el:"Arcane",fx:"weaken"},sk2:{n:"Arcane Gift",pow:0,el:"Arcane",fx:"empower"}},
  {id:32,nm:"Ember Drake",ic:"🐉",el:"Fire",hp:75,atk:18,def:10,spd:12,sk1:{n:"Drake Breath",pow:24,el:"Fire",fx:"burn"},sk2:{n:"Wing Gust",pow:12,el:"Fire",fx:"weaken"}},
  {id:33,nm:"Tundra Yak",ic:"🐂",el:"Ice",hp:88,atk:14,def:14,spd:4,sk1:{n:"Frost Charge",pow:18,el:"Ice",fx:"stun"},sk2:{n:"Thick Fur",pow:0,el:"Ice",fx:"fortify"}},
  {id:34,nm:"Plasma Eel",ic:"🐍",el:"Lightning",hp:40,atk:20,def:3,spd:18,sk1:{n:"Discharge",pow:22,el:"Lightning",fx:"stun"},sk2:{n:"Volt Shield",pow:0,el:"Lightning",fx:"reflect"}},
  {id:35,nm:"Tidal Whale",ic:"🐋",el:"Water",hp:120,atk:8,def:12,spd:2,sk1:{n:"Tidal Wave",pow:20,el:"Water",fx:"slow"},sk2:{n:"Ocean's Blessing",pow:28,el:"Water",fx:"regen"}},
  {id:36,nm:"Quake Mole",ic:"🐹",el:"Earth",hp:60,atk:14,def:10,spd:8,sk1:{n:"Burrow Strike",pow:18,el:"Earth",fx:"stun"},sk2:{n:"Tunnel",pow:0,el:"Earth",fx:"evasion"}},
  {id:37,nm:"Zephyr Hummingbird",ic:"🐦",el:"Wind",hp:25,atk:10,def:2,spd:28,sk1:{n:"Quick Peck",pow:12,el:"Wind",fx:null},sk2:{n:"Speed Blessing",pow:0,el:"Wind",fx:"haste"}},
  {id:38,nm:"Holy Phoenix",ic:"🦚",el:"Light",hp:55,atk:12,def:6,spd:16,sk1:{n:"Sacred Flame",pow:18,el:"Light",fx:"burn"},sk2:{n:"Resurrection Aura",pow:0,el:"Light",fx:"regen"}},
  {id:39,nm:"Abyss Squid",ic:"🦑",el:"Dark",hp:58,atk:16,def:6,spd:14,sk1:{n:"Ink Blast",pow:16,el:"Dark",fx:"blind"},sk2:{n:"Tentacle Drain",pow:14,el:"Dark",fx:"weaken"}},

];

const ALLY_RECRUITS = [
  { nm:"Aria", ic:"🗡️", clsId:"assassin" },
  { nm:"Kael", ic:"🛡️", clsId:"paladin" },
  { nm:"Luna", ic:"🌙", clsId:"dream" },
  { nm:"Vex", ic:"🕳️", clsId:"voidmage" },
  { nm:"Zara", ic:"🏹", clsId:"ranger" },
  { nm:"Nyx", ic:"🎭", clsId:"puppet" },
  { nm:"Orion", ic:"⏳", clsId:"chrono" },
  { nm:"Sera", ic:"✝️", clsId:"priest" },
  { nm:"Rook", ic:"👊", clsId:"monk" },
  { nm:"Mira", ic:"🔮", clsId:"sorcerer" },
  { nm:"Talon", ic:"🌀", clsId:"gravity" },
  { nm:"Lyra", ic:"🎵", clsId:"bard" },
];

const SHRINE_LORE = [
  "In the first dawn, the Veil was not a barrier but a hymn, sung by the gods to keep the young world from breaking under its own wonder.",
  "The oldest priests taught that each shrine stands where a god once paused to listen to mortals, and the stone remembers that kindness.",
  "When storms crossed the first seas, it was said the tide-gods braided moonlight into the waves so sailors could still find home.",
  "Some say the gods did not create fire, but borrowed it from a star and entrusted it to mortal hands for only a little while.",
  "Before kingdoms rose, shrinekeepers carried no weapons; their faith alone was believed to calm beasts and bitter spirits alike.",
  "One legend claims the earth-god shaped mountains as resting places for grief, so sorrow would become stone rather than poison the heart.",
  "The sky-gods were once twins, according to temple songs—one bright, one quiet—and all winds are their unfinished conversation.",
  "At the edges of old forests, children were told to whisper thanks, because every tree might be listening on behalf of a patient god.",
  "The first healers believed miracles were not granted freely; they were invitations for mortals to become gentler than the world around them.",
  "When a shrine bell rings without a hand upon it, elders say a forgotten god has remembered the place for a single breath.",
  "Ancient tablets speak of a god of thresholds who blesses not victories, but the courage to step into uncertainty anyway.",
  "Many rivers are said to follow paths traced long ago by the fingertips of a wandering goddess searching for someone she lost.",
  "There is a tale that stars are holes pricked in the Veil by curious gods who wished to watch mortals dream.",
  "The god of mercy, in some villages, is never named aloud; people say compassion is strongest when it arrives without praise.",
  "Old sailors swore that if you made an honest vow at a shrine by the shore, the sea itself would remember your name.",
  "Temple mosaics often show the gods seated beside mortals at common tables, as a reminder that divinity once preferred closeness over distance.",
  "The oldest shrines were built without roofs because the first worshippers believed no prayer should be ashamed of the open sky.",
  "One fireside myth says winter began when a lonely god asked the sun to linger less, just to know what waiting felt like.",
  "The scholars of Ashford teach that courage and reverence are siblings; both begin with admitting something greater than yourself exists.",
  "A forgotten hymn from the south says the gods once planted flowers in battlefields so the dead would not feel abandoned by beauty.",
  "The moonlit shrines of the north are said to answer only those who arrive with questions they are afraid to speak aloud.",
  "Some priests insist the gods envy mortals for one reason alone: only mortals can change in ways even heaven cannot predict.",
  "An old saying from Coral Harbor claims every lighthouse flame carries a blessing first borrowed from a shrine's eternal candle.",
  "The god of silence is not feared in older texts; silence was described as the sacred room in which truth finally becomes audible.",
  "When the first kings demanded signs from heaven, the gods answered not with thunder, but with a season of especially kind harvests.",
  "A desert parable teaches that the gods hide wells in impossible places so hope never learns to obey common sense.",
  "Stonehelm masons believe every shrine column should lean ever so slightly inward, symbolizing the world bowing toward grace.",
  "In one beloved tale, a goddess disguised herself as a weary traveler for a hundred years just to see if kindness still survived among strangers.",
  "Some rift scholars suspect the gods did not seal the Veil out of fear, but out of love—for too much wonder can wound as easily as it can save.",
  "A village prayer asks not for triumph, but for a heart sturdy enough to remain gentle after disappointment.",
  "The oldest shrine in Frostwall bears no inscription because its builders said true comfort should not need explanation.",
  "Children in Verdant Deep are taught that birdsong is how lesser spirits rehearse before speaking properly to the gods.",
  "A long-lost chronicle claims even the gods once argued over whether mortals should be given magic; compassion won by a single vote.",
  "The sea-priests say the gods count devotion less by offerings and more by whether you become easier for others to rest beside.",
  "There is a myth of a patient god who answers every prayer eventually, though sometimes the answer arrives disguised as another chance.",
  "At twilight, some shrines are said to stand in two worlds at once, so a prayer spoken there can comfort both the living and the departed.",
  "The first gardeners believed flowers at shrines bloomed brighter because the gods delighted in fragile things that still chose to open.",
  "One eastern legend says the gods invented music after hearing mortals grieve and wishing to give sorrow a kinder shape.",
  "The oldest battle liturgies end with thanks, not for strength, but for every hand that helped carry it.",
  "A final teaching carved beneath a ruined altar reads: 'The gods remain where mercy is practiced, even when no one speaks their names.'",
];

const ALLY_SKILL_TEMPLATES = {
  paladin:[{n:"Oath Strike",pow:18,el:"Light",fx:"weaken"},{n:"Solar Bastion",pow:0,el:"Metal",fx:"shield"}],
  assassin:[{n:"Murk Reaver",pow:22,el:"Dark",fx:"bleed"},{n:"Nightshroud Step",pow:0,el:"Dark",fx:"evasion"}],
  sorcerer:[{n:"Prism Rupture",pow:24,el:"Arcane",fx:"weaken"},{n:"Overflow Halo",pow:0,el:"Arcane",fx:"empower"}],
  priest:[{n:"Radiant Lance",pow:18,el:"Light",fx:"blind"},{n:"Mercy Litany",pow:0,el:"Light",fx:"regen"}],
  ranger:[{n:"Hunter's Mark",pow:19,el:"Nature",fx:"expose"},{n:"Canopy Rush",pow:0,el:"Wind",fx:"haste"}],
  koen:[{n:"Petal Inferno",pow:24,el:"Fire",fx:"burn"},{n:"Scarlet Bloom",pow:0,el:"Nature",fx:"empower"}],
  shouei:[{n:"Mirror Frost",pow:20,el:"Ice",fx:"freeze"},{n:"Still Water",pow:0,el:"Water",fx:"shield"}],
  phoenix:[{n:"Cinder Rush",pow:21,el:"Fire",fx:"burn"},{n:"Ashen Recovery",pow:0,el:"Fire",fx:"regen"}],
  chrono:[{n:"Hourglass Rend",pow:20,el:"Arcane",fx:"slow"},{n:"Second Hand",pow:0,el:"Gravity",fx:"haste"}],
  dream:[{n:"Night Whisper",pow:20,el:"Psychic",fx:"sleep"},{n:"Devourer's Veil",pow:0,el:"Psychic",fx:"evasion"}],
  voidmage:[{n:"Abyssal Maw",pow:24,el:"Void",fx:"silence"},{n:"Hollow Horizon",pow:0,el:"Void",fx:"nullify"}],
  rune:[{n:"Sealbreaker",pow:18,el:"Earth",fx:"stun"},{n:"Bastion Glyph",pow:0,el:"Metal",fx:"fortify"}],
  bard:[{n:"Dissonant Verse",pow:18,el:"Sound",fx:"confuse"},{n:"Crescendo March",pow:0,el:"Wind",fx:"haste"}],
  gravity:[{n:"Collapse Vector",pow:21,el:"Gravity",fx:"slow"},{n:"Worldweight Rampart",pow:0,el:"Gravity",fx:"barrier"}],
  sound:[{n:"Resonance Spike",pow:20,el:"Sound",fx:"confuse"},{n:"Bell Choir",pow:0,el:"Sound",fx:"empower"}],
  puppet:[{n:"Marionette Sever",pow:20,el:"Dark",fx:"curse"},{n:"Grand Thread",pow:0,el:"Psychic",fx:"weaken"}],
  tide:[{n:"Riptide",pow:20,el:"Water",fx:"slow"},{n:"Choir of Foam",pow:0,el:"Sound",fx:"shield"}],
  monk:[{n:"Stone Sutra",pow:22,el:"Earth",fx:"stun"},{n:"Adamant Breath",pow:0,el:"Earth",fx:"fortify"}],
  primal:[{n:"Wild Burst",pow:23,el:"Fire",fx:"burn"},{n:"Origin Pulse",pow:0,el:"Null",fx:"empower"}],
  hexblade:[{n:"Blight Cut",pow:21,el:"Poison",fx:"poison"},{n:"Maledict Guard",pow:0,el:"Dark",fx:"thorns"}],
  gambler:[{n:"Loaded Slash",pow:20,el:"Arcane",fx:"weaken"},{n:"Marked Tempo",pow:0,el:"Lightning",fx:"haste"}],
};

const ALLY_ROLE_PASSIVES = {
  paladin:{ nm:"Solar Testament", bonus:"guard", mult:1.12 }, assassin:{ nm:"Midnight Pounce", bonus:"damage", mult:1.14 }, sorcerer:{ nm:"Arc Overflow", bonus:"support", mult:1.12 }, priest:{ nm:"Mercy Reliquary", bonus:"support", mult:1.18 }, ranger:{ nm:"Canopy Hunter", bonus:"damage", mult:1.12 },
  koen:{ nm:"Bloomfire Pulse", bonus:"damage", mult:1.14 }, shouei:{ nm:"Mirror Frost", bonus:"fx", mult:1.15 }, phoenix:{ nm:"Ash Resolve", bonus:"guard", mult:1.12 }, chrono:{ nm:"Second Hand", bonus:"speed", mult:1.16 }, dream:{ nm:"Dream-Devourer Thread", bonus:"fx", mult:1.15 },
  voidmage:{ nm:"Hollow Current", bonus:"fx", mult:1.14 }, rune:{ nm:"Bastion Circuit", bonus:"guard", mult:1.16 }, bard:{ nm:"Final Encore", bonus:"support", mult:1.15 }, gravity:{ nm:"Worldweight Halo", bonus:"guard", mult:1.16 }, sound:{ nm:"Cathedral Echo", bonus:"fx", mult:1.12 },
  puppet:{ nm:"Grand Marionette", bonus:"fx", mult:1.14 }, tide:{ nm:"Siren Choir", bonus:"support", mult:1.15 }, monk:{ nm:"Mountain Rhythm", bonus:"damage", mult:1.13 }, primal:{ nm:"Wild Shift", bonus:"damage", mult:1.13 }, hexblade:{ nm:"Cruel Bloom", bonus:"damage", mult:1.14 }, gambler:{ nm:"Marked Deck", bonus:"support", mult:1.13 },
};

function mkShrineAlly(level, excludeCid) {
  const cand = ALLY_RECRUITS.filter(a => a.clsId !== excludeCid);
  const tpl = P(cand.length ? cand : ALLY_RECRUITS);
  const ac = CLS.find(x => x.id === tpl.clsId) || P(CLS);
  const mhp = Math.floor(ac.st.hp * (1 + level * 0.1));
  const skillTpl = ALLY_SKILL_TEMPLATES[ac.id] || [{n: ac.el + " Strike", pow: 18, el: ac.el, fx: null}, {n: "Aid", pow: 0, el: ac.el, fx: "regen"}];
  const mmp = Math.floor((ac.st.mp || 60) * (1 + level * 0.08));
  const allyPassive = ALLY_ROLE_PASSIVES[ac.id] || { nm:"Shrine Blessing", bonus:"support", mult:1.12 };
  return { nm: tpl.nm, cls: ac, hp: mhp, mhp, mp: mmp, mmp, ic: tpl.ic || ac.ic, el: ac.el, el2: ac.el2 || null, efx: [], role: allyPassive.bonus, passiveName: allyPassive.nm, passive: allyPassive.nm, passiveBonus: allyPassive.bonus, passiveMult: allyPassive.mult, sk1: { ...skillTpl[0] }, sk2: { ...skillTpl[1] } };
}

const ENEMY_SKILL_THEMES = {
  Fire:["Cinder Fang","Ash Burst","Scorchclaw","Inferno Snap","Blaze Volley"],
  Water:["Undertow","Brine Lash","Tide Spear","Floodbite","Current Crush"],
  Ice:["Rime Claw","Frostbite Arc","Glacier Shard","Whiteout","Permafrost Jolt"],
  Lightning:["Volt Rend","Storm Lash","Static Break","Thunder Fang","Arc Flare"],
  Earth:["Stone Breaker","Dust Hammer","Faultline","Quake Fist","Gravel Crush"],
  Wind:["Gale Slice","Cyclone Peck","Zephyr Rush","Windlash","Tempest Dive"],
  Light:["Sun Lance","Halo Break","Radiant Flare","Dawn Ray","Saintfire"],
  Dark:["Grave Rend","Night Slash","Soul Hook","Dusk Fang","Shadow Flare"],
  Void:["Null Pulse","Abyss Cut","Entropy Bite","Void Spike","Oblivion Lash"],
  Nature:["Bramble Snap","Root Crush","Wild Pollen","Thorn Volley","Sapfang"],
  Metal:["Steel Crash","Iron Rend","Geargrind","Chrome Fang","Blade Storm"],
  Poison:["Toxic Spit","Venom Lash","Corrode","Blight Sting","Miasma Fang"],
  Psychic:["Mind Break","Dream Spear","Panic Pulse","Thoughtlash","Hallucinate"],
  Sound:["Echo Burst","Resonant Cut","Shriek","Sound Lance","Dissonance"],
  Gravity:["Weightfall","Crushing Orbit","Pull Shock","Grav Lash","Singularity Tap"],
  Arcane:["Astral Bolt","Rune Break","Mystic Fang","Aether Lance","Spellrend"],
};

function fmtMs(rem) {
  const total = Math.max(0, rem|0);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  return m + ':' + String(s).padStart(2,'0');
}

// ENEMY GENERATOR
const EN_N = ["Goblin","Slime","Wolf","Spider","Skeleton","Zombie","Imp","Drake","Golem","Wraith","Bandit","Rogue","Knight","Cultist","Berserker","Witch","Ogre","Harpy","Serpent","Mimic"];
const EN_P = ["Shadow","Flame","Frost","Thunder","Venom","Stone","Wind","Cursed","Ancient","Elite","Dire","Feral"];
const MON_SK = [
  { n: "Night Slash", pow: 26, el: "Dark", fx: "bleed" },
  { n: "Void Pulse", pow: 30, el: "Void", fx: "weaken" },
  { n: "Mind Break", pow: 28, el: "Psychic", fx: "confuse" },
  { n: "Soul Drain", pow: 24, el: "Dark", fx: "curse" },
  { n: "Gravity Crush", pow: 32, el: "Gravity", fx: "slow" },
];

const ENEMY_SKILL_POOLS = {
  Fire:[
    { n:"Cinder Lash", kind:"damage", pow:18, fx:"burn", fxDur:3 },
    { n:"Ashen Pressure", kind:"debuff", pow:12, fx:"weaken", fxDur:3 },
    { n:"Kindle Rage", kind:"support", pow:0, fx:"empower", fxDur:2 },
    { n:"Pyre Snap", kind:"damage", pow:24, fx:null },
    { n:"Scorch Vein", kind:"damage", pow:15, fx:"expose", fxDur:2 },
  ],
  Water:[
    { n:"Undertow Slice", kind:"damage", pow:17, fx:"slow", fxDur:3 },
    { n:"Brine Drain", kind:"debuff", pow:11, fx:"weaken", fxDur:3 },
    { n:"Tidal Guard", kind:"support", pow:0, fx:"shield", fxDur:2 },
    { n:"Salt Surge", kind:"damage", pow:23, fx:null },
    { n:"Riptide Coil", kind:"damage", pow:15, fx:"bleed", fxDur:2 },
  ],
  Ice:[
    { n:"Rime Fang", kind:"damage", pow:16, fx:"freeze", fxDur:2 },
    { n:"Winter Bind", kind:"debuff", pow:10, fx:"slow", fxDur:4 },
    { n:"Glacier Ward", kind:"support", pow:0, fx:"barrier", fxDur:1 },
    { n:"Hail Pierce", kind:"damage", pow:24, fx:null },
    { n:"Shiver Cut", kind:"damage", pow:14, fx:"weaken", fxDur:2 },
  ],
  Lightning:[
    { n:"Volt Rake", kind:"damage", pow:17, fx:"stun", fxDur:1 },
    { n:"Static Leak", kind:"debuff", pow:11, fx:"weaken", fxDur:3 },
    { n:"Storm Tempo", kind:"support", pow:0, fx:"haste", fxDur:2 },
    { n:"Arc Snap", kind:"damage", pow:25, fx:null },
    { n:"Sky Rend", kind:"damage", pow:14, fx:"blind", fxDur:2 },
  ],
  Earth:[
    { n:"Stone Crush", kind:"damage", pow:18, fx:"stun", fxDur:1 },
    { n:"Dust Weight", kind:"debuff", pow:10, fx:"slow", fxDur:3 },
    { n:"Fault Guard", kind:"support", pow:0, fx:"fortify", fxDur:3 },
    { n:"Boulder Lash", kind:"damage", pow:24, fx:null },
    { n:"Quake Break", kind:"damage", pow:14, fx:"expose", fxDur:2 },
  ],
  Wind:[
    { n:"Gale Tear", kind:"damage", pow:17, fx:"slow", fxDur:3 },
    { n:"Dust Blind", kind:"debuff", pow:9, fx:"blind", fxDur:3 },
    { n:"Zephyr Skin", kind:"support", pow:0, fx:"evasion", fxDur:2 },
    { n:"Tempest Wing", kind:"damage", pow:23, fx:null },
    { n:"Air Rend", kind:"damage", pow:13, fx:"bleed", fxDur:2 },
  ],
  Light:[
    { n:"Radiant Cut", kind:"damage", pow:18, fx:"blind", fxDur:2 },
    { n:"Halo Break", kind:"debuff", pow:11, fx:"weaken", fxDur:3 },
    { n:"Lumen Guard", kind:"support", pow:0, fx:"regen", fxDur:3 },
    { n:"Solar Spear", kind:"damage", pow:24, fx:null },
    { n:"Dawn Seal", kind:"damage", pow:14, fx:"expose", fxDur:2 },
  ],
  Dark:[
    { n:"Night Slash", kind:"damage", pow:18, fx:"bleed", fxDur:3 },
    { n:"Gloom Hex", kind:"debuff", pow:11, fx:"curse", fxDur:3 },
    { n:"Shade Veil", kind:"support", pow:0, fx:"evasion", fxDur:2 },
    { n:"Umbral Tear", kind:"damage", pow:24, fx:null },
    { n:"Dusk Bite", kind:"damage", pow:14, fx:"blind", fxDur:2 },
  ],
  Void:[
    { n:"Void Pulse", kind:"damage", pow:17, fx:"silence", fxDur:2 },
    { n:"Entropy Leak", kind:"debuff", pow:10, fx:"weaken", fxDur:3 },
    { n:"Null Mantle", kind:"support", pow:0, fx:"nullify", fxDur:1 },
    { n:"Rift Bite", kind:"damage", pow:25, fx:null },
    { n:"Abyss Shear", kind:"damage", pow:13, fx:"curse", fxDur:2 },
  ],
  Nature:[
    { n:"Thorn Lash", kind:"damage", pow:16, fx:"poison", fxDur:4 },
    { n:"Spore Drift", kind:"debuff", pow:9, fx:"slow", fxDur:3 },
    { n:"Bloom Skin", kind:"support", pow:0, fx:"regen", fxDur:3 },
    { n:"Wild Snap", kind:"damage", pow:23, fx:null },
    { n:"Vine Pierce", kind:"damage", pow:13, fx:"expose", fxDur:2 },
  ],
  Metal:[
    { n:"Iron Crash", kind:"damage", pow:18, fx:"stun", fxDur:1 },
    { n:"Steel Rend", kind:"damage", pow:15, fx:"bleed", fxDur:3 },
    { n:"Alloy Guard", kind:"support", pow:0, fx:"shield", fxDur:2 },
    { n:"Chrome Slash", kind:"damage", pow:24, fx:null },
    { n:"Gear Crush", kind:"debuff", pow:10, fx:"weaken", fxDur:2 },
  ],
  Poison:[
    { n:"Toxic Spit", kind:"damage", pow:15, fx:"poison", fxDur:4 },
    { n:"Bile Mist", kind:"debuff", pow:9, fx:"weaken", fxDur:3 },
    { n:"Rot Skin", kind:"support", pow:0, fx:"thorns", fxDur:3 },
    { n:"Nox Bite", kind:"damage", pow:22, fx:null },
    { n:"Corrode Lash", kind:"damage", pow:13, fx:"expose", fxDur:2 },
  ],
  Psychic:[
    { n:"Mind Break", kind:"damage", pow:16, fx:"confuse", fxDur:2 },
    { n:"Dream Lull", kind:"debuff", pow:9, fx:"sleep", fxDur:1 },
    { n:"Focus Lattice", kind:"support", pow:0, fx:"barrier", fxDur:1 },
    { n:"Thought Tear", kind:"damage", pow:23, fx:null },
    { n:"Warp Gaze", kind:"damage", pow:12, fx:"weaken", fxDur:2 },
  ],
  Sound:[
    { n:"Echo Burst", kind:"damage", pow:16, fx:"confuse", fxDur:2 },
    { n:"Shriek Wave", kind:"debuff", pow:9, fx:"slow", fxDur:3 },
    { n:"Resonance Rise", kind:"support", pow:0, fx:"haste", fxDur:2 },
    { n:"Pulse Snap", kind:"damage", pow:23, fx:null },
    { n:"Howl Cut", kind:"damage", pow:12, fx:"blind", fxDur:2 },
  ],
  Gravity:[
    { n:"Gravity Crush", kind:"damage", pow:17, fx:"slow", fxDur:3 },
    { n:"Weight Break", kind:"debuff", pow:10, fx:"weaken", fxDur:3 },
    { n:"Orbit Guard", kind:"support", pow:0, fx:"fortify", fxDur:3 },
    { n:"Dense Blow", kind:"damage", pow:24, fx:null },
    { n:"Collapse", kind:"damage", pow:13, fx:"stun", fxDur:1 },
  ],
  Arcane:[
    { n:"Arc Sigil", kind:"damage", pow:17, fx:"silence", fxDur:2 },
    { n:"Rune Shear", kind:"debuff", pow:10, fx:"weaken", fxDur:3 },
    { n:"Mystic Ward", kind:"support", pow:0, fx:"empower", fxDur:2 },
    { n:"Prism Ray", kind:"damage", pow:24, fx:null },
    { n:"Spellbite", kind:"damage", pow:13, fx:"expose", fxDur:2 },
  ],
};

const ENEMY_ROLE_TITLES = {
  brute:["Ravager","Maw","Reaver","Crusher","Stalker"],
  controller:["Hexer","Binder","Oracle","Caller","Seer"],
  trickster:["Skulk","Mimic","Harrier","Dancer","Shade"]
};
const ENEMY_ELEMENT_PREFIXES = {
  Fire:["Cinder","Ash","Ember","Pyre"],
  Water:["Tide","Brine","Undertow","Mist"],
  Ice:["Frost","Glacier","Rime","Hail"],
  Lightning:["Storm","Volt","Thunder","Spark"],
  Nature:["Bramble","Bloom","Thorn","Wild"],
  Light:["Dawn","Halo","Sun","Radiant"],
  Dark:["Gloom","Night","Shade","Dread"],
  Earth:["Stone","Dust","Quake","Granite"],
  Wind:["Gale","Zephyr","Tempest","Sky"],
  Metal:["Iron","Steel","Chrome","Brass"],
  Poison:["Venom","Mire","Rot","Toxin"],
  Psychic:["Dream","Mind","Whisper","Moon"],
  Sound:["Echo","Shriek","Pulse","Resonant"],
  Gravity:["Mass","Orbit","Voidweight","Crush"],
  Arcane:["Rune","Astral","Sigil","Mystic"],
  Void:["Null","Abyss","Rift","Entropy"]
};
const ENEMY_PRIMARY_FX = { Fire:"burn", Water:"slow", Ice:"freeze", Lightning:"stun", Nature:"poison", Light:"weaken", Dark:"curse", Earth:"fortify", Wind:"blind", Metal:"expose", Poison:"poison", Psychic:"sleep", Sound:"confuse", Gravity:"slow", Arcane:"silence", Void:"weaken" };
function mkEnemySignatureSkill(el, role, tier) {
  const fx = ENEMY_PRIMARY_FX[el] || "weaken";
  const dur = FX(fx)?.dur || 2;
  if (role === "controller") return { n: (ENEMY_ELEMENT_PREFIXES[el]?.[0] || el) + " Snare", kind:"debuff", pow:10 + tier * 2, el, fx, fxDur: dur + (tier >= 4 ? 1 : 0) };
  if (role === "trickster") {
    const supportFx = ({ Fire:"empower", Water:"shield", Ice:"barrier", Lightning:"haste", Nature:"regen", Light:"shield", Dark:"evasion", Earth:"fortify", Wind:"haste", Metal:"shield", Poison:"thorns", Psychic:"barrier", Sound:"haste", Gravity:"fortify", Arcane:"empower", Void:"nullify" })[el] || "shield";
    return { n: (ENEMY_ELEMENT_PREFIXES[el]?.[1] || el) + " Shift", kind:"support", pow:0, el, fx:supportFx, fxDur: FX(supportFx)?.dur || 2 };
  }
  return { n: (ENEMY_ELEMENT_PREFIXES[el]?.[2] || el) + " Rend", kind:"damage", pow:20 + tier * 3, el, fx, fxDur: role === "brute" && tier >= 4 ? dur : 0 };
}
function mkEnemyName(el, role) {
  return (P(ENEMY_ELEMENT_PREFIXES[el] || [el]) + " " + P(ENEMY_ROLE_TITLES[role] || ENEMY_ROLE_TITLES.brute)).trim();
}
const ENEMY_ARCHETYPE_VARIANTS = {
  brute: [
    { key:"mauler", title:"Mauler", atk:1.12, def:1.02, supportBias:-0.04, debuffBias:-0.03 },
    { key:"bulwark", title:"Bulwark", atk:0.94, def:1.16, supportBias:0.08, supportFx:"fortify" },
    { key:"reaper", title:"Reaper", atk:1.08, spd:1.08, debuffBias:0.06, riderFx:"bleed" }
  ],
  controller: [
    { key:"hexcaller", title:"Hexcaller", mag:1.14, debuffBias:0.12, riderFx:"curse" },
    { key:"warden", title:"Warden", def:1.08, supportBias:0.12, supportFx:"barrier" },
    { key:"oracle", title:"Oracle", spd:1.08, supportBias:0.04, debuffBias:0.08, riderFx:"silence" }
  ],
  trickster: [
    { key:"skirmisher", title:"Skirmisher", atk:1.06, spd:1.12, supportBias:-0.02, debuffBias:0.05 },
    { key:"mirage", title:"Mirage", mag:1.08, spd:1.08, supportBias:0.1, supportFx:"evasion" },
    { key:"venin", title:"Venin", atk:1.04, debuffBias:0.1, riderFx:"poison" }
  ]
};
function enemyVariantFor(role, el, tier) {
  const pool = ENEMY_ARCHETYPE_VARIANTS[role] || ENEMY_ARCHETYPE_VARIANTS.brute;
  return pool[Math.abs(_h1((tier || 1) * 17 + el.length, role.length * 29 + (el.charCodeAt(0) || 0))) % pool.length];
}
function applyEnemyVariant(enemy, variant) {
  if (!enemy || !variant) return enemy;
  const next = { ...enemy, skills: (enemy.skills || []).map(sk => ({ ...sk })) };
  if (variant.atk) next.atk = Math.max(1, Math.floor(next.atk * variant.atk));
  if (variant.def) next.def = Math.max(1, Math.floor(next.def * variant.def));
  if (variant.mag) next.mag = Math.max(1, Math.floor(next.mag * variant.mag));
  if (variant.spd) next.spd = Math.max(1, Math.floor(next.spd * variant.spd));
  if (variant.supportBias) next.supportBias = (next.supportBias || 0) + variant.supportBias;
  if (variant.debuffBias) next.debuffBias = (next.debuffBias || 0) + variant.debuffBias;
  if (variant.supportFx && !next.skills.some(sk => sk.kind === "support" && sk.fx === variant.supportFx)) {
    next.skills = [{ n: variant.title + " Guard", kind:"support", pow:0, el: next.el, fx: variant.supportFx, fxDur: FX(variant.supportFx)?.dur || 2 }].concat(next.skills).slice(0, 4);
  }
  if (variant.riderFx) {
    next.skills = next.skills.map((sk, idx) => idx === 0 && sk.kind !== "support" && !sk.fx ? ({ ...sk, fx: variant.riderFx, fxDur: FX(variant.riderFx)?.dur || 2 }) : sk);
  }
  next.variantKey = variant.key;
  next.variantTitle = variant.title;
  next.archetype = variant.title;
  next.name = ((ENEMY_ELEMENT_PREFIXES[next.el]?.[0] || next.el) + " " + variant.title).trim();
  return next;
}
function mkEnemy(tier, forcedEl, forcedRole) {
  const s = 1 + tier * 0.24 + tier * tier * 0.02;
  const el = forcedEl || P(ELS);
  const seedRoll = Math.random();
  const role = forcedRole || (seedRoll < 0.34 ? "brute" : seedRoll < 0.68 ? "controller" : "trickster");
  const hpBase = Math.floor(R(38, 62) * s);
  const pool = ENEMY_SKILL_POOLS[el] || ENEMY_SKILL_POOLS.Arcane;
  const signature = mkEnemySignatureSkill(el, role, tier);
  const rolePool = [...pool].filter(sk => role === "brute" ? sk.kind !== "support" : role === "controller" ? sk.kind !== "support" || !!sk.fx : true);
  const shuffled = [...rolePool].sort(() => Math.random() - 0.5);
  const desired = role === "brute" ? 3 : 4;
  const picked = [];
  const sigKey = signature.n + "|" + signature.kind;
  [signature].concat(shuffled).forEach(sk => {
    if (picked.length >= desired) return;
    const key = sk.n + "|" + sk.kind;
    if (picked.some(ps => (ps.n + "|" + ps.kind) === key)) return;
    picked.push({
      ...sk,
      el: sk.el || el,
      pow: sk.pow ? Math.max(6, sk.pow + tier * (sk.kind === 'damage' ? 3 : 2)) : 0,
      fxDur: sk.fxDur || (sk.fx ? (FX(sk.fx)?.dur || 2) : 0),
    });
  });
  if (!picked.some(sk => sk.kind === "support") && role !== "brute") picked.push({ ...mkEnemySignatureSkill(el, "trickster", tier) });
  if (!picked.some(sk => sk.kind === "debuff") && role === "controller") picked.push({ ...mkEnemySignatureSkill(el, "controller", tier) });
  const skills = picked.slice(0, 4);
  const hp = Math.floor(hpBase * (role === "brute" ? 1.12 : role === "trickster" ? 0.92 : 1.0));
  const atk = Math.floor(R(7, 12) * s * (role === "brute" ? 1.16 : 0.98));
  const def = Math.floor(R(4, 8) * s * (role === "brute" ? 1.08 : role === "controller" ? 1.0 : 0.94));
  const spd = Math.floor(R(6, 12) * s * (role === "trickster" ? 1.18 : role === "controller" ? 1.02 : 0.96));
  const mag = Math.floor(R(5, 10) * s * (role === "controller" ? 1.18 : role === "trickster" ? 1.06 : 0.92));
  const mmp = Math.max(20, Math.floor((R(15, 24) + tier * 3) * (1 + tier * 0.06) * (role === "controller" ? 1.18 : role === "trickster" ? 1.08 : 0.94)));
  return applyEnemyVariant({
    id: ID(),
    name: mkEnemyName(el, role),
    archetype: role,
    hp, mhp: hp,
    cmp: mmp, mmp,
    atk, def, spd, mag,
    el,
    xp: Math.floor(R(12, 20) * s),
    gold: Math.floor(R(6, 14) * s),
    skills,
    role,
    supportBias: role === "trickster" ? 0.58 : role === "controller" ? 0.32 : 0.18,
    debuffBias: role === "controller" ? 0.6 : role === "trickster" ? 0.34 : 0.2,
    efx: [],
    boss: false
  }, enemyVariantFor(role, el, tier));
}
function mkEncounterPack(tier, count, themeEl, rolePlan) {
  const roles = Array.isArray(rolePlan) && rolePlan.length ? rolePlan : ["brute","controller","trickster"];
  const safeCount = Math.max(1, Math.min(4, count || 1));
  return Array.from({ length: safeCount }, (_, i) => mkEnemy(tier + (i >= 2 ? 1 : 0), themeEl, roles[i % roles.length]));
}
function rollWildEncounterCount() {
  const roll = Math.random();
  if (roll < 0.60) return 1;
  if (roll < 0.80) return 2;
  if (roll < 0.95) return 3;
  return 4;
}
const OUTPOST_BOSS_TEMPLATES = [
  { key:"ironjaw", name:"Ironjaw the Unyielding", el:"Metal", passiveKey:"ironjaw_bastion", supportBias:0.64, debuffBias:0.34, hp:310, atk:20, def:24, spd:8, mag:10, skills:[{n:"Siegebreaker",pow:28,el:"Metal",fx:"stun",fxDur:1,kind:"damage"},{n:"Bastion Roar",pow:0,el:"Earth",fx:"fortify",fxDur:3,kind:"support"},{n:"Iron Brand",pow:18,el:"Metal",fx:"expose",fxDur:3,kind:"debuff"},{n:"Crushing Route",pow:24,el:"Earth",fx:"weaken",fxDur:2,kind:"damage"}] },
  { key:"silkweave", name:"Silkweave the Puppeteer", el:"Psychic", passiveKey:"silkweave_grand_design", supportBias:0.54, debuffBias:0.68, hp:235, atk:14, def:12, spd:17, mag:24, skills:[{n:"Thread Lullaby",pow:16,el:"Psychic",fx:"sleep",fxDur:1,kind:"debuff"},{n:"Stage Veil",pow:0,el:"Dark",fx:"barrier",fxDur:1,kind:"support"},{n:"Mind Marionette",pow:18,el:"Psychic",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Curtain Wire",pow:22,el:"Dark",fx:"bleed",fxDur:3,kind:"damage"}] },
  { key:"blazefury", name:"Blazefury", el:"Fire", passiveKey:"blazefury_wildfire", supportBias:0.28, debuffBias:0.44, hp:255, atk:28, def:10, spd:18, mag:19, skills:[{n:"Wildfire Rush",pow:30,el:"Fire",fx:"burn",fxDur:3,kind:"damage"},{n:"Ash Sprint",pow:0,el:"Wind",fx:"haste",fxDur:2,kind:"support"},{n:"Scorch Rend",pow:20,el:"Fire",fx:"expose",fxDur:2,kind:"damage"},{n:"Cinder Surge",pow:24,el:"Fire",fx:"empower",fxDur:2,kind:"support"}] },
  { key:"scylla", name:"Venomqueen Scylla", el:"Poison", passiveKey:"scylla_venomcourt", supportBias:0.36, debuffBias:0.72, hp:240, atk:17, def:15, spd:15, mag:21, skills:[{n:"Queen's Fang",pow:21,el:"Poison",fx:"poison",fxDur:4,kind:"damage"},{n:"Brood Mist",pow:14,el:"Poison",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Silken Carapace",pow:0,el:"Nature",fx:"thorns",fxDur:3,kind:"support"},{n:"Mire Filament",pow:18,el:"Dark",fx:"bleed",fxDur:3,kind:"damage"}] },
  { key:"gravewatch", name:"Gravewatch", el:"Dark", passiveKey:"gravewatch_toll", supportBias:0.42, debuffBias:0.58, hp:285, atk:18, def:18, spd:11, mag:17, skills:[{n:"Mourning Bell",pow:18,el:"Sound",fx:"slow",fxDur:3,kind:"debuff"},{n:"Funeral Mirror",pow:0,el:"Dark",fx:"reflect",fxDur:2,kind:"support"},{n:"Grave Hex",pow:16,el:"Dark",fx:"curse",fxDur:3,kind:"debuff"},{n:"Pale Verdict",pow:26,el:"Dark",fx:"silence",fxDur:2,kind:"damage"}] },
  { key:"stormmarshal", name:"Stormmarshal Khar", el:"Lightning", passiveKey:"tempest_lord", supportBias:0.38, debuffBias:0.52, hp:250, atk:26, def:14, spd:19, mag:18, skills:[{n:"Volt Pike",pow:28,el:"Lightning",fx:"stun",fxDur:1,kind:"damage"},{n:"March of Sparks",pow:0,el:"Lightning",fx:"haste",fxDur:2,kind:"support"},{n:"Static Net",pow:18,el:"Lightning",fx:"slow",fxDur:3,kind:"debuff"},{n:"Thunder Tribunal",pow:25,el:"Lightning",fx:"weaken",fxDur:2,kind:"damage"}] },
  { key:"thornmatron", name:"Thornmatron Ysra", el:"Nature", passiveKey:"thornmatron_bloom", supportBias:0.46, debuffBias:0.56, hp:270, atk:19, def:18, spd:12, mag:18, skills:[{n:"Briar Lash",pow:22,el:"Nature",fx:"bleed",fxDur:3,kind:"damage"},{n:"Verdant Choir",pow:0,el:"Nature",fx:"regen",fxDur:3,kind:"support"},{n:"Rootgrip",pow:16,el:"Nature",fx:"slow",fxDur:3,kind:"debuff"},{n:"Crown of Thorns",pow:0,el:"Nature",fx:"thorns",fxDur:3,kind:"support"}] },
  { key:"chalkseer", name:"Chalkseer Varo", el:"Arcane", passiveKey:"rune_tyrant", supportBias:0.58, debuffBias:0.50, hp:260, atk:15, def:20, spd:13, mag:24, skills:[{n:"Rune Spear",pow:24,el:"Arcane",fx:"silence",fxDur:2,kind:"damage"},{n:"Sigil Bulwark",pow:0,el:"Earth",fx:"barrier",fxDur:1,kind:"support"},{n:"Seal Fracture",pow:18,el:"Arcane",fx:"expose",fxDur:2,kind:"debuff"},{n:"Etched Ruin",pow:26,el:"Arcane",fx:"curse",fxDur:2,kind:"damage"}] },
  { key:"floodjudge", name:"Floodjudge Neris", el:"Water", passiveKey:"tide_judge", supportBias:0.44, debuffBias:0.52, hp:275, atk:18, def:18, spd:12, mag:20, skills:[{n:"Undertow Sentence",pow:23,el:"Water",fx:"slow",fxDur:3,kind:"damage"},{n:"Sea Wall",pow:0,el:"Water",fx:"shield",fxDur:2,kind:"support"},{n:"Drownmark",pow:17,el:"Water",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Leviathan Gavel",pow:26,el:"Water",fx:"stun",fxDur:1,kind:"damage"}] },
  { key:"hushsaint", name:"Hush Saint", el:"Sound", passiveKey:"hush_saint", supportBias:0.54, debuffBias:0.62, hp:245, atk:16, def:14, spd:16, mag:22, skills:[{n:"Choir Break",pow:20,el:"Sound",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Silent Nave",pow:0,el:"Sound",fx:"nullify",fxDur:1,kind:"support"},{n:"Bellglass",pow:18,el:"Sound",fx:"stun",fxDur:1,kind:"damage"},{n:"Mute Procession",pow:16,el:"Sound",fx:"silence",fxDur:2,kind:"debuff"}] },
  { key:"sandreaver", name:"Sandreaver", el:"Earth", passiveKey:"sandreaver_wall", supportBias:0.36, debuffBias:0.46, hp:300, atk:24, def:22, spd:10, mag:13, skills:[{n:"Quarry Maw",pow:29,el:"Earth",fx:"weaken",fxDur:2,kind:"damage"},{n:"Dust Mantle",pow:0,el:"Earth",fx:"fortify",fxDur:3,kind:"support"},{n:"Shale Crush",pow:21,el:"Earth",fx:"stun",fxDur:1,kind:"damage"},{n:"Faultline Step",pow:0,el:"Earth",fx:"haste",fxDur:2,kind:"support"}] },
  { key:"glacierabbot", name:"Glacier Abbot", el:"Ice", passiveKey:"frost_abbot", supportBias:0.52, debuffBias:0.60, hp:255, atk:16, def:16, spd:13, mag:24, skills:[{n:"Rime Decree",pow:19,el:"Ice",fx:"freeze",fxDur:2,kind:"debuff"},{n:"White Chapel",pow:0,el:"Ice",fx:"barrier",fxDur:1,kind:"support"},{n:"Shiver Oath",pow:17,el:"Ice",fx:"slow",fxDur:3,kind:"debuff"},{n:"Cold Benediction",pow:24,el:"Ice",fx:"weaken",fxDur:2,kind:"damage"}] },
  { key:"sunlancer", name:"Sunlancer Ophir", el:"Light", passiveKey:"sunlancer_oath", supportBias:0.50, debuffBias:0.42, hp:265, atk:22, def:17, spd:15, mag:19, skills:[{n:"Radiant Skewer",pow:25,el:"Light",fx:"expose",fxDur:2,kind:"damage"},{n:"Dayshield",pow:0,el:"Light",fx:"shield",fxDur:2,kind:"support"},{n:"Dawn Command",pow:0,el:"Light",fx:"empower",fxDur:2,kind:"support"},{n:"Mercyless Noon",pow:23,el:"Light",fx:"weaken",fxDur:2,kind:"damage"}] },
  { key:"velvetfang", name:"Velvetfang", el:"Dark", passiveKey:"velvetfang_hunt", supportBias:0.32, debuffBias:0.58, hp:248, atk:27, def:12, spd:20, mag:17, skills:[{n:"Midnight Pounce",pow:28,el:"Dark",fx:"bleed",fxDur:3,kind:"damage"},{n:"Moondrip",pow:18,el:"Dark",fx:"blind",fxDur:2,kind:"debuff"},{n:"Royal Stalk",pow:0,el:"Dark",fx:"evasion",fxDur:2,kind:"support"},{n:"Throat Hymn",pow:22,el:"Dark",fx:"silence",fxDur:2,kind:"damage"}] },
  { key:"mirebishop", name:"Mire Bishop", el:"Poison", passiveKey:"mirebishop_rot", supportBias:0.48, debuffBias:0.72, hp:252, atk:15, def:16, spd:14, mag:23, skills:[{n:"Rot Sermon",pow:17,el:"Poison",fx:"poison",fxDur:5,kind:"debuff"},{n:"Bog Censer",pow:0,el:"Poison",fx:"thorns",fxDur:3,kind:"support"},{n:"Plague Catechism",pow:16,el:"Poison",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Last Communion",pow:25,el:"Poison",fx:"curse",fxDur:2,kind:"damage"}] },
  { key:"windvicar", name:"Wind Vicar", el:"Wind", passiveKey:"windvicar_glory", supportBias:0.48, debuffBias:0.48, hp:238, atk:18, def:13, spd:21, mag:18, skills:[{n:"Zephyr Lash",pow:23,el:"Wind",fx:"blind",fxDur:2,kind:"damage"},{n:"Tailwind Rite",pow:0,el:"Wind",fx:"haste",fxDur:2,kind:"support"},{n:"Sky Tithe",pow:17,el:"Wind",fx:"slow",fxDur:2,kind:"debuff"},{n:"Gale Communion",pow:22,el:"Wind",fx:"expose",fxDur:2,kind:"damage"}] },
  { key:"steelmatron", name:"Steel Matron", el:"Metal", passiveKey:"steelmatron_orders", supportBias:0.60, debuffBias:0.46, hp:298, atk:20, def:23, spd:9, mag:15, skills:[{n:"Chain Census",pow:20,el:"Metal",fx:"stun",fxDur:1,kind:"damage"},{n:"Citadel Orders",pow:0,el:"Metal",fx:"fortify",fxDur:3,kind:"support"},{n:"Stamped Weakness",pow:16,el:"Metal",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Anvil March",pow:27,el:"Metal",fx:"expose",fxDur:2,kind:"damage"}] },
  { key:"lunacensor", name:"Luna Censor", el:"Psychic", passiveKey:"lunacensor_mask", supportBias:0.56, debuffBias:0.70, hp:242, atk:14, def:13, spd:18, mag:25, skills:[{n:"Mask of Doubt",pow:18,el:"Psychic",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Dreamscreen",pow:0,el:"Psychic",fx:"barrier",fxDur:1,kind:"support"},{n:"Moonblind",pow:17,el:"Psychic",fx:"sleep",fxDur:1,kind:"debuff"},{n:"Court Erasure",pow:24,el:"Psychic",fx:"silence",fxDur:2,kind:"damage"}] },
  { key:"brazenidol", name:"Brazen Idol", el:"Fire", passiveKey:"idol_blaze", supportBias:0.34, debuffBias:0.40, hp:292, atk:25, def:19, spd:11, mag:16, skills:[{n:"Forge Breath",pow:27,el:"Fire",fx:"burn",fxDur:3,kind:"damage"},{n:"Smelter Skin",pow:0,el:"Fire",fx:"thorns",fxDur:3,kind:"support"},{n:"Kiln Stamp",pow:22,el:"Earth",fx:"stun",fxDur:1,kind:"damage"},{n:"Ash Covenant",pow:0,el:"Fire",fx:"empower",fxDur:2,kind:"support"}] },
  { key:"gravechorus", name:"Grave Chorus", el:"Dark", passiveKey:"gravechorus_dirge", supportBias:0.50, debuffBias:0.66, hp:268, atk:17, def:17, spd:12, mag:22, skills:[{n:"Dirge of Nails",pow:18,el:"Dark",fx:"bleed",fxDur:3,kind:"damage"},{n:"Elegy Tax",pow:15,el:"Dark",fx:"curse",fxDur:3,kind:"debuff"},{n:"Crypt Echo",pow:0,el:"Dark",fx:"reflect",fxDur:2,kind:"support"},{n:"Last Toll",pow:25,el:"Sound",fx:"slow",fxDur:3,kind:"damage"}] }
];
const RIFT_BOSS_TEMPLATES = [
  { key:"entropy", name:"Entropy Incarnate", el:"Void", passiveKey:"entropy_engine", supportBias:0.56, debuffBias:0.72, hp:455, atk:23, def:18, spd:13, mag:27, skills:[{n:"Entropy Pulse",pow:26,el:"Void",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Abyss Crown",pow:0,el:"Void",fx:"shield",fxDur:2,kind:"support"},{n:"Quiet Rift",pow:22,el:"Void",fx:"silence",fxDur:2,kind:"debuff"},{n:"Collapse Bloom",pow:30,el:"Arcane",fx:"curse",fxDur:3,kind:"damage"}] },
  { key:"time", name:"Time Devourer", el:"Arcane", passiveKey:"time_maw", supportBias:0.48, debuffBias:0.66, hp:440, atk:22, def:17, spd:16, mag:25, skills:[{n:"Hourglass Bite",pow:28,el:"Arcane",fx:"slow",fxDur:3,kind:"damage"},{n:"Borrowed Turn",pow:0,el:"Gravity",fx:"haste",fxDur:2,kind:"support"},{n:"Delay Fracture",pow:22,el:"Gravity",fx:"stun",fxDur:1,kind:"debuff"},{n:"Future Tax",pow:24,el:"Arcane",fx:"weaken",fxDur:3,kind:"debuff"}] },
  { key:"null", name:"Null Sovereign", el:"Void", passiveKey:"null_throne", supportBias:0.6, debuffBias:0.64, hp:470, atk:21, def:20, spd:12, mag:28, skills:[{n:"Null Wave",pow:24,el:"Void",fx:"silence",fxDur:2,kind:"debuff"},{n:"Throne Guard",pow:0,el:"Void",fx:"nullify",fxDur:1,kind:"support"},{n:"King's Edict",pow:20,el:"Psychic",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Sovereign Rupture",pow:31,el:"Void",fx:"expose",fxDur:2,kind:"damage"}] },
  { key:"reality", name:"Reality Shaper", el:"Psychic", passiveKey:"reality_lattice", supportBias:0.52, debuffBias:0.68, hp:430, atk:20, def:18, spd:15, mag:29, skills:[{n:"Lattice Twist",pow:23,el:"Psychic",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Refraction Skin",pow:0,el:"Arcane",fx:"barrier",fxDur:1,kind:"support"},{n:"False Horizon",pow:19,el:"Psychic",fx:"blind",fxDur:2,kind:"debuff"},{n:"World Fold",pow:32,el:"Arcane",fx:"sleep",fxDur:1,kind:"damage"}] },
  { key:"primal", name:"Primordial Beast", el:"Nature", passiveKey:"primal_hunger", supportBias:0.24, debuffBias:0.44, hp:500, atk:29, def:17, spd:15, mag:22, skills:[{n:"Primal Gnaw",pow:29,el:"Nature",fx:"bleed",fxDur:3,kind:"damage"},{n:"Rage Molt",pow:0,el:"Nature",fx:"empower",fxDur:2,kind:"support"},{n:"Worldscar Roar",pow:24,el:"Nature",fx:"weaken",fxDur:3,kind:"damage"},{n:"Devouring Stampede",pow:33,el:"Earth",fx:"stun",fxDur:1,kind:"damage"}] },
  { key:"starhunger", name:"Star Hunger", el:"Arcane", passiveKey:"star_hunger", supportBias:0.46, debuffBias:0.62, hp:448, atk:22, def:18, spd:15, mag:27, skills:[{n:"Meteor Maw",pow:29,el:"Arcane",fx:"burn",fxDur:3,kind:"damage"},{n:"Astral Carapace",pow:0,el:"Arcane",fx:"barrier",fxDur:1,kind:"support"},{n:"Orbital Snare",pow:21,el:"Gravity",fx:"slow",fxDur:3,kind:"debuff"},{n:"Comet Tax",pow:24,el:"Arcane",fx:"weaken",fxDur:3,kind:"debuff"}] },
  { key:"mourningaxis", name:"Mourning Axis", el:"Sound", passiveKey:"axis_dirge", supportBias:0.54, debuffBias:0.70, hp:436, atk:18, def:19, spd:17, mag:28, skills:[{n:"Dirge Axis",pow:22,el:"Sound",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Quiet Vault",pow:0,el:"Void",fx:"nullify",fxDur:1,kind:"support"},{n:"Bell of Undoing",pow:20,el:"Sound",fx:"silence",fxDur:2,kind:"debuff"},{n:"Requiem Spin",pow:31,el:"Sound",fx:"stun",fxDur:1,kind:"damage"}] },
  { key:"crownofice", name:"Crown of White Hunger", el:"Ice", passiveKey:"white_hunger", supportBias:0.50, debuffBias:0.66, hp:452, atk:20, def:21, spd:14, mag:27, skills:[{n:"Starfrost Edict",pow:24,el:"Ice",fx:"freeze",fxDur:2,kind:"debuff"},{n:"Glacial Veil",pow:0,el:"Ice",fx:"shield",fxDur:2,kind:"support"},{n:"Cold Orbit",pow:22,el:"Ice",fx:"slow",fxDur:3,kind:"damage"},{n:"Winter Collapse",pow:30,el:"Ice",fx:"blind",fxDur:2,kind:"damage"}] },
  { key:"deepjudge", name:"Deep Judge", el:"Water", passiveKey:"deep_judge", supportBias:0.48, debuffBias:0.60, hp:460, atk:21, def:21, spd:13, mag:26, skills:[{n:"Abyss Verdict",pow:25,el:"Water",fx:"slow",fxDur:3,kind:"damage"},{n:"Pressure Mantle",pow:0,el:"Water",fx:"fortify",fxDur:3,kind:"support"},{n:"Drown Law",pow:21,el:"Water",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Black Undertow",pow:31,el:"Water",fx:"stun",fxDur:1,kind:"damage"}] },
  { key:"dreamcaul", name:"Dream Caul", el:"Psychic", passiveKey:"dream_caul", supportBias:0.58, debuffBias:0.72, hp:424, atk:17, def:18, spd:18, mag:30, skills:[{n:"Lull Cathedral",pow:20,el:"Psychic",fx:"sleep",fxDur:1,kind:"debuff"},{n:"Velvet Skin",pow:0,el:"Psychic",fx:"barrier",fxDur:1,kind:"support"},{n:"Thought Moths",pow:18,el:"Psychic",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Night Feast",pow:32,el:"Psychic",fx:"curse",fxDur:3,kind:"damage"}] },
  { key:"gravitomb", name:"Gravitomb", el:"Gravity", passiveKey:"gravitomb_mass", supportBias:0.44, debuffBias:0.58, hp:490, atk:25, def:22, spd:9, mag:24, skills:[{n:"Event Crush",pow:31,el:"Gravity",fx:"stun",fxDur:1,kind:"damage"},{n:"Weight of Ages",pow:21,el:"Gravity",fx:"slow",fxDur:3,kind:"debuff"},{n:"Mass Halo",pow:0,el:"Gravity",fx:"fortify",fxDur:3,kind:"support"},{n:"Singularity Bite",pow:30,el:"Gravity",fx:"expose",fxDur:2,kind:"damage"}] },
  { key:"sunkenarchive", name:"Sunken Archive", el:"Arcane", passiveKey:"sunken_archive", supportBias:0.60, debuffBias:0.64, hp:442, atk:18, def:20, spd:14, mag:29, skills:[{n:"Forgotten Script",pow:22,el:"Arcane",fx:"silence",fxDur:2,kind:"debuff"},{n:"Catalog Shield",pow:0,el:"Arcane",fx:"shield",fxDur:2,kind:"support"},{n:"Redacted Future",pow:21,el:"Void",fx:"blind",fxDur:2,kind:"debuff"},{n:"Index Collapse",pow:31,el:"Arcane",fx:"curse",fxDur:3,kind:"damage"}] },
  { key:"voidcathedral", name:"Void Cathedral", el:"Void", passiveKey:"void_cathedral", supportBias:0.62, debuffBias:0.66, hp:482, atk:20, def:23, spd:11, mag:28, skills:[{n:"Black Mass",pow:23,el:"Void",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Saintless Wall",pow:0,el:"Void",fx:"barrier",fxDur:1,kind:"support"},{n:"Mute Gospel",pow:20,el:"Void",fx:"silence",fxDur:2,kind:"debuff"},{n:"Apostate Rupture",pow:32,el:"Void",fx:"expose",fxDur:2,kind:"damage"}] },
  { key:"glassleviathan", name:"Glass Leviathan", el:"Light", passiveKey:"glass_leviathan", supportBias:0.40, debuffBias:0.48, hp:474, atk:26, def:21, spd:12, mag:24, skills:[{n:"Prismatic Bite",pow:31,el:"Light",fx:"blind",fxDur:2,kind:"damage"},{n:"Mirrorhide",pow:0,el:"Light",fx:"reflect",fxDur:2,kind:"support"},{n:"Lacerate Dawn",pow:24,el:"Light",fx:"bleed",fxDur:3,kind:"damage"},{n:"Sunsplinter",pow:22,el:"Light",fx:"expose",fxDur:2,kind:"debuff"}] },
  { key:"plagestar", name:"Plagestar", el:"Poison", passiveKey:"plagestar_rot", supportBias:0.46, debuffBias:0.74, hp:438, atk:18, def:18, spd:16, mag:28, skills:[{n:"Toxic Halo",pow:19,el:"Poison",fx:"poison",fxDur:5,kind:"debuff"},{n:"Fever Skin",pow:0,el:"Poison",fx:"thorns",fxDur:3,kind:"support"},{n:"Viral Eclipse",pow:21,el:"Poison",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Septic Rain",pow:30,el:"Poison",fx:"curse",fxDur:2,kind:"damage"}] },
  { key:"tempestoracle", name:"Tempest Oracle", el:"Lightning", passiveKey:"tempest_oracle", supportBias:0.44, debuffBias:0.60, hp:446, atk:22, def:17, spd:20, mag:25, skills:[{n:"Storm Reading",pow:24,el:"Lightning",fx:"stun",fxDur:1,kind:"damage"},{n:"Chain Forecast",pow:0,el:"Lightning",fx:"haste",fxDur:2,kind:"support"},{n:"Voltage Tax",pow:20,el:"Lightning",fx:"weaken",fxDur:3,kind:"debuff"},{n:"Sky Break",pow:31,el:"Lightning",fx:"blind",fxDur:2,kind:"damage"}] },
  { key:"namelessforge", name:"Nameless Forge", el:"Metal", passiveKey:"nameless_forge", supportBias:0.56, debuffBias:0.42, hp:498, atk:24, def:25, spd:9, mag:21, skills:[{n:"Anvil Memory",pow:26,el:"Metal",fx:"stun",fxDur:1,kind:"damage"},{n:"Bellows Ward",pow:0,el:"Metal",fx:"fortify",fxDur:3,kind:"support"},{n:"Slag Crown",pow:21,el:"Fire",fx:"burn",fxDur:3,kind:"damage"},{n:"Molten Decree",pow:22,el:"Metal",fx:"expose",fxDur:2,kind:"debuff"}] },
  { key:"verdantmaw", name:"Verdant Maw", el:"Nature", passiveKey:"verdant_maw", supportBias:0.34, debuffBias:0.50, hp:492, atk:28, def:19, spd:14, mag:22, skills:[{n:"Root Feast",pow:30,el:"Nature",fx:"bleed",fxDur:3,kind:"damage"},{n:"Bloom Armor",pow:0,el:"Nature",fx:"regen",fxDur:3,kind:"support"},{n:"Canopy Slam",pow:24,el:"Nature",fx:"stun",fxDur:1,kind:"damage"},{n:"Wild Miasma",pow:20,el:"Nature",fx:"poison",fxDur:4,kind:"debuff"}] },
  { key:"blackhorizon", name:"Black Horizon", el:"Dark", passiveKey:"black_horizon", supportBias:0.52, debuffBias:0.68, hp:458, atk:21, def:19, spd:16, mag:27, skills:[{n:"Horizon Cut",pow:27,el:"Dark",fx:"bleed",fxDur:3,kind:"damage"},{n:"Night Mantle",pow:0,el:"Dark",fx:"evasion",fxDur:2,kind:"support"},{n:"Velvet Edict",pow:21,el:"Dark",fx:"blind",fxDur:2,kind:"debuff"},{n:"Starless Fall",pow:31,el:"Dark",fx:"curse",fxDur:3,kind:"damage"}] },
  { key:"palegeometry", name:"Pale Geometry", el:"Arcane", passiveKey:"pale_geometry", supportBias:0.58, debuffBias:0.70, hp:432, atk:18, def:17, spd:17, mag:31, skills:[{n:"Angle Theft",pow:20,el:"Arcane",fx:"confuse",fxDur:2,kind:"debuff"},{n:"Proof Shield",pow:0,el:"Arcane",fx:"barrier",fxDur:1,kind:"support"},{n:"Diagram Break",pow:21,el:"Arcane",fx:"silence",fxDur:2,kind:"debuff"},{n:"Theorem Collapse",pow:32,el:"Arcane",fx:"stun",fxDur:1,kind:"damage"}] }
];
function scaleBossSkills(skills, level) {
  return (skills || []).map(sk => ({ ...sk, pow: sk.pow ? Math.max(8, Math.floor(sk.pow + level * (sk.kind === "damage" ? 1.6 : 1.1))) : 0, fxDur: sk.fxDur || (sk.fx ? (FX(sk.fx)?.dur || 2) : 0) }));
}
function mkOutpostBoss(level, pos) {
  const tpl = OUTPOST_BOSS_TEMPLATES[_h2(pos.x, pos.y) % OUTPOST_BOSS_TEMPLATES.length];
  const s = 1 + level * 0.06;
  return { id: ID(), name: tpl.name, bossKey: tpl.key, bossFamily: "outpost", hpPhaseFlags: {}, bossTurns: 0, el: tpl.el, hp: Math.floor(tpl.hp * s), mhp: Math.floor(tpl.hp * s), cmp: Math.floor(55 + level * 6), mmp: Math.floor(55 + level * 6), atk: Math.floor(tpl.atk * s), def: Math.floor(tpl.def * s), spd: tpl.spd + Math.floor(level * 0.05), mag: Math.floor(tpl.mag * s), xp: 90 + level * 9, gold: 55 + level * 6, skills: scaleBossSkills(tpl.skills, level), efx: [], boss: true, monPassive: MONSTER_PASSIVE_INFO[tpl.passiveKey] ? (CUSTOM_MONSTER_PASSIVES.find(p => p.id === tpl.passiveKey)?.nm || tpl.passiveKey) : tpl.passiveKey, monPassiveKey: tpl.passiveKey, supportBias: tpl.supportBias, debuffBias: tpl.debuffBias };
}
function mkRiftBoss(level, pos) {
  const tpl = RIFT_BOSS_TEMPLATES[_h2(pos.x, pos.y) % RIFT_BOSS_TEMPLATES.length];
  const s = 1 + level * 0.08;
  return { id: ID(), name: tpl.name, bossKey: tpl.key, bossFamily: "rift", hpPhaseFlags: {}, bossTurns: 0, el: tpl.el, hp: Math.floor(tpl.hp * s), mhp: Math.floor(tpl.hp * s), cmp: Math.floor(75 + level * 8), mmp: Math.floor(75 + level * 8), atk: Math.floor(tpl.atk * s), def: Math.floor(tpl.def * s), spd: tpl.spd + Math.floor(level * 0.06), mag: Math.floor(tpl.mag * s), xp: 200 + level * 20, gold: 100 + level * 15, skills: scaleBossSkills(tpl.skills, level), efx: [], boss: true, monPassive: CUSTOM_MONSTER_PASSIVES.find(p => p.id === tpl.passiveKey)?.nm || tpl.passiveKey, monPassiveKey: tpl.passiveKey, supportBias: tpl.supportBias, debuffBias: tpl.debuffBias };
}

const BATTLE_PROFILES = {
  wild: { enemyHp: 0.8, enemyAtk: 0.82, enemyDef: 0.84, enemyMag: 0.82, playerDamage: 1.1, playerHeal: 1.02, enemyDamage: 0.8, aiSupport: 0.2, aiDebuff: 0.18 },
  beast: { enemyHp: 0.96, enemyAtk: 0.9, enemyDef: 0.92, enemyMag: 0.9, playerDamage: 1.0, playerHeal: 1.0, enemyDamage: 0.88, aiSupport: 0.24, aiDebuff: 0.22 },
  pvp: { enemyHp: 1.56, enemyAtk: 0.98, enemyDef: 1.28, enemyMag: 0.98, playerDamage: 0.74, playerHeal: 0.92, enemyDamage: 0.9, aiSupport: 0.5, aiDebuff: 0.42, bossHp: 1.06, bossDamage: 1.04 },
  outpost: { enemyHp: 2.26, enemyAtk: 1.04, enemyDef: 1.46, enemyMag: 1.04, playerDamage: 0.56, playerHeal: 0.9, enemyDamage: 0.96, aiSupport: 0.62, aiDebuff: 0.54, bossHp: 1.35, bossDamage: 1.06 },
  rift: { enemyHp: 2.85, enemyAtk: 1.12, enemyDef: 1.6, enemyMag: 1.12, playerDamage: 0.48, playerHeal: 0.88, enemyDamage: 1.04, aiSupport: 0.7, aiDebuff: 0.62, bossHp: 1.62, bossDamage: 1.14 },
  train: { enemyHp: 1.0, enemyAtk: 0.0, enemyDef: 1.0, enemyMag: 0.0, playerDamage: 0.92, playerHeal: 1.0, enemyDamage: 0.0, aiSupport: 0.2, aiDebuff: 0.1 }
};
function battleProfile(type) {
  const base = BATTLE_PROFILES[type || 'wild'] || BATTLE_PROFILES.wild;
  return { ...base, supportBias: base.supportBias ?? base.aiSupport ?? 0.24, debuffBias: base.debuffBias ?? base.aiDebuff ?? 0.22 };
}
const MONSTER_PASSIVES = [
  { id:'stonehide', nm:'Stonehide', def:1.16 },
  { id:'bloodthirst', nm:'Bloodthirst', atk:1.12, lowHpDamage:1.16 },
  { id:'phasehide', nm:'Phase Hide', startFx:'evasion', startDur:2 },
  { id:'riftward', nm:'Rift Ward', startFx:'barrier', startDur:1 },
  { id:'elderguard', nm:'Elder Guard', startFx:'fortify', startDur:3 },
  { id:'venomglands', nm:'Venom Glands', fxChance:0.12 },
  { id:'quickfang', nm:'Quickfang', spd:3 },
  { id:'arcaneheart', nm:'Arcane Heart', mag:1.14 },
];
const BOSS_MONSTER_PASSIVES = [
  { id:'boss_aegis', nm:'Boss Aegis', startFx:'shield', startDur:3, def:1.12 },
  { id:'boss_overmind', nm:'Overmind', mag:1.16, fxChance:0.14 },
  { id:'boss_wrath', nm:'Wrath of the Rift', atk:1.14, lowHpDamage:1.2 },
  { id:'boss_phase', nm:'Phase Lord', startFx:'evasion', startDur:2, spd:2 },
];
const CUSTOM_MONSTER_PASSIVES = [
  { id:'ironjaw_bastion', nm:'Bastion of Ironjaw', startFx:'fortify', startDur:3, def:1.18 },
  { id:'silkweave_grand_design', nm:'Grand Design', startFx:'barrier', startDur:1, fxChance:0.14 },
  { id:'blazefury_wildfire', nm:'Wildfire Heart', startFx:'empower', startDur:2, lowHpDamage:1.18 },
  { id:'scylla_venomcourt', nm:'Venomcourt', fxChance:0.16 },
  { id:'gravewatch_toll', nm:'Grave Toll', startFx:'reflect', startDur:2, def:1.08 },
  { id:'entropy_engine', nm:'Entropy Engine', startFx:'shield', startDur:2, fxChance:0.16 },
  { id:'time_maw', nm:'Time Maw', startFx:'haste', startDur:2, spd:2 },
  { id:'null_throne', nm:'Null Throne', startFx:'nullify', startDur:1, def:1.1 },
  { id:'reality_lattice', nm:'Reality Lattice', startFx:'barrier', startDur:1, spd:1 },
  { id:'primal_hunger', nm:'Primal Hunger', lowHpDamage:1.22, atk:1.08 },
];
function applyMonsterPassiveSpec(e, mp) {
  if (!mp || !e) return;
  if (mp.atk) e.atk = Math.max(1, Math.floor(e.atk * mp.atk));
  if (mp.def) e.def = Math.max(1, Math.floor(e.def * mp.def));
  if (mp.mag) e.mag = Math.max(1, Math.floor(e.mag * mp.mag));
  if (mp.spd) e.spd = Math.max(1, e.spd + mp.spd);
  if (mp.fxChance) e.fxChanceBonus = Math.max(e.fxChanceBonus || 0, mp.fxChance);
  if (mp.lowHpDamage) e.lowHpDamage = Math.max(e.lowHpDamage || 1, mp.lowHpDamage);
  if (mp.startFx) {
    const ef = FX(mp.startFx);
    if (ef && !(e.efx || []).some(x => x.id === ef.id)) e.efx.push({ ...ef, tl: mp.startDur || ef.dur, justApplied:true });
  }
}
function normalizeEnemyForBattle(enemy, type, playerLevel) {
  const p = battleProfile(type);
  const e = { ...enemy, skills: (enemy.skills || []).map(sk => ({ ...sk })), efx: [...(enemy.efx || [])] };
  const boss = !!e.boss;
  e.hp = Math.max(1, Math.floor((e.hp || e.mhp || 1) * p.enemyHp * (boss ? (p.bossHp || 1.12) : 1)));
  e.mhp = e.hp;
  e.atk = Math.max(1, Math.floor((e.atk || 1) * p.enemyAtk));
  e.def = Math.max(1, Math.floor((e.def || 1) * p.enemyDef));
  e.mag = Math.max(1, Math.floor((e.mag || 1) * p.enemyMag));
  e.spd = Math.max(1, Math.floor(e.spd || 1));
  e.damageMult = p.enemyDamage * (boss ? (p.bossDamage || 1) : 1);
  const passivePool = boss ? BOSS_MONSTER_PASSIVES : MONSTER_PASSIVES;
  const presetPassive = e.monPassiveKey ? [...MONSTER_PASSIVES, ...BOSS_MONSTER_PASSIVES, ...CUSTOM_MONSTER_PASSIVES].find(mp => mp.id === e.monPassiveKey) : null;
  if (presetPassive) {
    e.monPassive = e.monPassive || presetPassive.nm;
    applyMonsterPassiveSpec(e, presetPassive);
  } else if (boss || Math.random() < 0.15) {
    const mp = { ...P(passivePool) };
    e.monPassive = mp.nm;
    e.monPassiveKey = mp.id;
    applyMonsterPassiveSpec(e, mp);
  }
  return e;
}
const BOSS_PHASE_EFFECTS = {
  outpost: {
    phase1: { fx:"fortify", dur:3, msg:"steadies the outpost line." },
    phase2: { fx:"empower", dur:2, msg:"goes for the kill." }
  },
  rift: {
    phase1: { fx:"barrier", dur:2, msg:"warps the battlefield." },
    phase2: { fx:"haste", dur:2, msg:"accelerates beyond mortal rhythm." }
  }
};
function addOrRefreshEffect(list, fxId, dur) {
  const ef = FX(fxId);
  if (!ef) return list || [];
  const arr = [...(list || [])];
  const idx = arr.findIndex(x => x.id === fxId);
  if (idx >= 0) arr[idx] = { ...arr[idx], tl: Math.max(arr[idx].tl || 0, dur || ef.dur), justApplied:true };
  else arr.push({ ...ef, tl: dur || ef.dur, justApplied:true });
  return arr;
}
function chooseEnemySkill(enemy, playerFx, encounterProfile) {
  const allSkills = enemy.skills || [];
  const supportChoices = allSkills.filter(s => s.kind === 'support');
  const debuffChoices = allSkills.filter(s => s.kind === 'debuff');
  const damageChoices = allSkills.filter(s => s.kind !== 'support' && s.kind !== 'debuff');
  const playerHasControlFx = (playerFx || []).some(ef => ['weaken','slow','blind','curse','silence','poison','burn','bleed','sleep','freeze','stun','expose','confuse'].includes(ef.id));
  const playerHasSetupFx = (playerFx || []).some(ef => ['weaken','expose','bleed','poison','burn','curse','sleep','confuse','slow','silence','blind'].includes(ef.id));
  const enemyHasSetup = (enemy.efx || []).some(ef => ['shield','fortify','regen','barrier','haste','empower','evasion','thorns','nullify','reflect'].includes(ef.id));
  const lowHp = enemy.hp < Math.floor((enemy.mhp || enemy.hp || 1) * 0.45);
  const supportBias = encounterProfile.supportBias + (enemy.supportBias || 0);
  const debuffBias = encounterProfile.debuffBias + (enemy.debuffBias || 0);
  const wantsSupport = supportChoices.length && (!enemyHasSetup || lowHp);
  const wantsDebuff = debuffChoices.length && !playerHasControlFx;
  if (enemy.boss) {
    const signatureSkill = chooseBossSignatureSkill(enemy, playerFx, allSkills);
    if (signatureSkill) return signatureSkill;
    if (wantsSupport && (!enemyHasSetup || enemy.bossTurns <= 1 || lowHp)) return P(supportChoices);
    if (wantsDebuff && (enemy.bossTurns <= 2 || !lowHp)) return P(debuffChoices);
    const comboDamage = damageChoices.find(sk => (enemy.efx || []).some(ef => ['empower','haste','fortify','barrier'].includes(ef.id)) && (sk.fx || sk.pow >= 26));
    if (comboDamage) return comboDamage;
    if (lowHp && damageChoices.length) return highestPowerSkill(damageChoices);
  }
  if (enemy.archetypeKey === 'mauler' && playerHasSetupFx) return highestPowerSkill(damageChoices) || P(allSkills);
  if (enemy.archetypeKey === 'bulwark' && wantsSupport && supportChoices.length) return pickSkillByFx(supportChoices, ['fortify','shield','barrier']) || P(supportChoices);
  if (enemy.archetypeKey === 'reaper' && !playerHasAnyFx(playerFx, ['bleed'])) return pickSkillByFx(debuffChoices.concat(damageChoices), ['bleed']) || P(debuffChoices.concat(damageChoices));
  if (enemy.archetypeKey === 'hexcaller' && !playerHasAnyFx(playerFx, ['curse','silence'])) return pickSkillByFx(debuffChoices.concat(damageChoices), ['curse','silence']) || P(debuffChoices.concat(damageChoices));
  if (enemy.archetypeKey === 'warden' && wantsSupport && supportChoices.length) return pickSkillByFx(supportChoices, ['barrier','shield','fortify']) || P(supportChoices);
  if (enemy.archetypeKey === 'oracle' && !playerHasAnyFx(playerFx, ['silence','slow','blind'])) return pickSkillByFx(debuffChoices.concat(damageChoices), ['silence','slow','blind']) || P(debuffChoices.concat(damageChoices));
  if (enemy.archetypeKey === 'mirage' && wantsSupport && supportChoices.length) return pickSkillByFx(supportChoices, ['evasion','haste']) || P(supportChoices);
  if (enemy.archetypeKey === 'venin' && !playerHasAnyFx(playerFx, ['poison'])) return pickSkillByFx(debuffChoices.concat(damageChoices), ['poison']) || P(debuffChoices.concat(damageChoices));
  if (wantsSupport && Math.random() < supportBias) return P(supportChoices);
  if (wantsDebuff && Math.random() < debuffBias) return P(debuffChoices);
  if (playerHasSetupFx && damageChoices.length && Math.random() < 0.58) return highestPowerSkill(damageChoices);
  if (damageChoices.length) return P(damageChoices);
  return allSkills.length ? P(allSkills) : null;
}
function applyBossPhasePressure(enemy, player, logLines) {
  if (!enemy?.boss) return enemy;
  const next = { ...enemy, hpPhaseFlags: { ...(enemy.hpPhaseFlags || {}) }, efx: [...(enemy.efx || [])] };
  const pct = (next.hp || 0) / Math.max(1, next.mhp || next.hp || 1);
  const familyFx = BOSS_PHASE_EFFECTS[next.bossFamily || "outpost"] || BOSS_PHASE_EFFECTS.outpost;
  if (!next.hpPhaseFlags.phase1 && pct <= 0.72) {
    next.hpPhaseFlags.phase1 = true;
    next.efx = addOrRefreshEffect(next.efx, familyFx.phase1.fx, familyFx.phase1.dur);
    logLines.push("👹 " + next.name + " " + familyFx.phase1.msg + " (" + (FX(familyFx.phase1.fx)?.nm || familyFx.phase1.fx) + ")");
  }
  if (!next.hpPhaseFlags.phase2 && pct <= 0.38) {
    next.hpPhaseFlags.phase2 = true;
    next.efx = addOrRefreshEffect(next.efx, familyFx.phase2.fx, familyFx.phase2.dur);
    if (next.bossFamily === "rift") next.efx = addOrRefreshEffect(next.efx, "empower", 2);
    logLines.push("⚠️ " + next.name + " " + familyFx.phase2.msg + " (" + (FX(familyFx.phase2.fx)?.nm || familyFx.phase2.fx) + ")");
    if (player && next.bossFamily === "rift") logLines.push("🌀 Rift pressure thickens around you.");
  }
  return next;
}

const BOSS_STYLE_BY_KEY = {
  ironjaw:"fortress", sandreaver:"fortress", namelessforge:"fortress", gravitomb:"fortress",
  silkweave:"hexweaver", dreamcaul:"hexweaver", palegeometry:"hexweaver", voidcathedral:"hexweaver",
  blazefury:"predator", velvetfang:"predator", verdantmaw:"predator", blackhorizon:"predator",
  stormmarshal:"tempest", tempestoracle:"tempest", glacierabbot:"tempest", crownofice:"tempest", deepjudge:"tempest", sunkenarchive:"tempest",
  scylla:"rotcourt", mirebishop:"rotcourt", plagestar:"rotcourt", thornmatron:"rotcourt", floodjudge:"tempest", chalkseer:"fortress", hushsaint:"hexweaver", sunlancer:"fortress", gravewatch:"hexweaver"
};
function enemyHasAnyFx(enemy, ids) {
  return (enemy?.efx || []).some(ef => ids.includes(ef.id));
}
function playerHasAnyFx(playerFx, ids) {
  return (playerFx || []).some(ef => ids.includes(ef.id));
}
function highestPowerSkill(skills) {
  return (skills || []).reduce((best, cur) => ((cur?.pow || 0) > (best?.pow || 0) ? cur : best), (skills || [])[0] || null);
}
function pickSkillByFx(skills, ids) {
  return (skills || []).find(sk => ids.includes(sk.fx));
}
function chooseBossSignatureSkill(enemy, playerFx, allSkills) {
  if (!enemy?.boss) return null;
  const style = BOSS_STYLE_BY_KEY[enemy.bossKey] || (enemy.bossFamily === "rift" ? "hexweaver" : "fortress");
  const damageChoices = (allSkills || []).filter(s => s.kind !== 'support' && s.kind !== 'debuff');
  const supportChoices = (allSkills || []).filter(s => s.kind === 'support');
  const debuffChoices = (allSkills || []).filter(s => s.kind === 'debuff');
  const turn = enemy.bossTurns || 0;
  const lowHp = enemy.hp < Math.floor((enemy.mhp || enemy.hp || 1) * 0.4);
  if (style === "fortress") {
    if (!enemyHasAnyFx(enemy, ["fortify","shield","barrier"]) && turn <= 1) return pickSkillByFx(supportChoices, ["fortify","shield","barrier","reflect"]);
    if (!playerHasAnyFx(playerFx, ["weaken","expose","stun"])) return pickSkillByFx(debuffChoices.concat(damageChoices), ["weaken","expose","stun"]);
    if (enemyHasAnyFx(enemy, ["fortify","shield","barrier","empower"]) || lowHp) return highestPowerSkill(damageChoices);
  }
  if (style === "hexweaver") {
    if (!playerHasAnyFx(playerFx, ["silence","confuse","sleep","curse"]) && turn <= 2) return pickSkillByFx(debuffChoices.concat(damageChoices), ["sleep","confuse","silence","curse"]);
    if (!enemyHasAnyFx(enemy, ["barrier","evasion","nullify","reflect"])) return pickSkillByFx(supportChoices, ["barrier","evasion","nullify","reflect"]);
    if (playerHasAnyFx(playerFx, ["sleep","confuse","curse","silence","weaken"])) return highestPowerSkill(damageChoices);
  }
  if (style === "predator") {
    if (!playerHasAnyFx(playerFx, ["bleed","expose","burn","poison","blind"])) return pickSkillByFx(debuffChoices.concat(damageChoices), ["bleed","expose","burn","poison","blind"]);
    if (!enemyHasAnyFx(enemy, ["haste","evasion","empower"]) && turn <= 2) return pickSkillByFx(supportChoices, ["haste","evasion","empower"]);
    if (playerHasAnyFx(playerFx, ["bleed","expose","burn","poison"]) || lowHp) return highestPowerSkill(damageChoices);
  }
  if (style === "tempest") {
    if (!enemyHasAnyFx(enemy, ["haste","shield","fortify","barrier"]) && turn <= 1) return pickSkillByFx(supportChoices, ["haste","shield","fortify","barrier"]);
    if (!playerHasAnyFx(playerFx, ["slow","weaken","stun","freeze","blind"])) return pickSkillByFx(debuffChoices.concat(damageChoices), ["slow","weaken","stun","freeze","blind"]);
    if (enemyHasAnyFx(enemy, ["haste","empower"]) || lowHp) return highestPowerSkill(damageChoices);
  }
  if (style === "rotcourt") {
    if (!playerHasAnyFx(playerFx, ["poison","bleed","weaken","curse"])) return pickSkillByFx(debuffChoices.concat(damageChoices), ["poison","bleed","weaken","curse"]);
    if (!enemyHasAnyFx(enemy, ["thorns","regen","fortify"])) return pickSkillByFx(supportChoices, ["thorns","regen","fortify"]);
    if (playerHasAnyFx(playerFx, ["poison","bleed","weaken","curse"])) return highestPowerSkill(damageChoices);
  }
  return null;
}

// MAP GEN
const MW = 300, MH = 300;
const BIOMES = ["plains","forest","mountain","desert","snow","swamp","coast","volcanic","void","jungle"];
const BIO_C = { plains:"#3d5c3a",forest:"#2d5a27",mountain:"#6b5b4f",desert:"#c2a359",snow:"#8eafc0",swamp:"#334d33",coast:"#c4a96a",volcanic:"#8b3a2a",void:"#2a1a3e",jungle:"#1a5c2a",ocean:"#0d47a1",island:"#66bb6a" };
const BIO_SH = { plains:["#3d5c3a","#456643","#35523a","#4a6b48","#3f604a","#486d42","#405e3e"],forest:["#2d5a27","#245020","#366630","#1e4418","#2a5522","#30622c","#1b4015"],mountain:["#5a4a3e","#6b5b4f","#4e3e32","#7a6a5e","#635343","#574738","#6e5e52"],desert:["#d4a843","#c89e3d","#deb555","#bc9233","#ca9f42","#e0be60","#b68e30"],snow:["#8eafc0","#9bbdcc","#7ea2b4","#a5c5d4","#92b5c6","#86a8b8","#a0c0ce"],swamp:["#334d33","#2a4029","#3d5a3d","#243622","#2e4830","#374f36","#1f3020"],coast:["#3a7ca5","#4488b0","#2f6e96","#5090b8","#3580a0","#4a8cb5","#2d729a"],volcanic:["#8b3a2a","#9a4433","#7c3020","#a34e3c","#923f2f","#843628","#a8523e"],void:["#2a1a3e","#331f4a","#211530","#3b2855","#2e1d44","#241238","#36234e"],jungle:["#1a5c2a","#226834","#124e20","#2a7038","#1e6430","#165626","#267036"],ocean:["#0d47a1","#0a3d8e","#1050aa","#0b4494","#0e4b9e","#084097","#1253ad"] };
// Two independent hash functions for uncorrelated randomness
function _h1(x,y) { return ((x * 2654435761 ^ y * 2246822519) >>> 0); }
function _h2(x,y) { return ((x * 1597334677 ^ y * 3812015801) >>> 0); }
function tileShade(t) { if (!t || !BIO_SH[t.bio]) return BIO_C[t.bio]||"#333"; const s = BIO_SH[t.bio]; return s[_h1(t.x, t.y) % s.length]; }
const BIO_IC = { plains:"·",forest:"🌲",mountain:"⛰",desert:"🏜",snow:"❄",swamp:"🌿",coast:"🏖",volcanic:"🌋",void:"🕳",jungle:"🌴",ocean:"🌊",island:"🏝" };
const START_TOWNS = [{x:38,y:38,n:"Ashford"},{x:112,y:30,n:"Eldergrove"},{x:202,y:38,n:"Stonehelm"},{x:255,y:82,n:"Sunhaven"},{x:46,y:150,n:"Coral Harbor"},{x:135,y:120,n:"Mistwater"},{x:218,y:150,n:"Cindervale"},{x:68,y:228,n:"Frostwall"},{x:172,y:224,n:"Verdant Deep"},{x:258,y:228,n:"Rift's Edge"}];
function _inEllipse(x,y,cx,cy,rx,ry) { const dx = (x-cx)/rx, dy = (y-cy)/ry; return dx*dx + dy*dy <= 1; }
function poiAccent(type) {
  return ({ town:"#69d4ff", shrine:"#88f3d7", rift:"#bf7cff", hostile:"#ff9a58", outpost:"#ff9a58", treasure:"#ffd35f", beastzone:"#7ee17b", gambling:"#ff7fd1", camp:"#91c8ff", ruin:"#dfc39a" }[type]) || "#f2c45c";
}
function poiRing(type) {
  const c = poiAccent(type);
  return "0 0 0 1px " + c + "55, 0 0 10px " + c + "22, inset 0 0 0 1px rgba(255,255,255,0.08)";
}
function mapTrailGlyph(dir) { return dir === "↑" ? "⬆" : dir === "↓" ? "⬇" : dir === "←" ? "⬅" : "➡"; }
function worldTileVisual(t) {
  if (!t) return "#0d1220";
  const base = tileShade(t);
  if (t.bio === "ocean") return "radial-gradient(circle at 35% 30%, rgba(168,224,255,0.22), transparent 38%), linear-gradient(180deg, rgba(10,66,128,0.32), rgba(4,28,58,0.12)), " + base;
  const glowMap = { forest:"rgba(88,179,92,0.12)", jungle:"rgba(48,181,86,0.14)", swamp:"rgba(111,160,95,0.10)", plains:"rgba(180,214,120,0.08)", mountain:"rgba(194,178,164,0.10)", desert:"rgba(244,199,92,0.10)", snow:"rgba(215,235,255,0.14)", coast:"rgba(120,196,236,0.12)", volcanic:"rgba(255,132,76,0.12)", void:"rgba(180,116,255,0.14)" };
  const glow = glowMap[t.bio] || "rgba(255,255,255,0.08)";
  const ridge = (t.bio === "mountain" || t.bio === "volcanic") ? "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 45%)" : "linear-gradient(135deg, rgba(255,255,255,0.04), transparent 42%)";
  return "radial-gradient(circle at 35% 30%, " + glow + ", transparent 48%), " + ridge + ", " + base;
}
function syncTimedLootPois(map, cycle) {
  if (!Array.isArray(map)) return map;
  const next = map.map(t => (t && t.poi && t.poi.type === "treasure") ? { ...t, poi: null } : t);
  const used = new Set();
  const desiredBiomes = ["mountain","desert","snow","swamp","jungle","coast","volcanic","void","forest","plains"];
  const targetCount = 18;
  for (let i = 0; i < targetCount; i++) {
    const wantBio = desiredBiomes[(cycle + i) % desiredBiomes.length];
    let pool = next.filter(t => t && !t.poi && t.bio !== "ocean" && t.bio === wantBio && START_TOWNS.every(tw => Math.abs(tw.x - t.x) + Math.abs(tw.y - t.y) > 10));
    if (!pool.length) pool = next.filter(t => t && !t.poi && t.bio !== "ocean" && START_TOWNS.every(tw => Math.abs(tw.x - t.x) + Math.abs(tw.y - t.y) > 10));
    if (!pool.length) break;
    const pick = pool[Math.abs(_h1(cycle * 31 + i * 17, cycle * 11 + i * 23)) % pool.length];
    const key = pick.x + "," + pick.y;
    if (used.has(key)) continue;
    used.add(key);
    next[pick.y * MW + pick.x] = { ...next[pick.y * MW + pick.x], poi: { type: "treasure", nm: "Loot Cache", ic: "💎" } };
  }
  return next;
}

const GEAR_CAPS = { weapon: 10, shield: 8, helm: 6, body: 6, glv: 6, boot: 6 };
function invGearCategory(item) {
  if (!item) return null;
  if (item.slot && GEAR_CAPS[item.slot] != null) return item.slot;
  if (item.isShield) return 'shield';
  if (item.atk !== undefined && !item.slot) return 'weapon';
  return null;
}
function invGearCap(itemOrCategory) {
  const cat = typeof itemOrCategory === 'string' ? itemOrCategory : invGearCategory(itemOrCategory);
  return GEAR_CAPS[cat] || 99;
}
function invGearCount(list, itemOrCategory) {
  const cat = typeof itemOrCategory === 'string' ? itemOrCategory : invGearCategory(itemOrCategory);
  return (list || []).filter(it => invGearCategory(it) === cat).reduce((sum, it) => sum + (it.qty || 1), 0);
}
function eqGearCount(eqSet, itemOrCategory) {
  const cat = typeof itemOrCategory === 'string' ? itemOrCategory : invGearCategory(itemOrCategory);
  if (!eqSet) return 0;
  if (cat === 'weapon') return [eqSet.w1, eqSet.w2].filter(it => it && invGearCategory(it) === 'weapon').length;
  if (cat === 'shield') return [eqSet.w1, eqSet.w2].filter(it => it && invGearCategory(it) === 'shield').length;
  if (GEAR_CAPS[cat] != null) return eqSet[cat] ? 1 : 0;
  return 0;
}
function gearCapLabel(itemOrCategory) {
  const cat = typeof itemOrCategory === 'string' ? itemOrCategory : invGearCategory(itemOrCategory);
  const map = { weapon:'weapon', shield:'shield', helm:'helm', body:'body armor', glv:'gloves', boot:'boots' };
  return map[cat] || 'gear';
}
function mergeStackableByIdentity(list, item) {
  if (!item) return list || [];
  const arr = Array.isArray(list) ? [...list] : [];
  const key = item.id && CONS.some(c => c.id === item.id) ? 'id' : 'nm';
  const match = arr.find(it => invGearCategory(it) == null && ((key === 'id' && it.id === item.id) || (key === 'nm' && it.nm === item.nm && it.ef === item.ef && it.ef2 === item.ef2)));
  if (match) match.qty = (match.qty || 1) + (item.qty || 1);
  else arr.push({ ...item, qty: item.qty || 1 });
  return arr;
}
function buildRotatingServiceStock(pool, cycle, count, salt) {
  const arr = Array.isArray(pool) ? pool.map(x => ({ ...x })) : [];
  if (!arr.length) return [];
  const out = [];
  const used = new Set();
  let tries = 0;
  while (out.length < Math.min(count, arr.length) && tries < arr.length * 8) {
    const idx = Math.abs(_h1(cycle * 31 + (salt || 0) * 17 + tries * 13, cycle * 11 + tries * 7)) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push({ ...arr[idx] });
    }
    tries++;
  }
  return out;
}
const TOWN_PROFILES = {
  "Ashford": { title:"Trade Crossroads", vibe:"A reliable frontier market where practical gear, rumors, and fish trades move fast.", edge:"Best for general resupply and steady early-game preparation.", focus:["Trade","Resupply","Fish"] },
  "Eldergrove": { title:"Wildwood Bastion", vibe:"A quieter settlement where beasts, old roots, and enchanted craft still shape everyday life.", edge:"Best for pet-oriented runs, enchant support, and nature-flavored planning.", focus:["Beasts","Enchants","Nature"] },
  "Stonehelm": { title:"Forge Dominion", vibe:"Stonehelm lives by steel discipline, hard walls, and well-kept armories.", edge:"Best for defensive builds, armor upgrades, and durable loadouts.", focus:["Armor","Defense","Steel"] },
  "Sunhaven": { title:"Luminous Port", vibe:"Sunlit avenues, open plazas, and seers who trade comfort for knowledge.", edge:"Best for directional guidance, fish utility, and low-friction travel prep.", focus:["Guidance","Travel","Light"] },
  "Coral Harbor": { title:"Seafarer Hub", vibe:"A bustling coast city of nets, tides, shipwrights, and ocean-forged wares.", edge:"Best for fishing economies, Water gear, and control-oriented utility.", focus:["Fishing","Water","Control"] },
  "Mistwater": { title:"Fen Apothecary", vibe:"Mistwater distills marsh craft into clever tonics, cures, and layered support tools.", edge:"Best for recovery-heavy kits, cleansing tools, and alchemical sustain.", focus:["Recovery","Alchemy","Cleanse"] },
  "Cindervale": { title:"Ember Arsenal", vibe:"A heat-scarred stronghold where forged equipment and sharp edge work define the town.", edge:"Best for aggressive gear maintenance, armoring, and combat-ready enchantments.", focus:["Aggression","Forge","Fire"] },
  "Frostwall": { title:"Crystal Watch", vibe:"Frostwall is stern, cold, and precise, valuing insight, gems, and measured preparation.", edge:"Best for shard conversion, relic planning, and deliberate expedition setup.", focus:["Relics","Shards","Precision"] },
  "Verdant Deep": { title:"Green Sanctum", vibe:"Life here grows dense and strange, favoring wild companions and restorative craft.", edge:"Best for beast synergy, survival items, and regenerative playstyles.", focus:["Survival","Regeneration","Beasts"] },
  "Rift's Edge": { title:"Threshold Settlement", vibe:"Everything here is built for those who push too close to the Veil and live to return.", edge:"Best for rift expeditions, null-tech brews, and late-game utility prep.", focus:["Rifts","Null-Tech","Late Utility"] },
};
const FISH_MARKET_BASE = [
  {nm:"Flame Oil",ds:"A volatile oil that empowers your next Fire technique into a devastating burst.",ef:"fire_boost",tag:"buff",v:50,cost:[{el:"Fire",n:2}]},
  {nm:"Frost Salve",ds:"A cooling paste that restores health and strips away one harmful ailment.",ef:"heal",tag:"heal",v:80,cleanseAlso:true,cost:[{el:"Ice",n:2}]},
  {nm:"Storm Elixir",ds:"A crackling draft that floods the body with speed for several turns.",ef:"haste",tag:"buff",dur:3,v:50,cost:[{el:"Lightning",n:2}]},
  {nm:"Nature Balm",ds:"A green balm that seals wounds gradually with strong regenerative warmth.",ef:"regen",tag:"heal",dur:4,v:18,cost:[{el:"Nature",n:2}]},
  {nm:"Void Essence",ds:"A dark extract that seals a foe's voice and interrupts spellcasting.",ef:"silence",tag:"debuff",dur:2,v:0,cost:[{el:"Void",n:1},{el:"Dark",n:1}]},
  {nm:"Prismatic Tonic",ds:"A shifting tonic that grants a focused surge of power and magical rhythm.",ef:"empower",tag:"buff",dur:3,ef2:"mp",v2:28,cost:[{el:"Arcane",n:1},{el:"Light",n:1}]},
  {nm:"Tidal Guard",ds:"A layered water ward that wraps the user in a protective shell.",ef:"shield",tag:"shield",dur:3,v:40,cost:[{el:"Water",n:3}]},
  {nm:"Earthen Bomb",ds:"A packed charge that bursts into a shower of stone and metal fragments.",ef:"aoe",tag:"damage",v:40,ef2:"weaken",dur2:2,cost:[{el:"Earth",n:2},{el:"Metal",n:1}]},
  {nm:"Gloom Brine",ds:"A dark preserving brine that blunts enemy accuracy before they can settle in.",ef:"blind",tag:"debuff",dur:3,cost:[{el:"Dark",n:2},{el:"Water",n:1}]},
  {nm:"Skycurrent Draft",ds:"A brisk tonic that layers Haste with a thin evasive veil for repositioning.",ef:"haste",tag:"buff",dur:2,ef2:"evasion",dur2:2,cost:[{el:"Wind",n:1},{el:"Lightning",n:1}]},
  {nm:"Graveseed Paste",ds:"A heavy paste that slows a foe and leaves them easier to punish.",ef:"slow",tag:"debuff",dur:3,ef2:"expose",dur2:2,cost:[{el:"Gravity",n:1},{el:"Nature",n:1}]},
  {nm:"Radiant Broth",ds:"A bright restorative broth for longer journeys and steady recovery.",ef:"heal",tag:"heal",v:65,ef2:"regen",dur2:3,cost:[{el:"Light",n:2},{el:"Water",n:1}]},
];
function buildFishMarketRecipes(townName) {
  const extra = {
    "Ashford": {nm:"Trader's Packed Brine",ds:"A practical travel ration that restores HP and MP together.",ef:"heal",v:55,ef2:"mp",v2:25,cost:[{el:"Water",n:1},{el:"Plains",n:0}]},
    "Sunhaven": {nm:"Sunscale Broth",ds:"A warming broth that restores HP and grants a brief Blind ward by strengthening morale.",ef:"heal",v:70,ef2:"fortify",dur2:2,cost:[{el:"Light",n:2},{el:"Fire",n:1}]},
    "Coral Harbor": {nm:"Captain's Brine",ds:"A sailor's reserve that grants Shield and Haste for cleaner sea fights.",ef:"shield",dur:3,ef2:"haste",dur2:2,cost:[{el:"Water",n:2},{el:"Wind",n:1}]},
  };
  const townExtra = extra[townName] ? [{ ...extra[townName] }] : [];
  return [...FISH_MARKET_BASE, ...townExtra].filter(r => !(r.cost || []).some(c => c.n <= 0));
}
const HERBALIST_POOL = [
  {nm:"Herbal Poultice",origin:"Herbalist",ef:"heal",v:70,ef2:"regen",dur2:2,pr:55,ds:"Restores 70 HP instantly and grants brief Regen for steadier sustain."},
  {nm:"Stamina Root",origin:"Herbalist",ef:"mp",v:50,ef2:"haste",dur2:2,pr:60,ds:"Restores 50 MP and grants a short Haste surge to regain tempo."},
  {nm:"Cleansing Tea",origin:"Herbalist",ef:"cleanse",v:1,ef2:"fortify",dur2:2,pr:45,ds:"Removes active debuffs, then grants short Fortify for safer recovery."},
  {nm:"Bloom Sap",origin:"Herbalist",ef:"regen",dur:4,v:16,pr:58,ds:"A slow and efficient restorative for longer drawn-out fights."},
  {nm:"Rootwall Tonic",origin:"Herbalist",ef:"fortify",dur:3,ef2:"shield",dur2:2,pr:62,ds:"Builds a layered defensive line before pressure peaks."},
  {nm:"Veinleaf Infusion",origin:"Herbalist",ef:"heal",v:45,ef2:"cleanse",pr:52,ds:"A simpler field-ready cure for wounded travellers and scouts."},
  {nm:"Field Suture Balm",origin:"Herbalist",ef:"heal",v:82,ef2:"fortify",dur2:1,pr:68,ds:"A triage balm for stabilizing after hard hits without wasting a full battle elixir."},
  {nm:"Marshwake Tisane",origin:"Herbalist",ef:"cleanse",v:1,ef2:"regen",dur2:4,pr:64,ds:"A longer recovery brew for poison marshes, attrition fights, and status-heavy routes."},
];
function buildHerbalistStock(cycle, townName) {
  const base = buildRotatingServiceStock(HERBALIST_POOL, cycle + (townName || '').length, 4, 41);
  if (townName === 'Mistwater') base.push({nm:"Fenroot Brew",ef:"cleanse",v:1,ef2:"regen",dur2:3,pr:66,ds:"Mistwater's marsh-brewed specialty for cleansing and slow recovery."});
  if (townName === 'Verdant Deep') base.push({nm:"Wildheart Paste",ef:"regen",dur:5,v:20,ef2:"fortify",dur2:2,pr:72,ds:"Verdant Deep's wilderness paste, excellent for longer expeditions."});
  return base;
}
const ALCHEMIST_POOL = [
  {nm:"Elixir of Might",origin:"Alchemist",ef:"empower",dur:3,ef2:"haste",dur2:2,pr:60,ds:"A clean offensive surge for tempo-focused turns."},
  {nm:"Elixir of Iron",origin:"Alchemist",ef:"fortify",dur:3,ef2:"shield",dur2:2,pr:55,ds:"Steadies the line and reduces incoming punishment."},
  {nm:"Elixir of Shadows",origin:"Alchemist",ef:"evasion",dur:2,ef2:"haste",dur2:2,pr:70,ds:"A slippery evasive mix for avoiding burst turns."},
  {nm:"Volatile Bomb",origin:"Alchemist",ef:"aoe",v:60,ef2:"burn",dur2:3,pr:80,ds:"Reliable area damage with lingering Fire pressure."},
  {nm:"Nullglass Ampoule",origin:"Alchemist",ef:"nullify",dur:2,ef2:"cleanse",pr:78,ds:"Strips existing pressure and blocks the next status effect."},
  {nm:"Mindcoil Draught",origin:"Alchemist",ef:"mp",v:55,ef2:"empower",dur2:2,pr:64,ds:"Restores MP while priming the next strategic cast."},
  {nm:"Shock Capsule",origin:"Alchemist",ef:"stun",dur:1,ef2:"aoe",v2:24,pr:82,ds:"A risky offensive tool that can crack enemy rhythm open."},
  {nm:"Breach Phial",origin:"Alchemist",ef:"expose",dur:3,ef2:"aoe",v2:18,pr:76,ds:"A siege-breaking flask for cracking defended packs before bursting them down."},
  {nm:"Phase Solvent",origin:"Alchemist",ef:"silence",dur:2,ef2:"weaken",dur2:2,pr:74,ds:"A control mix for caster packs, fragile elites, and boss setup turns."},
];
function buildAlchemistStock(cycle, townName) {
  const base = buildRotatingServiceStock(ALCHEMIST_POOL, cycle + (townName || '').length * 2, 4, 59);
  if (townName === "Rift's Edge") base.push({nm:"Rift Resin",ef:"nullify",dur:2,ef2:"shield",dur2:2,pr:92,ds:"A rare rift-grade resin built for unstable deep-space fights."});
  return base;
}
function buildRuinPuzzle(seed, tier) {
  const safeEls = ELS.filter(el => el !== 'Null' && el !== 'Physical');
  const type = Math.abs(seed) % 6;
  if (type === 0) {
    const a = 5 + (Math.abs(seed * 3) % (tier === 1 ? 12 : 20));
    const b = 3 + (Math.abs(seed * 5) % (tier === 1 ? 8 : 14));
    const ops = ['+','-','×'];
    const op = ops[Math.abs(seed * 7) % ops.length];
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const opts = uniqList([String(ans), String(ans + 2 + (seed % 4 + 4) % 4), String(ans - (2 + (Math.abs(seed) % 3))), String(ans + 6 + (Math.abs(seed) % 5))]).slice(0,4);
    return { title:'Arithmetic Seal', prompt:'What is ' + a + ' ' + op + ' ' + b + '?', options: opts.sort(() => Math.random() - 0.5), answer:String(ans) };
  }
  if (type === 1) {
    const seqs = [
      {q:'2, 4, 8, 16, ?', a:'32', w:['24','28','36']},
      {q:'1, 1, 2, 3, 5, ?', a:'8', w:['6','7','10']},
      {q:'3, 6, 9, 12, ?', a:'15', w:['14','16','18']},
      {q:'1, 4, 9, 16, ?', a:'25', w:['20','24','30']},
      {q:'2, 6, 12, 20, ?', a:'30', w:['24','28','36']},
      {q:'5, 10, 20, 35, ?', a:'55', w:['45','50','60']},
    ];
    const sq = seqs[Math.abs(seed * 11) % seqs.length];
    return { title:'Sequence Lintel', prompt:'What comes next?\n' + sq.q, options:[sq.a, ...sq.w].sort(() => Math.random() - 0.5), answer:sq.a };
  }
  if (type === 2) {
    const target = safeEls[Math.abs(seed * 13) % safeEls.length];
    const winners = safeEls.filter(el => (EL_STR[el] || []).includes(target));
    const answer = winners[0] || 'Water';
    const wrongs = safeEls.filter(el => el !== answer).slice(0, 6);
    const opts = uniqList([answer, wrongs[Math.abs(seed*17)%wrongs.length], wrongs[Math.abs(seed*19+3)%wrongs.length], wrongs[Math.abs(seed*23+1)%wrongs.length]]).slice(0,4);
    return { title:'Element Seal', prompt:'Which element has Advantage against ' + target + '?', options:opts.sort(() => Math.random() - 0.5), answer };
  }
  if (type === 3) {
    const glyphs = ['◇','△','○','□'];
    const start = Math.abs(seed) % glyphs.length;
    const pattern = [glyphs[start], glyphs[(start+1)%4], glyphs[(start+2)%4], glyphs[start], glyphs[(start+1)%4], '?'];
    const answer = glyphs[(start+2)%4];
    const opts = uniqList([answer, glyphs[(start+3)%4], glyphs[start], glyphs[(start+1)%4]]);
    return { title:'Glyph Lattice', prompt:'Complete the glyph chain:\n' + pattern.join(' '), options:opts.sort(() => Math.random() - 0.5), answer };
  }
  if (type === 4) {
    const directions = ['North','East','South','West'];
    const idx = Math.abs(seed * 29) % directions.length;
    const answer = directions[(idx + 2) % 4];
    return { title:'Mirror Compass', prompt:'A rune faces ' + directions[idx] + '. Which direction lies directly opposite?', options:uniqList([answer, directions[(idx+1)%4], directions[idx], directions[(idx+3)%4]]).sort(() => Math.random() - 0.5), answer };
  }
  const odds = [
    {prompt:'Which one is NOT an elemental biome?', answer:'Library', options:['Library','Volcanic','Swamp','Jungle']},
    {prompt:'Which one is NOT a battle effect?', answer:'Mortgage', options:['Mortgage','Burn','Shield','Silence']},
    {prompt:'Which one is NOT a map danger site?', answer:'Bakery', options:['Bakery','Rift','Ruin','Outpost']},
  ];
  const odd = odds[Math.abs(seed * 31) % odds.length];
  return { title:'Odd Rune', prompt:odd.prompt, options:odd.options.sort(() => Math.random() - 0.5), answer:odd.answer };
}
const FISH_TAG_LABELS = { heal:'Sustain', buff:'Tempo', debuff:'Control', shield:'Guard', damage:'Burst' };
function fishTagLabel(tag) { return FISH_TAG_LABELS[tag] || 'Utility'; }
const RUIN_REWARD_ITEMS = [
  {nm:"Archivist Draft", ef:"mp", v:34, ef2:"empower", dur2:2, ds:"A refined draught from lost archives that restores MP and sharpens your next cast."},
  {nm:"Dustbound Salve", ef:"heal", v:62, ef2:"fortify", dur2:2, ds:"An old ruin salve that patches wounds and steadies the body."},
  {nm:"Sealbreaker Resin", ef:"cleanse", v:1, ef2:"shield", dur2:2, ds:"A lacquer once used by explorers to clear lingering pressure before opening deeper doors."},
  {nm:"Echo Lamp Oil", ef:"haste", dur:2, ef2:"evasion", dur2:2, ds:"A bright old-world tonic for moving quickly through unstable chambers."},
];
function buildRuinReward(tier, deeper) {
  const scaled = Math.max(1, tier || 1);
  const shards = deeper ? R(4, 8) + Math.floor(scaled / 10) : R(3, 6) + Math.floor(scaled / 12);
  const gold = deeper ? 40 + scaled * 6 + R(0, 45) : 24 + scaled * 4 + R(0, 30);
  const fragment = Math.random() < (deeper ? 0.18 : 0.10) ? 1 : 0;
  const item = Math.random() < (deeper ? 0.60 : 0.38) ? { ...P(RUIN_REWARD_ITEMS) } : null;
  return { gold, shards, fragment, item };
}
function ruinRewardText(reward) {
  const bits = [];
  if (reward.shards) bits.push('🔹 +' + reward.shards + ' shards');
  if (reward.gold) bits.push('💰 +' + reward.gold + ' gold');
  if (reward.fragment) bits.push('🔮 +1 relic fragment');
  if (reward.item) bits.push('📦 ' + reward.item.nm);
  return bits.join('\n');
}

function mkMap() {
  const t = [];
  const regs = [
    {cx:42,cy:40,b:"plains",sx:60,sy:48},{cx:112,cy:34,b:"forest",sx:56,sy:44},{cx:202,cy:42,b:"mountain",sx:60,sy:46},
    {cx:254,cy:84,b:"desert",sx:54,sy:44},{cx:46,cy:150,b:"coast",sx:52,sy:42},{cx:134,cy:122,b:"swamp",sx:44,sy:38},
    {cx:220,cy:150,b:"volcanic",sx:50,sy:42},{cx:68,cy:228,b:"snow",sx:54,sy:42},{cx:170,cy:224,b:"jungle",sx:58,sy:44},{cx:258,cy:228,b:"void",sx:52,sy:42}
  ];
  const lakes = [
    {cx:88,cy:116,rx:12,ry:8},{cx:152,cy:80,rx:9,ry:6},{cx:214,cy:204,rx:10,ry:7},{cx:54,cy:206,rx:8,ry:6},
    {cx:128,cy:58,rx:7,ry:5},{cx:236,cy:116,rx:11,ry:6},{cx:182,cy:170,rx:9,ry:5},{cx:92,cy:252,rx:7,ry:4}
  ];
  const pockets = [
    {cx:78,cy:58,b:"swamp",rx:18,ry:12},{cx:158,cy:34,b:"forest",rx:15,ry:10},{cx:188,cy:88,b:"coast",rx:14,ry:10},
    {cx:250,cy:132,b:"volcanic",rx:18,ry:12},{cx:102,cy:186,b:"snow",rx:16,ry:12},{cx:146,cy:208,b:"jungle",rx:18,ry:12},
    {cx:232,cy:236,b:"void",rx:16,ry:10},{cx:128,cy:152,b:"plains",rx:16,ry:10},{cx:48,cy:120,b:"forest",rx:14,ry:10},
    {cx:210,cy:58,b:"desert",rx:12,ry:8},{cx:64,cy:168,b:"coast",rx:12,ry:8},{cx:170,cy:126,b:"mountain",rx:15,ry:10},
    {cx:242,cy:208,b:"snow",rx:14,ry:8},{cx:120,cy:236,b:"swamp",rx:13,ry:9}
  ];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    let bio = "plains", md = 999999;
    regs.forEach(r => {
      const dx = (x-r.cx)/(r.sx||1), dy = (y-r.cy)/(r.sy||1);
      const wobble = (((_h1(x + r.cx, y + r.cy) % 1000) / 1000) - 0.5) * 0.18;
      const d = dx*dx + dy*dy + wobble;
      if (d < md) { md = d; bio = r.b; }
    });
    const edgeDepth = Math.min(x, y, MW - 1 - x, MH - 1 - y);
    const coastCut = 5 + (_h1(x,y) % 5);
    const riverA = Math.abs(y - (MH * 0.43 + 16*Math.sin(x/17) + 6*Math.sin(x/5.6))) <= 1;
    const riverB = Math.abs(x - (MW * 0.64 + 15*Math.sin(y/19) + 5*Math.sin(y/7.2))) <= 1 && y > MH * 0.22 && y < MH * 0.82;
    const riverC = Math.abs(y - (MH * 0.18 + 10*Math.sin(x/24) - 4*Math.sin(x/8.4))) <= 1 && x > MW * 0.28 && x < MW * 0.82;
    const lakeHit = lakes.some(l => _inEllipse(x,y,l.cx,l.cy,l.rx,l.ry));
    if (edgeDepth <= coastCut || riverA || riverB || riverC || lakeHit) bio = "ocean";
    if (bio !== "ocean") {
      pockets.forEach(p => { if (_inEllipse(x,y,p.cx,p.cy,p.rx,p.ry)) bio = p.b; });
      const micro = _h2(x,y) % 100;
      if (bio === "forest" && micro < 5) bio = "jungle";
      else if (bio === "plains" && micro < 4) bio = "forest";
      else if (bio === "mountain" && micro < 4) bio = "snow";
      else if (bio === "desert" && micro < 4) bio = "volcanic";
      else if (bio === "swamp" && micro < 5) bio = "plains";
      else if (bio === "coast" && micro < 4) bio = "plains";
      else if (bio === "jungle" && micro < 3) bio = "forest";
      else if (bio === "snow" && micro < 3) bio = "mountain";
      else if (bio === "void" && micro < 4) bio = "volcanic";
    }
    t.push({ x, y, bio, poi: null });
  }
  const towns = START_TOWNS;
  towns.forEach(tw => {
    const i = tw.y * MW + tw.x;
    if (t[i]) { t[i].bio = t[i].bio === "ocean" ? "plains" : t[i].bio; t[i].poi = { type: "town", nm: tw.n, ic: "🏘️" }; }
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const nx = tw.x + ox, ny = tw.y + oy;
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const ni = ny * MW + nx;
      if (t[ni] && t[ni].bio === "ocean") t[ni].bio = ox === 0 && oy === 0 ? "plains" : "coast";
    }
  });
  const placePoi = (type, ic, count, opts = {}) => {
    let remaining = count;
    let tries = count * 240;
    while (remaining > 0 && tries-- > 0) {
      const x = R(2, MW - 3), y = R(2, MH - 3), idx = y * MW + x;
      const tile = t[idx];
      if (!tile || tile.poi || tile.bio === "ocean") continue;
      if (opts.allowed && opts.allowed.indexOf(tile.bio) < 0) continue;
      if ((opts.avoidTown || 0) > 0 && towns.some(tw => Math.abs(tw.x - x) + Math.abs(tw.y - y) <= opts.avoidTown)) continue;
      tile.poi = { type, nm: opts.name || type, ic };
      remaining--;
    }
  };
  placePoi("hostile", "⛺", 40, { allowed:["plains","forest","desert","swamp","jungle","coast"], avoidTown: 11, name: "Outpost" });
  placePoi("ruin", "🏛️", 32, { allowed:["mountain","desert","snow","void","volcanic"], avoidTown: 10, name: "Ancient Ruin" });
  placePoi("gambling", "🎰", 12, { allowed:["plains","coast","desert"], avoidTown: 8, name: "Lucky Den" });
  placePoi("rift", "🌀", 6, { allowed:["void","volcanic","snow","mountain","coast"], avoidTown: 14, name: "Dimensional Rift" });
  placePoi("beastzone", "🐾", 26, { allowed:["forest","jungle","swamp","snow","plains"], avoidTown: 8, name: "Beast Zone" });
  placePoi("shrine", "⛩️", 20, { allowed:["mountain","snow","forest","coast","void"], avoidTown: 10, name: "Shrine" });
  placePoi("camp", "🏕️", 24, { allowed:["plains","forest","coast","snow","desert"], avoidTown: 6, name: "Camp" });
  return syncTimedLootPois(t, 0);
}

// ═══════════════════════════════════
// MAIN GAME COMPONENT
// ═══════════════════════════════════
import { createMusicPlayer, trackForScreen } from "./music.js";

function Game() {
  const [scr, setScr] = useState("title");
  // ── v41 background music ──────────────────────────────────────────
  // Lazy-init via useState to be StrictMode/concurrent-render safe
  // (guarantees a single AudioContext even with double-invoke renders).
  const [music] = useState(() => createMusicPlayer());
  const musicRef = useRef(music);
  const [musicMuted, setMusicMuted] = useState(() => music.isMuted());
  const [btl, setBtl] = useState(null);
  // First user interaction unlocks the AudioContext (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      const t = trackForScreen(scr, { battleType: btl?.type });
      if (t) musicRef.current.play(t);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Swap track on screen / battle-type change (boss vs wild battle music)
  useEffect(() => {
    const t = trackForScreen(scr, { battleType: btl?.type });
    if (t) musicRef.current.play(t);
  }, [scr, btl?.type]);
  const toggleMusicMute = useCallback(() => {
    const next = !musicRef.current.isMuted();
    musicRef.current.setMuted(next);
    setMusicMuted(next);
    if (!next) {
      const t = trackForScreen(scr, { battleType: btl?.type });
      if (t) musicRef.current.play(t);
    }
  }, [scr, btl?.type]);
  // v43: audio settings (SFX volume + mute) — persisted in music engine
  const [sfxMuted, setSfxMuted] = useState(() => music.isSfxMuted());
  const [musicVol, setMusicVol] = useState(() => music.getMusicVolume());
  const [sfxVol, setSfxVol] = useState(() => music.getSfxVolume());
  const onMusicVolChange = useCallback((v) => { setMusicVol(v); musicRef.current.setMusicVolume(v); }, []);
  const onSfxVolChange = useCallback((v) => { setSfxVol(v); musicRef.current.setSfxVolume(v); }, []);
  const toggleSfxMute = useCallback(() => {
    const next = !musicRef.current.isSfxMuted();
    musicRef.current.setSfxMuted(next);
    setSfxMuted(next);
    if (!next) musicRef.current.playSfx("menu"); // feedback chirp on enable
  }, []);
  // Click sound on sub-panel changes (menu / stats / etc) — `sub` is declared further down
  const subRef = useRef(null);
  const [mode, setMode] = useState("single");
  const [pl, setPl] = useState(null);
  const [gold, setGold] = useState(100);
  const [inv, setInv] = useState([]);
  const [eq, setEq] = useState({ w1: null, w2: null, helm: null, body: null, glv: null, boot: null, c1: null, c2: null });
  const [pet, setPet] = useState(null);
  const [ally, setAlly] = useState(null);
  // btl declared earlier (above music hooks) so audio can react to btl?.type
  // v55: low-HP heartbeat intensity layer — when in battle and HP under 30%, a
  // slow lub-dub sub-bass plays every 1.4s on top of the existing battle track.
  // (must live below `pl` declaration to avoid TDZ)
  useEffect(() => {
    if (!btl || btl.type === "train") return;
    const id = setInterval(() => {
      const cur = pl?.chp || 0;
      const max = pl?.mhp || pl?.hp || 1;
      if (max > 0 && cur > 0 && (cur / max) < 0.30) {
        try { musicRef.current.playSfx("heartbeat"); } catch {}
      }
    }, 1400);
    return () => clearInterval(id);
  }, [btl, pl?.chp, pl?.mhp]);
  const [log, setLog] = useState([]);
  const [noti, setNoti] = useState(null);
  const [sub, setSub] = useState(null);
  useEffect(() => {
    if (sub !== subRef.current) {
      subRef.current = sub;
      if (sub) { try { musicRef.current.playSfx("menu"); } catch {} }
    }
  }, [sub]);
  const [cStep, setCStep] = useState(0);
  const [selCls, setSelCls] = useState(null);
  const [selBloodmark, setSelBloodmark] = useState(null);
  const [covenant, setCovenant] = useState(null);
  const [cName, setCName] = useState("");
  const [cPortrait, setCPortrait] = useState("");
  const isValidPortraitURL = (u) => { if (!u || typeof u !== "string") return false; const v = u.trim(); if (v.length > 800) return false; if (/^data:image\/svg/i.test(v)) return false; return /^https?:\/\//i.test(v) || /^data:image\/(png|jpe?g|gif|webp|avif|apng)/i.test(v); };
  // Overlay <img> sized to fill its parent. Parent must be position:relative + overflow:hidden.
  // Renders fallback content as a sibling; if the image fails to load, onError hides it and the fallback remains visible.
  const portraitOverlay = (url) => isValidPortraitURL(url) ? <img src={url.trim()} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} onError={(e) => { try { e.currentTarget.style.display = "none"; } catch(_){} }} /> : null;
  // Inline preview (used by character-creation/stats preview boxes that are themselves position:relative)
  const portraitImgEl = (url) => isValidPortraitURL(url) ? <img src={url.trim()} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { try { e.currentTarget.style.display = "none"; } catch(_){} }} /> : null;
  // Player avatar = class portrait png (with emoji fallback) + custom portrait overlay (if set).
  // Parent must be position:relative; overflow:hidden. Order: emoji → class img (absolute) → custom (absolute) so failures unwind cleanly.
  // sex: "male" (default) uses class/<id>.png; "female" uses class/<id>_f.png with onError fallback to the male png.
  const classPortraitUrl = (cid, sex) => (import.meta.env.BASE_URL || "/") + "class/" + cid + (sex === "female" ? "_f" : "") + ".png";
  // Crossfade portrait: layers male+female imgs and toggles opacity for a gentle fade between sexes.
  // Caller controls the wrapper size/border via wrapStyle; both imgs fill the wrapper.
  const CrossfadePortrait = ({ cid, sex, wrapStyle, imgStyle, alt }) => {
    if (!cid) return null;
    const isFem = sex === "female";
    const [pulseKey, setPulseKey] = React.useState(0);
    const prevSexRef = React.useRef(sex);
    React.useEffect(() => { if (prevSexRef.current !== sex) { prevSexRef.current = sex; setPulseKey(k => k + 1); } }, [sex]);
    const baseImg = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 2200ms cubic-bezier(0.4, 0, 0.2, 1), filter 2200ms ease, transform 2200ms ease", ...(imgStyle || {}) };
    const onErr = (e) => { try { const t = e.currentTarget; if (t.dataset.sex === "female" && !t.dataset.fb) { t.dataset.fb = "1"; t.src = classPortraitUrl(cid, "male"); } else { t.style.display = "none"; } } catch(_){} };
    return (
      <div className="cf-portrait" style={{ position: "relative", overflow: "hidden", ...(wrapStyle || {}) }}>
        <img src={classPortraitUrl(cid, "male")} data-sex="male" alt={alt || ""} style={{ ...baseImg, opacity: isFem ? 0 : 1, filter: isFem ? "blur(2px) brightness(0.85)" : "blur(0) brightness(1)", transform: isFem ? "scale(1.04)" : "scale(1)" }} onError={onErr} />
        <img src={classPortraitUrl(cid, "female")} data-sex="female" alt={alt || ""} style={{ ...baseImg, opacity: isFem ? 1 : 0, filter: isFem ? "blur(0) brightness(1)" : "blur(2px) brightness(0.85)", transform: isFem ? "scale(1)" : "scale(1.04)" }} onError={onErr} />
        {pulseKey > 0 && <span key={pulseKey} className="cf-shimmer" aria-hidden />}
      </div>
    );
  };
  const playerAvatar = (cid, fallbackIc, portraitUrl, sex) => <>
    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{fallbackIc}</span>
    {cid ? <img src={classPortraitUrl(cid, sex)} data-sex={sex || "male"} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { try { const t = e.currentTarget; if (t.dataset.sex === "female" && !t.dataset.fb) { t.dataset.fb = "1"; t.src = classPortraitUrl(cid, "male"); } else { t.style.display = "none"; } } catch(_){} }} /> : null}
    {portraitOverlay(portraitUrl)}
  </>;
  const [quote, setQuote] = useState("");
  const [cSex, setCSex] = useState("male");
  const [previewSex, setPreviewSex] = useState("male");
  useEffect(() => { if (scr !== "create") return; const id = setInterval(() => setPreviewSex(s => s === "male" ? "female" : "male"), 4500); return () => clearInterval(id); }, [scr]);
  const [companionSeek, setCompanionSeek] = useState("female");
  const [tavernCompanionCycle, setTavernCompanionCycle] = useState(-1);
  const [tavernCompanions, setTavernCompanions] = useState([]);
  const [spouse, setSpouse] = useState(null);
  const [companionSeekLocked, setCompanionSeekLocked] = useState(false);
  const [bondSwapUsed, setBondSwapUsed] = useState(false);
  const [lifeStartTime, setLifeStartTime] = useState(() => Date.now());
  const [mData, setMData] = useState(null);
  const [pos, setPos] = useState({ x: 38, y: 38 });
  const [kills, setKills] = useState(0);
  const [bank, setBank] = useState(0);
  const [loan, setLoan] = useState(0);
  const [loanTime, setLoanTime] = useState(0);
  const [bankInterestMark, setBankInterestMark] = useState(0);
  const [loanPenaltyMark, setLoanPenaltyMark] = useState(0);
  const [disc, setDisc] = useState(new Set());
  const [copied, setCopied] = useState(null);
  const [copyN, setCopyN] = useState(0);
  const [battleHelpOpen, setBattleHelpOpen] = useState(false);
  const [spellHelpOpen, setSpellHelpOpen] = useState(false);
  const [battleBonus, setBattleBonus] = useState(null);
  const [ults, setUlts] = useState([]);
  const [lastTown, setLastTown] = useState({ x: 38, y: 38 });
  const [devPos, setDevPos] = useState(null);
  const [saves, setSaves] = useState([null, null, null]);
  const [story, setStory] = useState([
    { id: "s1", nm: "Ashes at Dawn", ds: "Reach a safe town, hear the border bells, and survive the opening collapse. This first milestone anchors the line in a living settlement and begins the month-long road to the Dream Devourer.", done: false },
    { id: "s2", nm: "Blood on the Crossing", ds: "Defeat 90 enemies across roads, camps, ruins, and frontier routes. This is the proving arc where the bloodline learns endurance instead of relying on a few lucky skirmishes.", goal: 90, prog: 0, done: false },
    { id: "s3", nm: "Shrines of the Torn Sky", ds: "Commune with 4 shrines and gather the old blessings still answering through the broken world. Each shrine marks a turning point of faith, memory, and guidance before the deeper hunt can continue.", goal: 4, prog: 0, done: false },
    { id: "s4", nm: "The Broken Watch", ds: "Secure 5 frontier outposts and re-open the chain of holds that once kept caravans, pilgrims, and border soldiers alive. Every reclaimed hold is a real chapter of recovery, not just another fight.", goal: 5, prog: 0, done: false },
    { id: "s5", nm: "Ruins Below the Choir", ds: "Solve 4 ruins and recover sealed testimony from wardens, occult scholars, and failed kings. This is the investigative spine of the campaign, where the world finally starts to explain what the Veil is becoming.", goal: 4, prog: 0, done: false },
    { id: "s6", nm: "The Hollow Stair", ds: "Breach 5 Void Rifts and survive their layered chambers. Each successful ascent proves your line can keep climbing through unstable pocket-realms without losing itself to pressure, distance, and dream-rot.", goal: 5, prog: 0, done: false },
    { id: "s8", nm: "Schoolyard Assessment", ds: "Pledge to a Covenant and complete 3 sanctioned duels in their training arena. The schools do not raise grades on rumor — every assessor wants to see your technique answered against another sorcerer who has trained under a different doctrine.", goal: 3, prog: 0, done: false },
    { id: "s9", nm: "Echoes Across the Veil", ds: "Win 5 sparring matches in the Duelist's Circle. The veteran sorcerers say a technique is only truly yours after you have answered another's domain without flinching — these matches sharpen the reflexes the rifts will eventually demand.", goal: 5, prog: 0, done: false },
    { id: "s10", nm: "The Inherited Technique", ds: "Reach grade 2 (rank: Warden) and let your bloodmark fully express itself in three different battles. Most lines never meet their own technique honestly — this milestone exists to mark the day yours stops being a rumor and starts being the answer to a problem.", goal: 3, prog: 0, done: false },
    { id: "s11", nm: "Unfolded Territory", ds: "Survive an unfolded territory — a domain expansion projected by a stronger sorcerer onto the world. Whether you seal it, escape it, or break it from within, returning intact proves the line is no longer a candidate but a peer.", done: false },
    { id: "s7", nm: "Dream Devourer", ds: "Defeat the Dream Devourer, the abyssal intelligence nesting behind the fractures. By the time this final chapter opens, the bloodline should feel as though it has fought through a full month of attrition, reclaiming roads, winning shrines, recovering ruins, and breaking rifts before the last road reveals itself.", done: false },
  ]);
  const [tip, setTip] = useState(null);
  const [prevPos, setPrevPos] = useState(null);
  const [musicOn, setMusicOn] = useState(true);
  const [svc, setSvc] = useState(null);
  const [mg, setMg] = useState(null);
  const [mgR, setMgR] = useState(null);
  const [mgCard, setMgCard] = useState(null);
  const [mgBet, setMgBet] = useState(1);
  const [repelSteps, setRepelSteps] = useState(0);
  const [arenaCD, setArenaCD] = useState(0);
  const [guildMission, setGuildMission] = useState(null); // {id, nm, ds, xp, g, sh, progress, goal}
  const [shopStock, setShopStock] = useState(null);
  const [shopStockCycle, setShopStockCycle] = useState(-1); // PATCH B1: vendor stock only changes on refresh expiry
  const [armorerStock, setArmorerStock] = useState(null);
  const [armorerStockCycle, setArmorerStockCycle] = useState(-1);
  const [shipwrightStock, setShipwrightStock] = useState(null);
  const [shipwrightStockCycle, setShipwrightStockCycle] = useState(-1);
  const [tavernRumorCycle, setTavernRumorCycle] = useState(-1);
  const [tavernRumors, setTavernRumors] = useState([]);
  const [paidRumor, setPaidRumor] = useState(null);
  const [paidRumorCycle, setPaidRumorCycle] = useState(-1);
  // Battle panels
  const [btlPanel, setBtlPanel] = useState(null);
  const [battleSection, setBattleSection] = useState("veil");
  const battleSectionAvailable = (key, ctx) => key === "veil" || key === "combat" || (key === "items" && ctx.hasItems) || (key === "aux" && ctx.isPT);
  const [btlTarget, setBtlTarget] = useState(null); // enemy id to target
  const [btlTimer, setBtlTimer] = useState(0); // battle timer in seconds
  const [campCDs, setCampCDs] = useState({}); // {x_y: timestamp}
  const [shards, setShards] = useState(0); // relic shards (1000 = 1 fragment)
  const [fragments, setFragments] = useState(0); // relic fragments (7 = summon djinn)
  const [djinnWish, setDjinnWish] = useState(null); // active wish
  const [fish, setFish] = useState([]); // caught fish inventory
  const [fishCD, setFishCD] = useState(0); // fishing cooldown timestamp
  const [showFishLedger, setShowFishLedger] = useState(false);
  const [worldLootCycle, setWorldLootCycle] = useState(-1);
  const [fieldBossCycle, setFieldBossCycle] = useState(-1);
  const [fieldBossDefeated, setFieldBossDefeated] = useState({});
  const [subMap, setSubMap] = useState(null); // {type:"hostile"|"rift"|"ruin", tiles:[], pos:{x,y}, name, cleared:[], boss:null, loot:[]}
  const [hostileCDs, setHostileCDs] = useState({}); // hostile camp cooldowns
  const [riftCDs, setRiftCDs] = useState({}); // rift cooldowns
  const [ruinCDs, setRuinCDs] = useState({}); // ruin cooldowns
  const [shrineCDs, setShrineCDs] = useState({}); // shrine cooldowns
  const [shrineLoreSeen, setShrineLoreSeen] = useState([]); // unique shrine lore entries already seen
  const [beastZoneCDs, setBeastZoneCDs] = useState({}); // beast zone cooldowns
  const [popup, setPopup] = useState(null); // universal popup {text, onClose}
  const popupJustOpenedRef = useRef(false);
  // Timers
  const [timerStart, setTimerStart] = useState(() => Date.now());
  const [timerNow, setTimerNow] = useState(Date.now());
  const [skyHour, setSkyHour] = useState(() => new Date().getHours());
  useEffect(() => { const id = setInterval(() => { const h = new Date().getHours(); setSkyHour(prev => prev === h ? prev : h); }, 60000); return () => clearInterval(id); }, []);
  const skyPhase = useMemo(() => {
    const h = skyHour;
    if (h >= 0 && h <= 3) return { key: "midnight", icon: "🌙", label: "Midnight", short: "Deep night" };
    if (h >= 4 && h <= 5) return { key: "predawn", icon: "🌌", label: "Pre-dawn", short: "False dawn" };
    if (h >= 6 && h <= 7) return { key: "sunrise", icon: "🌅", label: "Sunrise", short: "Daybreak" };
    if (h >= 8 && h <= 11) return { key: "morning", icon: "🌤", label: "Morning", short: "Clear sky" };
    if (h === 12) return { key: "noon", icon: "☀", label: "Noon", short: "Zenith" };
    if (h >= 13 && h <= 14) return { key: "afternoon", icon: "🌞", label: "Afternoon", short: "Golden flood" };
    if (h >= 15 && h <= 16) return { key: "golden", icon: "🌇", label: "Golden hour", short: "Amber light" };
    if (h === 17) return { key: "sunset", icon: "🌅", label: "Sunset", short: "Last light" };
    if (h >= 18 && h <= 19) return { key: "dusk", icon: "🌆", label: "Dusk", short: "Veil bleeding" };
    if (h === 20) return { key: "twilight", icon: "🌃", label: "Twilight", short: "First stars" };
    return { key: "night", icon: "🌌", label: "Night", short: "Aurora curtain" };
  }, [skyHour]);
  const skyClock = useMemo(() => { const h12 = skyHour % 12 === 0 ? 12 : skyHour % 12; return h12 + (skyHour < 12 ? " AM" : " PM"); }, [skyHour]);
  const logR = useRef(null);
  // v56: introAudioRef removed — procedural music engine in music.js owns intro audio
  const swipeRef = useRef(null);
  const fishTapLock = useRef(0);
  const mapTickRef = useRef(0);
  const subSwipeRef = useRef(null);
  const successionRef = useRef(false);
  const moveThrottleRef = useRef(0);
  const [autoMoveTarget, setAutoMoveTarget] = useState(null);
  const autoEnterRef = useRef(false);
  const enterPoiRef = useRef(null);
  const subMoveThrottleRef = useRef(0);

  const notify = useCallback((m) => { setNoti(m); setTimeout(() => setNoti(null), 2200); }, []);
  useEffect(() => { if (logR.current) logR.current.scrollTop = 0; }, [log]);
  useEffect(() => { if (!mData) setMData(mkMap()); }, [mData]);

  // Timer tick
  useEffect(() => {
    const iv = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  const getTimerRemaining = useCallback((hours) => {
    const elapsed = timerNow - timerStart;
    const total = (hours || 24) * 60 * 60 * 1000;
    const rem = Math.max(0, total - (elapsed % total));
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    if (h === 0) return m + ":" + String(s).padStart(2, "0");
    return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }, [timerStart, timerNow]);
  const getCountdownTo = useCallback((targetTs) => {
    const rem = Math.max(0, (targetTs || 0) - timerNow);
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    if (h === 0) return m + ":" + String(s).padStart(2, "0");
    return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }, [timerNow]);

  const ageDay = useMemo(() => Math.min(31, Math.floor(Math.max(0, timerNow - lifeStartTime) / 86400000) + 1), [timerNow, lifeStartTime]);
  const ageInfo = useMemo(() => ageProfile(ageDay), [ageDay]);
  const ageSummary = ageInfo.nm + " · Day " + ageDay + "/31";
  const townCompanionKey = useMemo(() => ((lastTown?.x ?? 38) + "_" + (lastTown?.y ?? 38)), [lastTown]);
  const currentTownLabel = useMemo(() => {
    if (!mData || !lastTown) return "This tavern";
    const t = mData[(lastTown.y || 0) * MW + (lastTown.x || 0)];
    return t?.poi?.nm || "This tavern";
  }, [mData, lastTown]);
  const nextCompanionTs = useMemo(() => timerStart + ((Math.floor(Math.max(0, timerNow - timerStart) / (48 * 3600000)) + 1) * 48 * 3600000), [timerStart, timerNow]);

  // PATCH B1: centralize timer-driven stock refresh so shops do not reroll on render or menu open
  const getRefreshCycle = useCallback((hours) => Math.floor(Math.max(0, timerNow - timerStart) / ((hours || 24) * 3600000)), [timerNow, timerStart]);

  useEffect(() => {
    if (!mData) return;
    const cycle = getRefreshCycle(1);
    if (cycle === worldLootCycle) return;
    setWorldLootCycle(cycle);
    setMData(md => syncTimedLootPois(md, cycle));
  }, [mData, getRefreshCycle, worldLootCycle]);

  useEffect(() => {
    if (!mData) return;
    const cycle = getRefreshCycle(2);
    if (cycle === fieldBossCycle) return;
    setFieldBossCycle(cycle);
    setMData(md => syncFieldBossPois(md, cycle, fieldBossDefeated));
  }, [mData, getRefreshCycle, fieldBossCycle, fieldBossDefeated]);

  const buildTavernRumors = useCallback((seed) => {
    const allRumors = [
      "Spatial rifts shimmer in the darkest regions... seek the void biome for ultimate upgrades.",
      "Your Veil Expansion needs " + (pl?.ult?.chain || 0) + " actions chained exactly. Check your spell book for the sequence!",
      cyclePick(["Hidden treasure caches","Rare beast zones","Legendary weapon stashes"], seed, 3, 1) + " lie deep in " + cyclePick(BIOMES, seed, 5, 2) + " territory.",
      "Some say " + cyclePick(["Shōuei can copy boss abilities","Phoenix Knights cheat death once","Chronomancers warp the turn order","Void Mages ignore defense with silence combos"], seed, 7, 4) + "...",
      "The blacksmith in " + cyclePick(["Stonehelm","Cindervale","Frostwall"], seed, 11, 2) + " is said to craft the finest repairs.",
      "Gamblers who visit the den in " + cyclePick(["Ashford","Eldergrove","Sunhaven"], seed, 13, 1) + " swear the dice are loaded.",
      "An old monk whispers: 'Guard twice in a row and the earth itself will tremble.'",
      "Assassins speak of a technique: poison your blade, then strike for devastating crits.",
      "Priests who heal before buffing find their blessings last far longer than expected.",
      "War Bards discovered that Sound followed by Wind creates a devastating Resonance.",
      "Hexblades stack three poisons and watch their prey dissolve. Cruel but effective.",
      "The Dream Devourer only appears after all other quests are complete. Be prepared.",
      "Maleding yourself in battle costs just 8 MP but the regeneration scales with your magic.",
      "Silenced warriors can still swing their weapon and guard — only spells are sealed.",
      "Some weapons deal pure damage with no effects, but hit much harder than enchanted ones.",
      "DoTs grow stronger over time. Poison escalates, bleeds scale with target HP.",
      "Smart fighters apply debuffs before their big attacks for devastating combos.",
      "The vault pays 5% interest daily. Patient adventurers grow rich.",
      "Rare pets can be found at beast zones marked with 🐾 on the map.",
      "Shrines fully restore your health and mana. Seek them in times of need.",
      "Training dummies at town let you test skills without risking death.",
      "The arena pits you against other class archetypes. Good practice for real fights.",
      "Treasure chests 💎 appear on the map and contain tier 2-4 weapons.",
      "Outposts and ruins always lead to combat but yield good experience.",
      "Element advantage deals 10% more damage. Check the element chart in your spell book!",
      "Camping 🏕️ in the wild restores 30% of your HP and MP.",
    ];
    const picked = [];
    for (let i = 0; i < 4; i++) picked.push(allRumors[(seed * 7 + i * 3) % allRumors.length]);
    return picked;
  }, [pl]);

  useEffect(() => {
    const cycle = getRefreshCycle(8);
    if (tavernRumorCycle !== cycle) {
      setTavernRumorCycle(cycle);
      setTavernRumors(buildTavernRumors(cycle));
      setPaidRumor(null);
      setPaidRumorCycle(cycle);
    }
  }, [timerNow, timerStart, getRefreshCycle, tavernRumorCycle, buildTavernRumors]);

  useEffect(() => {
    const cycle = getRefreshCycle(48);
    setTavernCompanionCycle(cycle);
    setTavernCompanions(buildCompanionQueue(cycle, companionSeek, townCompanionKey));
  }, [timerNow, timerStart, getRefreshCycle, companionSeek, townCompanionKey]);

  // Daily vault interest application (5% once per 24h cycle)
  useEffect(() => {
    const cycle = getRefreshCycle(24);
    if (cycle > bankInterestMark && bank > 0) {
      const diff = cycle - bankInterestMark;
      let nb = bank;
      for (let i = 0; i < diff; i++) nb = Math.floor(nb * 1.05);
      const gain = nb - bank;
      setBank(nb);
      setBankInterestMark(cycle);
      if (gain > 0) notify("Vault interest applied: +" + gain + "G");
    } else if (cycle > bankInterestMark) {
      setBankInterestMark(cycle);
    }
  }, [timerNow, timerStart, bank, bankInterestMark, getRefreshCycle, notify]);

  // Overdue loan penalty: lose 10% current gold once per overdue hour after the 48h grace period
  useEffect(() => {
    if (!loan || !loanTime) {
      if (loanPenaltyMark !== 0) setLoanPenaltyMark(0);
      return;
    }
    const overdueStart = loanTime + 48 * 3600000;
    if (timerNow <= overdueStart) return;
    const overdueHours = Math.floor((timerNow - overdueStart) / 3600000) + 1;
    if (overdueHours > loanPenaltyMark) {
      const steps = overdueHours - loanPenaltyMark;
      let ng = gold;
      let lost = 0;
      for (let i = 0; i < steps; i++) {
        const cut = Math.floor(ng * 0.10);
        ng = Math.max(0, ng - cut);
        lost += cut;
      }
      setGold(ng);
      setLoanPenaltyMark(overdueHours);
      if (lost > 0) notify("Overdue loan penalty: -" + lost + "G");
    }
  }, [timerNow, gold, loan, loanTime, loanPenaltyMark, notify]);
  const buildShopStock = useCallback(() => {
    const repelItem = CONS.find(c => c.ef === "repel");
    const con = [...CONS].filter(c => !c.rare && c.id !== "rev" && c.id !== "nul" && c.id !== "ber" && c.ef !== "repel").sort(() => Math.random() - 0.5).slice(0, 4).map(c => ({ ...c, stock: R(3, 8) }));
    if (repelItem) con.unshift({ ...repelItem, stock: R(5, 9) });
    return { wpn: Array.from({ length: 5 }, () => mkWpn(R(1, 3))), con };
  }, []);
  const buildArmorerStock = useCallback(() => { const slots = ['helm','body','glv','boot'].sort(() => Math.random() - 0.5); return [mkShield(R(1, 3)), mkArmor(slots[0], R(1, 3)), mkArmor(slots[1], R(1, 3)), mkArmor(slots[2], R(1, 3))]; }, []);
  const buildShipwrightStock = useCallback(() => Array.from({ length: 3 }, () => {
    const w = mkWpn(R(2, 4));
    w.name = P(["Coral Harpoon","Sea Steel Cutlass","Barnacle Mace","Tide Anchor","Undertow Pike","Wavebreaker Saber"]);
    w.el = "Water";
    w.rare = true;
    w.price = Math.max(85, Math.floor((w.price || 100) * 0.9));
    return w;
  }), []);

  const stashConsumable = useCallback((item, note) => {
    setInv(iv => mergeStackableByIdentity(iv, item));
    if (note) notify(note);
    return true;
  }, [notify]);
  const tryGainLooseItem = useCallback((item, note, sourceLabel) => {
    if (!item) return false;
    const category = invGearCategory(item);
    if (!category) return stashConsumable(item, note);
    const total = invGearCount(inv, category) + eqGearCount(eq, category);
    const cap = invGearCap(category);
    if (total < cap) {
      setInv(iv => [...iv, { ...item, qty: item.qty || 1 }]);
      if (note) notify(note);
      return true;
    }
    const choices = inv.filter(it => invGearCategory(it) === category).slice(0, 6).map(it => ({
      label: 'Drop ' + (it.name || it.nm),
      action: () => {
        let removed = false;
        setInv(iv => {
          const next = [];
          iv.forEach(entry => {
            if (!removed && entry.id === it.id) { removed = true; return; }
            next.push(entry);
          });
          next.push({ ...item, qty: item.qty || 1 });
          return next;
        });
        setPopup(null);
        notify((sourceLabel || 'Loot') + ': swapped in ' + (item.name || item.nm) + '.');
      }
    }));
    choices.push({ label:'Leave it', action:() => setPopup(null) });
    setPopup({ text: '⚠ ' + gearCapLabel(category).charAt(0).toUpperCase() + gearCapLabel(category).slice(1) + ' cap reached (' + cap + ').\n\n' + (item.name || item.nm) + ' cannot be stored unless you discard one carried piece of the same type.', choices });
    return false;
  }, [inv, eq, stashConsumable, notify]);


  useEffect(() => {
    const cycle12h = getRefreshCycle(12);
    if (shopStockCycle !== cycle12h) {
      setShopStock(buildShopStock());
      setShopStockCycle(cycle12h);
    }
    if (armorerStockCycle !== cycle12h) {
      setArmorerStock(buildArmorerStock());
      setArmorerStockCycle(cycle12h);
    }
    if (shipwrightStockCycle !== cycle12h) {
      setShipwrightStock(buildShipwrightStock());
      setShipwrightStockCycle(cycle12h);
    }
  }, [getRefreshCycle, shopStockCycle, armorerStockCycle, shipwrightStockCycle, buildShopStock, buildArmorerStock, buildShipwrightStock]);

  // v56: Legacy <audio> intro theme removed — the procedural music engine in
  // music.js now owns title/create music (track "title"). Two music sources at
  // once was producing audible double-playback on title screen.

  // v56: Legacy "Adaptive ambient music" effect removed — it spun up its own
  // AudioContext and synthesized a parallel score on top of music.js, producing
  // the audible double-music the user reported. The procedural engine in
  // music.js (createMusicPlayer + trackForScreen) is now the SOLE music source.
  // The musicOn toggle still routes to music.js via the existing toggleMusicMute
  // / setMusicMuted plumbing higher up in the file.

  // Battle timer - 90 seconds per turn
  useEffect(() => {
    if (scr !== "battle" || !btl || btl.turn !== "p") return;
    setBtlTimer(90);
    const iv = setInterval(() => {
      setBtlTimer(t => {
        if (t <= 1) { bAct(P(["strike","guard","mend"])); return 90; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [scr, btl?.turn, btl?.tn]);

  // Player skip-type debuffs resolve immediately at the start of the player's turn
  useEffect(() => {
    if (scr !== "battle" || !btl || btl.turn !== "p" || !pl) return;
    const skipEf = (pl.efx || []).find(ef => ef.type === "skip" && (ef.justApplied || ef.v >= 100 || Math.random() * 100 < ef.v));
    if (!skipEf) return;
    setLog(l => [...l, "⚡ " + pl.name + " can't move!"]);
    setPl(p => p ? ({ ...p, efx: (p.efx || []).map(ef => ef.id === skipEf.id ? { ...ef, justApplied:false } : ef) }) : p);
    setBtl(bb => bb ? ({ ...bb, turn: "e", tn: bb.tn + 1, moved: false }) : bb);
  }, [scr, btl?.turn, btl?.tn, pl]);

  // Natural HP/MP regen / drowning drain
  useEffect(() => {
    if (!pl || scr === "battle" || (scr !== "map" && scr !== "submap")) return;
    if (!mapTickRef.current) {
      mapTickRef.current = timerNow;
      return;
    }
    if ((timerNow - mapTickRef.current) < 2000) return;
    mapTickRef.current = timerNow;
    setPl(p => {
      if (!p) return p;
      const tileNow = scr === "submap"
        ? (subMap && subMap.tiles ? (subMap.tiles[subMap.pos.y * 10 + subMap.pos.x] || null) : null)
        : (mData && pos ? mData[pos.y * MW + pos.x] : null);
      const onWater = !!(tileNow && tileNow.bio === "ocean");
      const caps = projectedEffStatsFor(p, eq || {}, ageDay);
      const hpCap = Math.max(1, caps.hp || p.st.hp || 1);
      const mpCap = Math.max(1, caps.mp || p.st.mp || 1);
      const curHp = Math.min(hpCap, Math.max(0, p.chp || 0));
      const curMp = Math.min(mpCap, Math.max(0, p.cmp || 0));
      const delta = onWater ? -1 : 1;
      const nextHp = Math.max(0, Math.min(hpCap, curHp + delta));
      const nextMp = Math.max(0, Math.min(mpCap, curMp + delta));
      if (nextHp === curHp && nextMp === curMp && curHp === (p.chp || 0) && curMp === (p.cmp || 0)) return p;
      return { ...p, chp: nextHp, cmp: nextMp };
    });
  }, [timerNow, !!pl, scr, mData, pos?.x, pos?.y, subMap?.pos?.x, subMap?.pos?.y, subMap?.tiles, eq, ageDay]);

  useEffect(() => {
    if (!pl || scr === "battle") return;
    const tileNow = scr === "submap"
      ? (subMap && subMap.tiles ? (subMap.tiles[subMap.pos.y * 10 + subMap.pos.x] || null) : null)
      : (mData && pos ? mData[pos.y * MW + pos.x] : null);
    if (scr === "map" && tileNow && tileNow.bio === "ocean" && pl.chp <= 0) die();
  }, [pl?.chp, scr, mData, pos, subMap]);

  const runFishing = useCallback(() => {
    const now = Date.now();
    const cdLeft = fishCD > now ? Math.ceil((fishCD - now)/1000) : 0;
    if (cdLeft > 0) { notify("Fishing on cooldown: " + cdLeft + "s"); return; }
    let f = null;
    if (Array.isArray(FISH_TYPES) && FISH_TYPES.length && Math.random() <= 0.5) {
      const total = FISH_TYPES.reduce((s,x)=>s+(x.rr||1),0);
      let r = Math.floor(Math.random()*total)+1;
      for (const x of FISH_TYPES) { r -= (x.rr||1); if (r <= 0) { f = x; break; } }
    }
    setFishCD(now + 30000);
    if (f) {
      setFish(fi => Array.isArray(fi) ? [...fi, f] : [f]);
      notify("🎣 Caught: " + f.nm + " (" + f.el + ")!");
    } else {
      notify("Nothing bites...");
    }
  }, [fishCD, notify, setFish, setFishCD]);

  // WASD + Arrow keyboard controls
  useEffect(() => {
    if (scr !== "map" || !pl || !mData) return;
    const handler = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") { e.preventDefault(); setAutoMoveTarget(null); move(0, -1); }
      else if (k === "s" || k === "arrowdown") { e.preventDefault(); setAutoMoveTarget(null); move(0, 1); }
      else if (k === "a" || k === "arrowleft") { e.preventDefault(); setAutoMoveTarget(null); move(-1, 0); }
      else if (k === "d" || k === "arrowright") { e.preventDefault(); setAutoMoveTarget(null); move(1, 0); }
      else if (k === " " || k === "enter") {
        e.preventDefault();
        const t = mData[pos.y * MW + pos.x];
        const nearOceanNow = [{x:pos.x-1,y:pos.y},{x:pos.x+1,y:pos.y},{x:pos.x,y:pos.y-1},{x:pos.x,y:pos.y+1}].some(function(p){ if(p.x<0||p.x>=MW||p.y<0||p.y>=MH) return false; return mData[p.y*MW+p.x] && mData[p.y*MW+p.x].bio === "ocean"; });
        if ((!t || !t.poi) && nearOceanNow) runFishing();
        else enterPoi();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scr, pl, pos, mData, runFishing]);

  // Dream Devourer spawns
  useEffect(() => {
    if (!pl || devPos) return;
    const allDone = storyPreFinalDone;
    if (allDone) { setDevPos({ x: R(20, MW - 20), y: R(20, MH - 20) }); notify("The Dream Devourer has awakened..."); }
  }, [story, pl, devPos]);

  const startSuccession = useCallback((reason) => {
    if (!pl || successionRef.current) return;
    successionRef.current = true;
    const partner = spouse;
    const heirTrait = legacyTraitFor((pl.generation || 1) + ageDay + (partner?.cycle || 0));
    const heirPool = ((partner?.sex || ((pl.generation || 1) % 2 === 0 ? "male" : "female")) === "male") ? COMPANION_NAMES.male : COMPANION_NAMES.female;
    const heirName = heirPool[Math.abs((pl.generation || 1) * 5 + ageDay * 3) % heirPool.length];
    const childSex = ((pl.generation || 1) + ageDay) % 2 === 0 ? "male" : "female";
    const willGold = Math.max(25, Math.floor(gold * (partner ? 0.72 : 0.55)));
    const willBank = Math.floor(bank * 0.95);
    const nextStats = { ...pl.st };
    if (partner?.boonStat && nextStats[partner.boonStat] != null) nextStats[partner.boonStat] = Math.floor(nextStats[partner.boonStat] * (partner.boonMult || 1.04));
    const geneticBoon = rollGeneticBoon(pl, partner, (pl.generation || 1) + ageDay + (partner?.cycle || 0) * 3);
    const bmSeed = (pl.generation || 1) + ageDay;
    const inheritedBloodmark = pl.bloodmark
      ? (bmSeed % 7 === 0 ? BLOODMARKS[bmSeed % BLOODMARKS.length].id : pl.bloodmark)
      : null;
    let nextPlayer = { ...pl, name: heirName, sex: childSex, generation: (pl.generation || 1) + 1, lineage: pl.lineage || (pl.name + " Line"), legacyTrait: heirTrait, quote: "Legacy carries forward.", st: nextStats, chp: nextStats.hp, cmp: nextStats.mp, efx: [], tempBattleEl: null, tempBattleEl2: null, tempBonusEls: [], kagamiAttunedEnemyIds: [], freshStart: true, capSyncPending: true, bloodmark: inheritedBloodmark, covenant: null, rank: "Wanderer", restStreak: 0, lastRestDay: null };
    nextPlayer = applyGeneticBoonToPlayer(nextPlayer, geneticBoon);
    const heirCaps = projectedEffStatsFor(nextPlayer, eq, ageDay);
    nextPlayer.chp = heirCaps.hp;
    nextPlayer.cmp = heirCaps.mp;
    nextPlayer.freshStartCaps = { hp: heirCaps.hp, mp: heirCaps.mp };
    const inheritedUlt = pl.ult ? { ...pl.ult, ready:false } : null;
    const partnerText = partner ? (partner.nm + " · " + companionElementLabel(partner) + " · " + partner.nature) : "No bonded companion — a ward inherits the estate in your stead.";
    setPopup({ type:"succession", text: "🕯 Legacy Transition\n\n" + (pl.name + " reached Day 31 and passed the torch.") + "\n\nPartner: " + partnerText + "\nHeir: " + heirName + " · Generation " + (((pl.generation || 1) + 1)) + "\nTrait: " + heirTrait.nm + " — " + heirTrait.ds + "\nGenetic Boon: " + (geneticBoon?.nm || "Dormant") + (geneticBoon?.ds ? (" — " + geneticBoon.ds) : "") + "\nWill: " + willGold + "G carried forward.", choices:[
      { label:"Continue as heir", action: () => { setPl(nextPlayer); setUlts(prev => { const pool = [...(prev || [])]; if (inheritedUlt && !pool.some(u => u.name === inheritedUlt.name)) pool.push(inheritedUlt); if (geneticBoon?.kind === "ult" && geneticBoon.ult && !pool.some(u => u.name === geneticBoon.ult.name)) pool.push({ ...geneticBoon.ult, ready:false }); return pool; }); setGold(willGold); setBank(willBank); setLifeStartTime(timerNow); setCopied(null); setCopyN(0); setBattleBonus(null); setBtl(null); setScr("map"); setSub(null); setAlly(null); setSpouse(null); setCompanionSeekLocked(false); setBondSwapUsed(false); successionRef.current = false; setPopup(null); notify("Generation " + nextPlayer.generation + " rises: " + nextPlayer.name); } },
      { label:"Return to world", action: () => { successionRef.current = false; setPopup(null); setBtl(null); setScr("map"); } }
    ]});
  }, [pl, spouse, ageDay, gold, bank, timerNow, notify]);

  useEffect(() => {
    if (!pl || ageDay < 31 || popup?.type === "succession") return;
    startSuccession("age");
  }, [pl, ageDay, popup, startSuccession]);

  // Save/Load
  const saveGame = (slot) => { setSaves(s => { const n = [...s]; n[slot] = {
    pl, gold, inv, eq, pos, kills, disc: [...disc], story, ults,
    bank, loan, loanTime,
    pet, ally, lastTown, devPos,
    timerStart, lifeStartTime,
    spouse, companionSeek, companionSeekLocked, bondSwapUsed, tavernCompanionCycle, tavernCompanions,
    repelSteps, arenaCD, guildMission,
    shopStock, shopStockCycle, armorerStock, armorerStockCycle, shipwrightStock, shipwrightStockCycle,
    tavernRumorCycle, tavernRumors, paidRumor, paidRumorCycle,
    campCDs, hostileCDs, riftCDs, ruinCDs, shrineCDs, beastZoneCDs,
    fieldBossCycle, fieldBossDefeated,
    shards, fragments, djinnWish, fish, fishCD,
    shrineLoreSeen,
    subMap
  }; return n; }); notify("Saved slot " + (slot + 1) + "!"); };
  const loadGame = (slot) => { const d = saves[slot]; if (!d) { notify("Empty!"); return; }
    setPl(d.pl); setGold(d.gold); setInv(d.inv); setEq(d.eq); setPos(d.pos); setKills(d.kills);
    setDisc(new Set(d.disc || [])); setStory(d.story); setUlts(d.ults);
    setBank(d.bank || 0); setLoan(d.loan || 0); setLoanTime(d.loanTime || 0); setBankInterestMark(d.bankInterestMark || 0); setLoanPenaltyMark(d.loanPenaltyMark || 0);
    setPet(d.pet); setAlly(d.ally); setLastTown(d.lastTown || { x: 38, y: 38 }); setDevPos(d.devPos);
    setRepelSteps(d.repelSteps || 0); setArenaCD(d.arenaCD || 0); setGuildMission(d.guildMission || null);
    setShopStock(d.shopStock || null); setShopStockCycle(d.shopStockCycle ?? -1);
    setArmorerStock(d.armorerStock || null); setArmorerStockCycle(d.armorerStockCycle ?? -1);
    setShipwrightStock(d.shipwrightStock || null); setShipwrightStockCycle(d.shipwrightStockCycle ?? -1);
    setTavernRumorCycle(d.tavernRumorCycle ?? -1); setTavernRumors(d.tavernRumors || []); setPaidRumor(d.paidRumor || null); setPaidRumorCycle(d.paidRumorCycle ?? -1);
    setCampCDs(d.campCDs || {}); setHostileCDs(d.hostileCDs || {}); setRiftCDs(d.riftCDs || {}); setRuinCDs(d.ruinCDs || {}); setShrineCDs(d.shrineCDs || {}); setBeastZoneCDs(d.beastZoneCDs || {});
    setShards(d.shards || 0); setFragments(d.fragments || 0); setDjinnWish(d.djinnWish || null); setFish(d.fish || []); setFishCD(d.fishCD || 0); setShowFishLedger(false); setFieldBossCycle(d.fieldBossCycle ?? -1); setFieldBossDefeated(d.fieldBossDefeated || {});
    setShrineLoreSeen(d.shrineLoreSeen || []);
    setSubMap(d.subMap || null);
    if (d.timerStart) setTimerStart(d.timerStart);
    if (d.lifeStartTime) setLifeStartTime(d.lifeStartTime);
    setSpouse(d.spouse || null); setCompanionSeek(d.companionSeek || "female"); setCompanionSeekLocked(!!d.companionSeekLocked); setBondSwapUsed(!!d.bondSwapUsed); setTavernCompanionCycle(d.tavernCompanionCycle ?? -1); setTavernCompanions(d.tavernCompanions || []);
    successionRef.current = false;
    setScr(d.subMap ? "submap" : "map"); notify(d.subMap ? "Loaded into submap!" : "Loaded!"); };

  // Helper stats
  const effSt = useCallback((p) => projectedEffStatsFor(p, eq, ageDay), [eq, ageDay]);
  const activePassives = pl?.passives?.filter(pp => pp.equipped) || [];
  const passiveHas = useCallback((ef) => activePassives.some(pp => pp.ef === ef), [activePassives]);
  const currentHpCap = pl ? (effSt(pl).hp || 0) : 0;
  const currentMpCap = pl ? (effSt(pl).mp || 0) : 0;
  const capRef = useRef({ hp: 0, mp: 0 });
  useEffect(() => {
    if (!pl) return;
    setPl(p => {
      if (!p) return p;
      const liveCaps = projectedEffStatsFor(p, eq, ageDay);
      const liveHpCap = liveCaps.hp || currentHpCap || p.chp || 0;
      const liveMpCap = liveCaps.mp || currentMpCap || p.cmp || 0;
      const startupHp = Math.max(p.freshStartCaps?.hp || 0, liveHpCap || 0);
      const startupMp = Math.max(p.freshStartCaps?.mp || 0, liveMpCap || 0);
      if (p.capSyncPending || p.freshStart) {
        return { ...p, chp: startupHp, cmp: startupMp, freshStart: false, freshStartCaps: null, capSyncPending: false };
      }
      const prevHp = capRef.current.hp || liveHpCap || p.chp || 0;
      const prevMp = capRef.current.mp || liveMpCap || p.cmp || 0;
      const playerWasExactlyFullHp = prevHp > 0 && (p.chp ?? 0) === prevHp;
      const playerWasExactlyFullMp = prevMp > 0 && (p.cmp ?? 0) === prevMp;
      let nh = Math.min(liveHpCap || p.chp || 0, Math.max(0, p.chp ?? liveHpCap));
      let nm = Math.min(liveMpCap || p.cmp || 0, Math.max(0, p.cmp ?? liveMpCap));
      if (playerWasExactlyFullHp && liveHpCap > prevHp) nh = liveHpCap;
      if (playerWasExactlyFullMp && liveMpCap > prevMp) nm = liveMpCap;
      if (nh === p.chp && nm === p.cmp) return p;
      return { ...p, chp: nh, cmp: nm };
    });
    capRef.current = { hp: currentHpCap, mp: currentMpCap };
  }, [currentHpCap, currentMpCap, eq, ageDay, pl?.capSyncPending, pl?.freshStart, pl?.freshStartCaps?.hp, pl?.freshStartCaps?.mp]);
  useEffect(() => {
    setEq(cur => {
      const safe = { w1:null, w2:null, helm:null, body:null, glv:null, boot:null, c1:null, c2:null, ...(cur || {}) };
      const invIds = new Set((Array.isArray(inv) ? inv : []).filter(Boolean).map(it => it.id));
      let changed = !cur || Object.keys(cur || {}).length !== Object.keys(safe).length;
      ["c1","c2"].forEach(slot => {
        if (safe[slot] && !invIds.has(safe[slot].id)) {
          safe[slot] = null;
          changed = true;
        }
      });
      return changed ? safe : cur;
    });
  }, [inv]);
  useEffect(() => {
    if (!pl || scr === "battle") return;
    const caps = projectedEffStatsFor(pl, eq, ageDay);
    if (!caps?.hp || !caps?.mp) return;
    if ((pl.chp || 0) > caps.hp || (pl.cmp || 0) > caps.mp) {
      setPl(p => p ? ({ ...p, chp: Math.min(p.chp || 0, caps.hp), cmp: Math.min(p.cmp || 0, caps.mp) }) : p);
    }
  }, [pl, eq, ageDay, scr]);
  const applyBattleStartPassive = useCallback((player, enemies) => {
    const p2 = { ...player };
    const e2 = enemies.map(e => ({ ...e, efx: [...(e.efx || [])] }));
    const ps = (p2.passives || []).filter(pp => pp.equipped);
    const addSelf = (id, durOverride) => { const ef = FX(id); if (ef) p2.efx = [...(p2.efx || []), { ...ef, tl: durOverride || ef.dur }]; };
    ps.forEach(pp => {
      switch (pp?.ef) {
        case "start_shield": addSelf("shield", 2); break;
        case "start_evasion": addSelf("evasion", 2); break;
        case "start_barrier": addSelf("barrier", 1); break;
        case "start_regen": addSelf("regen", 3); break;
        case "start_haste": addSelf("haste", 3); break;
        case "start_reflect": addSelf("reflect", 2); break;
        case "start_nullify": addSelf("nullify", 1); break;
        case "start_fortify": addSelf("fortify", 2); break;
        case "start_empower": addSelf("empower", 3); break;
        case "start_thorns": addSelf("thorns", 3); break;
        case "start_guard": addSelf("guard", 3); break;
        case "lineage_start_fortify": addSelf("fortify", 2); break;
      }
    });
    return { player: p2, enemies: e2 };
  }, []);

  const storyPreFinalDone = useMemo(() => story.filter(s => s.id !== "s7").every(s => s.done), [story]);
  const activeStoryQuest = useMemo(() => story.find(s => !s.done) || null, [story]);
  const completedStoryQuests = useMemo(() => story.filter(s => s.done), [story]);
  const fishLedger = useMemo(() => {
    const counts = {};
    fish.forEach(f => { counts[f.nm] = (counts[f.nm] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0])).map(([nm, qty]) => ({ nm, qty }));
  }, [fish]);

  // Death
  const die = useCallback(() => {
    setPl((p) => {
      if (!p) return p;
      const stats = effSt(p);
      return { ...p, chp: Math.floor((stats.hp || p.st.hp) * 0.5), cmp: Math.floor((stats.mp || p.st.mp) * 0.5), pUsed: false, efx: [], tempBattleEl: null, tempBattleEl2: null, tempBonusEls: [], kagamiAttunedEnemyIds: [] };
    });
    const lost = Math.floor(gold * 0.1);
    setGold((g) => Math.max(0, g - lost));
    setPos(lastTown);
    setSubMap(null);
    setBtl(null);
    setScr("map");
    notify("Defeated... " + (subMap ? "You are forced out and recover at your last safe refuge." : "Your body gives way, but fate returns you to familiar ground.") + " -" + lost + "G");
  }, [gold, lastTown, effSt, notify, subMap]);

  // THEME — Parchment Codex palette
  const T = useMemo(() => ({
    bg:  "#f5ead0",  // parchment light — panel backgrounds
    c1:  "#ecdfc0",  // parchment mid
    c2:  "#dfd0aa",  // parchment dark — nested cards
    bd:  "#c0a87a",  // tan border
    gd:  "#8c6a10",  // dark gold — currency, headings
    ac:  "#1e3570",  // navy blue — accent
    tx:  "#18120a",  // dark ink — primary text
    dm:  "#6a5840",  // dim ink — secondary text
    hp:  "#941a1a",  // crimson — HP
    mp:  "#1e3570",  // navy — MP
    xp:  "#6b1f9e",  // purple — XP
    ok:  "#1a6b32",  // forest green — success
    bad: "#941a1a",  // crimson — danger/bad
    wn:  "#8c6a10",  // dark gold — warning
  }), []);

  const xpFor = l => Math.floor(50 * Math.pow(l, 1.42));

  const giveXP = useCallback((amt, p) => {
    let np = { ...p, xp: p.xp + amt };
    while (np.xp >= xpFor(np.level)) {
      np.xp -= xpFor(np.level); np.level++;
      np.st = { ...np.st, hp: np.st.hp + R(3,7), mp: np.st.mp + R(2,4), atk: np.st.atk + R(0,1), def: np.st.def + R(0,1), spd: np.st.spd + R(0,1), mag: np.st.mag + R(0,1), lck: np.st.lck + R(0,1) };
      const lk = np.skills.filter(s => !s.unlocked);
      if (lk.length) { const u = P(lk); np.skills = np.skills.map(s => s.id === u.id ? { ...s, unlocked: true } : s); }
      const prevRank = getRank(np.level - 1);
      const newRank = getRank(np.level);
      if (prevRank.nm !== newRank.nm) {
        const rb = newRank.bonus || {};
        if (rb.hp) np.st.hp += rb.hp;
        if (rb.mp) np.st.mp += rb.mp;
        if (rb.atk) np.st.atk += rb.atk;
        if (rb.def) np.st.def += rb.def;
        if (rb.mag) np.st.mag += rb.mag;
        if (rb.spd) np.st.spd += rb.spd;
        notify(newRank.ic + " Rank Up: " + newRank.nm + "!");
      } else {
        notify("Level " + np.level + "!");
      }
      try { musicRef.current.playSfx("levelup"); } catch {}
    }
    return np;
  }, [notify]);

  // CHARACTER CREATION
  const createChar = () => {
    if (!selCls || !cName.trim()) return;
    const c = CLS.find(x => x.id === selCls);
    const skills = mkSkills(c);
    const passives = mkPassives(c);
    const ultPool = mkUltPool(c);
    const ult = P(ultPool);
    const primalEls = skills._els || null;
    const elDisplay = primalEls ? primalEls.join("/") : [c.el, c.el2].filter(Boolean).join("/");
    const allInter = c.inter || [{ ds: "Debuff then attack: +15% damage bonus", k: "setup" },{ ds: "Guard then skill: +10% power", k: "guard_skill" }];
    const startTown = P(START_TOWNS);
    // Randomly pick 2 of 6 hidden interactions
    const shuffled = [...allInter].sort(() => Math.random() - 0.5);
    const inter = pickAssignedInteractions(shuffled, 2, c.id);
    const startingLegacy = legacyTraitFor(cName.trim().length + c.el.length);
    let openingHp = Math.max(1, Math.floor(c.st.hp * ageProfile(1).mult.hp));
    let openingMp = Math.max(1, Math.floor(c.st.mp * ageProfile(1).mult.mp));
    if (startingLegacy.stat === "hp") openingHp = Math.max(1, Math.floor(openingHp * (startingLegacy.mult || 1.03)));
    if (startingLegacy.stat === "mp") openingMp = Math.max(1, Math.floor(openingMp * (startingLegacy.mult || 1.03)));
    const openingPassive = passives.find(pp => pp.equipped);
    if (openingPassive?.ef === "hp") openingHp = Math.max(1, Math.floor(openingHp * 1.18));
    if (openingPassive?.ef === "mp") openingMp = Math.max(1, Math.floor(openingMp * 1.2));
    if (openingPassive?.ef === "hybrid_pool") { openingHp = Math.max(1, Math.floor(openingHp * 1.15)); openingMp = Math.max(1, Math.floor(openingMp * 1.15)); }
    if (openingPassive?.ef === "iron_form") openingHp = Math.max(1, Math.floor(openingHp * 1.15));
    const starterEq = { w1: mkSigWpn(c.id), w2: null, helm: null, body: null, glv: null, boot: null, c1: null, c2: null };
    const bmData = getBM(selBloodmark);
    const pSt = { ...c.st };
    if (bmData && bmData.stat) Object.entries(bmData.stat).forEach(([k,v]) => { if (pSt[k] != null) pSt[k] = Math.max(1, pSt[k] + v); });
    const p = { name: cName.trim(), cid: c.id, level: 1, xp: 0, st: pSt, chp: openingHp, cmp: openingMp, skills, passives, ult, ultPool, el: c.el, el2: c.el2 || null, baseEl: c.el, baseEl2: c.el2 || null, bonusEls: [], primalEls, elDisplay, inter, quote: quote.trim() || "...", pUsed: false, efx: [], sex: cSex, generation: 1, lineage: cName.trim() + " Line", legacyTrait: startingLegacy, geneticBoon: null, freshStart: true, capSyncPending: true, bloodmark: selBloodmark || null, covenant: null, rank: "Wanderer", portrait: isValidPortraitURL(cPortrait) ? cPortrait.trim() : null };
    const openingCaps = projectedEffStatsFor(p, starterEq, 1);
    p.chp = openingCaps.hp;
    p.cmp = openingCaps.mp;
    p.freshStartCaps = { hp: openingCaps.hp, mp: openingCaps.mp };
    setEq(starterEq);
    setPl(p); setGold(100); setUlts([ult]); setPos({ x: startTown.x, y: startTown.y }); setLastTown({ x: startTown.x, y: startTown.y }); setLifeStartTime(Date.now()); successionRef.current = false;
    setInv([{ ...CONS[0], qty: 5 }, { ...CONS[2], qty: 3 }, { ...CONS[4], qty: 2 }]);
    setTimerStart(Date.now());
    setScr("map"); setLog(["EVENT|Your journey begins in " + startTown.n + "..." + (primalEls ? " Elements: " + primalEls.join(", ") : "")]); notify("Welcome, " + cName.trim() + "! Starting town: " + startTown.n);
  };

  // MAP MOVEMENT
  const move = useCallback((dx, dy) => {
    const now = Date.now();
    if (now - moveThrottleRef.current < 130) return;
    moveThrottleRef.current = now;
    if (!pl || !mData) return;
    const nx = pos.x + dx, ny = pos.y + dy;
    if (nx < 0 || nx >= MW || ny < 0 || ny >= MH) return;
    const tile = mData[ny * MW + nx];
    const enteringOcean = !!(tile && tile.bio === "ocean");
    const coordKey = nx + "," + ny;
    const isNewTile = !disc.has(coordKey);
    setPrevPos({ x: pos.x, y: pos.y });
    setPos({ x: nx, y: ny });
    setDisc(d => { const n = new Set(d); n.add(coordKey); return n; });
    if (enteringOcean) {
      const oceanLoss = Math.max(1, Math.floor((pl.chp || 0) * 0.10));
      const nextHp = Math.max(0, (pl.chp || 0) - oceanLoss);
      setPl(p => p ? ({ ...p, chp: Math.max(0, Math.min(projectedEffStatsFor(p, eq || {}, ageDay).hp || p.st.hp || 1, nextHp)) }) : p);
      notify("🌊 Ocean crossing! You lose " + oceanLoss + " HP.");
      if (nextHp <= 0) { die(); return; }
    }
    if (guildMission && guildMission.id === "explore" && isNewTile) setGuildMission(m => m ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m);
    if (repelSteps > 0) setRepelSteps(r => r - 1);
    if (tile?.poi?.type === "fieldboss") {
      startBattle([mkFieldBossFromPoi(tile.poi, pl.level)], "fieldboss");
      return;
    }
    if (tile && tile.bio !== "ocean" && !tile.poi && Math.random() < (repelSteps > 0 ? 0.015 : 0.03)) {
      const tier = C(Math.floor(pl.level / 5) + 1, 1, 6);
      const count = rollWildEncounterCount();
      startBattle(Array.from({ length: count }, () => mkEnemy(tier)), "wild");
    }
    setMData(md => moveFieldBossPois(md, { x: nx, y: ny }));
    if (devPos && nx === devPos.x && ny === devPos.y) {
      const boss = { ...mkEnemy(8), name: "Dream Devourer", hp: 800, mhp: 800, atk: 32, def: 22, spd: 18, mag: 30, xp: 500, gold: 300, boss: true, skills: [...MON_SK.slice(0, 4), { n: "Nightmare Cascade", pow: 70, el: "Psychic", fx: "sleep", aoe: true, unique: true }, { n: "Reality Shatter", pow: 80, el: "Void", fx: "confuse", unique: true }] };
      startBattle([boss], "boss");
    }
  }, [pos, mData, pl, ally, devPos, disc, guildMission, repelSteps]);

  // Auto-trail: step toward autoMoveTarget once per ~160ms while on map.
  // If autoEnterRef is true, enter the POI on arrival (double-click flow).
  useEffect(() => {
    if (scr !== "map") { if (autoMoveTarget) { setAutoMoveTarget(null); autoEnterRef.current = false; } return; }
    if (!autoMoveTarget || !pl || !mData) return;
    if (pos.x === autoMoveTarget.x && pos.y === autoMoveTarget.y) {
      setAutoMoveTarget(null);
      if (autoEnterRef.current) {
        autoEnterRef.current = false;
        const t = mData[pos.y * MW + pos.x];
        if (t && t.poi && enterPoiRef.current) {
          setTimeout(() => { try { enterPoiRef.current && enterPoiRef.current(); } catch (e) {} }, 80);
        }
      }
      return;
    }
    const id = setTimeout(() => {
      const dx = autoMoveTarget.x - pos.x;
      const dy = autoMoveTarget.y - pos.y;
      if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) move(Math.sign(dx), 0);
      else if (dy !== 0) move(0, Math.sign(dy));
      else if (dx !== 0) move(Math.sign(dx), 0);
    }, 160);
    return () => clearTimeout(id);
  }, [scr, autoMoveTarget, pos, pl, mData, move]);

  useEffect(() => {
    if (scr !== "map" || !mData || !pl) return;
    const id = setInterval(() => {
      setMData(md => moveFieldBossPois(md, pos));
      setDevPos(d => moveRoamingBossPos(d, mData, pos));
    }, 900);
    return () => clearInterval(id);
  }, [scr, mData, pl, pos]);

  // ENTER POI
  const OUTPOST_LAYOUTS = [
    { key:"bastion", label:"Bastion Yard", rewardBias:"fortress", encounters:[{idx:11,c:1,roles:["brute","guard","controller"]},{idx:24,c:2,roles:["guard","brute","controller"]},{idx:53,c:3,roles:["brute","controller","trickster"]},{idx:75,c:3,roles:["guard","controller","brute"]}], treasures:[15,33,46,62,77], bossIdx:88 },
    { key:"ambush", label:"Predator Ring", rewardBias:"hunt", encounters:[{idx:13,c:2,roles:["trickster","brute","speed"]},{idx:26,c:2,roles:["trickster","controller","brute"]},{idx:47,c:3,roles:["speed","trickster","brute"]},{idx:64,c:3,roles:["trickster","speed","controller"]}], treasures:[18,31,55,72,84], bossIdx:88 },
    { key:"rotcourt", label:"Rot Court", rewardBias:"venom", encounters:[{idx:12,c:2,roles:["controller","trickster","brute"]},{idx:35,c:2,roles:["controller","controller","brute"]},{idx:58,c:3,roles:["controller","trickster","controller"]},{idx:74,c:3,roles:["brute","controller","trickster"]}], treasures:[16,28,44,67,81], bossIdx:88 }
  ];
  const RIFT_LAYOUTS = [
    { key:"nullspine", label:"Null Spine", rewardBias:"void", path:[{x:0,y:9},{x:1,y:8},{x:1,y:7},{x:2,y:7},{x:2,y:6},{x:3,y:5},{x:3,y:4},{x:4,y:4},{x:5,y:3},{x:5,y:2},{x:6,y:2},{x:7,y:1},{x:8,y:1},{x:9,y:0}], encounters:[{x:1,y:8,c:2,roles:["controller","trickster","brute"]},{x:2,y:7,c:3,roles:["controller","brute","trickster"]},{x:3,y:5,c:3,roles:["trickster","controller","brute"]},{x:5,y:3,c:3,roles:["controller","trickster","brute"]},{x:6,y:2,c:3,roles:["controller","brute","trickster"]},{x:7,y:1,c:3,roles:["trickster","controller","brute"]}], puzzles:[{x:1,y:7},{x:5,y:2}], treasures:[{x:4,y:4},{x:8,y:1},{x:8,y:0},{x:9,y:1}], boss:{x:9,y:0} },
    { key:"stormarc", label:"Storm Arc", rewardBias:"tempo", path:[{x:0,y:9},{x:1,y:9},{x:2,y:8},{x:3,y:8},{x:4,y:7},{x:5,y:6},{x:5,y:5},{x:6,y:4},{x:7,y:3},{x:7,y:2},{x:8,y:1},{x:9,y:1},{x:9,y:0}], encounters:[{x:1,y:9,c:2,roles:["speed","controller","trickster"]},{x:3,y:8,c:2,roles:["trickster","controller","brute"]},{x:5,y:6,c:3,roles:["speed","controller","brute"]},{x:6,y:4,c:3,roles:["controller","speed","trickster"]},{x:7,y:2,c:3,roles:["trickster","controller","brute"]},{x:8,y:1,c:3,roles:["speed","controller","trickster"]}], puzzles:[{x:4,y:7},{x:7,y:3}], treasures:[{x:5,y:5},{x:7,y:1},{x:8,y:0}], boss:{x:9,y:0} },
    { key:"cathedral", label:"Cathedral Spine", rewardBias:"relic", path:[{x:0,y:9},{x:0,y:8},{x:1,y:7},{x:2,y:7},{x:3,y:6},{x:4,y:6},{x:5,y:5},{x:6,y:4},{x:6,y:3},{x:7,y:2},{x:8,y:2},{x:9,y:1},{x:9,y:0}], encounters:[{x:0,y:8,c:2,roles:["controller","brute","trickster"]},{x:2,y:7,c:2,roles:["controller","trickster","brute"]},{x:4,y:6,c:3,roles:["brute","controller","trickster"]},{x:6,y:4,c:3,roles:["controller","controller","brute"]},{x:7,y:2,c:3,roles:["trickster","controller","brute"]},{x:8,y:2,c:3,roles:["controller","brute","trickster"]}], puzzles:[{x:3,y:6},{x:6,y:3}], treasures:[{x:5,y:5},{x:8,y:1},{x:9,y:2}], boss:{x:9,y:0} }
  ];
  const buildOutpostSubmap = (level, originPos, boss) => {
    const layout = OUTPOST_LAYOUTS[_h2(originPos.x, originPos.y) % OUTPOST_LAYOUTS.length];
    const tier = C(Math.floor(level/4)+1, 1, 6);
    const tiles = Array.from({length:100}, (_,i) => ({x:i%10,y:Math.floor(i/10),type:null}));
    layout.encounters.forEach((enc, idx) => {
      tiles[enc.idx].type = "encounter";
      tiles[enc.idx].enemies = mkEncounterPack(tier + (idx > 1 ? 1 : 0), enc.c, boss.el, enc.roles);
    });
    tiles[layout.bossIdx].type = "boss";
    tiles[layout.bossIdx].rewardBias = layout.rewardBias;
    tiles[layout.bossIdx].enemies = [boss];
    const tCount = R(2,4);
    layout.treasures.sort(()=>Math.random()-0.5).slice(0, tCount).forEach(ti => { if (!tiles[ti].type) tiles[ti] = { ...tiles[ti], type:"treasure", rewardBias:layout.rewardBias }; });
    ensureSubmapBossAccess(tiles, layout.bossIdx % 10, Math.floor(layout.bossIdx / 10), 0, 0);
    return { tiles, label: layout.label, rewardBias: layout.rewardBias };
  };
  const buildRiftSubmap = (level, originPos, boss) => {
    const layout = RIFT_LAYOUTS[_h2(originPos.x, originPos.y) % RIFT_LAYOUTS.length];
    const tier = C(Math.floor(level/4)+2, 2, 7);
    const tiles = Array.from({length:100}, (_,i) => ({x:i%10,y:Math.floor(i/10),type:"safe"}));
    layout.path.forEach(pt => { const idx = pt.y * 10 + pt.x; tiles[idx] = { x: pt.x, y: pt.y, type:"safe" }; });
    layout.encounters.forEach((enc, idx) => {
      const ii = enc.y * 10 + enc.x;
      tiles[ii].type = "encounter";
      tiles[ii].rewardBias = layout.rewardBias;
      tiles[ii].enemies = mkEncounterPack(tier + (idx >= 2 ? 1 : 0), enc.c, boss.el, enc.roles);
    });
    layout.puzzles.forEach(pt => { tiles[pt.y * 10 + pt.x].type = "ruin_puzzle"; });
    layout.treasures.forEach(pt => { tiles[pt.y * 10 + pt.x] = { x: pt.x, y: pt.y, type:"treasure_rift", rewardBias: layout.rewardBias }; });
    const bossIdx = layout.boss.y * 10 + layout.boss.x;
    tiles[bossIdx].type = "boss";
    tiles[bossIdx].rewardBias = layout.rewardBias;
    tiles[bossIdx].enemies = [boss];
    ensureSubmapBossAccess(tiles, layout.boss.x, layout.boss.y, 0, 9);
    return { tiles, label: layout.label, rewardBias: layout.rewardBias };
  };
  const rollOutpostTreasure = (level, bias) => {
    const biasItems = {
      fortress: [{nm:"Bulwark Ration",origin:"Outpost Cache",ef:"shield",dur:3,ef2:"fortify",dur2:2,ds:"A defended-line ration built for camp sieges and boss lanes."},{nm:"Siegebreak Resin",origin:"Outpost Cache",ef:"expose",dur:3,ef2:"aoe",v2:22,ds:"A cracking resin for defended packs and armored champions."}],
      hunt: [{nm:"Hunter's Brine",origin:"Outpost Cache",ef:"haste",dur:3,ef2:"evasion",dur2:2,ds:"A pursuit tonic for aggressive clears and cleaner route tempo."},{nm:"Execution Salt",origin:"Outpost Cache",ef:"empower",dur:2,ef2:"bleed",dur2:3,ds:"A finisher mix used by raiders to close wounded prey."}],
      venom: [{nm:"Antiplague Wax",origin:"Outpost Cache",ef:"cleanse",v:1,ef2:"nullify",dur2:2,ds:"A field seal meant for toxic dens and affliction-heavy pushes."},{nm:"Mireburst Flask",origin:"Outpost Cache",ef:"poison",dur:4,ef2:"weaken",dur2:2,ds:"A blight flask designed to soften packs before sustained pressure."}]
    };
    const pickBias = P(biasItems[bias] || biasItems.fortress);
    if (Math.random() < 0.46) return { item:{ ...pickBias, id: ID(), qty:1 }, text:"📦 " + pickBias.nm };
    const gear = Math.random() < 0.55 ? mkArmor(C(Math.floor(level/3)+2, 2, 7)) : mkWpn(C(Math.floor(level/3)+2, 2, 7));
    return { item:{ ...gear, qty:1 }, text:"💎 " + (gear.name || gear.nm) };
  };
  const rollRiftTreasure = (level, bias) => {
    const biasItems = {
      void: [{nm:"Null Lantern Oil",origin:"Rift Cache",ef:"nullify",dur:2,ef2:"shield",dur2:2,ds:"A stabilizer used to survive hostile void surges."},{nm:"Entropy Draft",origin:"Rift Cache",ef:"mp",v:65,ef2:"empower",dur2:2,ds:"A dangerous but efficient rift draught for high-pressure casting."}],
      tempo: [{nm:"Stormglass Phial",origin:"Rift Cache",ef:"haste",dur:3,ef2:"empower",dur2:2,ds:"A fast-cycling stimulant used to outpace rift predators."},{nm:"Phase Knife Capsule",origin:"Rift Cache",ef:"expose",dur:3,ef2:"silence",dur2:2,ds:"A surgical capsule for cracking dangerous elites before they cycle."}],
      relic: [{nm:"Archivist Ember",origin:"Rift Cache",ef:"mp",v:58,ef2:"cleanse",v2:1,ds:"A preserved scholar's ember used for long relic dives."},{nm:"Cathedral Wax",origin:"Rift Cache",ef:"barrier",dur:2,ef2:"regen",dur2:3,ds:"A sacred wax that steadies explorers through sustained rift attrition."}]
    };
    const baseShards = R(3,6) + Math.floor(level / 8);
    if (Math.random() < 0.5) return { item:{ ...P(biasItems[bias] || biasItems.void), id: ID(), qty:1 }, shards: baseShards, text:"🔹 +" + baseShards + " shards" };
    const gear = mkRiftGear(C(Math.floor(level/3)+3, 3, 8));
    return { item:{ ...gear, qty:1 }, shards: baseShards, text:"💎 " + (gear.name || gear.nm) + "\n🔹 +" + baseShards + " shards" };
  };
  const enterHostilePoi = () => {
    const ck = pos.x + "_" + pos.y;
    const hostileUntil = hostileCDs[ck] || 0;
    if (hostileUntil > timerNow) { setPopup({text: "⏰ This Outpost is on cooldown for another " + fmtMs(hostileUntil - timerNow) + "."}); return; }
    try {
      const localCampNames = (typeof CAMP_NAMES !== "undefined" && Array.isArray(CAMP_NAMES) && CAMP_NAMES.length) ? CAMP_NAMES : ["Thornwood Hideout","Rustfang Hollow","Ashpit Outpost","Blackthorn Den","Wraithbone Camp","Iron Tusk Fort","Nightfall Barracks","Dustfang Lair"];
      const localCampBosses = (typeof CAMP_BOSSES !== "undefined" && Array.isArray(CAMP_BOSSES) && CAMP_BOSSES.length) ? CAMP_BOSSES : [
        {name:"Ironjaw the Unyielding",el:"Metal",hp:300,atk:20,def:22,spd:6,mag:8},
        {name:"Silkweave the Puppeteer",el:"Psychic",hp:220,atk:14,def:12,spd:16,mag:22},
        {name:"Blazefury",el:"Fire",hp:250,atk:26,def:10,spd:18,mag:18},
        {name:"Venomqueen Scylla",el:"Poison",hp:230,atk:16,def:14,spd:14,mag:20},
        {name:"Gravewatch",el:"Dark",hp:280,atk:18,def:18,spd:10,mag:16}
      ];
      const campName = localCampNames[_h1(pos.x,pos.y) % localCampNames.length];
      const boss = mkOutpostBoss(pl.level, pos);
      const built = buildOutpostSubmap(pl.level, pos, boss);
      setSubMap({type:"hostile",tiles:built.tiles,pos:{x:0,y:0},name:campName + " — " + built.label,cleared:[],origin:{...pos},bossAlive:true,rewardBias:built.rewardBias});
      setScr("submap");
      setStory(st => st.map(q => { if (q.id === "s4" && !q.done) { const p2 = { ...q, prog: (q.prog || 0) + 1 }; if (p2.prog >= (p2.goal || 1)) p2.done = true; return p2; } return q; }));
      setLog(l => [...l, "EVENT|Entered " + campName]);
    } catch (err) {
      setPopup({text: "Outpost entry failed: " + (err && err.message ? err.message : String(err))});
    }
  };

  const enterRiftPoi = () => {
    const ck = pos.x + "_" + pos.y;
    const riftUntil = riftCDs[ck] || 0;
    if (riftUntil > timerNow) { setPopup({text: "⏰ This rift is sealed for another " + fmtMs(riftUntil - timerNow) + "."}); return; }
    try {
      const localRiftNames = (typeof RIFT_NAMES !== "undefined" && Array.isArray(RIFT_NAMES) && RIFT_NAMES.length) ? RIFT_NAMES : ["Shattered Meridian","Null Corridor","Entropy Gate","Dimensional Scar","Reality Fracture","Aether Wound","Chronal Fissure","Singularity"];
      const riftName = localRiftNames[_h1(pos.x,pos.y) % localRiftNames.length];
      const riftBoss = mkRiftBoss(pl.level, pos);
      const built = buildRiftSubmap(pl.level, pos, riftBoss);
      setSubMap({type:"rift",tiles:built.tiles,pos:{x:0,y:9},name:riftName + " — " + built.label,cleared:[],origin:{...pos},bossAlive:true,rewardBias:built.rewardBias});
      setScr("submap");
      setStory(st => st.map(q => { if (q.id === "s6" && !q.done) { const p2 = { ...q, prog: (q.prog || 0) + 1 }; if (p2.prog >= (p2.goal || 1)) p2.done = true; return p2; } return q; }));
      setLog(l => [...l, "EVENT|Entered " + riftName]);
    } catch (err) {
      setPopup({text: "Rift entry failed: " + (err && err.message ? err.message : String(err))});
    }
  };

  const enterPoi = () => {
    if (!mData || !pl) return;
    const tile = mData[pos.y * MW + pos.x];
    if (!tile?.poi) return;
    if (tile.poi.type === "hostile" || tile.poi.type === "outpost") { enterHostilePoi(); return; }
    if (tile.poi.type === "rift") { enterRiftPoi(); return; }
    enterPoiInner(tile);
  };
  const enterPoiInner = (tile) => {
    if (!tile?.poi) return;
    const p = tile.poi;
    if (p.type === "town") { setScr("town"); setSvc(null); setLastTown({ ...pos }); setStory(st => st.map(q => q.id === "s1" ? { ...q, done: true } : q)); }
    else if (p.type === "gambling") { setMg("menu"); setMgR(null); setMgCard(null); setScr("mini"); }
    else if (p.type === "shrine") { 
      const ck = pos.x + "_" + pos.y;
      const shrineCD = shrineCDs[ck] || 0;
      const shrineRem = shrineCD > timerNow ? shrineCD - timerNow : 0;
      if (shrineRem > 0) { setPopup({ text: "⏰ This shrine is quiet for another " + fmtMs(shrineRem) + "." }); return; }
      const s = effSt(pl); setPl(pp => ({ ...pp, chp: s.hp, cmp: s.mp }));
      const applyShrineCooldown = () => { const cooldownUntil = Math.max(timerNow || 0, Date.now()) + 2 * 3600000; setShrineCDs(cd => ({ ...cd, [ck]: Math.max(cd[ck] || 0, cooldownUntil) })); };
      const shrineExitChoice = [{ label:"Leave Shrine", action: () => setPopup(null) }];
      const openShrineMenu = () => {
        const shrineChoices = [];
        if (fragments >= 7) shrineChoices.push(
          { label: "🌟 Wish: Unlimited MP (24h)", action: () => { setFragments(f => f - 7); setDjinnWish({ type: "mp", until: timerNow + 86400000 }); notify("Djinn grants unlimited MP for 24 hours!"); setPopup(null); }},
          { label: "💰 Wish: 10,000 Gold", action: () => { setFragments(f => f - 7); setGold(g => g + 10000); notify("Djinn grants 10,000 gold!"); setPopup(null); }}
        );
        shrineChoices.push({ label: "✨ Commune with the shrine", action: () => {
          const roll = Math.random();
          if (roll < 0.45) {
            if (!ally) {
              const recruit = mkShrineAlly(pl.level, pl.cid);
              setAlly(recruit);
              applyShrineCooldown();
              setPopup({ text: "🤝 " + recruit.nm + " answers the shrine's call and joins your journey.\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice });
            } else {
              const bonusGold = 60 + pl.level * 5;
              setGold(g => g + bonusGold);
              applyShrineCooldown();
              setPopup({ text: "✨ The shrine blesses your current bond. You receive " + bonusGold + " gold instead.\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice });
            }
          } else if (roll < 0.82) {
            const boon = P([
              { txt: "💎 The shrine reveals a hidden cache. +120 gold.", fn: () => setGold(g => g + 120) },
              { txt: "🔮 A soft chime leaves behind 2 relic shards.", fn: () => setShards(s => s + 2) },
              { txt: "🧪 You find a Greater Mana Elixir.", fn: () => stashConsumable({ ...CONS.find(c => c.id === "mp2"), qty: 1 }) },
              { txt: "🛡️ The altar grants a Shield Draught.", fn: () => stashConsumable({ ...CONS.find(c => c.id === "shd"), qty: 1 }) },
              { txt: "💚 Sacred warmth restores and strengthens you. +1 Relic Shard and full HP/MP.", fn: () => { setShards(s => s + 1); setPl(pp => { const stt = effSt(pp); return { ...pp, chp: stt.hp, cmp: stt.mp }; }); } },
            ]);
            boon.fn();
            applyShrineCooldown();
            setPopup({ text: boon.txt + "\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice });
          } else {
            const unseen = SHRINE_LORE.map((_, i) => i).filter(i => shrineLoreSeen.indexOf(i) < 0);
            const idx = unseen.length ? P(unseen) : null;
            const loreText = idx == null ? "The shrine is warm with old memory, but its stories have already been shared with you." : "📜 Shrine Lore\n\n" + SHRINE_LORE[idx];
            if (idx != null) setShrineLoreSeen(ls => [...ls, idx]);
            applyShrineCooldown();
            setPopup({ text: loreText + "\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice });
          }
        }});
        shrineChoices.push({ label: "🌠 Receive shrine boon", action: () => {
          const boonItem = P([
            { nm:"Sanctified Dew", ef:"cleanse", ef2:"regen", dur2:3, v:1, pr:0, ds:"A shrine-only restorative that clears debuffs and grants long Regen." },
            { nm:"Pilgrim Feather", ef:"haste", dur:3, ef2:"evasion", dur2:2, pr:0, ds:"A sacred feather that sharpens movement and survival together." },
            { nm:"Halo Sigil", ef:"shield", dur:3, ef2:"nullify", dur2:2, pr:0, ds:"A luminous sigil that protects the bearer from pressure and status alike." },
          ]);
          stashConsumable({ ...boonItem, id: ID(), qty: 1 });
          applyShrineCooldown();
          setPopup({ text: "🌠 The shrine shapes a unique relic for your road: " + boonItem.nm + ".\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice });
        }});
        shrineChoices.push({ label: "🕯 Seek a reading", action: () => {
          const targets = (mData || []).filter(t => t && t.poi && ['rift','ruin','shrine','beastzone','treasure'].includes(t.poi.type));
          if (!targets.length) { applyShrineCooldown(); setPopup({ text:"The flame gutters. No omen arrives.\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice }); return; }
          const pick = P(targets);
          const dx = pick.x - pos.x, dy = pick.y - pos.y;
          const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'south' : 'north');
          const dist = Math.abs(dx) + Math.abs(dy);
          applyShrineCooldown();
          setPopup({ text: "🕯 The shrine murmurs of " + (pick.poi.nm || pick.poi.type) + " to the " + dir + ", about " + dist + " tiles away.\n\nThis shrine falls quiet for 2 hours.", choices: shrineExitChoice });
        }});
        if (shrineLoreSeen.length > 0) shrineChoices.push({ label: "📚 Read collected lore", action: () => {
          const loreBody = shrineLoreSeen.length ? shrineLoreSeen.map((idx, i) => (i + 1) + ". " + SHRINE_LORE[idx]).join("\n\n") : "You have not collected any shrine lore yet.";
          setPopup({ text: "📚 Collected Shrine Lore\n\n" + loreBody, choices:[{ label: "Back to Shrine", action: openShrineMenu }] });
        }});
        shrineChoices.push({ label: "Leave", action: () => setPopup(null) });
        setPopup({ text: "⛩️ The shrine restores your strength. How will you respond to its blessing?", choices: shrineChoices });
      };
      openShrineMenu();
    }
    else if (p.type === "camp") { 
      const ck = pos.x + "_" + pos.y;
      const campUntil = campCDs[ck] || 0;
      if (campUntil > timerNow) { setPopup({ text: "⏰ This camp is resting for another " + fmtMs(campUntil - timerNow) + "." }); return; }
      const s = effSt(pl); setPl(pp => ({ ...pp, chp: Math.min(s.hp, pp.chp + Math.floor(s.hp * 0.3)), cmp: Math.min(s.mp, pp.cmp + Math.floor(s.mp * 0.3)) })); 
      setCampCDs(cd => ({...cd, [ck]: timerNow + 120000}));
      setLastTown({...pos}); // camp becomes respawn point
      notify("Friendly camp: rested! This is now your respawn point."); 
      setLog(l => [...l, "EVENT|Rested at friendly camp. +30% HP/MP. Respawn set."]); 
    }
    else if (p.type === "fieldboss") { const fb = mkFieldBossFromPoi(p, pl.level); startBattle([fb], "fieldboss"); }
    else if (p.type === "beastzone") { 
      const ck = pos.x + "_" + pos.y;
      const beastUntil = beastZoneCDs[ck] || 0;
      if (beastUntil > timerNow) { setPopup({ text: "⏰ This beast zone is unsettled for another " + fmtMs(beastUntil - timerNow) + "." }); return; }
      setBeastZoneCDs(cd => ({ ...cd, [ck]: timerNow + 2 * 3600000 }));
      const beast = P(BEASTS);
      const beastEnemy = { id: ID(), name: beast.nm, hp: Math.floor(beast.hp * (1 + pl.level * 0.05)), mhp: Math.floor(beast.hp * (1 + pl.level * 0.05)), atk: Math.floor(beast.atk * (1 + pl.level * 0.03)), def: beast.def, spd: beast.spd, mag: Math.floor((beast.atk + beast.def) * 0.4), el: beast.el, xp: 15 + pl.level * 2, gold: 10 + pl.level, skills: [beast.sk1, beast.sk2], efx: [], boss: false, beastData: beast };
      startBattle([beastEnemy], "beast");
    }
    else if (p.type === "treasure") {
      const w = mkRandomGear();
      const desc = w.isShield ? w.name + " [" + w.el + "]\nDEF:" + w.def + (w.fxD ? "\n⚡ " + w.fxD : "") : w.slot ? w.name + " [" + w.slot + "]\nDEF:" + w.def + " HP:+" + (w.hp||0) + " SPD:" + (w.spd||0) + (w.fxD ? "\n⚡ " + w.fxD : "") : w.name + " [" + w.el + "]\nATK:" + w.atk + " MAG:" + (w.mag||0) + (w.fxD ? "\n⚡ " + w.fxD : "");
      const isWpn = w.atk !== undefined && !w.isShield && !w.slot;
      const wpnCount = inv.filter(i => i.atk !== undefined && !i.isShield && !i.slot).length + (eq.w1 ? 1 : 0) + (eq.w2 ? 1 : 0);
      if (isWpn && wpnCount >= 10) {
        setPopup({ text: "💎 Found: " + desc + "\n\n⚠ Weapon inventory full (10)! Discard one?", choices: inv.filter(i => i.atk !== undefined && !i.isShield && !i.slot).slice(0, 4).map(it => ({ label: "Drop " + (it.name||it.nm), action: () => { setInv(i => [...i.filter(x => x.id !== it.id), { ...w, qty: 1 }]); setPopup(null); notify("Swapped!"); } })).concat([{ label: "Leave it", action: () => setPopup(null) }]) });
      } else {
        setInv(i => [...i, { ...w, qty: 1 }]);
        if (guildMission && guildMission.id === "treasure") setGuildMission(m => m ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m);
        setPopup({ text: "💎 Treasure Found!\n\n" + desc });
      }
      setMData(md => { const nm = [...md]; nm[pos.y*MW+pos.x] = { ...nm[pos.y*MW+pos.x], poi: null }; return nm; });
    }
    else {
      const ck = pos.x + "_" + pos.y;
      if (p.type === "hostile" || p.type === "outpost") {
        enterHostilePoi();
      }
      else if (p.type === "rift") {
        enterRiftPoi();
      }
      else if (p.type === "ruin") {
        const ruinUntil = ruinCDs[ck] || 0;
        if (ruinUntil > timerNow) { setPopup({text: "⏰ These ruins are dormant for another " + fmtMs(ruinUntil - timerNow) + "."}); return; }
        const puzzleSeed = (pos.x * 997) + (pos.y * 619) + getRefreshCycle(12) * 17 + (pl?.level || 1) * 13;
        const puzzle = buildRuinPuzzle(puzzleSeed, (pl?.level || 1) >= 12 ? 2 : 1);
        const rewardPuzzle = (correct) => {
          setRuinCDs(cd => ({...cd, [ck]: timerNow + 12*3600000}));
          if (correct) {
            const reward = buildRuinReward(pl?.level || 1, false);
            if (reward.fragment) setFragments(f => f + reward.fragment);
            if (reward.shards) setShards(s => s + reward.shards);
            if (reward.gold) setGold(g => g + reward.gold);
            if (reward.item) stashConsumable({ ...reward.item, id: ID(), qty: 1 });
            setPopup({text: "✅ " + puzzle.title + " solved!\n\n" + ruinRewardText(reward), choices:[{label:"Continue", action:() => setPopup(null)}]});
            setStory(st => st.map(q => { if (q.id === "s5" && !q.done) { const p2 = { ...q, prog: (q.prog || 0) + 1 }; if (p2.prog >= (p2.goal || 1)) p2.done = true; return p2; } return q; }));
          } else {
            setPopup({text: "❌ Incorrect. The ruins seal for 12 hours."});
          }
        };
        setPopup({
          text: "🏛️ " + puzzle.title + "\n\n" + puzzle.prompt + "\n\nSolve it to open the relic cache.",
          choices: [
            ...puzzle.options.map(opt => ({ label: String(opt), action: () => rewardPuzzle(String(opt) === String(puzzle.answer)) })),
            { label: "Leave", action: () => setPopup(null) }
          ]
        });
      }
      else {
        const tier = C(Math.floor(pl.level/4)+1, 1, 6); const en = Array.from({length: R(1,2)}, ()=>mkEnemy(tier)); startBattle(en, p.type);
      }
    }
  };

  // Keep enterPoi reachable from the auto-trail effect (avoids TDZ across closures)
  enterPoiRef.current = enterPoi;

  // SUBMAP MOVEMENT
  const subMapMove = useCallback((dx, dy) => {
    if (!subMap || !pl) return;
    const sm = subMap;
    const isRift = sm.type === "rift";
    const cols = 10;
    const rows = isRift ? 10 : 10;
    const nx = sm.pos.x + dx, ny = sm.pos.y + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    const prev = { x: sm.pos.x, y: sm.pos.y };
    const t = sm.tiles[ny * cols + nx];
    if (!t) { setSubMap(s => moveSubMapThreats({ ...s, pos: { x: nx, y: ny } })); return; }
    if (sm.cleared.includes(nx + "_" + ny)) { setSubMap(s => moveSubMapThreats({ ...s, pos: { x: nx, y: ny } })); return; }
    if ((t.type === "encounter" || t.type === "boss") && t.enemies) {
      if (t.type === "boss" && sm.bossAlive) {
        const unclearedEnc = sm.tiles.filter((tt,i) => tt.type === "encounter" && !sm.cleared.includes((i%cols)+"_"+Math.floor(i/cols)));
        if (unclearedEnc.length > 0) { notify("Clear all encounters first!"); return; }
      }
      setSubMap(s => ({...s, pos: {x: nx, y: ny}, cleared: [...s.cleared, nx+"_"+ny], bossAlive: t.type === "boss" ? false : s.bossAlive}));
      startBattle(t.enemies.map(e => ({...e, hp: e.mhp, efx: []})), sm.type);
      return;
    }
    if (t.type === "treasure" || t.type === "treasure_rift") {
      if (sm.bossAlive) {
        notify("The treasure is sealed until the boss falls.");
        setSubMap(s => moveSubMapThreats({ ...s, pos: { x: nx, y: ny } }));
        return;
      }
      const reward = sm.type === "rift" ? rollRiftTreasure(pl.level || 1, t.rewardBias || sm.rewardBias) : rollOutpostTreasure(pl.level || 1, t.rewardBias || sm.rewardBias);
      const loot = reward.item;
      const isGear = !!(loot && (loot.atk !== undefined || loot.slot || loot.isShield));
      if (loot) {
        if (isGear) setInv(i => [...i, {...loot, qty: 1}]);
        else stashConsumable({ ...loot, id: loot.id || ID(), qty: 1 });
      }
      if (reward.gold) setGold(g => g + reward.gold);
      if (reward.shards) setShards(s => s + reward.shards);
      const desc = !loot ? "Supplies recovered." : isGear ? (loot.isShield ? loot.name + " [" + loot.el + "] DEF:" + loot.def + (loot.fxD ? "\n⚡ " + loot.fxD : "") : loot.slot ? loot.name + " [" + loot.slot + "] DEF:" + loot.def + " HP:+" + (loot.hp||0) + (loot.fxD ? "\n⚡ " + loot.fxD : "") : loot.name + " [" + (loot.el||"") + "] ATK:" + (loot.atk||0) + " MAG:" + (loot.mag||0) + (loot.fxD ? "\n⚡ " + loot.fxD : "")) : loot.nm + "\n" + (loot.ds || itemEffectDetail(loot));
      setPopup({text: (sm.type === "rift" ? "🌀 Rift Cache\n" : "⛺ Outpost Cache\n") + desc + ((reward.gold || reward.shards) ? "\n\n" + [reward.gold ? ("💰 +" + reward.gold + "G") : null, reward.shards ? ("🔹 +" + reward.shards + " shards") : null].filter(Boolean).join("\n") : "")});
      setSubMap(s => ({...s, pos: {x: nx, y: ny}, cleared: [...s.cleared, nx+"_"+ny]}));
      if (guildMission && guildMission.id === "treasure") setGuildMission(m => m ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m);
      return;
    }
    if (t.type === "ruin_puzzle" && !sm.cleared.includes(nx+"_"+ny)) {
      setSubMap(s => ({...s, pos: {x: nx, y: ny}}));
      const puzzleSeed = (nx * 811) + (ny * 433) + (sm.type === "rift" ? 97 : 43) + (pl?.level || 1) * 19;
      const puzzle = buildRuinPuzzle(puzzleSeed, 2);
      const resolveSubmapPuzzle = (correct) => {
        if (correct) {
          const reward = buildRuinReward((pl?.level || 1) + 2, true);
          if (reward.fragment) setFragments(f => f + reward.fragment);
          if (reward.shards) setShards(s => s + reward.shards);
          if (reward.gold) setGold(g => g + reward.gold);
          if (reward.item) stashConsumable({ ...reward.item, id: ID(), qty: 1 });
          setPopup({ text: "✅ " + puzzle.title + " solved!\n\n" + ruinRewardText(reward) });
        } else {
          setPopup({ text: "❌ Failed. The chamber goes quiet and its cache collapses." });
        }
        setSubMap(s => ({...s, cleared:[...s.cleared, nx+"_"+ny]}));
      };
      setPopup({
        text: (isRift ? "Rift Ruin" : "Ancient Ruin") + " — " + puzzle.title + "\n\n" + puzzle.prompt + "\n\nSolve it to claim the deeper cache.",
        choices: [
          ...puzzle.options.map(opt => ({ label: String(opt), action: () => resolveSubmapPuzzle(String(opt) === String(puzzle.answer)) })),
          { label: "Withdraw", action: () => { setSubMap(s => ({...s, cleared:[...s.cleared, nx+"_"+ny]})); setPopup({ text: "You withdraw before the chamber fully wakes." }); } }
        ]
      });
      return;
    }
    setSubMap(s => moveSubMapThreats({ ...s, pos: { x: nx, y: ny } }));
  }, [subMap, pl, guildMission, notify]);

  // WASD + Arrow controls in submaps

  // Touch swipe movement for world map and submaps
  useEffect(() => {
    const el = swipeRef.current;
    if (!el || scr !== "map") return;
    let sx = 0, sy = 0, active = false;
    const start = (e) => { if (e.target && (e.target.closest('button') || e.target.closest('[data-noswipe="1"]'))) return; const t = e.touches ? e.touches[0] : e; sx = t.clientX; sy = t.clientY; active = true; };
    const end = (e) => {
      if (!active) return; active = false;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
      else move(0, dy > 0 ? 1 : -1);
    };
    el.addEventListener("touchstart", start, {passive:true});
    el.addEventListener("touchend", end, {passive:true});
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchend", end); };
  }, [scr, move]);

  useEffect(() => {
    const el = subSwipeRef.current;
    if (!el || scr !== "submap" || !subMap) return;
    let sx = 0, sy = 0, active = false;
    const start = (e) => { if (e.target && (e.target.closest('button') || e.target.closest('[data-noswipe="1"]'))) return; const t = e.touches ? e.touches[0] : e; sx = t.clientX; sy = t.clientY; active = true; };
    const end = (e) => {
      if (!active) return; active = false;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) subMapMove(dx > 0 ? 1 : -1, 0);
      else subMapMove(0, dy > 0 ? 1 : -1);
    };
    el.addEventListener("touchstart", start, {passive:true});
    el.addEventListener("touchend", end, {passive:true});
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchend", end); };
  }, [scr, subMap, subMapMove]);
  useEffect(() => {
    if (scr !== "submap" || !subMap) return;
    const handler = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") { e.preventDefault(); subMapMove(0, -1); }
      else if (k === "s" || k === "arrowdown") { e.preventDefault(); subMapMove(0, 1); }
      else if (k === "a" || k === "arrowleft") { e.preventDefault(); subMapMove(-1, 0); }
      else if (k === "d" || k === "arrowright") { e.preventDefault(); subMapMove(1, 0); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scr, subMap, subMapMove]);

  useEffect(() => {
    if (scr !== "submap" || !subMap || !["hostile", "rift"].includes(subMap.type)) return;
    const id = setInterval(() => {
      setSubMap(s => moveSubMapThreats(s));
    }, 1600);
    return () => clearInterval(id);
  }, [scr, subMap]);

  // BATTLE
  const startBattle = useCallback((enemies, type) => {
    const battleType = type || "wild";
    const tunedEnemies = (enemies || []).slice(0, 4).map(e => normalizeEnemyForBattle(e, battleType, pl?.level || 1));
    const prep = applyBattleStartPassive(pl, tunedEnemies);
    setPl(p => ({...prep.player, efx: prep.player.efx || [], lowHpBarrierUsed: false}));
    const enemiesWithPos = prep.enemies.map((e, i) => ({ ...e, pos: i < 2 ? 3 : 4 }));
    setBtl({ en: enemiesWithPos, turn: "p", chain: [], chainProg: 0, tn: 0, type: battleType, plPos: 1, moved: false, interactionState: { copiedSkillUses: 0, copiedFromBoss: false, guardThenCopyPrimed: false, copySequenceOpen: false, freezeAppliedIds: [], usedElements: [], elementUseCounts: {}, usedSkillNames: [], aoeDamageUses: 0, readyKeys: [], consecutiveGuards: 0, healUses: 0, buffUses: 0, debuffUses: 0, strikeCount: 0, guardUses: 0, damageSkillUses: 0, killCount: 0, luckyHighCount: 0, luckyLowCount: 0, devotionUnlocked: false, firstAttackPending: true, lastCopiedSkillEl: "" } });
    setBattleBonus(null);
    setBtlPanel(null);
    setBtlTarget(prep.enemies.find(e => e.hp > 0)?.id || null);
    setScr("battle");
    setLog(["⚔ Battle begins!" + (battleType === "train" ? " Training mode active." : battleType === "wild" ? " Swift field clash." : battleType === "pvp" ? " Arena rules engaged." : battleType === "outpost" ? " Outpost resistance hardens." : battleType === "rift" ? " Rift pressure thickens." : battleType === "fieldboss" ? " A roaming terror blocks the road." : "")]);
  }, [pl, applyBattleStartPassive]);

  // Helper: clear battle effects from player
  const clearBattleEffects = useCallback(() => {
    setPl(p => p ? {...p, efx: []} : p);
  }, []);

  const companionRoleProfile = (role) => ({
    supportDur: role === "support" ? 1 : role === "guard" ? 1 : 0,
    sustainMult: role === "support" ? 1.22 : role === "guard" ? 1.18 : 1,
    damageMult: role === "damage" ? 1.18 : role === "speed" ? 1.08 : role === "fx" ? 1.04 : 1,
    statusDur: role === "fx" ? 1 : 0,
    doubleTap: role === "speed" ? 0.22 : role === "damage" ? 0.08 : 0,
    executeMult: role === "damage" ? 1.16 : 1,
  });

  // ── v40 positional combat helpers ─────────────────────────────────
  // Lanes: 0=Vanguard, 1=Front, 2=Mid, 3=Skirmish, 4=Backline.
  // Player + allies live in 0–2, foes in 3–4. Lane 2 is the contested middle.
  const actionRange = useCallback((act, idx) => {
    if (act === "strike") {
      const w = eq.w1 || eq.w2;
      return (w && w.el && w.el !== "Null") ? 4 : 1;
    }
    if (act === "w2") return (eq.w2 && eq.w2.el && eq.w2.el !== "Null") ? 4 : 1;
    if (act === "skill") {
      const list = pl ? pl.skills.filter(s => s.equipped && s.unlocked) : [];
      const sk = list[idx];
      if (!sk) return 4;
      if (sk.aoe) return 4;
      if (sk.t !== "damage") return 4;
      return (sk.el && sk.el !== "Null") ? 4 : 1;
    }
    return 4; // copy / ult / mend / guard / items / aux all reach any lane
  }, [eq, pl]);

  const bMove = useCallback((toLane) => {
    if (!btl || btl.turn !== "p" || btl.moved) return;
    if (toLane < 0 || toLane > 2) return;
    if (toLane === (btl.plPos ?? 1)) return;
    const laneNm = ["Vanguard","Front","Mid"][toLane] || "lane " + toLane;
    setBtl(b => b ? ({ ...b, plPos: toLane, moved: true }) : b);
    setLog(l => [...l, "PLAYER|› Repositioned to " + laneNm + "."]);
  }, [btl]);

  const bAct = useCallback((act, idx) => {
    if (!btl || btl.turn !== "p") return;
    let np = { ...pl }, en = btl.en.map(e => ({ ...e, efx: [...e.efx] }));
    const st = effSt(np), tgt = (btlTarget ? en.find(e => e.id === btlTarget && e.hp > 0) : null) || en.find(e => e.hp > 0);
    if (!tgt) return;
    // ── v40 positional combat: range gate + distance damage modifier ──
    if (["strike","w2","skill","copy","ult"].includes(act) && tgt) {
      const _r = actionRange(act, idx);
      const _d = Math.abs((btl.plPos ?? 1) - (tgt.pos ?? 3));
      if (_r < _d && (act === "strike" || act === "w2" || act === "skill")) {
        setLog(l => [...l, "PLAYER|› Out of range — move closer or use a ranged ability."]);
        return;
      }
    }
    const wornArmor = [eq.helm, eq.body, eq.glv, eq.boot].filter(Boolean);
    const armorCritChance = wornArmor.reduce((sum, a) => sum + (gearHas(a, 'crit_boost') ? 0.08 : 0), 0);
    // v55: per-piece crit damage bonus from gear with the crit_damage fx (+15% to crit multiplier per piece)
    const armorCritDmgBoost = wornArmor.reduce((sum, a) => sum + (gearHas(a, 'crit_damage') ? 0.15 : 0), 0);
    const armorLuckDodge = wornArmor.reduce((sum, a) => sum + (gearHas(a, 'lck_boost') ? 0.05 : 0), 0);
    let lg = [], ch = [...btl.chain];
    const eqSk = np.skills.filter(s => s.equipped && s.unlocked);
    const encounterProfile = battleProfile(btl.type);
    // v40: distance modifier — point-blank melee + long-shot magic.
    // Safe to mutate: battleProfile() returns a fresh {...base} per call,
    // and playerDamage is a primitive — mutation does NOT leak into BATTLE_PROFILES.
    {
      const _r = actionRange(act, idx);
      const _d = Math.abs((btl.plPos ?? 1) - (tgt.pos ?? 3));
      let _distMult = 1;
      if (_r === 1 && _d === 1) { _distMult = 1.10; lg.push("⚡ Point-blank +10%"); }
      else if (_r >= 4 && _d >= 3) { _distMult = 1.12; lg.push("🎯 Long-shot +12%"); }
      encounterProfile.playerDamage = encounterProfile.playerDamage * _distMult;
    }
    let nextInteractionState = { ...(btl.interactionState || {}) };
    if (!Array.isArray(nextInteractionState.freezeAppliedIds)) nextInteractionState.freezeAppliedIds = [];
    if (!Array.isArray(nextInteractionState.usedElements)) nextInteractionState.usedElements = [];
    if (!nextInteractionState.elementUseCounts || typeof nextInteractionState.elementUseCounts !== "object") nextInteractionState.elementUseCounts = {};
    if (!Array.isArray(nextInteractionState.usedSkillNames)) nextInteractionState.usedSkillNames = [];
    if (!Number.isFinite(nextInteractionState.aoeDamageUses)) nextInteractionState.aoeDamageUses = 0;
    if (!Number.isFinite(nextInteractionState.consecutiveGuards)) nextInteractionState.consecutiveGuards = 0;
    if (!Number.isFinite(nextInteractionState.healUses)) nextInteractionState.healUses = 0;
    if (!Number.isFinite(nextInteractionState.buffUses)) nextInteractionState.buffUses = 0;
    if (!Number.isFinite(nextInteractionState.debuffUses)) nextInteractionState.debuffUses = 0;
    if (!Number.isFinite(nextInteractionState.strikeCount)) nextInteractionState.strikeCount = 0;
    if (!Number.isFinite(nextInteractionState.guardUses)) nextInteractionState.guardUses = 0;
    if (!Number.isFinite(nextInteractionState.damageSkillUses)) nextInteractionState.damageSkillUses = 0;
    if (!Number.isFinite(nextInteractionState.killCount)) nextInteractionState.killCount = 0;
    if (!Number.isFinite(nextInteractionState.luckyHighCount)) nextInteractionState.luckyHighCount = 0;
    if (!Number.isFinite(nextInteractionState.luckyLowCount)) nextInteractionState.luckyLowCount = 0;
    if (typeof nextInteractionState.devotionUnlocked !== "boolean") nextInteractionState.devotionUnlocked = false;
    if (typeof nextInteractionState.firstAttackPending !== "boolean") nextInteractionState.firstAttackPending = true;
    if (typeof nextInteractionState.lastCopiedSkillEl !== "string") nextInteractionState.lastCopiedSkillEl = "";
    const markFreezeTarget = (enemyId) => {
      if (!enemyId) return;
      const seen = new Set(nextInteractionState.freezeAppliedIds || []);
      seen.add(enemyId);
      nextInteractionState.freezeAppliedIds = [...seen];
    };
    const trackElementUse = (el) => {
      if (!el || el === "Null" || el === "Physical") return;
      const counts = { ...(nextInteractionState.elementUseCounts || {}) };
      counts[el] = (counts[el] || 0) + 1;
      nextInteractionState.elementUseCounts = counts;
      const seenEls = new Set(nextInteractionState.usedElements || []);
      seenEls.add(el);
      nextInteractionState.usedElements = [...seenEls];
    };
    const trackSkillName = (nm) => {
      const label = String(nm || "").trim();
      if (!label) return;
      nextInteractionState.usedSkillNames = [...(nextInteractionState.usedSkillNames || []), label].slice(-8);
    };
    const prevReadyKeys = new Set(
      getReadyInteractions(np.inter, btl, tgt)
        .filter(ai => ai.isReady)
        .map(ai => String(ai.k || "").toLowerCase())
    );

    // Battle log helper - creates colored entries
    const logAtk = (msg) => lg.push("⚔ " + msg);
    const logDmg = (msg) => lg.push("💥 " + msg);
    const logHeal = (msg) => lg.push("💚 " + msg);
    const logBuff = (msg) => lg.push("✦ " + msg);
    const logFx = (msg) => lg.push("🔮 " + msg);
    const logInfo = (msg) => lg.push("› " + msg);
    const playerTagged = (arr) => (arr || []).map(line => /^Event:/.test(String(line || "")) ? line : ("PLAYER|" + line));
    const harmfulIds = new Set(["burn","freeze","poison","stun","confuse","blind","silence","slow","weaken","expose","sleep","bleed","curse"]);
    const passiveLabelFor = (efCode, fallback) => ((pl.passives || []).find(pp => pp.equipped && pp.ef === efCode)?.nm) || fallback || "Passive";
    const triggerDebuffSurge = () => {
      if (!passiveHas("debuff_surge")) return;
      const surge = Math.max(3, Math.floor((st.mp || np.st.mp || 0) * 0.06));
      np.cmp = Math.min(st.mp, (np.cmp || 0) + surge);
      logHeal(passiveLabelFor("debuff_surge", "Hex Engine") + " restores " + surge + " MP");
    };
    const grantWardSiphon = (lineLabel) => {
      if (!passiveHas("ward_siphon")) return;
      np.cmp = Math.min(st.mp, (np.cmp || 0) + 4);
      logHeal((lineLabel || passiveLabelFor("ward_siphon", "Ward Siphon")) + ": +4 MP");
    };
    const attackWithWeapon = (weapon, slotKey, chainCode, fallbackName) => {
      const w = weapon;
      const fxKeys = gearEffects(w);
      const isShieldWeapon = !!(w && w.isShield);
      const isPiercing = !isShieldWeapon && fxKeys.includes("piercing");
      let d = isShieldWeapon
        ? 0
        : Math.max(1, Math.floor(((st.atk * 0.88) + R(-2, 4) - tgt.def * (isPiercing ? 0.12 : 0.3)) * eMult(w ? w.el : "Null", tgt) * encounterProfile.playerDamage));
      let hits = 1;
      if (!isShieldWeapon && fxKeys.includes("double_strike") && Math.random() < gearEffectProc(w, "double_strike", 0.28)) hits = 2;
      let armorCritTriggered = false;
      const strikePayload = { n: w ? w.name : (fallbackName || "Fists"), t: "strike", el: (w && w.el) ? w.el : "Null", aoe: false };
      if (!isShieldWeapon && battleBonus && ((battleBonus.type === "sameEl" && strikePayload.el === battleBonus.el) || battleBonus.type === "setup")) {
        d = Math.max(1, Math.floor(d * battleBonus.mult));
        logBuff(battleBonus.label);
        lg.push("Skill Interaction: " + battleBonus.label + " active — fires on " + strikePayload.n + ".");
        setBattleBonus(null);
      }
      if (!isShieldWeapon && strikePayload.el && strikePayload.el !== "Null" && strikePayload.el !== "Physical") {
        const seenEls = new Set(nextInteractionState.usedElements || []);
        seenEls.add(strikePayload.el);
        nextInteractionState.usedElements = [...seenEls];
      }
      const strikeInteractions = !isShieldWeapon ? evaluateInteractions(np.inter, { ...btl, interactionState: nextInteractionState }, np, tgt, "strike", strikePayload) : [];
      const strikeMult = strikeInteractions.reduce((m, ai) => m * (ai.mult || 1), 1);
      strikeInteractions.forEach(ai => { if (ai.logMsg) lg.push(ai.logMsg); });
      if (!isShieldWeapon) d = Math.max(1, Math.floor(d * strikeMult));
      if (!armorCritTriggered && armorCritChance > 0 && Math.random() < Math.min(0.24, armorCritChance * 0.75)) { d = Math.floor(d * 1.28); logInfo("Armor precision critical!"); }
      // v44: luck-based critical hit (stacks with armor crit)
      const luckCritChance = Math.min(0.25, (st.lck || 0) * 0.012);
      const isLuckCrit = !isShieldWeapon && Math.random() < luckCritChance;
      if (isLuckCrit) { const critMult = 1.5 + armorCritDmgBoost; d = Math.floor(d * critMult); logInfo("💥 Critical hit! ×" + critMult.toFixed(2)); try { musicRef.current.playSfx("crit"); } catch {} }
      const kagamiCanAttune = !!(w && pl.cid === "shouei" && /kagami/i.test(w.name||"") && tgt.el && !(np.kagamiAttunedEnemyIds||[]).includes(tgt.id));
      let totalDamage = 0;
      for (let hi = 0; hi < hits; hi++) {
        const thisDmg = isShieldWeapon ? 0 : Math.max(1, hi === 0 ? d : Math.floor(d * 0.58));
        totalDamage += thisDmg;
        tgt.hp = Math.max(0, tgt.hp - thisDmg);
        logDmg((w ? w.name : (fallbackName || "Fists")) + (hits > 1 ? " (×"+(hi+1)+")" : "") + " hit " + tgt.name + " for " + thisDmg + (isShieldWeapon && thisDmg === 0 ? " (guard impact)" : "") + (kagamiCanAttune && hi === 0 ? " [Attunes: " + tgt.el + "]" : ""));
      }
      if (!isShieldWeapon && nextInteractionState.firstAttackPending) nextInteractionState.firstAttackPending = false;
      if (kagamiCanAttune) { np.tempBattleEl = tgt.el; np.tempBattleEl2 = tgt.el2 || null; np.tempBonusEls = tgt.bonusEls || []; np.kagamiAttunedEnemyIds = [...(np.kagamiAttunedEnemyIds||[]), tgt.id]; logFx("Kagami mirrors " + tgt.el + (tgt.el2 ? "/" + tgt.el2 : "") + " — Shōuei attunes to " + tgt.el + " for this battle."); }
      fxKeys.forEach(fx => {
        if (fx === "lifesteal") { const lh = Math.max(1, Math.floor(totalDamage * 0.16)); np.chp = Math.min(st.hp, np.chp + lh); logHeal("Lifesteal +" + lh + " HP"); }
        else if (fx === "mp_drain") { const dr = R(3, 6); np.cmp = Math.min(st.mp, np.cmp + dr); logInfo("Drained " + dr + " MP"); }
        else if (fx.indexOf("_on_hit") >= 0) { const wfx = FX(fx.replace("_on_hit","")); if (wfx && Math.random() < gearEffectProc(w, fx, 0.26)) { const turns = gearEffectDur(w, fx, isShieldWeapon ? 3 : wfx.dur); tgt.efx.push({...wfx, tl: Math.min(5, turns || wfx.dur), justApplied:true}); logFx((w?.name || fallbackName || "Weapon") + " → " + wfx.ic + " " + wfx.nm + " (" + formatTurns(Math.min(5, turns || wfx.dur)) + ")"); } }
        else if (fx === "shield_on_hit" && Math.random() < gearEffectProc(w, fx, 0.18)) { const sf = FX("shield"); if (sf) { np.efx = [...(np.efx||[]), {...sf, tl: 2}]; logBuff("Shield proc — " + formatTurns(2)); } }
        else if (isShieldWeapon && fx === "thorns_on_hit" && Math.random() < gearEffectProc(w, fx, 0.2)) { const tf = FX("thorns"); if (tf) { const tTurns = Math.min(5, gearEffectDur(w, fx, 3)); np.efx = [...(np.efx||[]), {...tf, tl: tTurns}]; logBuff("Thorns guard! (" + formatTurns(tTurns) + ")"); } }
        else if (fx === "heal_on_kill" && tgt.hp <= 0) { const hk = Math.floor(st.hp * 0.12); np.chp = Math.min(st.hp, np.chp + hk); logHeal("Kill heal +" + hk + " HP"); }
      });
      if (w && slotKey) {
        const nw = { ...w, dur: w.dur - 1 };
        if (nw.dur <= 0) {
          logInfo(w.name + " broke!");
          setEq(e => {
            if (slotKey === "w1" && e.w2) return { ...e, w1: e.w2, w2: null };
            return { ...e, [slotKey]: null };
          });
        }
        else setEq(e => ({ ...e, [slotKey]: nw }));
      }
      ch.push(chainCode);
    };
    const consumeEquippedItem = (slotKey, item, chainCode) => {
      let escaped = false;
      itemEffectEntries(item).forEach(entry => {
        const buffBoost = passiveHas("item_mastery") && ["shield","haste","empower","fortify","evasion","regen","nullify","barrier"].includes(entry.ef) ? 1 : 0;
        const turns = Math.min(5, (entry.dur || FX(entry.ef)?.dur || 0) + buffBoost);
        const itemPower = passiveHas("item_mastery") && ["heal","mp","aoe"].includes(entry.ef) ? 1.18 : 1;
        if (entry.ef === "heal") { const amt = Math.floor((entry.v || 0) * itemPower); np.chp = Math.min(st.hp, np.chp + amt); logHeal(item.nm + " restores " + amt + " HP"); }
        else if (entry.ef === "mp") { const amt = Math.floor((entry.v || 0) * itemPower); np.cmp = Math.min(st.mp, np.cmp + amt); logHeal(item.nm + " restores " + amt + " MP"); }
        else if (entry.ef === "repair") { if (eq.w1) setEq(e => ({...e, w1: {...e.w1, dur: e.w1.maxDur}})); if (eq.w2) setEq(e => ({...e, w2: {...e.w2, dur: e.w2.maxDur}})); logInfo("Weapons fully repaired!"); }
        else if (entry.ef === "repel") { setRepelSteps(entry.v || 50); logInfo("Repel active for " + (entry.v || 50) + " steps!"); }
        else if (entry.ef === "flee") { escaped = true; }
        else if (entry.ef === "aoe") {
          const aoeDmg = Math.floor((entry.v || 0) * itemPower * encounterProfile.playerDamage);
          en.filter(e => e.hp > 0).forEach(e => { e.hp = Math.max(0, e.hp - aoeDmg); });
          logDmg(item.nm + " hit all enemies for " + aoeDmg);
        } else if (entry.ef === "cleanse") {
          np.efx = (np.efx || []).filter(ef => !harmfulIds.has(ef.id));
          logBuff(item.nm + " cleansed harmful effects.");
        } else if (["shield","haste","empower","fortify","evasion","regen","nullify","barrier"].includes(entry.ef)) {
          const ef = FX(entry.ef); if (ef) { np.efx = [...(np.efx || []), { ...ef, tl: turns || ef.dur }]; logBuff(item.nm + " grants " + ef.ic + ef.nm + (turns ? " — " + formatTurns(turns) : "")); if (["shield","barrier","fortify"].includes(entry.ef)) grantWardSiphon(); }
        } else if (["burn","poison","bleed","weaken","expose","freeze","stun","silence"].includes(entry.ef)) {
          const ef = FX(entry.ef); if (ef) {
            const targets = ((item.ef === "aoe") || (entry.ef === "burn" && item.ef === "aoe") || (entry.ef === "poison" && item.ef === "aoe") || (entry.ef === "bleed" && item.ef === "aoe")) ? en.filter(e => e.hp > 0) : [tgt];
            targets.forEach(target => target.efx.push({ ...ef, tl: turns || ef.dur, justApplied:true }));
            logFx(item.nm + " inflicts " + ef.ic + ef.nm + (turns ? " — " + formatTurns(turns) : ""));
          }
        } else logInfo("Used " + item.nm);
      });
      setEq(e => ({ ...e, [slotKey]: null }));
      setInv(iv => {
        const ni = [...iv];
        const ii = ni.findIndex(i => i.id === item.id);
        if (ii >= 0) { if (ni[ii].qty > 1) ni[ii] = { ...ni[ii], qty: ni[ii].qty - 1 }; else ni.splice(ii, 1); }
        return ni;
      });
      ch.push(chainCode);
      if (escaped) {
        logInfo("Escaped!");
        setBtl(null);
        setPl({...np, tempBattleEl: null, tempBattleEl2: null, tempBonusEls: [], kagamiAttunedEnemyIds: []});
        setLog(l => [...l, ...playerTagged(lg)]);
        setScr(subMap ? "submap" : "map");
        return "escaped";
      }
      return true;
    };

    if (act === "strike") {
      try { musicRef.current.playSfx("hit"); } catch {}
      nextInteractionState.consecutiveGuards = 0;
      nextInteractionState.strikeCount = (nextInteractionState.strikeCount || 0) + 1;
      nextInteractionState.damageSkillUses = (nextInteractionState.damageSkillUses || 0) + 1;
      trackElementUse((eq.w1 || eq.w2)?.el || "Null");
      trackSkillName((eq.w1 || eq.w2)?.name || "Strike");
      attackWithWeapon(eq.w1 || eq.w2, eq.w1 ? "w1" : (eq.w2 ? "w2" : null), 4, "Fists");
    } else if (act === "w2" && eq.w2) {
      try { musicRef.current.playSfx("hit"); } catch {}
      nextInteractionState.consecutiveGuards = 0;
      nextInteractionState.strikeCount = (nextInteractionState.strikeCount || 0) + 1;
      nextInteractionState.damageSkillUses = (nextInteractionState.damageSkillUses || 0) + 1;
      trackElementUse(eq.w2?.el || "Null");
      trackSkillName(eq.w2?.name || "Off-hand Strike");
      attackWithWeapon(eq.w2, "w2", 5, eq.w2.name);
    } else if (act === "guard") {
      try { musicRef.current.playSfx("menu"); } catch {}
      // Guard: apply guard effect for 3 turns, 20% damage reduction
      const guardEfx = { id: "guard", nm: "Guard", ic: "🛡️", type: "shield", v: 20, dur: 3, tl: 3 };
      np.efx = [...(np.efx || []), guardEfx];
      nextInteractionState.consecutiveGuards = (nextInteractionState.consecutiveGuards || 0) + 1;
      nextInteractionState.guardUses = (nextInteractionState.guardUses || 0) + 1;
      trackSkillName("Guard");
      ch.push(8);
      const guardLines = ["Guard for " + formatTurns(3) + " (20% less damage taken)"];
      if (passiveHas("guard_fortify")) { const ef = FX("fortify"); np.efx = [...np.efx, { ...ef, tl: 2 }]; guardLines.push(passiveLabelFor("guard_fortify", "Passive") + ": " + ef.ic + " Fortify for " + formatTurns(2)); grantWardSiphon(); }
      if (passiveHas("start_guard")) { np.cmp = Math.min(st.mp, np.cmp + 3); guardLines.push(passiveLabelFor("start_guard", "Guardflow") + ": +3 MP"); }
      if (passiveHas("guard_heal")) { const ef = FX("fortify"); np.efx = [...np.efx, { ...ef, tl: 1 }]; const recover = Math.max(6, Math.floor(st.hp * 0.06)); np.chp = Math.min(st.hp, (np.chp || 0) + recover); guardLines.push(passiveLabelFor("guard_heal", "Stoic Pulse") + ": +" + recover + " HP and " + ef.ic + " Fortify"); }
      if (hasSpecificAssignedInteraction("holy_bulwark") && (nextInteractionState.consecutiveGuards || 0) >= 2) {
        const shieldEf = FX("shield");
        const fortifyEf = FX("fortify");
        if (shieldEf && !hasBattleEffect(np, "shield", { includeJustApplied: true })) np.efx = [...(np.efx || []), { ...shieldEf, tl: 2, justApplied: true }];
        if (fortifyEf && !hasBattleEffect(np, "fortify", { includeJustApplied: true })) np.efx = [...(np.efx || []), { ...fortifyEf, tl: 2, justApplied: true }];
        lg.push("Skill Interaction: Holy Bulwark active — Guard twice in a row: gain Shield + Fortify");
      }
      if (hasSpecificAssignedInteraction("martyr") && (np.chp || 0) <= Math.floor(Math.max(1, st.hp || np.chp || 1) * 0.4)) {
        const regenEf = FX("regen");
        if (regenEf && !hasBattleEffect(np, "regen", { includeJustApplied: true })) np.efx = [...(np.efx || []), { ...regenEf, tl: 3, justApplied: true, v: Math.max(regenEf.v || 0, Math.floor(6 + st.mag * 0.12)) }];
        lg.push("Skill Interaction: Martyr's Resolve active — Below 40% HP, Guard: gain Regen for 3 turns");
      }
      logBuff(np.name + " braces\n• " + guardLines.join("\n• "));
    } else if (act === "mend") {
      nextInteractionState.consecutiveGuards = 0;
      // Basic Maled: costs 8 MP, applies Regen for 3 turns (small HoT)
      if (np.cmp < 8) { notify("Need 8 MP!"); return; }
      try { musicRef.current.playSfx("heal"); } catch {}
      np.cmp -= 8;
      nextInteractionState.healUses = (nextInteractionState.healUses || 0) + 1;
      trackSkillName("Mend");
      const regenEf = { ...FX("regen"), tl: 3, v: Math.floor(6 + st.mag * 0.15) };
      np.efx = [...(np.efx || []), regenEf];
      if (hasSpecificAssignedInteraction("devotion") && !nextInteractionState.devotionUnlocked && (nextInteractionState.healUses || 0) >= 3) {
        nextInteractionState.devotionUnlocked = true;
        lg.push("🔁 Skill Interaction primed: Devotion — your future heals gain +10% power this battle.");
      }
      logHeal(np.name + " uses Mend on " + np.name + "\n• Applies " + regenEf.ic + " Regen\n• " + regenEf.v + " HP per Turn for " + formatTurns(3));
      ch.push(-1);
    } else if (act === "skill") {
      // Silence check: silenced players can only use weapons, guard, items, swap
      if ((np.efx || []).some(ef => ef.id === "silence")) { notify("Silenced! Can only use weapons, guard, items."); return; }
      const sk = eqSk[idx]; if (!sk) return;
      nextInteractionState.consecutiveGuards = 0;
      if (sk.mp > np.cmp) { notify("Not enough MP!"); return; }
      try { musicRef.current.playSfx(sk.t === "heal" || sk.t === "support" ? "heal" : "cast"); } catch {}
      np.cmp -= sk.mp; ch.push(idx);
      const ml = eMult(sk.el, tgt);
      if (sk.t === "damage") {
        nextInteractionState.damageSkillUses = (nextInteractionState.damageSkillUses || 0) + 1;
        trackElementUse(sk.el);
        trackSkillName(sk.n);
        const gambleMult = CLS.find(x => x.id === np.cid)?.gamble ? (passiveHas("gambler_luck") ? (0.78 + Math.random() * 1.25) : (0.68 + Math.random() * 1.15)) : 1;
        const burden = skillEffectBurden(sk);
        const pureDamage = !sk.fx && !sk.fx2 && !sk.aoe;
        let base = ((sk.pow || 0) * 0.9 + (sk.el === "Physical" ? st.atk * 0.9 : st.mag * 0.84)) * gambleMult;
        base *= pureDamage ? 1.02 : Math.max(0.76, 1 - burden * 0.012 - (sk.aoe ? 0.05 : 0));
        if (passiveHas("spell_boost")) base *= 1.14;
        if (passiveHas("lineage_spell_boost")) base *= 1.08;
        if (passiveHas("holy_edge") && (sk.el === "Light" || sk.el === (eq.w1?.el || ""))) base *= 1.1;
        if (passiveHas("omni_boost") && sk.el !== "Null") base *= 1.08;
        const playerEls = entityBattleElements(np);
        if (passiveHas("elboost") && playerEls.includes(sk.el)) base *= 1.12;
        if (passiveHas("dual_elboost") && playerEls.includes(sk.el)) base *= 1.12;
        if (passiveHas("burn_boost") && sk.fx === "burn") base += 4;
        if (passiveHas("first_spell_burst") && !btl.firstSpellUsed) { base *= 1.22; logBuff("Wild Flux! +22% power"); }
        if (battleBonus && ((battleBonus.type === "sameEl" && sk.el === battleBonus.el) || battleBonus.type === "setup")) { base *= battleBonus.mult; logBuff(battleBonus.label); lg.push("Skill Interaction: " + battleBonus.label + " active — fires on " + sk.n + "."); setBattleBonus(null); }
        // Evaluate per-interaction bonuses for damage skills
        if (sk.el && sk.el !== "Null") {
          const seenEls = new Set(nextInteractionState.usedElements || []);
          seenEls.add(sk.el);
          nextInteractionState.usedElements = [...seenEls];
        }
        if (sk.aoe) nextInteractionState.aoeDamageUses = (nextInteractionState.aoeDamageUses || 0) + 1;
        const activeInters = evaluateInteractions(np.inter, { ...btl, interactionState: nextInteractionState }, np, tgt, "skill", sk);
        activeInters.forEach(ai => { base *= ai.mult; lg.push(ai.logMsg); });
        if (nextInteractionState.firstAttackPending) nextInteractionState.firstAttackPending = false;
        if (passiveHas("assassin_bonus") || passiveHas("setup_bonus") || passiveHas("hex_bonus") || passiveHas("dream_bonus")) {
          const targetFx = (tgt.efx || []).map(ef => ef.id);
          if ((passiveHas("assassin_bonus") || passiveHas("setup_bonus")) && targetFx.length) base *= passiveHas("assassin_bonus") ? 1.16 : 1.14;
          if (passiveHas("hex_bonus") && targetFx.some(id => ["curse","poison","bleed"].includes(id))) base *= 1.15;
          if (passiveHas("dream_bonus") && targetFx.some(id => ["sleep","confuse"].includes(id))) base *= 1.16;
        }
        if (passiveHas("finisher") && (tgt.hp || 0) <= Math.floor((tgt.mhp || tgt.hp || 1) * 0.35)) base *= 1.18;
        if (passiveHas("wardbreaker") && (tgt.efx || []).some(ef => ["shield","barrier","fortify"].includes(ef.id))) base *= 1.14;
        if (passiveHas("attrition_bonus") && (tgt.efx || []).some(ef => ["burn","poison","bleed","slow"].includes(ef.id))) base *= 1.12;
        if (passiveHas("low_resource_edge") && (np.cmp || 0) <= Math.floor(st.mp * 0.4)) base *= 1.14;
        if (gambleMult > 1.18) nextInteractionState.luckyHighCount = (nextInteractionState.luckyHighCount || 0) + 1;
        if (gambleMult < 0.82) nextInteractionState.luckyLowCount = (nextInteractionState.luckyLowCount || 0) + 1;
        if (gambleMult !== 1) logInfo(gambleMult > 1.18 ? "🎲 Lucky! ×" + gambleMult.toFixed(1) : gambleMult < 0.82 ? "🎲 Bad luck ×" + gambleMult.toFixed(1) : "🎲 ×" + gambleMult.toFixed(1));
        if (armorCritChance > 0 && Math.random() < Math.min(0.22, armorCritChance * 0.7)) { base *= 1.22; logInfo("Armor precision surge!"); }
        // v44: luck-based critical hit on damage skills (one roll per cast, applies to all AoE targets)
        const luckCritChance = Math.min(0.25, (st.lck || 0) * 0.012);
        const skillIsCrit = Math.random() < luckCritChance;
        if (skillIsCrit) { const critMult = 1.5 + armorCritDmgBoost; base *= critMult; logInfo("💥 Critical hit! ×" + critMult.toFixed(2)); try { musicRef.current.playSfx("crit"); } catch {} }
        const targets = sk.aoe ? en.filter(e => e.hp > 0) : [tgt];
        const levelScale = skillLevelScale(sk);
        const statusChance = skillEffectChance(sk);
        targets.forEach(t => {
          const d = Math.max(1, Math.floor((base - t.def * (pureDamage ? 0.18 : 0.14)) * ml * levelScale * encounterProfile.playerDamage));
          t.hp = Math.max(0, t.hp - d);
          logDmg(sk.n + " hit " + t.name + " for " + d);
          if (sk.fx && Math.random() < statusChance) {
            const ef = FX(sk.fx);
            if (ef) { const turns = skillDurationValue(sk, sk.fx, sk.fxDur || ef.dur) + (passiveHas("persistent_bonus") && ["weaken","expose","bleed","poison","curse","burn","slow","silence"].includes(sk.fx) ? 1 : 0); t.efx.push({ ...ef, tl: Math.min(5, turns), justApplied:true }); if (sk.fx === "freeze") markFreezeTarget(t.id); logFx(t.name + " gains " + ef.ic + ef.nm + " — " + formatTurns(Math.min(5, turns))); triggerDebuffSurge(); }
          }
          if (sk.fx2 && Math.random() < Math.max(0.36, statusChance - 0.08)) {
            const ef2 = FX(sk.fx2);
            if (ef2) { const turns2 = skillDurationValue(sk, sk.fx2, sk.fx2Dur || ef2.dur) + (passiveHas("persistent_bonus") && ["weaken","expose","bleed","poison","curse","burn","slow","silence"].includes(sk.fx2) ? 1 : 0); t.efx.push({ ...ef2, tl: Math.min(5, turns2), justApplied:true }); if (sk.fx2 === "freeze") markFreezeTarget(t.id); logFx(t.name + " gains " + ef2.ic + ef2.nm + " — " + formatTurns(Math.min(5, turns2))); triggerDebuffSurge(); }
          }
          if (passiveHas("pressure_loop") && (t.efx || []).some(ef => ["weaken","expose"].includes(ef.id))) { base *= 1.08; }
        });
        nextInteractionState.killCount = (nextInteractionState.killCount || 0) + targets.filter(t => (t.hp || 0) <= 0).length;
        if (passiveHas("on_kill_surge") && targets.some(t => (t.hp || 0) <= 0)) {
          const gainHp = Math.max(6, Math.floor(st.hp * 0.08));
          const gainMp = Math.max(4, Math.floor(st.mp * 0.06));
          np.chp = Math.min(st.hp, (np.chp || 0) + gainHp);
          np.cmp = Math.min(st.mp, (np.cmp || 0) + gainMp);
          logHeal(passiveLabelFor("on_kill_surge", "Cull the Weak") + ": +" + gainHp + " HP, +" + gainMp + " MP");
        }
        if (ml > 1) logInfo("Effective!"); if (ml < 1) logInfo("Resisted...");
        if (sk.el !== "Null" && btl.lastSkillEl === sk.el && hasAssignedBattleInteraction("sameEl")) { setBattleBonus({ type: "sameEl", el: sk.el, mult: 1.18, label: "Element Chain" }); lg.push("🔁 Skill Interaction primed: Element Chain — matching element sequence prepared."); }
      } else if (sk.t === "heal") {
        const wasFullBeforeHeal = (np.chp || 0) >= (st.hp || np.chp || 0);
        nextInteractionState.healUses = (nextInteractionState.healUses || 0) + 1;
        trackElementUse(sk.el);
        trackSkillName(sk.n);
        let h = Math.floor(((sk.pow || 0) * 0.9 + st.mag * 1.02) * (0.98 + ((sk.lvl || 1) - 1) * 0.05) * encounterProfile.playerHeal);
        if (passiveHas("heal_boost")) h = Math.floor(h * 1.18);
        if (nextInteractionState.devotionUnlocked || hasSpecificAssignedInteraction("devotion") && (nextInteractionState.healUses || 0) >= 3) {
          nextInteractionState.devotionUnlocked = true;
          h = Math.floor(h * 1.10);
        }
        np.chp = Math.min(st.hp, np.chp + h);
        if (hasSpecificAssignedInteraction("overheal_shield") && wasFullBeforeHeal) {
          const shieldEf = FX("shield");
          if (shieldEf && !hasBattleEffect(np, "shield", { includeJustApplied: true })) {
            np.efx = [...(np.efx || []), { ...shieldEf, tl: 2, justApplied: true }];
            lg.push("Skill Interaction: Grace Overflow active — Heal a target already at full HP: the overheal becomes Shield instead");
          }
        }
        if (hasSpecificAssignedInteraction("purify") && hasAnyBattleEffect(np, ["shield","barrier"], { includeJustApplied: true })) {
          const cleanseIdx = (np.efx || []).findIndex(ef => harmfulIds.has(ef.id));
          if (cleanseIdx >= 0) {
            const cleanseFx = np.efx[cleanseIdx];
            np.efx = (np.efx || []).filter((_, i) => i !== cleanseIdx);
            lg.push("Skill Interaction: Purifying Grace active — cleansed " + (cleanseFx.nm || titleCaseWords(cleanseFx.id || "debuff")));
          }
        }
        if (hasSpecificAssignedInteraction("devotion") && !nextInteractionState.devotionUnlocked && (nextInteractionState.healUses || 0) >= 3) {
          nextInteractionState.devotionUnlocked = true;
          lg.push("🔁 Skill Interaction primed: Devotion — all future heals gain +10% power this battle.");
        }
        logHeal(sk.n + "\n• Restored " + h + " HP");
      } else if (sk.t === "buff") {
        nextInteractionState.buffUses = (nextInteractionState.buffUses || 0) + 1;
        trackElementUse(sk.el);
        trackSkillName(sk.n);
        const buffLines = [];
        if (sk.fx) { const ef = FX(sk.fx); if (ef) { const turns = skillDurationValue(sk, sk.fx, sk.fxDur || ef.dur + 1); np.efx = [...(np.efx||[]), {...ef, tl: turns}]; buffLines.push(ef.ic + " " + ef.nm + " for " + formatTurns(turns)); if (["shield","barrier","fortify"].includes(sk.fx)) grantWardSiphon(); } }
        if (sk.fx2) { const ef2 = FX(sk.fx2); if (ef2) { const turns2 = skillDurationValue(sk, sk.fx2, sk.fx2Dur || ef2.dur); np.efx = [...(np.efx||[]), {...ef2, tl: turns2}]; buffLines.push(ef2.ic + " " + ef2.nm + " for " + formatTurns(turns2)); if (["shield","barrier","fortify"].includes(sk.fx2)) grantWardSiphon(); } }
        logBuff(sk.n + (buffLines.length ? "\n• " + buffLines.join("\n• ") : ""));
      }
      else if (sk.t === "debuff" && sk.fx) {
        nextInteractionState.debuffUses = (nextInteractionState.debuffUses || 0) + 1;
        trackElementUse(sk.el);
        trackSkillName(sk.n);
        const ef = FX(sk.fx);
        if (ef) {
          const extra = passiveHas("debuff_plus") || passiveHas("water_control") ? 1 : 0;
          const turns = Math.min(5, skillDurationValue(sk, sk.fx, sk.fxDur || ef.dur) + extra);
          tgt.efx.push({ ...ef, tl: turns, justApplied:true }); if (sk.fx === "freeze") markFreezeTarget(tgt.id);
          const debuffLines = [tgt.name + " gains " + ef.ic + ef.nm + " for " + formatTurns(turns)];
          if (sk.fx2) {
            const ef2 = FX(sk.fx2);
            if (ef2) {
              const turns2 = Math.min(5, skillDurationValue(sk, sk.fx2, sk.fx2Dur || ef2.dur) + extra);
              tgt.efx.push({...ef2, tl: turns2, justApplied:true}); if (sk.fx2 === "freeze") markFreezeTarget(tgt.id);
              debuffLines.push(tgt.name + " gains " + ef2.ic + ef2.nm + " for " + formatTurns(turns2));
            }
          }
          logFx(sk.n + "\n• " + debuffLines.join("\n• "));
          // Debuff applied: evaluate any interactions that prime off this, and apply any that trigger here
          const debuffInters = evaluateInteractions(np.inter, btl, np, tgt, "skill", sk);
          debuffInters.forEach(ai => lg.push(ai.logMsg));
          if (hasAssignedBattleInteraction("setup")) { setBattleBonus({ type: "setup", mult: 1.18, label: "Setup bonus +18%" }); lg.push("🔁 Interaction primed: debuff applied — next attack will be empowered."); }
        }
      }
      else if (sk.t === "copy" && pl.cid === "shouei") {
        if (tgt.skills?.length) {
          const target_sk = P(tgt.skills.filter(Boolean));
          const normalizedCopy = normalizeCopiedSkill(target_sk, tgt);
          const uses = passiveHas("copy_mastery") ? 12 : 10;
          setCopied({ ...normalizedCopy, copiedFromName: normalizedCopy.n, copiedBaseMp: normalizedCopy.mp || 0 });
          setCopyN(uses);
          nextInteractionState.copiedSkillUses = 0;
          nextInteractionState.copiedFromBoss = !!normalizedCopy.copiedFromBoss;
          nextInteractionState.lastCopiedSkillEl = normalizedCopy.el || "";
          nextInteractionState.guardThenCopyPrimed = (btl.lastSkillType === "guard" || ch[ch.length - 1] === 8);
          nextInteractionState.copySequenceOpen = true;
          logFx("🧿 Mirror of Kagami\n• Copied " + normalizedCopy.n + "\n• " + (normalizedCopy.t === "damage" ? "Power " + (normalizedCopy.pow || 0) : normalizedCopy.t === "heal" ? "Healing " + (normalizedCopy.pow || 0) : "Type " + titleCaseWords(normalizedCopy.t)) + " · Cost " + Math.max(0, Math.ceil((normalizedCopy.mp || 0) * 0.5)) + " MP\n• " + uses + " uses ready");
        }
        if (tgt.el && !(np.kagamiAttunedEnemyIds||[]).includes(tgt.id)) { np.tempBattleEl = tgt.el; np.tempBattleEl2 = tgt.el2 || null; np.tempBonusEls = tgt.bonusEls || []; np.kagamiAttunedEnemyIds = [...(np.kagamiAttunedEnemyIds||[]), tgt.id]; logFx("🧿 Mirror Element: Shōuei attunes to " + tgt.el + (tgt.el2 ? "/" + tgt.el2 : "") + " for this battle."); }
      }
    } else if (act === "copy" && copied && copyN > 0) {
      try { musicRef.current.playSfx("cast"); } catch {}
      const copyCost = Math.max(0, Math.ceil((copied.copiedBaseMp != null ? copied.copiedBaseMp : copied.mp || 0) * 0.5));
      const stillMirrorReady = !!nextInteractionState.guardThenCopyPrimed;
      const finalCopyCost = stillMirrorReady ? 0 : copyCost;
      if (np.cmp < finalCopyCost) { logInfo("Not enough MP for copied skill."); setLog(l => [...l, ...playerTagged(lg)]); return; }
      np.cmp = Math.max(0, np.cmp - finalCopyCost);
      trackSkillName("Mirror: " + (copied?.n || "Copied Skill"));
      trackElementUse(copied?.el);
      if (copied?.t === "damage") nextInteractionState.damageSkillUses = (nextInteractionState.damageSkillUses || 0) + 1;
      else if (copied?.t === "heal") nextInteractionState.healUses = (nextInteractionState.healUses || 0) + 1;
      else if (copied?.t === "buff") nextInteractionState.buffUses = (nextInteractionState.buffUses || 0) + 1;
      else if (copied?.t === "debuff") nextInteractionState.debuffUses = (nextInteractionState.debuffUses || 0) + 1;
      nextInteractionState.lastCopiedSkillEl = copied?.el || nextInteractionState.lastCopiedSkillEl || "";
      const copyInteractionResults = evaluateInteractions(np.inter, { ...btl, interactionState: nextInteractionState }, np, tgt, "copy_use", copied);
      const copyMult = copyInteractionResults.reduce((m, ai) => m * (ai.mult || 1), 1);
      if (copied.t === "damage" && nextInteractionState.firstAttackPending) nextInteractionState.firstAttackPending = false;
      copyInteractionResults.forEach(ai => { if (ai.logMsg) lg.push(ai.logMsg); });
      if (copied.t === "heal") {
        const h = Math.max(1, Math.floor(((copied.pow || 0) * 0.92 + st.mag * 0.88) * copyMult * encounterProfile.playerHeal));
        np.chp = Math.min(st.hp, np.chp + h);
        const mirrorLines = ["Restored " + h + " HP" + (finalCopyCost ? " · Cost " + finalCopyCost + " MP" : finalCopyCost === 0 ? " · Cost 0 MP" : "")];
        if (copied.fx) { const ef = FX(copied.fx); if (ef) { const turns = Math.min(5, copied.fxDur || ef.dur); np.efx = [...(np.efx || []), {...ef, tl: turns}]; mirrorLines.push(ef.ic + " " + ef.nm + " for " + formatTurns(turns)); } }
        logHeal("Mirror: " + copied.n + "\n• " + mirrorLines.join("\n• "));
      } else if (copied.t === "buff") {
        const mirrorBuffs = [];
        const durBoost = copyMult > 1 ? 1 : 0;
        if (copied.fx) { const ef = FX(copied.fx); if (ef) { const turns = Math.min(5, (copied.fxDur || ef.dur) + durBoost); np.efx = [...(np.efx || []), {...ef, tl: turns}]; mirrorBuffs.push(ef.ic + " " + ef.nm + " for " + formatTurns(turns)); } }
        if (copied.fx2) { const ef2 = FX(copied.fx2); if (ef2) { const turns2 = Math.min(5, (copied.fxDur2 || ef2.dur) + durBoost); np.efx = [...(np.efx || []), {...ef2, tl: turns2}]; mirrorBuffs.push(ef2.ic + " " + ef2.nm + " for " + formatTurns(turns2)); } }
        logBuff("Mirror: " + copied.n + (mirrorBuffs.length ? "\n• " + mirrorBuffs.join("\n• ") : ""));
      } else if (copied.t === "debuff") {
        const mirrorDebuffs = [];
        const durBoost = copyMult > 1 ? 1 : 0;
        if (copied.fx) { const ef = FX(copied.fx); if (ef) { const turns = Math.min(5, (copied.fxDur || ef.dur) + durBoost); tgt.efx.push({...ef, tl: turns, justApplied:true}); mirrorDebuffs.push(tgt.name + " gains " + ef.ic + ef.nm + " for " + formatTurns(turns)); if (copied.fx === "freeze") markFreezeTarget(tgt.id); } }
        if (copied.fx2) { const ef2 = FX(copied.fx2); if (ef2) { const turns2 = Math.min(5, (copied.fxDur2 || ef2.dur) + durBoost); tgt.efx.push({...ef2, tl: turns2, justApplied:true}); mirrorDebuffs.push(tgt.name + " gains " + ef2.ic + ef2.nm + " for " + formatTurns(turns2)); if (copied.fx2 === "freeze") markFreezeTarget(tgt.id); } }
        logFx("Mirror: " + copied.n + (mirrorDebuffs.length ? "\n• " + mirrorDebuffs.join("\n• ") : ""));
      } else {
        const copyMl = eMult(copied.el, tgt);
        let copyBase = (((copied.pow || 0) * 0.92) + (copied.el === "Physical" ? st.atk * 0.84 : st.mag * 0.82));
        copyBase *= copyMult;
        // v44: luck-based critical hit on copied skill damage
        const luckCritChance = Math.min(0.25, (st.lck || 0) * 0.012);
        if (Math.random() < luckCritChance) { copyBase *= 1.5; logInfo("💥 Critical hit! ×1.5"); try { musicRef.current.playSfx("crit"); } catch {} }
        const d = Math.max(1, Math.floor((copyBase - tgt.def * 0.16) * copyMl * encounterProfile.playerDamage));
        tgt.hp = Math.max(0, tgt.hp - d);
        nextInteractionState.killCount = (nextInteractionState.killCount || 0) + ((tgt.hp || 0) <= 0 ? 1 : 0);
        const mirrorHit = ["Hit " + tgt.name + " for " + d + (finalCopyCost ? " · Cost " + finalCopyCost + " MP" : finalCopyCost === 0 ? " · Cost 0 MP" : "")];
        if (copied.fx) { const ef = FX(copied.fx); if (ef) { const turns = Math.min(5, copied.fxDur || ef.dur); tgt.efx.push({...ef, tl: turns, justApplied:true}); mirrorHit.push(tgt.name + " gains " + ef.ic + ef.nm + " for " + formatTurns(turns)); if (copied.fx === "freeze") markFreezeTarget(tgt.id); } }
        if (copied.fx2) { const ef2 = FX(copied.fx2); if (ef2) { const turns2 = Math.min(5, copied.fxDur2 || ef2.dur); tgt.efx.push({...ef2, tl: turns2, justApplied:true}); mirrorHit.push(tgt.name + " gains " + ef2.ic + ef2.nm + " for " + formatTurns(turns2)); if (copied.fx2 === "freeze") markFreezeTarget(tgt.id); } }
        logDmg("Mirror: " + copied.n + "\n• " + mirrorHit.join("\n• "));
      }
      const mirrorTriggered = copyInteractionResults.some(ai => ai.k === "mirror_mastery");
      nextInteractionState.copiedSkillUses = mirrorTriggered ? 0 : ((nextInteractionState.copiedSkillUses || 0) + 1);
      nextInteractionState.copySequenceOpen = mirrorTriggered ? false : (nextInteractionState.copySequenceOpen !== false);
      nextInteractionState.guardThenCopyPrimed = false;
      setCopyN(n => n - 1); ch.push(9);
    } else if (act === "c1" && eq.c1) {
      if (consumeEquippedItem("c1", eq.c1, 6) === "escaped") return;
    } else if (act === "c2" && eq.c2) {
      if (consumeEquippedItem("c2", eq.c2, 7) === "escaped") return;
    } else if (act === "flee") {
      const fleeChance = btl.type === "train" ? 1 : btl.type === "wild" ? 0.82 : btl.type === "pvp" ? 0.45 : btl.type === "outpost" ? 0.35 : 0.25;
      if (Math.random() < fleeChance) { logInfo(btl.type === "train" ? "Disengaged from training." : "Fled!"); if (pet) setPet(p => p ? ({...p, chp: p.mhp ?? p.hp ?? p.chp}) : p); setBtl(null); setPl({...np, tempBattleEl: null, tempBattleEl2: null, tempBonusEls: [], kagamiAttunedEnemyIds: []}); setLog(l => [...l, ...playerTagged(lg)]); setScr(subMap ? "submap" : "map"); return; }
      logInfo("Can't escape!");
    } else if (act === "ult" && np.ult?.ready) {
      try { musicRef.current.playSfx("cast"); } catch {}
      const ultBase = Math.min(np.ult.pow || 120, 150);
      const pow = (ultBase * 0.72 + st.mag * 1.24 + st.atk * 0.34) * encounterProfile.playerDamage * 0.95;
      en.filter(e => e.hp > 0).forEach(e => { const d = Math.max(1, Math.floor(pow - e.def * 0.12)); e.hp = Math.max(0, e.hp - d); if (np.ult.fx) { const ef = FX(np.ult.fx); if (ef) e.efx.push({ ...ef, tl: Math.min(5, (np.ult.fxDur || ef.dur) + (np.ult.chain >= 6 ? 1 : 0)), justApplied:true }); } });
      if (np.quote && np.quote !== "...") lg.push("💬 \"" + np.quote + "\"");
      lg.push("🌟 VEIL EXPANSION: " + np.ult.name + "!" + (np.ult.fx ? " [" + np.ult.fx + " " + formatTurns(Math.min(5, (np.ult.fxDur||2) + (np.ult.chain >= 6 ? 1 : 0))) + "]" : "")); np.ult = { ...np.ult, ready: false }; ch = [];
    } else if (act === "btl_equip_item") {
      // Equip item mid-battle (ends turn)
      const item = inv.find(i => i.id === idx);
      if (item) {
        if (!eq.c1) { setEq(e => ({...e, c1: item})); logInfo("Equipped " + (item.nm||item.name) + " to slot 1. Turn ends."); }
        else if (!eq.c2) { setEq(e => ({...e, c2: item})); logInfo("Equipped " + (item.nm||item.name) + " to slot 2. Turn ends."); }
        else { notify("Both item slots full!"); return; }
        ch.push(-1);
      }
    } else if (act === "btl_equip_weapon") {
      // Equip/swap weapon mid-battle (ends turn)
      const wpn = inv.find(i => i.id === idx && i.atk !== undefined);
      if (wpn) {
        if ((eq.w1 && eq.w1.id === wpn.id) || (eq.w2 && eq.w2.id === wpn.id)) { notify("That weapon is already equipped."); return; }
        if (!eq.w1) { setEq(e => ({...e, w1: wpn})); setInv(iv => iv.filter(i => i.id !== idx)); logInfo("Drew " + wpn.name + " into W1. Turn ends."); }
        else if (!eq.w2) { setEq(e => ({...e, w2: wpn})); setInv(iv => iv.filter(i => i.id !== idx)); logInfo("Drew " + wpn.name + " into W2. Turn ends."); }
        else { const old = eq.w1; setEq(e => ({...e, w1: wpn})); setInv(iv => [...iv.filter(i => i.id !== idx), {...old, qty: 1}]); logInfo("Swapped " + old.name + " for " + wpn.name + ". Turn ends."); }
        ch.push(-1);
      }
    } else if (act === "btl_equip_skill") {
      // Swap skill in battle (ends turn)
      const sk = pl.skills.find(s => s.id === idx && s.unlocked && !s.equipped);
      if (sk) {
        const equipped = pl.skills.filter(s => s.equipped);
        if (equipped.length >= 4) {
          // Swap with last equipped
          const lastEq = equipped[equipped.length - 1];
          np.skills = np.skills.map(s => s.id === lastEq.id ? {...s, equipped: false} : s.id === sk.id ? {...s, equipped: true} : s);
          logInfo("Swapped " + lastEq.n + " → " + sk.n + ". Turn ends.");
        } else {
          np.skills = np.skills.map(s => s.id === sk.id ? {...s, equipped: true} : s);
          logInfo("Equipped " + sk.n + ". Turn ends.");
        }
        ch.push(-1);
      }
    } else if (act === "btl_set_ult") {
      // Set forbidden magic from spellbook (ends turn)
      const u = ults.find((u,i) => i === idx);
      if (u) {
        np.ult = { ...u, ready: false };
        logInfo("Set forbidden magic to " + u.name + ". Turn ends.");
        ch.push(-1);
      }
    }

    setBtlPanel(null);

    // Check ult chain
    let nextProg = btl.chainProg || 0;
    const expected = np.ult?.combo?.[nextProg];
    const lastAction = ch[ch.length - 1];
    if (np.ult && !np.ult.ready && lastAction !== undefined && lastAction >= 0) {
      if (lastAction === expected) {
        nextProg += 1;
        if (nextProg >= np.ult.chain) { np.ult = { ...np.ult, ready: true }; lg.push("Event: Veil Break — " + np.ult.name + " is charged and your Motto is ready to be spoken."); lg.push("🌟 VEIL BREAK CHARGED!"); nextProg = np.ult.chain; }
      } else {
        nextProg = lastAction === np.ult.combo[0] ? 1 : 0;
        // No log message - chain highlighting handles the visual feedback
      }
    }

    // Pet
    const petChp = pet?.chp ?? pet?.hp ?? 0;
    const petMhp = pet?.mhp ?? pet?.hp ?? 0;
    const supportFx = ["regen","shield","fortify","haste","empower","barrier","evasion","reflect","nullify","thorns"];
    const harmfulFx = ["burn","freeze","poison","stun","confuse","blind","silence","slow","weaken","expose","sleep","bleed","curse"];
    if (pet && petChp > 0 && Math.random() < ((pet?.passiveBonus === "speed") ? 0.62 : pet?.passiveBonus === "support" ? 0.58 : 0.52) && tgt.hp > 0) {
      const petSkills = [pet.sk1, pet.sk2].filter(Boolean);
      const petRole = pet?.passiveBonus || "damage";
      const petProfile = companionRoleProfile(petRole);
      const needHelp = np.chp < Math.floor((st.hp || np.st.hp) * 0.55) || !(np.efx || []).some(e => supportFx.includes(e.id));
      const supportChoice = petSkills.find(s => s && s.fx && supportFx.includes(s.fx));
      const offenseChoices = petSkills.filter(s => s && ((s.pow || 0) > 0 || (s.fx && !supportFx.includes(s.fx))));
      const controlTarget = en.filter(e => e.hp > 0).find(e => !(e.efx || []).some(ef => harmfulFx.includes(ef.id)));
      const petTarget = (petRole === "fx" && controlTarget) ? controlTarget : (en.filter(e => e.hp > 0).sort((a,b) => a.hp - b.hp)[0] || tgt);
      const shouldSupport = !!supportChoice && (needHelp || petRole === "support" || petRole === "guard" || (petRole === "speed" && Math.random() < 0.3));
      const sk = shouldSupport ? supportChoice : (offenseChoices.length ? (petRole === "damage" ? offenseChoices.sort((a,b) => (b.pow||0) - (a.pow||0))[0] : P(offenseChoices)) : petSkills[0]);
      if (sk) {
        if ((sk.pow || 0) > 0) {
          const petPowerMult = pet?.passiveMult || 1.08;
          const petDamageBias = petProfile.damageMult;
          let d = Math.max(1, Math.floor((sk.pow + pl.level * 0.35 + R(-2,3)) * petPowerMult * petDamageBias * eMult(sk.el || pet.el, petTarget)));
          if (petRole === "damage" && (petTarget.hp || 0) <= Math.floor((petTarget.mhp || petTarget.hp || 1) * 0.35)) d = Math.floor(d * petProfile.executeMult);
          petTarget.hp = Math.max(0, petTarget.hp - d);
          logInfo((pet.passiveName || pet.passive || pet.nm) + ": " + pet.nm + " used " + sk.n + " for " + d);
        }
        if (sk.fx) {
          const ef = FX(sk.fx);
          if (ef) {
            if (supportFx.includes(sk.fx)) {
              const dur = Math.min(5, (sk.fxDur || ef.dur) + petProfile.supportDur);
              np.efx = [...(np.efx||[]), {...ef, tl: dur}];
              if (petRole === "support" || petRole === "guard") {
                const sustain = Math.max(6, Math.floor((pet.passiveMult || 1) * (pl.level * 0.8) * petProfile.sustainMult));
                np.chp = Math.min(st.hp, (np.chp || 0) + sustain);
                logHeal((pet.passiveName || pet.passive || pet.nm) + ": " + pet.nm + " stabilizes you for " + sustain + " HP");
              }
              logFx((pet.passiveName || pet.passive || pet.nm) + ": " + pet.nm + " applied " + ef.ic + ef.nm + " to you — " + formatTurns(dur));
            } else {
              const dur = Math.min(5, (sk.fxDur || ef.dur) + petProfile.statusDur);
              petTarget.efx.push({...ef, tl: dur, justApplied:true});
              logFx((pet.passiveName || pet.passive || pet.nm) + ": " + pet.nm + " applied " + ef.ic + ef.nm + " — " + formatTurns(dur));
            }
          }
        }
        if ((sk.pow || 0) > 0 && petProfile.doubleTap > 0 && petTarget.hp > 0 && Math.random() < petProfile.doubleTap) {
          const extra = Math.max(1, Math.floor((sk.pow * 0.42 + pl.level * 0.2) * (pet.passiveMult || 1) * eMult(sk.el || pet.el, petTarget)));
          petTarget.hp = Math.max(0, petTarget.hp - extra);
          logInfo((pet.passiveName || pet.passive || pet.nm) + ": " + pet.nm + " follows with a quick strike for " + extra);
        }
      }
    }
    // Ally
    if (ally?.hp > 0) {
      const aliveEn = en.filter(e => e.hp > 0);
      if (aliveEn.length > 0) {
        const allySkills = [ally.sk1, ally.sk2].filter(Boolean);
        const allyRole = ally?.role || ally?.passiveBonus || "support";
        const allyProfile = companionRoleProfile(allyRole);
        const needBuff = np.chp < Math.floor((st.hp || np.st.hp) * 0.5) || !((np.efx || []).some(e => supportFx.includes(e.id)));
        const supportChoice = allySkills.find(s => s && s.fx && supportFx.includes(s.fx));
        const offenseChoices = allySkills.filter(s => s && ((s.pow || 0) > 0 || (s.fx && !supportFx.includes(s.fx))));
        const controlTarget = aliveEn.find(e => !(e.efx || []).some(ef => harmfulFx.includes(ef.id)));
        const priority = aliveEn.filter(e => (e.efx || []).some(ef => ef.id === 'expose' || ef.id === 'weaken' || ef.id === 'bleed'));
        const at = (allyRole === "fx" && controlTarget) ? controlTarget : ((priority.length ? priority.sort((a,b) => a.hp - b.hp)[0] : aliveEn.sort((a,b) => a.hp - b.hp)[0]) || P(aliveEn));
        const shouldSupport = !!supportChoice && (needBuff || allyRole === "support" || allyRole === "guard" || (allyRole === "speed" && Math.random() < 0.34));
        const chosen = shouldSupport ? supportChoice : (Math.random() < (allyRole === "damage" ? 0.88 : 0.72) && offenseChoices.length ? (allyRole === "damage" ? offenseChoices.sort((a,b) => (b.pow||0) - (a.pow||0))[0] : P(offenseChoices)) : null);
        if (chosen) {
          if ((chosen.pow || 0) > 0) {
            const allyPowerMult = ally?.passiveMult || 1.1;
            const allyDamageBias = allyProfile.damageMult;
            let d = Math.max(1, Math.floor((chosen.pow + pl.level * 0.6 + R(-2,3)) * allyPowerMult * allyDamageBias * eMult(chosen.el || ally.el, at)));
            if (allyRole === "damage" && (at.hp || 0) <= Math.floor((at.mhp || at.hp || 1) * 0.35)) d = Math.floor(d * allyProfile.executeMult);
            at.hp = Math.max(0, at.hp - d);
            logInfo((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " used " + chosen.n + " for " + d);
            if (chosen.fx) {
              const ef = FX(chosen.fx);
              if (ef) { const dur = Math.min(5, (chosen.fxDur || ef.dur) + allyProfile.statusDur); at.efx.push({ ...ef, tl: dur, justApplied: true }); logFx((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " applied " + ef.ic + ef.nm + " — " + formatTurns(dur)); }
            }
          } else if (chosen.fx) {
            const ef = FX(chosen.fx);
            if (ef) {
              if (supportFx.includes(chosen.fx)) {
                const dur = Math.min(5, (chosen.fxDur || ef.dur) + allyProfile.supportDur);
                np.efx = [...(np.efx || []), { ...ef, tl: dur }];
                if (allyRole === "support" || allyRole === "guard") {
                  const sustain = Math.max(8, Math.floor((ally?.passiveMult || 1.05) * (pl.level * 0.9) * allyProfile.sustainMult));
                  np.chp = Math.min(st.hp, (np.chp || 0) + sustain);
                  logHeal((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " reinforces you for " + sustain + " HP");
                }
                logFx((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " used " + chosen.n + " — " + ef.ic + ef.nm + " for " + formatTurns(dur));
              } else {
                const dur = Math.min(5, (chosen.fxDur || ef.dur) + allyProfile.statusDur);
                at.efx.push({ ...ef, tl: dur, justApplied: true });
                logFx((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " used " + chosen.n + " — " + ef.ic + ef.nm + " for " + formatTurns(dur));
              }
            }
          }
        } else {
          const d = Math.max(1, Math.floor((R(8, 15) + pl.level * 0.8) * (ally?.passiveMult || 1.08) * companionRoleProfile(allyRole).damageMult * eMult(ally.el || "Null", at)));
          at.hp = Math.max(0, at.hp - d);
          logInfo((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " attacked " + at.name + " for " + d);
        }
        if (chosen && (chosen.pow || 0) > 0 && allyProfile.doubleTap > 0 && at.hp > 0 && Math.random() < allyProfile.doubleTap) {
          const extra = Math.max(1, Math.floor((chosen.pow * 0.48 + pl.level * 0.3) * (ally?.passiveMult || 1.05) * eMult(chosen.el || ally.el, at)));
          at.hp = Math.max(0, at.hp - extra);
          logInfo((ally.passiveName || ally.passive || ally.nm) + ": " + ally.nm + " keeps tempo and hits again for " + extra);
        }
      }
    }

    // Victory check
    if (en.every(e => e.hp <= 0)) {
      const xp = en.reduce((s, e) => s + e.xp, 0), g = en.reduce((s, e) => s + e.gold, 0);
      np = giveXP(xp, np); setGold(go => go + g); setKills(k => k + en.length);
      setStory(st => st.map(q => { if (q.id === "s2" && !q.done) { const p2 = { ...q, prog: (q.prog || 0) + en.length }; if (p2.prog >= p2.goal) p2.done = true; return p2; } if (q.id === "s7" && en.some(e => e.name === "Dream Devourer")) return { ...q, done: true }; return q; }));
      if (btl.type === "fieldboss") {
        const fb = en.find(e => e.fieldBossKey);
        if (fb?.fieldBossKey) {
          setFieldBossDefeated(d => ({ ...d, [fb.fieldBossKey]: true }));
          setMData(md => md ? md.map(t => t?.poi?.bossKey === fb.fieldBossKey ? { ...t, poi: null } : t) : md);
          const prize = Math.random() < 0.5 ? mkRiftGear(C(Math.floor(pl.level/3)+2, 3, 7)) : mkArmor(C(Math.floor(pl.level/3)+2, 3, 7));
          setInv(i => [...i, { ...prize, qty: 1 }]);
          lg.push("💀 Field Boss defeated: " + fb.name);
          lg.push("🎁 Trophy reward: " + (prize.name || prize.nm));
          const lockedSkill = np.skills.find(s => !s.unlocked);
          if (lockedSkill) { np.skills = np.skills.map(s => s.id === lockedSkill.id ? { ...s, unlocked: true } : s); lg.push("✨ Spell unlocked: " + lockedSkill.n); }
        }
      }
      const defeatedBoss = en.find(e => e.boss);
      if (btl.type === "hostile" && defeatedBoss) {
        const cache = rollOutpostTreasure(pl.level || 1, subMap?.rewardBias || defeatedBoss.bossFamily || "fortress");
        if (cache.item) {
          if (cache.item.atk !== undefined || cache.item.slot || cache.item.isShield) setInv(i => [...i, { ...cache.item, qty: 1 }]);
          else stashConsumable({ ...cache.item, id: cache.item.id || ID(), qty: 1 });
          lg.push("🎒 Outpost cache: " + (cache.item.name || cache.item.nm));
        }
        const bonusGold = 28 + Math.floor((pl.level || 1) * 1.8);
        setGold(go => go + bonusGold);
        lg.push("💰 Outpost spoils: +" + bonusGold + "G");
      }
      if (btl.type === "rift" && defeatedBoss) {
        const cache = rollRiftTreasure(pl.level || 1, subMap?.rewardBias || defeatedBoss.bossFamily || "void");
        if (cache.item) {
          if (cache.item.atk !== undefined || cache.item.slot || cache.item.isShield) setInv(i => [...i, { ...cache.item, qty: 1 }]);
          else stashConsumable({ ...cache.item, id: cache.item.id || ID(), qty: 1 });
          lg.push("🌀 Rift cache: " + (cache.item.name || cache.item.nm));
        }
        if (cache.shards) { setShards(s => s + cache.shards); lg.push("🔹 Rift shards: +" + cache.shards); }
      } else if (btl.type === "rift" && Math.random() < 0.05) {
        const rw = mkWpn(R(4, 5));
        setInv(i => [...i, { ...rw, qty: 1 }]);
        lg.push("✨ LEGENDARY: " + rw.name + "!");
        const fullPool = np.ultPool || mkUltPool(CLS.find(x => x.id === np.cid));
        const unlockedIds = new Set(ults.map(u => u.id));
        const remainingUlts = fullPool.filter(u => !unlockedIds.has(u.id));
        if (remainingUlts.length) {
          const nu = P(remainingUlts);
          setUlts(u => [...u, nu]);
          setPl(p => p ? ({ ...p, ultPool: p.ultPool || fullPool }) : p);
          lg.push("🌟 New Veil Expansion: " + nu.name);
        }
      }
      // Arena shard reward
      if (btl.type === "pvp" && Math.random() < 0.4) { const sh = R(1,3); setShards(s => s + sh); lg.push("✨ Arena reward: +" + sh + " relic shards!"); }
      if (btl.type === "rift") { const sh = R(2,5); setShards(s => s + sh); }
      if (btl.type === "beast") { const bd = en[0]?.beastData; if (bd && Math.random() < 0.25) { if (!pet) { const pp = petPassiveTemplate(bd.el); const petObj = {...bd, chp: bd.hp, mhp: bd.hp, mmp: Math.max(20, Math.floor((bd.atk + bd.def) * 1.2)), mp: Math.max(20, Math.floor((bd.atk + bd.def) * 1.2)), passiveName: pp.nm, passive: pp.nm, passiveBonus: pp.bonus, passiveMult: pp.mult}; setPet(petObj); lg.push("🐾 " + bd.nm + " has been tamed! Passive: " + pp.nm); } else { lg.push("🐾 " + bd.nm + " could be tamed but you already have a pet!"); } } else if (bd) { lg.push("The " + bd.nm + " fled into the wild."); } }
      // Guild mission tracking
      if (guildMission) {
        const gm = guildMission;
        if (gm.id === "hunt") {
          const defeatedCount = en.filter(e => e.hp <= 0).length || en.length;
          setGuildMission(m => m ? { ...m, progress: Math.min(m.goal, m.progress + defeatedCount) } : m);
        }
        if (gm.id === "boss") {
          const bossCount = en.filter(e => e.boss).length;
          if (bossCount > 0) setGuildMission(m => m ? { ...m, progress: Math.min(m.goal, m.progress + bossCount) } : m);
        }
        if (gm.id === "arena" && btl.type === "pvp") {
          setGuildMission(m => m ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m);
        }
      }
      lg.push("🏆 Victory! +" + xp + "XP +" + g + "G"); np.efx = []; np.tempBattleEl = null; np.tempBattleEl2 = null; np.tempBonusEls = []; np.kagamiAttunedEnemyIds = []; setPl(np); if (pet) setPet(p => p ? ({...p, chp: p.mhp ?? p.hp ?? p.chp}) : p); setBtl(null); setLog(l => [...l, ...playerTagged(lg)]); try { musicRef.current.playSfx("victory"); } catch {} setScr(subMap ? "submap" : "map"); return;
    }

    en = en.filter(e => (e.hp || 0) > 0).map(e => ({ ...e, efx: [...(e.efx || [])] }));
    const resolvedLastSkillEl = act === "skill" ? eqSk[idx]?.el : (act === "copy" ? (copied?.el || btl.lastSkillEl) : (act === "mend" ? "Null" : btl.lastSkillEl));
    const resolvedLastSkillType = act === "skill" ? eqSk[idx]?.t : (act === "guard" ? "guard" : act === "strike" ? "strike" : act === "mend" ? "heal" : act === "copy" ? (copied?.t || "copy") : btl.lastSkillType);
    const previewTarget = (tgt && tgt.hp > 0 ? tgt : en.find(e => e.hp > 0)) || null;
    const previewBattleState = { ...btl, en, chain: ch, chainProg: nextProg, lastSkillEl: resolvedLastSkillEl, lastSkillType: resolvedLastSkillType, firstSpellUsed: btl.firstSpellUsed || act === "skill", interactionState: nextInteractionState, turn: "e", tn: btl.tn + 1, moved: false };
    const nextReadyList = getReadyInteractions(np.inter, previewBattleState, previewTarget).filter(ai => ai.isReady);
    nextInteractionState.readyKeys = nextReadyList.map(ai => String(ai.k || "").toLowerCase());
    nextReadyList.forEach(ai => {
      const readyKey = String(ai.k || "").toLowerCase();
      const readyName = ai.nm || interactionDisplayName(ai.k, ai.ds);
      if (!prevReadyKeys.has(readyKey) && !lg.some(line => String(line || "").includes("Skill Interaction primed: " + readyName))) {
        lg.push("🔁 Skill Interaction primed: " + readyName + " — Trigger ready: " + splitInteractionDescription(ai.ds || "").trigger + ".");
      }
    });
    setBtl({ ...previewBattleState, interactionState: nextInteractionState }); setPl(np); setLog(l => [...l, ...playerTagged(lg)]);
    // Enemy turn
    setTimeout(() => {
      let up = { ...np }; const s2 = effSt(up); let ue = en.map(e => ({ ...e })); const el2 = [];
      const lingeringEntries = [];
      const addLingering = (label, text) => { lingeringEntries.push({ label, text }); };
      const enemyTagged = (arr) => arr.map(line => /^Event:/.test(String(line || "")) ? line : ("ENEMY|" + line));
      ue.forEach(e => { 
        e.turnFx = [...(e.efx || [])];
        const dotCount = e.turnFx.filter(ef => ef.type === "dot").length;
        const dimFactor = dotCount > 2 ? 0.7 : dotCount > 1 ? 0.85 : 1; // diminishing returns for 3+ dots
        e.turnFx.forEach(ef => { 
          if (ef.type === "dot" && e.hp > 0 && !ef.justApplied) { 
            let dmg = ef.v;
            if (ef.id === "burn") dmg = Math.floor((ef.v + e.mhp * 0.05) * dimFactor);
            else if (ef.id === "poison") dmg = Math.floor((ef.v + (ef.dur - ef.tl + 1) * 3) * dimFactor); // escalates each tick
            else if (ef.id === "bleed") { const bleedStack = e.turnFx.filter(x => x.id === "bleed").length; dmg = Math.floor((ef.v + e.mhp * 0.04 + (bleedStack - 1) * 2) * dimFactor); }
            else dmg = Math.floor(ef.v * dimFactor);
            e.hp = Math.max(0, e.hp - dmg); addLingering((ef.ic || "🩸") + " " + ef.nm, e.name + " takes " + dmg + " damage"); 
          } 
        }); 
      });
      let pfx = [...(up.efx || [])];
      if (passiveHas("lowhp_barrier") && !up.lowHpBarrierUsed && up.chp > 0 && up.chp <= Math.floor(Math.max(1, s2.hp || up.chp || 1) * 0.35)) {
        const bf = FX("barrier");
        if (bf && !pfx.some(ef => ef.id === "barrier")) {
          pfx = [...pfx, { ...bf, tl: 1, justApplied:true }];
          up.efx = pfx;
          up.lowHpBarrierUsed = true;
          el2.push("🔮 Reflex Aegis: Barrier rises around you!");
        }
      }
      pfx.forEach(ef => {
        if (ef.type === "hot" && !ef.justApplied) { const heal = Math.max(1, Math.floor(ef.v)); up.chp = Math.min(s2.hp, up.chp + heal); addLingering((ef.ic || "💚") + " " + ef.nm, "You recover " + heal + " HP"); }
      });
      if (passiveHas("mana_regen")) { const mpGain = Math.max(1, Math.floor(s2.mp * 0.04)); up.cmp = Math.min(s2.mp, up.cmp + mpGain); addLingering("💧 Mana Recovery", passiveLabelFor("mana_regen", "Mana Well") + " restores " + mpGain + " MP"); }
      const wornArmor = [eq.helm, eq.body, eq.glv, eq.boot].filter(Boolean);
      const armorHpRegen = wornArmor.filter(a => a.fx === 'hp_regen').length * 4;
      const armorMpRegen = wornArmor.filter(a => a.fx === 'mp_regen').length * 3;
      if (armorHpRegen > 0) { up.chp = Math.min(s2.hp, up.chp + armorHpRegen); addLingering("🛡️ Armor Restore", "You recover " + armorHpRegen + " HP"); }
      if (armorMpRegen > 0) { up.cmp = Math.min(s2.mp, up.cmp + armorMpRegen); addLingering("🔷 Armor Reserve", "You recover " + armorMpRegen + " MP"); }
      // Track all active player buffs and debuffs in the summary
      pfx.forEach(ef => {
        if (ef.type === "hot" || ef.justApplied) return; // hot already logged above; justApplied = not active yet
        const isGood = ["buff","shield","dodge","reflect","counter","immunity"].includes(ef.type);
        const isDot = ef.type === "dot";
        if (isDot) { addLingering((ef.ic||"🩸")+" "+ef.nm, "Affecting you ("+formatTurns(ef.tl)+" left)"); }
        else { addLingering((ef.ic||"✨")+" "+ef.nm, (isGood?"Active on you":"Affecting you")+" ("+formatTurns(ef.tl)+" left)"); }
      });
      ue.forEach((rawEnemy, enemyIndex) => {
        if (!rawEnemy || (rawEnemy.hp || 0) <= 0) return;
        let enemy = applyBossPhasePressure(rawEnemy, up, el2);
        ue[enemyIndex] = enemy;
        const skipEf = (enemy.turnFx || enemy.efx || []).find(ef => ef.type === "skip" && !ef.justApplied && (ef.v >= 100 || Math.random() * 100 < ef.v));
        if (skipEf) { el2.push("⚡ " + enemy.name + " can't move this turn."); enemy.efx = (enemy.efx || []).map(ef => ef.id === skipEf.id ? { ...ef, justApplied:false } : ef); ue[enemyIndex] = enemy; return; }
        let sk = chooseEnemySkill(enemy, pfx, encounterProfile);
        // v42: enemy AI movement (mirrors player positional combat).
        // Melee enemies (no element / Null element) prefer distance 1; ranged
        // enemies (any non-Null element) prefer distance ≥3. They can shift
        // one lane within their side (3 ↔ 4) before acting.
        const isSupportSkill = sk?.kind === 'support';
        const isRangedSkill = !!(sk && sk.el && sk.el !== "Null");
        const enemyPosCur = enemy.pos ?? (enemyIndex < 2 ? 3 : 4);
        let playerLane = btl.plPos ?? 1;
        let enemyDist = Math.abs(enemyPosCur - playerLane);
        let enemyNewPos = enemyPosCur;
        // v55: tick boss charge cooldown
        if ((enemy.chargeCD || 0) > 0) enemy.chargeCD = enemy.chargeCD - 1;
        // v55: boss charge attack — telegraph one turn, devastating advance the next.
        let bossChargeBonus = 1;
        let bossIsTelegraphing = false;
        if (enemy.boss && !isSupportSkill) {
          if (enemy.charging) {
            // Execute the charge: advance straight to the player's lane and deal +60% damage
            enemyNewPos = playerLane;
            bossChargeBonus = 1.6;
            enemy.charging = false;
            enemy.chargeCD = 3;
            el2.push("💢 " + enemy.name + " CHARGES across the field!");
          } else if (enemyDist >= 3 && (enemy.chargeCD || 0) <= 0 && Math.random() < 0.32) {
            // Telegraph: this turn does no damage, next turn the boss charges
            enemy.charging = true;
            bossIsTelegraphing = true;
            el2.push("🐉 " + enemy.name + " coils for a devastating charge…");
          }
        }
        if (!enemy.charging && !bossIsTelegraphing && !isSupportSkill && bossChargeBonus === 1) {
          if (!isRangedSkill && enemyDist > 2 && enemyPosCur > 3) {
            // v55: player back-step interrupt — if player hasn't moved this turn and
            // is faster than the advancing enemy, retreat one lane (cap at lane 2).
            const playerSpd = (s2.spd || 0);
            const enemySpd = (enemy.spd || enemy.lvl || 0);
            const canBackstep = !btl.moved && playerSpd > enemySpd && playerLane < 2;
            if (canBackstep) {
              const newPlPos = Math.min(2, playerLane + 1);
              setBtl(prev => prev ? { ...prev, plPos: newPlPos, moved: true } : prev);
              btl.plPos = newPlPos; btl.moved = true; playerLane = newPlPos;
              el2.push("🦶 You back-step the advance — " + enemy.name + " stalls!");
              enemyNewPos = enemyPosCur; // enemy keeps lane, ate the bait
            } else {
              enemyNewPos = enemyPosCur - 1;
              el2.push("👣 " + enemy.name + " advances to the front line.");
            }
          } else if (isRangedSkill && enemyDist < 2 && enemyPosCur < 4) {
            enemyNewPos = enemyPosCur + 1;
            el2.push("👣 " + enemy.name + " falls back to keep distance.");
          }
        }
        enemy.pos = enemyNewPos;
        ue[enemyIndex] = enemy;
        enemyDist = Math.abs(enemyNewPos - playerLane);
        // v55: a telegraphing boss spends this turn winding up — no damage this turn
        if (bossIsTelegraphing) { ue[enemyIndex] = enemy; return; }
        let enemyDistMult = 1;
        if (!isSupportSkill) {
          if (!isRangedSkill && enemyDist <= 1) enemyDistMult = 1.10;       // point-blank
          else if (isRangedSkill && enemyDist >= 3) enemyDistMult = 1.12;   // long-shot
        }
        const enemyDamageMult = (enemy.damageMult || encounterProfile.enemyDamage || 1) * bossChargeBonus;
        const enemyLowHpBonus = enemy.lowHpDamage || 1;
        let ed = sk && sk.pow
          ? Math.max(0, Math.floor((sk.pow * 0.62 + enemy.atk * 0.52 + enemy.mag * 0.26 - s2.def * 0.24) * enemyDamageMult * enemyDistMult * eMult(sk.el || enemy.el, up) * (enemy.hp < Math.floor(enemy.mhp * 0.4) ? enemyLowHpBonus : 1) + R(-3, 4)))
          : Math.max(1, Math.floor((enemy.atk * 0.86 - s2.def * 0.28 + R(-2, 4)) * enemyDamageMult * enemyDistMult * eMult(enemy.el || "Null", up)));
        if (sk?.kind === 'support') ed = 0;
        // Guard effect: 20% reduction for 3 turns
        if (pfx.some(ef => ef.id === "guard")) ed = Math.max(0, Math.floor(ed * 0.8));
        if (pfx.some(ef => ef.id === "shield")) ed = Math.max(0, Math.floor(ed * 0.6));
        if (pfx.some(ef => ef.id === "barrier")) ed = Math.max(0, Math.floor(ed * 0.4));
        if (pfx.some(ef => ef.id === "fortify")) ed = Math.max(0, Math.floor(ed * 0.8));
        if (sk?.kind !== 'support' && pfx.some(ef => ef.id === "evasion") && Math.random() < 0.4) { el2.push("👻 " + enemy.name + " misses you."); return; }
        if (sk?.kind !== 'support' && armorLuckDodge > 0 && Math.random() < armorLuckDodge) { el2.push("🍀 " + enemy.name + " misses you as fortune turns the blow aside!"); return; }
        const supportFx = ['shield','fortify','regen','barrier','haste','empower','evasion','reflect','nullify','thorns'];
        if (sk?.kind === 'support' && sk.fx) {
          const ef = FX(sk.fx);
          if (ef) {
            enemy.efx = addOrRefreshEffect(enemy.efx, sk.fx, sk.fxDur || ef.dur);
            el2.push("🟣 " + enemy.name + " → " + sk.n + " on self (" + ef.ic + ef.nm + ")");
          }
          return;
        }
        const petHpNow = pet?.chp ?? pet?.hp ?? 0;
        let targetKind = 'player';
        if (pet && petHpNow > 0 && Math.random() < 0.25) targetKind = 'pet';
        else if (ally?.hp > 0 && Math.random() < 0.3) targetKind = 'ally';
        if (targetKind === 'pet') {
          const petDmg = Math.floor(ed * 0.7 * eMult(sk?.el || enemy.el || "Null", pet));
          const p2 = { ...pet, chp: Math.max(0, petHpNow - petDmg), mhp: pet?.mhp ?? pet?.hp ?? petHpNow };
          el2.push("🐾 " + enemy.name + " → " + (sk ? sk.n + " " : "attack ") + petDmg + " on " + pet.nm);
          if (sk?.fx) { const ef = FX(sk.fx); if (ef && !supportFx.includes(sk.fx) && Math.random() < 0.45) { p2.efx = [...(p2.efx||[]), { ...ef, tl: sk.fxDur || ef.dur, justApplied:true }]; el2.push("   " + pet.nm + " afflicted with " + ef.ic + ef.nm); } }
          if (p2.chp <= 0) { el2.push("💀 " + pet.nm + " fell!"); setPet(p2); } else setPet(p2);
        }
        else if (targetKind === 'ally') {
          const allyDmg = Math.floor(ed * 0.7 * eMult(sk?.el || enemy.el || "Null", ally));
          const a2 = { ...ally, hp: Math.max(0, ally.hp - allyDmg) };
          el2.push("🛡 " + enemy.name + " → " + (sk ? sk.n + " " : "attack ") + allyDmg + " on " + ally.nm);
          if (a2.hp <= 0) { el2.push("💀 " + ally.nm + " fell!"); setAlly(null); } else setAlly(a2); }
        else {
          // v45: enemy crit — symmetric to v44 player crit, slightly tamer cap
          if (ed > 0 && btl.type !== "train") {
            const enemyLck = (enemy.lck || enemy.lvl * 0.6 || 0);
            const enemyCritChance = Math.min(0.20, enemyLck * 0.010);
            if (Math.random() < enemyCritChance) {
              ed = Math.floor(ed * 1.5);
              el2.push("💥 Enemy critical! ×1.5");
              try { musicRef.current.playSfx("crit"); } catch {}
            }
          }
          if (btl.type !== "train") up.chp -= ed;
          if (ed > 0 && btl.type !== "train") { try { musicRef.current.playSfx("hit"); } catch {} }
          el2.push("🔴 " + enemy.name + (sk ? " → " + sk.n : " attacks") + " on You for " + (btl.type === "train" ? "0 (blocked)" : ed));
          if (sk?.fx) {
            const ef = FX(sk.fx);
            if (ef && !supportFx.includes(sk.fx) && Math.random() < Math.min(0.82, (sk.kind === 'debuff' ? 0.62 : 0.34) + (enemy.fxChanceBonus || 0))) {
              up.efx = [...(up.efx || []), { ...ef, tl: skillDurationValue(sk, 'fx') || ef.dur, justApplied:true }];
              el2.push("   You suffer " + ef.ic + ef.nm + " (" + formatTurns(skillDurationValue(sk, 'fx') || ef.dur) + ")");
            }
          }
          if (pfx.some(ef => ef.id === "reflect") && btl.type !== "train" && ed > 0) { enemy.hp = Math.max(0, enemy.hp - Math.floor(ed * 0.3)); el2.push("🪞 " + passiveLabelFor("start_reflect", "Reflect") + ": " + Math.floor(ed * 0.3) + " damage back"); }
          if (pfx.some(ef => ef.id === "thorns") && btl.type !== "train" && ed > 0) { enemy.hp = Math.max(0, enemy.hp - Math.floor(ed * 0.2)); el2.push("🌹 " + passiveLabelFor("start_thorns", "Thorns") + ": " + Math.floor(ed * 0.2) + " damage back"); }
        }
      });
      if (lingeringEntries.length) {
        const merged = [];
        lingeringEntries.forEach(entry => {
          const hit = merged.find(m => m.label === entry.label);
          if (hit) hit.texts.push(entry.text);
          else merged.push({ label: entry.label, texts: [entry.text] });
        });
        el2.push("🔮 Lingering Effects Summary\n• " + merged.map(m => m.label + " — " + m.texts.join("; ")).join("\n• "));
      }
      ue = ue.filter(e => (e.hp || 0) > 0).map(e => ({ ...e, bossTurns: (e.bossTurns || 0) + 1, efx: (e.efx || []).map(ef => ({ ...ef, justApplied:false, tl: ef.justApplied ? ef.tl : ef.tl - 1 })).filter(ef => ef.tl > 0), turnFx: undefined }));
      up.efx = pfx.map(ef => ({ ...ef, justApplied:false, tl: ef.justApplied ? ef.tl : ef.tl - 1 })).filter(ef => ef.tl > 0);
      if (up.chp <= 0) {
        const has = up.passives.find(p => p.equipped && p.ef === "laststand");
        if (has && !up.pUsed) { up.chp = 1; up.pUsed = true; el2.push("💪 Last Stand!"); }
        else { el2.push("💀 Defeated..."); setLog(l => [...l, ...enemyTagged(el2)]); try { musicRef.current.playSfx("defeat"); } catch {} die(); return; }
      }
      if (ue.every(e => e.hp <= 0)) { const xp2 = ue.reduce((s, e) => s + e.xp, 0), g2 = ue.reduce((s, e) => s + e.gold, 0); up = giveXP(xp2, up); setGold(go => go + g2); if (btl.type === "fieldboss") { const fb = ue.find(e => e.fieldBossKey); if (fb?.fieldBossKey) { setFieldBossDefeated(d => ({ ...d, [fb.fieldBossKey]: true })); setMData(md => md ? md.map(t => t?.poi?.bossKey === fb.fieldBossKey ? { ...t, poi: null } : t) : md); const prize = Math.random() < 0.5 ? mkRiftGear(C(Math.floor(pl.level/3)+2, 3, 7)) : mkArmor(C(Math.floor(pl.level/3)+2, 3, 7)); setInv(i => [...i, { ...prize, qty: 1 }]); el2.push("💀 Field Boss defeated: " + fb.name); el2.push("🎁 Trophy reward: " + (prize.name || prize.nm)); } } el2.push("🏆 Victory! +" + xp2 + "XP +" + g2 + "G"); up.efx = []; up.tempBattleEl = null; up.tempBattleEl2 = null; up.tempBonusEls = []; up.kagamiAttunedEnemyIds = []; if (pet) setPet(p => p ? ({...p, chp: p.mhp ?? p.hp ?? p.chp}) : p); setPl(up); setBtl(null); setLog(l => [...l, ...enemyTagged(el2)]); try { musicRef.current.playSfx("victory"); } catch {} setScr(subMap ? "submap" : "map"); return; }
      const nextEnemyInteractionState = { ...((previewBattleState && previewBattleState.interactionState) || btl.interactionState || { copiedSkillUses: 0, copiedFromBoss: false, guardThenCopyPrimed: false, copySequenceOpen: false, freezeAppliedIds: [], usedElements: [], elementUseCounts: {}, usedSkillNames: [], aoeDamageUses: 0, readyKeys: [], consecutiveGuards: 0, healUses: 0, buffUses: 0, debuffUses: 0, strikeCount: 0, guardUses: 0, damageSkillUses: 0, killCount: 0, luckyHighCount: 0, luckyLowCount: 0, devotionUnlocked: false, firstAttackPending: true, lastCopiedSkillEl: "" }) };
      const previewPlayerTurnState = { ...(previewBattleState || btl), en: ue, interactionState: nextEnemyInteractionState, turn: "p", tn: ((previewBattleState?.tn) || (btl.tn || 1)) + 1 };
      nextEnemyInteractionState.readyKeys = getReadyInteractions(up.inter || [], previewPlayerTurnState, ue.find(e => e.hp > 0) || null)
        .filter(ai => ai.isReady)
        .map(ai => String(ai.k || "").toLowerCase());
      setPl(up); setBtl({ ...previewPlayerTurnState, interactionState: nextEnemyInteractionState }); setLog(l => [...l, ...enemyTagged(el2)]);
    }, 700);
  }, [btl, pl, effSt, eq, pet, ally, copied, copyN, gold, giveXP, notify, inv, ults]);

  // COMPUTED
  const cls = pl ? CLS.find(c => c.id === pl.cid) : null;
  const st = pl ? effSt(pl) : {};
  const eqSk = pl ? pl.skills.filter(s => s.equipped && s.unlocked) : [];
  const pBar = (v, m, c, h) => { const w = Math.max(0, Math.min(100, Math.round(v / Math.max(1, m) * 100))); return ( <div style={{ width: "100%", height: h || 5, background: "rgba(255,255,255,0.05)", borderRadius: h || 5 }}><div style={{ width: w + "%", height: h || 5, background: c, borderRadius: h || 5, transition: "width .3s" }} /></div> ); };

  // Log color helper
  const logColor = (l) => {
    if (l.startsWith("🌟") || l.startsWith("🏆") || l.startsWith("✨")) return { color: "#ffe082", fontWeight: 700, fontSize: 9, className: "log-win" };
    if (l.startsWith("💀")) return { color: "#ff8a80", fontWeight: 700, fontSize: 9, className: "log-loss" };
    if (l.startsWith("💬")) return { color: "#ffd180", fontStyle: "italic", fontSize: 8.5, className: "log-info" };
    if (l.startsWith("💥") || l.startsWith("💚") || l.startsWith("💧") || l.startsWith("✦") || l.startsWith("⚔") || l.startsWith("🛡") || l.startsWith("💪")) return { color: "#d7e8ff", fontSize: 8.8, className: "log-attack" };
    if (l.startsWith("🔴")) return { color: "#ffc7c7", fontSize: 8.8, className: "log-loss" };
    if (l.startsWith("🔮") || l.startsWith("🩸") || l.startsWith("⚡") || l.startsWith("👻") || l.startsWith("🪞") || l.startsWith("🌹")) return { color: "#eadcff", fontSize: 8.8, className: "log-effect" };
    if (l.startsWith("›")) return { color: "#c7d3e5", fontSize: 8.6, className: "log-info" };
    return { color: "#d7def2", fontSize: 8.7, className: "log-info" };
  };

  const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isEventLogLine = (line) => /^(Event:|Skill Interaction:|📍|🗺|🌊|🎣|⛺|🌀|🏛|🏪|🏦|💍|🛌|🚪|📜|⏳|🧭|🧱|🔔|🪦|🏕)/.test(String(line || "").trim());
  const inferLogSide = (line) => {
    const s = String(line || "");
    if (/^ENEMY\|/.test(s)) return "enemy";
    if (/^PLAYER\|/.test(s)) return "player";
    const clean = s.replace(/^(ENEMY|PLAYER)\|/, "");
    if (/^🔮 Lingering Effects Summary/.test(clean)) return "enemy";
    if (/^(💚|🛡|⚔|✦|🪞|💥|💧|🌹|🔮|›|🌟|🔁)/.test(clean)) return "player";
    return "player";
  };
  const hasSpecificAssignedInteraction = (key) => {
    const target = String(key || "").trim().toLowerCase();
    return (pl?.inter || []).some(x => String(x?.k || "").trim().toLowerCase() === target);
  };
  const hasAssignedBattleInteraction = (kind) => {
    const pool = pl?.inter || [];
    if (kind === "setup") return pool.some(x => { const k = (x.k || "").toLowerCase(); const ds = (x.ds || "").toLowerCase(); return k.includes("setup") || k.includes("hex_strike") || k.includes("hex_feast") || k.includes("mark") || k.includes("righteous") || k.includes("shadow_cut") || ds.startsWith("debuff then attack") || ds.startsWith("apply debuff then"); });
    if (kind === "sameEl") return pool.some(x => { const k = (x.k || "").toLowerCase(); const ds = (x.ds || "").toLowerCase(); return k.includes("resonance") || (k.includes("chain") && !k.includes("blood") && !k.includes("ember")) || ds.includes("same element") || ds.includes("element chain"); });
    return false;
  };

// Returns {active: bool, label: string, mult: number, logMsg: string} for each interaction
const evaluateInteractions = (interList, btlState, np, tgt, act, sk) => {
  if (!interList || !interList.length) return [];
  const active = [];
  const state = btlState?.interactionState || {};
  const lastSkillType = btlState.lastSkillType || "";
  const lastSkillEl = btlState.lastSkillEl || "";
  const lastAction = (btlState.chain || [])[btlState.chain.length - 1];
  const lastWasGuard = lastAction === 8 || lastSkillType === "guard";
  const skEl = sk?.el || "";
  const skType = sk?.t || act;
  const isOffensive = skType === "damage" || skType === "strike" || act === "copy_use";
  const isWeaponLike = skType === "strike";
  const hpCap = Math.max(1, (np?.st?.hp || np?.hp || np?.chp || 1));
  const hpRatio = (np?.chp || 0) / hpCap;
  const targetHasDot = hasAnyBattleEffect(tgt, ["burn","poison","bleed"], { includeJustApplied: true });
  const targetHasFreeze = hasBattleEffect(tgt, "freeze", { includeJustApplied: true });
  const targetHasBlind = hasBattleEffect(tgt, "blind", { includeJustApplied: true });
  const targetHasStun = hasBattleEffect(tgt, "stun", { includeJustApplied: true });
  const targetHasPoison = hasBattleEffect(tgt, "poison", { includeJustApplied: true });
  const targetHasExpose = hasBattleEffect(tgt, "expose", { includeJustApplied: true });
  const targetHasSleep = hasBattleEffect(tgt, "sleep", { includeJustApplied: true });
  const targetHasConfuse = hasBattleEffect(tgt, "confuse", { includeJustApplied: true });
  const targetHasCurse = hasBattleEffect(tgt, "curse", { includeJustApplied: true });
  const targetHasSlow = hasBattleEffect(tgt, "slow", { includeJustApplied: true });
  const targetHasBurn = hasBattleEffect(tgt, "burn", { includeJustApplied: true });
  const targetHasBleed = hasBattleEffect(tgt, "bleed", { includeJustApplied: true });
  const targetHasWeaken = hasBattleEffect(tgt, "weaken", { includeJustApplied: true });
  const targetHasSilence = hasBattleEffect(tgt, "silence", { includeJustApplied: true });
  const playerHasHaste = hasBattleEffect(np, "haste", { includeJustApplied: true });
  const playerHasShield = hasAnyBattleEffect(np, ["shield","barrier"], { includeJustApplied: true });
  const playerHasBarrier = hasBattleEffect(np, "barrier", { includeJustApplied: true });
  const playerHasRegen = hasBattleEffect(np, "regen", { includeJustApplied: true });
  const playerHasFortify = hasBattleEffect(np, "fortify", { includeJustApplied: true });
  const playerHasReflect = hasBattleEffect(np, "reflect", { includeJustApplied: true });
  const playerHasEvasion = hasBattleEffect(np, "evasion", { includeJustApplied: true });
  const lastWasDebuff = lastSkillType === "debuff" || lastSkillType === "strike";
  const lastWasBuff = lastSkillType === "buff";
  const lastWasHeal = lastSkillType === "heal";
  const copiedSkillUses = state.copiedSkillUses || 0;
  const freezeCount = Array.isArray(state.freezeAppliedIds) ? state.freezeAppliedIds.length : 0;
  const copySequenceOpen = state.copySequenceOpen !== false;
  const usedElements = Array.isArray(state.usedElements) ? state.usedElements : [];
  const aoeDamageUses = Number.isFinite(state.aoeDamageUses) ? state.aoeDamageUses : 0;
  const rolledPrimalEls = Array.isArray(np?.primalEls) ? np.primalEls.filter(Boolean) : [];
  const firstAttackPending = state.firstAttackPending !== false;
  const healUses = Number.isFinite(state.healUses) ? state.healUses : 0;
  const buffUses = Number.isFinite(state.buffUses) ? state.buffUses : 0;
  const debuffUses = Number.isFinite(state.debuffUses) ? state.debuffUses : 0;
  const strikeCount = Number.isFinite(state.strikeCount) ? state.strikeCount : 0;
  const killCount = Number.isFinite(state.killCount) ? state.killCount : 0;
  const luckyHighCount = Number.isFinite(state.luckyHighCount) ? state.luckyHighCount : 0;
  const luckyLowCount = Number.isFinite(state.luckyLowCount) ? state.luckyLowCount : 0;
  const elementUseCounts = state.elementUseCounts && typeof state.elementUseCounts === "object" ? state.elementUseCounts : {};
  const countForEl = (el) => Number(elementUseCounts[String(el || "")] || 0);
  const targetElsNow = resolveElementList(entityBattleElements(tgt));
  const currentActionElementAdv = !!(isOffensive && skEl && skEl !== "Null" && elementInteractionScore(skEl, targetElsNow) > 0);
  const titleEl = (word) => {
    const raw = String(word || "").trim().toLowerCase();
    const map = { fire:"Fire", water:"Water", earth:"Earth", metal:"Metal", light:"Light", dark:"Dark", nature:"Nature", wind:"Wind", sound:"Sound", void:"Void", arcane:"Arcane", ice:"Ice", psychic:"Psychic", null:"Null", physical:"Physical" };
    return map[raw] || titleCaseWords(raw);
  };
  interList.forEach(x => {
    const k = (x.k || "").toLowerCase();
    const ds = (x.ds || "").toLowerCase();
    let triggered = false;
    let mult = 1.2;
    const markTriggered = (m=1.2) => { triggered = true; mult = m; };

    if (!triggered && k === "ambush" && isOffensive && firstAttackPending) markTriggered(1.32);
    if (!triggered && k === "divine_smite" && isOffensive && ["Light","Metal"].includes(skEl) && targetHasStun) markTriggered(1.45);
    if (!triggered && k === "blind_execute" && isWeaponLike && targetHasBlind) markTriggered(1.40);
    if (!triggered && k === "venom_strike" && isWeaponLike && targetHasPoison) markTriggered(1.25);
    if (!triggered && k === "quick_draw" && isWeaponLike && playerHasHaste) markTriggered(1.24);
    if (!triggered && k === "exploit_weakness" && isOffensive && targetHasExpose) markTriggered(1.20);
    if (!triggered && k === "smite_combo" && isOffensive && skEl === "Light" && lastWasHeal) markTriggered(1.25);
    if (!triggered && k === "holy_siphon" && isOffensive && skEl === "Light" && playerHasRegen) markTriggered(1.15);
    if (!triggered && k === "righteous" && isOffensive && (targetHasExpose || lastWasHeal)) markTriggered(1.18);
    if (!triggered && k === "mage_spite" && skType === "damage" && targetHasSilence) markTriggered(1.50);
    if (!triggered && k === "barrier_boost" && skType === "damage" && playerHasShield) markTriggered(1.15);
    if (!triggered && k === "overflow" && skType === "damage" && (sk?.mp || 0) >= 30) markTriggered(1.10);
    if (!triggered && k === "mirror_mastery" && act === "copy_use" && copySequenceOpen && copiedSkillUses >= 1) markTriggered(1.42);
    if (!triggered && k === "perfect_copy") {
      const playerElsNow = resolveElementList(entityBattleElements(np));
      if (act === "copy_use" && (state.copiedFromBoss || (skEl && playerElsNow.includes(skEl)) || (skEl && elementInteractionScore(skEl, targetElsNow) > 0))) markTriggered(1.26);
    }
    if (!triggered && k === "cold_dominion" && skType === "damage" && freezeCount >= 1 && (skEl === "Ice" || skEl === "Water" || act === "copy_use")) markTriggered(1.18);
    if (!triggered && k === "still_mirror" && act === "copy_use" && state.guardThenCopyPrimed) markTriggered(1.18);
    if (!triggered && ((k === "shatter_combo") || (k.includes("shatter") && ds.includes("freeze"))) && skType === "damage" && skEl === "Ice" && targetHasFreeze) {
      markTriggered(1.35);
      if (tgt) tgt.efx = (tgt.efx || []).filter(ef => ef.id !== "freeze");
    }
    if (!triggered && k === "permafrost" && skType === "damage" && lastSkillEl === "Water" && skEl === "Ice") {
      markTriggered(1.22);
      const slowEf = FX("slow");
      const freezeEf = FX("freeze");
      if (tgt && slowEf && !hasBattleEffect(tgt, "slow", { includeJustApplied: true })) tgt.efx = [...(tgt.efx || []), { ...slowEf, tl: 2, justApplied: true }];
      if (tgt && freezeEf && !hasBattleEffect(tgt, "freeze", { includeJustApplied: true })) tgt.efx = [...(tgt.efx || []), { ...freezeEf, tl: 2, justApplied: true }];
    }
    if (!triggered && k === "nightmare" && skType === "damage" && skEl === "Psychic" && (targetHasSleep || targetHasConfuse)) markTriggered(1.30);
    if (!triggered && k === "dark_illusion" && (skType === "damage" || skType === "debuff") && skEl === "Null" && (targetHasSleep || targetHasConfuse || lastWasDebuff)) markTriggered(1.25);
    if (!triggered && k === "mind_break" && skType === "damage" && lastSkillEl === "Psychic" && skEl === "Psychic") markTriggered(1.18);
    if (!triggered && k === "deep_nightmare" && skType === "damage" && skEl === "Psychic" && targetHasSleep && targetHasCurse) markTriggered(1.34);
    if (!triggered && k === "exploit_madness" && skType === "damage" && (skEl === "Psychic" || skEl === "Null") && targetHasConfuse) markTriggered(1.26);
    if (!triggered && k === "dream_ward" && skType === "damage" && skEl === "Psychic" && lastWasGuard) markTriggered(1.16);
    if (!triggered && k === "primal_surge" && skType === "damage" && skEl !== "Null" && usedElements.length >= 3) markTriggered(1.28);
    if (!triggered && k === "wild_magic" && skType === "damage" && skEl !== "Null" && lastSkillEl === skEl) markTriggered(1.20);
    if (!triggered && k === "elemental_mastery") {
      const seenRolled = rolledPrimalEls.filter(el => usedElements.includes(el));
      if (skType === "damage" && skEl !== "Null" && rolledPrimalEls.length && seenRolled.length >= rolledPrimalEls.length) markTriggered(1.22);
    }
    if (!triggered && k === "instinct" && currentActionElementAdv) markTriggered(1.20);
    if (!triggered && k === "storm_caller" && skType === "damage" && !!sk?.aoe && aoeDamageUses >= 2) markTriggered(1.10);
    if (!triggered && k === "focused_shift" && lastWasGuard && skType === "damage" && skEl !== "Null") markTriggered(1.15);

    if (!triggered && k === "combo_fist" && isWeaponLike && lastSkillType === "strike") markTriggered(1.25);
    if (!triggered && k === "counter_strike" && isWeaponLike && lastWasGuard) markTriggered(1.50);
    if (!triggered && k === "battle_flow" && isWeaponLike && strikeCount >= 3) markTriggered(1.18);
    if (!triggered && (k === "earth_fist" || k === "heavy_strike") && isWeaponLike && playerHasFortify) markTriggered(1.18);
    if (!triggered && k === "runic_slam" && isWeaponLike && (playerHasShield || playerHasFortify)) markTriggered(1.20);
    if (!triggered && (k === "guard_light" || k === "runic_foundation" || k === "wave_guard") && isOffensive && lastWasGuard) markTriggered(1.18);
    if (!triggered && k === "reverb" && skType === "damage" && skEl === "Sound" && lastSkillEl === "Sound") markTriggered(1.18);
    if (!triggered && k === "crescendo" && skType === "damage" && skEl === "Sound" && countForEl("Sound") >= 3) markTriggered(1.18);
    if (!triggered && k === "crescendo_buff" && skType === "buff" && buffUses >= 3) markTriggered(1.12);
    if (!triggered && (k === "rapid_verse" || k === "time_echo") && (skType === "damage" || isWeaponLike) && playerHasHaste) markTriggered(1.18);
    if (!triggered && (k === "time_lock" || k === "gravity_crush" || k === "gravity_well" || k === "trap_combo" || k === "sound_wave" || k === "tidal_shatter" || k === "deep_freeze") && isOffensive && targetHasSlow) markTriggered(1.22);
    if (!triggered && (k === "crushing_pressure" || k === "metal_bind") && isOffensive && targetHasStun) markTriggered(1.30);
    if (!triggered && (k === "flame_strike" || k === "fan_flames" || k === "wildfire" || k === "sear") && isOffensive && targetHasBurn) markTriggered(1.20);
    if (!triggered && (k === "ash_harvest" || k === "blood_rush") && isOffensive && killCount >= 1) markTriggered(1.14);
    if (!triggered && k === "ember_mend" && skType === "damage" && skEl === "Fire" && lastWasHeal) markTriggered(1.20);
    if (!triggered && k === "ember_recovery" && skType === "damage" && skEl === "Fire" && lastSkillEl === "Fire") markTriggered(1.15);
    if (!triggered && k === "desperation" && skType === "damage" && skEl === "Fire" && hpRatio <= 0.30) markTriggered(1.20);
    if (!triggered && k === "nature_chain" && skType === "damage" && ["Nature","Wind"].includes(skEl) && ["Nature","Wind"].includes(lastSkillEl)) markTriggered(1.18);
    if (!triggered && k === "earth_ward" && ["Earth","Metal"].includes(skEl) && ["Earth","Metal"].includes(lastSkillEl)) markTriggered(1.15);
    if (!triggered && k === "null_wave" && skType === "damage" && skEl === "Void" && lastSkillEl === "Void") markTriggered(1.18);
    if (!triggered && k === "void_devour" && skType === "damage" && skEl === "Void" && countForEl("Void") >= 3) markTriggered(1.22);
    if (!triggered && k === "void_rend" && skType === "damage" && skEl === "Void" && targetHasSilence) markTriggered(1.28);
    if (!triggered && k === "void_channel" && (skType === "damage" || skType === "debuff") && targetHasWeaken && targetHasCurse) markTriggered(1.16);
    if (!triggered && k === "entropy" && (skType === "damage" || skType === "debuff") && skEl === "Void" && targetHasCurse) markTriggered(1.25);
    if (!triggered && k === "venom_curse" && (skType === "damage" || skType === "debuff") && skEl === "Dark" && targetHasPoison) markTriggered(1.22);
    if (!triggered && k === "dot_crit" && isOffensive && (targetHasBleed || targetHasPoison)) markTriggered(1.18);
    if (!triggered && k === "hex_strike" && isWeaponLike && targetHasCurse) markTriggered(1.30);
    if (!triggered && k === "hex_feast" && isOffensive && (tgt?.efx || []).filter(ef => ["burn","poison","bleed","curse"].includes(ef.id)).length >= 3) markTriggered(1.32);
    if (!triggered && (k === "mark_prey" || k === "thread_drain") && isOffensive && (lastWasDebuff || targetHasWeaken)) markTriggered(1.18);
    if (!triggered && k === "hidden_thread" && skType === "debuff" && lastWasGuard) markTriggered(1.16);
    if (!triggered && k === "tightened_strings" && isOffensive && debuffUses >= 3) markTriggered(1.24);
    if (!triggered && k === "web_combo" && isOffensive && targetHasCurse && targetHasBleed) markTriggered(1.24);
    if (!triggered && k === "healing_tide" && (skType === "heal" || skType === "buff") && healUses >= 2) markTriggered(1.12);
    if (!triggered && k === "tidal_heal" && skType === "heal" && playerHasShield) markTriggered(1.22);
    if (!triggered && k === "ocean_blessing" && (skType === "heal" || skType === "buff") && (healUses >= 3 || playerHasShield)) markTriggered(1.14);
    if (!triggered && (k === "heal_setup" || k === "heal_extend") && lastWasHeal && (isOffensive || skType === "buff")) markTriggered(1.16);
    if (!triggered && k === "encore" && skType === "debuff" && lastWasBuff) markTriggered(1.16);
    if (!triggered && k === "harmony_share" && skType === "buff" && lastWasDebuff) markTriggered(1.14);
    if (!triggered && k === "shadow_step" && isOffensive && playerHasEvasion) markTriggered(1.24);
    if (!triggered && k === "shadow_cut" && isOffensive && skEl === "Dark" && lastSkillEl === "Dark") markTriggered(1.18);
    if (!triggered && (k === "stored_energy" || k === "singularity") && isOffensive && (state.guardUses || 0) >= 3) markTriggered(1.24);
    if (!triggered && (k === "double_down" || k === "hot_streak") && (isWeaponLike || isOffensive || skType === "buff") && luckyHighCount >= 1) markTriggered(1.18);
    if (!triggered && (k === "bounce_back" || k === "patience_pays") && (lastWasGuard || isOffensive) && luckyLowCount >= 1) markTriggered(1.16);
    if (!triggered && k === "loaded_dice" && (isOffensive || skType === "buff") && luckyLowCount >= 2) markTriggered(1.20);
    if (!triggered && k === "jackpot" && (isOffensive || isWeaponLike) && luckyHighCount >= 3) markTriggered(1.22);
    if (!triggered && k === "perfect_tempo" && (isOffensive || skType === "buff" || skType === "debuff" || skType === "heal") && new Set((state.usedSkillNames || []).slice(-3)).size >= 3) markTriggered(1.18);
    if (!triggered && k === "tri_element" && isOffensive && usedElements.length >= 3) markTriggered(1.24);

    if (!triggered) {
      const twoRow = ds.match(/use two ([a-z]+) skills in a row/);
      const threeBattle = ds.match(/use three ([a-z]+) skills in one battle/);
      if (/guard, then/.test(ds) && (isOffensive || skType === "buff" || skType === "heal")) markTriggered(lastWasGuard ? 1.15 : 1);
      else if (/heal, then/.test(ds) && lastWasHeal) markTriggered(1.15);
      else if (/debuff an enemy, then buff/.test(ds) && skType === "buff" && lastWasDebuff) markTriggered(1.14);
      else if (/buff .* then debuff/.test(ds) && skType === "debuff" && lastWasBuff) markTriggered(1.14);
      else if (/blinded target/.test(ds) && targetHasBlind && isOffensive) markTriggered(1.18);
      else if (/poisoned target/.test(ds) && targetHasPoison && isOffensive) markTriggered(1.18);
      else if (/cursed target/.test(ds) && targetHasCurse && isOffensive) markTriggered(1.18);
      else if (/slowed target/.test(ds) && targetHasSlow && isOffensive) markTriggered(1.18);
      else if (/weakened target/.test(ds) && targetHasWeaken && isOffensive) markTriggered(1.18);
      else if (/sleeping or confused target/.test(ds) && (targetHasSleep || targetHasConfuse) && isOffensive) markTriggered(1.18);
      else if (/silenced enemy/.test(ds) && targetHasSilence && isOffensive) markTriggered(1.18);
      else if (/have barrier active/.test(ds) && playerHasBarrier && isOffensive) markTriggered(1.15);
      else if (/have shield active/.test(ds) && playerHasShield && (isOffensive || skType === "heal")) markTriggered(1.15);
      else if (/have fortify active/.test(ds) && playerHasFortify && isOffensive) markTriggered(1.15);
      else if (/have regen active/.test(ds) && playerHasRegen && isOffensive) markTriggered(1.12);
      else if (/have haste active/.test(ds) && playerHasHaste && (isOffensive || isWeaponLike)) markTriggered(1.15);
      else if (/have reflect active/.test(ds) && playerHasReflect && (isOffensive || skType === "damage")) markTriggered(1.15);
      else if (/have evasion active/.test(ds) && playerHasEvasion && isOffensive) markTriggered(1.15);
      else if (twoRow && skEl === titleEl(twoRow[1]) && lastSkillEl === titleEl(twoRow[1])) markTriggered(1.18);
      else if (threeBattle && skEl === titleEl(threeBattle[1]) && countForEl(titleEl(threeBattle[1])) >= 3) markTriggered(1.18);
    }

    if (triggered) active.push({ k, mult, logMsg: "Skill Interaction: " + (x.nm || interactionDisplayName(x.k, x.ds)) + " active — " + x.ds, nm: x.nm || interactionDisplayName(x.k, x.ds) });
  });
  return active;
};

// Check if any interaction is primed (ready next action, for display)
const getReadyInteractions = (interList, btlState, tgt) => {
  if (!interList) return [];
  const state = btlState?.interactionState || {};
  const lastSkillType = btlState?.lastSkillType || "";
  const lastSkillEl = btlState?.lastSkillEl || "";
  const lastAction = (btlState?.chain || [])[(btlState?.chain?.length || 0) - 1];
  const lastWasGuard = lastAction === 8 || lastSkillType === "guard";
  const targetHasDot = hasAnyBattleEffect(tgt, ["burn","poison","bleed"], { includeJustApplied: true });
  const targetHasFreeze = hasBattleEffect(tgt, "freeze", { includeJustApplied: true });
  const targetHasBlind = hasBattleEffect(tgt, "blind", { includeJustApplied: true });
  const targetHasStun = hasBattleEffect(tgt, "stun", { includeJustApplied: true });
  const targetHasPoison = hasBattleEffect(tgt, "poison", { includeJustApplied: true });
  const targetHasExpose = hasBattleEffect(tgt, "expose", { includeJustApplied: true });
  const targetHasSleep = hasBattleEffect(tgt, "sleep", { includeJustApplied: true });
  const targetHasConfuse = hasBattleEffect(tgt, "confuse", { includeJustApplied: true });
  const targetHasCurse = hasBattleEffect(tgt, "curse", { includeJustApplied: true });
  const targetHasSlow = hasBattleEffect(tgt, "slow", { includeJustApplied: true });
  const targetHasBurn = hasBattleEffect(tgt, "burn", { includeJustApplied: true });
  const targetHasBleed = hasBattleEffect(tgt, "bleed", { includeJustApplied: true });
  const targetHasWeaken = hasBattleEffect(tgt, "weaken", { includeJustApplied: true });
  const targetHasSilence = hasBattleEffect(tgt, "silence", { includeJustApplied: true });
  const playerHasHaste = hasBattleEffect(pl, "haste", { includeJustApplied: true });
  const playerHasShield = hasAnyBattleEffect(pl, ["shield","barrier"], { includeJustApplied: true });
  const playerHasBarrier = hasBattleEffect(pl, "barrier", { includeJustApplied: true });
  const playerHasRegen = hasBattleEffect(pl, "regen", { includeJustApplied: true });
  const playerHasFortify = hasBattleEffect(pl, "fortify", { includeJustApplied: true });
  const playerHasReflect = hasBattleEffect(pl, "reflect", { includeJustApplied: true });
  const playerHasEvasion = hasBattleEffect(pl, "evasion", { includeJustApplied: true });
  const lastWasDebuff = lastSkillType === "debuff" || lastSkillType === "strike";
  const lastWasBuff = lastSkillType === "buff";
  const lastWasHeal = lastSkillType === "heal";
  const copiedSkillUses = state.copiedSkillUses || 0;
  const freezeCount = Array.isArray(state.freezeAppliedIds) ? state.freezeAppliedIds.length : 0;
  const copySequenceOpen = state.copySequenceOpen !== false;
  const usedElements = Array.isArray(state.usedElements) ? state.usedElements : [];
  const aoeDamageUses = Number.isFinite(state.aoeDamageUses) ? state.aoeDamageUses : 0;
  const rolledPrimalEls = Array.isArray(pl?.primalEls) ? pl.primalEls.filter(Boolean) : [];
  const firstAttackPending = state.firstAttackPending !== false;
  const healUses = Number.isFinite(state.healUses) ? state.healUses : 0;
  const consecutiveGuards = Number.isFinite(state.consecutiveGuards) ? state.consecutiveGuards : 0;
  const buffUses = Number.isFinite(state.buffUses) ? state.buffUses : 0;
  const debuffUses = Number.isFinite(state.debuffUses) ? state.debuffUses : 0;
  const strikeCount = Number.isFinite(state.strikeCount) ? state.strikeCount : 0;
  const killCount = Number.isFinite(state.killCount) ? state.killCount : 0;
  const luckyHighCount = Number.isFinite(state.luckyHighCount) ? state.luckyHighCount : 0;
  const luckyLowCount = Number.isFinite(state.luckyLowCount) ? state.luckyLowCount : 0;
  const copiedSkillEl = state.lastCopiedSkillEl || "";
  const hpCap = Math.max(1, (pl?.st?.hp || pl?.hp || pl?.chp || 1));
  const hpRatio = (pl?.chp || 0) / hpCap;
  const elementUseCounts = state.elementUseCounts && typeof state.elementUseCounts === "object" ? state.elementUseCounts : {};
  const countForEl = (el) => Number(elementUseCounts[String(el || "")] || 0);
  const titleEl = (word) => {
    const raw = String(word || "").trim().toLowerCase();
    const map = { fire:"Fire", water:"Water", earth:"Earth", metal:"Metal", light:"Light", dark:"Dark", nature:"Nature", wind:"Wind", sound:"Sound", void:"Void", arcane:"Arcane", ice:"Ice", psychic:"Psychic", null:"Null", physical:"Physical" };
    return map[raw] || titleCaseWords(raw);
  };
  return (interList || []).map(x => {
    const k = (x.k || "").toLowerCase();
    const ds = (x.ds || "").toLowerCase();
    let isReady = false;
    if (k === "ambush") isReady = firstAttackPending;
    else if (k === "divine_smite") isReady = targetHasStun;
    else if (k === "blind_execute") isReady = targetHasBlind;
    else if (k === "venom_strike") isReady = targetHasPoison;
    else if (k === "quick_draw") isReady = playerHasHaste;
    else if (k === "exploit_weakness") isReady = targetHasExpose;
    else if (k === "holy_bulwark") isReady = consecutiveGuards >= 1;
    else if (k === "martyr") isReady = hpRatio <= 0.40;
    else if (k === "overheal_shield") isReady = (pl?.chp || 0) >= hpCap;
    else if (k === "purify") isReady = playerHasShield;
    else if (k === "holy_siphon") isReady = playerHasRegen;
    else if (k === "smite_combo") isReady = lastWasHeal;
    else if (k === "righteous") isReady = targetHasExpose || lastWasHeal;
    else if (k === "devotion") isReady = healUses >= 2;
    else if (k === "overflow") isReady = true;
    else if (k === "barrier_boost") isReady = playerHasShield;
    else if (k === "mage_spite") isReady = targetHasSilence;
    else if (k === "nightmare") isReady = targetHasSleep || targetHasConfuse;
    else if (k === "dark_illusion") isReady = targetHasSleep || targetHasConfuse || lastWasDebuff;
    else if (k === "mind_break") isReady = lastSkillEl === "Psychic";
    else if (k === "deep_nightmare") isReady = targetHasSleep && targetHasCurse;
    else if (k === "exploit_madness") isReady = targetHasConfuse;
    else if (k === "dream_ward") isReady = lastWasGuard;
    else if (k === "primal_surge") isReady = usedElements.length >= 2;
    else if (k === "wild_magic") isReady = lastSkillEl !== "" && lastSkillEl !== "Null";
    else if (k === "elemental_mastery") isReady = rolledPrimalEls.length > 0 && rolledPrimalEls.filter(el => usedElements.includes(el)).length >= Math.max(1, rolledPrimalEls.length - 1);
    else if (k === "instinct") {
      const targetEls = resolveElementList(entityBattleElements(tgt));
      const candidateEls = Array.isArray(pl?.primalEls) && pl?.primalEls.length ? pl.primalEls : resolveElementList(entityBattleElements(pl));
      isReady = candidateEls.some(el => elementInteractionScore(el, targetEls) > 0);
    }
    else if (k === "storm_caller") isReady = aoeDamageUses >= 1;
    else if (k === "focused_shift") isReady = lastWasGuard;
    else if (k === "mirror_mastery") isReady = copySequenceOpen && copiedSkillUses >= 1;
    else if (k === "perfect_copy") {
      const readyEls = resolveElementList(entityBattleElements(pl));
      const targetEls = resolveElementList(entityBattleElements(tgt));
      isReady = !!state.copiedFromBoss || !!(copiedSkillEl && readyEls.includes(copiedSkillEl)) || !!(copiedSkillEl && elementInteractionScore(copiedSkillEl, targetEls) > 0);
    }
    else if (k === "cold_dominion") isReady = freezeCount >= 1;
    else if (k === "still_mirror") isReady = !!state.guardThenCopyPrimed;
    else if (k === "combo_fist") isReady = lastSkillType === "strike";
    else if (k === "counter_strike") isReady = lastWasGuard;
    else if (k === "battle_flow") isReady = strikeCount >= 2;
    else if (k === "earth_fist" || k === "heavy_strike") isReady = playerHasFortify;
    else if (k === "runic_slam") isReady = playerHasShield || playerHasFortify;
    else if (k === "guard_light" || k === "runic_foundation" || k === "wave_guard") isReady = lastWasGuard;
    else if (k === "reverb") isReady = lastSkillEl === "Sound";
    else if (k === "crescendo") isReady = countForEl("Sound") >= 2;
    else if (k === "crescendo_buff") isReady = buffUses >= 2;
    else if (k === "rapid_verse" || k === "time_echo") isReady = playerHasHaste;
    else if (k === "time_lock" || k === "gravity_crush" || k === "gravity_well" || k === "trap_combo" || k === "sound_wave" || k === "tidal_shatter" || k === "deep_freeze") isReady = targetHasSlow;
    else if (k === "crushing_pressure" || k === "metal_bind") isReady = targetHasStun;
    else if (k === "flame_strike" || k === "fan_flames" || k === "wildfire" || k === "sear") isReady = targetHasBurn;
    else if (k === "ash_harvest" || k === "blood_rush") isReady = killCount >= 1;
    else if (k === "ember_mend") isReady = lastWasHeal;
    else if (k === "ember_recovery") isReady = lastSkillEl === "Fire";
    else if (k === "desperation") isReady = hpRatio <= 0.30;
    else if (k === "nature_chain") isReady = ["Nature","Wind"].includes(lastSkillEl);
    else if (k === "earth_ward") isReady = ["Earth","Metal"].includes(lastSkillEl);
    else if (k === "null_wave") isReady = lastSkillEl === "Void";
    else if (k === "void_devour") isReady = countForEl("Void") >= 2;
    else if (k === "void_rend") isReady = targetHasSilence;
    else if (k === "void_channel") isReady = targetHasWeaken && targetHasCurse;
    else if (k === "entropy") isReady = targetHasCurse;
    else if (k === "venom_curse") isReady = targetHasPoison;
    else if (k === "dot_crit") isReady = targetHasBleed || targetHasPoison;
    else if (k === "hex_strike") isReady = targetHasCurse;
    else if (k === "hex_feast") isReady = (tgt?.efx || []).filter(ef => ["burn","poison","bleed","curse"].includes(ef.id)).length >= 3;
    else if (k === "mark_prey" || k === "hidden_thread" || k === "thread_drain") isReady = lastWasDebuff || targetHasWeaken;
    else if (k === "tightened_strings") isReady = debuffUses >= 2;
    else if (k === "web_combo") isReady = targetHasCurse && targetHasBleed;
    else if (k === "healing_tide") isReady = healUses >= 1;
    else if (k === "tidal_heal") isReady = playerHasShield;
    else if (k === "ocean_blessing") isReady = healUses >= 2 || playerHasShield;
    else if (k === "heal_setup" || k === "heal_extend") isReady = lastWasHeal;
    else if (k === "encore") isReady = lastWasBuff;
    else if (k === "harmony_share") isReady = lastWasDebuff;
    else if (k === "shadow_step") isReady = playerHasEvasion;
    else if (k === "shadow_cut") isReady = lastSkillEl === "Dark";
    else if (k === "stored_energy" || k === "singularity") isReady = (state.guardUses || 0) >= 2;
    else if (k === "double_down" || k === "hot_streak") isReady = luckyHighCount >= 1;
    else if (k === "bounce_back" || k === "patience_pays") isReady = luckyLowCount >= 1;
    else if (k === "loaded_dice") isReady = luckyLowCount >= 2;
    else if (k === "jackpot") isReady = luckyHighCount >= 2;
    else if (k === "perfect_tempo") isReady = new Set((state.usedSkillNames || []).slice(-3)).size >= 3;
    else if (k === "tri_element") isReady = usedElements.length >= 2;
    else {
      const twoRow = ds.match(/use two ([a-z]+) skills in a row/);
      const threeBattle = ds.match(/use three ([a-z]+) skills in one battle/);
      if (/guard, then/.test(ds)) isReady = lastWasGuard;
      else if (/heal, then/.test(ds)) isReady = lastWasHeal;
      else if (/debuff an enemy, then buff/.test(ds)) isReady = lastWasDebuff;
      else if (/buff .* then debuff/.test(ds)) isReady = lastWasBuff;
      else if (/blinded target/.test(ds)) isReady = targetHasBlind;
      else if (/poisoned target/.test(ds)) isReady = targetHasPoison;
      else if (/cursed target/.test(ds)) isReady = targetHasCurse;
      else if (/slowed target/.test(ds)) isReady = targetHasSlow;
      else if (/weakened target/.test(ds)) isReady = targetHasWeaken;
      else if (/sleeping or confused target/.test(ds)) isReady = targetHasSleep || targetHasConfuse;
      else if (/silenced enemy/.test(ds)) isReady = targetHasSilence;
      else if (/have barrier active/.test(ds)) isReady = playerHasBarrier;
      else if (/have shield active/.test(ds)) isReady = playerHasShield;
      else if (/have fortify active/.test(ds)) isReady = playerHasFortify;
      else if (/have regen active/.test(ds)) isReady = playerHasRegen;
      else if (/have haste active/.test(ds)) isReady = playerHasHaste;
      else if (/have reflect active/.test(ds)) isReady = playerHasReflect;
      else if (/have evasion active/.test(ds)) isReady = playerHasEvasion;
      else if (/drop below (\d+)% hp/.test(ds)) {
        const m = ds.match(/drop below (\d+)% hp/);
        const threshold = m ? Number(m[1]) / 100 : 0.4;
        isReady = hpRatio <= threshold;
      }
      else if (/use two weapon strikes in a row/.test(ds)) isReady = lastSkillType === "strike";
      else if (/use three weapon strikes in one battle/.test(ds)) isReady = strikeCount >= 2;
      else if (/use three buffs in one battle/.test(ds)) isReady = buffUses >= 2;
      else if (/use three heals? in one battle/.test(ds)) isReady = healUses >= 2;
      else if (/use three heals or shields in one battle/.test(ds)) isReady = healUses >= 2 || playerHasShield;
      else if (/win three lucky rolls/.test(ds)) isReady = luckyHighCount >= 2;
      else if (/bad luck/.test(ds)) isReady = luckyLowCount >= 1;
      else if (/kill an enemy/.test(ds)) isReady = killCount >= 1;
      else if (/use three different elements/.test(ds)) isReady = usedElements.length >= 2;
      else if (twoRow) isReady = lastSkillEl === titleEl(twoRow[1]);
      else if (threeBattle) isReady = countForEl(titleEl(threeBattle[1])) >= 2;
      else isReady = (k.includes("guard") && lastWasGuard) ||
        (k.includes("setup") && lastWasDebuff) ||
        (k.includes("dot") && targetHasDot) ||
        (k.includes("heal") && lastWasHeal) ||
        (k.includes("buff") && lastWasBuff) ||
        (k.includes("mark") && lastWasDebuff) ||
        (k === "permafrost" && lastSkillEl === "Water") ||
        (k === "resonance" && lastSkillEl === "Sound") ||
        ((k.includes("chain") && lastSkillEl !== "" && !k.includes("blood") && !k.includes("ember"))) ||
        (k.includes("shatter") && targetHasFreeze);
    }
    return { ...x, nm: x.nm || interactionDisplayName(x.k, x.ds), isReady };
  });
};
const buildGroupedBattleLog = (entries) => {
    const chronological = [...(entries || [])];
    const grouped = [];
    let current = null;
    let round = 0;
    const flush = () => { if (current && current.lines.length) grouped.push(current); current = null; };
    const makeGroup = (side, lines) => ({
      type: side || "player",
      round: Math.max(round, 1),
      title: "Round " + Math.max(round, 1) + " — " + ((side || "player") === "enemy" ? "Enemy Actions" : "Player Actions"),
      lines: lines || []
    });
    chronological.forEach((line) => {
      if (!line) return;
      const raw = String(line || "");
      const clean = raw.replace(/^(ENEMY|PLAYER)\|/, "");
      if (isEventLogLine(clean)) {
        flush();
        const evTitle = /^Skill Interaction:/.test(clean) ? "Skill Interaction:" : "Event:";
        grouped.push({ type: "event", title: evTitle, lines: [clean.replace(/^(Event:|Skill Interaction:)\s*/, "")] });
        return;
      }
      const side = inferLogSide(raw) || "player";
      if (!current) {
        if (side === "enemy") round += 1;
        else if (round === 0) round = 1;
        current = makeGroup(side, [clean]);
        return;
      }
      if (side !== current.type) {
        const prevSide = current.type;
        flush();
        if (side === "enemy" && prevSide === "player") round += 1;
        else if (round === 0) round = 1;
        current = makeGroup(side, [clean]);
      } else {
        current.lines.push(clean);
      }
    });
    flush();
    return grouped.reverse();
  };
  const renderClickableLogText = (line, keyPrefix) => {
    const raw = String(line || "");
    const sorted = [...FXS].sort((a,b) => Math.max((b.nm||"").length, (b.ic||"").length) - Math.max((a.nm||"").length, (a.ic||"").length));
    const interactionRefs = normalizeAssignedInteractions(pl?.inter || []).sort((a,b) => (b.nm || "").length - (a.nm || "").length);
    const parts = [];
    let cursor = 0;
    while (cursor < raw.length) {
      let found = null;
      let foundIdx = -1;
      let foundLen = 0;
      for (const fx of sorted) {
        const candidates = [fx.nm && String(fx.nm)].filter(Boolean);
        for (const cand of candidates) {
          const idx = raw.indexOf(cand, cursor);
          if (idx !== -1 && (foundIdx === -1 || idx < foundIdx || (idx === foundIdx && cand.length > foundLen))) {
            found = { type: "fx", fx };
            foundIdx = idx;
            foundLen = cand.length;
          }
        }
      }
      for (const inter of interactionRefs) {
        const cand = inter.nm || "";
        const idx = cand ? raw.indexOf(cand, cursor) : -1;
        if (idx !== -1 && (foundIdx === -1 || idx < foundIdx || (idx === foundIdx && cand.length > foundLen))) {
          found = { type: "interaction", inter };
          foundIdx = idx;
          foundLen = cand.length;
        }
      }
      if (!found || foundIdx === -1) {
        parts.push(raw.slice(cursor));
        break;
      }
      if (foundIdx > cursor) parts.push(raw.slice(cursor, foundIdx));
      parts.push({ ...found, text: raw.slice(foundIdx, foundIdx + foundLen) });
      cursor = foundIdx + foundLen;
    }
    return <span>{parts.map((part, idx) => {
      if (typeof part === "string") return <span key={keyPrefix + "_txt_" + idx}>{part}</span>;
      if (part.type === "interaction") {
        return <button key={keyPrefix + "_inter_" + idx} type="button" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: interactionPopupText(part.inter) }); }} style={{ background: "transparent", border: "none", padding: 0, margin: 0, color: "#ffd600", fontWeight: 700, fontSize: "inherit", lineHeight: "inherit", cursor: "pointer", textDecoration: "underline" }}>{part.text}</button>;
      }
      return <button key={keyPrefix + "_fx_" + idx} type="button" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: (part.fx.ic ? part.fx.ic + " " : "") + part.fx.nm + "\n\n" + (STATUS_DESC[part.fx.id] || part.fx.nm) }); }} style={{ background: "transparent", border: "none", padding: 0, margin: 0, color: "#ffdca8", fontWeight: 700, fontSize: "inherit", lineHeight: "inherit", cursor: "pointer", textDecoration: "underline" }}>{part.text}</button>;
    })}</span>;
  };

  // ── NOTIFICATION ──
  const notiEl = noti ? <div style={{ position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", background: T.gd, color: "#000", padding: "7px 22px", borderRadius: 7, fontWeight: 700, fontSize: 12, zIndex: 999, fontFamily: "'Nunito',sans-serif" }}>{noti}</div> : null;
  const tipEl = tip ? <div><div style={{ position: "fixed", inset: 0, zIndex: 997 }} onClick={() => setTip(null)} /><div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", background: T.c2, border: "1px solid " + T.bd, padding: 10, borderRadius: 8, zIndex: 998, maxWidth: 300, fontSize: 11, whiteSpace: "pre-wrap" }} onClick={e => e.stopPropagation()}>{tip}<div style={{ fontSize: 9, color: T.dm, marginTop: 4 }}>Tap anywhere to close</div></div></div> : null;
  const renderPopupText = (raw) => {
    const elementNames = ["Fire","Water","Earth","Air","Lightning","Ice","Light","Dark","Void","Nature","Metal","Poison","Blood","Arcane","Psychic","Sound","Null"];
    const colorizeLine = (line, idx) => {
      const parts = String(line).split(new RegExp("(" + elementNames.join("|") + ")", "g"));
      return <div key={idx} style={{ textAlign: "center", marginBottom: line ? 4 : 8, lineHeight: 1.45 }}>
        {parts.map((part, pi) => elementNames.includes(part)
          ? <span key={pi} style={{ color: ELC[part] || T.gd, fontWeight: 800, textShadow: "0 0 10px " + ((ELC[part] || T.gd) + "44") }}>{part}</span>
          : <span key={pi}>{part}</span>)}
      </div>;
    };
    return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>{String(raw || "").split("\n").map(colorizeLine)}</div>;
  };
  const openElementSummaryPopup = (elements, accent, label) => {
    setPopup({
      fullscreen: true,
      title: label ? ("Element Summary — " + label) : "Element Summary",
      node: <div style={{ width: "100%", minWidth: 0, overflowX: "hidden" }}>{renderMatchupInline(elements, accent, "popup")}</div>
    });
  };

  // ── VEILCOURT (global chat) ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatLatestId, setChatLatestId] = useState(0);
  const [chatDraft, setChatDraft] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [chatOnline, setChatOnline] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const chatLogRef = useRef(null);
  const chatPollRef = useRef(null);
  const chatLastIdRef = useRef(0);

  const veilcourtId = useMemo(() => {
    try {
      let id = localStorage.getItem("sv_chat_id");
      if (!id) {
        id = "v_" + Math.random().toString(36).slice(2, 8) + "_" + Date.now().toString(36);
        localStorage.setItem("sv_chat_id", id);
      }
      return id;
    } catch (_) { return "v_anon_" + Math.random().toString(36).slice(2, 10); }
  }, []);

  const veilcourtFetch = useCallback(async () => {
    try {
      const r = await fetch("/api/veilcourt/messages?since=" + chatLastIdRef.current);
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setChatMsgs(prev => {
          const seen = new Set(prev.map(m => m.id));
          const fresh = data.messages.filter(m => !seen.has(m.id));
          if (fresh.length === 0) return prev;
          return [...prev, ...fresh].slice(-100);
        });
        const incomingMaxId = data.messages.reduce((mx, m) => m.id > mx ? m.id : mx, 0);
        const newLatest = Math.max(data.latestId || 0, incomingMaxId, chatLastIdRef.current);
        chatLastIdRef.current = newLatest;
        setChatLatestId(newLatest);
        if (!chatOpen) {
          const unread = data.messages.filter(m => m.playerId !== veilcourtId).length;
          if (unread > 0) setChatUnread(u => Math.min(99, u + unread));
        }
      }
      if (typeof data.online === "number") setChatOnline(data.online);
    } catch (_) { /* offline; silent */ }
  }, [chatOpen, veilcourtId]);

  useEffect(() => {
    if (["title", "create"].includes(scr)) return;
    veilcourtFetch();
    chatPollRef.current = setInterval(veilcourtFetch, chatOpen ? 3000 : 8000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [scr, chatOpen, veilcourtFetch]);

  useEffect(() => {
    if (chatOpen && chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatOpen, chatMsgs]);

  const sendVeilcourtMessage = useCallback(async () => {
    const text = chatDraft.trim();
    if (!text || !pl) return;
    setChatStatus("Sending…");
    try {
      const rk = getRank(pl.level);
      const bm = pl.bloodmark ? getBM(pl.bloodmark) : null;
      const cv = pl.covenant ? getCV(pl.covenant) : null;
      const myCls = CLS.find(c => c.id === (pl.cid || cls?.id));
      const portraitFull = pl.portrait && isValidPortraitURL(pl.portrait) ? pl.portrait : classPortraitUrl(pl.cid || cls?.id, pl.sex);
      const r = await fetch("/api/veilcourt/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: veilcourtId,
          name: (pl.name || "Sorcerer").slice(0, 24),
          text,
          classId: pl.cid || myCls?.id || null,
          className: myCls?.nm || null,
          classColor: myCls?.cl || null,
          sex: pl.sex || null,
          portrait: portraitFull,
          rank: rk?.nm || null,
          bloodmark: bm?.nm || null,
          covenant: cv?.nm || null,
        }),
      });
      if (r.status === 429) {
        const data = await r.json().catch(() => ({}));
        setChatStatus(data.error || "Slow down…");
        setTimeout(() => setChatStatus(""), 1500);
        return;
      }
      if (!r.ok) {
        setChatStatus("Send failed.");
        setTimeout(() => setChatStatus(""), 1500);
        return;
      }
      setChatDraft("");
      setChatStatus("");
      veilcourtFetch();
    } catch (_) {
      setChatStatus("Veil unreachable.");
      setTimeout(() => setChatStatus(""), 1800);
    }
  }, [chatDraft, pl, cls, veilcourtId, veilcourtFetch]);

  const openVeilcourt = useCallback(() => { setChatOpen(true); setChatUnread(0); }, []);

  const chatEl = chatOpen && pl ? (
    <div>
      <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(2,4,12,0.78)", backdropFilter: "blur(3px)" }} onClick={() => setChatOpen(false)} />
      <div className="veilcourt-modal" onClick={e => e.stopPropagation()}>
        <div className="veilcourt-header">
          <div className="veilcourt-title">
            <span className="veilcourt-icon">🜂</span>
            <div>
              <div className="veilcourt-name">The Veilcourt</div>
              <div className="veilcourt-sub">Global scrying · {chatOnline} active sorcerer{chatOnline === 1 ? "" : "s"}</div>
            </div>
          </div>
          <button className="bt bs veilcourt-close" onClick={() => setChatOpen(false)}>✕</button>
        </div>
        <div className="veilcourt-log" ref={chatLogRef}>
          {chatMsgs.length === 0 && <div className="veilcourt-empty">The basin is silent. Be the first voice across the rift.</div>}
          {chatMsgs.map(m => {
            const mine = m.playerId === veilcourtId;
            const isSystem = m.channel === "system";
            const portraitSrc = m.portrait && /^(https?:|data:image\/)/i.test(m.portrait) ? m.portrait : (m.classId ? ((import.meta.env.BASE_URL || "/") + "class/" + m.classId + (m.sex === "female" ? "_f" : "") + ".png") : null);
            return (
              <div key={m.id} className={"veilcourt-msg" + (mine ? " is-mine" : "") + (isSystem ? " is-system" : "")}>
                <div className="veilcourt-portrait" style={{ borderColor: m.classColor || (isSystem ? "#d4ad40" : "#7a89c2") }}>
                  {portraitSrc ? <img src={portraitSrc} alt="" onError={e => { try { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; if (m.classId) t.src = (import.meta.env.BASE_URL || "/") + "class/" + m.classId + ".png"; else t.style.display = "none"; } else { t.style.display = "none"; } } catch (_) {} }} /> : <span className="veilcourt-portrait-fallback">{isSystem ? "🜂" : "✦"}</span>}
                </div>
                <div className="veilcourt-bubble">
                  <div className="veilcourt-meta">
                    <span className="veilcourt-author" style={{ color: m.classColor || (isSystem ? "#d4ad40" : "#e8eeff") }}>{m.name}</span>
                    {m.className && <span className="veilcourt-tag" style={{ color: m.classColor || "#cfd6ee", borderColor: (m.classColor || "#7a89c2") + "55" }}>{m.className}</span>}
                    {m.rank && <span className="veilcourt-tag">{m.rank}</span>}
                    {m.covenant && <span className="veilcourt-tag" style={{ color: "#ffd77a", borderColor: "rgba(212,173,64,0.45)" }}>🏛 {m.covenant}</span>}
                    {m.bloodmark && <span className="veilcourt-tag" style={{ color: "#c2a8ff", borderColor: "rgba(160,120,220,0.45)" }}>✦ {m.bloodmark}</span>}
                  </div>
                  <div className="veilcourt-text">{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="veilcourt-composer">
          <div className="veilcourt-self">
            <div className="veilcourt-portrait sm" style={{ borderColor: cls?.cl || "#d4ad40" }}>
              {playerAvatar(pl?.cid || cls?.id, cls?.ic, pl?.portrait, pl?.sex)}
            </div>
            <div className="veilcourt-self-meta">
              <div className="veilcourt-self-name" style={{ color: cls?.cl || "#e8eeff" }}>{pl.name}</div>
              <div className="veilcourt-self-sub">Speaking as {cls?.nm}{pl.covenant ? " · " + (getCV(pl.covenant)?.nm || "") : ""}</div>
            </div>
          </div>
          <div className="veilcourt-input-row">
            <input
              type="text"
              className="veilcourt-input"
              maxLength={280}
              placeholder="Speak across the veil…"
              value={chatDraft}
              onChange={e => setChatDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendVeilcourtMessage(); } }}
            />
            <button className="bt veilcourt-send" disabled={!chatDraft.trim()} onClick={sendVeilcourtMessage}>Send</button>
          </div>
          <div className="veilcourt-status">
            <span>{chatDraft.length}/280</span>
            {chatStatus && <span className="veilcourt-status-msg">{chatStatus}</span>}
            <span className="veilcourt-hint">Enter to send · accessible anywhere via 💬</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const popupEl = popup ? <div><div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(0,0,0,0.65)" }} onClick={() => { if (!popup.choices && !popupJustOpenedRef.current) setPopup(null); }} onTouchStart={(ev) => { if (!popup.choices && !popupJustOpenedRef.current) { ev.stopPropagation(); setPopup(null); } }} /><div className="popup-modal" style={popup.fullscreen ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: 10, padding: 14, zIndex: 1002, maxWidth: 360, width: "88%", maxHeight: "72vh", overflowY: "auto", overflowX: "hidden" } : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: 10, padding: 16, zIndex: 1002, maxWidth: 340, width: "90%" }} onClick={e => e.stopPropagation()}>
    {popup.title ? <div className="popup-title" style={{ fontSize: popup.fullscreen ? 14 : 12, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>{popup.title}</div> : null}
    <div className="popup-body" style={{ fontSize: popup.fullscreen ? 13 : 12, marginBottom: 10, lineHeight: 1.5, whiteSpace: "normal", display: "flex", justifyContent: "center", width: "100%" }}>{popup.node ? <div style={{ width: "100%", minWidth: 0 }}>{popup.node}</div> : renderPopupText(popup.text)}</div>
    {popup.choices ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{popup.choices.map((c, i) => <button key={i} className="bt popup-choice" style={{ width: "100%", textAlign: "left" }} onClick={c.action}>{c.label}</button>)}</div> : <div style={{ display: "flex", justifyContent: "center" }}><button className="bt popup-choice" style={{ width: popup.fullscreen ? "auto" : "100%", minWidth: popup.fullscreen ? 120 : undefined }} onClick={() => setPopup(null)}>{popup.fullscreen ? "Close" : "OK"}</button></div>}
  </div></div> : null;

  // ── HUD ──
  const fishCount = Array.isArray(fish) ? fish.reduce((s, f) => s + (f.qty || 1), 0) : 0;
  const hud = pl && !["title","create"].includes(scr) ? (
    <div className="cd hud-shell" style={{ padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div className="hud-avatar" style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: cls?.cl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, overflow: "hidden", border: "1.5px solid " + (cls?.cl || T.gd), boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 0 10px " + (cls?.cl || T.gd) + "55" }}>{playerAvatar(pl?.cid || cls?.id, cls?.ic, pl?.portrait, pl?.sex)}</div>
          <div>
            <div className="hud-name-line" style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 12, fontFamily: "'Cinzel',serif", color: cls?.cl, flexWrap: "wrap" }}><span>{pl.name}</span>{entityBattleElements(pl).map((elx, i) => <ElementTag key={elx + "_hud_" + i} el={elx} fontSize={10} />)}</div>
            <div style={{ fontSize: 10, color: T.dm }}>{cls?.nm} · Gen.{pl.generation || 1} · {ageSummary}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
              {(() => { const rk = getRank(pl.level); return <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: rk.cl + "22", border: "1px solid " + rk.cl + "55", color: rk.cl, fontWeight: 700 }}>{rk.ic} {rk.nm}</span>; })()}
              {pl.bloodmark && (() => { const bm = getBM(pl.bloodmark); return bm ? <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: bm.cl + "22", border: "1px solid " + bm.cl + "44", color: bm.cl }}>{bm.ic} {bm.nm}</span> : null; })()}
              {pl.covenant && (() => { const cv = getCV(pl.covenant); return cv ? <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: cv.cl + "22", border: "1px solid " + cv.cl + "44", color: cv.cl }}>{cv.ic} {cv.nm}</span> : null; })()}
            </div>
          </div>
        </div>
        <div className="hud-meta" style={{ textAlign: "right", fontSize: 11 }}>
          <div style={{ fontWeight: 700, color: T.gd }}>💰{gold}</div>
          <div style={{ fontSize: 8, color: "#ce93d8" }}>🔮 Fragments: {fragments} · Shards: {shards}</div>
          <div style={{ fontSize: 8, color: "#7fd1ff", cursor: fishCount > 0 ? "pointer" : "default" }} onClick={() => fishCount > 0 && setShowFishLedger(v => !v)}>🐟 Fish: {fishCount}{bank > 0 ? " · 🏦 " + bank : ""}{loan > 0 ? " · 💸 " + loan : ""}{fishCount > 0 ? (showFishLedger ? " ▲" : " ▼") : ""}</div>
          {showFishLedger && fishLedger.length > 0 && <div style={{ marginTop: 4, fontSize: 8, color: "#9fd6ff", lineHeight: 1.45, background: T.c2, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 6, maxHeight: 96, overflowY: "auto" }}>{fishLedger.map(f => <div key={f.nm} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span>{f.nm}</span><span style={{ color: T.tx }}>×{f.qty}</span></div>)}</div>}
          {pet && <div style={{ fontSize: 9, color: T.dm }}>{pet.ic}{pet.nm}</div>}
          {ally && <div style={{ fontSize: 9, color: T.ok }}>🤝{ally.nm}</div>}{spouse && <button type="button" className="bt bs" style={{ fontSize: 8, color: "#ffb7d8", background: "transparent", padding: 0, border: "none", boxShadow: "none" }} onClick={() => setPopup({ text: spouseDetailText(spouse) })}>💍{spouse.nm}</button>}
        </div>
      </div>
      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 8, width: 16, color: T.hp, fontWeight: 700 }}>HP</span>{pBar(pl.chp, st.hp, T.hp)}<span style={{ fontSize: 9, color: T.dm, minWidth: 36, textAlign: "right" }}>{pl.chp}/{st.hp}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 8, width: 16, color: T.mp, fontWeight: 700 }}>MP</span>{pBar(pl.cmp, st.mp, T.mp)}<span style={{ fontSize: 9, color: T.dm, minWidth: 36, textAlign: "right" }}>{pl.cmp}/{st.mp}</span></div>
        {(() => { const tileNow = mData && pos ? mData[pos.y * MW + pos.x] : null; return tileNow && tileNow.bio === "ocean" ? <div style={{ fontSize: 8, color: "#ffb3b3", fontWeight: 700 }}>🌊 Drowning — swim to land. Ocean travel drains 1 HP and 1 MP every 2 seconds.</div> : null; })()}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 8, width: 16, color: T.xp, fontWeight: 700 }}>XP</span>{pBar(pl.xp, xpFor(pl.level), T.xp, 3)}<span style={{ fontSize: 9, color: T.dm, minWidth: 36, textAlign: "right" }}>{pl.xp}/{xpFor(pl.level)}</span></div>
      </div>
      {pl.efx && pl.efx.length > 0 && <div style={{ display: "flex", gap: 2, marginTop: 4, flexWrap: "wrap" }}>{pl.efx.map((ef, i) => <StatusTag key={i} ef={ef} />)}</div>}<details style={{ marginTop: 4 }}><summary style={{ cursor: "pointer", fontSize: 8, color: "#9fd6ff" }}>Element Summary</summary>{renderMatchupInline(entityBattleElements(pl), "player")}</details>
      {scr !== "battle" && <div className="hud-quick-nav" style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {[["📊","stats"],["🎒","items"],["📖","spells"],["📜","story"],["📘","manual"],["☰","menu"]].map(([i, s]) => <button key={s} className="bt bs" style={{ background: T.c2 }} onClick={() => setSub(sub === s ? null : s)}>{i}</button>)}
        <button className="bt bs hud-veilcourt-btn" style={{ background: "linear-gradient(160deg,#1a2860,#0e1a38)", color: "#f5e8b8", border: "1px solid rgba(212,173,64,0.55)", position: "relative" }} onClick={openVeilcourt} title="The Veilcourt — global chat">💬{chatUnread > 0 && <span className="hud-veilcourt-badge">{chatUnread > 99 ? "99+" : chatUnread}</span>}</button>
        <button className="bt bs" style={{ background: "linear-gradient(160deg,#1a2860,#0e1a38)", color: "#f5e8b8", border: "1px solid rgba(212,173,64,0.55)" }} onClick={toggleMusicMute} title={musicMuted ? "Unmute music" : "Mute music"}>{musicMuted ? "🔇" : "🎵"}</button>
      </div>}
    </div>
  ) : null;

  // ═══════════════ SCREENS ═══════════════

  // TITLE
  if (scr === "title") return (
    <div className="pg title-bg title-bg-art" style={{ backgroundImage: "linear-gradient(180deg, rgba(4,6,14,0.55) 0%, rgba(4,6,14,0.35) 30%, rgba(4,6,14,0.78) 78%, rgba(4,6,14,0.96) 100%), url(" + (import.meta.env.BASE_URL || "/") + "title-veil.png)" }}><div className="title-embers"><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="wr intro-shell">{notiEl}
      <div className="title-hero title-hero-anim" style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        <div className="title-eyebrow">Chronicles of the Rift</div>
        <h1 className="title-h1" style={{ fontFamily: "'Cinzel',serif", color: T.gd, marginBottom: 4 }}>Shattered<br/>Veil</h1>
        <div className="title-divider" />
        <p className="title-tagline">The sky tore open a hundred years ago. The dead walked out of it. <span style={{ color: T.gd, fontStyle: "normal" }}>You inherited what bled through.</span></p>
        <div className="title-pillars">
          {[
            { id: "classes",   ic: "⚔", sg: "❖", nm: "16 Sorcerer Classes",   ds: "Phoenix monks, mirror-puppet duelists, void-bound runeweavers" },
            { id: "bloodmark", ic: "✦", sg: "❈", nm: "8 Bloodmarks",            ds: "Innate techniques carved into your bloodline" },
            { id: "domain",    ic: "🌀", sg: "❂", nm: "Unfolded Territories",   ds: "Walk into a domain. Survive its rules" },
            { id: "covenant",  ic: "🏛", sg: "✜", nm: "5 Rival Covenants",      ds: "Pledge a faction. Inherit its enemies" },
            { id: "continent", ic: "🗺", sg: "✦", nm: "Continent of the Veil",  ds: "300² tiles of ruined towns, drifting rifts, roaming bosses" },
            { id: "heir",      ic: "👑", sg: "♛", nm: "Bloodline Succession",   ds: "Die. Pass the mark to an heir. Begin stronger" },
          ].map((p, i) => <div key={p.id} className="title-pillar" data-pillar={p.id} style={{ animationDelay: (0.18 + i * 0.07) + "s" }}>
            <span className="title-pillar-sigil" aria-hidden>{p.sg}</span>
            <span className="title-pillar-sheen" aria-hidden />
            <span className="title-pillar-corner tl" aria-hidden /><span className="title-pillar-corner tr" aria-hidden />
            <span className="title-pillar-corner bl" aria-hidden /><span className="title-pillar-corner br" aria-hidden />
            <div className="title-pillar-head">
              <span className="title-pillar-ic-frame"><span className="title-pillar-ic-ring" aria-hidden /><span className="title-pillar-ic">{p.ic}</span></span>
              <div className="title-pillar-nm">{p.nm}</div>
            </div>
            <div className="title-pillar-ds">{p.ds}</div>
          </div>)}
        </div>
        <div className="title-button-stack" style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360, margin: "26px auto 0" }}>
          <button className="bt title-cta" onClick={() => { setMode("single"); setScr("create"); setCStep(0); }}>⚔ Enter the Rift</button>
        </div>
      </div>
    </div></div>
  );

  // CHARACTER CREATION
  if (scr === "create") return (
    <div className="pg create-bg create-bg-art" style={{ backgroundImage: "linear-gradient(180deg, rgba(4,6,14,0.62) 0%, rgba(4,6,14,0.48) 35%, rgba(4,6,14,0.82) 80%, rgba(4,6,14,0.95) 100%), url(" + (import.meta.env.BASE_URL || "/") + "forge-hall.png)" }}>
      <div className="create-embers" aria-hidden><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>
      <div className="wr intro-shell create-anim">{notiEl}
      <div className="create-header" style={{ textAlign: "center", marginBottom: 14 }}>
        <div className="create-title" style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: T.gd }}>Forge Your Hero</div>
        <div style={{ fontSize: 11, color: "#d1dcfb", maxWidth: 520, margin: "6px auto 0" }}>Choose a class, claim your bloodmark, then step into the fractured world as a new bearer of the Veil.</div>
        <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 8 }}>
          {["Class","Bloodmark","Identity"].map((lbl, i) => <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: 44, height: 3, borderRadius: 3, background: i <= cStep ? T.gd : T.bd }} />
            <div style={{ fontSize: 7, color: i <= cStep ? T.gd : T.bd }}>{lbl}</div>
          </div>)}
        </div>
      </div>

      {/* STEP 0: CLASS */}
      {cStep === 0 && <div>
        <div className="create-class-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, maxHeight: "62vh", overflowY: "auto" }}>
          {CLS.map(c => <div key={c.id} className="cd class-pick-card" onClick={() => setSelCls(c.id)} style={{ padding: 6, cursor: "pointer", border: selCls === c.id ? "2px solid " + c.cl : "1px solid rgba(212,173,64,0.18)", background: selCls === c.id ? "linear-gradient(155deg, " + c.cl + "26 0%, rgba(6,12,28,0.92) 100%)" : "linear-gradient(155deg, rgba(10,18,44,0.92) 0%, rgba(6,12,28,0.90) 100%)", color: "#e8eeff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <CrossfadePortrait cid={c.id} sex={previewSex} alt={c.nm} wrapStyle={{ width: 40, height: 40, borderRadius: 6, border: "1.5px solid " + c.cl + "88", flexShrink: 0, boxShadow: "0 0 10px " + c.cl + "33, inset 0 1px 0 rgba(255,255,255,0.1)" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.cl, fontFamily: "'Cinzel',serif", lineHeight: 1.1 }}>{c.nm}</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 2 }}>{!c.multiEl && <span className="tg" style={{ background: (ELC[c.el]||"#666") + "33", color: ELC[c.el]||"#bbb", fontSize: 7 }}>{c.el}</span>}{c.el2 && <span className="tg" style={{ background: (ELC[c.el2]||"#666") + "33", color: ELC[c.el2]||"#bbb", fontSize: 7 }}>{c.el2}</span>}{c.multiEl && <span className="tg" style={{ background: "#ff6f0033", color: "#ffb074", fontSize: 7 }}>4 Random</span>}</div>
              </div>
            </div>
            <div style={{ fontSize: 7, color: "#bcc6e6", lineHeight: 1.25, marginBottom: 2 }}>{c.ds}</div>
            <div style={{ fontSize: 7, color: "#9aa6c8" }}>⚔<span style={{ color: T.gd }}>{"★".repeat(c.stR)}</span><span style={{ color: "#3a4263" }}>{"☆".repeat(5-c.stR)}</span> 🔮<span style={{ color: "#4dd0e1" }}>{"★".repeat(c.skR)}</span><span style={{ color: "#3a4263" }}>{"☆".repeat(5-c.skR)}</span></div>
          </div>)}
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}><button className="bt" style={{ background: T.gd, opacity: selCls ? 1 : 0.4 }} disabled={!selCls} onClick={() => setCStep(1)}>Next: Bloodmark →</button></div>
      </div>}

      {/* STEP 1: BLOODMARK */}
      {cStep === 1 && (() => {
        const pickedClass = CLS.find(c => c.id === selCls);
        const classBMs = buildClassBloodmarks(pickedClass);
        // Stable random sample of 4 shared bloodmarks per class+step entry
        const seed = (selCls || "").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
        const sharedShuffled = BLOODMARKS.slice().sort((a, b) => {
          const ah = ((a.id.charCodeAt(0) * 9301 + seed * 49297) % 233280) / 233280;
          const bh = ((b.id.charCodeAt(0) * 9301 + seed * 49297) % 233280) / 233280;
          return ah - bh;
        });
        const sharedSample = sharedShuffled.slice(0, 4);
        const renderCard = (bm, isInnate) => <div key={bm.id} className={"cd bm-card" + (isInnate ? " bm-innate" : "")} data-cl={bm.cl} onClick={() => setSelBloodmark(selBloodmark === bm.id ? null : bm.id)} style={{ padding: 8, cursor: "pointer", border: selBloodmark === bm.id ? "2px solid " + bm.cl : "1px solid " + (isInnate ? "rgba(255,210,120,0.45)" : "rgba(212,173,64,0.18)"), background: selBloodmark === bm.id ? "linear-gradient(155deg, " + bm.cl + "26 0%, rgba(6,12,28,0.92) 100%)" : "linear-gradient(155deg, rgba(10,18,44,0.88) 0%, rgba(6,12,28,0.92) 100%)", color: "#e8eeff", position: "relative" }}>
          {isInnate && <span className="bm-innate-badge">★ INNATE</span>}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span className="bm-ic-frame" style={{ "--bm-cl": bm.cl, background: "radial-gradient(circle at 35% 30%, " + bm.cl + "55 0%, " + bm.cl + "22 60%, rgba(6,12,28,0.85) 100%)", border: "1.5px solid " + bm.cl + "88", boxShadow: "0 0 12px " + bm.cl + "44, inset 0 1px 0 rgba(255,255,255,0.18)", filter: "drop-shadow(0 0 4px " + bm.cl + "66)" }}>
              {!isInnate && <img src={BM_ICON_PATH(bm.id)} alt="" className="bm-ic-img" onError={(e) => { try { e.currentTarget.style.display = "none"; } catch(_){} }} />}
              <span className="bm-ic-glyph">{bm.ic}</span>
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, color: bm.cl, lineHeight: 1.15 }}>{bm.nm}</div>
              <div style={{ fontSize: 8, color: "#bcc6e6", marginTop: 2 }}>
                {Object.entries(bm.stat).map(([k,v]) => <span key={k} style={{ marginRight: 4, color: v > 0 ? "#7be88f" : "#ff8a80" }}>{v > 0 ? "+" : ""}{v} {k.toUpperCase()}</span>)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 8, color: "#cfd6ee", lineHeight: 1.3, marginBottom: 4 }}>{bm.ds}</div>
          <div style={{ fontSize: 8, padding: "3px 6px", background: bm.cl + "26", border: "1px solid " + bm.cl + "66", borderRadius: 4, color: bm.cl, lineHeight: 1.3 }}>⚡ {bm.passiveDesc}</div>
        </div>;
        return <div className="bm-step" style={{ position: "relative" }}>
          <div className="bm-step-bg" aria-hidden><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>
          <div style={{ textAlign: "center", marginBottom: 10, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 11, color: "#cfe0ff" }}>Your Bloodmark is the lineage trait passed through your ancestors. It shapes your passive abilities and starting statistics.</div>
            <div style={{ fontSize: 9, color: T.dm, marginTop: 3 }}>You may skip this step — an unmarked hero is still a valid choice.</div>
          </div>
          <div style={{ position: "relative", zIndex: 1, maxHeight: "56vh", overflowY: "auto", paddingRight: 4 }}>
            {pickedClass && <div className="bm-section">
              <div className="bm-section-head"><span className="bm-section-pip" style={{ background: pickedClass.cl }} /><span className="bm-section-title" style={{ color: pickedClass.cl }}>★ Innate to {pickedClass.nm}</span><span className="bm-section-sub">— sealed in your bloodline alone</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {classBMs.map(bm => renderCard(bm, true))}
              </div>
            </div>}
            <div className="bm-section">
              <div className="bm-section-head"><span className="bm-section-pip" style={{ background: "#d4ad40" }} /><span className="bm-section-title" style={{ color: "#f5d57a" }}>Ancestral Lineage</span><span className="bm-section-sub">— shared across the old houses</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {sharedSample.map(bm => renderCard(bm, false))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10, position: "relative", zIndex: 1 }}>
            <button className="bt" style={{ background: T.c2 }} onClick={() => setCStep(0)}>← Back</button>
            <button className="bt" style={{ background: T.gd }} onClick={() => setCStep(2)}>Next: Identity →</button>
          </div>
        </div>;
      })()}

      {/* STEP 2: IDENTITY */}
      {cStep === 2 && (() => {
        const pickedClass = CLS.find(c => c.id === selCls);
        const bm = selBloodmark ? getBM(selBloodmark) : null;
        return <div className="cd identity-step" style={{ maxWidth: 640, margin: "0 auto", padding: 12 }}>
          <div className="identity-grid">
            {/* LEFT — portrait, class title, bloodmark, Unique Class Interactions */}
            <div className="identity-left">
              {selCls && <CrossfadePortrait cid={selCls} sex={cSex} alt={pickedClass?.nm} wrapStyle={{ width: 108, height: 108, borderRadius: 10, border: "2px solid " + (pickedClass?.cl || T.gd) + "88", boxShadow: "0 6px 18px rgba(0,0,0,0.5)", display: "block", margin: "0 auto" }} />}
              <div style={{ fontFamily: "'Cinzel',serif", color: pickedClass?.cl, fontSize: 14, fontWeight: 700, marginTop: 6, textAlign: "center", lineHeight: 1.15 }}>{pickedClass?.ic} {pickedClass?.nm}</div>
              {bm && <div style={{ marginTop: 3, fontSize: 9, color: bm.cl, textAlign: "center" }}>{bm.ic} {bm.nm}</div>}
              {pickedClass && <div className="identity-inter-card" style={{ marginTop: 10, padding: "8px 9px", borderRadius: 7, background: "linear-gradient(155deg, rgba(14,22,46,0.95) 0%, rgba(6,12,28,0.95) 100%)", border: "1px solid " + pickedClass.cl + "55", boxShadow: "0 0 14px " + pickedClass.cl + "1f, inset 0 1px 0 rgba(255,235,180,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: pickedClass.cl, boxShadow: "0 0 6px " + pickedClass.cl }} />
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 800, color: pickedClass.cl, letterSpacing: "0.06em" }}>UNIQUE CLASS INTERACTIONS</div>
                </div>
                <div style={{ fontSize: 8, color: "#bcc6e6", lineHeight: 1.45, fontStyle: "italic" }}>Two interactions are rolled randomly each run from this class's signature pool. They complement the {pickedClass.nm}'s playstyle — different runs, different combos.</div>
              </div>}
            </div>
            {/* RIGHT — form fields */}
            <div className="identity-right">
              <label style={{ fontSize: 10, color: "#cfd6ee", display: "block", marginBottom: 2 }}>Hero Name <span style={{ color: "#ff8a80" }}>*</span></label>
              <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Enter name..." maxLength={16} style={{ width: "100%", background: "rgba(6,12,28,0.85)", border: "1px solid " + (cName.trim() ? "rgba(123,232,143,0.55)" : "rgba(212,173,64,0.45)"), borderRadius: 7, padding: "7px 10px", color: "#fff7e0", fontSize: 12, fontFamily: "inherit", outline: "none", textAlign: "center", marginBottom: 8, boxSizing: "border-box" }} />
              <label style={{ fontSize: 10, color: "#cfd6ee", display: "block", marginBottom: 2 }}>Personal Quote <span style={{ color: "#ff8a80" }}>*</span></label>
              <input value={quote} onChange={e => setQuote(e.target.value)} placeholder="Speak your motto..." maxLength={60} style={{ width: "100%", background: "rgba(6,12,28,0.85)", border: "1px solid " + (quote.trim() ? "rgba(123,232,143,0.55)" : "rgba(212,173,64,0.45)"), borderRadius: 7, padding: "7px 10px", color: "#fff7e0", fontSize: 11, fontFamily: "inherit", outline: "none", textAlign: "center", fontStyle: "italic", marginBottom: 4, boxSizing: "border-box" }} />
              <div style={{ marginBottom: 8, fontSize: 8, color: "#ffb074", textAlign: "center", fontStyle: "italic", lineHeight: 1.35 }}>A sorcerer is shaped by what they would die saying. Choose your words.</div>
              <label style={{ fontSize: 10, color: "#cfd6ee", display: "block", marginBottom: 2 }}>Custom Portrait <span style={{ fontSize: 8, color: "#9fb0d8", fontWeight: 400 }}>(optional URL)</span></label>
              <div style={{ display: "flex", gap: 5, alignItems: "stretch", marginBottom: 4 }}>
                <div style={{ position: "relative", width: 42, height: 42, borderRadius: 7, background: "rgba(6,12,28,0.85)", border: "1px solid " + (cPortrait.trim() ? (isValidPortraitURL(cPortrait) ? "rgba(123,232,143,0.55)" : "rgba(255,138,128,0.55)") : "rgba(212,173,64,0.35)"), overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selCls ? <CrossfadePortrait cid={selCls} sex={cSex} wrapStyle={{ position: "absolute", inset: 0, opacity: 0.55 }} /> : <span style={{ fontSize: 16 }}>👤</span>}
                  {portraitOverlay(cPortrait)}
                </div>
                <input value={cPortrait} onChange={e => setCPortrait(e.target.value)} placeholder="https://..." maxLength={800} style={{ flex: 1, background: "rgba(6,12,28,0.85)", border: "1px solid rgba(212,173,64,0.35)", borderRadius: 7, padding: "6px 9px", color: "#fff7e0", fontSize: 10, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              {cPortrait.trim() && !isValidPortraitURL(cPortrait) && <div style={{ fontSize: 8, color: "#ff8a80", marginBottom: 6, textAlign: "center", fontStyle: "italic" }}>Use http(s):// or data: image URL.</div>}
              <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 8 }}>
                <button className="bt bs" style={{ background: cSex === "male" ? T.ac : "rgba(14,22,46,0.85)", color: cSex === "male" ? "#fff" : "#cfd6ee", border: "1px solid rgba(212,173,64,0.35)", padding: "5px 14px", fontSize: 11 }} onClick={() => setCSex("male")}>Male</button>
                <button className="bt bs" style={{ background: cSex === "female" ? T.ac : "rgba(14,22,46,0.85)", color: cSex === "female" ? "#fff" : "#cfd6ee", border: "1px solid rgba(212,173,64,0.35)", padding: "5px 14px", fontSize: 11 }} onClick={() => setCSex("female")}>Female</button>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <button className="bt" style={{ background: "rgba(14,22,46,0.85)", color: "#cfd6ee", border: "1px solid rgba(212,173,64,0.35)", padding: "6px 12px" }} onClick={() => setCStep(1)}>←</button>
                <button className="bt" style={{ background: T.gd, color: "#1a1206", opacity: (cName.trim() && quote.trim()) ? 1 : 0.4, padding: "6px 16px" }} disabled={!cName.trim() || !quote.trim()} onClick={() => createChar()}>Begin ⚔️</button>
              </div>
            </div>
          </div>
        </div>;
      })()}
    </div></div>
  );

  // SUB-SCREENS
  if (sub) return (
    <div className="pg shell-bg"><div className="wr shell-viewport">{notiEl}{tipEl}{popupEl}{chatEl}{hud}<div className="cd page-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: T.gd }}>{sub === "items" ? "🎒 Equipment" : sub === "spells" ? "📖 Veil Archive" : sub === "stats" ? "📊 Stats" : sub === "story" ? "📜 Story" : sub === "manual" ? "📘 Game Manual" : "☰ Menu"}</div><button className="bt bs" style={{ background: T.c2 }} onClick={() => setSub(null)}>←</button></div>
      {sub === "skills" && <div className="sb-panel"><div className="sb-title">Veil Archive</div><div className="sb-kv sb-muted">Veil Magic management has been folded into Veil Archive. Use that page for active Veil Magic, passive selection, and Veil Expansion management.</div><button className="bt bs" style={{ background: T.gd, marginTop: 6 }} onClick={() => setSub("spells")}>Open Veil Archive</button></div>}
{sub === "items" && (() => {
        try {
          const slotDefs = [
            { id:"w1", label:"W1", kind:"weapon" },
            { id:"w2", label:"W2", kind:"weapon" },
            { id:"helm", label:"Helm", kind:"armor" },
            { id:"body", label:"Body", kind:"armor" },
            { id:"glv", label:"Gloves", kind:"armor" },
            { id:"boot", label:"Boots", kind:"armor" },
          ];
          const liveEq = eq || {};
          const liveInv = (Array.isArray(inv) ? inv : []).filter(Boolean);
          const detailFor = (it) => {
            try {
              return it ? (((it.atk !== undefined) || it.isShield || it.slot) ? weaponEffectDetail(it) : itemEffectDetail(it)) : "No detail.";
            } catch (err) {
              return (it && (it.ds || it.fxD || it.name || it.nm)) ? String(it.ds || it.fxD || it.name || it.nm) : "No detail.";
            }
          };
          const labelFor = (it) => {
            if (!it) return "Unknown";
            const nm = it.name || it.nm || "Unnamed";
            const suffix = it.el ? (" [" + it.el + "]") : (it.slot ? (" [" + it.slot + "]") : "");
            return nm + suffix;
          };
          return <div className="equipment-page-wrap" style={{ maxHeight: "72vh", overflowY: "auto", paddingRight: 2, display: "grid", gap: 8 }}>
            <div className="sb-panel">
              <div className="sb-title">Equipped Gear</div>
              <div className="sb-kv sb-muted" style={{ marginBottom: 6 }}>Weapons, armor, and your battle item slots live here.</div>
              <div className="sb-mini-grid">
                {slotDefs.map(slot => {
                  const item = liveEq[slot.id] || null;
                  const pool = liveInv.filter(i => {
                    if (!i) return false;
                    if (slot.kind === "weapon") {
                      if (i.atk === undefined && !i.isShield) return false;
                      const otherSlot = slot.id === "w1" ? "w2" : "w1";
                      if (liveEq[otherSlot] && liveEq[otherSlot].id === i.id) return false;
                      return true;
                    }
                    return i.slot === slot.id;
                  });
                  const options = item && !pool.find(p => p.id === item.id) ? [item].concat(pool) : pool;
                  return <div key={slot.id} className="sb-line-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: T.gd }}>{slot.label}</div>
                      {item ? <button className="bt bs" style={{ background: T.bad, padding: "4px 8px", fontSize: 8 }} onClick={() => setEq(q => ({ ...q, [slot.id]: null }))}>Clear</button> : null}
                    </div>
                    <select style={{ width: "100%", background: T.c2, color: T.tx, border: "1px solid " + T.bd, borderRadius: 6, fontSize: 10, padding: "6px 8px" }} value={item ? item.id : ""} onChange={e => {
                      const sel = options.find(i => i.id === e.target.value) || null;
                      if (slot.kind === "weapon" && sel) {
                        const otherSlot = slot.id === "w1" ? "w2" : "w1";
                        if (liveEq[otherSlot] && liveEq[otherSlot].id === sel.id) { notify("That item is already equipped in the other hand."); return; }
                      }
                      setEq(q => ({ ...q, [slot.id]: sel }));
                    }}>
                      <option value="">— Empty —</option>
                      {options.map(it => <option key={it.id} value={it.id}>{labelFor(it)}</option>)}
                    </select>
                    <div style={{ marginTop: 6, fontSize: 9, color: T.dm, lineHeight: 1.45 }}>
                      {item ? <>
                        <div style={{ color: T.tx, fontWeight: 700 }}>{labelFor(item)}</div>
                        <div>
                          {item.atk ? <span style={{ color: "#7eb8ff" }}>ATK {item.atk} </span> : null}
                          {item.mag ? <span style={{ color: "#ce93d8" }}>MAG {item.mag} </span> : null}
                          {item.def ? <span style={{ color: "#4dd0e1" }}>DEF {item.def} </span> : null}
                          {item.spd ? <span style={{ color: "#66bb6a" }}>SPD {item.spd} </span> : null}
                          {item.hp ? <span style={{ color: T.hp }}>HP +{item.hp} </span> : null}
                        </div>
                        <div>{detailFor(item)}</div>
                      </> : <span>No item equipped.</span>}
                    </div>
                  </div>;
                })}
              </div>
            </div>

            <div className="sb-panel">
              <div className="sb-title">Battle Consumables</div>
              <div className="sb-mini-grid">
                {["c1","c2"].map(slot => {
                  const item = liveEq[slot] || null;
                  const pool = liveInv.filter(i => i && (i.nm || i.name) && i.atk === undefined && !i.slot && !i.isShield);
                  return <div key={slot} className="sb-line-card">
                    <div style={{ fontSize: 10, fontWeight: 800, color: T.gd, marginBottom: 5 }}>{slot === "c1" ? "Slot 1" : "Slot 2"}</div>
                    <select style={{ width: "100%", background: T.c2, color: T.tx, border: "1px solid " + T.bd, borderRadius: 6, fontSize: 10, padding: "6px 8px" }} value={item ? item.id : ""} onChange={e => {
                      const sel = pool.find(i => i.id === e.target.value) || null;
                      setEq(q => ({ ...q, [slot]: sel }));
                    }}>
                      <option value="">— Empty —</option>
                      {pool.map(it => <option key={it.id} value={it.id}>{(it.nm || it.name) + " ×" + (it.qty || 1)}</option>)}
                    </select>
                    <div style={{ marginTop: 6, fontSize: 9, color: T.dm, lineHeight: 1.45 }}>{item ? detailFor(item) : "No battle item equipped in this slot."}</div>
                  </div>;
                })}
              </div>
            </div>

            <div className="sb-panel">
              <div className="sb-title">Inventory</div>
              {liveInv.length ? liveInv.slice().sort((a,b) => (a.name||a.nm||"").localeCompare(b.name||b.nm||"")).map((it, i) => {
                const canUse = !!it.ef && ["heal","mp","cleanse","repel","repair"].indexOf(it.ef) >= 0;
                return <div key={it.id || i} className="sb-line-card" style={{ marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{it.name || it.nm || "Unnamed Item"} <span style={{ color: T.dm }}>×{it.qty || 1}</span></div>
                    <div style={{ fontSize: 9, color: T.dm, lineHeight: 1.45 }}>{detailFor(it)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button className="bt bs" style={{ background: T.c2, fontSize: 8, padding: "4px 8px" }} onClick={() => setTip((it.name||it.nm||"Item") + "\n" + detailFor(it))}>Info</button>
                    {canUse ? <button className="bt bs" style={{ background: T.ok, fontSize: 8, padding: "4px 8px" }} onClick={() => {
                      const s = effSt(pl);
                      if (it.ef === "heal") setPl(p => ({ ...p, chp: Math.min(s.hp, p.chp + (it.v || 0)) }));
                      else if (it.ef === "mp") setPl(p => ({ ...p, cmp: Math.min(s.mp, p.cmp + (it.v || 0)) }));
                      else if (it.ef === "cleanse") setPl(p => ({ ...p, efx: [] }));
                      else if (it.ef === "repel") setRepelSteps(it.v || 50);
                      else if (it.ef === "repair") {
                        if (liveEq.w1) setEq(e => ({ ...e, w1: { ...e.w1, dur: e.w1.maxDur } }));
                        if (liveEq.w2) setEq(e => ({ ...e, w2: { ...e.w2, dur: e.w2.maxDur } }));
                      }
                      setInv(iv => {
                        const ni = iv.slice();
                        const ii = ni.findIndex(x => x.id === it.id);
                        if (ii >= 0) {
                          if ((ni[ii].qty || 1) > 1) ni[ii] = { ...ni[ii], qty: (ni[ii].qty || 1) - 1 };
                          else ni.splice(ii, 1);
                        }
                        return ni;
                      });
                      notify("Used " + (it.nm || it.name || "item") + "!");
                    }}>Use</button> : null}
                  </div>
                </div>;
              }) : <div className="sb-kv sb-muted">Your inventory is empty.</div>}
            </div>
          </div>;
        } catch (err) {
          return <div className="sb-panel">
            <div className="sb-title">Equipment</div>
            <div className="sb-kv sb-muted">The equipment page hit a rendering issue, so a fallback view is shown instead.</div>
            <div className="sb-kv" style={{ marginTop: 6 }}>Weapons: {eq?.w1 ? (eq.w1.name || eq.w1.nm) : "Empty"} / {eq?.w2 ? (eq.w2.name || eq.w2.nm) : "Empty"}</div>
            <div className="sb-kv">Armor: {[eq?.helm?.name||eq?.helm?.nm, eq?.body?.name||eq?.body?.nm, eq?.glv?.name||eq?.glv?.nm, eq?.boot?.name||eq?.boot?.nm].filter(Boolean).join(" · ") || "None equipped"}</div>
            <div className="sb-kv">Inventory items: {(Array.isArray(inv) ? inv.length : 0)}</div>
          </div>;
        }
      })()}
      {sub === "spells" && <div className="spellbook-shell" style={{ maxHeight: "68vh", overflowY: "auto", paddingRight: 2 }}>
        <div className="sb-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <div>
              <div className="sb-title" style={{ marginBottom: 2 }}>Veil Expansion</div>
              <div style={{ fontSize: 13, fontFamily: "'Cinzel',serif", color: T.gd }}>{pl.ult.name}</div>
            </div>
            <button className="bt bs" style={{ background: spellHelpOpen ? T.gd : T.c2, color: spellHelpOpen ? "#1a1207" : T.tx }} onClick={() => setSpellHelpOpen(v => !v)}>🏷️ Guide</button>
          </div>
          <div className="sb-grid">
            <div className="sb-line-card">
              <div className="sb-title">Expansion Details</div>
              <div className="sb-kv">Power: <span style={{ color: T.tx }}>{pl.ult.pow} + MAG×2</span></div>
              <div className="sb-kv">Element: <span style={{ color: ELC[pl.ult.el] || T.tx }}>{pl.ult.el}</span></div>
              <div className="sb-kv">Effect: <button type="button" className="bt bs" style={{ background: T.c2, color: T.tx, fontSize: 8, padding: "2px 6px", marginLeft: 4 }} onClick={() => setPopup({ text: pl.ult.fx ? archiveEffectInfoText(pl.ult.fx, pl.ult.fxDur || 0) : "No extra effect." })}>{pl.ult.fx || "None"}{pl.ult.fx ? " · " + (pl.ult.fxDur || 0) + " Turns" : ""}</button></div>
              <div className="sb-kv" style={{ marginTop: 4, color: pl.ult.ready ? T.ok : T.dm, fontWeight: 700 }}>{pl.ult.ready ? "🌟 Ready to unleash in battle" : "Build the chain below in combat to charge it"}{!pl.ult.ready && ` (${Math.min(btl?.chainProg || 0, pl.ult.chain)}/${pl.ult.chain})`}</div>
            </div>
            <div className="sb-line-card">
              <div className="sb-title">Required Chain</div>
              <div className="sb-chain-text">{pl.ult.combo.map(v => ["Veil Magic 1","Veil Magic 2","Veil Magic 3","Veil Magic 4","On Hand Item 1","On Hand Item 2","Battle Item 1","Battle Item 2","Guard","Copied Skill"][v] || "?").join(" → ")}</div>
            </div>
          </div>
          {spellHelpOpen && <div className="sb-line-card" style={{ marginTop: 8 }}>
            <div className="sb-title">Tag Guide</div>
            {TAG_INFO.map(tag => <div key={tag.id} className="sb-kv" style={{ marginBottom: 3 }}><span style={{ color: T.gd, fontWeight: 700 }}>{tag.nm}:</span> <span className="sb-muted">{tag.ds}</span></div>)}
          </div>}
        </div>

        <div className="sb-panel">
          <div className="sb-title">Veil Expansion Archive</div>
          <div className="sb-kv sb-muted">Only one Veil Expansion can be active at a time, but every unlocked family option is listed here, including the one currently equipped.</div>
          <div className="sb-mini-grid">{(ults.length ? ults : [pl.ult]).map((u, i) => <div key={i} className="sb-line-card" style={{ background: pl.ult.name === u.name ? T.gd + "14" : undefined, border: "1px solid " + ((ELC[u.el] || T.gd) + "44") }}><div style={{ color: ELC[u.el] || T.gd, fontWeight: 700, fontSize: 10, marginBottom: 3 }}>{u.name}</div><div className="sb-chip-row" style={{ marginBottom: 4 }}><button type="button" className="bt bs" style={{ background: (ELC[u.el] || T.gd) + "22", color: ELC[u.el] || T.gd, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: `${u.el}\n\n${compactMatchupText([u.el], 3, false)}` })}>{u.el}</button><button type="button" className="bt bs" style={{ background: T.c2, color: T.tx, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveTagInfoText("chain") })}>Ult Chain</button>{u.fx ? <button type="button" className="bt bs" style={{ background: T.c2, color: T.tx, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveEffectInfoText(u.fx, u.fxDur || 0) })}>{FX(u.fx)?.ic || "✦"} {FX(u.fx)?.nm || u.fx}</button> : null}</div><div className="sb-kv">Power {u.pow} · <span style={{ color: ELC[u.el] || T.tx, fontWeight: 700 }}>{u.el}</span> · {u.fx || "No extra effect"}{u.fx ? " · " + (u.fxDur || 0) + " Turns" : ""}</div><div className="sb-kv">Chain: {u.chain}</div><button className="bt bs" style={{ background: pl.ult.name === u.name ? T.ok : T.c2, marginTop: 5 }} onClick={() => setPl(p => ({ ...p, ult: { ...u, ready: false } }))}>{pl.ult.name === u.name ? "Active" : "Set"}</button></div>)}</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Class Skill Interactions</div>
          <div className="sb-kv sb-muted" style={{ marginBottom: 6 }}>These are the class-specific battle interactions that shape your rhythm and combo identity.</div>
          <div className="sb-mini-grid">{pl.inter.map((x, i) => <button type="button" key={i} className="sb-line-card" style={{ border: "1px solid " + (cls?.cl || T.ac) + "44", background: "linear-gradient(180deg, " + ((cls?.cl || T.ac) + "16") + ", rgba(255,255,255,0.02))", textAlign: "left", cursor: "pointer" }} onClick={() => setPopup({ text: interactionPopupText(x) })}><div style={{ color: cls?.cl || T.ac, fontWeight: 800, fontSize: 10, marginBottom: 4 }}>{x.nm || interactionDisplayName(x.k, x.ds)}</div><div className="sb-chip-row" style={{ marginBottom: 4 }}><span className="tg" style={{ background: (cls?.cl || T.ac) + "22", color: cls?.cl || T.ac }}>Interaction</span>{detectEffectKeysInText(x.ds).map(effectId => <button type="button" key={effectId} className="bt bs" style={{ background: T.c2, color: T.tx, fontSize: 8, padding: "2px 6px" }} onClick={(ev) => { ev.stopPropagation(); setPopup({ text: archiveEffectInfoText(effectId) }); }}>{FX(effectId)?.ic || "✦"} {FX(effectId)?.nm || effectId}</button>)}</div><div className="sb-kv" style={{ color: T.tx, lineHeight: 1.55 }}><div><span style={{ color: cls?.cl || T.ac, fontWeight: 700 }}>Trigger:</span> {splitInteractionDescription(x.ds).trigger}</div><div style={{ marginTop: 3 }}><span style={{ color: "#ffd77a", fontWeight: 700 }}>Effect:</span> {splitInteractionDescription(x.ds).effect}</div></div></button>)}</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Passives</div>
          <div className="sb-kv sb-muted" style={{ marginBottom: 6 }}>Only one passive can be active at a time. Your current passive is shown first, then other unlocked options, then locked ones.</div>
          {[...pl.passives].sort((a,b) => (Number(b.equipped) - Number(a.equipped)) || (Number(b.unlocked) - Number(a.unlocked)) || a.nm.localeCompare(b.nm)).map(pp => <div key={pp.id} className="sb-line-card" style={{ marginBottom: 5, opacity: pp.unlocked ? 1 : 0.38, background: pp.equipped ? T.gd + "14" : undefined, border: "1px solid " + (pp.equipped ? T.gd + "66" : "#ffffff12") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 10, color: pp.equipped ? T.gd : T.tx }}>{pp.nm}</div>
                <div className="sb-chip-row" style={{ marginTop: 4, marginBottom: 2 }}><button type="button" className="bt bs" style={{ background: T.c2, color: T.tx, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: passivePopupText(pp.nm, pp.ds) })}>Effect</button>{detectEffectKeysInText(pp.ds).map(effectId => <button type="button" key={effectId} className="bt bs" style={{ background: T.c2, color: T.tx, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveEffectInfoText(effectId) })}>{FX(effectId)?.ic || "✦"} {FX(effectId)?.nm || effectId}</button>)}</div>
                <div className="sb-kv sb-muted" style={{ marginTop: 2 }}>{pp.ds}</div>
              </div>
              <button className="bt bs" disabled={!pp.unlocked} style={{ background: !pp.unlocked ? "#333" : (pp.equipped ? T.ok : T.c2), minWidth: 72 }} onClick={() => {
                if (!pp.unlocked) return;
                if (pp.equipped) { notify(pp.nm + " is already active."); return; }
                setPl(p => ({ ...p, passives: p.passives.map(x => ({ ...x, equipped: x.id === pp.id })) }));
                notify(pp.nm + " is now your active passive.");
              }}>{!pp.unlocked ? "Locked" : (pp.equipped ? "Active" : "Set")}</button>
            </div>
          </div>)}
        </div>
        <div className="sb-panel">
          <div className="sb-title">Veil Magic Archive</div>
          <div className="sb-kv sb-muted" style={{ marginBottom: 6 }}>Set up to 4 active Veil Magic techniques here. Strike and Guard remain always active in battle. Active techniques are listed first, then other unlocked options, then locked ones at the bottom.</div>
          <div className="sb-skill-grid">{[...pl.skills].sort((a,b) => (Number(b.equipped) - Number(a.equipped)) || (Number(b.unlocked) - Number(a.unlocked)) || a.n.localeCompare(b.n)).map(sk => {
            const accent = ELC[sk.el] || T.ac;
            const matchup = attackSummaryLines(sk.el, 3);
            const advantageText = matchupListText(matchup.dealMore, "plus");
            return <div key={sk.id} className="sb-skill-card" style={{
              opacity: sk.unlocked ? 1 : 0.42,
              background: sk.equipped
                ? "linear-gradient(180deg, " + (accent + "1e") + ", rgba(255,255,255,0.03))"
                : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              border: "1px solid " + (sk.equipped ? accent + "66" : accent + "30"),
              boxShadow: sk.equipped ? ("0 0 0 1px " + accent + "22 inset") : undefined
            }}>
              <div className="sb-head" style={{ alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="sb-name" style={{ color: sk.equipped ? accent : T.tx }}>{sk.n}</div>
                  <div className="sb-chip-row" style={{ marginTop: 4 }}>
                    <span className="tg" style={{ background: accent + "20", color: accent, border: "1px solid " + accent + "44" }}>{sk.el}</span>
                    {describeTags(sk).map(tagId => { var tag = TAG_INFO.find(function(t){return t.id === tagId;}); return tag ? <button type="button" key={tagId} className="bt bs" style={{ background: T.ac + "22", color: T.ac, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveTagInfoText(tagId) })}>{tag.nm}</button> : null; })}
                    {sk.aoe && <button type="button" className="bt bs" style={{ background: T.gd + "22", color: T.gd, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveTagInfoText("aoe") })}>AoE</button>}
                    {sk.fx && <button type="button" className="bt bs" style={{ background: T.wn + "22", color: T.wn, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveEffectInfoText(sk.fx, sk.fxDur || 0) })}>{FX(sk.fx)?.nm || sk.fx}{sk.fxDur ? " · " + sk.fxDur + " Turns" : ""}</button>}
                    {sk.fx2 && <button type="button" className="bt bs" style={{ background: T.ok + "22", color: T.ok, fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: archiveEffectInfoText(sk.fx2, sk.fx2Dur || 0) })}>{FX(sk.fx2)?.nm || sk.fx2}{sk.fx2Dur ? " · " + sk.fx2Dur + " Turns" : ""}</button>}
                  </div>
                </div>
                <span className="sb-meta" style={{ color: "#ff8a80", lineHeight: 1.45, fontWeight: 700 }}>
                  {sk.t === "damage" ? "Damage " : sk.t === "heal" ? "Healing " : "Power "}{sk.pow}<br/>MP {sk.mp}{sk.lvl ? <><br/>Lv {sk.lvl}</> : null}
                </span>
              </div>
              <div className="sb-kv" style={{ marginTop: 5, color: "#eef3ff" }}>{battleEffectBundleText(sk) || "No secondary effect."}</div>
              <div style={{ marginTop: 6, padding: "6px 7px", borderRadius: 9, background: "rgba(8,12,28,0.36)", border: "1px solid " + accent + "22" }}>
                <div className="sb-kv"><span style={{ color: "#ffd77a", fontWeight: 700 }}>Deals Additional Damage To</span>: <span style={{ color: "#eef3ff" }}>{advantageText}</span></div>
                <div className="sb-kv" style={{ marginTop: 2, color: "#97a7d5" }}>This applies when using this {sk.el}-aligned skill specifically.</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div className="sb-kv sb-muted">{sk.unlocked ? (sk.equipped ? "Ready for battle." : "Unlocked and available.") : "Locked until later progression."}</div>
                <button className="bt bs" disabled={!sk.unlocked} style={{ background: !sk.unlocked ? "#333" : (sk.equipped ? T.ok : T.c2), minWidth: 72 }} onClick={() => {
                  if (!sk.unlocked) return;
                  if (sk.equipped) { notify(sk.n + " is already active."); return; }
                  const activeSkills = pl.skills.filter(s => s.equipped);
                  if (activeSkills.length < 4) {
                    setPl(p => ({ ...p, skills: p.skills.map(s => s.id === sk.id ? { ...s, equipped: true } : s) }));
                    notify(sk.n + " set active.");
                    return;
                  }
                  setPopup({
                    text: "Choose a Veil Magic to replace\n\nYou can keep up to 4 active techniques at once.",
                    choices: activeSkills.map(activeSk => ({
                      label: "Replace " + activeSk.n,
                      action: () => {
                        setPl(p => ({ ...p, skills: p.skills.map(s => s.id === activeSk.id ? { ...s, equipped: false } : (s.id === sk.id ? { ...s, equipped: true } : s)) }));
                        setPopup(null);
                        notify(sk.n + " is now active.");
                      }
                    })).concat([{ label: "Cancel", action: () => setPopup(null) }])
                  });
                }}>{!sk.unlocked ? "Locked" : (sk.equipped ? "Active" : "Set")}</button>
              </div>
            </div>;
          })}</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Status Effects</div>
          <div className="sb-kv sb-muted" style={{ marginBottom: 6 }}>Tap through these when you want a quick reminder of the major status tools in combat.</div>
          <div className="sb-mini-grid">{[...FXS].sort((a,b)=>a.nm.localeCompare(b.nm)).map(f => <div key={f.id} className="sb-line-card"><div style={{ fontWeight: 700, fontSize: 10, color: T.tx }}>{f.ic} {f.nm}</div><div className="sb-kv sb-muted">{STATUS_DESC[f.id] || f.nm}</div></div>)}</div>
        </div>

        <div className="sb-panel">
          <div className="sb-title">Element Chart</div>
          <div className="sb-mini-grid">{[...ELS].sort().map(el => <div key={el} className="sb-line-card"><div style={{ fontWeight: 700, fontSize: 10, color: ELC[el] }}>{el}</div><div className="sb-kv">Advantage: <span style={{ color: T.ok }}>{(EL_STR[el]||[]).join(", ") || "None"}</span></div><div className="sb-kv">Disadvantage: <span style={{ color: T.bad }}>{(EL_RES[el]||[]).join(", ") || "None"}</span></div></div>)}</div>
        </div>
      </div>}
      {sub === "stats" && <div className="stats-page">
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>{Object.entries(st).map(([k, v]) => <div key={k} style={{ background: T.c2, borderRadius: 5, padding: "4px 2px", textAlign: "center", cursor: "pointer" }} onClick={() => setPopup({ text: statInfoText(k) })}><div style={{ fontSize: 8, color: T.dm, textTransform: "uppercase" }}>{k}</div><div style={{ fontSize: 13, fontWeight: 700, color: T.gd }}>{v}</div></div>)}</div>
        <div style={{ fontSize: 9, color: T.dm, marginTop: 5, lineHeight: 1.4 }}>Class: <span style={{ color: cls?.cl }}>{cls?.nm}</span> · Elements: <span style={{ color: ELC[entityBattleElements(pl)[0] || pl.el] }}>{entityBattleElements(pl).join(" / ") || (pl.tempBattleEl || pl.elDisplay || pl.el)}</span> · {pl.sex === "male" ? "Male" : "Female"} · Kills: {kills} · {ageInfo.nm} Day {ageDay}/31 · Mode: {mode}</div>

        {/* APPEARANCE — custom portrait URL (PNG/JPG/GIF) */}
        <div style={{ marginTop: 8, padding: 8, background: T.c2, borderRadius: 7, border: "1px solid " + T.bd }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.gd, fontFamily: "'Cinzel',serif", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>🖼 Appearance</div>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <div style={{ position: "relative", width: 56, height: 56, borderRadius: 8, background: "rgba(6,12,28,0.85)", border: "1px solid " + (pl.portrait && isValidPortraitURL(pl.portrait) ? "rgba(123,232,143,0.55)" : T.bd), overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={classPortraitUrl(pl.cid || cls?.id, pl?.sex)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }} onError={(e) => { try { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = classPortraitUrl(pl.cid || cls?.id, "male"); } } catch(_){} }} />
              {portraitOverlay(pl.portrait)}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <input defaultValue={pl.portrait || ""} placeholder="https://example.com/your-hero.gif" maxLength={800} style={{ width: "100%", background: "rgba(6,12,28,0.85)", border: "1px solid " + T.bd, borderRadius: 6, padding: "6px 8px", color: "#fff7e0", fontSize: 10, fontFamily: "inherit", outline: "none" }} onBlur={(e) => { const v = e.target.value.trim(); if (!v) { setPl(p => ({ ...p, portrait: null })); notify("Portrait reset to class default."); } else if (isValidPortraitURL(v)) { setPl(p => ({ ...p, portrait: v })); notify("Portrait updated."); } else { notify("URL must start with http:// or https:// (or data:image/)."); } }} />
              <div style={{ display: "flex", gap: 4 }}>
                <button className="bt bs" style={{ background: T.bad, fontSize: 9 }} onClick={() => { setPl(p => ({ ...p, portrait: null })); notify("Portrait reset."); }}>Reset to Class Art</button>
                <span style={{ fontSize: 8, color: T.dm, alignSelf: "center", fontStyle: "italic" }}>PNG/JPG/GIF/WebP · animated GIFs work</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 6 }}>
          {/* RANK CARD */}
          {(() => { const rk = getRank(pl.level); const nextLv = getNextRankLevel(pl.level); return <div style={{ padding: 7, background: rk.cl + "14", borderRadius: 7, border: "1px solid " + rk.cl + "44" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 15 }}>{rk.ic}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: rk.cl, fontFamily: "'Cinzel',serif" }}>{rk.nm}</div>
                <div style={{ fontSize: 7, color: T.dm }}>Lv.{pl.level}{nextLv ? " → " + nextLv : " · Max"}</div>
              </div>
            </div>
            <div style={{ fontSize: 8, color: T.dm, lineHeight: 1.3 }}>{rk.ds}</div>
            {Object.keys(rk.bonus || {}).length > 0 && <div style={{ fontSize: 7, color: T.ok, marginTop: 2 }}>+ {Object.entries(rk.bonus).map(([k,v]) => v + " " + k.toUpperCase()).join(" · ")}</div>}
          </div>; })()}

          {/* BLOODMARK CARD */}
          {pl.bloodmark ? (() => { const bm = getBM(pl.bloodmark); return bm ? <div style={{ padding: 7, background: bm.cl + "12", borderRadius: 7, border: "1px solid " + bm.cl + "44" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>{bm.ic}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: bm.cl, fontFamily: "'Cinzel',serif" }}>{bm.nm}</div>
                <div style={{ fontSize: 7, color: T.dm }}>{Object.entries(bm.stat).map(([k,v]) => (v > 0 ? "+" : "") + v + " " + k.toUpperCase()).join(" · ")}</div>
              </div>
            </div>
            <div style={{ fontSize: 8, padding: "3px 5px", background: bm.cl + "18", borderRadius: 4, color: bm.cl, lineHeight: 1.3 }}>⚡ {bm.passiveDesc}</div>
          </div> : null; })() : <div style={{ padding: 7, background: T.c2, borderRadius: 7, border: "1px solid " + T.bd }}>
            <div style={{ fontSize: 9, color: T.dm, fontWeight: 700 }}>✦ No Bloodmark</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 1, lineHeight: 1.3 }}>Choose at character creation. Grants passive abilities and stat bonuses.</div>
          </div>}

          {/* COVENANT CARD */}
          {pl.covenant ? (() => { const cv = getCV(pl.covenant); return cv ? <div style={{ padding: 7, background: cv.cl + "12", borderRadius: 7, border: "1px solid " + cv.cl + "44" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 15 }}>{cv.ic}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: cv.cl, fontFamily: "'Cinzel',serif" }}>{cv.nm}</div>
                <div style={{ fontSize: 7, color: T.dm }}>{cv.el} · {Object.entries(cv.statBonus).map(([k,v]) => "+" + v + " " + k.toUpperCase()).join(" · ")}</div>
              </div>
            </div>
            <div style={{ fontSize: 8, padding: "3px 5px", background: cv.cl + "18", borderRadius: 4, color: cv.cl, lineHeight: 1.3 }}>🎁 {cv.guildBonus}</div>
          </div> : null; })() : <div style={{ padding: 7, background: T.c2, borderRadius: 7, border: "1px solid " + T.bd }}>
            <div style={{ fontSize: 9, color: T.dm, fontWeight: 700 }}>🏛 No Covenant</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 1, lineHeight: 1.3 }}>Visit a town's Covenant Hall to pledge allegiance to one of five orders.</div>
          </div>}

          {/* CLASS LORE + MOTTO COMBINED */}
          <div style={{ padding: 7, background: T.c2, borderRadius: 7, border: "1px solid " + T.bd }}>
            <div style={{ fontSize: 10, color: T.gd, fontWeight: 700, fontFamily: "'Cinzel',serif" }}>📜 {cls?.nm}</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 2, lineHeight: 1.35 }}>{cls?.ds || "No class description available."}</div>
            <div style={{ marginTop: 4, fontSize: 9, fontStyle: "italic", color: T.gd, textAlign: "center", borderTop: "1px solid " + T.bd, paddingTop: 3 }}>"{pl.quote || "..."}"</div>
          </div>

          {/* AGE CURVE */}
          <div style={{ padding: 7, background: T.c2, borderRadius: 7, border: "1px solid " + T.bd }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 5 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10, color: T.gd, fontWeight: 700 }}>{ageInfo.nm} · Day {ageDay}/31</div>
                <div style={{ fontSize: 8, color: T.dm, marginTop: 1, lineHeight: 1.3 }}>{ageInfo.ds}</div>
              </div>
              <button className="bt bs" style={{ background: T.c1, fontSize: 8 }} onClick={() => setPopup({ text: ageCurvePopupText(pl.st) })}>Curve</button>
            </div>
          </div>

          {/* BOND + LEGACY */}
          <div style={{ padding: 7, background: T.c2, borderRadius: 7, border: "1px solid " + T.bd }}>
            <div style={{ fontSize: 10, color: T.gd, fontWeight: 700 }}>💍 Bond &amp; Legacy</div>
            <div style={{ fontSize: 8, color: T.dm, marginTop: 2, lineHeight: 1.35 }}>{spouse ? (spouse.nm + " · " + companionElementLabel(spouse) + " · " + spouse.nature) : "Unbonded. Visit a tavern to shape your line."}</div>
            {pl.legacyTrait && <div style={{ fontSize: 7, color: "#cfe0ff", marginTop: 2 }}><b>{pl.legacyTrait.nm}:</b> {pl.legacyTrait.ds}</div>}
            <div style={{ fontSize: 7, color: "#ffe7a8", marginTop: 2 }}>Boons: {boonListForPlayer(pl).join(" · ") || "—"}</div>
            <button className="bt bs" style={{ background: T.c1, marginTop: 4, fontSize: 8 }} onClick={() => setPopup({ text: inheritedTraitCatalogText() })}>Possible Inheritance</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.gd, marginBottom: 3, borderBottom: "1px solid " + T.bd, paddingBottom: 2 }}>🐾 Pet Companion</div>
            {pet ? <div style={{ padding: 5, background: T.c2, borderRadius: 5 }}><div style={{ fontSize: 10, fontWeight: 700 }}>{pet.ic} {pet.nm} <span style={{ color: ELC[pet.el], fontSize: 8 }}>{pet.el}</span></div><div style={{ fontSize: 8, color: T.dm, marginTop: 2 }}>HP: {pet.chp ?? pet.hp}/{pet.mhp ?? pet.hp} · ATK: {pet.atk} · DEF: {pet.def} · SPD: {pet.spd}</div><div style={{ fontSize: 8, color: T.dm, marginTop: 2 }}>Passive: <span style={{ color: T.tx, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPopup({ text: passivePopupText(pet.passiveName || pet.passive || "Companion Instinct", pet.passiveName || pet.passive ? ("Pet instinct aligned with " + (pet.passiveBonus || "damage") + " support.") : null) })}>{pet.passiveName || pet.passive || "Companion Instinct"}</span></div><div style={{ fontSize: 8, color: T.dm, marginTop: 2, lineHeight: 1.4 }}>1. <span style={{ color: T.tx, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPopup({ text: skillPopupText(pet.sk1) })}>{pet.sk1?.n || "?"}</span></div><div style={{ fontSize: 8, color: T.dm, lineHeight: 1.4 }}>2. <span style={{ color: T.tx, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPopup({ text: skillPopupText(pet.sk2) })}>{pet.sk2?.n || "?"}</span></div><button className="bt bs" style={{ background: T.bad, marginTop: 3, fontSize: 8 }} onClick={() => setPet(null)}>Release</button></div> : <div style={{ fontSize: 8, color: T.dm, padding: 5, background: T.c2, borderRadius: 5 }}>No pet tamed. Visit a 🐾 zone.</div>}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.gd, marginBottom: 3, borderBottom: "1px solid " + T.bd, paddingBottom: 2 }}>🤝 Battle Ally</div>
            {ally ? <div style={{ padding: 5, background: T.c2, borderRadius: 5 }}><div style={{ fontSize: 10, fontWeight: 700 }}>{ally.ic || "🤝"} {ally.nm} <span style={{ fontSize: 8, color: T.dm }}>({ally.cls.nm})</span></div>{pBar(ally.hp, ally.mhp, T.hp)}<div style={{ fontSize: 8, color: T.dm, marginTop: 2 }}>HP: {ally.hp}/{ally.mhp} · <span style={{ color: ELC[ally.el] }}>{[ally.el, ally.el2].filter(Boolean).join(" / ")}</span></div><div style={{ fontSize: 8, color: T.dm, marginTop: 2 }}>Passive: <span style={{ color: T.tx, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPopup({ text: passivePopupText(ally.passiveName || ally.passive || "Shrine Blessing", ally.passiveName || ally.passive ? ("Ally role: " + (ally.role || ally.passiveBonus || "support") + ".") : null) })}>{ally.passiveName || ally.passive || "Shrine Blessing"}</span></div><div style={{ fontSize: 8, color: T.dm, marginTop: 2, lineHeight: 1.4 }}>1. <span style={{ color: T.tx, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPopup({ text: skillPopupText(ally.sk1) })}>{ally.sk1?.n || "?"}</span></div><div style={{ fontSize: 8, color: T.dm, lineHeight: 1.4 }}>2. <span style={{ color: T.tx, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPopup({ text: skillPopupText(ally.sk2) })}>{ally.sk2?.n || "?"}</span></div><button className="bt bs" style={{ background: T.bad, marginTop: 3, fontSize: 8 }} onClick={() => setAlly(null)}>Dismiss</button></div> : <div style={{ fontSize: 8, color: T.dm, padding: 5, background: T.c2, borderRadius: 5 }}>No ally. Commune at shrines to call one.</div>}
          </div>
        </div>
      </div>}
      {sub === "story" && <div style={{ display: "grid", gap: 6 }}>
        {activeStoryQuest && <div className="sb-panel"><div className="sb-title">Active Quest</div><div style={{ fontSize: 12, fontWeight: 800, color: T.tx, marginBottom: 3 }}>{activeStoryQuest.nm}</div><div style={{ fontSize: 9, color: T.dm, lineHeight: 1.5 }}>{activeStoryQuest.ds}</div>{activeStoryQuest.goal ? <div style={{ marginTop: 6, fontSize: 9, color: T.tx }}>Progress: {Math.min(activeStoryQuest.prog || 0, activeStoryQuest.goal)}/{activeStoryQuest.goal}</div> : <div style={{ marginTop: 6, fontSize: 9, color: T.tx }}>Milestone: Reach the next turning point to continue the campaign.</div>}</div>}
        {!!completedStoryQuests.length && <div className="sb-panel"><div className="sb-title">Completed Milestones</div>{completedStoryQuests.map(q => <div key={q.id} style={{ padding: 6, background: T.ok + "15", borderRadius: 6, marginBottom: 3 }}><div style={{ fontSize: 10, fontWeight: 700, color: T.ok }}>✓ {q.nm}</div><div style={{ fontSize: 8.5, color: T.dm, lineHeight: 1.4 }}>{q.ds}</div></div>)}</div>}
        {devPos && <div style={{ padding: 5, background: T.bad + "15", borderRadius: 5, marginTop: 2, fontSize: 10, color: T.bad }}>⚠ Dream Devourer roams near ({devPos.x}, {devPos.y})</div>}
      </div>}
      {sub === "manual" && <div style={{ display: "grid", gap: 6, maxHeight: "58vh", overflowY: "auto", paddingRight: 2 }}>
        <div className="sb-panel">
          <div className="sb-title">The Veil, the Expansions, and the End of Time</div>
          <div className="sb-kv sb-muted">Reality has a membrane. The covenants call it the Veil — a thin layer of will and meaning resting between the world humans walk and the silent, hostile geometry beneath it. Trained sorcerers can briefly unfold their own territory through the Veil and impose its rules on whoever stands inside. Most cannot. The unstable few who can, but who cannot fully close their domain again, become the figures the archives call Fractured. And somewhere beneath all of it, the Dream Devourer is pressing upward, eating memory and time as it climbs.</div>
        </div>
        <div className="sb-grid">
          <div className="sb-panel">
            <div className="sb-title">✦ Bloodmarks</div>
            <div className="sb-kv sb-muted">A Bloodmark is an innate technique inherited through your bloodline. It is not learned and cannot be taught — it is simply present at birth, and shapes how energy moves through you. Each of the eight Bloodmarks grants passive stat bonuses and a unique passive ability: Veil-Veined heroes channel cheaper, Storm-Born heroes act twice, Ashblood heroes ignite their strikes, Void-Touched heroes silence the world around them. Bloodmarks pass to your heirs along the family line, with a rare chance of mutation each generation.</div>
          </div>
          <div className="sb-panel">
            <div className="sb-title">🏛 Covenants</div>
            <div className="sb-kv sb-muted">Five formal schools train, grade, and dispatch veilworkers across the fractured world: The Veilwatch, Iron Crown, Embersong Circle, Silkweb Guild, and Tidecall Conclave. Each grants a permanent stat bonus and shapes which assignments are most rewarded. You pledge at the Covenant Hall in any town. You may renounce and rejoin for a fee. Each generation starts unaffiliated — your heir must walk back into a school on their own.</div>
          </div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">🚶 Sorcerer Grades (Ranks)</div>
          <div className="sb-kv sb-muted">As you gain levels, the covenants formally re-grade you. Seven ranks exist: Wanderer (unranked), Acolyte (grade four), Disciple (grade three), Seeker (grade two), Warden (grade one), Archon (special grade), and finally Fractured — beyond formal grading, where the Veil itself no longer closes cleanly around the sorcerer who unfolded it. Each new grade applies a permanent stat bonus and is announced on level up.</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">What Kind of Game This Is</div>
          <div className="sb-kv sb-muted">Shattered Veil is a fantasy lineage-RPG. You explore a living world, gather equipment and resources, fight with layered tactical choices, age across a short but meaningful lifespan, and eventually pass your legacy to an heir. A single hero matters. A bloodline matters more.</div>
        </div>
        <div className="sb-grid">
          <div className="sb-panel">
            <div className="sb-title">Your Main Goal</div>
            <div className="sb-kv sb-muted">Travel, stabilize towns, conquer dangerous spaces, build a stronger legacy, and gradually prepare humanity for a final confrontation with the force behind the Rifts. The story is still growing, but the core loop already exists: survive, learn, inherit, and return stronger.</div>
          </div>
          <div className="sb-panel">
            <div className="sb-title">How to Read Progress</div>
            <div className="sb-kv sb-muted">Story tracks long-form progress. The Manual explains systems. The Stats page explains what your hero is becoming. The world HUD tells you what you are carrying into danger right now.</div>
          </div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Movement and Exploration</div>
          <div className="sb-kv sb-muted">Use WASD or the arrow keys to travel. The world map is 300×300 and intentionally varied: blended biomes, inland waters, town networks, ruins, beast zones, treasure, shrines, outposts, and rifts. Water supports fishing. Loot drift changes over time. Repel lowers encounter friction when you simply need to cross ground and get on with your journey.</div>
        </div>
        <div className="sb-grid">
          <div className="sb-panel">
            <div className="sb-title">Points of Interest</div>
            <div className="sb-kv sb-muted">• Towns: recovery, shops, guilds, taverns, services.<br/>• Outposts: harder field content with better rewards.<br/>• Rifts: the most dangerous routes, deepest pressure, strongest enemies.<br/>• Ruins: puzzles and lockouts.<br/>• Shrines: blessings, allies, and rare spiritual turning points.<br/>• Beast Zones: opportunities for pets and rare materials.</div>
          </div>
          <div className="sb-panel">
            <div className="sb-title">Travel Pressure</div>
            <div className="sb-kv sb-muted">Random encounters on the world map are deliberately lighter than deeper combat zones. Overworld fights should move quickly. Arena, Outpost, and Rift battles are where longer tactical play matters more.</div>
          </div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Combat at a Glance</div>
          <div className="sb-kv sb-muted">Combat is built around tempo, pressure, and layered utility. Raw damage matters, but so do control effects, guards, heals, item timing, and the exact moment you cash in a Veil Expansion. The system is meant to feel readable enough for any player to understand while still rewarding smarter sequencing.</div>
        </div>
        <div className="sb-grid">
          <div className="sb-panel">
            <div className="sb-title">Battle Options</div>
            <div className="sb-kv sb-muted">• Veil Magic: your primary tactical toolkit.<br/>• Basic Actions: strike, guard, mend, copied skill, and on-hand gear.<br/>• Battle Items: fast support, cleansing, burst utility, control tools.<br/>• Auxiliary Actions: swap and management actions when the moment calls for it.<br/>• Veil Expansion: your signature climax, charged by exact chain inputs.</div>
          </div>
          <div className="sb-panel">
            <div className="sb-title">Why Non-Damage Actions Matter</div>
            <div className="sb-kv sb-muted">Buffs, debuffs, cleanses, reflects, guards, regens, and positional tempo all matter more in long fights. Arena, Outpost, Rift, and boss content are tuned so utility choices remain relevant instead of being drowned by constant one-shots.</div>
          </div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Elements, Matchups, and Multi-Element Logic</div>
          <div className="sb-kv sb-muted">Element advantage is normally +10% damage. Element vulnerability is normally +10% damage taken. Neutral remains 100%. There are no elemental resists in the current battle model. Multi-element characters can still stack multiple offensive and defensive weaknesses. The Element Summary now separates each active element into its own panel so you can tell exactly which element grants which offensive and defensive matchup.</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Veil Magic and Veil Expansions</div>
          <div className="sb-kv sb-muted">Veil Magic defines your class rhythm. Damage, healing, status, control, and setup are all balanced against effect burden. Veil Expansions are stronger, rarer declarations of intent. They are charged by exact chain orders, then released with your Motto spoken as the identity of your line. Inheritance can eventually widen your Veil Expansion choices beyond your class baseline.</div>
        </div>
        <div className="sb-grid">
          <div className="sb-panel">
            <div className="sb-title">Weapons, Shields, Armor, and Items</div>
            <div className="sb-kv sb-muted">Nothing is meant to become useless. Weapons and shields define your on-hand battlefield options. Armor reinforces passive identity and stat support. Consumables exist to solve problems, not just fill inventory space. Outposts and Rifts can roll rarer, stranger mixtures of effects and durations, but common tools should still keep a real niche.</div>
          </div>
          <div className="sb-panel">
            <div className="sb-title">Reading a Battle Like a Veteran</div>
            <div className="sb-kv sb-muted">The strongest players do not simply cast the highest number. They watch element spread, passive triggers, status duration, action economy, and chain setup. A fight becomes elegant when one action prepares the next: Guard into a powered strike, a debuff before an execution spell, a support window before a Veil Expansion, or a defensive turn that survives a boss’s peak pressure.</div>
          </div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Pets and Shrine Allies</div>
          <div className="sb-kv sb-muted">Pets and shrine allies are not decorative extras. Each is meant to have a role. Some pressure enemy tempo. Some stabilize you. Some accelerate control lines. On the battle screen, their passives, elements, and action patterns matter because they change how a fight unfolds rather than merely adding random extra hits.</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Aging, the Stat Curve, and Death</div>
          <div className="sb-kv sb-muted">Your hero does not level in the usual endless way. Instead, life moves. Early days favor vigor. Prime years balance physical power and magical control. Late life leans harder into insight, reserves, and arcane force. At Day 31, the generation ends. If you die sooner, the same hero is dragged back to the nearest refuge. Only the natural end of Day 31 passes the torch to an heir. The Stats page tracks this with your age information and curve preview.</div>
        </div>
        <div className="sb-grid">
          <div className="sb-panel">
            <div className="sb-title">Companions and Bonding</div>
            <div className="sb-kv sb-muted">Tavern companions are one of the most important strategic choices in the game. Each town has its own rolling pool. Only the newest five offers stay visible. You choose once per generation whether you are seeking male or female companions, and that search lock remains for that generation. Bonding matters because your companion directly influences the shape of your next heir.</div>
          </div>
          <div className="sb-panel">
            <div className="sb-title">What Companion Fields Mean</div>
            <div className="sb-kv sb-muted">• Elements: enter the inheritance pool and can bias extra-element outcomes.<br/>• Nature: nudges the type of boon your line is more likely to express.<br/>• Bloodline Leaning: previews the broader family tendency this bond may encourage.<br/>• Growth: shows which stat this companion most naturally pushes if a growth boon is rolled.</div>
          </div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">How an Heir Can Turn Out</div>
          <div className="sb-kv sb-muted">An heir is not built from one fixed rule. The final child can inherit from multiple layers at once: your class foundation, your current lineage trait, your companion’s elements, your companion’s nature, bloodline growth leanings, rare passive boons, inherited Veil Magic, rare inherited Veil Expansion choices, stat edges, and even extra elemental resonance. Some results are common. Some are rare. Some are surprising. That uncertainty is the point.</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">What Always Carries Forward</div>
          <div className="sb-kv sb-muted">Your predecessor’s Veil Expansion becomes part of the family arsenal as an available future choice. Gold and banking can partly carry through a will system. The bloodline itself accumulates shape: its preferences, risks, and special possibilities become more interesting the longer the family survives.</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">Reading the Interface</div>
          <div className="sb-kv sb-muted">Click stats for explanations. Click battle passives for details. Open Element Summary when you want the final offensive and defensive elemental picture. If a passive does not exist, the game tells you plainly. The battle log is intended to read like a dramatic ledger: one action, one consequence, one readable unit of meaning.</div>
        </div>
        <div className="sb-panel">
          <div className="sb-title">The Shape of the Road Ahead</div>
          <div className="sb-kv sb-muted">This world is still tightening its final lore and deeper content, but its central identity is already clear: a somber fantasy about fractured time, tactical survival, and a family line refusing to let history be eaten in the dark. You are not here to make one perfect hero. You are here to build a line that can endure the impossible.</div>
        </div>
      </div>}{sub === "menu" && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map(i => <button key={i} className="bt bs" style={{ background: T.ok, flex: 1 }} onClick={() => saveGame(i)}>Save {i + 1}</button>)}</div>
        <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map(i => <button key={i} className="bt bs" style={{ background: saves[i] ? T.ac : T.c2, flex: 1 }} onClick={() => loadGame(i)}>Load {i + 1}{saves[i] ? " ✓" : ""}</button>)}</div>
        <div style={{ marginTop: 4, padding: 6, background: "linear-gradient(160deg,#1a2860,#0e1a38)", border: "1px solid rgba(212,173,64,0.55)", borderRadius: 6, color: "#f5e8b8", fontSize: 9 }}>
          <div style={{ fontFamily: "Cinzel, serif", fontWeight: 600, fontSize: 10, color: "#ffd54f", marginBottom: 4, letterSpacing: 0.5 }}>♪ Audio</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
            <button className="bt bs" style={{ background: musicMuted ? "#5a1818" : "#1a4a2a", color: "#fff", minWidth: 28 }} onClick={toggleMusicMute} title={musicMuted ? "Unmute music" : "Mute music"}>{musicMuted ? "🔇" : "🎵"}</button>
            <span style={{ minWidth: 38 }}>Music</span>
            <input type="range" min="0" max="100" value={Math.round(musicVol * 100)} onChange={e => onMusicVolChange(parseInt(e.target.value, 10) / 100)} style={{ flex: 1, accentColor: "#d4ad40" }} />
            <span style={{ minWidth: 26, textAlign: "right" }}>{Math.round(musicVol * 100)}%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="bt bs" style={{ background: sfxMuted ? "#5a1818" : "#1a4a2a", color: "#fff", minWidth: 28 }} onClick={toggleSfxMute} title={sfxMuted ? "Unmute SFX" : "Mute SFX"}>{sfxMuted ? "🔇" : "🔊"}</button>
            <span style={{ minWidth: 38 }}>SFX</span>
            <input type="range" min="0" max="100" value={Math.round(sfxVol * 100)} onChange={e => onSfxVolChange(parseInt(e.target.value, 10) / 100)} style={{ flex: 1, accentColor: "#d4ad40" }} />
            <span style={{ minWidth: 26, textAlign: "right" }}>{Math.round(sfxVol * 100)}%</span>
          </div>
        </div>
        <button className="bt" style={{ background: T.wn, width: "100%" }} onClick={() => { setScr("title"); setPl(null); setBtl(null); setSub(null); }}>🏠 Main Menu</button>
      </div>}
    </div></div></div>
  );

  const battleLogGroups = (() => {
    const lines = Array.isArray(log) ? log : [];
    const groups = [];
    let round = 1;
    let current = null;
    const flush = () => { if (current && current.lines.length) groups.push(current); current = null; };
    const isEventLine = (line) => String(line).startsWith("EVENT|") || (!String(line).startsWith("⚔ Battle begins") && !/^(⚔|💥|💚|💧|✦|🔮|🛡|💪|🔴|🟣|⚡|🩸|🏆|💀|👹|⚠️|›)/.test(String(line)));
    const isEnemyLine = (line) => /^(🔴|🟣|⚡|🩸|👹|⚠️)/.test(String(line));
    lines.forEach((line) => {
      const txt = String(line || '');
      if (!txt) return;
      if (txt.startsWith('⚔ Battle begins')) { flush(); groups.push({ type:'event', lines:[txt] }); return; }
      if (isEventLine(txt)) { flush(); groups.push({ type:'event', lines:[txt.replace(/^EVENT\|/, '')] }); return; }
      const side = isEnemyLine(txt) ? 'enemy' : 'player';
      if (!current || current.type !== side) {
        flush();
        if (side === 'player') current = { type:'player', round: round++, lines:[txt] };
        else current = { type:'enemy', round: Math.max(1, round-1), lines:[txt] };
      } else current.lines.push(txt);
    });
    flush();
    return groups.slice().reverse();
  })();

  // MAP
  if (scr === "map" && mData) {
    const VW = 21, VH = 11, hfX = 10, hfY = 5, tile = mData[pos.y * MW + pos.x];
    const canN = pos.y > 0, canS = pos.y < MH-1, canW = pos.x > 0, canE = pos.x < MW-1;
    const trailDir = prevPos ? (prevPos.x < pos.x ? "→" : prevPos.x > pos.x ? "←" : prevPos.y < pos.y ? "↓" : "↑") : null;
    const nearOcean = [{x:pos.x-1,y:pos.y},{x:pos.x+1,y:pos.y},{x:pos.x,y:pos.y-1},{x:pos.x,y:pos.y+1}].some(function(p){ if(p.x<0||p.x>=MW||p.y<0||p.y>=MH) return false; return mData[p.y*MW+p.x] && mData[p.y*MW+p.x].bio === "ocean"; });
    const roamingBossIcon = "💀";
    const compassDir = function(dx, dy) {
      if (dx === 0 && dy === 0) return "Here";
      if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? "N" : "S";
      return dx < 0 ? "W" : "E";
    };
    const nearestTownCompass = (function () {
      var best = null, bd = 99999;
      if (!mData) return "";
      mData.forEach(function (t) {
        if (t.poi && t.poi.type === "town") {
          var d = Math.abs(t.x - pos.x) + Math.abs(t.y - pos.y);
          if (d < bd && d > 0) { bd = d; best = t; }
        }
      });
      if (!best) return "";
      return best.poi.nm + " " + compassDir(best.x - pos.x, best.y - pos.y) + " " + bd;
    })();
    const nearestPoiCompass = (function () {
      var best = null, bd = 99999;
      if (devPos && !(devPos.x === pos.x && devPos.y === pos.y)) {
        var dd = Math.abs(devPos.x - pos.x) + Math.abs(devPos.y - pos.y);
        if (dd < bd) { bd = dd; best = { nm: "Roaming Boss", x: devPos.x, y: devPos.y, ic: roamingBossIcon }; }
      }
      if (mData) {
        mData.forEach(function (t) {
          if (t.poi && t.poi.type !== "town") {
            var d = Math.abs(t.x - pos.x) + Math.abs(t.y - pos.y);
            if (d < bd && d > 0) { bd = d; best = { nm: t.poi.nm || t.poi.type, x: t.x, y: t.y, ic: t.poi.ic || "⌖" }; }
          }
        });
      }
      if (!best) return "";
      return (best.ic ? best.ic + " " : "") + best.nm + " " + compassDir(best.x - pos.x, best.y - pos.y) + " " + bd;
    })();

    return (
      <div className={"pg map-bg sky-phase-" + skyPhase.key}>
        <div className="map-sky-img" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}sky/h${String(skyHour).padStart(2,"0")}.png')` }} />
        <div className="map-sky-veil" />
        <div className="wr shell-viewport" style={{position:"relative",zIndex:1}}>{notiEl}{tipEl}{popupEl}{chatEl}{hud}
        <div className="cd page-panel" style={{ padding: 10 }}>
          <div className="map-top-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="map-heading" style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: T.gd }}>World</div><div className="sky-phase-badge" title={"Local time " + skyClock + " — sky reflects your real time of day"}><span className="sky-phase-icon">{skyPhase.icon}</span><span className="sky-phase-text"><span className="sky-phase-label">{skyPhase.label}</span><span className="sky-phase-meta">{skyClock} · {skyPhase.short}</span></span></div></div><div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}><div className="map-coords">🧭 {nearestTownCompass} · <span>({pos.x},{pos.y})</span></div><div className="map-coords" style={{ fontSize: 8, opacity: 0.95 }}>⌖ {nearestPoiCompass || "No active POIs"}</div></div></div>
          <aside className="map-side-rail">
            {(() => { const onOcean = tile && tile.bio === "ocean"; const canFish = nearOcean || onOcean; const fishingCD = fishCD > timerNow; const hasPoi = tile && tile.poi; const isMoving = !!autoMoveTarget; const actLabel = isMoving ? "Stop" : hasPoi ? "Enter" : (canFish ? (fishingCD ? (Math.ceil((fishCD - timerNow)/1000) + "s") : "Fish") : "Idle"); const actCls = "rail-action-btn " + (isMoving ? "is-moving" : hasPoi ? "is-poi" : canFish ? "is-fish" : "is-idle"); return (
              <button className={actCls} type="button" title={isMoving ? "Stop auto-walk" : hasPoi ? "Enter (Space)" : (canFish ? (fishingCD ? "Fishing on cooldown" : "Cast a line") : "Click any tile to walk · WASD to step · Space to enter")} onClick={() => { if (isMoving) { setAutoMoveTarget(null); return; } if (hasPoi) { enterPoi(); return; } if (canFish && !fishingCD) { runFishing(); } }}>
                <span className="rail-action-label">{actLabel}</span>
              </button>
            ); })()}
            <div className="map-rail-quick">
              <button className="bt bs map-rail-quick-btn" style={{ background: T.ok }} title="Use HP potion" onClick={() => { var hp = inv.find(function (i) { return i.ef === "heal"; }); if (hp) { var s = effSt(pl); setPl(function (p) { return Object.assign({}, p, { chp: Math.min(s.hp, p.chp + hp.v) }); }); setInv(function (iv) { var ni = iv.slice(); var ii = ni.findIndex(function (x) { return x.id === hp.id; }); if (ii >= 0) { if (ni[ii].qty > 1) ni[ii] = Object.assign({}, ni[ii], { qty: ni[ii].qty - 1 }); else ni.splice(ii, 1); } return ni; }); notify("Healed!"); } else notify("No potions!"); }}>🧪</button>
              <button className="bt bs map-rail-quick-btn" style={{ background: T.mp }} title="Use MP item" onClick={() => { var mp = inv.find(function(i){return i.ef === "mp";}); if (mp) { var s = effSt(pl); setPl(function(p){return Object.assign({},p,{cmp:Math.min(s.mp,p.cmp+mp.v)});}); setInv(function(iv){var ni=iv.slice();var ii=ni.findIndex(function(x){return x.id===mp.id;});if(ii>=0){if(ni[ii].qty>1)ni[ii]=Object.assign({},ni[ii],{qty:ni[ii].qty-1});else ni.splice(ii,1);}return ni;}); notify("MP restored!"); } else notify("No mana items!"); }}>💧</button>
              <button className="bt bs map-rail-quick-btn" style={{ background: musicOn ? T.ac : T.c2 }} title={musicOn ? "Mute music" : "Unmute music"} onClick={() => setMusicOn(m => !m)}>{musicOn ? "🔊" : "🔇"}</button>
            </div>
            <div className="map-rail-tile">
              {tile && tile.poi ? (
                <><div className="map-rail-tile-name">{tile.poi.ic} {tile.poi.nm || tile.poi.type}</div><div className="map-rail-tile-type">{tile.poi.type}</div></>
              ) : (
                <><div className="map-rail-tile-name map-rail-tile-name-bio">{tile ? tile.bio.charAt(0).toUpperCase() + tile.bio.slice(1) : "..."}</div><div className="map-rail-tile-type map-rail-tile-type-bio">terrain</div></>
              )}
            </div>
            <div className="map-rail-meta">
              {repelSteps > 0 && <div style={{ color: T.ok, fontSize: 9 }}>🧴 Repel: {repelSteps} steps</div>}
              {guildMission && <div style={{ fontSize: 9, color: guildMission.progress >= guildMission.goal ? T.ok : T.ac, lineHeight: 1.35 }}>
                <div>📜 {guildMission.nm}: {guildMission.progress}/{guildMission.goal}</div>
                <div style={{ color: T.gd, fontSize: 8 }}>+{guildMission.xp}XP +{guildMission.g}G +{guildMission.sh} sh</div>
                {guildMission.progress >= guildMission.goal && <div style={{ color: T.ok, fontWeight: 700 }}>Claim at Guild</div>}
              </div>}
              {paidRumor && paidRumorCycle === tavernRumorCycle && <div style={{ fontSize: 9, color: T.gd, lineHeight: 1.35 }}>
                <div style={{ color: T.ac, fontWeight: 700 }}>🍺 Lead</div>
                <div>{paidRumor}</div>
              </div>}
            </div>
            <details className="map-legend-details map-rail-legend"><summary className="map-legend-toggle">📖 Legend</summary><div className="map-legend-row">{["🐾 Beast",roamingBossIcon + " Roaming Boss","🏕️ Camp","🎰 Den","💎 Loot","⛺ Outpost","🌀 Rift","🏛️ Ruin","⛩️ Shrine","🏘️ Town"].map(function(lbl){return <span key={lbl} className="legend-pill">{lbl}</span>;})}</div></details>
            <div className="map-rail-hint">Click · DblClick · Space · WASD</div>
          </aside>
          <div className="map-main-area">
          <div ref={swipeRef} className="battle-world-grid" style={{ display: "grid", gridTemplateColumns: "repeat(" + VW + ",1fr)", gap: 1, marginBottom: 0, width: "100%", background: T.bg, borderRadius: 6, overflow: "hidden", border: "1px solid " + T.bd, animation: "mapMove .15s ease" }} key={pos.x + "," + pos.y}>
            {Array.from({ length: VW * VH }).map(function(_, idx) {
              var gx = pos.x - hfX + idx % VW, gy = pos.y - hfY + Math.floor(idx / VW);
              var isMe = gx === pos.x && gy === pos.y;
              var isTrail = false;
              if (gx < 0 || gx >= MW || gy < 0 || gy >= MH) return <div key={idx} style={{ aspectRatio: "1", background: "linear-gradient(180deg, #10162a, #0a0f1f)", border: "1px solid rgba(255,255,255,0.04)" }} />;
              var t = mData[gy * MW + gx];
              var hasPoi = t && t.poi;
              var isDev = devPos && gx === devPos.x && gy === devPos.y;
              var biIc = BIO_IC[t && t.bio] || "";
              var decor = tileDecor(t);
              var bgC = isMe ? "radial-gradient(circle at 50% 35%, rgba(242,196,92,0.34), transparent 58%), " + worldTileVisual(t) : isTrail ? "radial-gradient(circle at 50% 50%, rgba(242,196,92,0.24), transparent 55%), " + worldTileVisual(t) : worldTileVisual(t);
              var poiBorder = hasPoi ? poiAccent(t.poi.type) : isDev ? "#ff6b6b" : null;
              var isSwimming = isMe && t && t.bio === "ocean";
              var meContent = isMe ? (isSwimming ? <><img src={import.meta.env.BASE_URL + "swim-icon.png"} alt="Swimming" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2, filter: "drop-shadow(0 0 4px rgba(0,180,255,0.6))" }} />{portraitOverlay(pl?.portrait)}</> : playerAvatar(pl?.cid || cls?.id, cls?.ic, pl?.portrait, pl?.sex)) : null;
              var cellLabel = isMe ? null : isDev ? roamingBossIcon : hasPoi ? t.poi.ic : decor || biIc;
              return <div key={idx} className={isMe ? "world-tile is-player" : "world-tile"} data-cls={isMe ? (pl?.cid || cls?.id || "default") : undefined} title={isDev ? "Roaming Boss — click to walk · double-click to engage" : (hasPoi ? ((t.poi.nm || t.poi.type) + " — click to walk · double-click to enter") : "Click to walk here")} onClick={function() { if (gx === pos.x && gy === pos.y) { if (hasPoi) { autoEnterRef.current = false; enterPoi(); } return; } autoEnterRef.current = false; if (isDev) setTip(roamingBossIcon + " Roaming Boss at (" + gx + "," + gy + ")"); else if (hasPoi) setTip(t.poi.ic + " " + (t.poi.nm || t.poi.type) + " (" + t.poi.type + ") at (" + gx + "," + gy + ")"); if (gx >= 0 && gx < MW && gy >= 0 && gy < MH) setAutoMoveTarget({ x: gx, y: gy }); }} onDoubleClick={function(ev){ ev.preventDefault(); if (gx === pos.x && gy === pos.y) { if (hasPoi) enterPoi(); return; } if (gx < 0 || gx >= MW || gy < 0 || gy >= MH) return; autoEnterRef.current = !!hasPoi; setAutoMoveTarget({ x: gx, y: gy }); }} style={{ position: isMe ? "relative" : undefined, overflow: isMe ? "hidden" : undefined, aspectRatio: "1", background: bgC, color: isTrail ? "#f2c45c" : isDev ? "#ffd0d0" : hasPoi ? (poiBorder || "#fff") : (t && t.bio === "ocean" ? "#bfe6ff" : "#edf4ff"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMe ? 13 : isTrail ? 9 : hasPoi ? 9 : decor ? 8 : 6, borderRadius: 2, border: isMe ? "1.5px solid " + T.gd : poiBorder ? "1.5px solid " + poiBorder : "1px solid rgba(255,255,255,0.05)", boxShadow: isMe ? ((t && t.bio === "ocean") ? "0 0 16px rgba(0,180,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)" : "0 0 14px rgba(242,196,92,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)") : poiBorder ? poiRing(hasPoi ? t.poi.type : "dev") : "inset 0 0 0 1px rgba(255,255,255,0.04)", opacity: t && t.bio === "ocean" ? 0.95 : 1, cursor: "pointer", transition: "background .15s, border .15s, box-shadow .15s", textShadow: isTrail || hasPoi || isDev ? "0 0 8px rgba(0,0,0,0.45)" : "none" }}>{cellLabel}{meContent}{isMe ? <span className="player-aura-ring" aria-hidden="true" /> : null}</div>;
            })}
          </div>
          </div>
        </div>
        <div className="cd map-log-card" style={{ maxHeight: 132, overflowY: "auto", padding: 6 }} ref={logR}>{[...log].reverse().map(function(l, i) { const isEvent = String(l).startsWith("EVENT|"); const txt = isEvent ? ("Event: " + String(l).replace(/^EVENT\|/, "")) : l; return <div key={i} className={"feed-entry" + (i === 0 ? " is-current" : "")} style={isEvent ? { color: "#ff8a80", borderLeftColor: "rgba(229,57,53,0.95)" } : null}>{txt}</div>; })}</div>
      </div></div>
    );
  }

  // BATTLE
  if (scr === "battle" && btl) {
    const isPT = btl.turn === "p";
    const elIc = EL_IC;
    const battlePlayerName = (pl?.name && String(pl.name).trim() && pl.name !== "Player") ? String(pl.name).trim() : ((cName && String(cName).trim()) ? String(cName).trim() : ((pl?.nm && pl.nm !== "Player") ? pl.nm : ((cls?.nm && cls.nm !== "Player") ? cls.nm : "Adventurer")));
    const chainLabels = ["Veil Magic 1","Veil Magic 2","Veil Magic 3","Veil Magic 4","On Hand Item 1","On Hand Item 2","Battle Item 1","Battle Item 2","Guard","Copied Skill"];
    const chainProg = btl.chainProg || 0;
    const encounterProfile = battleProfile(btl.type);
    const allBattleSpds = [effSt(pl).spd]
      .concat((ally && ally.hp > 0) ? [ally.spd || 0] : [])
      .concat((pet && (pet.chp ?? pet.hp ?? 0) > 0) ? [pet.spd || 0] : [])
      .concat((btl.en || []).filter(e => e.hp > 0).map(e => e.spd || 0));
    const maxBattleSpd = allBattleSpds.length ? Math.max.apply(null, allBattleSpds) : effSt(pl).spd;
    const spdColor = (spd) => spd >= maxBattleSpd ? T.ok : T.bad;
    return (
      <div className="pg battle-bg">
        <div className="battle-arena-img" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}${(btl.type === "rift" || btl.type === "boss" || btl.type === "fieldboss") ? "battle-rift.png" : (btl.type === "wild" || btl.type === "beast") ? "battle-forest.png" : "battle-arena.png"}')` }} />
        <div className="battle-arena-veil" />
        <div className="wr battle-viewport" style={{position:"relative",zIndex:1}}>{notiEl}{tipEl}{popupEl}{chatEl}
        <div className="battle-combat-title" style={{ fontSize: 14, fontWeight: 800, color: T.gd, letterSpacing: 0.4, marginBottom: 6, textAlign: 'center' }}>Combat</div>
        {(() => {
          const livingFoes = (btl.en || []).filter(e => e.hp > 0);
          // v40: positional combat. Player lane = btl.plPos; allies fill nearby allied lanes; foes use their pos.
          // v49: Tokens now carry full entity data so the lane bar IS the player/enemy panel.
          const plLane = btl.plPos ?? 1;
          const plEffSt = effSt(pl);
          const plPassive = equippedPassiveFor(pl);
          const playerEnt = { name: battlePlayerName, hp: pl.chp, mhp: plEffSt.hp, mp: pl.cmp, mmp: plEffSt.mp, spd: plEffSt.spd, els: entityBattleElements(pl), efx: pl.efx, passiveName: plPassive?.nm || "None", passiveDs: plPassive?.ds, kind: "player" };
          const playerTok = { k: "p", ic: pl.ic || cls.ic || "🗡", img: pl?.portrait, classId: pl?.cid || cls?.id, sex: pl?.sex, cls: "ally", entity: playerEnt };
          const petTok = (pet && (pet.chp ?? pet.hp ?? 0) > 0) ? { k: "pet", ic: pet.ic || "🐾", cls: "ally", entity: { name: pet.nm, hp: pet.chp ?? pet.hp, mhp: pet.mhp ?? pet.hp, mp: pet.mp ?? pet.mmp ?? 0, mmp: pet.mmp ?? pet.mp ?? 0, spd: pet.spd || 0, els: entityBattleElements(pet), efx: [], passiveName: pet.passive || pet.passiveName || "None", passiveDs: pet.passive || pet.passiveName ? ("Pet instinct: " + (pet.passiveBonus || "damage") + "-leaning support.") : null, kind: "pet" } } : null;
          const allyTok = (ally && ally.hp > 0) ? { k: "ally", ic: ally.ic || "🤝", cls: "ally", entity: { name: ally.nm, hp: ally.hp, mhp: ally.mhp, mp: ally.mp ?? ally.mmp ?? 0, mmp: ally.mmp ?? 0, spd: ally.spd || 0, els: entityBattleElements(ally), efx: [], passiveName: ally.passive || ally.passiveName || "None", passiveDs: ally.passive || ally.passiveName ? ("Ally role: " + (ally.role || ally.passiveBonus || "support") + ".") : null, kind: "ally" } } : null;
          const petLane = petTok ? (plLane === 0 ? 1 : 0) : -1;
          const allyLane = allyTok ? (plLane === 0 ? 2 : (petLane === 0 ? (plLane === 1 ? 2 : 1) : 0)) : -1;
          const laneTokens = [[],[],[],[],[]];
          laneTokens[plLane].push(playerTok);
          if (petTok) laneTokens[Math.max(0, Math.min(2, petLane))].push(petTok);
          if (allyTok) laneTokens[Math.max(0, Math.min(2, allyLane))].push(allyTok);
          livingFoes.forEach(e => {
            const fp = Math.max(3, Math.min(4, e.pos ?? 3));
            const portraitSrc = e.bossKey ? BOSS_PORTRAIT_PATH(e.bossKey) : ELEMENT_ICON_PATH(e.el);
            laneTokens[fp].push({ k: e.id, ic: EL_IC[e.el] || "👾", portraitSrc, cls: "foe", isTarget: btlTarget === e.id, foePos: fp, entity: { name: e.name, hp: e.hp, mhp: e.mhp, mp: e.cmp ?? e.mmp ?? 0, mmp: e.mmp ?? 0, spd: e.spd || 0, els: entityBattleElements(e), efx: e.efx || [], passiveName: e.monPassive || "None", passiveDs: e.monPassive ? (MONSTER_PASSIVE_INFO[e.monPassiveKey] || "A unique trait.") : null, isBoss: !!e.boss, foeEl: e.el, kind: "foe", foeId: e.id, bossKey: e.bossKey || null, portraitSrc } });
          });
          const tiles = [
            { label: "Vanguard", role: "lane-melee" },
            { label: "Front",    role: "lane-melee" },
            { label: "Mid",      role: "lane-mid"   },
            { label: "Skirmish", role: "lane-far"   },
            { label: "Backline", role: "lane-far"   },
          ];
          const tgtFoe = btlTarget ? livingFoes.find(e => e.id === btlTarget) : null;
          const tgtDist = tgtFoe ? Math.abs(plLane - (tgtFoe.pos ?? 3)) : null;
          const openEntityInfoPopup = (tok) => {
            const ent = tok.entity; if (!ent) return;
            const nameColor = tok.cls === "foe" ? T.bad : (tok.cls === "ally" && tok.k === "p" ? T.ac : T.ok);
            const node = (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#e8eeff", fontSize: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", background: "rgba(20,30,60,0.6)", border: "1px solid rgba(212,173,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                    {tok.classId ? playerAvatar(tok.classId, tok.ic, tok.img, tok.sex) : (tok.portraitSrc ? <img src={tok.portraitSrc} alt={ent.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(ev) => { ev.target.style.display = "none"; }} /> : <>{tok.ic}{portraitOverlay(tok.img)}</>)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 800, color: nameColor, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                      <span>{ent.name}</span>{ent.isBoss ? <span className="tg" style={{ background: T.bad + "33", color: T.bad }}>BOSS</span> : null}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
                      {(ent.els || []).map((elx, i) => <ElementTag key={elx + "_p_" + i} el={elx} fontSize={10} />)}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#bfc9ef", marginBottom: 2 }}>HP {Math.max(0, ent.hp)}/{ent.mhp}</div>
                  {pBar(ent.hp, ent.mhp, T.hp)}
                </div>
                {ent.mmp > 0 && <div>
                  <div style={{ fontSize: 9, color: "#bfc9ef", marginBottom: 2 }}>MP {Math.max(0, ent.mp)}/{ent.mmp}</div>
                  {pBar(ent.mp, ent.mmp, T.mp)}
                </div>}
                <div style={{ fontSize: 11 }}>SPD: <span style={{ color: spdColor(ent.spd), fontWeight: 700 }}>{ent.spd}</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 11 }}><span style={{ color: "#bfc9ef" }}>Passive: </span><span style={{ color: T.gd, fontWeight: 700 }}>{ent.passiveName}</span></div>
                  {ent.passiveDs && <div style={{ fontSize: 10, color: "#cdd5ee", lineHeight: 1.4 }}>{ent.passiveDs}</div>}
                </div>
                {ent.els && ent.els.length > 0 && <button type="button" className="bt bs battle-element-summary-btn" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => { setPopup(null); setTimeout(() => openElementSummaryPopup(ent.els, tok.cls === "foe" ? "enemy" : "player", ent.name), 50); }}>View Element Matchups</button>}
                {ent.efx && ent.efx.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{ent.efx.map((ef, i) => <StatusTag key={i} ef={ef} />)}</div>}
              </div>
            );
            setPopup({ title: "Sorcerer Dossier", node, fullscreen: true });
          };
          const renderRichToken = (tok, canMove) => {
            const ent = tok.entity;
            const hpPct = ent ? Math.max(0, Math.min(100, (Math.max(0, ent.hp) / Math.max(1, ent.mhp)) * 100)) : 100;
            const mpPct = ent && ent.mmp > 0 ? Math.max(0, Math.min(100, (Math.max(0, ent.mp) / Math.max(1, ent.mmp)) * 100)) : 0;
            const handleClick = (ev) => {
              ev.stopPropagation();
              if (tok.cls === "foe" && tok.k && isPT) {
                if (btlTarget === tok.k) openEntityInfoPopup(tok);
                else setBtlTarget(tok.k);
              } else {
                openEntityInfoPopup(tok);
              }
            };
            return <div key={tok.k} onClick={handleClick} title={ent ? (ent.name + " — click for details" + (tok.cls === "foe" ? " (click again to target)" : "")) : ""} className={"battle-lane-token is-rich " + tok.cls + (tok.isTarget ? " target-mark" : "")}>
              <div className="ent-portrait">
                {tok.classId ? playerAvatar(tok.classId, tok.ic, tok.img, tok.sex) : (tok.portraitSrc ? <img src={tok.portraitSrc} alt={ent?.name || ""} draggable={false} className={"ent-portrait-img" + (tok.cls === "foe" && ent?.isBoss ? " is-boss-portrait" : "")} onError={(ev) => { ev.target.style.display = "none"; }} /> : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: 18, position: "relative" }}>{tok.ic}{portraitOverlay(tok.img)}</span>)}
                {ent && ent.isBoss ? <span className="ent-boss-mark">★</span> : null}
              </div>
              {ent && <div className="ent-name" title={ent.name}>{ent.name}</div>}
              {ent && <div className="ent-bar ent-hp"><div style={{ width: hpPct + "%" }} /></div>}
              {ent && ent.mmp > 0 && <div className="ent-bar ent-mp"><div style={{ width: mpPct + "%" }} /></div>}
            </div>;
          };
          return <>
            <div className="battle-lane" title="Click an empty allied lane (Vanguard / Front / Mid) to reposition. Click a token for details. Click a foe to target — click again for details.">
              {tiles.map((t, i) => {
                const isAllyLane = i <= 2;
                const isPlayerHere = i === plLane;
                const canMove = isPT && !btl.moved && isAllyLane && !isPlayerHere;
                return <div key={i}
                  className={"battle-lane-tile " + t.role + (canMove ? " lane-clickable" : "") + (isPlayerHere ? " lane-player-here" : "")}
                  onClick={canMove ? () => bMove(i) : undefined}>
                  <div className="battle-lane-tokens">
                    {laneTokens[i].length === 0 ? <div style={{ opacity: 0.25, fontSize: 10 }}>·</div> : laneTokens[i].map(tok => renderRichToken(tok, canMove))}
                  </div>
                  <div className="battle-lane-label">{t.label}</div>
                </div>;
              })}
            </div>
            <div className="battle-range-readout">
              <span>📍 Lane: <b>{["Vanguard","Front","Mid"][plLane] || "?"}</b></span>
              {tgtFoe && <span>🎯 Target: <b>{tgtFoe.name}</b> (dist {tgtDist})</span>}
              {tgtFoe && tgtDist === 1 && <span style={{ color: "#ffb066" }}>⚡ Point-blank bonus on melee</span>}
              {tgtFoe && tgtDist >= 3 && <span style={{ color: "#88c5ff" }}>🎯 Long-shot bonus on magic</span>}
              <span style={{ color: btl.moved ? "#9aa1b8" : "#ffd77a" }}>{btl.moved ? "✓ Moved this turn" : "↔ Move available"}</span>
            </div>
          </>;
        })()}
        <div className="battle-top-grid">
          <div className="battle-team-col">
            <div className="cd" style={{ padding: 6, marginBottom: 3 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.ac, marginBottom: 3 }}>Player</div>
              <div className="battle-entity-row" style={{ padding: 4, fontSize: 9, display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ position: "relative", width: 32, height: 32, borderRadius: 6, background: (ELC[(entityBattleElements(pl)[0]) || pl.tempBattleEl || pl.el]||T.ac)+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, overflow: "hidden", border: "1px solid " + (cls?.cl || T.gd) + "66" }}>{playerAvatar(pl?.cid || cls?.id, pl.ic || cls.ic, pl?.portrait, pl?.sex)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <span>{battlePlayerName}</span>
                    {entityBattleElements(pl).map((elx, i) => <ElementTag key={elx + "_" + i} el={elx} fontSize={10} />)}
                  </div>
                  {pBar(pl.chp, effSt(pl).hp, T.hp)}
                  {pBar(pl.cmp, effSt(pl).mp, T.mp)}
                  <div className="battle-entity-stats" style={{ fontSize: 9 }}>HP:{pl.chp}/{effSt(pl).hp} · MP:{pl.cmp}/{effSt(pl).mp} · SPD:<span style={{ color: spdColor(effSt(pl).spd), fontWeight: 700 }}>{effSt(pl).spd}</span></div>
                  <button type="button" className="bt bs battle-element-summary-btn" style={{ marginTop: 2, padding: "2px 6px", fontSize: 8 }} onClick={() => openElementSummaryPopup(entityBattleElements(pl), "player", battlePlayerName)}>Element Summary</button>
                  <div className="battle-passive-line"><span style={{ color: "#bfc9ef" }}>Passive</span><button type="button" className="battle-passive-chip player" style={{ cursor: "pointer" }} onClick={() => { const activePassive = equippedPassiveFor(pl); setPopup({ text: passivePopupText(activePassive?.nm || "None", activePassive?.ds) }); }}>{equippedPassiveFor(pl)?.nm || "None"}</button></div>
                  {pl.efx.length > 0 && <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap", paddingRight: 2, alignContent: "flex-start" }}>{pl.efx.map((ef, i) => <StatusTag key={i} ef={ef} />)}</div>}
                </div>
              </div>
            </div>
            {(ally || pet) && <div className="cd" style={{ padding: 6, marginBottom: 3 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.ok, marginBottom: 3 }}>Allies</div>
              {pet && (pet.chp ?? pet.hp ?? 0) > 0 && <div className="battle-entity-row" style={{ padding: 4, marginBottom: 2, fontSize: 9, display: "flex", gap: 6, alignItems: "center" }}><div style={{ width: 28, height: 28, borderRadius: 6, background: (ELC[(entityBattleElements(pet)[0]) || pet.el]||T.ac)+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{pet.ic}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", fontSize: 11 }}><span>{pet.nm}</span>{entityBattleElements(pet).map((elx, i) => <ElementTag key={elx + "_" + i} el={elx} fontSize={10} />)}</div>{pBar(pet.chp ?? pet.hp, pet.mhp ?? pet.hp, T.hp)}{pBar(pet.mp ?? pet.mmp ?? 0, pet.mmp ?? pet.mp ?? 1, T.mp)}<div style={{ fontSize: 9, color: T.dm }}>HP:{pet.chp ?? pet.hp}/{pet.mhp ?? pet.hp} · MP:{pet.mp ?? pet.mmp ?? 0}/{pet.mmp ?? pet.mp ?? 0} · SPD:<span style={{ color: spdColor(pet.spd || 0), fontWeight: 700 }}>{pet.spd || 0}</span> · {pet.sk1?.n || "?"} / {pet.sk2?.n || "?"}</div><button type="button" className="bt bs battle-element-summary-btn" style={{ marginTop: 2, padding: "2px 6px", fontSize: 8 }} onClick={() => openElementSummaryPopup(entityBattleElements(pet), "ally", pet.nm)}>Element Summary</button><div className="battle-passive-line"><span style={{ color: "#bfc9ef" }}>Passive</span><button type="button" className="battle-passive-chip player" style={{ cursor: "pointer" }} onClick={() => setPopup({ text: passivePopupText(pet.passive || pet.passiveName || "None", pet.passive || pet.passiveName ? ("Pet instinct: " + (pet.passiveBonus || "damage") + "-leaning support for your battle rhythm.") : null) })}>{pet.passive || pet.passiveName || "None"}</button></div></div></div>}
              {ally && ally.hp > 0 && <div className="battle-entity-row" style={{ padding: 4, fontSize: 9, display: "flex", gap: 6, alignItems: "center" }}><div style={{ width: 28, height: 28, borderRadius: 6, background: (ELC[(entityBattleElements(ally)[0]) || ally.el]||T.ok)+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{ally.ic||"🤝"}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", fontSize: 11 }}><span>{ally.nm}</span>{entityBattleElements(ally).map((elx, i) => <ElementTag key={elx + "_" + i} el={elx} fontSize={10} />)}</div>{pBar(ally.hp, ally.mhp, T.hp)}{pBar(ally.mp ?? ally.mmp ?? ally.cls?.st?.mp ?? 0, ally.mmp ?? ally.cls?.st?.mp ?? 1, T.mp)}<div style={{ fontSize: 9, color: T.dm }}>HP:{ally.hp}/{ally.mhp} · MP:{ally.mp ?? ally.mmp ?? ally.cls?.st?.mp ?? 0}/{ally.mmp ?? ally.cls?.st?.mp ?? 0} · SPD:<span style={{ color: spdColor(ally.spd || 0), fontWeight: 700 }}>{ally.spd || 0}</span> · {ally.sk1?.n || "?"} / {ally.sk2?.n || "?"}</div><button type="button" className="bt bs battle-element-summary-btn" style={{ marginTop: 2, padding: "2px 6px", fontSize: 8 }} onClick={() => openElementSummaryPopup(entityBattleElements(ally), "ally", ally.nm)}>Element Summary</button><div className="battle-passive-line"><span style={{ color: "#bfc9ef" }}>Passive</span><button type="button" className="battle-passive-chip player" style={{ cursor: "pointer" }} onClick={() => setPopup({ text: passivePopupText(ally.passive || ally.passiveName || "None", ally.passive || ally.passiveName ? ("Ally role: " + (ally.role || ally.passiveBonus || "support") + ". " + (ally.passiveName || ally.passive || "Shrine Blessing") + " shapes how this ally contributes.") : null) })}>{ally.passive || ally.passiveName || "None"}</button></div></div></div>}
            </div>}
          </div>
          <div className="battle-enemy-col">
            <div className="cd" style={{ padding: 6, marginBottom: 3 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.bad, marginBottom: 3 }}>Enemies</div>
              {[...btl.en].sort((a, b) => { const av = a.hp > 0 ? 1 : 0; const bv = b.hp > 0 ? 1 : 0; return bv - av; }).map(e => <div key={e.id} onClick={() => e.hp > 0 && setBtlTarget(e.id)} className={"battle-entity-row" + (btlTarget === e.id ? " is-target" : "") + (e.hp <= 0 ? " is-dead" : "")} style={{ padding: 4, marginBottom: 2, cursor: e.hp > 0 ? "pointer" : "default", transition: "all .15s", display: "flex", gap: 6, alignItems: "center", overflow: "hidden" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: (ELC[e.el]||T.bad)+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{elIc[e.el]||"👾"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 9, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, minWidth: 0, overflow: "visible" }}><span style={{ fontWeight: 700, color: ELC[e.el]||T.bad, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>{e.name}</span>{btlTarget === e.id && <span style={{ color: T.bad, fontSize: 7, flexShrink: 0 }}>◆</span>}<span className="battle-enemy-inline-elements">{entityBattleElements(e).map((elx, i) => <ElementTag key={elx + "_" + i} el={elx} fontSize={8} />)}</span>{e.boss && <span className="tg" style={{ background: T.bad + "22", color: T.bad, flexShrink: 0 }}>BOSS</span>}</div>
                  </div>
                  {pBar(e.hp, e.mhp, T.hp)}{pBar(e.cmp ?? e.mmp ?? 0, e.mmp ?? 1, T.mp)}<div style={{ fontSize: 9, color: T.dm }}>HP:{Math.max(0,e.hp)}/{e.mhp} · MP:{Math.max(0,e.cmp ?? e.mmp ?? 0)}/{e.mmp ?? 0} · SPD:<span style={{ color: spdColor(e.spd || 0), fontWeight: 700 }}>{e.spd || 0}</span></div>
                  {entityBattleElements(e).length > 0 && <div className="battle-enemy-mobile-elements"><span style={{ fontSize: 7, color: "#f0c3cf", fontWeight: 700, marginRight: 4 }}>Elements</span>{entityBattleElements(e).map((elx, i) => <ElementTag key={elx + "_mobile_" + i} el={elx} fontSize={8} />)}</div>}
                  <button type="button" className="bt bs battle-element-summary-btn enemy" style={{ marginTop: 2, padding: "2px 6px", fontSize: 8 }} onClick={(ev) => { ev.stopPropagation(); openElementSummaryPopup(entityBattleElements(e), "enemy", e.name); }}>Element Summary</button>
                  <div className="battle-passive-line"><span style={{ color: "#f0c3cf" }}>Passive</span><button type="button" className="battle-passive-chip enemy" style={{ cursor: "pointer" }} onClick={() => setPopup({ text: passivePopupText(e.monPassive || "None", e.monPassive ? (MONSTER_PASSIVE_INFO[e.monPassiveKey] || "A unique monster trait affecting how this enemy behaves in battle.") : null) })}>{e.monPassive || "None"}</button></div>
                  {e.efx.length > 0 && <div style={{ display: "flex", gap: 2, marginTop: 1, flexWrap: "wrap", maxHeight: 34, overflowY: "auto", paddingRight: 2, alignContent: "flex-start" }}>{e.efx.map((ef, i) => <StatusTag key={i} ef={ef} />)}</div>}
                </div>
              </div>)}
            </div>
          </div>
        </div>
        <div className="cd battle-info-card" style={{ padding: 6 }}>
              <div className="battle-info-strip">
                <div>
                  <div className="battle-chain-line" style={{ whiteSpace: "nowrap", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                    <span className="tg" style={{ background: pl.ult.ready ? T.gd + "22" : T.c2, color: pl.ult.ready ? T.gd : T.dm, marginRight: 4 }}>{chainProg + "/" + pl.ult.chain}</span><span style={{ color: T.tx }}>Veil Expansion: </span><span style={{ color: T.gd, fontWeight: 700 }}>{pl.ult.name}</span><button className="bt bs" style={{ background: T.c2, padding: "1px 5px", marginLeft: 4, fontSize: 7 }} onClick={() => setPopup({ text: veilExpansionDetailText(pl.ult) })}>ℹ</button><span style={{ color: T.dm }}> — </span>
                    {pl.ult.combo.map((v, i) => {
                      const label = chainLabels[v] || "?";
                      const isComplete = i < chainProg;
                      const isCurrent = i === chainProg && !pl.ult.ready;
                      const isReady = pl.ult.ready;
                      return <span key={i}>{i > 0 && <span style={{ color: T.dm }}>→</span>}<span style={{
                        padding: "0 3px", borderRadius: 2, fontWeight: 700,
                        background: isReady ? T.gd + "44" : isComplete ? T.ok + "33" : isCurrent ? T.ac + "33" : "transparent",
                        color: isReady ? T.gd : isComplete ? T.ok : isCurrent ? T.ac : T.dm,
                      }}>{label}</span></span>;
                    })}
                  </div>
                  {isPT && <div className="battle-tactical-inline">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <div style={{ color: T.gd, fontWeight: 700 }}>⚔ Tactical Readout</div>
                      <div className="battle-combo-tools">
                        {battleBonus && <div style={{ color: T.ok, fontSize: 8 }}>✦ {battleBonus.label.replace(/(\d+)t/g, "$1 Turns")}</div>}
                        <button className="bt bs" style={{ background: battleHelpOpen ? T.gd : T.c2, padding: "2px 6px", fontSize: 7 }} onClick={() => setBattleHelpOpen(v => !v)}>🏷️ Tags</button>
                      </div>
                    </div>
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 1, marginTop: 2 }}>
                      <div style={{ fontSize: 7, color: "#97a7d5", marginBottom: 2 }}>Tap an interaction name for its trigger and effect.</div>{getReadyInteractions(pl.inter, btl, btl.en?.find(e => e.hp > 0)).map((x,i) => {
                      const isReady = x.isReady;
                      return <button type="button" key={i} className="battle-ready-chip" onClick={() => setPopup({ text: interactionPopupText(x) })} style={{ display: "inline-block", color: isReady ? "#ffd600" : T.ok, background: isReady ? "#ffd60022" : "transparent", lineHeight: 1.45, whiteSpace: "nowrap", border: "1px solid " + (isReady ? "#ffd60055" : "transparent"), boxShadow: isReady ? "0 0 10px #ffd60055" : "none", cursor: "pointer" }}>★ {x.nm || interactionDisplayName(x.k, x.ds)}{isReady ? " ⚡" : ""}</button>;
                    })}
                    </div>
                  </div>}
                </div>
                <div className="battle-info-meta">
                  {pl.ult.ready && <span className="tg" style={{ background: T.gd + "22", color: T.gd }}>Ready</span>}
                  <span className="tg" style={{ background: btlTimer <= 20 ? T.bad + "22" : T.ok + "22", color: btlTimer <= 20 ? T.bad : T.ok, fontWeight: 700 }}>⏱ {Math.floor(btlTimer/60)}:{String(btlTimer%60).padStart(2,"0")}</span>
                </div>
              </div>
              {isPT && battleHelpOpen && <div style={{ marginTop: 4 }}>
                  {TAG_INFO.map(tag => <div key={tag.id} style={{ fontSize: 8, marginBottom: 1 }}><span style={{ color: T.gd, fontWeight: 700 }}>{tag.nm}:</span> {tag.ds}</div>)}
                  <div style={{ fontSize: 8, color: T.gd, fontWeight: 700, marginTop: 4 }}>All Statuses (tap for info)</div>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 2 }}>{[...FXS].sort((a,b)=>a.nm.localeCompare(b.nm)).map(f => <Tooltip key={f.id} text={<span><b>{f.ic} {f.nm}</b><br/>{STATUS_DESC[f.id] || f.nm + " effect."}</span>}><span className="tg" style={{ background: f.type === "dot" ? T.bad + "22" : f.type === "buff" || f.type === "hot" ? T.ok + "22" : T.wn + "22", color: f.type === "dot" ? T.bad : f.type === "buff" || f.type === "hot" ? T.ok : T.wn, fontSize: 8, cursor: "pointer" }}>{f.ic}{f.nm}</span></Tooltip>)}</div>
              </div>}
            </div>
        <div className="battle-lower-grid">
          <div className="battle-main-stack">
            <div className="cd battle-actions-card" style={{ padding: 6 }}>
              <div className="battle-turn-head">
                <span style={{ fontSize: 10, fontWeight: 700, color: isPT ? T.ok : T.bad }}>{isPT ? "Your Turn" : "Enemy Turn..."}</span>
                <span style={{ fontSize: 9, color: T.dm }}>{isPT ? "Pick an action region." : "Await enemy actions."}</span>
              </div>
              {(() => { const hasItems = !!(eq.c1 || eq.c2); const tabs = [
                { id: "veil",   ic: "✦",   nm: "Veil Magic",  ct: eqSk.length },
                { id: "combat", ic: "⚔",   nm: "Combat",       ct: 2 + (eq.w2 ? 1 : 0) + (copied && copyN > 0 ? 1 : 0) + (pl.ult.ready ? 1 : 0) },
                ...(hasItems ? [{ id: "items", ic: "🧪", nm: "Items", ct: (eq.c1 ? 1 : 0) + (eq.c2 ? 1 : 0) }] : []),
                ...(isPT ? [{ id: "aux",    ic: "⚙",   nm: "Aux", ct: null }] : []),
              ]; const active = battleSectionAvailable(battleSection, { hasItems, isPT }) ? battleSection : "veil"; return (
                <div className="battle-tabs" role="tablist">
                  {tabs.map(t => <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className={"battle-tab" + (active === t.id ? " is-active" : "")} onClick={() => setBattleSection(t.id)}>
                    <span className="battle-tab-ic">{t.ic}</span>
                    <span className="battle-tab-nm">{t.nm}</span>
                    {t.ct != null && <span className="battle-tab-ct">{t.ct}</span>}
                  </button>)}
                </div>
              ); })()}
              <div className="battle-section" style={{ display: (battleSectionAvailable(battleSection, { hasItems: !!(eq.c1 || eq.c2), isPT }) ? battleSection : "veil") === "veil" ? "block" : "none" }}>
                <div className="battle-section-title"><span style={{ color: T.gd }}>Veil Magic</span><span style={{ fontSize: 7, color: T.dm }}>{eqSk.length} equipped</span></div>
                <div className="battle-action-grid">
                  {eqSk.map((sk, i) => {
                    const fxInfo = sk.fx ? FX(sk.fx) : null;
                    const fx2Info = sk.fx2 ? FX(sk.fx2) : null;
                    const isSilenced = (pl.efx||[]).some(ef=>ef.id==="silence");
                    const typeLabel = (function(){ let parts = []; if (sk.t === "damage") parts.push("Damage"); if (sk.t === "heal") parts.push("Heal"); if (sk.t === "buff") parts.push("Buff"); if (sk.t === "debuff") parts.push("Debuff"); if (sk.t === "copy") parts.push("Copy"); if (sk.t === "damage" && fxInfo && ["dot","debuff","skip","seal","acc"].includes(fxInfo.type)) parts.push("Debuff"); if (sk.t === "damage" && fxInfo && ["buff","hot","shield"].includes(fxInfo.type)) parts.push("Buff"); return [...new Set(parts)].join(" + "); })();
                    const attackLines = attackSummaryLines(sk.el, 2);
                    const effectBits = battleEffectBundleText(sk);
                    return <div key={sk.id} className="battle-action-card-wrap">
                      <button className="bt battle-action-btn" disabled={!isPT || pl.cmp < sk.mp || isSilenced} style={{ background: (ELC[sk.el]||T.ac) + "12", border: "1px solid " + (ELC[sk.el]||T.ac) + "33", color: T.tx, textAlign: "center", paddingLeft: "6px", paddingRight: "6px", paddingBottom: "6px", fontSize: 10, opacity: (pl.cmp >= sk.mp && !isSilenced) ? 1 : 0.3, width: "100%" }} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(sk.n, sk.el), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(sk.n, sk.el), fullscreen: true }); return; } bAct("skill", i); }}>
                        <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 1 }}>{sk.n}</div>
                        <div style={{ fontSize: 7, color: T.dm }}>{typeLabel} · <span style={{ color: ELC[sk.el]||"#999", fontWeight: 700 }}>{sk.el}</span></div>
                        <div style={{ fontSize: 7, color: T.tx }}>{sk.t === "damage" ? ("Dmg " + (estimateBattleSkillDamage(sk, pl, btl.en.find(e => e.hp > 0) || { def: 0 }, encounterProfile.playerDamage) || (sk.pow || 0))) : (sk.t === "heal" ? ("Power: " + (sk.pow || 0)) : (sk.t === "buff" || sk.t === "debuff" || sk.t === "copy" ? "Buff/Debuff" : "—"))} · Cost: {sk.mp} MP</div>
                        {effectBits && <div style={{ fontSize: 7, color: T.dm }}><span style={{ color: "#66bb6a", fontWeight: 700 }}>Additional Effect:</span> {effectBits}</div>}
                      </button>
                      <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(sk.n, sk.el), fullscreen: true }); }}>?</button>
                    </div>;
                  })}
                </div>
              </div>
              <div className="battle-section" style={{ display: (battleSectionAvailable(battleSection, { hasItems: !!(eq.c1 || eq.c2), isPT }) ? battleSection : "veil") === "combat" ? "block" : "none" }}>
                <div className="battle-section-title"><span style={{ color: T.gd }}>Combat Actions</span><span style={{ fontSize: 7, color: T.dm }}>Basic actions</span></div>
                <div className="battle-action-grid">
                  <div className="battle-action-card-wrap">
                    <button className="bt battle-action-btn" style={{ background: T.c2, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }} disabled={!isPT} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText((eq.w1 ? eq.w1.name : (eq.w2 ? eq.w2.name : "Unarmed")), ((eq.w1||eq.w2)?.el)||"Null"), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText((eq.w1 ? eq.w1.name : (eq.w2 ? eq.w2.name : "Unarmed")), ((eq.w1||eq.w2)?.el)||"Null"), fullscreen: true }); return; } bAct("strike"); }}>
                      <div style={{ fontWeight: 700 }}>🗡️ {eq.w1 ? eq.w1.name : (eq.w2 ? eq.w2.name : "Unarmed")}</div>
                      <div style={{ fontSize: 7, color: T.dm }}>{((eq.w1||eq.w2)?.isShield ? "Shield Utility" : "Attack")} · <span style={{ color: ELC[((eq.w1||eq.w2)?.el)||"Null"]||"#999", fontWeight: 700 }}>{((eq.w1||eq.w2)?.el)||"Null"}</span></div>
                      <div style={{ fontSize: 7, color: T.tx }}>{`${(eq.w1||eq.w2)?.isShield ? "Power: 0" : ("Dmg " + (estimateBattleWeaponDamage((eq.w1||eq.w2), pl, btl.en.find(e => e.hp > 0) || { def: 0 }, encounterProfile.playerDamage) ?? 0))} · Cost: 0 · Dur. ${eq.w1 ? ((eq.w1.dur ?? eq.w1.maxDur ?? "∞") + "/" + (eq.w1.maxDur ?? eq.w1.dur ?? "∞")) : (eq.w2 ? ((eq.w2.dur ?? eq.w2.maxDur ?? "∞") + "/" + (eq.w2.maxDur ?? eq.w2.dur ?? "∞")) : "∞")}`}</div>
                      <div style={{ fontSize: 7, color: T.dm }}>{eq.w1 ? (<><span style={{ color: "#66bb6a", fontWeight: 700 }}>Additional Effect:</span> {" " + weaponEffectDetail(eq.w1)}</>) : (eq.w2 ? (<><span style={{ color: "#66bb6a", fontWeight: 700 }}>Additional Effect:</span> {" " + weaponEffectDetail(eq.w2)}</>) : "No special effect.")}</div>
                    </button>
                    <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText((eq.w1 ? eq.w1.name : (eq.w2 ? eq.w2.name : "Unarmed")), ((eq.w1||eq.w2)?.el)||"Null"), fullscreen: true }); }}>?</button>
                  </div>
                  {eq.w2 && <div className="battle-action-card-wrap">
                    <button className="bt battle-action-btn" style={{ background: T.c2, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }} disabled={!isPT} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.w2.name, eq.w2.el), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.w2.name, eq.w2.el), fullscreen: true }); return; } bAct("w2"); }}>
                      <div style={{ fontWeight: 700 }}>⚔️ {eq.w2.name}</div>
                      <div style={{ fontSize: 7, color: T.dm }}>{eq.w2.isShield ? "Shield Utility" : "Attack"} · <span style={{ color: ELC[eq.w2.el || "Null"]||"#999", fontWeight: 700 }}>{eq.w2.el || "Null"}</span></div>
                      <div style={{ fontSize: 7, color: T.tx }}>{`${eq.w2.isShield ? "Power: 0" : ("Dmg " + (estimateBattleWeaponDamage(eq.w2, pl, btl.en.find(e => e.hp > 0) || { def: 0 }, encounterProfile.playerDamage) ?? 0))} · Cost: 0 · Dur. ${(eq.w2.dur ?? eq.w2.maxDur ?? "∞") + "/" + (eq.w2.maxDur ?? eq.w2.dur ?? "∞")}`}</div>
                      <div style={{ fontSize: 7, color: T.dm }}><span style={{ color: "#66bb6a", fontWeight: 700 }}>Additional Effect:</span>{" " + weaponEffectDetail(eq.w2)}</div>
                    </button>
                    <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.w2.name, eq.w2.el), fullscreen: true }); }}>?</button>
                  </div>}
                  <div className="battle-action-card-wrap">
                    <button className="bt battle-action-btn" style={{ background: T.c2, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }} disabled={!isPT} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText("Guard", "Null"), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText("Guard", "Null"), fullscreen: true }); return; } bAct("guard"); }}>
                      <div style={{ fontWeight: 700 }}>🛡️ Guard</div>
                      <div style={{ fontSize: 7, color: T.dm }}>Basic Buff · Null</div>
                      <div style={{ fontSize: 7, color: T.tx }}>Power: 0 · Cost: 0</div>
                    </button>
                    <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText("Guard", "Null"), fullscreen: true }); }}>?</button>
                  </div>
                  <div className="battle-action-card-wrap">
                    <button className="bt battle-action-btn" style={{ background: T.ok + "15", border: "1px solid " + T.ok + "33", textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6, color: T.tx }} disabled={!isPT || pl.cmp < 8} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText("Mend", "Null"), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText("Mend", "Null"), fullscreen: true }); return; } bAct("mend"); }}>
                      <div style={{ fontWeight: 700 }}>💚 Mend</div>
                      <div style={{ fontSize: 7, color: T.dm }}>Basic Heal · Null</div>
                      <div style={{ fontSize: 7, color: T.tx }}>Power: {Math.floor(6 + st.mag * 0.15) * 3} · Cost: 8 MP</div>
                    </button>
                    <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText("Mend", "Null"), fullscreen: true }); }}>?</button>
                  </div>
                  {copied && copyN > 0 && <div className="battle-action-card-wrap">
                    <button className="bt battle-action-btn" style={{ background: "#26c6da22", border: "1px solid #26c6da55", color: T.tx, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }} disabled={!isPT || pl.cmp < Math.max(0, Math.ceil(((copied.copiedBaseMp != null ? copied.copiedBaseMp : copied.mp || 0) * 0.5)))} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(copied.n, copied.el), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(copied.n, copied.el), fullscreen: true }); return; } bAct("copy"); }}>
                      <div style={{ fontWeight: 700 }}>🪞 {copied.n}</div>
                      <div style={{ fontSize: 7, color: T.dm }}>Copied Skill · <span style={{ color: ELC[copied.el || "Null"]||"#999", fontWeight: 700 }}>{copied.el || "Copied"}</span></div>
                      <div style={{ fontSize: 7, color: T.tx }}>{copied.t === "damage" ? ("Dmg " + (estimateBattleSkillDamage(copied, pl, btl.en.find(e => e.hp > 0) || { def: 0 }, encounterProfile.playerDamage) || (copied.pow || 0))) : ("Power: " + (copied.pow || 0))} · Cost: {Math.max(0, Math.ceil(((copied.copiedBaseMp != null ? copied.copiedBaseMp : copied.mp || 0) * 0.5)))} MP</div>
                      <div style={{ fontSize: 7, color: T.dm }}>{(battleEffectBundleText(copied) ? (<><span style={{ color: "#66bb6a", fontWeight: 700 }}>Additional Effect:</span>{" " + battleEffectBundleText(copied)}</>) : ("🪞 " + copyN + " uses remaining"))}</div>
                    </button>
                    <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(copied.n, copied.el), fullscreen: true }); }}>?</button>
                  </div>}
                  {pl.ult.ready && <div className="battle-action-card-wrap">
                    <button className="bt battle-action-btn" style={{ background: T.gd, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6, animation: "pulse 1s infinite" }} disabled={!isPT} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(pl.ult.name, pl.ult.el), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(pl.ult.name, pl.ult.el), fullscreen: true }); return; } bAct("ult"); }}>
                      <div style={{ fontWeight: 700 }}>🌟 {pl.ult.name}</div>
                      <div style={{ fontSize: 7, color: "#5b4300", fontWeight: 700 }}>Veil Expansion · <span style={{ color: ELC[pl.ult.el]||"#221" }}>{pl.ult.el}</span></div>
                      <div style={{ fontSize: 7, color: "#000" }}>Power: {pl.ult.pow} + MAG×2 · Cost: 0</div>
                      <div style={{ fontSize: 7, color: "#221" }}><span style={{ color: "#66bb6a", fontWeight: 700 }}>Additional Effect:</span> {battleEffectButtonText(pl.ult.fx, pl.ult.fxDur) || "None"}</div>
                    </button>
                    <button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(pl.ult.name, pl.ult.el), fullscreen: true }); }}>?</button>
                  </div>}</div>
              </div>
              {(eq.c1 || eq.c2) && <div className="battle-section" style={{ display: battleSection === "items" && battleSectionAvailable("items", { hasItems: true, isPT }) ? "block" : "none" }}>
                <div className="battle-section-title"><span style={{ color: T.gd }}>Battle Items</span><span style={{ fontSize: 7, color: T.dm }}>Quick consumables</span></div>
                <div className="battle-action-grid">
                  {eq.c1 && <div className="battle-action-card-wrap"><button className="bt battle-action-btn" style={{ background: T.ok + "22", border: "1px solid " + T.ok + "55", color: T.tx, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }} disabled={!isPT} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.c1.nm, "Null"), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.c1.nm, "Null"), fullscreen: true }); return; } bAct("c1"); }}>
                    <div style={{ fontWeight: 700 }}>🧪 {eq.c1.nm}</div>
                    <div style={{ fontSize: 8, color: T.tx }}>Effect: {itemEffectDetail(eq.c1)}</div>
                  </button><button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.c1.nm, "Null"), fullscreen: true }); }}>?</button></div>}
                  {eq.c2 && <div className="battle-action-card-wrap"><button className="bt battle-action-btn" style={{ background: T.ok + "22", border: "1px solid " + T.ok + "55", color: T.tx, textAlign: "center", paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }} disabled={!isPT} onTouchStart={(ev) => { const r=ev.currentTarget.getBoundingClientRect(); if(ev.touches[0].clientY-r.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.c2.nm, "Null"), fullscreen: true }); return; } }} onClick={(ev) => { if(popupJustOpenedRef.current) return; const r2=ev.currentTarget.getBoundingClientRect(); if(ev.clientY-r2.top<=18){ ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.c2.nm, "Null"), fullscreen: true }); return; } bAct("c2"); }}>
                    <div style={{ fontWeight: 700 }}>🧪 {eq.c2.nm}</div>
                    <div style={{ fontSize: 8, color: T.tx }}>Effect: {itemEffectDetail(eq.c2)}</div>
                  </button><button type="button" className="battle-help-chip" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPopup({ text: battleMatchupPopupText(eq.c2.nm, "Null"), fullscreen: true }); }}>?</button></div>}
                </div>
              </div>}
              {isPT && <div className="battle-section" style={{ display: battleSection === "aux" ? "block" : "none" }} data-battle-aux>
                <div className="battle-section-title"><span style={{ color: T.gd }}>Auxiliary Actions</span><span style={{ fontSize: 7, color: T.dm }}>Loadout changes end turn</span></div>
                <div className="battle-aux-row">
                  <button className="bt bs" style={{ background: btlPanel === "items" ? "#3486ff" : "#203867" }} onClick={() => setBtlPanel(btlPanel === "items" ? null : "items")}>🧪 Equip Item</button>
                  <button className="bt bs" style={{ background: btlPanel === "weapons" ? "#7c67ff" : "#332a6b" }} onClick={() => setBtlPanel(btlPanel === "weapons" ? null : "weapons")}>🗡️ Draw Weapon</button>
                  <button className="bt bs" style={{ background: btlPanel === "skills" ? "#2bb7a0" : "#164f49" }} onClick={() => setBtlPanel(btlPanel === "skills" ? null : "skills")}>⚔️ Swap Skill</button>
                  {ults.length > 1 && <button className="bt bs" style={{ background: btlPanel === "ults" ? "#d8a83b" : "#6b5320", color: "#fff7de" }} onClick={() => setBtlPanel(btlPanel === "ults" ? null : "ults")}>📖 Spellbook</button>}
                  <button className="bt bs" style={{ background: "#b84c68", color: "#fff3f6" }} disabled={!isPT} onClick={() => bAct("flee")}>🏃 Flee</button>
                </div>
                {btlPanel === "items" && isPT && <div style={{ marginTop: 4, padding: 4, background: T.c1, borderRadius: 5, maxHeight: 220, overflowY: "auto" }}>
                  <div style={{ fontSize: 9, color: T.dm, marginBottom: 2 }}>Equip item to empty slot (ends turn)</div>
                  {inv.filter(i => i.nm || i.ef).length === 0 && <div style={{ fontSize: 9, color: T.dm }}>No items available.</div>}
                  {inv.filter(i => i.nm || i.ef).map(i => <div key={i.id} style={{ padding: 3, fontSize: 9, cursor: "pointer", borderRadius: 3, background: T.c2, marginBottom: 1 }} onClick={() => bAct("btl_equip_item", i.id)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{i.nm||i.name} ×{i.qty||1}</span><span style={{ color: T.ok, fontSize: 8 }}>Equip →</span></div><div style={{ fontSize: 9, color: T.dm, marginTop: 1 }}>Effect: {itemEffectDetail(i)}</div></div>)}
                </div>}
                {btlPanel === "weapons" && isPT && <div style={{ marginTop: 4, padding: 4, background: T.c1, borderRadius: 5, maxHeight: 220, overflowY: "auto" }}>
                  <div style={{ fontSize: 9, color: T.dm, marginBottom: 2 }}>Draw/swap weapon from inventory (ends turn)</div>
                  {inv.filter(i => i.atk !== undefined).length === 0 && <div style={{ fontSize: 9, color: T.dm }}>No weapons in inventory.</div>}
                  {inv.filter(i => i.atk !== undefined).map(i => <div key={i.id} style={{ padding: 3, fontSize: 9, cursor: "pointer", borderRadius: 3, background: T.c2, marginBottom: 1 }} onClick={() => bAct("btl_equip_weapon", i.id)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{i.name} [{i.el}] ATK:{i.atk}</span><span style={{ color: T.ok, fontSize: 8 }}>{(eq.w1 && eq.w1.id === i.id) || (eq.w2 && eq.w2.id === i.id) ? "Equipped" : "Draw →"}</span></div><div style={{ fontSize: 9, color: T.dm, marginTop: 1 }}>Effect: {weaponEffectDetail(i)}</div><div style={{ fontSize: 9, color: T.dm, marginTop: 1 }}>{(() => { const lines = attackSummaryLines(i.el, 3); return <span><span style={{ color: "#ffd77a", fontWeight: 700 }}>Deals Extra Damage To:</span> {renderMatchupItems(lines.dealMore, "deal")}</span>; })()}</div></div>)}
                </div>}
                {btlPanel === "skills" && isPT && <div style={{ marginTop: 4, padding: 4, background: T.c1, borderRadius: 5, maxHeight: 220, overflowY: "auto" }}>
                  <div style={{ fontSize: 9, color: T.dm, marginBottom: 2 }}>Swap an equipped skill (ends turn)</div>
                  {pl.skills.filter(s => s.unlocked && !s.equipped).map(sk => <div key={sk.id} style={{ padding: 2, fontSize: 9, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderRadius: 3, background: T.c2, marginBottom: 1 }} onClick={() => bAct("btl_equip_skill", sk.id)}><span>{sk.n} [{sk.el}] P:{sk.pow} MP:{sk.mp}</span><span style={{ color: T.ok, fontSize: 8 }}>Equip →</span></div>)}
                </div>}
                {btlPanel === "ults" && isPT && <div style={{ marginTop: 4, padding: 4, background: T.c1, borderRadius: 5, maxHeight: 220, overflowY: "auto" }}>
                  <div style={{ fontSize: 9, color: T.dm, marginBottom: 2 }}>Set forbidden magic from spellbook (ends turn, resets chain)</div>
                  {(ults.length ? ults : [pl.ult]).map((u, i) => <div key={i} style={{ padding: 2, fontSize: 9, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderRadius: 3, background: pl.ult.name === u.name ? T.gd + "22" : T.c2, marginBottom: 1 }} onClick={() => { if (pl.ult.name !== u.name) bAct("btl_set_ult", i); }}><span>{u.name} P:{u.pow} {u.fx||""}</span><span style={{ color: pl.ult.name === u.name ? T.ok : T.ac, fontSize: 8 }}>{pl.ult.name === u.name ? "Active" : "Set →"}</span></div>)}
                </div>}
              </div>}
            </div>
          </div>
          <div className="battle-side-stack">
            <div className="cd battle-log-card" style={{ padding: "4px 6px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.gd }}>Battle Log</span>
                <button className="bt bs" style={{ background: T.c2, padding: "2px 7px", fontSize: 8, color: "#eef4ff" }} onClick={() => { const txt = log.join("\n"); navigator.clipboard?.writeText(txt); notify("Log copied!"); }}>📋 Copy</button>
              </div>
              <div style={{ maxHeight: "none", overflowY: "auto", lineHeight: 1.4 }} ref={logR} className="blog-sel">
              {buildGroupedBattleLog(log).map((grp, i) => {
                const eventLike = grp.type === "event";
                const baseClass = eventLike ? "log-loss" : (grp.type === "enemy" ? "log-loss" : "log-attack");
                return <div key={i} className={"battle-log-entry " + baseClass} style={{ color: eventLike ? "#ff8f8f" : "#dbe4ff" }}>
                  <div style={{ fontWeight: 800, marginBottom: grp.lines.length ? 4 : 0, color: eventLike ? "#ff7e7e" : "#f1f4ff" }}>{grp.title}</div>
                  <div style={{ display: "grid", gap: 3 }}>
                    {grp.lines.map((line, li) => <div key={li} style={{ color: eventLike ? "#ff7e7e" : "#dbe4ff", fontWeight: 600, opacity: 0.98 }}>
                      {eventLike ? renderClickableLogText(line, "event_" + i + "_" + li) : <><span style={{ color: "#9fb2e8" }}>• </span>{renderClickableLogText(line, "grp_" + i + "_" + li)}</>}
                    </div>)}
                  </div>
                </div>;
              })}
              </div>
            </div>
          </div>
        </div>
      </div></div>
    );
  }

  // SUBMAP (hostile camps, rifts)
  if (scr === "submap" && subMap) {
    const sm = subMap;
    const isRift = sm.type === "rift";
    const cols = isRift ? 10 : 10;
    const rows = isRift ? 10 : 10;
    const smTile = sm.tiles[sm.pos.y * cols + sm.pos.x];
    const remainingEncounters = sm.tiles.filter((tt, i) => tt.type === "encounter" && !sm.cleared.includes((i % cols) + "_" + Math.floor(i / cols))).length;
    const remainingTreasures = sm.tiles.filter((tt, i) => (tt.type === "treasure" || tt.type === "treasure_rift") && !sm.cleared.includes((i % cols) + "_" + Math.floor(i / cols))).length;
    const bossTile = sm.tiles.find(tt => tt.type === "boss");
    const bossStatus = !bossTile ? "None" : sm.bossAlive ? (remainingEncounters > 0 ? "Locked" : "Ready") : "Defeated";
    const smBg = isRift ? "linear-gradient(180deg, rgba(50,18,78,0.98), rgba(12,8,28,0.98))" : "linear-gradient(180deg, rgba(66,33,16,0.98), rgba(20,12,8,0.98))";
    return (
      <div className={"pg " + (isRift ? "rift-bg" : "outpost-bg")}><div className="wr shell-viewport" style={{position:"relative",zIndex:1}}>{notiEl}{tipEl}{popupEl}{chatEl}{hud}
        <div className="cd" style={{ padding: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div><div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: isRift ? "#9c27b0" : T.bad }}>{isRift ? "🌀" : "⛺"} {sm.name}</div><div style={{ fontSize: 9, color: T.dm }}>{sm.type === "hostile" ? "Outpost" : "Dimensional Rift"} · ({sm.pos.x},{sm.pos.y})</div></div>
            <button className="bt bs" style={{ background: T.wn }} onClick={() => { if (sm.type === "hostile") setHostileCDs(cd => ({...cd, [sm.origin.x+"_"+sm.origin.y]: timerNow + 12*3600000})); if (sm.type === "rift") setRiftCDs(cd => ({...cd, [sm.origin.x+"_"+sm.origin.y]: timerNow + 48*3600000})); setPos(sm.origin); setSubMap(null); setScr("map"); }}>🔙 Return to World</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
            <div style={{ background: T.c2, border: "1px solid " + T.bd, borderRadius: 6, padding: "5px 6px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isRift ? "#c688ff" : T.bad, marginBottom: 2 }}>Objective</div>
              <div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35 }}>
                {isRift ? "Push deeper through the rift path, clear the boss, then claim the final treasure." : "Clear encounters, defeat the boss, then claim the treasure cache."}
              </div>
            </div>
            <div style={{ background: T.c2, border: "1px solid " + T.bd, borderRadius: 6, padding: "5px 6px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.gd, marginBottom: 2 }}>Status</div>
              <div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.45 }}>
                <div>Encounters remaining: <span style={{ color: remainingEncounters > 0 ? T.bad : T.ok, fontWeight: 700 }}>{remainingEncounters}</span></div>
                <div>Boss: <span style={{ color: bossStatus === "Locked" ? T.wn : bossStatus === "Ready" ? T.bad : bossStatus === "Defeated" ? T.ok : T.dm, fontWeight: 700 }}>{bossStatus}</span></div>
                <div>Treasures remaining: <span style={{ color: remainingTreasures > 0 ? T.gd : T.ok, fontWeight: 700 }}>{remainingTreasures}</span></div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat("+cols+",1fr)", gap: 1, maxWidth: 340, margin: "0 auto 6px", background: smBg, borderRadius: 6, overflow: "hidden", border: "1px solid " + T.bd }}>
            {sm.tiles.map((t, idx) => {
              const tx = idx % cols, ty = Math.floor(idx / cols);
              const isMe = tx === sm.pos.x && ty === sm.pos.y;
              const cleared = sm.cleared.includes(tx+"_"+ty);
              const ic = isMe ? (cls?.ic||"👤") : t.type === "boss" ? (cleared ? "💀" : "👹") : t.type === "encounter" ? (cleared ? "✓" : (isRift ? "✦" : "⚔")) : t.type === "treasure" || t.type === "treasure_rift" ? (cleared ? "✓" : "💎") : t.type === "ruin_puzzle" ? (cleared ? "✓" : "🏛") : t.type === "safe" ? (isRift ? "◈" : "·") : "·";
              const bg = isMe ? "radial-gradient(circle at 50% 38%, rgba(242,196,92,0.36), transparent 58%), linear-gradient(180deg, rgba(78,58,18,0.9), rgba(32,22,8,0.95))" : t.type === "boss" ? (cleared?"linear-gradient(180deg, rgba(44,44,52,0.65), rgba(18,18,24,0.8))":"linear-gradient(180deg, rgba(118,38,52,0.72), rgba(42,12,18,0.9))") : t.type === "encounter" ? (cleared?"linear-gradient(180deg, rgba(34,40,52,0.55), rgba(14,18,24,0.72))":(isRift ? "linear-gradient(180deg, rgba(105,62,165,0.52), rgba(32,18,60,0.84))" : "linear-gradient(180deg, rgba(128,84,28,0.56), rgba(38,20,10,0.82))")) : (t.type === "treasure"||t.type === "treasure_rift") ? "linear-gradient(180deg, rgba(148,118,26,0.58), rgba(42,28,8,0.86))" : t.type === "ruin_puzzle" ? "linear-gradient(180deg, rgba(86,78,112,0.54), rgba(24,20,36,0.84))" : (isRift ? "linear-gradient(180deg, rgba(36,24,58,0.45), rgba(14,10,24,0.8))" : "linear-gradient(180deg, rgba(48,33,20,0.38), rgba(18,12,8,0.78))");
              const borderColor = isMe ? T.gd : t.type === "boss" ? (cleared ? "rgba(255,255,255,0.12)" : "#ff7189") : t.type === "encounter" ? (isRift ? "#b889ff" : "#ffb066") : (t.type === "treasure"||t.type === "treasure_rift") ? "#ffd35f" : t.type === "ruin_puzzle" ? "#b9a6ff" : "rgba(255,255,255,0.06)";
              return <div key={idx} style={{ position: isMe ? "relative" : undefined, overflow: isMe ? "hidden" : undefined, aspectRatio:"1", background: bg, display:"flex", alignItems:"center", justifyContent:"center", color: isMe ? "#fff2c2" : "#edf4ff", fontSize: isMe?14:10, borderRadius: 3, border: "1.5px solid " + borderColor, boxShadow: isMe ? "0 0 12px rgba(242,196,92,0.42), inset 0 0 0 1px rgba(255,255,255,0.12)" : "inset 0 0 0 1px rgba(255,255,255,0.04)", cursor:"pointer", textShadow: "0 0 8px rgba(0,0,0,0.4)" }} onClick={() => { if (Math.abs(tx-sm.pos.x)+Math.abs(ty-sm.pos.y)===1) subMapMove(tx-sm.pos.x, ty-sm.pos.y); }}>{isMe ? playerAvatar(pl?.cid || cls?.id, cls?.ic || "👤", pl?.portrait, pl?.sex) : ic}</div>;
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gridTemplateColumns: "34px 34px 34px", gap: 1 }}>
              <div /><button className="bt bs" style={{ background: "linear-gradient(180deg, rgba(52,42,86,0.98), rgba(24,18,42,0.98))", color: "#f2c45c", width:34,height:34, boxShadow: "0 6px 12px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)" }} onClick={()=>subMapMove(0,-1)}>↑</button><div />
              <button className="bt bs" style={{ background: "linear-gradient(180deg, rgba(52,42,86,0.98), rgba(24,18,42,0.98))", color: "#f2c45c", width:34,height:34, boxShadow: "0 6px 12px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)" }} onClick={()=>subMapMove(-1,0)}>←</button>
              <div style={{width:34,height:34}} />
              <button className="bt bs" style={{ background: "linear-gradient(180deg, rgba(52,42,86,0.98), rgba(24,18,42,0.98))", color: "#f2c45c", width:34,height:34, boxShadow: "0 6px 12px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)" }} onClick={()=>subMapMove(1,0)}>→</button>
              <div /><button className="bt bs" style={{ background: "linear-gradient(180deg, rgba(52,42,86,0.98), rgba(24,18,42,0.98))", color: "#f2c45c", width:34,height:34, boxShadow: "0 6px 12px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)" }} onClick={()=>subMapMove(0,1)}>↓</button><div />
            </div>
            <button className="bt bs" style={{ background: T.ok }} onClick={() => { var hp = inv.find(function (i) { return i.ef === "heal"; }); if (hp) { var s = effSt(pl); setPl(function (p) { return Object.assign({}, p, { chp: Math.min(s.hp, p.chp + hp.v) }); }); setInv(function (iv) { var ni = iv.slice(); var ii = ni.findIndex(function (x) { return x.id === hp.id; }); if (ii >= 0) { if (ni[ii].qty > 1) ni[ii] = Object.assign({}, ni[ii], { qty: ni[ii].qty - 1 }); else ni.splice(ii, 1); } return ni; }); notify("Healed!"); } else notify("No potions!"); }}>🧪 HP</button>
            <button className="bt bs" style={{ background: T.mp }} onClick={() => { var mp = inv.find(function(i){return i.ef === "mp";}); if (mp) { var s = effSt(pl); setPl(function(p){return Object.assign({},p,{cmp:Math.min(s.mp,p.cmp+mp.v)});}); setInv(function(iv){var ni=iv.slice();var ii=ni.findIndex(function(x){return x.id===mp.id;});if(ii>=0){if(ni[ii].qty>1)ni[ii]=Object.assign({},ni[ii],{qty:ni[ii].qty-1});else ni.splice(ii,1);}return ni;}); notify("MP restored!"); } else notify("No mana items!"); }}>💧 MP</button>
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", fontSize: 7 }}>
            <span style={{ color: T.bad }}>⚔ Encounter</span><span style={{ color: T.bad }}>👹 Boss</span><span style={{ color: T.gd }}>💎 Treasure</span>{isRift && <span style={{ color: "#9c27b0" }}>🏛 Puzzle</span>}
          </div>
          <div style={{ fontSize: 9, color: T.dm, marginTop: 4, lineHeight: 1.35 }}>
            {bossStatus === "Locked" ? "Defeat all regular encounters to unlock the boss." : bossStatus === "Ready" ? "The boss is available. Treasure unlocks after victory." : bossStatus === "Defeated" ? "Boss defeated. Remaining treasure can now be claimed." : ""}
          </div>
        </div>
        <div className="cd feed-log-card" style={{ maxHeight: 112, overflowY: "auto", padding: 6 }} ref={logR}>{[...log].reverse().map((l,i) => { const isEvent = String(l).startsWith("EVENT|"); const txt = isEvent ? ("Event: " + String(l).replace(/^EVENT\|/, "")) : l; return <div key={i} className={"feed-entry" + (i === 0 ? " is-current" : "")} style={isEvent ? { color: "#ff8a80", borderLeftColor: "rgba(229,57,53,0.95)" } : null}>{txt}</div>; })}</div>
      </div></div>
    );
  }

  // TOWN
  if (scr === "town") {
    const tn = mData ? (mData[pos.y * MW + pos.x]?.poi?.nm || "Town") : "Town";
    const TOWN_SPECIALS = {
      "Ashford": [{id:"market",nm:"Fish Market",ic:"🐟"},{id:"herbalist",nm:"Herbalist",ic:"🌿"}],
      "Eldergrove": [{id:"enchant",nm:"Enchanter",ic:"✨"},{id:"beastmaster",nm:"Beast Master",ic:"🐾"}],
      "Stonehelm": [{id:"armorer",nm:"Master Armorer",ic:"🛡"},{id:"jeweler",nm:"Jeweler",ic:"💎"}],
      "Sunhaven": [{id:"market",nm:"Fish Market",ic:"🐟"},{id:"oracle",nm:"Oracle",ic:"🔮"}],
      "Coral Harbor": [{id:"market",nm:"Fish Market",ic:"🐟"},{id:"shipwright",nm:"Shipwright",ic:"⚓"}],
      "Mistwater": [{id:"alchemist",nm:"Alchemist",ic:"⚗️"},{id:"herbalist",nm:"Herbalist",ic:"🌿"}],
      "Cindervale": [{id:"armorer",nm:"Master Armorer",ic:"🛡"},{id:"enchant",nm:"Enchanter",ic:"✨"}],
      "Frostwall": [{id:"jeweler",nm:"Jeweler",ic:"💎"},{id:"oracle",nm:"Oracle",ic:"🔮"}],
      "Verdant Deep": [{id:"beastmaster",nm:"Beast Master",ic:"🐾"},{id:"herbalist",nm:"Herbalist",ic:"🌿"}],
      "Rift's Edge": [{id:"alchemist",nm:"Alchemist",ic:"⚗️"},{id:"enchant",nm:"Enchanter",ic:"✨"}],
    };
    const townSpecials = TOWN_SPECIALS[tn] || [];
    const townFocus = (TOWN_PROFILES[tn] || {}).focus || [];
    const SVC_CAT = { shop:"commerce", smith:"commerce", bank:"commerce", market:"commerce", jeweler:"commerce", shipwright:"commerce", arena:"combat", duel:"combat", train:"combat", guild:"combat", inn:"social", tavern:"social", lib:"mystic", covenant:"mystic", crafting:"mystic", enchant:"mystic", oracle:"mystic", alchemist:"mystic", herbalist:"nature", beastmaster:"nature", armorer:"commerce" };
    const svcs = [
      { id: "shop", nm: "Merchant", ic: "🛒" },
      { id: "smith", nm: "Forge", ic: "🔨" },
      { id: "inn", nm: "Inn", ic: "🏨" },
      { id: "bank", nm: "Vault", ic: "🏦" },
      { id: "guild", nm: "Guild", ic: "📜" },
      { id: "arena", nm: "Arena", ic: "⚔️" },
      { id: "duel", nm: "Duelist's Circle", ic: "🤺" },
      { id: "lib", nm: "Library", ic: "📚" },
      { id: "train", nm: "Training", ic: "🎯" },
      { id: "tavern", nm: "Tavern", ic: "🍺" },
      { id: "covenant", nm: "Covenant Hall", ic: "🏛" },
      { id: "crafting", nm: "Relic Crafting", ic: "⚗️" },
      ...townSpecials,
    ].map(s => ({ ...s, cat: SVC_CAT[s.id] || "mystic" }));

    return (
      <div className="pg town-bg"><div className="wr shell-viewport">{notiEl}{tipEl}{popupEl}{chatEl}{hud}<div className="cd page-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: T.gd }}>🏘️ {tn}</div>
          <button className="bt bs" style={{ background: T.ac }} onClick={() => { setSvc(null); setScr("map"); }}>Leave</button>
        </div>
        <div className="town-profile-card" style={{ marginBottom: 8, padding: 7, borderRadius: 8, background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))", border: "1px solid " + T.bd }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.gd }}>{(TOWN_PROFILES[tn] || {}).title || 'Frontier Settlement'}</div>
          <div style={{ fontSize: 9, color: T.dm, marginTop: 2 }}>{(TOWN_PROFILES[tn] || {}).vibe || 'A settlement shaped by the dangers and economies around it.'}</div>
          <div style={{ fontSize: 8, color: '#cfd3ea', marginTop: 3, lineHeight: 1.35 }}><span style={{ color: '#f2c45c', fontWeight: 700 }}>Strategic Edge:</span> {(TOWN_PROFILES[tn] || {}).edge || 'A stable place to regroup and choose the next route.'}</div>
          {townFocus.length > 0 && <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5 }}>{townFocus.map(f => <span key={f} style={{ fontSize:7, padding:'2px 7px', borderRadius:999, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(242,196,92,0.16)', color:'#e7efff' }}>{f}</span>)}</div>}
        </div>

        {!svc && (
          <div>
            <div className="svc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(82px, 1fr))", gap: 4 }}>
              {svcs.map((s) => (
                <div key={s.id} className="svc-card" data-cat={s.cat} style={{ padding: "8px 4px", borderRadius: 7, cursor: "pointer", textAlign: "center", transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease" }} onClick={() => setSvc(s.id)}>
                  <div className="svc-ic" style={{ marginBottom: 2, lineHeight: 1 }}>{s.ic}</div>
                  <div className="svc-nm" style={{ fontSize: 8, lineHeight: 1.2 }}>{s.nm}</div>
                </div>
              ))}
            </div>
            {/* Timers */}
            <div className="town-timer-card" style={{ marginTop: 8, padding: 7, background: T.c2, borderRadius: 6, fontSize: 9, color: T.dm, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 5 }}>
              <span>🛒 Market Stock: <span style={{ color: T.gd }}>{getTimerRemaining(12)}</span></span>
              <span>⚗️ Service Stock: <span style={{ color: T.gd }}>{getTimerRemaining(12)}</span></span>
              <span>🏦 Vault Interest: <span style={{ color: T.gd }}>{getTimerRemaining(24)}</span></span>
              <span>🍺 Tavern Rotation: <span style={{ color: T.gd }}>{getTimerRemaining(8)}</span></span>
              <span>💎 Loot Drift: <span style={{ color: T.gd }}>{getTimerRemaining(1)}</span></span>
              <span>🌀 Rift Shift: <span style={{ color: T.gd }}>{getTimerRemaining(12)}</span></span>
              {arenaCD > timerNow && <span>⚔️ Arena: <span style={{ color: T.wn }}>{getCountdownTo(arenaCD)}</span></span>}
              {loan > 0 && <span style={{ gridColumn: "1/-1", color: T.bad }}>💸 Loan: <span style={{ fontWeight: 700 }}>{getCountdownTo(loanTime + 48*3600000)}</span> ({loan}G)</span>}
            </div>
          </div>
        )}

        {svc && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: T.gd }}>{svcs.find((s) => s.id === svc)?.ic} {svcs.find((s) => s.id === svc)?.nm}</div>
              <button className="bt bs" style={{ background: T.c2 }} onClick={() => setSvc(null)}>← Back</button>
            </div>

            {svc === "inn" && (function(){
              const streak = pl.restStreak || 0;
              const dayKey = (pl.generation || 1) * 100 + ageDay;
              const sameDay = pl.lastRestDay === dayKey;
              const nextStreak = sameDay ? streak : streak + 1;
              const tier = Math.min(7, nextStreak);
              const goldBonus = sameDay ? 0 : tier * 5;
              const shardBonus = !sameDay && tier >= 3 ? 1 : 0;
              const xpBonus = sameDay ? 0 : tier * 12;
              const tierName = ["—","Wayfarer","Disciple","Devoted","Watchful","Steadfast","Anointed","Ascendant"][tier] || "Ascendant";
              return <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span className="streak-badge">🔥 Day {nextStreak} · {tierName}</span>
                </div>
                <p style={{ fontSize: 10, color: T.dm, marginBottom: 4, lineHeight: 1.4 }}>Rest fully (15G). Each new day continues your streak — rewards grow per tier, capped at day 7.</p>
                {sameDay
                  ? <div style={{ fontSize: 9, color: T.wn, marginBottom: 8 }}>Already rested today — only heal restored. Streak resumes tomorrow.</div>
                  : <div style={{ fontSize: 9, color: T.gd, marginBottom: 8 }}>Reward: +{xpBonus} XP · +{goldBonus}G{shardBonus ? " · +" + shardBonus + " Relic Shard" : ""}</div>
                }
                <button className="bt" style={{ background: T.ok }} onClick={() => {
                  if (gold < 15) { notify("Need 15G!"); return; }
                  const s = effSt(pl);
                  setPl(p => ({ ...p, chp: s.hp, cmp: s.mp, pUsed: false, restStreak: nextStreak, lastRestDay: dayKey }));
                  setGold(g => g - 15 + goldBonus);
                  if (shardBonus) setShards(s2 => s2 + shardBonus);
                  if (xpBonus && typeof giveXP === "function") { try { giveXP(xpBonus); } catch (_) {} }
                  notify(sameDay ? "Rested!" : ("Day " + nextStreak + " streak! +" + goldBonus + "G" + (shardBonus ? " +" + shardBonus + "🔮" : "")));
                }}>Rest at the Inn</button>
                <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 8 }}>
                  {[1,2,3,4,5,6,7].map(d => <div key={d} title={"Day " + d} style={{ width: 16, height: 16, borderRadius: 4, background: nextStreak >= d ? T.gd : T.c1, border: "1px solid " + T.bd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: nextStreak >= d ? "#1a1408" : T.dm, fontWeight: 700 }}>{d}</div>)}
                </div>
              </div>;
            })()}

            {svc === "shop" && (function(){ if (!shopStock) { return <div style={{ fontSize: 9, color: T.dm }}>Stocking shelves...</div>; } return <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
              <div style={{ fontSize: 10, color: T.gd, marginBottom: 3, fontWeight: 700, letterSpacing: 0.3 }}>Weapons ({shopStock.wpn.length} in stock)</div>
              {shopStock.wpn.map(function(w){ return <div key={w.id} style={{ padding: 6, background: T.c2, borderRadius: 4, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, gap: 8, border: "1px solid "+(ELC[w.el]||T.bd)+"33" }}><div style={{ minWidth: 0, flex: 1 }}><div><span style={{ fontWeight: 700, color: T.tx }}>{w.name}</span></div><div style={{ fontSize: 8, color: ELC[w.el] || T.dm, fontWeight: 700, marginTop: 1 }}>Element: {w.el}</div><div style={{ fontSize: 9, color: T.dm }}>ATK: {w.atk} · MAG: {w.mag} · DEF: {w.def||0} · SPD: {w.spd||0}</div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35 }}>{elementMatchupText(w.el)}</div><div style={{ fontSize: 8, color: "#e6dcc0", lineHeight: 1.35 }}>{weaponEffectDetail(w)}</div></div><button className="bt bs" style={{ background: gold >= w.price ? T.gd : "#333" }} disabled={gold < w.price} onClick={function(){ if(!eq.w1){ setGold(function(g){return g-w.price;}); setEq(function(e){return Object.assign({},e,{w1:w});}); setShopStock(function(ss){return Object.assign({},ss,{wpn:ss.wpn.filter(function(x){return x.id!==w.id;})});}); notify("Got "+w.name); return; } if(!eq.w2){ setGold(function(g){return g-w.price;}); setEq(function(e){return Object.assign({},e,{w2:w});}); setShopStock(function(ss){return Object.assign({},ss,{wpn:ss.wpn.filter(function(x){return x.id!==w.id;})});}); notify("Got "+w.name); return; } const ok = tryGainLooseItem(Object.assign({},w,{qty:1}), null, "Merchant"); if(!ok) return; setGold(function(g){return g-w.price;}); setShopStock(function(ss){return Object.assign({},ss,{wpn:ss.wpn.filter(function(x){return x.id!==w.id;})});}); notify("Got "+w.name); }}>{w.price}G</button></div>; })}
              {shopStock.wpn.length === 0 && <div style={{ fontSize: 9, color: T.wn }}>Sold out! Restocks with timer.</div>}
              <div style={{ fontSize: 10, color: "#9fd6ff", marginTop: 7, marginBottom: 3, fontWeight: 700, letterSpacing: 0.3 }}>Consumables</div>
              {shopStock.con.map(function(c){ return <div key={c.id} style={{ padding: 5, background: T.c2, borderRadius: 4, marginBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, opacity: c.stock > 0 ? 1 : 0.3, gap: 8, border: "1px solid #2d355f" }}><div style={{ minWidth: 0, flex: 1 }}><div><span style={{ fontWeight: 700, color: T.tx }}>{c.nm}</span> <span style={{ color: T.dm, fontSize: 8 }}>×{c.stock}</span></div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35, marginTop: 1 }}><span style={{ color: "#9fd6ff", fontWeight: 700 }}>Effect:</span> {itemEffectDetail(c)}</div></div><button className="bt bs" style={{ background: gold >= c.pr && c.stock > 0 ? T.ok : "#333" }} disabled={gold < c.pr || c.stock <= 0} onClick={function(){ setGold(function(g){return g-c.pr;}); var ex=inv.find(function(i){return i.id===c.id;}); if(ex) setInv(function(iv){return iv.map(function(i){return i.id===c.id?Object.assign({},i,{qty:i.qty+1}):i;});}); else setInv(function(iv){return [].concat(iv,[Object.assign({},c,{qty:1})]);}); setShopStock(function(ss){return Object.assign({},ss,{con:ss.con.map(function(x){return x.id===c.id?Object.assign({},x,{stock:x.stock-1}):x;})});}); notify("Bought!"); }}>{c.pr}G</button></div>; })}
              <div style={{ fontSize: 9, color: T.dm, marginTop: 4 }}>Stock refreshes with timer. Rare items found in world.</div>
            </div>; })()}

            {svc === "bank" && <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.gd }}>💰 {bank}G</div>
              <div style={{ fontSize: 10, color: T.dm, marginBottom: 4 }}>5% daily interest on savings (applies automatically)</div>
              <div style={{ fontSize: 9, color: T.dm, marginBottom: 8 }}>⏰ Next interest in: {getTimerRemaining(24)}</div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
                {[50,100,500].map(a => <button key={a} className="bt bs" style={{ background: gold >= a ? T.ok : "#333" }} disabled={gold < a} onClick={() => { setGold(g => g - a); setBank(b => b + a); }}>+{a}</button>)}
                {[50,100,500].map(a => <button key={"w"+a} className="bt bs" style={{ background: bank >= a ? T.wn : "#333" }} disabled={bank < a} onClick={() => { setBank(b => b - a); setGold(g => g + a); }}>-{a}</button>)}
              </div>
              <div style={{ borderTop: "1px solid " + T.bd, paddingTop: 8, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: loan > 0 ? T.bad : T.dm, marginBottom: 4 }}>🏦 Loan: {loan}G owed</div>
                {loan > 0 && <div style={{ fontSize: 8, color: T.bad, marginBottom: 4 }}>⏰ Repay within 48h or lose 10% gold/hr! Time left: {getCountdownTo(loanTime + 48*3600000)}</div>}
                {loan === 0 && <div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>Max loan: {Math.floor(50 + (pl?.level||1) * 30 + bank * 0.5)}G (based on level + savings)</div>}
                {loan === 0 && <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                  {[50,100,200].map(a => { const maxLoan = Math.floor(50 + (pl?.level||1) * 30 + bank * 0.5); return <button key={a} className="bt bs" style={{ background: a <= maxLoan ? T.ac : "#333" }} disabled={a > maxLoan} onClick={() => { setLoan(a); setLoanTime(timerNow); setLoanPenaltyMark(0); setGold(g => g + a); notify("Borrowed " + a + "G! Repay within 48h."); }}>Borrow {a}G</button>; })}
                </div>}
                {loan > 0 && <button className="bt bs" style={{ background: gold >= loan ? T.ok : "#333" }} disabled={gold < loan} onClick={() => { setGold(g => g - loan); setLoan(0); setLoanTime(0); setLoanPenaltyMark(0); notify("Loan repaid!"); }}>Repay {loan}G</button>}
              </div>
              {paidRumor && paidRumorCycle === tavernRumorCycle && <div style={{ padding: 6, background: T.ac + "12", border: "1px solid " + T.ac + "33", borderRadius: 5, marginTop: 6 }}><div style={{ fontSize: 10, fontWeight: 700, color: T.ac, marginBottom: 3 }}>Purchased Lead</div><div style={{ fontSize: 9, color: T.tx, lineHeight: 1.45 }}>{paidRumor}</div></div>}
            </div>}

            {svc === "arena" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: T.dm, marginBottom: 6 }}>Win to earn gold, XP, and relic shards (40% chance)!</div>{arenaCD > timerNow ? <div style={{ fontSize: 10, color: T.wn }}>⏰ Cooldown: {getCountdownTo(arenaCD)}</div> : <button className="bt" style={{ background: T.bad }} onClick={() => { setArenaCD(timerNow + 300000); const oc = P(CLS); const lv = C(pl.level + R(-2,2),1,999); const s = 1+lv*0.12; const e = { id:ID(), name:P(["Aria","Kael","Vex","Nyx","Orion"])+" the "+oc.nm, hp:Math.floor(oc.st.hp*s), mhp:Math.floor(oc.st.hp*s), atk:Math.floor(oc.st.atk*s), def:Math.floor(oc.st.def*s), spd:Math.floor(oc.st.spd*s), mag:Math.floor(oc.st.mag*s), el:oc.el, el2:oc.el2 || null, xp:50+lv*6, gold:40+lv*5, skills:[{n:oc.el+" Strike",pow:15+lv*2,el:oc.el,fx:null},{n:(oc.el2 || oc.el)+" Blast",pow:20+lv*3,el:(oc.el2 || oc.el),fx:P(["burn","freeze","stun","bleed"])}], efx:[], boss:false, arena:true }; startBattle([e],"pvp"); setSvc(null); }}>⚔️ Fight!</button>}</div>}

            {svc === "duel" && (function(){
              const cov = pl.covenant ? getCV(pl.covenant) : null;
              const tier = pl.duelTier || 0;
              const tierNames = ["Initiate","Challenger","Contender","Veteran","Sanctioned"];
              const tierName = tierNames[Math.min(tier, tierNames.length - 1)];
              const lvAdj = Math.max(0, Math.floor(tier * 1.4));
              const reward = { g: 60 + tier * 22, xp: 70 + tier * 18, sh: tier >= 2 ? 1 : 0 };
              return <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.gd, fontFamily: "'Cinzel',serif", fontWeight: 700, marginBottom: 4 }}>🤺 Duelist's Circle</div>
                <div style={{ fontSize: 9, color: T.dm, lineHeight: 1.45, marginBottom: 6 }}>Sanctioned 1-on-1 sparring against another sorcerer. The covenants observe and grade. No deaths — only tested techniques and bruised pride.</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                  <span className="streak-badge" style={{ background: "linear-gradient(180deg,#3a1a55,#2a103e)", color: "#e0caff", borderColor: "#7a4ab8" }}>Tier {tier} · {tierName}</span>
                  {cov && <span className="streak-badge" style={{ background: cov.cl + "22", color: cov.cl, borderColor: cov.cl + "66" }}>{cov.ic} {cov.nm}</span>}
                </div>
                <div style={{ fontSize: 9, color: T.gd, marginBottom: 8 }}>Win: +{reward.g}G · +{reward.xp} XP{reward.sh ? " · +1 Relic Shard" : ""}</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="bt" style={{ background: "linear-gradient(180deg,#7a3aa0,#4d2470)" }} onClick={() => {
                    const oc = P(CLS);
                    const lv = C(pl.level + lvAdj + R(-1, 2), 1, 999);
                    const s = 1 + lv * 0.13;
                    const opName = P(["Soren","Mirae","Iko","Vael","Ren","Yuki","Calix","Nori","Tova","Daro"]);
                    const e = {
                      id: ID(),
                      name: opName + " · " + oc.nm,
                      hp: Math.floor(oc.st.hp * s), mhp: Math.floor(oc.st.hp * s),
                      atk: Math.floor(oc.st.atk * s), def: Math.floor(oc.st.def * s),
                      spd: Math.floor(oc.st.spd * s), mag: Math.floor(oc.st.mag * s),
                      el: oc.el, el2: oc.el2 || null,
                      xp: reward.xp, gold: reward.g,
                      skills: [
                        { n: oc.el + " Strike", pow: 16 + lv * 2, el: oc.el, fx: null },
                        { n: (oc.el2 || oc.el) + " Surge", pow: 22 + lv * 3, el: (oc.el2 || oc.el), fx: P(["burn","freeze","stun","bleed","silence"]) },
                      ],
                      efx: [], boss: false, arena: true, duel: true,
                    };
                    setPl(p => ({ ...p, duelTier: (p.duelTier || 0) + 1 }));
                    setStory(st => st.map(q => {
                      if (q.id === "s9" && !q.done) {
                        const p2 = { ...q, prog: (q.prog || 0) + 1 };
                        if (p2.prog >= (p2.goal || 5)) p2.done = true;
                        return p2;
                      }
                      if (q.id === "s8" && !q.done && pl.covenant) {
                        const p2 = { ...q, prog: (q.prog || 0) + 1 };
                        if (p2.prog >= (p2.goal || 3)) p2.done = true;
                        return p2;
                      }
                      return q;
                    }));
                    startBattle([e], "duel");
                    setSvc(null);
                  }}>🤺 Accept Sparring Match</button>
                </div>
                <div style={{ fontSize: 8, color: T.dm, marginTop: 6, fontStyle: "italic", lineHeight: 1.4 }}>Multiplayer note: when PvP servers are live, this circle becomes the matchmaking queue against real players. Tier and covenant standing carry over.</div>
              </div>;
            })()}

            {svc === "lib" && <div><div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>Upgrade skills with relic fragments. Max Lv.10</div><div style={{ fontSize: 9, color: "#ce93d8", marginBottom: 4 }}>🔮 Fragments: {fragments}</div>{pl.skills.filter(s => s.unlocked).map(sk => <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", padding: 4, background: T.c2, borderRadius: 4, marginBottom: 2, alignItems: "center", fontSize: 10 }}><div><span style={{ fontWeight: 700 }}>{sk.n}</span> <span style={{ color: T.dm }}>Lv.{sk.lvl}/10</span></div>{sk.lvl < 10 ? <button className="bt bs" style={{ background: fragments >= 1 ? T.ac : "#333" }} disabled={fragments < 1} onClick={() => { setPl(p => ({ ...p, skills: p.skills.map(s => s.id === sk.id ? upgradeSkillForBalance(s) : s) })); setFragments(f => f - 1); notify("Upgraded to Lv." + (sk.lvl + 1) + "!"); }}>🔮1 Frag</button> : <span style={{ color: T.gd, fontSize: 8 }}>MAX</span>}</div>)}</div>}
            {svc === "train" && <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.dm, marginBottom: 8 }}>🎯 Maletal Afterimage Training<br/><span style={{ fontSize: 9 }}>Test damage and skills on a training dummy. No HP lost and flee is always successful.</span></div>
              <button className="bt" style={{ background: T.ac }} onClick={() => { const dummy = { id: "dummy", name: "Training Dummy", hp: 9999, mhp: 9999, atk: 1, def: 5, spd: 1, mag: 1, el: "Null", xp: 0, gold: 0, skills: [{ n: "Null Tap", pow: 1, el: "Null", fx: null }], efx: [], boss: false }; startBattle([dummy], "train"); setSvc(null); }}>Begin Training</button>
            </div>}

            {svc === "smith" && <div style={{ textAlign: "center" }}><button className="bt" style={{ background: T.ok }} disabled={gold < 35} onClick={() => { setEq(e => { const ne = { ...e }; if (ne.w1) ne.w1 = { ...ne.w1, dur: ne.w1.maxDur }; if (ne.w2) ne.w2 = { ...ne.w2, dur: ne.w2.maxDur }; return ne; }); setGold(g => g - 35); notify("Repaired!"); }}>🔨 Repair (35G)</button></div>}

            {svc === "guild" && <div>
              <div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>Complete missions for XP, gold, and relic shards!</div>
              {guildMission && <div style={{ padding: 6, background: T.ac + "15", border: "1px solid " + T.ac + "33", borderRadius: 5, marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.ac }}>Active: {guildMission.nm}</div>
                <div style={{ fontSize: 9, color: T.dm }}>{guildMission.ds} — Progress: {guildMission.progress}/{guildMission.goal}</div><div style={{ fontSize: 8, color: T.gd, marginTop: 3 }}>Reward: +{guildMission.xp}XP +{guildMission.g}G +{guildMission.sh} shards</div>
                {guildMission.progress >= guildMission.goal ? <button className="bt bs" style={{ background: T.gd, marginTop: 4 }} onClick={() => { setPl(p => giveXP(guildMission.xp, p)); setGold(g => g + guildMission.g); setShards(s => s + guildMission.sh); notify("Mission complete! +" + guildMission.xp + "XP +" + guildMission.g + "G +" + guildMission.sh + " shards"); setGuildMission(null); }}>🏆 Claim Rewards</button> : <button className="bt bs" style={{ background: T.bad, marginTop: 4 }} onClick={() => { setGuildMission(null); notify("Mission cancelled."); }}>Cancel</button>}
              </div>}
              {!guildMission && [{id:"hunt",nm:"Monster Hunt",ds:"Defeat 5 enemies",xp:50,g:35,sh:3,goal:5},{id:"explore",nm:"Explorer",ds:"Discover 10 new tiles",xp:40,g:25,sh:2,goal:10},{id:"boss",nm:"Boss Slayer",ds:"Defeat a boss",xp:150,g:100,sh:8,goal:1},{id:"arena",nm:"Arena Champion",ds:"Win 3 arena fights",xp:80,g:50,sh:5,goal:3},{id:"treasure",nm:"Treasure Seeker",ds:"Find 3 treasures",xp:60,g:40,sh:4,goal:3}].map((q,i) => <div key={i} style={{ padding: 5, background: T.c2, borderRadius: 4, marginBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 11, fontWeight: 700 }}>{q.nm}</div><div style={{ fontSize: 9, color: T.dm }}>{q.ds}</div><div style={{ fontSize: 8, color: T.gd }}>+{q.xp}XP +{q.g}G +{q.sh} shards</div></div><button className="bt bs" style={{ background: T.ac }} onClick={() => { setGuildMission({...q, progress: 0}); notify("Accepted: " + q.nm); }}>Accept</button></div>)}
            </div>}

            {svc === "tavern" && <div>
              <div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>⏰ Rumors refresh in: {getTimerRemaining(8)} · New companion in: {getCountdownTo(nextCompanionTs)}</div>
              {(tavernRumors || []).map((r, i) => <div key={i} style={{ padding: 5, background: T.c2, borderRadius: 4, marginBottom: 3, fontSize: 10, color: T.gd, fontStyle: "italic" }}>"{r}"</div>)}
              <div style={{ padding: 6, background: T.ac + "12", border: "1px solid " + T.ac + "33", borderRadius: 5, marginTop: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ac }}>💍 Companion Ledger — {currentTownLabel}</div>
                    <div style={{ fontSize: 9, color: T.dm, marginTop: 2 }}>One new prospect arrives every 2 days. Only the latest five remain on the board for this town.</div>
                  </div>
                  {!companionSeekLocked ? <div style={{ display: "flex", gap: 4 }}>
                    <button className="bt bs" style={{ background: companionSeek === "female" ? "#ff81b5" : T.c2 }} onClick={() => setPopup({ text: "Choose your search preference\n\nSeek Female will lock your tavern companion search to female companions for this generation. This choice cannot be changed once confirmed.", choices:[{ label:"Confirm Seek Female", action: () => { setCompanionSeek("female"); setCompanionSeekLocked(true); setPopup(null); notify("Tavern search locked: Female"); } }, { label:"Cancel", action: () => setPopup(null) }] })}>Seek Female</button>
                    <button className="bt bs" style={{ background: companionSeek === "male" ? "#7bb9ff" : T.c2 }} onClick={() => setPopup({ text: "Choose your search preference\n\nSeek Male will lock your tavern companion search to male companions for this generation. This choice cannot be changed once confirmed.", choices:[{ label:"Confirm Seek Male", action: () => { setCompanionSeek("male"); setCompanionSeekLocked(true); setPopup(null); notify("Tavern search locked: Male"); } }, { label:"Cancel", action: () => setPopup(null) }] })}>Seek Male</button>
                  </div> : <div style={{ fontSize: 8, color: "#d9e6ff", textAlign: "right" }}>Search locked this generation:<br/><span style={{ color: companionSeek === "female" ? "#ffb0cf" : "#a6d1ff", fontWeight: 700 }}>{companionSeek === "female" ? "Female" : "Male"}</span></div>}
                </div>
                <div style={{ fontSize: 8, color: "#cfd3ea", marginBottom: 5 }}>A bonded companion shapes your legacy line. You may switch to a different bond only once per generation.</div>
                <div style={{ display: "grid", gap: 4 }}>
                  {(tavernCompanions || []).slice(0,5).map(c => {
                    const isBonded = spouse?.id === c.id;
                    const canRebond = !spouse || isBonded || !bondSwapUsed;
                    return <div key={c.id} style={{ padding: 5, background: isBonded ? T.ok + "16" : T.c2, borderRadius: 5, border: "1px solid " + (isBonded ? T.ok + "66" : T.bd) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.tx }}>{c.ic} {c.nm}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                            <button className="bt bs" style={{ background: "#243354", fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: companionFieldDetailText(c, "elements") })}>Elements: {companionElementLabel(c)}</button>
                            <button className="bt bs" style={{ background: "#32402d", fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: companionFieldDetailText(c, "nature") })}>Nature: {c.nature}</button>
                            <button className="bt bs" style={{ background: "#3f2f52", fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: companionFieldDetailText(c, "bloodline") })}>Bloodline: {c.boonPreview?.nm || "Unformed"}</button>
                            <button className="bt bs" style={{ background: "#4a3a24", fontSize: 8, padding: "2px 6px" }} onClick={() => setPopup({ text: companionFieldDetailText(c, "growth") })}>Growth: {String(c.boonStat).toUpperCase()} ×{(c.boonMult || 1.04).toFixed(2)}</button>
                          </div>
                          <div style={{ fontSize: 8, color: "#a8c7ff", marginTop: 4 }}>{c.boonPreview?.ds || "A stronger lineage waits in the next generation."}{c.boonPreview?.skill ? " · Inherited Veil Magic: " + c.boonPreview.skill.n : ""}{c.boonPreview?.ult ? " · Inherited Expansion: " + c.boonPreview.ult.name : ""}</div>
                        </div>
                        <button className="bt bs" disabled={!canRebond} style={{ background: isBonded ? T.ok : (canRebond ? T.gd : "#333") }} onClick={() => {
                          if (isBonded) { notify(c.nm + " is already your bonded companion."); return; }
                          if (!spouse) {
                            setPopup({ text: "Bond with " + c.nm + "?\n\nThis will shape your legacy line, inheritance chances, and future heir outcomes.", choices:[{ label:"Confirm Bond", action: () => { setSpouse(c); setPopup(null); notify(c.nm + " is now your bonded companion."); } }, { label:"Cancel", action: () => setPopup(null) }] });
                            return;
                          }
                          if (bondSwapUsed) { notify("You already changed your bond once this generation."); return; }
                          setPopup({ text: "Rebond to " + c.nm + "?\n\nWarning: changing companions consumes your one allowed bond change for this generation.", choices:[{ label:"Confirm Final Rebond", action: () => { setSpouse(c); setBondSwapUsed(true); setPopup(null); notify("Final bond set: " + c.nm); } }, { label:"Keep Current Bond", action: () => setPopup(null) }] });
                        }}>{isBonded ? "Bonded" : (spouse ? (bondSwapUsed ? "Locked" : "Rebond") : "Bond")}</button>
                      </div>
                    </div>;
                  })}
                </div>
                {spouse && <div style={{ fontSize: 8, color: "#ffd2e5", marginTop: 6 }}>Current bond: {spouse.nm} · {companionElementLabel(spouse)} · {spouse.nature}{bondSwapUsed ? " · Bond change spent" : " · One rebond remains"}</div>}
              </div>
              <div style={{ padding: 6, background: T.wn + "12", border: "1px solid " + T.wn + "33", borderRadius: 5, marginTop: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.wn, marginBottom: 4 }}>🍺 Loosen a tongue... (50G)</div>
                <div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>Buy a round of drinks to get a secret location hint.</div>
                <button className="bt bs" style={{ background: gold >= 50 ? T.wn : "#333" }} disabled={gold < 50} onClick={() => { setGold(g => g - 50); const pois = mData ? mData.filter(t => t.poi && ["rift","treasure","shrine"].indexOf(t.poi.type) >= 0) : []; if (pois.length > 0) { const p = P(pois); const dx = p.x - pos.x; const dy = p.y - pos.y; const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "where the sun sets last" : "where dawn breaks first") : (dy > 0 ? "in the southern depths" : "in the northern reaches"); const dist = Math.abs(dx) + Math.abs(dy); const distHint = dist < 15 ? "a stone's throw away" : dist < 40 ? "a moderate journey" : "a distant expedition"; const typeHint = p.poi.type === "rift" ? "reality tears at the seams" : p.poi.type === "treasure" ? "fortune gleams beneath the dirt" : "divine energy pools"; setPopup({text: "🍺 A drunkard whispers\n\n" + distHint.charAt(0).toUpperCase() + distHint.slice(1) + ", " + dir + "... that's where " + typeHint + ".\n\n(~" + dist + " tiles)"}); } else { setPopup({text: "The drunk mumbles incoherently. No useful info."}); } }}>Buy a Round</button>
              </div>
            </div>}

            {svc === "market" && <div>
              <div style={{ fontSize: 11, color: T.dm, marginBottom: 4 }}>🐟 Fish Market — Exchange fish for crafted field tools</div>
              <div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>Your fish: {fish.length === 0 ? "None" : Object.entries(fish.reduce((a,f)=>{a[f.el]=(a[f.el]||0)+1; return a;},{})).map(([el,n]) => el + " x" + n).join(", ")}</div>
              <div style={{ fontSize: 8, color: "#cfd3ea", marginBottom: 6, lineHeight: 1.35 }}>Recipes are grouped around travel utility, sustain, tempo, and rarer mixed-element craft. {tn === 'Coral Harbor' ? 'Coral Harbor also carries a harbor-exclusive recipe.' : tn === 'Sunhaven' ? 'Sunhaven also offers a radiant specialty.' : tn === 'Ashford' ? 'Ashford also offers a trader-grade ration.' : ''}</div>
              <div style={{ maxHeight: "45vh", overflowY: "auto" }}>
              {buildFishMarketRecipes(tn).map(recipe => { const canMake = recipe.cost.every(c => fish.filter(f => f.el === c.el).length >= c.n); return <div key={recipe.nm} style={{ padding: 5, background: T.c2, borderRadius: 5, marginBottom: 3, border: "1px solid #2d355f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}><span style={{ fontWeight: 700, fontSize: 10 }}>{recipe.nm}</span><div style={{ fontSize: 9, color: T.dm }}>{recipe.ds}</div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35 }}><span style={{ color: "#8fd3ff", fontWeight: 700 }}>Effect:</span> {itemEffectDetail(recipe)}{recipe.cleanseAlso ? " Also removes 1 debuff." : ""}</div></div>
                  <button className="bt bs" style={{ background: canMake ? T.gd : "#333" }} disabled={!canMake} onClick={() => { let rem = [...fish]; recipe.cost.forEach(c => { for (let j = 0; j < c.n; j++) { const idx = rem.findIndex(f => f.el === c.el); if (idx >= 0) rem.splice(idx, 1); } }); setFish(rem); stashConsumable({ ...recipe, id: ID(), qty: 1, ds: recipe.ds + (recipe.cleanseAlso ? " Also removes 1 debuff." : "") }); setPopup({text: "Crafted: " + recipe.nm + "!"}); }}>Craft</button>
                </div>
                <div style={{ fontSize: 9, color: T.dm, marginTop: 2 }}>Needs: {recipe.cost.map(c => c.n + "× " + c.el + " fish (" + fish.filter(f => f.el === c.el).length + ")").join(" + ")}</div>
              </div>; })}
              </div>
            </div>}

            {svc === "herbalist" && <div>
              <div style={{ fontSize: 11, color: "#98d59c", marginBottom: 6, fontWeight: 700 }}>🌿 Herbal remedies and natural cures</div>
              <div style={{ fontSize: 8, color: "#cfd3ea", marginBottom: 6, lineHeight: 1.35 }}>The herbalist now rotates a steadier list every stock cycle instead of rerolling on each visit. {tn === 'Mistwater' ? 'Mistwater carries Fenroot Brew.' : tn === 'Verdant Deep' ? 'Verdant Deep carries Wildheart Paste.' : ''}</div>
              {buildHerbalistStock(getRefreshCycle(12), tn).map(h => <div key={h.nm} style={{ padding: 6, background: T.c2, borderRadius: 4, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, gap: 8, border: "1px solid #35583b" }}><div style={{ minWidth: 0, flex: 1 }}><span style={{ fontWeight: 700, color: T.tx }}>{h.nm}</span><div style={{ fontSize: 9, color: T.dm }}>{h.ds}</div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35, marginTop: 1 }}><span style={{ color: "#98d59c", fontWeight: 700 }}>Effect:</span> {itemEffectDetail(h)}</div></div><button className="bt bs" style={{ background: gold >= h.pr ? T.ok : "#333" }} disabled={gold < h.pr} onClick={() => { setGold(g=>g-h.pr); stashConsumable({ ...h, id: ID(), qty: 1 }); notify("Bought!"); }}>{h.pr}G</button></div>)}
            </div>}

            {svc === "enchant" && <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.dm, marginBottom: 6 }}>✨ Enchant your weapon with an element (100G)</div>
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
                {ELS.slice(0,8).map(el => <div key={el} style={{ minWidth: 86, padding: 2, background: T.c2, borderRadius: 4 }}><button className="bt bs" style={{ background: gold >= 100 ? ELC[el]+"33" : "#333", color: ELC[el], width: "100%" }} disabled={gold < 100 || !eq.w1} onClick={() => { setGold(g=>g-100); setEq(e=>({...e,w1:{...e.w1,el}})); notify("Enchanted to "+el+"!"); }}>{el}</button><div style={{ fontSize: 7, color: "#cfd3ea", marginTop: 2, lineHeight: 1.25 }}>{elementMatchupText(el)}</div></div>)}
              </div>
            </div>}

            {svc === "beastmaster" && <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.dm, marginBottom: 6 }}>🐾 Beast training and release</div>
                            {pet ? <div><div style={{ fontSize: 10, marginBottom: 4 }}>{pet.ic} {pet.nm} ({pet.el})</div><div style={{ fontSize: 9, color: T.dm, marginBottom: 4 }}>Skills: {pet.sk1?.n || "?"} · {pet.sk2?.n || "?"}</div><div style={{ fontSize: 8, color: "#cfd3ea", marginBottom: 4, lineHeight: 1.35 }}>Train raises the beast's practical combat value. Release removes your current pet so a new one can be tamed later.</div><button className="bt bs" style={{ background: T.ok }} disabled={gold < 50} onClick={() => { setGold(g=>g-50); notify(pet.nm + " trained! +stats"); }}>Train (50G)</button> <button className="bt bs" style={{ background: T.bad }} onClick={() => { setPet(null); notify("Pet released."); }}>Release</button></div> : <div style={{ fontSize: 9, color: T.dm }}>No pet. Visit beast zones to tame one.</div>}
            </div>}

            {svc === "armorer" && <div>
              <div style={{ fontSize: 11, color: "#d7c287", marginBottom: 6, fontWeight: 700 }}>🛡 Master-forged shields</div>
              {!armorerStock ? <div style={{ fontSize: 9, color: T.dm }}>Preparing the armory racks...</div> : armorerStock.map(s => <div key={s.id} style={{ padding: 6, background: T.c2, borderRadius: 4, marginBottom: 3, display: "flex", justifyContent: "space-between", fontSize: 10, gap: 8, border: "1px solid "+(ELC[s.el]||T.bd)+"33" }}><div style={{ minWidth: 0, flex: 1 }}><div><span style={{ fontWeight: 700, color: T.tx }}>{s.name}</span><span style={{ fontSize: 8, color: T.gd, marginLeft: 5, fontWeight: 700 }}>{s.slot ? s.slot.toUpperCase() : 'SHIELD'}</span></div><div style={{ fontSize: 8, color: ELC[s.el] || T.dm, fontWeight: 700, marginTop: 1 }}>Element: {s.el}</div><div style={{ fontSize: 9, color: T.dm }}>ATK: {s.atk||0} · MAG: {s.mag||0} · DEF: {s.def||0} · SPD: {s.spd||0}{s.hp ? ' · HP: '+s.hp : ''}</div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35 }}>{elementMatchupText(s.el)}</div><div style={{ fontSize: 8, color: "#e6dcc0", lineHeight: 1.35 }}>{weaponEffectDetail(s)}</div></div><button className="bt bs" style={{ background: gold >= s.price ? T.gd : "#333" }} disabled={gold < s.price} onClick={() => { const ok = tryGainLooseItem({...s,qty:1}, null, "Armorer"); if(!ok) return; setGold(g=>g-s.price); setArmorerStock(st => st.filter(x => x.id !== s.id)); notify("Got "+s.name); }}>{s.price}G</button></div>)}
              {armorerStock && armorerStock.length === 0 && <div style={{ fontSize: 9, color: T.wn }}>Sold out! Restocks with timer.</div>}
            </div>}

            {svc === "alchemist" && <div>
              <div style={{ fontSize: 11, color: "#caa7ff", marginBottom: 6, fontWeight: 700 }}>⚗️ Rare elixirs and brews</div>
              <div style={{ fontSize: 8, color: "#cfd3ea", marginBottom: 6, lineHeight: 1.35 }}>Alchemical offers now rotate on stock refresh and keep their details consistent. These are geared more toward tempo swings, emergency answers, and tactical pressure. {tn === "Rift's Edge" ? "Rift's Edge also carries Rift Resin." : ""}</div>
              {buildAlchemistStock(getRefreshCycle(12), tn).map(a => <div key={a.nm} style={{ padding: 5, background: T.c2, borderRadius: 4, marginBottom: 3, display: "flex", justifyContent: "space-between", fontSize: 10, gap: 8, border: "1px solid #4a3568" }}><div style={{ minWidth: 0, flex: 1 }}><div><span style={{ fontWeight: 700, color: T.tx }}>{a.nm}</span></div><div style={{ fontSize: 9, color: T.dm }}>{a.ds}</div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35, marginTop: 1 }}><span style={{ color: "#caa7ff", fontWeight: 700 }}>Effect:</span> {itemEffectDetail(a)}</div></div><button className="bt bs" style={{ background: gold >= a.pr ? T.ok : "#333" }} disabled={gold < a.pr} onClick={() => { setGold(g=>g-a.pr); stashConsumable({ ...a, id: ID(), qty: 1 }); notify("Bought!"); }}>{a.pr}G</button></div>)}
            </div>}

            {svc === "oracle" && <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.dm, marginBottom: 6 }}>🔮 The Oracle reveals hidden knowledge</div>
                            <div style={{ fontSize: 9, color: "#ce93d8", marginBottom: 4 }}>Cost: 2 relic shards (you have {shards})</div>
              <button className="bt" style={{ background: shards >= 2 ? T.ac : "#333" }} disabled={shards < 2} onClick={() => { setShards(s=>s-2); const hints = ["The Dream Devourer lurks at ("+((devPos||{x:"?",y:"?"}).x)+","+(devPos||{x:"?",y:"?"}).y+")","You have "+fragments+" relic fragments. "+shards+" shards.","Your next level requires "+(xpFor(pl.level)-pl.xp)+" more XP.","There are "+mData.filter(t=>t.poi&&t.poi.type==="rift").length+" rifts on the map.","Your weapon durability: "+(eq.w1?eq.w1.dur+"/"+eq.w1.maxDur:"none equipped")]; setPopup({text: "🔮 "+P(hints)}); }}>Consult (2 shards)</button>
            </div>}

            {svc === "jeweler" && <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.dm, marginBottom: 6 }}>💎 Trade shards for fragments (one-way)</div>
                            
              {shards >= 1000 && <button className="bt" style={{ background: T.gd }} onClick={() => { setShards(s=>s-1000); setFragments(f=>f+1); notify("Forged 1 Fragment!"); }}>Forge Fragment (1000 shards)</button>}
              {shards < 10 && <div style={{ fontSize: 9, color: T.dm }}>Need 1000 shards to forge. ({shards}/1000)</div>}
              <div style={{ fontSize: 8, color: "#cfd3ea", marginTop: 4, marginBottom: 4, lineHeight: 1.35 }}>Shards can be forged into fragments. This exchange is one-way only: 1000 shards → 1 fragment.</div>
              <button className="bt bs" style={{ background: gold >= 200 ? T.ac : "#333", marginTop: 4 }} disabled={gold < 200} onClick={() => { setGold(g=>g-200); setShards(s=>s+5); notify("+5 shards!"); }}>Buy 5 Shards (200G)</button>
            </div>}

            {svc === "shipwright" && <div>
              <div style={{ fontSize: 11, color: "#7ec8ff", marginBottom: 6, fontWeight: 700 }}>⚓ Seafarer weapons</div>
              <div style={{ fontSize: 8, color: "#cfd3ea", marginBottom: 6, lineHeight: 1.35 }}>Water-forged weapons shaped for slows, tide pressure, and steady control. Stock stays fixed until refresh.</div>
              {!shipwrightStock ? <div style={{ fontSize: 9, color: T.dm }}>Preparing the dock stock...</div> : shipwrightStock.map(w => <div key={w.id} style={{ padding: 6, background: T.c2, borderRadius: 4, marginBottom: 3, display: "flex", justifyContent: "space-between", fontSize: 10, gap: 8, border: "1px solid "+(ELC[w.el]||T.bd)+"33" }}><div style={{ minWidth: 0, flex: 1 }}><div><span style={{ fontWeight: 700, color: T.tx }}>{w.name}</span></div><div style={{ fontSize: 8, color: ELC[w.el] || T.dm, fontWeight: 700, marginTop: 1 }}>Element: {w.el}</div><div style={{ fontSize: 9, color: T.dm }}>ATK: {w.atk||0} · MAG: {w.mag||0} · DEF: {w.def||0} · SPD: {w.spd||0}</div><div style={{ fontSize: 8, color: "#cfd3ea", lineHeight: 1.35 }}>{elementMatchupText(w.el)}</div><div style={{ fontSize: 8, color: "#e6dcc0", lineHeight: 1.35 }}>{weaponEffectDetail(w)}</div></div><button className="bt bs" style={{ background: gold >= w.price ? T.ac : "#333" }} disabled={gold < w.price} onClick={() => { if(!eq.w1){ setGold(g=>g-w.price); setEq(e=>({...e,w1:w})); setShipwrightStock(st => st.filter(x => x.id !== w.id)); notify("Acquired "+w.name+"!"); return; } if(!eq.w2){ setGold(g=>g-w.price); setEq(e=>({...e,w2:w})); setShipwrightStock(st => st.filter(x => x.id !== w.id)); notify("Acquired "+w.name+"!"); return; } const ok = tryGainLooseItem({...w,qty:1}, null, "Shipwright"); if(!ok) return; setGold(g=>g-w.price); setShipwrightStock(st => st.filter(x => x.id !== w.id)); notify("Acquired "+w.name+"!"); }}>{w.price}G</button></div>)}
              {shipwrightStock && shipwrightStock.length === 0 && <div style={{ fontSize: 9, color: T.wn }}>Sold out! Restocks with timer.</div>}
            </div>}

            {svc === "covenant" && <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.gd, marginBottom: 6 }}>🏛 Covenant Hall</div>
              {pl.covenant ? (() => { const cv = getCV(pl.covenant); return cv ? <div>
                <div style={{ padding: 8, background: cv.cl + "14", border: "1px solid " + cv.cl + "44", borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><span style={{ fontSize: 18 }}>{cv.ic}</span><div><div style={{ fontWeight: 700, color: cv.cl, fontFamily: "'Cinzel',serif" }}>{cv.nm}</div><div style={{ fontSize: 8, color: T.dm }}>Active covenant · {cv.el} affinity</div></div></div>
                  <div style={{ fontSize: 9, color: T.dm, lineHeight: 1.4 }}>{cv.ds}</div>
                  <div style={{ fontSize: 9, marginTop: 4, padding: "4px 7px", background: cv.cl + "18", borderRadius: 4, color: cv.cl }}>🎁 {cv.guildBonus}</div>
                </div>
                <div style={{ fontSize: 9, color: T.dm, marginBottom: 6, lineHeight: 1.35 }}>You are already pledged to {cv.nm}. Changing covenant costs 200G and resets your current covenant standing.</div>
                <button className="bt bs" style={{ background: gold >= 200 ? T.bad : "#333" }} disabled={gold < 200} onClick={() => { setGold(g => g - 200); setPl(p => ({ ...p, covenant: null })); notify("Covenant severed."); }}>Renounce (200G)</button>
              </div> : null; })() : <div>
                <div style={{ fontSize: 9, color: T.dm, marginBottom: 8, lineHeight: 1.35 }}>Pledge to one of the five great orders. Your choice grants permanent stat bonuses and shapes your guild mission rewards. Each covenant has a unique element affinity and strategic specialisation.</div>
                <div style={{ display: "grid", gap: 5 }}>
                  {COVENANTS.map(cv => <div key={cv.id} style={{ padding: 8, background: T.c2, border: "1px solid " + cv.cl + "44", borderRadius: 7, cursor: "pointer" }} onClick={() => { setPl(p => ({ ...p, covenant: cv.id })); setGold(g => g - 0); notify("Pledged to " + cv.nm + "!"); setSvc(null); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><span style={{ fontSize: 16 }}>{cv.ic}</span><div><div style={{ fontWeight: 700, color: cv.cl, fontFamily: "'Cinzel',serif", fontSize: 10 }}>{cv.nm}</div><div style={{ fontSize: 8, color: T.dm }}>{cv.el} affinity · {Object.entries(cv.statBonus).map(([k,v]) => "+" + v + " " + k.toUpperCase()).join(" · ")}</div></div></div>
                    <div style={{ fontSize: 8, color: T.dm, lineHeight: 1.3, marginBottom: 3 }}>{cv.ds}</div>
                    <div style={{ fontSize: 8, color: cv.cl }}>🎁 {cv.guildBonus}</div>
                  </div>)}
                </div>
              </div>}
            </div>}

            {svc === "crafting" && <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.gd, marginBottom: 2 }}>⚗️ Relic Crafting</div>
              <div style={{ fontSize: 9, color: "#ce93d8", marginBottom: 6 }}>🔮 Fragments: {fragments} · ✨ Shards: {shards}</div>
              <div style={{ fontSize: 9, color: T.dm, marginBottom: 8, lineHeight: 1.35 }}>Combine relic shards and fragments into consumables, elixirs, and arcane materials. These recipes require specific quantities of shards or fragments. Each craft is permanent — materials are consumed.</div>
              {[
                { nm:"Veil Tonic",    cost:{shards:80},  ef:"heal",   v:45,  ds:"Restores 45 HP. Brewed from compressed veil resonance.", ic:"🧪" },
                { nm:"Mana Crystal",  cost:{shards:80},  ef:"mp",     v:40,  ds:"Restores 40 MP. A crystallised pool of compressed arcane energy.", ic:"💎" },
                { nm:"Elixir of Iron",cost:{shards:150}, ef:"heal",   v:90,  ds:"Restores 90 HP. A stronger alchemical brew.", ic:"🍵" },
                { nm:"Void Draught",  cost:{shards:150}, ef:"mp",     v:80,  ds:"Restores 80 MP. Distilled from rift-edge void water.", ic:"🫗" },
                { nm:"Cleansing Dust",cost:{shards:60},  ef:"cleanse",v:1,   ds:"Removes all status ailments instantly.", ic:"✨" },
                { nm:"Repel Incense", cost:{shards:120}, ef:"repel",  v:60,  ds:"Grants 60 steps of monster repellence on the world map.", ic:"🌿" },
                { nm:"War Talisman",  cost:{fragments:1}, ef:"empower",v:25, ds:"Grants Empower for 3 turns at battle start. Consumed on use.", ic:"🔴" },
                { nm:"Void Shard Bomb",cost:{fragments:2},ef:"burn",  v:50,  ds:"Deals 50 void-fire damage. Applies Burn.", ic:"💥" },
              ].map(recipe => {
                const canCraft = (recipe.cost.shards ? shards >= recipe.cost.shards : true) && (recipe.cost.fragments ? fragments >= recipe.cost.fragments : true);
                return <div key={recipe.nm} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 6, background: T.c2, borderRadius: 5, marginBottom: 4, gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 10 }}>{recipe.ic} {recipe.nm}</div>
                    <div style={{ fontSize: 8, color: T.dm, marginTop: 2 }}>{recipe.ds}</div>
                    <div style={{ fontSize: 8, color: "#ce93d8", marginTop: 2 }}>
                      Cost: {recipe.cost.shards ? recipe.cost.shards + " shards" : ""}{recipe.cost.fragments ? recipe.cost.fragments + " fragment(s)" : ""}
                    </div>
                  </div>
                  <button className="bt bs" style={{ background: canCraft ? T.ok : "#333", flexShrink: 0 }} disabled={!canCraft} onClick={() => {
                    if (recipe.cost.shards) setShards(s => s - recipe.cost.shards);
                    if (recipe.cost.fragments) setFragments(f => f - recipe.cost.fragments);
                    const item = { id: ID(), nm: recipe.nm, name: recipe.nm, ef: recipe.ef, v: recipe.v, dur: 3, target: "self", qty: 1 };
                    const ok = tryGainLooseItem(item, null, "Crafting");
                    if (ok !== false) notify("Crafted " + recipe.nm + "!");
                  }}>Craft</button>
                </div>;
              })}
            </div>}
          </div>
        )}
      </div></div></div>
    );
  }

  // MINI-GAME
  if (scr === "mini") return (
    <div className="pg shell-bg"><div className="wr shell-viewport">{notiEl}{hud}<div className="cd page-panel">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: T.gd }}>🎰 Gambling Den</div><button className="bt bs" style={{ background: T.c2 }} onClick={() => setScr("map")}>Leave</button></div>
      {mg === "menu" && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 9, color: T.dm }}>Bet: <span style={{ color: T.gd, fontWeight: 700 }}>{mgBet}×</span></div>
        <div style={{ display: "flex", gap: 3 }}>{[1,2,5,10].map(m => <button key={m} className="bt bs" style={{ background: mgBet === m ? T.gd : T.c2, flex: 1 }} onClick={() => setMgBet(m)}>{m}×</button>)}</div>
        <button className="bt" style={{ background: "#8b6914", width: "100%" }} onClick={() => setMg("hancho")}>🎲 Han-Cho ({10*mgBet}G)</button>
        <button className="bt" style={{ background: "#1565c0", width: "100%" }} onClick={() => setMg("rps")}>✊ RPS ({15*mgBet}G)</button>
        <button className="bt" style={{ background: "#2e7d32", width: "100%" }} onClick={() => { setMgCard(R(1,10)); setMgR(null); setMg("hilo"); }}>🃏 Hi-Lo ({20*mgBet}G)</button>
      </div>}
      {mg === "hancho" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 12, marginBottom: 4 }}>Even or Odd? <span style={{ color: T.gd, fontSize: 10 }}>Bet: {10*mgBet}G</span></div><div style={{ display: "flex", gap: 6, justifyContent: "center" }}>{["Even","Odd"].map(ch => <button key={ch} className="bt" style={{ background: T.gd }} onClick={() => { const cost = 10*mgBet; if (gold < cost) { notify("Need "+cost+"G!"); return; } const d1 = R(1,6), d2 = R(1,6), s = d1+d2, ev = s%2===0; const w = (ch==="Even"&&ev)||(ch==="Odd"&&!ev); setGold(g => g + (w?cost:-cost)); setMgR("Dice: " + d1 + "+" + d2 + "=" + s + " (" + (ev?"Even":"Odd") + ") " + (w?"WIN +"+cost+"G":"LOSE -"+cost+"G")); }}>{ch}</button>)}</div>{mgR && <div style={{ marginTop: 8, fontSize: 12, color: mgR.includes("WIN") ? T.ok : T.bad, fontWeight: 700 }}>{mgR}</div>}<button className="bt bs" style={{ background: T.c2, marginTop: 8 }} onClick={() => { setMg("menu"); setMgR(null); }}>Back</button></div>}
      {mg === "rps" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 12, marginBottom: 4 }}>Choose! <span style={{ color: T.gd, fontSize: 10 }}>Bet: {15*mgBet}G</span></div><div style={{ display: "flex", gap: 4, justifyContent: "center" }}>{["Rock","Paper","Scissors"].map(ch => <button key={ch} className="bt" style={{ background: T.ac }} onClick={() => { const cost = 15*mgBet; if (gold < cost) { notify("Need "+cost+"G!"); return; } const ai = P(["Rock","Paper","Scissors"]); const w = (ch==="Rock"&&ai==="Scissors")||(ch==="Paper"&&ai==="Rock")||(ch==="Scissors"&&ai==="Paper"); const dr = ch===ai; setGold(g => g + (w?cost:dr?0:-cost)); setMgR(ch + " vs " + ai + " — " + (w?"WIN +"+cost+"G":dr?"DRAW":"LOSE -"+cost+"G")); }}>{ch==="Rock"?"✊":ch==="Paper"?"✋":"✌️"}</button>)}</div>{mgR && <div style={{ marginTop: 8, fontSize: 12, color: mgR.includes("WIN") ? T.ok : mgR.includes("DRAW") ? T.wn : T.bad, fontWeight: 700 }}>{mgR}</div>}<button className="bt bs" style={{ background: T.c2, marginTop: 8 }} onClick={() => { setMg("menu"); setMgR(null); }}>Back</button></div>}
      {mg === "hilo" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 12, marginBottom: 4 }}>Card: <span style={{ fontSize: 20, fontWeight: 700, color: T.gd }}>{mgCard ?? 1}</span> <span style={{ color: T.gd, fontSize: 10 }}>Bet: {20*mgBet}G</span></div><div style={{ fontSize: 11, marginBottom: 8 }}>Higher or Lower?</div><div style={{ display: "flex", gap: 6, justifyContent: "center" }}>{["Higher","Lower"].map(ch => <button key={ch} className="bt" style={{ background: T.ac }} onClick={() => { const cost = 20*mgBet; if (gold < cost) { notify("Need "+cost+"G!"); return; } const b = mgCard ?? R(1,10); const a = R(1,10); const w = (ch==="Higher"&&a>b)||(ch==="Lower"&&a<b); setGold(g => g + (w?cost:a===b?0:-cost)); setMgR("Was " + b + ", Next: " + a + " — " + (w?"WIN +"+cost+"G":a===b?"DRAW":"LOSE -"+cost+"G")); setMgCard(a); }}>{ch}</button>)}</div>{mgR && <div style={{ marginTop: 8, fontSize: 12, color: mgR.includes("WIN") ? T.ok : mgR.includes("DRAW") ? T.wn : T.bad, fontWeight: 700 }}>{mgR}</div>}<button className="bt bs" style={{ background: T.c2, marginTop: 8 }} onClick={() => { setMg("menu"); setMgR(null); setMgCard(null); }}>Back</button></div>}
    </div></div></div>
  );

  return <div className="pg shell-bg"><div className="wr shell-viewport">{hud}<div className="cd page-panel">Loading...</div></div></div>;
}


export default Game;
