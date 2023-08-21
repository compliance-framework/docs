---
sidebar_label: ERD
---

# Entity Relationship Diagrams for Configuration

The purpose of this diagram is to give a high-level view (with no details on fields) of the main entities in the configuration service, which should connect to OSCAL.

### Full OSCAL diagram
```mermaid
erDiagram
    ControlCatalog ||--}| ControlProfile: superset
    Control }|--|| ControlProfile : set
    SystemSecurityPlan }|--|{ ControlProfile: implements
    Component }|--|{ SystemSecurityPlan: partOf
    AssessmentPlan }|--|| SystemSecurityPlan: assess
    Assessment }|--|| AssessmentPlan: partOf
    AssessmentResults }|--|| Assessment: assessmentPhotography
    Attestation }|--|| AssessmentResults: associatedAttestation
    Risk }|--|| AssessmentResults: associatedRisk
```
Note: `Assessment` is not formally defined on OSCAL, but it is a logical entity that is used to group Assessments whether they have produced a result or not.

### Minimal Diagram (similar to PoC)
```mermaid
erDiagram
    Control }|--|{ Component: mustComply
    Assessment }|--|{ Component: verifies
    Assessment }o--|| Control: verifies
    Assessment ||--o{ Attestation: photo
    Assessment ||--o{ Risk: photo
```

### ER Diagram for OSCAL Metadata

```mermaid
erDiagram
    Metadata {
        string Title
        datetime LastModified
        string Version
        string OscalVersion
    }
    Revision {
        string Title
        datetime Published
        datetime LastModified
        string Version
        string OscalVersion
    }
    Role {
        string Title
        string ShortName
        string Description
    }
    Party {
        string Name
        string ShortName
    }
    ContactInformation {
    }
    Property {
    }
    ResponsibleParty {
    }

    Metadata ||--o{ Revision : Revisions
    Metadata ||--o{ Role : Roles
    Metadata ||--o{ Party : Parties
    Metadata ||--o{ ResponsibleParty : ResponsibleParties
    Revision ||--o{ Property : Properties
    Role ||--o{ Property : Properties
    Party ||--o{ ContactInfomation : ContactInformation
    ResponsibleParty ||--o{ Role : Role
    ResponsibleParty ||--o{ Party : Party
```

### ER Diagram for Control Catalog

```mermaid
erDiagram
    Catalog {
        string ID
        string Title
        string Description
        Parameter[] Parameters
        Control[] Controls
        Group[] Groups
    }
    Control {
        string ID
        string Title
        string Description
        Parameter[] Parameters
        Part[] Parts
        Property[] Properties
        Control[] Controls
    }
    Group {
        string ID
        string Title
        string Description
    }
    Parameter { 
        string ID
        string Name
        string Description
        string Values
    }
    Part {
        string ID
        string Name
        string Prose
    }
    Property {
        string Name
        string Value
    }
    BackMatter {
        string ID
    }
    Resource {
        string Title
        string Description
        string URL
    }
    
    Catalog ||--o{ Control : contains
    Group ||--o{ Control : groups
    Catalog ||--o{ BackMatter : has
    Catalog ||--o{ Parameter : has
    Group ||--o{ Parameter : has
    Group ||--o{ Property : has
    Group ||--o{ Part : has
    Control ||--o{ Parameter : has
    Control ||--o{ Property : has
    Control ||--o{ Part : has
    BackMatter ||--o{ Resource : contains

```