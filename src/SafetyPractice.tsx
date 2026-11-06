import { useEffect, useId, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import { Ban, Check, ChevronLeft, Flag, MoreHorizontal, Save, ShieldCheck } from 'lucide-react';
import type { EncounterVariant } from './content';
import type { Action, Progress, SafetyReason } from './game';
import { safetyPractice } from './game';
import HelpResources from './HelpResources';
import { PLATFORM_GUIDES } from './safetyResources';
import styles from './SafetyPractice.module.css';

export const SAFETY_REASONS: Record<SafetyReason, string> = {
  scam: 'Scam or phishing', grooming: 'Grooming or sexual pressure',
  cyberbullying: 'Cyberbullying or harassment', other: 'Another concern',
};

export function SafetyReceipt({ progress }: { progress: Progress }) {
  const practice = safetyPractice(progress);
  return <section className={styles.receipt} aria-label="Safety practice record" aria-live="polite" tabIndex={-1}>
    <h3>Your practice record</h3>
    <ul>
      <li><Save size={16} aria-hidden="true" /> Evidence {practice.evidenceSaved ? 'saved' : 'not saved'}</li>
      <li><Ban size={16} aria-hidden="true" /> Sender {practice.blocked ? 'blocked in practice' : 'not blocked'}</li>
      <li><Flag size={16} aria-hidden="true" /> Report {practice.reported ? 'recorded in practice' : 'not recorded'}</li>
    </ul>
    {practice.reason && <p>Chosen reason: <strong>{SAFETY_REASONS[practice.reason]}</strong></p>}
    <small>Practice only — nothing is sent.</small>
  </section>;
}

export default function SafetyPractice({ encounter, progress, dispatch, onClose, onFinish, personalise, entry = 'overview' }: {
  encounter: EncounterVariant;
  progress: Progress;
  dispatch: Dispatch<Action>;
  onClose: () => void;
  onFinish: () => void;
  personalise: (value: string) => string;
  entry?: 'overview' | 'report' | 'block';
}) {
  const practice = safetyPractice(progress), readOnly = Boolean(progress.result);
  const mail = encounter.channel === 'mail';
  const [step, setStep] = useState<'overview' | 'menu' | 'selection' | 'reason' | 'confirm-report' | 'confirm-block'>(entry === 'block' ? 'confirm-block' : entry === 'report' ? mail ? 'menu' : 'selection' : 'overview');
  const [selected, setSelected] = useState<number | null>(null);
  const [reason, setReason] = useState<SafetyReason | ''>('');
  const [route, setRoute] = useState<'phishing' | 'spam' | 'message'>('message');
  const ref = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null), activeStep = useRef<HTMLElement>(null), menu = useRef<HTMLDivElement>(null), recordId = useId();
  const messages = (encounter.channel === 'calls' ? encounter.followUp ?? encounter.messages : encounter.messages).map(personalise);
  useEffect(() => {
    // Wait for the phone's route scroll restoration, then reveal the new step
    // inside its viewport. Moving focus alone must not hide the next task.
    const frame = requestAnimationFrame(() => {
      if (step === 'menu' && menu.current) {
        revealStep(menu.current, menu.current.querySelector<HTMLElement>('button:not(:disabled)'));
      } else if (step !== 'overview' && activeStep.current) {
        revealStep(activeStep.current, activeStep.current.querySelector<HTMLElement>('h3'));
      } else if (practice.reported && !readOnly) {
        const receipt = ref.current?.querySelector<HTMLElement>('[aria-label="Safety practice record"]');
        if (receipt) revealStep(receipt, receipt);
      } else if (ref.current) revealStep(ref.current, heading.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [step, readOnly, practice.reported]);
  const openReport = (nextRoute: typeof route) => { setRoute(nextRoute); setStep('selection'); };
  const selectedText = mail ? personalise(encounter.title) : selected === null ? '' : messages[selected];
  return <section className={styles.practice} ref={ref} aria-label="Safety actions practice">
    <button type="button" className={styles.back} onClick={onClose}><ChevronLeft size={18} /> Back to {mail ? 'email' : 'conversation'}</button>
    <h2 tabIndex={-1} ref={heading}>Safety actions</h2>
    <p className={styles.notice}>Practice only — nothing is sent.</p>
    <p>{mail ? 'Gmail-style email practice' : 'Telegram-style message practice'} · <strong>{personalise(encounter.sender)}</strong></p>
    <details className={styles.record} open={readOnly || undefined}>
      <summary>Review the fictional {mail ? 'email' : 'messages'}</summary>
      <dl><dt>Sender</dt><dd>{personalise(encounter.sender)}{encounter.senderEmail && <><br />{encounter.senderEmail}</>}</dd><dt>Request</dt><dd>{personalise(encounter.title)}</dd><dt>Shown time</dt><dd>Today, 9:41</dd></dl>
      {messages.map((message, index) => <blockquote key={index}>{message}</blockquote>)}
      {encounter.channel === 'calls' && <p>The full call transcript and voice message remain in the conversation.</p>}
    </details>
    {readOnly ? <>
      <p>This encounter has ended. You can review its record and the steps below; this does not change your earlier decision.</p>
      <SafetyReceipt progress={progress} />
      <PlatformSteps mail={mail} />
      <HelpResources />
    </> : <>
      <section className={styles.step} aria-label="Preserve evidence">
        <h3>1. Preserve the record</h3>
        <p>If safe, keep relevant messages and sender details before blocking. You can block immediately if needed. This saves the fictional record in your game only.</p>
        <button type="button" className={styles.secondary} disabled={practice.evidenceSaved} onClick={() => dispatch({ type: 'PRACTISE_SAFETY', action: 'save-evidence' })}>
          {practice.evidenceSaved ? <Check size={18} /> : <Save size={18} />}{practice.evidenceSaved ? 'Evidence saved' : 'Save evidence'}
        </button>
      </section>
      <section className={styles.step} aria-label="Platform safety controls">
        <h3>2. Open the platform controls</h3>
        <p>{mail ? 'Open the email, then use More next to Reply. Blocking the sender and reporting the email are separate actions.' : 'On Telegram for iOS, press and hold the message, choose Report and select the relevant message and reason. Blocking the sender is separate.'}</p>
        <button type="button" className={styles.secondary} aria-expanded={step === 'menu'} onClick={() => setStep(step === 'menu' ? 'overview' : 'menu')}><MoreHorizontal size={18} />{mail ? 'Open email more menu' : 'Open message options'}</button>
        {step === 'menu' && <div ref={menu} className={styles.menu} aria-label={mail ? 'Email safety options' : 'Message safety options'}>
          {mail ? <><button type="button" onClick={() => openReport('phishing')}><Flag size={17} /> Report phishing <small>Computer route · practice</small></button><button type="button" onClick={() => openReport('spam')}><Flag size={17} /> Report spam</button></> : <button type="button" onClick={() => openReport('message')}><Flag size={17} /> Report message</button>}
          <button type="button" disabled={practice.blocked} onClick={() => setStep('confirm-block')}><Ban size={17} />{practice.blocked ? 'Sender blocked' : 'Block sender'}</button>
        </div>}
      </section>
      {step === 'selection' && <section ref={activeStep} className={styles.step} aria-label="Select report content">
        <h3 tabIndex={-1}>Choose what to report</h3>
        {mail && <p className={styles.adaptation}>{route === 'phishing' ? 'Gmail documents Report phishing on a computer. This phone screen rehearses that route; it is not an iPhone menu option.' : 'Report spam is the Gmail route for unwanted email. Serious abuse may also need support outside the app.'}</p>}
        <fieldset><legend>{mail ? 'Select the email' : 'Select a message'}</legend>
          {(mail ? [personalise(encounter.title)] : messages).map((message, index) => <label className={styles.choice} key={index}><input type="radio" name={recordId + '-message'} checked={selected === index} onChange={() => setSelected(index)} /><span>{message}</span></label>)}
        </fieldset>
        <button type="button" className={styles.primary} disabled={selected === null} onClick={() => setStep('reason')}>Continue to reason</button>
        <button type="button" className={styles.secondary} onClick={() => setStep('menu')}>Back to options</button>
      </section>}
      {step === 'reason' && <section ref={activeStep} className={styles.step} aria-label="Choose report reason">
        <h3 tabIndex={-1}>Choose the closest concern</h3>
        <blockquote>{selectedText}</blockquote>
        <p>{mail ? 'This reason exercise belongs to the game. Gmail does not show this four-choice reason picker.' : 'These learning labels summarise the concerns. Exact platform labels can vary; choose the closest available reason.'}</p>
        <fieldset><legend>Practice report reason</legend>{Object.entries(SAFETY_REASONS).map(([value, label]) => <label className={styles.choice} key={value}><input type="radio" name={recordId + '-reason'} checked={reason === value} onChange={() => setReason(value as SafetyReason)} /><span>{label}</span></label>)}</fieldset>
        <button type="button" className={styles.primary} disabled={!reason} onClick={() => setStep('confirm-report')}>Review practice report</button>
        <button type="button" className={styles.secondary} onClick={() => setStep('selection')}>Back to selected content</button>
      </section>}
      {step === 'confirm-report' && <section ref={activeStep} className={styles.confirm} aria-label="Confirm practice report">
        <h3 tabIndex={-1}>Submit this practice report?</h3>
        <p><strong>{personalise(encounter.sender)}</strong> · {reason && SAFETY_REASONS[reason]}</p><blockquote>{selectedText}</blockquote>
        {!practice.evidenceSaved && <p>Save the fictional evidence above before reporting.</p>}
        <p>Nothing leaves this game. A practice report is not a real platform or police report.</p>
        <button type="button" className={styles.primary} disabled={!practice.evidenceSaved || !reason || practice.reported} onClick={() => { if (reason) dispatch({ type: 'PRACTISE_SAFETY', action: 'report', reason }); setStep('overview'); }}><Flag size={18} /> Submit practice report</button>
        <button type="button" className={styles.secondary} onClick={() => setStep('reason')}>Back to reason</button>
      </section>}
      {step === 'confirm-block' && <section ref={activeStep} className={styles.confirm} aria-label="Confirm block sender">
        <h3 tabIndex={-1}>Block {personalise(encounter.sender)} in practice?</h3>
        <p>Blocking limits further contact. It does not report the account or replace keeping evidence.</p>
        {!practice.evidenceSaved && <p>If safe, preserve messages first. You can block now and keep the fictional record here.</p>}
        <button type="button" className={styles.danger} disabled={practice.blocked} onClick={() => { dispatch({ type: 'PRACTISE_SAFETY', action: 'block' }); setStep('overview'); }}><Ban size={18} /> Confirm block sender</button>
        <button type="button" className={styles.secondary} onClick={() => setStep('menu')}>Cancel</button>
      </section>}
      <SafetyReceipt progress={progress} />
      {practice.reported && <section className={styles.step} aria-label="Complete reporting practice">
        {!practice.blocked && <><p>You can also block the sender after preserving the record. Blocking is optional in this practice.</p><button type="button" className={styles.secondary} onClick={() => setStep('confirm-block')}><Ban size={18} /> Block sender</button></>}
        <button type="button" className={styles.primary} onClick={onFinish}><ShieldCheck size={18} /> Finish report and view outcome</button>
        <HelpResources />
      </section>}
      <PlatformSteps mail={mail} />
    </>}
  </section>;
}

function revealStep(section: HTMLElement, focus: HTMLElement | null) {
  const viewport = section.closest<HTMLElement>('[data-phone-content]');
  viewport?.closest<HTMLElement>('[data-app]')?.scrollIntoView({ block: 'nearest' });
  if (viewport) viewport.scrollTop += section.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 16;
  focus?.focus({ preventScroll: true });
}

function PlatformSteps({ mail }: { mail: boolean }) {
  const guides = mail ? [PLATFORM_GUIDES.gmailBlock, PLATFORM_GUIDES.gmailPhishing, PLATFORM_GUIDES.gmailSpam] : [PLATFORM_GUIDES.telegram];
  return <details className={styles.guides}><summary>Real platform guidance</summary>
    <p>{mail ? 'On Gmail for iPhone/iPad, open the message and use More next to Reply to block the sender. Use Report spam for unwanted messages. The documented Report phishing steps require Gmail on a computer.' : 'On Telegram for iPhone/iPad, press and hold the message and choose Report. Select the relevant message and reason, then follow the reporting prompts. Use the sender’s profile options separately to block contact.'}</p>
    {!mail && <p>In a group chat, blocking an account does not remove its posts or leave the group. Mute and leave-group controls are separate.</p>}
    {guides.map(guide => <a key={guide.url} href={guide.url} target="_blank" rel="noreferrer">{guide.title}</a>)}
  </details>;
}
