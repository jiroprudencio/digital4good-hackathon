import { describe, expect, it, vi } from 'vitest';
import { CASES, ENCOUNTERS, STAGES } from './content';
import { activeCase, canAdvance, createGame, decodeSave, rates, reducer, resolvedCount } from './game';
import type { GameState } from './game';

function wait(s: GameState, seconds: number) {
  for (let i = 0; i < seconds; i++) s = reducer(s, { type: 'TICK', ms: 1000 });
  return s;
}
function tap(s: GameState, count: number) {
  for (let i = 0; i < count; i++) s = reducer(s, { type: 'TAP', now: Math.max(0, s.lastTap + 500) });
  return s;
}
function start() { return reducer(createGame(() => 0), { type: 'START' }); }
function open(s: GameState, id: string) {
  s = reducer(s, { type: 'PHONE', open: true });
  return reducer(s, { type: 'CASE', id });
}
function inspect(s: GameState, id: string) {
  const e = CASES[s.phone.caseId!].evidence.find(e => e.id === id)!;
  s = reducer(s, { type: 'APP', app: e.app });
  return reducer(s, { type: 'INSPECT', id });
}
function fixture(id: string, cash = 5000000) {
  const s = start(); s.stage = CASES[id].stage; s.cash = cash; s.progress[id].arrived = true;
  return open(s, id);
}
function completedThrough(stage: number) {
  const s = start(); s.stage = stage;
  for (const e of ENCOUNTERS.filter(e => e.stage <= stage)) {
    s.progress[e.id] = { ...s.progress[e.id], arrived: true, read: true, result: { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: !e.scam && e.stage !== 3 } };
  }
  return s;
}

describe('earning and chapter pacing', () => {
  it('auto-opens after five accepted taps, never from elapsed time', () => {
    let s = wait(start(), 60);
    expect(activeCase(s)).toBeUndefined();
    s = tap(s, 4); expect(activeCase(s)).toBeUndefined();
    s = tap(s, 1); expect(activeCase(s)).toBe('school-a');
    expect(s.phone).toMatchObject({ open: true, app: 'messages', caseId: 'school-a' });
    expect(s.cash).toBe(15000); expect(s.stageTaps).toBe(5);
    expect(wait(s, 60)).toEqual(s);
    expect(reducer(s, { type: 'UPGRADE' })).toEqual(s);
    expect(reducer(s, { type: 'TAP', now: 10000 })).toEqual(s);
    expect(reducer(s, { type: 'PHONE', open: false })).toEqual(s);
    expect(reducer(s, { type: 'ACK' })).toEqual(s);
    expect(reducer(s, { type: 'ADVANCE' })).toEqual(s);
    expect(reducer(s, { type: 'APP', app: 'contacts' }).phone.app).toBe('contacts');
    s = start();
    s = reducer(s, { type: 'HIDDEN', hidden: true });
    expect(wait(s, 60)).toEqual(s);
    expect(tap(s, 5)).toEqual(s);
  });
  it('registers rapid taps even with identical timestamps', () => {
    let s = start();
    for (let i = 0; i < 4; i++) s = reducer(s, { type: 'TAP', now: 0 });
    expect(s.cash).toBe(13000); expect(s.stageTaps).toBe(4);
    s = reducer(s, { type: 'TAP', now: 0 });
    expect(s.cash).toBe(15000); expect(s.stageTaps).toBe(5); expect(s.phone.open).toBe(true);
  });
  it('never turns elapsed time into income, including with the school bonus', () => {
    let s = start();
    s = { ...s, stage: 0, progress: { ...s.progress, 'school-b': { ...s.progress['school-b'], result: { decision: 'proceed', verified: true, unsafe: false, personalDelta: -10000, employerLoss: 0, missed: false } } } };
    const before = s.cash;
    for (let i = 0; i < 1000; i++) s = reducer(s, { type: 'TICK', ms: 1 });
    expect(s.cash).toBe(before); expect(s.gross).toBe(0);
    expect(reducer(s, { type: 'TICK', ms: 86400000 }).cash).toBe(before);
    expect(tap(s, 1).cash - s.cash).toBe(2400);
  });
  it.each([0, 1, 2, 3])('stage %i grants no idle earnings with or without an upgrade', stage => {
    for (const upgrade of [false, true]) {
      const s = { ...start(), stage, upgrade };
      const after = wait(s, 60);
      expect(after.cash).toBe(s.cash); expect(after.gross).toBe(s.gross);
      expect(after.activeMs).toBe(60000); expect(activeCase(after)).toBeUndefined();
    }
  });
  it('requires both resolved requests as well as the money milestone', () => {
    const s = { ...start(), cash: 200000, gross: 200000 }; expect(canAdvance(s)).toBe(false);
    expect(reducer(s, { type: 'ADVANCE' }).stage).toBe(0);
  });
  it('purchases an upgrade once without reducing lifetime earnings', () => {
    let s = { ...start(), cash: 45000, gross: 40000 }; const before = s.cash, gross = s.gross;
    s = reducer(s, { type: 'UPGRADE' });
    expect(s.cash).toBe(before - 20000); expect(s.gross).toBe(gross);
    expect(rates(s)).toEqual({ tap: 4000 });
    expect(reducer(s, { type: 'UPGRADE' })).toEqual(s);
  });
  it.each([0, 1, 2, 3])('stage %i credits exactly the displayed tap rate with and without upgrades', stage => {
    for (const upgrade of [false, true]) {
      const s = { ...start(), stage, upgrade };
      expect(tap(s, 1).cash - s.cash).toBe(rates(s).tap);
    }
  });
  it('combines the school item bonus with the upgrade in the displayed tap amount', () => {
    const s = { ...completedThrough(0), upgrade: true };
    s.progress['school-b'].result!.decision = 'proceed';
    expect(rates(s).tap).toBe(4800);
    expect(tap(s, 1).cash - s.cash).toBe(4800);
  });
});

