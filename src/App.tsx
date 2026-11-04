import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Download, Info, RotateCcw, ShieldCheck, Smartphone, X } from 'lucide-react';
import { CASES, ENCOUNTERS, money, shortMoney, STAGES } from './content';
import { activeCase, canAdvance, createGame, decodeSave, rates, reducer, resolvedCount, SAVE_KEY, stageResolved, unreadCount } from './game';
import type { GameState } from './game';
import Scene, { EarnNotes, Mascot } from './Scene';
import Phone, { useDialogFocus } from './Phone';
import styles from './App.module.css';
import { initialTheme, THEMES } from './themes';
import type { Theme } from './themes';
import { FONT_PAIRINGS, initialFont } from './fonts';
import type { FontPairing } from './fonts';
const preview = new URLSearchParams(location.search).has('preview');

function load() {
  if (preview) return { state: { ...createGame(() => 0), started: true }, problem: '', raw: '' };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: createGame(), problem: '', raw: '' };
    const state = decodeSave(raw);
    return state ? { state, problem: '', raw } : { state: createGame(), problem: 'Your saved game could not be read. Keep a copy before starting fresh.', raw };
  } catch { return { state: createGame(), problem: 'Browser storage is unavailable. You can play, but this session may not be saved.', raw: '' }; }
}
const elapsed = (ms: number) => `${Math.floor(ms / 60000)}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}`;

