# Vitals.AI Product Vision

## One-Liner

Privacy-first health dashboard + AI agent that runs locally, uses your own API key, and keeps your health data on your machine.

## The Problem

Health-conscious individuals collect data from multiple sources:
- Blood work (Quest, Labcorp, annual physicals)
- Body composition (DEXA scans from BodySpec, DexaFit)
- Activity tracking (Whoop, Apple Watch, Oura)

But this data sits in silos:
- PDFs in email
- CSVs exported and forgotten
- No unified view
- No intelligent interpretation

Existing solutions have problems:
- **Cloud health apps:** Want your sensitive data on their servers
- **AI chatbots:** No context on YOUR specific health
- **Manual tracking:** Spreadsheets are tedious, miss insights

## The Solution

Vitals.AI gives you:

1. **Unified Dashboard** — One view of blood work, body composition, activity
2. **Biological Age** — Levine PhenoAge calculation from your biomarkers
3. **Intelligent Agent** — Ask questions, get personalized answers based on YOUR data
4. **Complete Privacy** — Runs on localhost, your API key, data never leaves your machine

## Target User

**Primary:** Health-optimizers who:
- Get regular blood work (2+ times/year)
- Track body composition (DEXA scans)
- Use activity trackers
- Want data-driven health decisions
- Are privacy-conscious
- Comfortable running `npm run dev`

**Persona:** "Bryan Johnson lite" — Someone inspired by longevity optimization but not running a full medical team. Wants the insights without the complexity.

## User Journey

```
1. Clone repo
2. Add OPENROUTER_API_KEY to .env
3. Drop health files into /data folder
4. Run `npm run dev`
5. See dashboard with unified health view + biological age
6. Chat with agent: "What should I focus on improving?"
7. Get personalized recommendations based on actual data
```

## Core Features (V1)

| Feature | Description | Priority |
|---------|-------------|----------|
| File parsing | Extract data from PDFs, CSVs, XLSX | Must have |
| Biomarker extraction | Pull lab values from unstructured text | Must have |
| Levine PhenoAge | Calculate biological age | Must have |
| Dashboard | Visual display of all health metrics | Must have |
| Color-coded status | Green/yellow/red for each biomarker | Must have |
| Areas to improve | Identify out-of-range values + recommendations | Must have |
| Chat agent | Ask questions about your health | Must have |
| Verified sources | Agent searches NIH, Blueprint, not random web | Must have |
| Manual sync | Rescan /data folder on demand | Must have |
| Auto-sync on startup | Load data when app starts | Must have |

## Out of Scope (V1)

- OAuth integrations with Whoop, Apple Health, etc.
- Database / data persistence between sessions
- User accounts / multi-user
- Cloud deployment
- Historical trend tracking
- PDF report generation
- Mobile app

## Success Criteria

V1 is successful if:

1. [x] User can drop files in /data and see populated dashboard
2. [x] PhenoAge calculates correctly with standard lab panel
3. [x] Chat agent answers health questions using user's actual data
4. [x] Agent cites verified sources (NIH, Blueprint) not random blogs
5. [x] Core app runs locally; external transmission occurs only for user-invoked AI calls (user-owned API key)
6. [x] Dashboard parsing/analytics work offline; AI chat + web research features require internet
7. [x] Technical users can run it with just README instructions

## Differentiation

| Feature | Vitals.AI | Apple Health | InsideTracker | Random GPT |
|---------|----------|--------------|---------------|------------|
| Runs locally | ✅ | ❌ | ❌ | ❌ |
| Your API key | ✅ | N/A | N/A | ❌ |
| Blood work analysis | ✅ | ❌ | ✅ | ❌ |
| DEXA integration | ✅ | ❌ | ❌ | ❌ |
| AI chat with YOUR data | ✅ | ❌ | Limited | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Free | ✅ (pay API) | ✅ | ❌ ($) | ❌ ($) |

## Future Vision (Post-V1)

**V1.5 — CLI Mode**
- Terminal-based interface
- `vitals-ai dashboard` opens HTML report
- `vitals-ai chat "question"` for quick queries

**V2 — Integrations**
- Whoop API OAuth
- Apple Health export parsing
- Oura API

**V3 — Persistence**
- SQLite local database
- Track trends over time
- "Your glucose has improved 15% since January"

**V4 — Sharing**
- Export anonymized reports
- Share with doctor as PDF
- Community benchmarks (opt-in)

## Open Source Strategy

- MIT License
- GitHub repository
- Encourage forks and contributions
- No monetization in V1 — build community first
- Potential future: Premium features, hosted version (but always keep self-hosted free)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| PDF parsing unreliable | Start with common lab formats, document supported formats |
| PhenoAge requires specific biomarkers | Show "incomplete" if missing inputs, list what's needed |
| Agent gives medical advice | Disclaimer: "Not medical advice", cite sources always |
| User confused by setup | Clear README, sample data included |
| API costs surprise user | Document expected costs (~$0.10-0.50 per chat session) |

## Naming

**Vitals.AI** — Simple, descriptive, available.

Alternatives considered:
- BioAge (too narrow)
- HealthDash (too generic)
- PhenoTrack (obscure)
- Blueprint Clone (legal risk)

## Key Principles

1. **Privacy is non-negotiable** — No telemetry, no cloud, no exceptions
2. **User owns their data** — We never see it, touch it, or store it
3. **Transparent AI** — Agent cites sources, shows reasoning
4. **Simplicity over features** — Do few things well before expanding
5. **Open source first** — Community trust through transparency
