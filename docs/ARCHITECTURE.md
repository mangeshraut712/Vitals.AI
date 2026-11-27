# Vitals.AI Architecture

## System Overview

Vitals.AI is a health dashboard with an AI chat agent. Health files stay on the machine that runs the Next.js server. The public GitHub Pages site is a static export and does not serve `/api/*`.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S MACHINE                           │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │             │    │           Next.js App                 │   │
│  │  /data      │    │                                      │   │
│  │  folder     │───▶│  ┌─────────┐    ┌────────────────┐   │   │
│  │             │    │  │ Parsers │───▶│ HealthDataStore│   │   │
│  │ - PDFs      │    │  └─────────┘    └───────┬────────┘   │   │
│  │ - CSVs      │    │                         │            │   │
│  │ - XLSX      │    │           ┌─────────────┴──────┐     │   │
│  └─────────────┘    │           │                    │     │   │
│                     │           ▼                    ▼     │   │
│  ┌─────────────┐    │  ┌─────────────┐    ┌────────────┐   │   │
│  │             │    │  │  Dashboard  │    │    Chat    │   │   │
│  │  .env       │    │  │  (React)    │    │   (React)  │   │   │
│  │             │    │  └─────────────┘    └─────┬──────┘   │   │
│  │ OPENROUTER_ │    │                           │          │   │
│  │ API_KEY     │    │                           ▼          │   │
│  │             │    │                    ┌────────────┐    │   │
│  └──────┬──────┘    │                    │  /api/chat │    │   │
│         │           │                    └─────┬──────┘    │   │
│         │           └──────────────────────────┼───────────┘   │
│         │                                      │               │
│         │           ┌──────────────────────────▼───────────┐   │
│         └──────────▶│   OpenRouter via Vercel AI SDK      │   │
│                     │                                      │   │
│                     │  Streaming chat completion           │   │
│                     │  + source URL sanitization           │   │
│                     └──────────────────┬───────────────────┘   │
│                                        │                       │
└────────────────────────────────────────┼───────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   OpenRouter API    │
                              │   (External)        │
                              │                     │
                              │   (Free model route │
                              │    + model fallback)│
                              └─────────────────────┘
```

## Data Flow

### 1. Startup / Sync Flow

```
User runs `npm run dev`
         │
         ▼
┌─────────────────────────┐
│ Scan /data folder       │
│ Detect: PDF, CSV, XLSX  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Parse each file         │
│ pdf-parse / papaparse   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Extract biomarkers      │
│ Regex, plus optional AI │
│ when an API key is set  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Calculate PhenoAge      │
│ Levine formula          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Store in memory         │
│ HealthDataStore         │
│ (singleton)             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Dashboard renders       │
│ with real data          │
└─────────────────────────┘
```

### 2. Chat Flow

```
User types message
         │
         ▼
┌─────────────────────────┐
│ POST /api/chat          │
│ { message: "..." }      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Build context:          │
│ - User message          │
│ - Health data summary   │
│ - System prompt         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ OpenRouter chat stack   │
│ queryHealthAgentStream()│
│                         │
│ Agent behavior:         │
│ - Uses health context   │
│ - Uses system prompt    │
│ - Streams response      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Return response         │
│ to frontend             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Chat UI displays        │
│ agent response          │
└─────────────────────────┘
```

## Component Breakdown

### Parsers (`lib/parsers/`)

| File | Input | Output |
|------|-------|--------|
| `pdf.ts` | PDF file path | Extracted text (string) |
| `csv.ts` | CSV file path | Array of row objects |
| `xlsx.ts` | XLSX file path | Array of row objects per sheet |

### Extractors (`lib/extractors/`)

| File | Input | Output |
|------|-------|--------|
| `biomarkers.ts` | Raw text | `{ glucose?: number, ldl?: number, ... }` |
| `ai-extractor.ts` | Raw text | Same shape, when `OPENROUTER_API_KEY` is set |

`biomarkers.ts` uses regex, including Thyrocare layouts. `ai-extractor.ts` is the PDF path when an OpenRouter key is configured.

### Calculations (`lib/calculations/`)

| File | Input | Output |
|------|-------|--------|
| `phenoage.ts` | Biomarkers + chronological age | `{ phenoAge: number, delta: number }` |

Implements Levine PhenoAge formula. See `docs/HEALTH_KNOWLEDGE.md` for formula.

### Store (`lib/store/`)

| File | Purpose |
|------|---------|
| `health-data.ts` | Singleton store holding parsed + calculated health data |

Methods:
- `loadAllData()` — Scans /data, parses, extracts, calculates
- `getBiomarkers()` — Returns extracted biomarkers
- `getBodyComp()` — Returns DEXA data (body fat, lean mass)
- `getActivity()` — Returns activity data (HRV, RHR, sleep)
- `getPhenoAge()` — Returns calculated phenotypic age
- `getHealthSummary()` — Returns text summary for agent context

### Agent (`lib/agent/`)

| File | Purpose |
|------|---------|
| `health-agent.ts` | OpenRouter + Vercel AI SDK chat configuration |

Configuration:
- System prompt with health expertise
- OpenRouter model routing (`OPENROUTER_MODEL`, fallback list)
- Verified source-domain sanitization in responses

### API Routes (`app/api/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Send message to health agent, get response |
| `/api/integrations/openclaw/dispatch` | POST | Forward redacted health event digest to OpenClaw hooks |

