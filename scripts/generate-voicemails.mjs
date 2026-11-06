import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { VOICEMAIL_SCRIPTS } from '../src/voicemailScripts.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(join(root, 'scripts/elevenlabs-voice.json'), 'utf8'));
const manifestPath = join(root, 'src/generated/voicemail-audio.json');
const outputDir = join(root, 'public/audio/voicemails');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const checkOnly = process.argv.includes('--check');
const force = process.argv.includes('--force');
const unknown = process.argv.slice(2).filter((arg) => !['--check', '--force'].includes(arg));
if (unknown.length || (checkOnly && force))
  throw new Error('Use --check or --force, or no arguments.');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const planned = [];
for (const [id, text] of Object.entries(VOICEMAIL_SCRIPTS)) {
  const scriptHash = hash(JSON.stringify({ text, ...config }));
  const src = `/audio/voicemails/${id}-${scriptHash.slice(0, 12)}.mp3`;
  const clip = manifest.clips[id];
  let valid = clip?.src === src && clip.text === text && clip.scriptHash === scriptHash;
  if (valid) {
    try {
      const audio = await readFile(join(root, 'public', src));
      valid = audio.length > 1000 && hash(audio) === clip.audioSha256;
    } catch {
      valid = false;
    }
  }
  if (valid && !force) console.log(`Cached: ${id}`);
  else planned.push({ id, text, src, scriptHash });
}
if (checkOnly) {
  if (planned.length)
    throw new Error(
      `Missing or stale voicemail audio: ${planned.map((clip) => clip.id).join(', ')}. Run npm run audio:generate.`,
    );
  console.log('All voicemail audio matches the current scripts and voice configuration.');
} else if (planned.length) {
  const { loadEnv } = await import('vite');
  const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
  const env = loadEnv('development', root, 'ELEVENLABS_');
  const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
  if (!apiKey)
    throw new Error(
      'Set ELEVENLABS_API_KEY in .env.local or your environment. Never use a VITE_ prefix.',
    );
  const client = new ElevenLabsClient({ apiKey });
  console.log(
    `Generating ${planned.length} clips (${planned.reduce((n, clip) => n + clip.text.length, 0)} characters) with ${config.voiceName}.`,
  );
  await mkdir(outputDir, { recursive: true });
  manifest.voice = { id: config.voiceId, name: config.voiceName };
  manifest.modelId = config.modelId;
  for (const clip of planned) {
    // No automatic retry: an ambiguous failure must not charge repeatedly.
    let stream;
    try {
      stream = await client.textToSpeech.convert(
        config.voiceId,
        {
          text: clip.text,
          modelId: config.modelId,
          outputFormat: config.outputFormat,
          voiceSettings: config.voiceSettings,
        },
        { timeoutInSeconds: 120, maxRetries: 0 },
      );
    } catch (error) {
      // Do not dump SDK request objects or credentials into terminal logs.
      const status = Number.isInteger(error?.statusCode) ? error.statusCode : 'network/timeout';
      throw new Error(
        `ElevenLabs generation failed for ${clip.id} (status ${status}). Check account access, credits and connectivity; existing clips were preserved.`,
      );
    }
    const audio = Buffer.from(await new Response(stream).arrayBuffer());
    if (audio.length < 1000)
      throw new Error(`Empty or invalid audio for ${clip.id}; existing files were preserved.`);
    const audioPath = join(root, 'public', clip.src);
    await writeFile(`${audioPath}.tmp`, audio);
    await rename(`${audioPath}.tmp`, audioPath);
    manifest.clips[clip.id] = {
      src: clip.src,
      text: clip.text,
      scriptHash: clip.scriptHash,
      audioSha256: hash(audio),
      bytes: audio.length,
      generatedAt: new Date().toISOString(),
    };
    await writeFile(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
    await rename(`${manifestPath}.tmp`, manifestPath);
    console.log(`Generated: ${clip.id} (${audio.length} bytes)`);
  }
} else {
  console.log('All clips are current. No API requests or credits used.');
}
