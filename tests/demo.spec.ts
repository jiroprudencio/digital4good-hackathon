import { expect, test, type Page } from '@playwright/test';
import { createDemoGame, createGame, DEMO_SAVE_KEY, SAVE_KEY, type GameState } from '../src/game';

const phone = (page: Page) => page.getByTestId('phone');
const savedDemo = (page: Page): Promise<GameState> => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), DEMO_SAVE_KEY);

async function createCharacter(page: Page) {
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Demo Ari');
  await page.getByRole('combobox', { name: 'Gender', exact: true }).selectOption('woman');
  await page.getByRole('radio', { name: 'Skin tone 6', exact: true }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByTestId('stage-profile')).toContainText('Demo Ari · 35');
  await page.getByTestId('stage-profile').getByRole('button', { name: 'Next', exact: true }).click();
}

async function investigate(page: Page, name: string) {
  await phone(page).getByRole('button', { name: 'Phone home', exact: true }).last().click();
  await phone(page).getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone(page).getByRole('button', { name: new RegExp(name) }).first().click();
  await phone(page).getByRole('button', { name: 'Call ' + name, exact: true }).click();
}

async function decline(page: Page) {
  const decisions = page.getByTestId('decision-card');
  await decisions.getByRole('button', { name: 'Decline request', exact: true }).click();
  await decisions.getByRole('button', { name: 'Confirm decision', exact: true }).click();
  await phone(page).getByRole('button', { name: 'Continue', exact: true }).click();
}

for (const width of [1280, 320]) {
  test(`demo at ${width}px follows character, email, call and free play without changing the full save`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    const full = createGame(() => .999);
    full.character.name = 'Full-game Ari'; full.cash = 55500;
    const original = JSON.stringify(full);
    await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: SAVE_KEY, value: original });
    await page.goto('/?demo=1');
    await expect(page.getByRole('dialog', { name: 'Create your character' })).toBeVisible();
    await expect(page.getByText('3-minute demo', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Open full game|Try 3-minute demo/ })).toHaveCount(0);
    await createCharacter(page);
    await expect(page.getByRole('list', { name: 'Life stages', exact: true }).getByRole('listitem')).toHaveText([/School/, /Tertiary/, /Adult/, /Senior/]);
    await expect(page.getByRole('progressbar', { name: 'Savings toward one million', exact: true })).toBeVisible();
    let demo = await savedDemo(page);
    expect(demo.mode).toBe('demo'); expect(demo.stage).toBe(2);
    expect(demo.character).toEqual({ name: 'Demo Ari', gender: 'woman', skinTone: 5 });
    expect(demo.order).toEqual([[], [], ['office-a'], ['home-b']]);
    expect(Object.values(demo.progress).filter(p => p.result)).toHaveLength(0);
    expect(demo.cash).toBe(2000000);
    await expect(page.getByRole('button', { name: 'S$20.0k', exact: true })).toBeDisabled();
    for (let i = 0; i < 5; i++) await page.getByTestId('earn').click();
    await expect(phone(page).getByRole('heading', { name: 'Team event', exact: true })).toBeVisible();
    await phone(page).getByRole('button', { name: 'Show sender details', exact: true }).click();
    await expect(phone(page).getByText('ethan@irnda.gov.sg', { exact: false })).toBeVisible();
    await investigate(page, 'Ethan');
    await expect.poll(async () => (await savedDemo(page)).progress['office-a'].evidence).toContain('independent');
    await decline(page);
    await expect(page.getByTestId('stage-profile')).toContainText('Demo Ari · 65');
    await expect(page.getByTestId('stage-profile').getByRole('heading', { name: 'Senior', exact: true })).toBeVisible();
    await page.getByTestId('stage-profile').getByRole('button', { name: 'Next', exact: true }).click();
    for (let i = 0; i < 5; i++) await page.getByTestId('earn').click();
    await expect(phone(page).getByRole('button', { name: 'Accept call', exact: true })).toBeVisible({ timeout: 16000 });
    await phone(page).getByRole('button', { name: 'Accept call', exact: true }).click();
    await expect(phone(page).locator('audio[data-voicemail]')).toHaveJSProperty('playbackRate', 1.25);
    await investigate(page, 'Ravi');
    await expect.poll(async () => (await savedDemo(page)).progress['home-b'].evidence).toContain('independent');
    await decline(page);
    await expect(page.getByRole('progressbar', { name: 'Savings toward one million', exact: true })).toBeVisible();
    await expect(page.getByText('Demo complete', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Your journey results' })).toHaveCount(0);
    await expect(page.getByText('New youth scenarios are available in a fresh run.')).toHaveCount(0);
    const before = (await savedDemo(page)).cash;
    for (let i = 0; i < 10; i++) await page.getByTestId('earn').click();
    demo = await savedDemo(page);
    expect(demo.cash).toBe(before + 100000);
    expect(Object.entries(demo.progress).filter(([, progress]) => progress.arrived).map(([id]) => id).sort()).toEqual(['home-b', 'office-a']);
    expect(Object.values(demo.progress).filter(p => p.result)).toHaveLength(2);
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
    await page.reload();
    await expect(page.getByRole('progressbar', { name: 'Savings toward one million', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('demo-free-play.png') });
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download save', exact: true }).click();
    expect((await downloading).suggestedFilename()).toBe('scamagotchi-demo-save.json');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Restart game', exact: true }).click();
    await page.getByRole('dialog', { name: 'Start a new run?' }).getByRole('button', { name: 'Start fresh', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Create your character' })).toBeVisible();
    expect((await savedDemo(page)).stage).toBe(2);
    expect((await savedDemo(page)).started).toBe(false);
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  });
}

test('demo route uses the regular creator and preserves the full-game save', async ({ page }) => {
  await page.goto('/');
  const original = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  await expect(page.getByRole('link', { name: 'Try 3-minute demo', exact: true })).toHaveCount(0);
  await page.goto('/?demo=1');
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.getByRole('dialog', { name: 'Create your character' })).toBeVisible();
  await expect(page.getByText('3-minute demo', { exact: false })).toHaveCount(0);
  expect((await savedDemo(page)).stage).toBe(2);
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  await expect(page.getByRole('link', { name: 'Open full game', exact: true })).toHaveCount(0);
  await page.goto('/');
  await expect(page).not.toHaveURL(/demo=1/);
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY)).mode).toBeUndefined();
});

for (const targetDemo of [true, false]) {
  test(`${targetDemo ? 'demo' : 'full-game'} route rejects a save from the other mode`, async ({ page }) => {
    const source = JSON.stringify(targetDemo ? createGame(() => .999) : createDemoGame());
    const targetKey = targetDemo ? DEMO_SAVE_KEY : SAVE_KEY;
    const untouchedKey = targetDemo ? SAVE_KEY : DEMO_SAVE_KEY;
    const untouched = JSON.stringify(targetDemo ? createGame(() => .999) : createDemoGame());
    await page.addInitScript(({ targetKey, source, untouchedKey, untouched }) => {
      localStorage.setItem(targetKey, source); localStorage.setItem(untouchedKey, untouched);
    }, { targetKey, source, untouchedKey, untouched });
    await page.goto(targetDemo ? '/?demo=1' : '/');
    await expect(page.getByText('Your save could not be read for this mode. Download a copy before starting fresh.')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), targetKey)).toBe(source);
    await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
    const reset = page.getByRole('dialog', { name: 'Start a new run?' });
    await reset.getByRole('button', { name: 'Start fresh', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Create your character' })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), untouchedKey)).toBe(untouched);
    expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), targetKey)).mode === 'demo').toBe(targetDemo);
  });
}
