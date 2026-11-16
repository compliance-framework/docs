---
title: Navigation
description: The entries of the UI's sidebar, what each one opens and the permission it needs.
sidebar_position: 3
---

# Navigation

This page is for **compliance and GRC users** and **operators**. It lists the entries of the UI's sidebar in the order the UI shows them.

The sidebar hides an entry you don't have the permission for, and a group whose entries are all hidden. The **Evidence Filters** page and the **Admin** pages also check the permission when you open their address directly, and send you back to the start page, **Evidence**. Permissions are written `resource:action`, the way the API's `/api/me/permissions` endpoint names them. For the roles that grant them, see [Authentication and permissions](/api/authentication-and-permissions).

To collapse the sidebar to abbreviations, select **Toggle Sidebar** on its edge. Hover over an abbreviation to see the entry's name.

| Entry | What it opens | Permission |
|---|---|---|
| **Systems** > **Active System** | The active system security plan (SSP): its overview, components, risks, compliance and JSON. See [Systems](./features/systems.md). | none |
| **Systems** > **Manage Systems** | The list of SSPs, where you create one and choose the active one. | `ssp:read` |
| **Evidence** | Search the evidence agents and other sources sent, by label. See [Evidence](./features/evidence.md). | `evidence:read` |
| **Controls** | How the active SSP implements each control of its profile. See [Controls and the Compliance Map](./features/controls.md). | none |
| **Compliance Map** | The lineage from standards to policies, controls and evidence, with compliance and open risk at each step. | none |
| **Risk Register** | The risks of the active SSP. See [Risks](./features/risks.md). | `risk:read` |
| **Evidence Filters** | Saved evidence searches, and the controls and components they're linked to. See [Evidence](./features/evidence.md#evidence-filters). | `filter:read` |
| **Workflows** > **Workflow Definitions** | The templates of recurring compliance activities. See [Workflows](./features/workflows.md). | `workflow-definition:read` |
| **Workflows** > **Workflow Instances** | The workflows that run for the active SSP. | `workflow-instance:read` |
| **Control Definitions** > **Catalogs** | Control catalogs. See [Control definitions](./features/control-definitions.md). | `catalog:read` |
| **Control Definitions** > **Control Links** | Relationships between controls, such as one control implementing another. | `control-link:read` |
| **Control Definitions** > **Profiles** | Profiles: baselines of controls selected from catalogs. | `profile:read` |
| **Admin** > **Risks** | The risks of every SSP. See [Administration](./features/administration.md). | `admin:manage` |
| **Admin** > **System Users** | Users who sign in with a password or single sign-on. | `admin:manage` |
| **Admin** > **Groups** | Groups of users. | `admin:manage` |
| **Admin** > **Agents** | Registered agents, their service account keys and their remote configuration. | `agent:read` |
| **Admin** > **Diagnostics** | Notification and AI suggestion diagnostics. | `admin:manage` |
| **Admin** > **Import** | Import OSCAL documents and evidence filters from JSON files. | `admin:manage` |
| **Logout** | Signs you out. It's at the bottom of the sidebar. | none |

The pages without a permission still only show what the API lets you read.

## Related

- [UI overview](./index.md)
- [Authentication and permissions](/api/authentication-and-permissions)
