# Decisions

## Stack
- Backend: Fastify on Node.js. It is smaller and faster to bootstrap than NestJS for this task while keeping async I/O and explicit control over transactions.
- Database: PostgreSQL. It gives reliable transactional semantics and row-count based optimistic locking.
- Frontend: Next.js App Router with Tailwind CSS. It matches the target React stack and gives a clean path to SSR later, even though this version uses client-side data fetching.
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
