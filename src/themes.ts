export const THEMES = [
  { id: 'pocket', name: 'Pocket', reference: 'Hum', description: 'Cream paper, yellow controls and rounded edges.' },
  { id: 'ledger', name: 'Ledger', reference: 'Almanac', description: 'Cool paper, ruled sections and square edges.' },
  { id: 'arcade', name: 'Arcade', reference: 'Arcade', description: 'Dark plum, amber controls and hard shadows.' },
  { id: 'void', name: 'Night shift', reference: 'Dusk', description: 'Slate surfaces, soft borders and sage controls.' },
  { id: 'blueprint', name: 'Blueprint', reference: 'Cobalt', description: 'White surfaces, blue controls and cut corners.' },
] as const;
export type Theme = typeof THEMES[number]['id'];
export function initialTheme(): Theme {
  const param = new URLSearchParams(location.search).get('theme');
  let saved: string | null = null;
  try { saved = localStorage.getItem('scamagotchi.theme.v2'); } catch { /* Optional preference. */ }
  return THEMES.find(t => t.id === (param ?? saved))?.id ?? 'pocket';
}
