import { expect, test, type Page } from '@playwright/test';
import { ENCOUNTERS } from '../src/content';
import { createGame, SAVE_KEY, type GameState } from '../src/game';
import { VOICEMAIL_SCRIPTS } from '../src/voicemailScripts';

const phone = (page: Page) => page.getByTestId('phone');
const audio = (page: Page) => phone(page).locator('audio[data-voicemail]');
const unavailable = 'Audio unavailable. You can still read the transcript.';

function callSave(caseId: string, declined = false): GameState {
  const state = createGame(() => 0.999);
  Object.assign(state, {
    started: true,
    briefing: false,
    stage: 3,
    cash: 3000000,
    gross: 10000000,
    reducedMotion: true,
  });
  for (const encounter of ENCOUNTERS.filter((item) => item.stage < 3)) {
    state.progress[encounter.id].arrived = true;
    state.progress[encounter.id].result = {
      decision: 'decline',
      verified: false,
      unsafe: false,
      personalDelta: 0,
      employerLoss: 0,
      inspectedEvidence: [],
      missed: !encounter.scam,
    };
  }
  Object.assign(state.progress[caseId], {
    arrived: true,
    read: true,
    callStatus: declined ? 'declined' : 'ringing',
  });
  state.phone = { open: true, app: declined ? 'messages' : 'calls', caseId, record: null };
  return state;
}

function silentWave() {
  const samples = 8000 * 12;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  return buffer;
}

async function openCall(
  page: Page,
  caseId: string,
  options: { declined?: boolean; missing?: boolean; broken?: boolean } = {},
) {
  await page.route('**/src/voicemails.ts*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: options.missing
        ? 'export function getVoicemailAudio() { return undefined; }'
        : `const scripts = ${JSON.stringify(VOICEMAIL_SCRIPTS)}; export function getVoicemailAudio(id) { return {src:'/__test_audio/' + id + '.wav',text:scripts[id]}; }`,
    }),
  );
  await page.route('**/__test_audio/*.wav', (route) =>
    options.broken
      ? route.fulfill({ status: 404, body: '' })
      : route.fulfill({ contentType: 'audio/wav', body: silentWave() }),
  );
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: SAVE_KEY,
    value: JSON.stringify(callSave(caseId, options.declined)),
  });
  await page.goto('/');
}

for (const caseId of ['home-a', 'home-b', 'home-c']) {
  test(`${caseId}: call audio is user initiated and pauses on hide or navigation`, async ({
    page,
  }) => {
    let audioRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/__test_audio/')) audioRequests++;
    });
    await openCall(page, caseId);
    await expect(audio(page)).toHaveCount(0);
    await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
    await expect(audio(page)).toHaveCount(1);
    await expect(audio(page)).toHaveAttribute('preload', 'none');
    await expect(audio(page)).not.toHaveAttribute('autoplay');
    expect(
      await audio(page).evaluate(
        (node) => (node as HTMLAudioElement).paused && (node as HTMLAudioElement).currentTime === 0,
      ),
    ).toBe(true);
    expect(audioRequests).toBe(0);
    await expect(
      phone(page).getByText(VOICEMAIL_SCRIPTS[caseId].split('\n\n')[0], { exact: true }),
    ).toBeVisible();
    await audio(page).focus();
    await audio(page).press('Space');
    await expect
      .poll(() => audio(page).evaluate((node) => !(node as HTMLAudioElement).paused))
      .toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect
      .poll(() => audio(page).evaluate((node) => (node as HTMLAudioElement).paused))
      .toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await audio(page).evaluate((node) => (node as HTMLAudioElement).paused)).toBe(true);
    await audio(page).focus();
    await audio(page).press('Space');
    await expect
      .poll(() => audio(page).evaluate((node) => !(node as HTMLAudioElement).paused))
      .toBe(true);
    const playing = await audio(page).elementHandle();
    await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
    await expect(audio(page)).toHaveCount(0);
    expect(await playing!.evaluate((node) => (node as HTMLAudioElement).paused)).toBe(true);
    const progress = await page.evaluate(
      ({ key, id }) => JSON.parse(localStorage.getItem(key)!).progress[id],
      { key: SAVE_KEY, id: caseId },
    );
    expect(progress.evidence).toEqual([]);
    expect(progress.result).toBeNull();
    await playing!.dispose();
  });
}

