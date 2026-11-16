---
title: Systems
description: Create system security plans in the UI, choose the active one and follow its compliance.
sidebar_position: 1
---

# Systems

In the Continuous Compliance Framework (CCF), a system is described by an OSCAL system security plan (SSP): its components, the profile of controls it must meet and how it implements them. This page is for **compliance and GRC users** who manage SSPs in the UI.

## How it works

Several pages of the UI work on one SSP at a time: the **active system**. The header shows its name as **Active System**, and **Controls**, **Risk Register** and **Workflow Instances** work on it. The UI remembers the active system in your browser, so it stays active until you choose another one.

## Before you start

- To see the list of SSPs, you need `ssp:read`. To create or change one, a role that can change OSCAL documents, such as `contributor`.
- To follow compliance, the SSP needs a profile. See [Control definitions](./control-definitions.md).

## Create a system security plan

1. Select **Systems** > **Manage Systems**, then **New System Security Plan**.
2. Fill in **Title** and **Version**. The **ID** is filled in with a new UUID; select **Regenerate UUID** for another.
3. Select **Create System Security Plan**.

To bring in an existing SSP instead, import its OSCAL JSON under **Admin** > **Import**. See [Administration](./administration.md).

## Choose the active system

Under **Systems** > **Manage Systems**, select **Set Active** on the SSP's row. The list also has **View**, to open the SSP, and **JSON**, to see its OSCAL document. **Download Full JSON** downloads it.

## Use the active system

Select **Systems** > **Active System**. Until you've chosen one, the page says **System Security Plan not selected**. The page has these tabs:

| Tab | What it shows |
|---|---|
| **Overview** | The SSP's metadata, its system characteristics, and a summary of its compliance: **Controls Satisfied** and **Implementation Coverage**. Under **Profiles** you attach the profiles the SSP must meet. **Download JSON** downloads the SSP. |
| **Components** | The SSP's system components. **Create Component** adds one, from scratch or from a component definition. **Dashboards** shows the evidence filters linked to a component, when `FILTER_COMPONENT_LINKING_ENABLED` is on (see the [configuration reference](../configuration.md)). |
| **Risks** | The SSP's risk register. See [Risks](./risks.md). |
| **Compliance** | The compliance of each control of the attached profile: **Satisfied**, **Inherited**, **Not Satisfied** or **Unknown**, from the evidence linked to it, with a breakdown by control group. |
| **JSON** | The SSP's OSCAL document. |

## Troubleshooting

- **No profile is attached to this System Security Plan**: attach one from the **Overview** tab, under **Profiles**.
- **Controls** says **Your selected SSP does not have a linked profile**: same fix.

## Related

- [Controls and the Compliance Map](./controls.md)
- [Risks](./risks.md)
- [Navigation](../navigation.md)
