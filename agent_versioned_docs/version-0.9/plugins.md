---
title: Plugins
description: The contract between the CCF Agent and the plugins it runs.
sidebar_position: 3
---

# Plugins

This page is for **developers** who write Continuous Compliance Framework (CCF) Plugins. It sums up the contract between the agent and a plugin: how the agent starts a plugin, what it calls, and what the plugin can send back. The Go types are in the agent's [`runner`](https://github.com/compliance-framework/agent/tree/v0.9.3/runner) package, and the messages in its [`runner/proto`](https://github.com/compliance-framework/agent/tree/v0.9.3/runner/proto) folder.

## How the agent runs a plugin

A plugin is an executable that serves gRPC with HashiCorp's [go-plugin](https://github.com/hashicorp/go-plugin) library. For each run, the agent:

1. Starts the executable with the agent's environment, minus the variables whose names start with `CCF_API_AUTH_`. The plugin never gets the agent's API credentials.
2. Checks the go-plugin handshake: `runner.HandshakeConfig`, protocol version `1`, magic cookie key `RUNNER_PLUGIN`.
3. Dispenses the plugin named `runner`.
4. Calls `Configure`, then, for a protocol version 2 plugin, `Init`, then `Eval`.
5. Stops the plugin process.

Each run starts a new process, so a plugin keeps nothing in memory from one run to the next.

## The `Runner` service

| Call | Request | What the plugin does |
|---|---|---|
| `Configure` | `config`: the plugin's `plugins.<name>.config` map, as strings. `policy_data` and `policyBehavior`: the plugin's `policy_data` and `policy_behavior`. | Keeps its settings for the calls that follow. |
| `Init` | `policyPaths`: the local paths of the plugin's policy bundles, after download. `policyBehavior`. `apiServer`: the ID of the agent's `ApiHelper` service. | Protocol version 2 only. Prepares what its evaluations need, for example subject and risk templates. |
| `Eval` | The same fields as `Init`. | Collects its data, evaluates it against each policy bundle, and sends the evidence through `ApiHelper`. Returns `SUCCESS` or `FAILURE`. |

A plugin implements `runner.Runner` (`Configure` and `Eval`) for protocol version 1, or `runner.RunnerV2` (`Runner` plus `Init`) for protocol version 2. Both are served under the same `runner` name.

## Protocol versions

The agent supports protocol versions `1` and `2`. It picks a plugin's version in this order:

1. `plugins.<name>.protocol_version` in the agent's configuration.
2. For an OCI source given as a tag, the `org.ccf.plugin.protocol.version` annotation of the image. An annotation that isn't `1` or `2` is ignored.
3. Otherwise, `1`.

A plugin set to version 2 that doesn't implement `Init` fails its run. Publish the annotation with your plugin's image, so operators don't have to set `protocol_version`.

## The `ApiHelper` service

During `Init` and `Eval`, the plugin calls the agent back on the `ApiHelper` service at `apiServer`:

| Call | What it does |
|---|---|
| `CreateEvidence` | Sends evidence records to the API. The plugin client streams them to the agent one by one (`CreateEvidenceStream`), and falls back to one call when the agent doesn't support the stream. |
| `UpsertSubjectTemplates` | Creates or updates subject templates in the API. |
| `UpsertRiskTemplates` | Creates or updates the risk templates of a policy package in the API. |

One message from the plugin can be up to 256 MiB.

For a protocol version 2 plugin, `runner.InitWithSubjectsAndRisksFromPolicies` does the usual `Init`: it upserts the plugin's subject templates, then the risk templates of each policy bundle.

## What the agent adds to evidence

The agent adds these labels to every evidence record a plugin sends. A label the plugin sets itself keeps the plugin's value.

| Label | Value |
|---|---|
| `_agent` | The agent's identity: `api.auth.client_id`, else `KUBERNETES_POD_NAME` or `KUBERNETES_POD`, else a hash of the agent's plugin and agent evidence configuration. |
| `_plugin` | The plugin's name in the agent's configuration. |
| The plugin's `labels` | From `plugins.<name>.labels`. |

It also sets these props, replacing any the plugin set:

| Prop | Value |
|---|---|
| `_plugin_source`, `_plugin_digest` | The plugin's configured source, and the registry digest of an OCI source or the SHA-256 of a local executable. |
| `_policy_source`, `_policy_digest` | The source of the policy bundle the evaluation used, and its registry digest for an OCI source. |
| `agent-config-revision` | The remote configuration revision the agent runs, when it runs one. |

When a plugin builds its evidence with the policy manager's `GenerateResults`, each record also carries what its evaluation depended on. The agent uploads the policy bundle, the input data and the policy data to the API as artifacts, and adds their digests to the evidence, so the API can replay the evaluation later. If that upload fails, the agent sends the evidence without the digests.

## Related

- [Configuration reference](./configuration.md)
- [Agent overview](./index.md)
- [Plugins architecture](/api/architecture/plugins)
