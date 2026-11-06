# Scamagotchi: Road to a Million

A Singapore-informed browser game about investigating requests as life changes. Create your character, tap to earn simulated SGD, and progress through school, tertiary education, adult life and retirement. Twelve encounters mix fraudulent requests with genuine opportunities. Scamagotchi is the recurring antagonist, lurking in the scenes and revealed behind fraudulent encounters.

## Run locally

Requires Node.js 22.12+ or a supported later release.

```sh
npm install
npm run dev
```

Open the address printed by Vite, normally http://127.0.0.1:5173.

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host. Gameplay needs no backend, account system or API key. Calls, messages, payments and contact details are simulated. The game does not send real messages, place calls or request real banking credentials. Regenerating the bundled voice recordings is a separate developer command that requires an ElevenLabs API key.

Assets are bundled locally. Gameplay can continue without a network connection once its assets are loaded; this is not an installable offline PWA, and a fresh offline page load is not guaranteed. Source links in debriefs open optional external pages.

## Character and progression

- Choose a name or nickname, gender and one of six skin tones. Detailed pixel-art sprites reflect the choices across four life stages. Two locally bundled character sheets provide short and bob hairstyles, framed consistently for full-body views and portraits. These settings do not change earnings, difficulty or scenario outcomes.
- Before each stage, read a profile with your role, current plans and established contacts, then press **Next**. The four stages use ages **15, 22, 35 and 65** respectively. Stage advancement is automatic once its requirements are met, but the next briefing pauses gameplay until acknowledged.
- Reopen your profile using the header avatar. During an event, **Contacts → My Card** remains available inside the active phone.
- Click the specimen banknotes, or use Enter/Space while the note button is focused. There is no click cooldown, passive income or offline income.
- Base earnings are one S$2 note per tap in school, one S$10 note in tertiary, one S$50 note in adulthood and one S$100 note in retirement. The optional stage upgrade doubles earnings to S$4, S$20, S$100 and S$200 respectively, represented by two notes. There is no additional school-item multiplier. Stage savings milestones stay unchanged for a slower progression, and existing saved balances are preserved.
- Each stage has three encounters. The run’s first request can arrive after at least five taps, once the player can afford its commitment. Later requests require both five further taps and **10 seconds of active play after closing the previous debrief**. The cooldown carries across stage transitions and pauses while reading a stage profile, handling a request, viewing an outcome or using a hidden tab. Once enough taps and savings are recorded, the next request can arrive when the active timer reaches 10 seconds. This prevents an unavoidable money shortage during a request.
- Requests pause earning, purchases and the active-play clock. Investigate through the phone, make a decision and read the explanation. Hidden tabs and stage briefings also pause active play. Ordinary phone browsing between requests does not pause tapping.
- Leaving a completed debrief through the phone home bar also resumes play. Older saves stuck on an ordinary phone screen are repaired on reload while preserving savings and encounter results.
- School, tertiary and adult stages require S$1,000, S$10,000 and S$100,000 in lifetime tap earnings respectively, plus all their encounters resolved. Encounter rewards do not count toward these thresholds.
- Holding S$1,000,000 after all twelve encounters opens the journey reflection. **Keep playing** resumes the final stage with no million-dollar cap and does not repeatedly reopen the milestone screen. The finite scenario bank does not generate new requests after completion.
- **Restart** asks for confirmation and returns to character creation. Settings provide reduced motion, instructions and a save download.
- Development builds include **Exit request (dev)** for testing. This does not resolve the event; returning to it or reloading restores the mandatory pause. Production builds omit the bypass.

Amounts use integer cents. Payments and rewards post once. Declining a request never creates debt or stops future earning. The ledger separates deliberate transactions from lifetime tap earnings.

## Scenarios and evidence

The order is shuffled once per stage and retained in the save. The game does not announce the scam/genuine distribution. This is a usability prototype, not a validated assessment: repeated players may learn the authored cases.

| Stage | Fraudulent requests | Genuine opportunity | Independent evidence |
| --- | --- | --- | --- |
| School | Concert-ticket reservation; trading-card sale | A classmate’s card exchange | Saved organiser contact and the original photo owner; confirmed meetup with inspection |
| Tertiary | Replacement tuition-payment account; internship onboarding deposit | Internship following a real application and interview | Saved finance/employer contacts and archived application records |
| Adult | Boss impersonation requesting gift cards; parcel redelivery phishing | A previously discussed agenda task from Ethan | Expanded email details, existing work/order records and saved-contact calls |
| Senior | Government investigation transfer; fake friend requesting a loan | A friend coordinating a community-class contribution | Independently initiated calls through established official/friend contacts |

All characters, conversations, amounts and institution-specific events are authored fiction. The IMDA role is fictional and does not imply endorsement. Meranti University and Linden Studio are fictional institutions.

