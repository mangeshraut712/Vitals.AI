# OpenClaw Integration

This document explains how OpenHealth forwards health event digests to OpenClaw hooks.

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
