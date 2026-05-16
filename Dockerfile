# ---- Build React ----
FROM node:20 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- Build Express server ----
FROM node:18-alpine
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY server/ ./
COPY --from=client-build /app/client/dist ./public

EXPOSE ${PORT:-5000}
CMD ["sh", "-c", "node migrations/run.js && node index.js"]
