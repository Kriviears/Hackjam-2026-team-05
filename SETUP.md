# Perscholan — Screens 1 & 2 Setup

## If HackJam is an empty folder

From inside the HackJam folder:

```bash
npm create vite@latest . -- --template react
npm install
npm install react-router-dom
npm install tailwindcss @tailwindcss/vite
```

Then copy these files over the generated ones:
- `index.html` → project root (replaces the generated one)
- `vite.config.js` → project root (replaces)
- `src/` → replaces the generated `src/` entirely

## If HackJam already has a Vite React app

```bash
npm install react-router-dom tailwindcss @tailwindcss/vite
```

Then copy in `index.html`, `vite.config.js`, and the `src/` folder.

## Run it

```bash
npm run dev
```

- `/` — Landing / Sign-in (two-step card: sign in → confirm completion)
- `/upload` — Resume upload → parsing state → AI role suggestions

## What's wired vs. mocked

- Parsing is theater (timed status lines) — swap `startParse` in
  `DropZone.jsx` for a real `POST /resumes/parse` call when Kyoki's
  endpoint lands.
- Role suggestions are mock data in `RoleSuggestions.jsx` matching the
  agreed contract shape: `{ suggestedRoles: [{ role, match }] }`.
- "Generate my roadmap" navigates home for now — point it at `/roadmap`
  when that screen exists.

## Architecture notes (your talking points)

- Tokens live in `src/index.css` under `@theme` (Tailwind v4) —
  extracted from Per Scholas's actual site CSS.
- `TickBar` is the signature gauge: flex row of divs, interpolated
  color, marker at `left: score%`. Zero chart libraries.
- `StepIndicator` and the roadmap milestones share one status
  vocabulary: complete | active | locked. One contract, two layouts.
- `.microtype` is the app's labeling voice — uppercase Space Mono,
  wide tracking, used for every label everywhere.
