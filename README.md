<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Vitals.AI-Privacy--First%20Health%20Dashboard-10b981?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGxSdWxlPSJldmVub2RkIiBkPSJNMy4xNzIgNS4xNzJhNCA0IDAgMDE1LjY1NiAwTDEwIDYuMzQzbDEuMTcyLTEuMTcxYTQgNCAwIDExNS42NTYgNS42NTZMMT_agE3LjY1N2wtNi44MjgtNi44MjlhNCA0IDAgMDEwLTUuNjU2eiIgY2xpcFJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=&logoColor=white">
    <img alt="Vitals.AI" src="https://img.shields.io/badge/Vitals.AI-Privacy--First%20Health%20Dashboard-10b981?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0id2hpdGUiPjxwYXRoIGZpbGxSdWxlPSJldmVub2RkIiBkPSJNMy4xNzIgNS4xNzJhNCA0IDAgMDE1LjY1NiAwTDEwIDYuMzQzbDEuMTcyLTEuMTcxYTQgNCAwIDExNS42NTYgNS42NTZMMT_agE3LjY1N2wtNi44MjgtNi44MjlhNCA0IDAgMDEwLTUuNjU2eiIgY2xpcFJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=&logoColor=white">
  </picture>
</p>

<p align="center">
  <strong>🔬 AI-powered health analytics that never leave your machine</strong>
</p>

<p align="center">
  <a href="https://github.com/mangeshraut712/Vitals.AI">GitHub Repo</a> •
  <a href="https://github.com/mangeshraut712/Vitals.AI/issues">Issues</a> •
  <a href="docs/VITALS_2.0.md">Vitals 2.0 Roadmap</a>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/Features-6-10b981?style=flat-square" alt="Features"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-privacy">Privacy</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎯 What is Vitals.AI?

**Vitals.AI** (OpenHealth) is a privacy-first health dashboard that analyzes your bloodwork, body composition, and activity data — all running locally on your machine. It uses Claude AI for intelligent health analysis while ensuring your data never leaves your control.

> **🔒 Privacy Promise:** Your health data is processed entirely on your machine. No external servers, no data collection, no tracking. The only network calls are to Claude AI for analysis, and you control when those happen.

## ✨ Features

### 🔬 Biomarker Analysis
Upload lab results PDFs and get instant analysis of 40+ biomarkers with optimal range tracking, status indicators, and trend monitoring.

### 🧬 Biological Age (PhenoAge)
Calculate your biological age using the Levine PhenoAge algorithm — the gold standard for biological age estimation based on clinical biomarkers.

### 🏋️ Body Composition
Analyze DEXA scan results with detailed body fat %, lean mass, bone density, and regional composition breakdown.

### 📊 Activity Tracking
Import data from **Whoop**, **Apple Health**, **Oura**, and **Fitbit** to track HRV, sleep quality, recovery scores, steps, and workout data.

### 🤖 AI Health Assistant
Ask Claude AI questions about your health data. The assistant has full context of your biomarkers, body composition, and activity data to provide personalized insights.

### ⚡ Performance & Optimization
Optimized for speed with dynamic imports, lazy-loaded charts, and skeleton loaders. Reduces initial bundle size by ~40% for asset-heavy pages.

### 🏠 Vitals 2.0 (Prototype)
Initial support for a database-backed architecture using **Prisma + SQLite**, featuring real-time device management and live health scoring.

### 👤 Digital Twin
3D visualization of your body composition data with real-time health metrics overlay.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/mangeshraut712/Vitals.AI.git
cd Vitals.AI

# Install dependencies
npm install

# Set up your API key
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

### Adding Your Data

Place your health data files in the `/data` directory:

```
data/
├── Bloodwork/           # Lab results PDFs
│   └── lab_results.pdf
├── Body Scan/           # DEXA scan PDFs
│   └── dexa_scan.pdf
└── Activity/            # Activity tracker exports
    ├── Whoop/           # Whoop CSV exports
    ├── Apple Health/    # Apple Health XML export
    ├── Oura/            # Oura CSV/JSON exports
    └── Fitbit/          # Fitbit CSV exports
```

After adding files, click **"Sync Data"** in the top-right corner to process them.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js SSR)                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────┐  │
│  │Dashboard │  │Biomarkers│  │ Lifestyle │  │Body    │  │
│  │  Page    │  │  Page    │  │   Page    │  │Comp    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └───┬────┘  │
│       │              │              │             │       │
│  ┌────┴──────────────┴──────────────┴─────────────┴────┐  │
│  │              HealthDataStore (Singleton)             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │  Parser  │  │Extractor │  │  PhenoAge Calc   │   │  │
│  │  │  (PDF,   │  │  (AI +   │  │  (Levine 2018)   │   │  │
│  │  │ CSV, XML)│  │ Fallback)│  └──────────────────┘   │  │
│  │  └──────────┘  └──────────┘                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           /data (local filesystem)                    │  │
│  │  Bloodwork/ │ Body Scan/ │ Activity/{Whoop,Apple,...} │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Claude AI (External API)                    │  │
│  │  Biomarker Extraction │ Health Q&A │ Web Search       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Server-side rendering** | Health data is parsed on the server, keeping the client lean |
| **AI extraction with fallback** | Claude extracts biomarkers from PDFs, with regex fallback |
| **File-based caching** | Avoids re-processing unchanged files on every page load |
| **Performance Optimization** | Lazy loading and dynamic imports for heavy 3D and chart components |
| **Skeleton Loaders** | Enhances perceived performance during asynchronous component loading |
| **Singleton data store** | Single source of truth for all health data |
| **Dark mode first** | Reduces eye strain for a health monitoring dashboard |

