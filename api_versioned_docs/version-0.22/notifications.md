---
title: Notifications
description: Configure SMTP, Amazon SES and Slack notifications, recipients and delivery diagnostics.
sidebar_position: 4
---

# Notifications

As an operator, you can send Continuous Compliance Framework (CCF) notifications through email or Slack. This guide covers the API at [v0.22.5](https://github.com/compliance-framework/api/releases/tag/v0.22.5).

## How it works

The API supports two delivery channels: `email` and `slack`. Email uses SMTP or Amazon SES. SendGrid and arbitrary webhook channels are not supported at this release.

Provider configuration enables delivery. User subscriptions select the notifications each user receives. System destinations send notifications to shared email addresses or Slack channels. Background workers deliver queued messages through River in PostgreSQL.

## Before you start

- Run the API with a migrated PostgreSQL database and background workers enabled (`CCF_WORKER_ENABLED=true`, the default).
- Have access to the API deployment's configuration files and secrets. Restart the API after changing provider configuration.
- Use a signed-in user's JWT for the requests below. Admin routes require `manage` on the `admin` resource (an admin account with the default `builtin` authorization driver). Reading provider status requires `read` on `notification`. Managing your own subscriptions requires `read` and `update` on `user`.
- For SMTP, have a reachable mail server and its sender address, credentials and TLS requirements.
- For SES, have AWS credentials with `ses:SendEmail` permission. Verify the sender identity in your chosen AWS Region. In the [SES sandbox](https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html), verify recipients too.
- For Slack, install a Slack app in your workspace with a bot token and the [`chat:write` scope](https://docs.slack.dev/reference/scopes/chat.write/). Invite the bot to each destination channel. For personal notifications, also configure the account-linking credentials described below.

## Enable it

### Select configuration files

Set these environment variables in the API process. Paths default to `email.yaml` and `slack.yaml` in its working directory.

```sh
export CCF_EMAIL_CONFIG=/etc/ccf/email.yaml
export CCF_SLACK_CONFIG=/etc/ccf/slack.yaml
export CCF_WEB_BASE_URL=https://ccf.example.com
export CCF_WORKER_ENABLED=true
```

`CCF_WEB_BASE_URL` is the UI address used in notification links and Slack's final browser redirect. Mount the files where the API can read them. Keep credentials in protected files or inject them from your secret manager.

### Configure SMTP

Create `/etc/ccf/email.yaml` with both the top-level and SMTP provider enabled:

```yaml
enabled: true
provider: smtp
providers:
  smtp:
    name: SMTP
    enabled: true
    host: smtp.example.com
    port: 587
    username: ""
    password: ""
    from: notifications@example.com
    from_name: CCF notifications
    use_tls: true
    use_ssl: false
```

Replace the example host and sender. Inject `CCF_EMAIL_PROVIDERS_SMTP_USERNAME` and `CCF_EMAIL_PROVIDERS_SMTP_PASSWORD` if your server requires authentication. Keep the `username` and `password` keys in the YAML file so the configuration loader sees their environment overrides.

`use_tls: true` enables STARTTLS. For implicit TLS, use your server's implicit TLS port (commonly `465`), set `use_ssl: true` and set `use_tls: false`. The API validates server certificates. SMTP requires a nonempty `host` and `from`, and a positive `port`.

### Configure Amazon SES

To use SES instead, replace the email file with:

```yaml
enabled: true
provider: ses
providers:
  ses:
    name: AWS SES
    enabled: true
    region: us-east-1
    access_key_id: ""
    secret_access_key: ""
    session_token: ""
    from: notifications@example.com
    from_name: CCF notifications
```

Replace the Region and sender with your verified identity's values. Leave the credential fields empty to use the AWS SDK's default credential chain, including workload identity or standard AWS environment variables. Alternatively, inject `CCF_EMAIL_PROVIDERS_SES_ACCESS_KEY_ID`, `CCF_EMAIL_PROVIDERS_SES_SECRET_ACCESS_KEY` and, for temporary credentials, `CCF_EMAIL_PROVIDERS_SES_SESSION_TOKEN`. The YAML keys above must remain present for these overrides.

`provider` selects the default email transport. If you configure both SMTP and SES, select one explicitly. Requests and subscriptions still use `email` as the channel, rather than `smtp` or `ses`.

### Configure Slack

Create `/etc/ccf/slack.yaml`:

```yaml
enabled: true
```

Inject `CCF_SLACK_TOKEN` with the bot token. The loader accepts Slack settings from environment variables even when those keys are absent from YAML. An enabled Slack configuration requires a token.

For personal Slack notifications, configure the app's OpenID Connect account-linking flow as well:

```sh
export CCF_SLACK_CLIENT_ID='<Slack app client ID>'
export CCF_SLACK_CLIENT_SECRET='<Slack app client secret>'
export CCF_SLACK_REDIRECT_URL=https://api.example.com/api/auth/slack/link/callback
```

Register that exact callback URL with your Slack app. The linking flow requests `openid`, `profile` and `email` scopes. It associates an existing CCF account with a Slack identity; the bot token remains the credential used to send messages. Shared Slack channel destinations do not require personal account linking.

Use the destination API below for shared channels. `digest_channel` in Slack YAML (or `CCF_SLACK_DIGEST_CHANNEL`) is a legacy setting used for a one-time migration into stored system destinations.

Restart the API with the configuration files and injected secrets in place.

## Use it

### Check provider status

Set `API_URL` to your API origin without a trailing slash. Set `TOKEN` to a signed-in admin user's JWT through your shell or secret manager.

```sh
export API_URL=https://api.example.com
```

```sh
curl --fail-with-body "$API_URL/api/admin/notifications/providers" \
  -H "Authorization: Bearer $TOKEN"
```

The response's `data` list includes `providerType`, `enabled` and provider metadata, with an `error` when metadata lookup fails. Check that your channel is enabled, then test delivery. Non-admin users can request `GET /api/notifications/providers` for only provider IDs and enabled status.

### Test delivery

Send a fixed test message to an address you control:

```sh
curl --fail-with-body -X POST "$API_URL/api/admin/notifications/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"providerType":"email","destinationTarget":"operator@example.com","mode":"enqueue"}'
```

For Slack, send the same request with `providerType` set to `slack` and `destinationTarget` set to a channel ID, such as the fictional `C0123456789`. Use an ID, rather than a channel's display name.

A `202 Accepted` response means the message is queued. It does not confirm delivery. Inspect the returned `data.jobIds` with `GET /api/admin/notifications/jobs/{id}` and check the destination inbox or channel. The test does not require a subscription or create a permanent destination.

### Add a shared destination

For example, send the evidence digest to a shared Slack channel:

```sh
curl --fail-with-body -X POST "$API_URL/api/admin/notifications/evidence_digest/destinations" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"providerType":"slack","destinationTarget":"C0123456789"}'
```

Use `providerType: email` and an email address for an email destination. List stored destinations with `GET /api/admin/notifications`. Remove a destination with `DELETE /api/admin/notifications/{notificationName}/destinations`, sending the same JSON body used to create it.

The system-wide notifications are `evidence_digest` and `workflow_execution_failed`. The destination handler also accepts `task_available`, `task_daily_digest` and `risk_notifications`; storing a destination does not change an event's recipient rules or scheduling.

The evidence digest schedule defaults to `CCF_DIGEST_ENABLED=true` and `CCF_DIGEST_SCHEDULE=@weekly`. You can set the schedule to a cron expression or a descriptor such as `@daily`. A digest with no reportable evidence issues may send no message.

### Set personal subscriptions

Use the subscribing user's JWT as `TOKEN`. Read `GET /api/users/me/subscriptions` before updating preferences. For example:

```sh
curl --fail-with-body -X PUT "$API_URL/api/users/me/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"notifications":{"evidenceDigest":["email","slack"],"taskAvailable":["email"],"taskDailyDigest":["email"],"riskNotifications":["email","slack"]}}'
```

The `notifications` map replaces all your existing subscriptions. Include every preference you want to retain; an empty map clears them. The four keys shown above are the supported subscription groups. Email goes to your CCF account's email address. Slack delivery requires a linked Slack identity as well as the `slack` subscription.

### Link a personal Slack account

Use a browser session authenticated with the API to visit `GET /api/auth/slack/link/start`. Complete Slack authorization in the same browser so the state cookie reaches `GET /api/auth/slack/link/callback`. The API then redirects to the UI at `/auth/slack/callback`.

Read `GET /api/auth/slack/link/status` to check the current link. Send `DELETE /api/auth/slack/link` to unlink it. Start, status and unlink require authentication; Slack calls the public callback with the state and authorization code. A command-line request that only returns the redirect URL does not complete linking.

### Routes at a glance

All paths below include the `/api` prefix. Admin routes require `manage` on `admin`.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/notifications/providers` | Read provider IDs and enabled status. |
| `GET` | `/api/admin/notifications/providers` | Read provider details and metadata errors. |
| `GET` | `/api/admin/notifications` | List stored system destinations. |
| `POST`, `DELETE` | `/api/admin/notifications/{notificationName}/destinations` | Add or remove a shared destination. |
| `POST` | `/api/admin/notifications/test` | Queue a test message. |
| `GET` | `/api/admin/notifications/health` | Inspect providers, workers, queues, subscribers and schedules. |
| `GET` | `/api/admin/notifications/jobs` | List delivery jobs; filter with `provider=email` or `provider=slack`. |
| `GET` | `/api/admin/notifications/jobs/{id}` | Inspect one job. |
| `GET` | `/api/admin/notifications/{notificationName}/diagnostics` | Diagnose a notification's recipient and scheduling conditions. |
| `GET`, `PUT` | `/api/users/me/subscriptions` | Read or replace your subscriptions. |
| `GET` | `/api/auth/slack/link/start` | Start personal Slack linking. |
| `GET` | `/api/auth/slack/link/callback` | Receive Slack's authorization callback. |
| `GET` | `/api/auth/slack/link/status` | Read your linked Slack identity status. |
| `DELETE` | `/api/auth/slack/link` | Unlink your Slack identity. |

## Troubleshooting

| Symptom | What to check |
|---|---|
| Provider is disabled | Check the file path, YAML syntax, top-level `enabled` and email provider's `enabled`. Read startup logs for `Failed to load email config` or `Failed to load Slack config`. Email environment overrides require an existing file with matching keys. |
| SMTP delivery fails | Check connectivity, sender, credentials, port and TLS mode. The certificate must be valid for the SMTP host. |
| SES delivery fails | Check AWS credentials, `ses:SendEmail` permission, Region and verified sender. Sandbox accounts also restrict recipients. |
| Slack delivery fails | Check the bot token, `chat:write` scope, destination ID and bot membership in the channel. See Slack's [message delivery requirements](https://docs.slack.dev/reference/methods/chat.postMessage/). |
| Slack linking returns `not_configured` | Set the client ID, client secret and redirect URL as well as enabling Slack. Check the registered callback and browser cookies. |
| Personal notifications are absent | Check subscriptions, provider status and Slack identity linking. Event-specific recipient rules still apply. |
| Test returns `503` | The worker enqueuer is unavailable. Check `CCF_WORKER_ENABLED`, database connectivity and startup logs. |
| Test returns `202` but no message arrives | Inspect the returned job IDs and `/api/admin/notifications/health`. Queued jobs can fail or retry after the request succeeds. |
| Destination creation returns `409` | That notification already has the same provider and target configured. List destinations before retrying. |
| Digest is absent | Check the digest schedule, subscribers or shared destinations, and `/api/admin/notifications/evidence_digest/diagnostics`. There may be no evidence issues to report. |

## Related

- [Notification routes and request handling at v0.22.5](https://github.com/compliance-framework/api/blob/v0.22.5/internal/api/handler/notifications.go)
- [Email configuration schema at v0.22.5](https://github.com/compliance-framework/api/blob/v0.22.5/internal/config/email.go)
- [Slack configuration schema at v0.22.5](https://github.com/compliance-framework/api/blob/v0.22.5/internal/config/slack.go)
