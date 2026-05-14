export type BattleActionEconomyKind =
  | 'main'
  | 'minor'
  | 'free'
  | 'end'
  | 'utility'
  | 'danger';

export type BattleActionEconomyMeta = {
  kind: BattleActionEconomyKind;
  cost: number;
  label: string;
  note: string;
};

const clampAp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function getBattleActionEconomyMeta(button: HTMLElement): BattleActionEconomyMeta {
  const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
  const cls = button.className || '';

  if (!text) return { kind: 'free', cost: 0, label: 'Free', note: 'No action economy cost.' };
  if (button.dataset.svZeroCostToggle === '1') return { kind: 'free', cost: 0, label: '0%', note: 'Free tactical information toggle.' };
  if (button.classList.contains('battle-help-chip')) return { kind: 'free', cost: 0, label: '0%', note: 'Information only.' };
  if (/^(Combat Arts|Veil Magic|Battle Tactics|Items)$/i.test(text)) return { kind: 'free', cost: 0, label: '0%', note: 'Tab switch only.' };
  if (/^(Equip Item|Draw Weapon|Swap Skill|Spellbook)$/i.test(text.replace(/^[^A-Za-z]+/, '').trim())) return { kind: 'free', cost: 0, label: '0%', note: 'Opens a utility drawer.' };
  if (/Copy$/i.test(text) || /^\?$/i.test(text) || /^Tags$/i.test(text)) return { kind: 'free', cost: 0, label: '0%', note: 'Information only.' };

  if (/End Turn/i.test(text)) return { kind: 'end', cost: 100, label: 'End', note: 'Voluntarily ends your turn.' };
  if (/Flee/i.test(text)) return { kind: 'danger', cost: 100, label: '100%', note: 'Full-turn escape attempt.' };
  if (/Break the Veil|Veilbreak/i.test(text) && /Break the Veil/i.test(text)) return { kind: 'main', cost: 100, label: '100%', note: 'Full-turn field/ultimate action.' };

  if (/Veil Anchor/i.test(text) || /sv-tactical-veil_anchor/.test(cls)) return { kind: 'minor', cost: 35, label: '35%', note: 'Minor setup; leaves room for another minor tactic.' };
  if (/Brace Field/i.test(text) || /sv-tactical-brace_field/.test(cls)) return { kind: 'minor', cost: 35, label: '35%', note: 'Minor defensive field response.' };
  if (/Focus Breath/i.test(text) || /sv-tactical-focus_breath/.test(cls)) return { kind: 'minor', cost: 25, label: '25%', note: 'Light focus action.' };
  if (/Field Sever/i.test(text) || /sv-tactical-field_sever/.test(cls)) return { kind: 'utility', cost: 65, label: '65%', note: 'Heavy field-control utility.' };
  if (/Overchannel/i.test(text) || /sv-tactical-overchannel/.test(cls)) return { kind: 'utility', cost: 50, label: '50%', note: 'Risk/reward power setup.' };
  if (/Spawn Enemy Field/i.test(text)) return { kind: 'free', cost: 0, label: '0%', note: 'Training diagnostic only.' };

  if (/Steady Strike/i.test(text)) return { kind: 'main', cost: 60, label: '60%', note: 'Reliable basic strike; can pair with a light tactic.' };
  if (/Flurry Strike/i.test(text)) return { kind: 'main', cost: 80, label: '80%', note: 'Multi-hit pressure; leaves a small tactical remainder.' };
  if (/Guard|Defend/i.test(text)) return { kind: 'minor', cost: 50, label: '50%', note: 'Defensive half-turn action.' };
  if (/Cost:\s*\d+\s*MP/i.test(text) || /Damage|Heal|Buff|Debuff|Copy/i.test(text)) return { kind: 'main', cost: 100, label: '100%', note: 'Primary Veil Magic or combat action.' };
  if (/Dmg|Attack|Shield Utility/i.test(text)) return { kind: 'main', cost: 100, label: '100%', note: 'Primary combat action.' };
  if (/🧪/.test(text) && /Effect:/i.test(text)) return { kind: 'main', cost: 100, label: '100%', note: 'Battle consumable.' };

  return { kind: 'free', cost: 0, label: '0%', note: 'No action economy cost.' };
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
    'Primary actions such as most weapon attacks, Veil Magic, Veilbreak, items, and Flee are balanced as full-turn commitments.',
    'Steady Strike costs 60% because it is reliable but low-pressure, allowing a light tactical follow-up.',
    'Flurry Strike costs 80% because multi-hit crit/status pressure is stronger than a basic strike.',
    'Field control tactics are partial actions: Focus Breath 25%, Veil Anchor/Brace 35%, Overchannel 50%, Field Sever 65%.',
    'Strategic View, tab switching, help chips, and inspection are zero-cost because they only provide information.',
  ].join('\n');
}
