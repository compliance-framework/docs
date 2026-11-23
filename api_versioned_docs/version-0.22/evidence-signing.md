---
title: Evidence signing and verification
description: How the API signs evidence records, what each signature covers, what the UI's Signature tab checks mean, and what breaks earlier signatures.
sidebar_position: 6
---

# Evidence signing and verification

The API signs every evidence record it stores for an authenticated submitter, and the UI's evidence page shows each record as **Signed** or **Unsigned** and verifies the stored signature on demand. This page is for **operators** who want their agents' evidence always signed, and for **compliance and GRC users** who read the verification result.

Whether a record comes out signed depends on all three components: the CCF Agent authenticates and sends the record, the API signs it with its own key at ingest, and the UI shows the result. The releases documented here are API `v0.22.5`, agent `v0.9.6` and UI `v2.15.2`.

## How it works

1. The agent signs in to the API with its service account key and gets an agent token.
2. It sends every evidence record to the API with that token, stamped with its labels and props.
3. When the API stores the record, it builds a canonical form of the content, hashes it with `SHA-256`, wraps the hash, the signer and the token claims in a signature envelope, and signs the envelope as a JSON Web Signature (JWS) with its RSA private key. The envelope is stored on the record, in the same database transaction that saves the record.
4. The UI shows the record as **Signed** or **Unsigned**. The **Signature** tab re-checks a stored record against its envelope on demand.

### The agent's side

With `api.auth.client_id` and `api.auth.client_secret` set (or `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET` in the environment), the agent:

- Requests a token with `POST /api/auth/agent/token`, with the client ID and secret as HTTP basic auth. The API answers `200` with `access_token`, `token_type` `Bearer` and `expires_in` `86400`: the token lasts 24 hours.
- Caches the token and requests a new one when less than a minute of its life is left. A call the API answers `401` is retried once with a fresh token.
- Sends each evidence record to `POST /api/evidence` with the token.

On each plugin's evidence the agent adds:

- The `_agent` label: the client ID when it has one, otherwise `KUBERNETES_POD_NAME`, otherwise `KUBERNETES_POD`, otherwise a hash of the configuration. The agent's own run evidence carries this label plus `tool=ccf` and `type=operations`.
- The `_plugin=<plugin name>` label and the plugin's configured `labels`.
- The props `_plugin_source` and `_plugin_digest`, which record where the plugin came from, and `_policy_source` and `_policy_digest` for the policy bundle the evaluation used, when the agent knows them. When a remote configuration overlay is applied, `agent-config-revision` (namespace `https://compliance-framework.github.io/ns`) names its revision. These props are the agent's: values a plugin sets for them are replaced.

