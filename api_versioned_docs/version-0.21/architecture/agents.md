---
sidebar_position: 2
sidebar_label: Agent
---

import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';

# Compliance Agents

The Continuous Compliance Framework Agent is a lightweight scheduler and orchestrator for compliance plugins. It is used 
as a way to collect information about specific systems, compare them with regulatory and internal policy, and then pass 
the resulting information to the Central API.

<ThemedImage
    alt="Architecture Diagram showing the Continuous Compliance Agent"
    sources={{
        light: useBaseUrl('img/CCFAgentPluginLight.png'),
        dark: useBaseUrl('img/CCFAgentPluginDark.png'),
    }}
/>

CCF is not limited to only accepting information from its agent. CCF can accept information from any source that 
conforms to its API, making it extendable beyond the use of the Agent. 

However, the agent brings with it some features which may be of interest. 

## Responsibilities

The CCF agent has a few main responsibilities.

### Running plugins

First and foremost, the agent runs compliance plugins, which verify the continuous compliance of system components. 
For more information on CCF Plugins, refer to [Plugins](./plugins)

It does this using the same system used by Hashicorp for Terraform Providers: https://github.com/hashicorp/go-plugin

### Scheduling

Some regulatory controls require regular validation. Besides, it wouldn't be continuous compliance if we didn't 
continuously validate compliance.

The agent is configured with a schedule for each of its plugins and policies, and will execute each plugin in turn
when it is scheduled to. This ensures the continuous collection of compliance data, and allows us to give early signals
when a component is out of compliance.

### Security

The agent is also responsible for ensuring that the plugins are executed in a safe environment, preventing the plugins
from taking malicious actions within your environment. 

### Updating Plugins and Policies

On each iteration, the agent will check the plugin and policy registry for new versions and download any newer versions
which match it version requirements. This makes it incredibly simple to update plugins and policies, and have all the
deployed agents report compliance using them on their next scheduled run. 

The plugins and policies are distributed using your existing OCI registry. If you're unsure whether you have an OCI
registry, chances are you already have one. If you run any sort of container, we use the same registry. 

## Intended Use

The CCF agents are intended to be used purely as orchestrators for plugins, pushing information to the API. 

They are intended to run in a specific context, collecting information about a specific component or grouping of 
components. 

As guidance for how we see them being run, here are a few examples: 

### On Servers, virtual machines or bare metal

The agent, along with security plugins can be used to continuously verify the configuration of specific hosts, 
and report this information as compliance data. 

A single agent could for example:
* Verify the SSH configuration on a host is secure
* Verify the firewall is configured correctly, and doesn't open necessary ports
* Scan authentication logs to ensure only authorised access
* Ensure RAID configurations are correctly configured and running properly
* Ensure vulnerabilities are monitored and mitigated
* Ensure filesystem are encrypted, and access is correctly configured
* Ensure disk usage remains below dangerous levels
* Ensure backups are created each day

Each machine in your fleet can run this agent and configuration, and all the information can be used as part of a
holistic compliance report. Each check is completed via a plugin that has specific knowledge about the subsystem being 
verified. 

The agent schedules each of these checks individually based on your needs, and ensures that they are checked at least 
that often.

### In CI/CD

The agent can be used during CICD in single-execution mode to:
* Report Code Security scans (SCA, SAST, DAST),
* Report Open Source License Compliance scans
* Report the results for quality scans (Sonarqube)
* Report IaC, Container, and Software Image scans (Snyk, Gitlab, Wiz)
* Report SBOMs (Software Bill Of Materials)

These can be used during CICD to add rich data, which can later be used in compliance reporting. You can also schedule
this agent configuration to be run periodically through your Version Control system. 

### Testing Cloud Configurations

The agent can be used to verify the Cloud Configuration of different teams within your org, to ensure all components
are compliant with regulatory constraints. 

A single agent could:
* Verify that all resources are labelled for data sensitivity
* Ensure all resource are deployed in private network configurations
* All database instances have encryption properly configured, and are deployed with engine specific security features
* Ensure all security groups and firewalling is configured correctly
* Check for elevated privileges

## Conclusion

The Compliance agent is a versatile piece of software, capable of being used to collect information from an incredibly
wide range of sources, and compiling them into OSCAL-ready assessment artifacts, to continuously and automatically
gather evidence of regulatory compliance.
