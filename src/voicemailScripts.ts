import { ENCOUNTERS } from './content.ts';

// Only authored dialogue is sent to TTS. Player names and saved-game data
// never leave the browser. These neutral greetings work for every character.
export const VOICEMAIL_SCRIPTS: Record<string, string> = Object.fromEntries(
  ENCOUNTERS.filter(encounter => encounter.channel === 'calls').map(encounter => [
    encounter.id,
    (encounter.callTranscript ?? encounter.messages).map(line => line
      .replace(/^[^:]+:\s*/, '')
      .replace(/\s*\{name\}/g, '')
      .replace(/S\$([\d,]+)/g, '$1 Singapore dollars')
      .trim()).join('\n\n'),
  ]),
);
