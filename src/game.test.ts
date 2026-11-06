import { describe, expect, it } from 'vitest';
import { CASES, ENCOUNTERS, STAGES } from './content';
import { activeCase, canAdvance, createDemoGame, createGame, decodeSave, DEMO_SAVE_KEY, encounterChannel, EVENT_COOLDOWN_MS, rates, reducer, requiredEncounterCount, resolvedCount, safetyPractice, SAVE_KEY, stageResolved } from './game';
import type { GameState, EncounterResult } from './game';
import { DEFAULT_CHARACTER, normaliseCharacter, SKIN_TONES } from './profiles';

function ready() {
  return reducer(reducer(createGame(() => .99), { type: 'START', character: { name: '  Nur Aisha  ', gender: 'woman', skinTone: 5 } }), { type: 'BEGIN_STAGE' });
}
// Scheduling tests isolate tap and timer gates from encounter affordability.
function funded() { return { ...ready(), cash: 50000 }; }
function tap(s: GameState, count = 1): GameState {
  for (let i = 0; i < count; i++) s = reducer(s, { type: 'TAP', now: i });
  return s;
}
function tick(s: GameState, ms: number): GameState {
  for (let remaining = ms; remaining > 0; remaining -= 1000) s = reducer(s, { type: 'TICK', ms: Math.min(1000, remaining) });
  return s;
}
function selected(id: string): GameState {
  const s = ready(), e = CASES[id];
  s.stage = e.stage;
  s.cash = 50000000;
  s.gross = STAGES[Math.max(0, e.stage - 1)].gate * 100;
  for (const old of ENCOUNTERS.filter(c => c.stage < e.stage)) {
    s.progress[old.id] = { arrived: true, read: true, evidence: [], samplePaid: false, callStatus: old.channel === 'calls' ? 'answered' : null, result: { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: !old.scam && old.stage !== 3, inspectedEvidence: [] } };
  }
  s.progress[id] = { ...s.progress[id], arrived: true, read: true, callStatus: e.channel === 'calls' ? 'ringing' : null };
  s.phone = { open: true, app: e.channel, caseId: id, record: null };
  return s;
}
function inspect(s: GameState, evidenceId = 'independent') {
  const e = CASES[s.phone.caseId!].evidence.find(x => x.id === evidenceId)!;
  return reducer(reducer(s, { type: 'APP', app: e.app }), { type: 'INSPECT', id: e.id });
}
function answer(s: GameState) { return s.progress[s.phone.caseId!].callStatus === 'ringing' ? reducer(s, { type: 'CALL_ANSWER' }) : s; }
function prepareReport(s: GameState) {
  const id = s.phone.caseId!;
  if (CASES[id].channel === 'calls' && s.progress[id].callStatus !== 'declined') s = reducer(s, { type: 'CALL_DECLINE' });
  s = reducer(s, { type: 'APP', app: encounterChannel(s, id) });
  s = reducer(s, { type: 'PRACTISE_SAFETY', action: 'save-evidence' });
  return reducer(s, { type: 'PRACTISE_SAFETY', action: 'report', reason: 'scam' });
}
function roundTrip(s: GameState): GameState {
  const loaded = decodeSave(JSON.stringify(s));
  expect(loaded).not.toBeNull();
  return loaded!;
}
function run(strategy: 'cautious' | 'mistakes' | 'decline' | 'report', purchaseUpgrades = false): GameState {
  let s = ready();
  for (let i = 0; i < 20000 && !s.finished; i++) {
    if (s.briefing) s = reducer(s, { type: 'BEGIN_STAGE' });
    else if (s.phone.app === 'feedback') s = reducer(s, { type: 'ACK' });
    else if (activeCase(s)) {
      const id = activeCase(s)!, e = CASES[id];
      s = reducer(s, { type: 'CASE', id });
      s = answer(s);
      if (strategy === 'cautious') s = inspect(s);
      if (strategy === 'report') s = prepareReport(s);
      s = reducer(s, { type: 'RESOLVE', decision: strategy === 'report' ? 'report' : strategy === 'decline' || (strategy === 'cautious' && e.scam) ? 'decline' : 'proceed' });
      s = roundTrip(s);
    } else if (purchaseUpgrades && !s.upgrade && s.cash >= STAGES[s.stage].cost * 100) s = reducer(s, { type: 'UPGRADE' });
    else s = tap(tick(s, 1000));
  }
  return s;
}

describe('character and briefing lifecycle', () => {
  it('starts at character creation and pauses at each briefing', () => {
    const fresh = createGame();
    expect(fresh.started).toBe(false);
    expect(tap(fresh)).toEqual(fresh);
    const named = reducer(fresh, { type: 'START', character: { name: ' Mei ', gender: 'woman', skinTone: 4 } });
    expect(named.character).toEqual({ name: 'Mei', gender: 'woman', skinTone: 4 });
    expect(named.briefing).toBe(true);
    expect(tap(named)).toEqual(named);
    expect(reducer(named, { type: 'TICK', ms: 900 })).toEqual(named);
    const begun = reducer(named, { type: 'BEGIN_STAGE' });
    expect(tap(begun).cash).toBe(begun.cash + 200);
  });
  it('normalises names without requiring a real identity', () => {
    expect(normaliseCharacter({ name: '   ' }).name).toBe(DEFAULT_CHARACTER.name);
    expect(normaliseCharacter({ name: '  王  Mei   ' }).name).toBe('王 Mei');
    expect(Array.from(normaliseCharacter({ name: '🌻'.repeat(40) }).name)).toHaveLength(24);
    expect(normaliseCharacter({ skinTone: -1 }).skinTone).toBe(DEFAULT_CHARACTER.skinTone);
  });
  it('gender and skin tone cannot change earnings or encounter outcomes', () => {
    for (const skinTone of SKIN_TONES.keys()) {
      const s = ready();
      s.character = { name: 'Player', gender: 'non-binary', skinTone };
      expect(rates(s).tap).toBe(200);
      expect(tap(s).cash).toBe(5200);
    }
  });
  it('repeated START cannot reset character or briefings', () => {
    const s = ready();
    expect(reducer(s, { type: 'START', character: { name: 'Other' } })).toEqual(s);
  });
});

