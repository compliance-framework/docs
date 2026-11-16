---
title: Administration
description: Manage users, groups, roles, agents, imports and system templates, and check notifications and AI suggestions, from the UI's Admin section.
sidebar_position: 7
---

# Administration

The **Admin** group of the sidebar, and a few entries under **Integrations** and **Analysis**, are where administrators manage who can use the Continuous Compliance Framework (CCF), register agents, import content, create systems from evidence and check that notifications work. This page is for **operators** and administrators.

## Before you start

You need `admin:manage` for every entry described here except **Agents**, which needs `agent:read`. Registering agents and managing their keys also needs `admin:manage`.

## Users

Select **Admin** > **Users**.

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

Select **Global** > **Integrations** > **Agents** to see the agents registered with the API: their **Status**, **Active Key Count** and **Last Authenticated** time.

To connect a CCF Agent:

1. Select **Register Agent** and give it a name.
2. Open the agent and select **Create Service Account Key**. Give the key a **Key Name** and an expiry, or select **Never expires**.
3. Copy the **Client Secret** before you close the dialog: it isn't shown again. Put the **Client ID** and the secret in the agent's `api.auth`, or in `CCF_API_AUTH_CLIENT_ID` and `CCF_API_AUTH_CLIENT_SECRET`. See the [agent configuration reference](/agent/configuration).

**Revoke** stops a key from working. The agent's **Configuration** tab shows the configuration its instances report, and lets you save a configuration overlay for them, with its history of revisions, diffs and **Revert**. An instance only applies the overlay when its `remote_config.mode` is `apply_safe` or `apply_all`.

## System templates

A system template creates one SSP for each application, or any other combination of label values, found in the evidence. It's for **operators** and administrators who manage many systems. Select **Admin** > **System Templates**.

The list shows each template's **Name**, **Keys**, **Enabled**, **Created SSPs** and **Last run**. **Create Template** opens a dialog; **View**, **Edit** and **Delete** act on a row. Deleting a template keeps the SSPs it created and their scope entries.

### Create or edit a template

In **Create System Template**, or **Edit System Template** for an existing one, fill in:

| Field | What it does |
|---|---|
| **Name** | The template's name. Required. |
| **Enabled** | Whether discovery runs for the template. |
| **Keys** | Label keys. One SSP is created for every distinct combination of their values. Press Enter to add a key. You can't change keys after the template is created. |
| **Evidence filter** | Optional. Only matching evidence counts, for example `env=prod AND team!=sandbox`. |
| **Scope label groups** | The labels each SSP learns into its scope. **Add Group** adds a group; the labels of one group are learned together as one scope entry. |
| **Minimum streams** | How many evidence streams a combination needs before an SSP is created. |
| **Profiles** | The profiles attached to each created SSP. |
| **Title template** and **Description template** | Text for the SSP's title and description. They can use the key values, for example `SSP for Application {{ ._app }}`. The title is required. |
| **Properties** | Name and value pairs added to each created SSP. A value can use the key values too. |

The dialog has a preview of the title and description templates. Submit the form to save.

### Preview, run and review created SSPs

Select **View** on a template to open its page. **Edit Template** reopens the dialog, **Back to List** returns to the list, and the page shows the template's fields, such as its keys, filter, scope label groups and when it was last updated.

- **Preview** shows what discovery would do now with the saved template. It writes nothing. The result says how many SSPs it would create and how many already exist, and lists each SSP with an **Exists** or **New** badge, its key values, the scope entries it would learn and the entries skipped because of an exception. It also lists combinations below the minimum streams and key values that are invalid.
- **Run now** queues a discovery run. It needs an enabled template; the page says **Enable the template to run it** otherwise. Discovery runs in the background, so select **Refresh** on **Created SSPs** after a moment.
- **Created SSPs** lists the SSPs the template created: their **Key values**, the **SSP** (linked to its overview), **Created**, **Last seen** and **Last error**. A **Stale** badge marks an SSP whose evidence is no longer seen. When someone deleted the SSP, its row says **(deleted)** and the template doesn't create it again until you select **Forget**. After **Forget**, the next discovery run creates it again if its evidence is still there.

A template adds the entries it learns to each SSP's scope, with the origin **Template**. See [Define the scope of a system](./systems.md#define-the-scope-of-a-system).

## Risks

**Global** > **Analysis** > **Risks** opens the risk register with the risks of every system security plan. It works like a system's register; see [Risks](./risks.md).

## Diagnostics

**Admin** > **Diagnostics** has two parts:

- **Notifications**: the notification providers and their readiness, the destinations each notification goes to (**Add Destination** adds one), the health of the job queue, the upcoming scheduled runs, and the delivery jobs. **Run Diagnostics** checks one type of notification and recommends what to fix. Nothing here retries or cancels jobs.
- **AI Suggestions**: the runs that generated evidence filter suggestions, their token use and cache hit ratio, and the suggestions accepted and rejected. Without AI set up in the API, it says so.

## Import

**Global** > **Integrations** > **Import** loads JSON files, dragged in or browsed:

- **Import OSCAL Content**: catalogs, profiles, system security plans, assessment plans, assessment results, component definitions and POA&Ms. **Import Results** lists what each file created.
- **Import Evidence Filters**: evidence filters with their control links.

## Related

- [Navigation](../navigation.md)
- [Authentication and permissions](/api/authentication-and-permissions)
- [Agent overview](/agent)
