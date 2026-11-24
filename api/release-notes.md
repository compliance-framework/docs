---
title: Release notes
sidebar_position: 90
---

# Release notes for the 0.22 line

## v0.22.5 (2026-11-08)

### Fixed

- Update the `aws-sdk-go-v2` modules ([#560](https://github.com/compliance-framework/api/pull/560))
- Update the non-major Go dependencies ([#559](https://github.com/compliance-framework/api/pull/559))

### Breaking changes

None.

## v0.22.4 (2026-11-07)

### Fixed

- Update `github.com/anthropics/anthropic-sdk-go` to v2 ([#546](https://github.com/compliance-framework/api/pull/546))

### Breaking changes

None.

## v0.22.3 (2026-11-06)

### Fixed

- Update `github.com/slack-go/slack` to v0.31.0 ([#549](https://github.com/compliance-framework/api/pull/549))
- Update `github.com/open-policy-agent/opa` to v1.21.4, then v1.22.0 ([#545](https://github.com/compliance-framework/api/pull/545), [#556](https://github.com/compliance-framework/api/pull/556))
- Update `github.com/riverqueue` modules to v0.50.0 ([#550](https://github.com/compliance-framework/api/pull/550))
- Update the `aws-sdk-go-v2` modules ([#548](https://github.com/compliance-framework/api/pull/548), [#552](https://github.com/compliance-framework/api/pull/552))
- Update the non-major Go dependencies ([#553](https://github.com/compliance-framework/api/pull/553), [#555](https://github.com/compliance-framework/api/pull/555))
- Update the Go modules with security fixes ([#554](https://github.com/compliance-framework/api/pull/554))

### Breaking changes

None.

## v0.22.2 (2026-11-02)

### Fixed

- Update `github.com/labstack/echo/v4` to v5, a security fix ([#539](https://github.com/compliance-framework/api/pull/539))
- Build with the Go 1.26.10 toolchain so Renovate can ship Go security fixes ([#538](https://github.com/compliance-framework/api/pull/538))
- Update the `aws-sdk-go-v2` modules ([#544](https://github.com/compliance-framework/api/pull/544))

### Changed

- Pin the `gcr.io/distroless/base-debian12` Docker tag ([#540](https://github.com/compliance-framework/api/pull/540))
- Update the `gcr.io/distroless/static-debian13` Docker digest ([#547](https://github.com/compliance-framework/api/pull/547))
- Update the `postgres` image in `docker-compose.yml` to v18 ([#543](https://github.com/compliance-framework/api/pull/543))
- Update the non-major dependencies ([#542](https://github.com/compliance-framework/api/pull/542))
- Bump the shared CI workflows to v1.9.2 ([#537](https://github.com/compliance-framework/api/pull/537))

### Breaking changes

None.

## v0.22.1 (2026-10-28)

### Fixed

- Read the `CCF_EVIDENCE_BATCH_*`, `CCF_SSP_SCOPE_*` and `CCF_SSP_TEMPLATE_*` environment variables. v0.22.0 ignored them, so for example `CCF_EVIDENCE_BATCH_WORKERS=8` still ran 4 workers and `CCF_SSP_TEMPLATE_STALE_AFTER=72h` kept the `168h` default. The affected variables are `CCF_EVIDENCE_BATCH_MAX_ITEMS`, `CCF_EVIDENCE_BATCH_CHUNK_SIZE`, `CCF_EVIDENCE_BATCH_WORKERS`, `CCF_EVIDENCE_BATCH_RETENTION`, `CCF_EVIDENCE_BATCH_PRUNE_SCHEDULE`, `CCF_SSP_SCOPE_AUTO_FILTERS_SCHEDULE`, `CCF_SSP_TEMPLATE_DISCOVERY_SCHEDULE` and `CCF_SSP_TEMPLATE_STALE_AFTER` ([#535](https://github.com/compliance-framework/api/pull/535))

### Breaking changes

None. If you set any of these variables while running v0.22.0, they now take effect, so check their values before you upgrade.

## v0.22.0 (2026-10-28)

### Highlights

- Agents and integrations can submit evidence in batches: `POST /api/evidence/batches` accepts many items, stores them in the background and returns a batch to poll.
- Evidence storage and the compliance views are much faster. For 150 filtered controls over 5000 streams, profile compliance progress drops from 33.4 s to 47 ms.
- An SSP can have a scope that limits the evidence its filters see, and SSP templates create SSPs from discovered evidence.

### Added

- Add asynchronous batch evidence ingest:
  - Add an `evidence` queue and an `evidence_batch_chunk` job. `CCF_EVIDENCE_BATCH_WORKERS` sets the worker count (default 4), `CCF_EVIDENCE_BATCH_MAX_ITEMS` the most items per batch (default 1000) and `CCF_EVIDENCE_BATCH_CHUNK_SIZE` the items per job (default 100) ([#503](https://github.com/compliance-framework/api/pull/503))
  - Add the batch service, which stores each batch's items as pending and processes them exactly once ([#504](https://github.com/compliance-framework/api/pull/504))
  - Add `POST /api/evidence/batches`, which takes `{"evidence": [...]}` with a 64 MB body limit and answers `202` with a `Location` header, and `GET /api/evidence/batches/{id}`, which returns progress and each item's outcome. The submitter can read a batch, and so can any caller with the new `evidence:inspect` action, which only the `admin` role holds by default. Both routes need `evidence:create` and answer `503` when the worker service is off. `POST /api/evidence` is unchanged ([#505](https://github.com/compliance-framework/api/pull/505))
  - Add `CreateBatch`, `GetBatch` and `WaitForBatch` to the SDK's evidence client ([#506](https://github.com/compliance-framework/api/pull/506))
  - Prune batches and their item outcomes after `CCF_EVIDENCE_BATCH_RETENTION` (default `168h`) with an hourly job on `CCF_EVIDENCE_BATCH_PRUNE_SCHEDULE` (default `0 47 * * * *`). The evidence the batches stored stays ([#509](https://github.com/compliance-framework/api/pull/509))
  - Add the `make bench-evidence-ingest` benchmark, which compares single and batch ingest ([#507](https://github.com/compliance-framework/api/pull/507))
- Add SSP scope, which limits the evidence an SSP's filters see:
  - Add the scope models and service. A scope holds up to 500 entries and 500 exceptions ([#516](https://github.com/compliance-framework/api/pull/516))
  - Add `GET` and `PUT /api/oscal/system-security-plans/{id}/scope`, `POST .../scope/entries`, `POST .../scope/exceptions` and `DELETE .../scope/exceptions/{exceptionId}`, plus scoped evidence search ([#517](https://github.com/compliance-framework/api/pull/517))
  - Restrict the dashboard suggestion label pickers, preview and generate runs to the scope. `?ignoreScope=true` on the label keys and values routes returns all labels ([#518](https://github.com/compliance-framework/api/pull/518))
  - Let a filter follow an SSP's scope with `followSspScope` on `POST /api/filters` and `PUT /api/filters/{id}`. The API rewrites following filters on every scope change ([#519](https://github.com/compliance-framework/api/pull/519))
  - Add optional automatic per-policy filters, off by default and set with `auto-filters` on the scope. `CCF_SSP_SCOPE_AUTO_FILTERS_SCHEDULE` sets the reconcile job's schedule (default `0 23 * * * *`) ([#520](https://github.com/compliance-framework/api/pull/520))
- Add SSP templates, which create SSPs from discovered evidence:
  - Add the template model and the `/api/admin/ssp-templates` routes for list, create, get, update and delete. They need `admin:manage` ([#522](https://github.com/compliance-framework/api/pull/522))
  - Add `POST /api/admin/ssp-templates/preview`, which shows what a template would create and writes nothing ([#524](https://github.com/compliance-framework/api/pull/524))
  - Add a discovery job on `CCF_SSP_TEMPLATE_DISCOVERY_SCHEDULE` (default `0 37 * * * *`). It creates at most 100 new SSPs per template per run. `CCF_SSP_TEMPLATE_STALE_AFTER` (default `168h`) sets when an SSP counts as stale ([#525](https://github.com/compliance-framework/api/pull/525))
  - Add `POST /api/admin/ssp-templates/{id}/run`, `GET /api/admin/ssp-templates/{id}/ssps` and `DELETE /api/admin/ssp-templates/{id}/ssps/{keyHash}` ([#526](https://github.com/compliance-framework/api/pull/526))

### Changed

- Speed up profile compliance progress and leverage posture by loading the latest evidence once for all controls ([#502](https://github.com/compliance-framework/api/pull/502)) and matching filters through a label index ([#514](https://github.com/compliance-framework/api/pull/514))
- Store evidence in 36 SQL statements instead of 65 ([#510](https://github.com/compliance-framework/api/pull/510))
- Find the latest evidence per stream with a skip scan instead of `DISTINCT ON`. Status over time for 2000 streams drops from 2.98 s to 75 ms ([#511](https://github.com/compliance-framework/api/pull/511))
- Cache the Compliance Map's lineage data and match filters through a label index. A warm request drops from 320-400 ms to about 1 ms. `CCF_LINEAGE_CACHE_TTL` (default `5m`, `0` disables the cache) and `CCF_LINEAGE_CACHE_MAX_ENTRIES` (default `32`) tune it, `?refresh=true` on `/api/lineage/roots`, `/children` and `/ssps` rebuilds a scope, and responses carry `X-Lineage-Generated-At`. The lineage routes return a generic message for 5xx errors ([#513](https://github.com/compliance-framework/api/pull/513))
- Refactor SSP creation and profile attachment into a service ([#523](https://github.com/compliance-framework/api/pull/523))
- Bump the shared CI workflows to v1.7.0 ([#527](https://github.com/compliance-framework/api/pull/527))

### Fixed

- Update `github.com/labstack/echo/v4` to v4.16.1, a security fix ([#528](https://github.com/compliance-framework/api/pull/528))
- Update `github.com/go-jose/go-jose` to v4, a security fix ([#530](https://github.com/compliance-framework/api/pull/530))
- Update the Go modules with security fixes ([#529](https://github.com/compliance-framework/api/pull/529))
- Update `github.com/open-policy-agent/opa` to v1.21.3 ([#533](https://github.com/compliance-framework/api/pull/533))
- Update the `river` modules to v0.49.0 ([#534](https://github.com/compliance-framework/api/pull/534))
- Update the `aws-sdk-go-v2` modules ([#532](https://github.com/compliance-framework/api/pull/532))
- Update the non-major dependencies ([#531](https://github.com/compliance-framework/api/pull/531))

### Breaking changes

None. The new batch, scope and template settings are read only from v0.22.1 on ([#535](https://github.com/compliance-framework/api/pull/535)), so use v0.22.1 or later if you set any of them.
