FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY classic-frontend/package.json ./classic-frontend/package.json
COPY components.json eslint.config.js index.html postcss.config.js tailwind.config.ts vite.config.ts ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

RUN npm install
RUN npm run build:classic

FROM caddy:2-alpine

COPY classic-frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/classic-dist /srv

EXPOSE 80
