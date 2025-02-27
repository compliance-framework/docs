---
sidebar_position: 3
sidebar_label: Policies
---

import DocCardList from '@theme/DocCardList';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';

# Compliance Policies

CCF makes assertions against the data collected by plugins, by using policies written in OPA, and soon Kyverno-JSON.

This makes it flexible for organisations to write their own policies to verify their compliance, and expand on their 
implementation to support a full compliance report.

## Policy extension

CCF allows additional detail to be added within policies to enrich the generated compliance results. CCF goes beyond
just `pass` or `fail` and enables policy authors to add details like risks, steps, controls and components validated
by a specific policy. 

This allows data-rich policies which map incredibly well to the ultimate compliance reports, and allows adding all 
the minute details required by auditory bodies. 

An example of this is stating exactly what was validated, and how. CCF allows these details to be added directly in 
its policy files, so each execution has all the necessary detail to fulfill auditory reporting requirements.  

## Responsibilities

### Compliance validation

After CCF Plugins have gathered the necessary details about subsystems and converted them into JSON objects, they pass
this information to the CCF policies to verify their contents are within compliance constraints. 

### Adding compliance metadata

CCF policies contain all the minute details which inform a final compliance report. Auditors often have hefty 
requirements for the amount of information which needs to be included in a final report. CCF Policies allow you to add
all of these details at the policy level, and never have to manually fill in reports again. 
