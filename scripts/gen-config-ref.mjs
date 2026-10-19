#!/usr/bin/env node
// Writes an instance's configuration reference page from its repository's code at a release tag.
//
//   node scripts/gen-config-ref.mjs --instance api --ref v0.21.0 [--previous v0.20.0]
//
// Today it knows one source layout, the api's: the settings are the viper keys that cmd/root.go
// binds with viper.MustBindEnv (environment variable CCF_<KEY>), and their defaults are its
// viper.SetDefault calls. What the code can't tell (purpose, type, example, and the defaults set
// elsewhere) comes from scripts/config-ref/<instance>.yaml. The script fails when the two
// disagree, so a release that adds, drops or re-defaults a setting can't go out undocumented.
//
// With --previous, settings bound at --ref but not at --previous are marked "(new in <line>)".
// The files are read with `gh api` from the instance's repository; --source and
// --previous-source read them from local checkouts instead.
//
// The page goes to <instance path>/configuration.md, the current (unreleased) docs, or --out.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import yaml from 'js-yaml';
import {loadManifest} from './instances.mjs';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ROOT_GO = 'cmd/root.go';
const ENV_PREFIX = 'CCF_';

class ConfigRefError extends Error {}

/** Reads a file of `repo` at `ref`, from a local checkout when `sourceDir` is set. */
function readSource(repo, ref, file, sourceDir) {
  if (sourceDir) return fs.readFileSync(path.join(sourceDir, file), 'utf8');
  try {
    return execFileSync(
      'gh',
      ['api', '-H', 'Accept: application/vnd.github.raw', `repos/${repo}/contents/${file}?ref=${ref}`],
      {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']},
    );
  } catch (err) {
    throw new ConfigRefError(`can't read ${file} of ${repo} at ${ref}: ${err.stderr || err.message}`);
  }
}

/** The bound keys and SetDefault values of an api-style cmd/root.go. */
export function parseRootGo(text) {
  const bound = [...text.matchAll(/viper\.MustBindEnv\("([a-z0-9_]+)"\)/g)].map((m) => m[1]);
  const defaults = new Map(
    [...text.matchAll(/viper\.SetDefault\("([a-z0-9_]+)",\s*"([^"]*)"\)/g)].map((m) => [m[1], m[2]]),
  );
  if (bound.length === 0) throw new ConfigRefError(`${ROOT_GO} binds no settings (viper.MustBindEnv)`);
  return {bound: new Set(bound), defaults};
}

// MDX reads `{`, `}` and `<` as JSX outside code; a table cell also ends at `|`.
function checkMarkdown(where, text) {
  const outsideCode = text.replace(/`[^`]*`/g, '');
  if (/[{}<]/.test(outsideCode)) {
    throw new ConfigRefError(`${where}: keep {, } and < inside \`code\` (MDX would parse them)`);
  }
  return text.replace(/\|/g, '\\|');
}

function code(text) {
  return '`' + text.replace(/\|/g, '\\|') + '`';
}

