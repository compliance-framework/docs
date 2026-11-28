import test from 'node:test';
import assert from 'node:assert/strict';
import {isInternalHref} from './cardLink.mjs';

test('a root-relative href names a page of this site', () => {
  assert.equal(isInternalHref('/tutorials'), true);
  assert.equal(isInternalHref('/docs/tutorials/smoke'), true);
});

test('anything else is external, or no link at all', () => {
  assert.equal(isInternalHref('https://github.com/compliance-framework'), false);
  assert.equal(isInternalHref('mailto:team@example.com'), false);
  assert.equal(isInternalHref('tutorials'), false);
  // Looks root-relative, but a browser reads the host from it: it must stay external.
  assert.equal(isInternalHref('//example.com/docs'), false);
  assert.equal(isInternalHref(undefined), false);
});
