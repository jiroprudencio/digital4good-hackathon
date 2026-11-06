import { describe, expect, it } from 'vitest';
import { createGame, rates, reducer } from '../../game/game';
import { noteBundle } from './notes';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EarnNotes } from './Scene';

const combinations = [0, 1, 2, 3].flatMap((stage) =>
  [false, true].map((upgrade) => ({ stage, upgrade })),
);

describe('banknote bundle matches tap earnings', () => {
  it.each(combinations)('stage $stage, upgrade $upgrade', ({ stage, upgrade }) => {
    const s = { ...createGame(), started: true, stage, upgrade };
    const bundle = noteBundle(rates(s).tap, stage);
    const depictedCents = bundle.notes.reduce(
      (sum, note) => sum + note.denomination * note.count * 100,
      bundle.remaining,
    );
    const after = reducer(s, { type: 'TAP', now: 1 });
    expect(depictedCents).toBe(after.cash - s.cash);
    expect(bundle.remaining).toBe(0);
    expect(bundle.notes).toEqual([
      { denomination: [2, 10, 50, 100][stage], count: upgrade ? 2 : 1 },
    ]);
    for (const note of bundle.notes) {
      expect([2, 10, 50, 100, 1000]).toContain(note.denomination);
      expect(Number.isInteger(note.count)).toBe(true);
      expect(note.count).toBeGreaterThan(0);
    }
    const markup = renderToStaticMarkup(createElement(EarnNotes, { cents: rates(s).tap, stage }));
    expect(markup.match(/data-testid="stacked-note"/g)?.length).toBe(bundle.notes[0].count);
    expect(markup).toContain('aria-hidden="true"');
  });
});
