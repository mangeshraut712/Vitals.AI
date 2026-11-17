# OpenHealth Lessons Log

Capture every meaningful correction so the same mistake is less likely to repeat.

## Entry Template
- Date:
- Context:
- What failed:
- Root cause:
- Correction:
- Prevention rule:
- Validation proof:

## Entries
- Date: 2026-10-30
- Context: Dependabot UUID update failure and current runtime dependency audit
- What failed: Dependabot could not update `uuid`, and a fresh CI-equivalent audit also found a high-severity `undici@7.30.0` issue.
- Root cause: `exceljs@4.4.0` declares `uuid@^8.3.0`, while the UUID advisory is fixed only in `>=11.1.1`; independently, `@ai-sdk/provider-utils@5.0.27` permits `undici@^7.28.0` but the lockfile had retained `7.30.0` instead of the patched `7.30.1`.
- Correction: Do not override UUID across ExcelJS's declared major range. Update only the compatible locked Undici patch to `7.30.1`.
- Prevention rule: Before accepting an automated dependency fix, verify the advisory range, exact lockfile graph, and parent semver constraint; prefer a compatible lockfile patch and document an upstream-only blocker rather than forcing a major override.
- Validation proof: Isolated candidate install succeeded; the final lockfile passes `npm ci --dry-run --ignore-scripts`, `npm audit --audit-level=high` with zero high/critical findings, lint, typecheck, 79 unit tests, 20 eval tests, production build, Pages build, and static Playwright smoke. The two moderate ExcelJS/UUID findings remain intentionally reported.

- Date: 2026-10-28
- Context: Privacy-safe diagnostics and unavailable-scorecard handling
- What failed: Local diagnostic logs exposed extracted health measurements, malformed numeric query values were partially parsed, and body-composition-only input produced a composite health score.
- Root cause: Debug output serialized value-bearing objects, `parseFloat` accepted numeric prefixes, and scorecard availability reused a generic snapshot predicate that counted data unused by its calculation.
- Correction: Log only structural extraction progress, use finite full-string numeric conversion, and require an actual score input before calculating a score.
- Prevention rule: Never log health measurement values; validate an entire external value before use; gate derived health summaries on the exact inputs their calculation consumes.
- Validation proof: Targeted regression suite (15 tests), full Vitest suite (79 tests), lint, typecheck, production build, and static Pages Playwright smoke all passed.

- Context: Dependabot alert GHSA-w5hq-g745-h8pq through ExcelJS
- What failed: Dependabot could not update UUID because ExcelJS 4.4.0 constrains it to `^8.3.0`.
- Root cause: The sole ExcelJS parser had no import or call site, while scanner, UI, and upload validation still advertised XLSX as an active format.
- Correction: Remove the unused parser and dependency; align discovery, UI copy, docs, and upload MIME validation to the formats that the health-data loader actually ingests.
- Prevention rule: Do not advertise or validate a data format until an end-to-end ingestion path and regression test exist.
- Validation proof: Synthetic scanner and MIME-boundary tests; static data-sources UI smoke test; dependency graph no longer contains ExcelJS or UUID.

- Date: 2026-02-19
- Context: OpenClaw local install and OpenHealth webhook integration
- What failed: `openclaw health` failed after install because gateway/config was not initialized
- Root cause: Installer with `--no-onboard` skips gateway onboarding and daemon setup
- Correction: Run `openclaw onboard --non-interactive --accept-risk --mode local --auth-choice skip --skip-channels --skip-skills --skip-ui --install-daemon`
- Prevention rule: After any OpenClaw install, always run `openclaw gateway status` and verify `/hooks/wake` with token auth before wiring app env
- Validation proof: `openclaw health --json` returned `ok: true`, `POST /hooks/wake` returned HTTP 200, `POST /hooks/agent` returned HTTP 202

- Date: 2026-02-19
- Context: OpenClaw agent webhook accepted requests but did not execute agent reasoning
- What failed: Hook sessions were created but logs showed `No API key found for configured provider`
- Root cause: Onboarding used `--auth-choice skip`, leaving agent model auth unconfigured
- Correction: Re-run onboarding with `--auth-choice openrouter-api-key` and configured key from `.env.local`
- Prevention rule: For "continuous free agent mode", verify logs show a configured OpenRouter model and pin a `:free` model explicitly
- Validation proof: `openclaw logs` showed `agent model: openrouter/meta-llama/llama-3.3-70b-instruct:free`; new hook session IDs were created without auth errors
