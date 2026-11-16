// node --test scripts/gen-config-ref.test.mjs (or `yarn test`)
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  apiVersionFromGoMod,
  buildRows,
  configKeys,
  parseCobraFlags,
  parseEnvLiterals,
  parseGoStructs,
  parseRootGo,
  parseUiBuildVars,
  parseUiConfig,
} from './gen-config-ref.mjs';

test('parseRootGo reads the bound keys and their SetDefault values', () => {
  const {bound, defaults} = parseRootGo(`
    viper.MustBindEnv("app_port")
    viper.MustBindEnv("db_driver")
    viper.SetDefault("app_port", "8080")
  `);
  assert.deepEqual([...bound], ['app_port', 'db_driver']);
  assert.deepEqual([...defaults], [['app_port', '8080']]);
});

const configTs = `
export interface Config {
  API_URL: string;
  LOGIN_BANNER?: string;
  // A flag.
  FLAG_ENABLED?: boolean;
}
function applyOverrides() {
  return import.meta.env.VITE_FLAG_ENABLED ?? import.meta.env.VITE_API_URL;
}
`;

test('parseUiConfig takes the defaults from defaultconfig.json, as JSON', () => {
  const entries = parseUiConfig('{"API_URL": "", "LOGIN_BANNER": "hi", "FLAG_ENABLED": false}', configTs);
  assert.deepEqual([...entries], [
    ['API_URL', {default: '""'}],
    ['LOGIN_BANNER', {default: '"hi"'}],
    ['FLAG_ENABLED', {default: 'false'}],
  ]);
});

test('parseUiConfig fails when defaultconfig.json and the Config interface disagree', () => {
  assert.throws(
    () => parseUiConfig('{"API_URL": "", "EXTRA": 1}', configTs),
    /EXTRA is in src\/defaultconfig.json but not in the Config interface.*LOGIN_BANNER is in the Config interface/s,
  );
});

test('parseUiBuildVars joins the declared and the read VITE_ variables', () => {
  const vars = parseUiBuildVars('interface ImportMetaEnv {\n  readonly VITE_API_URL?: string;\n  readonly VITE_BANNER?: string;\n}', configTs);
  assert.deepEqual([...vars.keys()], ['VITE_API_URL', 'VITE_BANNER', 'VITE_FLAG_ENABLED']);
});

const typesGo = `
type Config struct {
	Daemon  bool               \`json:"daemon" mapstructure:"daemon"\`
	API     *APIConfig         \`json:"api,omitempty" mapstructure:"api"\`
	Plugins map[string]*Plugin \`json:"plugins" mapstructure:"plugins"\`
	private int
}

type APIConfig struct {
	URL  string   \`json:"url" mapstructure:"url"\`
	Auth *APIAuth \`json:"auth,omitempty" mapstructure:"auth"\`
}

type APIAuth struct {
	ClientID string \`json:"client_id" mapstructure:"client_id"\`
}

type Plugin struct {
	Schedule *string           \`mapstructure:"schedule,omitempty"\`
	Config   map[string]string \`json:"config,omitempty" mapstructure:"config"\`
}
`;

test('configKeys walks nested structs and maps of structs', () => {
  assert.deepEqual(configKeys(parseGoStructs(typesGo), 'Config'), [
    'daemon',
    'api.url',
    'api.auth.client_id',
    'plugins.<name>.schedule',
    'plugins.<name>.config',
  ]);
});

test('configKeys fails without the root struct', () => {
  assert.throws(() => configKeys(parseGoStructs(typesGo), 'agentConfig'), /no struct agentConfig/);
});

