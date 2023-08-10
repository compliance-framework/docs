---
sidebar_position: 1
sidebar_label: Glossary
---

# Glossary

| Name                  | Definition                                                                                                                                                                                                                               |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Assessment            | The overall process of evaluating a specific system, control, or process. It includes planning, executing various tests or checks, and drawing conclusions about compliance, performance, or quality.                                    |
| Attestation           | A formal declaration or statement confirming the truth of something, based on the assessment and its observations.                                                                                                                       |
| Assessment Action     | Specific tasks or activities within the overall Assessment. These are the actual tests, evaluations, or analyses carried out - In Argus case the code that runs the compliance checks.                                                   |
| Observation           | The findings or results from an Assessment Action. These are specific details or data gathered during the testing phase.                                                                                                                 |
| Control               | Policies and procedures designed to ensure systems are secure and/or stable and/or resilient. (aka Requirement)                                                                                                                          |
| Component             | Entity that is the subject of a Control, eg a Virtual Machine instance. A Component's status is made up of collective results of ComponentRequirements pertaining to that Component.                                                     |
| Detective Control     | A control that records that a qualifying event has taken place, usually with a view to following up with a check that the event was valid.                                                                                               |
| Preventative Control  | A Control that prevents an event from taking place, eg an organisational policy that prevents an S3 bucket being exposed to the internet.                                                                                                |
| Reactive Control      | A Control that takes corrective action when an event takes place, eg shutting down a VM that has attached an unencrypted disk.                                                                                                           |
| DORA                  | Digital Operational Resilience Act Digital Operational Resilience Act (DORA) - Regulation (EU) 2022/2554                                                                                                                                 |
| FINOS                 | Fintech Open Source Foundation                                                                                                                                                                                                           |
| GRC                   | Governance, Risk and Control                                                                                                                                                                                                             |
| KRI                   | Key Risk Indicator: a metric for measuring the probability of an event and its consequences will exceed the organisation's risk appetite                                                                                                 |
| OSCAL                 | Open Security Controls Assessment Language OSCAL - Open Security Controls Assessment Language                                                                                                                                            |
| Requirement           | See Control                                                                                                                                                                                                                              |
| RPO                   | Recovery Point Objective                                                                                                                                                                                                                 |
| SMF24                 |                                                                                                                                                                                                                                          |
| Senior Management Function 24 | the person in an organisation held responsible for operational failings.                                                                                                                                                         |
| Variance              |                                                                                                                                                                                                                                          |

### Internal Architecture Glossary
These terms are when we refer to the internal architecture that composes Compliance Framework. We should stick to it to not make our lives harder

| Name                   | Definition                                                                                                                                                                                                                               |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Assessment Runtime     | See [Assessment Runtime](/docs/architecture/assessment-runtime.md)                                                                                                                                                                       |
| Core Services          | See [Argus Core](/docs/architecture/core/index.md)                                                                                                                                                                                       |
| Dashboard UI           | See [...]                                                                                                                                                                                       |
