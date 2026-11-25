---
title: CLI reference
description: Every command the api binary runs — the server, migrations, users, OSCAL and dashboard import and export, the authorization vocabulary, digests and seed data — with their flags.
sidebar_position: 6
---

# CLI reference

This page is for **operators**. The Continuous Compliance Framework (CCF) API ships as a single binary that's also its command line. The container image runs `api run`; every other command is a maintenance or administrative task you run from a shell. This page covers the API at [v0.22.5](https://github.com/compliance-framework/api/releases/tag/v0.22.5).

## Invoking the CLI

The binary is named `api`. Run it on the API host, or inside the API container:

```sh
api <command> [subcommand] [flags]
```

`api help` lists every command.

The CLI reads the same configuration as the server: environment variables with the `CCF_` prefix, or a `.env` file in the working directory. Every command that touches the database needs `CCF_DB_DRIVER` and `CCF_DB_CONNECTION`. Every setting is in the [configuration reference](./configuration.md).

One flag applies to every command:

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-d`, `--debug` | Turn on database debug logging, the same mode as `CCF_DB_DEBUG`. | `bool` | `false` |

## Commands

| Command | What it does |
|---|---|
| `api run` | Starts the API server. |
| `api migrate up` / `down` / `refresh` | Creates, removes or recreates the database schema. |
| `api bootstrap` | Creates the JWT signing key files. |
| `api users add` / `update` | Manages users who sign in with a password. |
| `api authz export` | Prints the authorization vocabulary. |
| `api oscal import` / `export` | Moves OSCAL documents in and out of the database. |
| `api dashboards export` / `import` | Moves dashboard filters in and out of the database. |
| `api digest test` / `preview` | Tests the evidence digest. |
| `api riskdigest test` | Runs the risk digest now. |
| `api seed heartbeats` / `evidence` / `workflows` / `lineage` | Loads demo data directly into the database. |

## `api run`

Starts the API server. It needs a PostgreSQL database; configure it with `CCF_DB_DRIVER` and `CCF_DB_CONNECTION`. On startup the command:

1. Creates the JWT key files when both `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` are set and the files don't exist yet. When both are set and one is empty, startup fails; unset both to keep the keys in memory only.
2. Connects to the database and upgrades the schema, the same as `api migrate up`.
3. Starts the background worker, the metrics server when `CCF_METRICS_ENABLED` is `true` (the default), and the `pprof` server when `CCF_PPROF_ENABLED` is `true`.
4. Listens for API requests on `CCF_APP_PORT` (default `:8080`).

```sh
api run
```

`api run` takes no flags.

## `api migrate`

Manages the database schema.

| Subcommand | What it does |
|---|---|
| `api migrate up` | Creates the database schema, or upgrades it to this version. |
| `api migrate down` | Removes the database schema CCF created. |
| `api migrate refresh` | Removes the schema and recreates it: `down` followed by `up`. |

`api run` migrates the schema up on its own at startup, so run these only to prepare a database in advance or to reset one.

## `api bootstrap`

Creates the RSA key pair the API uses to sign JWTs, and prints what it did:

```sh
api bootstrap --bit-size 4096
```

```text
JWT bootstrap complete (action=created, private=private.pem, public=public.pem)
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `--private-key` | Path for the private key file. | `string` | `CCF_JWT_PRIVATE_KEY`, else `private.pem` |
| `--public-key` | Path for the public key file. | `string` | `CCF_JWT_PUBLIC_KEY`, else `public.pem` |
| `--bit-size` | RSA key size, in bits. | `int` | `2048` |
| `--force` | Regenerate the key files even when they already exist. | `bool` | `false` |

`api run` creates the same files when you point `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` at paths that don't exist; run `api bootstrap` ahead of time when you want to fix the key size or pre-create them.

## `api users`

Manages users who sign in with a password. Single sign-on users don't need one. See [Single sign-on](./single-sign-on.md).

### `api users add`

Adds a user. `--email`, `--first-name` and `--last-name` are required. When you don't pass `--password`, the command generates a random 12-character one and prints it in the `User created successfully` line — copy it before the user signs in.

```sh
api users add --email ada@example.com --first-name Ada --last-name Lovelace
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-e`, `--email` | Email of the user; they sign in with it. | `string` | required |
| `-f`, `--first-name` | First name of the user. | `string` | required |
| `-l`, `--last-name` | Last name of the user. | `string` | required |
| `-p`, `--password` | Password of the user. | `string` | none; a random 12-character password is generated |

### `api users update`

Updates an existing user, looked up by email.

```sh
api users update --email ada@example.com --generate-password
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-e`, `--email` | Email of the existing user. | `string` | required |
| `-f`, `--first-name` | New first name. | `string` | unchanged |
| `-l`, `--last-name` | New last name. | `string` | unchanged |
| `-p`, `--password` | New password. Mutually exclusive with `--generate-password`. | `string` | unchanged |
| `--generate-password` | Set a new random 12-character password and print it. Mutually exclusive with `--password`. | `bool` | `false` |

Set at least one of `--first-name`, `--last-name`, `--password` or `--generate-password`.

## `api authz export`

