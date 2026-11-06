import { expect, test, type Page } from '@playwright/test';
import { CASES, ENCOUNTERS, STAGES, type EncounterVariant } from '../src/content';
import { createGame, SAVE_KEY, type GameState } from '../src/game';
import { availableContacts } from '../src/profiles';

const cashValue = async (page: Page) => Number((await page.getByTestId('balance').innerText()).replace(/[^\d.]/g, ''));
const stored = async (page: Page): Promise<GameState> => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
const phone = (page: Page) => page.getByTestId('phone');

function stageSave(stage = 0, encounter?: EncounterVariant): GameState {
  const s = createGame(() => .999);
  s.started = true; s.briefing = false; s.stage = stage; s.cash = 200000000; s.gross = 200000000;
  for (const previous of ENCOUNTERS.filter(e => e.stage < stage)) {
    s.progress[previous.id].arrived = true;
    s.progress[previous.id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, inspectedEvidence: [], missed: !previous.scam && previous.stage !== 3 };
  }
  if (encounter) {
    const p = s.progress[encounter.id];
    p.arrived = true; p.read = true; p.callStatus = encounter.channel === 'calls' ? 'ringing' : null;
    s.phone = { open: true, app: encounter.channel, caseId: encounter.id, record: null };
  }
  return s;
}
async function seed(page: Page, state: GameState) {
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value);
  }, { key: SAVE_KEY, value: JSON.stringify(state) });
}
async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jiro');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByTestId('stage-profile')).toBeVisible();
  await page.getByTestId('stage-profile').getByRole('button', { name: 'Next', exact: true }).click();
}
async function investigate(page: Page, encounter: EncounterVariant) {
  const evidence = encounter.evidence.find(e => e.id === encounter.decisive)!;
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
  const contact = availableContacts(encounter.stage).find(c => c.id === evidence.contactId)!;
  expect(contact, encounter.id + ' has a saved decisive contact').toBeTruthy();
  await phone(page).getByRole('button', { name: new RegExp(contact.name) }).first().click();
  await phone(page).getByRole('button', { name: 'Call ' + contact.name, exact: true }).click();
  await expect.poll(async () => (await stored(page)).progress[encounter.id].evidence).toContain(encounter.decisive);
  await expect(phone(page).getByRole('region', { name: evidence.title, exact: true })).toBeVisible();
}
async function resolve(page: Page, encounter: EncounterVariant, proceed: boolean) {
  const card = page.getByTestId('decision-card');
  await card.getByRole('button', { name: proceed ? encounter.proceed : 'Decline request', exact: !proceed }).click();
  await card.getByRole('button', { name: proceed ? 'Confirm action' : 'Confirm decision', exact: true }).click();
  await expect.poll(async () => Boolean((await stored(page)).progress[encounter.id].result)).toBe(true);
}
async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth + 1, y: document.documentElement.scrollHeight > innerHeight + 1 }))).toEqual({ x: false, y: false });
}

test('character choices persist, stage profile gates play, and restart is explicit', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Ari 李');
  await page.getByRole('combobox', { name: 'Gender', exact: true }).selectOption('non-binary');
  await page.getByRole('radio', { name: 'Skin tone 6', exact: true }).check();
  await page.screenshot({ path: testInfo.outputPath('character-creator.png') });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const briefing = page.getByTestId('stage-profile');
  await expect(briefing).toContainText('Ari 李');
  await expect(briefing).toContainText('Maya');
  const before = (await stored(page)).cash;
  await page.waitForTimeout(350);
  expect((await stored(page)).cash).toBe(before);
  await page.reload();
  await expect(briefing).toBeVisible();
  await briefing.getByRole('button', { name: 'Next', exact: true }).click();
  expect((await stored(page)).character).toEqual({ name: 'Ari 李', gender: 'non-binary', skinTone: 5 });
  await page.getByTestId('earn').click();
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await stored(page)).cash).toBe(before + 200);
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('fast clicks all earn, idle time does not, and mandatory event blocks further taps', async ({ page }) => {
  await start(page);
  const initial = await cashValue(page);
  const first = await stored(page);
  const firstCost = CASES[first.order[0][0]].cost;
  const tapsUntilRequest = Math.max(5, Math.ceil((firstCost - initial) / STAGES[0].tap));
  await expect(page.getByTestId('stacked-note')).toHaveCount(1);
  await expect(page.getByTestId('earn')).toHaveAccessibleName('Earn 2 SGD. Tap the note.');
  await page.getByTestId('earn').click({ clickCount: 4, delay: 5 });
  expect(await cashValue(page)).toBe(initial + 8);
  await page.waitForTimeout(1100);
  expect(await cashValue(page)).toBe(initial + 8);
  for (let tap = 4; tap < tapsUntilRequest; tap++) await page.getByTestId('earn').click();
  await expect(page.getByTestId('event-shade')).toBeVisible();
  await expect(page.getByTestId('earn')).toBeDisabled();
  await expect(phone(page)).toHaveAttribute('role', 'dialog');
  await expect(page.locator('header').first()).toHaveAttribute('inert', '');
  const before = await cashValue(page);
  await page.reload();
  await expect(page.getByTestId('event-shade')).toBeVisible();
  expect(await cashValue(page)).toBe(before);
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone(page).getByRole('button', { name: /My Card/ }).click();
  await expect(phone(page)).toContainText('Planning a concert');
  await expect(page.getByTestId('earn')).toBeDisabled();
});

