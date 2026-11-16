// node --test scripts/sync-catalog.test.mjs (or `yarn test`)
import assert from 'node:assert/strict';
import test from 'node:test';
import yaml from 'js-yaml';
import {
  absolutizeLinks,
  appendInstances,
  catalogData,
  classifySection,
  isPluginRepo,
  isPolicyRepo,
  latestFinalRelease,
  newPluginInstance,
  policiesTable,
  policyFiles,
  regoControls,
  renderPluginPage,
  sortControls,
  splitReadme,
  summarize,
} from './catalog.mjs';
import {collect, githubSource} from './sync-catalog.mjs';

test('latestFinalRelease takes the highest plain semver tag of a non-draft, non-pre-release', () => {
  const cases = [
    {
      name: 'semver order, not list order',
      releases: [{tag_name: 'v0.9.0'}, {tag_name: 'v0.10.0'}, {tag_name: 'v0.10.1'}, {tag_name: 'v0.2.5'}],
      want: {tag: 'v0.10.1', line: '0.10'},
    },
    {
      name: 'skips drafts, pre-releases and suffixed tags',
      releases: [
        {tag_name: 'v2.0.0', draft: true},
        {tag_name: 'v1.5.0', prerelease: true},
        {tag_name: 'v1.4.0-rc.1'},
        {tag_name: 'latest'},
        {tag_name: '1.3.2'},
      ],
      want: {tag: '1.3.2', line: '1.3'},
    },
    {name: 'none final', releases: [{tag_name: 'v0.1.0-rc.1'}], want: null},
    {name: 'no releases', releases: [], want: null},
  ];
  for (const c of cases) assert.deepEqual(latestFinalRelease(c.releases), c.want, c.name);
});

test('plugin and policy repositories are told apart by name only', () => {
  assert.equal(isPluginRepo('plugin-aws-ecr'), true);
  assert.equal(isPluginRepo('plugin-aws-ecr-image-policies'), false);
  assert.equal(isPluginRepo('agent'), false);
  assert.equal(isPolicyRepo('plugin-aws-ecr-image-policies'), true);
  assert.equal(isPolicyRepo('policy-template'), false);
});

test('newPluginInstance names the instance after the repository and maps no policies', () => {
  assert.deepEqual(newPluginInstance('compliance-framework', 'plugin-aws-rds-aurora-psql'), {
    id: 'plugin-aws-rds-aurora-psql',
    kind: 'plugin',
    repo: 'compliance-framework/plugin-aws-rds-aurora-psql',
    path: 'plugins/aws-rds-aurora-psql',
    route: 'catalog/aws-rds-aurora-psql',
    label: 'AWS RDS Aurora PostgreSQL',
  });
  assert.equal(newPluginInstance('o', 'plugin-github-repositories').label, 'GitHub Repositories');
  assert.equal(newPluginInstance('o', 'plugin-local-ssh').label, 'Local SSH');
});

