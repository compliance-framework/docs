# Job Manager and Job Runner 
Job Manager and Runner are the abstraction responsible to run Attestations. Job Manager is responsible for managing Job Specs and actually verifying how much new specs it can handle, and request them to the Configuration. It also starts Jobrunner instances, according to its queue. Job Runner is responsible for running a given plugin and collect its results and for posting AttestationResults back to the Event Hub.
#### JobManager workflow
```mermaid
sequenceDiagram
box AssessmentRuntime
    participant RuntimeJobRunner
    participant RuntimeJobManager
    participant RuntimeConfStore
    participant RuntimeConfSync
end
participant Configuration
    loop Every <config_sync_interval>
    RuntimeConfSync ->> Configuration: "GET /config/jobSpecs/diff/<uuid>"
    Configuration ->> RuntimeConfSync: "jobSpecs"
    RuntimeConfSync ->> RuntimeConfStore: update Job Specs
    end
    loop Every <job_run_resync_interval>
    RuntimeJobManager ->> RuntimeConfStore: get Job Specs
    RuntimeJobManager ->> RuntimeJobRunner: stop changed jobs
    RuntimeJobManager ->> RuntimeJobRunner: async start new jobs
    RuntimeJobRunner ->> RuntimeJobRunner: JobRunner Workflow
    end
```

#### JobRunner workflow
```mermaid
sequenceDiagram
participant pluginStore
box AssessmentRuntime
    participant RuntimePublisher
    participant RuntimeJobRunner
    participant pluginExecutable
end
participant CFComponent
    RuntimeJobRunner --x pluginStore: [Optional] - Download plugin
    loop Every <job_spec_interval>
    RuntimeJobRunner ->> pluginExecutable: execute
    pluginExecutable --> CFComponent: Attest
    CFComponent --> pluginExecutable: AttestationResult
    pluginExecutable ->> RuntimeJobRunner: AttestationResult
    RuntimeJobRunner ->> RuntimePublisher: Instantiates with UUID
    RuntimeJobRunner -->> RuntimePublisher: Publish AttestationResult
    activate RuntimePublisher
    RuntimePublisher -->> RuntimeJobRunner: SUCCESS
    deactivate RuntimePublisher
    end
```

:::note
Plugin cycle should not be part of this flow, we need to separate it as stated in https://github.com/compliance-framework/website/issues/11
:::
