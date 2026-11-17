---
title: Navigation
description: The entries of the UI's sidebar, what each one opens and the permission it needs.
sidebar_position: 3
---

# Navigation

This page is for **compliance and GRC users** and **operators**. It lists the entries of the UI's sidebar in the order the UI shows them.

The sidebar has two groups, so you can tell what a page is about:

- **This System** holds the pages that work on one system security plan (SSP): the **active system**. Under the group's heading, the sidebar shows the active system's name, or **No system selected**. Choose the active system with the **Active System** menu at the top of the page; the pages under **This System** then show that system's data and reload when you switch. Until you choose one, they ask you to select a system, or to create the first one.
- **Global** holds the pages that are shared across every system.

The sidebar hides an entry you don't have the permission for, and a group whose entries are all hidden. The **Evidence Filters** page and the **Admin** pages also check the permission when you open their address directly, and send you back to the start page, **Evidence** under **Global**. Permissions are written `resource:action`, the way the API's `/api/me/permissions` endpoint names them. For the roles that grant them, see [Authentication and permissions](/api/authentication-and-permissions).

This documentation's sidebar follows the same grouping: the pages under **This System** and **Global** below match the UI's groups. A page that covers entries in both groups, such as **Evidence**, appears under one group with a link to its section under the other.

To collapse the sidebar to abbreviations, select **Toggle Sidebar** on its edge. Hover over an abbreviation to see the entry's name.

## This System

| Entry | What it opens | Permission |
|---|---|---|
| **Evidence** | The evidence in the active system's scope. See [Evidence](./features/evidence.md#this-system-evidence). | `ssp:read` |
| **Implementation** | How the active SSP implements each control of its profile. See [Controls and the Compliance Map](./features/controls.md). | none |
| **Compliance** | The compliance of each control of the active SSP's profile. See [Systems](./features/systems.md#use-the-active-system). | none |
| **Risks** | The risks of the active SSP. See [Risks](./features/risks.md). | `risk:read` |
| **Workflow Instances** | The workflows that run for the active SSP. | `workflow-instance:read` |
| **Configure System** | The active SSP's overview, characteristics, authorization boundary, components, scope and JSON. See [Systems](./features/systems.md#use-the-active-system). | none |

## Global

| Entry | What it opens | Permission |
|---|---|---|
| **Evidence** | All the evidence agents and other sources sent, by label. See [Evidence](./features/evidence.md#global-evidence). | `evidence:read` |
| **Analysis** > **Risks** | The risks of every SSP. See [Administration](./features/administration.md#risks). | `admin:manage` |
| **Analysis** > **Compliance Map** | The lineage from standards to policies, controls and evidence, with compliance and open risk at each step. | none |
| **Integrations** > **Workflow Definitions** | The templates of recurring compliance activities. See [Workflows](./features/workflows.md). | `workflow-definition:read` |
| **Integrations** > **Evidence Filters** | Saved evidence searches, and the controls and components they're linked to. See [Evidence](./features/evidence.md#evidence-filters). | `filter:read` |
| **Integrations** > **Agents** | Registered agents, their service account keys and their remote configuration. | `agent:read` |
| **Integrations** > **Import** | Import OSCAL documents and evidence filters from JSON files. | `admin:manage` |
| **Control Definitions** > **Catalogs** | Control catalogs. See [Control definitions](./features/control-definitions.md). | `catalog:read` |
| **Control Definitions** > **Profiles** | Profiles: baselines of controls selected from catalogs. | `profile:read` |
| **Control Definitions** > **Control Links** | Relationships between controls, such as one control implementing another. | `control-link:read` |
| **Admin** > **Users** | Users who sign in with a password or single sign-on. | `admin:manage` |
| **Admin** > **Groups** | Groups of users. | `admin:manage` |
| **Admin** > **System Templates** | Templates that create SSPs from evidence. See [Administration](./features/administration.md#system-templates). | `admin:manage` |
| **Admin** > **Diagnostics** | Notification and AI suggestion diagnostics. | `admin:manage` |

**Logout**, at the bottom of the sidebar, signs you out.

To list all SSPs, create one or open one outside the active system, select **Manage systems…** in the **Active System** menu. **+ New system** in the same menu creates one, with `ssp:create`. The menu only lists SSPs if you have `ssp:read`.

The pages without a permission still only show what the API lets you read.

## Related

- [UI overview](./index.md)
- [Authentication and permissions](/api/authentication-and-permissions)
