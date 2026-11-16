#!/usr/bin/env node
// Writes an instance's configuration reference page from its repository's code at a release tag.
//
//   node scripts/gen-config-ref.mjs --instance <api|ui|agent> --ref <tag> [--previous <tag>]
//
// Each instance has a source layout (LAYOUTS below) that reads the settings its code defines, in
// one or more groups, each rendered as its own table, together with the defaults the code sets:
//
//   - api: the viper keys cmd/root.go binds with viper.MustBindEnv (environment variable
//     CCF_<KEY>), with the defaults of its viper.SetDefault calls.
//   - ui: the keys of src/defaultconfig.json, the built-in values of the runtime config.json
//     (they must match the Config interface in src/stores/config.ts), and the VITE_* build-time
//     variables env.d.ts declares or src/stores/config.ts reads.
//   - agent: the configuration file keys of the agentconfig Config struct, read from
//     pkg/agentconfig/types.go of compliance-framework/api at the version the agent's go.mod
//     requires (or, for agents built before that package existed, from the runtime structs in
//     cmd/agent.go); the environment variables named in cmd/*.go; and the flags of the `agent`
//     command in cmd/agent.go.
//
// What the code can't tell (purpose, type, example, and the defaults the code doesn't set
// literally) comes from scripts/config-ref/<instance>.yaml, one map per group. The script fails
// when the two disagree, so a release that adds, drops or re-defaults a setting can't go out
// undocumented.
//
// With --previous, settings defined at --ref but not at --previous are marked "(new in <line>)".
// The files are read with `gh api` from the instance's repository; --source and
// --previous-source read the instance's own files from local checkouts instead (the agent's
// files from compliance-framework/api are always read with `gh`).
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

class ConfigRefError extends Error {}

/** Thrown when a file doesn't exist at the ref, so a layout can fall back to an older one. */
class MissingSourceError extends ConfigRefError {}

