---
title: Evidence signing
description: How the API signs evidence records with RSA signatures, what the signature covers, and how the UI verifies it.
sidebar_position: 6
---

# Evidence signing

Evidence records in the CCF API are **Signed** or **Unsigned**. When signed, the API creates a [JSON Web Signature (JWS)](https://datatracker.ietf.org/doc/html/rfc7515) over a canonical hash of the record. The UI's **Signature** tab lets you verify the signature and inspect every check.

This page is for **operators** who configure signing on the API and **compliance and GRC users** who inspect evidence signatures.

The API, UI and Agent versions used for this page are:

- API `v0.22.6-rc1` — [source read](https://github.com/compliance-framework/api/tree/v0.22.6-rc1)
- UI `v2.9.3` — [source read](https://github.com/compliance-framework/ui/tree/v2.9.3)
- Agent `v0.9.6` — [source read](https://github.com/compliance-framework/agent/tree/v0.9.6)

## How it works

When the API receives an evidence record from an authenticated agent or user, it computes a **content hash** over a canonical JSON representation of the record, then signs that hash with an RSA private key. The signature is stored on the evidence record in the database as a JSON column. The signature covers the record content; the API's public key verifies it.

```
Agent submits evidence → API computes content hash → API signs hash with RSA private key → signature stored on record
```

The signature algorithm is **RS256**. The JWS is a compact, self-contained envelope that includes the content hash, signer identity, token claims, and the signature itself.

### When the API signs

The API signs a record when **all** of the following are true:

1. The API has an RSA private key configured (via `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY`).
2. The submitter is authenticated with a **user token** or an **agent token**.
3. The record is stored through an endpoint that carries an authentication context (most write endpoints, including batch ingestion).

If any of these conditions is not met, the record is stored **Unsigned**. Specifically:

- Records submitted to the **public agent endpoints** (when `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS` is `false` and no auth header is present) are stored unsigned, because the API has no signer identity.
- Records submitted without any authentication token are stored unsigned.
- Records submitted with a user token are always signed, because the user identity becomes the signer.
- Records submitted with an agent token are always signed, because the agent identity and service account key become the signer.

### What happens to earlier signatures

When the API's signing key changes (the `CCF_JWT_PRIVATE_KEY` file is replaced), **existing stored signatures remain valid** — they were signed with the previous key and are verified against it. New records are signed with the new key. The API uses the same public key for verification, so the key pair must be updated atomically: both the private and public key files must be replaced together.

If the API's keys are **not persistent** (not set via `CCF_JWT_PRIVATE_KEY` / `CCF_JWT_PUBLIC_KEY`), the API generates a new key pair on every start. This means:

- Every restart produces a new key pair.
- Signatures from earlier runs cannot be verified after a restart, because the public key changed.
- The API logs a warning: `No JWT key files have been provided. Generating new keys. Any previously-created JWTs will no longer be valid.`

For evidence signing to survive restarts, the API **must** be started with persistent key files.

### Key roles

| Key | Purpose | Setting |
|---|---|---|
| `CCF_JWT_PRIVATE_KEY` | Signs evidence records (and user/agent tokens). Must be an RSA private key in PEM format. | File path, defaults to `private.pem` |
| `CCF_JWT_PUBLIC_KEY` | Verifies evidence records (and user/agent tokens). Must be the matching RSA public key. | File path, defaults to `public.pem` |

The same key pair signs evidence, authenticates users, and authenticates agents. This is by design: the API uses one RSA key pair for all JWT operations.

## Before you start

- The API must have an RSA key pair configured via `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY`.
- An agent must be registered in the UI under **Admin** > **Agents**, with an active service account key (not revoked, not expired).
- An agent token is valid for 24 hours. The agent refreshes it automatically by re-authenticating with its `client_id` and `client_secret`.
- To verify signatures on a record, you need a user token or agent token (the verify endpoint is not public).

## Enable it

To ensure your agents' evidence is always signed:

### 1. Configure persistent signing keys on the API

```sh
# Generate a key pair (only on first run, or to rotate keys)
api bootstrap --action sign-evidence

# Or generate manually:
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

Then set the paths in your API configuration:

```sh
CCF_JWT_PRIVATE_KEY=/path/to/private.pem
CCF_JWT_PUBLIC_KEY=/path/to/public.pem
```

Or in a `.env` file:

```env
CCF_JWT_PRIVATE_KEY=/path/to/private.pem
CCF_JWT_PUBLIC_KEY=/path/to/public.pem
```

### 2. Register the agent and assign a service account key

In the UI, navigate to **Admin** > **Agents**. Create a new agent (or edit an existing one) and generate a service account key. The key has a **client ID** and **client secret**. Store these securely — they are the only time the secret is shown.

### 3. Configure the agent with its credentials

In the agent's configuration file, or in the environment:

```yaml
api:
  url: https://ccf-api.example.com
  auth:
    client_id: 123e4567-e89b-12d3-a456-426614174000
    # Do not put the secret in the config file. Set CCF_API_AUTH_CLIENT_SECRET instead.
```

```sh
export CCF_API_AUTH_CLIENT_SECRET='<the key client secret>'
```

When the agent runs, it authenticates to the API with these credentials, receives an agent JWT token, and uses it to submit evidence. The API signs every record it receives with the agent's identity as the signer.

### 4. Verify the agent is authenticated correctly

Check the agent logs for successful authentication. The agent reports its auth state when it starts:

```
auth_enabled=true client_id=123e4567-e89b-12d3-a456-426614174000
```

If the agent reports `auth_enabled=false`, its evidence will be unsigned.

## Use it

### What the signature covers

When the API computes a signature, it creates a **canonical JSON** representation of the evidence record, then hashes it with **SHA-256**. The canonical form sorts arrays by their canonical JSON string and includes the following fields:

| Field | Signed? | Notes |
|---|---|---|
| `uuid` | Yes | The evidence stream UUID |
| `title` | Yes | |
| `description` | Yes | |
| `remarks` | Yes | |
| `start` | Yes | RFC 3339 UTC timestamp |
| `end` | Yes | RFC 3339 UTC timestamp |
| `expires` | Yes | RFC 3339 UTC timestamp, or null |
| `props` | Yes | Sorted by canonical JSON |
| `links` | Yes | Sorted by canonical JSON |
| `origins` | Yes | Sorted by canonical JSON |
| `activities` | Yes | Steps sorted by canonical JSON |
| `inventory_items` | Yes | Implemented components are **excluded** (they are shared across records; signing them would invalidate earlier signatures) |
| `components` | Yes | Port ranges sorted by canonical JSON |
| `subjects` | Yes | Include/exclude subjects sorted |
| `subject_references` | Yes | Sorted by canonical JSON |
| `status` | Yes | State, reason, and remarks |
| `back_matter` | Yes | Resources sorted, with hashes and rlinks sorted |
| `labels` | Yes | Sorted by canonical JSON |

The signature does **not** cover:

- The database-assigned `id` (the primary key UUID).
- The signature column itself (`signature`).
- `implemented_components` on inventory items (they are shared across evidence records).
- The `created_at` / `updated_at` database timestamps (they are not part of the record submitted).
- The `_compliance-framework` internal props added by the API at ingestion time.

### What the signature records

The JWS signature envelope stores the following metadata:

| Field | Description |
|---|---|
| `version` | Always `"v1"` |
| `signature_algorithm` | `"RS256"` |
| `signed_at` | The time the signature was created (UTC, RFC 3339 nanoseconds) |
| `content_hash` | SHA-256 hash of the canonical evidence payload |
| `signer.type` | `"user"` or `"agent"` |
| `signer.email` | The user's email (when `type` is `"user"`) |
| `signer.name` | The user's full name (when `type` is `"user"`) |
| `signer.id` | The agent ID (when `type` is `"agent"`) |
| `signer.name` | The agent name (when `type` is `"agent"`) |
| `signer.credential_id` | The service account key ID (when `type` is `"agent"`) |
| `claims.token_kind` | `"user"` or `"agent"` |
| `claims.subject` | The token subject (user email or client ID) |
| `claims.issuer` | `"compliance-framework"` |
| `claims.issued_at` | Token issue time |
| `claims.expires_at` | Token expiration time |
| `claims.not_before` | Token not-before time |
| `claims.agent_id` | The agent ID (when `token_kind` is `"agent"`) |
| `claims.credential_id` | The key ID (when `token_kind` is `"agent"`) |
| `claims.auth_method` | `"service_account"` |
| `claims.given_name` | User's given name (when `token_kind` is `"user"`) |
| `claims.family_name` | User's family name (when `token_kind` is `"user"`) |
| `jws` | The raw JWS string |

### How to match the signer to an agent in the UI

When a record is signed by an agent, the **Signature** tab shows the signer's:

- **Agent name** (`signer.name`) — matches the name shown under **Admin** > **Agents**.
- **Agent ID** (`signer.id`) — the primary key of the agent record.
- **Credential ID** (`signer.credential_id`) — the service account key ID.

To match:

1. Open the evidence record in the UI.
2. Select the **Signature** tab.
3. Under **Signature Details**, note the **Agent name** and **Credential ID**.
4. Navigate to **Admin** > **Agents**.
5. Find the agent by name or ID.
6. Under the agent's details, find the service account key with the matching **Credential ID**.

This lets you confirm which agent submitted the evidence and which service account key was used.

### The API endpoints behind the Signature tab

The UI's **Signature** tab calls two read-only API endpoints. Both require a user or agent token.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/evidence/:id/signature` | `GET` | Retrieves the stored signature envelope for the evidence record. Returns `200 OK` with the signature, or `200 OK` with status `"unsigned"` if no signature exists. |
| `/api/evidence/:id/verify` | `POST` | Recomputes the evidence content hash, verifies the JWS against the API's public key, and returns the result of each verification check. |

The verify endpoint returns a `VerificationResult` with the following structure:

```json
{
  "data": {
    "status": "signed",
    "is_valid": true,
    "checks": {
      "hash_match": true,
      "signature_valid": true,
      "temporal_valid": true,
      "signed_content_matches": true
    },
    "content_hash": {
      "algorithm": "SHA-256",
      "value": "..."
    },
    "signer": {
      "type": "agent",
      "id": "...",
      "name": "...",
      "credential_id": "..."
    },
    "signed_at": "2025-01-15T10:30:00.000000000Z"
  }
}
```

### The verification checks

The UI shows the result of four checks, each corresponding to a field in the `checks` object:

| Check | UI label (bold) | What it verifies | What fails when |
|---|---|---|---|
| `hash_match` | **Hash matches** | The current evidence content hash matches the hash stored in the signature envelope. | The record has been modified after signing, or the stored and current canonical forms differ. |
| `signature_valid` | **Signature valid** | The JWS was signed with the API's private key, and the signed payload's metadata matches the stored signature. | The API's public key changed (key rotation), the JWS is malformed, or the token kind in the payload is wrong. |
| `temporal_valid` | **Temporal valid** | The `signed_at` time is within the token's validity window (`issued_at` to `expires_at`, respecting `not_before`). | The signing token's validity window does not contain `signed_at`. For batch evidence, this uses the `accepted_at` time instead of the signing time. |
| `signed_content_matches` | **Signed content matches** | The hash stored in the JWS payload matches the current evidence content. | The record content changed after it was signed. |

All four checks must pass for the overall result to show **Valid**. The `is_valid` field is `true` when all checks pass.

When a check fails, the `errors` array contains a human-readable explanation:

- **Hash matches fails:** `"current evidence content does not match the stored signature envelope hash"`
- **Signature valid fails:** `"stored signature envelope does not match the signed payload"`
- **Signed content matches fails:** `"current evidence content does not match the hash contained in the signed payload"`
- **Temporal valid fails:** `"signed_at is before the token issued_at time"`, `"signed_at is before the token not_before time"`, or `"signed_at is after the token expiration time"`

## Troubleshooting

### The agent's token exchange fails

When the agent cannot authenticate to the API, it falls back to **unsigned** evidence or fails to submit. Here are the possible HTTP status codes and their causes:

| Status | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | The token is invalid or expired. This happens when the `client_id` / `client_secret` are wrong, the token expired (validity window does not contain `signed_at`), or the API's public key changed. | Verify the `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET` environment variables match the service account key. If keys were rotated, regenerate the key. |
| `401 Unauthorized` | The token is malformed. The `Authorization: Bearer <token>` header contains an invalid token string. | Regenerate the agent token by restarting the agent with correct credentials. |
| `401 Unauthorized` | The token's issuer does not match `"compliance-framework"` or the token kind is not `"agent"`. | The API is verifying against a wrong public key. Check `CCF_JWT_PUBLIC_KEY`. |
| `403 Forbidden` | The agent is **inactive** (`is_active = false` in the database). | Activate the agent in **Admin** > **Agents**. |
| `403 Forbidden` | The agent's service account key is **revoked**. | Create a new service account key for the agent. |
| `403 Forbidden` | The agent's service account key is **expired**. | Create a new service account key with a future expiry date. |
| `500 Internal Server Error` | The API could not load the agent record from the database. | Check the database connection and log for details. |
| `500 Internal Server Error` | The API could not load the agent's service account key from the database. | Check the database connection and log for details. |

The agent logs the authentication state at startup. Look for:

```
auth_enabled=true auth_partial=false client_id=...
```

- `auth_enabled=true` means the agent has credentials configured and attempted authentication.
- `auth_enabled=false` means no credentials are configured; the agent will use public endpoints (evidence will be unsigned).

### An evidence record shows **Unsigned**

Evidence records show as **Unsigned** when the API did not have a signer identity at the time of submission. Common causes:

1. **No signing key configured on the API.** If `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` are not set, the API generates ephemeral keys on each start. During the transaction, the signing service is initialized with `cfg.JWTPrivateKey`. If it is `nil`, `SignEvidence` returns `nil` and the record is unsigned.

   Fix: Configure persistent key files as described in [Enable it](#enable-it).

2. **The agent has no credentials.** When the agent runs without `CCF_API_AUTH_CLIENT_ID` / `CCF_API_AUTH_CLIENT_SECRET`, it accesses the public agent endpoints. No authentication context means no signer context, so `SignerContext.IsEmpty()` returns `true` and the record is unsigned.

   Fix: Register the agent and configure its `api.auth` with the service account key.

3. **The agent's credentials are wrong.** If the `client_id` or `client_secret` does not match any active service account key, the API returns `401 Unauthorized`. The agent may fall back to an unsigned submission path or log an error.

   Fix: Check the service account key on **Admin** > **Agents** and update the agent's configuration.

4. **The agent's token is expired.** The API verifies the token's temporal validity before accepting evidence. An expired token is rejected with `401 Unauthorized`.

   Fix: Restart the agent so it re-authenticates and gets a fresh token.

### A verification check fails

When the **Signature** tab shows a failed check:

- **Hash matches** fails: The evidence record's current content does not match the content that was hashed at signing time. This can happen if the record was modified after signing (which should not happen through normal API operations) or if the canonicalization logic changed between versions.

- **Signature valid** fails: The JWS cannot be verified against the API's current public key. This usually means the API's key was rotated — the old signatures were signed with the previous key. After key rotation, old signatures from before the rotation will fail this check.

  To verify old signatures after key rotation, you need access to the old public key. The API uses its current public key for all verification.

- **Temporal valid** fails: The `signed_at` time falls outside the signing token's validity window (`issued_at` to `expires_at`). This can happen if the system clock was incorrect at the time of signing, or if the `accepted_at` time (for batch evidence) was outside the token window.

- **Signed content matches** fails: The hash inside the JWS payload does not match the current evidence content. This indicates the evidence was modified after it was signed. This should not happen through normal API operations, as evidence is immutable once stored.

## Related

- [Agent overview](/agent)
- [Evidence](/ui/features/evidence)
- [Configuration reference](./configuration.md)
- [Authentication and permissions](./authentication-and-permissions.md)
