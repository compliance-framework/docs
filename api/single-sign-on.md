---
title: Single sign-on
description: Set up OIDC and OAuth2 sign-in for the API with Google, GitHub or any other provider, and map provider groups to CCF groups.
sidebar_position: 5
---

# Single sign-on

Single sign-on (SSO) lets users sign in to CCF with an identity provider you already run, instead of a CCF password. This page is for **operators** who set it up. The API supports OpenID Connect (OIDC) and OAuth2 providers, and has built-in support for Google and GitHub.

The details on this page come from API v0.22.5.

## How it works

You list your providers in an SSO configuration file, `sso.yaml` by default. Set `CCF_SSO_CONFIG` to use another path. When the file is missing, SSO is off.

When a user picks a provider on the sign-in page, this happens:

1. The UI sends the browser to `GET /api/auth/sso/{provider}`, where `{provider}` is the provider's `name`. The API sets a short-lived `oauth_state` cookie and redirects to the provider.
2. The user signs in at the provider. The provider redirects the browser back to `{callback_url}/{provider}`, which is `GET /api/auth/sso/callback/{provider}`.
3. The API checks the `state`, exchanges the code for a token, and reads the user's profile and groups from the provider.
4. If the provider sets `required_login_groups`, the user must belong to all of them. Otherwise the API sends the browser to `{base_url}/login?error=missing_group`.
5. The API finds the user by their earlier SSO link, or by an existing account with the same email, which it links. If neither exists, it creates the user (just-in-time registration).
6. The API syncs the user's CCF group memberships (see [Map provider groups to CCF groups](#map-provider-groups-to-ccf-groups)), sets the `ccf_auth_token` cookie (24 hours) and redirects to `{base_url}/auth/sso/callback`.

`GET /api/auth/sso/providers` lists the enabled providers for the UI's sign-in page. It needs no token.

A failed sign-in sends the browser to `{base_url}/login?error=<code>`. The codes are `invalid_state`, `no_code`, `token_exchange_failed`, `user_info_failed`, `missing_group`, `user_creation_failed` and `token_generation_failed`. A provider's own error, such as `access_denied`, is passed through as it is.

## Before you start

- Register CCF as an application at your provider. Note its client ID and client secret.
- Set the provider's redirect URL to `{callback_url}/{provider}`, for example `https://ccf.example.com/api/auth/sso/callback/google`. It must match exactly.
- Set `CCF_WEB_BASE_URL` and `CCF_API_ALLOWED_ORIGINS` for your UI. See the [Configuration reference](./configuration.md).

## Enable it

1. Write `sso.yaml`. This example enables Google:

   ```yaml
   enabled: true
   base_url: https://ccf.example.com
   callback_url: https://ccf.example.com/api/auth/sso/callback

   providers:
     google:
       name: google
       display_name: Google
       provider: google
       protocol: oidc
       client_id: <your client ID>
       client_secret: <your client secret>
       issuer_url: https://accounts.google.com
       scopes: [openid, email, profile]
       enabled: true
       required_login_groups:
         - ccf-authorized-users
       required_admin_groups:
         - ccf-admins
       group_mapping:
         "hd:example.com":
           - ccf-authorized-users
         "email:admin@example.com":
           - ccf-admins
   ```

2. Point the API at the file and restart it:

   ```sh
   CCF_SSO_CONFIG=/etc/ccf/sso.yaml
   ```

3. Open the UI's sign-in page. Each enabled provider has a button.

The file holds client secrets, so keep it readable by the API's user only.

### Top-level settings

| Setting | Purpose | Type | Default | Example |
|---|---|---|---|---|
| `base_url` | The address of the UI. The API sends the browser here after sign-in, and with an error code when sign-in fails. | `string` | none | `https://ccf.example.com` |
| `callback_url` | The API's callback address, without the provider name. The API appends `/{name}` to build each provider's redirect URL. | `string` | none | `https://ccf.example.com/api/auth/sso/callback` |
| `enabled` | Turns SSO on. | `bool` | `false` | `true` |
| `providers` | The providers, as a map. The keys are free-form labels. | `map` | none | see above |

