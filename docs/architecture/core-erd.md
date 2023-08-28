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
    Addition  ||--o{ Parameter: has
    Addition  ||--o{ Part: has
```


### ER Diagram for SystemSecurityPlan
Note: almost all of these entities also has links and properties. These have been omited for brevity.

```mermaid
erDiagram
    AuthorizationBoundary {
        string Description
        string Remarks
    }
    SystemSecurityPlan {
        string uuid
    }
    BackMatter {
        string ID
    }
    SystemPlanControlImplementation {
        string description
    }
    ControlBasedRequirement {
        string ControlId
        string Remarks
        string UUID
    }
    ComponentControlImplementation {
        string ComponentUuid
        string description
        string Remarks
        string UUID
    }

    Export {
        string Description
        string Remarks
    }
    ProvidedControlImplementation {
        string Description
        string Remarks
        string UUID
    }
    ControlImplementationResponsibility {
        string Description
        string ProvidedUuid
        string Remarks
        string UUID
    }
    DataFlow {
        string Description
        string Remarks
    }    
    Diagram {
        string Caption
        string Remarks
        string UUID
    }
    ImplementedComponent {
        string ComponentUuid
        string Remarks
    }
    InformationType {
        string Description
        string Title
        string UUID
    }
    InformationTypeCategorization {
        string[] InformationTypeIds
        string system
    }
    ImplementationStatus {
        string Remarks
        Interface State
    }
    Status {
        string Remarks
        Interface State
    }
    SystemIdentification {
        string ID
        Interface IdentifierType
    }
    SystemInformation {

    }
    InheritedControlImplementation {
        string Description
        string ProvidedUuid
        string UUID
    }
    LeveragedAuthorization {
        DateTime DateAuthorized
        string PartyUuid
        string Remarks
        string Title
        string UUID
    }
    NetworkArchitecture {
        string Description
        string Remarks
    }
    CommonAuthorizedPrivilege {
        string Description
        string[] FunctionsPerformed
        string Title
    }
    CommonInventoryItem {
        string Description
        string Remarks
        string UUID

    }
    SystemImpact {
        string AdjustmentNotification
        string Base
        string Selected
    }

    SatisfiedControlImplementationResponsibility {
        string Description
        string Remarks
        string ResponsibilityUuid
        string UUID
    }
    SecurityImpactLevel {
        string SecurityObjectiveAvailability
        string SecurityObjectiveConfidentiality
        string SecurityObjectiveIntegrity
    }

    ResponsibleRole {

    }
    SetParameterValue {

    }
    SystemStatement {
        string remarks
        string StatementId
        string UUID
    }
    ImplementationCommonSetParameter {
        string ParamId
        string Remarks
        string[] Values   
    }
    SystemComponent { 
        string Description
        string Purpose
        string Title
        string Type
        string UUID
        string Remarks
    }
    CommonSystemUser {
        string Description
        string Remarks
        string[] RoleIds
        string ShortName
        string Title
        string UUID
    }
    ServiceProtocolInformation {
        string Name
        string Title
        string UUID
    }
    CommonPortRange {
        Interface End
        Interface Start
        Interface Transport
    }
    ImportProfile {
        string Href
        string Remarks
    }
    SystemCharacteristics {
        DateTime DateAuthorized
        string description
        string remarks
        string SecuritySensitivityLevel
        string SystemName
        string SystemNameShort
    }
    SystemImplementation {
        string Remarks
    }
    AuthorizationBoundary ||--o{ Diagram: has
    ComponentControlImplementation ||--o| Export: allows
    ComponentControlImplementation ||--o| ImplementationStatus: has
    ComponentControlImplementation ||--o{ InheritedControlImplementation: has
    ComponentControlImplementation ||--o{ ResponsibleRole: has
    ComponentControlImplementation ||--o{ SatisfiedControlImplementationResponsibility: has
    ComponentControlImplementation ||--o{ ImplementationCommonSetParameter: has
    ControlBasedRequirement ||--o{ ComponentControlImplementation: has
    ControlBasedRequirement ||--o{ ResponsibleRole: has
    ControlBasedRequirement ||--o{ SetParameterValue: has
    ControlBasedRequirement ||--o{ SystemStatement: has
    ControlImplementationResponsibility ||--o{ ResponsibleRole: has
    DataFlow ||--o{ Diagram: has
    Export ||--o{ ProvidedControlImplementation: has
    Export ||--o{ ControlImplementationResponsibility: has
    ImplementedComponent ||--o{ ResponsibleParty: has
    InformationType ||--o{ InformationTypeCategorization: has
    InformationType ||--o| SystemImpact: Availability
    InformationType ||--o| SystemImpact: Confidentiality
    InformationType ||--o| SystemImpact: Integrity
    InheritedControlImplementation ||--o{ ResponsibleRole: has
    NetworkArchitecture ||--o{ Diagram: has
    CommonInventoryItem ||--o{ ResponsibleParty: has
    CommonInventoryItem ||--o{ ImplementedComponent: has
    SystemComponent ||--o{ ResponsibleRole: has
    SystemComponent ||--o{ ServiceProtocolInformation: has
    CommonSystemUser ||--o{ CommonAuthorizedPrivilege: has
    SystemPlanControlImplementation ||--o{ ControlBasedRequirement: has
    SystemPlanControlImplementation ||--o{ ImplementationCommonSetParameter: has
    SystemStatement ||--o{ ComponentControlImplementation: has
    SystemStatement ||--o{ ResponsibleRole: has
    SystemCharacteristics ||--o| AuthorizationBoundary: has
    SystemCharacteristics ||--o| DataFlow: has
    SystemCharacteristics ||--o| NetworkArchitecture: has
    SystemCharacteristics ||--o{ ResponsibleParty: has
    SystemCharacteristics ||--o| SecurityImpactLevel: has
    SystemCharacteristics ||--o| Status: has
    SystemCharacteristics ||--o{ SystemIdentification: has
    SystemCharacteristics ||--o| SystemInformation: has
    SystemImplementation ||--o{ SystemComponent: has
    SystemImplementation ||--o{ CommonInventoryItem: has
    SystemImplementation ||--o{ LeveragedAuthorization: has
    SystemImplementation ||--o{ CommonSystemUser: has
    ProvidedControlImplementation ||--o{ ResponsibleRole: has
    SatisfiedControlImplementationResponsibility ||--o{ ResponsibleRole: has
    SystemInformation ||--o{ InformationType: has
    SystemSecurityPlan ||--o| BackMatter: has
    SystemSecurityPlan ||--o| Metadata: has
    SystemSecurityPlan ||--o| SystemPlanControlImplementation: has
    SystemSecurityPlan ||--o| ImportProfile: has
    SystemSecurityPlan ||--o| SystemCharacteristics: has
    SystemSecurityPlan ||--o| SystemImplementation: has
    ServiceProtocolInformation ||--o{ CommonPortRange: has
    
    

    








```