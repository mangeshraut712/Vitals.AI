# OpenHealth Skills OS

This file defines how to run work with consistent PM + engineering quality.
Use it as the default operating system for all non-trivial requests.

## 1) Plan Mode Default

Enter plan mode for any task with one of these signals:
- 3 or more implementation steps
- Architecture or dependency decisions
- Cross-cutting changes (frontend + backend + API + infra)
- High-risk requests (medical, security, payments, deployment)

Plan format:
- Goal
- Constraints
- Success criteria
- Plan
- Next step

If new information invalidates the plan, stop and re-plan before coding.

## 2) Prompt Router (Activation Rules)

Match prompt intent and run the mapped workflow.

| Prompt patterns | Activate workflow | Required output |
| --- | --- | --- |
| `fix`, `bug`, `error`, `broken`, `failing`, `lint`, `build`, `type` | Autonomous Bug Fixing | Root cause, fix, proof (tests/build) |
| `implement`, `add`, `build feature`, `integrate`, `create page` | Feature Delivery | Scope, implementation, verification |
| `review`, `audit`, `verify`, `validate`, `test` | Verification Before Done | Findings first, severity order, gaps |
| `refactor`, `cleanup`, `organize`, `simplify`, `optimize structure` | Simplicity First Refactor | Minimal diff, no behavior regression |
| `deploy`, `github`, `vercel`, `ci`, `release` | Release Execution | Preflight checks, deploy logs, rollback notes |
| `skills`, `workflow`, `prompt`, `agent`, `automation` | Skills Governance | Update this file + tasks lessons |
| unclear or conflicting request | Think Before Coding | Assumptions, options, chosen path |

Use multiple workflows when needed; run in this order:
1. Think Before Coding
2. Plan Mode
3. Execute (Bug Fix / Feature / Refactor)
4. Verification Before Done
5. Lessons Capture

## 3) Core Workflows

### A) Autonomous Bug Fixing

1. Reproduce the issue quickly.
2. Collect evidence (error logs, failing test, stack trace).
3. State root cause in one sentence.
4. Implement the smallest safe fix.
5. Run targeted tests first, then broad checks.
6. Validate no regressions in related flows.
7. Summarize what failed, what changed, what now passes.
8. Record prevention rule in `tasks/lessons.md`.

### B) Feature Delivery

1. Define user outcome and acceptance criteria.
2. Break work into checkable items in `tasks/todo.md`.
3. Implement in small, reversible increments.
4. Keep boundaries clear (UI, business logic, data, API).
5. Verify each increment before moving forward.
6. End with full verification gates.

### C) Verification Before Done

Do not mark complete until proof exists.

Minimum gates:
- Lint passes
- Typecheck passes
- Build passes
- Relevant tests pass
- Runtime smoke check for changed routes/APIs

For reviews:
- List findings first (highest severity first)
- Include file references
- State open risks and missing tests

### D) Simplicity First Refactor

Rules:
- Prefer deletion over abstraction.
- Touch the fewest files possible.
- Preserve behavior unless change is requested.
- Avoid speculative architecture.
- If a fix feels hacky, propose one elegant version and one minimal version, then choose intentionally.

### E) Release Execution (GitHub + Vercel)

1. Run preflight checks locally.
2. Ensure env vars are documented and not leaked.
3. Commit with focused message and scope.
4. Push to correct branch.
5. Validate CI and deployment logs.
6. Smoke test production URLs.
7. Document rollback steps for risky changes.

## 4) Task Management System

Use these files every session:
- `tasks/todo.md`: active execution checklist
- `tasks/lessons.md`: mistakes, fixes, and prevention rules

Execution rules:
- Write checkable tasks before coding.
- Mark progress continuously.
- Log decisions and tradeoffs.
- Add at least one prevention rule after each correction.

## 5) Standards (Non-Negotiable)

- No laziness: fix root cause, not symptoms.
- Minimal impact: avoid broad edits unless necessary.
- Evidence-first: claims require logs, tests, or outputs.
- Senior bar: ask, "Would this pass strict staff review?"
- Security + privacy first: no secrets in code, logs, or commits.
- Medical context caution: avoid unsafe advice and preserve disclaimers.

## 6) Done Definition

A task is done only if all are true:
- Acceptance criteria are met.
- Verification gates are green.
- Changed routes/APIs behave as expected.
- `tasks/todo.md` is updated.
- `tasks/lessons.md` is updated when relevant.
- Final summary includes outcome, proof, and residual risks.

## 7) Quick Trigger Prompts

Use these to force specific behavior:
- "Use plan mode" -> enforce section 1
- "Fix autonomously" -> enforce workflow A
- "Do verification before done" -> enforce workflow C
- "Refactor with simplicity-first" -> enforce workflow D
- "Prepare release for GitHub/Vercel" -> enforce workflow E
- "Update skills governance" -> update this file + task artifacts
