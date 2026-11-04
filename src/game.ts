import { CASES, ENCOUNTERS, STAGES } from './content';
import type { Decision, PhoneApp } from './content';

export const SAVE_KEY = 'scamagotchi.life.v1';
export interface EncounterResult { decision: Decision; verified: boolean; unsafe: boolean; personalDelta: number; employerLoss: number; missed: boolean }
export interface Progress { arrived: boolean; read: boolean; evidence: string[]; samplePaid: boolean; result: EncounterResult | null }
export interface LedgerEntry { id: string; title: string; cents: number; stage: number; caseId?: string }
export interface CallRecord { caseId: string; evidenceId: string }
export interface GameState {
  version: 1; started: boolean; stage: number; cash: number; gross: number; upgrade: boolean;
  stageMs: number; activeMs: number; lastResolutionMs: number | null; remainder: number;
  stageTaps: number; lastResolutionTap: number | null;
  lastTap: number; hidden: boolean; finished: boolean; reducedMotion: boolean;
  order: string[][]; progress: Record<string, Progress>; ledger: LedgerEntry[]; calls: CallRecord[];
  phone: { open: boolean; app: PhoneApp; caseId: string | null; record: string | null };
}
export type Action =
  | { type: 'RESET'; state: GameState }
  | { type: 'START' } | { type: 'TICK'; ms: number } | { type: 'TAP'; now: number }
  | { type: 'UPGRADE' } | { type: 'ADVANCE' } | { type: 'HIDDEN'; hidden: boolean }
  | { type: 'PHONE'; open: boolean } | { type: 'APP'; app: PhoneApp; list?: boolean }
  | { type: 'CASE'; id: string } | { type: 'INSPECT'; id: string } | { type: 'BACK' }
  | { type: 'SAMPLE' } | { type: 'RESOLVE'; decision: Decision } | { type: 'ACK' }
  | { type: 'MOTION'; reduced: boolean } | { type: 'DEV_EXIT' };

export function createGame(random: () => number = Math.random): GameState {
  return {
    version: 1, started: false, stage: 0, cash: 5000, gross: 0, upgrade: false,
    stageMs: 0, activeMs: 0, lastResolutionMs: null, remainder: 0, lastTap: -1000,
    stageTaps: 0, lastResolutionTap: null,
    hidden: false, finished: false, reducedMotion: false,
    order: STAGES.map((_, stage) => {
      const ids = ENCOUNTERS.filter(e => e.stage === stage).map(e => e.id);
      return random() < .5 ? ids : ids.reverse();
    }),
    progress: Object.fromEntries(ENCOUNTERS.map(e => [e.id, { arrived: false, read: false, evidence: [], samplePaid: false, result: null }])),
    ledger: [{ id: 'start', title: 'Starting pocket money', cents: 5000, stage: 0 }], calls: [],
    phone: { open: false, app: 'home', caseId: null, record: null },
  };
}
export function rates(s: GameState) {
  const bonus = s.stage === 0 && s.progress['school-b'].result?.decision === 'proceed' ? 1.2 : 1;
  const multiplier = (s.upgrade ? 2 : 1) * bonus;
  return { tap: Math.round(STAGES[s.stage].tap * 100 * multiplier) };
}
export const resolvedCount = (s: GameState) => Object.values(s.progress).filter(p => p.result).length;
export const stageResolved = (s: GameState) => s.order[s.stage].filter(id => s.progress[id].result).length;
export const canAdvance = (s: GameState) => stageResolved(s) === 2 && (s.stage === 3 ? s.cash >= 100000000 && resolvedCount(s) === 8 : s.gross >= STAGES[s.stage].gate * 100);
export const unreadCount = (s: GameState) => Object.values(s.progress).filter(p => p.arrived && !p.read).length;
export const activeCase = (s: GameState) => s.order[s.stage].find(id => s.progress[id].arrived && !s.progress[id].result);
const canEarn = (s: GameState) => s.started && !s.phone.open && !s.hidden && !s.finished;

function advanceIfReady(s: GameState): GameState {
  if (!canEarn(s) || !canAdvance(s)) return s;
  if (s.stage === 3) return { ...s, finished: true };
  return { ...s, stage: s.stage + 1, upgrade: false, stageMs: 0, lastResolutionMs: null, stageTaps: 0, lastResolutionTap: null, remainder: 0, phone: { open: false, app: 'home', caseId: null, record: null } };
}

