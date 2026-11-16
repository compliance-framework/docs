# Compliance Framework docs

The documentation site for the Continuous Compliance Framework (CCF), built with [Docusaurus 3](https://docusaurus.io/).

It's published at [compliance-framework.github.io/docs](https://compliance-framework.github.io/docs/introduction).

Before you write a page, read [STYLE.md](STYLE.md) (voice, page skeletons, media and links) and [CONTRIBUTING.md](CONTRIBUTING.md) (versioned docs, pull requests and the `factory:hold` label).

## Requirements

- Node.js 20 (the version in [`.nvmrc`](.nvmrc), the same as CI). With [nvm](https://github.com/nvm-sh/nvm), run `nvm use`.
- [Yarn 1](https://classic.yarnpkg.com/) (`yarn.lock` is the only lockfile; don't use `npm install`).

## Install

```sh
yarn install --frozen-lockfile
```

## Local development

```sh
yarn start
```

This starts a local development server and opens a browser window. Most changes show up live, without a restart.

## Build

```sh
yarn build
```

This writes the static site to `build/`. Both `yarn start` and `yarn build` first run `scripts/gen-sidebars.mjs`, which fails on an invalid `instances.yaml`. The site is served under `/docs/`; set `DOCS_PROJECT` to serve it under another GitHub Pages project, for example `DOCS_PROJECT=mock-docs yarn build` for `/mock-docs/`. A broken internal link fails the build (`onBrokenLinks: 'throw'`), so run it before you open a pull request. To preview the built site, run `yarn serve`.

## Deployment

Every push to `main` builds the site and deploys it to GitHub Pages with the [Deploy to Pages](.github/workflows/deploy-pages.yml) workflow. The [Test Build](.github/workflows/test-build.yml) workflow builds every push, on any branch. There's no manual deploy step.

## Layout

| Path | What it holds |
|---|---|
| `docs/` | The general pages (Markdown and MDX), served from the site root |
| `sidebars.js` | The sidebar of the general pages |
| `api/`, `ui/`, `agent/` | The current (unreleased) docs of the API, UI and agent instances; `<id>_versioned_docs/` holds each one's released lines (see [CONTRIBUTING.md](CONTRIBUTING.md)) |
| `plugins/<name>/` | The current docs of each plugin instance, with its released lines in `plugin-<name>_versioned_docs/`. `scripts/sync-catalog.mjs` generates them |
| `openapi/<id>/<line>.yaml` | The OpenAPI spec of each released line of an instance with `openapi`, rendered at `/<route>/<line>/reference` by `src/plugins/openapi-reference.ts`, from a display copy with deeply nested schemas collapsed (`scripts/openapi-display.mjs`) |
| `instances.yaml` | The versioned docs instances, one per CCF repository. `docusaurus.config.ts` builds the docs plugins, navbar and version dropdowns from it |
| `scripts/` | `gen-sidebars.mjs`, which validates `instances.yaml` against `instances.schema.json` and writes the sidebars; `gen-config-ref.mjs`, which writes a configuration reference from the repository's code; the shared loaders `instances.mjs` and `openapi.mjs`; and `openapi-display.mjs`, which makes the reference page's display copy of a spec; and `sync-catalog.mjs` (with `catalog.mjs`), which writes the plugin instances and the catalog data from GitHub. `yarn test` runs its tests |
| `sidebars/` | One sidebar per instance. `yarn start` and `yarn build` generate the missing ones (they're gitignored); a curated sidebar is committed |
| `src/` | Custom CSS, React components, the local `openapi-reference` plugin, and the Catalog page (`src/pages/catalog.tsx`), which renders `src/data/catalog.json` |
| `static/img/` | Images and GIFs |
| `.archive/` | Old pages kept for reference. They're outside the build, so don't link to them |
