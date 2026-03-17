FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package.json
RUN npm install --prefix backend

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
RUN npm run --prefix backend build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/package.json ./backend/package.json
WORKDIR /app/backend
CMD ["node", "dist/server.js"]
