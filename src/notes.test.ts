import { describe, expect, it } from 'vitest';
import { createGame, rates, reducer } from './game';
import { noteBundle } from './notes';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EarnNotes } from './Scene';

const combinations = [0, 1, 2, 3].flatMap(stage => [false, true].map(upgrade => ({ stage, upgrade, bonus: false })));
combinations.push({ stage: 0, upgrade: false, bonus: true }, { stage: 0, upgrade: true, bonus: true });

describe('banknote bundle matches tap earnings', () => {
  it.each(combinations)('stage $stage, upgrade $upgrade, school item $bonus', ({ stage, upgrade, bonus }) => {
    const s = { ...createGame(), started: true, stage, upgrade };
    if (bonus) {
      s.progress['school-b'].arrived = true;
      s.progress['school-b'].result = { decision: 'proceed', verified: true, unsafe: false, personalDelta: -10000, employerLoss: 0, missed: false };
    }
    const bundle = noteBundle(rates(s).tap, stage);
    const depictedCents = bundle.notes.reduce((sum, note) => sum + note.denomination * note.count * 100, bundle.remaining);
    const after = reducer(s, { type: 'TAP', now: 1 });
    expect(depictedCents).toBe(after.cash - s.cash);
    expect(bundle.remaining).toBe(bonus ? (upgrade ? 800 : 400) : 0);
    expect(bundle.notes).toEqual([{ denomination: [10, 50, 100, 1000][stage], count: [2, 4, 20, 10][stage] * (upgrade ? 2 : 1) }]);
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
