# Solana Token Explorer — Self-Hosted Solana Tracker API Frontend

A **free, open-source** backend proxy + frontend UI that wraps the [Solana Tracker Data API](https://www.solanatracker.io/data-api?via=duckha) and gives you a clean, fast interface to search, filter, and analyze Solana tokens — including pump.fun, Raydium, Orca, and more.

**Live demo:** [tracker.slipzero.app](https://tracker.slipzero.app/)

---

## What is this?

The Solana Tracker Data API is one of the most complete real-time data sources for Solana tokens. This project is a thin backend proxy (Node.js/Express) that keeps your API key hidden from the browser, plus a full React frontend with:

- **Token search** with 60+ filters (liquidity, market cap, volume, risk score, holders, bundlers, launchpad, socials, and more)
- **Token detail page** — price, risk metrics, holder distribution, price changes across all timeframes
- **OHLCV chart** with multiple intervals (1s → 1w)
- **Live trades feed** with arb filtering
- **Wallet explorer** — see all tokens held with USD value
- **PnL analyzer** — realized/unrealized profit per token for any wallet
- **Top Traders leaderboard** — sort by total PnL or win rate

---

## Quick Start

### 1. Get an API key

Sign up at [solanatracker.io/data-api](https://www.solanatracker.io/data-api?via=duckha) and grab your API key.

### 2. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/solana-token-explorer
cd solana-token-explorer

cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure

```bash
# backend/.env
SOLANA_TRACKER_API_KEY=your_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
API_MIN_INTERVAL_MS=1100   # respect the 1 req/sec rate limit
```

### 4. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to production

### Option A — Same domain via nginx (recommended)

Frontend and backend live on the same domain. nginx proxies `/api/*` to Express:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend static files
    root /var/www/solana-token-explorer/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Backend `.env`:

```
FRONTEND_URL=https://yourdomain.com
```

Frontend — no extra config needed, `VITE_API_URL` stays empty.

Build frontend:

```bash
cd frontend && npm run build
```

---

### Option B — Different domains (e.g. frontend on Vercel, backend on VPS)

**Backend `.env`:**

```
FRONTEND_URL=https://your-frontend.vercel.app
```

**Frontend — create `frontend/.env`:**

```
VITE_API_URL=https://api.yourdomain.com
```

Then build:

```bash
cd frontend && npm run build
```

---

## Why a backend proxy?

The API key never leaves your server. The frontend talks to `/api/*` on your own backend, which forwards requests to `data.solanatracker.io` with the key in the header. Built-in **rate-limit queue** (configurable via `API_MIN_INTERVAL_MS`) serializes all outgoing requests so you never hit 429 errors even when multiple widgets load at once.

---

## Features

| Page | What it does |
|---|---|
| **Search** | Full-text + 60+ filters. Sort by liquidity, mcap, volume, risk, holders, fees, curve %, and more. One-click copy CA, social links, Axiom shortcut. |
| **Token** | Price, market cap, liquidity, buys/sells, risk breakdown (snipers, bundlers, insiders, dev %, freeze/mint authority), price changes for all timeframes |
| **Chart** | OHLCV candlestick data via Recharts. Intervals: 1s, 5s, 15s, 1m, 5m, 15m, 1h, 4h, 1d, 1w |
| **Trades** | Live trade feed with wallet links, USD value, arb filter, cursor pagination |
| **Wallet** | All tokens in a wallet with current USD value |
| **PnL** | Realized + unrealized P&L, win rate, per-token breakdown. Optional 1d/7d/30d history |
| **Top Traders** | Leaderboard sorted by total PnL or win %, with progress bar win rate visualization |

---

## Tech stack

- **Backend:** Node.js, Express, axios, express-rate-limit
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router

---

## API

All endpoints are proxied from [Solana Tracker Data API](https://www.solanatracker.io/data-api?via=duckha):

```
GET /api/search          — token search with filters
GET /api/tokens/:address — full token info
GET /api/price           — live price
GET /api/chart/:token    — OHLCV data
GET /api/trades/:token   — trade history
GET /api/wallet/:owner   — wallet holdings
GET /api/pnl/:wallet     — profit & loss
GET /api/top-traders/all — top trader leaderboard
```

---

## Save money on trading fees

If you're trading on Axiom, check out **[SlipZero](http://slipzero.app/)** — a tool that helps you save thousands of dollars in fees.

---

## Author

Built by [@duckha](https://t.me/duckha) · [Twitter/X](https://x.com/imduckha)

---

## Keywords

`solana` `solana-tracker` `pump.fun` `pumpfun` `solana tokens` `solana api` `token search` `solana dex` `solana explorer` `defi` `crypto` `web3` `raydium` `orca` `solana wallet` `pnl tracker` `solana pnl` `top traders solana` `solana chart` `token analytics`
