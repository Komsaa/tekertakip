# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tekertakip** — Multi-tenant fleet management SaaS for Turkish transport companies (school buses, personnel shuttles). The codebase lives in the `merttur/` folder but the product is deployed as `tekertakip.com`.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate + next build
npm run start        # Production server on port 3000
npm run db:push      # Push schema changes to DB (no migration file)
npm run db:migrate   # Apply migration files (production)
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed initial data (tsx prisma/seed.ts)
npm run db:studio    # Open Prisma Studio
npm run bot          # Run WhatsApp bot (tsx src/bot/whatsapp.ts)
```

## Architecture

### Stack
- **Next.js 14** App Router (TypeScript, server components)
- **Prisma 5** + PostgreSQL
- **NextAuth 4** (JWT strategy, 30-day sessions)
- **MinIO** (S3-compatible file storage)
- **TailwindCSS**, Lucide React, Recharts, Leaflet

### Multi-Tenancy
Column-based isolation via `companyId` on all entities. Key helpers in `src/lib/tenant.ts`:
- `getCompanyId(session)` — extracts from JWT (null = superadmin)
- `tenantWhere(companyId)` — Prisma where clause, `{}` for admin
- `tenantData(companyId)` — adds companyId to create payloads
- `requireAdmin(session)` — returns 403 response if not admin

Every API route must apply tenant filtering:
```typescript
const companyId = getCompanyId(session);
const items = await prisma.vehicle.findMany({ where: { ...tenantWhere(companyId) } });
```

### Auth System (Two Separate Auth Flows)

**Web Panel** — NextAuth credentials provider (`src/lib/auth.ts`)
- Admin users: defined in env vars (`ADMIN1_USERNAME`, `ADMIN1_PASSWORD`, etc.)
- Company users: `PanelUser` table with bcryptjs hashes
- JWT carries: `id`, `name`, `role` ("admin" | "firma"), `companyId`

**Mobile Drivers** — Bearer token (`src/lib/mobile-auth.ts`)
- Login: `POST /api/mobile/auth` with `mobileUsername` + `mobilePin`
- Token stored in `Driver.mobileToken`, expires after 30 days
- Validate via `getDriverFromRequest(request)` in mobile API routes

**Parent App (Veli)** — Separate credentials on `RoutePassenger`
- `veliUsername` + `veliPasswordHash` fields
- Login: `POST /api/mobile/veli-auth`

### API Routes Pattern

All routes are in `src/app/api/`. Standard pattern:
```typescript
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  // ... query with tenantWhere(companyId)
}
```

Mobile routes use Bearer token instead of session — always call `getDriverFromRequest()`.

### Key Libraries (`src/lib/`)

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth config |
| `tenant.ts` | Multi-tenancy helpers |
| `mobile-auth.ts` | Driver token validation |
| `audit.ts` | `logAction()` for AuditLog |
| `storage.ts` | MinIO upload + presigned URLs |
| `utils.ts` | Document status checks, Turkish number/date formatting |
| `prisma.ts` | Prisma client singleton |

### Document Expiry System

Vehicles and drivers have many regulatory documents with expiry dates. Use `getDocStatus(date)` from `src/lib/utils.ts` → returns `"expired" | "critical" | "warning" | "valid" | "missing"`. Critical = ≤7 days, Warning = ≤30 days.

### File Storage

Files uploaded via `uploadToStorage(key, buffer, contentType)`. Access via `getPresignedUrl(key)` — links expire in 1 hour. Path format: `driver/{driverId}/{docType}` or `vehicle/{vehicleId}/{docType}`.

### Turkish Regulatory Context

The system tracks documents specific to Turkish transport law:
- **SRC-2 belgesi** — commercial driver certificate
- **Psikoteknik** — psychological evaluation
- **J-plaka** — school bus approval (renewed annually in September)
- **Güzergah izni** — route permit (annual)
- **TÜVTÜRK** — technical inspection (6-month interval)
- **Tevkifat** — VAT withholding tax (varies by client type)

### Financial Calculations

Invoice amounts: `subtotal = tripCount × unitPrice`, `KDV = subtotal × kdvRate/100`, `tevkifat = KDV × tevkifatRate/100`, `payable = subtotal + KDV - tevkifat`. Invoice numbers auto-generated in format `KOM{YEAR}{SEQUENCE}` (e.g., `KOM2026000000005`).

### Panel Routes (`src/app/panel/`)

`/panel/soforler` — drivers, `/panel/araclar` — vehicles, `/panel/guzergahlar` — routes, `/panel/isler` — jobs/seferler, `/panel/yakit` — fuel, `/panel/finans` — ledger, `/panel/faturalar` — invoices, `/panel/maaslar` — salaries, `/panel/odeme` — receivables/payables + checks, `/panel/konum` — live GPS map, `/panel/kredikartlari` — credit cards, `/panel/sirketler` — company management (admin only).

### WhatsApp & AI Features

- WhatsApp bot (`src/bot/whatsapp.ts`) parses fuel receipt messages → creates FuelEntry with `parsedFrom: "whatsapp"`
- OCR via Google Generative AI (`@google/generative-ai`) on receipt photos → `parsedFrom: "ocr"`
- Fuel entries track source: `"manual" | "whatsapp" | "ocr" | "mobile"`

### Parent Notification Flow (Okul Servisi)

Expo push tokens stored on `RoutePassenger.parentPushToken`. Driver mobile app triggers notifications: vehicle approaching stop (3 min), student boarded, student missed stop.