for (const viewport of [{ width: 3860, height: 2160 }, { width: 1920, height: 1080 }, { width: 1536, height: 864 }, { width: 1280, height: 720 }]) {
  test('desktop fits ' + viewport.width + 'x' + viewport.height + ' with upgraded notes', async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const s = stageSave(2); s.upgrade = true;
    await seed(page, s); await page.goto('/');
    await expect(page.getByTestId('stacked-note')).toHaveCount(2);
    await expect(page.getByTestId('earn')).toBeInViewport();
    await expect(phone(page)).toBeInViewport();
    await noPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('desktop.png') });
  });
}
test('small laptop event keeps phone and floating decisions reachable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await seed(page, stageSave(2, CASES['office-a'])); await page.goto('/');
  await expect(page.getByTestId('decision-card')).toBeInViewport();
  await expect(phone(page)).toBeInViewport();
  await noPageOverflow(page);
  const card = (await page.getByTestId('decision-card').boundingBox())!;
  const handset = (await phone(page).locator('[data-app]').boundingBox())!;
  expect(card.x + card.width).toBeLessThanOrEqual(handset.x);
  await page.screenshot({ path: testInfo.outputPath('event-laptop.png') });
});

test('Gmail sender disclosure reveals details without awarding independent verification', async ({ page }, testInfo) => {
  await seed(page, stageSave(2, CASES['office-a'])); await page.goto('/');
  const toggle = phone(page).getByRole('button', { name: 'Show sender details', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(phone(page)).toContainText('ethan@irnda.gov.sg');
  expect((await stored(page)).progress['office-a'].evidence).not.toContain(CASES['office-a'].decisive);
  await page.screenshot({ path: testInfo.outputPath('sender-details.png') });
});

for (const encounter of ENCOUNTERS) {
  test(encounter.id + ': independent investigation, decision and reload retain outcome', async ({ page }) => {
    await seed(page, stageSave(encounter.stage, encounter)); await page.goto('/');
    if (encounter.channel === 'calls') {
      await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
      await expect.poll(async () => (await stored(page)).progress[encounter.id].callStatus).toBe('answered');
    }
    await investigate(page, encounter);
    await resolve(page, encounter, !encounter.scam);
    await expect(phone(page)).toContainText('Verification demonstrated');
    const result = (await stored(page)).progress[encounter.id].result;
    expect(result?.verified).toBe(true);
    const balance = await cashValue(page);
    await page.reload();
    await expect(phone(page)).toContainText('Verification demonstrated');
    expect(await cashValue(page)).toBe(balance);
    expect((await stored(page)).progress[encounter.id].result).toEqual(result);
  });
}

test('declining an incoming call delivers a message and does not resolve the encounter', async ({ page }, testInfo) => {
  await seed(page, stageSave(3, CASES['home-b'])); await page.goto('/');
  await phone(page).getByRole('button', { name: 'Decline call', exact: true }).click();
  const saved = await stored(page);
  expect(saved.progress['home-b'].callStatus).toBe('declined');
  expect(saved.progress['home-b'].result).toBeNull();
  expect(saved.phone.app).toBe('messages');
  await expect(page.getByTestId('earn')).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('declined-call-message.png') });
});

