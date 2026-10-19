import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type {Options as DocsOptions} from '@docusaurus/plugin-content-docs';
import type {NavbarItem} from '@docusaurus/theme-common';
import {themes as prismThemes} from 'prism-react-renderer';
import {loadInstances} from './scripts/instances.mjs';
import {referenceSpecs} from './scripts/openapi.mjs';
import openapiReferencePlugin, {type ReferenceSpec} from './src/plugins/openapi-reference';

const organizationName = 'compliance-framework';

// The GitHub Pages project the site is served from: `docs` by default, `mock-docs` in the
// mock-docs repository's workflows.
const projectName = process.env.DOCS_PROJECT || 'docs';
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectName)) {
  throw new Error(`DOCS_PROJECT must be a GitHub Pages project name such as "docs", got "${projectName}"`);
}

// `docusaurus build` sets NODE_ENV to production before it loads this file; `start` doesn't.
const isDev = process.env.NODE_ENV !== 'production';

// The versioned instances from instances.yaml (validated against scripts/instances.schema.json).
// Instances without pages yet aren't built: Docusaurus fails on a docs plugin with no docs.
const {manifest, built} = loadInstances(__dirname);

type Instance = (typeof built)[number];

// Which versions to build: the newest N released lines of the instance's kind (all of them
// without a limit), plus `current` in dev, or when nothing is released yet.
function includedVersions(inst: Instance): string[] {
  const limit = manifest.build?.onlyIncludeVersions?.[inst.kind];
  const lines = limit === undefined ? inst.lines : inst.lines.slice(0, limit);
  const withCurrent = inst.hasCurrent && (isDev || lines.length === 0);
  return withCurrent ? ['current', ...lines] : lines;
}

function docsPlugin(inst: Instance): [string, DocsOptions] {
  return [
    '@docusaurus/plugin-content-docs',
    {
      id: inst.id,
      path: inst.path,
      routeBasePath: inst.route,
      // Written by scripts/gen-sidebars.mjs unless the instance commits a curated one.
      sidebarPath: `./sidebars/${inst.id}.ts`,
      includeCurrentVersion: inst.hasCurrent,
      onlyIncludeVersions: includedVersions(inst),
      lastVersion: inst.lines[0] ?? 'current',
      editUrl: `https://github.com/${organizationName}/${projectName}/edit/main/`,
    },
  ];
}

// The API reference of each instance with `openapi`: a page per spec in openapi/<id>/, at
// /<route>/<line>/reference, that Redoc renders in the browser (no generated MDX).
const referenceSpecsToBuild: ReferenceSpec[] = built
  .filter((inst) => inst.openapi)
  .flatMap((inst) =>
    referenceSpecs(__dirname, inst, includedVersions(inst)).map((spec) => ({
      ...spec,
      title: `${inst.label} reference ${spec.line}`,
    })),
  );

// The architecture pages moved from the general docs into the api instance: keep the old URLs.
const movedPages: {from: string; to: string}[] = built.some((inst) => inst.id === 'api')
  ? ['', '/agents', '/plugins', '/policies', '/external'].map((page) => ({
      from: `/architecture${page}`,
      to: `/api/architecture${page}`,
    }))
  : [];

// Each navbar instance gets its sidebar link and a version dropdown. The dropdown only shows
// on that instance's pages (src/theme/NavbarItem/DocsVersionDropdownNavbarItem.tsx).
const instanceNavbarItems: NavbarItem[] = built
  .filter((inst) => inst.navbar)
  .flatMap((inst): NavbarItem[] => [
    {type: 'docSidebar', docsPluginId: inst.id, sidebarId: 'main', label: inst.label},
    {type: 'docsVersionDropdown', docsPluginId: inst.id, position: 'right'},
  ]);

// The catalog links to the plugin instances, so it shows once one of them is built.
const catalogNavbarItems: NavbarItem[] = built.some((inst) => inst.kind === 'plugin')
  ? [{to: '/catalog', label: 'Catalog'}]
  : [];

const config: Config = {
  title: 'Compliance Framework',
  tagline: 'Compliance Framework is an open source project that helps you manage your compliance needs in a Cloud Native way.',
  favicon: 'img/favicon.ico',

  url: `https://${organizationName}.github.io`,
  baseUrl: `/${projectName}/`,

  // GitHub Pages deployment config.
  organizationName,
  projectName,

  onBrokenLinks: 'throw',

  trailingSlash: false,

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    async function tailwindPlugin() {
      return {
        name: 'docusaurus-tailwindcss',
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          postcssOptions.plugins.push(require('tailwindcss'));
          postcssOptions.plugins.push(require('autoprefixer'));
          return postcssOptions;
        },
      };
    },
    ...built.map(docsPlugin),
    (context) => openapiReferencePlugin(context, {specs: referenceSpecsToBuild}),
    ['@docusaurus/plugin-client-redirects', {redirects: movedPages}],
  ],

  presets: [
    [
      'classic',
      {
        // The default instance: the general CCF pages in docs/, unversioned.
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Compliance Framework',
      logo: {
        alt: 'Compliance Framework Logo',
        src: 'img/logo.svg',
      },
      items: [
        {type: 'doc', docId: 'introduction/index', label: 'CCF'},
        ...instanceNavbarItems,
        ...catalogNavbarItems,
        {
          href: 'https://github.com/compliance-framework',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/introduction',
            },
            {
              label: 'Glossary',
              to: '/glossary',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/compliance-framework',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Compliance Framework. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    mermaid: {
      options: {
        fontFamily: 'Victor Mono, sans-serif',
        fontSize: '12px',
      },
    },
  } satisfies Preset.ThemeConfig,

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
