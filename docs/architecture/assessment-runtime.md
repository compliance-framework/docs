# Assessment Runtime

Assessment Runtime is a robust application, developed using Go, designed to execute and manage assessment providers in the form of binaries. It serves as a crucial interface between these providers and the Compliance Framework control plane, orchestrating assessments and channeling results back to the control plane for thorough analysis.

<iframe src="https://s.icepanel.io/XZjDErdNZMZBJ0/YjLQ" height="800" width="1200" title="Compliance Framework Architecture" style={{borderRadius: '16px', border: 'none'}}></iframe>

The core components of Assessment Runtime include:

**Configuration:** The configuration component is tasked with synchronizing the runtime's settings with those of the control plane. It pulls the latest configurations from the control plane and applies them to the local configuration store, thereby maintaining a unified setup.

**Scheduler:** The scheduler regulates the execution of the assessment providers. It initiates provider tasks according to predefined intervals or in real-time, guaranteeing consistent assessment cycles.

**Provider Manager:** Functioning akin to a Terraform repository, the provider downloader retrieves the providers from a central repository. This component assures the availability of the most recent and relevant assessment providers to be run by the runtime.

**Job Runner:** This component provides the required context for the providers, including the configuration and potentially additional information about the component under assessment. It sets up the ideal environment for provider operation, enabling them to function optimally.

**Provider Store:** The provider store component is a local storage system for all downloaded providers. While the implementation details for the storage of the WASM modules are yet to be determined, this component ensures a local repository for seamless access to providers.

**Heartbeat:** This heartbeat component provides real-time health check information to the Argus control plane. It ensures that it is available and operating in accordance with its configured parameters.

**Results Collector:** The Results Collector component plays a key role in ensuring that the results of the assessments conducted by the providers are accurately aggregated and communicated back to the Argus control plane. It collects the output from each provider post-assessment and relays it to the control plane via the application gateway. This guarantees that the control plane is always informed of the latest assessment outcomes, facilitating timely and informed decision-making.

:::note

Recognizing the potential scenarios where using the Assessment Runtime may not be feasible or not preferable, for instance when creating an assessment provider with Azure Functions, we might provide more flexibility. Key functionalities of the runtime could be made available as standalone libraries, compatible with various runtimes. This approach ensures that our suite of tools can be integrated into diverse setups, thereby maintaining the efficiency and utility of the Assessment Runtime environment across a broad range of application scenarios.

:::
