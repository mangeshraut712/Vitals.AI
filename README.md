# Vitals.AI

A privacy-first health dashboard with AI-powered insights. Runs entirely on your local machine - your health data never leaves your computer (except for AI API calls to Anthropic).

## Features

- **Biomarker Analysis**: Upload bloodwork PDFs and get AI-extracted biomarker data with reference ranges
- **Biological Age**: Calculate your PhenoAge (Levine's biological age algorithm) from bloodwork
- **Body Composition**: Track DEXA scan results
- **Activity Tracking**: Import data from Whoop, Apple Health, Oura, or Fitbit
- **AI Health Assistant**: Ask questions about your health data with citations from NIH/PubMed
- **Digital Twin**: 3D visualization of your health status

## Privacy

- **Zero data persistence**: Health data is parsed fresh from your `/data` folder on each startup
- **No external tracking**: No analytics, no cookies, no third-party services
- **Local only**: Everything runs on localhost - your data stays on your machine
- **You own your API key**: Uses your own Anthropic API key, never proxied

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/sujitmeka/OpenHealth.git
cd OpenHealth
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your API key at: https://console.anthropic.com/

### 3. Add Your Health Data

Place your health files in the `/data` folder:

```
data/
├── Bloodwork/           # PDF or TXT lab results
│   └── your-lab-results.pdf
├── Body Scan/           # PDF or TXT DEXA scans
│   └── your-dexa-scan.pdf
└── Activity/            # Activity tracker exports
    ├── Whoop/           # Whoop data export folder
    ├── Apple Health/    # export.xml or export.zip
    ├── Oura/            # JSON or CSV exports
    └── Fitbit/          # Google Takeout JSON files
```

**Supported file formats:**
- Bloodwork: PDF (Quest, Labcorp, etc.), TXT
- Body Scan: PDF, TXT
- Activity: See tracker-specific instructions below

### 4. Run the App

```bash
npm run dev
```

Open http://localhost:3000

### 5. Sync Your Data

Click the **Sync** button on the dashboard to extract biomarkers from your uploaded files. This uses AI to parse your lab results.

## Activity Tracker Setup

### Whoop
1. Export your data from the Whoop app (Settings > Data Export)
2. Unzip and place the entire folder in `data/Activity/Whoop/`

### Apple Health
1. Open Health app > Profile > Export All Health Data
2. Place `export.xml` or the entire export folder in `data/Activity/Apple Health/`

### Oura
1. Export from Oura app or web dashboard
2. Place JSON/CSV files in `data/Activity/Oura/`

### Fitbit
1. Request your data via Google Takeout (select Fitbit)
2. Place the exported JSON files in `data/Activity/Fitbit/`

## Rate Limits

The biomarker extraction uses Claude AI to parse your lab results. Be aware of Anthropic API rate limits:

- **Free tier**: ~40 requests/minute
- **If you hit rate limits**: Wait 1-2 minutes and try syncing again
- **Failed extractions are NOT cached**: The app won't save empty results from rate-limited requests

Tip: If sync seems slow or fails, check the terminal for rate limit messages.

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, shadcn/ui
- **AI**: Claude (Anthropic API) via Claude Agent SDK
- **3D**: Three.js with React Three Fiber
- **Parsing**: pdf-parse, papaparse, fast-xml-parser

## Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run typecheck    # TypeScript checking
npm run lint         # ESLint
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   ├── dashboard/       # Dashboard widgets
│   └── digital-twin/    # 3D body visualization
├── lib/
│   ├── agent/           # AI agent configuration
│   ├── calculations/    # PhenoAge, health scores
│   ├── extractors/      # AI-powered data extraction
│   ├── parsers/         # File parsing (PDF, CSV, XML)
│   └── store/           # Health data store
└── docs/                # Health reference documentation
```

## Contributing

Contributions welcome! Please read the existing code patterns before submitting PRs.

## License

MIT

## Disclaimer

This is a personal health tracking tool, not medical software. Always consult healthcare professionals for medical advice. The AI assistant provides information, not diagnoses.
