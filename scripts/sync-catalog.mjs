#!/usr/bin/env node
// Builds the plugin catalog from GitHub: an instance and a baseline page for every released CCF
// plugin, and the catalog landing page's data.
//
//   node scripts/sync-catalog.mjs [--org compliance-framework] [--dry-run]
//
// It reads everything with `gh api` (read-only) and:
//
//   1. finds the plugins: the org's unarchived `plugin-*` repositories that aren't `*-policies`
//      bundles and have a final release (not a draft or pre-release, with a plain semver tag);
//   2. adds an instances.yaml entry for each plugin that has none, without `policies`: the plugin
//      to policy-bundle mapping is the manifest's `policies` lists, written by hand, never derived
//      from repository names;
//   3. writes each plugin instance's page, <path>/index.md, from the plugin's README at its newest
//      final release and the policies catalog of its mapped bundles (each at its newest final
//      release, with the controls its policies' METADATA lists);
//   4. puts that page in the release's minor line: a line that's already released is edited in
//      place (a patch release); a new one is cut with `docusaurus docs:version:<id> <line>`;
//   5. writes src/data/catalog.json, which src/pages/catalog.tsx renders.
//
// It then reports the policy bundles no instance maps, so someone can add them to the right
// plugin's `policies`. Released lines other than the newest are never touched.
//
// --dry-run reads GitHub and prints the report without writing anything.
import {execFile, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs, promisify} from 'node:util';
import {
  appendInstances,
  catalogData,
  isPluginRepo,
  isPolicyRepo,
  latestFinalRelease,
  newPluginInstance,
  policyFiles,
  regoControls,
  renderPluginPage,
  sortControls,
} from './catalog.mjs';
import {InstancesError, MANIFEST, loadManifest, releasedLines} from './instances.mjs';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_DATA = 'src/data/catalog.json';

class SyncError extends Error {}

const run = promisify(execFile);

/**
 * The GitHub reads the sync needs, through `gh api`. Tests pass a fake with the same methods.
 * @param {(args: string[]) => Promise<string>} ghApi
 */
export function githubSource(ghApi) {
  const notFound = (err) => /Not Found|HTTP 404/.test(err.stderr || err.message || '');
  return {
    /** The org's repositories: name, archived and description. */
    async repos(org) {
      const out = await ghApi(['--paginate', `orgs/${org}/repos?per_page=100&type=all`, '--jq', '.[] | {name, archived, description}']);
      return out.split('\n').filter(Boolean).map((l) => JSON.parse(l));
    },
    async releases(repo) {
      const out = await ghApi(['--paginate', `repos/${repo}/releases?per_page=100`, '--jq', '.[] | {tag_name, draft, prerelease}']);
      return out.split('\n').filter(Boolean).map((l) => JSON.parse(l));
    },
    async description(repo) {
      return (await ghApi([`repos/${repo}`, '--jq', '.description // ""'])).trim() || null;
    },
    /** A file's text at a ref, or null when it doesn't exist there. */
    async file(repo, ref, file) {
      try {
        return await ghApi(['-H', 'Accept: application/vnd.github.raw', `repos/${repo}/contents/${file}?ref=${ref}`]);
      } catch (err) {
        if (notFound(err)) return null;
        throw err;
      }
    },
    /** The paths of the files at a ref. */
    async tree(repo, ref) {
      const out = await ghApi([`repos/${repo}/git/trees/${ref}?recursive=1`, '--jq', '.tree[] | select(.type == "blob") | .path']);
      return out.split('\n').filter(Boolean);
    },
  };
}

async function ghApi(args) {
  const {stdout} = await run('gh', ['api', ...args], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  return stdout;
}

/** Runs `fn` over `items`, `limit` at a time, keeping their order. */
async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, worker));
  return results;
}

/**
 * Reads what the catalog needs from GitHub. Pure apart from `gh`: it writes nothing.
 * @param {ReturnType<typeof githubSource>} gh
 * @param {{org: string, manifest: import('./instances.mjs').Manifest}} opts
 */