### Provider settings

Each entry under `providers` takes these settings.

| Setting | Purpose | Type | Default | Example |
|---|---|---|---|---|
| `auth_url` | The authorization endpoint. Only OAuth2 providers use it. | `string` | none | `https://github.com/login/oauth/authorize` |
| `client_id` | The application's client ID. Required when the provider is enabled. | `string` | *required* | `<your client ID>` |
| `client_secret` | The application's client secret. Required when the provider is enabled. | `string` | *required* | `<your client secret>` |
| `display_name` | The name on the sign-in button. | `string` | none | `Google` |
| `email_url` | The endpoint that lists the user's email addresses. Only OAuth2 providers use it. | `string` | none | `https://api.github.com/user/emails` |
| `enabled` | Turns this provider on. A disabled provider is ignored. | `bool` | `false` | `true` |
| `group_mapping` | Maps the groups the provider reports to CCF group names. See [Map provider groups to CCF groups](#map-provider-groups-to-ccf-groups). | `map` | none | `"hd:example.com": [ccf-authorized-users]` |
| `icon_url` | An icon for the sign-in button. | `string` | none | `https://example.com/icon.svg` |
| `issuer_url` | The OIDC issuer. The API finds the provider's endpoints from its discovery document. Only OIDC providers use it. | `string` | none | `https://accounts.google.com` |
| `name` | The identifier in URLs and in each user's SSO link. Use lowercase letters and no spaces. | `string` | none | `google` |
| `protocol` | `oidc` or `oauth`. | `string` | `oidc` | `oauth` |
| `provider` | `google`, `github` or `generic`. Anything else is treated as `generic`. | `string` | none | `generic` |
| `required_admin_groups` | CCF groups a user must all belong to for admin access with the `builtin` driver. Empty means every SSO user is an admin. | `list` | none | `[ccf-admins]` |
| `required_login_groups` | CCF groups a user must all belong to to sign in. Empty means anyone the provider authenticates can sign in. | `list` | none | `[ccf-authorized-users]` |
| `scopes` | The scopes to request. | `list` | `openid`, `email`, `profile` for OIDC; `user:email` for OAuth2 | `[openid, email, profile, groups]` |
| `token_url` | The token endpoint. Only OAuth2 providers use it. | `string` | none | `https://github.com/login/oauth/access_token` |
| `user_info_url` | The endpoint that returns the user's profile. Only OAuth2 providers use it. | `string` | none | `https://api.github.com/user` |
| `well_known_url` | Where the API fetches the OIDC discovery document from, when it can't reach `issuer_url`, for example from inside a cluster. The API still validates tokens against `issuer_url`. | `string` | none | `http://keycloak.auth.svc/realms/ccf/.well-known/openid-configuration` |

An enabled provider with an empty `client_id` or `client_secret` makes the whole file invalid. The API then logs a warning and starts with SSO off. A provider that fails to initialize, for example because the API can't reach its issuer, is skipped and the others keep working.

## Providers

### Google

Use `provider: google` and `protocol: oidc`, with `issuer_url: https://accounts.google.com`. Besides the profile claims, the API reads the user's Google Workspace groups, when the account allows it. This needs the `https://www.googleapis.com/auth/admin.directory.group.readonly` scope in `scopes`. Without it the groups are skipped, and the sign-in still works.

### GitHub

Use `provider: github` and `protocol: oauth`, with these endpoints:

```yaml
auth_url: https://github.com/login/oauth/authorize
token_url: https://github.com/login/oauth/access_token
user_info_url: https://api.github.com/user
email_url: https://api.github.com/user/emails
scopes: [read:user, user:email, read:org]
```

The `read:org` scope lets the API read the user's organizations and teams.

### Other providers

For any other OIDC provider, such as Keycloak, Okta or Microsoft Entra ID, use `provider: generic` and `protocol: oidc`, with its `issuer_url`. Add the scope that makes the provider send groups, often `groups`.

```yaml
providers:
  corporate:
    name: corporate
    display_name: Corporate SSO
    provider: generic
    protocol: oidc
    client_id: <your client ID>
    client_secret: <your client secret>
    issuer_url: https://sso.example.com/realms/ccf
    scopes: [openid, email, profile, groups]
    enabled: true
    group_mapping:
      "groups:ccf-admins":
        - ccf-admins
```

For a plain OAuth2 provider, use `provider: generic` and `protocol: oauth`, and set `auth_url`, `token_url` and `user_info_url`.

## Map provider groups to CCF groups

Providers report groups as keys of the form `<claim>:<value>`. The API builds them from every string claim, and every list-of-strings claim, in the user's profile. Some examples:

| Key | Where it comes from |
|---|---|
| `groups:ccf-admins` | The `groups` claim of an OIDC provider. |
| `hd:example.com` | A Google account's hosted domain. |
| `email:alice@example.com` | The user's email. |
| `google-group:team@example.com` | A Google Workspace group. |
| `github-organization:acme` | A GitHub organization. |
| `github-team:acme/auditors` | A GitHub team. |

`group_mapping` maps each key to the names of CCF groups. Keys match without regard to case. At startup the API creates the CCF groups it doesn't find, and stores the mappings. It removes mappings you take out of the file. At each sign-in it then:

- adds the user to the CCF groups their keys map to,
- removes the user from SSO-granted groups the provider no longer reports, and
- leaves memberships an admin added by hand alone.

One key maps to one CCF group. If a key lists several names, only the last one applies. To give a group to several kinds of users, list the group under each key.

`required_login_groups` and `required_admin_groups` name the CCF groups from `group_mapping`, not the provider's own group names.

You can also add and remove mappings at run time, without editing `sso.yaml`. This needs an admin. Mappings you add this way aren't removed by the startup sync.

| Action | Request |
|---|---|
| List a group's mappings | `GET /api/admin/groups/{id}/sso-mappings` |
| Add one | `POST /api/admin/groups/{id}/sso-mappings`, with `{"provider": "google", "externalGroup": "hd:example.com"}` |
| Remove one | `DELETE /api/admin/groups/{id}/sso-mappings/{mappingId}` |

`provider` is the provider's `name`. See the **API reference** in the sidebar.

## Admin access

With the `builtin` authorization driver, an SSO user is an admin when they belong to every group in their provider's `required_admin_groups`, or when that list is empty. Leave the list empty only when everyone at the provider should administer CCF. With the `cedar` driver, roles come from the role assignment file instead. See [Authentication and permissions](./authentication-and-permissions.md).

## Troubleshooting

- **The provider reports a redirect URI mismatch:** the redirect URL registered there must be `{callback_url}/{name}`, with the same scheme, host and path.
- **The sign-in page shows `invalid_state`:** the `oauth_state` cookie got lost. Check that the API is served over HTTPS, because the cookie is `Secure` unless `CCF_ENVIRONMENT` is `local` or `development`. Also check that a proxy doesn't strip cookies.
- **`missing_group`:** the user lacks a group in `required_login_groups`. Log the provider's claims, then check that `group_mapping` has a key for each group and that the key's case and value match.
- **A provider has no button:** the file didn't load, `enabled` is `false` for the provider or for the file, or the provider failed to initialize. Check the API's start-up log.
- **SSO is off after an edit:** an enabled provider is missing `client_id` or `client_secret`. The API logs `Failed to load OIDC config, OIDC will be disabled`.
- **Group changes don't show:** groups sync when the user signs in. Ask the user to sign in again.

## Related

- [Authentication and permissions](./authentication-and-permissions.md)
- [Configuration reference](./configuration.md): `CCF_SSO_CONFIG`.