Without `api.auth`, the agent sends evidence with no token. The API still stores it (see [Enable it](#enable-it)), but with no signer the record is stored **Unsigned**.

### When the API signs, and with which key

The API signs a record when the request that created it authenticated, as a user or as an agent, and left a signer to record. That covers:

- `POST /api/evidence` with a user or agent token: the record is signed as its submitter, at once.
- `POST /api/evidence/batches`, which always requires a token: the records are stored by the background worker, signed as their submitter and dated with the moment the API accepted the batch.
- A workflow step's evidence, submitted through an authenticated route: signed as that submitter.

A request with no token has no signer, so its records are stored unsigned. Agent heartbeats, evidence and playback routes take unauthenticated calls unless you set `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true`; that is how an agent's evidence ends up **Unsigned**.

The signing key is the API's JWT RSA private key, `CCF_JWT_PRIVATE_KEY`; verification uses the matching public key, `CCF_JWT_PUBLIC_KEY`. It is the same key pair that signs user and agent tokens, not the agents' service account keys: an agent's key proves who submitted the record, and the API's key vouches for the stored record. See [Authentication and permissions](./authentication-and-permissions.md).

The envelope stored on the record holds the signature version (`v1`), the algorithm (`RS256`), the signing time, the content hash (algorithm `SHA-256`, hex value), the signer, the token claims and the JWS. The JWS is signed over the version, algorithm, signing time, content hash, signer and claims; the stored envelope must match it field for field.

For an agent's record the signer records the agent: type `agent`, the agent's UUID, the agent's name and the service account key's UUID as `credential_id`. The claims add the token subject (the key's client ID), the issuer (`compliance-framework`), the token's issue, expiry and not-before times, the agent UUID, the key UUID and the authentication method (`service_account`). A user's record records type `user`, the email and the name from the user's claims.

When the key pair isn't persistent or is replaced:

- Without `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` set, the API generates a new pair at every start. Every record signed before the restart then fails verification, and all tokens stop working.
- Rotating the pair has the same effect on records signed with the old key: their stored JWS no longer verifies against the new public key, and the **Signature Valid** check fails with `stored JWS signature is invalid`. The envelopes themselves are kept, so the signer and claims stay readable. `api bootstrap` creates the key files at the configured paths so you can set them before the first start.

### What the signature covers

The API hashes a canonical form of the record: empty fields are left out, and list order doesn't matter because the lists are sorted before hashing. The signature covers, field by field:

| Covered | Notes |
|---|---|
| `uuid` | The evidence stream identifier. |
| `title`, `description`, `remarks` | The record's text. |
| `start`, `end`, `expires` | Times as RFC 3339 in UTC. |
| `props` | Name, namespace and value. |
| `links` | Text, URL and other link fields. |
| `origins` | Including each origin's actors. |
| `activities` | Including the activity's steps. |
| `inventory-items` | Description, props, links and remarks. |
| `components` | Including protocols and port ranges. |
| `subjects`, `subject-references` | Including the include and exclude lists. |
| `status` | Only `state`, `reason` and `remarks`. |
| `back-matter` | Resources with their props, document IDs, links and hashes. |
| `labels` | Name and value. |

Left out, on purpose:

- The record's own database id.
- The signature envelope itself.
- The links from an inventory item to implemented components. They are shared between records and later submissions add to them, so signing them would invalidate earlier signatures.
- Any `status` field beyond `state`, `reason` and `remarks`.

### The verification checks

`POST /api/evidence/{id}/verify` recomputes the current record's content hash and checks it against the stored envelope. Four checks must all pass for the result to be valid:

| Check (API field) | What it means |
|---|---|
| `hash_match` | The hash recomputed from the current record equals the hash stored in the envelope. |
| `signature_valid` | The stored JWS verifies against the API's public key (RS256, `token_kind` `evidence_signature`), and the signed payload matches the stored envelope. |
| `signed_content_matches` | The hash inside the signed payload equals the hash recomputed from the current record. |
| `temporal_valid` | The signing time is not before the token's issue or not-before time, and not after its expiry. |

## Before you start

- API `v0.22.5` or later, UI `v2.15.2` or later, and an agent from the `v0.9` line.
- `evidence:read` for the two endpoints behind the **Signature** tab. Both also require a signed-in user; agent tokens don't work there.
- `agent:read` to open the Agents page, and `admin:manage` to see an agent's service account keys.
- Persistent API keys: set `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` (see the [configuration reference](./configuration.md)).

## Enable it

Signing itself needs no setting: the API signs every record an authenticated submitter creates, with the key pair it starts with. What you set decides whether your agents' evidence is always signed.

1. On the API, point `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` at PEM files, so the key survives restarts. `api bootstrap` creates the files at those paths when they don't exist yet:

   ```sh
   CCF_JWT_PRIVATE_KEY=/etc/ccf/jwt/private.pem
   CCF_JWT_PUBLIC_KEY=/etc/ccf/jwt/public.pem
   ```

2. On the API, turn off anonymous ingest so no evidence can be stored without a signer:

   ```sh
   CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true
   ```

   Then a submit request with no token is rejected instead of stored unsigned.

3. On each agent, give it a service account key and set it in the configuration:

   ```yaml
   api:
     url: https://ccf-api.example.com
     auth:
       client_id: 123e4567-e89b-12d3-a456-426614174000
       client_secret: <the key's client secret>
   ```

   Create the agent and its key first, under **Global** > **Integrations** > **Agents**: select **Register Agent** and give it a name, open it, select **Create Service Account Key**, then copy the **Client ID** and the **Client Secret** before you close the dialog. See [Agents](/ui/features/administration#agents).

New records now show **Signed**. Evidence stored before the agent had credentials stays **Unsigned**; send it again to get a signed record.

## Use it

### Read the badge and the Signature tab

An evidence record's header shows its result badge and, next to it, **Signed** (a lock) or **Unsigned** (an unlock). Open **Signature** to inspect and verify:

- **Verification** runs a fresh check against the current record and the stored payload. Select **Verify**; after a run the button reads **Re-verify**. The result shows **Valid** or **Invalid**, the **Verification status** (`signed` or `unsigned`), and one tile per check: **Hash Match**, **Signature Valid**, **Temporal Valid** and **Signed Content Matches**, each **Pass** or **Fail**. Below them, **Verified Content Hash** shows the algorithm and value, and **Verification Errors** lists what the API reported for each failed check.
- **Signature Details** shows the stored envelope: **Envelope** (**Version**, **Algorithm**, **Signed At**, **Content Hash**), **Signer** (**Type**, **Name**, **Email**, **ID**, **Credential ID**), **Claims** (**Subject**, **Issuer**, **Token Kind**, **Issued At**, **Expires At**, **Not Before**, **Given Name**, **Family Name**, **Agent ID**, **Credential ID**, **Auth Method**) and the **JWS** itself.

![Verify an evidence signature and inspect the verification checks and stored signature details.](/img/ui/2.15/verify-evidence.gif)

### The endpoints behind the tab

The tab is built on two routes. Both need a signed-in user (the UI's session cookie or a user token) with `evidence:read`:

| Endpoint | What it returns |
|---|---|
| `GET /api/evidence/{id}/signature` | The stored envelope and the record's signature status: `signed` or `unsigned`. |
| `POST /api/evidence/{id}/verify` | The four checks, the overall validity, the content hash, the signer, the claims and the errors. |

Verification checks integrity, not correctness: a passed check says the record still holds the content that was stored at signing, signed by the API that accepted it. Whether the check itself was right is the result of the policy evaluation.

### Match the signer to a registered agent

For an agent's record:

- **Signer** > **Name** is the agent's name: the **Name** column on the Agents page under **Global** > **Integrations** > **Agents**.
- **Signer** > **ID** and **Claims** > **Agent ID** are the agent's UUID.
- **Claims** > **Subject** is the service account key's client ID. Open the agent, select the **Service Account Keys** tab and match it against the **Client ID** column: that row is the key the agent signed in with.
- **Signer** > **Credential ID** is that key's own UUID. It isn't shown in the UI table; `GET /api/admin/agents/{id}/keys` (which needs `admin:manage`) returns it as `id`. **Claims** > **Credential ID** holds the same value.

The `_agent` label on the record equals the key's client ID when the agent runs with `api.auth`, so you can also find a signer's records by searching `_agent=<client ID>`.

## Troubleshooting

- **`401 Unauthorized` from `POST /api/auth/agent/token`:** the client ID or secret is wrong. The causes the API answers `401` for: no credentials in the request (no basic auth header and no `client_id`/`client_secret` form fields), a client ID that matches no service account key, a key not attached to an agent, an agent record that no longer exists, or a client secret that doesn't match the key. Check the key's **Client ID** against `api.auth.client_id`, then re-create the key if the secret is lost.
- **`403 Forbidden` from the token exchange:** the key or agent is unusable. The API answers `403` with `agent key is revoked` (the key was revoked on the **Service Account Keys** tab), `agent key is expired` (past its **Expires** time) or `agent is inactive` (the agent's **Status** is **Inactive**). Issue a new key, or set the agent active again.
- **`500 Internal Server Error` from the token exchange:** the API failed one of its database writes (the key's `last_used_at`, the agent's `last_authenticated_at` or the auth event) or the token generation. Check the API's log and database, and retry.
- **A record shows Unsigned:** its submitter had no token. Set `api.auth` on the agent and send the evidence again, and set `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS=true` on the API so anonymous submissions are rejected rather than stored. With strict mode on, an agent without working credentials gets `401` from `POST /api/evidence` instead of quietly storing unsigned evidence.
- **Hash Match fails** (with `current evidence content does not match the stored signature envelope hash`): the stored record no longer matches what was signed. Records aren't edited in place, so treat this as tampering or a database restore from a different backup, and compare **Verified Content Hash** with the envelope's **Content Hash** under **Signature Details**.
- **`stored JWS signature is invalid`, with Hash Match the only check that passes:** the stored JWS no longer verifies against the API's current public key. The API generated a fresh key pair at some start because `CCF_JWT_PRIVATE_KEY` and `CCF_JWT_PUBLIC_KEY` weren't both set, or the pair was rotated since the record was signed. Set the two paths to persistent files and keep the pair through upgrades; records signed under a lost pair can't be made to pass again, though their signer and claims stay readable.
- **Signature Valid fails while the JWS parses** (with `stored signature envelope does not match the signed payload`): the stored envelope no longer matches what the API signed, so the envelope itself was altered.
- **Temporal Valid fails** (with `signed_at is before the token issued_at time`, `signed_at is before the token not_before time` or `signed_at is after the token expiration time`): the signing time falls outside the token's issue-to-expiry window. Check the clocks on the API host: `signed_at` is written from the API's clock, and the claims come from the token the agent used.
- **A check fails and the overall result is Invalid:** read **Verification Errors** for the cause per failed check; the overall badge is **Valid** only when all four checks **Pass**.

## Related

- [Authentication and permissions](./authentication-and-permissions.md): how agents and users get tokens, and which roles grant what.
- [Configuration reference](./configuration.md): `CCF_JWT_PRIVATE_KEY`, `CCF_JWT_PUBLIC_KEY` and `CCF_STRICT_DISABLE_PUBLIC_AGENT_ENDPOINTS`.
- [Evidence in the UI](/ui/features/evidence): the evidence pages and the **Signature** tab.
- [Agents](/ui/features/administration#agents): registering agents and creating service account keys.
- [Agent overview](/agent): running the agent and setting its credentials.