describe('tap-only economy and staged events', () => {
  it('earns one stage note per tap and preserves existing balances when saves reload', () => {
    for (const [stage, amount] of [2, 10, 50, 100].entries()) {
      const s = selected(ENCOUNTERS.find(e => e.stage === stage)!.id);
      s.phone.open = false;
      expect(rates(s).tap).toBe(amount * 100);
      expect(rates({ ...s, upgrade: true }).tap).toBe(amount * 200);
      expect(roundTrip(s).cash).toBe(s.cash);
    }
  });
  it('starts with a S$2 note and waits until the first request can be afforded', () => {
    let s = ready();
    expect(s.cash).toBe(5000);
    s = tap(s, 14);
    expect(s.cash).toBe(7800);
    expect(activeCase(s)).toBeUndefined();
    s = tap(s);
    expect(s.cash).toBe(8000);
    expect(activeCase(s)).toBe('school-a');
  });
  it('has sixteen encounters across the four stages and one genuine opportunity per stage', () => {
    expect(ENCOUNTERS).toHaveLength(16);
    for (let stage = 0; stage < 4; stage++) {
      expect(ENCOUNTERS.filter(e => e.stage === stage)).toHaveLength([5, 5, 3, 3][stage]);
      expect(ENCOUNTERS.filter(e => e.stage === stage && !e.scam)).toHaveLength(1);
    }
  });
  it('uses Fisher-Yates permutations, not just forward or reverse ordering', () => {
    const orders = new Set<string>();
    for (const first of [0, .34, .8]) for (const second of [0, .8]) {
      let i = 0; const values = [first, second];
      orders.add(createGame(() => values[(i++) % 2]).order[0].join(','));
    }
    expect(orders.size).toBe(6);
  });
  it('all rapid taps register and TICK never earns income', () => {
    let s = ready();
    const before = s.cash;
    s = reducer(s, { type: 'TAP', now: 1 });
    s = reducer(s, { type: 'TAP', now: 1 });
    s = reducer(s, { type: 'TAP', now: 1 });
    expect(s.cash - before).toBe(600);
    const ticked = reducer(s, { type: 'TICK', ms: 100000 });
    expect(ticked.cash).toBe(s.cash);
    expect(ticked.gross).toBe(s.gross);
    expect(ticked.activeMs).toBe(1000);
  });
  it('queues after five taps once affordable, then pauses earning and time until addressed', () => {
    const s = tap(funded(), 5);
    expect(activeCase(s)).toBe('school-a');
    expect(s.phone.open).toBe(true);
    expect(tap(s)).toEqual(s);
    expect(reducer(s, { type: 'TICK', ms: 500 })).toEqual(s);
    expect(reducer(s, { type: 'UPGRADE' })).toEqual(s);
    expect(reducer(s, { type: 'PHONE', open: false })).toEqual(s);
  });
  it('waits for sufficient funds before a mandatory encounter appears', () => {
    let s = ready();
    s.stage = 1; s.cash = 0; s.order[1] = ['uni-a', 'uni-b', 'uni-c'];
    s = tap(s, 179);
    expect(activeCase(s)).toBeUndefined();
    s = tap(s);
    expect(activeCase(s)).toBe('uni-a');
    expect(s.cash).toBe(180000);
  });
  it('five more taps are needed after a resolution', () => {
    let s = tap(funded(), 5);
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    s = reducer(s, { type: 'ACK' });
    s = tick(s, EVENT_COOLDOWN_MS);
    s = tap(s, 4);
    expect(activeCase(s)).toBeUndefined();
    s = tap(s);
    expect(activeCase(s)).toBe('school-b');
  });
  it('rapid taps cannot skip the cooldown, and the event queues at exactly ten active seconds', () => {
    expect(EVENT_COOLDOWN_MS).toBe(10000);
    let s = reducer(tap(funded(), 5), { type: 'RESOLVE', decision: 'decline' });
    s = reducer(s, { type: 'ACK' });
    s = tap(s, 100);
    expect(activeCase(s)).toBeUndefined();
    s = tick(s, EVENT_COOLDOWN_MS - 1);
    expect(activeCase(s)).toBeUndefined();
    s = reducer(s, { type: 'TICK', ms: 1 });
    expect(activeCase(s)).toBe('school-b');
    expect(s.phone.open).toBe(true);
  });
  it('time during an outcome, hidden tab or briefing never consumes the cooldown', () => {
    let s = reducer(tap(funded(), 5), { type: 'RESOLVE', decision: 'decline' });
    s = tick(s, EVENT_COOLDOWN_MS);
    expect(s.activeMs).toBe(0);
    s = reducer(s, { type: 'ACK' });
    s = tap(s, 5);
    s = reducer(s, { type: 'HIDDEN', hidden: true });
    s = tick(s, EVENT_COOLDOWN_MS);
    expect(s.activeMs).toBe(0);
    s = reducer(s, { type: 'HIDDEN', hidden: false });
    s = { ...s, briefing: true };
    s = tick(s, EVENT_COOLDOWN_MS);
    expect(s.activeMs).toBe(0);
    expect(activeCase(s)).toBeUndefined();
  });
  it('reload preserves the remaining cooldown without granting offline time', () => {
    let s = reducer(tap(funded(), 5), { type: 'RESOLVE', decision: 'decline' });
    s = reducer(s, { type: 'ACK' });
    s = tap(s, 5);
    s = roundTrip(tick(s, 4000));
    expect(activeCase(s)).toBeUndefined();
    s = tick(s, 5999);
    expect(activeCase(s)).toBeUndefined();
    expect(activeCase(reducer(s, { type: 'TICK', ms: 1 }))).toBe('school-b');
  });
  it('upgrades can be purchased once and apply only to current stage', () => {
    let s = ready(); s.cash = 30000;
    s = reducer(s, { type: 'UPGRADE' });
    expect(s.cash).toBe(10000);
    expect(rates(s).tap).toBe(400);
    expect(reducer(s, { type: 'UPGRADE' })).toEqual(s);
  });
  it('hidden tabs block income and active time', () => {
    const s = reducer(ready(), { type: 'HIDDEN', hidden: true });
    expect(tap(s)).toEqual(s);
    expect(reducer(s, { type: 'TICK', ms: 100 })).toEqual(s);
  });
  it('idle phone navigation does not pause tapping', () => {
    const s = reducer(ready(), { type: 'APP', app: 'profile' });
    expect(s.phone.open).toBe(false);
    expect(tap(s).cash).toBe(s.cash + 200);
  });
  it('leaving a resolved debrief through Phone home resumes play and its cooldown', () => {
    let s = reducer(tap(funded(), 5), { type: 'RESOLVE', decision: 'decline' });
    expect(s.phone.open).toBe(true);
    s = reducer(s, { type: 'BACK' });
    expect(s.phone.open).toBe(false);
    s = tap(s, 5);
    expect(activeCase(s)).toBeUndefined();
    s = tick(s, EVENT_COOLDOWN_MS - 1);
    expect(activeCase(s)).toBeUndefined();
    expect(activeCase(reducer(s, { type: 'TICK', ms: 1 }))).toBe('school-b');
  });
});

