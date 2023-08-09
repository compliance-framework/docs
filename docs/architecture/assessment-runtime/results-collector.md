# Results Collector

The Results Collector is responsible for collecting all the observations from the Assessment Action Jobs and processing them to generate metrics and other analysis results.

1. The flow begins with the **Job Manager** sending a request to the ****Job Runner**** to run a specific job.
2. Upon receiving the request, the ****Job Runner**** proceeds to provide the necessary context to the **Assessment Action Job**.
3. The **Assessment Action Job** is executed and runs the compliance checks against the target component.
4. The **Assessment Action Job** then passes these observations to the **Results Collector**.
5. The **Results Collector** takes the observations and processes them internally. This may involve interpreting, analyzing, or organizing the information.
6. The **Results Collector** continues its internal operations by generating metrics based on the processed observations. These metrics could represent various measurements or analytics related to the assessment.
7. The **Results Collector** then communicates with the **Event Bus Client**, passing the generated metrics.
8. Finally, the **Event Bus Client** takes the received metrics and publishes them as events on the **Event Bus**.


```mermaid
sequenceDiagram
    participant JM as Job Manager
    participant JR as Job Runner
    participant AAJ as Assessment Action Job
    participant RC as Results Collector
    participant EBC as Event Bus Client
    participant EB as Event Bus

    JM ->> JR: Run Job
    JR ->> AAJ: Provide Context
    AAJ ->> AAJ: Run & Generate Observations
    AAJ ->> RC: Pass Observations
    RC ->> RC: Process Observations
    RC ->> RC:  Generate Metrics
    RC ->> EBC: Pass Metrics
    EBC ->> EB: Publish Metrics Events
```

In summary, the **Results Collector** is central to the process of managing observations from the **Assessment Action Job**s and transforming them into meaningful metrics. It facilitates the flow from task execution to event publication, enabling the analysis of assessment results. This sequence is part of a broader system where the **Results Collector** acts as a bridge between the job execution components and the metrics platform, leading to the distribution of valuable insights.