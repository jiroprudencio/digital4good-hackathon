import { expect, test, type Page } from '@playwright/test';
import { CASES, ENCOUNTERS } from '../src/content';
import { createGame, SAVE_KEY, type GameState } from '../src/game';

const phone = (page: Page) => page.getByTestId('phone');
const practice = (page: Page) =>
  phone(page).getByRole('region', { name: 'Safety actions practice', exact: true });
const saved = (page: Page): Promise<GameState> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);

async function start(page: Page, caseId: string) {
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
  for (const prior of ENCOUNTERS.filter((item) => item.stage < encounter.stage)) {
    state.progress[prior.id].arrived = true;
    state.progress[prior.id].result = {
      decision: 'decline',
      verified: false,
      unsafe: false,
      personalDelta: 0,
      employerLoss: 0,
      inspectedEvidence: [],
      missed: !prior.scam && prior.stage !== 3,
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
  await expect(page.getByTestId('decision-card')).toBeVisible();
}

async function openPractice(page: Page) {
  await page
    .getByTestId('decision-card')
    .getByRole('button', { name: 'Report concern', exact: true })
    .click();
  await expect(practice(page)).toBeVisible();
}

async function report(page: Page, reason = 'Scam or phishing', mail = false) {
  await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
  await practice(page)
    .getByRole('button', {
      name: mail ? 'Open email more menu' : 'Open message options',
      exact: true,
    })
    .click();
  await practice(page)
    .getByRole('button', { name: mail ? /Report phishing/ : 'Report message', exact: !mail })
    .click();
  await practice(page).getByRole('radio').first().check();
  await practice(page).getByRole('button', { name: 'Continue to reason', exact: true }).click();
  expect(await practice(page).getByRole('radio', { checked: true }).count()).toBe(0);
  await practice(page).getByRole('radio', { name: reason, exact: true }).check();
  await practice(page).getByRole('button', { name: 'Review practice report', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Submit practice report', exact: true }).click();
  await expect(
    practice(page).getByText('Report recorded in practice', { exact: true }),
  ).toBeVisible();
}

test('Telegram reporting preserves evidence, selects a message and reason, records block/report, then resolves', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const external: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !request.url().includes('127.0.0.1'))
      external.push(request.url());
  });
  await start(page, 'school-a');
  await page
    .getByTestId('decision-card')
    .screenshot({ path: testInfo.outputPath('decision-colours.png') });
  const before = await saved(page);
  await openPractice(page);
  await practice(page).getByRole('button', { name: 'Open message options', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Block sender', exact: true }).click();
  await expect(
    practice(page).getByRole('button', { name: 'Confirm block sender', exact: true }),
  ).toBeEnabled();
  await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Confirm block sender', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Open message options', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Report message', exact: true }).click();
  await expect(
    practice(page).getByRole('button', { name: 'Continue to reason', exact: true }),
  ).toBeDisabled();
  await practice(page).getByRole('radio').nth(2).check();
  await practice(page).getByRole('button', { name: 'Continue to reason', exact: true }).click();
  await expect(
    practice(page).getByRole('button', { name: 'Review practice report', exact: true }),
  ).toBeDisabled();
  await practice(page).getByRole('radio', { name: 'Scam or phishing', exact: true }).check();
  await practice(page).getByRole('button', { name: 'Review practice report', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Submit practice report', exact: true }).click();
  const midway = await saved(page);
  expect(midway.progress['school-a'].safety).toEqual({
    evidenceSaved: true,
    blocked: true,
    reported: true,
    reason: 'scam',
  });
  expect(midway.progress['school-a'].result).toBeNull();
  expect(midway.progress['school-a'].evidence).toEqual([]);
  expect(midway.cash).toBe(before.cash);
  expect(
    await phone(page)
      .locator('div[class*="_content_"]')
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
  await practice(page)
    .getByRole('button', { name: 'Finish report and view outcome', exact: true })
    .click();
  await expect(
    phone(page).getByRole('heading', { name: 'Scamagotchi’s scheme', exact: true }),
  ).toBeVisible();
  expect((await saved(page)).progress['school-a'].result?.decision).toBe('report');
  await page.reload();
  await expect(phone(page).getByText('Sender blocked in practice', { exact: true })).toBeVisible();
  await expect(phone(page).getByText('Report recorded in practice', { exact: true })).toBeVisible();
  await phone(page).screenshot({ path: testInfo.outputPath('report-receipt-mobile.png') });
  expect(external).toEqual([]);
});

test('Gmail practice explicitly separates computer phishing from spam and sender blocking', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await start(page, 'office-a');
  await phone(page).getByRole('button', { name: 'More phone options', exact: true }).click();
  await phone(page).getByRole('button', { name: 'Report phishing or spam', exact: true }).click();
  await practice(page)
    .getByRole('button', { name: /Report phishing/ })
    .click();
  await expect(
    practice(page).getByText(
      'Gmail documents Report phishing on a computer. This phone screen rehearses that route; it is not an iPhone menu option.',
      { exact: true },
    ),
  ).toBeVisible();
  await phone(page).screenshot({ path: testInfo.outputPath('gmail-report-practice.png') });
  await practice(page).getByRole('radio').check();
  await practice(page).getByRole('button', { name: 'Continue to reason', exact: true }).click();
  await expect(
    practice(page).getByText(
      'This reason exercise belongs to the game. Gmail does not show this four-choice reason picker.',
      { exact: true },
    ),
  ).toBeVisible();
  await practice(page).getByRole('radio', { name: 'Scam or phishing', exact: true }).check();
  await practice(page).getByRole('button', { name: 'Review practice report', exact: true }).click();
  await expect(
    practice(page).getByRole('button', { name: 'Submit practice report', exact: true }),
  ).toBeDisabled();
  await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Submit practice report', exact: true }).click();
  expect((await saved(page)).progress['office-a'].safety?.blocked).toBe(false);
  await practice(page)
    .getByRole('button', { name: 'Finish report and view outcome', exact: true })
    .click();
  await expect(
    phone(page).getByRole('region', { name: 'Real help in Singapore', exact: true }),
  ).toBeVisible();
});

test('report concern on an incoming call safely opens its follow-up message practice', async ({
  page,
}) => {
  await start(page, 'home-a');
  await openPractice(page);
  expect((await saved(page)).progress['home-a'].callStatus).toBe('declined');
  expect((await saved(page)).phone.app).toBe('messages');
  await report(page);
  await practice(page)
    .getByRole('button', { name: 'Finish report and view outcome', exact: true })
    .click();
  expect((await saved(page)).progress['home-a'].result?.decision).toBe('report');
});

test('a mistaken report of a genuine request is explained without sending anything', async ({
  page,
}) => {
  const genuine = ENCOUNTERS.find((item) => item.stage === 0 && !item.scam)!;
  await start(page, genuine.id);
  await openPractice(page);
  await report(page);
  await practice(page)
    .getByRole('button', { name: 'Finish report and view outcome', exact: true })
    .click();
  await expect(
    phone(page).getByText(
      'You practised reporting a genuine request. This was a mistaken classification; no real report was sent.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    phone(page).getByRole('heading', { name: 'Report reason reflection', exact: true }),
  ).toBeVisible();
});

test('declining remains separate and offers read-only evidence and safety guidance afterwards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await start(page, 'school-a');
  const decisions = page.getByTestId('decision-card');
  const decline = decisions.getByRole('button', { name: 'Decline request', exact: true });
  expect(await decline.evaluate((node) => getComputedStyle(node).color)).toBe('rgb(165, 37, 40)');
  await decline.click();
  await decisions.getByRole('button', { name: 'Confirm decision', exact: true }).click();
  expect((await saved(page)).progress['school-a'].safety).toBeUndefined();
  await phone(page)
    .getByRole('button', { name: 'Review safety steps and evidence', exact: true })
    .click();
  await expect(
    practice(page).getByText(
      'This encounter has ended. You can review its record and the steps below; this does not change your earlier decision.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    practice(page).getByRole('button', { name: 'Save evidence', exact: true }),
  ).toHaveCount(0);
  await expect(
    practice(page).getByRole('region', { name: 'Real help in Singapore', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('earn')).toBeEnabled();
  expect(
    await phone(page)
      .locator('div[class*="_content_"]')
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
});

test('blocking the claimed caller does not block the independently saved contact', async ({
  page,
}) => {
  await start(page, 'home-b');
  await openPractice(page);
  await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Open message options', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Block sender', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Confirm block sender', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Back to conversation', exact: true }).click();
  await expect(
    phone(page).getByRole('button', { name: 'Reply to message', exact: true }),
  ).toBeDisabled();
  await expect(
    phone(page).getByText('Sender blocked in practice; preserved messages remain available.', {
      exact: true,
    }),
  ).toBeVisible();
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone(page)
    .getByRole('button', { name: /Ravi Coffee friend/ })
    .click();
  await phone(page).getByRole('button', { name: 'Call Ravi', exact: true }).click();
  expect((await saved(page)).progress['home-b'].evidence).toContain(CASES['home-b'].decisive);
  expect((await saved(page)).progress['home-b'].safety?.blocked).toBe(true);
  expect((await saved(page)).progress['home-b'].result).toBeNull();
});

test('a wrong reason on grooming still records practice and explains the nonfinancial harm', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, 'school-grooming');
  const before = (await saved(page)).cash;
  await openPractice(page);
  await report(page, 'Scam or phishing');
  await practice(page)
    .getByRole('button', { name: 'Finish report and view outcome', exact: true })
    .click();
  await expect(
    phone(page).getByRole('heading', { name: 'Grooming and unsafe pressure', exact: true }),
  ).toBeVisible();
  await expect(phone(page).getByText('Grooming or sexual pressure', { exact: true })).toBeVisible();
  await expect(
    phone(page)
      .getByRole('region', { name: 'Real help in Singapore' })
      .getByRole('link', { name: /MSF/ }),
  ).toBeVisible();
  expect((await saved(page)).progress['school-grooming'].safety?.reason).toBe('scam');
  expect((await saved(page)).cash).toBe(before);
  expect((await saved(page)).progress['school-grooming'].result?.personalDelta).toBe(0);
  await expect(phone(page)).not.toContainText('contact your bank');
});

test('cyberbullying reporting works at 320px and keeps support distinct from money loss', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await start(page, 'uni-bullying');
  await openPractice(page);
  await report(page, 'Cyberbullying or harassment');
  await practice(page)
    .getByRole('button', { name: 'Finish report and view outcome', exact: true })
    .click();
  await expect(
    phone(page).getByRole('heading', { name: 'Cyberbullying and harassment', exact: true }),
  ).toBeVisible();
  await expect(
    phone(page)
      .getByRole('region', { name: 'Real help in Singapore' })
      .getByRole('link', { name: /cyberbullying/i }),
  ).toBeVisible();
  await expect(phone(page)).not.toContainText('contact your bank');
  expect(
    await phone(page)
      .locator('div[class*="_content_"]')
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
});

test('unsafe adult mentorship outcome names coercive pressure without financial-loss messaging', async ({
  page,
}) => {
  await start(page, 'uni-grooming');
  const before = (await saved(page)).cash,
    decisions = page.getByTestId('decision-card');
  await decisions.getByRole('button', { name: CASES['uni-grooming'].proceed, exact: true }).click();
  await decisions.getByRole('button', { name: 'Confirm action', exact: true }).click();
  await expect(
    phone(page).getByRole('heading', { name: 'Coercive pressure and boundaries', exact: true }),
  ).toBeVisible();
  await expect(phone(page)).toContainText('You deserve support.');
  await expect(phone(page)).not.toContainText('contact your bank');
  expect((await saved(page)).cash).toBe(before);
  expect((await saved(page)).progress['uni-grooming'].result?.unsafe).toBe(true);
});

test('declining while safety practice is open shows the outcome and keeps reporting optional', async ({
  page,
}) => {
  await start(page, 'school-bullying');
  await openPractice(page);
  await page.keyboard.press('Escape');
  await expect(
    page.getByTestId('decision-card').getByRole('button', { name: 'Report concern', exact: true }),
  ).toBeFocused();
  await openPractice(page);
  const decisions = page.getByTestId('decision-card');
  await decisions.getByRole('button', { name: 'Decline request', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(practice(page)).toBeVisible();
  await expect(
    decisions.getByRole('group', { name: 'Confirm your decision', exact: true }),
  ).toHaveCount(0);
  await decisions.getByRole('button', { name: 'Decline request', exact: true }).click();
  await decisions.getByRole('button', { name: 'Confirm decision', exact: true }).click();
  await expect(practice(page)).toHaveCount(0);
  await expect(
    phone(page).getByRole('heading', { name: 'Cyberbullying and harassment', exact: true }),
  ).toBeFocused();
  expect((await saved(page)).progress['school-bullying'].result?.decision).toBe('decline');
  expect((await saved(page)).progress['school-bullying'].safety).toBeUndefined();
});

test('Gmail spam route is separately available without a fake native abuse reason picker', async ({
  page,
}) => {
  await start(page, 'office-a');
  await openPractice(page);
  await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Open email more menu', exact: true }).click();
  await practice(page).getByRole('button', { name: 'Report spam', exact: true }).click();
  await expect(
    practice(page).getByText(
      'Report spam is the Gmail route for unwanted email. Serious abuse may also need support outside the app.',
      { exact: true },
    ),
  ).toBeVisible();
  await practice(page).getByRole('radio').check();
  await practice(page).getByRole('button', { name: 'Continue to reason', exact: true }).click();
  await expect(
    practice(page).getByText(
      'This reason exercise belongs to the game. Gmail does not show this four-choice reason picker.',
      { exact: true },
    ),
  ).toBeVisible();
});

test('blocking immediately is available before preserving evidence, with no report or reward', async ({
  page,
}) => {
  await start(page, 'school-grooming');
  const before = await saved(page);
  await phone(page).getByRole('button', { name: 'More phone options', exact: true }).click();
  await phone(page).getByRole('button', { name: 'Block sender', exact: true }).click();
  await expect(
    practice(page).getByText(
      'If safe, preserve messages first. You can block now and keep the fictional record here.',
      { exact: true },
    ),
  ).toBeVisible();
  await practice(page).getByRole('button', { name: 'Confirm block sender', exact: true }).click();
  const after = await saved(page);
  expect(after.progress['school-grooming'].safety).toEqual({
    blocked: true,
    evidenceSaved: false,
    reported: false,
    reason: null,
  });
  expect(after.progress['school-grooming'].result).toBeNull();
  expect(after.cash).toBe(before.cash);
  await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
  expect((await saved(page)).progress['school-grooming'].safety?.evidenceSaved).toBe(true);
});

for (const width of [320, 390])
  test(`active safety steps receive visible keyboard focus at ${width}px without a follow-up click`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await start(page, 'school-bullying');
    await openPractice(page);
    const stepHeading = (name: string) =>
      practice(page).getByRole('heading', { name, exact: true });
    await expect(stepHeading('Safety actions')).toBeFocused();
    await expect(stepHeading('Safety actions')).toBeInViewport({ ratio: 1 });
    await practice(page).getByRole('button', { name: 'Save evidence', exact: true }).click();
    await practice(page).getByRole('button', { name: 'Open message options', exact: true }).click();
    const reportButton = practice(page).getByRole('button', {
      name: 'Report message',
      exact: true,
    });
    await expect(reportButton).toBeFocused();
    await expect(reportButton).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Enter');
    await expect(stepHeading('Choose what to report')).toBeFocused();
    await expect(stepHeading('Choose what to report')).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Tab');
    await expect(practice(page).getByRole('radio').first()).toBeFocused();
    await page.keyboard.press('Space');
    await practice(page).getByRole('button', { name: 'Continue to reason', exact: true }).click();
    await expect(stepHeading('Choose the closest concern')).toBeFocused();
    await expect(stepHeading('Choose the closest concern')).toBeInViewport({ ratio: 1 });
    if (width === 320)
      await phone(page).screenshot({ path: testInfo.outputPath('telegram-active-reason-320.png') });
    await practice(page)
      .getByRole('radio', { name: 'Cyberbullying or harassment', exact: true })
      .check();
    await practice(page)
      .getByRole('button', { name: 'Review practice report', exact: true })
      .click();
    await expect(stepHeading('Submit this practice report?')).toBeFocused();
    await expect(stepHeading('Submit this practice report?')).toBeInViewport({ ratio: 1 });
    await practice(page).getByRole('button', { name: 'Back to reason', exact: true }).click();
    await expect(stepHeading('Choose the closest concern')).toBeFocused();
    await expect(stepHeading('Choose the closest concern')).toBeInViewport({ ratio: 1 });
    await practice(page)
      .getByRole('button', { name: 'Back to selected content', exact: true })
      .click();
    await expect(stepHeading('Choose what to report')).toBeFocused();
    await practice(page).getByRole('button', { name: 'Back to options', exact: true }).click();
    await expect(reportButton).toBeFocused();
    await practice(page).getByRole('button', { name: 'Block sender', exact: true }).click();
    const blockHeading = practice(page).getByRole('heading', { name: /^Block .* in practice\?$/ });
    await expect(blockHeading).toBeFocused();
    await expect(blockHeading).toBeInViewport({ ratio: 1 });
    await practice(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(reportButton).toBeFocused();
  });
