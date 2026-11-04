# Scamagotchi: Road to a Million

A Singapore-informed, browser-local life game. Tap to earn simulated SGD while progressing through school, university, office work and older life at home. Eight requests interrupt play. Investigate, decide, then read why the request was fraudulent or genuine.

## Play locally

Requires Node.js 22.12+ or a current supported LTS release.

```sh
npm install
npm run dev
```

Open the local address printed by Vite, normally http://127.0.0.1:5173. No accounts, API keys, real payments or external services are involved. All images, icons and game content are bundled locally. Source links in debriefs are optional external pages.

For a production build:

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host when ready. There is no backend to deploy. The game works without network access after its assets have loaded; it is not an installable offline PWA, and an offline fresh page load is not guaranteed.

## Controls and progression

- Click the SPECIMEN note or use Enter/Space while it is focused. Every activation counts: no cooldown, hold-repeat or idle income.
- Notes use denominations of SGD 10, 50, 100 and 1,000 across the four stages. Each full note in a tap is drawn as a separate layer in the stack (base counts 2, 4, 20 and 10). The school item bonus leaves SGD 4 or SGD 8 in change, displayed separately so the total stays exact.
- Buy one optional upgrade per chapter to double that chapter's earnings. The genuine school purchase adds a school-only 20% bonus.
- The first request opens automatically after five accepted taps. The next opens after five additional taps following the first resolution.
- A pending request blocks earning, upgrades and chapter advancement. Use the phone apps to investigate, make a decision and read the outcome. Escape cannot bypass an unresolved request. Declining remains available if a payment is unaffordable. Mandatory requests, outcome reading and hidden tabs pause the clock; idle phone browsing does not.
- Reach the chapter's lifetime-earning threshold and resolve its requests to advance automatically. Read and close the outcome before moving on. The final milestone requires **one million SGD held** and every request resolved.
- The phone stays in the right column. Upgrades and stage progress sit below the scene. Requests dim the rest of the game and move keyboard focus to the phone until the request and outcome are addressed. On mobile, the phone is inline below the scene; incoming requests scroll it into view.
- **Restart** opens a confirmation and an optional save download before clearing the current run.
- In the development server, **Exit request (dev)** removes the spotlight without resolving the request. Continue testing taps, then choose **Resume request** or navigate in the phone to return to it. Reloading restores the pending request. Production builds omit this control and ignore the bypass action.
- **Less motion** and the operating system's reduced-motion preference stop decorative animations.

All monetary amounts are stored as integer cents. Deliberate encounter transactions (introductory commission, approved shift and work reward) remain; ordinary income only comes from taps. These transactions do not count toward lifetime tap earnings. Employer invoice losses stay separate from personal savings. Older saves retain their balances and gain no further idle income.

## Five themes

Open `http://127.0.0.1:5173/?view=themes` for five live previews, or use **Theme** in the game. Preview runs never write to your real save.

| Theme | Hallmark reference | Treatment |
| --- | --- | --- |
| Pocket | Hum | Cream paper, yellow controls, rounded edges |
| Ledger | Almanac | Cool paper, ruled sections, square edges |
| Arcade | Arcade | Dark plum, amber controls, hard shadows |
| Night shift | Dusk | Slate surfaces, sage controls, soft borders |
| Blueprint | Cobalt | White surfaces, blue controls, cut corners |

