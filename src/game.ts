import { CASES, ENCOUNTERS, STAGES } from './content';
import type { Decision, PhoneApp } from './content';
import { DEFAULT_CHARACTER, GENDERS, normaliseCharacter, SKIN_TONES } from './profiles';
import type { Character } from './profiles';

export const SAVE_KEY = 'scamagotchi.life.v2';
export const EVENT_COOLDOWN_MS = 10000;
export type SafetyReason = 'scam' | 'grooming' | 'cyberbullying' | 'other';
export interface SafetyPractice {
  evidenceSaved: boolean;
  blocked: boolean;
  reported: boolean;
  reason: SafetyReason | null;
}
const SAFETY_REASONS: readonly SafetyReason[] = ['scam', 'grooming', 'cyberbullying', 'other'];
const YOUTH_SAFETY_IDS = new Set([
  'school-grooming',
  'school-bullying',
  'uni-grooming',
  'uni-bullying',
]);
export interface EncounterResult {
  decision: Decision;
  verified: boolean;
  unsafe: boolean;
  personalDelta: number;
  employerLoss: number;
  missed: boolean;
  inspectedEvidence: string[];
}
export interface Progress {
  arrived: boolean;
  read: boolean;
  evidence: string[];
  samplePaid: boolean;
  result: EncounterResult | null;
  callStatus: 'ringing' | 'answered' | 'declined' | null;
  safety?: SafetyPractice;
}
const freshProgress = (): Progress => ({
  arrived: false,
  read: false,
  evidence: [],
  samplePaid: false,
  result: null,
  callStatus: null,
});
export const safetyPractice = (progress: Progress): SafetyPractice =>
  progress.safety ?? { evidenceSaved: false, blocked: false, reported: false, reason: null };
export interface LedgerEntry {
  id: string;
  title: string;
  cents: number;
  stage: number;
  caseId?: string;
}
export interface CallRecord {
  caseId: string;
  evidenceId: string;
}
export interface GameState {
  version: 2;
  started: boolean;
  character: Character;
  briefing: boolean;
  stage: number;
  cash: number;
  gross: number;
  upgrade: boolean;
  stageMs: number;
  activeMs: number;
  lastResolutionMs: number | null;
  remainder: number;
  stageTaps: number;
  lastResolutionTap: number | null;
  lastTap: number;
  hidden: boolean;
  finished: boolean;
  milestoneSeen: boolean;
  reducedMotion: boolean;
  order: string[][];
  progress: Record<string, Progress>;
  ledger: LedgerEntry[];
  calls: CallRecord[];
  phone: { open: boolean; app: PhoneApp; caseId: string | null; record: string | null };
}
export type Action =
  | { type: 'RESET'; state: GameState }
  | { type: 'START'; character?: Partial<Character> }
  | { type: 'BEGIN_STAGE' }
  | { type: 'CONTINUE_PLAY' }
  | { type: 'TICK'; ms: number }
  | { type: 'TAP'; now: number }
  | { type: 'UPGRADE' }
  | { type: 'ADVANCE' }
  | { type: 'HIDDEN'; hidden: boolean }
  | { type: 'PHONE'; open: boolean }
  | { type: 'APP'; app: PhoneApp; list?: boolean }
  | { type: 'CASE'; id: string }
  | { type: 'INSPECT'; id: string }
  | { type: 'BACK' }
  | { type: 'CALL_ANSWER' }
  | { type: 'CALL_DECLINE' }
  | {
      type: 'PRACTISE_SAFETY';
      action: 'save-evidence' | 'block' | 'report';
      reason?: SafetyReason | null;
    }
  | { type: 'RESOLVE'; decision: Decision }
  | { type: 'ACK' }
  | { type: 'MOTION'; reduced: boolean };

