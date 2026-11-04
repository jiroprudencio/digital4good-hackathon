import { useId } from 'react'
import type { CSSProperties } from 'react'
import styles from './Scene.module.css'
import { noteBundle } from './notes'
import { money } from './content'

type SceneProps = { stage: number; reducedMotion: boolean }
type Tone = 'school' | 'university' | 'office' | 'home'
const ink = '#233e38'

function Building({ x, y, w, h, colour, night = false }: { x: number; y: number; w: number; h: number; colour: string; night?: boolean }) {
  return <g><rect x={x} y={y} width={w} height={h} fill={colour} /><rect x={x + 5} y={y - 5} width={w - 10} height="5" fill={colour} />
    {Array.from({ length: Math.floor(h / 17) }, (_, row) => Array.from({ length: Math.floor((w - 5) / 13) }, (_, column) => <rect key={`${row}-${column}`} x={x + 6 + column * 13} y={y + 8 + row * 17} width="6" height="8" fill={night ? (row + column) % 3 === 0 ? '#f6cf7c' : '#677f8a' : '#edf0cc'} opacity={night ? 0.9 : 0.75} />))}
  </g>
}

function Skyline({ tone }: { tone: Tone }) {
  const night = tone === 'home' || tone === 'office'
  return <g>
    <rect width="420" height="186" fill={tone === 'home' ? '#293d60' : tone === 'office' ? '#b891a2' : tone === 'university' ? '#bad8cc' : '#badfd2'} />
    <rect y="105" width="420" height="81" fill={tone === 'home' ? '#405876' : tone === 'office' ? '#e3ae89' : '#d7e5bd'} />
    {night ? <g><rect x="326" y="18" width="23" height="23" fill="#ffe3a0" /><rect x="320" y="24" width="35" height="12" fill="#ffe3a0" />{tone === 'home' && <g className={styles.twinkle} fill="#dbead8"><rect x="24" y="19" width="3" height="3" /><rect x="155" y="37" width="3" height="3" /><rect x="250" y="12" width="3" height="3" /><rect x="379" y="53" width="3" height="3" /></g>}</g> : <g className={styles.clouds} fill="#f6f3dc"><path d="M20 35h18V23h36v12h19v13H20z" /><path d="M180 55h15V44h32v11h25v12h-72z" /><path d="M314 24h13V14h28v10h22v12h-63z" /></g>}
    <Building x={-4} y={94} w={70} h={92} colour={night ? '#62728a' : '#83aaa0'} night={night} />
    <Building x={80} y={65} w={54} h={121} colour={night ? '#49617a' : '#739f94'} night={night} />
    <Building x={150} y={103} w={82} h={83} colour={night ? '#536c7e' : '#96b7a1'} night={night} />
    <Building x={250} y={43} w={46} h={143} colour={night ? '#384e6a' : '#69998e'} night={night} />
    <Building x={315} y={86} w={95} h={100} colour={night ? '#3d586a' : '#8bafa0'} night={night} />
    {tone === 'office' && <rect className={styles.lift} x="271" y="66" width="5" height="10" fill="#ffeab4" />}
    <rect y="172" width="420" height="14" fill={night ? '#263f4c' : '#759a7d'} />
    <g className={styles.traffic}><rect x="22" y="169" width={tone === 'university' ? 42 : 26} height="10" fill={night ? '#e4a570' : '#ce7754'} /><rect x="26" y="170" width="12" height="4" fill="#d8e7cf" /><rect x="26" y="178" width="5" height="3" fill={ink} /><rect x={tone === 'university' ? 54 : 40} y="178" width="5" height="3" fill={ink} /></g>
  </g>
}

