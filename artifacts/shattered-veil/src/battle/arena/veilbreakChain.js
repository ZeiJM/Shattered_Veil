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
    // v100 — "Take the field" removed. Replaced with a meaningful action
    // requirement (crit) that the player has to pursue intentionally.
    reqs.push({
      id: "crit_hit",
      label: "Land a critical hit",
      type: "crit",
      payload: {},
      fulfilled: false,
      fulfilledAtRound: null,
      fulfilledByAction: null,
      description: "Land at least one critical hit this battle.",
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
// PASS 8 — FIELD ATTUNEMENT, FIELD CLASH, ANTI-FIELD TACTICAL ACTIONS
// ─────────────────────────────────────────────────────────────────────────
// Pure additions. Same rules as the Pass 7 module: NO React, NO Game.jsx
// imports, NO mutation of `pl`/`btl` from here. Game.jsx orchestrates.
// ─────────────────────────────────────────────────────────────────────────

// ── Field Attunement ────────────────────────────────────────────────────
// Derived stat that decides which field wins a clash. Documented formula:
//   base = MAG * 0.6 + LCK * 0.3 + level * 0.5
// + heavy-intensity field bonus, terrain-alignment bonus, anchor bonus,
// + tiny class modifier when class data is provided.
//
// All inputs are defensive — missing stats default to safe values so this
// helper never throws and is safe to call mid-render.
//
// Returns a number clamped to [1, 999], rounded to one decimal.
export function getFieldAttunement(unit, ctx) {
  if (!unit) return 5;
  const stPick = (k, fb) => {
    const direct = unit[k];
    if (typeof direct === "number" && isFinite(direct)) return direct;
    if (unit.st && typeof unit.st[k] === "number" && isFinite(unit.st[k])) return unit.st[k];
    return fb;
  };
  const mag = stPick("mag", 10);
  const lck = stPick("lck", 5);
  const lvl = (typeof unit.level === "number" ? unit.level
            : typeof unit.lvl === "number" ? unit.lvl
            : typeof unit.lv === "number" ? unit.lv
            : 1);
  let total = mag * 0.6 + lck * 0.3 + lvl * 0.5;
  if (ctx) {
    if (ctx.fieldIntensity === "heavy") total += 4;
    if (ctx.terrainKey && ctx.terrainKey !== "normal") total += 1.5;
    if (ctx.terrainKey === "broken_veil" || ctx.onBrokenVeil) total += 4;
    if (typeof ctx.anchorBonus === "number") total += ctx.anchorBonus;
    if (typeof ctx.classBonus === "number") total += ctx.classBonus;
    if (ctx.elementMatch) total += 2;
  }
  if (!isFinite(total) || total < 1) total = 1;
  if (total > 999) total = 999;
  return Math.round(total * 10) / 10;
}

// ── Placeholder enemy field instantiator ────────────────────────────────
// Real boss/enemy field activation will arrive in a later pass. This
// helper produces a safe, dramatic field record from minimal metadata so
// Field Clash can be tested today and triggered by future enemy AI.
export function instantiatePlaceholderEnemyField(opts, currentTn) {
  const o = opts || {};
  const el = o.element || "Void";
  const profile = elementProfile(el);
  const ch = Math.max(4, Math.min(7, o.chain || 5));
  const dur = Math.max(2, Math.min(5, Math.floor(ch / 2) + 1));
  const safeId = String(o.id || (el + "_enemy_field")).replace(/\W+/g, "_").toLowerCase();
  return {
    fieldId: "vbe_" + safeId,
    fieldName: o.name || (el + " Bloom"),
    fieldDescription: o.description || profile.note,
    owner: "enemy",
    duration: dur,
    remainingTurns: dur,
    roundApplied: -1,
    appliedAtTn: typeof currentTn === "number" ? currentTn : 0,
    visualTheme: profile.theme,
    elementTags: [el],
    fieldTags: [profile.recurring, "veilbreak", "enemy"],
    recurringEffect: profile.recurring,
    intensity: ch >= 6 ? "heavy" : "light",
    veilMagicModifier: 0.0,
    affectedArea: "arena",
  };
}

// ── Field Clash resolver ────────────────────────────────────────────────
// Pure. Inputs: incoming + existing field records (as produced by
// instantiateActiveField/instantiatePlaceholderEnemyField), and the
// matching attunement values for the side activating each field.
// Returns:
//   {
//     outcome: "domination" | "split" | "fracture" | "backlash" | "collapse",
//     winner:  "incoming" | "existing" | null,
//     loser:   "incoming" | "existing" | null,
//     incomingAttunement, existingAttunement, diff,
//     intensity: "light" | "heavy",
//     log: string[],          // ready-to-push battle-log lines
//     aftermath: {
//       activeField: <field|null>,    // what the live field becomes
//       enemyField: <field|null>,     // what the enemy slot becomes (if relevant)
//       fieldClash: <clashState|null> // transient clash overlay info
//     }
//   }
//
// Outcome thresholds (small variance ±3):
//   collapse  — 5% chance regardless of math (rare, dramatic)
//   backlash  — incoming field is FAR weaker (diff <= -10)
//   domination — |diff| >= 10
//   split     — |diff| in [5, 9]
//   fracture  — |diff| < 5
export function resolveFieldClash(incoming, existing, incomingAttunement, existingAttunement, opts) {
  const o = opts || {};
  const aIn = (typeof incomingAttunement === "number" ? incomingAttunement : 5);
  const aEx = (typeof existingAttunement === "number" ? existingAttunement : 5);
  const variance = (Math.random() * 6) - 3;
  const diff = Math.round(((aIn - aEx) + variance) * 10) / 10;
  const absDiff = Math.abs(diff);
  let outcome;
  const collapseChance = typeof o.collapseChance === "number" ? o.collapseChance : 0.05;
  if (Math.random() < collapseChance) outcome = "collapse";
  else if (diff <= -10) outcome = "backlash";
  else if (absDiff >= 10) outcome = "domination";
  else if (absDiff >= 5) outcome = "split";
  else outcome = "fracture";

  let winner = null, loser = null;
  if (outcome === "domination") { winner = diff >= 0 ? "incoming" : "existing"; loser = winner === "incoming" ? "existing" : "incoming"; }
  else if (outcome === "split")  { winner = diff >= 0 ? "incoming" : "existing"; loser = winner === "incoming" ? "existing" : "incoming"; }
  else if (outcome === "backlash") { winner = "existing"; loser = "incoming"; }
  // fracture / collapse have no winner
  const intensity = (incoming?.intensity === "heavy" || existing?.intensity === "heavy") ? "heavy" : "light";
  const inName = incoming?.fieldName || "Incoming Field";
  const exName = existing?.fieldName || "Standing Field";
  const log = [];
  log.push("⚡ Two Veilbreak fields collided at the heart of the arena.");
  log.push("⚡ " + inName + " (" + aIn + ") vs " + exName + " (" + aEx + ") — " + (diff > 0 ? "+" : "") + diff + " Field Attunement.");

  // ── Aftermath construction ──
  let aftermathActive = existing || null;
  let aftermathEnemy  = null;
  if (incoming && incoming.owner === "enemy") aftermathEnemy = incoming;
  else if (existing && existing.owner === "enemy") aftermathEnemy = existing;

  if (outcome === "domination") {
    const won = winner === "incoming" ? incoming : existing;
    const lost = loser  === "incoming" ? incoming : existing;
    aftermathActive = won && won.owner === "player" ? { ...won, remainingTurns: Math.min((won.remainingTurns || won.duration || 2) + 1, 5) } : (won && won.owner === "enemy" ? null : won);
    aftermathEnemy  = won && won.owner === "enemy"  ? { ...won, remainingTurns: Math.min((won.remainingTurns || won.duration || 2) + 1, 5) } : null;
    log.push("🔥 Field Clash: Domination — " + (won?.fieldName || "Field") + " overwhelmed " + (lost?.fieldName || "the rival Veil") + ".");
  } else if (outcome === "split") {
    const won = winner === "incoming" ? incoming : existing;
    const lost = loser  === "incoming" ? incoming : existing;
    // Both fields persist at reduced duration.
    const splitDur = 3;
    if (won) {
      const wonNext = { ...won, remainingTurns: Math.max(2, Math.min(splitDur, won.remainingTurns || splitDur)) };
      if (won.owner === "player") aftermathActive = wonNext; else aftermathEnemy = wonNext;
    }
    if (lost) {
      const lostNext = { ...lost, remainingTurns: Math.max(2, Math.min(splitDur, (lost.remainingTurns || splitDur) - 1)) };
      if (lost.owner === "player") aftermathActive = lostNext; else aftermathEnemy = lostNext;
    }
    log.push("🌫 Field Clash: Split Field — the battlefield divided into rival territories.");
  } else if (outcome === "fracture") {
    // Both destabilize; durations shaved.
    if (existing) {
      const next = { ...existing, remainingTurns: Math.max(0, (existing.remainingTurns || existing.duration || 2) - 1) };
      if (existing.owner === "player") aftermathActive = next.remainingTurns > 0 ? next : null;
      else aftermathEnemy = next.remainingTurns > 0 ? next : null;
    }
    if (incoming) {
      const next = { ...incoming, remainingTurns: Math.max(0, (incoming.remainingTurns || incoming.duration || 2) - 1) };
      if (incoming.owner === "player") aftermathActive = next.remainingTurns > 0 ? next : null;
      else aftermathEnemy = next.remainingTurns > 0 ? next : null;
    }
    log.push("💥 Field Clash: Field Fracture — both fields destabilized, scattering unstable Veil-light across the arena.");
  } else if (outcome === "backlash") {
    // Existing field stands. Incoming field never takes hold.
    log.push("💢 Field Clash: Backlash — the failed field recoiled against its caster.");
    if (existing && existing.owner === "player") aftermathActive = existing;
    if (existing && existing.owner === "enemy") aftermathEnemy = existing;
    if (incoming && incoming.owner === "player") {
      // incoming player field never instantiates
    }
  } else if (outcome === "collapse") {
    log.push("🌌 Field Clash: Mutual Collapse — both fields shattered, leaving fractured Veil in their wake.");
    aftermathActive = null;
    aftermathEnemy = null;
  }

  // Clamp durations to safe bounds.
  if (aftermathActive && typeof aftermathActive.remainingTurns === "number") {
    aftermathActive.remainingTurns = Math.max(0, Math.min(5, aftermathActive.remainingTurns));
    if (aftermathActive.remainingTurns <= 0) aftermathActive = null;
  }
  if (aftermathEnemy && typeof aftermathEnemy.remainingTurns === "number") {
    aftermathEnemy.remainingTurns = Math.max(0, Math.min(5, aftermathEnemy.remainingTurns));
    if (aftermathEnemy.remainingTurns <= 0) aftermathEnemy = null;
  }

  // ── Clash overlay (transient, lives on btl.fieldClash) ──
  const fieldClash = {
    active: true,
    outcome,
    winner,
    loser,
    intensity,
    incomingName: inName,
    existingName: exName,
    incomingAttunement: aIn,
    existingAttunement: aEx,
    diff,
    turnsRemaining: outcome === "split" ? 3 : (outcome === "fracture" ? 2 : (outcome === "collapse" ? 2 : 1)),
    splitFieldZones: outcome === "split" ? { a: incoming?.visualTheme || "void", b: existing?.visualTheme || "void" } : null,
    fracturedTiles: (outcome === "fracture" || outcome === "collapse") ? true : false,
    backlashTarget: outcome === "backlash" && incoming?.owner === "player" ? "player" : (outcome === "backlash" && incoming?.owner === "enemy" ? "enemy" : null),
    log: log.slice(),
  };

  return {
    outcome,
    winner,
    loser,
    incomingAttunement: aIn,
    existingAttunement: aEx,
    diff,
    intensity,
    log,
    aftermath: {
      activeField: aftermathActive,
      enemyField: aftermathEnemy,
      fieldClash,
    },
  };
}

// ── Per-action clash overlay tick ───────────────────────────────────────
// Returns a new clash state with turnsRemaining-1, or null when the
// overlay has fully expired. Caller does NOT need to call this every
// render — only at the same point active-field ticks happen.
export function tickFieldClash(clash) {
  if (!clash || !clash.active) return null;
  const next = (clash.turnsRemaining || 0) - 1;
  if (next <= 0) return null;
  return { ...clash, turnsRemaining: next };
}

export function describeClashOutcome(outcome) {
  const map = {
    domination: "Stronger field replaced the weaker one.",
    split:      "The arena divided into rival territories for a few turns.",
    fracture:   "Both fields destabilized — fractured Veil-light scattered across the arena.",
    backlash:   "The failed field recoiled against its caster.",
    collapse:   "Both fields shattered into a brief, neutral fractured state.",
  };
  return map[outcome] || "The Veil churned.";
}

// ── Tactical Action catalogue ───────────────────────────────────────────
// Catalogue only — Game.jsx applies the actual mutations so React state
// remains the single source of truth. `cost` shape is `{ mp?, hp? }`.
// `tags` lets the UI explain when each action helps.
export const TACTICAL_ACTIONS = [
  {
    id: "veil_anchor",
    name: "Veil Anchor",
    icon: "⚓",
    cost: { mp: 6 },
    summary: "Anchor your Veilbreak field against collapse.",
    detail: "Adds +6 Field Attunement and +1 duration to your next clash. Stacks once.",
    log: "anchored their Veilbreak field against collapse.",
    when: "Use before activating a field if a hostile field is rising.",
  },
  {
    id: "field_sever",
    name: "Field Sever",
    icon: "✂",
    cost: { mp: 8 },
    summary: "Sever an enemy field's boundary.",
    detail: "Reduces an enemy field's remaining duration by 1 turn.",
    log: "cut at the opposing field's boundary.",
    when: "Only usable while an enemy field is active.",
    requiresEnemyField: true,
  },
  {
    id: "brace_field",
    name: "Brace Against Field",
    icon: "🛡",
    cost: { mp: 2 },
    summary: "Brace against hostile field pressure.",
    detail: "Halves incoming field tick damage on you next round.",
    log: "braced against the hostile field pressure.",
    when: "Use while an enemy field is active and pressuring your HP.",
  },
  {
    id: "overchannel_1",
    name: "Overchannel I",
    icon: "🩸",
    cost: { hp: 8 },
    summary: "Trade blood for Veil output.",
    detail: "Spend 8 HP. Your next Veil Magic or Veilbreak deals ×1.5 power.",
    log: "overchannelled, trading blood for Veil output.",
    when: "Use just before a critical Veil Magic strike.",
    overchannelMult: 1.5,
    risk: "low",
  },
  {
    id: "overchannel_2",
    name: "Overchannel II",
    icon: "🩸",
    cost: { hp: 16 },
    summary: "Pay deeper blood for greater Veil output.",
    detail: "Spend 16 HP. Your next Veil Magic or Veilbreak deals ×2.0 power.",
    log: "pushed past the safe channel — blood for Veil output.",
    when: "Use only when HP can spare it. Cannot reduce you below 1 HP.",
    overchannelMult: 2.0,
    risk: "moderate",
  },
  {
    id: "overchannel_3",
    name: "Overchannel III",
    icon: "🩸",
    cost: { hp: 28 },
    summary: "Tear at the Veil — heavy bloodprice.",
    detail: "Spend 28 HP. Your next Veil Magic or Veilbreak deals ×2.5 power. Locked under 50% HP.",
    log: "tore at the Veil itself, paying a heavy bloodprice.",
    when: "Requires above 50% HP. Cannot reduce you below 1 HP.",
    overchannelMult: 2.5,
    risk: "heavy",
    requiresHpAbovePct: 0.5,
  },
  {
    id: "focus_breath",
    name: "Focus Breath",
    icon: "🌬",
    cost: { mp: 3 },
    summary: "Steady your breathing and sharpen your focus.",
    detail: "Apply Veilflare Focus (2 turns): +crit, +Field Attunement, +Veil Magic next cast.",
    log: "steadied his breathing and sharpened his focus.",
    when: "Use to set up a Steady/Flurry crit window or a Veil Magic spike.",
    grantsVeilflareFocus: 2,
  },
];

// TODO Pass 10+:
//  • Tactical action cooldowns (per-action cooldown tracker on btl).
//  • Action economy: split movement / action / minor action so Focus Breath
//    becomes a true minor action instead of consuming the player's main turn.
//  • Boss counters to Overchannel (e.g. punish channelers with debuffs).
//  • Enemy AI use of tactical actions.

export function getTacticalAction(id) {
  return TACTICAL_ACTIONS.find(a => a.id === id) || null;
}

// ─────────────────────────────────────────────────────────────────────────
// TODO — Future passes (NOT in scope for Pass 8):
//  • Real enemy/boss Veilbreak field activation (AI side).
//  • Per-class field affinity table (Phoenix dot-field +att, Tidecaller
//    regen-field +att, Voidmage silence-field +att, etc).
//  • Split-field tile assignment from arena geometry (zones based on
//    actual tile distance instead of theme tags).
//  • Fractured tile gameplay (small per-tile DoT + Veil Magic gain).
//  • Overchannel II / III (×2 / ×2.5 with HP scaling + heavier risk).
//  • Per-rare-terrain interactions (Bloodstone amplifies dot fields, etc).
//  • Boss-specific recurring effects + duration tuning.
// ─────────────────────────────────────────────────────────────────────────