describe('automatic life stages', () => {
  it.each(['ACK', 'PHONE'] as const)('waits for reading the last outcome, then advances on %s', close => {
    let s = { ...start(), cash: 100000, gross: 100000 };
    s = reducer(s, { type: 'UPGRADE' });
    s = tap(s, 5);
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    s = reducer(s, { type: 'ACK' });
    expect(s.stage).toBe(0);
    s = tap(s, 5);
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(canAdvance(s)).toBe(true);
    expect(s.stage).toBe(0); expect(s.phone.app).toBe('feedback'); expect(s.phone.open).toBe(true);
    expect(wait(s, 60)).toEqual(s); expect(tap(s, 1)).toEqual(s);
    expect(reducer(s, { type: 'ADVANCE' })).toEqual(s);
    const before = s;
    s = reducer(s, close === 'ACK' ? { type: 'ACK' } : { type: 'PHONE', open: false });
    expect(s.stage).toBe(1); expect(s.phone.open).toBe(false); expect(s.upgrade).toBe(false);
    expect(s.cash).toBe(before.cash); expect(s.gross).toBe(before.gross);
    expect(s.progress).toEqual(before.progress); expect(s.ledger).toEqual(before.ledger); expect(s.calls).toEqual(before.calls);
    expect(s.stageTaps).toBe(0); expect(s.stageMs).toBe(0); expect(s.lastResolutionTap).toBeNull();
    expect(tap(s, 4).phone.open).toBe(false);
    expect(tap(s, 5).phone.open).toBe(true);
  });
  it('advances on the earning tap that crosses the threshold after both requests were resolved', () => {
    const s = { ...completedThrough(0), cash: 90000, gross: 99000, upgrade: true };
    const after = tap(s, 1);
    expect(after.stage).toBe(1); expect(after.cash - s.cash).toBe(4000);
    expect(after.gross).toBe(103000); expect(after.upgrade).toBe(false);
    expect(after.progress).toEqual(s.progress);
  });
  it('resumes an eligible old save automatically on the next tick without awarding money', () => {
    const saved = { ...completedThrough(1), cash: 800000, gross: 1000000, upgrade: true };
    const restored = decodeSave(JSON.stringify(saved))!;
    expect(restored.stage).toBe(1);
    const after = wait(restored, 1);
    expect(after.stage).toBe(2); expect(after.cash).toBe(saved.cash); expect(after.gross).toBe(saved.gross);
    expect(after.upgrade).toBe(false); expect(after.stageTaps).toBe(0);
  });
  it('finishes automatically only after one million is held and every encounter has resolved', () => {
    let s = { ...completedThrough(3), cash: 99900000 };
    s.progress['home-b'].result = null;
    s = open(s, 'home-b');
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    s = reducer(s, { type: 'ACK' });
    expect(s.finished).toBe(false);
    s = tap(s, 1);
    expect(s.cash).toBeGreaterThanOrEqual(100000000); expect(s.finished).toBe(true);
    expect(s.phone.open).toBe(false); expect(resolvedCount(s)).toBe(8);
  });
  it('keeps the final outcome readable even when savings already exceed one million', () => {
    let s = { ...completedThrough(3), cash: 100000000 };
    s.progress['home-b'].result = null;
    s = open(s, 'home-b');
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(s.finished).toBe(false); expect(s.phone.app).toBe('feedback');
    expect(wait(s, 1).finished).toBe(false);
    expect(reducer(s, { type: 'ACK' }).finished).toBe(true);
  });
  it('does not turn a forged final-stage-only result into a completed life', () => {
    const s = { ...completedThrough(3), cash: 100000000 };
    s.progress['school-a'].result = null;
    expect(canAdvance(s)).toBe(false); expect(wait(s, 1).finished).toBe(false);
  });
});

