---
title: Evidence signing
description: When the API signs an evidence record, what the signature covers, and what each check in the UI's Signature tab means.
sidebar_position: 6
---

# Evidence signing

In the Continuous Compliance Framework (CCF), an evidence record is stored **Signed** or **Unsigned**: the API signs a record with its own RSA key pair as it stores it, and records who submitted it. The UI's **Signature** tab verifies a record against that signature. This guide is for **operators** who want their agents' evidence always signed and for **compliance and GRC users** who read the **Signature** tab.

The guide documents the API at [v0.22.5](https://github.com/compliance-framework/api/releases/tag/v0.22.5), the UI at [v2.15.2](https://github.com/compliance-framework/ui/releases/tag/v2.15.2) and the CCF Agent at [v0.9.6](https://github.com/compliance-framework/agent/releases/tag/v0.9.6), from their source at those releases.

## How it works

Whether a record is signed depends on all three components. The CCF Agent authenticates and submits evidence, the API signs what an authenticated submitter sent, and the UI shows the stored signature and the result of verifying it.

### The agent authenticates and submits evidence

With credentials set on the agent (`api.auth.client_id` and `api.auth.client_secret`, or `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`), the agent:

1. Exchanges its client ID and client secret for a token at `POST /api/auth/agent/token`, sent as HTTP Basic authentication. The response carries `access_token`, `token_type` `Bearer` and `expires_in` `86400`: a day.
2. Caches the token and gets a new one 1 minute before it expires. When any API call answers `401`, the agent drops the cached token, exchanges for a new one and retries that call once.
3. Sends every evidence record to `POST /api/evidence`, one record per request, with the token as a `Bearer` token.

Without credentials the agent sends the same request with no token, and the API accepts it by default.

The agent stamps every record a plugin returns:

- The `_agent` label: the key's client ID when the agent has credentials, otherwise the `KUBERNETES_POD_NAME` or `KUBERNETES_POD` environment variable, otherwise a hash of the agent's configuration.
- The `_plugin` label with the plugin's name, and the labels configured under that plugin's `labels` setting.
- The props the agent owns and replaces on every record: `_plugin_source` and `_plugin_digest`, and `_policy_source` and `_policy_digest` naming where the plugin and its policy bundle came from. When the agent runs a configuration overlay from the API, it also sets the `agent-config-revision` prop (namespace `https://compliance-framework.github.io/ns`) with the applied revision number.

### The API signs the record

The API signs every record whose submission is identified: the caller presented a valid user token or an agent token. It has a signing key whenever it runs: the pair from `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY`, or, when either is unset, a fresh pair it generates at each start. It stores the record and its signature in one transaction, signing the record as persisted, so API-applied defaults (such as a default expiry) are inside the signature. The one case that leaves a record **Unsigned**:

- The submission carried no token. The evidence create endpoint accepts anonymous callers unless `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS` is on, so an agent running without `api.auth` produces **Unsigned** records.

A batch submitted to `POST /api/evidence/batches` always carries a token. The API stores and signs its items in the background, dating each signature with the moment the batch was accepted, while the submitter's token was valid.

The signature envelope stores the version (`v1`), the algorithm (`RS256`), `signed_at`, the content hash, the signer, the submitter's token claims, and the signature itself as a JSON Web Signature (JWS). The signer records who submitted the record:

- An agent submission: type `agent`, the agent's name and UUID, and the ID of the service account key the agent signed in with. The claims carry the key's client ID as the subject, and `agent` as the token kind and `service_account` as the auth method.
- A user submission, such as evidence created in the UI: type `user`, the user's email as the subject, and the user's given and family name.

### What the signature covers

The API hashes the canonical form of the record: a JSON object holding exactly these fields, with list fields sorted by their serialized JSON and timestamps formatted as UTC RFC 3339, so the same record always hashes the same way.

| Field | What's covered |
|---|---|
| `uuid` | The evidence stream UUID. |
| `title`, `description`, `remarks` | The record's text. |
| `start`, `end`, `expires` | Collection and expiry times. |
| `props`, `links` | Properties and links, sorted. |
| `origins` | Who and what generated the evidence, actors sorted. |
| `activities` | The recorded activities, steps sorted. |
| `inventory_items` | The inventory items, without their implemented-component links. |
| `components` | The observed components, protocols and port ranges sorted. |
| `subjects` | The assessment subjects, include and exclude lists sorted. |
| `subject_references` | The subjects as OSCAL subject references; left out when empty, so records signed before they existed still verify. |
| `status` | The status `state`, `reason` and `remarks`. |
| `back_matter` | Attached resources, props, document IDs and hashes sorted. |
| `labels` | The label name and value pairs, sorted. |

The signature leaves out the record's database ID, the stored signature itself, the implemented-component links on inventory items (they are shared between records and later submissions add to them, so signing them would invalidate earlier signatures), and any status fields beyond `state`, `reason` and `remarks`.

The hash of that canonical object is SHA-256, hex encoded, and stored in the envelope as `content_hash`. The JWS is an RS256 JSON Web Token over the envelope fields, with the token kind `evidence_signature`.

### The signing key

One RSA key pair signs evidence and issues login tokens: the private key at `CCF_JWT_PRIVATE_KEY` signs, the public key at `CCF_JWT_PUBLIC_KEY` verifies. When both settings name paths, the API creates the files at startup if they don't exist and loads them; when either is unset, it generates a new 2048-bit pair in memory at each start. The API publishes its current public key at `GET /api/auth/publickey` (a JSON Web Key) and `GET /api/auth/publickey.pub` (PEM), so you can verify the **JWS** yourself.

Because verification always uses the key pair loaded now:

- If the pair isn't persistent, every restart creates a new one, and no signature made before the restart verifies anymore.
- After a rotation, signatures made with the old private key fail **Signature Valid**. The API never re-signs a record, so earlier records keep their old signatures; the envelope's `signed_at` tells you which key pair should have made them.

### The verification checks

`POST /api/evidence/{id}/verify` recomputes the hash of the stored record and checks it and the stored signature, then reports four checks. The UI's **Signature** tab shows them under **Verification**; each is **Pass** or **Fail**.

| Check (UI label) | What the API compares |
|---|---|
| **Hash Match** | The hash recomputed from the stored record with the content hash in the stored envelope. |
| **Signature Valid** | The stored JWS against the API's current public key (accepting RS256 only), and the JWS payload against every envelope field. |
| **Temporal Valid** | `signed_at` against the submitting token's `issued_at`, `not_before` and expiration. |
| **Signed Content Matches** | The hash recomputed from the stored record with the hash inside the signed JWS payload. |

**Valid** means all four passed; any failed check makes the result **Invalid**.

### The endpoints behind the tab

The UI calls two endpoints, and both need a logged-in user, not an agent token:

| Endpoint | What it returns | The caller needs |
|---|---|---|
| `GET /api/evidence/{id}/signature` | The stored envelope and the record's status, `signed` or `unsigned`. | A user token and `evidence:read`. |
| `POST /api/evidence/{id}/verify` | The four checks, the overall result, errors and signer. | A user token and `evidence:read`. |

`viewer`, `auditor`, `contributor` and `admin` hold `evidence:read`. Agent tokens can't call either endpoint. Evidence reads themselves can be anonymous, but the signature endpoints never are. See [Authentication and permissions](./authentication-and-permissions.md) for the roles.

## Before you start

- The versions this guide documents: API v0.22.5, UI v2.15.2, CCF Agent v0.9.6.
- To set up the agent: a registered agent with a service account key, created in the UI under **Integrations** > **Agents**; registering agents and managing keys needs `admin:manage`.
- To read signatures in the UI: `evidence:read`, held by the `viewer`, `auditor`, `contributor` and `admin` roles.
- To compare a signer against a key in the **Service Account Keys** tab: `admin:manage`.
- The GIF here is from a temporary environment with fictional data, at UI v2.15.2 and API v0.22.5.

## Enable it

To have your agents' evidence always signed, set both sides.

1. Give every agent a service account key and put it in the agent's configuration. Prefer the environment over the file:

   ```sh
   export CCF_API_AUTH_CLIENT_ID=123e4567-e89b-12d3-a456-426614174000
   export CCF_API_AUTH_CLIENT_SECRET='<the key client secret>'
   ```

   Both must be set, or neither; `client_id` is the key's UUID. See [the agent configuration reference](/agent/configuration).

2. Give the API a persistent key pair by pointing both settings at files, or the API gets a new pair at each start and no earlier signature verifies:

   ```sh
   export CCF_JWT_PRIVATE_KEY=/etc/ccf/jwt/private.pem
   export CCF_JWT_PUBLIC_KEY=/etc/ccf/jwt/public.pem
   ```

   See [the API configuration reference](./configuration.md).

3. Optionally, make unsigned submissions impossible instead of merely visible: with `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true`, the evidence, heartbeat and playback endpoints reject callers that present no token.

Then check the result: open a record the agent just submitted and read the badge, as **Use it** describes. If it says **Unsigned**, see [Troubleshooting](#troubleshooting).

## Use it

To verify a record and check who signed it:

1. Open the record on an **Evidence** page. Its summary carries the badge: **Signed**, **Unsigned**, **Loading...** while the status is fetched, or **Unavailable** when the API call failed.
2. Open **Signature** and select **Verify**. The **Verification** card shows the overall badge **Valid** or **Invalid**, the verification status, the four checks as **Pass** or **Fail**, the **Verified Content Hash**, and the API's explanations of any failed check under **Verification Errors**.
3. Read **Signature Details**: the **Envelope** card (**Version**, **Algorithm**, **Signed At**, **Content Hash**), the **Signer** card (**Type**, **Name**, **Email**, **ID**, **Credential ID**), the **Claims** card and the raw **JWS**.
4. To match an agent's evidence to its credentials, compare the **Signer** card's **Name** with the list under **Integrations** > **Agents**, and the **Subject** claim (the key's client ID) with the **Client ID** column of that agent's **Service Account Keys** tab. The tab shows **Name**, **Client ID**, **Status**, **Last Used**, **Expires** and **Created** for each key; **Credential ID** is that key's ID. For a user-submitted record, **Email** names the user.

![Open the Signature tab, select Verify, and read the checks, the envelope and the signer.](/img/ui/2.15/verify-evidence.gif)

Verification checks integrity only: whether the stored record still matches what the API signed. Whether the system is compliant still comes from the check that produced the record.

## Troubleshooting

### The agent's token exchange fails

The agent reports the status code of the failed `POST /api/auth/agent/token` call. What each one means:

| Status | Body | Cause |
|---|---|---|
| `401` | `missing client credentials` | The request carried no client ID and secret. |
| `401` | `invalid client credentials` | No key has that client ID; the client secret is wrong; the key belongs to no agent; or the agent was deleted. |
| `403` | `agent key is revoked` | The key was revoked with **Revoke** in the **Service Account Keys** tab. Create a new key and update the agent's `api.auth`. |
| `403` | `agent key is expired` | The key's **Expires** has passed. Create a new key. |
| `403` | `agent is inactive` | The agent was deactivated. Activate it under **Integrations** > **Agents**. |
| `500` | – | The API couldn't read the agent, the key or the auth event; check the API log and the database. |

A record submission can also fail later, when the token ages badly or an administrator disables the agent: `401` (invalid or expired token, unknown key) or `403` (agent inactive, key revoked or expired). On `401` the agent exchanges a fresh token and retries the submission once, so an API that restarted with a new key pair heals itself without an agent restart.

### A record shows Unsigned

The record was stored without a signature, and it never gains one later: the submitter presented no token. The agent runs without `api.auth`, or `submit-evidence` ran without `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`. Set both, and see [Enable it](#enable-it). A running API always has a signing key (the files, or an in-memory pair generated at start), so an **Unsigned** record always means an anonymous submission.

To refuse such submissions instead of storing them **Unsigned**, set `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true`.

### A check fails

| Symptom | What it means and what to do |
|---|---|
| **Hash Match** passes; **Signature Valid** fails, and with it **Signed Content Matches** and **Temporal Valid**. | The stored JWS doesn't verify against the API's current public key: the signature was made with a key pair the API no longer loads, after a restart without persistent keys or a rotation. See [The signing key](#the-signing-key). |
| **Hash Match** and **Signed Content Matches** fail while **Signature Valid** passes. | The stored record no longer matches what was signed, while the signature is genuine. The row changed after it was signed; investigate who touched the data. |
| Only **Temporal Valid** fails. | `signed_at` lies outside the submitting token's validity window, which points at a tampered envelope or a large clock jump when it was signed. Treat the record as untrusted. |
| The badge is **Unavailable**. | The UI's `GET /api/evidence/{id}/signature` call failed; the session may have expired. Sign in again and reopen the tab. |

## Related

- [Evidence](/ui/features/evidence) in the UI guide.
- [Authentication and permissions](./authentication-and-permissions.md)
- [Configuration reference](./configuration.md)
- [Agent overview](/agent)
