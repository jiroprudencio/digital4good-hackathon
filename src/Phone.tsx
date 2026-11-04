import { useEffect, useRef, useState } from 'react';
import type { Dispatch, ReactNode, RefObject } from 'react';
import { ArrowDownLeft, ArrowUpRight, BatteryFull, Bell, BookOpen, Check, ChevronLeft, ChevronRight, ExternalLink, Home, Mail, PhoneCall, Search, Send, ShieldCheck, Signal, Smartphone, Users, Wallet, Wifi, X } from 'lucide-react';
import { CASES, money, STAGES } from './content';
import type { Decision, Evidence, PhoneApp } from './content';
import type { Action, GameState } from './game';
import { activeCase } from './game';
import { Mascot } from './Scene';
import styles from './Phone.module.css';

export function useDialogFocus(ref: React.RefObject<HTMLElement | null>, close: () => void, enabled = true, lockScroll = true) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!enabled) return;
    const before = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const oldOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    (root?.querySelector<HTMLElement>('[data-dialog-focus]') ?? root?.querySelector<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select, summary, [tabindex="0"]'))?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab' || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select, summary, [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); if (lockScroll) document.body.style.overflow = oldOverflow; if (before?.isConnected) before.focus(); };
  }, [ref, enabled, lockScroll]);
}
const apps: { id: PhoneApp; name: string; icon: typeof Mail; color: string }[] = [
  { id: 'messages', name: 'Messages', icon: Send, color: 'var(--telegram)' },
  { id: 'mail', name: 'Mail', icon: Mail, color: 'var(--surface)' },
  { id: 'calls', name: 'Calls', icon: PhoneCall, color: 'var(--phone-green)' },
  { id: 'contacts', name: 'Contacts', icon: Users, color: 'var(--contact-gray)' },
  { id: 'bank', name: 'Bank', icon: Wallet, color: 'var(--bank-blue)' },
];