function Window({ x, y, w, h, tone, clipId }: { x: number; y: number; w: number; h: number; tone: Tone; clipId: string }) {
  return <g>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill="#58736a" />
    <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="#f4edcc" />
    <svg aria-hidden="true" x={x} y={y} width={w} height={h} viewBox="0 0 420 186" preserveAspectRatio="xMidYMid slice"><Skyline tone={tone} /></svg>
    <rect x={x + Math.round(w / 2) - 3} y={y} width="6" height={h} fill="#e4d8b0" />
    <rect x={x - 10} y={y + h} width={w + 20} height="9" fill="#f4edcc" />
    <rect x={x - 6} y={y + h + 9} width={w + 12} height="4" fill="#b8b58c" />
    <defs><clipPath id={clipId}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
  </g>
}

function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g className={styles.leaves}><path d="M-3 0v-45h6V0z" fill="#4c7352" /><path d="M0-20h-12v-7h-10v-13h12v6H0zm0-15h13v-9h11v-14H13v10H0z" fill="#5e9366" /><path d="M0-8h13v-7h12v-12H13v8H0z" fill="#77a16f" /></g>
    <path d="M-17 0h34v7H13v23h-26V7h-4z" fill="#c67b59" /><rect x="-13" y="7" width="5" height="23" fill="#d89870" />
  </g>
}

