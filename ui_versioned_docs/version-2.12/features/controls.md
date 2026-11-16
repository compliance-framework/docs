---
title: Controls and the Compliance Map
description: Document how a system implements its controls in the UI, link evidence to them, and follow compliance from standards down to evidence.
sidebar_position: 3
---

# Controls and the Compliance Map

**Controls** is where you write how the active system implements each control it must meet, and link the evidence that shows it. The **Compliance Map** shows the result across your systems, from standards down to evidence. This page is for **compliance and GRC users**.

## How it works

The controls of a system come from the profile attached to its system security plan (SSP), and their text from the profile's catalog. For each control statement, the SSP records which components implement it, how, and with what status. Evidence filters linked to a control decide whether the evidence satisfies it.

## Before you start

- An active system whose SSP has a profile attached. See [Systems](./systems.md).
- To change implementations, a role that can change OSCAL documents, such as `contributor`.

## Document an implementation

1. Select **Controls**. The page lists the controls of the active system's profile, by group.
2. Select a control and one of its statements. If the statement has no implementation yet, select **Create Statement**.
3. For each component that implements it, set the **Implementation Status** and describe how. To add a component the SSP doesn't have yet, create it from the same panel.
4. Under **Linked Evidence Filters**, link the evidence filters that show the control works. **View Evidence** opens a filter's search, and **Unlink** removes it.

A control's implementation can also come from another system: **Inherited** marks what it inherits, and **Export** shares an implementation with other systems.

When the API has AI set up, **AI evidence filter suggestions** proposes filters for the control. **Review in evidence filter suggestions** opens them; see [Evidence](./evidence.md#evidence-filters).

## Follow the Compliance Map

Select **Compliance Map**. It shows a tree from standards to policies, controls and evidence, with the compliance of each node and the score of its open risks. Expand a node to see its children, and select it for details: its compliance in each SSP, its evidence and its inherited capabilities.

Narrow the map with the bar at the top: an **SSP**, a **Component** and the **Types** of node to show. The switch next to it changes to the graph view, which shows the nodes with the worst open risk first, column by column.

## Troubleshooting

- **System Security Plan not selected**: choose an active system under **Systems** > **Manage Systems**.
- **Your selected SSP does not have a linked profile**: attach a profile on the SSP's **Overview** tab.
- **Showing demo fixture data — the lineage API isn't connected.**: the UI couldn't load the map from the API (`/api/lineage/roots`), so it shows sample data instead. Check that the API is reachable and that you're signed in.

## Related

- [Systems](./systems.md)
- [Evidence](./evidence.md)
- [Control definitions](./control-definitions.md)