describe('development encounter exit', () => {
  it('preserves the request and evidence while allowing test earnings and upgrades', () => {
    let s = tap(start(), 5);
    s = inspect(s, 'market');
    const progress = s.progress, initialCash = s.cash;
    s = reducer(s, { type: 'DEV_EXIT' });
    expect(s.phone.open).toBe(false); expect(s.progress).toEqual(progress);
    expect(s.progress['school-a'].result).toBeNull(); expect(activeCase(s)).toBe('school-a');
    s = tap(s, 5);
    expect(s.cash).toBe(initialCash + 10000); expect(s.phone.open).toBe(false);
    expect(s.progress['school-b'].arrived).toBe(false);
    s = reducer(s, { type: 'UPGRADE' }); expect(s.upgrade).toBe(true);
    s = reducer(s, { type: 'PHONE', open: true });
    expect(s.phone.caseId).toBe('school-a'); expect(s.phone.open).toBe(true);
    expect(reducer(s, { type: 'PHONE', open: false })).toEqual(s);
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(s.progress['school-a'].result?.verified).toBe(true);
    s = reducer(s, { type: 'ACK' });
    s = tap(s, 4); expect(activeCase(s)).toBeUndefined();
    s = tap(s, 1); expect(activeCase(s)).toBe('school-b'); expect(s.phone.open).toBe(true);
  });
  it('restores the mandatory request after a development exit and reload', () => {
    const s = reducer(tap(start(), 5), { type: 'DEV_EXIT' });
    const restored = decodeSave(JSON.stringify(s))!;
    expect(restored.phone.open).toBe(true); expect(activeCase(restored)).toBe('school-a');
    expect(restored.progress['school-a'].result).toBeNull();
  });
  it('ignores the development exit in a production environment', () => {
    const s = tap(start(), 5);
    vi.stubEnv('DEV', false);
    try { expect(reducer(s, { type: 'DEV_EXIT' })).toEqual(s); }
    finally { vi.unstubAllEnvs(); }
  });
});

describe('decisions, verification and money', () => {
  it.each(ENCOUNTERS.map(e => [e.id]))('%s has independently accessible evidence and idempotent outcomes', id => {
    let s = fixture(id); const e = CASES[id];
    s = inspect(s, e.decisive);
    const before = s.cash;
    s = reducer(s, { type: 'RESOLVE', decision: e.scam ? 'report' : 'proceed' });
    expect(s.progress[id].result?.verified).toBe(true);
    expect(s.cash).toBe(before + s.progress[id].result!.personalDelta);
    expect(reducer(s, { type: 'RESOLVE', decision: 'proceed' })).toEqual(s);
    expect(reducer(s, { type: 'SAMPLE' })).toEqual(s);
  });
  it.each(ENCOUNTERS.map(e => [e.id]))('%s can be declined without evidence or a financial trap', id => {
    const s = reducer(fixture(id, 0), { type: 'RESOLVE', decision: 'decline' });
    expect(s.cash).toBe(0); expect(s.progress[id].result?.verified).toBe(false);
    expect(s.progress[id].result?.unsafe).toBe(false);
  });
  it('sender reassurance cannot count as independent verification', () => {
    let s = inspect(fixture('office-a'), 'reply');
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(s.progress['office-a'].result?.verified).toBe(false);
  });
  it('a real introductory commission is received once and is not lifetime earnings', () => {
    let s = fixture('uni-a'); const before = s.cash;
    s = reducer(s, { type: 'SAMPLE' });
    expect(s.cash).toBe(before + 5000); expect(s.gross).toBe(0);
    expect(reducer(s, { type: 'SAMPLE' })).toEqual(s);
    s = reducer(s, { type: 'RESOLVE', decision: 'proceed' });
    expect(s.cash).toBe(before + 5000 - 100000);
    expect(s.progress['uni-a'].result?.unsafe).toBe(true);
  });
  it('blocks unaffordable payments while allowing a safe resolution', () => {
    const s = fixture('home-a', 10);
    expect(reducer(s, { type: 'RESOLVE', decision: 'proceed' })).toEqual(s);
    const declined = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(declined.cash).toBe(10); expect(declined.progress['home-a'].result).not.toBeNull();
  });
  it('keeps employer losses separate and allows declining a verified family request', () => {
    let s = fixture('office-a'); const before = s.cash;
    s = reducer(s, { type: 'RESOLVE', decision: 'proceed' });
    expect(s.cash).toBe(before); expect(s.progress['office-a'].result?.employerLoss).toBe(5000);
    s = inspect(fixture('home-b'), 'family');
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(s.progress['home-b'].result).toMatchObject({ verified: true, unsafe: false, missed: false, personalDelta: 0 });
  });
});

