// ─────────────────────────────────────────────────────────────────────────
// VEILBREAK CHAIN + FIELD FOUNDATION (Pass 7)
// ─────────────────────────────────────────────────────────────────────────
// Pure module. NO React, NO imports from Game.jsx.
//
// What this owns:
//   • The new "unordered requirement" model for Veilbreak chains.
//   • A field-effect description derived from the equipped Veilbreak.
//   • A safe, modest field-tick effect runner (single pass per call).
//
// What this does NOT do:
//   • It does not mutate `pl` or `btl` directly. Game.jsx orchestrates state.
//   • It does not implement enemy Veilbreak fields, Field Clash, or Field
//     Attunement. Those are deferred to the next pass — TODOs below.
//   • It does not touch save shape. The old `np.ult.combo`/`btl.chainProg`
//     fields are intentionally kept untouched so existing saves keep working.
//
// FOUNDATION PASS NOTE: internal identifiers like "ult"/"combo" remain for
// save compatibility. Player-facing wording already says "Veilbreak".
// A future pass can rename these once a save-migration path exists.
// ─────────────────────────────────────────────────────────────────────────

// ── Requirement type catalogue ───────────────────────────────────────────
// Keep this list flexible-but-flat. Game.jsx only reads `.ic`/`.lab`.
// Future passes (TODO) can add: moveTiles, generateVeilMagic refinements,
// per-element status spec, full crit/status combos, etc.
export const VB_REQ_TYPES = {
  useElement:          { ic: "✦", lab: "Use a matching element" },
  useSkillType:        { ic: "🎯", lab: "Use a skill type" },
  dealDamage:          { ic: "⚔", lab: "Deal damage" },
  receiveDamage:       { ic: "💢", lab: "Take damage" },
  applyStatus:         { ic: "☠", lab: "Apply a status" },
  guard:               { ic: "🛡", lab: "Guard" },
  crit:                { ic: "💥", lab: "Land a critical hit" },
  defeatEnemy:         { ic: "💀", lab: "Defeat an enemy" },
  useTacticalAction:   { ic: "👣", lab: "Move on the arena" },
  standOnTerrain:      { ic: "🌿", lab: "Stand on rare terrain" },
  triggerTerrainBonus: { ic: "✨", lab: "Trigger a terrain bonus" },
  spendHP:             { ic: "🩸", lab: "Pay an HP cost" },
  generateVeilMagic:   { ic: "🌀", lab: "Cast Veil Magic" },
  moveTiles:           { ic: "👣", lab: "Move several tiles" },
};

// ── Element → field profile ──────────────────────────────────────────────
// Used both for visual theming and for the tick effect category.
// TODO Pass 8+: per-class field tuning, per-element status interactions,
// boss-specific recurring effects.
function elementProfile(el) {
  const fire    = { theme: "fire",   recurring: "dot",            note: "Smouldering field damage to foes." };
  const ice     = { theme: "void",   recurring: "slow",           note: "Air slows around the foes." };
  const water   = { theme: "water",  recurring: "regen",          note: "Veil-light gently restores HP." };
  const nature  = { theme: "nature", recurring: "regen",          note: "Verdant pulse restores HP." };
  const earth   = { theme: "earth",  recurring: "shield",         note: "Stone-steady — minor MP feed." };
  const metal   = { theme: "earth",  recurring: "shield",         note: "Runic veins feed Veil Magic." };
  const dark    = { theme: "shadow", recurring: "dot",            note: "Shadow leeches enemy HP." };
  const voidF   = { theme: "void",   recurring: "silence_chance", note: "Veil-static dampens incantations." };
  const light   = { theme: "light",  recurring: "regen",          note: "Holy light restores HP." };
  const storm   = { theme: "storm",  recurring: "crit_boost",     note: "Air crackles — your aim sharpens." };
  const sound   = { theme: "storm",  recurring: "crit_boost",     note: "Resonant air boosts crit." };
  const wind    = { theme: "storm",  recurring: "veil_gen",       note: "Veil-wind feeds Veil Magic." };
  const map = {
    Fire: fire, Ice: ice, Water: water, Nature: nature, Earth: earth, Metal: metal,
    Dark: dark, Void: voidF, Light: light, Holy: light, Lightning: storm, Sound: sound,
    Wind: wind, Curse: dark,
  };
  return map[el] || { theme: "void", recurring: "veil_gen", note: "Veil thrums — Veil Magic flows freer." };
}

