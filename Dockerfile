FROM oven/bun:1.2-slim AS base

# ติดตั้ง OpenSSL ที่จำเป็นสำหรับ Prisma ใน Runtime และ Build environment
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma clients in parallel
RUN bunx prisma generate --schema=prisma/schema.prisma & \
  bunx prisma generate --schema=prisma/timesheet/schema.prisma & \
  bunx prisma generate --schema=prisma/jabjai-master-single-db/schema.prisma & \
  wait

ENV NODE_ENV=production
RUN bun run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Bun Slim image might not have groupadd/useradd by default, or uses different base
# If using debian-based bun slim, we can keep these or use default bun user
RUN groupadd --system --gid 1001 nodejs && \
  useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# copy cronjob scripts และ node_modules จาก builder (full deps สำหรับรัน .ts โดยตรง)
COPY --from=builder --chown=nextjs:nodejs /app/cronjobs ./cronjobs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
