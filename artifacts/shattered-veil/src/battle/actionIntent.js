// ─────────────────────────────────────────────────────────────────────────
// v96 — ACTION INTENT + EFFECT TAG SHIM (additive only, no engine math)
// ─────────────────────────────────────────────────────────────────────────
// Layered on top of v94 arenaTargeting metadata. Pure functions only.
//
// Adds the missing pieces from the v96 spec without rewriting the 200+
// existing skills:
//   1. INTENT classification → drives the v95 .is-fx-* color tokens so
//      tile previews telegraph red/green/blue/gold/orange/grey before
//      commit (Spec §D / §H previews).
//   2. EFFECT TAG SHIM → derives [{ category, polarity, targetBinding }]
//      from existing skill fields (t/fx/fx2/aoe). Used for UI/log/badge
//      surfaces only; bAct still applies the actual damage/effects via
//      its existing pipeline. (Spec §C — shim, not migration.)
//   3. Target VALIDATION helper → returns a clear reason string when the
//      player clicks the wrong unit kind. (Spec §A.4 / §F.19 / §I.)
//   4. Narration helper → cleaner battle-log openers for new actions.
//      (Spec §G.20.)
//
// Save shape unchanged. No new state. All inputs are existing objects.
// ─────────────────────────────────────────────────────────────────────────

// ── INTENT ──────────────────────────────────────────────────────────────
// Returns one of: 'damage' | 'debuff' | 'heal' | 'buff' | 'move'
//                  'veilbreak' | 'field' | 'object' | 'mixed' | 'none'
// `action` is the bAct verb ('skill'|'strike'|'w2'|'steady'|'flurry'|
// 'guard'|'mend'|'copy'|'ult'|'tactical-*'|'item'). `payload` is the
// underlying skill / weapon / item / ult object (when relevant).
export function getActionIntent(action, meta, payload = null) {
  if (!action) return "none";
  if (action === "ult") return "veilbreak";
  if (action === "guard") return "buff";
  if (action === "mend") return "heal";
  if (action === "tactical-step" || action === "move") return "move";
  if (action === "tactical-anchor" || action === "tact_anchor") return "field";
  if (action === "tactical-sever" || action === "tact_sever") return "support";
  if (
    action === "tactical-overchannel" || action === "tactical-focus" || action === "tactical-brace" ||
    action === "tact_overchannel" || action === "tact_overchannel_2" || action === "tact_overchannel_3" ||
    action === "tact_focus" || action === "tact_brace"
  ) return "buff";
  if (action === "strike" || action === "w2" || action === "steady" || action === "flurry") {
    if (payload && payload.isShield) return "buff";
    return "damage";
  }
  if (action === "copy") return "damage";
  if (action === "skill" && payload) {
    const t = payload.t || payload.kind || "damage";
    if (t === "heal") return "heal";
    if (t === "buff") return "buff";
    if (t === "debuff") return "debuff";
    if (t === "copy") return "damage";
    if (t === "damage") {
      // Damage skills with a buff/heal rider → "mixed" so the card can
      // show both a red damage edge AND a green support tag.
      if (payload.fx && /regen|shield|empower|fortify|barrier|haste|reflect/i.test(payload.fx)) return "mixed";
      return "damage";
    }
    return "damage";
  }
  if (meta && meta.targetType === "ally") return "buff";
  if (meta && meta.targetType === "object") return "object";
  return "damage";
}

// CSS class to telegraph intent on the arena grid + targeting banner.
// Maps to the v95 .is-fx-* tokens (game.css L8638+).
export function getFxClassFromIntent(intent) {
  switch (intent) {
    case "damage":    return "is-fx-damage";
    case "debuff":    return "is-fx-debuff";
    case "heal":      return "is-fx-heal";
    case "buff":      return "is-fx-buff";
    case "support":   return "is-fx-support";
    case "move":      return "is-fx-move";
    case "veilbreak": return "is-fx-veilbreak";
    case "field":     return "is-fx-field";
    case "object":    return "is-fx-damage"; // orange-ish via debuff token; close enough
    case "mixed":     return "is-fx-damage"; // outline red, the support layer pulses separately
    case "invalid":   return "is-fx-invalid";
    case "blocked":   return "is-fx-blocked";
    default:          return "";
  }
}

