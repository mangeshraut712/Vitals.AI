# Vitals 2.0 Upgrade (Prototype)

This documentation covers the new "Vitals 2.0" features, located at `/future`. This module is designed to replace the current file-based architecture with a database-backed, real-time health monitoring system.

## Features Implemented
- **New Dashboard UI**: Located at `/future`, featuring glassmorphism, real-time charts, and dynamic health scores.
- **Database Backend**: Migrated from JSON files to localized **SQLite + Prisma** for robust data handling.
- **API Architecture**: New API endpoints (`/api/future/stats`) serve live data from the database.
- **Interactive Device Manager**: A new modal to simulate connecting devices like Whoop, Oura, and CGM sensors.
- **Visual Trends**: Recharts-powered visualization for glucose stability.

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   `postinstall` runs `prisma generate`.

2. **Start the app**:
   ```bash
   cp .env.example .env.local
   npm run dev
   ```
   `npm run dev` runs the project preflight check and then `next dev --webpack`. `npx next dev` skips that check.

3. **Open the dashboard**:
   [http://localhost:3000/future](http://localhost:3000/future), or **Tools > Vitals 2.0**.

`/api/future/stats` serves the built-in demo stats in `src/lib/future/demo-stats.ts` until a Prisma user with email `demo@vitals.ai` exists. There is no `scripts/seed-future.ts`. Optional local SQLite setup, if you want that user row, is `npx prisma db push` against `prisma/schema.prisma`. The page does not require it.

## Next Steps
- Implement `POST` endpoints for real device webhooks (Terra API).
- Migrate the legacy `HealthDataStore` to read from Prisma.
