# Docs style guide

How pages on this site are written. It applies to every page, whether a person or the factory's `docs-style` and `docs-release` skills wrote it, and reviewers check pages against it.

## Audience and voice

The site has three main readers:

- **Operators** who install, configure and upgrade CCF (API, UI, agent and plugins).
- **Compliance and GRC users** who work in the UI: assessments, controls, evidence and reports.
- **Developers** who write plugins and policies, or contribute to CCF.

Say near the top of each page which of them it's for, when it isn't obvious.

Voice:

- Talk to the reader as "you", in the present tense and active voice: "The agent sends results to the API", not "Results will be sent by the agent".
- Keep sentences short, one idea each. Lead with what the reader can do or needs to know, then the detail.
- Be exact. Name the setting, endpoint, permission or screen, with its real value and default. If you aren't sure a claim holds for the version you're documenting, check it on the running system or leave it out.
- Use sentence case for headings ("Configure the agent", not "Configure The Agent").
- Use US English spelling ("organization", "authorize").
- Put commands, settings, paths and values in `code`. Give each command its own fenced code block with a language tag (`sh`, `yaml`, `json`).
- Don't write marketing copy, filler ("simply", "just", "easy") or future promises. Document what's released.

## Page skeletons

Each page type has a fixed skeleton. Keep the sections in this order and drop the ones that don't apply. Don't add new top-level sections without a reason.

### Release notes

One page per minor line (for example `api` `0.21`), with one section per release, newest first.

```md
## v0.21.1 (YYYY-MM-DD)

### Highlights
<!-- The one to three changes that matter most, e.g. a performance gain, in one or two sentences each. -->

### Added
- <change> ([#123](https://github.com/compliance-framework/<repo>/pull/123))

### Changed
### Fixed
### Breaking changes
<!-- Each one links to the upgrade guide. -->
```

Every item links to its pull request. Patch releases add a section to their minor line's page; they never start a new page.

### Configuration reference

One table per component, one row per setting, sorted by name (the row here is only an example):

| Setting | Purpose | Type | Default | Example |
|---|---|---|---|---|
| `CCF_EXAMPLE_SETTING` | What it controls, in one sentence. | `int` | `100` | `CCF_EXAMPLE_SETTING=250` |

- **Setting:** the exact environment variable or config key.
- **Purpose:** what changes when you set it. Mention the allowed values for an enum and the unit for a duration or size.
- **Type:** `string`, `int`, `bool`, `duration`, `list` and so on.
- **Default:** the real default at this version, or *required* if there isn't one.
- **Example:** a value someone would actually use.

Mark a setting added in this line with *(new in 0.21)* in its Purpose cell, and a deprecated one with *(deprecated: use `CCF_OTHER`)*.

### Feature guide

```md
# <Feature name>

<What it's for, in one or two sentences, and who uses it.>

## How it works
## Before you start
<!-- Versions, settings and the permissions (roles) the reader needs. -->
## Enable it
## Use it
<!-- Step by step. Prefer a GIF of the flow over paragraphs (see Media). -->
## Troubleshooting
## Related
```

### Upgrade guide

For minor and major releases. One page per target line, for example "Upgrade to 0.21".

```md
# Upgrade to <line>

## Before you upgrade
<!-- Supported starting versions, backups, required versions of the other components. -->
## Breaking changes
<!-- For each one: what changed, who's affected, and what to do. -->
## Renamed and removed settings
<!-- Table: old setting | new setting | notes. -->
## Migrations
<!-- Database or data migrations, whether they run on their own, and how long they take. -->
## After you upgrade
<!-- How to check it worked. -->
```

### Plugin page

The landing page of a plugin's own versioned instance:

```md
# <Plugin name>

<What it collects evidence about, in one or two sentences.>

## Requirements
<!-- Credentials, permissions on the target system, network access. -->
## Configuration
<!-- A configuration reference table (see above), then a complete example. -->
## Evidence collected
<!-- What it gathers and how often. -->
## Policies
<!-- The policies catalog (below). -->
```

### Policies catalog

A table on each plugin page, one row per policy bundle that works with the plugin (the values here are only an example):

| Bundle | Latest version | Controls covered | Compatible plugin lines |
|---|---|---|---|
| [`plugin-aws-ecr-image-policies`](https://github.com/compliance-framework/plugin-aws-ecr-image-policies) | `v1.2.0` | AC-3, CM-6 | `1.4`, `1.5` |

- **Bundle:** the policy repository, linked.
- **Latest version:** the newest release of the bundle.
- **Controls covered:** control IDs, comma separated.
- **Compatible plugin lines:** the plugin's minor lines, from the bundle's metadata where it has it, otherwise "latest".

A bundle release updates its row in every compatible minor line. It never cuts a plugin version.

## Media

- **Prefer a GIF over prose for UI flows.** If a reader would follow steps on screen, show them.
- **Limits:** at most 4 MB, at most 20 seconds, 1280 px wide.
- **Data:** record against the seeded showcase data only (`make demo-up-showcase` in `local-dev`). Never real customer data, real credentials or real hostnames.
- **Location:** `static/img/<instance>/<line>/`, for example `static/img/ui/2.12/create-assessment.gif`. Images for the general (unversioned) pages go in `static/img/`.
- **Names:** lowercase, hyphenated, saying what it shows (`create-assessment.gif`, not `recording1.gif`).
- **Alt text:** every image has alt text that says what it shows.
- **Diagrams:** give a light and a dark version with `ThemedImage`, as the architecture pages do, or use a Mermaid diagram.

## Links

- **Within a version, link with a relative path to the Markdown file:** `[Configuration](./configuration.md)`. The build checks these and fails on a broken one.
- **Never link a versioned page to `current`** (the unreleased "next" docs). Between instances, link to a released version line.
- **Don't link to `.archive/`.** It's outside the build.
- **External links** use `https` and the page's current address, not one that redirects. Link to a specific page, not a site's home page.
- **Link text** says where it goes: "see the [agent configuration](./configuration.md)", not "click [here](./configuration.md)".

## Terminology

- Use the terms in the [glossary](docs/glossary.md) with the meaning it gives them. If a term is missing or its meaning is disputed, update the glossary in the same pull request.
- Name the product "Continuous Compliance Framework" the first time on a page and "CCF" after that.
- Name components the way the glossary does: CCF Agent, CCF Plugins, CCF Policies, the API, the UI.
- Use control and framework IDs exactly as published (NIST SP 800-53 `AC-3`, OSCAL model names such as "Assessment Results").
- Write UI labels exactly as the UI shows them, in **bold**: "Select **New assessment**".

## i18n

- English is the source language. Every page is written in English first; translations follow it.
- A translated page has the same sections as its source. When the source changes, update or flag the translation in the same pull request.
- Write so a page translates well: short sentences, no idioms or jokes, no text inside images when a caption will do.
- Keep UI strings, settings, commands and code untranslated.
