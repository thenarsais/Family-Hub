# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm start         # Dev server at http://localhost:3000 (hot reload)
npm run build     # Production build → build/
npm test          # Run tests (Jest via react-scripts)
npm test -- --testPathPattern=PortfolioContext  # Run a single test file
```

## Architecture

This is a Create React App (React 18) educational stock trading simulator for kids. There is no backend — all state lives in the browser.

### State: PortfolioContext

`src/context/PortfolioContext.jsx` is the single source of truth. It holds:
- `portfolio` — `{ cash, holdings: { [stockId]: quantity }, transactions[] }` — persisted to `localStorage`
- `stocks` — the 5 fictional stocks (PIZZA, GAMES, CANDY, BOOKS, TOYS); prices drift ±2% every 30 seconds via `setInterval`
- `buyStock(stockId, quantity)` / `sellStock(stockId, quantity)` — return `{ success, message }`
- `getPortfolioValue()` — cash + current market value of all holdings

All components that need trading data consume this via the `usePortfolio()` hook.

### Age-Adaptive Rendering

`userAge` is stored in `localStorage` and passed as a prop from `App.jsx` down to every page and component. The convention used throughout is:

```javascript
const isYoung = userAge < 8;   // ages 5-7: large text, emojis, simplified UI
const isTeen = userAge >= 13;  // ages 13+: professional layout, advanced metrics
// ages 8-12: intermediate (neither flag set)
```

`App.jsx` also sets `data-age` on `<html>` so CSS can target age groups via attribute selectors.

### Routing

Four routes defined in `App.jsx` via React Router v6:
- `/` → Dashboard (portfolio summary + quick stats)
- `/trading` → Buy/sell stocks
- `/portfolio` → Holdings table + transaction history
- `/lessons` → Age-gated financial education cards

### Styling

Each component has a paired CSS file in `src/styles/`. The project installs Tailwind but uses it only for utility classes alongside custom CSS (not Tailwind-only). Color palette: primary `#667eea`, success `#4caf50`, danger `#f44336`, background `#f5f7ff`. Mobile breakpoint: `768px`.

## Key Conventions

- New pages go in `src/pages/`, new reusable UI in `src/components/`, styles in `src/styles/`.
- New pages must receive `userAge` as a prop and be added to the `<Routes>` in `App.jsx` and to `Navigation.jsx`.
- New stocks are added to the `FICTIONAL_STOCKS` array in `PortfolioContext.jsx`.
- `buyStock`/`sellStock` always return a result object — display `result.message` to the user.
- There is no backend or API today; the REST API endpoints mentioned in the README are planned but not implemented.