function queue(s: GameState): GameState {
  if (activeCase(s)) return s;
  const ids = s.order[s.stage];
  const next = ids.find(id => !s.progress[id].arrived);
  if (!next) return s;
  const due = s.lastResolutionTap === null ? 5 : s.lastResolutionTap + 5;
  if (s.stageTaps < due) return s;
  return { ...s, progress: { ...s.progress, [next]: { ...s.progress[next], arrived: true, read: true } }, phone: { open: true, app: CASES[next].channel, caseId: next, record: null } };
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'RESET': return a.state;
    case 'START': return { ...s, started: true };
    case 'HIDDEN': return { ...s, hidden: a.hidden };
    case 'MOTION': return { ...s, reducedMotion: a.reduced };
    case 'DEV_EXIT': return import.meta.env.DEV && s.phone.open ? { ...s, phone: { ...s.phone, open: false } } : s;
    case 'TICK': {
      if (!canEarn(s) || !Number.isFinite(a.ms) || a.ms <= 0) return s;
      const ms = Math.min(1000, Math.floor(a.ms));
      return advanceIfReady({ ...s, stageMs: s.stageMs + ms, activeMs: s.activeMs + ms });
    }
    case 'TAP': {
      if (!canEarn(s) || !Number.isFinite(a.now)) return s;
      const cents = rates(s).tap;
      return advanceIfReady(queue({ ...s, cash: s.cash + cents, gross: s.gross + cents, lastTap: a.now, stageTaps: s.stageTaps + 1 }));
    }
    case 'UPGRADE': {
      const cost = STAGES[s.stage].cost * 100;
      if (!canEarn(s) || s.upgrade || s.cash < cost) return s;
      return { ...s, cash: s.cash - cost, upgrade: true, ledger: [...s.ledger, { id: `upgrade-${s.stage}`, title: STAGES[s.stage].upgrade, cents: -cost, stage: s.stage }] };
    }
    case 'ADVANCE': return advanceIfReady(s);
    case 'PHONE': {
      if (!a.open && activeCase(s)) return s;
      const caseId = a.open && (!s.phone.caseId || s.progress[s.phone.caseId].result) ? activeCase(s) ?? s.phone.caseId : s.phone.caseId;
      const changed = caseId !== s.phone.caseId;
      const next: GameState = { ...s, phone: { ...s.phone, open: a.open, caseId, app: changed ? 'home' : s.phone.app, record: changed ? null : s.phone.record } };
      return a.open ? next : advanceIfReady(next);
    }
    case 'APP': return s.phone.open ? { ...s, phone: { ...s.phone, app: a.app, record: a.list && (a.app === 'messages' || a.app === 'mail') ? 'list' : null } } : s;
    case 'CASE': {
      if (!s.phone.open || !s.progress[a.id]?.arrived) return s;
      return { ...s, progress: { ...s.progress, [a.id]: { ...s.progress[a.id], read: true } }, phone: { open: true, app: CASES[a.id].channel, caseId: a.id, record: null } };
    }
    case 'BACK': return { ...s, phone: { ...s.phone, app: 'home', record: null } };
    case 'INSPECT': {
      const id = s.phone.caseId;
      if (!s.phone.open || !id || !s.progress[id].arrived) return s;
      const e = CASES[id].evidence.find(e => e.id === a.id);
      if (!e || e.app !== s.phone.app) return s;
      const p = s.progress[id];
      const evidence = p.evidence.includes(e.id) || p.result ? p.evidence : [...p.evidence, e.id];
      const calls = e.call && !s.calls.some(c => c.caseId === id && c.evidenceId === e.id) ? [...s.calls, { caseId: id, evidenceId: e.id }] : s.calls;
      return { ...s, progress: { ...s.progress, [id]: { ...p, evidence } }, calls, phone: { ...s.phone, record: e.id } };
    }
    case 'SAMPLE': {
      const id = s.phone.caseId;
      if (!s.phone.open || id !== 'uni-a' || !s.progress[id].arrived || s.progress[id].samplePaid || s.progress[id].result) return s;
      return { ...s, cash: s.cash + 5000, progress: { ...s.progress, [id]: { ...s.progress[id], samplePaid: true } }, ledger: [...s.ledger, { id: `${id}-sample`, title: 'Introductory task commission', cents: 5000, stage: 1, caseId: id }] };
    }
    case 'RESOLVE': {
      const id = s.phone.caseId;
      if (!s.phone.open || !id || !s.progress[id].arrived || s.progress[id].result) return s;
      const e = CASES[id], p = s.progress[id];
      const paid = a.decision === 'proceed';
      if (paid && s.cash < e.cost * 100) return s;
      let delta = paid ? -e.cost * 100 : 0;
      if (paid && id === 'uni-b') delta += 100000;
      if (paid && id === 'office-b') delta += 1000000;
      const unsafe = e.scam && paid;
      const result: EncounterResult = { decision: a.decision, verified: p.evidence.includes(e.decisive) && (e.scam ? !paid : a.decision !== 'report'), unsafe, personalDelta: delta, employerLoss: id === 'office-a' && paid ? 5000 : 0, missed: !e.scam && !paid && e.stage !== 3 };
      const ledger = delta ? [...s.ledger, { id: `${id}-result`, title: e.title, cents: delta, stage: e.stage, caseId: id }] : s.ledger;
      return { ...s, cash: s.cash + delta, progress: { ...s.progress, [id]: { ...p, result } }, ledger, lastResolutionMs: s.stageMs, lastResolutionTap: s.stageTaps, phone: { ...s.phone, app: 'feedback', record: null } };
    }
    case 'ACK': return activeCase(s) ? s : advanceIfReady({ ...s, phone: { ...s.phone, open: false, app: 'home', record: null } });
  }
}

