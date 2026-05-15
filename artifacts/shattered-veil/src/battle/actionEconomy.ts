import { P4_ACTION_COSTS, type P4ActionId } from './p4ActionEconomyState';

export type BattleActionEconomyKind =
  | 'main'
  | 'minor'
  | 'free'
  | 'end'
  | 'utility'
  | 'danger'
  | 'movement';

export type BattleActionEconomyMeta = {
  kind: BattleActionEconomyKind;
  cost: number;
  label: string;
  note: string;
  actionId?: P4ActionId;
  endsTurn?: boolean;
  consumesMainAction?: boolean;
};

const clampAp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function fromP4(actionId: P4ActionId): BattleActionEconomyMeta {
  const meta = P4_ACTION_COSTS[actionId];
  return {
    kind: meta.kind,
    cost: meta.cost,
    label: meta.label,
    note: meta.note,
    actionId,
    endsTurn: meta.endsTurn,
    consumesMainAction: meta.consumesMainAction,
  };
}

export function inferP4ActionIdFromText(textInput: string, cls = '', button?: HTMLElement): P4ActionId {
  const text = (textInput || '').replace(/\s+/g, ' ').trim();
  const stripped = text.replace(/^[^A-Za-z]+/, '').trim();

  if (!text) return 'inspect';
  if (button?.dataset.svZeroCostToggle === '1') return 'strategic_view';
  if (button?.dataset.svInventoryUtility === '1') return 'inventory_prep';
  if (button?.classList.contains('battle-help-chip')) return 'inspect';
  if (/^(Combat Arts|Veil Magic|Battle Tactics|Items)$/i.test(text)) return 'tab_switch';
  if (/^(Equip Item|Draw Weapon|Swap Skill|Spellbook)$/i.test(stripped)) return 'drawer';
  if (/(Equip|Draw)\s*→|\bEquipped\b/i.test(text) && /Effect:|ATK:|×\d+/i.test(text)) return 'inventory_prep';
  if (/Copy$/i.test(text) || /^\?$/i.test(text) || /^Tags$/i.test(text)) return 'inspect';

  if (/End Turn/i.test(text)) return 'end_turn';
  if (/Flee/i.test(text)) return 'flee';
  if (/Strategic Step/i.test(text)) return 'strategic_step';
  if (/Basic Move|\bMove\b/i.test(text) && !/Damage|Dmg|Attack/i.test(text)) return 'basic_move';
  if (/Break the Veil|Veilbreak/i.test(text) && /Break the Veil/i.test(text)) return 'veilbreak';

  if (/Veil Anchor/i.test(text) || /sv-tactical-veil_anchor/.test(cls)) return 'veil_anchor';
  if (/Brace Field/i.test(text) || /sv-tactical-brace_field/.test(cls)) return 'brace_field';
  if (/Focus Breath/i.test(text) || /sv-tactical-focus_breath/.test(cls)) return 'focus_breath';
  if (/Field Sever/i.test(text) || /sv-tactical-field_sever/.test(cls)) return 'field_sever';
  if (/Overchannel/i.test(text) || /sv-tactical-overchannel/.test(cls)) return 'overchannel';
  if (/Spawn Enemy Field/i.test(text)) return 'inspect';

  if (/Steady Strike/i.test(text)) return 'steady_strike';
  if (/Flurry Strike/i.test(text)) return 'flurry_strike';
  if (/Guard|Defend/i.test(text)) return 'guard';
  if (/Cost:\s*\d+\s*MP/i.test(text) || /Damage|Heal|Buff|Debuff|Copy/i.test(text)) return 'veil_magic';
  if (/Dmg|Attack|Shield Utility/i.test(text)) return 'basic_attack';
  if (/🧪/.test(text) && /Effect:/i.test(text)) return 'equipped_consumable';

  return 'inspect';
}

export function getBattleActionEconomyMeta(button: HTMLElement): BattleActionEconomyMeta {
  const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
  const cls = button.className || '';
  return fromP4(inferP4ActionIdFromText(text, String(cls), button));
}

export function getActionEconomyWidth(remaining: number) {
  return clampAp(remaining) + '%';
}

export function getActionEconomyStateLabel(remaining: number) {
  const ap = clampAp(remaining);
  if (ap >= 100) return 'Ready';
  if (ap >= 65) return 'Open';
  if (ap >= 35) return 'Limited';
  if (ap > 0) return 'Last sliver';
  return 'Spent';
}

export function explainActionEconomyBalance() {
  return [
    'Each player turn starts with 100% action economy.',
    'Primary actions such as most weapon attacks, Veil Magic, Veilbreak, equipped consumables, and Flee are balanced as full-turn commitments.',
    'Taking an item from inventory into a battle slot and drawing a weapon are 0% AP because they are loadout management, not offensive pressure.',
    'Move costs 30% AP per tile and can be repeated tile-by-tile while action economy remains.',
    'Strategic Step costs 30% AP once and instantly repositions up to 5 tiles.',
    'Steady Strike costs 60% because it is reliable but low-pressure, allowing a light tactical follow-up.',
    'Flurry Strike costs 80% because multi-hit crit/status pressure is stronger than a basic strike.',
    'Field control tactics are partial actions: Focus Breath 25%, Veil Anchor/Brace 35%, Overchannel 50%, Field Sever 65%.',
    'Strategic View, tab switching, help chips, and inspection are zero-cost because they only provide information.',
    'End Turn is a pure pass-turn action only: no Guard, Defend, buff, heal, damage reduction, or hidden benefit.',
  ].join('\n');
}
