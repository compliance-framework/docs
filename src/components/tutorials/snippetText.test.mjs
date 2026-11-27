// node --test src/components/tutorials/snippetText.test.mjs (or `yarn test`)
import assert from 'node:assert/strict';
import test from 'node:test';
import {snippetText} from './snippetText.mjs';

test('the code prop is the text, minus the blank lines at its ends', () => {
  assert.equal(snippetText('kubectl get pods\n', undefined), 'kubectl get pods');
  assert.equal(snippetText('\n\nccf evidence list\n\n', undefined), 'ccf evidence list');
});

test('children are joined, so a snippet can be split across expressions', () => {
  assert.equal(snippetText(undefined, ['name: k8s\n', 'version: 1\n']), 'name: k8s\nversion: 1');
  assert.equal(snippetText(undefined, ['port: ', 8080]), 'port: 8080');
});

test('the indentation every line shares is dropped and the rest kept, as an indented MDX literal writes it', () => {
  const drafted = '\n  plugins:\n    - name: k8s\n      namespace: compliance\n  ';
  assert.equal(snippetText(undefined, drafted), 'plugins:\n  - name: k8s\n    namespace: compliance');
});

test('a snippet that already starts at column zero is left alone', () => {
  assert.equal(snippetText('plugins:\n  - name: k8s', undefined), 'plugins:\n  - name: k8s');
});

test('blank lines and shorter-indented lines inside the snippet are kept', () => {
  assert.equal(snippetText('a:\n\n  b: 1', undefined), 'a:\n\n  b: 1');
});

test('tabs count as indentation', () => {
  assert.equal(snippetText('\t\tccf catalog apply c.yaml\n\t\t  --dry-run', undefined), 'ccf catalog apply c.yaml\n  --dry-run');
});

test('code wins when the author gives both it and children', () => {
  assert.equal(snippetText('from code', ['from children']), 'from code');
});

test('no snippet gives no text', () => {
  assert.equal(snippetText(undefined, undefined), '');
  assert.equal(snippetText(undefined, []), '');
  assert.equal(snippetText('   \n  \n', undefined), '');
});