test('apiVersionFromGoMod reads the api requirement', () => {
  const goMod = 'module x\n\nrequire (\n\tgithub.com/compliance-framework/api v0.21.1\n\tgithub.com/compliance-framework/gooci v0.0.10\n)\n';
  assert.equal(apiVersionFromGoMod(goMod), 'v0.21.1');
  assert.throws(() => apiVersionFromGoMod('module x\n'), /doesn't require/);
});

test('parseEnvLiterals finds variable names but not prefixes or other strings', () => {
  const names = parseEnvLiterals([
    'os.Getenv("CCF_STATE_DIR"); strings.HasPrefix(name, "CCF_API_AUTH_")',
    'for _, n := range []string{"KUBERNETES_POD_NAME", "KUBERNETES_POD"} {}; log("ok", "Agent")',
  ]);
  assert.deepEqual([...names], ['CCF_STATE_DIR', 'KUBERNETES_POD_NAME', 'KUBERNETES_POD']);
});

test('parseCobraFlags reads names, short forms and code defaults', () => {
  const flags = parseCobraFlags(`
	agentCmd.Flags().CountP("verbose", "v", "Enable verbose output")
	agentCmd.Flags().BoolP("daemon", "d", false, "Run, as a daemon")
	agentCmd.Flags().StringP("config", "c", "", "Location of config file")
	agentCmd.Flags().String("state-dir", "", "Directory, with commas")
	agentCmd.Flags().Int("workers", 4, "Workers")
`);
  assert.deepEqual([...flags], [
    ['verbose', {short: 'v', default: '0'}],
    ['daemon', {short: 'd', default: 'false'}],
    ['config', {short: 'c'}],
    ['state-dir', {short: undefined}],
    ['workers', {short: undefined, default: '4'}],
  ]);
});

const describe = (extra = {}) => ({purpose: 'Does it.', type: 'string', example: 'x', ...extra});

test('buildRows renders, marks new settings and sorts', () => {
  const rows = buildRows({
    entries: new Map([
      ['b_key', {default: '1'}],
      ['a_key', {}],
    ]),
    previous: new Set(['b_key']),
    settings: {a_key: describe({default: 'none'}), b_key: describe()},
    line: '0.21',
  });
  assert.deepEqual(
    rows.map((r) => r.cells),
    [
      ['`CCF_A_KEY`', 'Does it. *(new in 0.21)*', '`string`', 'none', '`CCF_A_KEY=x`'],
      ['`CCF_B_KEY`', 'Does it.', '`string`', '`1`', '`CCF_B_KEY=x`'],
    ],
  );
});

test('buildRows sorts flags by their long name', () => {
  const rows = buildRows({
    entries: new Map([
      ['state-dir', {}],
      ['config', {short: 'c'}],
    ]),
    settings: {'state-dir': describe({default: 'none'}), config: describe({default: '*required*'})},
    line: '0.9',
    where: 'cmd/agent.go',
    name: (key, entry) => (entry?.short ? `-${entry.short}, --${key}` : `--${key}`),
    example: (_name, example) => example,
  });
  assert.deepEqual(rows.map((r) => r.name), ['-c, --config', '--state-dir']);
});

test('buildRows lists every mismatch between the code and the descriptions', () => {
  assert.throws(
    () =>
      buildRows({
        entries: new Map([
          ['undescribed', {}],
          ['coded', {default: '1'}],
          ['no_default', {}],
        ]),
        settings: {gone: describe(), coded: describe({default: '2'}), no_default: describe({example: ''})},
        line: '1.0',
        where: 'cmd/root.go',
      }),
    (err) => {
      for (const want of [
        'undescribed is defined in cmd/root.go but not described',
        'gone is described but no longer defined in cmd/root.go',
        'coded: its default comes from cmd/root.go',
        'no_default has no example',
        'no_default has no default in cmd/root.go',
      ]) {
        assert.match(err.message, new RegExp(want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
      return true;
    },
  );
});

test('buildRows keeps MDX syntax inside code', () => {
  assert.throws(
    () => buildRows({entries: new Map([['k', {}]]), settings: {k: describe({purpose: 'Uses {x}.', default: 'none'})}, line: '1.0'}),
    /keep \{, \} and < inside `code`/,
  );
});
