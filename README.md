# Repair Hub

Service desk for repair requests with three flows:
- client creates a request,
- dispatcher assigns a master,
- master takes and completes the task.

## Active Stack
- `backend`: Fastify + PostgreSQL
- `frontend`: Vite + React + Tailwind CSS
- `delivery`: Caddy + Docker Compose

## Quick Start
```bash
docker compose up --build
```

App: `http://localhost`

Backend health through proxy: `http://localhost/api/health`

## Seeded Users
- dispatcher: `admin / admin`
- master: `worker1 / password`
- master: `worker2 / password`

## Main API
- `POST /auth/login`
- `POST /requests`
- `GET /requests?status=new`
- `GET /requests/mine`
- `GET /users/masters`
- `PATCH /requests/:id/assign`
- `PATCH /requests/:id/take`
- `PATCH /requests/:id/complete`
- `PATCH /requests/:id/cancel`

## Local Run Without Docker
1. Start PostgreSQL and create a database named `repair_hub`.
2. Apply SQL files from `backend/migrations/001_init.sql` and `backend/migrations/002_seed.sql`.
3. Start the backend:
```bash
set DATABASE_URL=postgres://postgres@127.0.0.1:55432/repair_hub
set JWT_SECRET=change-me-123
set HOST=0.0.0.0
set CORS_ORIGIN=http://localhost:8080,http://localhost:4173,http://127.0.0.1:8080,http://127.0.0.1:4173
npm --workspace backend run dev
```
4. Start the active frontend in another terminal:
```bash
npm run dev:classic
```

## Build And Test
- backend build: `npm run build:backend`
- frontend build: `npm run build:classic`
- full build: `npm run build`
- backend tests: `npm run test:backend`
- race scenario: `npm run race:test`

## Race Test
After the stack is up:
```bash
npm run race:test
```

Or with a shell script:
```bash
bash scripts/race_test.sh
```

The script creates a request, assigns it to `worker1`, then sends concurrent `take` requests and expects exactly one success and the rest `409 Conflict`.

## Server Install With Docker
1. Copy the repository to the server.
2. Create `.env` from `.env.example` and set a strong `JWT_SECRET`.
3. Start the stack:
```bash
docker compose up -d --build
```
4. Open port `80` on the server firewall.

Only the web entrypoint is exposed outside the containers. PostgreSQL and the backend API stay on the internal Docker network.

The backend test suite also covers:
- successful request lifecycle,
- optimistic locking conflict on concurrent `take` requests,
- invalid dispatcher transitions such as canceling a completed request or assigning a canceled request.