// Friendly polarity color hint for action card chrome (left border).
export function getIntentBorderColor(intent) {
  switch (intent) {
    case "damage":    return "rgba(255,90,90,0.85)";
    case "debuff":    return "rgba(255,140,90,0.85)";
    case "heal":      return "rgba(110,230,150,0.95)";
    case "buff":      return "rgba(160,210,255,0.85)";
    case "support":   return "rgba(110,230,150,0.85)";
    case "move":      return "rgba(120,200,255,0.85)";
    case "veilbreak": return "rgba(212,173,64,0.95)";
    case "field":     return "rgba(168,80,255,0.85)";
    case "mixed":     return "rgba(255,200,120,0.95)";
    case "object":    return "rgba(255,170,80,0.85)";
    default:          return "rgba(180,180,180,0.55)";
  }
}

// ── EFFECT TAG SHIM ─────────────────────────────────────────────────────
// Each tag is { category, polarity, targetBinding, label }.
//   category:      'damage' | 'heal' | 'buff' | 'debuff' | 'dot' | 'shield'
//                  | 'cleanse' | 'control' | 'field'
//   polarity:      'hostile' | 'friendly' | 'neutral'
//   targetBinding: 'chosenTarget' | 'caster' | 'affectedEnemies'
//                  | 'affectedAllies' | 'affectedTiles' | 'fieldArea'
//   label:         short human-readable hint, used by cards/log
//
// SHIM NOTE: bAct already applies the actual mechanical effects via the
// existing inter[]/fx/fx2 pipeline. These tags exist to telegraph intent
// in UI surfaces and the battle log only. Migrating every skill to
// author its own tag list is out of scope for v96.
const FX_HOSTILE = /burn|bleed|poison|stun|sleep|silence|slow|weaken|expose|curse|blind|confuse|fear|root|dot|seal|skip|acc/i;
const FX_FRIENDLY = /regen|hot|shield|barrier|empower|fortify|haste|reflect|cleans/i;

function fxTag(fxId) {
  if (!fxId) return null;
  const id = String(fxId);
  if (FX_FRIENDLY.test(id)) return { category: "buff", polarity: "friendly", label: id };
  if (FX_HOSTILE.test(id))  return { category: /burn|bleed|poison|dot/i.test(id) ? "dot" : "debuff", polarity: "hostile", label: id };
  return { category: "buff", polarity: "neutral", label: id };
}

export function getEffectTags(action, meta, payload = null) {
  const tags = [];
  const m = meta || {};
  const aoe = !!(payload && payload.aoe);
  const targetType = m.targetType || "enemy";

  // Primary mechanical effect by action verb / skill kind.
  if (action === "ult") {
    tags.push({ category: "damage", polarity: "hostile", targetBinding: aoe ? "affectedEnemies" : "chosenTarget", label: "Veilbreak" });
    tags.push({ category: "field",  polarity: "neutral", targetBinding: "fieldArea", label: "Veilbreak Field" });
  } else if (action === "guard") {
    tags.push({ category: "buff", polarity: "friendly", targetBinding: "caster", label: "Guard" });
  } else if (action === "mend") {
    tags.push({ category: "heal", polarity: "friendly", targetBinding: "caster", label: "Heal" });
  } else if (action === "tactical-anchor" || action === "tact_anchor") {
    tags.push({ category: "field", polarity: "neutral", targetBinding: "fieldArea", label: "Veil Anchor" });
  } else if (action === "tactical-sever" || action === "tact_sever") {
    tags.push({ category: "cleanse", polarity: "neutral", targetBinding: "fieldArea", label: "Field Sever" });
  } else if (
    action === "tactical-overchannel" || action === "tactical-focus" || action === "tactical-brace" ||
    action === "tact_overchannel" || action === "tact_overchannel_2" || action === "tact_overchannel_3" ||
    action === "tact_focus" || action === "tact_brace"
  ) {
    tags.push({ category: "buff", polarity: "friendly", targetBinding: "caster", label: action.replace(/^tactical-|^tact_/, "") });
  } else if (action === "strike" || action === "w2" || action === "steady" || action === "flurry" || action === "copy") {
    tags.push({ category: "damage", polarity: "hostile", targetBinding: "chosenTarget", label: "Strike" });
  } else if (action === "skill" && payload) {
    const t = payload.t || "damage";
    if (t === "damage") {
      tags.push({ category: "damage", polarity: "hostile", targetBinding: aoe ? "affectedEnemies" : "chosenTarget", label: payload.n || "Damage" });
    } else if (t === "heal") {
      tags.push({ category: "heal", polarity: "friendly", targetBinding: aoe ? "affectedAllies" : (targetType === "self" ? "caster" : "chosenTarget"), label: payload.n || "Heal" });
    } else if (t === "buff") {
      tags.push({ category: "buff", polarity: "friendly", targetBinding: targetType === "self" ? "caster" : "affectedAllies", label: payload.n || "Buff" });
    } else if (t === "debuff") {
      tags.push({ category: "debuff", polarity: "hostile", targetBinding: aoe ? "affectedEnemies" : "chosenTarget", label: payload.n || "Debuff" });
    } else if (t === "copy") {
      tags.push({ category: "control", polarity: "neutral", targetBinding: "chosenTarget", label: "Copy" });
    }
  }

  // Rider effects (fx / fx2). Riders inherit the primary's binding when
  // friendly→caster doesn't make sense (e.g. Burn rider on a damage skill
  // attaches to affectedEnemies, not caster).
  const primaryHostileBinding = aoe ? "affectedEnemies" : "chosenTarget";
  const primaryFriendlyBinding = targetType === "self" ? "caster" : (aoe ? "affectedAllies" : "chosenTarget");
  [payload?.fx, payload?.fx2].forEach(fx => {
    const t = fxTag(fx);
    if (!t) return;
    const binding = t.polarity === "friendly" ? primaryFriendlyBinding : primaryHostileBinding;
    tags.push({ ...t, targetBinding: binding });
  });

  return tags;
}

