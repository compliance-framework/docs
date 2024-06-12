import DocCardList from '@theme/DocCardList';
import CFArchImageUrl from '@site/static/img/CFArch.drawio.svg';

# Architecture of Compliance Framework

This architecture represents a distributed, event-driven system designed to monitor and report real-time compliance across multiple environments, such as Azure and on-premise networks. It leverages the OSCAL model proposal and encompasses an assessment runtime for compliance checking and an event bus for communication.

<CFArchImageUrl />;

The assessment runtime, capable of being deployed anywhere based on requirements, conducts compliance checks and publishes results to an event bus through an app gateway. The gateway provides an additional layer of protection and control, allowing secure and controlled communication with the event bus.

The backend API server processes these events and generates real-time dashboard reports, which are displayed through a React-based dashboard. The system is designed for scalability, resilience, and real-time processing, ensuring efficient handling of compliance monitoring tasks in various deployment environments.

## Main Components of the Design

<DocCardList />
