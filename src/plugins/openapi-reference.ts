// Gives each OpenAPI spec in openapi/<id>/<line>.yaml a reference page, rendered by Redoc in the
// browser (src/components/ApiReference). Nothing is committed for it but the spec: webpack ships
// the files as static assets and the page fetches them, so a release adds one YAML file and no MDX.
//
// The page renders a display copy of the spec (scripts/openapi-display.mjs), written to the
// gitignored .docusaurus/ folder on every build, with deeply nested schemas collapsed so Redoc
// doesn't run the browser out of memory. Its download button serves the committed spec unchanged.
//
// We don't use redocusaurus: it puts every spec into the site's global data, which every page
// downloads, and its build-time rendering of the ~1 MB api spec runs out of memory.
import path from 'node:path';
import type {LoadContext, Plugin} from '@docusaurus/types';
import {writeDisplaySpec, DEFAULT_MAX_DEPTH} from '../../scripts/openapi-display.mjs';

export type ReferenceSpec = {
  /** Unique per spec, e.g. `api-0-21`. */
  id: string;
  /** Absolute path of the spec file, under openapi/. */
  spec: string;
  /** The page's route without the baseUrl, e.g. `/api/0.21/reference`. */
  route: string;
  /** The page title. */
  title: string;
};

export type Options = {specs: ReferenceSpec[]};

export default function openapiReferencePlugin(context: LoadContext, {specs}: Options): Plugin {
  const specDir = path.join(context.siteDir, 'openapi');
  // Not under the plugin's own data folder, whose JSON modules webpack must keep loading as data.
  const displayDir = path.join(context.generatedFilesDir, 'openapi-display');
  const displayFile = (spec: ReferenceSpec) => path.join(displayDir, `${spec.id}.json`);

  return {
    name: 'openapi-reference',

    async loadContent() {
      for (const spec of specs) writeDisplaySpec(spec.spec, displayFile(spec));
    },

    configureWebpack() {
      return {
        module: {
          rules: [
            {
              // Importing a spec, or its display copy, gives its URL: the page downloads it only
              // when it's opened.
              test: /\.(ya?ml|json)$/,
              include: [specDir, displayDir],
              type: 'asset/resource',
              generator: {filename: 'assets/openapi/[name].[contenthash:8][ext]'},
            },
          ],
        },
      };
    },

    async contentLoaded({actions}) {
      for (const spec of specs) {
        const meta = await actions.createData(
          `${spec.id}.json`,
          JSON.stringify({
            title: spec.title,
            maxDepth: DEFAULT_MAX_DEPTH,
            // e.g. api-0.21.yaml, instead of the hashed asset name.
            downloadName: `${path.basename(path.dirname(spec.spec))}-${path.basename(spec.spec)}`,
          }),
        );
        actions.addRoute({
          path: path.posix.join(context.baseUrl, spec.route),
          exact: true,
          component: '@site/src/components/ApiReference',
          modules: {specUrl: displayFile(spec), downloadUrl: spec.spec, meta},
        });
      }
    },

    getPathsToWatch() {
      return specs.map((spec) => spec.spec);
    },
  };
}
