---
sidebar_position: 2
sidebar_label: What is Compliance Framework?
---

# The Continuous Compliance Framework

The Continuous Compliance Framework (CCF) is an open source, automated compliance testing and reporting system designed 
to help organizations continuously assess their adherence to regulatory standards such as NIST SP 800-53, SOC 2, 
PCI DSS, and GDPR. It integrates policy-based compliance checks, real-time monitoring, and structured reporting to 
streamline the traditionally manual and periodic audit processes.

CCF aims to simplify compliance challenges and promote continuous verification and collaboration within the governance, 
risk and control (GRC) community. CCF contributors are constantly engaged with the OSCAL, CNCF Compliance, and NIST 
working groups to build the future of automated compliance and reporting.

## At a high level

Distributed, lightweight compliance collectors, collect information from all over the business, compile them into an 
[OSCAL](https://pages.nist.gov/OSCAL/)-compliant format, and send them to a central compliance API.

The CCF UI is used to inspect the results flooding into CCF, compile them into assessment groups and reports, and build 
dashboards for continuous monitoring of controls. 

The Central API compiles all the ingested results into a complete OSCAL document, which is used to continuously 
report compliance information to auditory bodies.

[Introduction](./introduction)
