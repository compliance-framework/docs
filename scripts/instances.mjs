// Reads and validates instances.yaml. Shared by docusaurus.config.ts and scripts/gen-sidebars.mjs.
//
// Everything here takes the site directory as an argument (no import.meta), so it loads the same
// way under plain Node and under the TypeScript loader Docusaurus uses for its config.
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import yaml from 'js-yaml';

export const MANIFEST = 'instances.yaml';
export const SCHEMA = 'scripts/instances.schema.json';

/**
 * One entry of instances.yaml (see scripts/instances.schema.json).
 * @typedef {object} Instance
 * @property {string} id
 * @property {'product' | 'plugin'} kind
 * @property {string} repo
 * @property {string} path
 * @property {string} route
 * @property {string} label
 * @property {boolean} [navbar]
 * @property {{source: string}} [openapi]
 * @property {string[]} [policies]
 */

/**
 * @typedef {object} Manifest
 * @property {1} version
 * @property {Instance[]} instances
 * @property {{onlyIncludeVersions?: {product: number, plugin: number}}} [build]
 */

/**
 * An instance with what's on disk: its released lines, newest first, and whether its current docs
 * have pages.
 * @typedef {Instance & {lines: string[], hasCurrent: boolean}} LoadedInstance
 */

/** Thrown when instances.yaml doesn't match its schema or breaks a uniqueness rule. */
export class InstancesError extends Error {
  constructor(problems) {
    super(`${MANIFEST} is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'InstancesError';
    this.problems = problems;
  }
}

/**
 * Parses and validates instances.yaml against scripts/instances.schema.json, then checks that ids,
 * paths and routes are unique (JSON Schema can't express that).
 *
 * @param {string} siteDir the docs repository root
 * @returns {Manifest}
 */
export function loadManifest(siteDir) {
  const text = fs.readFileSync(path.join(siteDir, MANIFEST), 'utf8');
  const manifest = /** @type {Manifest} */ (yaml.load(text, {filename: MANIFEST}));
  const schema = JSON.parse(fs.readFileSync(path.join(siteDir, SCHEMA), 'utf8'));
  const validate = new Ajv({allErrors: true, strict: true, useDefaults: true, verbose: true}).compile(
    schema,
  );
  if (!validate(manifest)) {
    throw new InstancesError(validate.errors.filter((e) => e.keyword !== 'if').map(describe));
  }

  const problems = [];
  for (const key of ['id', 'path', 'route']) {
    const seen = new Set();
    for (const inst of manifest.instances) {
      if (seen.has(inst[key])) problems.push(`duplicate ${key} "${inst[key]}"`);
      seen.add(inst[key]);
    }
  }
  if (problems.length > 0) throw new InstancesError(problems);
  return manifest;
}

// Turns an Ajv error into a line that names the offending key or value.
function describe(e) {
  const at = e.instancePath || '/';
  switch (e.keyword) {
    case 'additionalProperties':
      return `${at} has an unknown key "${e.params.additionalProperty}"`;
    case 'enum':
      return `${at} must be one of ${e.params.allowedValues.join(', ')}, got ${JSON.stringify(e.data)}`;
    case 'const':
      return `${at} must be ${JSON.stringify(e.params.allowedValue)}, got ${JSON.stringify(e.data)}`;
    case 'not':
      return `${at} can't be ${JSON.stringify(e.data)}: it's reserved for the default (CCF) instance`;
    case 'false schema':
      return `${at} is only allowed on plugin instances`;
    default:
      return `${at} ${e.message}`;
  }
}

/**
 * The released minor lines of an instance, newest first (from <id>_versions.json).
 * @param {string} siteDir
 * @param {Instance} inst
 * @returns {string[]}
 */
export function releasedLines(siteDir, inst) {
  const file = path.join(siteDir, `${inst.id}_versions.json`);
  if (!fs.existsSync(file)) return [];
  const lines = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(lines) || !lines.every((l) => typeof l === 'string')) {
    throw new InstancesError([`${inst.id}_versions.json must be an array of version names`]);
  }
  return lines;
}

/**
 * Whether the instance's current (unreleased) docs hold at least one page Docusaurus would load.
 * @param {string} siteDir
 * @param {Instance} inst
 */
export function hasCurrentDocs(siteDir, inst) {
  return containsDoc(path.join(siteDir, inst.path));
}

/** @param {string} dir */
function containsDoc(dir) {
  if (!fs.existsSync(dir)) return false;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    // Docusaurus skips files and folders starting with "_" (partials) by default.
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    if (entry.isDirectory() ? containsDoc(path.join(dir, entry.name)) : /\.mdx?$/.test(entry.name)) {
      return true;
    }
  }
  return false;
}

/**
 * The instances to build, each with its released lines and whether its current docs have pages.
 * An instance with neither isn't built yet: Docusaurus fails on a docs plugin without docs.
 * @param {string} siteDir
 * @returns {{manifest: Manifest, built: LoadedInstance[], empty: LoadedInstance[]}}
 */
export function loadInstances(siteDir) {
  const manifest = loadManifest(siteDir);
  /** @type {LoadedInstance[]} */
  const all = manifest.instances.map((inst) => ({
    ...inst,
    lines: releasedLines(siteDir, inst),
    hasCurrent: hasCurrentDocs(siteDir, inst),
  }));
  return {
    manifest,
    built: all.filter((i) => i.lines.length > 0 || i.hasCurrent),
    empty: all.filter((i) => i.lines.length === 0 && !i.hasCurrent),
  };
}
