# Vacation Planner

Compare flights, hotels, transport, and activities to estimate your trip cost — with per-user accounts.

## Features

- User registration and login
- Each user sees only their own vacation plans
- Add multiple flight, hotel, transport, and activity options
- Select multiple options and see a live cost breakdown
- Save multiple vacations and switch between them
- Export selected budget to PDF
- Data stored securely on the server (SQLite)

## Getting Started

Install dependencies and start both the API server and frontend:

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** in your browser.

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

You'll land on the login page first. Use **Register** to create an account, then sign in to access the planner.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + frontend together |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | API only |
| `npm run build` | Build frontend for production |
| `npm run start:server` | Run API server |

## Production notes

Set a strong `JWT_SECRET` environment variable before deploying the API.

User data is stored in `server/data/app.db` (SQLite).
