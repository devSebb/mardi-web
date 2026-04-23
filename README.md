# MARDI — landing page

The public landing page for [MARDI](https://github.com/devSebb/MARDI), a retro-futuristic macOS second-brain companion.

Live at **[project-mardi.com](https://project-mardi.com)**.

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind v4 (Turbopack)
- Self-hosted **Departure Mono** (OFL, Helena Zhang) for all type
- A Canvas port of the app's `MardiFishBrailleView` — the fish is live, not a GIF

## Develop

```bash
npm install
npm run dev          # → http://localhost:5050
```

## Build

```bash
npm run build
npm run start        # → http://localhost:5050
```

## Structure

- `app/` — root layout, page, OG image, sitemap, robots
- `components/chrome/` — design primitives (AgentHeader, BrailleDivider, BrailleLabel, Panel, Wordmark)
- `components/mardi/` — the character (BrailleFish) and the three procedural demos
- `components/sections/` — Nav, Hero, Triptych, MemoryTypes, HowItWorks, UnderTheHood, Footer
- `public/fonts/` — Departure Mono (woff2 + woff + OFL license)
- `public/assets/MardiFish.png` — the source pixel map the Canvas samples every frame

## License

Code: MIT (pending).
Departure Mono: SIL OFL 1.1 — see `public/fonts/DepartureMono-LICENSE.txt`.
Braille glyphs: © Unicode (U+2800–U+28FF).
