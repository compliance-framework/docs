---
title: Administration
description: Manage users, groups, roles, agents and imports, and check notifications and AI suggestions, from the UI's Admin section.
sidebar_position: 7
---

# Administration

The **Admin** section of the sidebar is where administrators manage who can use the Continuous Compliance Framework (CCF), register agents, import content and check that notifications work. This page is for **operators** and administrators.

## Before you start

You need `admin:manage` for every **Admin** entry except **Agents**, which needs `agent:read`. Registering agents and managing their keys also needs `admin:manage`.

## Users

Select **Admin** > **System Users**.

- **Create User** adds a user who signs in with an email and password.
- **View** opens a user: their sign-in method and provider, their last sign-in and failed attempts, whether they're active or locked out, and their groups. **Update User** and **Delete User** change or remove them.
- Under **Roles**, **Assign Role** gives the user a role directly. The list also shows the roles they inherit through a group. A role marked **Config-locked** is defined in the API's configuration and can't be removed here; an inherited role is removed on its group.

For a user who signs in with single sign-on, the groups that come from the identity provider are marked as inherited from SSO, and are read-only.

## Groups

Select **Admin** > **Groups**, then **Create Group** with a **Name** and **Description**. On a group's page:

- **Add Member** adds users. Members who come from the identity provider show as **Inherited (SSO)**, the others as **Native**.
- **Assign Role** under **Roles** gives the role to every member.

For what each role can do, see [Authentication and permissions](/api/authentication-and-permissions).

## Agents

Select **Admin** > **Agents** to see the agents registered with the API: their **Status**, **Active Key Count** and **Last Authenticated** time.

To connect a CCF Agent:

1. Select **Register Agent** and give it a name.
2. Open the agent and select **Create Service Account Key**. Give the key a **Key Name** and an expiry, or select **Never expires**.
3. Copy the **Client Secret** before you close the dialog: it isn't shown again. Put the **Client ID** and the secret in the agent's `api.auth`, or in `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`. See the [agent configuration reference](/agent/configuration).

**Revoke** stops a key from working. The agent's **Configuration** tab shows the configuration its instances report, and lets you save a configuration overlay for them, with its history of revisions, diffs and **Revert**. An instance only applies the overlay when its `remote_config.mode` is `apply_safe` or `apply_all`.

## Risks

**Admin** > **Risks** opens the risk register with the risks of every system security plan. It works like a system's register; see [Risks](./risks.md).

## Diagnostics

**Admin** > **Diagnostics** has two parts:

- **Notifications**: the notification providers and their readiness, the destinations each notification goes to (**Add Destination** adds one), the health of the job queue, the upcoming scheduled runs, and the delivery jobs. **Run Diagnostics** checks one type of notification and recommends what to fix. Nothing here retries or cancels jobs.
- **AI Suggestions**: the runs that generated evidence filter suggestions, their token use and cache hit ratio, and the suggestions accepted and rejected. Without AI set up in the API, it says so.

## Import

**Admin** > **Import** loads JSON files, dragged in or browsed:

- **Import OSCAL Content**: catalogs, profiles, system security plans, assessment plans, assessment results, component definitions and POA&Ms. **Import Results** lists what each file created.
- **Import Evidence Filters**: evidence filters with their control links.

## Related

- [Navigation](../navigation.md)
- [Authentication and permissions](/api/authentication-and-permissions)
- [Agent overview](/agent)
