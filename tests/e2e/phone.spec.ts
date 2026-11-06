import { expect, test, type Page } from '@playwright/test';
import { CASES, ENCOUNTERS } from '../../src/game/content';
import { createGame, SAVE_KEY, type GameState } from '../../src/game/game';

const phone = (page: Page) => page.getByTestId('phone');
const content = (page: Page) => phone(page).locator('div[class*="_content_"]');
const home = async (page: Page) =>
  phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();

async function openEncounter(page: Page, caseId: string) {
  const state = createGame(() => 0.999),
    encounter = CASES[caseId];
  Object.assign(state, {
    started: true,
    briefing: false,
    stage: encounter.stage,
    cash: 3000000,
    gross: 10000000,
    reducedMotion: true,
  });
  for (const previous of ENCOUNTERS.filter((item) => item.stage < encounter.stage)) {
    state.progress[previous.id].arrived = true;
    state.progress[previous.id].result = {
      decision: 'decline',
      verified: false,
      unsafe: false,
      personalDelta: 0,
      employerLoss: 0,
      inspectedEvidence: [],
      missed: !previous.scam,
    };
  }
  Object.assign(state.progress[caseId], {
    arrived: true,
    read: true,
    callStatus: encounter.channel === 'calls' ? 'ringing' : null,
  });
  state.phone = { open: true, app: encounter.channel, caseId, record: null };
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: SAVE_KEY, value: JSON.stringify(state) },
  );
  await page.goto('/');
  await expect(phone(page)).toBeVisible();
}

async function fitsPhone(page: Page) {
  const geometry = await content(page).evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

for (const width of [320, 390, 430, 1440]) {
  test(`phone mail, saved contacts, My Card, bank and notifications at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await openEncounter(page, 'office-a');
    await phone(page).getByRole('button', { name: 'Show sender details', exact: true }).click();
    await expect(
      phone(page).locator('dd').filter({ hasText: CASES['office-a'].senderEmail! }),
    ).toBeVisible();
    await fitsPhone(page);
    await phone(page).getByRole('button', { name: 'Back to inbox', exact: true }).click();
    await expect(phone(page).getByRole('heading', { name: 'Inbox', exact: true })).toBeVisible();
    await phone(page).getByRole('textbox', { name: 'Search in mail', exact: true }).fill('Ethan');
    await phone(page)
      .getByRole('button', { name: /Ethan.*Team event/ })
      .click();
    await home(page);
    await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
    await phone(page).getByRole('textbox', { name: 'Search contacts', exact: true }).fill('Ethan');
    await phone(page)
      .getByRole('button', { name: /Ethan Manager/ })
      .click();
    await phone(page).getByRole('button', { name: 'Call Ethan', exact: true }).click();
    await expect(phone(page).getByRole('region', { name: 'Ethan', exact: true })).toBeVisible();
    await fitsPhone(page);
    await phone(page).getByRole('button', { name: 'Back to contacts', exact: true }).click();
    await phone(page)
      .getByRole('button', { name: /My Card/ })
      .click();
    await expect(
      phone(page).getByRole('heading', { name: 'Right now', exact: true }),
    ).toBeVisible();
    await fitsPhone(page);
    await phone(page).getByRole('button', { name: 'Back to contacts', exact: true }).click();
    await home(page);
    await phone(page).getByRole('button', { name: 'Bank', exact: true }).click();
    await expect(
      phone(page).getByRole('heading', { name: 'Recent activity', exact: true }),
    ).toBeVisible();
    await fitsPhone(page);
    await phone(page)
      .getByRole('button', { name: 'Open notification centre from top bar', exact: true })
      .click();
    await expect(
      phone(page).getByRole('heading', { name: 'Notification Centre', exact: true }),
    ).toBeVisible();
    await fitsPhone(page);
    if (width === 320 || width === 1440)
      await phone(page).screenshot({ path: testInfo.outputPath('notification-phone.png') });
    await phone(page)
      .getByRole('button', { name: /Mail · Ethan/ })
      .click();
    await expect(
      phone(page).getByRole('button', { name: 'Show sender details', exact: true }),
    ).toBeVisible();
    const saved: GameState = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      SAVE_KEY,
    );
    expect(saved.progress['office-a'].evidence).toContain(CASES['office-a'].decisive);
    expect(saved.progress['office-a'].result).toBeNull();
  });

  test(`phone call, 1.25x audio, ended follow-up and recents at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await openEncounter(page, 'home-b');
    await expect(
      phone(page).getByRole('button', { name: 'Accept call', exact: true }),
    ).toBeVisible();
    await fitsPhone(page);
    await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
    await expect(
      phone(page).getByRole('button', { name: 'End call', exact: true }),
    ).toBeInViewport();
    const audio = phone(page).locator('audio');
    await expect(audio).toBeVisible();
    expect(await audio.evaluate((node) => (node as HTMLAudioElement).playbackRate)).toBe(1.25);
    await audio.focus();
    await audio.press('Space');
    await expect
      .poll(() => audio.evaluate((node) => !(node as HTMLAudioElement).paused))
      .toBe(true);
    await expect
      .poll(() => audio.evaluate((node) => (node as HTMLAudioElement).currentTime))
      .toBeGreaterThan(0);
    await fitsPhone(page);
    if (width === 320 || width === 1440)
      await phone(page).screenshot({ path: testInfo.outputPath('answered-phone.png') });
    const oldAudio = await audio.elementHandle();
    await phone(page).getByRole('button', { name: 'End call', exact: true }).click();
    expect(await oldAudio!.evaluate((node) => (node as HTMLAudioElement).paused)).toBe(true);
    await oldAudio!.dispose();
    await expect(
      phone(page).getByRole('button', { name: 'Reply to message', exact: true }),
    ).toBeVisible();
    await phone(page).getByText('Transcript', { exact: true }).click();
    await fitsPhone(page);
    await home(page);
    await phone(page).getByRole('button', { name: 'Calls', exact: true }).click();
    await phone(page).locator('summary').filter({ hasText: 'Unknown mobile' }).click();
    await expect(phone(page).locator('audio')).toBeVisible();
    await fitsPhone(page);
    await phone(page).getByRole('button', { name: 'Open conversation', exact: true }).click();
    await expect(
      phone(page).getByRole('button', { name: 'Reply to message', exact: true }),
    ).toBeVisible();
  });
}

test('keyboard remains inside the request, dismisses options and reveals a message reply', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await openEncounter(page, 'school-a');
  const first = phone(page).getByRole('button', {
    name: 'Open notification centre from top bar',
    exact: true,
  });
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByTestId('decision-card').getByRole('button', { name: 'Report concern', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await phone(page).getByRole('button', { name: 'More phone options', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    phone(page).getByRole('button', { name: 'More phone options', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  await phone(page).getByRole('button', { name: 'Reply to message', exact: true }).click();
  const reply = phone(page).getByRole('button', {
    name: 'Could you confirm the details?',
    exact: true,
  });
  await expect(reply).toBeInViewport();
  await expect(reply).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(reply).toHaveCount(0);
  await expect(
    phone(page).getByRole('button', { name: 'Reply to message', exact: true }),
  ).toBeFocused();
});