export default function App() {
  const [initial] = useState(load);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [font, setFont] = useState<FontPairing>(initialFont);
  function chooseFont(value: FontPairing) {
    setFont(value);
    const url = new URL(location.href); url.searchParams.set('font', value); history.replaceState(null, '', url);
    if (!preview) try { localStorage.setItem('scamagotchi.font', value); } catch { /* Optional preference. */ }
  }
  function chooseTheme(value: Theme) {
    setTheme(value);
    const url = new URL(location.href); url.searchParams.set('theme', value); history.replaceState(null, '', url);
    if (!preview) try { localStorage.setItem('scamagotchi.theme', value); } catch { /* Optional preference. */ }
  }
  const [state, dispatch] = useReducer(reducer, initial.state);
  const [storageProblem, setStorageProblem] = useState(initial.problem);
  const [recovering, setRecovering] = useState(Boolean(initial.raw && initial.problem));
  const [modal, setModal] = useState<'about' | 'reset' | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [floats, setFloats] = useState<{ id: number; value: string; x: number }[]>([]);
  const stateRef = useRef(state); stateRef.current = state;
  const floatId = useRef(0);
  const floatTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stage = STAGES[state.stage], rate = rates(state);
  const unread = unreadCount(state), ready = canAdvance(state), pending = activeCase(state);
  const allResults = ENCOUNTERS.filter(e => state.progress[e.id].result);
  const verified = allResults.filter(e => state.progress[e.id].result?.verified).length;
  const reduced = state.reducedMotion;
  const blocked = state.phone.open || !!modal || !state.started || state.finished || recovering;

  useEffect(() => {
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden && !modal && !recovering) dispatch({ type: 'TICK', ms: now - previous });
      previous = now;
    }, 250);
    const visibility = () => { previous = performance.now(); dispatch({ type: 'HIDDEN', hidden: document.hidden }); };
    document.addEventListener('visibilitychange', visibility);

    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [modal, recovering]);
  useEffect(() => () => floatTimers.current.forEach(clearTimeout), []);

  function save(s: GameState) {
    if (recovering || preview) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
    catch { setStorageProblem('Your browser could not save this game. Keep this tab open, or download a backup.'); }
  }
  useEffect(() => {
    if (recovering || preview) return;
    const timer = setInterval(() => save(stateRef.current), 1000);
    const flush = () => save(stateRef.current);
    window.addEventListener('pagehide', flush);
    return () => { clearInterval(timer); window.removeEventListener('pagehide', flush); };
  // save reads the latest state through stateRef.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recovering]);
  useEffect(() => { save(state); }, [state.progress, state.ledger, state.stage, state.phone, state.started, state.finished, state.reducedMotion, recovering]);

  function earn() {
    const s = stateRef.current, now = performance.now();
    if (!s.started || s.phone.open || s.finished || s.hidden || modal || recovering) return;
    dispatch({ type: 'TAP', now });
    const id = ++floatId.current;
    setFloats(old => [...old.slice(-5), { id, value: `+${money(rates(s).tap)}`, x: 35 + Math.random() * 30 }]);
    const timer = setTimeout(() => { setFloats(old => old.filter(f => f.id !== id)); floatTimers.current = floatTimers.current.filter(t => t !== timer); }, 900);
    floatTimers.current.push(timer);
  }
  function downloadSave() {
    const blob = new Blob([recovering ? initial.raw : JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'scamagotchi-save.json'; a.click(); URL.revokeObjectURL(url);
  }
  function reset() {
    const next = createGame(); next.reducedMotion = state.reducedMotion;
    setRecovering(false); setStorageProblem(''); dispatch({ type: 'RESET', state: next }); setModal(null); setShopOpen(false);
    if (!preview) try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { setStorageProblem('Storage is unavailable. This new run will only last while the tab stays open.'); }
  }
  const progress = Math.min(100, state.cash / 100000000 * 100);
  const stageProgress = Math.min(100, (state.stage === 3 ? state.cash : state.gross) / (stage.gate * 100) * 100);

  return <div data-theme={theme} data-font={font} className={`${styles.app} ${reduced ? styles.reduced : ''}`}>
    <header className={styles.header}>
      <h1>Scamagotchi</h1>
      <nav className={styles.tools} aria-label="Game settings">
        <label>Theme <select aria-label="Theme" value={theme} onChange={e => chooseTheme(e.target.value as Theme)}>{THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <a href="?view=themes" target={preview ? '_top' : undefined}>Compare themes</a>
        <label>Fonts <select aria-label="Font pairing" value={font} onChange={e => chooseFont(e.target.value as FontPairing)}><option value="default">Browser default</option>{FONT_PAIRINGS.map(f => <option key={f.id} value={f.id}>{f.heading} + {f.body}</option>)}</select></label>
        <a href="?view=fonts" target={preview ? '_top' : undefined}>Compare fonts</a>
        <button aria-label="How to play" title="How to play" onClick={() => setModal('about')}><Info size={20} /></button>
        <button aria-label="Restart game" title="Restart game" onClick={() => setModal('reset')}><RotateCcw size={20} /> Restart</button>
        <label className={styles.motion}><input type="checkbox" checked={reduced} onChange={e => dispatch({ type: 'MOTION', reduced: e.target.checked })} /> Less motion</label>
      </nav>
    </header>
    {storageProblem && <div className={styles.storage} role="status"><p>{storageProblem}</p><button onClick={downloadSave}>Download backup</button>{recovering && <button onClick={() => setModal('reset')}>Start fresh</button>}</div>}
    <main className={styles.main}>
      <ol className={styles.chapters} aria-label="Life stages">{STAGES.map((s, i) => <li key={s.name} className={i === state.stage ? styles.currentChapter : ''} aria-current={i === state.stage ? 'step' : undefined}>{i < state.stage && <Check size={16} />} {s.name}</li>)}</ol>
      <div className={styles.gameGrid}>
        <section className={styles.moneyPanel} aria-label="Earn and save">
          <span>Balance</span><h2 className={styles.money}>SGD <span data-testid="balance">{money(state.cash)}</span></h2>
          <div className={styles.noteArea}>
            <button className={styles.note} disabled={blocked} aria-label={`Earn ${money(rate.tap)} SGD. Tap the note.`} data-testid="earn" onClick={earn}><EarnNotes cents={rate.tap} /></button>
            {floats.map(f => <span className={styles.floating} key={f.id} style={{ left: `${f.x}%` }}>{f.value}</span>)}
          </div>
          <p className={styles.tapHint}>{state.phone.open ? 'Paused' : `+SGD ${money(rate.tap)} per tap`}</p>
          <label className={styles.goal}>SGD 1,000,000<progress max={100} value={progress} aria-label="Savings toward one million" /></label>
        </section>
        <section className={styles.scenePanel} aria-label={`Current scene: ${stage.name}`}>
          <div className={styles.sceneArt}><Scene stage={state.stage} reducedMotion={reduced} /></div>
          <button className={styles.phoneDock} onClick={() => dispatch({ type: 'PHONE', open: true })} disabled={!state.started || recovering || state.finished} aria-label={`Open phone${unread ? `, ${unread} unread request` : ''}`}>
            <Smartphone size={24} /><span>{pending ? CASES[pending].sender : 'Phone'}</span>{unread > 0 && <b>{unread}</b>}
          </button>
        </section>
        <aside className={`${styles.sidePanel} ${shopOpen ? styles.shopExpanded : ''}`} aria-label="Upgrades and chapter progress">
          <button className={styles.mobileShopToggle} onClick={() => setShopOpen(!shopOpen)} aria-expanded={shopOpen}>Upgrades & progress <ChevronDown size={18} /></button>
          <div className={styles.shopContents}>
            <h2>{stage.upgrade}</h2><p>{state.upgrade ? 'Double tap earnings active.' : `Double tap earnings to SGD ${money(rate.tap * 2)}.`}</p>
            <button className={styles.primary} disabled={blocked || state.upgrade || state.cash < stage.cost * 100} onClick={() => dispatch({ type: 'UPGRADE' })}>{state.upgrade ? 'Upgrade owned' : `Upgrade — SGD ${shortMoney(stage.cost)}`}</button>
            <div className={styles.nextChapter}>
              <h3>{state.stage < 3 ? STAGES[state.stage + 1].name : 'Finish'}</h3>
              <label>{state.stage === 3 ? 'Savings' : 'Lifetime earnings'}<strong>{shortMoney((state.stage === 3 ? state.cash : state.gross) / 100)} / {shortMoney(stage.gate)}</strong><progress max={100} value={stageProgress} aria-label="Chapter money requirement" /></label>
              <p>Encounters <strong>{stageResolved(state)} / 2</strong></p>
              <p>{state.stage === 3 ? 'Results open automatically at the goal.' : 'Next stage starts automatically.'}</p>
            </div>
          </div>
        </aside>
      </div>
      <footer className={styles.pageFooter}><span>{resolvedCount(state)} / 8 encounters</span><span>{verified} verified decisions</span><span>{elapsed(state.activeMs)} active</span></footer>
    </main>
    <button className={styles.mobilePhone} onClick={() => dispatch({ type: 'PHONE', open: true })} disabled={!state.started || state.finished || recovering}><Smartphone size={20} /> Phone {unread > 0 && <b>{unread}</b>}</button>
    <div className={styles.announcement} role="status" aria-live="polite">{pending ? `New request from ${CASES[pending].sender}.` : ready ? 'Next chapter ready.' : ''}</div>
    {!state.started && !recovering && <Onboarding onStart={() => dispatch({ type: 'START' })} />}
    {state.phone.open && !state.finished && <Phone state={state} dispatch={dispatch} />}
    {state.finished && !modal && <Results state={state} onReset={() => setModal('reset')} onDownload={downloadSave} />}
    {modal && <Modal title={modal === 'reset' ? 'Start a new run?' : 'How to play'} onClose={() => setModal(null)}>{modal === 'reset' ? <><p>This replaces your saved run on this browser. You can download a copy first.</p><button className={styles.secondary} onClick={downloadSave}><Download size={16} /> Download save</button><div className={styles.modalActions}><button className={styles.secondary} onClick={() => setModal(null)}>Cancel</button><button className={styles.primary} onClick={reset}>Start fresh <RotateCcw size={16} /></button></div></> : <><p>Earn by tapping. Use the phone to investigate requests before committing.</p><ul><li>Tap the note or press Enter/Space while it is focused. Waiting earns nothing.</li><li>Requests interrupt tapping. Use the phone apps to investigate, make a decision, then read the outcome.</li><li>Complete each chapter’s situations and earning milestone, to move automatically to the next chapter.</li><li>Your decisions have fictional consequences. You can always keep going.</li></ul><p>This is a practice prototype, not proof that anyone is scam-proof. Amounts and earnings are game abstractions. Official Singapore sources, reviewed 4 November 2026, are linked in each debrief.</p><button className={styles.primary} onClick={() => setModal(null)}>Got it <Check size={16} /></button></>}</Modal>}
  </div>;
}

function Onboarding({ onStart }: { onStart: () => void }) {
  return <Modal title="Scamagotchi" onClose={onStart} onboarding><h2>Road to a million</h2><p>Tap the note to earn. When a request appears, investigate and decide. Reach SGD 1,000,000 across four life stages.</p><p>All money and interactions are simulated. Your progress saves on this browser.</p><button className={styles.primary} onClick={onStart}>Start game <ArrowRight size={18} /></button></Modal>;
}
function Modal({ title, onClose, children, onboarding = false }: { title: string; onClose: () => void; children: React.ReactNode; onboarding?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); useDialogFocus(ref, onClose);
  return <div className={styles.modalOverlay}><div className={`${styles.modal} ${onboarding ? styles.welcome : ''}`} ref={ref} role="dialog" aria-modal="true" aria-label={title}>{!onboarding && <div className={styles.modalHeading}><h2>{title}</h2><button aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>}{children}</div></div>;
}
function Results({ state: s, onReset, onDownload }: { state: GameState; onReset: () => void; onDownload: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, () => {});
  const results = ENCOUNTERS.map(e => ({ e, p: s.progress[e.id], r: s.progress[e.id].result! }));
  const verified = results.filter(x => x.r.verified).length;
  const personalLoss = results.filter(x => x.r.unsafe).reduce((sum, x) => sum + Math.max(0, -x.r.personalDelta), 0);
  const practice = results.find(x => !x.r.verified)?.e.habit ?? 'Keep using independently obtained contacts, even when a request looks familiar.';
  return <div className={styles.resultOverlay} ref={ref} role="dialog" aria-modal="true" aria-label="Your journey results"><section className={styles.results} aria-label="Your journey results"><span className={styles.resultMark}><Mascot mood="caught" /></span><h1 tabIndex={-1} data-dialog-focus>Results</h1><div className={styles.resultStats}><span><small>Savings</small><strong>SGD {money(s.cash)}</strong></span><span><small>Verified decisions</small><strong>{verified} / 8</strong></span><span><small>Active time</small><strong>{elapsed(s.activeMs)}</strong></span></div><div className={styles.resultLesson}><ShieldCheck size={24} /><div><strong>Practice next</strong><p>{practice}</p></div></div><div className={styles.resultSummary}><span>Personal scam losses: <b>SGD {money(personalLoss)}</b></span><span>Employer loss: <b>{results.reduce((sum, x) => sum + x.r.employerLoss, 0).toLocaleString()} company units</b></span><span>Legitimate opportunities declined/reported: <b>{results.filter(x => x.r.missed).length}</b></span></div><div className={styles.resultList}>{results.map(({ e, p, r }) => <details key={e.id}><summary><span>{STAGES[e.stage].chapter}</span><div><strong>{e.title}</strong><small>{r.verified ? 'Independent verification demonstrated' : r.unsafe ? 'An unsafe commitment · a chance to practise' : 'Outcome recorded · verification still to practise'}</small></div><ChevronDown size={18} /></summary><div><p><b>{e.scam ? 'Fraudulent request.' : 'Genuine request.'}</b> {r.decision === 'proceed' ? e.success : e.declined}</p><p>{e.lesson}</p><small>You opened: {p.evidence.map(id => e.evidence.find(v => v.id === id)?.title).join(', ') || 'no evidence records'}.</small>{e.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div></details>)}</div><p className={styles.resultDisclaimer}>Your result records this playthrough, not your real-world scam-detection ability. Active time excludes phone reading. A genuine family request can be politely declined. Your savings and opportunities were fictional.</p><div className={styles.resultButtons}><button className={styles.primary} onClick={onReset}>New game <RotateCcw size={16} /></button><button className={styles.secondary} onClick={onDownload}>Download my run <Download size={16} /></button></div></section></div>;
}



