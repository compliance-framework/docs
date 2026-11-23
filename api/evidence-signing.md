---
title: Evidence signing
description: How the API signs the evidence it stores, what each signature covers, how to verify a record in the UI's Signature tab, and what breaks earlier signatures.
sidebar_position: 6
---

# Evidence signing

Evidence records the API accepts from an identified caller are cryptographically signed when they're stored, so you can later prove the record hasn't changed since and see who submitted it. In the UI, each record shows a **Signed** or **Unsigned** badge, and its **Signature** tab lets you re-verify it. This page is for **operators** who run the agent and the API and want every record signed, and for **compliance and GRC users** who need to tell what a failed verification check means.

The details here are read from the agent at [v0.9.6](https://github.com/compliance-framework/agent/releases/tag/v0.9.6), the API at [v0.22.5](https://github.com/compliance-framework/api/releases/tag/v0.22.5) and the UI at [v2.15.2](https://github.com/compliance-framework/ui/releases/tag/v2.15.2).

## How it works

Whether a record is signed depends on all three components.

1. The agent authenticates to the API. When `api.auth.client_id` and `api.auth.client_secret` are set, it sends them as HTTP basic auth to `POST /api/auth/agent/token` and gets a bearer token that lasts 24 hours. It caches the token, requests a new one a minute before it expires, and on a `401` response it fetches a fresh token and retries the call once.
2. It sends each evidence record to `POST /api/evidence`, one record per request, with the labels and props it adds itself: `_agent` (the key's client ID when the agent authenticates, so records carry the credential that sent them; the Kubernetes pod name or a hash of the configuration when it doesn't), `_plugin`, the `labels` you configure for the plugin, and the agent-owned props `_plugin_source`, `_plugin_digest`, `_policy_source` and `_policy_digest`, which record where the plugin and the policy bundle came from. Evidence about the agent's own runs also carries `tool=ccf` and `type=operations`, and when a remote configuration overlay is applied, an `agent-config-revision` prop naming the revision.
3. The API signs the record inside the transaction that stores it, when the request carried a user or an agent token. Signing computes a SHA-256 hash of the record's content, wraps it in a signature envelope together with the signer's identity and a snapshot of the submitter's token claims, and signs the envelope as an RS256 JSON Web Signature with the API's RSA private key. The envelope is stored with the record.

A request with no token — an agent running without `api.auth`, or any anonymous submitter while public agent endpoints are allowed — is stored **Unsigned**. There is no setting that turns signing off otherwise: every authenticated submission is signed.

Two other paths sign too:

- **Evidence batches** (`POST /api/evidence/batches`) always need a user or agent token. The items are stored and signed in the background, as the submitter, dated with the moment the API accepted the batch.
- **Workflow steps** create their completion evidence signed as the user who completed the step.

### Which key signs

Evidence is signed with the same RSA key pair that signs the API's tokens: the private key at `CCF_JWT_PRIVATE_KEY` signs, and the public key at `CCF_JWT_PUBLIC_KEY` verifies. When both are set, `api run` creates the key files if they don't exist and loads them, so the pair is persistent. When either is unset, the API generates a new pair in memory at each start: every signature stored by an earlier run then fails verification, because the current public key can't validate the old JWS. The same is true when you rotate the key files deliberately: earlier signatures stop verifying, and only evidence signed after the rotation verifies. Keep the key pair, don't replace it, unless you accept that older records become unverifiable.

### What the signature covers

The content hash covers the evidence's OSCAL content, field by field, as the API computes it at storage time:

| Covered | What it holds |
|---|---|
| `uuid` | The evidence stream identifier. |
| `title`, `description`, `remarks` | The record's own text. |
| `start`, `end`, `expires` | Collection window and expiry, in UTC. |
| `status` | The result: `state`, `reason` and `remarks`. |
| `labels` | Every label, such as `_agent`, `_plugin` and `environment`. |
| `props`, `links` | The record's properties and links. |
| `origins`, `activities` | Who and what produced the record, and the steps taken. |
| `inventory_items`, `components`, `subjects`, `subject_references` | What the record is about. |
| `back_matter` | The record's resources, including artifact hashes. |

Within each repeated field, API-signed items are sorted before hashing, so an equivalent record always hashes the same. The signature leaves out the record's database row ID and its stored timestamps, the signature itself, and an inventory item's links to implemented components: those links hang off rows shared across evidence records and grow with later submissions, so signing them would invalidate earlier signatures. A field added to the record after storage, such as a risk linked to its stream, is therefore not covered either.

The stored envelope records the signature `version` (`v1`), the `signature_algorithm` (`RS256`), the time it was signed, the content hash, the signer and the token claims. For an agent, the signer records the type (`agent`), the agent's ID and name, and the **Credential ID** of the service account key that authenticated; for a user, the type (`user`), email and name.

## Before you start

- The versions above. Check pages for other versions may describe behavior that differs.
- A migrated PostgreSQL database, as in the [API overview](./index.md).
- A persistent JWT key pair: set `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` to paths you keep across restarts. See the [configuration reference](./configuration.md).
- A registered agent with a service account key: **Admin** > **Agents** > **Register Agent**, then **Create Service Account Key** on the agent's **Service Account Keys** tab. The UI shows the key's **Client ID** and its **Client Secret** once, when you create the key.
- To open the **Signature** tab or call its endpoints: a signed-in user who can `evidence:read`. With the default `builtin` driver that's every signed-in user; with `cedar`, the `viewer`, `auditor`, `contributor` or `admin` role. Agent tokens are not accepted on the signature endpoints. See [Authentication and permissions](./authentication-and-permissions.md).
- To map a signature's **Credential ID** to a key (below): `admin:manage`, which the `admin` role has.
- The recording below is the UI's verify flow, taken in a temporary environment with fictional data at UI v2.15.2 and API v0.22.5.

## Enable it

To make your agents' evidence always signed, set both ends:

1. Make the API's keys persistent, so signatures survive restarts:

   ```sh
   CCF_JWT_PRIVATE_KEY=/etc/ccf/jwt/private.pem
   CCF_JWT_PUBLIC_KEY=/etc/ccf/jwt/public.pem
   ```

   `api run` writes both files if they don't exist yet; `api bootstrap` does the same without starting the server, and its `--force` flag regenerates them.

2. Give the agent its credentials. On the agent's **Service Account Keys** tab (**Admin** > **Agents**), create a key and put its client ID and secret in the agent's environment:

   ```sh
   export CCF_API_AUTH_CLIENT_ID=123e4567-e89b-12d3-a456-426614174000
   export CCF_API_AUTH_CLIENT_SECRET='<the key client secret>'
   ```

   Both must be set, or neither: an agent without them sends its evidence unauthenticated. See [Agent configuration](/agent/configuration).

3. Optionally, refuse unsigned submissions outright:

   ```sh
   CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true
   ```

   The evidence, heartbeat and playback endpoints then require a token, so an agent that lost its credentials fails loudly instead of storing **Unsigned** records.

## Use it

Open an evidence record to see its signature badge next to the title: **Signed**, or **Unsigned** (with the tooltip "Evidence is unsigned"). While the page works out the status the badge reads **Loading...**, and **Unavailable** when the UI can't load the stored signature.

Open the **Signature** tab to verify the record and read the envelope.

![Verify an evidence signature and inspect the verification checks and stored signature details.](/img/ui/2.15/verify-evidence.gif)

### Verify a record

In the **Verification** card select **Verify**. The button becomes **Re-verify** after a run. The result shows a badge, **Valid** or **Invalid**, and the stored status, `signed` or `unsigned`. **Valid** means all four checks passed. Each check is shown with **Pass** or **Fail**:

| Check | What it tests | Why it fails |
|---|---|---|
| **Hash Match** | The content hash stored in the envelope equals the hash recomputed from the record as stored now. | The stored record no longer matches what was signed. |
| **Signature Valid** | The envelope's JWS verifies with the API's current public key, and its signed payload equals the stored envelope. | The JWS was made with a different key pair (a restart without persistent keys, or a rotation), or the envelope was altered. |
| **Signed Content Matches** | The hash inside the signed JWS equals the hash recomputed from the record as stored now. | The stored record no longer matches what was signed. |
| **Temporal Valid** | The envelope's signing time falls inside the submitting token's validity window (its `issued_at` and `not_before` are not after it, and `expires_at` is not before it). | The signing time is outside the token window, which points at clock skew between the API and the token's issue time. |

**Verified Content Hash** shows the algorithm (`SHA-256`) and the stored hash. Any **Verification Errors** are listed under the checks. Verification checks integrity only: an evidence record's compliance status still comes from the check that produced it, not from this one.

### Read the stored signature

The **Signature Details** card shows the stored envelope:

- **Envelope**: **Version**, **Algorithm**, **Signed At** and **Content Hash**.
- **Signer**: **Type** (`user` or `agent`), **Name**, **Email**, **ID** and **Credential ID**.
- **Claims**: the submitter's token claims at signing time, including **Agent ID**, **Credential ID** and **Auth Method** (`service_account` for agent keys).
- **JWS**: the signed token itself, which anyone holding the API's public key (`GET /api/auth/publickey.pub`) can check offline.

For agent evidence, match the signer to **Admin** > **Agents**:

- **Signer** > **Name** is the agent's **Name** in the **Admin** > **Agents** table, and **Signer** > **ID** is that agent's UUID, as `GET /api/admin/agents` returns it in `id` (needs `agent:read`).
- **Signer** > **Credential ID** is the UUID of the service account key that authenticated. The keys table shows each key's **Client ID**, which is a different UUID, so list the keys with the admin endpoint and match `id` to the **Client ID** you see:

  ```sh
  curl -H "Authorization: Bearer $TOKEN" \
    https://ccf-api.example.com/api/admin/agents/<agent-id>/keys
  ```

  Each item carries `id` (the **Credential ID** in the signature) and `client-id` (the **Client ID** in the UI). The key's **Last Used** time should sit near **Signed At** for records sent with that key.
- For an agent that authenticates, the record's `_agent` label equals the key's **Client ID**, so you can often identify the key without any API call.

### The endpoints behind the tab

| Endpoint | What it returns |
|---|---|
| `GET /api/evidence/{id}/signature` | The stored envelope, or the status `unsigned` when there is none. |
| `POST /api/evidence/{id}/verify` | The recomputed checks and errors, as the **Verification** card shows them. |

Both need a user token (the `ccf_auth_token` cookie or an `Authorization: Bearer` header; an agent token gets `401`) and `evidence:read`, so the call gets `403` when the user's role lacks it. A `400` means the record ID isn't a UUID, `404` that no record has it. A failed verification is not an error: the call returns `200` with `is_valid` `false` and the failed checks.

## Troubleshooting

### The agent's token exchange fails

The agent logs `agent auth failed with status code: <code>` when `POST /api/auth/agent/token` doesn't answer `200`. The API records each failed exchange with a reason. The status codes and their causes:

| Status | Body or cause | What to do |
|---|---|---|
| `401` | `missing client credentials` | The request carried neither basic auth nor `client_id` and `client_secret` form fields. Set both `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`. |
| `401` | `invalid client credentials` | Unknown client ID (deleted key or agent), or a wrong client secret. Issue a new key under **Admin** > **Agents** and update the agent. |
| `403` | `agent key is revoked` | The key was revoked. Create a new key. |
| `403` | `agent key is expired` | The key passed its **Expires** time. Create a new key, or give the next one a later expiry. |
| `403` | `agent is inactive` | The agent's **Status** is **Inactive** in **Admin** > **Agents**. Activate it. |
| `500` | API-side database failure | Check the API's health and database. |

Evidence the agent sent while its credentials were still valid keeps its signature; a failed token exchange only stops new submissions.

### A record shows Unsigned

A record is **Unsigned** when it was submitted without a token: the agent ran with no `api.auth` credentials, another tool posted to `POST /api/evidence` directly and anonymously, or the record predates the agent's registration. A record stored unsigned stays unsigned: the signature is computed only as the record is created, so re-submit the evidence (the same labels update the same stream) after fixing the credentials. Setting `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true` makes anonymous submissions fail with `401` instead of storing **Unsigned** records.

If the badge reads **Unavailable**, the signed-in user can't load the stored signature: sign in, and check the user has `evidence:read`.

### A check fails

- **Signature Valid** fails, with the error "stored JWS signature is invalid", on records signed before the API's key pair changed: a restart with `CCF_JWT_PRIVATE_KEY` or `CCF_JWT_PUBLIC_KEY` unset, or deliberate rotation of the key files. There is no way to make those records verify again without the old public key; the JWS in **Signature Details** can still be checked against it offline. Set the key paths and keep the pair.
- **Hash Match** or **Signed Content Matches** fails means the record as stored no longer matches what was signed. The **Verification Errors** list names which comparison failed. Treat such a record as untrustworthy and re-collect the evidence.
- **Temporal Valid** fails means the recorded signing time is outside the submitter token's window. Check the API host's clock. For a batch, the signature is dated with the time the API accepted the batch, not the time the background worker stored it.

## Related

- [Authentication and permissions](./authentication-and-permissions.md)
- [Configuration reference](./configuration.md)
- [Evidence in the UI](/ui/features/evidence)
- [Agent overview](/agent)
