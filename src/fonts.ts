export const FONT_PAIRINGS = [
  { id: 'rounded', heading: 'Nunito', body: 'DM Sans', note: 'Rounded, readable. Recommended starting point.' },
  { id: 'geometric', heading: 'Space Grotesk', body: 'Inter', note: 'Crisp headings and a neutral interface.' },
  { id: 'friendly', heading: 'Outfit', body: 'Source Sans 3', note: 'Soft geometry with clear long-form reading.' },
  { id: 'pixel', heading: 'Pixelify Sans', body: 'Nunito Sans', note: 'Pixel character for headings, smooth text for decisions.' },
  { id: 'arcade', heading: 'Silkscreen', body: 'IBM Plex Sans', note: 'The strongest arcade feel; keep pixel lettering to headings.' },
] as const;
export type FontPairing = typeof FONT_PAIRINGS[number]['id'] | 'default';
export function initialFont(): FontPairing {
  const param = new URLSearchParams(location.search).get('font');
  let stored: string | null = null;
  try { stored = localStorage.getItem('scamagotchi.font'); } catch { /* Optional preference. */ }
  return FONT_PAIRINGS.find(f => f.id === (param ?? stored))?.id ?? 'default';
}
