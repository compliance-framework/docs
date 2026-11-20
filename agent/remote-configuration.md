---
title: Remote configuration
description: How the CCF Agent reports its configuration to the API and applies the overlays an administrator saves there.
sidebar_position: 4
---

# Remote configuration

Remote configuration lets an administrator change what an agent runs (plugin settings, schedules, policy data and policy sources) from the API, without logging in to the agent's host. This page is for **operators** who run the agent and decide how much of its configuration others may change.

## How it works

1. The agent's configuration file stays the base. It holds the API connection, the daemon flag and the `remote_config` block, and an overlay can never change those.
2. With service account credentials (`api.auth`), the agent reports the configuration it runs to the API.
3. An administrator saves an overlay for the agent in the UI. The overlay is a partial configuration that the agent merges on top of its file.
4. The agent asks the API for a new overlay every `30s` by default (`remote_config.poll_interval`), and you can set it as low as `5s`.
5. Before it applies a revision, the agent checks every change in it against its own `remote_config` and builds the complete new configuration, downloads included. If anything fails, the running configuration stays as it was and the agent reports why.
6. Plugin runs in flight finish, for up to 5 minutes, before the agent switches to the new configuration.

At startup, the agent tries the overlay it fetches from the API, then the last overlay it applied (from its state directory), then its file alone.

## Before you start

- An agent with service account credentials in `api.auth`. See the [agent overview](./index.md#before-you-start).
- A persistent state directory when the agent runs in a container: set `CCF_STATE_DIR` or `--state-dir`, so the agent keeps its instance ID and its cache of the last applied overlay across restarts.

## Enable Remote Configuration

With `api.auth` set, the default mode is `apply_safe`. To choose what the agent does with overlays, simply set `remote_config.mode` in its file:

```yaml
api:
  url: https://ccf-api.example.com
  auth:
    client_id: 123e4567-e89b-12d3-a456-426614174000
    client_secret: "8d2f6a1c-93b7-4e05-b4d8-6f1a2c9e7b30"
daemon: true
remote_config:
  mode: apply_safe
  poll_interval: 2m
  trusted_sources:
    - ghcr.io/compliance-framework/*
  overridable_config_flags:
    - "github:org"
```

The modes are:

| Mode | What the agent does |
|---|---|
| `off` | Reports nothing and fetches nothing. |
| `report` | Reports its configuration, but never applies an overlay. |
| `apply_safe` | Applies an overlay when every change in it is safe. |
| `apply_all` | Also applies unsafe changes. |

A change is safe when it adds a plugin or policy source that matches `remote_config.trusted_sources`, or changes a plugin config key listed in `remote_config.overridable_config_flags`. Setting `remote_config.allow_local_sources: true` also lets a safe overlay (`apply_safe`) add a plugin or policy from a local path.

For every setting, see the [configuration reference](https://compliance-framework.github.io/docs/agent/configuration).

## Troubleshooting

When the agent rejects a revision, it keeps running its last good configuration and reports the reason to the API. The common reasons:

- `unknown-field`: the overlay sets a key this agent version doesn't know. Upgrade the agent, or remove the key from the overlay.
- `download-failed`: a plugin or policy source in the overlay couldn't be downloaded within 5 minutes.
- `failed/env-missing`: the overlay uses `${env:NAME}` and `NAME` isn't set on the agent's host.

The agent logs each rejection. A rejected revision looks like this in the log:

```
[WARN] remote config: revision rejected: reason=unknown-field
```

## Use it

Once the mode is `apply_safe` or `apply_all`, the agent applies each new revision on its next poll. The heartbeat and the agent's evidence show the revision it runs, in the `agent-config-revision` label.

Editing overlays from the agent's own CLI is coming in a later release.

## FAQ

**Can an overlay change the API the agent reports to?** No. `api`, `daemon` and `remote_config` are locked, and an overlay that changes them is rejected in every mode.

**Do plugins see the agent's API credentials?** No. Plugins get the agent's environment without the variables whose names start with `CCF_API_AUTH_`.

## Related

- [Configuration reference](./configuration.md): every `remote_config` setting, with its default.
- [Agent overview](./index.md): how the agent runs.
