import { expect, test } from '@playwright/test';
import { CASES, ENCOUNTERS } from '../src/content';
import { createGame, SAVE_KEY } from '../src/game';

for (const viewport of [{ width: 3860, height: 2160 }, { width: 1930, height: 980 }, { width: 1280, height: 720 }]) {
  test(`desktop fits ${viewport.width}x${viewport.height} with forty notes`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const s = createGame(() => 0);
    s.started = true; s.stage = 2; s.upgrade = true; s.cash = 5000000;
    for (const e of ENCOUNTERS.filter(e => e.stage < 2)) {
      s.progress[e.id].arrived = true;
      s.progress[e.id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: !e.scam };
    }
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: JSON.stringify(s) });
    await page.goto('/?theme=pocket&font=arcade');
    await expect(page.getByTestId('stacked-note')).toHaveCount(40);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const control of [page.getByTestId('earn'), page.getByRole('button', { name: 'Upgrade owned' }), page.getByRole('button', { name: /^Open phone/ }).first()]) {
      await expect(control).toBeInViewport();
    }
    expect(await page.getByRole('list', { name: 'Life stages' }).locator('li').first().evaluate(el => getComputedStyle(el).fontFamily)).toContain('Silkscreen');
  });
}
import { FONT_PAIRINGS } from '../src/fonts';

