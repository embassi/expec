FROM node:20-alpine
RUN npm install -g pnpm@10.33.0

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared types so the API can import them
RUN cd packages/types && pnpm build

# Generate Prisma client + compile NestJS
RUN cd apps/api && pnpm exec prisma generate && pnpm exec nest build

# Switch into the API package for runtime
WORKDIR /app/apps/api

EXPOSE 3000

# Run migrations then start — shell form so && works correctly
CMD ["/bin/sh", "-c", "pnpm exec prisma migrate deploy && node dist/main"]
