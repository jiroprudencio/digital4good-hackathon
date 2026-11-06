# Credits and sources

Scamagotchi was built for the **GovTech Digital4Good Online Safety Hackathon**, Singapore, 6 November 2026. Participation does not imply endorsement by GovTech, IMDA or the services represented in the game.

## Educational content

Scenario references are stored with each encounter in `src/game/content.ts` and `src/game/youthEncounters.ts`. Real support channels and platform instructions are maintained in `src/features/safety/safetyResources.ts`. These include Singapore Police Force, ScamShield, IMDA, MSF, the Online Safety Commission, Telegram and Google. The game displays sources in its debriefs and help screens.

People, conversations, transactions and institution-specific events are fictional. Gmail-, Telegram- and iOS-inspired interfaces are educational simulations, not integrations with those products.

## Visuals and audio

- Pixel-art scenes, characters, mascot and specimen banknotes were generated with OpenAI ImageGen. Asset provenance and treatment are recorded in [`public/art/sources.json`](../public/art/sources.json).
- Banknotes are fictional game assets marked **SPECIMEN / GAME NOTE**, inspired by the SGD Portrait Series. They are not currency.
- The phone wallpaper is attributed to its iClarified source in the asset manifest. No additional redistribution licence is asserted here.
- Voice recordings were generated through ElevenLabs using **Kopi Gao - Expressive Singlish**. Configuration is in `scripts/audio/elevenlabs-voice.json`; the recording manifest includes script and audio checksums.
- Silkscreen, IBM Plex Sans and Inter are bundled with their SIL Open Font License notices in [`public/fonts/`](../public/fonts/). The font manifest records their sources.
- Interface icons use [Lucide](https://lucide.dev/), distributed under the ISC licence.

Third-party names, assets and dependencies retain their respective rights and terms. This repository does not grant additional rights to those materials.
