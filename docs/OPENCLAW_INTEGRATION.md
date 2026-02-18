# OpenClaw Integration

This document explains how OpenHealth forwards health event digests to OpenClaw hooks.

## Local Install (Continuous + Agent Mode)

Use this when you want OpenClaw running locally with OpenHealth auto-dispatch enabled.

1. Install OpenClaw CLI (official installer):

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
```

2. Onboard non-interactively with OpenRouter (free-tier capable) and install daemon:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --mode local \
  --auth-choice openrouter-api-key \
  --openrouter-api-key "$OPENROUTER_API_KEY" \
  --skip-channels \
  --skip-skills \
  --skip-ui \
  --install-daemon

# Pin a free OpenRouter model for agent turns
openclaw config set agents.defaults.model.primary 'openrouter/meta-llama/llama-3.3-70b-instruct:free'
openclaw gateway restart
```

3. Enable webhook hooks and set token auth:

```bash
openclaw config set hooks.enabled true --json
openclaw config set hooks.path '/hooks'
openclaw config set hooks.token 'your-strong-token'
openclaw config set hooks.allowedAgentIds '["main"]' --json
openclaw gateway restart
```

4. Set OpenHealth env:

```bash
OPENCLAW_ENABLED=true
OPENCLAW_HOOKS_BASE_URL=http://127.0.0.1:18789
OPENCLAW_HOOKS_PATH=/hooks
OPENCLAW_HOOKS_TOKEN=your-strong-token
OPENCLAW_HOOK_MODE=agent
OPENCLAW_AGENT_ID=main
OPENCLAW_AUTO_DISPATCH_ON_SYNC=true
OPENCLAW_EVENT_SEVERITIES=warning,critical
OPENCLAW_MAX_EVENTS=12
OPENCLAW_INCLUDE_SUMMARY=false
```

5. Verify:

```bash
openclaw health --json
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENCLAW_HOOKS_TOKEN" \
  -d '{"message":"OpenHealth webhook test","agentId":"main","deliver":false}'
```

## What It Does

- Reads canonical events from `HealthDataStore.getHealthEvents()`
- Filters by configured severities (default: `warning,critical`)
- Redacts sensitive numeric values by default
- Sends digest to OpenClaw hook endpoint:
  - `POST /hooks/wake` when `OPENCLAW_HOOK_MODE=wake`
  - `POST /hooks/agent` when `OPENCLAW_HOOK_MODE=agent`

## Privacy Defaults

- `OPENCLAW_INCLUDE_SUMMARY=false` by default
- Raw event `value` fields are never forwarded
- Digest contains metric/domain/severity/source/time and optional redacted summary

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `OPENCLAW_ENABLED` | `false` | Master switch for integration |
| `OPENCLAW_AUTO_DISPATCH_ON_SYNC` | `false` | Auto-send digest after `/api/sync` |
| `OPENCLAW_HOOKS_BASE_URL` | `http://127.0.0.1:18789` | OpenClaw server URL |
| `OPENCLAW_HOOKS_PATH` | `/hooks` | Hooks path prefix |
| `OPENCLAW_HOOKS_TOKEN` | _(empty)_ | Bearer token for hooks auth |
| `OPENCLAW_HOOK_MODE` | `wake` | `wake` or `agent` |
| `OPENCLAW_HOOK_WAKE_MODE` | `now` | `now` or `next-heartbeat` |
| `OPENCLAW_EVENT_SEVERITIES` | `warning,critical` | Forward filter |
| `OPENCLAW_MAX_EVENTS` | `12` | Max events per dispatch |
| `OPENCLAW_INCLUDE_SUMMARY` | `false` | Include redacted summary text |
| `OPENCLAW_TIMEOUT_MS` | `8000` | Request timeout in milliseconds |
| `OPENCLAW_HOOK_NAME` | `OpenHealth` | Sender name for agent mode |
| `OPENCLAW_AGENT_ID` | _(empty)_ | Optional OpenClaw agent ID |
| `OPENCLAW_AGENT_DELIVER` | `false` | Deliver message to channel in agent mode |
| `OPENCLAW_AGENT_CHANNEL` | _(empty)_ | Channel (agent mode) |
| `OPENCLAW_AGENT_TO` | _(empty)_ | Recipient/user/thread selector |

## Dispatch Endpoint

`POST /api/integrations/openclaw/dispatch`

Optional body:

```json
{
  "limit": 20,
  "dryRun": false,
  "severities": ["warning", "critical"]
}
```

## Auto Dispatch On Sync

When `OPENCLAW_AUTO_DISPATCH_ON_SYNC=true`, OpenHealth will call OpenClaw automatically after `POST /api/sync`.

## UI Trigger

Use the **Send to OpenClaw** button in the **Health Event Feed** card.