### Components (`components/`)

| Component | Purpose |
|-----------|---------|
| `dashboard/UnifiedHealthCard.tsx` | Home overview: PhenoAge, lifestyle score, goals |
| `dashboard/WithingsHealthScore.tsx` | Score ring for activity, sleep, and body composition |
| `dashboard/TopMarkersCard.tsx` | Highlighted biomarkers |
| `dashboard/WeeklyLifestyleCard.tsx` | 7-day HRV, sleep, strain, and recovery |
| `ai-chat/AIChatWidget.tsx` | Chat interface |
| `SyncButton.tsx` | Manual data resync trigger |

`Dashboard.tsx`, `AgeHeader.tsx`, `BloodWorkCard.tsx`, `DexaCard.tsx`, `ActivityCard.tsx`, `ImprovementsCard.tsx`, and `Chat.tsx` are not in the tree.

## Type Definitions (`lib/types/`)

```typescript
// health.ts

interface Biomarkers {
  // Levine PhenoAge inputs (required for calculation)
  glucose?: number;          // mg/dL
  creatinine?: number;       // mg/dL
  albumin?: number;          // g/dL
  alkalinePhosphatase?: number; // U/L
  crp?: number;              // mg/L
  lymphocytePercent?: number; // %
  mcv?: number;              // fL
  rdw?: number;              // %
  wbc?: number;              // 10^3/uL

  // Common additional markers
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  vitaminD?: number;
  // ... extend as needed
}

interface BodyComposition {
  bodyFatPercent?: number;
  leanMassLbs?: number;
  boneDensity?: number;
  visceralFat?: number;
}

interface ActivityData {
  hrv?: number;              // ms
  restingHeartRate?: number; // bpm
  sleepHours?: number;
  sleepScore?: number;
  strain?: number;
}

interface HealthData {
  biomarkers: Biomarkers;
  bodyComp: BodyComposition;
  activity: ActivityData;
  phenoAge: {
    chronologicalAge: number;
    biologicalAge: number;
    delta: number;
  } | null;
  lastSynced: Date;
}

interface Improvement {
  biomarker: string;
  currentValue: number;
  targetValue: number;
  status: 'low' | 'high';
  recommendation: string;
}
```

## Security Considerations

1. **API key in .env only** — Never committed, never logged
2. **No external data transmission** — Only user-configured OpenRouter AI API calls
3. **Local cache and SQLite** — Biomarker and body-comp extracts can be cached on disk. The `/future` module can read a local Prisma SQLite database. Source files stay in `/data`.
4. **User owns their data** — Files stay in /data, never uploaded
5. **Two hosts** — GitHub Pages publishes the static export. Chat, sync, and file parsing run on the local Next.js server.

## Future Extensions (Out of Scope for V1)

- OAuth integrations (Whoop API, Apple HealthKit)
- Multi-user support
- Trend tracking over time
- Export reports as PDF