export function decodeSave(raw: string): GameState | null {
  try {
    const s = JSON.parse(raw) as GameState;
    const apps = ['home', 'messages', 'mail', 'calls', 'contacts', 'bank', 'browser', 'feedback'];
    if (!s || s.version !== 1 || !Number.isInteger(s.stage) || s.stage < 0 || s.stage > 3) return null;
    for (const n of ['cash', 'gross', 'activeMs', 'stageMs', 'remainder'] as const) if (!Number.isSafeInteger(s[n]) || s[n] < 0) return null;
    if (s.remainder > 999 || typeof s.started !== 'boolean' || typeof s.upgrade !== 'boolean' || typeof s.finished !== 'boolean' || typeof s.reducedMotion !== 'boolean') return null;
    if (!s.phone || typeof s.phone.open !== 'boolean' || !apps.includes(s.phone.app) || (s.phone.caseId !== null && !CASES[s.phone.caseId])) return null;
    if (s.lastResolutionMs !== null && (!Number.isSafeInteger(s.lastResolutionMs) || s.lastResolutionMs < 0 || s.lastResolutionMs > s.stageMs)) return null;
    if (!Array.isArray(s.order) || s.order.length !== 4 || !s.order.every((ids, i) => Array.isArray(ids) && ids.length === 2 && new Set(ids).size === 2 && ids.every(id => CASES[id]?.stage === i))) return null;
    if (!s.progress || !ENCOUNTERS.every(e => {
      const p = s.progress[e.id];
      if (!p || typeof p.arrived !== 'boolean' || typeof p.read !== 'boolean' || typeof p.samplePaid !== 'boolean' || !Array.isArray(p.evidence) || !p.evidence.every(id => e.evidence.some(x => x.id === id))) return false;
      if (p.result && (!p.arrived || !['proceed', 'decline', 'report'].includes(p.result.decision) || typeof p.result.verified !== 'boolean' || typeof p.result.unsafe !== 'boolean' || !Number.isSafeInteger(p.result.personalDelta) || !Number.isSafeInteger(p.result.employerLoss) || p.result.employerLoss < 0 || typeof p.result.missed !== 'boolean')) return false;
      return true;
    })) return null;
    if (!Array.isArray(s.ledger) || !s.ledger.every(l => typeof l.id === 'string' && typeof l.title === 'string' && Number.isSafeInteger(l.cents) && Number.isInteger(l.stage) && l.stage >= 0 && l.stage <= 3)) return null;
    if (!Array.isArray(s.calls) || !s.calls.every(c => CASES[c.caseId]?.evidence.some(e => e.id === c.evidenceId && e.call))) return null;
    if (s.phone.record === 'list') {
      if (s.phone.app !== 'messages' && s.phone.app !== 'mail') return null;
    } else if (s.phone.record !== null && (!s.phone.caseId || !CASES[s.phone.caseId].evidence.some(e => e.id === s.phone.record))) return null;
    if (s.phone.caseId && !s.progress[s.phone.caseId].arrived) return null;
    if (s.phone.app === 'feedback' && (!s.phone.caseId || !s.progress[s.phone.caseId].result)) return null;
    for (let i = 0; i < s.stage; i++) if (!s.order[i].every(id => s.progress[id].result)) return null;
    if (s.finished && (s.stage !== 3 || s.cash < 100000000 || resolvedCount(s) !== 8)) return null;
    const stageTaps = s.stageTaps ?? 0, lastResolutionTap = s.lastResolutionTap ?? null;
    if (!Number.isSafeInteger(stageTaps) || stageTaps < 0 || (lastResolutionTap !== null && (!Number.isSafeInteger(lastResolutionTap) || lastResolutionTap < 0 || lastResolutionTap > stageTaps))) return null;
    // Older saves may be looking at evidence in the retired Browser app.
    // Keep the inspected record open in its current app without changing evidence credit.
    const legacyBrowser = (s.phone.app as string) === 'browser';
    const openedEvidence = s.phone.caseId && s.phone.record ? CASES[s.phone.caseId].evidence.find(e => e.id === s.phone.record) : undefined;
    const phone: GameState['phone'] = legacyBrowser ? { ...s.phone, app: openedEvidence?.app ?? 'home' } : s.phone;
    const pending = activeCase(s);
    return { ...s, stageTaps, lastResolutionTap, hidden: false, lastTap: -1000, phone: pending && !phone.open ? { open: true, app: CASES[pending].channel, caseId: pending, record: null } : phone };
  } catch { return null; }
}