describe('all scenario paths and independent evidence', () => {
  it.each(ENCOUNTERS)('$id contains independently navigable evidence', e => {
    const decisive = e.evidence.find(x => x.id === e.decisive);
    expect(decisive?.app).toBe('contacts');
    expect(decisive?.contactId).toBeTruthy();
    expect(decisive?.body.length).toBeGreaterThan(0);
    expect(e.sources.length).toBeGreaterThan(0);
  });
  it.each(ENCOUNTERS)('$id verification is earned before an appropriate decision', e => {
    let s = answer(selected(e.id));
    s = inspect(s);
    s = reducer(s, { type: 'RESOLVE', decision: e.scam ? 'decline' : 'proceed' });
    const result = s.progress[e.id].result!;
    expect(result.verified).toBe(true);
    expect(result.unsafe).toBe(false);
    expect(result.inspectedEvidence).toContain(e.decisive);
    expect(s.cash).toBeGreaterThanOrEqual(0);
  });
  it.each(ENCOUNTERS)('$id supports an unverified commitment without duplicate consequences', e => {
    let s = answer(selected(e.id));
    const cash = s.cash;
    s = reducer(s, { type: 'RESOLVE', decision: 'proceed' });
    expect(s.progress[e.id].result?.unsafe).toBe(e.scam);
    expect(s.progress[e.id].result?.verified).toBe(false);
    expect(s.cash).toBe(cash + ((e.reward ?? 0) - e.cost) * 100);
    s = roundTrip(s);
    expect(reducer(s, { type: 'RESOLVE', decision: 'proceed' })).toEqual(s);
  });
  it.each(ENCOUNTERS)('$id can be declined or reported without a payment', e => {
    for (const decision of ['decline', 'report'] as const) {
      const s = decision === 'report' ? prepareReport(answer(selected(e.id))) : answer(selected(e.id));
      const out = reducer(s, { type: 'RESOLVE', decision });
      expect(out.cash).toBe(s.cash);
      expect(out.progress[e.id].result?.verified).toBe(false);
      expect(out.progress[e.id].result?.unsafe).toBe(false);
    }
  });
  it('sender reassurance is not independent verification', () => {
    let s = inspect(selected('office-a'), 'reply');
    s = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(s.progress['office-a'].result?.verified).toBe(false);
  });
  it('cannot inspect Contacts evidence from the suspicious conversation', () => {
    const s = selected('office-a');
    expect(reducer(s, { type: 'INSPECT', id: 'independent' })).toEqual(s);
  });
  it('post-outcome inspection cannot retroactively earn verification', () => {
    let s = reducer(selected('office-a'), { type: 'RESOLVE', decision: 'decline' });
    s = inspect(s);
    expect(s.progress['office-a'].evidence).toEqual([]);
    expect(s.progress['office-a'].result?.inspectedEvidence).toEqual([]);
    expect(s.progress['office-a'].result?.verified).toBe(false);
  });
  it('insufficient funds block payment, never safe decline', () => {
    const s = selected('uni-a'); s.cash = 0;
    expect(reducer(s, { type: 'RESOLVE', decision: 'proceed' })).toEqual(s);
    expect(reducer(s, { type: 'RESOLVE', decision: 'decline' }).progress['uni-a'].result).not.toBeNull();
  });
  it('rewards are posted once and excluded from stage-gate lifetime taps', () => {
    const s = selected('uni-c'), out = reducer(s, { type: 'RESOLVE', decision: 'proceed' });
    expect(out.cash - s.cash).toBe(100000);
    expect(out.gross).toBe(s.gross);
    expect(out.ledger.filter(l => l.id === 'uni-c-result')).toHaveLength(1);
  });
  it('verified genuine friend requests can be politely declined', () => {
    const s = reducer(inspect(answer(selected('home-c'))), { type: 'RESOLVE', decision: 'decline' });
    expect(s.progress['home-c'].result).toMatchObject({ verified: true, unsafe: false, missed: false, personalDelta: 0 });
  });
});