test('five taps force an encounter; investigate, reload and resolve before resuming', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.getByTestId('earn').focus();
  await page.keyboard.press('Enter');
  expect(Number((await page.getByTestId('balance').innerText()).replace(/[^\d.]/g, ''))).toBeGreaterThanOrEqual(70);
  const afterTap = await page.getByTestId('balance').innerText();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('balance')).toHaveText(afterTap);
  await expect(page.getByRole('dialog', { name: 'Your simulated phone' })).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('game.png'), fullPage: true });
  for (let i = 0; i < 4; i++) await page.getByTestId('earn').click();
  const phone = page.getByRole('dialog', { name: 'Your simulated phone' });
  await expect(phone).toBeVisible();
  await expect(page.getByTestId('earn')).toBeDisabled();
  const held = await page.getByTestId('balance').innerText();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('balance')).toHaveText(held);
  await page.reload();
  await expect(phone).toBeVisible();
  await expect(page.getByTestId('balance')).toHaveText(held);
  await phone.getByRole('button', { name: 'Phone home', exact: true }).click();
  await phone.getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone.getByRole('button', { name: /Call LoopMarket support/ }).click();
  await expect(phone.getByRole('region', { name: 'LoopMarket support' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('phone.png') });
  await page.keyboard.press('Escape');
  await expect(phone).toBeVisible();
  await phone.getByRole('button', { name: 'Return to request', exact: true }).first().click();
  await phone.getByRole('button', { name: 'Decline politely' }).click();
  await phone.getByRole('button', { name: 'Confirm decision' }).click();
  await phone.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(phone).not.toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const encounter of ENCOUNTERS) {
  test(`${encounter.id}: independent evidence, explicit decision, saved outcome`, async ({ page }, testInfo) => {
    const s = createGame(() => 0);
    s.started = true; s.stage = encounter.stage; s.cash = 5000000;
    s.progress[encounter.id].arrived = true;
    s.phone = { open: true, app: 'home', caseId: encounter.id, record: null };
    // Seed a valid chapter save, then exercise all investigation and payment controls through the UI.
    for (const previous of ENCOUNTERS.filter(e => e.stage < encounter.stage)) {
      s.progress[previous.id].arrived = true;
      s.progress[previous.id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: !previous.scam };
    }
    await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: SAVE_KEY, value: JSON.stringify(s) });
    await page.goto('/');
    const phone = page.getByRole('dialog', { name: 'Your simulated phone' });
    await phone.getByRole('button', { name: new RegExp(encounter.sender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
    if (encounter.id === 'uni-a') {
      await phone.getByRole('button', { name: /Try the introductory task/ }).click();
      await phone.getByRole('button', { name: 'Phone home', exact: true }).click();
      await phone.getByRole('button', { name: 'Bank', exact: true }).click();
      await expect(phone.getByText('Introductory task commission')).toBeVisible();
    }
    await phone.getByRole('button', { name: 'Phone home', exact: true }).click();
    const evidence = encounter.evidence.find(v => v.id === encounter.decisive)!;
    await phone.getByRole('button', { name: 'Contacts', exact: true }).click();
    await phone.getByRole('button', { name: new RegExp(evidence.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
    await expect(phone.getByRole('region', { name: evidence.title })).toBeVisible();
    await phone.getByRole('button', { name: 'Return to request', exact: true }).first().click();
    await phone.getByRole('button', { name: encounter.scam ? 'Report concern' : encounter.proceed, exact: encounter.scam }).click();
    await phone.getByRole('button', { name: encounter.scam ? 'Confirm decision' : 'Confirm action', exact: true }).click();
    await expect(phone.getByText('Verification demonstrated', { exact: true })).toBeVisible();
    const held = await page.getByTestId('balance').innerText();
    await page.reload();
    await expect(phone.getByText('Verification demonstrated', { exact: true })).toBeVisible();
    await expect(page.getByTestId('balance')).toHaveText(held);
    if (encounter.stage === 3) await page.screenshot({ path: testInfo.outputPath('home-outcome.png') });
    const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
    expect(stored.progress[encounter.id].result.verified).toBe(true);
    expect(CASES[encounter.id].stage).toBe(encounter.stage);
  });
}

test('loaded game stays playable offline and reduced motion persists', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.getByText('Settings', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Less motion' }).check();
  await page.reload();
  await page.getByText('Settings', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Less motion' })).toBeChecked();
  await page.getByText('Settings', { exact: true }).click();
  await context.setOffline(true);
  await page.getByTestId('earn').focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /^Open phone/ }).first().click();
  await expect(page.getByRole('dialog', { name: 'Your simulated phone' })).toBeVisible();
  await page.getByRole('button', { name: 'Bank', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();
});

test('holding the note performs one tap and no repeated income', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.getByTestId('earn').click({ delay: 1600 });
  expect(Number((await page.getByTestId('balance').innerText()).replace(/[^\d.]/g, ''))).toBe(70);
  await page.waitForTimeout(1200);
  expect(Number((await page.getByTestId('balance').innerText()).replace(/[^\d.]/g, ''))).toBe(70);
});

for (const theme of ['pocket', 'ledger', 'arcade', 'void', 'blueprint']) {
  test(`${theme} theme renders at the selected viewport without horizontal overflow`, async ({ page }, testInfo) => {
    await page.goto(`/?theme=${theme}`);
    await page.getByRole('button', { name: 'Start game' }).click();
    await page.getByText('Settings', { exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Theme', exact: true })).toHaveValue(theme);
    await page.getByText('Settings', { exact: true }).click();
    await expect(page.locator(`[data-theme="${theme}"]`)).toBeVisible();
    await expect(page.getByTestId('earn')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${theme}.png`), fullPage: true });
  });
}

test('theme gallery contains five isolated live previews', async ({ page }, testInfo) => {
  await page.goto('/?view=themes');
  await expect(page.getByRole('heading', { name: 'Scamagotchi themes' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(5);
  for (const theme of ['pocket', 'ledger', 'arcade', 'void', 'blueprint']) {
    await expect(page.locator(`iframe[title="${theme} game preview"]`)).toHaveAttribute('src', `/?theme=${theme}&preview=1`);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('themes.png'), fullPage: true });
});

test('resetting a theme preview cannot overwrite the saved game', async ({ page }) => {
  const saved = { ...createGame(), started: true, cash: 9876500, gross: 9871500 };
  const original = JSON.stringify(saved);
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value: original });
  await page.goto('/?theme=arcade&preview=1');
  await page.getByTestId('earn').click();
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.waitForTimeout(1200);
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(original);
});

test('development exit preserves evidence and resumes clicks until the request is reopened', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start game' }).click();
  for (let i = 0; i < 5; i++) await page.getByTestId('earn').click();
  const phone = page.getByRole('dialog', { name: 'Your simulated phone' });
  await phone.getByRole('button', { name: 'Phone home', exact: true }).click();
  await phone.getByRole('button', { name: 'Contacts', exact: true }).click();
  await phone.getByRole('button', { name: /Call LoopMarket support/ }).click();
  const before = Number((await page.getByTestId('balance').innerText()).replace(/[^\d.]/g, ''));
  await phone.getByRole('button', { name: 'Exit request (dev)' }).click();
  await expect(phone).not.toBeVisible();
  await page.getByTestId('earn').click();
  expect(Number((await page.getByTestId('balance').innerText()).replace(/[^\d.]/g, ''))).toBe(before + 20);
  await page.getByRole('button', { name: /^Open phone/ }).first().click();
  await expect(phone.getByRole('region', { name: 'LoopMarket support' })).toBeVisible();
  await phone.getByRole('button', { name: 'Return to request', exact: true }).first().click();
  await phone.getByRole('button', { name: 'Decline politely' }).click();
  await phone.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(phone.getByText('Verification demonstrated', { exact: true })).toBeVisible();
});

test('restart can be cancelled and only replaces the run after confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start game' }).click();
  await page.getByTestId('earn').click();
  const earned = await page.getByTestId('balance').innerText();
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByTestId('balance')).toHaveText(earned);
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByTestId('balance')).toHaveText('50');
});

test('font gallery renders all five pairings using the locally loaded fonts', async ({ page }, testInfo) => {
  await page.goto('/?view=fonts');
  await expect(page.getByRole('heading', { name: 'Font pairings', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const pairing of FONT_PAIRINGS) {
    const sample = page.locator(`[data-font="${pairing.id}"]`);
    await expect(sample).toBeVisible();
    expect(await sample.locator('h1').evaluate(el => getComputedStyle(el).fontFamily)).toContain(pairing.heading);
    expect(await sample.locator('p').first().evaluate(el => getComputedStyle(el).fontFamily)).toContain(pairing.body);
    expect(await page.evaluate(family => document.fonts.check(`16px "${family}"`), pairing.body)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('fonts.png'), fullPage: true });
});

test('saved campus bulletin and archived chats remain accessible during a pending request', async ({ page }) => {
  const s = createGame(() => 0); s.started = true; s.stage = 1;
  for (const id of s.order[0]) {
    s.progress[id].arrived = true;
    s.progress[id].result = { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: id === 'school-b' };
  }
  s.progress['uni-a'].arrived = true;
  s.phone = { open: true, app: 'messages', caseId: 'uni-a', record: null };
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: SAVE_KEY, value: JSON.stringify(s) });
  await page.goto('/');
  const phone = page.getByRole('dialog', { name: 'Your simulated phone' });
  await phone.getByRole('button', { name: 'Back to chats', exact: true }).click();
  await phone.getByRole('button', { name: /Jamie · LoopMarket/ }).click();
  await expect(phone.getByRole('button', { name: 'Read outcome' })).toBeVisible();
  await phone.getByRole('button', { name: 'Phone home', exact: true }).click();
  await phone.getByRole('button', { name: /Rae · flexible work/ }).click();
  await phone.getByRole('button', { name: 'Phone home', exact: true }).click();
  await phone.getByRole('button', { name: 'Mail', exact: true }).click();
  await phone.getByRole('button', { name: /Bayview student-work bulletin/ }).click();
  await expect(phone.getByRole('region', { name: 'Bayview student-work bulletin' })).toBeVisible();
  await phone.getByRole('button', { name: 'Return to request', exact: true }).click();
  await expect(phone.getByRole('button', { name: 'Fund the next batch', exact: false })).toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.progress['uni-a'].evidence).toContain('portal');
  expect(saved.progress['uni-a'].result).toBeNull();
});