for (const mode of ['verified', 'mistakes'] as const) {
  test('all twelve encounters and stage briefings finish a ' + mode + ' run', async ({ page }) => {
    test.setTimeout(180000);
    await page.clock.install({ time: new Date('2026-11-06T09:40:00Z') });
    await seed(page, stageSave()); await page.goto('/');
    await page.clock.pauseAt(new Date('2026-11-06T09:41:00Z'));
    for (let stage = 0; stage < STAGES.length; stage++) {
      if (stage > 0) {
        await expect(page.getByTestId('stage-profile')).toBeVisible();
        await page.getByTestId('stage-profile').getByRole('button', { name: 'Next', exact: true }).click();
      }
      for (let index = 0; index < 3; index++) {
        for (let tap = 0; tap < 5; tap++) await page.getByTestId('earn').click();
        if (stage > 0 || index > 0) await page.clock.runFor(10000);
        const state = await stored(page);
        const id = state.order[stage].find(caseId => state.progress[caseId].arrived && !state.progress[caseId].result)!;
        const encounter = CASES[id];
        if (encounter.channel === 'calls') await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
        if (mode === 'verified') await investigate(page, encounter);
        await resolve(page, encounter, mode === 'mistakes' || !encounter.scam);
        await phone(page).getByRole('button', { name: 'Continue', exact: true }).click();
      }
    }
    await expect(page.getByRole('dialog', { name: 'Your journey results', exact: true })).toBeVisible();
    const saved = await stored(page);
    expect(saved.finished).toBe(true);
    expect(Object.values(saved.progress).filter(p => p.result)).toHaveLength(12);
    expect(Object.values(saved.progress).filter(p => p.result?.unsafe)).toHaveLength(mode === 'verified' ? 0 : 8);
    expect(saved.cash).toBeGreaterThanOrEqual(100000000);
    await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Your journey results', exact: true })).toHaveCount(0);
    await page.getByTestId('earn').click();
    expect((await stored(page)).cash).toBeGreaterThan(saved.cash);
    await page.reload();
    expect((await stored(page)).milestoneSeen).toBe(true);
    await expect(page.getByTestId('earn')).toBeEnabled();
  });
}

for (const [stage, advertised] of ['S$200', 'S$2.0k', 'S$20.0k', 'S$100.0k'].entries()) {
  test('stage ' + stage + ' upgrade advertises its actual price and doubles earnings once', async ({ page }) => {
    await seed(page, stageSave(stage)); await page.goto('/');
    const before = await stored(page);
    await page.getByRole('button', { name: advertised, exact: true }).click();
    const upgraded = await stored(page);
    expect(before.cash - upgraded.cash).toBe(STAGES[stage].cost * 100);
    await expect(page.getByRole('button', { name: 'Owned', exact: true })).toBeDisabled();
    await page.getByTestId('earn').click();
    expect((await stored(page)).cash - upgraded.cash).toBe(STAGES[stage].tap * 200);
    await page.reload();
    expect((await stored(page)).upgrade).toBe(true);
  });
}

test('event cooldown allows earning, pauses during profile review and survives reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T09:40:00Z') });
  await seed(page, stageSave(0, CASES['school-a'])); await page.goto('/');
  await page.clock.pauseAt(new Date('2026-11-06T09:41:00Z'));
  await resolve(page, CASES['school-a'], false);
  await phone(page).getByRole('button', { name: 'Continue', exact: true }).click();
  const before = (await stored(page)).cash;
  for (let tap = 0; tap < 5; tap++) await page.getByTestId('earn').click();
  expect((await stored(page)).cash).toBe(before + STAGES[0].tap * 500);
  await expect(page.getByTestId('decision-card')).toHaveCount(0);
  await page.clock.runFor(7000);
  await page.getByRole('button', { name: 'Open your character profile', exact: true }).click();
  await page.clock.runFor(30000);
  await page.getByRole('button', { name: 'Close profile', exact: true }).click();
  await expect(page.getByTestId('decision-card')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('earn')).toBeEnabled();
  await page.clock.runFor(3500);
  await expect(page.getByTestId('decision-card')).toBeVisible();
  await expect(page.getByTestId('earn')).toBeDisabled();
});

test('Phone home releases a completed request pause and old paused saves recover', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T09:40:00Z') });
  const state = stageSave(0, CASES['school-a']);
  await seed(page, state); await page.goto('/');
  await page.clock.pauseAt(new Date('2026-11-06T09:41:00Z'));
  await resolve(page, CASES['school-a'], false);
  await expect(page.getByTestId('earn')).toBeDisabled();
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await expect(page.getByTestId('event-shade')).toHaveCount(0);
  await expect(page.getByTestId('earn')).toBeEnabled();
  const before = await stored(page);
  await page.getByTestId('earn').click();
  expect((await stored(page)).cash).toBe(before.cash + STAGES[0].tap * 100);

  // Restore the exact formerly-stuck shape without discarding the completed run.
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.phone.open = true; saved.phone.app = 'home';
    localStorage.setItem(key, JSON.stringify(saved));
  }, SAVE_KEY);
  await page.reload();
  await expect(page.getByTestId('earn')).toBeEnabled();
  expect((await stored(page)).progress['school-a'].result).toEqual(before.progress['school-a'].result);
  expect((await stored(page)).cash).toBe(before.cash + STAGES[0].tap * 100);
});

