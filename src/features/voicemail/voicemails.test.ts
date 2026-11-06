import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { ENCOUNTERS } from '../../game/content';
import { VOICEMAIL_SCRIPTS } from './voicemailScripts';
import { getVoicemailAudio } from './voicemails';
import manifest from './generated/voicemail-audio.json';

describe('bundled voicemail recordings', () => {
  const cases = ENCOUNTERS.filter((encounter) => encounter.channel === 'calls');
  it('voices every call with the selected voice, including the genuine request', () => {
    expect(manifest.voice).toEqual({
      id: 'i9SZdx1xJqqryIiaFdmN',
      name: 'Kopi Gao - Expressive Singlish',
    });
    expect(cases.some((encounter) => !encounter.scam)).toBe(true);
    expect(Object.keys(manifest.clips).sort()).toEqual(
      cases.map((encounter) => encounter.id).sort(),
    );
  });
  it.each(cases)('$id has intact local audio and a matching anonymous transcript', (encounter) => {
    const recording = getVoicemailAudio(encounter.id);
    expect(recording).toBeDefined();
    expect(recording!.text).toBe(VOICEMAIL_SCRIPTS[encounter.id]);
    expect(recording!.text).not.toMatch(/\{name\}|Mr\/Mrs|^(Caller|Ravi):|S\$/m);
    const info = manifest.clips[encounter.id as keyof typeof manifest.clips];
    const audio = readFileSync(resolve('public', recording!.src.slice(1)));
    expect(audio.length).toBe(info.bytes);
    expect(createHash('sha256').update(audio).digest('hex')).toBe(info.audioSha256);
    expect(audio.length).toBeGreaterThan(1000);
  });
  it('has no invented audio for message-only encounters or unknown IDs', () => {
    expect(getVoicemailAudio('school-a')).toBeUndefined();
    expect(getVoicemailAudio('unknown')).toBeUndefined();
  });
});
