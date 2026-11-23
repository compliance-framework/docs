---
title: Evidence signing
description: How the API signs the evidence records it stores, what each signature covers, and what each check on the UI's Signature tab means.
sidebar_position: 6
---

# Evidence signing

The Continuous Compliance Framework (CCF) API signs every evidence record it stores from an identified caller: it hashes the record's content, seals that hash in a JSON Web Signature made with its own RSA private key, and stores the seal beside the record. A record that arrives without a token is stored **Unsigned**. The UI shows the result as a badge on the evidence record and a **Signature** tab with a **Verify** button. This page is for **operators** who want their CCF Agents' evidence to be signed, and for **compliance and GRC users** who read what a signature says and what a failed check means.

## How it works

### When the API signs

When `POST /api/evidence` stores a record, the API signs it in the same transaction that stores it. Whether a record is signed depends only on who the API saw as the submitter:

| The record arrives with | Result |
|---|---|
| A user token (`POST /api/auth/login`, the OAuth2 password flow, or single sign-on). | **Signed**, signer type `user`. |
| An agent token (`POST /api/auth/agent/token`). | **Signed**, signer type `agent`. |
| No token: an anonymous request to the public agent endpoint. | **Unsigned**: there is no signer to record. |

Evidence batches (`POST /api/evidence/batches`) require a token, so their items are always signed: the API stores and signs them in the background, as their submitter, dated the moment the batch was accepted. An unsigned record has no signature to compare against: the badge reads **Unsigned**, and selecting **Verify** reports `Verification status: unsigned` with **Invalid** and every check **Fail**.

The API has no endpoint that edits a stored evidence record, and it never re-signs one. Verification always compares a record against the content that was signed.

### The signing key

The API signs evidence with the same RSA key pair that signs its tokens: the private key from `CCF_JWT_PRIVATE_KEY`, and verification uses the public key from `CCF_JWT_PUBLIC_KEY`. The seal is a JSON Web Signature (JWS) with the `RS256` algorithm, tagged `token_kind: evidence_signature` so it can never pass as a login token.

Verification only ever uses the public key the API currently holds. There is no key history. Two consequences:

- With `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` unset, the API generates a new key pair at each start. Every signature made before a restart then fails the **Signature Valid** check, because the JWS no longer verifies against the new public key. The record still shows **Signed**: the envelope is stored, it just no longer verifies.
- Rotating the key pair has the same effect on signatures made with the old key. Records signed after the rotation verify normally.

Create the key files once with `api bootstrap` and keep them across restarts so signatures survive.

### What the signature covers

The API hashes the record's canonical JSON: the fields in the table below, with every list sorted by its JSON form before hashing, so the order items were submitted in doesn't change the hash.

| Covered | Notes |
|---|---|
| `uuid`, `title`, `description`, `remarks` | |
| `start`, `end`, `expires` | Formatted in UTC with nanoseconds. |
| `status` | `state`, `reason` and `remarks` only. |
| `props`, `links`, `labels` | Labels as `name` and `value` pairs. The artifact digests the API derives from stored policy artifacts (`_policy_bundle_digest`, `_policy_input_digest`, `_policy_data_digest`) are props, so they're covered. |
| `origins`, `activities` | Activity steps are sorted. |
| `inventory_items` | Each item's implemented-components links are left out: they are shared across records and later submissions add to them, so signing them would invalidate earlier signatures. |
| `components` | Protocols and port ranges are sorted. |
| `subjects`, `subject_references` | Included and excluded subject lists are sorted. |
| `back_matter` | Resources with their props, `document-ids` and `rlinks`, with hashes sorted. |

What the signature leaves out: the database `id` and the record's created and updated timestamps, the signature itself, and the stored policy artifacts (the policy bundle, the collected input and the policy data) themselves. Only their digests, kept as props on the record, are signed.

### How verification works

`POST /api/evidence/{id}/verify` recomputes the hash of the record as stored now and checks the stored seal. It runs four checks, and the result is valid only when all four pass:

| Check | Passes when | API error when it fails |
|---|---|---|
| **Hash Match** | The hash computed from the record as stored now equals the content hash in the stored envelope. | `current evidence content does not match the stored signature envelope hash` |
| **Signature Valid** | The stored JWS verifies with the API's current public key, and the claims inside it match the stored envelope. | `stored JWS signature is invalid: ...` or `stored signature envelope does not match the signed payload` |
| **Signed Content Matches** | The hash inside the signed JWS payload equals the hash of the record as stored now. | `current evidence content does not match the hash contained in the signed payload` |
| **Temporal Valid** | The signature's `signed_at` is not before the signer token's `issued_at` or `not_before`, and not after its `expires_at`. | `signed_at is before the token issued_at time`, `signed_at is before the token not_before time` or `signed_at is after the token expiration time` |

