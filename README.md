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

This writes the static site to `build/`. A broken internal link fails the build (`onBrokenLinks: 'throw'`), so run it before you open a pull request. To preview the built site, run `yarn serve`.

## Deployment

Every push to `main` builds the site and deploys it to GitHub Pages with the [Deploy to Pages](.github/workflows/deploy-pages.yml) workflow. The [Test Build](.github/workflows/test-build.yml) workflow builds every push, on any branch. There's no manual deploy step.

## Layout

| Path | What it holds |
|---|---|
| `docs/` | The pages (Markdown and MDX), served from the site root |
| `sidebars.js` | The sidebar |
| `src/` | Custom CSS and React components |
| `static/img/` | Images and GIFs |
| `.archive/` | Old pages kept for reference. They're outside the build, so don't link to them |
