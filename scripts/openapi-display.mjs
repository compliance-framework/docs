// Makes the display copy of an OpenAPI spec that the reference page renders. The committed spec
// (openapi/<id>/<line>.yaml) is never changed: it's what the page's download button serves.
//
// Why: Redoc 2 builds every nested schema of an operation up front, following each `$ref` until it
// meets a cycle. A schema graph with many paths between the same types (like the GORM relations in
// api's workflow responses) expands into tens of thousands of nodes per operation, and the browser
// tab runs out of memory. The display copy caps that expansion: a schema reached through more than
// `maxDepth` `$ref` hops from an operation becomes a stub that names it.
//
// How: each named schema `S` keeps its name and shows the first level. Its nested references point
// to depth copies `S__depth2`, `S__depth3` and so on (titled `S`, so Redoc still shows the name),
// and the references of the last copy become stubs. Every original schema stays, so a schemas
// section lists each one once. It works on Swagger 2.0 (`definitions`) and OpenAPI 3
// (`components.schemas`) alike, with no knowledge of any particular API.

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/** The default nesting depth: the full api 0.21 spec renders with it (see CONTRIBUTING.md). */
export const DEFAULT_MAX_DEPTH = 4;

const DEPTH_SUFFIX = '__depth';

/** Where the spec keeps its named schemas, and the `$ref` prefix that points at them. */
function schemaStore(spec) {
  if (spec.definitions && typeof spec.definitions === 'object') {
    return {schemas: spec.definitions, prefix: '#/definitions/'};
  }
  if (spec.components?.schemas && typeof spec.components.schemas === 'object') {
    return {schemas: spec.components.schemas, prefix: '#/components/schemas/'};
  }
  return undefined;
}

// JSON pointer escaping of a single reference token (RFC 6901).
const decodeToken = (t) => t.replace(/~1/g, '/').replace(/~0/g, '~');
const encodeToken = (t) => t.replace(/~/g, '~0').replace(/\//g, '~1');

/**
 * The display copy of `spec`: same paths, parameters and responses, with schema nesting capped at
 * `maxDepth` `$ref` hops from each operation. `spec` itself isn't modified.
 * @param {object} spec a parsed Swagger 2.0 or OpenAPI 3 document
 * @param {{maxDepth?: number}} [options]
 * @returns {object}
 */
export function displaySpec(spec, {maxDepth = DEFAULT_MAX_DEPTH} = {}) {
  if (!Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new Error(`maxDepth must be a positive integer, got ${maxDepth}`);
  }
  const out = structuredClone(spec);
  const store = schemaStore(out);
  if (!store) return out;
  const {schemas, prefix} = store;
  const originals = Object.keys(schemas);
  const names = new Set(originals);

  const nameOf = (ref) =>
    typeof ref === 'string' && ref.startsWith(prefix) ? decodeToken(ref.slice(prefix.length)) : undefined;
  const refTo = (name) => prefix + encodeToken(name);
  const copyName = (name, depth) => (depth === 1 ? name : `${name}${DEPTH_SUFFIX}${depth}`);

  const stub = (name) => ({
    type: 'object',
    title: name,
    description: `\`${name}\`: nested too deep to show here. Download the spec for the full schema.`,
  });

  // Rewrites the schema references inside `node`, which sits at `depth` (the number of `$ref` hops
  // already taken). A reference to a named schema becomes a reference to its copy at depth + 1, or
  // a stub past maxDepth.
  const rewrite = (node, depth) => {
    if (Array.isArray(node)) return node.map((v) => rewrite(v, depth));
    if (!node || typeof node !== 'object') return node;
    const target = nameOf(node.$ref);
    if (target !== undefined && names.has(target)) {
      const next = depth + 1;
      return next > maxDepth ? stub(target) : {...node, $ref: refTo(copyName(target, next))};
    }
    const result = {};
    for (const [key, value] of Object.entries(node)) result[key] = rewrite(value, depth);
    return result;
  };

  // The depth copies, built from the untouched originals.
  const source = structuredClone(schemas);
  for (const name of originals) {
    schemas[name] = rewrite(source[name], 1);
    for (let depth = 2; depth <= maxDepth; depth++) {
      const copy = copyName(name, depth);
      if (names.has(copy)) throw new Error(`the spec already has a schema named ${copy}`);
      schemas[copy] = {title: name, ...rewrite(source[name], depth)};
    }
  }

  // Everything outside the named schemas references them from depth 0: paths, and the reusable
  // parameters, responses, request bodies and headers.
  for (const [key, value] of Object.entries(out)) {
    if (key === 'definitions') continue;
    if (key === 'components') {
      for (const [section, entries] of Object.entries(value ?? {})) {
        if (section !== 'schemas') value[section] = rewrite(entries, 0);
      }
      continue;
    }
    out[key] = rewrite(value, 0);
  }
  return out;
}

/**
 * The largest number of schema nodes a single operation of `spec` expands into when every `$ref`
 * is followed until a cycle, the way Redoc 2 renders it. Useful to compare a spec with its display
 * copy. Stops counting at `limit`.
 * @param {object} spec
 * @param {number} [limit]
 */
export function largestExpansion(spec, limit = 1e6) {
  const store = schemaStore(spec);
  if (!store) return 0;
  const {schemas, prefix} = store;
  const refsIn = (node, refs = []) => {
    if (Array.isArray(node)) node.forEach((v) => refsIn(v, refs));
    else if (node && typeof node === 'object') {
      if (typeof node.$ref === 'string' && node.$ref.startsWith(prefix)) {
        refs.push(decodeToken(node.$ref.slice(prefix.length)));
      }
      Object.values(node).forEach((v) => refsIn(v, refs));
    }
    return refs;
  };
  const children = new Map(Object.keys(schemas).map((n) => [n, refsIn(schemas[n])]));
  let largest = 0;
  for (const methods of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(methods ?? {})) {
      let budget = limit;
      const expand = (name, stack) => {
        if (--budget <= 0 || stack.has(name)) return 1;
        stack.add(name);
        let n = 1;
        for (const child of children.get(name) ?? []) n += expand(child, stack);
        stack.delete(name);
        return n;
      };
      const total = refsIn(operation).reduce((sum, name) => sum + expand(name, new Set()), 0);
      largest = Math.max(largest, Math.min(total, limit));
    }
  }
  return largest;
}

/**
 * Reads the spec at `specFile` (YAML or JSON) and writes its display copy to `outFile` as JSON.
 * @param {string} specFile
 * @param {string} outFile
 * @param {{maxDepth?: number}} [options]
 */
export function writeDisplaySpec(specFile, outFile, options) {
  const spec = yaml.load(fs.readFileSync(specFile, 'utf8'), {filename: specFile});
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  fs.writeFileSync(outFile, JSON.stringify(displaySpec(spec, options)));
}
