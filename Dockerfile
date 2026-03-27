FROM node:20-alpine
RUN npm install -g pnpm@10.33.0

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies (including devDeps for build tools)
RUN pnpm install --no-frozen-lockfile

# Build shared types so the API can import them at runtime
WORKDIR /app/packages/types
RUN pnpm build

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Compile NestJS — run via pnpm script so binaries resolve correctly,
# capture output so errors are visible even if nest exits 0
RUN pnpm run build 2>&1; echo "=== nest build exit: $? ===" && ls -la dist/ 2>&1 || echo "dist/ missing"

# Hard-fail if the build didn't produce the expected entry point
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found after nest build" && exit 1)

EXPOSE 3000

# Run migrations then start — shell form so && works correctly
CMD ["/bin/sh", "-c", "pnpm exec prisma migrate deploy && node dist/main"]
