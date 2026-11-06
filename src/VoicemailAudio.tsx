import { useEffect, useId, useRef, useState } from 'react';
import { getVoicemailAudio } from './voicemails';
import { VOICEMAIL_SCRIPTS } from './voicemailScripts';
import styles from './VoicemailAudio.module.css';

export default function VoicemailAudio({ caseId, transcript, collapsed = false, dark = false, paused = false }: {
  caseId: string;
  transcript: string[];
  collapsed?: boolean;
  dark?: boolean;
  paused?: boolean;
}) {
  const recording = getVoicemailAudio(caseId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  const transcriptId = useId();
  const script = recording?.text ?? VOICEMAIL_SCRIPTS[caseId];
  const lines = script ? script.split(/\n+/).filter(Boolean) : transcript;

  useEffect(() => {
    setFailed(false);
    const audio = audioRef.current;
    const pauseWhenHidden = () => { if (document.hidden) audio?.pause(); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      audio?.pause();
    };
  }, [caseId, recording?.src]);

  useEffect(() => { if (paused) audioRef.current?.pause(); }, [paused]);

  const text = <div id={transcriptId} className={styles.transcript}>{lines.map((line, index) => <p key={index}>{line}</p>)}</div>;
  return <section className={styles.recording} data-dark={dark || undefined} aria-label="Voice message">
    <strong className={styles.label}>Voice message</strong>
    {recording && !failed ? <audio ref={audioRef} src={recording.src} controls preload="none" tabIndex={0}
      aria-label="Voice message audio" aria-describedby={transcriptId} data-voicemail
      onError={() => setFailed(true)} onPlay={event => {
        if (document.hidden || paused) { event.currentTarget.pause(); return; }
        document.querySelectorAll<HTMLAudioElement>('audio[data-voicemail]').forEach(other => {
          if (other !== event.currentTarget) other.pause();
        });
      }} /> : <p className={styles.unavailable} role="status">Audio unavailable. You can still read the transcript.</p>}
    {collapsed ? <details className={styles.disclosure}><summary>Transcript</summary>{text}</details> : <><small className={styles.transcriptLabel}>Transcript</small>{text}</>}
  </section>;
}
