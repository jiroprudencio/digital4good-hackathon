import type { CSSProperties } from 'react';
import styles from './Scene.module.css';
import { noteBundle } from './notes';
import { money } from './content';
import Character from './Character';
import { DEFAULT_CHARACTER } from './profiles';
import type { Character as Player } from './profiles';
export const SCENE_ART = ['/art/school.png','/art/tertiary.png','/art/adult.png','/art/senior.png'];
export default function Scene({stage,reducedMotion,character=DEFAULT_CHARACTER,backgroundOnly=false}:{stage:number;reducedMotion:boolean;character?:Player;backgroundOnly?:boolean}) {
 return <div className={`${styles.scene} ${reducedMotion?styles.still:''}`} data-stage={stage} data-background={backgroundOnly}>
 <img className={styles.backdrop} src={SCENE_ART[stage]} alt={['Classroom overlooking Singapore HDB flats','Student room with a laptop and campus view','Office overlooking Singapore at dusk','HDB living room in the evening'][stage]} />
 <div className={styles.windowGlow}/><div className={styles.lurker} title="Scamagotchi is plotting"><Mascot mood="smug"/></div>
 {!backgroundOnly&&<Character className={styles.player} character={character} stage={stage}/>}
 </div>;
}
export function Mascot({mood='smug'}:{mood?:'happy'|'caught'|'smug'}) {
 return <img className={styles.mascot} data-mood={mood} src="/art/scamagotchi.png" alt={mood==='caught'?'Scamagotchi has been caught':'Scamagotchi is plotting'} />;
}
// Source-pixel frames keep the original generated artwork intact while excluding
// the transparent atlas gutters. Every frame has the same size and note ratio.
const NOTE_FRAMES: Record<number, readonly [number, number]> = {
  2: [27, 61], 10: [912, 61], 50: [27, 467], 100: [912, 467],
};
export function Banknote({ className = '', denomination = 2 }: { className?: string; denomination?: number } = {}) {
  const value = NOTE_FRAMES[denomination] ? denomination : 2;
  const [x, y] = NOTE_FRAMES[value];
  return <svg className={`${styles.banknote} ${className}`} viewBox={`${x} ${y} 838 372`}
    role="img" aria-label={`Cartoon Singapore ${value} dollar note marked specimen`} overflow="hidden">
    <image href="/art/specimen-notes.png" width="1774" height="887" aria-hidden="true" />
  </svg>;
}

export function EarnNotes({ cents, stage }: { cents: number; stage: number }) {
  const bundle = noteBundle(cents, stage);
  return <span className={styles.earnNotes} data-testid="note-bundle" aria-label={`Note bundle totals SGD ${money(cents)} per click`}>
    {bundle.notes.map(note => <span className={styles.noteGroup} key={note.denomination}>
      <span className={styles.cashStack} aria-hidden="true" style={{ '--count': note.count, '--step': `${Math.min(6, 60 / Math.max(1, note.count - 1))}px`, '--spread': `${Math.min(60, (note.count - 1) * 6)}px` } as CSSProperties}>
        {Array.from({ length: note.count }, (_, i) => <span className={styles.stackedNote} key={i} data-testid="stacked-note" style={{ '--i': i } as CSSProperties}><Banknote denomination={note.denomination} /></span>)}
      </span>
      <span>{note.count} × SGD {note.denomination.toLocaleString('en-SG')}</span>
    </span>)}
    {bundle.remaining > 0 && <span>+ SGD {money(bundle.remaining)} bonus change</span>}
  </span>;
}
