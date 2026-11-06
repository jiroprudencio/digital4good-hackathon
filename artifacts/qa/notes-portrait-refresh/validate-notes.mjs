import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('artifacts/qa/notes-portrait-refresh');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:5173');
for (const stage of [0, 1, 2, 3]) {
  for (const upgrade of [false, true]) {
    await page.evaluate(async ({ stage, upgrade }) => {
      const { createGame, decodeSave, SAVE_KEY } = await import('/src/game.ts');
      const { ENCOUNTERS } = await import('/src/content.ts');
      const state = createGame(() => 0.5);
      Object.assign(state, { started: true, stage, upgrade, cash: 10000000, gross: 0, reducedMotion: true });
      for (const item of ENCOUNTERS.filter(item => item.stage < stage)) {
        Object.assign(state.progress[item.id], {
          arrived: true, read: true, callStatus: item.channel === 'calls' ? 'answered' : null,
          result: { decision: 'decline', verified: false, unsafe: false, personalDelta: 0, employerLoss: 0, missed: false, inspectedEvidence: [] },
        });
      }
      const raw = JSON.stringify(state);
      if (!decodeSave(raw)) throw new Error('Invalid isolated screenshot fixture');
      localStorage.setItem(SAVE_KEY, raw);
    }, { stage, upgrade });
    await page.reload();
    const bundle = page.getByTestId('note-bundle');
    await bundle.waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const count = await page.getByTestId('stacked-note').count();
    if (count !== (upgrade ? 2 : 1)) throw new Error(`Incorrect note count stage ${stage}: ${count}`);
    const denomination = [2, 10, 50, 100][stage];
    if (!(await bundle.innerText()).includes(`${upgrade ? 2 : 1} × SGD ${denomination}`)) throw new Error('Wrong displayed value');
    const variant = `stage-${stage}-${upgrade ? 'upgraded' : 'base'}`;
    await bundle.screenshot({ path: resolve(output, `${variant}.png`) });
    if (!upgrade) await page.screenshot({ path: resolve(output, `gameplay-stage-${stage}.png`) });
    console.log(`${variant}: ${count} note(s), SGD ${denomination}`);
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: resolve(output, 'mobile.png'), fullPage: true });
await context.close();
await browser.close();
console.log(JSON.stringify({ browserErrors: errors }));
if (errors.length) process.exitCode = 1;