export async function collect(gh, {org, manifest}) {
  const warnings = [];
  const repos = (await gh.repos(org)).filter((r) => !r.archived);
  const descriptions = new Map(repos.map((r) => [`${org}/${r.name}`, r.description || null]));
  const candidates = repos.filter((r) => isPluginRepo(r.name) || isPolicyRepo(r.name)).map((r) => `${org}/${r.name}`);

  // Every repository a plugin instance names, even outside the org's naming, gets its release read.
  const named = manifest.instances.filter((i) => i.kind === 'plugin').flatMap((i) => [i.repo, ...(i.policies ?? [])]);
  const toRead = [...new Set([...candidates, ...named])];
  const released = new Map();
  await pool(toRead, 8, async (repo) => {
    try {
      const latest = latestFinalRelease(await gh.releases(repo));
      if (latest) released.set(repo, latest);
    } catch (err) {
      warnings.push(`can't read the releases of ${repo}: ${(err.stderr || err.message).trim()}`);
    }
  });

  const pluginRepos = candidates.filter((r) => isPluginRepo(r.split('/')[1]) && released.has(r)).sort();
  const known = new Set(manifest.instances.map((i) => i.repo));
  const added = pluginRepos.filter((r) => !known.has(r)).map((r) => newPluginInstance(org, r.split('/')[1]));
  const instances = [...manifest.instances, ...added].filter((i) => i.kind === 'plugin');

  for (const inst of instances) {
    if (!released.has(inst.repo)) warnings.push(`${inst.id}: ${inst.repo} has no final release; its instance isn't built`);
  }

  const bundleCache = new Map();
  const bundle = (repo) => {
    if (!bundleCache.has(repo)) {
      bundleCache.set(
        repo,
        (async () => {
          const rel = released.get(repo);
          if (!rel) return null;
          const files = policyFiles(await gh.tree(repo, rel.tag));
          const texts = await pool(files, 8, (f) => gh.file(repo, rel.tag, f));
          return {repo, version: rel.tag, controls: sortControls(texts.flatMap((t) => (t ? regoControls(t) : [])))};
        })(),
      );
    }
    return bundleCache.get(repo);
  };

  const plugins = [];
  for (const inst of instances) {
    const rel = released.get(inst.repo);
    if (!rel) continue;
    const [readme, description] = await Promise.all([
      gh.file(inst.repo, rel.tag, 'README.md'),
      descriptions.has(inst.repo) ? descriptions.get(inst.repo) : gh.description(inst.repo),
    ]);
    if (readme === null) warnings.push(`${inst.id}: ${inst.repo} ${rel.tag} has no README.md; its page has the policies catalog only`);
    const bundles = [];
    for (const repo of inst.policies ?? []) {
      const b = await bundle(repo);
      if (b) bundles.push(b);
      else warnings.push(`${inst.id}: policy bundle ${repo} has no final release; it's left out of the policies catalog`);
    }
    plugins.push({instance: inst, tag: rel.tag, line: rel.line, readme, description, bundles});
  }

  const mapped = new Set(instances.flatMap((i) => i.policies ?? []));
  const unmapped = candidates.filter((r) => isPolicyRepo(r.split('/')[1]) && released.has(r) && !mapped.has(r)).sort();
  return {added, plugins, unmapped, warnings};
}

/** Writes the pages, cuts the new lines and writes the catalog data. Returns what it cut. */
function write({added, plugins}) {
  const manifestFile = path.join(siteDir, MANIFEST);
  if (added.length > 0) {
    fs.writeFileSync(manifestFile, appendInstances(fs.readFileSync(manifestFile, 'utf8'), added));
    loadManifest(siteDir); // The new entries must still match the schema.
  }

  const toCut = [];
  const edited = [];
  for (const p of plugins) {
    const page = renderPluginPage(p);
    const current = path.join(siteDir, p.instance.path, 'index.md');
    fs.mkdirSync(path.dirname(current), {recursive: true});
    fs.writeFileSync(current, page);
    const lines = releasedLines(siteDir, p.instance);
    if (lines.includes(p.line)) {
      if (lines[0] !== p.line) {
        throw new SyncError(`${p.instance.id}: ${p.tag} is in line ${p.line}, but ${lines[0]} is newer; edit it by hand`);
      }
      const versioned = path.join(siteDir, `${p.instance.id}_versioned_docs`, `version-${p.line}`, 'index.md');
      fs.writeFileSync(versioned, page);
      edited.push(`${p.instance.id} ${p.line}`);
    } else {
      toCut.push(p);
    }
  }

  if (toCut.length > 0) {
    // The cut loads docusaurus.config.ts, which needs every instance's sidebar.
    execFileSync(process.execPath, [path.join(siteDir, 'scripts', 'gen-sidebars.mjs')], {stdio: 'inherit'});
    const docusaurus = path.join(siteDir, 'node_modules', '@docusaurus', 'core', 'bin', 'docusaurus.mjs');
    // Without NO_UPDATE_NOTIFIER the CLI may run `yarn --version`, which fails where yarn only
    // runs through corepack.
    const env = {...process.env, NO_UPDATE_NOTIFIER: '1'};
    for (const p of toCut) {
      execFileSync(process.execPath, [docusaurus, `docs:version:${p.instance.id}`, p.line], {cwd: siteDir, env, stdio: 'inherit'});
    }
  }

  const dataFile = path.join(siteDir, CATALOG_DATA);
  fs.mkdirSync(path.dirname(dataFile), {recursive: true});
  fs.writeFileSync(dataFile, `${JSON.stringify(catalogData(plugins), null, 2)}\n`);
  return {cut: toCut.map((p) => `${p.instance.id} ${p.line}`), edited};
}

function report({added, plugins, unmapped, warnings}, written) {
  const lines = [`sync-catalog: ${plugins.length} released plugins.`];
  if (added.length > 0) lines.push(`  added to ${MANIFEST}: ${added.map((i) => i.id).join(', ')}`);
  if (written) {
    if (written.cut.length > 0) lines.push(`  cut: ${written.cut.join(', ')}`);
    if (written.edited.length > 0) lines.push(`  edited in place: ${written.edited.join(', ')}`);
  }
  if (unmapped.length > 0) {
    lines.push(`  unmapped policy bundles (add each to its plugin's \`policies\` in ${MANIFEST}):`);
    lines.push(...unmapped.map((r) => `    - ${r}`));
  }
  for (const w of warnings) lines.push(`  warning: ${w}`);
  console.log(lines.join('\n'));
}

async function main() {
  const {values} = parseArgs({
    options: {
      org: {type: 'string', default: 'compliance-framework'},
      'dry-run': {type: 'boolean', default: false},
    },
  });
  const manifest = loadManifest(siteDir);
  const result = await collect(githubSource(ghApi), {org: values.org, manifest});
  report(result, values['dry-run'] ? null : write(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    if (err instanceof SyncError || err instanceof InstancesError) {
      console.error(`sync-catalog: ${err.message}`);
      process.exit(1);
    }
    throw err;
  });
}