describe('persistent safety practice', () => {
  it('defaults older progress to no practice without mutating it', () => {
    const p = selected('school-a').progress['school-a'];
    expect(p.safety).toBeUndefined();
    expect(safetyPractice(p)).toEqual({ evidenceSaved: false, blocked: false, reported: false, reason: null });
    expect(p.safety).toBeUndefined();
  });
  it('requires an arrived unresolved request in its original message or mail app', () => {
    const s = selected('school-a');
    for (const app of ['home', 'contacts', 'bank', 'profile', 'mail'] as const) {
      const elsewhere = reducer(s, { type: 'APP', app });
      expect(reducer(elsewhere, { type: 'PRACTISE_SAFETY', action: 'save-evidence' })).toBe(elsewhere);
    }
    const fresh = ready();
    expect(reducer(fresh, { type: 'PRACTISE_SAFETY', action: 'block' })).toBe(fresh);
    const resolved = reducer(s, { type: 'RESOLVE', decision: 'decline' });
    expect(reducer(resolved, { type: 'PRACTISE_SAFETY', action: 'save-evidence' })).toBe(resolved);
    expect(safetyPractice(reducer(selected('office-a'), { type: 'PRACTISE_SAFETY', action: 'save-evidence' }).progress['office-a']).evidenceSaved).toBe(true);
  });
  it('moves incoming calls to their follow-up message before safety practice', () => {
    const ringing = selected('home-a'), answered = answer(ringing);
    for (const s of [ringing, answered]) expect(reducer(s, { type: 'PRACTISE_SAFETY', action: 'save-evidence' })).toBe(s);
    const declined = reducer(answered, { type: 'CALL_DECLINE' });
    expect(safetyPractice(reducer(declined, { type: 'PRACTISE_SAFETY', action: 'save-evidence' }).progress['home-a']).evidenceSaved).toBe(true);
  });
  it('requires saved evidence and a valid reason before a report receipt', () => {
    let s = selected('school-a');
    expect(reducer(s, { type: 'PRACTISE_SAFETY', action: 'report', reason: 'scam' })).toBe(s);
    expect(reducer(s, { type: 'RESOLVE', decision: 'report' })).toBe(s);
    s = reducer(s, { type: 'PRACTISE_SAFETY', action: 'save-evidence' });
    for (const reason of [undefined, null, 'invented']) {
      expect(reducer(s, { type: 'PRACTISE_SAFETY', action: 'report', reason: reason as 'scam' })).toBe(s);
    }
    for (const reason of ['scam', 'grooming', 'cyberbullying', 'other'] as const) {
      const reported = reducer(s, { type: 'PRACTISE_SAFETY', action: 'report', reason });
      expect(safetyPractice(reported.progress['school-a'])).toMatchObject({ reported: true, reason });
    }
  });
  it('keeps evidence saving, blocking and reporting separate from money and verification', () => {
    const initial = selected('school-a');
    let s = reducer(initial, { type: 'PRACTISE_SAFETY', action: 'block' });
    s = prepareReport(s);
    expect(s.cash).toBe(initial.cash);
    expect(s.gross).toBe(initial.gross);
    expect(s.ledger).toEqual(initial.ledger);
    expect(s.progress['school-a'].evidence).toEqual([]);
    expect(s.progress['school-a'].result).toBeNull();
    expect(reducer(s, { type: 'PRACTISE_SAFETY', action: 'block' })).toBe(s);
    expect(reducer(s, { type: 'PRACTISE_SAFETY', action: 'save-evidence' })).toBe(s);
    expect(reducer(s, { type: 'PRACTISE_SAFETY', action: 'report', reason: 'other' })).toBe(s);
    s = roundTrip(s);
    expect(safetyPractice(s.progress['school-a'])).toEqual({ evidenceSaved: true, blocked: true, reported: true, reason: 'scam' });
    s = reducer(s, { type: 'RESOLVE', decision: 'report' });
    expect(s.progress['school-a'].result).toMatchObject({ decision: 'report', verified: false, unsafe: false, personalDelta: 0 });
    expect(s.cash).toBe(initial.cash);
    expect(reducer(s, { type: 'RESOLVE', decision: 'report' })).toBe(s);
    expect(roundTrip(s).progress['school-a'].safety).toEqual(s.progress['school-a'].safety);
  });
  it('does not carry a report receipt to another request', () => {
    let s = prepareReport(selected('school-a'));
    s = reducer(s, { type: 'RESOLVE', decision: 'report' });
    s = reducer(s, { type: 'ACK' });
    s = tap(tick(s, EVENT_COOLDOWN_MS), 5);
    expect(activeCase(s)).toBe('school-b');
    expect(safetyPractice(s.progress['school-b']).reported).toBe(false);
    expect(reducer(s, { type: 'RESOLVE', decision: 'report' })).toBe(s);
    expect(reducer(s, { type: 'RESOLVE', decision: 'decline' }).progress['school-b'].result?.decision).toBe('decline');
    expect(safetyPractice(s.progress['school-a']).reported).toBe(true);
  });
  it('still awards independent verification only after opening the independent source', () => {
    const s = prepareReport(inspect(selected('school-a')));
    expect(reducer(s, { type: 'RESOLVE', decision: 'report' }).progress['school-a'].result?.verified).toBe(true);
  });
  it('rejects malformed or fabricated practice in saved progress', () => {
    for (const safety of [null, { evidenceSaved: false, blocked: false, reported: true, reason: 'scam' },
      { evidenceSaved: true, blocked: false, reported: true, reason: 'invented' },
      { evidenceSaved: true, blocked: false, reported: false, reason: 'scam' }]) {
      const s = selected('school-a');
      (s.progress['school-a'] as unknown as { safety: unknown }).safety = safety;
      expect(decodeSave(JSON.stringify(s))).toBeNull();
    }
    const unarrived = ready();
    unarrived.progress['school-a'].safety = { evidenceSaved: true, blocked: false, reported: false, reason: null };
    expect(decodeSave(JSON.stringify(unarrived))).toBeNull();
  });
  it.each(['school-grooming', 'school-bullying', 'uni-grooming', 'uni-bullying'])('%s records harmful actions without inventing a financial loss', id => {
    const s = selected(id), out = reducer(s, { type: 'RESOLVE', decision: 'proceed' });
    expect(CASES[id].cost).toBe(0);
    expect(out.progress[id].result).toMatchObject({ unsafe: true, personalDelta: 0, employerLoss: 0 });
    expect(out.cash).toBe(s.cash);
    expect(out.ledger).toEqual(s.ledger);
  });
});

