import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, Dispatch, ReactNode } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, BatteryFull, Bell, Building2, Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, FileText, Flag, Home, Mail, MessageCircle, MoreHorizontal, PhoneCall, PhoneOff, Search, Send, ShieldCheck, Signal, Smartphone, Users, Wallet, Wifi, X } from 'lucide-react';
import { CASES, money, STAGES, personalise } from './content';
import type { Decision, Evidence, PhoneApp } from './content';
import type { Action, GameState } from './game';
import { activeCase, encounterChannel } from './game';
import { STAGE_PROFILES } from './profiles';
import { Mascot } from './Scene';
import Character from './Character';
import VoicemailAudio from './VoicemailAudio';
import styles from './Phone.module.css';

export function useDialogFocus(ref: React.RefObject<HTMLElement | null>, close: () => void, enabled = true, lockScroll = true) {
  const closeRef = useRef(close); closeRef.current = close;
  // Capture the opener before React makes its surrounding content inert.
  // The effect retains this render's value until the dialog closes.
  const focusBeforeCommit = typeof document === 'undefined' ? null : document.activeElement as HTMLElement | null;
  useEffect(() => {
    if (!enabled) return;
    const before = focusBeforeCommit, root = ref.current;
    const oldOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    (root?.querySelector<HTMLElement>('[data-dialog-focus]') ?? root?.querySelector<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select, summary, [tabindex="0"]'))?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab' || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select, summary, [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1]; if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); if (lockScroll) document.body.style.overflow = oldOverflow; if (before?.isConnected) before.focus(); };
  }, [ref, enabled, lockScroll]);
}
const apps: { id: PhoneApp; name: string; icon: typeof Mail; color: string }[] = [
  { id: 'messages', name: 'Messages', icon: Send, color: '#268bd2' },
  { id: 'mail', name: 'Mail', icon: Mail, color: '#fff' },
  { id: 'calls', name: 'Calls', icon: PhoneCall, color: '#30bc58' },
  { id: 'contacts', name: 'Contacts', icon: Users, color: '#93949a' },
  { id: 'bank', name: 'Bank', icon: Wallet, color: '#2364ab' },
];
type Contact = (typeof STAGE_PROFILES)[number]['contacts'][number];
export default function Phone({ state: s, dispatch, spotlight }: { state: GameState; dispatch: Dispatch<Action>; spotlight: boolean }) {
  const ref = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null), swipeStart = useRef<number | null>(null);
  const replyRef = useRef<HTMLElement>(null), replyReturn = useRef<HTMLButtonElement | null>(null);
  const [confirm, setConfirm] = useState<Decision | null>(null), [query, setQuery] = useState('');
  const [senderOpen, setSenderOpen] = useState(false), [contactId, setContactId] = useState<string | null>(null);
  const [contactCall, setContactCall] = useState(false), [replyOpen, setReplyOpen] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  const scrollPositions = useRef(new Map<string, number>());
  const requestedContact = useRef<string | null>(null);
  const locationKey = s.phone.app + ':' + s.phone.caseId + ':' + s.phone.record + ':' + (s.phone.app === 'contacts' ? contactId : '');
  const id = s.phone.caseId, e = id ? CASES[id] : null, p = id ? s.progress[id] : null;
  const pending = activeCase(s), waiting = pending ? CASES[pending] : null;
  const profile = STAGE_PROFILES[s.stage];
  const contacts = [...new Map(STAGE_PROFILES.slice(0, s.stage + 1).flatMap(stage => stage.contacts).map(c => [c.id, c])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const selectedContact = contacts.find(c => c.id === contactId);
  const arrived = s.order.flat().filter(caseId => s.progress[caseId].arrived).map(caseId => CASES[caseId]);
  const actualChannel = e ? encounterChannel(s, e.id) : null;
  const inConversation = !!e && actualChannel === s.phone.app && s.phone.record !== 'list';
  const isChat = s.phone.app === 'messages', isMail = s.phone.app === 'mail';
  const incoming = inConversation && s.phone.app === 'calls' && p?.callStatus === 'ringing';
  const liveCall = inConversation && s.phone.app === 'calls' && p?.callStatus === 'answered' && !p.result;
  const record = e?.evidence.find(v => v.id === s.phone.record);
  const archivedRecord = record && /Earlier|Archived|Original|Existing/i.test(record.origin) && record.app === s.phone.app ? record : null;
  const t = (value: string) => personalise(value, s.character.name);
  const matches = (value: string) => t(value).toLocaleLowerCase().includes(query.toLocaleLowerCase());
  const close = () => { setConfirm(null); dispatch({ type: 'PHONE', open: false }); };
  useDialogFocus(ref, () => { if (confirm) setConfirm(null); else if (contactId) { setContactId(null); setContactCall(false); } else close(); }, spotlight, false);
  useEffect(() => {
    if (spotlight && matchMedia('(max-width: 760px)').matches) ref.current?.scrollIntoView({ block: 'start' });
    if (!s.phone.open) setConfirm(null);
  }, [spotlight, s.phone.open]);
  useEffect(() => {
    setQuery(''); setSenderOpen(false); setReplyOpen(false); setHeaderMenu(false);
    const restored = s.phone.app === 'contacts' && s.phone.record ? e?.evidence.find(v => v.id === s.phone.record && v.call) : undefined;
    setContactId(requestedContact.current ?? restored?.contactId ?? null); requestedContact.current = null; setContactCall(Boolean(restored));
  }, [s.phone.app, s.phone.caseId]);
  useEffect(() => {
    const node = content.current;
    if (node) node.scrollTop = scrollPositions.current.get(locationKey) ?? 0;
  }, [locationKey]);
  useEffect(() => {
    if (!s.phone.record || s.phone.record === 'list') return;
    const opened = content.current?.querySelector<HTMLElement>('[data-open-record]');
    opened?.scrollIntoView({ block: 'nearest' }); opened?.focus({ preventScroll: true });
  }, [s.phone.record]);
  useEffect(() => {
    if (!confirm) return;
    confirmRef.current?.scrollIntoView({ block: 'nearest' });
    confirmRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [confirm]);
  useEffect(() => {
    if (!replyOpen) return;
    replyRef.current?.scrollIntoView({ block: 'nearest' });
    replyRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, [replyOpen]);
  const toggleReply = (button: HTMLButtonElement) => { replyReturn.current = button; setReplyOpen(!replyOpen); };
  const closeReply = () => { setReplyOpen(false); replyReturn.current?.focus(); };
  const rememberScroll = () => { if (content.current) scrollPositions.current.set(locationKey, content.current.scrollTop); };
  const navigate = (app: PhoneApp, list = false) => { rememberScroll(); setConfirm(null); dispatch({ type: 'APP', app, list }); };
  const select = (caseId: string) => { rememberScroll(); setConfirm(null); dispatch({ type: 'CASE', id: caseId }); };
  const inspect = (v: Evidence) => { dispatch({ type: 'INSPECT', id: v.id }); };
  const returnToRequest = () => { if (pending) select(pending); else if (id) select(id); };
  const openContact = (contact: string) => { rememberScroll(); setHeaderMenu(false); setContactId(contact); setContactCall(false); };
  const backToContacts = () => { rememberScroll(); setHeaderMenu(false); setContactId(null); setContactCall(false); navigate('contacts'); };
  function searchField(label: string) { return <label className={styles.search}><Search size={18} /><input aria-label={label} placeholder={label} value={query} onChange={ev => setQuery(ev.target.value)} /></label>; }
  function requestCard(caseId: string) {
    const item = CASES[caseId], progress = s.progress[caseId];
    return <button className={styles.thread} key={caseId} onClick={() => select(caseId)}>
      <span className={styles.avatar}>{item.initials}</span><span className={styles.threadCopy}><strong>{t(item.sender)}</strong>{item.channel === 'mail' && <span>{t(item.title)}</span>}<small>{t(item.preview)}</small></span>
      <span className={styles.threadMeta}><small>9:41</small>{!progress.read && <i aria-label="Unread" />}{progress.result && <Check size={15} aria-label="Resolved" />}</span>
    </button>;
  }
  function callHistoryRow(caseId: string) {
    const item = CASES[caseId], progress = s.progress[caseId];
    if (!progress.result && progress.callStatus !== 'declined') return <button className={styles.thread} key={caseId} onClick={() => select(caseId)}><PhoneCall size={20} /><span className={styles.threadCopy}><strong>{t(item.sender)}</strong><small>{progress.callStatus === 'answered' ? 'Call in progress' : 'Incoming call'}</small></span><ChevronRight size={18} /></button>;
    return <details className={styles.callHistory} key={caseId} onToggle={event => { if (!event.currentTarget.open) event.currentTarget.querySelector('audio')?.pause(); }}>
      <summary><PhoneCall size={18} /><span><strong>{t(item.sender)}</strong><small>{progress.callStatus === 'declined' ? 'Missed / ended call' : 'Call recording'}</small></span><ChevronDown size={16} /></summary>
      <VoicemailAudio key={locationKey + ':' + caseId} caseId={caseId} transcript={(item.callTranscript ?? item.messages).map(t)} paused={Boolean(pending && !s.phone.open)} />
      <button className={styles.textButton} onClick={() => { select(caseId); if (progress.result && progress.callStatus !== 'declined') navigate('feedback'); }}>{progress.result && progress.callStatus !== 'declined' ? 'Read outcome' : 'Open conversation'}<ChevronRight size={16} /></button>
    </details>;
  }
  function evidenceRow(v: Evidence) {
    return <button key={v.id} className={styles.documentRow} onClick={() => inspect(v)}>
      <span className={styles.fileIcon}><FileText size={22} /></span><span><strong>{t(v.title)}</strong><small>{t(v.origin)}</small></span><ChevronRight size={18} />
    </button>;
  }
  function recordCard(v: Evidence) {
    return <section className={styles.record} data-open-record tabIndex={-1} aria-label={v.title}><small>{v.call ? 'Call transcript' : 'Record'}</small><h3>{t(v.title)}</h3><span className={styles.origin}>{t(v.origin)}</span>{v.body.map((line, n) => <p key={n}>{t(line)}</p>)}</section>;
  }
  function contactAvatar(c: Contact, className = styles.smallAvatar) {
    if (['organiser', 'finance', 'employer', 'courier', 'official'].includes(c.id)) return <span className={className}><Building2 size={className === styles.contactPortrait ? 42 : 21} aria-hidden="true" /></span>;
    const stage = ['ravi', 'mei'].includes(c.id) ? 3 : ['maya', 'wei'].includes(c.id) ? 0 : 2;
    const gender = ['maya', 'careers', 'alyssa', 'mei'].includes(c.id) ? 'woman' : 'man';
    return <Character character={{ name: c.name, gender, skinTone: c.id === 'ravi' ? 3 : c.id === 'maya' ? 4 : 2 }} stage={stage} portrait className={className} />;
  }
  function contactEvidence(c: Contact) { return e?.evidence.find(v => v.contactId === c.id && v.call); }
  function contactPage(c: Contact) {
    const v = contactEvidence(c);
    return <div className={styles.contactPage}>
      <div className={styles.contactHero}>{contactAvatar(c, styles.contactPortrait)}<h2>{c.name}</h2><p>{c.relationship}</p></div>
      <div className={styles.contactActions}><button aria-label={'Call ' + c.name} onClick={() => { setContactCall(true); if (v) inspect(v); }}><PhoneCall size={22} /><span>Call</span></button>{c.email && <button aria-label={'Email ' + c.name} onClick={() => navigate('mail', true)}><Mail size={22} /><span>Mail</span></button>}</div>
      <div className={styles.contactField}><small>mobile / office</small><span>{c.phone}</span></div>
      {c.email && <div className={styles.contactField}><small>email</small><span>{c.email}</span></div>}
      <div className={styles.contactField}><small>Notes</small><p>{c.note}</p></div>
      {contactCall && (v ? recordCard(v) : <section className={styles.record} aria-live="polite"><small>Call transcript</small><p>{c.name}: Hi {s.character.name}. Good to hear from you.</p><p>{e ? 'I do not have information about that request. You can check with the person or organisation concerned.' : 'Nothing new at the moment. Speak soon.'}</p></section>)}
    </div>;
  }
  function myCard() {
    return <div className={styles.myCard}>
      <div className={styles.contactHero}><Character character={s.character} stage={s.stage} portrait className={styles.myAvatar} /><h2>{s.character.name}</h2><p>My Card</p></div>
      <section className={styles.profileGroup}><h3>{profile.role}</h3>{profile.organisation && <p>{profile.organisation}</p>}<p>Age {profile.age}</p></section>
      <section className={styles.profileGroup}><h3>Right now</h3>{profile.goals.map(goal => <p key={goal}>{t(goal)}</p>)}</section>
      <section className={styles.profileGroup}><h3>People</h3>{profile.contacts.map(c => <button className={styles.contactRow} key={c.id} onClick={() => { requestedContact.current = c.id; navigate('contacts'); }}>{contactAvatar(c)}<span><strong>{c.name}</strong><small>{c.relationship}</small></span><ChevronRight size={18} /></button>)}</section>
    </div>;
  }
  function decisions() {
    if (!e || !p || p.result || e.id !== pending) return <><h3>Request waiting</h3><p>{waiting?.sender}</p><button className={styles.primary} onClick={returnToRequest}>Return to request</button></>;
    if (e.channel === 'calls' && p.callStatus === 'ringing') return <><h3>Incoming call</h3><p>{t(e.sender)}</p><p>Answer or decline on your phone.</p>{!incoming && <button className={styles.primary} onClick={() => select(e.id)}>Return to call</button>}</>;
    const affordable = s.cash >= e.cost * 100;
    return <section aria-label="Make a decision">
      <h3>{t(e.sender)}’s request</h3>
      <button className={styles.primary} disabled={!affordable} onClick={() => setConfirm('proceed')}>{t(e.proceed)}{e.cost > 0 && !/S\$|\bSGD\b/.test(e.proceed) && <small>S${money(e.cost * 100)}</small>}</button>
      {!affordable && <p className={styles.hint}>You need S${money(e.cost * 100 - s.cash)} more. You can decline without paying.</p>}
      <button className={styles.danger} onClick={() => setConfirm('decline')}><X size={18} aria-hidden="true" /> Decline request</button>
      <button className={styles.secondary} onClick={() => { setConfirm(null); navigate('home'); }}><Search size={18} aria-hidden="true" /> Keep investigating</button>
      <button className={styles.report} onClick={() => setConfirm('report')}><Flag size={18} aria-hidden="true" /> Report concern</button>
      {confirm && <div className={styles.confirm} ref={confirmRef} role="group" aria-label="Confirm your decision">
        <strong>{confirm === 'proceed' ? 'Confirm this action?' : confirm === 'report' ? 'Report this request?' : 'Decline this request?'}</strong>
        <p>{confirm === 'proceed' ? t(e.confirmText) : confirm === 'report' ? 'This records your concern in the game. No real report is sent.' : 'This ends the encounter without accepting the request.'}</p>
        <div className={styles.confirmActions}><button className={styles.secondary} onClick={() => setConfirm(null)}>Cancel</button><button className={confirm === 'decline' ? styles.dangerConfirm : styles.primary} onClick={() => { dispatch({ type: 'RESOLVE', decision: confirm }); setConfirm(null); }}>Confirm {confirm === 'proceed' ? 'action' : 'decision'}</button></div>
      </div>}
      {!confirm && <small className={styles.investigationHint}>You can still use your phone.</small>}
    </section>;
  }
  function feedback() {
    if (!e || !p?.result) return null;
    const r = p.result;
    return <div className={styles.feedback}>
      <div className={styles.reveal}><Mascot mood={e.scam ? r.unsafe ? 'smug' : 'caught' : 'caught'} /><h2>{e.scam ? 'Scamagotchi’s scheme' : 'A genuine request'}</h2><p>{e.scam ? 'Scamagotchi was behind this request.' : 'This request was real. Scamagotchi did not get this one.'}</p></div>
      <section className={styles.feedbackBlock}><h3>What happened</h3><p>{t(r.decision === 'proceed' ? e.success : r.decision === 'report' ? e.scam ? 'You reported the request and did not send money.' : 'You reported a genuine request. No real report was sent.' : e.declined)}</p>
        {r.personalDelta !== 0 && <strong className={r.personalDelta > 0 ? styles.gain : styles.loss}>{r.personalDelta > 0 ? '+' : '−'}S${money(Math.abs(r.personalDelta))}</strong>}
        {r.employerLoss > 0 && <p className={styles.loss}>Employer loss: S${money(r.employerLoss * 100)}. Your savings are unchanged.</p>}
      </section>
      <section className={styles.feedbackBlock}><h3>Evidence that mattered</h3><p>{t(e.evidence.find(v => v.id === e.decisive)?.body.join(' ') ?? '')}</p><p>{t(e.lesson)}</p></section>
      <section className={styles.feedbackBlock}><h3>Your checks</h3>{r.inspectedEvidence.length ? <ul>{r.inspectedEvidence.map(key => <li key={key}>{t(e.evidence.find(v => v.id === key)?.title ?? key)}</li>)}</ul> : <p>You decided without opening any supporting records.</p>}<p>{r.verified ? 'You checked the independent evidence before making a safe decision.' : r.inspectedEvidence.includes(e.decisive) ? 'You found the independent evidence, but acted against it.' : 'You did not check the decisive independent source before deciding.'}</p>{r.verified && <span className={styles.skill}><ShieldCheck size={17} /> Verification demonstrated</span>}</section>
      <section className={styles.feedbackBlock}><h3>Next time</h3><p>{t(e.habit)}</p></section>
      {r.unsafe && <p className={styles.recovery}>In a real incident, contact your bank promptly and make a police report. If work is involved, alert your finance or security team. Recovery is not guaranteed.</p>}
      <details className={styles.sources}><summary>Sources</summary><small>Reviewed {e.reviewDate}. Fictional characters and requests.</small>{e.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={13} /></a>)}</details>
      <button className={styles.primary} onClick={() => dispatch({ type: 'ACK' })}>Continue <ArrowUpRight size={18} /></button>
    </div>;
  }
  function callScreen() {
    if (!e || !p) return null;
    return <div className={styles.callScreen}>
      <span className={styles.callerPortrait}><Users size={56} /></span><h2>{t(e.sender)}</h2><p>{incoming ? 'Incoming call' : 'Call in progress'}</p>
      {liveCall && <VoicemailAudio key={locationKey} caseId={e.id} transcript={(e.callTranscript ?? e.messages).map(t)} dark paused={!s.phone.open} />}
    </div>;
  }
  let body: ReactNode;
  if (s.phone.app === 'feedback') body = feedback();
  else if (s.phone.app === 'profile') body = myCard();
  else if (incoming || liveCall) body = callScreen();
  else if (s.phone.app === 'notifications') body = <section className={styles.notificationCentre} aria-label="Notification Centre"><div className={styles.lockClock}><h1>9:41</h1><p>Today</p></div><h2>Notification Centre</h2>{arrived.length ? [...arrived].reverse().map(item => {
    const channel = encounterChannel(s, item.id);
    return <button className={styles.notificationCard} key={item.id} onClick={() => select(item.id)}>
      <span className={styles.notificationIcon} data-channel={channel} aria-hidden="true">{channel === 'mail' ? <GmailIcon /> : channel === 'calls' ? <PhoneCall size={24} /> : <Send size={24} />}</span>
      <span className={styles.notificationCopy}><span className={styles.notificationApp}><strong>{channel === 'mail' ? 'Mail' : channel === 'calls' ? 'Phone' : 'Messages'} · {t(item.sender)}</strong><small>{s.progress[item.id].result ? 'Earlier' : 'now'}</small></span><span className={styles.notificationPreview}>{t(item.preview)}</span></span>
    </button>;
  }) : <Empty icon={<Bell />} text="No notifications" />}</section>;
  else if (s.phone.app === 'home') body = <div className={styles.homeScreen}>
    <button className={styles.owner} aria-label="My Card" onClick={() => navigate('profile')}><Character character={s.character} stage={s.stage} portrait className={styles.ownerAvatar} /><span>{s.character.name}</span></button>
    <div className={styles.appGrid}>{apps.map(app => { const Icon = app.icon; const badge = arrived.filter(item => encounterChannel(s, item.id) === app.id && !s.progress[item.id].read).length; return <button aria-label={app.name} key={app.id} onClick={() => navigate(app.id, app.id === 'mail' || app.id === 'messages')}><span style={{ background: app.color }}>{app.id === 'mail' ? <GmailIcon /> : <Icon size={30} strokeWidth={1.8} />}{badge > 0 && <b>{badge}</b>}</span>{app.name}</button>; })}</div>
    <button className={styles.homeNotifications} onClick={() => navigate('notifications')}><Bell size={18} /> Notification Centre{pending && <span className={styles.dot} />}</button>
  </div>;
  else if (s.phone.app === 'bank') body = <section className={styles.bank}><h2>Bank</h2><small>Simulation</small><div className={styles.balance}><span>Balance</span><h2>S${money(s.cash)}</h2></div><h3>Recent activity</h3><div className={styles.transaction}><ArrowDownLeft size={20} /><span><strong>Tap earnings</strong><small>All life stages</small></span><b className={styles.gain}>+S${money(s.gross)}</b></div>{[...s.ledger].reverse().map(l => <div className={styles.transaction} key={l.id}>{l.cents < 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}<span><strong>{t(l.title)}</strong><small>{STAGES[l.stage].name}</small></span><b className={l.cents < 0 ? styles.loss : styles.gain}>{l.cents < 0 ? '−' : '+'}S${money(Math.abs(l.cents))}</b></div>)}
    {e?.evidence.filter(v => v.app === 'bank').map(evidenceRow)}{record?.app === 'bank' && recordCard(record)}<p className={styles.hint}>Posted personal transactions only.</p></section>;
  else if (s.phone.app === 'contacts') body = selectedContact ? contactPage(selectedContact) : <section><h2>Contacts</h2>{searchField('Search contacts')}<button className={styles.myCardRow} onClick={() => navigate('profile')}><Character character={s.character} stage={s.stage} portrait className={styles.ownerAvatar} /><span><strong>{s.character.name}</strong><small>My Card</small></span><ChevronRight size={18} /></button>{contacts.filter(c => matches(c.name + ' ' + c.relationship)).map(c => <button className={styles.contactRow} key={c.id} onClick={() => openContact(c.id)}>{contactAvatar(c)}<span><strong>{c.name}</strong><small>{c.relationship}</small></span><ChevronRight size={18} /></button>)}{query && !contacts.some(c => matches(c.name + ' ' + c.relationship)) && <Empty icon={<Search />} text="No matching contacts" />}</section>;
  else if (s.phone.app === 'calls') body = <section><h2>Recents</h2>{arrived.filter(item => item.channel === 'calls').map(item => callHistoryRow(item.id))}{[...s.calls].reverse().map(c => { const v = CASES[c.caseId]?.evidence.find(v => v.id === c.evidenceId); return v ? <details className={styles.callHistory} key={c.caseId + c.evidenceId}><summary><PhoneCall size={18} /><span>{t(v.title)}<small>Outgoing</small></span><ChevronDown size={16} /></summary>{recordCard(v)}</details> : null; })}{!s.calls.length && !arrived.some(item => item.channel === 'calls') && <Empty icon={<PhoneCall />} text="No recent calls" />}</section>;
  else if (archivedRecord) body = <section className={styles.archivedMessage}><h2>{t(archivedRecord.title)}</h2><p className={styles.archiveOrigin}>{t(archivedRecord.origin)}</p>{archivedRecord.body.map((line, n) => <p key={n}>{t(line)}</p>)}<button className={styles.textButton} onClick={() => navigate(s.phone.app, true)}><ChevronLeft size={17} />{isMail ? 'Inbox' : 'Chats'}</button></section>;
  else if ((isChat || isMail) && !inConversation) body = <section><h2>{isMail ? 'Inbox' : 'Chats'}</h2>{searchField(isMail ? 'Search in mail' : 'Search chats')}{arrived.filter(item => encounterChannel(s, item.id) === s.phone.app && matches(item.sender + ' ' + item.title)).map(item => requestCard(item.id))}
    {e?.evidence.filter(v => v.app === s.phone.app && v.id !== 'reply' && matches(v.title)).map(evidenceRow)}{record?.app === s.phone.app && recordCard(record)}
    {!arrived.some(item => encounterChannel(s, item.id) === s.phone.app) && !e?.evidence.some(v => v.app === s.phone.app) && <Empty icon={isMail ? <Mail /> : <MessageCircle />} text={isMail ? 'No mail yet' : 'No chats yet'} />}
  </section>;
  else if (e && p && (isChat || isMail)) {
    const lines = e.channel === 'calls' && p.callStatus === 'declined' ? e.followUp ?? e.messages : e.messages;
    const replies = e.evidence.filter(v => v.app === s.phone.app && !v.call);
    body = <>
      {isMail ? <><h2 className={styles.mailSubject}>{t(e.title)}</h2><div className={styles.senderRow}><span className={styles.avatar}>{e.initials}</span><div><strong>{t(e.sender)}</strong><button className={styles.senderDisclosure} aria-label="Show sender details" aria-expanded={senderOpen} onClick={() => setSenderOpen(!senderOpen)}>to me <ChevronDown size={14} className={senderOpen ? styles.rotated : undefined} /></button></div><small>9:41</small></div>{senderOpen && <dl className={styles.senderDetails}><dt>From</dt><dd>{t(e.sender)}<br />{e.senderEmail ?? 'sender@example.invalid'}</dd><dt>To</dt><dd>{s.character.name}</dd>{e.replyTo && <><dt>Reply-to</dt><dd>{e.replyTo}</dd></>}<dt>Date</dt><dd>Today, 9:41</dd></dl>}</> : <div className={styles.chatDate}>Today</div>}
      <div className={isMail ? styles.mailBody : styles.bubbles}>{lines.map((line, n) => <p key={n}>{t(line)}{isChat && <small className={styles.messageTime}>9:{(41 + n).toString().padStart(2, '0')}</small>}</p>)}</div>
      {e.channel === 'calls' && p.callStatus === 'declined' && <VoicemailAudio key={locationKey} caseId={e.id} transcript={(e.callTranscript ?? e.messages).map(t)} collapsed paused={Boolean(pending && !s.phone.open)} />}
      {replies.filter(v => !/reply|reassur|sender|profile/i.test(v.id) && !/Earlier|Archived|Original|Existing/i.test(v.origin)).map(evidenceRow)}
      {record && record.app === s.phone.app && recordCard(record)}
      {replyOpen && <section className={styles.replySheet} ref={replyRef}><h3>Reply to {t(e.sender)}</h3>{replies.filter(v => /reply|reassur|sender|profile/i.test(v.id)).length ? replies.filter(v => /reply|reassur|sender|profile/i.test(v.id)).map(v => <button className={styles.replyOption} key={v.id} onClick={() => { inspect(v); setReplyOpen(false); }}>Could you confirm the details? <Send size={16} /></button>) : <p>This conversation contains all the details provided so far. Your phone’s other apps are available from the home bar.</p>}<button className={styles.textButton} onClick={closeReply}>Close</button></section>}
      {p.result && <button className={styles.textButton} onClick={() => navigate('feedback')}>Read outcome <ChevronRight size={16} /></button>}
      {isMail && <div className={styles.mailReplies}><button onClick={event => toggleReply(event.currentTarget)}><ArrowLeft size={18} /> Reply</button></div>}
    </>;
  } else body = <Empty icon={<Smartphone />} text="Your phone is ready" />;
  const title = s.phone.app === 'profile' ? 'My Card' : s.phone.app === 'feedback' ? 'Outcome' : s.phone.app === 'notifications' ? '' : inConversation && isChat && e ? t(e.sender) : apps.find(app => app.id === s.phone.app)?.name ?? '';
  const contactsBack = s.phone.app === 'profile' || (s.phone.app === 'contacts' && !!selectedContact);
  return <div className={styles.panel} data-testid="phone" data-theme="ios" ref={ref} role={spotlight ? 'dialog' : 'region'} aria-modal={spotlight || undefined} aria-label="Your simulated phone" onKeyDown={event => {
    if (event.key === 'Escape' && headerMenu) {
      event.preventDefault(); event.stopPropagation(); setHeaderMenu(false);
      ref.current?.querySelector<HTMLButtonElement>('[aria-label="More phone options"]')?.focus();
    } else if (event.key === 'Escape' && replyOpen) {
      event.preventDefault(); event.stopPropagation(); closeReply();
    }
  }}>
    <div className={styles.phone} style={{ '--wallpaper': "url('/art/iphone-wallpaper.jpg')" } as CSSProperties} data-app={s.phone.app} data-call={incoming || liveCall || undefined}>
      <button className={styles.status} aria-label="Open notification centre from top bar" title="Notifications (swipe down)" onClick={() => navigate('notifications')} onPointerDown={ev => { swipeStart.current = ev.clientY; ev.currentTarget.setPointerCapture(ev.pointerId); }} onPointerUp={ev => { if (swipeStart.current !== null && ev.clientY - swipeStart.current > 28) navigate('notifications'); swipeStart.current = null; }} onPointerCancel={() => { swipeStart.current = null; }}><strong>9:41</strong><span className={styles.camera} /><span><Signal size={14} /><Wifi size={14} /><BatteryFull size={19} /></span></button>
      {!incoming && !liveCall && <header className={styles.header}><button aria-label={contactsBack ? 'Back to contacts' : inConversation || archivedRecord ? isMail ? 'Back to inbox' : 'Back to chats' : 'Phone home'} onClick={() => contactsBack ? backToContacts() : inConversation || archivedRecord ? navigate(s.phone.app, true) : navigate('home')}><ChevronLeft size={23} />{contactsBack ? <span>Contacts</span> : inConversation && isChat && <span>Chats</span>}</button><span className={styles.headerTitle}>{inConversation && isChat && <span className={styles.smallAvatar}>{e?.initials}</span>}<strong>{contactsBack && selectedContact ? '' : title}</strong></span><button aria-label="More phone options" aria-expanded={headerMenu} onClick={() => setHeaderMenu(!headerMenu)}><MoreHorizontal size={22} /></button></header>}
      {headerMenu && <div className={styles.headerMenu}><button onClick={() => navigate('notifications')}><Bell size={17} />Notifications</button><button onClick={() => navigate('profile')}><Users size={17} />My Card</button><button onClick={() => navigate('home')}><Home size={17} />Home</button></div>}
      <div className={styles.content} data-conversation={inConversation || undefined} ref={content} onScroll={rememberScroll}>{body}</div>
      {(incoming || liveCall) && <div className={styles.callButtons}>{incoming ? <><button aria-label="Decline call" onClick={() => dispatch({ type: 'CALL_DECLINE' })}><span className={styles.endCall}><PhoneOff size={28} /></span>Decline</button><button aria-label="Accept call" onClick={() => dispatch({ type: 'CALL_ANSWER' })}><span className={styles.acceptCall}><PhoneCall size={28} /></span>Accept</button></> : <button aria-label="End call" onClick={() => dispatch({ type: 'CALL_DECLINE' })}><span className={styles.endCall}><PhoneOff size={28} /></span>End call</button>}</div>}
      {inConversation && isChat && <div className={styles.composer}><button aria-label="Reply to message" onClick={event => toggleReply(event.currentTarget)}><span>Message</span><Send size={19} /></button></div>}
      {(s.phone.app === 'calls' || s.phone.app === 'contacts') && !incoming && !liveCall && <nav className={styles.phoneTabs} aria-label="Phone sections"><button aria-current={s.phone.app === 'calls' ? 'page' : undefined} onClick={() => navigate('calls')}><PhoneCall size={20} />Recents</button><button aria-current={s.phone.app === 'contacts' ? 'page' : undefined} onClick={() => navigate('contacts')}><Users size={20} />Contacts</button></nav>}
      {import.meta.env.DEV && pending && s.phone.open && <button className={styles.devExit} onClick={() => dispatch({ type: 'DEV_EXIT' })}>Exit request (dev) <X size={13} /></button>}
      {!s.phone.open && pending && <button className={styles.resumeRequest} onClick={returnToRequest}>Resume request</button>}
      <button className={styles.homeButton} aria-label="Phone home" onClick={() => navigate('home')}><span /></button>
    </div>
    {pending && s.phone.open && <aside className={styles.decisionDock} data-testid="decision-card" aria-label="Request decisions">{decisions()}</aside>}
  </div>;
}
function GmailIcon() {
  return <svg width="30" height="24" viewBox="0 0 34 26" aria-hidden="true"><path d="M3 23V5l14 11L31 5v18" fill="none" stroke="#34a853" strokeWidth="6" strokeLinejoin="round" /><path d="M3 23V5" stroke="#4285f4" strokeWidth="6" /><path d="M3 5l14 11L31 5" fill="none" stroke="#ea4335" strokeWidth="6" strokeLinejoin="round" /><path d="M31 5v7" stroke="#fbbc04" strokeWidth="6" /></svg>;
}
function Empty({ icon, text }: { icon: ReactNode; text: string }) { return <div className={styles.empty}>{icon}<p>{text}</p></div>; }
