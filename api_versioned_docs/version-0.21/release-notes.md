---
title: Release notes
sidebar_position: 90
---

# Release notes for the 0.21 line

## v0.21.1 (2026-10-14)

### Changed

- Adopt the shared CI workflows ([#486](https://github.com/compliance-framework/api/pull/486))
- Add release-please configuration ([#487](https://github.com/compliance-framework/api/pull/487))
- Add the release, preview and cut-prerelease workflows ([#488](https://github.com/compliance-framework/api/pull/488))
- Bump the internal workflow dependencies to v1.6.0 ([#500](https://github.com/compliance-framework/api/pull/500))

### Fixed

- Lock a risk while the worker resolves its evidence links, so two passing evidence streams for the same risk can't leave it open with no links ([#490](https://github.com/compliance-framework/api/pull/490))
- Update `github.com/moby/go-archive` to v0.3.0, a security fix ([#492](https://github.com/compliance-framework/api/pull/492))
- Update `github.com/labstack/echo/v4` to v4.15.3, a security fix ([#491](https://github.com/compliance-framework/api/pull/491))
- Update `golang.org/x/crypto` to v0.56.0, a security fix ([#494](https://github.com/compliance-framework/api/pull/494))
- Update `golang.org/x/mod` to v0.40.0, a security fix ([#495](https://github.com/compliance-framework/api/pull/495))
- Update `golang.org/x/net` to v0.60.0, a security fix ([#501](https://github.com/compliance-framework/api/pull/501))

### Breaking changes

None.

## v0.21.0 (2026-10-06)

### Highlights

- Agents can fetch their configuration from the API. Administrators save, preview, revert and review the configuration per agent, and see each reporting agent instance.
- Evidence can link to subjects, and you can list and filter subjects.

### Added

- Add subject discovery with filtering and pagination (`GET /api/subjects`), and let evidence reference subjects by UUID, show the linked subject details and filter by subject. Subject templates gain a display priority and a component type, and batch updates warn about accepted templates that produce no evidence subjects ([#468](https://github.com/compliance-framework/api/pull/468))
- Add remote configuration for agents, built in layers:
  - Add the agent configuration model with RFC 7396 overlay merge ([#469](https://github.com/compliance-framework/api/pull/469))
  - Add JSON diff, environment references, plugin sources and ETags ([#470](https://github.com/compliance-framework/api/pull/470))
  - Add change-safety classification and wire types ([#471](https://github.com/compliance-framework/api/pull/471))
  - Add secret detection, redaction and digests ([#472](https://github.com/compliance-framework/api/pull/472))
  - Add overlay validation ([#473](https://github.com/compliance-framework/api/pull/473))
  - Add the agent configuration client to the SDK ([#474](https://github.com/compliance-framework/api/pull/474))
  - Add an append-only store of agent configuration revisions ([#475](https://github.com/compliance-framework/api/pull/475))
  - Add an agent instance store ([#476](https://github.com/compliance-framework/api/pull/476))
  - Add validation bases, instance pruning and agent deletion ([#477](https://github.com/compliance-framework/api/pull/477))
- Add the `configure` (write an agent's overlay) and `sync` (fetch the overlay and report) actions on the agent resource. Users need the admin check on `agent:*`, agent service accounts can only register, ingest and sync, `/api/admin/agents` list and get need `agent:read`, and writes and key routes stay `admin:manage` ([#478](https://github.com/compliance-framework/api/pull/478))
- Add `GET /api/agent/config`, which returns the authenticated agent's overlay with an ETag (`If-None-Match` returns 304). It needs an agent JWT and `agent:sync`. Authenticated heartbeats refresh an instance's last-seen time and, with `config_digest` and `config_revision`, register the instance ([#479](https://github.com/compliance-framework/api/pull/479))
- Add `PUT /api/agent/instances/{instanceId}/config-report`, which stores an instance's mode, applied and attempted revision, status, redacted base and effective configurations, digest, plugins, unsafe changes and warnings. The API validates and bounds the report, rejects NUL characters, redacts secrets and returns 409 at the instance cap ([#480](https://github.com/compliance-framework/api/pull/480))
- Add `GET /api/admin/agents/{id}/config` and `GET /api/admin/agents/{id}/config/revisions/{rev}`, which return the overlay verbatim to `agent:configure` holders and redacted to other readers. Add `PUT /api/admin/agents/{id}/config`, which saves a new revision, needs `agent:configure` and requires `If-Match` (428 without it, 409 on a conflict, 200 for a no-op) ([#481](https://github.com/compliance-framework/api/pull/481))
- Add `POST /api/admin/agents/{id}/config/preview`, which validates a candidate overlay and shows each instance's redacted effective configuration, its diff, the classified changes and whether the agent applies it. Add `GET /api/admin/agents/{id}/config/revisions` (paginated, newest first) and `POST /api/admin/agents/{id}/config/revisions/{rev}/revert`, which saves an old overlay as a new revision ([#482](https://github.com/compliance-framework/api/pull/482))
- Add `GET /api/admin/agents/{id}/instances` and `GET /api/admin/agents/{id}/instances/{instanceId}`, which return an agent's reporting instances with derived status, sync status and per-status counts, and one instance with its redacted configurations ([#483](https://github.com/compliance-framework/api/pull/483))
- Add settings for subject handling and agent instances:
  - `CCF_EVIDENCE_REQUIRE_SUBJECT` sets whether evidence must reference a subject: `off`, `warn` or `enforce`. The default is `off` ([#468](https://github.com/compliance-framework/api/pull/468))
  - `CCF_MANUAL_EVIDENCE_REQUIRE_SUBJECT` sets the same requirement for manual evidence. The default is `false` ([#468](https://github.com/compliance-framework/api/pull/468))
  - `CCF_AGENT_MAX_INSTANCES` caps the instances per agent that aren't yet eligible for pruning. The default is `500` ([#480](https://github.com/compliance-framework/api/pull/480))
  - `CCF_AGENT_INSTANCE_STALE_AFTER` is how long since an instance was last seen before it counts as stale. The default is `10m` ([#476](https://github.com/compliance-framework/api/pull/476))
  - `CCF_AGENT_INSTANCE_RETENTION` is how long a daemon instance can go unseen before pruning. The default is `720h` ([#477](https://github.com/compliance-framework/api/pull/477))
  - `CCF_AGENT_INSTANCE_ONESHOT_RETENTION` is the same for one-shot instances. The default is `24h` ([#477](https://github.com/compliance-framework/api/pull/477))
  - `CCF_AGENT_INSTANCE_PRUNE_ENABLED` turns the prune job on or off. The default is `true` ([#477](https://github.com/compliance-framework/api/pull/477))
  - `CCF_AGENT_INSTANCE_PRUNE_SCHEDULE` is the prune job's cron schedule, which runs at most hourly. The default is `0 17 * * * *` ([#477](https://github.com/compliance-framework/api/pull/477))

### Changed

- Allow the `If-Match` and `If-None-Match` headers in CORS and expose `ETag` for the UI, and recover handler panics as 500 responses ([#483](https://github.com/compliance-framework/api/pull/483))

### Breaking changes

None.
