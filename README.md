# Ice Manager

A full, interactive hockey management simulation game built with React, TypeScript, and Vite. Draft prospects, set your lines, sign free agents, make trades, and chase the championship across multiple simulated seasons — all running client-side in the browser.

## Features

- **16-team generated league** across Eastern and Western conferences, with procedurally generated players (attributes, ages, potential, contracts).
- **Line editor** — set forward lines, defense pairs, and starting/backup goalies.
- **Play-by-play game simulation engine** — goals, assists, saves, penalties, overtime (3-on-3) and shootouts, driven by player attributes, line deployment, stamina, and home-ice advantage.
- **Game Center** — watch a game's play-by-play unfold live, or skip to the final box score.
- **Standings, schedule, and league-wide stat leaders** (points, goals, goaltending).
- **Playoffs** — top 4 teams per conference in a best-of-7 bracket (conference quarterfinals → conference finals → league final).
- **Trades** — propose trades with AI teams; offers are accepted or rejected based on player value.
- **Free agency** — sign released or expired-contract players to fill out your roster.
- **Offseason progression** — player aging, retirement, contract expiration, and a full entry draft (2 rounds, reverse-standings order) leading into the next season.
- **Persistent save** — your franchise is saved to `localStorage` automatically.

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser, pick a team, and start your franchise.

### Other scripts

```bash
npm run build      # type-check and build for production
npm run preview    # preview the production build
npm run lint        # oxlint
```

## How it works

- `src/engine/` contains the simulation core: league/player generation, schedule generation (round robin), the game simulator (`simulate.ts`), playoff bracket logic, and offseason/draft processing.
- `src/store/useLeagueStore.ts` is a Zustand store (persisted to `localStorage`) that holds all league state and exposes actions like `simNext`, `setLines`, `executeTrade`, `signFreeAgent`, and draft actions.
- `src/pages/` contains one component per screen (Dashboard, Roster, Lines, Schedule, Standings, Game Center, Playoffs, Trades, Free Agency, Draft, Stat Leaders).
