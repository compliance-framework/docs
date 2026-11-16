---
title: Risks
description: Track the risks of a system in the UI, from intake to mitigation, acceptance or closure.
sidebar_position: 4
---

# Risks

The risk register lists the risks of a system security plan (SSP), with their likelihood, impact, owner and review deadline, and takes each one through its lifecycle. This page is for **compliance and GRC users**.

## How it works

Each risk belongs to one SSP. A risk can come from evidence, from the risk templates that policies define, or be created by hand. It moves through these statuses: **Open**, **Investigating**, **Mitigating Planned**, **Mitigating Implemented**, **Risk Accepted**, **Remediated** and **Closed**. A risk's page shows which moves its current status allows.

An accepted risk has a review deadline. At each review you either extend the acceptance with a new deadline, or send the risk back to **Investigating**.

## Before you start

- To see risks, you need `risk:read`. To create and change them, a role such as `contributor` or `auditor`.
- To see the risks of every SSP under **Admin** > **Risks**, you need `admin:manage`.

## Use the risk register

1. Select **Risk Register** for the active system, or the **Risks** tab of an SSP. The cards at the top count **Active Risks**, **Open Risks**, **Accepted Risks** and **Overdue Reviews**.
2. Narrow the list with **Search**, **Status**, **Likelihood**, **Impact**, **Owner**, **Review Deadline**, **Control ID** and **Evidence ID**, and order it with **Sort**. **Reset Filters** clears them.
3. Select **Create Risk** to add one.
4. Select risks to change them together: **Bulk Status**, **Bulk Owner**, or **Export CSV**.

Select **Open** on a risk for its page. There you:

- move it through its lifecycle: **Start Investigation**, **Create Mitigation**, **Mark Mitigating Implemented**, **Accept Risk**, **Review Risk**, **Reopen** or **Close Risk**;
- link the **Evidence**, **Controls** and **Components** it's about, and its **Threats**;
- record **Suggested Remediations** and their tasks;
- read its **Reviews** and its **History & Events**.

To create a risk from a piece of evidence, open the evidence and select **Create Risk** under **Associated Risks**; see [Evidence](./evidence.md).

## Related

- [Systems](./systems.md)
- [Evidence](./evidence.md)
- [Administration](./administration.md)
