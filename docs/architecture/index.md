import DocCardList from '@theme/DocCardList';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';



# Architecture of Compliance Framework

CCF collects compliance information from a wide range of sources, and compiles them into a single, holistic compliance view. 
CCF is designed with the express purpose of being distributed, to avoid centralised and elevated access.

Tiny agents and collectors, responsible for continuously verifying the compliance of specific components within a system, feed compliance information into the
central reporting API. Compliance information can then be inspected through the CCF UI, 
and ultimately exported to an OSCAL document, which can be sent to auditors as compliance documentation.

<ThemedImage
    alt="High Level Architecture Diagram of the Continuous Compliance Framework"
    sources={{
        light: useBaseUrl('img/CCFHighLevelLight.png'),
        dark: useBaseUrl('img/CCFHighLevelDark.png'),
    }}
/>

The CCF API is open-to-extension, and can therefor accept additional compliance information from external sources to 
compliment the overall compliance report, and generate a more complete view of compliance across the business. 

CCF aims to be as extensible as possible, allowing compliance information and verification to be sent from 
wherever you need.

## API

The CCF API mostly conforms to the OSCAL schema, allowing a standardised way of sending additional compliance information, 
in a format that is defined by auditors and regulatory assessors. 

CCF adds a few additional fields and values to the OSCAL schema, to make it more automatable and accessible to automation engineers.

## Plugins

The plugin system is designed to make CCF as extensible as possible. Plugins are responsible for gathering information about 
specific systems and configurations, and making this information available to the policy engine for verification. 

A simple example of this is ensuring everybody in the organisation has 2 factor authentication enabled. 

The plugin is responsible for collecting the configuration from an authentication provider like Google or SSO. 

## Policies

Policies verify that the information collected by plugins, are compliant. Policies are written in the CNCF-Graduated, Open Policy Agent language, Rego. 

Once information has been collected by the plugin for the system under test, the policies verify that the information is correct according to company policies. 

In our example, ensuring that `2fa-enabled` is set to `true` for all users. 

The plugin then sends the compliance information to the reporting API for inspection. 

## Agents

The CCF Agent is a lightweight orchestrator, updater and scheduler of plugins.

When running an agent, you may specify a schedule for each plugin and policy. The agent will ensure that the plugin and policies are
run according to that schedule. The agent is also responsible for updating plugins and policies when new versions become 
available (more on this later), and limiting the capabilities which the plugins are allowed to (similar to containers). 

The architecture of the CCF agent means it's access can be limited to very specific systems, and the CCF doesn't need 
elevated access to an entire system for compliance checks. Our agent is also capable of being deployed on smaller devices like
sensors, IOT devices, and unreliably connected hardware, and will continue to verify compliance, and report to the API once a connection 
is established.

## API SDK

The CCF API is open-to-extension. Any external system is capable of sending compliance information to the reporting API, 
as long as it conforms to the API structure and has been authorized and authenticated. 

CCF publishes a Golang SDK to make this integration as simple as possible. 

## Main Components

<DocCardList />
