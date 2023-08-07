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
