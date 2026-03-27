FROM node:20-alpine
RUN npm install -g pnpm@10.33.0

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies (including devDeps for build tools)
RUN pnpm install --no-frozen-lockfile

# Build shared types — API tsconfig paths alias points to dist/index.d.ts
WORKDIR /app/packages/types
RUN pnpm build

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Compile NestJS — output goes to /app/apps/api/dist/
RUN pnpm run build

# Hard-fail if the build didn't produce the expected entry point
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found after nest build" && exit 1)

EXPOSE 3000

# Run migrations then start — shell form so && works correctly
CMD ["/bin/sh", "-c", "pnpm exec prisma migrate deploy && node dist/main"]
