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

