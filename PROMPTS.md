# Журнал AI-запросов

В этом файле зафиксированы запросы к AI, использованные в ходе выполнения задания, с датой, временем и полным текстом запроса.

## 2026-03-17 21:24
Запрос: Assemble the full test assignment as a local-first repair request service. Build the backend, database schema, frontend, documentation, and prompt history needed for submission and review.

## 2026-03-17 21:25
Запрос: Create the project structure for the assignment with a backend folder, the active frontend source tree, scripts, docker-compose.yml, README.md, and DECISIONS.md. Keep the layout simple to run locally.

## 2026-03-17 21:27
Запрос: Implement the PostgreSQL schema for users, requests, and an audit log. Add seeded accounts for one dispatcher and two masters. Keep request state changes safe through optimistic locking using a version field.

## 2026-03-17 21:30
Запрос: Implement the Fastify API for the assignment. Add login, request creation, dispatcher list and filtering, master list, assignment, cancel, take into work, complete, and audit log endpoints. Enforce role checks and return clear errors.

## 2026-03-17 21:34
Запрос: Build the active frontend in React and Vite. Add the client request form, dispatcher dashboard, and master dashboard. Keep the UI role-based and show clear notifications for actions and failures.

## 2026-03-17 21:38
Запрос: Add tooling to verify the parallel "take into work" race condition. Include a script that creates a request, assigns it, fires concurrent take requests, and confirms that only one succeeds while the others fail with conflict.

## 2026-03-17 21:44
Запрос: Raise a local PostgreSQL instance, apply migrations, start the backend locally, and verify the health endpoint plus the basic request lifecycle before finalizing the submission.

## 2026-03-17 21:45
Запрос: Run end-to-end checks against the live local backend for both the normal request lifecycle and the race-condition scenario. Confirm expected status transitions and conflict handling.

## 2026-03-17 21:48
Запрос: Add backend integration tests for the main lifecycle and race scenario, and expand the repository documentation so the assignment can be reviewed without guesswork.

## 2026-03-17 23:00
Запрос: Switch the active delivery path from the earlier prototype frontend approach to the Vite frontend that actually runs in this repository. Align package scripts, documentation, and deployment files around one real runtime path.

## 2026-03-17 23:40
Запрос: Improve reviewer convenience by showing the seeded credentials in the UI and widening backend CORS handling for common local development ports.

## 2026-03-17 23:55
Запрос: Fix dispatcher transition guards so invalid state changes are rejected. In particular, completed requests must not be cancelable and canceled requests must not be assignable again.

## 2026-03-18 00:10
Запрос: Refactor audit log rendering into a shared UI component, normalize the user-facing error messages, and add a shell script variant for the race check.

## 2026-03-18 00:20
Запрос: Clean the project structure by removing the legacy frontend runtime from the main path. Update package.json, README.md, docker-compose.yml, and deployment scripts so the repository reflects only the actual runtime used for review.

## 2026-03-18 00:28
Запрос: Add backend unit tests for request transition rules so npm test includes checks that do not depend on an externally running API or TEST_API_URL.

## 2026-03-18 00:45
Запрос: Fix SQL parameter typing in the request assignment logic after the transition-guard changes so dispatcher assignment works without PostgreSQL type errors.

## 2026-03-18 01:00
Запрос: Make the race_test.sh helper portable by supporting python3 automatically when python is not available on the machine.

## 2026-03-18 01:15
Запрос: Deploy the final project to the server, rebuild backend and frontend, configure services, replace nginx with Caddy, and publish the final app over HTTPS.
