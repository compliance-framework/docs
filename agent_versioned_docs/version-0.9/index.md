---
title: Agent overview
description: What the CCF Agent does, how you install it and how you run it.
sidebar_position: 1
sidebar_label: Overview
---

# Agent overview

The Continuous Compliance Framework (CCF) Agent runs CCF Plugins, which collect data about a system and check it against CCF Policies, and sends the resulting evidence to the API. This page is for **operators** who install and run the agent.

## How it works

1. The agent reads its configuration file: the API to report to, and the plugins to run, each with its policies and settings.
2. It downloads every plugin and policy bundle that isn't a local path. If a download fails, the run fails.
3. It starts each plugin as a separate process, passes it its settings and policies, and asks it to evaluate them. The plugin sends its evidence back through the agent, which adds its own labels and sends it to the API.

The agent runs in one of two modes:

- **One-shot** (the default): it runs every plugin once, in name order, and exits. It stops at the first plugin that fails. Use it in CI pipelines, cron jobs and Kubernetes jobs.
- **Daemon** (`--daemon`, or `daemon: true` in the file): it keeps running, runs each plugin on its own `schedule`, sends a heartbeat to the API every minute, and reloads the configuration file when it changes. Use it on a host or in a long-running container.

With service account credentials (`api.auth`), the agent also reports its configuration to the API, and can apply a configuration overlay that an administrator saves in the UI. See `remote_config` in the [configuration reference](./configuration.md).

## Before you start

- A running API, and its address.
- To authenticate the agent: an agent registered in the UI under **Admin** > **Agents**, with a service account key. The key's client ID and client secret go in `api.auth`.
- Network access from the agent to the API, and to the OCI registries your plugins and policies come from.

## Install the agent

The agent is a single binary. Each release publishes three container images that contain it as `/app/concom`:

| Image | What it's for |
|---|---|
| `ghcr.io/compliance-framework/agent` | Running the agent. The image runs `./concom agent -c /app/config.yml`, so mount your configuration file there. |
| `ghcr.io/compliance-framework/agent-ci` | CI jobs. It's a Debian image with a shell, so a job can run `/app/concom` among its other steps. |
| `ghcr.io/compliance-framework/agent-custodian` | The agent on top of the Cloud Custodian image, for plugins that need Cloud Custodian. Its entrypoint is `/app/concom`, and its default command is `agent -c /app/config.yml`. |

To build the binary yourself, use Go 1.26.1 or later and the release tag:

```sh
git clone --branch v0.9.3 https://github.com/compliance-framework/agent.git
cd agent
go build -ldflags "-X main.version=v0.9.3" -o concom main.go
```

The version you set with `-ldflags` is the one the agent reports to the API.

## Run the agent

Write a configuration file. This one runs one plugin every hour:

```yaml
daemon: true
api:
  url: https://ccf-api.example.com
plugins:
  apt-versions:
    source: ghcr.io/compliance-framework/plugin-apt-versions:v0.7.0
    policies:
      - ghcr.io/compliance-framework/plugin-apt-versions-policies:v0.5.1
    schedule: "0 * * * *"
    labels:
      environment: production
```

Put the service account key in the environment rather than in the file:

```sh
export CCF_API_AUTH_CLIENT_ID=123e4567-e89b-12d3-a456-426614174000
export CCF_API_AUTH_CLIENT_SECRET='<the key client secret>'
```

Then start the agent:

```sh
concom agent --config config.yaml
```

Every setting is in the [configuration reference](./configuration.md).

## Where the agent keeps its files

The agent writes under `.compliance-framework/` in its working directory:

| Path | What it holds |
|---|---|
| `.compliance-framework/plugins/` | Downloaded plugins, shared by every agent that runs in that directory. |
| `.compliance-framework/policies/` | Downloaded policy bundles, shared the same way. |
| `.compliance-framework/state/<key>/` | The instance's state: its instance ID and its cache of the remote configuration. The key comes from the configuration file's absolute path. |

Keep the state directory across restarts, or each restart registers a new agent instance with the API. Moving or renaming the configuration file has the same effect. In a container, mount a volume and point `CCF_STATE_DIR` at it. For one-shot runs that should report as one instance, set `CCF_INSTANCE_ID` to a fixed UUID.

## Other commands

| Command | What it does |
|---|---|
| `concom agent` | Runs the agent. See the [configuration reference](./configuration.md) for its flags. |
| `concom submit-evidence` | Sends one evidence record to the API without running plugins or policies. See below. |
| `concom download-plugin --source <OCI tag>` | Downloads plugins into `.compliance-framework/plugins` without running them. You can repeat `--source`. |

### Submit evidence

`submit-evidence` is for systems that already know their result, such as a CI pipeline. It needs at least one label: the evidence UUID comes from the labels, so the same labels update the same evidence stream.

```sh
concom submit-evidence "Pipeline ran successfully" \
  --api-url https://ccf-api.example.com \
  --status satisfied \
  --label provider=gitlab \
  --label evidence-kind=pipeline-artifact \
  --link "Pipeline=https://gitlab.example.com/group/project/-/pipelines/123"
```

It authenticates with `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`, like the agent.

| Flag | What it sets |
|---|---|
| `[title]` | The evidence title. Required unless the file sets one. |
| `-f`, `--file` | A YAML or JSON evidence file. The flags override its fields. The file must not set a UUID. |
| `--api-url` | The API address. Without it, the command reads `CCF_API_URL`, then `INPUT_API_URL`. |
| `--status` | `satisfied` or `not-satisfied`. |
| `--reason`, `--status-remarks` | The status reason and remarks. |
| `--description`, `--remarks` | The evidence description and remarks. |
| `--expires-at` | When the evidence expires: an RFC 3339 time, or a relative one such as `@after 1year` or `@after 2months 3days`. |
| `--label` | A `key=value` label. Repeat it for more labels. |
| `--link` | A `text=href` link. Repeat it for more links. |
| `--dry-run` | Prints the evidence as JSON instead of sending it. |

## Related

- [Configuration reference](./configuration.md)
- [Plugins](./plugins.md)
- [Agent architecture](/api/architecture/agents)
