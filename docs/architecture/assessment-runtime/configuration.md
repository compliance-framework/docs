# Configuration Manager

The Configuration Manager is a designed to manage the synchronization between the local configuration and the Configuration Service running in the Control Plane. Its primary role is to ensure that the local system's settings align with those maintained by the Configuration Service. To enable this, the Configuration Manager retrieves the necessary configuration data from the Configuration Service and then stores it locally in the Configuration Store.

## Configuration<->Assessment Sequence Diagrams
How does a Job Spec gets generated:
```mermaid
flowchart LR
    control --> component
    control --> component2
    component2 --> assessment
    component --> assessment
    assessment --> attestation
    assessment --> attestation2
    attestation --> attestationjobSpec1
    attestation2 --> attestationjobSpec2
    component -.-> attestationjobSpec1
    component -.-> attestationjobSpec2
```

Sequence Diagram for updating the database
```mermaid
sequenceDiagram
    User ->> Configuration: update configuration (component, new control, etc)
    Configuration ->> DB: updates  
    DB ->> Configuration: updated
    jobSpec ->> DB: Queries
    jobSpec ->> jobSpec: renders job specs  
    jobSpec ->> DB: updates job specs  
    DB ->> Configuration: updated
```

Sequence Diagram for the Assessment Runtime to get more jobs
```mermaid
sequenceDiagram
    AssessmentRuntime ->> Configuration: gimme X job specs
    Configuration ->> DB: get job specs where runtime_id is null limit x
    DB ->> Configuration: response
    Configuration ->> AssessmentRuntime: Your Job Specs
    Configuration ->> DB: update job specs where id = [x] runtime_id = <assessment_id>
    DB ->> Configuration: response

```
Because Users can cause a change to the job specs, we need to have a specific flow for checking if the current job specs are still valid and/or changed. The proposed workflow would be something like this:
```mermaid
sequenceDiagram
    AssessmentRuntime ->> Configuration: gimme my job specs
    Configuration ->> DB: get job specs where runtime_id is assessment_id
    DB ->> Configuration: response
    Configuration ->> AssessmentRuntime: Your Job Specs
    AssessmentRuntime ->> AssessmentRuntime: delete old job spec from config

```