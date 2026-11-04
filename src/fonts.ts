export const FONT_PAIRINGS = [
  { id: 'arcade', heading: 'Silkscreen', body: 'IBM Plex Sans', note: 'Current pairing. Structured and easy to read.' },
  { id: 'silk-dm', heading: 'Silkscreen', body: 'DM Sans', note: 'Rounder, softer interface text.' },
  { id: 'silk-inter', heading: 'Silkscreen', body: 'Inter', note: 'Neutral and compact interface text.' },
  { id: 'silk-nunito', heading: 'Silkscreen', body: 'Nunito Sans', note: 'Friendly curves beside the pixel headings.' },
  { id: 'silk-source', heading: 'Silkscreen', body: 'Source Sans 3', note: 'Open letterforms for longer messages.' },
] as const;
export type FontPairing = typeof FONT_PAIRINGS[number]['id'] | 'default';
export function initialFont(): FontPairing {
  const param = new URLSearchParams(location.search).get('font');
  let stored: string | null = null;
  try { stored = localStorage.getItem('scamagotchi.font.v2'); } catch { /* Optional preference. */ }
  return FONT_PAIRINGS.find(f => f.id === (param ?? stored))?.id ?? 'arcade';
}