export default function Phone({ state: s, dispatch, spotlight }: { state: GameState; dispatch: Dispatch<Action>; spotlight: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const openedRecord = useRef<HTMLElement>(null);
  const [confirm, setConfirm] = useState<Decision | null>(null);
  const [query, setQuery] = useState('');
  const confirmRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);
  const id = s.phone.caseId;
  const e = id ? CASES[id] : null;
  const p = id ? s.progress[id] : null;
  const close = () => { setConfirm(null); dispatch({ type: 'PHONE', open: false }); };
  useDialogFocus(ref, () => { if (confirm) setConfirm(null); else close(); }, spotlight, false);
  useEffect(() => {
    if (spotlight && matchMedia('(max-width: 760px)').matches) ref.current?.scrollIntoView({ block: 'start' });
    if (!s.phone.open) setConfirm(null);
  }, [spotlight, s.phone.open]);
  useEffect(() => {
    setQuery('');
    content.current?.scrollTo(0, 0);
    const heading = content.current?.querySelector<HTMLElement>('h2');
    if (heading && spotlight) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [s.phone.app, s.phone.caseId, s.phone.record === 'list', spotlight]);
  useEffect(() => {
    if (s.phone.record && s.phone.record !== 'list') {
      openedRecord.current?.focus({ preventScroll: true });
      openedRecord.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [s.phone.record]);
  useEffect(() => { if (confirm) { confirmRef.current?.scrollIntoView({ block: 'nearest' }); confirmRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); } }, [confirm]);
  const navigate = (app: PhoneApp) => { setConfirm(null); dispatch({ type: 'APP', app }); };
  const select = (caseId: string) => { setConfirm(null); dispatch({ type: 'CASE', id: caseId }); };
  const arrived = s.order.flat().filter(caseId => s.progress[caseId].arrived).map(caseId => CASES[caseId]);
  const record = e?.evidence.find(v => v.id === s.phone.record);
  const pending = activeCase(s);
  const inConversation = !!e && e.channel === s.phone.app && s.phone.record !== 'list';
  const isChat = s.phone.app === 'messages';
  const isMail = s.phone.app === 'mail';
  const matches = (value: string) => value.toLowerCase().includes(query.toLowerCase());
  const searchField = (label: string) => <label className={styles.search}><Search size={18} /><input aria-label={label} placeholder={label} value={query} onChange={event => setQuery(event.target.value)} /></label>;

  function requestCard(caseId: string) {
    const item = CASES[caseId], progress = s.progress[caseId];
    return <button className={styles.thread} key={caseId} onClick={() => select(caseId)}>
      <span className={styles.avatar}>{item.initials}</span><span className={styles.threadCopy}><strong>{item.sender}</strong><span>{item.title}</span><small>{item.preview}</small></span><span className={styles.threadMeta}><small>9:41</small>{!progress.read && <b aria-label="Unread">1</b>}{progress.result && <Check size={16} aria-label="Resolved" />}</span>
    </button>;
  }
  function evidenceButton(v: Evidence) {
    return <button className={styles.evidenceButton} key={v.id} onClick={() => dispatch({ type: 'INSPECT', id: v.id })}>
      <span className={styles.evidenceIcon}>{v.call ? <PhoneCall size={18} /> : <BookOpen size={18} />}</span><span><strong>{v.call && !v.title.startsWith('Call ') ? `${v.id === 'incoming' ? 'Answer' : 'Call'} ${v.title}` : v.title}</strong><small>{v.origin}</small></span><ChevronRight size={18} />
    </button>;
  }
  function context() {
    if (!e) return <Empty icon={<Smartphone />} text="Your phone is quiet for now." detail="Keep tapping. Requests arrive as you play." />;
    return <div className={styles.context}><small>Looking into</small><strong>{e.title}</strong><button onClick={() => select(e.id)}>Return to request <ArrowUpRight size={14} /></button></div>;
  }
  function decisionPanel() {
    if (!e || !p || p.result) return null;
    const affordable = s.cash >= e.cost * 100;
    return <section className={styles.decisions} aria-label="Make a decision">
      <h3>Your decision</h3><p className={styles.decisionSubject}>{e.sender}</p>
      <button className={styles.primary} disabled={!affordable} onClick={() => setConfirm('proceed')}>{e.proceed} {e.cost > 0 && <span>SGD {money(e.cost * 100)}</span>}</button>
      {!affordable && <p className={styles.hint}>You need SGD {money(e.cost * 100 - s.cash)} more. You can decline this request without paying.</p>}
      <div className={styles.twoButtons}><button className={styles.declineButton} onClick={() => setConfirm('decline')}>{e.stage === 2 ? 'Hold for review' : 'Decline politely'}</button><button className={styles.reportButton} onClick={() => setConfirm('report')}>Report concern</button></div>
      {confirm && <div className={styles.confirm} ref={confirmRef} role="group" aria-label="Confirm your decision">
        <strong>{confirm === 'proceed' ? 'Confirm this action?' : confirm === 'report' ? 'Report this request?' : 'Leave this request here?'}</strong>
        <p>{confirm === 'proceed' ? e.stage === 2 ? 'Submit 5,000 company units to the revised account. This uses employer funds, not your personal savings.' : e.cost ? `You authorise SGD ${money(e.cost * 100)} from your savings.` : 'Accept the role, complete a simulated shift and submit the hours for approval.' : confirm === 'report' ? 'This records your concern inside the game. No real report is sent.' : 'You can move on without making a payment. This choice ends the encounter.'}</p>
        <div className={styles.twoButtons}><button onClick={() => setConfirm(null)}>Keep looking</button><button className={styles.primary} onClick={() => { dispatch({ type: 'RESOLVE', decision: confirm }); setConfirm(null); }}>Confirm {confirm === 'proceed' ? 'action' : 'decision'}</button></div>
      </div>}
    </section>;
  }
  function feedback() {
    if (!e || !p?.result) return null;
    const r = p.result;
    return <div className={styles.feedback}>
      <div className={styles.reveal}>{e.scam ? <Mascot mood={r.unsafe ? 'smug' : 'caught'} /> : <div className={styles.genuineStamp}><Check size={35} /></div>}<small>Outcome</small><h2>{e.scam ? r.unsafe ? 'Fraudulent request' : 'Fraudulent request' : 'Genuine request'}</h2><p>{e.scam ? 'Scamagotchi was behind this request.' : e.stage === 3 ? 'The request really came from your family.' : 'This request was legitimate.'}</p></div>
      <section className={styles.feedbackBlock}><h3>What happened</h3><p>{r.decision === 'proceed' ? e.success : r.decision === 'report' ? e.scam ? 'You reported the suspicious request inside the game and did not send money.' : 'You reported a genuine request. No real report was sent. Checking the independent evidence could have clarified its origin.' : e.declined}</p>{r.personalDelta !== 0 && <span className={r.personalDelta > 0 ? styles.gain : styles.loss}>{r.personalDelta > 0 ? '+' : '−'}SGD {money(Math.abs(r.personalDelta))}</span>}{r.employerLoss > 0 && <span className={styles.loss}>Employer loss: 5,000 company units · personal savings unchanged</span>}</section>
      <section className={styles.feedbackBlock}><h3>What you checked</h3><p>{r.verified ? 'You checked the decisive evidence through a separate route and made a safe decision.' : p.evidence.includes(e.decisive) ? 'You found the independent evidence, but your final decision did not follow it.' : 'You did not check the decisive independent source before deciding. A safe outcome alone does not demonstrate verification.'}</p>{r.verified && <span className={styles.skill}><ShieldCheck size={16} /> Verification demonstrated</span>}</section>
      <section className={styles.feedbackBlock}><h3>Why</h3><p>{e.evidence.find(item => item.id === e.decisive)?.body.join(' ')}</p><p>{e.lesson}</p></section>
      <section className={styles.lesson}><h3>Practice next</h3><p>{e.habit}</p></section>
      {r.unsafe && <p className={styles.recovery}>In a real incident, contact your bank promptly and make a police report. For a workplace payment, alert finance/security immediately. Recovery is not guaranteed. Here, your earning ability remains intact so you can continue.</p>}
      <details className={styles.sources}><summary>Sources</summary><small>Reviewed {e.reviewDate}. Fictional people, messages and amounts; official sources inform the mechanisms.</small>{e.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={12} /></a>)}</details>
      <button className={styles.primary} onClick={() => dispatch({ type: 'ACK' })}>Continue <ArrowUpRight size={16} /></button>
    </div>;
  }
  let body: ReactNode;
  if (s.phone.app === 'feedback') body = feedback();
  else if (s.phone.app === 'notifications') body = <section className={styles.notificationCentre} aria-label="Notification Centre">
    <h2>Notification Centre</h2>
    {arrived.length ? [...arrived].reverse().map(item => <button key={item.id} className={styles.notificationCard} onClick={() => select(item.id)}>
      <span className={styles.notificationApp}>{item.channel === 'mail' ? <Mail size={18} /> : <Send size={18} />} {item.channel === 'mail' ? 'Mail' : 'Messages'}<small>{s.progress[item.id].result ? 'Resolved' : 'Needs decision'}</small></span>
      <strong>{item.sender}</strong><span>{item.preview}</span>
    </button>) : <Empty icon={<Bell />} text="No notifications" detail="New requests will appear here." />}
  </section>;
  else if (s.phone.app === 'home') body = <>
    <div className={styles.homeTitle}><h2>Apps</h2></div>
    <div className={styles.appGrid}>{apps.map(app => { const Icon = app.icon; const badge = app.id === 'messages' || app.id === 'mail' ? arrived.filter(c => c.channel === app.id && !s.progress[c.id].read).length : app.id === 'calls' && e?.stage === 2 && !p?.evidence.includes('incoming') && !p?.result ? 1 : 0; return <button key={app.id} aria-label={app.name} onClick={() => navigate(app.id)}><span style={{ background: app.color }}>{app.id === 'mail' ? <GmailIcon /> : <Icon size={31} strokeWidth={1.7} />}{badge > 0 && <b>{badge}</b>}</span>{app.name}</button>; })}</div>
  </>;
  else if (s.phone.app === 'bank') body = <><h2>Your savings</h2><div className={styles.balance}><small>Simulated SGD</small><strong>SGD {money(s.cash)}</strong><p>Posted funds, including your game earnings.</p></div><h3 className={styles.sectionTitle}>Transactions</h3><div className={styles.transaction}><ArrowDownLeft /><span><strong>Lifetime game earnings</strong><small>Tap earnings · all chapters</small></span><b>+{money(s.gross)}</b></div>{[...s.ledger].reverse().map(l => <div className={styles.transaction} key={l.id}>{l.cents < 0 ? <ArrowUpRight /> : <ArrowDownLeft />}<span><strong>{l.title}</strong><small>{STAGES[l.stage].name}</small></span><b>{l.cents < 0 ? '−' : '+'}{money(Math.abs(l.cents))}</b></div>)}<p className={styles.archiveHint}>This ledger shows posted transactions in your personal account. Company invoice payments use a separate employer account.</p></>;
  else if ((isChat || isMail) && !inConversation) body = <>
    <h2>{isMail ? 'Inbox' : 'Chats'}</h2>{searchField(isMail ? 'Search in mail' : 'Search chats')}
    {arrived.filter(c => c.channel === s.phone.app && matches(`${c.sender} ${c.title}`)).map(c => requestCard(c.id))}
    {e?.evidence.filter(v => v.app === s.phone.app && matches(v.title)).map(evidenceButton)}
    {record && <EvidenceCard evidence={record} focusRef={openedRecord} />}
    {isMail && s.progress['school-b'].result?.decision === 'proceed' && <details className={styles.purchases}><summary>LoopMarket: Order LM-642</summary><p>Studio headphones, SGD 100. Purchased through Buy checkout with PayNow. Delivered as described.</p></details>}
    {!arrived.some(c => c.channel === s.phone.app) && !e?.evidence.some(v => v.app === s.phone.app) && <Empty icon={<Mail />} text="Nothing here yet." detail="New requests arrive as you play." />}
    {e && <button className={styles.return} onClick={() => select(e.id)}>Return to request <ArrowUpRight size={16} /></button>}
  </>;
  else if ((s.phone.app === 'messages' || s.phone.app === 'mail') && e && p) body = <>
    {isMail ? <><h2>{e.title}</h2><div className={styles.threadHeading}><span className={styles.avatar}>{e.initials}</span><span><strong>{e.sender}</strong><small>to me <span aria-hidden="true">⌄</span></small></span><small>9:41</small></div></> : <div className={styles.chatDate}>Today</div>}
    <div className={isMail ? styles.mailBody : styles.bubbles}>{e.messages.map((m, i) => e.stage === 3 && i === 0 ? <div key={i} className={styles.earlierChat}><small>Earlier messages</small><p>“Dinner on Sunday?”</p><p className={styles.sentBubble}>“See you then!”</p><span>Today</span></div> : <p key={i}>{m}{isChat && <small className={styles.messageTime}>9:41</small>}</p>)}</div>
    {e.id === 'uni-a' && !p.result && s.phone.open && <button className={styles.evidenceButton} disabled={p.samplePaid} onClick={() => dispatch({ type: 'SAMPLE' })}><Wallet size={20} /><span><strong>{p.samplePaid ? 'Introductory task complete' : 'Try the introductory task'}</strong><small>{p.samplePaid ? 'SGD 50 received. You can open Bank to check.' : 'Complete one simulated task for SGD 50'}</small></span></button>}
    {e.evidence.filter(v => v.app === s.phone.app).map(evidenceButton)}
    {record && <EvidenceCard evidence={record} focusRef={openedRecord} />}
    {p.result && <button className={styles.primary} onClick={() => navigate('feedback')}>Read outcome</button>}
    <details className={styles.conversationHistory}><summary>Other conversations</summary>{arrived.filter(c => c.channel === s.phone.app && c.id !== e.id).map(c => requestCard(c.id))}</details>
  </>;
  else body = <>
    <h2>{s.phone.app === 'calls' ? 'Recents' : apps.find(app => app.id === s.phone.app)?.name}</h2>{searchField(s.phone.app === 'calls' ? 'Search calls' : 'Search contacts')}{context()}
    {e && <>
      {s.phone.app === 'contacts' && <p className={styles.archiveHint}>Saved contacts</p>}
      {e.evidence.filter(v => v.app === s.phone.app && matches(v.title)).map(evidenceButton)}
      {record && <EvidenceCard evidence={record} focusRef={openedRecord} />}
      {!e.evidence.some(v => v.app === s.phone.app) && <Empty icon={s.phone.app === 'calls' ? <PhoneCall /> : <BookOpen />} text={s.phone.app === 'calls' ? 'No incoming calls for this request.' : 'No saved record for this request here.'} detail={s.phone.app === 'calls' ? 'Calls you make from Contacts will be recorded below.' : 'Your other apps remain available from the home screen.'} />}
    </>}
    {s.phone.app === 'calls' && s.calls.length > 0 && <><h3 className={styles.sectionTitle}>Call history</h3>{[...s.calls].reverse().filter(c => matches(CASES[c.caseId].evidence.find(v => v.id === c.evidenceId)!.title)).map(c => { const call = CASES[c.caseId].evidence.find(v => v.id === c.evidenceId)!; return <details key={`${c.caseId}-${c.evidenceId}`} className={styles.callHistory}><summary><PhoneCall size={16} /> {call.title}<small>{c.evidenceId === 'incoming' ? 'Incoming' : 'Outgoing'}</small></summary><EvidenceCard evidence={call} /></details>; })}</>}
    {e && <button className={styles.return} onClick={() => select(e.id)}>Return to request <ArrowUpRight size={16} /></button>}
  </>;

  return <div className={styles.panel} data-testid="phone" data-theme="ios" ref={ref} role={spotlight ? 'dialog' : 'region'} aria-modal={spotlight || undefined} aria-label="Your simulated phone">
    <div className={styles.phone} data-app={s.phone.app}>
      <button className={styles.status} aria-label="Open notification centre from top bar" title="Notifications (swipe down)" onClick={() => navigate('notifications')} onPointerDown={event => { swipeStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={event => { if (swipeStart.current !== null && event.clientY - swipeStart.current > 28) navigate('notifications'); swipeStart.current = null; }} onPointerCancel={() => { swipeStart.current = null; }}><strong>9:41</strong><span className={styles.camera} /><span aria-hidden="true"><Signal size={15} /><Wifi size={15} /><BatteryFull size={20} /></span></button>
      <header className={styles.header}>
        {inConversation ? <button aria-label={isMail ? 'Back to inbox' : 'Back to chats'} onClick={() => { setConfirm(null); dispatch({ type: 'APP', app: s.phone.app, list: true }); }}><ChevronLeft size={23} />{isChat && 'Chats'}</button> : <button aria-label="Phone home" onClick={() => { setConfirm(null); dispatch({ type: 'BACK' }); }}><Home size={20} /></button>}
        <strong>{inConversation ? isChat ? e?.sender : 'Mail' : s.phone.app === 'home' ? 'Your phone' : s.phone.app === 'notifications' ? 'Notifications' : s.phone.app === 'feedback' ? 'Outcome' : apps.find(app => app.id === s.phone.app)?.name}</strong>
        <button className={styles.notificationButton} aria-label="Open notification centre" onClick={() => navigate('notifications')}><Bell size={20} />{pending && <span className={styles.notificationBadge}>1</span>}</button>
      </header>
      <div className={styles.content} data-conversation={inConversation || undefined} ref={content}>{body}</div>
      {(s.phone.app === 'calls' || s.phone.app === 'contacts') && <nav className={styles.phoneTabs} aria-label="Phone sections"><button aria-current={s.phone.app === 'calls' ? 'page' : undefined} onClick={() => navigate('calls')}><PhoneCall size={21} />Recents</button><button aria-current={s.phone.app === 'contacts' ? 'page' : undefined} onClick={() => navigate('contacts')}><Users size={21} />Contacts</button></nav>}
      <footer className={styles.footer}><button aria-label={inConversation ? 'Phone home' : 'Open apps'} onClick={() => { setConfirm(null); dispatch({ type: 'BACK' }); }}><Home size={17} /> Apps</button>{pending && s.phone.open ? import.meta.env.DEV ? <button className={styles.devExit} onClick={() => dispatch({ type: 'DEV_EXIT' })}>Exit request (dev) <X size={16} /></button> : <span>Resolve to continue</span> : s.phone.open ? <button onClick={close}>Resume tapping <ArrowUpRight size={16} /></button> : pending ? <button onClick={() => select(pending)}>Resume request</button> : null}</footer>
      <div className={styles.homeIndicator} aria-hidden="true" />
    </div>
    {pending && s.phone.open && <aside className={styles.decisionDock} data-testid="decision-card" aria-label="Request decisions">
      {p && !p.result ? decisionPanel() : <><h3>Request waiting</h3><p>{CASES[pending].sender}</p><button className={styles.primary} onClick={() => select(pending)}>Return to request <ArrowUpRight size={16} /></button></>}
    </aside>}
  </div>;
}
function GmailIcon() {
  return <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true"><path d="M3 23V5l14 11L31 5v18" fill="none" stroke="var(--gmail-green)" strokeWidth="6" strokeLinejoin="round" /><path d="M3 23V5" stroke="var(--gmail-blue)" strokeWidth="6" /><path d="M3 5l14 11L31 5" fill="none" stroke="var(--gmail-red)" strokeWidth="6" strokeLinejoin="round" /><path d="M31 5v7" stroke="var(--gmail-yellow)" strokeWidth="6" /></svg>;
}
function EvidenceCard({ evidence, focusRef }: { evidence: Evidence; focusRef?: RefObject<HTMLElement | null> }) {
  return <section className={styles.record} ref={focusRef} tabIndex={focusRef ? -1 : undefined} aria-label={evidence.title}><small>{evidence.call ? 'Call transcript' : 'Record'}</small><h3>{evidence.title}</h3><span className={styles.origin}>{evidence.origin}</span>{evidence.body.map((line, i) => <p key={i}>{line}</p>)}</section>;
}
function Empty({ icon, text, detail }: { icon: ReactNode; text: string; detail: string }) {
  return <div className={styles.empty}>{icon}<strong>{text}</strong><p>{detail}</p></div>;
}

