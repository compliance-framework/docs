---
title: Evidence signing
description: How the API signs evidence records, when a record is signed or unsigned, and what operators set so agents' evidence is always signed.
sidebar_position: 4
---

# Evidence signing

When the API has a persistent RSA key pair, every evidence record it accepts from an authenticated caller (a CCF Agent or a user) is signed. The signature covers the record's content and proves both what was submitted and who submitted it. This page is for **operators** who run the API and agents.

## How it works

The API signs an evidence record when all three conditions hold:

1. The API has a persistent RSA key pair, set with `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY`. See [Enable it](#enable-it).
2. The caller authenticates. The API knows who submitted the record and with which credentials.
3. The caller is not anonymous (no token on the request).

If the API lacks a persistent key pair, or the request has no token, the API stores the record **unsigned**.

### When the API signs vs stores unsigned

| Submission path | Signed? | Why |
|---|---|---|
| A CCF Agent with a service account key (`POST /api/auth/agent/token`, then `POST /api/evidence`) | **Signed** | The agent authenticates, and the API signs when `CCF_JWT_PRIVATE_KEY` is set. |
| A user in the UI (`POST /api/auth/login` or SSO, then `POST /api/evidence`) | **Signed** | The user authenticates with a JWT cookie. |
| A script calling `POST /api/auth/token` (password flow) | **Signed** | The script authenticates with a JWT. |
| `POST /api/evidence` with no token, when `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS` is `false` | **Unsigned** | No token, no signer context. |
| `submit-evidence` CLI with credentials | **Signed** | It authenticates with a service account key just like the agent. |

The same RSA key pair that signs evidence is the one used for JWT issuance. To make it survive restarts, set `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` to paths of PEM files. Without them, the API generates a new key pair at each start.

### Key management

The API uses one RSA key pair for both signing and verification. The **private key** (set with `CCF_JWT_PRIVATE_KEY`) signs evidence records and JWTs. The **public key** (set with `CCF_JWT_PUBLIC_KEY`) verifies them. Anyone with the public key can verify an evidence signature without accessing the private key.

#### What happens when the key isn't persistent

If neither `CCF_JWT_PRIVATE_KEY` nor `CCF_JWT_PUBLIC_KEY` is set, the API generates a new RSA key pair at each start. Evidence signed before the restart becomes **unverifiable**: the new private key cannot produce signatures matching the old public key, and the old public key is gone. Records already stored remain in the database, but their signatures cannot be verified after a restart without the old key files.

To avoid this, always set `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` to persistent file paths. See [Enable it](#enable-it).

#### What happens on key rotation

When you rotate the key pair (generate a new pair and set the new paths):

- **Earlier signatures created with the old key** remain valid. Anyone holding the old public key can still verify those signatures.
- **New evidence submissions** are signed with the new private key. The public key the API stores and distributes is the new one.
- The API does **not** re-sign earlier records. If you need to re-sign historical records, you must use the old key pair.
- To keep a record of both key versions, store the old `private.pem` and `public.pem` files alongside the new ones.

### What the signature covers

The API canonicalizes the evidence record (all lists sorted by canonical JSON, times in RFC 3339 nano, fields in a fixed order), computes a SHA-256 hash of the canonical form, and wraps the hash with a JWS (RS256). The signature breaks down into three parts:

#### JWS header

The header contains the algorithm metadata:

- **alg:** `"RS256"` — the signing algorithm (RSA SHA-256)
- **kid:** the key ID of the public key used to sign, matching the `credential_id` of an agent's registered key under **Admin** > **Agents**

#### JWS payload

The payload carries the signature metadata and the record hash:

| Field | Type | Description |
|---|---|---|
| `version` | string | Always `"v1"` |
| `algorithm` | string | Always `"RS256"` |
| `signedAt` | string | UTC timestamp when the API created the signature, in RFC 3339 with nanosecond precision |
| `contentHash` | string | SHA-256 hash of the canonical JSON evidence record, encoded as lowercase hex |
| `signer.type` | string | `"user"` for UI/API submissions, `"agent"` for CCF Agent submissions |
| `signer.id` | string | The authenticated caller's ID (`user_id` or `agent_id`) |
| `signer.name` | string | The authenticated caller's display name |
| `signer.credentialId` | string | For agents: the `credential_id` that authenticated, matching the key under **Admin** > **Agents**. For users: the user's session credential ID |
| `claims.tokenKind` | string | `"agent"` for agent tokens, `"user"` for user JWT cookies |
| `claims.subject` | string | The JWT subject (`sub`) claim |
| `claims.issuer` | string | The JWT issuer (`iss`) claim |
| `claims.issuedAt` | string | The JWT `iat` claim, when the token was issued |
| `claims.expiresAt` | string | The JWT `exp` claim, when the token expires |
| `claims.agentId` | string | For agent tokens: the agent's registered ID. Omitted for user tokens |
| `claims.authMethod` | string | For agent tokens: the authentication method used (e.g. `"service_account"`) |

#### The hashed record

The `contentHash` is computed over the evidence record itself. The API hashes the following fields:

- `id` — the evidence record ID
- `createdAt` — the record creation timestamp
- `labels` — all labels on the record, including `_agent`, `_plugin`, and user-defined labels
- `content` — the full evidence content (the structured data from the plugin)
- `contentHash` — the hash inside the evidence content
- All other top-level fields except those listed in [Excluded fields](#excluded-fields) below

##### Excluded fields

The following fields are **excluded** from the hash so that later updates to them don't invalidate earlier signatures:

- `implemented_components` on inventory items — they are shared across evidence records and updated independently

The `_plugin` label **is included** in the hash (it is part of the canonical label list).

### When batch evidence is signed

Batch submissions (`POST /api/evidence/batches`) are accepted immediately (`202 Accepted`) and processed in the background. The signature dates from when the API **accepted** the batch (the moment the submitter's token was valid), not when the background worker finishes.

## Before you start

- A running API, with a PostgreSQL database. See [API overview](./index.md).
- `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` set to the paths of PEM files so the key pair survives restarts.
- A registered agent under **Admin** > **Agents** in the UI, with a service account key (client ID and client secret).

## Enable it

1. Generate a persistent RSA key pair. The API can do this for you:

   ```sh
   api bootstrap
   ```

   This creates `private.pem` and `public.pem` in the API's working directory.

2. Point the API at the key files, and restart:

   ```sh
   CCF_JWT_PRIVATE_KEY=/etc/ccf/jwt/private.pem
   CCF_JWT_PUBLIC_KEY=/etc/ccf/jwt/public.pem
   ```

   The API loads the files at startup. If both paths exist, it uses them; if either is unset, it generates a new key pair at each start.

3. Configure your agent with a service account key:

   ```sh
   export CCF_API_AUTH_CLIENT_ID=123e4567-e89b-12d3-a456-426614174000
   export CCF_API_AUTH_CLIENT_SECRET='<the key client secret>'
   ```

   Or set them in the agent's configuration file under `api.auth`.

When the API has persistent keys and the agent sends a valid token, **every** evidence record the API stores from that agent is signed.

## Use it

### From the agent

The agent authenticates to the API with its service account key:

1. The agent sends `POST /api/auth/agent/token` with HTTP Basic Auth (`client_id:client_secret`) or as form fields (`client_id` and `client_secret`).
2. The API returns `{ "access_token": "...", "token_type": "Bearer", "expires_in": 86400 }` (a 24-hour JWT).
3. The agent caches the token and refreshes it automatically when it expires or when the API returns `401 Unauthorized`.
4. On each evidence submission, the agent sends `POST /api/evidence` with `Authorization: Bearer <token>`. The API adds a `_plugin` label, the agent's `_agent` label, and any user-defined labels from the plugin configuration. The API signs the record.

The agent also sends a heartbeat to `POST /api/agent/heartbeat` every minute (in daemon mode). Heartbeats are not evidence records and are not signed.

### Labels the agent adds

For every evidence record, the agent always adds:

| Label | Value | Set by |
|---|---|---|
| `_agent` | The agent's identity: its service account ID, `KUBERNETES_POD_NAME`, or a hash of the agent configuration | The agent |
| `_plugin` | The plugin name (e.g. `apt-versions`, `local-ssh`) | The agent |

Plus any labels from the plugin's `labels` configuration. For example:

```yaml
plugins:
  apt-versions:
    source: ghcr.io/compliance-framework/plugin-apt-versions:v0.7.0
    labels:
      environment: production
```

The agent also adds these props to each evidence record:

| Prop | Value | Set by |
|---|---|---|
| `_plugin_source` | OCI reference or local path of the plugin | The agent |
| `_plugin_digest` | Registry digest or SHA-256 of the plugin binary | The agent |
| `_policy_source` | OCI reference or local path of the policy bundle | The agent |
| `_policy_digest` | SHA-256 digest of the policy bundle | The agent |

### What the operator sets for always-signed evidence

To ensure every agent's evidence is always signed:

1. **On the API:** Set `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` to persistent PEM file paths.
2. **On the agent:** Set `api.auth.client_id` and `api.auth.client_secret` (via environment or config file) so every evidence submission authenticates.

## Related

- [Configuration reference](./configuration.md): `CCF_JWT_PRIVATE_KEY`, `CCF_JWT_PUBLIC_KEY`, `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS`
- [Authentication and permissions](./authentication-and-permissions.md): how agents get tokens
- [Agent overview](/agent): how the agent sends evidence
