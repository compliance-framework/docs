---
title: Control definitions
description: Manage control catalogs, profiles and the links between controls in the UI.
sidebar_position: 6
---

# Control definitions

Control definitions are the requirements your systems are measured against: OSCAL catalogs of controls, profiles that select controls from them, and links that say how one control relates to another. This page is for **compliance and GRC users** who maintain them.

## How it works

- A **catalog** holds controls, in groups. The UI sorts catalogs into **Standards**, **Policies**, **Procedures**, **Internal Catalogs** and **Other**.
- A **profile** imports controls from one or more catalogs. A system security plan (SSP) attaches profiles to say which controls it must meet.
- A **control link** relates a control to another: a policy control **Implements** a standard's control, or a procedure **Documents** a policy. The **Compliance Map** follows these links; see [Controls and the Compliance Map](./controls.md).

## Before you start

- To see them, you need `catalog:read`, `profile:read` and `control-link:read`.
- To change them, a role that can change OSCAL documents, such as `contributor`.
- To bring in published catalogs and profiles, such as NIST SP 800-53, import their OSCAL JSON under **Admin** > **Import**. See [Administration](./administration.md).

## Catalogs

Select **Control Definitions** > **Catalogs**. Each tab lists one kind of catalog, with **View**, **JSON** and **Delete**. **Create Catalog** starts a new one.

In a catalog, **Add Group** and **Add Control** build its structure.

## Profiles

Select **Control Definitions** > **Profiles**.

- **Create New Profile** starts an empty profile. On its **Controls** tab, **Add Catalog Import** adds a catalog, and you choose its **Included Controls** and **Excluded Controls**.
- **Build Profile by Props** builds a profile from the controls of a catalog whose props match your rules, for example every control with a given `class`. A rule compares a prop with `equals`, `contains`, `regex` or `in`, and **Match Strategy** says whether `any` or `all` rules must match.

A profile's **Compliance** tab shows the compliance of its controls, and its **JSON** tab its OSCAL document.

## Control links

Select **Control Definitions** > **Control Links**, then **Create Control Link**:

1. Choose the **Link scope**: one **Control**, or a whole **Catalog**.
2. Choose the source: the concrete side, which implements or documents the target.
3. Choose the **Relationship**. The form shows the direction it allows.
4. Choose the **Target control**: the more abstract control.

A catalog-level link links every control of the source catalog. **Re-sync** updates it when the source catalog's controls change.

## Related

- [Systems](./systems.md)
- [Controls and the Compliance Map](./controls.md)
- [OSCAL](/oscal)
