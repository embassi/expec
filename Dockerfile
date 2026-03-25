FROM node:20-alpine
RUN npm install -g pnpm@9

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared types
RUN cd packages/types && pnpm build

# Generate Prisma client + build API
RUN cd apps/api && pnpm exec prisma generate && pnpm exec nest build

WORKDIR /app/apps/api

EXPOSE 3000
CMD ["node", "dist/main"]
