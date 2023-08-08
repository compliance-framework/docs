---
sidebar_position: 1
sidebar_label: Glossary
---

| Name | Definition |
| ---- | ---------- |
| Attestation | Recorded evidence that a control has been implemented |
| AttestationProvider | The external piece of software that performs the actual attestation, eg ssh, checkov |
| Controls | Policies and procedures designed to ensure systems are secure and/or stable and/or resilient. (aka Requirement) |
| Component | Entity that is the subject of a Control, eg a Virtual Machine instance. A Component's status is made up of collective results of ComponentRequirements pertaining to that Component. |
| ComponentAttestation | The Attestations carried out on a Component. |
| ComponentAssessment | An instance of an Implementation for a Component. |
| ComponentControl | An instance of a Control linked to a Component. A ComponentControl asks a ComponentAssessment what the results of its ComponentAttestations were. |
| Detective Control | A control that records that a qualifying event has taken place, usually with a view to following up with a check that the event was valid. |
| DORA | Digital Operational Resilience Act Digital Operational Resilience Act (DORA) - Regulation (EU) 2022/2554|
| FINOS | Fintech Open Source Foundation |
| GRC | Governance, Risk and Control |
| Assessment | A specific Implementation of a Control, eg a cronjob that kills any processes that listen on port 22 every minute might implement a Reactive Control.|
| KRI | Key Risk Indicator: a metric for measuring the probability of an event and its consequences will exceed the organisation's risk appetite |
| OSCAL | Open Security Controls Assessment Language OSCAL - Open Security Controls Assessment Language |
| Preventative Control | A Control that prevents an event from taking place, eg an organisational policy that prevents an S3 bucket being exposed to the internet. |
| Reactive Control | A Control that takes corrective action when an event takes place, eg shutting down a VM that has attached an unencrypted disk. |
| Requirement | See Control |
| RPO | Recovery Point Objective |
| SMF24 | |
| Senior Management Function 24 | the person in an organisation held responsible for operational failings. |
| Variance | |


### Internal Architecture Glossary
These terms are when we refer to the internal architecture that composes Compliance Framework. We should stick to it to not make our lives harder

| Name | Definition |
| ---- | ---------- |
| Assessment | A specific Implementation of a Control, eg a cronjob that kills any processes that listen on port 22 every minute might implement a Reactive Control.|
| Attestation | Recorded evidence that a control has been implemented |
| AttestationProvider | The external piece of software that performs the actual attestation, eg ssh, checkov |
| Controls | Policies and procedures designed to ensure systems are secure and/or stable and/or resilient. (aka Requirement) |
| Component | Entity that is the subject of a Control, eg a Virtual Machine instance. A Component's status is made up of collective results of ComponentRequirements pertaining to that Component. |
 System| A C4 system is the highest level of abstraction and describes something that delivers value to its users, whether they are human or not. A system has many containers and relationships between them. A system is something like a web site, mobile app, desktop application, database, file system, etc.|
 Container | A C4 container is something that needs to be running in order for the overall system to work. A container is something like a web server, application server, mobile app, desktop app, database schema, file system, etc.|
 Service | The equivalent of the C4 Component. We are not using Component explicitly in order to not confuse with Business Logic Component naming.
 Assessment Runtime | The container responsible for running AttestationJobs for Assessments. |
 RuntimePublisher | The Assessment Runtime service responsible for publishing new events to the Event Hub.
 RuntimeKeepalive | The Assessment Runtime service responsible for keeping the Runtime alive within the Compliance Framework.
RuntimeJobManager | The Assessment Runtime service responsible for managing new AttestationJobs.
RuntimeJobRunner | The Assessment Runtime service responsible for running a given Attestation Job, and Publishing its results.
RuntimeJobRunner | The Assessment Runtime service responsible for running a given Attestation Job, and Publishing its results.
RuntimeConfSync | The Assessment Runtime service responsible for keeping the backend configuration synchronized with the Assessment Runtime. 
RuntimeConfStore |  The Assessment Runtime service responsible  for storing in Memory the current configuration of the backend.
pluginExecutable |  The Assessment Runtime service responsible  for specific business logic on how to perform a given attestation type. Contains the logic defined on the Attestation Provider.
 Configuration | The container responsible for maintaining the Business Logic Configuration. Mostly a CRUD on Components,Controls,Assessments, and Attestations.
 Dashboard | The container responsible for providing queries and views for Dashboard UI. This is the backing service for a dashboard view for users.
 Dashboard UI | The User Interface to view and manage Compliance tasks. Contains different views and metrics for users.
