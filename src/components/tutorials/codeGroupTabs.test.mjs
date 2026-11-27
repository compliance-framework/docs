// node --test src/components/tutorials/codeGroupTabs.test.mjs (or `yarn test`)
import assert from 'node:assert/strict';
import test from 'node:test';
import {clampTab, initialTab, nextTab} from './codeGroupTabs.mjs';

const files = [{title: 'compliance.yaml'}, {title: 'filter.yaml'}, {title: 'run.sh'}];

test('defaultTab opens that file, by title', () => {
  assert.equal(initialTab(files, 'filter.yaml'), 1);
  assert.equal(initialTab(files, 'run.sh'), 2);
});

test('a defaultTab that matches no title, or is absent, opens the first file', () => {
  assert.equal(initialTab(files, 'missing.yaml'), 0);
  assert.equal(initialTab(files, undefined), 0);
  assert.equal(initialTab([], 'compliance.yaml'), 0);
});

test('the first title wins when two files share it', () => {
  assert.equal(initialTab([...files, {title: 'run.sh'}], 'run.sh'), 2);
});

test('selection stays put while it is within the items and clamps when they shrink below it', () => {
  assert.equal(clampTab(1, 3), 1);
  assert.equal(clampTab(2, 3), 2);
  assert.equal(clampTab(4, 3), 2);
});

test('ArrowRight advances and wraps from the last tab to the first', () => {
  assert.equal(nextTab(0, 'ArrowRight', 3), 1);
  assert.equal(nextTab(2, 'ArrowRight', 3), 0);
});

test('ArrowLeft steps back and wraps from the first tab to the last', () => {
  assert.equal(nextTab(1, 'ArrowLeft', 3), 0);
  assert.equal(nextTab(0, 'ArrowLeft', 3), 2);
});

test('Home and End jump to either end', () => {
  assert.equal(nextTab(1, 'Home', 3), 0);
  assert.equal(nextTab(1, 'End', 3), 2);
  assert.equal(nextTab(0, 'End', 1), 0);
});

test('a key the tablist does not handle moves nothing', () => {
  assert.equal(nextTab(1, 'Enter', 3), undefined);
  assert.equal(nextTab(1, 'Tab', 3), undefined);
  assert.equal(nextTab(1, 'ArrowDown', 3), undefined);
});