export function createGame(random: () => number = Math.random): GameState {
  return {
    version: 2,
    started: false,
    character: { ...DEFAULT_CHARACTER },
    briefing: false,
    stage: 0,
    cash: 5000,
    gross: 0,
    upgrade: false,
    stageMs: 0,
    activeMs: 0,
    lastResolutionMs: null,
    remainder: 0,
    lastTap: -1000,
    stageTaps: 0,
    lastResolutionTap: null,
    hidden: false,
    finished: false,
    milestoneSeen: false,
    reducedMotion: false,
    order: STAGES.map((_, stage) => {
      const ids = ENCOUNTERS.filter((e) => e.stage === stage).map((e) => e.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const draw = random();
        const j = Math.max(
          0,
          Math.min(i, Math.floor((Number.isFinite(draw) ? draw : 0) * (i + 1))),
        );
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      return ids;
    }),
    progress: Object.fromEntries(ENCOUNTERS.map((e) => [e.id, freshProgress()])),
    ledger: [{ id: 'start', title: 'Starting pocket money', cents: 5000, stage: 0 }],
    calls: [],
    phone: { open: false, app: 'home', caseId: null, record: null },
  };
}
export const rates = (s: GameState) => ({ tap: STAGES[s.stage].tap * 100 * (s.upgrade ? 2 : 1) });
export const requiredEncounterCount = (s: GameState) => s.order.flat().length;
export const resolvedCount = (s: GameState) =>
  s.order.flat().filter((id) => s.progress[id]?.result).length;
export const stageResolved = (s: GameState) =>
  s.order[s.stage].filter((id) => s.progress[id].result).length;
export const canAdvance = (s: GameState) =>
  stageResolved(s) === s.order[s.stage].length &&
  (s.stage === 3
    ? !s.milestoneSeen && s.cash >= 100000000 && resolvedCount(s) === requiredEncounterCount(s)
    : s.gross >= STAGES[s.stage].gate * 100);
export const activeCase = (s: GameState) =>
  s.order[s.stage].find((id) => s.progress[id].arrived && !s.progress[id].result);
export const encounterChannel = (s: GameState, id: string): 'messages' | 'mail' | 'calls' =>
  CASES[id].channel === 'calls' && s.progress[id].callStatus === 'declined'
    ? 'messages'
    : CASES[id].channel;
const canEarn = (s: GameState) =>
  s.started && !s.briefing && !s.phone.open && !s.hidden && !s.finished;
// Only an unresolved request keeps ordinary phone browsing modal. Leaving a
// resolved debrief must release its pause, including through the Home button.
const navigationPauses = (s: GameState) => Boolean(activeCase(s));
function advanceIfReady(s: GameState): GameState {
  if (!canEarn(s) || !canAdvance(s)) return s;
  if (s.stage === 3) return { ...s, finished: true };
  return {
    ...s,
    stage: s.stage + 1,
    briefing: true,
    upgrade: false,
    stageMs: 0,
    stageTaps: 0,
    lastResolutionTap: null,
    remainder: 0,
    phone: { open: false, app: 'home', caseId: null, record: null },
  };
}
function queue(s: GameState): GameState {
  if (activeCase(s)) return s;
  const next = s.order[s.stage].find((id) => !s.progress[id].arrived);
  if (!next) return s;
  const due = s.lastResolutionTap === null ? 5 : s.lastResolutionTap + 5;
  // Do not trap a player inside a mandatory payment event they could not afford.
  // Investigation and declining are always free; purchases pause once it arrives.
  if (
    s.stageTaps < due ||
    s.cash < CASES[next].cost * 100 ||
    (s.lastResolutionMs !== null && s.activeMs - s.lastResolutionMs < EVENT_COOLDOWN_MS)
  )
    return s;
  return {
    ...s,
    progress: {
      ...s.progress,
      [next]: {
        ...s.progress[next],
        arrived: true,
        read: true,
        callStatus: CASES[next].channel === 'calls' ? 'ringing' : null,
      },
    },
    phone: { open: true, app: CASES[next].channel, caseId: next, record: null },
  };
}
export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'RESET':
      return a.state;
    case 'START':
      return s.started
        ? s
        : { ...s, started: true, character: normaliseCharacter(a.character), briefing: true };
    case 'BEGIN_STAGE':
      return s.started && s.briefing ? { ...s, briefing: false } : s;
    case 'CONTINUE_PLAY':
      return s.finished ? { ...s, finished: false, milestoneSeen: true } : s;
    case 'HIDDEN':
      return { ...s, hidden: a.hidden };
    case 'MOTION':
      return { ...s, reducedMotion: a.reduced };
    case 'TICK': {
      if (!canEarn(s) || !Number.isFinite(a.ms) || a.ms <= 0) return s;
      const ms = Math.min(1000, Math.floor(a.ms));
      return advanceIfReady(queue({ ...s, stageMs: s.stageMs + ms, activeMs: s.activeMs + ms }));
    }
    case 'TAP': {
      if (!canEarn(s) || !Number.isFinite(a.now)) return s;
      const cents = rates(s).tap;
      if (!Number.isSafeInteger(s.cash + cents) || !Number.isSafeInteger(s.gross + cents)) return s;
      return advanceIfReady(
        queue({
          ...s,
          cash: s.cash + cents,
          gross: s.gross + cents,
          lastTap: a.now,
          stageTaps: s.stageTaps + 1,
        }),
      );
    }
    case 'UPGRADE': {
      const cost = STAGES[s.stage].cost * 100;
      if (!canEarn(s) || s.upgrade || s.cash < cost) return s;
      return {
        ...s,
        cash: s.cash - cost,
        upgrade: true,
        ledger: [
          ...s.ledger,
          {
            id: `upgrade-${s.stage}`,
            title: STAGES[s.stage].upgrade,
            cents: -cost,
            stage: s.stage,
          },
        ],
      };
    }
    case 'ADVANCE':
      return advanceIfReady(s);
    case 'PHONE': {
      if (!a.open && activeCase(s)) return s;
      const caseId =
        a.open && (!s.phone.caseId || s.progress[s.phone.caseId].result)
          ? (activeCase(s) ?? s.phone.caseId)
          : s.phone.caseId;
      const changed = caseId !== s.phone.caseId;
      const next: GameState = {
        ...s,
        phone: {
          ...s.phone,
          open: a.open && navigationPauses(s),
          caseId,
          app: changed ? 'home' : s.phone.app,
          record: changed ? null : s.phone.record,
        },
      };
      return a.open ? next : advanceIfReady(next);
    }
    case 'APP':
      return {
        ...s,
        phone: {
          ...s.phone,
          open: navigationPauses(s),
          app: a.app,
          record: a.list && (a.app === 'messages' || a.app === 'mail') ? 'list' : null,
        },
      };
    case 'CASE': {
      if (!s.progress[a.id]?.arrived) return s;
      return {
        ...s,
        progress: { ...s.progress, [a.id]: { ...s.progress[a.id], read: true } },
        phone: {
          open: navigationPauses(s),
          app: encounterChannel(s, a.id),
          caseId: a.id,
          record: null,
        },
      };
    }
    case 'BACK':
      return { ...s, phone: { ...s.phone, open: navigationPauses(s), app: 'home', record: null } };
    case 'INSPECT': {
      const id = s.phone.caseId;
      if (!id || !s.progress[id].arrived) return s;
      const e = CASES[id].evidence.find((e) => e.id === a.id);
      if (!e || e.app !== s.phone.app) return s;
      const p = s.progress[id];
      const evidence = p.evidence.includes(e.id) || p.result ? p.evidence : [...p.evidence, e.id];
      const calls =
        e.call && !s.calls.some((c) => c.caseId === id && c.evidenceId === e.id)
          ? [...s.calls, { caseId: id, evidenceId: e.id }]
          : s.calls;
      return {
        ...s,
        progress: { ...s.progress, [id]: { ...p, evidence } },
        calls,
        phone: { ...s.phone, open: navigationPauses(s), record: e.id },
      };
    }
    case 'CALL_ANSWER':
    case 'CALL_DECLINE': {
      const id = s.phone.caseId;
      if (!id || CASES[id].channel !== 'calls' || !s.progress[id].arrived || s.progress[id].result)
        return s;
      const status = s.progress[id].callStatus;
      if (
        a.type === 'CALL_ANSWER'
          ? status !== 'ringing'
          : status !== 'ringing' && status !== 'answered'
      )
        return s;
      const declined = a.type === 'CALL_DECLINE';
      return {
        ...s,
        progress: {
          ...s.progress,
          [id]: { ...s.progress[id], callStatus: declined ? 'declined' : 'answered' },
        },
        phone: { ...s.phone, open: true, app: declined ? 'messages' : 'calls', record: null },
      };
    }
    case 'PRACTISE_SAFETY': {
      const id = s.phone.caseId;
      if (
        !id ||
        id !== activeCase(s) ||
        !s.phone.open ||
        !s.progress[id].arrived ||
        s.progress[id].result
      )
        return s;
      const channel = encounterChannel(s, id);
      if ((channel !== 'messages' && channel !== 'mail') || s.phone.app !== channel) return s;
      const p = s.progress[id],
        practice = safetyPractice(p);
      let safety: SafetyPractice;
      if (a.action === 'save-evidence') {
        if (practice.evidenceSaved) return s;
        safety = { ...practice, evidenceSaved: true };
      } else if (a.action === 'block') {
        if (practice.blocked) return s;
        safety = { ...practice, blocked: true };
      } else if (a.action === 'report') {
        if (
          practice.reported ||
          !practice.evidenceSaved ||
          !a.reason ||
          !SAFETY_REASONS.includes(a.reason)
        )
          return s;
        safety = { ...practice, reported: true, reason: a.reason };
      } else return s;
      return { ...s, progress: { ...s.progress, [id]: { ...p, safety } } };
    }
    case 'RESOLVE': {
      const id = s.phone.caseId;
      if (
        !s.phone.open ||
        !id ||
        !s.progress[id].arrived ||
        s.progress[id].result ||
        s.progress[id].callStatus === 'ringing' ||
        !['proceed', 'decline', 'report'].includes(a.decision)
      )
        return s;
      const e = CASES[id],
        p = s.progress[id],
        paid = a.decision === 'proceed';
      if (a.decision === 'report' && !safetyPractice(p).reported) return s;
      if (paid && s.cash < e.cost * 100) return s;
      const delta = paid ? ((e.reward ?? 0) - e.cost) * 100 : 0;
      if (!Number.isSafeInteger(s.cash + delta)) return s;
      const result: EncounterResult = {
        decision: a.decision,
        verified: p.evidence.includes(e.decisive) && (e.scam ? !paid : a.decision !== 'report'),
        unsafe: e.scam && paid,
        personalDelta: delta,
        employerLoss: paid ? (e.employerLoss ?? 0) : 0,
        missed: !e.scam && !paid && e.stage !== 3,
        inspectedEvidence: [...p.evidence],
      };
      const ledger = delta
        ? [
            ...s.ledger,
            { id: `${id}-result`, title: e.title, cents: delta, stage: e.stage, caseId: id },
          ]
        : s.ledger;
      // activeMs cannot advance while the debrief is open. Using the global clock
      // also carries the between-event cooldown through a new stage's briefing.
      return {
        ...s,
        cash: s.cash + delta,
        progress: { ...s.progress, [id]: { ...p, result } },
        ledger,
        lastResolutionMs: s.activeMs,
        lastResolutionTap: s.stageTaps,
        phone: { ...s.phone, app: 'feedback', record: null },
      };
    }
    case 'ACK': {
      if (activeCase(s)) return s;
      const closingOutcome =
        s.phone.open && s.phone.caseId !== null && Boolean(s.progress[s.phone.caseId].result);
      return advanceIfReady({
        ...s,
        lastResolutionMs: closingOutcome ? s.activeMs : s.lastResolutionMs,
        phone: { ...s.phone, open: false, app: 'home', record: null },
      });
    }
  }
}
export function decodeSave(raw: string): GameState | null {
  try {
    const s = JSON.parse(raw) as GameState;
    const apps = [
      'home',
      'notifications',
      'messages',
      'mail',
      'calls',
      'contacts',
      'bank',
      'feedback',
      'profile',
    ];
    if (
      !s ||
      s.version !== 2 ||
      !Number.isInteger(s.stage) ||
      s.stage < 0 ||
      s.stage >= STAGES.length
    )
      return null;
    if ('mode' in s && s.mode !== undefined) return null;
    for (const n of ['cash', 'gross', 'activeMs', 'stageMs', 'remainder', 'stageTaps'] as const)
      if (!Number.isSafeInteger(s[n]) || s[n] < 0) return null;
    for (const k of [
      'started',
      'briefing',
      'upgrade',
      'finished',
      'milestoneSeen',
      'reducedMotion',
    ] as const)
      if (typeof s[k] !== 'boolean') return null;
    if (s.remainder !== 0 || (s.briefing && !s.started)) return null;
    if (
      !s.character ||
      typeof s.character.name !== 'string' ||
      !s.character.name.trim() ||
      Array.from(s.character.name).length > 24 ||
      !GENDERS.some((g) => g.value === s.character.gender) ||
      !Number.isInteger(s.character.skinTone) ||
      s.character.skinTone < 0 ||
      s.character.skinTone >= SKIN_TONES.length
    )
      return null;
    if (
      !s.phone ||
      typeof s.phone.open !== 'boolean' ||
      !apps.includes(s.phone.app) ||
      (s.phone.caseId !== null && !CASES[s.phone.caseId])
    )
      return null;
    if (
      s.lastResolutionMs !== null &&
      (!Number.isSafeInteger(s.lastResolutionMs) ||
        s.lastResolutionMs < 0 ||
        s.lastResolutionMs > s.activeMs)
    )
      return null;
    if (
      s.lastResolutionTap !== null &&
      (!Number.isSafeInteger(s.lastResolutionTap) ||
        s.lastResolutionTap < 0 ||
        s.lastResolutionTap > s.stageTaps)
    )
      return null;
    if (!Array.isArray(s.order) || s.order.length !== STAGES.length) return null;
    if (
      !s.order.every(
        (ids, i) =>
          Array.isArray(ids) &&
          new Set(ids).size === ids.length &&
          ids.every((id) => CASES[id]?.stage === i) &&
          ENCOUNTERS.filter((e) => e.stage === i && !YOUTH_SAFETY_IDS.has(e.id)).every((e) =>
            ids.includes(e.id),
          ),
      )
    )
      return null;
    const knownIds = new Set(ENCOUNTERS.map((e) => e.id));
    if (
      !s.progress ||
      typeof s.progress !== 'object' ||
      Array.isArray(s.progress) ||
      Object.keys(s.progress).some((id) => !knownIds.has(id))
    )
      return null;
    const legacyTwelveCaseRun = [...YOUTH_SAFETY_IDS].every(
      (id) => !Object.hasOwn(s.progress, id) && !s.order.flat().includes(id),
    );
    // Version 2 originally had twelve cases. Preserve completed stages and
    // completed runs; offer new cases only where this journey has not passed.
    // Missing legacy cases are invalid, and no skipped case gains a result.
    for (const e of ENCOUNTERS) {
      if (!Object.hasOwn(s.progress, e.id)) {
        if (!YOUTH_SAFETY_IDS.has(e.id) || !legacyTwelveCaseRun) return null;
        s.progress[e.id] = freshProgress();
      }
      if (!s.order[e.stage].includes(e.id)) {
        if (!YOUTH_SAFETY_IDS.has(e.id) || s.progress[e.id].arrived) return null;
        if (!s.finished && !s.milestoneSeen && e.stage >= s.stage) {
          if (!legacyTwelveCaseRun) return null;
          s.order[e.stage].push(e.id);
        }
      }
    }
    if (
      !ENCOUNTERS.every((e) => {
        const p = s.progress[e.id];
        if (
          !p ||
          typeof p.arrived !== 'boolean' ||
          typeof p.read !== 'boolean' ||
          typeof p.samplePaid !== 'boolean' ||
          p.samplePaid ||
          !Array.isArray(p.evidence) ||
          new Set(p.evidence).size !== p.evidence.length ||
          !p.evidence.every((id) => e.evidence.some((x) => x.id === id))
        )
          return false;
        if (![null, 'ringing', 'answered', 'declined'].includes(p.callStatus)) return false;
        if ((e.channel !== 'calls' || !p.arrived) && p.callStatus !== null) return false;
        if (e.channel === 'calls' && p.arrived && p.callStatus === null) return false;
        if (p.safety !== undefined) {
          const practice = p.safety;
          if (
            !practice ||
            typeof practice.evidenceSaved !== 'boolean' ||
            typeof practice.blocked !== 'boolean' ||
            typeof practice.reported !== 'boolean' ||
            (practice.reason !== null && !SAFETY_REASONS.includes(practice.reason)) ||
            (practice.reported
              ? !practice.evidenceSaved || practice.reason === null
              : practice.reason !== null) ||
            (!p.arrived && (practice.evidenceSaved || practice.blocked || practice.reported)) ||
            (p.result?.decision === 'report' && !practice.reported)
          )
            return false;
        }
        if (!p.arrived && (p.evidence.length || p.read || p.result)) return false;
        if (
          p.result &&
          (!p.arrived ||
            p.callStatus === 'ringing' ||
            !['proceed', 'decline', 'report'].includes(p.result.decision) ||
            typeof p.result.verified !== 'boolean' ||
            typeof p.result.unsafe !== 'boolean' ||
            !Number.isSafeInteger(p.result.personalDelta) ||
            !Number.isSafeInteger(p.result.employerLoss) ||
            p.result.employerLoss < 0 ||
            typeof p.result.missed !== 'boolean' ||
            !Array.isArray(p.result.inspectedEvidence) ||
            p.result.inspectedEvidence.length !== p.evidence.length ||
            !p.result.inspectedEvidence.every((id) => p.evidence.includes(id)))
        )
          return false;
        return true;
      })
    )
      return null;
    if (
      !Array.isArray(s.ledger) ||
      new Set(s.ledger.map((l) => l.id)).size !== s.ledger.length ||
      !s.ledger.every(
        (l) =>
          typeof l.id === 'string' &&
          typeof l.title === 'string' &&
          Number.isSafeInteger(l.cents) &&
          Number.isInteger(l.stage) &&
          l.stage >= 0 &&
          l.stage < STAGES.length &&
          (l.caseId === undefined || Boolean(CASES[l.caseId])),
      )
    )
      return null;
    if (
      !Array.isArray(s.calls) ||
      !s.calls.every((c) => CASES[c.caseId]?.evidence.some((e) => e.id === c.evidenceId && e.call))
    )
      return null;
    if (s.phone.record === 'list') {
      if (s.phone.app !== 'messages' && s.phone.app !== 'mail') return null;
    } else if (
      s.phone.record !== null &&
      (!s.phone.caseId || !CASES[s.phone.caseId].evidence.some((e) => e.id === s.phone.record))
    )
      return null;
    if (s.phone.caseId && !s.progress[s.phone.caseId].arrived) return null;
    if (s.phone.app === 'feedback' && (!s.phone.caseId || !s.progress[s.phone.caseId].result))
      return null;
    for (let i = 0; i < s.stage; i++)
      if (!s.order[i].every((id) => s.progress[id].result)) return null;
    if (
      s.order
        .slice(s.stage + 1)
        .flat()
        .some((id) => s.progress[id].arrived)
    )
      return null;
    if (
      s.order[s.stage].filter((id) => s.progress[id].arrived && !s.progress[id].result).length > 1
    )
      return null;
    if (
      (s.finished || s.milestoneSeen) &&
      (s.stage !== 3 || resolvedCount(s) !== requiredEncounterCount(s))
    )
      return null;
    if (s.finished && (s.cash < 100000000 || s.milestoneSeen)) return null;
    const pending = activeCase(s);
    const phone =
      pending && !s.phone.open
        ? { open: true, app: encounterChannel(s, pending), caseId: pending, record: null }
        : { ...s.phone, open: Boolean(pending) || (s.phone.open && s.phone.app === 'feedback') };
    return { ...s, hidden: false, lastTap: -1000, phone };
  } catch {
    return null;
  }
}
