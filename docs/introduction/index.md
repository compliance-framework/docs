---
sidebar_position: 1
sidebar_label: The Continuous Compliance Framework
---

# What is The Continuous Compliance Framework?

The Continuous Compliance Framework (CCF) is an open source, automated compliance testing and reporting system designed 
to help organizations continuously assess their adherence to regulatory standards such as NIST SP 800-53, SOC 2, 
PCI DSS, and GDPR. It integrates policy-based compliance checks, real-time monitoring, and structured reporting to 
streamline the traditionally manual and periodic audit processes.

CCF aims to simplify compliance challenges and promote continuous verification and collaboration within the governance, 
risk and control (GRC) community. CCF contributors are constantly engaged with the OSCAL, CNCF Compliance, and NIST 
working groups to build the future of automated compliance and reporting.

## Key Features

### Open Source

CCF is Open Source.

### Automated, Continuous Compliance Verification

CCF enables organisations to continuously, and automatically collect evidence and validate compliance against regulatory 
security & operational requirements, reducing the manual effort involved in compliance reporting.

Real-time notifications and alerts allow fast response to requirement drifts.

### Centralized Compliance API

Powered by MongoDB, it acts as the single source of truth for compliance data.

### Open To Extension

The CCF API accepts OSCAL-compliant data from anywhere. This allows your favourite tools to send compliance-related 
information to it, and include it as part of your overall compliance reporting.

This makes it easy to integrate with third party tools such as 
* Cloud Service Providers
  * AWS
  * Azure
  * GCP
  * Alibaba
  * Oracle
  * etc.
* Container Runtimes
  * Kubernetes
  * etc.
* Version Control Systems
  * Github 
  * Gitlab
  * etc.
* Container Vulnerability Scanners
  * Clair
  * Trivy
  * Docker
  * etc.
* Infrastructure Security Scanners
  * Terraform
  * Gitlab
  * Snyk
* Open Source Software and License compliance scanners (SCA, SAST, DAST, etc.)
  * Sonarqube, 
  * Gitlab, 
  * Snyk, 
  * Blackduck, 
  * etc.

### Pluggable GRPC Architecture

CCF agents are lightweight, plugin-based programs which collect compliance information continuously, validate them
against code-based policies, and report the results to the central CCF API.

The plugin-based system enables easy creation of new types of compliance checks and validations, making it simple to
add more diverse data to the final compliance footprint.

### Policy as Code

CCF uses Rego from OPA, and Kyverno-JSON as policy engines to validate the information collected by plugins.
This allows organisations to continuously and iteratively manage their organisation policies, and directly map these
to regulatory controls for easy reporting to auditory bodies.

### OCI capable plugins and policies

CCF supports staged rollouts of compliance policies and plugins via OCI registries, ensuring smooth adoption of updates.

### OSCAL-Compliant Reporting

Generates structured compliance reports in NIST's OSCAL format which can be directly shared with auditory bodies to 
verify regulatory compliance, and manage the full GRC lifecycle.

- Real-time compliance dashboards
- Comprehensive compliance reports
- Automation of reporting and auditing processes
- Export of compliance data and reports in PDF and OSCAL format
