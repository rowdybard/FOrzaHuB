# Pitwall

The community challenge hub for **Forza Horizon 6** clubs and Discord communities.
Run weekly time trials, drift battles, drag shootouts, photo contests and build
battles — with verified proof and clean, public leaderboards.

> **Unofficial fan project.** Not affiliated with or endorsed by Forza, Playground
> Games, Turn 10 Studios or Microsoft. This is a front-end UI prototype only — there is
> **no backend**; all data is mocked.

---

## Tech stack

- **React 18** + **Vite 5**
- **React Router 6** for client-side routing
- **Tailwind CSS 3** (custom dark "motorsport" theme)
- **lucide-react** icons
- Fonts: Sora (display), Inter (body), JetBrains Mono (timings/scores)

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into /dist
npm run preview  # preview the production build
```

## Pages

| Route             | Page                  | Notes                                            |
| ----------------- | --------------------- | ------------------------------------------------ |
| `/`               | Landing               | Hero, live challenges, types, how-it-works, CTA  |
| `/challenges`     | Browse challenges     | Search + filter by format / status               |
| `/c/:slug`        | Public challenge      | Leaderboard **or** gallery, rules, event details |
| `/clubs`          | Browse communities    | Region filters                                   |
| `/club/:slug`     | Community / club      | Stats, season standings, active & past events    |
| `/submit/:slug`   | Submit score          | Type-aware form + proof upload + confirmation    |
| `/admin`          | Review dashboard      | Master/detail queue, approve / flag / reject     |
| `/create`         | Create / edit         | Live preview that updates as you type            |

## Challenge formats

`time_trial` · `drift_score` · `drag_time` · `photo_contest` · `build_battle`

Each format has its own accent colour, scoring direction, metric formatting and proof
guidance, defined centrally in `src/lib/challengeTypes.js`.

## Project structure

```
src/
  components/
    layout/      Navbar, Footer, Layout, ScrollToTop
    ui/          Button, Badge, Avatar, Cover, ClubMark, StatTile, …
    common/      ChallengeCard, Leaderboard, Gallery, Countdown, …
  data/
    mock.js      Clubs, racers, challenges, leaderboards, submission queue
  lib/
    utils.js            cn(), time/number formatters, countdown, avatars
    challengeTypes.js   Per-format config + metric helpers
  pages/         One file per route
```

## Where the mock data lives

Everything is in `src/data/mock.js`. Swap these arrays/selectors for real API calls
when a backend is added — the components only depend on the shapes, not the source.