test('loaded game works offline and mobile phone decisions remain accessible', async ({ page, context }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, stageSave(0, CASES['school-a'])); await page.goto('/');
  await context.setOffline(true);
  await investigate(page, CASES['school-a']);
  await resolve(page, CASES['school-a'], false);
  await expect(phone(page)).toContainText('Verification demonstrated');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-outcome.png'), fullPage: true });
});

test('capture implemented interfaces for approved-render comparison', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(key => {
    const seed = sessionStorage.getItem('qa-capture-seed');
    if (seed) { localStorage.setItem(key, seed); sessionStorage.removeItem('qa-capture-seed'); }
  }, SAVE_KEY);
  await page.goto('/');
  async function capture(name: string) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    await page.screenshot({ path: 'artifacts/qa/' + name + '.png' });
  }
  async function load(state: GameState) {
    state.reducedMotion = true;
    await page.evaluate(value => sessionStorage.setItem('qa-capture-seed', value), JSON.stringify(state));
    await page.reload();
    await expect.poll(async () => (await stored(page)).stage).toBe(state.stage);
    if (state.phone.caseId) await expect(page.getByTestId('decision-card')).toBeVisible();
  }
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jiro');
  await capture('01-character-creator');
  for (let stage = 0; stage < 4; stage++) {
    const s = stageSave(stage); s.briefing = true;
    await load(s);
    await expect(page.getByTestId('stage-profile')).toBeVisible();
    await capture('02-profile-' + stage);
  }
  await load(stageSave(2)); await capture('03-gameplay-adult');
  await load(stageSave(0, CASES['school-a'])); await capture('04-messages-event');
  await load(stageSave(2, CASES['office-a'])); await capture('05-mail-collapsed');
  await phone(page).getByRole('button', { name: 'Show sender details', exact: true }).click();
  await capture('06-mail-expanded');
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
  await capture('07-contacts');
  await phone(page).getByRole('button', { name: /My Card/ }).click(); await capture('08-my-card');
  await phone(page).getByRole('button', { name: 'Open notification centre from top bar', exact: true }).click(); await capture('09-notifications');
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Bank', exact: true }).click(); await capture('10-bank');
  await load(stageSave(3, CASES['home-a'])); await capture('11-incoming-call');
  await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click(); await capture('12-active-call');
  await investigate(page, CASES['home-a']); await capture('13-independent-call');
  await resolve(page, CASES['home-a'], false); await capture('14-debrief');
});


test('capture detailed character atlas in creator, profiles and My Card', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1536, height: 864 });
  await page.addInitScript(key => {
    const seed = sessionStorage.getItem('qa-avatar-seed');
    if (seed) { localStorage.setItem(key, seed); sessionStorage.removeItem('qa-avatar-seed'); }
  }, SAVE_KEY);
  await page.goto('/');
  async function capture(name: string) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      const sources = [...document.querySelectorAll('svg image')].map(node => node.getAttribute('href')).filter(Boolean) as string[];
      await Promise.all([...new Set(sources)].map(src => new Promise<void>((resolve, reject) => {
        const image = new Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error('Missing avatar atlas: ' + src)); image.src = src;
      })));
    });
    await noPageOverflow(page);
    await page.screenshot({ path: 'artifacts/qa/avatars/' + name + '.png' });
  }
  async function load(state: GameState) {
    state.reducedMotion = true;
    await page.evaluate(value => sessionStorage.setItem('qa-avatar-seed', value), JSON.stringify(state));
    await page.reload();
    await expect.poll(async () => (await stored(page)).stage).toBe(state.stage);
  }
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jiro');
  await capture('01-creator-default');
  await page.getByRole('combobox', { name: 'Gender', exact: true }).selectOption('woman');
  await page.getByRole('radio', { name: 'Skin tone 1', exact: true }).check();
  await capture('02-creator-woman-light');
  await page.getByRole('radio', { name: 'Skin tone 6', exact: true }).check();
  await capture('03-creator-woman-dark');
  for (let stage = 0; stage < 4; stage++) {
    const state = stageSave(stage); state.briefing = true;
    await load(state);
    await expect(page.getByTestId('stage-profile')).toBeVisible();
    await capture('04-profile-' + stage);
  }
  const state = stageSave(3); state.character.gender = 'woman'; state.character.skinTone = 5;
  await load(state);
  await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone(page).getByRole('button', { name: /My Card/ }).click();
  await capture('05-my-card-senior-woman');
});
