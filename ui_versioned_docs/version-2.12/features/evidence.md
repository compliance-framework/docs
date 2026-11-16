---
title: Evidence
description: Search evidence by label in the UI, look into one record, and save searches as evidence filters linked to controls.
sidebar_position: 2
---

# Evidence

In the Continuous Compliance Framework (CCF), evidence is what CCF Agents, and anything else with a token, send the API about the systems they check: a result, satisfied or not, with labels that say where it comes from. This page is for **compliance and GRC users** who look for evidence and link it to controls.

## How it works

Each evidence record has labels, such as `_plugin=apt-versions` or `environment=production`. Records with the same labels form one evidence stream: each new record from the same source updates the stream, and the earlier ones become its history.

You find evidence by searching its labels. An **evidence filter** is a saved search, linked to the controls it's evidence for. The **Compliance** of a system comes from the evidence its controls' filters find.

## Before you start

- To search evidence, you need `evidence:read`. To see evidence filters, `filter:read`.
- To create filters, a role that can change filters, such as `contributor`.

## Search evidence

1. Select **Evidence**. The two charts at the top show **Compliance over time**, the satisfied and unsatisfied results over time, and **Agent health**, the number of agents sending heartbeats over time.
2. Type a query in the search box and select **Search**. A query compares labels with `=` or `!=`, joined with `AND` or `OR`. Group with parentheses to mix them:

   ```text
   environment=production AND (_plugin=apt-versions OR _plugin=local-ssh)
   ```

   Without `AND` or `OR` between them, conditions are joined with `AND`. Mixing `AND` and `OR` at the same level without parentheses is an error.

3. Optionally, narrow the results to one subject with **Subject: any** next to the search box. It's only there when the API supports subjects.

The query is part of the page's address. **Share** copies the address, so others can open the same search. **Export to CSV** downloads the results. The menu at the end of the row shows or hides the labels, including the hidden ones whose names start with `_`.

## Look into one record

Select a record to open it. Its page shows:

- its status and reason, its labels, props and links, and the subjects it's about;
- the history of its stream, with **Compliance over time**; **Go to latest evidence** opens the newest record of the stream;
- **Associated Risks**: the risks linked to its stream, in every SSP. **Create Risk** creates one from it in the SSP you choose;
- **Verification**: whether the record still matches the signature the API stored when it arrived;
- the policy evaluation that produced it, when the agent stored it: the API replays it and shows the violations, the policy, its data and its input. If the replay differs from what was recorded, the page says how.

## Evidence filters

To save a search as a filter:

1. On **Evidence**, run the search, then select **Save**.
2. In **New Evidence Filter**, give it a **Name**. **Result Filter** holds your query.
3. Choose its **Scope**: **Global**, or one SSP.
4. Select the **Controls** it's evidence for. When `FILTER_COMPONENT_LINKING_ENABLED` is on, you can link it to **Components** instead (see the [configuration reference](../configuration.md)).
5. Submit the form. The UI goes back to **Evidence** with the filter's query.

**Evidence Filters** lists every filter, with **Edit** and **Delete**. Narrow the list by **Scope**, **Control** or **Component**.

You can also link filters to a control from the **Controls** page; see [Controls and the Compliance Map](./controls.md). When the API has AI set up, it can suggest filters for a system's controls: review them under **Evidence filter suggestions**, then **Accept** or **Reject** each one. Without AI, the page says **AI is not configured**.

## Related

- [Controls and the Compliance Map](./controls.md)
- [Risks](./risks.md)
- [Agent overview](/agent)