describe('calls and persisted investigation', () => {
  it.each(['home-a', 'home-b', 'home-c'])('%s rings until explicitly answered or declined', id => {
    const s = selected(id);
    expect(s.progress[id].callStatus).toBe('ringing');
    expect(reducer(s, { type: 'RESOLVE', decision: 'proceed' })).toEqual(s);
    const answered = reducer(s, { type: 'CALL_ANSWER' });
    expect(answered.progress[id].callStatus).toBe('answered');
    expect(answered.phone.app).toBe('calls');
    expect(answered.progress[id].evidence).toEqual([]);
    const declined = reducer(s, { type: 'CALL_DECLINE' });
    expect(declined.progress[id].result).toBeNull();
    expect(declined.phone.app).toBe('messages');
    expect(encounterChannel(roundTrip(declined), id)).toBe('messages');
  });
  it('saved-contact calls are recorded and cannot substitute incoming reassurance', () => {
    let s = answer(selected('home-b'));
    s = inspect(s, 'caller');
    expect(s.progress['home-b'].evidence).not.toContain('independent');
    s = inspect(s);
    s = inspect(s);
    expect(s.calls).toHaveLength(1);
    expect(roundTrip(s).calls).toEqual(s.calls);
  });
  it('ending an answered call opens its follow-up without resolving the request', () => {
    const s = reducer(answer(selected('home-a')), { type: 'CALL_DECLINE' });
    expect(s.phone.app).toBe('messages');
    expect(s.progress['home-a'].callStatus).toBe('declined');
    expect(s.progress['home-a'].result).toBeNull();
  });
  it('My Card remains accessible during a mandatory event without clearing it', () => {
    const s = reducer(selected('office-a'), { type: 'APP', app: 'profile' });
    expect(s.phone.open).toBe(true);
    expect(activeCase(s)).toBe('office-a');
    expect(s.character.name).toBe('Nur Aisha');
  });
  it('reload preserves randomized order, receipts and profile', () => {
    const s = inspect(answer(selected('home-c')));
    const out = roundTrip(s);
    expect(out.order).toEqual(s.order);
    expect(out.character).toEqual(s.character);
    expect(out.ledger).toEqual(s.ledger);
    expect(out.progress).toEqual(s.progress);
  });
  it('reload restores mandatory pause after development exit', () => {
    const s = selected('office-a'); s.phone.open = false;
    expect(roundTrip(s).phone.open).toBe(true);
  });
  it('recovers an old stuck phone pause without losing resolved encounters or savings', () => {
    const s = reducer(selected('school-a'), { type: 'RESOLVE', decision: 'decline' });
    s.phone.app = 'home';
    const restored = roundTrip(s);
    expect(restored.phone.open).toBe(false);
    expect(restored.cash).toBe(s.cash);
    expect(restored.progress).toEqual(s.progress);
    expect(tap(restored).cash).toBe(restored.cash + rates(restored).tap);
  });
  it('keeps an unfinished debrief paused on reload', () => {
    const s = reducer(selected('school-a'), { type: 'RESOLVE', decision: 'decline' });
    const restored = roundTrip(s);
    expect(restored.phone).toEqual(s.phone);
    expect(tap(restored)).toEqual(restored);
  });
  it('rejects incompatible legacy saves without overwriting their storage key', () => {
    expect(SAVE_KEY).not.toBe('scamagotchi.life.v1');
    expect(decodeSave(JSON.stringify({ ...ready(), version: 1 }))).toBeNull();
  });
  it('rejects malformed money, order, record and character data', () => {
    for (const mutate of [
      (s: GameState) => { s.cash = -1; },
      (s: GameState) => { s.order[0][1] = s.order[0][0]; },
      (s: GameState) => { s.character.skinTone = 22; },
      (s: GameState) => { s.phone.record = 'invented'; },
      (s: GameState) => { s.ledger.push(s.ledger[0]); },
    ]) {
      const s = ready(); mutate(s); expect(decodeSave(JSON.stringify(s))).toBeNull();
    }
  });
});

