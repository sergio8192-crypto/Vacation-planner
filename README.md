# Vacation Planner (Voyage)

Compare flights, hotels, transport, and activities to estimate your trip cost — with per-user accounts.

## Features

- User registration and login
- Forgot password with email reset link
- Each user sees only their own vacation plans
- Add multiple flight, hotel, transport, and activity options
- Select multiple options and see a live cost breakdown
- Save multiple vacations and switch between them
- Export selected budget to PDF

## Local development

```bash
npm install
npm run dev
```

Open **http://localhost:5173/**

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001` (proxied via Vite in dev)

Locally, data is stored in `server/data/app.db` (SQLite file via libSQL).

## Deploy to Vercel

Vercel hosts the frontend **and** the API (`/api/*` serverless functions). You must add a hosted database because Vercel cannot persist local SQLite files.

### 1. Create a Turso database (free tier)

1. Sign up at [turso.tech](https://turso.tech)
2. Create a database (e.g. `vacation-planner`)
3. Copy the **Database URL** and **auth token**

### 2. Add environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `JWT_SECRET` | Long random secret for login tokens |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for password reset emails |
| `EMAIL_FROM` | Sender address (e.g. `Voyage <noreply@yourdomain.com>`) |
| `APP_URL` | Public app URL for reset links (e.g. `https://your-app.vercel.app`) |

Apply to **Production**, **Preview**, and **Development**.

For password reset emails in production, verify a domain in Resend and set `EMAIL_FROM` to an address on that domain. Locally, if `RESEND_API_KEY` is not set, reset links are printed in the API server console.

### 3. Deploy

Push to GitHub — Vercel redeploys automatically. Or run:

```bash
npm run build
```

### 4. Verify

Visit `https://your-app.vercel.app/api/health` — you should see `{"ok":true}`.

Then register and sign in on your site.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + frontend together |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | API only |
| `npm run build` | Build frontend for production |
| `npm run start:server` | Run API server locally |

## Production notes

- Set a strong `JWT_SECRET` in production (never use the dev default).
- Turso is required on Vercel; local dev works without it using a file database.
