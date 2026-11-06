# Development

## Architecture

Scamagotchi is a client-side React application written in TypeScript and built with Vite. It has no application server, account system, analytics or runtime AI service. Artwork, fonts and voice recordings are bundled with the game.

```text
src/
  app/                 Application shell, character setup and journey screens
  game/                Pure state transitions, authored encounters and profiles
  features/
    phone/             Simulated phone and its apps
    safety/            Reporting practice and support resources
    scene/             Character art, banknotes and mascot artwork
    voicemail/         Playback, scripts and generated recording manifest
  shared/hooks/        Dialog focus and keyboard lifecycle
  styles/              Global styles, design tokens and font declarations
  main.tsx             Browser entry point
public/                Artwork, fonts and recordings with stable URLs
scripts/audio/         Offline ElevenLabs generation and integrity checks
tests/e2e/             Playwright browser journeys
docs/                  Development notes, credits and README image
```

Unit tests sit beside the modules they cover. Components keep their CSS Modules in the same feature folder. Browser tests exercise complete user journeys independently of the source layout.

`app` composes the UI features. Features consume `game`; the game layer never imports React, browser APIs or UI features. Shared hooks have no feature dependencies. Use direct imports so dependencies remain visible. Generated voicemail metadata belongs to its playback feature; paid generation tooling stays outside the browser source tree.

This structure adapts [feature-folder guidance](https://redux.js.org/style-guide/#structure-files-as-feature-folders-with-single-file-logic) to React's existing reducer without adding Redux. [React's component guidance](https://react.dev/learn/importing-and-exporting-components) supports splitting reusable responsibilities, while [Vite's public-directory contract](https://vite.dev/guide/assets#the-public-directory) preserves the stable asset URLs used by artwork and recording manifests. [Playwright's guidance](https://playwright.dev/docs/best-practices) informs isolated tests of user-visible behaviour. The project has no backend, so there are no placeholder server or database directories.

## State and progression

Amounts are integer cents. A run starts at school with S$50 and earns S$2, S$10, S$50 or S$100 per tap across the four stages. Each stage offers one upgrade that doubles tap earnings. There is no passive income.

The sixteen encounters are shuffled once per run: five in school, five in tertiary education, three in adulthood and three in retirement. A request needs five new taps, sufficient savings for its commitment and, after the first encounter, ten seconds of active play since the previous outcome closed. Requests, briefings, dialogs and hidden tabs pause the relevant gameplay clocks.

Advancement requires finishing the stage's encounters and meeting its earnings threshold. The final reflection opens after all encounters and S$1,000,000 in savings. Players can continue earning afterwards.

Verification requires inspecting independent evidence before making an appropriate decision. Reporting records tool practice separately; it does not count as independent verification. Genuine opportunities appear alongside harmful requests, so indiscriminate rejection is not the learning objective.

## Persistence

The game saves to browser `localStorage` under `scamagotchi.life.v2`. `decodeSave` validates the stored structure before loading it. Unreadable saves are preserved for download until the player explicitly starts fresh.

Earlier twelve-encounter saves retain their completed stages and balances. New youth scenarios are added only to unfinished current or future stages. Completed runs keep their original encounter count. Legacy schema fields are retained for compatibility.

## Validation

```sh
npm ci
npm run format:check
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest covers reducer transitions, complete journeys, save recovery and migration, reporting guards, banknotes and recording integrity. Playwright exercises the actual interface, including narrow viewports, keyboard interaction, phone navigation, reports and audio failures. Test screenshots and traces go to the ignored `test-results/` directory.

Browser tests start an isolated Vite server on port 5174. Set `PLAYWRIGHT_PORT` to override it. Chromium is the default; an installed browser can be selected with `PLAYWRIGHT_CHANNEL` (`msedge` or `chrome`). For example, in PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

GitHub Actions runs formatting, TypeScript, unit tests, the production build and Chromium browser tests. Automated viewport checks do not replace physical-device or screen-reader testing.

## Updating scenarios and recordings

Edit the authored content and its supporting sources together. Keep institutional roles and contact details clearly fictional, provide independent evidence and include a practical next action in each debrief. Add regression coverage when changing gameplay rules or interactions.

The three voice encounters use **Kopi Gao - Expressive Singlish** with ElevenLabs `eleven_multilingual_v2`. All playback defaults to 1.25×. Scripts are derived from the authored dialogue, with neutral greetings; player names and saves are never sent to ElevenLabs.

To regenerate changed recordings, copy `.env.example` to `.env.local`, set `ELEVENLABS_API_KEY`, then run:

```sh
npm run audio:generate
npm run audio:check
```

Generation can consume ElevenLabs credits. Unchanged clips are cached; `--force` regenerates every clip. Keep the key local and never give it a `VITE_` prefix. The build verifies each bundled recording against its script, voice configuration and audio checksum without accessing ElevenLabs.

## Deployment

`npm run build` produces `dist/`, which can be served by a static host at the origin root. `npm run preview` serves that build locally. No environment variables or API keys are required to play. The app is not a PWA; a fresh page load requires its hosted assets. Optional resource links open external websites.

## Limitations

This is a hackathon prototype with a finite set of authored scenarios. Learning effectiveness has not been validated through a controlled user study. Reports, calls and transactions stay inside the simulation; real-world services are linked separately. Review the dated source guidance before adapting the game for a workshop or deployment.
