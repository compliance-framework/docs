---
sidebar_position: 1
sidebar_label: Glossary
description: The terms CCF docs use, with the meaning they have in CCF. Each term appears once; synonyms point to the main entry.
---

# Glossary

## Compliance Framework Glossary

These definitions help users onboard. They aren't a final definition for the industry. Where a term comes from OSCAL or NIST, the definition links to the source. If a term's meaning is disputed in an issue, this page is the arbiter, or is updated to fix it.

Each term has one entry. A synonym points to the entry that defines it.

| Name | Definition |
|------|------------|
| Assessment | [The overall process of evaluating a specific system, control, or process. It includes planning, executing various tests or checks, and drawing conclusions about compliance, performance, or quality.](https://csrc.nist.gov/glossary/term/assessment) |
| Assessment Plan | ["Planning of a periodic or continuous assessment of a specific system"](https://pages.nist.gov/OSCAL/learn/concepts/layer/assessment/assessment-plan/) |
| Assessment Results | [Information produced from a set of assessment activities, including when the assessment was performed, its scope, the evidence collected and any findings.](https://pages.nist.gov/OSCAL/learn/concepts/layer/) |
| Assessor | Role that validates that a system meets its controls. |
| Attestation | [A formal declaration or statement confirming the truth of something, based on an assessment and its observations.](https://csrc.nist.gov/glossary/term/attestation) |
| Authorizing Official | Someone with the authority to formally assume responsibility for operating an information system at an acceptable level of risk. |
| Baseline | See 'Control Baseline'. |
| Catalog | [An organized collection of controls](https://pages.nist.gov/OSCAL/learn/concepts/terminology/), in OSCAL format. See [Concepts](./concepts.md#catalog). |
| Component | Entity that is the subject of a control, for example a virtual machine instance. A system is made up of components. |
| Control | [A policy or procedure designed to ensure systems are secure, stable or resilient. Also called a requirement.](https://pages.nist.gov/OSCAL/learn/concepts/terminology/) See [Concepts](./concepts.md#control). |
| Control Baseline | [A specific set of selected controls from one or more catalogs for use in managing risks in an information system.](https://pages.nist.gov/OSCAL/learn/concepts/terminology/) Also known as a profile or an overlay. |
| Control Implementation | Activities performed to enforce a control, and the description of them in a system security plan. |
| Control Objective | Statement that describes the outcome or intent of a control in managing or mitigating risk. It clarifies intent, guides control selection and facilitates assessment. |
| Control Owner | Role responsible for the management, implementation and monitoring of specific controls within an organization. |
| Detective Control | A control that records that a qualifying event has taken place, usually so that someone can follow up and check that the event was valid. |
| DORA | Digital Operational Resilience Act: Regulation (EU) 2022/2554. |
| Environment | Set of conditions or circumstances under which a system operates. |
| Evidence | A result about one subject, with labels that say where it comes from. See [Concepts](./concepts.md#evidence). |
| Filter | A saved search over evidence labels, linked to the controls the matching evidence supports. See [Concepts](./concepts.md#filter). |
| Finding | [A result of observations and risks in an assessment, which can include the status of a control objective.](https://pages.nist.gov/OSCAL/learn/concepts/layer/assessment/assessment-results/) |
| FINOS | [Fintech Open Source Foundation.](https://www.finos.org/) |
| GRC | Governance, Risk and Compliance. |
| Implementation Owner | Role responsible for implementing a set of controls within a system or environment. |
| KRI | Key Risk Indicator: a metric for measuring the probability that an event and its consequences will exceed the organization's risk appetite. |
| Model | [An information structure supporting a specific operational purpose.](https://pages.nist.gov/OSCAL/learn/concepts/layer/) |
| Observation | A specific detail or piece of data gathered during an assessment. |
| OSCAL | Open Security Controls Assessment Language. |
| Overlay | See 'Control Baseline'. |
| Preventative Control | A control that prevents an event from taking place, for example a policy that prevents an S3 bucket being exposed to the internet. |
| Privacy Control | [The administrative, technical and physical safeguards employed within an agency to ensure compliance with applicable privacy requirements and manage privacy risks.](https://csrc.nist.gov/glossary/term/privacy_control) |
| Profile | See 'Control Baseline'. A profile selects the controls of one or more catalogs that apply to a system. See [Concepts](./concepts.md#catalog). |
| Reactive Control | A control that takes corrective action when an event takes place, for example shutting down a VM that has an unencrypted disk attached. |
| Requirement | See 'Control'. |
| Risk | [An individual risk, including its weakness description, risk statement and other characteristics.](https://csrc.nist.gov/glossary/term/risk) |
| Risk Level | Severity of a risk, for example Acceptable, Critical, or Low, Moderate or High impact. |
| RPO | Recovery Point Objective. |
| Security Control | [The safeguards or countermeasures prescribed for an information system or an organization to protect the confidentiality, integrity and availability of the system and its information.](https://csrc.nist.gov/glossary/term/security_control) |
| SSP | See 'System Security Plan'. |
| System | The thing you're answerable for, such as an application, a platform or a cloud account, made up of components. See [Concepts](./concepts.md#system). |
| System Owner | Role responsible for operating a system and implementing its controls. |
| System Security Plan | [A description of the control implementation of an information system.](https://pages.nist.gov/OSCAL/learn/concepts/layer/implementation/ssp/) |
| Variance | A deviation or exception from established security standards, policies or procedures. |

## Internal Architecture Glossary

These terms are when we refer to the internal architecture that composes Compliance Framework. We should stick to it to not make our lives harder.

| Name         | Definition                                     |
|--------------|------------------------------------------------|
| CCF Agent    | See [Agent](/api/architecture/agents)          |
| CCF Plugins  | See [Plugins](/api/architecture/plugins)       |
| CCF Policies | See [Policies](/api/architecture/policies)     |

## Links and References

| Link                          | Description                                                                                                                                                                                                                                     |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [OSCAL Concepts](https://pages.nist.gov/OSCAL/learn/concepts/) |                                                                                                                                                                                                                     |
| [OSCAL Terminology](https://pages.nist.gov/OSCAL/learn/concepts/terminology/) |                                                                                                                                                                                                       |
| [NIST Glossary](https://csrc.nist.gov/glossary)                       |                                                                                                                                                                                                         |
| [NIST Special Publication 800-37 Revision 2](https://csrc.nist.gov/publications/detail/sp/800-37/rev-2/final) |                                                                                                                                                                 |
| [Example Control](https://pages.nist.gov/OSCAL/learn/concepts/layer/control/catalog/sp800-53rev5-example/) |                                                                                                                                                                          |
| [Example Catalog](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) |                                                                                                                                                                                                         |
