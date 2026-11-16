---
title: Release notes
sidebar_position: 90
---

# Release notes for the 2.13 line

## v2.13.0 (2026-10-28)

### Highlights

- The navigation is reorganised into **This System** and **Global**, and Evidence is split the same way.
- SSP templates can be created, edited, previewed and run from the UI, and an SSP has a **Scope** tab to edit which evidence it covers.

### Added

- Split Evidence into This System and Global pages ([#362](https://github.com/compliance-framework/ui/pull/362))
- Build filters from in-scope evidence inside a scoped SSP ([#363](https://github.com/compliance-framework/ui/pull/363))
- Let filters follow their SSP's scope ([#364](https://github.com/compliance-framework/ui/pull/364))
- Add an SSP templates admin list, routes, navigation and types ([#366](https://github.com/compliance-framework/ui/pull/366))
- Create and edit SSP templates in a dialog form ([#367](https://github.com/compliance-framework/ui/pull/367))
- Preview and run an SSP template, and list the SSPs it created, on the template page ([#368](https://github.com/compliance-framework/ui/pull/368))
- Add a **Scope** tab to edit an SSP's evidence scope ([#361](https://github.com/compliance-framework/ui/pull/361))

### Changed

- Reorganise the navigation into This System and Global ([#357](https://github.com/compliance-framework/ui/pull/357))

### Fixed

- Update Vite to v6.4.4, a security fix ([#369](https://github.com/compliance-framework/ui/pull/369))
- Patch the Brotli CVE-2026-111497 in the UI image ([#373](https://github.com/compliance-framework/ui/pull/373))

### Breaking changes

None.