// ── Requirement count from chain length ──────────────────────────────────
// Chains 4 → 2 reqs, 5 → 3 reqs, 6+ → 4 reqs.
function reqCountForChain(ch) {
  const n = ch | 0;
  if (n <= 4) return 2;
  if (n === 5) return 3;
  return 4;
}

// ── Build the unordered requirements for a Veilbreak ─────────────────────
// Pure derivation. Same `ult` always returns the same shape.
// TODO Pass 8+: class-specific signature requirements (Phoenix: take damage,
// Bard: apply confuse, Voidmage: trigger silence chain, etc).
export function buildRequirementsForUlt(ult) {
  if (!ult) return [];
  const total = reqCountForChain(ult.chain || 4);
  const el = ult.el || "Null";
  const fx = ult.fx || null;
  const reqs = [];

  reqs.push({
    id: "el_" + el,
    label: "Cast a " + el + " Veil Magic",
    type: "useElement",
    payload: { element: el },
    fulfilled: false,
    fulfilledAtRound: null,
    fulfilledByAction: null,
    description: "Cast any Veil Magic of the " + el + " element this battle.",
  });
  reqs.push({
    id: "deal_dmg",
    label: "Land a damaging blow",
    type: "dealDamage",
    payload: { min: 1 },
    fulfilled: false,
    fulfilledAtRound: null,
    fulfilledByAction: null,
    description: "Deal damage with any action this battle.",
  });
  if (total >= 3) {
    if (fx) {
      reqs.push({
        id: "status_" + fx,
        label: "Inflict " + fx,
        type: "applyStatus",
        payload: { status: fx },
        fulfilled: false,
        fulfilledAtRound: null,
        fulfilledByAction: null,
        description: "Apply " + fx + " to any foe this battle.",
      });
    } else {
      reqs.push({
        id: "guard_once",
        label: "Brace with Guard",
        type: "guard",
        payload: {},
        fulfilled: false,
        fulfilledAtRound: null,
        fulfilledByAction: null,
        description: "Use the Guard action at least once.",
      });
    }
  }
  if (total >= 4) {
    reqs.push({
      id: "tactical_move",
      label: "Take the field",
      type: "useTacticalAction",
      payload: {},
      fulfilled: false,
      fulfilledAtRound: null,
      fulfilledByAction: null,
      description: "Use Tactical Step to reposition on the arena.",
    });
  }
  return reqs;
}

// ── Field metadata builder ───────────────────────────────────────────────
// TODO Pass 8+: per-class field flavor text, boss field overrides,
// terrain-interaction rules, full duration tuning curve.
export function buildFieldForUlt(ult) {
  if (!ult) return null;
  const profile = elementProfile(ult.el);
  const ch = ult.chain || 4;
  const dur = Math.max(2, Math.min(5, Math.floor(ch / 2) + 1));
  const safeId = String(ult.id || ult.name || "field").replace(/\W+/g, "_").toLowerCase();
  return {
    fieldId: "vb_" + safeId,
    fieldName: ult.name || "Veilbreak Field",
    fieldDescription: profile.note,
    owner: "player",
    duration: dur,
    affectedArea: "arena",
    elementTags: [ult.el || "Null"],
    classTags: [],
    recurringEffect: profile.recurring,
    veilMagicModifier: 0.0, // TODO Pass 8+: small Veil Magic generation buff while active.
    terrainInteraction: null, // TODO Pass 8+: rare-tile interactions.
    visualTheme: profile.theme,
    fieldTags: [profile.recurring, "veilbreak"],
    intensity: ch >= 6 ? "heavy" : "light",
  };
}