function Fan({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><rect x="-3" y="-28" width="6" height="26" fill="#66766a" /><g className={styles.fan} fill="#81978a"><path d="M0-5h47v9H6v4H-1z" /><path d="M0-5h47v9H6v4H-1z" transform="rotate(120)" /><path d="M0-5h47v9H6v4H-1z" transform="rotate(240)" /></g><rect x="-6" y="-6" width="12" height="12" fill="#d9dfc5" /></g>
}

function Books({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><rect width="52" height="9" fill="#d1a15d" /><rect x="4" y="-9" width="44" height="9" fill="#708b73" /><rect x="0" y="-18" width="47" height="9" fill="#bf7359" /><path d="M7-15h35v3H7zm4 9h32v3H11zm-3 9h38v3H8z" fill="#f4e5c6" /></g>
}

function Avatar({ x, y, stage }: { x: number; y: number; stage: number }) {
  const hair = stage === 3 ? '#bec5ac' : '#35483e'
  const shirt = ['#f9edce', '#cd795b', '#e6e5d2', '#d5ab62'][stage]
  return <g transform={`translate(${x} ${y})`} className={styles.avatar}>
    <ellipse cx="21" cy="91" rx="29" ry="6" fill="#344b3b" opacity=".13" />
    <path d="M4 40h35v38H4z" fill={shirt} /><rect x="0" y="44" width="8" height="29" fill="#e8b08a" /><rect x="36" y="44" width="8" height="29" fill="#e8b08a" />
    <path d="M7 76h13v13H7zm17 0h13v13H24z" fill={stage === 0 ? '#466d5a' : '#536a63'} /><path d="M3 86h17v7H3zm21 0h17v7H24z" fill={ink} />
    <rect x="5" y="9" width="32" height="29" fill="#e8b08a" /><rect x="0" y="17" width="6" height="12" fill="#e8b08a" /><rect x="37" y="17" width="5" height="12" fill="#e8b08a" /><rect x="11" y="36" width="18" height="8" fill="#e8b08a" />
    <path d="M4 6h8V0h24v7h6v14h-7V12H11v12H4z" fill={hair} /><rect x="12" y="21" width="4" height="4" fill={ink} /><rect x="27" y="21" width="4" height="4" fill={ink} /><rect x="19" y="31" width="7" height="2" fill="#b57b61" />
    {stage === 0 && <g><path d="M9 43l12 10 12-10" fill="none" stroke="#44715b" strokeWidth="3" /><rect x="19" y="51" width="5" height="13" fill="#44715b" /></g>}
    {stage === 2 && <g><path d="M12 43l9 9 9-9" fill="none" stroke="#b8bba7" strokeWidth="3" /><rect x="19" y="48" width="5" height="22" fill="#6d8a7c" /><rect x="30" y="52" width="5" height="8" fill="#c9a56c" /></g>}
    {stage === 3 && <g fill="none" stroke="#5e6d62" strokeWidth="2"><rect x="9" y="18" width="11" height="10" /><rect x="24" y="18" width="11" height="10" /><path d="M20 22h4" /></g>}
  </g>
}

export default function Scene({ stage, reducedMotion }: SceneProps) {
  const id = useId().replace(/:/g, '')
  const tone: Tone = (['school', 'university', 'office', 'home'] as const)[stage] ?? 'school'
  const wall = ['#e7e8c8', '#eee3ca', '#c9d0c7', '#d8c8a8'][stage] ?? '#e7e8c8'
  const floor = ['#bca77e', '#bd9872', '#8c9e91', '#ad8a64'][stage] ?? '#bca77e'
  const label = ['A sunny classroom with a school desk, fan and neighbourhood view', 'A university room with a laptop, books and a campus view', 'An office at dusk, with a workstation and city skyline', 'A warm home in the evening, with an armchair, family pictures and HDB lights'][stage]
  return <div className={`${styles.scene} ${reducedMotion ? styles.still : ''}`} data-stage={tone}>
    <svg viewBox="0 0 480 400" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
      <rect width="480" height="400" fill={wall} />
      <rect y="245" width="480" height="155" fill={floor} />
      <rect y="239" width="480" height="8" fill="#74816b" />
      <g opacity=".2" stroke="#5b634c" strokeWidth="2"><path d="M0 289h480M0 339h480M0 389h480M52 247v42m96 0v50m-108 0v50m205-142v42m-41 50v50m186-142v42m-94 0v50m137 0v50" /></g>

      {stage === 0 && <>
        <Window x={228} y={42} w={218} h={147} tone={tone} clipId={id} />
        <rect x="22" y="81" width="175" height="115" fill="#a58e62" /><rect x="28" y="87" width="163" height="101" fill="#456d58" /><rect x="23" y="192" width="173" height="7" fill="#c9b382" />
        <g fill="#e3e6bc"><rect x="43" y="105" width="68" height="5" /><rect x="43" y="118" width="114" height="4" opacity=".7" /><rect x="43" y="130" width="91" height="4" opacity=".7" /><path d="M48 156h20v20H48zm34 0h20v20H82zm34 0h20v20h-20z" opacity=".4" /></g>
        <rect x="52" y="27" width="34" height="34" fill="#708474" /><rect x="56" y="31" width="26" height="26" fill="#f6edcc" /><path d="M69 36v10h8" fill="none" stroke={ink} strokeWidth="3" />
        <Fan x={162} y={29} />
        <rect x="190" y="263" width="23" height="88" fill="#597863" /><rect x="185" y="257" width="56" height="12" fill="#769374" />
        <Avatar x={173} y={202} stage={stage} />
        <rect x="117" y="289" width="220" height="15" fill="#e0bd7e" /><rect x="124" y="304" width="206" height="10" fill="#a77c50" /><path d="M129 314h12v66h-12zm184 0h12v66h-12z" fill="#697b65" />
        <rect x="144" y="277" width="45" height="10" fill="#f6ebce" /><rect x="146" y="274" width="44" height="4" fill="#7b9b83" /><Books x={265} y={280} />
        <path d="M355 286h41v62h-41zm7-12h27v12h-7v-6h-13v6h-7z" fill="#c07657" /><rect x="362" y="308" width="27" height="24" fill="#dc9470" /><rect x="372" y="313" width="7" height="4" fill="#f2cf85" />
        <Plant x={421} y={257} scale={1.05} />
      </>}

      {stage === 1 && <>
        <Window x={25} y={34} w={235} h={163} tone={tone} clipId={id} />
        <g><rect x="312" y="25" width="117" height="67" fill="#bd9b6b" /><rect x="319" y="32" width="103" height="53" fill="#f5e3b8" /><rect x="331" y="45" width="24" height="25" fill="#c47c61" /><rect x="365" y="43" width="41" height="4" fill="#83997a" /><rect x="365" y="53" width="31" height="4" fill="#83997a" /><rect x="365" y="63" width="37" height="4" fill="#83997a" /></g>
        <rect x="341" y="122" width="95" height="129" fill="#94795a" /><rect x="347" y="128" width="83" height="47" fill="#a78e69" /><rect x="347" y="183" width="83" height="56" fill="#a78e69" /><g fill="#e6ce95"><rect x="355" y="140" width="12" height="35" /><rect x="372" y="133" width="10" height="42" /><rect x="398" y="140" width="12" height="35" /></g><rect x="383" y="139" width="10" height="36" fill="#6b8b74" /><Books x={360} y={230} />
        <rect x="193" y="262" width="60" height="61" fill="#729b87" /><rect x="202" y="319" width="12" height="52" fill="#5a7164" /><rect x="236" y="319" width="12" height="52" fill="#5a7164" />
        <Avatar x={203} y={202} stage={stage} />
        <rect x="96" y="292" width="243" height="13" fill="#dbb57e" /><rect x="105" y="305" width="225" height="12" fill="#a27d56" /><path d="M108 317h12v63h-12zm209 0h12v63h-12z" fill="#687963" />
        <rect x="170" y="240" width="89" height="51" fill="#405b55" /><rect x="176" y="246" width="77" height="39" fill="#c0dec3" /><path d="M168 291h94l10 5H158z" fill="#647a70" /><rect x="186" y="255" width="41" height="4" fill="#4e8b73" /><rect x="186" y="266" width="23" height="3" fill="#6aa18a" /><rect className={styles.cursor} x="213" y="265" width="4" height="6" fill="#325f4f" />
        <Books x={282} y={283} /><Plant x={70} y={257} scale={0.95} />
        <rect x="118" y="274" width="23" height="18" fill="#f4e8c8" /><path d="M141 278h8v9h-8" fill="none" stroke="#f4e8c8" strokeWidth="4" />
        <g className={styles.steam} stroke="#fcf1d8" strokeWidth="3"><path d="M124 264v-9m9 9v-13" /></g>
      </>}

      {stage === 2 && <>
        <Window x={26} y={29} w={428} h={171} tone={tone} clipId={id} />
        <rect x="165" y="31" width="6" height="169" fill="#d9d9bd" /><rect x="310" y="31" width="6" height="169" fill="#d9d9bd" />
        <rect x="59" y="231" width="57" height="73" fill="#456559" /><rect x="79" y="302" width="12" height="60" fill="#425c53" /><rect x="55" y="360" width="62" height="7" fill="#425c53" /><rect x="54" y="367" width="11" height="7" fill={ink} /><rect x="106" y="367" width="11" height="7" fill={ink} />
        <Avatar x={74} y={205} stage={stage} />
        <rect x="128" y="290" width="261" height="14" fill="#e0d0a7" /><rect x="135" y="304" width="247" height="8" fill="#91a496" /><rect x="141" y="312" width="12" height="69" fill="#576f64" /><rect x="366" y="312" width="12" height="69" fill="#576f64" />
        <rect x="192" y="222" width="109" height="59" fill="#334b45" /><rect x="198" y="228" width="97" height="47" fill="#8fb8a3" /><rect x="239" y="281" width="13" height="9" fill="#4f6a5e" /><rect x="224" y="287" width="43" height="4" fill="#4f6a5e" />
        <g className={styles.monitor}><rect x="206" y="237" width="25" height="29" fill="#c2d4af" /><rect x="238" y="237" width="45" height="4" fill="#d7dfbe" /><rect x="238" y="248" width="35" height="4" fill="#507d65" /><rect x="238" y="259" width="41" height="4" fill="#507d65" /></g>
        <rect x="201" y="292" width="87" height="5" fill="#718a7b" /><Books x={321} y={281} /><Plant x={427} y={291} scale={1.3} />
        <rect x="19" y="283" width="22" height="64" fill="#889c88" /><rect x="23" y="289" width="14" height="4" fill="#cbd3ba" /><rect x="23" y="307" width="14" height="4" fill="#cbd3ba" /><rect x="23" y="325" width="14" height="4" fill="#cbd3ba" />
      </>}

      {stage === 3 && <>
        <Window x={222} y={42} w={222} h={147} tone={tone} clipId={id} />
        <g className={styles.curtain}><path d="M213 33h27v164h-27zM427 33h27v164h-27z" fill="#c48765" /><path d="M220 35h5v160h-5zm215 0h5v160h-5z" fill="#db9c73" /></g>
        <Fan x={164} y={35} />
        <rect x="37" y="60" width="57" height="64" fill="#87765a" /><rect x="43" y="66" width="45" height="52" fill="#e4c495" /><rect x="53" y="77" width="13" height="14" fill="#b77a5b" /><rect x="68" y="80" width="11" height="12" fill="#b77a5b" /><path d="M48 96h21v16H48zm18 0h16v16H66z" fill="#72937b" />
        <rect x="113" y="90" width="48" height="39" fill="#87765a" /><rect x="119" y="96" width="36" height="27" fill="#e3d8ab" /><path d="M122 116l9-10 7 6 7-13 7 17z" fill="#6f947b" />
        <rect x="34" y="319" width="360" height="62" fill="#d2b77f" /><rect x="42" y="327" width="344" height="46" fill="#bd9c65" /><path d="M51 337h323M51 362h323" stroke="#e4ce94" strokeWidth="3" />
        <rect x="59" y="227" width="105" height="99" fill="#b56e50" /><rect x="66" y="234" width="91" height="71" fill="#d5966b" />
        <Avatar x={90} y={216} stage={stage} />
        <rect x="49" y="282" width="23" height="58" fill="#c7885e" /><rect x="153" y="282" width="23" height="58" fill="#c7885e" /><rect x="67" y="315" width="91" height="25" fill="#b97050" /><rect x="63" y="340" width="12" height="18" fill="#775d44" /><rect x="150" y="340" width="12" height="18" fill="#775d44" />
        <rect x="218" y="312" width="112" height="13" fill="#d7b780" /><rect x="225" y="325" width="10" height="38" fill="#866e4d" /><rect x="313" y="325" width="10" height="38" fill="#866e4d" />
        <rect x="241" y="294" width="22" height="18" fill="#e9ddbc" /><path d="M263 298h7v9h-7" fill="none" stroke="#e9ddbc" strokeWidth="4" /><g className={styles.steam} stroke="#f6e6c5" strokeWidth="3"><path d="M247 285v-12m8 12v-9" /></g><Books x={278} y={302} />
        <rect x="377" y="214" width="6" height="123" fill="#6a6d51" /><path d="M350 207h60l-11-35h-38z" fill="#f0cd85" /><rect x="361" y="337" width="39" height="6" fill="#6a6d51" /><Plant x={435} y={303} scale={1.1} />
      </>}
      <rect x="0" y="393" width="480" height="7" fill={ink} opacity=".12" />
    </svg>
  </div>
}

export function Banknote({ className = '', denomination = 10 }: { className?: string; denomination?: number } = {}) {
  const colours: Record<number, [string, string, string]> = { 2: ['#e5d7ed', '#845b97', '#493455'], 10: ['#f3c8c1', '#b84b49', '#6a2829'], 50: ['#c9e0ef', '#437da6', '#244c71'], 100: ['#f5deba', '#ba7c38', '#714a25'], 1000: ['#e7c9df', '#a04b88', '#603453'] };
  const [paper, ink, dark] = colours[denomination] ?? colours[10];
  return <svg className={`${styles.banknote} ${className}`} viewBox="0 0 340 170" role="img" aria-label={`Cartoon Singapore ${denomination} dollar note marked specimen`} xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="334" height="164" rx="8" fill={paper} stroke={dark} strokeWidth="3" />
    <rect x="12" y="12" width="316" height="146" rx="3" fill="none" stroke={ink} strokeWidth="2" />
    <path d="M26 40H181M26 45H170M26 133H186M26 138H176" stroke={ink} opacity=".45" />
    <g fill="none" stroke={ink} opacity=".35">{[0,1,2,3].map(i => <ellipse key={i} cx="111" cy="87" rx={38+i*8} ry={27+i*7} />)}</g>
    <path d="M38 77h20l9 19-11 17H37L27 97z" fill={ink} opacity=".35" />
    <path d="M45 85v18m-8-9h17" stroke={paper} strokeWidth="3" />
    <ellipse cx="254" cy="91" rx="53" ry="58" fill={ink} opacity=".17" />
    <path d="M207 145v-16l23-18h39l27 18v16z" fill={dark} />
    <path d="m235 112 15 21 15-21-15-8z" fill={paper} />
    <path d="m245 124 5 7 5-7 4 21h-18z" fill={ink} />
    <path d="M232 61h38v29l-8 18-14 6-12-9-8-17V69z" fill={paper} stroke={dark} strokeWidth="2" />
    <path d="M228 65V47l8-7h31l8 7v20l-17-5z" fill={dark} />
    <path d="M234 79h8m13 0h8m-13 3-3 11h7m-15 6h20" stroke={dark} strokeWidth="2" fill="none" />
    <path d="M242 95h15v5h-15z" fill={dark} />
    <path d="m236 108-13 12 14 22m26-34 14 12-13 22" stroke={ink} strokeWidth="2" fill="none" />
    <g fill={dark} fontWeight="bold"><text x="26" y="32">SINGAPORE</text><text transform="translate(24 121) scale(2)">{denomination}</text><text x="295" y="32">{denomination}</text><text x="22" y="150">SGD</text></g>
    <g transform="translate(67 117) rotate(-15)"><rect x="-5" y="-19" width="186" height="27" rx="2" fill={paper} stroke={dark} strokeWidth="2" /><text x="88" y="1" textAnchor="middle" fill={dark} fontWeight="bold">SPECIMEN</text></g>
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

export function Mascot({ mood = 'caught' }: { mood?: 'happy' | 'caught' | 'smug' }) {
  return <svg className={styles.mascot} viewBox="0 0 96 96" role="img" aria-label={`Scamagotchi looks ${mood}`} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
    <ellipse cx="48" cy="87" rx="31" ry="5" fill="#253e35" opacity=".13" />
    <path d="M24 18h12V8h10v9h15V8h10v14h8v12h7v34h-8v11H66v8H55v-9H37v9H24v-9H14V65H8V42h8V28h8z" fill="#2f4842" />
    <path d="M27 24h12V16h4v8h21V16h4v13h8v11h5v23h-8v10H22V61h-8V45h8V33h5z" fill="#8ab48b" />
    <rect x="24" y="38" width="50" height="21" fill="#304e44" /><rect x="29" y="40" width="16" height="13" fill="#f8edc4" /><rect x="53" y="40" width="16" height="13" fill="#f8edc4" />
    <rect x={mood === 'smug' ? 37 : 34} y="44" width="5" height={mood === 'happy' ? 3 : 6} fill="#253d35" /><rect x={mood === 'smug' ? 61 : 58} y="44" width="5" height={mood === 'happy' ? 3 : 6} fill="#253d35" />
    {mood === 'caught' ? <rect x="44" y="61" width="11" height="8" fill="#355246" /> : <path d="M36 60v5h25v-5" fill="none" stroke="#355246" strokeWidth="4" />}
    <rect x="25" y="58" width="9" height="4" fill="#d5ad77" /><rect x="66" y="58" width="8" height="4" fill="#d5ad77" />
    {mood === 'caught' && <path d="M84 14h4v12h-4zm0 16h4v4h-4z" fill="#c47757" />}
  </svg>
}
