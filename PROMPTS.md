# Prompt Log

- 2026-03-17 21:24:22 +07:00 - Request: assemble the test assignment as a local-first repair request service with backend, database, frontend, documentation, and prompt history for review.
- 2026-03-17 21:25:00 +07:00 - Action: create the project structure with `backend`, active Vite frontend sources in `src`, `scripts`, `docker-compose.yml`, `README.md`, and `DECISIONS.md`.
- 2026-03-17 21:27:00 +07:00 - Action: implement PostgreSQL schema for `users`, `requests`, and `audit_log`, add seeded dispatcher/master accounts, and keep optimistic locking through `requests.version`.
- 2026-03-17 21:30:00 +07:00 - Action: implement Fastify API endpoints for login, request creation, assignment, cancel, take into work, completion, dispatcher read model, master read model, and audit log.
- 2026-03-17 21:34:00 +07:00 - Action: implement the active React + Vite frontend screens for client, dispatcher, and master flows with role-based UI and notifications.
- 2026-03-17 21:38:00 +07:00 - Action: add concurrent race-check tooling with `scripts/race-test.mjs` and document the race scenario in the README.
- 2026-03-17 21:44:00 +07:00 - Action: raise a local PostgreSQL instance, apply migrations, start the backend locally, and verify health plus the main request lifecycle.
- 2026-03-17 21:45:00 +07:00 - Action: run end-to-end checks for the normal request lifecycle and race-condition scenario against a live backend.
- 2026-03-17 21:48:00 +07:00 - Action: add backend integration tests and expand the documentation for submission.
- 2026-03-17 23:00:00 +07:00 - Action: switch the active delivery path from the prototype Next.js branch to the Vite frontend branch and align the repository around one actual runtime path.
- 2026-03-17 23:40:00 +07:00 - Action: improve login convenience for review by exposing seeded credentials in the UI and expanding backend CORS handling for local development ports.
- 2026-03-17 23:55:00 +07:00 - Action: fix invalid dispatcher status transitions so completed requests cannot be canceled and canceled requests cannot be reassigned.
- 2026-03-18 00:10:00 +07:00 - Action: refactor audit log rendering into a shared dialog component, normalize user-facing error messages, and add `scripts/race_test.sh`.
- 2026-03-18 00:20:00 +07:00 - Action: clean the active project path by dropping the legacy `frontend/` branch from the main runtime and updating `package.json`, `README.md`, `docker-compose.yml`, and deploy scripts accordingly.
- 2026-03-18 00:28:00 +07:00 - Action: add local backend unit tests for request transition rules so `npm test` includes checks that do not depend on `TEST_API_URL`.
- 2026-03-18 00:45:00 +07:00 - Action: fix SQL parameter typing in request assignment logic after transition-guard changes to restore dispatcher actions without PostgreSQL type errors.
- 2026-03-18 01:00:00 +07:00 - Action: make `race_test.sh` portable by supporting `python3` automatically when `python` is unavailable.
- 2026-03-18 01:15:00 +07:00 - Action: deploy the final project to the server, rebuild backend and frontend, configure systemd services, replace nginx with Caddy, and publish the final app over HTTPS.
