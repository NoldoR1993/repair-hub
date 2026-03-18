# Decisions

## Stack
- Backend: Fastify on Node.js. It is smaller and faster to bootstrap than NestJS for this task while keeping async I/O and explicit control over transactions.
- Database: PostgreSQL. It gives reliable transactional semantics and row-count based optimistic locking.
- Frontend: Vite + React + Tailwind CSS. It keeps the frontend simple, fast to iterate locally, and aligned with the actual runtime path used in the repository.
- Infrastructure: Docker and Docker Compose for one-command local startup.

## Concurrency Control
- The project uses optimistic locking on `requests.version`.
- Mutating endpoints update rows with `WHERE id = $1 AND version = $2`.
- If no row is updated, the backend returns `409 Conflict`.
- This keeps the race-condition behavior explicit and easy to verify in code and tests.

## Authentication Scope
- For this stage, authentication is intentionally minimal: seeded users log in through `/auth/login` and receive a signed JWT.
- Passwords are hashed with bcrypt.
- Role checks are enforced in backend endpoints.

## Migration Strategy
- SQL schema and seed scripts are stored in `backend/migrations`.
- Docker mounts them into `docker-entrypoint-initdb.d`, so a clean PostgreSQL volume boots with schema and demo users automatically.

## API Shape
- The backend exposes a small REST API instead of server-rendered actions or RPC.
- This keeps the client and server loosely coupled and makes the request lifecycle easy to inspect with curl, tests, and race scripts.
- The same API works for Docker, local development, and deployment behind the reverse proxy.

## Frontend Role Flow
- The UI is split by role into separate screens for client submission, dispatcher work, and master work.
- Authorization stays intentionally lightweight: seeded accounts, JWT in the browser, and route guards on the frontend.
- This keeps the demo easy to review while still reflecting the real business flow from request creation to completion.