Renders the embedded authorization manifest — its subjects, resources, actions, attributes and default roles — for external policy decision points and GitOps pipelines. It exports the vocabulary that operator policies are written against, not the operator policies themselves. For what the vocabulary is, see [Authentication and permissions](./authentication-and-permissions.md).

```sh
api authz export --format cedar --output ccf.cedar
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-f`, `--format` | Output format: `json`, `yaml`, `cedar` or `openfga`. Case-insensitive. | `string` | `json` |
| `-o`, `--output` | Output file. Prints to standard output when unset. | `string` | none (stdout) |

## `api oscal`

Moves OSCAL documents between the database and JSON files.

### `api oscal import`

Imports OSCAL documents from files or directories: catalogs, profiles, system security plans (SSPs), component definitions, assessment plans, assessment results and plans of action and milestones (POA&M). Pass `-f` once per file or directory; directories are read recursively, skipping hidden files.

```sh
api oscal import -f catalogs/ -f profiles/soc2-profile.json
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-f`, `--file` | A file or directory to import. Repeat the flag for more than one. | `list` | required |

Import is an upsert by document UUID: re-importing an updated file updates the stored document in place, adding new controls, requirements and statements. The update is additive — values removed from the file aren't deleted from the database. Each file is reported as `Created` or `Updated`; a file that fails is reported and the rest still import, and the command exits non-zero if any file failed.

### `api oscal export`

Exports every object of one type from the database to a JSON file.

```sh
api oscal export --type ssp
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-t`, `--type` | Type of OSCAL object to export: `ssp`, `ap`, `catalog` or `profile`. | `string` | required |
| `-o`, `--output` | Output file for exported objects. | `string` | `oscal_export.json` |

## `api dashboards`

Moves dashboard filters between the database and a JSON file, for example to promote a dashboard from staging to production.

### `api dashboards export`

Exports every dashboard — its name, SSP, evidence filter and controls — as a JSON array.

```sh
api dashboards export --output dashboards_export.json
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-o`, `--output` | Output file for exported dashboards. | `string` | `dashboards_export.json` |

### `api dashboards import`

Reads a JSON array in the format `api dashboards export` writes, and creates the dashboards and their control relations. A dashboard whose `id` already exists is updated. Each control is looked up by catalog and control ID; the import fails when a control doesn't exist in the database, so import the catalogs first.

```sh
api dashboards import --file dashboards_export.json
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `-f`, `--file` | Input JSON file containing the dashboards. | `string` | required |

## `api digest`

Tests the global evidence digest, the summary CCF sends to subscribed users on the schedule in `CCF_DIGEST_SCHEDULE`.

```sh
api digest preview
```

| Command | What it does |
|---|---|
| `api digest test` | Builds the digest and sends it to all subscribed users now, over email and Slack. |
| `api digest test --dry-run` | Prints the digest counts (total, satisfied, not satisfied, expired) without sending anything. |
| `api digest preview` | Prints the evidence summary, the number of subscribed users and whether a digest would be sent. Nothing is sent. |

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `--dry-run` | With `test`: show what would be sent without sending emails. | `bool` | `false` |

When `CCF_ENVIRONMENT` is `production`, `api digest test` asks you to type `yes` before it sends, unless you pass `--dry-run`.

## `api riskdigest test`

Runs the open-risk digest now, sending notifications to subscribed users directly instead of waiting for the worker's schedule.

```sh
api riskdigest test --window weekly
```

| Flag | Purpose | Type | Default |
|---|---|---|---|
| `--window` | Digest window: `daily`, `weekly` or `none`. | `string` | the `openDigestWindow` value of the risk configuration (`CCF_RISK_CONFIG`), `daily` when it's unset |

When `CCF_ENVIRONMENT` is `production`, the command asks you to type `yes` before it sends. On completion it prints the window it used and the number of recipients.

## `api seed`

Loads demo data directly into the database, for development and demos. Don't run these against production.

| Command | What it seeds |
|---|---|
| `api seed heartbeats` | Agent heartbeats. |
| `api seed evidence` | Evidence items with beats. |
| `api seed workflows` | Workflow definitions from a JSON file. |
| `api seed lineage` | A demo Policy catalog, a demo Procedure catalog and control links for the Compliance Lineage demo. |

```sh
api seed evidence --amount 50 --beats 10
```

| Command | Flag | Purpose | Type | Default |
|---|---|---|---|---|
| `api seed heartbeats` | `-a`, `--amount` | Number of agents. A count flag: repeat the flag, once per agent. | `count` | `10` when the flag is absent |
| `api seed heartbeats` | `-b`, `--beats` | Beats per agent, one minute apart. A count flag: repeat the flag, once per beat. | `count` | `1440` when the flag is absent (a full day) |
| `api seed evidence` | `-a`, `--amount` | Number of evidence items. | `int` | `10` |
| `api seed evidence` | `-b`, `--beats` | Beats per evidence item. | `int` | `5` |
| `api seed workflows` | `-f`, `--file` | Input JSON file containing workflow definitions. | `string` | required |

`api seed lineage` takes no flags.

## Related

- [API overview](./index.md)
- [Configuration reference](./configuration.md)
- [Authentication and permissions](./authentication-and-permissions.md)
- [Single sign-on](./single-sign-on.md)
- [Notifications](./notifications.md)
