---
sidebar_label: Diagrams
---

# Assessment Result Consumer
```mermaid
sequenceDiagram
    participant MongoDB
    participant MetricsDB
    participant ResultConsumer
    participant EventBus
    participant AssessmentRuntime
    AssessmentRuntime ->> EventBus: Pub AttestationResults
    ResultConsumer ->> EventBus: Consume AttestationResults
    ResultConsumer ->> ResultConsumer: Generate Metrics [talk to config?]
    ResultConsumer ->> MongoDB: Save AttestationResults
    MongoDB ->> ResultConsumer: OK
    ResultConsumer ->> MetricsDB: Save Metrics
    MetricsDB ->> ResultConsumer: OK
```

:::caution

There is an issue here whjich is the cost to understand the scenario to properly create the metrics. This could be solved by an update on the Configuration diagrams to also include a responsibility on the configuration to generate a Metrics Plan, and a separate endpoint to add metrics according to the metrics plan.
This needs to be done to a specific service, otherwise it is going to be computationally heavy to update metrics on the configuration (?)

:::

Optionally, the metrics folder might have a second consumer:
```mermaid
sequenceDiagram
    participant MetricsDB
    participant Configuration
    participant MetricsConsumer
    participant EventBus
    participant AssessmentRuntime
    AssessmentRuntime ->> EventBus: Pub AttestationResults
    MetricsConsumer ->> EventBus: Consume AttestationResults
    MetricsConsumer ->> Configuration: Get Context
    Configuration ->> MetricsConsumer: Context
    MetricsConsumer ->> MetricsConsumer: Generate Metrics 
    MetricsConsumer -->> MetricsDB: Save Metrics
    MetricsDB -->> MetricsConsumer: OK
    MetricsConsumer -->> MetricsConsumer: Update Metrics (prometheus)
```