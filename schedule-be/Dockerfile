# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && \
    npx tsc --module commonjs --moduleResolution node --target ES2023 \
      --experimentalDecorators --emitDecoratorMetadata --esModuleInterop \
      --skipLibCheck --outDir dist \
      src/database/seeds/seed.ts

# ── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