// ── Per-action requirement evaluator ─────────────────────────────────────
// Pure. Returns true only when the action actually satisfies the trigger.
// Defensive about missing ctx fields so old/partial battle states cannot
// throw here.
export function evaluateRequirementMatch(req, ctx) {
  if (!req || req.fulfilled || !ctx) return false;
  const t = req.type;
  const p = req.payload || {};
  if (t === "useElement") {
    return !!ctx.castElement && ctx.castElement === p.element;
  }
  if (t === "useSkillType") {
    return !!ctx.skillType && ctx.skillType === p.skillType;
  }
  if (t === "dealDamage") {
    return (ctx.dealtDamage || 0) >= (p.min || 1);
  }
  if (t === "receiveDamage") {
    return (ctx.receivedDamage || 0) >= (p.min || 1);
  }
  if (t === "applyStatus") {
    return Array.isArray(ctx.appliedStatuses) && ctx.appliedStatuses.indexOf(p.status) >= 0;
  }
  if (t === "guard") return ctx.act === "guard";
  if (t === "crit") return !!ctx.wasCrit;
  if (t === "defeatEnemy") return !!ctx.defeatedEnemy;
  if (t === "generateVeilMagic") return ctx.act === "skill";
  if (t === "useTacticalAction") return ctx.act === "move" || !!ctx.tacticalStep;
  if (t === "standOnTerrain") {
    return !!ctx.terrainKey && ctx.terrainKey !== "normal";
  }
  if (t === "triggerTerrainBonus") return !!ctx.usedTerrainBonus;
  if (t === "spendHP") return (ctx.spentHP || 0) > 0;
  if (t === "moveTiles") return (ctx.tilesMoved || 0) >= (p.min || 1);
  return false;
}

// ── Apply an action to the requirements list. PURE — returns new array. ──
export function applyActionToRequirements(reqs, ctx, round) {
  if (!Array.isArray(reqs) || !reqs.length) return { reqs: reqs || [], newlyFulfilled: [], anyChange: false };
  const newlyFulfilled = [];
  let anyChange = false;
  const updated = reqs.map(r => {
    if (!r || r.fulfilled) return r;
    if (evaluateRequirementMatch(r, ctx)) {
      anyChange = true;
      const next = { ...r, fulfilled: true, fulfilledAtRound: round || 0, fulfilledByAction: (ctx && ctx.act) || null };
      newlyFulfilled.push(next);
      return next;
    }
    return r;
  });
  return { reqs: updated, newlyFulfilled, anyChange };
}

export function isReadyFromRequirements(reqs) {
  if (!Array.isArray(reqs) || !reqs.length) return false;
  return reqs.every(r => r && r.fulfilled);
}

export function summarizeRequirements(reqs) {
  const total = (reqs || []).length;
  const done = (reqs || []).filter(r => r && r.fulfilled).length;
  return { total, done, ready: total > 0 && done >= total };
}

// ── Battle-state helper: lazily attach a requirements list to a battle ──
// Used both at battle start AND when the player swaps Veilbreak mid-battle.
export function ensureBattleVeilbreakState(ult, prev) {
  if (!ult) return null;
  const id = ult.id || ult.name || "veilbreak";
  if (prev && prev.ultId === id && Array.isArray(prev.requirements) && prev.requirements.length) {
    return prev;
  }
  return { ultId: id, requirements: buildRequirementsForUlt(ult) };
}

