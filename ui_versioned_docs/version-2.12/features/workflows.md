---
title: Workflows
description: Define recurring compliance activities in the UI, run them for a system and complete the tasks they assign you.
sidebar_position: 5
---

# Workflows

Workflows are recurring compliance activities with steps that people complete, such as a quarterly access review. A step can ask for evidence: a file, a written attestation or a link. This page is for **compliance and GRC users** who set up workflows and complete their tasks.

## How it works

- A **workflow definition** is the template: its steps, the role responsible for each step, the evidence each step requires, and a suggested cadence.
- A **workflow instance** runs a definition for one system security plan (SSP), on its own cadence, with users assigned to the definition's roles.
- Each run of an instance is an **execution**. Its steps become tasks for the users who hold the step's role, and show up under **My Tasks**.

## Before you start

- To see definitions and instances, you need `workflow-definition:read` and `workflow-instance:read`.
- To create an instance, an active system. See [Systems](./systems.md).
- For scheduled runs, the API's workflow scheduler must be on: see `CCF_WORKFLOW_CONFIG` in the [API configuration reference](/api/configuration).

## Create a workflow definition

1. Select **Workflows** > **Workflow Definitions**, then **New Definition**.
2. On its **Overview** tab, set the **Name**, **Version**, **Suggested Cadence**, **Grace Period (Days)** and the **Required Evidence Types**.
3. On the **Steps** tab, select **Add Step** for each step. Give it a **Responsible Role**, its **Evidence Requirements**, and the steps it depends on: a step stays blocked until its **Dependencies** are complete.
4. On the **Controls** tab, select **Link Control** to link the controls the workflow is for, so users find it when they implement those controls.

## Run a workflow for a system

1. Select **Workflows** > **Workflow Instances**, then **New Instance**.
2. Choose the **Workflow Definition**, give the instance a name, and choose its **Execution Cadence**, or write a six-field **Cron Expression** (second, minute, hour, day, month, weekday). Set its **Grace Period (Days)**.
3. Select **Create Instance**.
4. Open the instance and, on **Role Assignments**, assign a user to each role its steps use.

The instance runs on its cadence. **Execute Now**, or **Execute** in the list, starts a run at once. **Deactivate** stops the scheduled runs, and **Activate** resumes them. The **Executions** tab lists its runs. An execution's page shows each step's state and due date, and lets you **Cancel Execution** or **Retry Execution**.

## Complete your tasks

1. Open **My Tasks** from the profile menu. It lists the steps assigned to you, with their due dates. Narrow them by **Status** and due date.
2. Open a task and select **Start Step**.
3. Add the evidence the step requires with **Add Evidence**. Evidence is submitted when you complete the step.
4. Select **Complete Step**, with optional **Completion Notes**.

If you can't complete a step, select **Mark Failed** and give a reason; this can block the steps that depend on it. To hand a task to someone else, select **Reassign Task**.

## Related

- [Systems](./systems.md)
- [Evidence](./evidence.md)
- [UI overview](../index.md)
