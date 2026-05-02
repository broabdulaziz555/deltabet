# DeltaBet Frontend

React TypeScript crash game frontend.

## Setup
```bash
npm install
cp .env.example .env.local
# Set VITE_API_URL to your Railway backend URL
npm run dev
```

## Build & Deploy (Vercel)
```bash
npm run build
# Deploy dist/ to Vercel
# Set VITE_API_URL in Vercel environment variables
```

## Routes
- `/`            → Game (requires auth)
- `/login`       → User login
- `/register`    → Register
- `/game`        → Crash game
- `/history`     → Bet history
- `/transactions`→ Deposit/withdraw history
- `/deposit`     → Deposit page
- `/withdraw`    → Withdrawal page
- `/profile`     → Profile + stats
- `/admin`       → Admin login (separate)
- `/admin/dashboard`   → Stats dashboard
- `/admin/deposits`    → Approve/reject deposits + cheque download
- `/admin/withdrawals` → Approve/reject withdrawals
- `/admin/users`       → Ban/unban/reset users + balance
- `/admin/promos`      → Create/manage promo codes

## Languages: English, Russian, Uzbek
## Currency: UZS only
