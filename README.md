# Scamagotchi

A Singapore-inspired online safety game prototype built for the **[GovTech Digital4Good Online Safety Hackathon](https://www.heyspot.app/hack)** on 6 November 2026.

Scam exposure changes as people move through life in Singapore.

- **Secondary school students** planning concerts with friends or collecting trading cards may encounter fake tickets and enticing resale deals.
- **University students** managing semester fees and applying for internships may receive fraudulent fee-payment emails or internship offers demanding placement fees.
- **Working adults** organising team events or expecting deliveries may face requests from an impersonated boss or parcel-delivery phishing messages.
- **Retired seniors** keeping in touch with friends may receive fake-friend loan requests or calls from supposed authorities demanding money transfers.

These are examples among many other scams, and they are not exclusive to any age group.

Scamagotchi turns these changing situations into four playable life stages. Create a character, investigate messages, emails, and calls, verify requests through trusted contacts, and practise responding. Youth stages also address grooming and cyberbullying.

![Scamagotchi gameplay: Jiro at tertiary with S$2,000 and a simulated phone](docs/images/gameplay.png)

## The Game

- **Four life stages, sixteen encounters.** Scenarios reflect changing relationships and responsibilities at ages 15, 22, 35, and 65, with legit opportunities alongside malicious requests.
- **Investigation through a simulated phone.** Inspect sender details, revisit records, and call established contacts before deciding.
- **Practical safety actions.** Preserve fictional evidence, practise reporting and blocking, and find real support resources.
- **A local character and setting.** Pixel-art Singapore scenes, customisable avatars, and a mascot.
- **Simulated scam calls.** ElevenLabs **Eleven Multilingual v2** (`eleven_multilingual_v2`) is integrated into the recording workflow with the **Kopi Gao - Expressive Singlish** voice. Generated recordings bring impersonation scenarios to life; a genuine invitation provides a comparison. Audio is bundled with the game and includes readable transcripts.
- **Accessible interaction.** Keyboard controls, reduced motion, readable transcripts, and responsive layouts.

All calls, payments, and reports are simulated. Progress stays in your browser. Playing requires no account, backend, or API key.

## Run Locally

Use **Node.js 24 LTS** (Node.js 22.12 or later is supported) and npm.

```sh
git clone https://github.com/jiroprudencio/scamagotchi.git
cd scamagotchi
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## Engineering

Built with **React, TypeScript, Vite, and CSS Modules**, with **Vitest** and **Playwright** for automated checks. Gameplay uses a pure reducer, integer-cent accounting, and validated browser saves. Audio is generated ahead of time and checked during the build.

```sh
npm run format:check
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

See [development notes](docs/DEVELOPMENT.md) for architecture, testing, deployment, and recording updates, and [credits](docs/CREDITS.md) for asset provenance and educational sources.
