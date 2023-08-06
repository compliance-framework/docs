---
sidebar_label: Event Bus
---

# Event Bus
Event Bus serves as the primary repository for all assessment results, with data published as events. This central hub of truth for assessment outcomes plays a vital role in maintaining and managing a constant stream of information. Utilizing an event bus in this manner offers several distinct advantages:

* **Decoupling:** The Event Bus separates the core from the ceaseless influx of assessment results, adhering strictly to the Single Responsibility Principle. This ensures the core isn't overwhelmed by ongoing data flows and can focus on its main tasks effectively.
* **Real-Time Analytics:** The Event Bus allows event consumers to transform the stored data into a format suitable for presentation in real-time analytics dashboards. The Assessment Results Consumer component takes the lead in analyzing this data, feeding the main database with the results and providing an instantaneous snapshot of the assessment's state.
* **Flexible Reporting:** With the help of metrics consumers, the Event Bus allows the transformation and export of data to various platforms, such as Prometheus and the ELK stack. This facilitates further data processing and customization of reports with tools like Kibana and Grafana.
* **Scalability & Resilience:** By adopting the event bus model, the application gains another layer of scalability and resilience. It enables a more efficient handling of increasing data loads and provides robustness against potential disruptions.
* **Unified Data Store:** The Event Bus creates a central data store, enabling the creation of new reporting platform integrations. This unified hub simplifies data access, facilitating efficient development and deployment of additional reporting tools.