## 🛡️ Privacy

Vitals.AI takes your privacy seriously:

- ✅ **All data stays local** — Files are read from your `/data` folder, never uploaded
- ✅ **No database** — No persistent storage beyond file-based cache
- ✅ **No tracking** — Zero analytics, telemetry, or third-party scripts
- ✅ **No accounts** — No login, no user data collection
- ✅ **Transparent AI** — Only Claude API calls are made externally, and you control when
- ✅ **Security headers** — X-Content-Type-Options, X-Frame-Options, strict Referrer-Policy

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, SSR) |
| **Language** | TypeScript 5.9 |
| **UI** | React 19, Tailwind CSS 4 |
| **Styling** | Dark mode (next-themes), Glassmorphism, Framer Motion |
| **AI** | Anthropic Claude Agent SDK |
| **3D** | React Three Fiber + Drei |
| **Charts** | Recharts |
| **Testing** | Vitest |
| **Data Parsing** | Papa Parse (CSV), pdf-parse (PDF), fast-xml-parser (XML) |

## 📁 Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (main)/                 # Main layout group
│   │   ├── dashboard/          # Health dashboard
│   │   ├── biomarkers/         # Biomarker analysis
│   │   ├── lifestyle/          # Activity & sleep tracking
│   │   ├── body-comp/          # Body composition
│   │   └── data-sources/       # Data management
│   ├── api/                    # API routes
│   │   ├── chat/               # Streaming AI assistant
│   │   ├── goals/              # Goal CRUD + goal agent chat
│   │   ├── sync/               # Data cache reset/sync trigger
│   │   ├── events/             # Canonical health events
│   │   ├── future/             # Vitals 2.0 stats endpoint
│   │   └── webhooks/terra/     # Terra webhook receiver
│   ├── layout.tsx              # Root layout with ThemeProvider
│   └── globals.css             # Design system & animations
├── components/
│   ├── ai-chat/                # AI chat widget (ChatBar + ChatModal)
│   ├── biomarkers/             # Biomarker display & filtering
│   ├── dashboard/              # Dashboard cards & stats
│   ├── digital-twin/           # 3D body visualization
│   ├── layout/                 # TopNav with theme toggle
│   └── ui/                     # Base UI components
├── lib/
│   ├── agent/                  # Claude agent configuration
│   ├── ai-chat/                # Chat context & pill generation
│   ├── analysis/               # Goal generation & analysis
│   ├── biomarkers/             # Biomarker references & status
│   ├── cache/                  # File-based caching
│   ├── calculations/           # PhenoAge algorithm
│   ├── design/                 # Design tokens & theme
│   ├── extractors/             # AI biomarker extraction
│   ├── lifestyle/              # Activity data processing
│   ├── parsers/                # File parsers (CSV, PDF, XML)
│   ├── store/                  # HealthDataStore singleton
│   └── types/                  # TypeScript type definitions
└── data/                       # User health data (gitignored)
```

## 🧪 Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Build for production
npm run build
```

## ☁️ Deploy On Vercel

1. Import this repository in Vercel.
2. Keep framework preset as **Next.js**.
3. Configure environment variables in Vercel project settings:
   - `ANTHROPIC_API_KEY` (required for AI chat)
   - `NEXT_PUBLIC_SITE_URL` (recommended, e.g. `https://your-app.vercel.app`)
   - `TERRA_API_SECRET` (optional)
   - `TERRA_WEBHOOK_STRICT` (optional, defaults to `false`)
4. Deploy using default commands:
   - Install: `npm install`
   - Build: `npm run build`

### Hosted Mode Notes

- This project is local-first. On Vercel, filesystem writes are not guaranteed durable.
- Goals API now falls back to **memory-only storage** when persistent file writes are unavailable.
- `/data` imports on Vercel only include files bundled at build time; use a cloud database/object storage for true multi-user production data persistence.

## 🎨 Design System

Vitals.AI uses a premium dark-first design system with:

- **Glassmorphism cards** with backdrop blur and subtle borders
- **Status colors**: Emerald (optimal), Amber (normal), Rose (out of range)
- **Gradient accents**: Emerald → Cyan → Purple AI gradient
- **Smooth animations**: Fade-in entrance, heartbeat pulse, skeleton loading
- **Responsive design**: Mobile-first with graceful scaling
- **Accessibility**: Reduced motion support, proper focus indicators, semantic HTML

## 🤝 Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before opening a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open-source under the [MIT License](LICENSE).

## 🔐 Security

If you discover a security issue, follow [SECURITY.md](SECURITY.md) and avoid posting sensitive details in public issues.

---

<p align="center">
  <sub>Built with ❤️ for health-conscious developers</sub>
</p>
