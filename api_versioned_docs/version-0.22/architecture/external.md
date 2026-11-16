---
sidebar_position: 4
sidebar_label: External Integration
---

import DocCardList from '@theme/DocCardList';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';

# External Integration

To support a full compliance lifecycle, CCFs' API is open-to-extension for external tooling. 

We know that our agent isn't always going to have the answer to specific compliance needs, and therefore allow any 
authorized and authenticated systems, to send us additional compliance information via the CCF API. Our API conforms to 
the OSCAL-schema, so all data sent is supported by open standards. 

We do however require additional information to be added for compliance results to support CCFs' search and monitoring 
capabilities. OSCAL doesn't provide these capabilities as part of its schema, nor should it. We do however want to 
make the CCF as useful and valuable as possible, and therefore have some additional requirements above and beyond just 
compliance results. 

## Swagger

Our API is documented by an OPENAPI spec for external integrations. This can be viewed at `/swagger/index.html`. 
