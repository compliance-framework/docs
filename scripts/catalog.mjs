// The pure half of scripts/sync-catalog.mjs: release selection, the plugin page, the policies
// catalog table, the catalog data and the instances.yaml entries. No network, no files.
import path from 'node:path';
import yaml from 'js-yaml';

export const GITHUB = 'https://github.com';

// ---- releases --------------------------------------------------------------------------------

/** A final release tag (`v1.2.3` or `1.2.3`, no pre-release or build suffix), or null. */
export function parseFinalTag(tag) {
  const m = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag);
  return m ? {tag, major: +m[1], minor: +m[2], patch: +m[3]} : null;
}

/**
 * The newest final release: not a draft, not marked pre-release, and with a plain semver tag.
 * @param {{tag_name: string, draft?: boolean, prerelease?: boolean}[]} releases
 * @returns {{tag: string, line: string} | null}
 */
export function latestFinalRelease(releases) {
  let best = null;
  for (const r of releases) {
    if (r.draft || r.prerelease) continue;
    const v = parseFinalTag(r.tag_name);
    if (!v) continue;
    if (!best || compareVersions(v, best) > 0) best = v;
  }
  return best && {tag: best.tag, line: `${best.major}.${best.minor}`};
}

function compareVersions(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

// ---- repositories -----------------------------------------------------------------------------

/** Whether an org repository is a plugin (`plugin-*`, not a `*-policies` bundle). */
export function isPluginRepo(name) {
  return name.startsWith('plugin-') && !name.endsWith('-policies');
}

/** Whether an org repository is a policy bundle (`plugin-*-policies`). */
export function isPolicyRepo(name) {
  return name.startsWith('plugin-') && name.endsWith('-policies');
}

// Words of a plugin name that aren't written in title case. Only the label of a new instance comes
// from this; instances.yaml keeps whatever label an entry already has.
const WORDS = {
  acm: 'ACM',
  apigateway: 'API Gateway',
  apt: 'APT',
  aws: 'AWS',
  cloudfront: 'CloudFront',
  ec2: 'EC2',
  ecr: 'ECR',
  eks: 'EKS',
  elb: 'ELB',
  github: 'GitHub',
  gitlab: 'GitLab',
  http: 'HTTP',
  k8s: 'Kubernetes',
  psql: 'PostgreSQL',
  rds: 'RDS',
  s3: 'S3',
  secretsmanager: 'Secrets Manager',
  ssh: 'SSH',
  vpc: 'VPC',
};

/**
 * The instances.yaml entry of a plugin repository that has none yet: id = repository name, files
 * under plugins/<name without "plugin-">, served at catalog/<same>. No `policies`: the mapping is
 * written by hand, never derived from names.
 */
export function newPluginInstance(org, repoName) {
  const slug = repoName.replace(/^plugin-/, '');
  const label = slug
    .split('-')
    .map((w) => WORDS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    id: repoName,
    kind: 'plugin',
    repo: `${org}/${repoName}`,
    path: `plugins/${slug}`,
    route: `catalog/${slug}`,
    label,
  };
}

/**
 * Adds instance entries to the text of instances.yaml, after the last instance and before the
 * `build:` key, in the file's own layout, so its comments survive.
 */
export function appendInstances(manifestText, instances) {
  if (instances.length === 0) return manifestText;
  const keys = ['id', 'kind', 'repo', 'path', 'route', 'label', 'navbar', 'policies'];
  const block = instances
    .map((inst) => {
      const lines = [];
      for (const key of keys) {
        if (inst[key] === undefined) continue;
        const value = inst[key];
        if (Array.isArray(value)) {
          lines.push(`${key}:`, ...value.map((v) => `  - ${yamlScalar(v)}`));
        } else {
          lines.push(`${key}: ${yamlScalar(value)}`);
        }
      }
      return lines.map((l, i) => (i === 0 ? `  - ${l}` : `    ${l}`)).join('\n');
    })
    .join('\n');
  const lines = manifestText.split('\n');
  const build = lines.findIndex((l) => /^build:/.test(l));
  if (build === -1) {
    const text = manifestText.endsWith('\n') ? manifestText : `${manifestText}\n`;
    return `${text}${block}\n`;
  }
  return [...lines.slice(0, build), block, ...lines.slice(build)].join('\n');
}

function yamlScalar(value) {
  return yaml.dump(value, {lineWidth: -1}).trimEnd();
}

// ---- policy bundles ---------------------------------------------------------------------------

/**
 * The control IDs a Rego file's METADATA annotations list under `custom.controls`, in order.
 * Annotations that don't parse are skipped: they're the bundle's problem, not the page's.
 */
export function regoControls(text) {
  const controls = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^#\s*METADATA\s*$/.test(lines[i])) continue;
    const body = [];
    for (i++; i < lines.length && /^#/.test(lines[i]); i++) body.push(lines[i].replace(/^# ?/, ''));
    let meta;
    try {
      meta = yaml.load(body.join('\n'));
    } catch {
      continue;
    }
    const listed = meta?.custom?.controls;
    if (Array.isArray(listed)) controls.push(...listed.filter((c) => typeof c === 'string'));
  }
  return controls;
}

/** The Rego policy files of a bundle (no tests), from the paths of its tree. */
export function policyFiles(paths) {
  return paths.filter((p) => p.endsWith('.rego') && !p.endsWith('_test.rego')).sort();
}

/** Unique control IDs, in natural order (`CC6.2` before `CC6.10`). */
export function sortControls(controls) {
  return [...new Set(controls)].sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
}

/**
 * The policies catalog table (STYLE.md "Policies catalog"). No bundle publishes compatibility
 * metadata yet, so every row is compatible with "latest".
 * @param {{repo: string, version: string, controls: string[]}[]} bundles
 */
export function policiesTable(bundles) {
  const rows = bundles.map((b) => {
    const name = b.repo.split('/')[1];
    const controls = b.controls.length > 0 ? b.controls.join(', ') : '*none listed*';
    return `| [\`${name}\`](${GITHUB}/${b.repo}) | \`${b.version}\` | ${controls} | latest |`;
  });
  return [
    '| Bundle | Latest version | Controls covered | Compatible plugin lines |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---- README → plugin page ---------------------------------------------------------------------

/**
 * Calls `fn` on each line outside fenced code blocks and keeps the lines inside them as they are.
 * A fence closes on a line of at least as many of the same characters and nothing else.
 */
function mapOutsideFences(lines, fn) {
  let fence = null;
  return lines.map((line) => {
    const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length && open[2].trim() === '') fence = null;
      return line;
    }
    if (open) {
      fence = open[1];
      return line;
    }
    return fn(line);
  });
}

/**
 * Splits a README into its title (the first `#` heading), the intro before the first section, and
 * its sections (`##` headings, or later `#` ones), ignoring headings inside fenced code.
 * @returns {{title: string | null, intro: string[], sections: {heading: string, lines: string[]}[]}}
 */
export function splitReadme(markdown) {
  const out = {title: null, intro: [], sections: []};
  let current = null;
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  // Mark the headings outside code first, then walk the lines.
  const headings = mapOutsideFences(lines, (line) => /^(#{1,2})\s+(.*?)\s*#*\s*$/.exec(line));
  lines.forEach((line, i) => {
    const h = Array.isArray(headings[i]) ? headings[i] : null;
    if (h && h[1] === '#' && out.title === null && current === null) {
      out.title = h[2];
      return;
    }
    if (h) {
      current = {heading: h[2], lines: []};
      out.sections.push(current);
      return;
    }
    (current ? current.lines : out.intro).push(line);
  });
  return out;
}

// Where each README section goes on the plugin page (STYLE.md "Plugin page"). The first match
// wins; `drop` is for contributors (building, testing, releasing), not for the plugin's users.
const SECTION_RULES = [
  ['drop', /^(build|releas|(local )?develop|contribut|(integration )?test|licen)/i],
  ['related', /^(related|references|see also)/i],
  ['policies', /polic|rego|\bopa\b/i],
  ['requirements', /prerequisite|requirement|authenticat|\biam\b|permission|setup|credential/i],
  ['configuration', /config|cross-account/i],
  ['evidence', /evidence|collect|coverage|subject|check|resource famil|feature/i],
];

/** The plugin page section a README section belongs to. */
export function classifySection(heading) {
  for (const [target, re] of SECTION_RULES) if (re.test(heading)) return target;
  return 'how';
}

// The page's sections, in STYLE.md's order. "How it works" (borrowed from the feature guide
// skeleton) holds the README sections that fit none of the plugin page's, and "Related" its links.
const PAGE_SECTIONS = [
  ['how', 'How it works'],
  ['requirements', 'Requirements'],
  ['configuration', 'Configuration'],
  ['evidence', 'Evidence collected'],
  ['policies', 'Policies'],
  ['related', 'Related'],
];

/**
 * Rewrites a README's relative links and images to absolute GitHub URLs at the tag, so the docs
 * build never resolves them against the docs site. Links into a sibling repository
 * (`../plugin-x`) go to that repository. Anchors and absolute URLs are left alone, and so is
 * anything in code.
 */
export function absolutizeLinks(lines, repo, tag) {
  const [owner] = repo.split('/');
  const resolve = (target, image) => {
    if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) return target;
    const [file, anchor = ''] = target.split(/(?=#)/);
    const normalized = path.posix.normalize(file.replace(/^\//, ''));
    if (normalized.startsWith('../')) {
      return `${GITHUB}/${owner}/${normalized.slice(3)}${anchor}`;
    }
    if (normalized === '..') return `${GITHUB}/${owner}`;
    if (image) return `https://raw.githubusercontent.com/${repo}/${tag}/${normalized}`;
    return `${GITHUB}/${repo}/blob/${tag}/${normalized === '.' ? '' : normalized}${anchor}`;
  };
  return mapOutsideFences(lines, (line) => {
    const def = /^( {0,3}\[[^\]]+\]:\s*)(\S+)(.*)$/.exec(line);
    if (def) return `${def[1]}${resolve(def[2], false)}${def[3]}`;
    // Split on inline code so `[x](y)` inside backticks stays as written.
    return line
      .split(/(`+[^`]*`+)/)
      .map((part, i) =>
        i % 2 === 1
          ? part
          : part.replace(/(!?)\[([^\]]*)\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)/g, (_, bang, text, target, title) =>
              `${bang}[${text}](${resolve(target, bang === '!')}${title})`,
            ),
      )
      .join('');
  });
}

/** One level deeper for every ATX heading outside fenced code (`###` → `####`). */
function demoteHeadings(lines) {
  return mapOutsideFences(lines, (line) => (/^#{1,5}\s/.test(line) ? `#${line}` : line));
}

function trimBlank(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
}

/** The README's intro without badges or images: the first lines a reader sees. */
function introLines(intro) {
  return trimBlank(intro.filter((l) => !/^\s*(\[!\[|!\[)/.test(l)));
}

/**
 * A one-paragraph plain-text summary of a plugin: its repository's GitHub description, or else the
 * first paragraph of its README's intro without Markdown. Empty when it has neither.
 */
export function summarize({readme, description}) {
  if (description?.trim()) return description.trim();
  if (!readme) return '';
  const intro = introLines(splitReadme(readme).intro);
  const end = intro.findIndex((l) => l.trim() === '');
  const paragraph = (end === -1 ? intro : intro.slice(0, end)).join(' ');
  if (/^\s*([-*+]|\d+\.|\||>|```|~~~)/.test(paragraph)) return '';
  return paragraph
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The landing page of a plugin's instance (STYLE.md "Plugin page"), from its README at the
 * release tag and its policies catalog. The page is CommonMark (`mdx.format: md`): README text
 * such as `{` or `<value>` must not be read as JSX.
 *
 * @param {object} p
 * @param {{id: string, repo: string, label: string}} p.instance
 * @param {string} p.tag the release the page documents
 * @param {string | null} p.readme the README at the tag, or null when the release has none
 * @param {string | null} p.description the repository's GitHub description
 * @param {{repo: string, version: string, controls: string[]}[]} p.bundles
 */
export function renderPluginPage({instance, tag, readme, description, bundles}) {
  const {repo, label} = instance;
  const name = repo.split('/')[1];
  const parts = readme ? splitReadme(readme) : {title: null, intro: [], sections: []};
  const buckets = Object.fromEntries(PAGE_SECTIONS.map(([key]) => [key, []]));
  const headings = Object.fromEntries(PAGE_SECTIONS);
  for (const section of parts.sections) {
    const target = classifySection(section.heading);
    if (target === 'drop') continue;
    // A README section named like the page's own ("Configuration") needs no heading of its own,
    // and its subsections keep their level; any other becomes a subsection of the page's.
    const same = section.heading.trim().toLowerCase() === headings[target].toLowerCase();
    const lines = absolutizeLinks(section.lines, repo, tag);
    const body = trimBlank(same ? lines : demoteHeadings(lines));
    buckets[target].push(...(same ? [] : [`### ${section.heading}`, '']), ...body, '');
  }

  const releaseUrl = `${GITHUB}/${repo}/releases/tag/${tag}`;
  const source = readme
    ? `the plugin's [README at ${tag}](${GITHUB}/${repo}/blob/${tag}/README.md)`
    : `the [${tag} release](${releaseUrl}), which has no README`;
  const intro = introLines(absolutizeLinks(parts.intro, repo, tag));
  const summary = summarize({readme, description}) || null;

  const out = [
    '---',
    yaml.dump(
      {title: label, ...(summary ? {description: summary} : {}), sidebar_position: 1, mdx: {format: 'md'}},
      {lineWidth: -1},
    ).trimEnd(),
    '---',
    '',
    `<!-- Generated by scripts/sync-catalog.mjs from ${repo} ${tag}. Don't edit it by hand: run the script again. -->`,
    '',
    `# ${label}`,
    '',
    ...(intro.length > 0 ? [...intro, ''] : summary ? [summary, ''] : []),
    `This page is for **operators** who run the \`${name}\` plugin with the CCF Agent, and for **developers** who write policies for it. It documents [${tag}](${releaseUrl}) and is generated from ${source}.`,
    '',
  ];
  for (const [key, heading] of PAGE_SECTIONS) {
    if (key === 'policies') {
      out.push('## Policies', '');
      if (bundles.length > 0) {
        out.push(
          'The policy bundles that work with this plugin, at their newest releases. The controls are the ones the bundle\'s policies list in their metadata.',
          '',
          policiesTable(bundles),
          '',
        );
      } else {
        out.push('No policy bundles are mapped to this plugin yet.', '');
      }
      out.push(...buckets.policies);
      continue;
    }
    if (buckets[key].length === 0) continue;
    out.push(`## ${heading}`, '', ...buckets[key]);
  }
  return `${trimBlank(out).join('\n')}\n`;
}

// ---- catalog data -----------------------------------------------------------------------------

/**
 * src/data/catalog.json: one entry per plugin with a released line, sorted by label. The catalog
 * landing page (src/pages/catalog.tsx) renders it.
 * @param {{instance: {id: string, repo: string, label: string, route: string}, tag: string, line: string, readme: string | null, description: string | null, bundles: {repo: string, version: string}[]}[]} plugins
 */
export function catalogData(plugins) {
  return {
    $comment: "Generated by scripts/sync-catalog.mjs. Don't edit it by hand: run the script again.",
    plugins: [...plugins]
      .sort((a, b) => a.instance.label.localeCompare(b.instance.label, 'en'))
      .map((p) => ({
        id: p.instance.id,
        label: p.instance.label,
        repo: p.instance.repo,
        route: p.instance.route,
        version: p.tag,
        line: p.line,
        description: summarize(p),
        policies: p.bundles.map((b) => ({repo: b.repo, version: b.version})),
      })),
  };
}
