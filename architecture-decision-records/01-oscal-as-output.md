# Architectural Decision Record (ADR): OSCAL as Output, Not Input

## Context

The Continuous Compliance Framework (CCF) extensively utilizes OSCAL (Open Security Controls Assessment Language) to
facilitate compliance reporting and automate communication between stakeholders such as auditors, regulators, and
compliance teams. However, during practical implementation, we've identified challenges associated with using OSCAL as
an input format for dynamically collected data from distributed agents.

## Decision

We've decided to treat OSCAL primarily as an **output format** within CCF, rather than as an input format. Internally,
our agents and plugins collect compliance-related data using dynamic, metadata-driven data structures. The central API
then translates this data into structured OSCAL reports as an output.

Additionally, we introduce extra properties and metadata internally to enhance the usability, searchability, and
aggregation capabilities of our compliance data. While these properties extend beyond the basic OSCAL schema, the
underlying data structure remains closely aligned with OSCAL and is fully translatable into strict OSCAL format.

We specifically avoid using OSCAL `props` for internal automation workflows. OSCAL `props` are intended to communicate
meaningful information relevant to auditors and regulators. Using `props` for internal automation would result in mixing
internal operational details with regulatory information, creating confusion and complexity in the final OSCAL output.

## Rationale

OSCAL schemas inherently assume stable and predefined identifiers for components, subjects, roles, and actors. However,
this assumption is challenging in dynamic and distributed environments, including:

- Autoscaling cloud infrastructure where identifiers aren't predictable.
- Distributed agent deployments independently assessing various aspects of the same entities without prior coordination.
- Lightweight agents designed to focus on efficient metadata collection rather than managing complex identifiers.

By adopting OSCAL strictly as an output format, we:

- Maintain internal agility and simplicity for agents.
- Dynamically resolve and aggregate identifiers and metadata centrally.
- Provide structured, consistent, and standardized reporting externally.
- Clearly separate internal metadata management from regulatory communication, maintaining clarity and simplicity.

## Consequences

### Positive

- Flexibility in handling dynamic infrastructures without sacrificing reporting standards.
- Lightweight, efficient agents focusing purely on data collection.
- Robust, centralized aggregation ensuring accurate and consistent compliance reports.
- Enhanced capabilities through additional properties and metadata, providing improved searchability and aggregation.
- Clear separation of concerns between internal operational data and regulatory reporting requirements.

### Negative

- Slight deviation from traditional OSCAL usage patterns.
- Requires additional logic in the central API to dynamically resolve and aggregate identifiers.

## Summary

CCF strategically positions OSCAL as an output-only standard, leveraging dynamic metadata collection internally with
additional properties that enhance usability and flexibility. This architectural choice ensures flexibility and
scalability, allowing comprehensive and auditor-friendly OSCAL-compliant reporting without burdening agents with static
identifier management or conflating operational details with regulatory requirements.
