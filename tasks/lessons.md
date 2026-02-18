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
