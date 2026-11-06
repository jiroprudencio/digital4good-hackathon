import manifest from './generated/voicemail-audio.json';
import { VOICEMAIL_SCRIPTS } from './voicemailScripts';

type Clip = { src: string; text: string };

export function getVoicemailAudio(caseId: string): Clip | undefined {
  const clip = (manifest.clips as Record<string, Clip>)[caseId];
  // Do not play stale dialogue if a scenario changes before regeneration.
  if (!clip || clip.text !== VOICEMAIL_SCRIPTS[caseId]
    || !/^\/audio\/voicemails\/[a-z0-9-]+\.mp3$/.test(clip.src)) return undefined;
  return { src: clip.src, text: clip.text };
}