describe('isolated two-request demo', () => {
  function beginDemo() {
    return reducer(reducer(createDemoGame(), { type: 'START', character: { name: 'Demo Mei', gender: 'woman', skinTone: 2 } }), { type: 'BEGIN_STAGE' });
  }
  function completeDemo(decision: 'proceed' | 'decline' | 'report', callDecision = decision) {
    let s = beginDemo();
    s = roundTrip(tap(s, 5));
    expect(activeCase(s)).toBe('office-a');
    if (decision === 'report') s = prepareReport(s);
    s = reducer(s, { type: 'RESOLVE', decision });
    s = roundTrip(s);
    s = reducer(s, { type: 'ACK' });
    expect(s.stage).toBe(3);
    expect(s.briefing).toBe(true);
    s = roundTrip(s);
    s = reducer(s, { type: 'BEGIN_STAGE' });
    s = tap(s, 5);
    expect(activeCase(s)).toBeUndefined();
    s = tick(s, EVENT_COOLDOWN_MS);
    expect(activeCase(s)).toBe('home-b');
    s = roundTrip(answer(s));
    if (callDecision === 'report') s = prepareReport(s);
    s = reducer(s, { type: 'RESOLVE', decision: callDecision });
    return roundTrip(reducer(s, { type: 'ACK' }));
  }
  it('starts at Adult character creation with an honest S$20k ledger and no invented earlier results', () => {
    const s = roundTrip(createDemoGame());
    expect(DEMO_SAVE_KEY).not.toBe(SAVE_KEY);
    expect(s.mode).toBe('demo');
    expect(s.started).toBe(false);
    expect(s.stage).toBe(2);
    expect(s.cash).toBe(2000000);
    expect(s.gross).toBe(0);
    expect(s.cash).toBe(s.ledger.reduce((sum, entry) => sum + entry.cents, 0));
    expect(s.order).toEqual([[], [], ['office-a'], ['home-b']]);
    expect(requiredEncounterCount(s)).toBe(2);
    expect(Object.values(s.progress).every(progress => !progress.arrived && progress.result === null)).toBe(true);
    expect(tap(s)).toEqual(s);
    const started = reducer(s, { type: 'START', character: { name: 'Demo Mei' } });
    expect(started.briefing).toBe(true);
    expect(started.character.name).toBe('Demo Mei');
    expect(tap(started)).toEqual(started);
  });
  it('preserves the budget and pauses the between-request countdown during the Senior briefing', () => {
    let s = beginDemo();
    expect(reducer(s, { type: 'UPGRADE' })).toBe(s);
    s = reducer(tap(s, 5), { type: 'RESOLVE', decision: 'proceed' });
    s = reducer(s, { type: 'ACK' });
    expect(s.stage).toBe(3);
    expect(s.gross).toBe(25000);
    const cash = s.cash, activeMs = s.activeMs;
    s = tick(s, EVENT_COOLDOWN_MS * 3);
    expect(s.cash).toBe(cash);
    expect(s.activeMs).toBe(activeMs);
    s = reducer(roundTrip(s), { type: 'BEGIN_STAGE' });
    expect(reducer(s, { type: 'UPGRADE' })).toBe(s);
    s = tap(s, 5);
    s = tick(s, EVENT_COOLDOWN_MS - 1);
    expect(activeCase(s)).toBeUndefined();
    s = reducer(s, { type: 'TICK', ms: 1 });
    expect(activeCase(s)).toBe('home-b');
    expect(s.cash).toBeGreaterThanOrEqual(CASES['home-b'].cost * 100);
  });
  const decisions = ['proceed', 'decline', 'report'] as const;
  it.each(decisions.flatMap(email => decisions.map(call => ({ email, call }))))('$email email / $call call can finish, reload and earn indefinitely without extra cases or a results modal', ({ email, call }) => {
    let s = completeDemo(email, call);
    expect(s.cash).toBeGreaterThanOrEqual(0);
    expect(s.stage).toBe(3);
    expect(resolvedCount(s)).toBe(2);
    expect(s.finished).toBe(false);
    expect(s.milestoneSeen).toBe(false);
    expect(s.character.name).toBe('Demo Mei');
    s = tap(s, 10000);
    s = roundTrip(tick(s, EVENT_COOLDOWN_MS * 3));
    expect(s.cash).toBeGreaterThan(100000000);
    expect(s.finished).toBe(false);
    expect(canAdvance(s)).toBe(false);
    expect(activeCase(s)).toBeUndefined();
    expect(Object.entries(s.progress).filter(([, progress]) => progress.arrived).map(([id]) => id)).toEqual(['office-a', 'home-b']);
    expect(s.cash).toBe(s.gross + s.ledger.reduce((sum, entry) => sum + entry.cents, 0));
    const upgraded = reducer(s, { type: 'UPGRADE' });
    expect(upgraded.upgrade).toBe(true);
    expect(tap(upgraded).cash - upgraded.cash).toBe(20000);
  });
  it('rejects full/demo mode confusion, altered demo orders, fabricated earlier progress and partial demo saves', () => {
    const full = createGame(); full.mode = 'demo';
    expect(decodeSave(JSON.stringify(full))).toBeNull();
    const wrongMode = createDemoGame(); delete wrongMode.mode;
    expect(decodeSave(JSON.stringify(wrongMode))).toBeNull();
    for (const change of [
      (s: GameState) => { s.order[2].push('office-b'); },
      (s: GameState) => { s.order[3] = ['home-a']; },
      (s: GameState) => { s.stage = 1; },
      (s: GameState) => { s.progress['school-a'].arrived = true; },
      (s: GameState) => { delete s.progress['school-grooming']; },
      (s: GameState) => { s.upgrade = true; },
      (s: GameState) => { s.finished = true; },
      (s: GameState) => { s.milestoneSeen = true; },
    ]) {
      const s = createDemoGame(); change(s);
      expect(decodeSave(JSON.stringify(s))).toBeNull();
    }
    expect(roundTrip(createGame()).mode).toBeUndefined();
  });
});