// ── Field tick — runs ONCE per call. Mutates np/enArr in place. ─────────
// Modest values; never frame-spammed (caller guards on btl.tn).
// Returns { logs:[], expired:bool } — caller adds entries to its own log.
export function tickActiveField(field, np, enArr, lg) {
  if (!field) return { expired: false };
  const intensity = field.intensity === "heavy" ? 1.4 : 1.0;
  const safeArr = Array.isArray(enArr) ? enArr : [];
  const safeLg = Array.isArray(lg) ? lg : [];
  if (field.recurringEffect === "dot") {
    let totalDmg = 0;
    safeArr.forEach(e => {
      if (!e || e.hp <= 0) return;
      const base = Math.max(2, Math.floor(((e.mhp || 40) * 0.03) * intensity));
      e.hp = Math.max(0, e.hp - base);
      totalDmg += base;
    });
    if (totalDmg > 0) safeLg.push("✦ " + field.fieldName + " — the field tore " + totalDmg + " HP from the enemy line.");
  } else if (field.recurringEffect === "regen" && np) {
    const max = np.mhp != null ? np.mhp : (np.maxHp != null ? np.maxHp : (np.chp || 0));
    const before = np.chp || 0;
    const heal = Math.max(2, Math.floor((max || 20) * 0.04 * intensity));
    np.chp = Math.min(max || (before + heal), before + heal);
    if (np.chp > before) safeLg.push("✦ " + field.fieldName + " — Veil-light restored " + (np.chp - before) + " HP.");
  } else if (field.recurringEffect === "shield" && np) {
    const before = np.cmp || 0;
    const max = np.mmp != null ? np.mmp : before;
    np.cmp = Math.min(max, before + Math.max(1, Math.floor(2 * intensity)));
    if (np.cmp > before) safeLg.push("✦ " + field.fieldName + " — the field returned " + (np.cmp - before) + " MP.");
  } else if (field.recurringEffect === "crit_boost") {
    safeLg.push("✦ " + field.fieldName + " — static crackles, sharpening your aim.");
  } else if (field.recurringEffect === "slow") {
    safeLg.push("✦ " + field.fieldName + " — the air thickens around the foes.");
  } else if (field.recurringEffect === "silence_chance") {
    safeLg.push("✦ " + field.fieldName + " — Veil-static dampens incantations.");
  } else {
    // veil_gen / fallback: gentle MP nudge to player.
    if (np && np.cmp != null && np.mmp != null) {
      const before = np.cmp;
      np.cmp = Math.min(np.mmp, before + 2);
      if (np.cmp > before) safeLg.push("✦ " + field.fieldName + " — Veil-light returned " + (np.cmp - before) + " MP.");
    }
  }
  return { expired: false };
}

export function describeFieldRecurring(field) {
  if (!field) return "";
  const map = {
    dot:             "Minor field damage to enemies each round.",
    regen:           "Minor HP regen to the caster each round.",
    shield:          "Caster regains a sliver of MP each round.",
    crit_boost:      "Crit chance subtly raised while the field holds.",
    slow:            "Enemies feel sluggish under the Veil.",
    silence_chance:  "Hushes incantations on the battlefield.",
    veil_gen:        "Veil Magic flows freer.",
  };
  return map[field.recurringEffect] || "Subtle Veil resonance.";
}

// ── Active-field state factory (battle-state side) ───────────────────────
// Snapshots the field-def at activation time; later edits to pl.ult won't
// retroactively change the active field.
export function instantiateActiveField(ult, currentTn) {
  const def = buildFieldForUlt(ult);
  if (!def) return null;
  return {
    fieldId: def.fieldId,
    fieldName: def.fieldName,
    fieldDescription: def.fieldDescription,
    owner: "player",
    duration: def.duration,
    remainingTurns: def.duration,
    roundApplied: -1,
    appliedAtTn: typeof currentTn === "number" ? currentTn : 0,
    visualTheme: def.visualTheme,
    elementTags: def.elementTags,
    fieldTags: def.fieldTags,
    recurringEffect: def.recurringEffect,
    intensity: def.intensity,
    veilMagicModifier: def.veilMagicModifier,
    affectedArea: def.affectedArea,
  };
}

// ── Pretty list of requirement chips for log/UI ──────────────────────────
export function requirementSummaryLine(reqs) {
  const s = summarizeRequirements(reqs);
  return s.done + "/" + s.total + " conditions";
}

// ─────────────────────────────────────────────────────────────────────────
// TODO — Future passes (NOT in scope for Pass 7):
//  • Enemy Veilbreak fields (boss-side requirement tracking + activation).
//  • Field Clash (player field ↔ enemy field collision; dominance math).
//  • Field Attunement stat (per-class affinity to certain field categories).
//  • Split-field arena territory; field fracture; field cataclysm; backlash.
//  • Per-class signature requirements (e.g. Phoenix "take damage", Bard
//    "apply confuse", Voidmage "silence chain").
//  • Per-rare-terrain interactions (Bloodstone amplifies dot fields, etc).
//  • Boss-specific recurring effects + duration tuning.
// ─────────────────────────────────────────────────────────────────────────