Research references and the **6 November 2026** review date live beside each encounter in `src/content.ts` and are available in its debrief. Sources include Singapore Police Force, ScamShield, NUS fee-payment guidance and SingPost security guidance. The tuition and internship narratives adapt documented scam mechanisms; the NUS source establishes legitimate payment processes rather than documenting the fictional incident.

Verification requires opening decisive independent evidence before an appropriate decision. Replying to the suspicious sender does not substitute for a saved-contact check. A matching email domain, familiar voice, polished receipt or small initial charge is not sufficient proof. The mock lookalike address is simulated; the game does not claim that arbitrary government domains can be registered. PayNow itself is not treated as suspicious.

Outcomes explain what happened, evidence checked or missed, financial effects and one useful practice habit. Declining a verified personal contribution remains a valid choice. The results are not a “scam-proof” score.

## Phone and frontend

Desktop uses a full-width three-column layout: money, scene and a fixed phone. During an event, the background and header dim while the phone and decision card remain active. Decisions appear immediately left of the phone. On narrow screens the layout stacks and the decision card follows the phone. Phone content scrolls internally; responsive and zoomed layouts must keep controls reachable.

The phone contains:

- **Messages:** Telegram-inspired conversations and ordinary reply controls.
- **Mail:** Gmail-inspired inbox and message screens with a working sender-details disclosure.
- **Calls:** iOS-inspired incoming/active calls, optional voice-message playback, accessible text transcripts and replay from call history.
- **Contacts:** established contacts, outbound calls and the player’s My Card.
- **Bank:** simulated balance and posted transaction history.
- **Notification Centre:** swipe down or activate the top status area; notification cards reopen their originating request.

Declining or ending an incoming call creates a follow-up message with the recording and a transcript disclosure; it does not automatically decide whether the request is fraudulent. All three call encounters, including the genuine request, use the same audio treatment. Playback starts only when the player presses Play and stops on navigation, hang-up, hidden tabs or another recording starting. If audio cannot load, its transcript remains available. There are no microphone permissions, real calls or live AI conversations.

### ElevenLabs voice messages

The bundled recordings use the custom **SG Accent** voice, voice ID `Z2vRYxPj8kxx56IA3Ie9`, with the `eleven_multilingual_v2` TTS model. Voice settings live in `scripts/elevenlabs-voice.json`. The three MP3s cover the investigation impersonator, fake friend and genuine community-class call, using the revised authored scripts. Playback defaults to 1.25×; source recordings are generated at normal speed.

```sh
# Generate missing/changed clips; requires ELEVENLABS_API_KEY locally.
npm run audio:generate
# Verify script/config fingerprints and audio integrity without API calls.
npm run audio:check
```

Set `ELEVENLABS_API_KEY` in the gitignored `.env.local` or the shell environment. Never use a `VITE_` prefix or put the key in browser code. The Node-only generator uses the official ElevenLabs SDK and sends only authored scenario dialogue, with speaker labels and player-name/title placeholders removed. Shared recordings use neutral greetings; their on-screen transcripts match the spoken text. Player names and save data are never uploaded. The deployed game only loads local MP3 files and makes no ElevenLabs requests.

Generated filenames include a script/config hash. Matching clips are reused without API requests or credit use; changing a script or voice configuration regenerates only affected clips. `--force` explicitly regenerates everything. Generation has no automatic retry after an ambiguous API failure. The manifest records the source script, voice, model, file hash and generation time. Production builds run `audio:check` first and fail if recordings are missing, corrupted or stale. If a script changes without regeneration, playback is disabled for that stale clip while the new transcript stays available.