[Hallmark](https://github.com/Nutlope/hallmark) is installed in the user's Codex skills directory. Theme materials are adapted to the game; browser-default font sizes remain throughout. Optional, locally bundled Google Font pairings change families only; Browser default remains available. The original pixel scenes remain. The illustrated SGD notes use Portrait Series colour/layout cues, a simplified cartoon portrait and a prominent SPECIMEN mark. They are original SVG artwork, not scanned currency. Reference: [MAS circulation notes](https://www.mas.gov.sg/currency/circulation-currency/circulation-currency-notes).

## Font comparisons and app references

Pocket and Silkscreen + IBM Plex Sans are the defaults. Open `http://127.0.0.1:5173/?view=fonts` to compare Silkscreen with IBM Plex Sans, DM Sans, Inter, Nunito Sans and Source Sans 3. Select a pairing under Settings to apply it. Life-stage labels also use Silkscreen. All fonts are bundled locally under their included OFL licenses. `artifacts/silkscreen-pairings.png` is a standalone type specimen, not an application screenshot; reproduce it with `python scripts/render-font-pairings.py` (Pillow required).

The desktop game fills the available viewport width and height with three columns. The main game page does not scroll on desktop; compact settings live in a dropdown, scenery scales to the remaining height, and phone content scrolls internally. Target display: 3860 x 2160, including scaled laptop viewports. Smaller mobile viewports stack the controls. The phone body uses the iPhone 18 Pro Max width-to-height ratio of 78:163.4, based on [Apple specifications](https://support.apple.com/en-lamr/148591), with a maximum width of 440 CSS pixels and a smaller size when available height requires it. The money and scene columns share the remaining width. The phone uses system-style typography independently of the game's selected pairing.

Phone references reviewed 4 November 2026:

- [Telegram for iOS](https://apps.apple.com/us/app/telegram-messenger/id686449807) and [Telegram's iOS design update](https://telegram.org/blog/comments-in-video-chats-threads-for-bots): chat headers, blue navigation, avatars, conversation rows and timestamped bubbles.
- [Gmail for iOS](https://apps.apple.com/us/app/gmail-email-by-google/id422689480): rounded search, inbox rows, sender details and plain mail reading surfaces.
- [Apple's Phone guide](https://support.apple.com/en-ae/guide/iphone/iph3c993cbc/ios): Recents, Contacts, separate incoming/outgoing records and saved-contact routes.

Requests live in Notification Centre, reached by swiping down from the phone status bar, clicking that bar, or using the notification bell. Notifications open their original conversations and remain available across stages and reloads. The home screen contains only apps.

These are simulated app-inspired screens, not embedded clients or pixel-certified replicas. During an event, decisions appear in a floating card immediately left of the phone, above the darkened scene, with a solid primary action, an outlined decline button and a red-outlined report button. The card stays available while checking other apps. Both phone and decision card share the keyboard focus boundary. On narrow screens the card follows the phone so it cannot cover navigation. Browser has been removed; marketplace checks use saved support contacts and campus records appear in Mail. Old saves migrate to those routes without losing history.

## Content and learning design

Each chapter contains a fraudulent and a legitimate encounter, shuffled once per run. The game does not announce that distribution. This pairing makes the prototype useful for usability testing, but it is not a rigorous assessment: players may infer the pattern.

| Chapter | Situation | Independent route |
| --- | --- | --- |
| School | Second-hand headphone purchase | Saved marketplace support contact, supported checkout and transaction safeguards |
| University | Flexible student work | Saved university mail bulletin and independently obtained university contact |
| Office | Supplier account change | Previously saved vendor contact; incoming reassurance is a different route |
| Home | Family request in an existing chat | Saved family contact, purpose and payment details |

Verification credit requires opening decisive evidence before a compatible decision. Guessing or rejecting everything earns no verification credit. Declining a genuine family request after checking is a valid safe choice. A real initial task commission does not establish that later deposit demands are legitimate. PayNow is not treated as inherently suspicious.

Scamagotchi's role is revealed after fraudulent requests resolve. Outcomes explain the evidence, losses, missed opportunities and a practice habit; no “scam-proof” score is given.

Sources and review date **4 November 2026** live beside each encounter in `src/content.ts` and appear in its debrief. They include ScamShield, Singapore Police Force, Carousell Singapore, NUS's Student Work Scheme and OCBC business security guidance. Dialogue, people, institutions, companies, amounts and approval policies in the game are authored fiction.

## Implementation map

- `src/game.ts`: pure reducer, economy, encounter scheduling, verification, save validation and transaction effects.
- `src/content.ts`: all eight encounter variants, evidence, outcomes, sources and stage settings.
- `src/Phone.tsx`: five simulated apps (Messages, Mail, Calls, Contacts and Bank), persistent conversations, call transcripts, ledger, explicit confirmations and debriefs.
- `src/Scene.tsx`: four original layered pixel-style SVG scenes, ageing avatars, specimen SGD notes and mascot.
- `src/themes.ts`, `src/tokens.css`, `src/ThemeGallery.tsx`: five selectable materials and isolated live previews.
- `src/fonts.ts`, `src/fonts.css`, `src/FontGallery.tsx`: five optional font pairings and a comparison page. Font sources and OFL licenses are in `public/fonts/`.
- `src/App.tsx`: clicker layout, onboarding, stage progression, accessible dialogs and final reflection.
- CSS Modules: responsive layouts, motion and component styles. No remote fonts or asset CDNs.

The UI/UX designer subagent created the scene artwork and informed navigation, evidence presentation, accessibility and post-decision feedback.

## Saving and privacy

The save is browser-local under `scamagotchi.life.v1`. Important actions save immediately after the state update; ordinary earnings save every second and on page exit. Resuming never grants offline earnings. Repeated outcome actions cannot repeat a payment, commission or reward.

Reset requires an in-game confirmation. You can download a JSON copy first. Unreadable saves are preserved until you choose to start fresh; the interface offers a backup. JSON import is not implemented. Clearing browser storage removes the saved run. Different browsers and origins have separate saves; there is no cloud sync or telemetry.

## Checks

```sh
npm test
npm run build
npm run test:e2e
```

The reducer suite covers safe and mistaken decisions, independent evidence, insufficient funds, employer accounting, paused time, rapid taps, forced encounters, zero idle income, save migration and complete cautious/mistake-heavy/decline-everything journeys.

The Playwright suite covers desktop and mobile layouts, all five themes, keyboard earning, all eight investigation flows, confirmations, reloads, reduced motion and continued play after going offline. It currently uses installed Microsoft Edge (`channel: 'msedge'`). On another machine, install Chromium using `npx playwright install chromium` and remove that channel setting from `playwright.config.ts`.

**Validation status:** production build and 83 unit tests pass. Hallmark static checking finds no failures; white app surfaces follow the requested iOS/Gmail references. Its static contrast resolver does not distinguish every nested theme; visual browser review is still pending. A QA subagent reviewed the new rules, tests and interface code. Browser execution, screenshots and visual review remain blocked by a saved browser permission setting; the Playwright suite is prepared but has not run. No first-time human playtests have been conducted.

## First playtest

Use three to five first-time players. Do not explain which app contains decisive evidence. Observe whether they:

1. Understand that an incoming request pauses tapping until a decision.
2. Distinguish replying from independently checking.
3. Find positive evidence for genuine opportunities.
4. Explain which evidence changed their decision.
5. Understand personal versus employer losses and how to move to the next chapter.

Record total elapsed time separately from the active earning clock. The 8–12 minute target is provisional. Fix confusing navigation before adding AI, voice, leaderboards or more encounters.
