# Job Manager and Job Runner 

Job Manager and Runner are the abstraction responsible to run Attestations. Job Manager is responsible for managing Job Specs and actually verifying how much new specs it can handle, and request them to the Configuration. It also starts Jobrunner instances, according to its queue. Job Runner is responsible for running a given plugin and collect its results and for posting AttestationResults back to the Event Hub.

---

```mermaid
sequenceDiagram
    participant CM as ConfigurationManager
    participant JM as JobManager
    participant PM as PluginManager
    participant JR as JobRunner
    participant RM as ResourceMonitor

    JM->>CM: read_configuration(config)
    JM->>PM: init_plugins(plugin_urls)
    loop Downloading Plugins
        PM->>PM: download_plugin(url)
    end
    loop Configuration Monitoring
        CM->>JM: get_configuration_updates()
        alt Configuration Changed
            JM->>JM: apply_changes(changes)
            alt Job Cancelled
                JM->>JR: cancel_job(job_id)
            end
            alt New Job Added
                JM->>JM: add_new_job(new_job)
            end
        end
    end
    loop Job Scheduling
        JM->>JM: schedule_job(job)
        JM->>RM: has_enough_resources(memory, cpu)
        alt Enough Resources
            JM->>PM: instantiate_plugin(plugin_path)
            JM->>JR: create_job_runner(plugin_instance, context)
            JR->>PM: run_plugin(plugin_instance, context)
            JR->>JR: get_observations()
            JM->>RM: start_monitoring_job(job_id)
            loop Monitoring Job Resources
                RM->>RM: get_job_memory_usage(job_id)
                RM->>RM: get_job_cpu_usage(job_id)
            end
            JM->>RM: stop_monitoring_job(job_id)
        else Not Enough Resources
            JM-->>JM: Delay job
        end
    end
    loop Global Resource Monitoring
        RM->>RM: get_memory_usage()
        RM->>RM: get_cpu_usage()
    end
```

---

### Components:

**Configuration Manager (CM)**: Responsible for managing the configuration of the system, including jobs, plugins, and other settings.

**Job Manager (JM)**: Responsible for scheduling jobs, handling configuration changes, including job cancellations and additions, and coordinating the other components.

**Plugin Manager (PM)**: Responsible for downloading and managing plugins that are executed by the Job Runners.

**Job Runner (JR)**: Responsible for running individual plugins with a given context and collecting observations (results) from the plugins.

**Resource Monitor (RM)**: Continuously monitors global and individual job memory and CPU usage.

---

### Sequence Flow:

1. **Initialization**:
   - **Job Manager** read the initial configuration from **Configuration Manager**.
   - **Job Manager** requests **Plugin Manager** to download and initialize all required plugins.

2. **Configuration Monitoring Loop**:
   - **Configuration Manager** continuously checks for configuration updates and notifies **Job Manager** if changes occur.
   - **Job Manager** applies the changes accordingly, which can include:
     - Canceling existing jobs through **Job Runner**.
     - Adding new jobs to the scheduling queue.

3. **Job Scheduling Loop**:
   - **Job Manager** schedules jobs from the queue, continuously checking with **Resource Monitor** if enough memory and CPU resources are available.
   - If resources are sufficient:
     - **Job Manager** instantiates the plugin through **Plugin Manager**.
     - **Job Manager** creates a **Job Runner** instance, passing the instantiated plugin and context.
     - **Job Runner** runs the plugin through **Plugin Manager**, providing context, and retrieves observations.
     - **Job Manager** starts monitoring the job through **Resource Monitor**.
     - **Resource Monitor** monitors the individual job's memory and CPU usage until **Job Manager** stops monitoring.
   - If not enough resources are available, the job is delayed.

4. **Global Resource Monitoring Loop**:
   - **Resource Monitor** continuously monitors the global memory and CPU usage of the system.
