---
sidebar_label: ERD
---

# Entity Relationship Diagrams for Configuration

The purpose of this diagram is to give a high-level view (with no details on fields) of the main entities in the configuration service, which should follow the OSCAL model where possible.

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

    Catalog ||--o{ Group : contains
    Catalog ||--o{ Control : contains
    Catalog ||--o| BackMatter : has
    Catalog ||--o{ Parameter : has
    Group ||--o{ Control : groups
    Group ||--o{ Group : groups
    Group ||--o{ Parameter : has
    Group ||--o{ Property : has
    Group ||--o{ Part : has
    Control ||--o{ Control : contains
    Control ||--o{ Link : has
    Control ||--o{ Parameter : has
    Control ||--o{ Property : has
    Control ||--o{ Part : has
    BackMatter ||--o{ Resource : contains

```

### ER Diagram for Control Profile

```mermaid
erDiagram
    Addition {
        string ById
        string Position
    }
    Alteration {
        string ControlId
    }
    CombinationRule {
        string Method
    }
    CustomGrouping {
    }
    InsertControls {
        boolean IncludeAll
        string Order
    }
    MatchControlsByPattern {
        string Pattern
    }
    ProfileImport {
        boolean IncludeAll
        string Href
    }
    ProfileMerge {
        bool AsIs
    }
    ProfileModify {
    }
    ParameterSetting {
        string Class
        string DependsOn
        string Label
        string ParamId
        Selection Select
        string Usage
    }
    Removal {
        string ByClass
        string ById
        string ByItemName
        string ByName
        string ByNs
    }
    SelectControl {
        string[] WithChildControls
        string[] WithIds
    }
    Profile {
        map[string] Metadata
        string UUID
    }
    Profile ||--o| BackMatter: has
    Profile ||--o{ ProfileImport: contains
    Profile ||--o| ProfileMerge: allows
    Profile ||--o| ProfileModify: allows
    SelectControl ||--o{ MatchControlsByPattern: contains
    ParameterSetting ||--o{ Constraint: has
    ParameterSetting ||--o{ Guideline: has
    ParameterSetting ||--o{ Link: has
    ParameterSetting ||--o{ Property: has
    ParameterSetting ||--o| Selection: links
    ProfileModify ||--o{ Alteration: has
    ProfileModify ||--o{ ParameterSetting: has
    ProfileMerge ||--o| CombinationRule: contains
    ProfileMerge ||--o| CustomGrouping: contains
    ProfileImport ||--o{ SelectControl: includes
    ProfileImport ||--o{ SelectControl: excludes
    InsertControls ||--o{ SelectControl: includes
    InsertControls ||--o{ SelectControl: excludes
    CustomGrouping ||--o{ ControlGroup: contains
    CustomGrouping ||--o{ InsertControls: contains
    Alteration ||--o{ Addition: contains
    Alteration ||--o{ Removal: contains
    Addition  ||--o{ Link: has
    Addition  ||--o{ Parameter: has
    Addition  ||--o{ Part: has
    Addition  ||--o{ Property: has
```
