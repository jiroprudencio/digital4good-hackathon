import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { ArrowRight, Check, ChevronDown, Download, Info, RotateCcw, Settings, X } from 'lucide-react';
import { CASES, ENCOUNTERS, money, shortMoney, STAGES, personalise } from './content';
import { activeCase, createGame, decodeSave, rates, reducer, resolvedCount, SAVE_KEY, stageResolved } from './game';
import type { GameState } from './game';
import Scene, { EarnNotes, Mascot, SCENE_ART } from './Scene';
import Character from './Character';
import { DEFAULT_CHARACTER, GENDERS, SKIN_TONES, STAGE_PROFILES } from './profiles';
import type { Character as Player } from './profiles';
import Phone, { useDialogFocus } from './Phone';
import styles from './App.module.css';
import { THEMES } from './themes';
import { FONT_PAIRINGS } from './fonts';
const params = new URLSearchParams(location.search);
const preview = params.has('preview');
const theme = THEMES.find(t => t.id === params.get('theme'))?.id ?? 'pocket';
const font = FONT_PAIRINGS.find(f => f.id === params.get('font'))?.id ?? 'arcade';
const elapsed=(ms:number)=>Math.floor(ms/60000)+':'+Math.floor(ms/1000%60).toString().padStart(2,'0');
function load() {
 if(preview)return {state:{...createGame(()=>.7),started:true,briefing:false},problem:'',raw:''};
 try {const raw=localStorage.getItem(SAVE_KEY);if(!raw)return {state:createGame(),problem:'',raw:''};
 const state=decodeSave(raw);return state?{state,problem:'',raw:''}:{state:createGame(),problem:'Your save could not be read. Download a copy before starting fresh.',raw};
 } catch {return {state:createGame(),problem:'Progress cannot be saved in this browser session.',raw:''};}
}
export default function App() {
 const [initial]=useState(load);
 const [state,dispatch]=useReducer(reducer,initial.state);
 const [problem,setProblem]=useState(initial.problem);
 const [recovering,setRecovering]=useState(Boolean(initial.raw&&initial.problem));
 const [modal,setModal]=useState<'reset'|'about'|'profile'|null>(null);
 const [settings,setSettings]=useState(false);
 const [floats,setFloats]=useState<{id:number;value:string}[]>([]);
 const floatId=useRef(0), timeouts=useRef<ReturnType<typeof setTimeout>[]>([]);
 const stage=STAGES[state.stage], rate=rates(state), pending=activeCase(state);
 const welcome=!state.started||state.briefing;
 const spotlight=state.phone.open&&!welcome&&!state.finished&&!modal&&!recovering;
 const blocked=state.phone.open||welcome||state.finished||!!modal||recovering;
 const verified=Object.values(state.progress).filter(p=>p.result?.verified).length;
 useEffect(()=>{
  if(preview||recovering)return;
  try {localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{setProblem('Progress cannot be saved. Keep this tab open or download your run.');}
 },[state,recovering]);
 useEffect(()=>{
  let last=performance.now();const timer=setInterval(()=>{const now=performance.now();if(!document.hidden&&!modal&&!recovering)dispatch({type:'TICK',ms:now-last});last=now;},250);
  const hidden=()=>{last=performance.now();dispatch({type:'HIDDEN',hidden:document.hidden});};
  document.addEventListener('visibilitychange',hidden);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',hidden);};
 },[modal,recovering]);
 useEffect(()=>()=>timeouts.current.forEach(clearTimeout),[]);
 function earn(){if(blocked)return;dispatch({type:'TAP',now:performance.now()});const id=++floatId.current;setFloats(old=>[...old.slice(-5),{id,value:'+S$'+money(rate.tap)}]);const timer=setTimeout(()=>{setFloats(old=>old.filter(f=>f.id!==id));timeouts.current=timeouts.current.filter(t=>t!==timer);},700);timeouts.current.push(timer);}
 function download(){const blob=new Blob([recovering?initial.raw:JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='scamagotchi-save.json';a.click();URL.revokeObjectURL(url);}
 function reset(){const next=createGame();next.reducedMotion=state.reducedMotion;setRecovering(false);setProblem('');dispatch({type:'RESET',state:next});setModal(null);setSettings(false);}
 const stagePercent=Math.min(100,(state.stage===3?state.cash:state.gross)/(stage.gate*100)*100);
 return <div data-theme={theme} data-font={font} className={styles.app+' '+(state.reducedMotion?styles.reduced:'')}>
 <header className={styles.header} inert={spotlight||welcome||!!modal||state.finished}>
 <div className={styles.brand}><Mascot mood="smug"/><h1>Scamagotchi</h1></div>
 <ol className={styles.chapters} aria-label="Life stages">{['School','Tertiary','Adult','Senior'].map((name,i)=><li key={name} className={i===state.stage?styles.currentChapter:''} aria-current={i===state.stage?'step':undefined}>{i<state.stage&&<Check size={15}/>} {name}</li>)}</ol>
 <div className={styles.headerTools}>
 <button className={styles.profileButton} aria-label="Open your character profile" onClick={()=>setModal('profile')}><Character character={state.character} stage={state.stage} portrait/><span>{state.character.name}</span><ChevronDown size={16}/></button>
 <button className={styles.iconButton} aria-label="Restart game" title="Restart game" onClick={()=>setModal('reset')}><RotateCcw size={20}/></button>
 <div className={styles.settings}><button className={styles.iconButton} aria-label="Settings" aria-expanded={settings} onClick={()=>setSettings(!settings)}><Settings size={20}/></button>
 {settings&&<div className={styles.settingsPanel}><label><input type="checkbox" checked={state.reducedMotion} onChange={e=>dispatch({type:'MOTION',reduced:e.target.checked})}/> Less motion</label><button onClick={()=>{setSettings(false);setModal('about');}}><Info size={18}/> How to play</button><button onClick={download}><Download size={18}/> Download save</button></div>}</div>
 </div></header>
 {problem&&<div className={styles.storage} role="status"><span>{problem}</span><button onClick={download}>Download backup</button>{recovering&&<button onClick={()=>setModal('reset')}>Start fresh</button>}</div>}
 <main className={styles.main} inert={welcome||!!modal||state.finished||recovering}>
 <div className={styles.gameGrid}>
 <section className={styles.moneyPanel} inert={spotlight} aria-label="Earn and save">
 <div className={styles.balanceLabel}>Balance</div><h2 className={styles.money}>S$<span data-testid="balance">{money(state.cash)}</span></h2>
 <div className={styles.noteArea}><button data-testid="earn" className={styles.note} disabled={blocked} aria-label={'Earn '+money(rate.tap)+' SGD. Tap the note.'} onClick={earn}><EarnNotes cents={rate.tap} stage={state.stage}/></button>{floats.map(f=><span key={f.id} className={styles.floating}>{f.value}</span>)}</div>
 <p className={styles.tapHint}>{state.phone.open?'Paused during request':'+S$'+money(rate.tap)+' / tap'}</p>
 <div className={styles.goal}><span>{state.milestoneSeen?'One million reached':'Toward S$1,000,000'}</span><progress max={100} value={Math.min(100,state.cash/1000000)} aria-label="Savings toward one million"/>{state.milestoneSeen&&<small>Keep going. Your savings have no game cap.</small>}</div>
 </section>
 <section className={styles.scenePanel} inert={spotlight} aria-label={'Current scene: '+stage.name}>
 <div className={styles.sceneArt}><Scene stage={state.stage} character={state.character} reducedMotion={state.reducedMotion}/><div className={styles.sceneTag}>{state.character.name} · {STAGE_PROFILES[state.stage].age}</div></div>
 <div className={styles.stageControls}><div className={styles.upgradeRow}><span><strong>{stage.upgrade}</strong><small>{state.upgrade?'Double tap earnings active':'Double your tap earnings'}</small></span><button className={styles.primary} disabled={blocked||state.upgrade||state.cash<stage.cost*100} onClick={()=>dispatch({type:'UPGRADE'})}>{state.upgrade?<><Check size={16}/> Owned</>:'S$'+shortMoney(stage.cost*100)}</button></div>
 <div className={styles.stageRequirement}><span>{state.stage<3?'Next: '+['School','Tertiary','Adult','Senior'][state.stage+1]:state.milestoneSeen?'Milestone reached':'Million milestone'}<strong>{stageResolved(state)} / {state.order[state.stage].length} encounters</strong></span><progress max={100} value={stagePercent} aria-label="Chapter money requirement"/></div></div>
 </section>
 <aside className={styles.phonePanel+' '+(spotlight?styles.phoneSpotlight:'')} aria-label="Phone panel"><Phone state={state} dispatch={dispatch} spotlight={spotlight}/></aside>
 </div>
 <footer className={styles.pageFooter} inert={spotlight}><span>{resolvedCount(state)} / {ENCOUNTERS.length} encounters</span><span>{verified} independent checks followed</span><span>{elapsed(state.activeMs)} active</span><span>Fictional scenarios · Simulated SGD</span></footer>
 </main>
 {spotlight&&<div className={styles.eventShade} data-testid="event-shade" aria-hidden="true"/>}
 <div className={styles.announcement} role="status" aria-live="polite">{pending?'New request from '+CASES[pending].sender:''}</div>
 {!state.started&&!recovering&&<Creator reduced={state.reducedMotion} onNext={character=>dispatch({type:'START',character})}/>}
 {state.started&&state.briefing&&!recovering&&<StageProfile character={state.character} stage={state.stage} reduced={state.reducedMotion} onNext={()=>dispatch({type:'BEGIN_STAGE'})}/>}
 {state.finished&&!modal&&<Results state={state} onReset={()=>setModal('reset')} onDownload={download} onContinue={()=>dispatch({type:'CONTINUE_PLAY'})}/>}
 {modal==='profile'&&<StageProfile character={state.character} stage={state.stage} reduced={state.reducedMotion} onNext={()=>setModal(null)} reviewing/>}
 {(modal==='reset'||modal==='about')&&<Modal title={modal==='reset'?'Start a new run?':'How to play'} onClose={()=>setModal(null)}>{modal==='reset'?<><p>This resets your character, savings and encounters on this browser.</p><button className={styles.secondary} onClick={download}><Download size={16}/> Download current run</button><div className={styles.modalActions}><button className={styles.secondary} onClick={()=>setModal(null)}>Cancel</button><button className={styles.primary} onClick={reset}>Start fresh</button></div></>:<><p>Tap your notes to earn. When your phone interrupts, investigate the request through its apps, decide, then read what happened.</p><p>Your avatar and Contacts → My Card hold your current profile. Expand email details, read previous records or call a saved contact.</p><p>Each stage advances after its encounters and earning milestone. One million unlocks your results; you can keep playing afterwards.</p><p>All people, calls and transactions are simulated. Scamagotchi hides behind the fraudulent requests. Genuine requests appear too.</p><button className={styles.primary} onClick={()=>setModal(null)}>Got it</button></>}</Modal>}
 </div>;
}
function Creator({onNext,reduced}:{onNext:(c:Player)=>void;reduced:boolean}) {
 const [character,setCharacter]=useState<Player>({...DEFAULT_CHARACTER,name:''});const [error,setError]=useState('');
 const ref=useRef<HTMLDivElement>(null);useDialogFocus(ref,()=>{});
 function submit(e:FormEvent){e.preventDefault();if(!character.name.trim()){setError('Enter a name or nickname to continue.');return;}onNext({...character,name:character.name.trim()});}
 return <div className={styles.introOverlay} ref={ref} role="dialog" aria-modal="true" aria-label="Create your character">
 <div className={styles.introBackdrop}><Scene stage={0} reducedMotion={reduced} backgroundOnly/></div><div className={styles.introBrand}>Scamagotchi</div>
 <form className={styles.creator} onSubmit={submit}><h1>Your character</h1><div className={styles.creatorGrid}><div className={styles.avatarPreview}><Character character={{...character,name:character.name||'Your'}}/><div className={styles.grass}/></div>
 <div className={styles.creatorFields}><label>Name<input aria-label="Name" autoComplete="off" maxLength={24} value={character.name} placeholder="Your name" autoFocus aria-invalid={!!error} aria-describedby={error?'name-error':undefined} onChange={e=>{setError('');setCharacter({...character,name:e.target.value});}}/></label>
 {error&&<p id="name-error" role="alert">{error}</p>}
 <label>Gender<select aria-label="Gender" value={character.gender} onChange={e=>setCharacter({...character,gender:e.target.value as Player['gender']})}>{GENDERS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}</select></label>
 <fieldset className={styles.skin}><legend>Skin tone</legend><div>{SKIN_TONES.map((colour,i)=><label key={colour} style={{background:colour}} className={character.skinTone===i?styles.selectedSkin:''}><input type="radio" name="skin" aria-label={'Skin tone '+(i+1)} checked={character.skinTone===i} onChange={()=>setCharacter({...character,skinTone:i})}/>{character.skinTone===i&&<Check aria-hidden="true"/>}</label>)}</div></fieldset>
 <p className={styles.muted}>Your choices stay with you through every stage.</p></div></div>
 <footer className={styles.creatorFooter}><small>A nickname is fine. All scenarios are fictional.</small><button className={styles.primary} type="submit">Next <ArrowRight size={20}/></button></footer>
 </form></div>;
}
function StageProfile({character,stage,reduced,onNext,reviewing=false}:{character:Player;stage:number;reduced:boolean;onNext:()=>void;reviewing?:boolean}) {
 const profile=STAGE_PROFILES[stage],ref=useRef<HTMLDivElement>(null);useDialogFocus(ref,()=>{if(reviewing)onNext();});
 return <div className={styles.introOverlay} ref={ref} role="dialog" aria-modal="true" aria-label={reviewing?'Your character profile':'Your next life stage'}>
 <div className={styles.introBackdrop}><Scene stage={stage} reducedMotion={reduced} backgroundOnly/></div>
 <section className={styles.profileCard} data-testid="stage-profile"><div className={styles.profileBanner} style={{backgroundImage:'url('+SCENE_ART[stage]+')'}}><h1>{['School','Tertiary','Adult','Senior'][stage]}</h1>{reviewing&&<button className={styles.profileClose} aria-label="Close profile" onClick={onNext}><X/></button>}</div>
 <div className={styles.profileBody}><div className={styles.profileIdentity}><Character character={character} stage={stage} portrait/><div><h2>{character.name} · {profile.age}</h2><p>{profile.role}{profile.organisation?' · '+profile.organisation:''}</p></div></div>
 <section><h3>Right now</h3>{profile.goals.map(goal=><p key={goal}>{goal}</p>)}</section><section><h3>People</h3>{profile.contacts.slice(0,2).map(c=><p key={c.id}><strong>{c.name}</strong><br/>{c.relationship}</p>)}</section></div>
 <footer><small>Fictional role and relationships</small><button className={styles.primary} onClick={onNext}>{reviewing?'Back to game':'Next'} <ArrowRight size={20}/></button></footer>
 </section></div>;
}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) {
 const ref=useRef<HTMLDivElement>(null);useDialogFocus(ref,onClose);
 return <div className={styles.modalOverlay}><div className={styles.modal} ref={ref} role="dialog" aria-modal="true" aria-label={title}><div className={styles.modalHeading}><h2>{title}</h2><button className={styles.iconButton} aria-label="Close dialog" onClick={onClose}><X/></button></div>{children}</div></div>;
}
function Results({state:s,onReset,onDownload,onContinue}:{state:GameState;onReset:()=>void;onDownload:()=>void;onContinue:()=>void}) {
 const ref=useRef<HTMLDivElement>(null);useDialogFocus(ref,()=>{});
 const results=ENCOUNTERS.flatMap(e=>s.progress[e.id].result?[{e,r:s.progress[e.id].result!}]:[]);
 const lost=results.filter(x=>x.r.unsafe).reduce((sum,x)=>sum+Math.max(0,-x.r.personalDelta),0);
 const habit=results.find(x=>!x.r.verified)?.e.habit??'Keep checking requests through independently saved contacts.';
 return <div className={styles.resultOverlay} ref={ref} role="dialog" aria-modal="true" aria-label="Your journey results"><section className={styles.results}><Mascot mood="caught"/><h1>A million, and counting.</h1><p>You have completed this lifetime. Scamagotchi is still lurking.</p><div className={styles.resultStats}><span><small>Money held</small><strong>{'S$'+money(s.cash)}</strong></span><span><small>Verification demonstrated</small><strong>{results.filter(x=>x.r.verified).length} / {ENCOUNTERS.length}</strong></span><span><small>Personal scam losses</small><strong>{'S$'+money(lost)}</strong></span></div><p><strong>Practice next</strong><br/>{habit}</p><p>Legitimate opportunities declined: {results.filter(x=>x.r.missed).length}. Declining a verified personal loan is always your choice.</p>
 <div className={styles.resultList}>{results.map(({e,r})=><details key={e.id}><summary><span>{e.title}</span><small>{e.scam?'Scam':'Genuine'} · {r.verified?'Checked independently':r.unsafe?'Unsafe action':'Decision recorded'}</small></summary><p>{personalise(r.decision==='proceed'?e.success:r.decision==='report'?e.scam?'You reported the request and did not send money.':'You reported a genuine request. No real report was sent.':e.declined,s.character.name)}</p><p>{e.lesson}</p><small>You checked: {r.inspectedEvidence.map(id=>e.evidence.find(v=>v.id===id)?.title).join(', ')||'no records'}.</small></details>)}</div><p className={styles.muted}>This is a record of your playthrough, not a scam-proof score.</p><div className={styles.modalActions}><button className={styles.primary} onClick={onContinue}>Keep playing <ArrowRight size={18}/></button><button className={styles.secondary} onClick={onReset}>New game</button><button className={styles.secondary} onClick={onDownload}>Download run</button></div></section></div>;
}