API reference: [Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert). Voice lookup: [List shared voices](https://elevenlabs.io/docs/api-reference/voices/voice-library/get-shared).

The interfaces are app-inspired simulations, not embedded applications or exact replicas. The transcript overlay and game decision card are deliberate game adaptations. Familiar branding is not an authenticity verdict.

Four locally bundled generated pixel-art backgrounds provide classroom, student room, office and HDB living-room settings. The approved cream-and-plum Scamagotchi design is rendered as a pixelated local asset. Player and contact characters use generated sprite atlases clipped inside SVG frames. The S$2, S$10, S$50 and S$100 specimen notes use a generated pixel-art atlas inspired by the current SGD Portrait Series: right-hand portrait, pale left panel, engraved numerals, denomination colours and clear SPECIMEN / GAME NOTE lettering. Official MAS references and generation details are recorded in `public/art/sources.json`. SVG framing clips each note without modifying the source pixels. Decorative movement respects reduced-motion settings.

Pocket with Silkscreen + IBM Plex Sans is the default. Phone content uses readable system-style type. Font sizes follow browser defaults rather than a custom fixed-size typography scale.

Design comparison routes remain available:

- `/?view=themes`: five live theme previews.
- `/?view=fonts`: Silkscreen paired with IBM Plex Sans, DM Sans, Inter, Nunito Sans or Source Sans 3.
- `/?theme=ledger&font=silk-inter`: apply a supported theme/font using URL parameters.
- `/?preview`: isolated preview state that does not overwrite the saved run.

Settings no longer contain theme/font selectors. Fonts are bundled under their included OFL licences in `public/fonts/`. The phone uses the user-selected [black iPhone wallpaper from iClarified](https://www.iclarified.com/files/ios/iClarified-iPhone-18-Pro-Wallpaper/iClarified-iPhone-18-Pro-Wallpaper-Black-Lock-Screen.jpg), with a dark overlay for legibility. Asset provenance is recorded separately with the bundled artwork.

## Implementation map

| File | Responsibility |
| --- | --- |
| `src/game.ts` | Pure reducer, tap economy, scheduling, call state, decisions, persistence validation and milestone continuation |
| `src/content.ts` | Twelve scenarios, independent evidence, consequences, sources and stage settings |
| `src/profiles.ts` | Character options, stage contexts and established contacts |
| `src/Character.tsx` | Customisable, ageing pixel-art sprites and portrait framing |
| `src/Phone.tsx` | Simulated apps, notifications, sender details, contacts, transcripts and debriefs |
| `src/VoicemailAudio.tsx`, `src/voicemails.ts` | Optional local audio playback, transcript fallback and stale-recording protection |
| `src/voicemailScripts.ts`, `scripts/generate-voicemails.mjs` | Anonymous authored speech scripts and cached ElevenLabs generation |
| `src/Scene.tsx` | Bundled scenery, recurring antagonist and SVG banknote stacks |
| `src/App.tsx` | Character creation, stage briefings, clicker layout, settings and reflection |
| `src/themes.ts`, `src/fonts.ts` | Theme/font metadata and comparison routes |
| `artifacts/design-review-2026-11-06/` | Approval mockups and research/prompt specification |

## Saves and privacy

The current save key is **`scamagotchi.life.v2`**. Version 1 saves use a separate key and are not migrated into the new twelve-scenario run; the old entry is not overwritten by starting a version 2 game. The current UI reads version 2 only.

State changes are saved to LocalStorage after the React state update. Payments, rewards and completed decisions are persisted together, and repeating a resolved action does not duplicate a transaction. Reloading restores the shuffled order, character, records and current mandatory request. No offline earnings accrue.

Unreadable current saves prompt a backup before starting fresh. Save download is available; importing a JSON save is not implemented. Clearing browser storage removes local progress. Different origins and browsers have separate saves. There is no cloud sync or telemetry.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

The unit suite covers all twelve cautious and mistaken paths, source navigation, pre-decision verification snapshots, call follow-ups, insufficient funds, briefings, rapid taps, paused clocks, save validation and complete cautious/mistake-heavy/decline-all journeys continuing beyond one million. Banknote tests compare each stack with actual tap earnings.

Playwright covers character creation, stage profiles, phone navigation, sender details, calls, complete encounter flows, reloads, responsiveness and continued play. It uses installed Microsoft Edge through `channel: 'msedge'` and a separate local origin on port 5174 so the user's live preview on 5173 remains available. Override the test port with `PLAYWRIGHT_PORT` when needed. For another environment, install a supported Playwright browser and adjust `playwright.config.ts`.

The 6 November gameplay/UI review passed **106 unit tests**, **46 functional browser tests** and the production build. Another 32 randomized reducer journeys covered all four upgrades and balance invariants. The review fixed narrow-screen header/settings clipping, dialog focus restoration and initial Results scrolling, phone menu/reply keyboard handling, and call controls hidden below long transcripts. Phone checks cover 320, 390, 430 and 1440px; outer UI checks also cover 768px. Browser journeys accelerate time/funds; natural earning and affordability are covered by reducer simulations. Physical iPhone/Safari and screen-reader sessions have not been tested.

Latest audio validation includes **7 focused audio browser tests** and real-MP3 playback checks for all three SG Accent clips (15.56s, 13.56s and 12.45s source durations, all playing at 1.25× with no third-party playback requests). All 48 character variants were checked as full-body sprites and portraits without clipping. The four note denominations were also checked at base/upgraded counts on desktop and mobile. Production builds verify audio integrity before compiling. Screenshots in `artifacts/qa/` are isolated Edge captures; the live Chrome layout was inspected separately. No first-time human playtests have been completed.

## First playtest

Test with three to five first-time players without directing them to the decisive app. Observe whether they can reopen their profile, distinguish a reply from an independent call, recognise genuine opportunities and explain what changed their decision. Record total elapsed time separately from active tapping time. The earlier 8–12 minute target predates the slower S$2 / S$10 / S$50 / S$100 tap economy and must be remeasured. Upgrades halve the tap count needed for further earnings; the existing stage and million-dollar milestones intentionally take longer.
