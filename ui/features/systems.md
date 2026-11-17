---
title: Systems
description: Create system security plans in the UI, choose the active one and follow its compliance.
sidebar_position: 1
---

# Systems

In the Continuous Compliance Framework (CCF), a system is described by an OSCAL system security plan (SSP): its components, the profile of controls it must meet and how it implements them. This page is for **compliance and GRC users** who manage SSPs in the UI.

## How it works

Several pages of the UI work on one SSP at a time: the **active system**. You choose it with the **Active System** menu at the top of the page, and the pages under **This System** in the sidebar (**Evidence**, **Implementation**, **Compliance**, **Risks**, **Workflow Instances** and **Configure System**) work on it. See [Navigation](../navigation.md). The UI remembers the active system in your browser, so it stays active until you choose another one.

## Before you start

- The recordings use UI `v2.15.2` and API `v0.22.5` in a temporary environment with fictional data.
- To see the list of SSPs, you need `ssp:read`. To create or change one, a role that can change OSCAL documents, such as `contributor`.
- To follow compliance, the SSP needs a profile. See [Control definitions](./control-definitions.md).

## Create a system security plan

1. Open the **Active System** menu and select **Manage systems…**, then **New System Security Plan**. **+ New system** in the same menu opens the same form.
2. Fill in **Title** and **Version**. The **ID** is filled in with a new UUID; select **Regenerate UUID** for another.
3. Select **Create System Security Plan**. The new SSP becomes the active system and opens in **Configure System**.

![Open Manage systems from the Active System menu, fill in the title of a new system security plan and create it.](/img/ui/2.15/create-system.gif)

To bring in an existing SSP instead, import its OSCAL JSON under **Integrations** > **Import**. To create SSPs from evidence, use a system template; see [System templates](./administration.md#system-templates).

## Choose the active system

Select the system in the **Active System** menu. You can also select **Set Active** on the SSP's row in the list under **Manage systems…**. The list also has **View**, to open the SSP, and **JSON**, to see its OSCAL document. **Download Full JSON** downloads it.

![Choose a system in the Active System menu, then open Manage systems and select Set Active on another one.](/img/ui/2.15/choose-active-system.gif)

## Use the active system

Select **This System** > **Configure System**. Until you've chosen an active system, the page asks you to select one. The page has these tabs:

| Tab | What it shows |
|---|---|
| **Overview** | The SSP's metadata, its system characteristics, and a summary of its compliance: **Controls Satisfied** and **Implementation Coverage**. Under **Profiles** you attach the profiles the SSP must meet. **Download JSON** downloads the SSP. |
| **Components** | The SSP's system components. **Create Component** adds one, from scratch or from a component definition. **Dashboards** shows the evidence filters linked to a component, when `FILTER_COMPONENT_LINKING_ENABLED` is on (see the [configuration reference](../configuration.md)). |
| **Scope** | The labels that say which evidence belongs to the SSP. See [Define the scope of a system](#define-the-scope-of-a-system). |
| **JSON** | The SSP's OSCAL document. |

![Open Configure System for the active system and move through its Components, Scope and JSON tabs.](/img/ui/2.15/system-tabs.gif)

**Configure System** doesn't have **Risks** and **Compliance** tabs: they are their own entries under **This System**.

| Entry | What it shows |
|---|---|
| **Risks** | The SSP's risk register. See [Risks](./risks.md). |
| **Compliance** | The compliance of each control of the attached profile: **Satisfied**, **Inherited**, **Not Satisfied** or **Unknown**, from the evidence linked to it, with a breakdown by control group. |

The SSP editor, which you open from the list under **Manage systems…**, works on any SSP and has **Risks** and **Compliance** tabs next to the others.

## Define the scope of a system

The scope of an SSP is the set of labels that identify its evidence. **This System** > **Evidence** shows only evidence in the scope, and evidence filters can follow it. See [Evidence](./evidence.md#this-system-evidence).

Select **Configure System** > **Scope**. You need `ssp:update` to change it; without it, the controls are disabled. The tab has three parts:

- **Scope** states the rule: evidence is in scope when it matches any entry, and matches an entry when it has all of the entry's labels. **Automatic filters** is a checkbox. When it's on, CCF creates one filter for each policy found in the system's evidence, ready to link to controls on the **Implementation** page.
- **Entries** lists each entry as labels joined by `AND`, with its origin, **Template** or **Manual**, and its creation date. Under **Add entry**, pick the label keys and values the evidence must have, select **Add label** for more, then **Add entry**. The key suggestions come from all evidence, not only from what's already in scope. **Remove from scope** removes an entry after you confirm.
- **Exceptions** lists the entries you removed. A template doesn't learn an entry that has an exception. **Delete exception** doesn't add the entry back; it lets templates learn it again.

![Open the Scope tab, pick a label key and value, and add an entry to the scope.](/img/ui/2.15/define-system-scope.gif)

A system with no entries has no evidence of its own: **This System** > **Evidence** asks you to define the scope.

## Troubleshooting

- **No profile is attached to this System Security Plan**: attach one from the **Overview** tab, under **Profiles**.
- **Implementation** says **Your selected SSP does not have a linked profile**: same fix.
- **This System** > **Evidence** says **Define this system's scope**: add an entry on the **Scope** tab.

## Related

- [Evidence](./evidence.md)
- [Controls and the Compliance Map](./controls.md)
- [Risks](./risks.md)
- [Navigation](../navigation.md)
