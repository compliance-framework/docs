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
    Addition  ||--o{ Parameter: has
    Addition  ||--o{ Property: has
    Addition  ||--o{ Link: has
    Addition  ||--o{ Part: has
```


### ER Diagram for SystemSecurityPlan
Note: The diagrams are split into subdiagrams for the ease of use.

### System Characteristics
```mermaid
erDiagram
    SystemCharacteristics ||--o| AuthorizationBoundary: has
    SystemCharacteristics ||--o| DataFlow: has
    SystemCharacteristics ||--o| NetworkArchitecture: has
    SystemCharacteristics ||--o{ ResponsibleParty: has
    SystemCharacteristics ||--o| SecurityImpactLevel: has
    SystemCharacteristics ||--o| Status: has
    SystemCharacteristics ||--o{ SystemIdentification: has
    SystemCharacteristics ||--o| SystemInformation: has
    SystemCharacteristics ||--o| Link: has
    SystemCharacteristics ||--o| Property: has
    AuthorizationBoundary ||--o{ Diagram: has
    AuthorizationBoundary ||--o{ Link: has
    AuthorizationBoundary ||--o{ Property: has
    DataFlow ||--o{ Diagram: has
    Diagram ||--o{ Link: has
    Diagram ||--o{ Property: has
    DataFlow ||--o{ Link: has
    DataFlow ||--o{ Property: has
    NetworkArchitecture ||--o{ Diagram: has
    NetworkArchitecture ||--o{ Link: has
    NetworkArchitecture ||--o{ Property: has
    SystemInformation ||--o{ InformationType: has
    InformationType ||--o{ InformationTypeCategorization: has
    InformationType ||--o| SystemImpact: Availability
    InformationType ||--o| SystemImpact: Integrity
    InformationType ||--o| SystemImpact: Confidentiality
    SystemImpact ||--o{ Link: has
    SystemImpact ||--o{ Property: has
    InformationType ||--o{ Link: has
    InformationType ||--o{ Property: has
    SystemInformation ||--o{ Link: has
    SystemInformation ||--o{ Property: has
    AuthorizationBoundary {
        string Description
        string Remarks
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
    InformationType {
        string Description
        string Title
        string UUID
    }
    InformationTypeCategorization {
        string[] InformationTypeIds
        string System
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
    NetworkArchitecture {
        string Description
        string Remarks
    }
    SecurityImpactLevel {
        string SecurityObjectiveAvailability
        string SecurityObjectiveConfidentiality
        string SecurityObjectiveIntegrity
    }
    SystemCharacteristics {
        DateTime DateAuthorized
        string description
        string remarks
        string SecuritySensitivityLevel
        string SystemName
        string SystemNameShort
    }
```

### System Control Implementation

```mermaid
erDiagram
    SystemPlanControlImplementation ||--o{ ControlBasedRequirement: has
    ControlBasedRequirement ||--o{ ComponentControlImplementation: has
    ComponentControlImplementation ||--o| Export: allows
    Export ||--o{ ProvidedControlImplementation: has
    ProvidedControlImplementation ||--o{ Link: has
    ProvidedControlImplementation ||--o{ Property: has
    ProvidedControlImplementation ||--o{ ResponsibleRole: has
    Export ||--o{ ControlImplementationResponsibility: has
    ControlImplementationResponsibility ||--o{ Link: has
    ControlImplementationResponsibility ||--o{ Property: has
    ControlImplementationResponsibility ||--o{ ResponsibleRole: has
    Export ||--o{ Link: has
    Export ||--o{ Property: has
    ComponentControlImplementation ||--o| ImplementationStatus: has
    ComponentControlImplementation ||--o{ InheritedControlImplementation: has
    InheritedControlImplementation ||--o{ Link: has
    InheritedControlImplementation ||--o{ Property: has
    InheritedControlImplementation ||--o{ ResponsibleRole: has
    ComponentControlImplementation ||--o{ SatisfiedControlImplementationResponsibility: has
    SatisfiedControlImplementationResponsibility ||--o{ Link: has
    SatisfiedControlImplementationResponsibility ||--o{ Property: has
    SatisfiedControlImplementationResponsibility ||--o{ ResponsibleRole: has
    ComponentControlImplementation ||--o{ ImplementationCommonSetParameter: has
    ComponentControlImplementation ||--o{ Link: has
    ComponentControlImplementation ||--o{ Property: has
    ComponentControlImplementation ||--o{ ResponsibleRole: has
    ControlBasedRequirement ||--o{ SetParameterValue: has
    ControlBasedRequirement ||--o{ SystemStatement: has
    ControlBasedRequirement ||--o{ Link: has
    ControlBasedRequirement ||--o{ Property: has
    ControlBasedRequirement ||--o{ ResponsibleRole: has
    SystemStatement ||--o{ ComponentControlImplementation: has
    SystemStatement ||--o{ Link: has
    SystemStatement ||--o{ Property: has
    SystemStatement ||--o{ ResponsibleRole: has
    SystemPlanControlImplementation ||--o{ ImplementationCommonSetParameter: has
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
    ImplementationStatus {
        string Remarks
        Interface State
    }
    InheritedControlImplementation {
        string Description
        string ProvidedUuid
        string UUID
    }
    SatisfiedControlImplementationResponsibility {
        string Description
        string Remarks
        string ResponsibilityUuid
        string UUID
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
```
### System Implementation
```mermaid
erDiagram
    SystemImplementation ||--o{ SystemComponent: has
    SystemComponent ||--o{ ServiceProtocolInformation: has
    SystemComponent ||--o{ Property: has
    SystemComponent ||--o{ Link: has
    SystemComponent ||--o{ ResponsibleRole: has
    ServiceProtocolInformation ||--o{ CommonPortRange: has
    SystemImplementation ||--o{ CommonInventoryItem: has
    CommonInventoryItem ||--o{ ResponsibleParty: has
    CommonInventoryItem ||--o{ ImplementedComponent: has
    CommonInventoryItem ||--o{ Link: has
    CommonInventoryItem ||--o{ Property: has
    ImplementedComponent ||--o{ ResponsibleParty: has
    ImplementedComponent ||--o{ Link: has
    ImplementedComponent ||--o{ Property: has
    SystemImplementation ||--o{ LeveragedAuthorization: has
    LeveragedAuthorization ||--o{ Link: has
    LeveragedAuthorization ||--o{ Property: has
    SystemImplementation ||--o{ CommonSystemUser: has
    CommonSystemUser ||--o{ CommonAuthorizedPrivilege: has
    CommonSystemUser ||--o{ Link: has
    CommonSystemUser ||--o{ Property: has
    SystemImplementation ||--o{ Link: has
    SystemImplementation ||--o{ Property: has
    LeveragedAuthorization {
        DateTime DateAuthorized
        string PartyUuid
        string Remarks
        string Title
        string UUID
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

    ImplementedComponent {
        string ComponentUuid
        string Remarks
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
    SystemImplementation {
        string Remarks
    }
```

### System Security Plan
```mermaid
erDiagram
    SystemSecurityPlan {
        string uuid
    }
    BackMatter {
        string ID
    }
    Metadata {

    }
    SystemPlanControlImplementation {
        string description
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
    SystemSecurityPlan ||--o| BackMatter: has
    SystemSecurityPlan ||--o| Metadata: has
    SystemSecurityPlan ||--o| SystemPlanControlImplementation: has
    SystemSecurityPlan ||--o| ImportProfile: has
    SystemSecurityPlan ||--o| SystemCharacteristics: has
    SystemSecurityPlan ||--o| SystemImplementation: has
```