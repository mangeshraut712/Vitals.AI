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

2. **Initialize Database**:
   The SQLite database is pre-configured in `prisma/schema.prisma`.
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Seed Demo Data**:
   Populate the database with a "Biohacker" persona (Health Score 74, Oura Ring connected).
   ```bash
   # Use tsx for instant execution
   npx tsx scripts/seed-future.ts
   ```

4. **Start Development Server**:
   ```bash
   npx next dev
   ```

5. **Access the Dashboard**:
   Open [http://localhost:3000/future](http://localhost:3000/future) or navigate to **Tools > Vitals 2.0**.

## Next Steps
- Implement `POST` endpoints for real device webhooks (Terra API).
- Connect the **Vitals AI Coach** to a real LLM (Anthropic/OpenAI) via the database context.
- Migrate the legacy `HealthDataStore` to read from Prisma.
