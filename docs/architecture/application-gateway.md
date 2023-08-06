---
sidebar_label: Application Gateway
description: Runtime and event bus bridge
---

# Application Gateway

The Application Gateway operates as a secure and efficient liaison between the assessment runtimes and the main event bus. It performs a range of crucial tasks that keep the communication between these components smooth, secure, and efficient.

* **Authentication and Routing:** The Application Gateway is responsible for authenticating and validating messages from the assessment runtimes. It then strategically routes these messages to their appropriate destinations.
* **Event Publishing:** One of its key tasks involves publishing events originating from the assessment runtimes to the main event bus, ensuring a steady and reliable flow of data.
* **Security:** The Application Gateway enhances the application's security architecture by implementing additional layers of protection. These safeguards can range from API keys, OAuth tokens to JWT validation, helping protect sensitive data and mitigate potential threats.
* **Message Validation:** An essential responsibility of the Application Gateway is to ensure the integrity and validity of the messages flowing through it. This involves vetting the events arriving from the assessment runtimes, checking their compliance with system requirements and ensuring they are acceptable for further processing.

### Assessment Runtime

Assessment Runtime is a robust application, developed using Go, designed to execute and manage assessment plugins in the form of WebAssembly (WASM) modules. It serves as a crucial interface between these plugins and the Argus control plane, orchestrating assessments and channeling results back to the control plane for thorough analysis.

The core components of Assessment Runtime include:

* **Authentication:** This foundational component establishes secure communication with the Argus control plane, handling the task of authenticating the runtime using keys or certificates issued by the control plane.
* **Configuration:** The configuration component is tasked with synchronizing the runtime's settings with those of the control plane.
* **Scheduler:** The scheduler regulates the execution of the assessment plugins. It initiates plugin tasks according to predefined intervals or in real-time, guaranteeing consistent assessment cycles.
* **Plugin Downloader:** Functioning akin to a Terraform repository, the plugin downloader retrieves the WASM module-based plugins from a central repository.
* **Plugin Runner:** This component provides the required context for the plugins, including the configuration and potentially additional information about the component under assessment.
* **Plugin Store:** The plugin store component is a local storage system for all downloaded plugins.
* **Results Collector:** The Results Collector component plays a key role in ensuring that the results of the assessments conducted by the plugins are accurately aggregated and communicated back to the Argus control plane.

Recognizing the potential scenarios where using the Assessment Runtime may not be feasible or not preferable, for instance when creating an assessment plugin with Azure Functions, we might provide more flexibility. Key functionalities of the runtime could be made available as standalone libraries, compatible with various runtimes. This approach ensures that our suite of tools can be integrated into diverse setups, thereby maintaining the efficiency and utility of the Assessment Runtime environment across a broad range of application scenarios.