function gh(args) {
  return execFileSync('gh', args, {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
}

/**
 * Reads the files of `repo` at `ref`, from a local checkout when `sourceDir` is set. `other` reads
 * a file of another repository, always with `gh`.
 */
function sourceReader(repo, ref, sourceDir) {
  const fail = (what, err) => {
    const detail = err.stderr || err.message;
    const Err = /Not Found|HTTP 404|ENOENT/.test(detail) ? MissingSourceError : ConfigRefError;
    return new Err(`can't read ${what}: ${detail}`);
  };
  const remote = (r, at, file) => {
    try {
      return gh(['api', '-H', 'Accept: application/vnd.github.raw', `repos/${r}/contents/${file}?ref=${at}`]);
    } catch (err) {
      throw fail(`${file} of ${r} at ${at}`, err);
    }
  };
  return {
    read(file) {
      if (!sourceDir) return remote(repo, ref, file);
      try {
        return fs.readFileSync(path.join(sourceDir, file), 'utf8');
      } catch (err) {
        throw fail(`${file} of ${sourceDir}`, err);
      }
    },
    /** The names of the files in a directory. */
    list(dir) {
      if (sourceDir) return fs.readdirSync(path.join(sourceDir, dir));
      try {
        return JSON.parse(gh(['api', `repos/${repo}/contents/${dir}?ref=${ref}`])).map((e) => e.name);
      } catch (err) {
        throw fail(`${dir}/ of ${repo} at ${ref}`, err);
      }
    },
    other: remote,
  };
}

// ---- api: viper keys in cmd/root.go -------------------------------------------------------

const ROOT_GO = 'cmd/root.go';
const ENV_PREFIX = 'CCF_';

/** The bound keys and SetDefault values of an api-style cmd/root.go. */
export function parseRootGo(text) {
  const bound = [...text.matchAll(/viper\.MustBindEnv\("([a-z0-9_]+)"\)/g)].map((m) => m[1]);
  const defaults = new Map(
    [...text.matchAll(/viper\.SetDefault\("([a-z0-9_]+)",\s*"([^"]*)"\)/g)].map((m) => [m[1], m[2]]),
  );
  if (bound.length === 0) throw new ConfigRefError(`${ROOT_GO} binds no settings (viper.MustBindEnv)`);
  return {bound: new Set(bound), defaults};
}

// ---- ui: config.json keys and VITE_* variables --------------------------------------------

const UI_DEFAULT_CONFIG = 'src/defaultconfig.json';
const UI_CONFIG_STORE = 'src/stores/config.ts';
const UI_ENV_TYPES = 'env.d.ts';

/**
 * The runtime config.json keys with their built-in values (as JSON), checked against the Config
 * interface the UI reads them through.
 */
export function parseUiConfig(defaultConfigJson, configStoreTs) {
  const builtIn = JSON.parse(defaultConfigJson);
  const iface = /export interface Config \{([\s\S]*?)\n\}/.exec(configStoreTs);
  if (!iface) throw new ConfigRefError(`${UI_CONFIG_STORE} has no "export interface Config"`);
  const declared = new Set([...iface[1].matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\??\s*:/gm)].map((m) => m[1]));
  const problems = [
    ...Object.keys(builtIn)
      .filter((k) => !declared.has(k))
      .map((k) => `${k} is in ${UI_DEFAULT_CONFIG} but not in the Config interface`),
    ...[...declared]
      .filter((k) => !(k in builtIn))
      .map((k) => `${k} is in the Config interface but has no value in ${UI_DEFAULT_CONFIG}`),
  ];
  if (problems.length > 0) throw new ConfigRefError(problems.join('; '));
  return new Map(Object.entries(builtIn).map(([k, v]) => [k, {default: JSON.stringify(v)}]));
}

/** The VITE_* build-time variables the UI declares or reads. */
export function parseUiBuildVars(envTypesTs, configStoreTs) {
  const names = new Set([
    ...[...envTypesTs.matchAll(/readonly\s+(VITE_[A-Z0-9_]+)\??\s*:/g)].map((m) => m[1]),
    ...[...configStoreTs.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)].map((m) => m[1]),
  ]);
  return new Map([...names].map((n) => [n, {}]));
}

// ---- agent: config file keys, environment variables and flags ------------------------------

const AGENT_GO_MOD = 'go.mod';
const AGENT_API_MODULE = 'github.com/compliance-framework/api';
const AGENT_API_REPO = 'compliance-framework/api';
const AGENTCONFIG_TYPES = 'pkg/agentconfig/types.go';
const AGENT_CMD_DIR = 'cmd';
const AGENT_CMD_GO = 'cmd/agent.go';

/** The fields of each struct in a Go file: their type and mapstructure key. */
export function parseGoStructs(text) {
  const structs = new Map();
  for (const m of text.matchAll(/^type (\w+) struct \{\n([\s\S]*?)^\}/gm)) {
    const fields = [];
    for (const line of m[2].split('\n')) {
      const f = /^\s*(\w+)\s+(\S+)\s+`[^`]*\bmapstructure:"([^",]+)[^"]*"[^`]*`/.exec(line);
      if (f) fields.push({name: f[1], type: f[2], key: f[3]});
    }
    structs.set(m[1], fields);
  }
  return structs;
}

/**
 * The dotted keys of a configuration struct, walking nested structs and maps of structs (a map
 * key is written `<name>`, as in `plugins.<name>.source`).
 */
export function configKeys(structs, root) {
  if (!structs.has(root)) throw new ConfigRefError(`no struct ${root} to read the configuration keys from`);
  const keys = [];
  const walk = (name, prefix, seen) => {
    for (const f of structs.get(name)) {
      const key = prefix + f.key;
      const nested = f.type.replace(/^\*/, '');
      const mapOf = /^map\[string\]\*?(\w+)$/.exec(f.type);
      if (structs.has(nested) && !seen.includes(nested)) walk(nested, `${key}.`, [...seen, nested]);
      else if (mapOf && structs.has(mapOf[1]) && !seen.includes(mapOf[1])) {
        walk(mapOf[1], `${key}.<name>.`, [...seen, mapOf[1]]);
      } else keys.push(key);
    }
  };
  walk(root, '', [root]);
  return keys;
}

