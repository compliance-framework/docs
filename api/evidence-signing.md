---
title: Evidence signing
description: How the API signs evidence records, what a signature covers, and what the UI's Signature tab checks mean.
sidebar_position: 6
---

# Evidence signing

Every evidence record the API stores comes out **Signed** or **Unsigned**: the API signs records submitted with a token, and the UI's evidence page shows the result and lets you verify it. This guide is for **operators** who want their agents' evidence signed and for **compliance and GRC users** who read the **Signature** tab. It covers the API at [v0.22.5](https://github.com/compliance-framework/api/releases/tag/v0.22.5), the agent at [v0.9.6](https://github.com/compliance-framework/agent/releases/tag/v0.9.6) and the UI at [v2.15.2](https://github.com/compliance-framework/ui/releases/tag/v2.15.2).

## How it works

### The signing key

The API signs evidence with the RSA key pair it also uses to sign tokens: the private key signs the record, and the same key pair's public key verifies it. There is no separate evidence-signing key.

- Set `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` to two file paths and point them at storage that survives restarts. When both are set, `api run` writes a 2048-bit RSA key pair to them at startup if the files aren't there yet, and loads them from then on.
- When either path is unset, the API generates a new key pair in memory at every start. It can then still sign records, but no earlier signature verifies after a restart: verification parses the stored signature against the *current* public key, so records signed before the restart fail the **Signature Valid** check.
- The same holds for rotation: replacing the key pair makes every signature created with the old key fail **Signature Valid**. The stored envelope (hash, signer, claims) stays readable; only cryptographic verification fails.

### When a record is signed and when it isn't

The API signs a record once, at creation, in the same database transaction that stores it. Nothing re-signs a record later. A record is signed when two things hold:

1. The API has a signing key. It always does: when `CCF_JWT_PRIVATE_KEY` or `CCF_JWT_PUBLIC_KEY` is unset, it generates an ephemeral pair (see above).
2. The submission carried a valid user or agent token, which identifies the signer. If the submission has no signer, the record is stored **Unsigned** without an error.

In practice:

- Evidence an agent submits with its service account credentials is signed as that agent, by the key it authenticated with.
- Evidence a user submits (for example, evidence created when a user completes a workflow step) is signed as that user.
- Evidence submitted without a token is stored **Unsigned**. The evidence ingest route takes anonymous requests while `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS` is `false` (the default), and `concom submit-evidence` posts anonymously when neither credential is set.
- If signing a record fails, the whole submission fails: the record isn't stored unsigned.

So an agent's evidence is always signed when the operator sets, on the agent, the service account key (`api.auth` in the configuration file, or `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`) and, on the API, `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true` so anonymous submissions are rejected instead of stored unsigned.

### From the agent: credentials, labels and the endpoint

1. The agent authenticates with `POST /api/auth/agent/token`, sending its client ID and secret as HTTP basic auth. The response carries `access_token`, `token_type` (`Bearer`) and `expires_in` (86400: tokens last 24 hours).
2. The agent caches the token and reuses it until it's within a minute of expiring, then exchanges for a new one. On a `401` from an API call it drops the cached token, gets a fresh one and retries the request once.
3. It sends each evidence record to `POST /api/evidence`, one record per request, with the bearer token, and heartbeats to `POST /api/agent/heartbeat`. (The batch endpoint, `POST /api/evidence/batches`, stores records in the background and signs each one as its submitter, dated with the time the API accepted the batch. `concom` doesn't use it.)
4. Before sending, the agent labels each plugin record with `_agent` (its client ID, or a Kubernetes pod name, or a hash of its configuration) and `_plugin` (the plugin's name), merges in the plugin's own labels, and adds props that record where the evidence came from: `_plugin_source`, `_plugin_digest`, `_policy_source`, `_policy_digest`, and `agent-config-revision` in the `https://compliance-framework.github.io/ns` namespace when a remote configuration revision was applied. Hidden labels whose names start with `_` (including `_policy` and `_policy_path` from the policy engine) ride along too. All of these are part of the signed content, so the signature attests to them.

### What the signature covers

The stored signature is a small envelope: `version` (`v1`), `signature_algorithm` (`RS256`), `signed_at`, the SHA-256 `content_hash`, the `signer` snapshot, the submitter's token `claims`, and the `jws`: an RS256 JSON Web Signature over the same fields, so verification can compare the envelope with what was actually signed. The `content_hash` covers the record's content, computed over a canonical form of these fields:

| Covered | Notes |
|---|---|
| `uuid`, `title`, `description`, `remarks` | The record's identity and text. |
| `start`, `end`, `expires` | Formatted as RFC 3339 with nanoseconds, in UTC. |
| `props`, `links` | Sorted by their canonical JSON encoding. |
| `origins`, `activities` | Activities include their steps, sorted. |
| `inventory_items`, `components`, `subjects`, `subject_references` | Components sort their protocols and port ranges; subjects sort their include and exclude lists. |
| `status` | Only `state`, `reason` and `remarks`. |
| `back_matter` | Resources with sorted props, document IDs, links and hashes. |
| `labels` | Every label as a name/value pair, hidden `_` labels included. |

Empty fields are omitted from the canonical form, so records stored before a field existed (such as `subject_references`) still verify. Left out of the hash:

- **Implemented-component links** hanging off inventory items. Inventory items are shared across evidence records and later submissions add to those links; signing them would invalidate earlier signatures.
- **Database fields** (row IDs, created/updated timestamps): only the OSCAL content above is signed.
- **The envelope's own fields** (`signed_at`, signer, claims): they sit outside the content hash and are covered by the JWS itself.

### The signer fields

The envelope records who submitted the record, from the token it submitted with:

| Field | Agent submission | User submission |
|---|---|---|
| Signer **Type** | `agent` | `user` |
| Signer **Name** | The agent's **Name** as registered on the API | Given and family name |
| Signer **ID** | The agent's UUID | (not set) |
| Signer **Email** | (not set) | The user's email |
| Signer **Credential ID** | The service account key's UUID | (not set) |
| Claims | `token_kind` (`agent`), **Subject** (the key's client ID), **Issuer** (`compliance-framework`), **Issued At**, **Expires At**, **Not Before**, **Agent ID**, **Credential ID**, **Auth Method** (`service_account`) | `token_kind` (`user`), **Subject** (the email), **Issuer**, **Issued At**, **Expires At**, **Not Before**, **Given Name**, **Family Name** |

The signer fields are a snapshot taken when the record is created, not a live reference: renaming the agent later doesn't change stored signatures.

### Verification

`GET /api/evidence/{id}/signature` reports `signed` or `unsigned` and returns the stored envelope. `POST /api/evidence/{id}/verify` recomputes everything and runs four checks:

| Check | What it proves |
|---|---|
| **Hash Match** | The content hash in the stored envelope equals a hash recomputed from the record as the database holds it now. |
| **Signature Valid** | The stored JWS verifies against the API's current public key (RS256 only, with the signature's token kind), and its decoded payload matches the stored envelope field for field. |
| **Signed Content Matches** | The content hash inside the signed JWS equals the hash recomputed from the current record. |
| **Temporal Valid** | `signed_at` is no earlier than the submitter token's `issued_at` and `not_before`, and no later than its `expires_at`. |

The overall result is valid when all four pass; each failure adds an error line. Verification checks integrity only: whether the result is satisfied comes from the check that produced the evidence, not from the signature.

### In the UI

The evidence detail page's header shows a badge: **Signed** (lock) or **Unsigned** (unlock); **Unavailable** when the signature can't be read. The **Signature** tab has two cards. **Verification** holds the **Verify** button (it becomes **Re-verify** after the first run), a **Valid** or **Invalid** pill, the line `Verification status: signed`, the four check cards **Hash Match**, **Signature Valid**, **Temporal Valid** and **Signed Content Matches** each reading **Pass** or **Fail**, the recomputed **Verified Content Hash**, and, when checks fail, a **Verification Errors** list. **Signature Details** shows the stored envelope: **Envelope** (**Version**, **Algorithm**, **Signed At**, **Content Hash**), **Signer** (**Type**, **Name**, **Email**, **ID**, **Credential ID**), **Claims** and the raw **JWS**.

## Before you start

- Run the API at 0.22 or later with `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` set to paths on storage that survives restarts, so signatures survive them too.
- For agent evidence: the agent registered under **Admin** > **Agents**, and a service account key whose **Client ID** and secret you've put on the agent host. See the [agent overview](/agent).
- To read signatures and verify (both endpoints): a user or agent token and `evidence:read`. With the `builtin` driver any signed-in user has it; with `cedar`, `viewer`, `auditor`, `contributor` and `admin` hold it, and the `agent` role doesn't, so verify with a user token.
- To inspect keys under **Admin** > **Agents**: `agent:read` for the agent list and get, `admin:manage` for every key route. Under the `builtin` driver, users need admin access for both.

## Enable it

1. Give the API a persistent key pair and restart it:

   ```sh
   CCF_JWT_PRIVATE_KEY=/etc/ccf/jwt/private.pem
   CCF_JWT_PUBLIC_KEY=/etc/ccf/jwt/public.pem
   ```

2. In the UI, open **Admin** > **Agents**, select **Register Agent**, then open the agent's **Service Account Keys** tab and select **Create Service Account Key**. Save the **Client ID** and **Client Secret** shown once after creation.
3. On the agent host, set the credentials before starting the agent:

   ```sh
   export CCF_API_AUTH_CLIENT_ID=<the key client ID>
   export CCF_API_AUTH_CLIENT_SECRET=<the key client secret>
   ```

4. To guarantee that every stored record is signed, reject anonymous ingest on the API:

   ```sh
   CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true
   ```

   Without it, a submission that arrives without a token is accepted and stored **Unsigned**.

## Use it

### Read a record's signature

1. Open the record (see [Evidence](/ui/features/evidence)) and check the badge in its header: **Signed** or **Unsigned**.
2. Open the **Signature** tab and select **Verify**. All four checks should read **Pass** and the pill **Valid**.

   ![Verify an evidence signature and inspect the verification checks and stored signature details.](/img/ui/2.15/verify-evidence.gif)
3. Under **Signature Details**, compare the envelope with what you expect: the signer's **Name** is the agent's **Name** in **Admin** > **Agents**; the claims' **Subject** is the key's **Client ID** in that agent's **Service Account Keys** tab.
4. To tie the signature to a key exactly, match the signer's **Credential ID** to a key's `id`: the keys table shows **Client ID**, not the key's `id`, so read it from `GET /api/admin/agents/<agent-id>/keys`, which returns both.

### The endpoints behind the tab

| Endpoint | What it does | Needs |
|---|---|---|
| `GET /api/evidence/{id}/signature` | Reports `signed` or `unsigned` and returns the stored envelope. | A user or agent token and `evidence:read` |
| `POST /api/evidence/{id}/verify` | Recomputes the content hash, verifies the JWS and returns the four checks. | A user or agent token and `evidence:read` |

## Troubleshooting

### The agent can't get a token

The agent logs `agent auth failed with status code: N`. `POST /api/auth/agent/token` answers:

| Status | Cause | Fix |
|---|---|---|
| `401` `missing client credentials` | No basic auth and no `client_id` / `client_secret` form fields. | Set `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`, or `api.auth` in the configuration file. |
| `401` `invalid client credentials` | Unknown **Client ID**, a key not tied to an agent, or a wrong secret. | Recreate the key under **Admin** > **Agents** and copy the secret shown at creation. |
| `403` `agent key is revoked` | The key was revoked in **Admin** > **Agents**. | Create a new key. |
| `403` `agent key is expired` | The key's **Expires** date passed. | Create a key that never expires, or replace it before the date. |
| `403` `agent is inactive` | The agent row is deactivated. | Open the agent's **Edit Agent** dialog under **Admin** > **Agents** and tick **Agent is active**. |
| `500` | Database error or token signing failed. | Check the API's logs and database. |

### A record shows Unsigned

- It was submitted without a token. Check that the agent runs with `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET` (or `api.auth`), and that its calls don't reach the API anonymously: set `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true` to reject such submissions. `concom submit-evidence` without the two environment variables posts anonymously.
- A record is signed only at creation: one that was stored **Unsigned** stays that way. Submit it again with credentials to get a new record in its stream, signed this time.

### A check fails

- **Signature Valid** fails on records that used to verify: the API's key pair changed underneath them, typically a restart with `CCF_JWT_PRIVATE_KEY` / `CCF_JWT_PUBLIC_KEY` unset or pointing at different files, or a deliberate rotation. Earlier signatures can't be re-created; accept the older records as unverifiable or re-collect the evidence.
- **Hash Match** or **Signed Content Matches** fails while the record looks untouched: the record's stored content no longer matches what was signed. This can also happen after an upgrade that changes how the API canonicalizes a field, for records signed by the older release.
- **Temporal Valid** fails when `signed_at` falls outside the submitter token's `issued_at` / `not_before` / `expires_at` window. Check the API host's clock against its authentication log; a token issued with clock skew can date a signature before `issued_at`.

## Related

- [Authentication and permissions](./authentication-and-permissions.md): how agents get tokens and what the authorization drivers allow.
- [Configuration reference](./configuration.md): `CCF_JWT_PRIVATE_KEY`, `CCF_JWT_PUBLIC_KEY` and `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS`.
- [Evidence in the UI](/ui/features/evidence): searching records and the **Signature** tab.
- [Agent overview](/agent): running the agent that submits signed evidence.