Verification checks integrity. The evidence's compliance status still comes from the check that produced it.

### What the signer fields say

The **Signer** card on the **Signature** tab names who submitted the record, as the API recorded it at ingest:

| Field | Agent evidence | User evidence |
|---|---|---|
| **Type** | `agent` | `user` |
| **Name** | The agent's **Name** under **Admin** > **Agents**. | The signer's given and family name. |
| **Email** | `N/A` | The signer's email. |
| **ID** | The agent's UUID. | `N/A` |
| **Credential ID** | The UUID of the service account key the agent authenticated with. | `N/A` |

The **Claims** card repeats the signer token's fields: **Subject** (the key's client ID for an agent, the email for a user), **Issuer** (`compliance-framework`), **Token Kind** (`agent` or `user`), **Issued At**, **Expires At** and **Not Before** of the 24-hour token, plus **Agent ID**, **Credential ID** and **Auth Method** (`service_account`) for an agent, or **Given Name** and **Family Name** for a user.

### What the CCF Agent sends

The agent side of a signed record, at CCF Agent v0.9.6:

- The agent exchanges its service account key's client ID and secret for an agent token at `POST /api/auth/agent/token`, as HTTP basic auth. The token lasts 24 hours. The agent caches it, asks for a new one within a minute of its expiry, and retries a request once with a fresh token when the API answers `401`.
- It sends each plugin's evidence records to `POST /api/evidence`, one request per record, with that token.
- It adds the label `_agent` (the key's client ID; the pod name from `KUBERNETES_POD_NAME` or `KUBERNETES_POD` when there's no client ID, otherwise a hash of its configuration), `_plugin` (the plugin's name), and the plugin's configured `labels`. The run-evidence records the agent makes about itself also carry `tool=ccf` and `type=operations`.
- It owns four source props and replaces any a plugin sets for them: `_plugin_source` and `_plugin_digest` (where the plugin came from), and `_policy_source` and `_policy_digest` (where the policy bundle the evaluation used came from). When an administrator's configuration overlay is applied, it also adds the prop `agent-config-revision` in the namespace `https://compliance-framework.github.io/ns`.

See the [agent configuration reference](/agent/configuration) for `api.auth` and these labels.

## Before you start

- This page documents API v0.22.5, UI v2.15.2 and CCF Agent v0.9.6. Every setting, endpoint, label and default is read from those releases. The recording uses UI v2.15.2 and API v0.22.5 in a temporary environment with fictional data.
- To call the two signature endpoints you need a user sign-in and permission to read evidence: the API enforces the `read` action on the `evidence` resource (the UI names it `evidence:read`). Under the `builtin` driver every signed-in user has it; under `cedar` the roles `viewer`, `contributor`, `auditor` and `admin` do; under `authzen` your own decision point decides. Agent tokens can't call these endpoints.
- To have evidence signed you need a service account key for the agent under **Admin** > **Agents**, and persistent JWT keys on the API.

## Enable it

Evidence is signed when the submitter is authenticated and the API has its signing key. Set both sides:

1. On the API, point the token-signing settings at persistent key files:

   ```sh
   CCF_JWT_PRIVATE_KEY=/etc/ccf/jwt/private.pem
   CCF_JWT_PUBLIC_KEY=/etc/ccf/jwt/public.pem
   ```

   `api bootstrap` creates the key files at those paths. Then restart the API.

2. In the UI, register the agent under **Admin** > **Agents** and select **Manage Keys**. Select **Create Service Account Key**, and copy the **Client ID** and the **Client Secret** before closing the dialog.

3. On the agent, give it the key, in the configuration file or the environment:

   ```yaml
   api:
     url: https://ccf-api.example.com
     auth:
       client_id: 123e4567-e89b-12d3-a456-426614174000
       client_secret: <the key's client secret>
   ```

   ```sh
   export CCF_API_AUTH_CLIENT_ID=123e4567-e89b-12d3-a456-426614174000
   export CCF_API_AUTH_CLIENT_SECRET='<the key's client secret>'
   ```

4. Optional, and recommended once every submitter has credentials: refuse evidence that arrives without a token, so nothing new can be stored **Unsigned**:

   ```sh
   CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true
   ```

5. Run the agent. Open one of its records and check the **Signature** tab: the badge reads **Signed** and the **Signer** shows the agent's **Name**.

## Use it

### Verify a record

1. Open the evidence record. The summary badge beside the title reads **Signed** or **Unsigned**.
2. Open **Signature**. The **Signature Details** card shows the stored envelope even before you verify.
3. Select **Verify** (the button becomes **Re-verify** afterwards). The **Verification** card answers:
   - the overall badge, **Valid** or **Invalid**;
   - `Verification status: signed`, the record's stored status;
   - the four checks, **Hash Match**, **Signature Valid**, **Temporal Valid** and **Signed Content Matches**, each **Pass** or **Fail**;
   - **Verified Content Hash**, the hash recomputed from the record as stored now;
   - **Verification Errors**, the API's messages for each failed check.

![Verify an evidence signature and inspect the verification checks and stored signature details.](/img/ui/2.15/verify-evidence.gif)

### Read the stored envelope

Under **Verification**, the **Signature Details** card holds what the API stored at ingest:

- **Envelope**: **Version** (`v1`), **Algorithm** (`RS256`), **Signed At**, and **Content Hash** with its algorithm and value.
- **Signer**: the fields of the table in [What the signer fields say](#what-the-signer-fields-say).
- **Claims**: the signer token's fields.
- **JWS**: the signature itself, in text.

### Match the signer to a key under Admin > Agents

For agent evidence:

- The **Signer**'s **Name** is the agent's **Name**: find it in the list under **Admin** > **Agents**, which also shows **Status** (**Active** or **Inactive**), **Active Key Count** and **Last Authenticated**.
- The **Credential ID** is the UUID of the service account key the agent used. The **Service Account Keys** tab lists each key's **Name**, **Client ID**, **Status**, **Last Used** and **Expires**, but not its UUID; to see the key `id` values, call `GET /api/admin/agents/<agent-id>/keys` with a user token.
- The evidence's `_agent` label equals the key's **Client ID**: search `_agent=<client-id>` on the **Evidence** page to see everything that key submitted, and match it to the key's **Last Used** time.

## Troubleshooting

### The agent's token exchange fails

When `POST /api/auth/agent/token` doesn't answer `200`, the agent logs `agent auth failed with status code: <code>`. Each status says what to fix:

| Status | Cause | Fix |
|---|---|---|
| `401` | The request carried no client credentials; the client ID matches no service account key; the secret doesn't match; or the key belongs to no agent. | Check `api.auth` or `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET` against the key's **Client ID**. A lost **Client Secret** can't be recovered: create a new key. |
| `403`, message `agent key is revoked` | The key was revoked (the key's **Status** is **Revoked**). | Create a new key and put it in the agent. |
| `403`, message `agent key is expired` | The key is past its **Expires** time. | Create a new key; key expiry can't be extended. |
| `403`, message `agent is inactive` | The agent's **Status** is **Inactive**. | An administrator edits the agent and activates it. |
| `500` | The API couldn't read its database. | Check the API's log and the database. |

A key whose **Last Used** never advances, or an agent whose **Last Authenticated** stays old, means the exchange has not succeeded recently.

### A record shows Unsigned

The record was stored from a request without a token. Two causes:

- The agent runs without `api.auth` (and without `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`), and the API accepts anonymous evidence. Set the key, or set `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true` so such submissions fail with `401` instead of storing an unsigned record.
- Another submitter (a script, a CI job) posts evidence with `curl` or an SDK without authenticating. Give it a service account key or user credentials.

Records stored while the API had no token-authenticated submitter stay **Unsigned**; signing can't be applied afterwards.

### A check fails

Match the **Verification Errors** message to its cause:

| Check and message | What it means |
|---|---|
| **Signature Valid**, `stored JWS signature is invalid: ...` | The JWS doesn't verify with the API's current public key: the API restarted without persistent `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY`, or the key pair was rotated after the record was signed. Earlier records keep the **Signed** badge but verify **Invalid**. Fix it going forward by keeping one key pair. |
| **Signature Valid**, `stored signature envelope does not match the signed payload` | The stored envelope and the JWS disagree: the stored record was altered outside the API. There is no API endpoint that edits a record. |
| **Hash Match**, `current evidence content does not match the stored signature envelope hash` | The record as stored now doesn't hash to what the envelope recorded. With no edit endpoint, this points at changes made at the database level. |
| **Signed Content Matches**, `current evidence content does not match the hash contained in the signed payload` | Same comparison, through the JWS payload instead of the envelope. |
| **Temporal Valid**, `signed_at is before the token issued_at time` (or `...not_before time`, `...after the token expiration time`) | The signature's time falls outside the signer token's validity window: the API host's clock was wrong when the record was signed. Check the API host's clock. |

### The badge shows Unavailable

The UI couldn't load `GET /api/evidence/{id}/signature` and says **Signature status is unavailable**. Re-sign in if your session expired, and check that the API is reachable.

## Related

- [Authentication and permissions](./authentication-and-permissions.md): tokens, the JWT key settings and the authorization drivers.
- [Configuration reference](./configuration.md): `CCF_JWT_PRIVATE_KEY`, `CCF_JWT_PUBLIC_KEY` and `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS`.
- [Agent architecture](./architecture/agents.md): how agents and the API work together.
- [Evidence in the UI](/ui/features/evidence): searching records and reading their tabs.
- [Agent overview](/agent): installing and running the agent.