/** The api version an agent's go.mod requires. */
export function apiVersionFromGoMod(text) {
  const module = AGENT_API_MODULE.replace(/[./]/g, '\\$&');
  const m = new RegExp(`^\\s*(?:require\\s+)?${module}\\s+(v\\S+)`, 'm').exec(text);
  if (!m) throw new ConfigRefError(`${AGENT_GO_MOD} doesn't require ${AGENT_API_MODULE}`);
  return m[1];
}

// String literals that name an environment variable: upper-case words joined by `_`. A literal
// ending in `_` (a prefix such as "CCF_API_AUTH_") isn't one.
const ENV_LITERAL = /"([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)"/g;

/** The environment variable names in Go source files. */
export function parseEnvLiterals(texts) {
  return new Set(texts.flatMap((t) => [...t.matchAll(ENV_LITERAL)].map((m) => m[1])));
}

// Splits a Go argument list at its top-level commas (string literals may contain commas).
function goArgs(text) {
  const args = [];
  let cur = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      cur += c;
      if (c === '\\') cur += text[++i];
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      cur += c;
    } else if (c === ',') {
      args.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

/**
 * The flags a cobra command defines with `<cmd>.Flags().<Type>[P]("name", ["short",] [default,]
 * "usage")`, with their short form and the default the code sets (none for an empty string).
 */
export function parseCobraFlags(text) {
  const flags = new Map();
  for (const m of text.matchAll(/\.Flags\(\)\.(\w+?)(P?)\(("[^"]+",.*)\)\s*$/gm)) {
    const [, kind, p, rest] = m;
    const args = goArgs(rest);
    const name = JSON.parse(args.shift());
    const short = p ? JSON.parse(args.shift()) : undefined;
    let def;
    if (kind === 'Count') def = '0';
    else if (args.length >= 2) {
      const raw = args[0];
      def = raw.startsWith('"') ? JSON.parse(raw) : raw;
      if (def === '' || def === 'nil') def = undefined;
    }
    flags.set(name, {short, ...(def === undefined ? {} : {default: def})});
  }
  if (flags.size === 0) throw new ConfigRefError(`${AGENT_CMD_GO} defines no flags`);
  return flags;
}

/** The agent's configuration file keys at the source's ref. */
function agentFileKeys(src) {
  const apiVersion = apiVersionFromGoMod(src.read(AGENT_GO_MOD));
  let text;
  let root = 'Config';
  try {
    text = src.other(AGENT_API_REPO, apiVersion, AGENTCONFIG_TYPES);
  } catch (err) {
    if (!(err instanceof MissingSourceError)) throw err;
    // Agents before 0.9 kept the configuration structs in cmd/agent.go.
    text = src.read(AGENT_CMD_GO);
    root = 'agentConfig';
  }
  return new Map(configKeys(parseGoStructs(text), root).map((k) => [k, {}]));
}

// ---- layouts ------------------------------------------------------------------------------

const envExample = (name, example) => `${name}=${example}`;

const LAYOUTS = {
  api: {
    description: 'Every environment variable the API reads, with its type, default and an example.',
    intro: `This page is for **operators**. It lists the environment variables the API reads when it starts. You can also put them in a \`.env\` file in the API's working directory.

Single sign-on, email, Slack, workflow and risk settings live in their own YAML files. The settings below only give their paths.`,
    groups: [
      {
        key: 'settings',
        where: ROOT_GO,
        read(src) {
          const {bound, defaults} = parseRootGo(src.read(ROOT_GO));
          return new Map([...bound].map((k) => [k, defaults.has(k) ? {default: defaults.get(k)} : {}]));
        },
        name: (key) => ENV_PREFIX + key.toUpperCase(),
        example: envExample,
      },
    ],
  },
  ui: {
    description: 'Every setting the UI reads, at runtime from config.json or at build time, with its type, default and an example.',
    intro: `This page is for **operators** who deploy the UI and **developers** who build it. The UI is a static web app that reads its settings in the browser, so none of them can be a secret.`,
    groups: [
      {
        key: 'settings',
        title: 'Runtime settings (`config.json`)',
        intro: `When it loads, the UI fetches \`config.json\` from its own address. Each key the file doesn't set keeps the default below. In the container image, mount the file at \`/app/config.json\`. When the UI was built with \`VITE_API_URL\`, it doesn't fetch \`config.json\` at all.`,
        where: UI_DEFAULT_CONFIG,
        read: (src) => parseUiConfig(src.read(UI_DEFAULT_CONFIG), src.read(UI_CONFIG_STORE)),
        name: (key) => key,
        example: (name, example) => `"${name}": ${example}`,
      },
      {
        key: 'build',
        title: 'Build-time variables',
        intro: `Vite builds these into the app when you run \`npm run build\`, so a change needs a new build. Set them in the build's environment.`,
        where: `${UI_ENV_TYPES} and ${UI_CONFIG_STORE}`,
        read: (src) => parseUiBuildVars(src.read(UI_ENV_TYPES), src.read(UI_CONFIG_STORE)),
        name: (key) => key,
        example: envExample,
      },
    ],
  },
  agent: {
    description: 'Every setting the CCF Agent reads, from its configuration file, its environment and its flags, with its type, default and an example.',
    intro: `This page is for **operators**. The Continuous Compliance Framework (CCF) Agent reads a configuration file, a few environment variables and the flags of its \`agent\` command.`,
    groups: [
      {
        key: 'settings',
        title: 'Configuration file',
        intro: `Pass the file with \`--config\`. It can be YAML, JSON or TOML: the agent goes by the file's extension. Keys are lowercase, and \`<name>\` stands for a plugin name you choose.

An environment variable named \`CCF_\` followed by a key's path in upper case, with \`_\` between the parts, overrides that key when the file sets it: \`CCF_PLUGINS_GITHUB_CONFIG_TOKEN\` overrides \`plugins.github.config.token\`. Only \`api.auth.client_id\`, \`api.auth.client_secret\` and \`remote_config.mode\` can come from the environment when the file doesn't set them.`,
        where: `${AGENTCONFIG_TYPES} of ${AGENT_API_REPO}`,
        read: agentFileKeys,
        name: (key) => key,
        example: (_name, example) => example,
      },
      {
        key: 'environment',
        title: 'Environment variables',
        intro: `The variables the agent reads besides the \`CCF_\` overrides of file keys. Plugins get the agent's environment, except the variables whose names start with \`CCF_API_AUTH_\`.`,
        where: `${AGENT_CMD_DIR}/*.go`,
        read(src) {
          const files = src
            .list(AGENT_CMD_DIR)
            .filter((f) => f.endsWith('.go') && !f.endsWith('_test.go'))
            .sort();
          const names = parseEnvLiterals(files.map((f) => src.read(`${AGENT_CMD_DIR}/${f}`)));
          return new Map([...names].map((n) => [n, {}]));
        },
        name: (key) => key,
        example: envExample,
      },
      {
        key: 'flags',
        title: 'Flags of the `agent` command',
        intro: `A flag wins over the configuration file.`,
        where: AGENT_CMD_GO,
        read: (src) => parseCobraFlags(src.read(AGENT_CMD_GO)),
        name: (key, entry) => (entry?.short ? `-${entry.short}, --${key}` : `--${key}`),
        example: (_name, example) => example,
      },
    ],
  },
};

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

/**
 * Builds a group's table rows, failing on any mismatch between the code and the descriptions.
 *
 * @param {object} o
 * @param {Map<string, {default?: string}>} o.entries the settings the code defines, with the defaults it sets
 * @param {Set<string>} [o.previous] the settings defined at --previous
 * @param {Record<string, any>} o.settings the group's descriptions
 * @param {string} o.line the minor line of --ref, for "(new in <line>)"
 * @param {string} [o.where] where the code defines the settings, for the error messages
 * @param {(key: string, entry?: object) => string} [o.name] the setting as the table shows it
 * @param {(name: string, example: string) => string} [o.example] the example as the table shows it
 */
export function buildRows({
  entries,
  previous,
  settings,
  line,
  where = ROOT_GO,
  name = (key) => ENV_PREFIX + key.toUpperCase(),
  example = envExample,
}) {
  const problems = [];
  for (const key of entries.keys()) {
    if (!settings[key]) problems.push(`${key} is defined in ${where} but not described`);
  }
  for (const key of Object.keys(settings)) {
    if (!entries.has(key)) problems.push(`${key} is described but no longer defined in ${where}`);
  }
  for (const [key, s] of Object.entries(settings)) {
    if (!entries.has(key)) continue;
    for (const field of ['purpose', 'type', 'example']) {
      if (typeof s[field] !== 'string' || s[field] === '') problems.push(`${key} has no ${field}`);
    }
    const codeDefault = entries.get(key).default;
    if (codeDefault !== undefined && s.default !== undefined) {
      problems.push(`${key}: its default comes from ${where}; drop "default" from the descriptions`);
    }
    if (codeDefault === undefined && s.default === undefined) {
      problems.push(`${key} has no default in ${where}, so the descriptions need a "default" (or "*required*")`);
    }
  }
  if (problems.length > 0) {
    throw new ConfigRefError(`the descriptions don't match ${where}:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }

  return [...entries]
    .map(([key, entry]) => {
      const s = settings[key];
      const shown = name(key, entry);
      let purpose = checkMarkdown(`${key}.purpose`, s.purpose.trim());
      if (previous && !previous.has(key)) purpose += ` *(new in ${line})*`;
      const def = entry.default !== undefined ? code(entry.default) : checkMarkdown(`${key}.default`, s.default);
      return {name: shown, cells: [code(shown), purpose, code(s.type), def, code(example(shown, s.example))]};
    })
    .sort((a, b) => sortName(a.name).localeCompare(sortName(b.name)));
}

// Flags sort by their long name: `-c, --config` before `--state-dir`.
const sortName = (name) => name.replace(/^-\w, /, '').replace(/^-+/, '');

function table(rows) {
  return `| Setting | Purpose | Type | Default | Example |
|---|---|---|---|---|
${rows.map((r) => `| ${r.cells.join(' | ')} |`).join('\n')}
`;
}

/** The page: the layout's intro, then one table per group, under the group's heading if it has one. */
export function renderPage({instance, layout, repo, ref, previous, tables}) {
  const generatedFrom = `${repo} ${ref}${previous ? `, compared with ${previous}` : ''}`;
  const body = tables
    .map(({group, rows}) => (group.title ? `## ${group.title}\n\n${group.intro}\n\n${table(rows)}` : table(rows)))
    .join('\n');
  return `---
title: Configuration reference
description: ${layout.description}
sidebar_position: 2
---

{/* Generated by scripts/gen-config-ref.mjs from ${generatedFrom}. Don't edit it by hand: change scripts/config-ref/${instance.id}.yaml and run the script again. */}

# Configuration reference

${layout.intro}

${body}`;
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
  const layout = LAYOUTS[instance.id];
  if (!layout) {
    throw new ConfigRefError(`no source layout for "${instance.id}"; known: ${Object.keys(LAYOUTS).join(', ')}`);
  }

  const descriptionsFile = path.join(siteDir, 'scripts', 'config-ref', `${instance.id}.yaml`);
  const descriptions = yaml.load(fs.readFileSync(descriptionsFile, 'utf8'));
  const missing = layout.groups.filter((g) => typeof descriptions?.[g.key] !== 'object' || descriptions[g.key] === null);
  if (descriptions?.version !== 1 || missing.length > 0) {
    const maps = layout.groups.map((g) => `"${g.key}"`).join(', ');
    throw new ConfigRefError(`${path.relative(siteDir, descriptionsFile)} needs "version: 1" and these maps: ${maps}`);
  }

  const src = sourceReader(instance.repo, values.ref, values.source);
  const previousSrc = values.previous && sourceReader(instance.repo, values.previous, values['previous-source']);

  const tables = layout.groups.map((group) => ({
    group,
    rows: buildRows({
      entries: group.read(src),
      previous: previousSrc ? new Set(group.read(previousSrc).keys()) : undefined,
      settings: descriptions[group.key],
      line,
      where: group.where,
      name: group.name,
      example: group.example,
    }),
  }));
  const count = tables.reduce((n, t) => n + t.rows.length, 0);

  const out = values.out ?? path.join(siteDir, instance.path, 'configuration.md');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(
    out,
    renderPage({instance, layout, repo: instance.repo, ref: values.ref, previous: values.previous, tables}),
  );
  console.log(`gen-config-ref: wrote ${count} settings to ${path.relative(siteDir, out)}.`);
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