describe('complete journeys and persistence', () => {
  it.each(['messages', 'mail'] as const)('keeps the %s list open across a reload and permits returning to the request', app => {
    let s = fixture('school-a');
    s = reducer(s, { type: 'APP', app, list: true });
    expect(s.phone).toMatchObject({ app, record: 'list', open: true });
    s = decodeSave(JSON.stringify(s))!;
    expect(s).not.toBeNull(); expect(s.phone.record).toBe('list');
    s = reducer(s, { type: 'CASE', id: 'school-a' });
    expect(s.phone).toMatchObject({ app: 'messages', record: null, caseId: 'school-a' });
  });
  it('saves an empty inbox list before the first request', () => {
    let s = reducer(start(), { type: 'PHONE', open: true });
    s = reducer(s, { type: 'APP', app: 'mail', list: true });
    expect(decodeSave(JSON.stringify(s))?.phone).toMatchObject({ app: 'mail', caseId: null, record: 'list' });
  });
  it('does not create or accept list navigation for non-message apps', () => {
    const s = fixture('school-a');
    expect(reducer(s, { type: 'APP', app: 'contacts', list: true }).phone.record).toBeNull();
    expect(decodeSave(JSON.stringify({ ...s, phone: { ...s.phone, app: 'contacts', record: 'list' } }))).toBeNull();
  });
  it.each([
    ['school-a', 'market', 'contacts'],
    ['uni-a', 'portal', 'mail'],
    ['uni-a', 'dashboard', 'messages'],
  ])('migrates legacy Browser record %s/%s into %s without changing history', (id, record, app) => {
    const s = completedThrough(CASES[id].stage);
    s.progress[id].result = null;
    s.progress[id].evidence = [record];
    s.phone = { open: true, app: 'home', caseId: id, record: null };
    if (id === 'uni-a') s.calls = [{ caseId: id, evidenceId: 'campus' }];
    const saved = JSON.stringify({ ...s, phone: { ...s.phone, app: 'browser', record } });
    const restored = decodeSave(saved)!;
    expect(restored).not.toBeNull();
    expect(restored.phone).toMatchObject({ app, caseId: id, record, open: true });
    expect(restored.progress).toEqual(s.progress); expect(restored.calls).toEqual(s.calls);
    expect(restored.ledger).toEqual(s.ledger); expect(restored.cash).toBe(s.cash);
  });
  it('returns an empty legacy Browser view to phone home', () => {
    const s = fixture('school-a');
    const restored = decodeSave(JSON.stringify({ ...s, phone: { ...s.phone, app: 'browser', record: null } }))!;
    expect(restored.phone).toMatchObject({ open: true, app: 'home', caseId: 'school-a', record: null });
  });
  it('preserves an older save balance without resuming its former idle income', () => {
    const oldSave: Record<string, unknown> = { ...start(), cash: 123456, gross: 118456, remainder: 999 };
    delete oldSave.stageTaps; delete oldSave.lastResolutionTap;
    const restored = decodeSave(JSON.stringify(oldSave))!;
    expect(restored).not.toBeNull();
    expect(restored.cash).toBe(oldSave.cash); expect(restored.gross).toBe(oldSave.gross);
    const after = wait(restored, 60);
    expect(after.cash).toBe(oldSave.cash); expect(after.gross).toBe(oldSave.gross);
    expect(restored.stageTaps).toBe(0); expect(restored.lastResolutionTap).toBeNull();
  });
  it('opens an unresolved request when resuming a legacy save with the phone closed', () => {
    const s = start(); s.progress['school-a'].arrived = true;
    const restored = decodeSave(JSON.stringify(s))!;
    expect(restored.phone).toMatchObject({ open: true, caseId: 'school-a', app: 'messages' });
    expect(tap(restored, 3).cash).toBe(restored.cash);
  });
  it.each(['cautious', 'mistakes', 'decline everything'])('%s run reaches the million with all history intact after reloads', strategy => {
    let s = start();
    for (let stage = 0; stage < 4; stage++) {
      let safety = 0;
      while (s.stage === stage && !s.finished && safety++ < 1000) {
        const id = activeCase(s);
        if (id) {
          const e = CASES[id];
          expect(s.phone.open).toBe(true);
          expect(s.cash).toBeGreaterThanOrEqual(0);
          s = open(s, id);
          if (strategy === 'cautious') s = inspect(s, e.decisive);
          if (id === 'uni-a') s = reducer(s, { type: 'SAMPLE' });
          s = reducer(s, { type: 'RESOLVE', decision: s.cash < e.cost * 100 || strategy === 'decline everything' || strategy === 'cautious' && e.scam ? 'decline' : 'proceed' });
          expect(s.stage).toBe(stage); expect(s.finished).toBe(false); expect(s.phone.app).toBe('feedback');
          const saved = JSON.stringify(s), cash = s.cash;
          s = decodeSave(saved)!; expect(s).not.toBeNull(); expect(s.cash).toBe(cash);
          expect(reducer(s, { type: 'RESOLVE', decision: 'proceed' }).cash).toBe(cash);
          s = reducer(s, { type: 'ACK' });
        } else {
          if (!s.upgrade && s.cash >= STAGES[stage].cost * 100) s = reducer(s, { type: 'UPGRADE' });
          s = tap(s, 1);
        }
      }
      if (stage < 3) { expect(s.stage).toBe(stage + 1); expect(s.upgrade).toBe(false); expect(rates(s).tap).toBe([20000, 200000, 1000000][stage]); }
      else expect(s.finished).toBe(true);
    }
    expect(s.finished).toBe(true); expect(s.cash).toBeGreaterThanOrEqual(100000000); expect(resolvedCount(s)).toBe(8);
    if (strategy === 'mistakes') expect(Object.values(s.progress).filter(p => p.result?.unsafe)).toHaveLength(4);
    if (strategy === 'cautious') expect(s.calls).toHaveLength(8);
    expect(s.ledger.filter(l => l.id === 'uni-a-sample')).toHaveLength(1);
    expect(s.order).toEqual(createGame(() => 0).order);
  });
  it('requires five new taps after resolution and restores that threshold across reloads', () => {
    let s = tap(start(), 5);
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    s = reducer(s, { type: 'PHONE', open: false });
    s = wait(s, 60); expect(activeCase(s)).toBeUndefined();
    s = tap(s, 4); expect(activeCase(s)).toBeUndefined();
    s = decodeSave(JSON.stringify(s))!;
    s = tap(s, 1);
    expect(s.phone.caseId).toBe('school-b'); expect(s.phone.app).toBe('messages'); expect(s.phone.open).toBe(true);
    expect(s.stageTaps).toBe(10);
    expect(decodeSave(JSON.stringify(s))).not.toBeNull();
  });
  it('resuming a real commission preserves its receipt and prevents a second payout', () => {
    let s = fixture('uni-a');
    for (const id of s.order[0]) { s.progress[id].arrived = true; s.progress[id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: false }; }
    s = reducer(s, { type: 'SAMPLE' });
    const restored = decodeSave(JSON.stringify(s))!;
    expect(restored.ledger.filter(l => l.id === 'uni-a-sample')).toHaveLength(1);
    expect(reducer(restored, { type: 'SAMPLE' })).toEqual(restored);
  });
  it('cannot earn verification retroactively by opening evidence after a decision', () => {
    let s = fixture('school-a');
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    s = inspect(s, 'market');
    expect(s.progress['school-a'].evidence).toEqual([]);
    expect(s.progress['school-a'].result?.verified).toBe(false);
  });
  it('rejects broken saves rather than silently replacing progress', () => {
    expect(decodeSave('{')).toBeNull();
    expect(decodeSave(JSON.stringify({ ...createGame(), cash: -1 }))).toBeNull();
    expect(decodeSave(JSON.stringify({ ...createGame(), stage: 99 }))).toBeNull();
    expect(decodeSave(JSON.stringify({ ...createGame(), stageTaps: -1 }))).toBeNull();
    expect(decodeSave(JSON.stringify({ ...createGame(), stageTaps: 5, lastResolutionTap: 6 }))).toBeNull();
    const s = start(); s.order[0] = ['school-a', 'school-a'];
    expect(decodeSave(JSON.stringify(s))).toBeNull();
  });
});
