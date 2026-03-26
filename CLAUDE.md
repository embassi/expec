# Simsim Platform

Community access management platform. One identity, multiple communities, one QR code.

## Architecture

| Layer | Tech | URL |
|-------|------|-----|
| API | NestJS + Fastify, Railway | https://patient-presence-production-7e3f.up.railway.app |
| Dashboard | Next.js, Vercel | https://simsim-claude.vercel.app |
| Mobile | Expo (apps/mobile) | Expo Go (SDK 54) |
| Scanner | Expo (apps/scanner) | Expo Go (SDK 54) |
| Database | Supabase PostgreSQL | Prisma ORM |
| Messaging | Twilio WhatsApp API | OTP + member welcome |

## Key Commands

```bash
# Local development
pnpm --filter api dev          # API on :3000
pnpm --filter dashboard dev    # Dashboard on :3001

# Database
cd apps/api
pnpm prisma:migrate            # Run pending migrations
pnpm prisma:studio             # Browse DB in browser
pnpm prisma:seed               # Seed local DB with test data
pnpm prisma:generate           # Regenerate Prisma client after schema changes

# Type check
pnpm --filter api lint
pnpm --filter dashboard lint
```

## Local vs Production

- **Local API**: `postgresql://bigmac@localhost:5432/simsim_dev`
- **Production API**: Supabase (vars set in Railway)
- **Dashboard local**: `apps/dashboard/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:3000`
- **Dashboard prod**: Vercel env var → `NEXT_PUBLIC_API_URL=https://patient-presence-production-7e3f.up.railway.app`

## Auth Patterns

- **Users** (mobile + dashboard): `Authorization: Bearer <jwt>` — JWT signed with `JWT_SECRET`
- **Scanners**: `x-scanner-code` + `x-device-key` headers — no Bearer token
- **QR tokens**: 30s expiry JWT signed with `JWT_QR_SECRET`, `exp` in payload only (not `expiresIn` option)
- **OTP delivery**: WhatsApp content template SID `HX5e5501a5bf766bdabd62e4f3fe4b8149`, variable `{ "1": otp }`

## Shared Types

`packages/types/src/index.ts` — enums and interfaces used across API, dashboard, mobile, scanner.
Always update here when adding new fields to API responses.

## Coding Conventions

- **DTOs**: Use `class-validator` decorators. Check existing DTOs before adding fields — extra properties throw `400`.
- **Colors**: Always define in `lib/colors.ts`. Never hardcode hex values in components.
- **API errors**: Return `{ message: string }`. Dashboard/mobile catch this in `api.ts`.
- **Prisma**: Use `include: {}` in a single query rather than separate queries for relations.
- **Admin guard**: Routes under `/admin/*` require `role_type = 'manager'` on the `users` table.
- **Membership status**: Scanner only grants access for `approval_status = 'approved'` memberships.

## Project Structure

```
apps/
  api/          NestJS backend (src/auth, src/admin, src/scanner, src/qr, ...)
  dashboard/    Next.js admin dashboard (app/dashboard/...)
  mobile/       Expo resident app (app/(auth), app/(tabs)/...)
  scanner/      Expo scanner app (app/setup, app/scan)
packages/
  types/        Shared TypeScript types
```

## Prisma Schema Key Models

`User` → `Membership` (many) → `Community`, `Unit`
`Scanner` → `Community` (validates QR against community_id)
`AccessLog` ← written on every scan (granted or denied)
`GuestPass` → `Membership` (host), scanned via `validate-pass` endpoint

## WhatsApp Templates

| Purpose | SID | Variables |
|---------|-----|-----------|
| OTP | `HX5e5501a5bf766bdabd62e4f3fe4b8149` | `{ "1": otp_code }` |
| Member added | `TWILIO_WELCOME_TEMPLATE_SID` (Railway env) — `HX1bbbe6248ac8e02e04a92ee1d92c3951` (`simsim_member_added`) | `{ "1": community_name }` |
