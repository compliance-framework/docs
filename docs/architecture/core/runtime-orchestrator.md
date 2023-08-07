# Runtime Orchestrator

The Runtime Orchestrator orchestrates the creation, deletion, and monitoring of assessment runtimes. It communicates with the event bus to create credentials and provide IDs for any runtime that wants to connect. A cleanup mechanism is also included, utilizing a "healthz" style of uptime monitoring to ensure that the assessment runtimes remain active.