test('declined call has full voicemail transcript and replay from call history on a narrow screen', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCall(page, 'home-c', { declined: true });
  await expect(audio(page)).toBeVisible();
  await phone(page).getByText('Transcript', { exact: true }).click();
  await expect(
    phone(page).getByText(VOICEMAIL_SCRIPTS['home-c'].split('\n\n')[2], { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('mobile-voicemail.png'), fullPage: true });
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Calls', exact: true }).click();
  const history = phone(page)
    .locator('details')
    .filter({ has: page.locator('summary').filter({ hasText: 'Ravi' }) });
  await history.locator('summary').click();
  await expect(audio(page)).toBeVisible();
  await audio(page).focus();
  await audio(page).press('Space');
  await expect
    .poll(() => audio(page).evaluate((node) => !(node as HTMLAudioElement).paused))
    .toBe(true);
  await history.locator('summary').click();
  expect(await audio(page).evaluate((node) => (node as HTMLAudioElement).paused)).toBe(true);
});

test('failed audio leaves the exact transcript and an ordinary unavailable message', async ({
  page,
}) => {
  await openCall(page, 'home-a', { broken: true });
  await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
  await audio(page).focus();
  await audio(page).press('Space');
  await expect(phone(page).getByText(unavailable, { exact: true })).toBeVisible();
  await expect(audio(page)).toHaveCount(0);
  await expect(
    phone(page).getByText(VOICEMAIL_SCRIPTS['home-a'].split('\n\n')[2], { exact: true }),
  ).toBeVisible();
});

test('a resolved answered call reopens as a recording rather than an active call', async ({
  page,
}) => {
  await openCall(page, 'home-a');
  await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
  const decisions = page.getByTestId('decision-card');
  await decisions.getByRole('button', { name: 'Decline request', exact: true }).click();
  await decisions.getByRole('button', { name: 'Confirm decision', exact: true }).click();
  await phone(page).getByRole('button', { name: 'Continue', exact: true }).click();
  await phone(page)
    .getByRole('button', { name: 'Open notification centre from top bar', exact: true })
    .click();
  await phone(page)
    .getByRole('button', { name: /Phone · Unknown caller/ })
    .click();
  await expect(phone(page).getByRole('heading', { name: 'Recents', exact: true })).toBeVisible();
  await expect(phone(page).getByRole('button', { name: 'End call', exact: true })).toHaveCount(0);
  await phone(page).locator('summary').filter({ hasText: 'Unknown caller' }).click();
  await expect(audio(page)).toBeVisible();
  expect(await audio(page).evaluate((node) => (node as HTMLAudioElement).paused)).toBe(true);
  await phone(page).getByRole('button', { name: 'Read outcome', exact: true }).click();
  await expect(
    phone(page).getByRole('heading', { name: 'Scamagotchi’s scheme', exact: true }),
  ).toBeVisible();
});

test('missing recordings have the same transcript-first treatment for every call', async ({
  browser,
}) => {
  for (const caseId of ['home-a', 'home-b', 'home-c']) {
    const page = await browser.newPage();
    await openCall(page, caseId, { missing: true });
    await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
    await expect(phone(page).getByText(unavailable, { exact: true })).toBeVisible();
    await expect(audio(page)).toHaveCount(0);
    await expect(
      phone(page).getByText(VOICEMAIL_SCRIPTS[caseId].split('\n\n')[0], { exact: true }),
    ).toBeVisible();
    await page.close();
  }
});
