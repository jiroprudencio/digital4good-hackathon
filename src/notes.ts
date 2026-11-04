export const STAGE_DENOMINATIONS = [10, 50, 100, 1000] as const;
export function noteBundle(cents: number, stage: number) {
  const denomination = STAGE_DENOMINATIONS[stage];
  const count = Math.floor(cents / (denomination * 100));
  const notes = count ? [{ denomination, count }] : [];
  const remaining = cents - count * denomination * 100;
  return { notes, remaining };
}
