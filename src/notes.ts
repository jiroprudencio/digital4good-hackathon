export function noteBundle(cents: number) {
  let remaining = cents;
  const notes: { denomination: number; count: number }[] = [];
  for (const denomination of [1000, 100, 50, 10, 2]) {
    const count = Math.floor(remaining / (denomination * 100));
    if (count) { notes.push({ denomination, count }); remaining -= count * denomination * 100; }
  }
  return { notes, remaining };
}