describe('legacy twelve-case save migration', () => {
  const added = ['school-grooming', 'school-bullying', 'uni-grooming', 'uni-bullying'];
  function legacy(source: GameState) {
    const s = structuredClone(source);
    s.order = s.order.map(ids => ids.filter(id => !added.includes(id)));
    for (const id of added) delete s.progress[id];
    return s;
  }
  it('appends new cases to current and future stages without disturbing the active request', () => {
    const old = legacy(selected('uni-a'));
    const restored = roundTrip(old);
    expect(restored.stage).toBe(1);
    expect(restored.cash).toBe(old.cash);
    expect(restored.gross).toBe(old.gross);
    expect(restored.phone).toEqual(old.phone);
    expect(restored.ledger).toEqual(old.ledger);
    expect(restored.order[0]).toEqual(old.order[0]);
    expect(restored.order[1]).toEqual([...old.order[1], 'uni-grooming', 'uni-bullying']);
    expect(requiredEncounterCount(restored)).toBe(14);
    for (const [id, progress] of Object.entries(old.progress)) expect(restored.progress[id]).toEqual(progress);
    for (const id of added) expect(restored.progress[id]).toMatchObject({ arrived: false, read: false, evidence: [], result: null });
    expect(roundTrip(restored).order).toEqual(restored.order);
  });
  it('adds all four youth cases when the legacy run has not passed school', () => {
    const restored = roundTrip(legacy(ready()));
    expect(requiredEncounterCount(restored)).toBe(16);
    expect(restored.order.map(ids => ids.length)).toEqual([5, 5, 3, 3]);
    expect(restored.cash).toBe(5000);
    expect(resolvedCount(restored)).toBe(0);
  });
  it('preserves an advanced run and does not fabricate completed or verified youth cases', () => {
    const old = legacy(selected('office-a')), restored = roundTrip(old);
    expect(restored.stage).toBe(2);
    expect(restored.order).toEqual(old.order);
    expect(requiredEncounterCount(restored)).toBe(12);
    expect(resolvedCount(restored)).toBe(6);
    for (const id of added) {
      expect(restored.progress[id].result).toBeNull();
      expect(restored.progress[id].arrived).toBe(false);
      expect(safetyPractice(restored.progress[id]).reported).toBe(false);
    }
  });
  it.each([false, true])('preserves a completed legacy run with milestoneSeen=%s', continued => {
    let old = legacy(run('decline'));
    if (continued) old = reducer(old, { type: 'CONTINUE_PLAY' });
    let restored = roundTrip(old);
    expect(restored.finished).toBe(old.finished);
    expect(restored.milestoneSeen).toBe(continued);
    expect(restored.order).toEqual(old.order);
    expect(requiredEncounterCount(restored)).toBe(12);
    expect(resolvedCount(restored)).toBe(12);
    expect(restored.cash).toBe(old.cash);
    for (const id of added) expect(restored.progress[id].result).toBeNull();
    restored = reducer(restored, { type: 'CONTINUE_PLAY' });
    expect(tap(restored).cash).toBe(old.cash + 10000);
    expect(tap(restored).finished).toBe(false);
  });
  it('retains old report outcomes without inventing safety-practice receipts', () => {
    const old = legacy(reducer(selected('school-a'), { type: 'RESOLVE', decision: 'decline' }));
    old.progress['school-a'].result!.decision = 'report';
    const restored = roundTrip(old);
    expect(restored.progress['school-a'].result).toEqual(old.progress['school-a'].result);
    expect(restored.progress['school-a'].safety).toBeUndefined();
    expect(safetyPractice(restored.progress['school-a']).reported).toBe(false);
  });
  it('rejects missing old cases, unknown progress and malformed new progress rather than treating them as migration', () => {
    const missingOrder = legacy(selected('office-a'));
    missingOrder.order[0] = missingOrder.order[0].filter(id => id !== 'school-a');
    expect(decodeSave(JSON.stringify(missingOrder))).toBeNull();
    const missingProgress = legacy(ready()); delete missingProgress.progress['school-a'];
    expect(decodeSave(JSON.stringify(missingProgress))).toBeNull();
    const unknown = ready(); unknown.progress['invented'] = { ...unknown.progress['school-a'] };
    expect(decodeSave(JSON.stringify(unknown))).toBeNull();
    const malformed = ready(); (malformed.progress as Record<string, unknown>)['school-grooming'] = null;
    expect(decodeSave(JSON.stringify(malformed))).toBeNull();
    const partialNew = ready();
    delete partialNew.progress['school-grooming'];
    partialNew.order[0] = partialNew.order[0].filter(id => id !== 'school-grooming');
    expect(decodeSave(JSON.stringify(partialNew))).toBeNull();
    const missingNewProgress = ready();
    for (const id of added) delete missingNewProgress.progress[id];
    expect(decodeSave(JSON.stringify(missingNewProgress))).toBeNull();
    const missingFutureOrder = ready();
    missingFutureOrder.order[1] = missingFutureOrder.order[1].filter(id => id !== 'uni-grooming');
    expect(decodeSave(JSON.stringify(missingFutureOrder))).toBeNull();
  });
});