/** Builds the table rows, failing on any mismatch between the code and the descriptions. */
export function buildRows({bound, defaults, previousBound, settings, line}) {
  const problems = [];
  for (const key of bound) {
    if (!settings[key]) problems.push(`${key} is bound in ${ROOT_GO} but not described`);
  }
  for (const key of Object.keys(settings)) {
    if (!bound.has(key)) problems.push(`${key} is described but no longer bound in ${ROOT_GO}`);
  }
  for (const [key, s] of Object.entries(settings)) {
    if (!bound.has(key)) continue;
    for (const field of ['purpose', 'type', 'example']) {
      if (typeof s[field] !== 'string' || s[field] === '') problems.push(`${key} has no ${field}`);
    }
    if (defaults.has(key) && s.default !== undefined) {
      problems.push(`${key}: its default comes from viper.SetDefault; drop "default" from the descriptions`);
    }
    if (!defaults.has(key) && s.default === undefined) {
      problems.push(`${key} has no viper.SetDefault, so the descriptions need a "default" (or "*required*")`);
    }
  }
  if (problems.length > 0) {
    throw new ConfigRefError(`the descriptions don't match ${ROOT_GO}:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }

  return [...bound]
    .map((key) => {
      const s = settings[key];
      const env = ENV_PREFIX + key.toUpperCase();
      let purpose = checkMarkdown(`${key}.purpose`, s.purpose.trim());
      if (previousBound && !previousBound.has(key)) purpose += ` *(new in ${line})*`;
      const def = defaults.has(key) ? code(defaults.get(key)) : checkMarkdown(`${key}.default`, s.default);
      return {env, cells: [code(env), purpose, code(s.type), def, code(`${env}=${s.example}`)]};
    })
    .sort((a, b) => a.env.localeCompare(b.env));
}

export function renderPage({instance, repo, ref, previous, rows}) {
  const generatedFrom = `${repo} ${ref}${previous ? `, compared with ${previous}` : ''}`;
  return `---
title: Configuration reference
description: Every environment variable the ${instance.label} reads, with its type, default and an example.
sidebar_position: 2
---

{/* Generated by scripts/gen-config-ref.mjs from ${generatedFrom}. Don't edit it by hand: change scripts/config-ref/${instance.id}.yaml and run the script again. */}

# Configuration reference

This page is for **operators**. It lists the environment variables the ${instance.label} reads when it starts. You can also put them in a \`.env\` file in the API's working directory.

Single sign-on, email, Slack, workflow and risk settings live in their own YAML files. The settings below only give their paths.

| Setting | Purpose | Type | Default | Example |
|---|---|---|---|---|
${rows.map((r) => `| ${r.cells.join(' | ')} |`).join('\n')}
`;
}

function main() {
  const {values} = parseArgs({
    options: {
      instance: {type: 'string', default: 'api'},
      ref: {type: 'string'},
      previous: {type: 'string'},
      source: {type: 'string'},
      'previous-source': {type: 'string'},
      out: {type: 'string'},
    },
  });
  if (!values.ref) throw new ConfigRefError('--ref is required, e.g. --ref v0.21.0');
  const match = /^v?(\d+)\.(\d+)\.\d+(?:-[0-9A-Za-z.-]+)?$/.exec(values.ref);
  if (!match) throw new ConfigRefError(`--ref must be a release tag such as v0.21.0, got "${values.ref}"`);
  const line = `${match[1]}.${match[2]}`;

  const manifest = loadManifest(siteDir);
  const instance = manifest.instances.find((i) => i.id === values.instance);
  if (!instance) throw new ConfigRefError(`no instance "${values.instance}" in instances.yaml`);

  const descriptionsFile = path.join(siteDir, 'scripts', 'config-ref', `${instance.id}.yaml`);
  const descriptions = yaml.load(fs.readFileSync(descriptionsFile, 'utf8'));
  if (descriptions?.version !== 1 || typeof descriptions.settings !== 'object') {
    throw new ConfigRefError(`${path.relative(siteDir, descriptionsFile)} needs "version: 1" and a "settings" map`);
  }

  const {bound, defaults} = parseRootGo(readSource(instance.repo, values.ref, ROOT_GO, values.source));
  const previousBound = values.previous
    ? parseRootGo(readSource(instance.repo, values.previous, ROOT_GO, values['previous-source'])).bound
    : undefined;

  const rows = buildRows({bound, defaults, previousBound, settings: descriptions.settings, line});
  const out = values.out ?? path.join(siteDir, instance.path, 'configuration.md');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(
    out,
    renderPage({instance, repo: instance.repo, ref: values.ref, previous: values.previous, rows}),
  );
  console.log(`gen-config-ref: wrote ${rows.length} settings to ${path.relative(siteDir, out)}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    if (err instanceof ConfigRefError || err.name === 'InstancesError' || err.name === 'YAMLException') {
      console.error(`gen-config-ref: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
