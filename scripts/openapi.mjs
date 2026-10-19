// The OpenAPI specs of the instances that declare `openapi` in instances.yaml, one file per version
// line at openapi/<id>/<line>.yaml. Shared by docusaurus.config.ts, which gives each spec a Redoc
// page at /<route>/<line>/reference (src/plugins/openapi-reference.ts), and by the sidebars
// scripts/gen-sidebars.mjs writes, which link to the newest one.
//
// Like instances.mjs, everything takes the site directory as an argument (no import.meta).
import fs from 'node:fs';
import path from 'node:path';

const LINE = /^(\d+)\.(\d+)$/;

/** @param {string} a @param {string} b newest first */
function compareLinesDesc(a, b) {
  const [, aMajor, aMinor] = LINE.exec(a);
  const [, bMajor, bMinor] = LINE.exec(b);
  return Number(bMajor) - Number(aMajor) || Number(bMinor) - Number(aMinor);
}

/** The directory holding an instance's specs, relative to the site directory. */
export function specDir(id) {
  return path.join('openapi', id);
}

/**
 * The version lines that have a spec in openapi/<id>/, newest first.
 * @param {string} siteDir
 * @param {string} id
 * @returns {string[]}
 */
export function specLines(siteDir, id) {
  const dir = path.join(siteDir, specDir(id));
  if (!fs.existsSync(dir)) return [];
  const lines = [];
  for (const name of fs.readdirSync(dir)) {
    const line = name.replace(/\.yaml$/, '');
    if (name.endsWith('.yaml') && LINE.test(line)) lines.push(line);
  }
  return lines.sort(compareLinesDesc);
}

/** The route of a line's API reference, without the baseUrl. */
export function referenceRoute(route, line) {
  return `/${route}/${line}/reference`;
}

/**
 * The sidebar item linking to the newest spec's reference, or nothing when there's no spec.
 *
 * The current docs link to the newest spec, and a version cut freezes the link into the new
 * line's sidebar: add the line's spec before cutting it.
 * @param {string} siteDir
 * @param {string} id
 * @param {string} route
 */
export function referenceSidebarItems(siteDir, id, route) {
  const [newest] = specLines(siteDir, id);
  if (!newest) return [];
  return [{type: 'link', label: 'API reference', href: referenceRoute(route, newest)}];
}

/**
 * The Redoc pages to build for an instance: every spec, except the released lines the build
 * leaves out. Throws when a released line the build includes has no spec.
 * @param {string} siteDir
 * @param {{id: string, route: string, lines: string[]}} inst
 * @param {string[]} includedVersions the versions the docs plugin builds (may include 'current')
 * @returns {{id: string, line: string, spec: string, route: string}[]}
 */
export function referenceSpecs(siteDir, inst, includedVersions) {
  const lines = specLines(siteDir, inst.id);
  const missing = inst.lines.filter((l) => includedVersions.includes(l) && !lines.includes(l));
  if (missing.length > 0) {
    throw new Error(
      `${inst.id}: no OpenAPI spec for released line(s) ${missing.join(', ')}; add ${missing
        .map((l) => path.join(specDir(inst.id), `${l}.yaml`))
        .join(', ')}`,
    );
  }
  return lines
    .filter((l) => includedVersions.includes(l) || !inst.lines.includes(l))
    .map((l) => ({
      id: `${inst.id}-${l.replace('.', '-')}`,
      line: l,
      spec: path.join(siteDir, specDir(inst.id), `${l}.yaml`),
      route: referenceRoute(inst.route, l),
    }));
}