describe('complete journey and endless play', () => {
  it.each(['cautious', 'mistakes', 'decline'] as const)('%s run can buy every stage upgrade without a money or progression trap', strategy => {
    const s = roundTrip(run(strategy, true));
    expect(s.finished).toBe(true);
    expect(resolvedCount(s)).toBe(ENCOUNTERS.length);
    expect(s.ledger.filter(entry => entry.id.startsWith('upgrade-')).map(entry => entry.stage)).toEqual([0, 1, 2, 3]);
    expect(s.cash).toBe(s.gross + s.ledger.reduce((sum, entry) => sum + entry.cents, 0));
    const continued = tap(reducer(s, { type: 'CONTINUE_PLAY' }));
    expect(continued.cash - s.cash).toBe(20000);
    expect(continued.finished).toBe(false);
  });
  it.each(['cautious', 'mistakes', 'decline', 'report'] as const)('%s run can finish all stages and continue past a million', strategy => {
    let s = run(strategy);
    expect(s.finished).toBe(true);
    expect(s.cash).toBeGreaterThanOrEqual(100000000);
    expect(resolvedCount(s)).toBe(16);
    expect(stageResolved(s)).toBe(3);
    expect(s.character.name).toBe('Nur Aisha');
    expect(s.cash).toBe(s.gross + s.ledger.reduce((sum, l) => sum + l.cents, 0));
    s = reducer(s, { type: 'CONTINUE_PLAY' });
    const cash = s.cash;
    s = tap(s, 5);
    expect(s.cash).toBe(cash + 50000);
    expect(s.finished).toBe(false);
    expect(s.milestoneSeen).toBe(true);
    expect(canAdvance(s)).toBe(false);
    expect(roundTrip(s).milestoneSeen).toBe(true);
  });
  it('stage advances only after all decisions and debrief, then waits at profile', () => {
    let s = ready();
    s.gross = 100000;
    for (const id of s.order[0]) {
      s.progress[id].arrived = true;
      s.progress[id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: false, inspectedEvidence: [] } satisfies EncounterResult;
    }
    s.phone = { open: true, app: 'feedback', caseId: 'school-c', record: null };
    expect(reducer(s, { type: 'ADVANCE' }).stage).toBe(0);
    s = reducer(s, { type: 'ACK' });
    expect(s.stage).toBe(1);
    expect(s.briefing).toBe(true);
    expect(s.upgrade).toBe(false);
    expect(s.ledger).toHaveLength(1);
    expect(tap(s).cash).toBe(s.cash);
  });
  it('carries the cooldown across stage advancement and pauses it on the next profile', () => {
    let s = ready();
    s.gross = 100000; s.cash = 300000; s.activeMs = 90000; s.stageMs = 90000;
    for (const id of s.order[0]) {
      s.progress[id].arrived = true;
      s.progress[id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: false, inspectedEvidence: [] };
    }
    s.phone = { open: true, app: 'feedback', caseId: 'school-c', record: null };
    s = reducer(s, { type: 'ACK' });
    expect(s.stage).toBe(1);
    expect(s.lastResolutionMs).toBe(90000);
    expect(s.stageMs).toBe(0);
    s = tick(s, EVENT_COOLDOWN_MS);
    expect(s.activeMs).toBe(90000);
    s = reducer(s, { type: 'BEGIN_STAGE' });
    s = tap(s, 5);
    expect(activeCase(s)).toBeUndefined();
    s = roundTrip(tick(s, EVENT_COOLDOWN_MS - 1));
    expect(activeCase(s)).toBeUndefined();
    s = reducer(s, { type: 'TICK', ms: 1 });
    expect(activeCase(s)).toBe('uni-a');
  });
});
