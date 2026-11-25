---
title: API overview
description: What the Continuous Compliance Framework API does, how it's built and how you run it.
sidebar_position: 1
sidebar_label: Overview
---

# API overview

The Continuous Compliance Framework (CCF) API is the central service of CCF. It stores your compliance data as [OSCAL](https://pages.nist.gov/OSCAL/) documents, takes in the evidence CCF Agents collect, and serves everything the UI shows. This page is for **operators** who run the API and **developers** who integrate with it.

## What the API does

- **Stores OSCAL documents:** catalogs, profiles, component definitions, system security plans (SSPs), assessment plans and results, and plans of action and milestones (POA&M).
- **Takes in evidence:** CCF Agents, and any other system with a token, send evidence and heartbeats to the API.
- **Tracks risks and POA&M items** for each SSP, and runs workflows.
- **Builds dashboards** from evidence filters, with optional AI-generated filter suggestions.
- **Authenticates and authorizes** users and agents. See [Authentication and permissions](./authentication-and-permissions.md).

The API needs a PostgreSQL database. Every route is under `/api`, for example `/api/oscal/catalogs`. The full list of endpoints is the **API reference** in the sidebar.

## Run the API

The API ships as a single binary that's also its command line. The container image runs `/api run`, which starts the server on port `8080`.

```sh
api run
```

Configure it with environment variables, or a `.env` file in its working directory. At least set the database:

```sh
CCF_DB_DRIVER=postgres
CCF_DB_CONNECTION="host=db user=ccf dbname=ccf port=5432 sslmode=require"
```

Every setting is in the [configuration reference](./configuration.md).

Before the first start, create the database schema and a first user:

```sh
api migrate up
api users add --email ada@example.com --first-name Ada --last-name Lovelace
```

`api users add` needs the user's email and name; it generates and prints a password when you don't set one.

## Other commands

The full list of commands and their flags is in the [CLI reference](./cli-reference.md): `api bootstrap`, `api users`, `api oscal import` and `export`, `api authz export`, `api dashboards`, `api digest`, `api riskdigest` and `api seed`.

## Ports

| Port | What it serves | Setting |
|---|---|---|
| `8080` | The API. | `CCF_APP_PORT` |
| `9090` | Prometheus metrics, when `CCF_METRICS_ENABLED` is `true` (the default). | `CCF_METRICS_PORT` |
| `6060` | Go `pprof` profiling, when `CCF_PPROF_ENABLED` is `true`. | `CCF_PPROF_PORT` |

## Related

- [CLI reference](./cli-reference.md)
- [Configuration reference](./configuration.md)
- [Notifications](./notifications.md)
- [Authentication and permissions](./authentication-and-permissions.md)
- [Architecture](./architecture/index.md)
