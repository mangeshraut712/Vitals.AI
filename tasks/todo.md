# OpenHealth Task Board

## Active Task — ExcelJS UUID advisory assessment (2026-10-30)
- [x] Define the safety constraints and isolate the worktree from PR #46.
- [x] Verify the exact lockfile graph, GitHub advisory, and failing Dependabot context.
- [x] Trace every ExcelJS import and exercised workbook API with synthetic-only tests.
- [x] Compare supported remediation options against current upstream documentation and licenses.
- [x] Remove the unused XLSX parser/dependency, stop advertising inactive spreadsheet input, and cover the boundary with synthetic tests.
- [x] Run targeted and full relevant verification gates and complete independent review.

## Previous Task

- [x] Define goal, constraints, and success criteria
- [x] Break implementation into checkable steps
- [x] Execute step 1
- [x] Execute step 2
- [x] Execute step 3
- [x] Run verification gates (lint, typecheck, build, tests)
- [x] Summarize changes, risks, and next actions

## Notes
- Date: 2026-02-19
- Owner: Codex
- Branch: current working branch
- Related issue/PR: OpenClaw install + continuous agent webhook wiring

## 2026-10-28 Privacy and unavailable-data repair
- [x] Establish clean, isolated baseline and run documented quality gates.
- [x] Add failing regression coverage for raw-value logging, malformed numeric input, and body-composition-only scorecards.
- [x] Apply the smallest root-cause fixes.
- [x] Re-run targeted, full, build, and static smoke verification.
- [x] Record prevention rule and residual limits.

## 2026-10-30 Dependency-audit follow-up
- [x] Verify the live Dependabot failure, advisory, workflow, open PRs, and locked dependency graph.
- [x] Establish that `exceljs@4.4.0` is the current published release and requires `uuid@^8.3.0`, which cannot satisfy the patched advisory range.
- [x] Evaluate the independently surfaced, semver-compatible `undici` patch update in an isolated worktree.
- [x] Apply only the confirmed-compatible lockfile update and verify audit, lint, typecheck, tests, build, and smoke gates.
- [x] Record the unresolved upstream `exceljs`/`uuid` constraint and the final verification evidence.

## Residual limits
- The repair does not make health claims, validate medical efficacy, change authentication/security policy, or connect external accounts/services.
- `exceljs@4.4.0` continues to require vulnerable `uuid@^8.3.0`; no compatible upstream ExcelJS release exists yet, so the related moderate Dependabot alert remains open rather than using an incompatible UUID override or a semver-major ExcelJS downgrade.