// Compact text summary of the tag list, for action cards and logs.
// E.g. "Damages enemy · Burn enemy · Buffs caster".
export function describeEffectTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  const verbFor = (cat) => {
    switch (cat) {
      case "damage":  return "Damages";
      case "heal":    return "Heals";
      case "buff":    return "Buffs";
      case "debuff":  return "Debuffs";
      case "dot":     return "Afflicts";
      case "shield":  return "Shields";
      case "cleanse": return "Cleanses";
      case "control": return "Controls";
      case "field":   return "Forms field on";
      default:        return cat;
    }
  };
  const targetFor = (b) => {
    switch (b) {
      case "chosenTarget":    return "target";
      case "caster":          return "caster";
      case "affectedEnemies": return "enemies";
      case "affectedAllies":  return "allies";
      case "affectedTiles":   return "tiles";
      case "fieldArea":       return "field";
      default:                return "target";
    }
  };
  return tags.map(t => `${verbFor(t.category)} ${targetFor(t.targetBinding)}`).join(" · ");
}

// ── CLICK VALIDATION ────────────────────────────────────────────────────
// Returns { ok: true } when the clicked unit kind matches the action's
// target type, otherwise { ok: false, reason: "Targets enemies only." }.
// Used by ArenaBoard token click and Game.confirmArenaTarget for
// invalid-target user feedback (Spec §A.4 / §F.19 / §I).
export function validateClickedUnit(unitKind, meta) {
  if (!meta) return { ok: true };
  const tt = meta.targetType;
  if (tt === "any") return { ok: true };
  if (tt === "self") {
    if (unitKind === "player") return { ok: true };
    return { ok: false, reason: "This action can only target yourself." };
  }
  if (tt === "enemy") {
    if (unitKind === "enemy") return { ok: true };
    return { ok: false, reason: "This action must target an enemy." };
  }
  if (tt === "ally") {
    if (unitKind === "player" || unitKind === "ally" || unitKind === "pet") return { ok: true };
    return { ok: false, reason: "This action must target an ally." };
  }
  if (tt === "tile" || tt === "emptyTile") {
    return { ok: true }; // tile clicks already handled by ArenaBoard
  }
  if (tt === "object") {
    if (unitKind === "object") return { ok: true };
    return { ok: false, reason: "This action must target an object." };
  }
  return { ok: true };
}

// (v96 note: a `narrateActionStart` helper was sketched here but never
// adopted — Game.bAct already writes its own battle-log lines. Removed
// to keep the module surface clean.)
