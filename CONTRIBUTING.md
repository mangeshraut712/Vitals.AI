# Contributing to Vitals.AI

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create local environment file:

```bash
cp .env.example .env.local
```

4. Start the app:

```bash
npm run dev
```

## Before Opening a Pull Request

Run all quality checks locally:

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
```

## Pull Request Guidelines

- Keep changes focused and explain the user-facing impact.
- Include screenshots for UI changes.
- Update docs when behavior, APIs, or setup change.
- Do not commit private health data or secrets.

## Commit Messages

Use short, action-oriented commit messages, for example:

- `feat(dashboard): add health event feed`
- `fix(api): handle missing goal payload`
- `docs: update quick start for new repo URL`
