// node --test scripts/openapi-display.test.mjs (or `yarn test`)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';
import {displaySpec, largestExpansion, writeDisplaySpec} from './openapi-display.mjs';

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'testdata', 'deep-relations.yaml');
const load = () => yaml.load(fs.readFileSync(fixture, 'utf8'));

// The named schemas an operation's schema reaches, with the `$ref` hops it takes to reach each,
// following references the way Redoc does (stopping at a cycle). Stubs end a branch.
function reach(spec, root) {
  const schemas = spec.definitions;
  const found = [];
  const walk = (node, depth, stack) => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, depth, stack));
    if (!node || typeof node !== 'object') return;
    if (typeof node.$ref === 'string') {
      const name = node.$ref.replace('#/definitions/', '');
      found.push({name, depth: depth + 1});
      if (!stack.includes(name)) walk(schemas[name], depth + 1, [...stack, name]);
      return;
    }
    Object.values(node).forEach((v) => walk(v, depth, stack));
  };
  walk(root, 0, []);
  return found;
}

test('caps the $ref nesting of every operation at maxDepth', () => {
  for (const maxDepth of [1, 2, 3, 4]) {
    const display = displaySpec(load(), {maxDepth});
    for (const methods of Object.values(display.paths)) {
      for (const operation of Object.values(methods)) {
        const deepest = Math.max(...reach(display, operation).map((r) => r.depth));
        assert.ok(deepest <= maxDepth, `maxDepth ${maxDepth}: reached depth ${deepest}`);
      }
    }
  }
});

test('shows every level up to maxDepth and a named stub past it', () => {
  const display = displaySpec(load(), {maxDepth: 3});
  // Response (1) -> Workflow (2) -> Step (3) -> stub instead of Execution (4).
  assert.equal(display.paths['/workflows/{id}'].get.responses['200'].schema.$ref, '#/definitions/Response');
  assert.equal(display.definitions.Response.properties.data.$ref, '#/definitions/Workflow__depth2');
  assert.equal(display.definitions.Workflow__depth2.properties.steps.items.$ref, '#/definitions/Step__depth3');
  const stub = display.definitions.Step__depth3.properties.executions.items;
  assert.equal(stub.$ref, undefined);
  assert.equal(stub.type, 'object');
  assert.equal(stub.title, 'Execution');
  assert.match(stub.description, /`Execution`: nested too deep to show here/);
  // A depth copy keeps the original's fields and shows its name.
  assert.equal(display.definitions.Workflow__depth2.title, 'Workflow');
  assert.deepEqual(display.definitions.Workflow__depth2.properties.name, {type: 'string'});
});

test('keeps every original schema, once, under its own name', () => {
  const spec = load();
  const display = displaySpec(spec, {maxDepth: 3});
  for (const name of Object.keys(spec.definitions)) {
    assert.ok(display.definitions[name], `${name} is missing`);
    assert.equal(display.definitions[name].title, undefined, `${name} gained a title`);
  }
  const extra = Object.keys(display.definitions).filter((n) => !(n in spec.definitions));
  assert.ok(extra.every((n) => /__depth[23]$/.test(n)), `unexpected schemas: ${extra}`);
});

test('shrinks the expansion Redoc renders', () => {
  const spec = load();
  assert.ok(largestExpansion(spec) > largestExpansion(displaySpec(spec, {maxDepth: 2})));
});

test("doesn't modify the spec it's given", () => {
  const spec = load();
  const before = structuredClone(spec);
  displaySpec(spec, {maxDepth: 2});
  assert.deepEqual(spec, before);
});

test('rewrites OpenAPI 3 components and their reusable responses', () => {
  const spec = {
    openapi: '3.0.0',
    info: {title: 't', version: '1'},
    paths: {'/a': {get: {responses: {200: {$ref: '#/components/responses/A'}}}}},
    components: {
      responses: {A: {description: 'A', content: {'application/json': {schema: {$ref: '#/components/schemas/A'}}}}},
      schemas: {
        A: {type: 'object', properties: {b: {$ref: '#/components/schemas/B'}}},
        B: {type: 'object', properties: {a: {$ref: '#/components/schemas/A'}}},
      },
    },
  };
  const display = displaySpec(spec, {maxDepth: 2});
  assert.equal(display.components.responses.A.content['application/json'].schema.$ref, '#/components/schemas/A');
  assert.equal(display.components.schemas.A.properties.b.$ref, '#/components/schemas/B__depth2');
  assert.equal(display.components.schemas.B__depth2.properties.a.title, 'A');
  assert.equal(display.components.schemas.B__depth2.properties.a.$ref, undefined);
});

test('rejects a maxDepth that is not a positive integer', () => {
  assert.throws(() => displaySpec(load(), {maxDepth: 0}), /positive integer/);
});

test('writeDisplaySpec writes the display copy as JSON and leaves the source alone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-display-'));
  try {
    const before = fs.readFileSync(fixture, 'utf8');
    const out = path.join(dir, 'nested', 'display.json');
    writeDisplaySpec(fixture, out, {maxDepth: 2});
    assert.deepEqual(JSON.parse(fs.readFileSync(out, 'utf8')), displaySpec(load(), {maxDepth: 2}));
    assert.equal(fs.readFileSync(fixture, 'utf8'), before);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