test('appendInstances adds entries before build: and keeps the comments', () => {
  const manifest = `# A comment.
version: 1
instances:
  - id: api
    kind: product
    repo: o/api
    path: api
    route: api
    label: API
build:
  onlyIncludeVersions: { product: 6, plugin: 3 }
`;
  const out = appendInstances(manifest, [
    {...newPluginInstance('o', 'plugin-jira'), policies: ['o/plugin-jira-custom-policies']},
  ]);
  assert.match(out, /^# A comment\./);
  assert.match(out, /label: API\n {2}- id: plugin-jira\n {4}kind: plugin\n[\s\S]*\n {4}policies:\n {6}- o\/plugin-jira-custom-policies\nbuild:/);
  const parsed = yaml.load(out);
  assert.equal(parsed.instances.length, 2);
  assert.deepEqual(parsed.build, {onlyIncludeVersions: {product: 6, plugin: 3}});
  assert.equal(appendInstances(manifest, []), manifest);
  assert.equal(yaml.load(appendInstances('version: 1\ninstances:\n  - id: a\n    label: A', [{id: 'b', label: 'B: x'}])).instances[1].label, 'B: x');
});

test('regoControls reads custom.controls from every METADATA block', () => {
  const rego = `# METADATA
# title: First
# custom:
#   controls:
#     - ctrl-cc6-1-001
#     - CC7.1
#   schedule: "0 * * * *"
package a

# METADATA
# title: broken: [yaml
package b

# METADATA
# custom:
#   controls: [CC8.1]
rule := true
`;
  assert.deepEqual(regoControls(rego), ['ctrl-cc6-1-001', 'CC7.1', 'CC8.1']);
  assert.deepEqual(regoControls('package a\n'), []);
  assert.deepEqual(sortControls(['CC6.10', 'CC6.2', 'CC6.2', 'AC-3']), ['AC-3', 'CC6.2', 'CC6.10']);
  assert.deepEqual(policyFiles(['policies/a.rego', 'policies/a_test.rego', 'README.md', 'b.rego']), ['b.rego', 'policies/a.rego']);
});

test('policiesTable has the STYLE.md columns and says when a bundle lists no controls', () => {
  assert.equal(
    policiesTable([
      {repo: 'o/plugin-x-policies', version: 'v1.2.0', controls: ['AC-3', 'CM-6']},
      {repo: 'o/plugin-x-more-policies', version: 'v0.1.0', controls: []},
    ]),
    [
      '| Bundle | Latest version | Controls covered | Compatible plugin lines |',
      '|---|---|---|---|',
      '| [`plugin-x-policies`](https://github.com/o/plugin-x-policies) | `v1.2.0` | AC-3, CM-6 | latest |',
      '| [`plugin-x-more-policies`](https://github.com/o/plugin-x-more-policies) | `v0.1.0` | *none listed* | latest |',
    ].join('\n'),
  );
});

test('splitReadme ignores headings inside fenced code', () => {
  const parts = splitReadme(['# Title', 'Intro.', '## One', '```sh', '# not a heading', '## nor this', '```', 'after', '## Two', 'x'].join('\n'));
  assert.equal(parts.title, 'Title');
  assert.deepEqual(parts.intro, ['Intro.']);
  assert.deepEqual(
    parts.sections.map((s) => [s.heading, s.lines]),
    [
      ['One', ['```sh', '# not a heading', '## nor this', '```', 'after']],
      ['Two', ['x']],
    ],
  );
});

test('classifySection maps README sections onto the plugin page skeleton', () => {
  const cases = {
    'Required IAM actions': 'requirements',
    Prerequisites: 'requirements',
    Authentication: 'requirements',
    Configuration: 'configuration',
    'Example Agent Config (Inline YAML)': 'configuration',
    'Data collected': 'evidence',
    'What it checks': 'evidence',
    'Subjects and evidence model': 'evidence',
    'Policy data (overrides `data.json` defaults)': 'policies',
    'Rego Input Schema': 'policies',
    'Standardized Per-Resource OPA Input': 'policies',
    'Default policy bundle mapping': 'policies',
    'Local development': 'drop',
    Building: 'drop',
    Releases: 'drop',
    'Integration testing': 'drop',
    'Related repositories': 'related',
    'How it fits in CCF': 'how',
  };
  for (const [heading, want] of Object.entries(cases)) assert.equal(classifySection(heading), want, heading);
});

test('absolutizeLinks points relative links at the tag and leaves code and absolute links alone', () => {
  const out = absolutizeLinks(
    [
      'See [examples](examples/README.md#top), [docs](./docs/) and [plugin](../plugin-other).',
      '![diagram](img/flow.png "Flow") and [site](https://example.com) and [anchor](#config).',
      'Code: `[x](y.md)` stays.',
      '[ref]: docs/ref.md',
      '```md',
      '[inside](fence.md)',
      '```',
    ],
    'o/plugin-x',
    'v1.0.0',
  );
  assert.deepEqual(out, [
    'See [examples](https://github.com/o/plugin-x/blob/v1.0.0/examples/README.md#top), [docs](https://github.com/o/plugin-x/blob/v1.0.0/docs/) and [plugin](https://github.com/o/plugin-other).',
    '![diagram](https://raw.githubusercontent.com/o/plugin-x/v1.0.0/img/flow.png "Flow") and [site](https://example.com) and [anchor](#config).',
    'Code: `[x](y.md)` stays.',
    '[ref]: https://github.com/o/plugin-x/blob/v1.0.0/docs/ref.md',
    '```md',
    '[inside](fence.md)',
    '```',
  ]);
});

const README = `# plugin-x

[![CI](https://example.com/badge.svg)](https://example.com)

Collects evidence about \`X\` resources.

## Configuration

| Key | Description |
|---|---|
| \`regions\` | Regions, e.g. \`{"a": 1}\` and <value> |

### Advanced

More.

## Required IAM actions

Read-only.

## Local development

\`\`\`sh
# Build it
make build
\`\`\`

## How it fits in CCF

The agent runs it. See [design](docs/design.md).
`;

test('renderPluginPage follows the plugin page skeleton', () => {
  const page = renderPluginPage({
    instance: {id: 'plugin-x', repo: 'o/plugin-x', label: 'X'},
    tag: 'v1.2.3',
    readme: README,
    description: null,
    bundles: [{repo: 'o/plugin-x-policies', version: 'v0.1.0', controls: ['CC6.1']}],
  });
  const [, frontMatter, body] = page.split(/^---$/m);
  assert.deepEqual(yaml.load(frontMatter), {
    title: 'X',
    description: 'Collects evidence about X resources.',
    sidebar_position: 1,
    mdx: {format: 'md'},
  });
  // STYLE.md's order, with "How it works" first; the development section is dropped.
  assert.deepEqual(
    body.match(/^#{1,4} .*$/gm),
    ['# X', '## How it works', '### How it fits in CCF', '## Requirements', '### Required IAM actions', '## Configuration', '### Advanced', '## Policies'],
  );
  assert.doesNotMatch(body, /\[!\[CI\]/);
  assert.doesNotMatch(body, /make build/);
  assert.match(body, /\(https:\/\/github\.com\/o\/plugin-x\/blob\/v1\.2\.3\/docs\/design\.md\)/);
  assert.match(body, /It documents \[v1\.2\.3\]\(https:\/\/github\.com\/o\/plugin-x\/releases\/tag\/v1\.2\.3\)/);
  assert.match(body, /\| \[`plugin-x-policies`\]\(https:\/\/github\.com\/o\/plugin-x-policies\) \| `v0\.1\.0` \| CC6\.1 \| latest \|/);
  assert.match(body, /<!-- Generated by scripts\/sync-catalog\.mjs from o\/plugin-x v1\.2\.3\./);
});

test('renderPluginPage without a README or bundles keeps the intro and the policies section', () => {
  const page = renderPluginPage({
    instance: {id: 'plugin-y', repo: 'o/plugin-y', label: 'Y'},
    tag: 'v0.1.0',
    readme: null,
    description: 'Y compliance plugin',
    bundles: [],
  });
  assert.match(page, /^description: Y compliance plugin$/m);
  assert.match(page, /# Y\n\nY compliance plugin\n/);
  assert.match(page, /which has no README\./);
  assert.match(page, /## Policies\n\nNo policy bundles are mapped to this plugin yet\.\n$/);
});

test('summarize prefers the GitHub description and strips Markdown from the README intro', () => {
  assert.equal(summarize({readme: README, description: '  From GitHub  '}), 'From GitHub');
  assert.equal(summarize({readme: README, description: null}), 'Collects evidence about X resources.');
  assert.equal(summarize({readme: '# T\n\n- a list\n', description: ''}), '');
  assert.equal(summarize({readme: null, description: null}), '');
});

test('catalogData sorts the plugins by label', () => {
  const data = catalogData([
    {instance: {id: 'b', label: 'Beta', repo: 'o/b', route: 'catalog/b'}, tag: 'v1.0.0', line: '1.0', readme: null, description: null, bundles: []},
    {instance: {id: 'a', label: 'Alpha', repo: 'o/a', route: 'catalog/a'}, tag: 'v0.1.0', line: '0.1', readme: null, description: 'A', bundles: [{repo: 'o/a-policies', version: 'v0.2.0', controls: ['X']}]},
  ]);
  assert.deepEqual(
    data.plugins.map((p) => [p.id, p.version, p.description, p.policies]),
    [
      ['a', 'v0.1.0', 'A', [{repo: 'o/a-policies', version: 'v0.2.0'}]],
      ['b', 'v1.0.0', '', []],
    ],
  );
});

// A fake GitHub for collect(): repos, releases and files by "repo@ref:path".
function fakeGitHub({repos, releases, files}) {
  return {
    async repos() {
      return repos;
    },
    async releases(repo) {
      return (releases[repo] ?? []).map((tag_name) => ({tag_name}));
    },
    async description() {
      return null;
    },
    async file(repo, ref, file) {
      return files[`${repo}@${ref}:${file}`] ?? null;
    },
    async tree(repo, ref) {
      const prefix = `${repo}@${ref}:`;
      return Object.keys(files).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
    },
  };
}

test('collect adds released plugins, maps bundles only through instances.yaml and reports the rest', async () => {
  const gh = fakeGitHub({
    repos: [
      {name: 'plugin-a', archived: false, description: 'A plugin'},
      {name: 'plugin-a-policies', archived: false},
      {name: 'plugin-a-extra-policies', archived: false},
      {name: 'plugin-b', archived: false},
      {name: 'plugin-b-policies', archived: false},
      {name: 'plugin-old', archived: true},
      {name: 'plugin-template', archived: false},
      {name: 'api', archived: false},
    ],
    releases: {
      'o/plugin-a': ['v1.0.0', 'v1.1.0-rc.1'],
      'o/plugin-a-policies': ['v0.3.0'],
      'o/plugin-a-extra-policies': ['v0.1.0'],
      'o/plugin-b': ['v0.2.1'],
      'o/plugin-b-policies': ['v0.5.0'],
      'o/plugin-old': ['v9.0.0'],
      'o/api': ['v0.21.0'],
    },
    files: {
      'o/plugin-a@v1.0.0:README.md': '# A\n\nIntro.\n',
      'o/plugin-a-policies@v0.3.0:policies/p.rego': '# METADATA\n# custom:\n#   controls: [CC6.1]\npackage p\n',
      'o/plugin-a-policies@v0.3.0:policies/p_test.rego': '# METADATA\n# custom:\n#   controls: [TEST]\npackage p\n',
    },
  });
  const manifest = {
    version: 1,
    instances: [
      {id: 'api', kind: 'product', repo: 'o/api', path: 'api', route: 'api', label: 'API'},
      {id: 'plugin-a', kind: 'plugin', repo: 'o/plugin-a', path: 'plugins/a', route: 'catalog/a', label: 'A', policies: ['o/plugin-a-policies', 'o/plugin-a-gone-policies']},
    ],
  };
  const result = await collect(gh, {org: 'o', manifest});

  assert.deepEqual(result.added.map((i) => i.id), ['plugin-b']);
  assert.equal(result.added[0].policies, undefined, 'a new instance never gets a mapping from names');
  assert.deepEqual(
    result.plugins.map((p) => [p.instance.id, p.tag, p.line, p.bundles]),
    [
      ['plugin-a', 'v1.0.0', '1.0', [{repo: 'o/plugin-a-policies', version: 'v0.3.0', controls: ['CC6.1']}]],
      ['plugin-b', 'v0.2.1', '0.2', []],
    ],
  );
  assert.equal(result.plugins[0].description, 'A plugin');
  assert.equal(result.plugins[1].readme, null);
  assert.deepEqual(result.unmapped, ['o/plugin-a-extra-policies', 'o/plugin-b-policies']);
  assert.ok(result.warnings.some((w) => w.includes('o/plugin-a-gone-policies has no final release')));
  assert.ok(result.warnings.some((w) => w.includes('plugin-b') && w.includes('no README.md')));
});

test('githubSource reads through gh api and treats a 404 as a missing file', async () => {
  const calls = [];
  const source = githubSource(async (args) => {
    calls.push(args);
    if (args.some((a) => a.includes('contents/missing.md'))) {
      throw Object.assign(new Error('failed'), {stderr: 'gh: Not Found (HTTP 404)'});
    }
    if (args.some((a) => a.includes('/releases'))) return '{"tag_name":"v1.0.0","draft":false,"prerelease":false}\n';
    return 'text';
  });
  assert.deepEqual(await source.releases('o/r'), [{tag_name: 'v1.0.0', draft: false, prerelease: false}]);
  assert.equal(await source.file('o/r', 'v1.0.0', 'missing.md'), null);
  assert.equal(await source.file('o/r', 'v1.0.0', 'README.md'), 'text');
  assert.deepEqual(calls[2], ['-H', 'Accept: application/vnd.github.raw', 'repos/o/r/contents/README.md?ref=v1.0.0']);
  await assert.rejects(
    githubSource(async () => {
      throw Object.assign(new Error('boom'), {stderr: 'HTTP 500'});
    }).file('o/r', 'v1', 'x'),
    /boom/,
  );
});
