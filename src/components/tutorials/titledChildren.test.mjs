import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {titledChildren} from './titledChildren.mjs';

function Marker() {
  return null;
}

test('keeps the elements with a string title, in order', () => {
  const first = createElement(Marker, {title: 'Ubuntu'}, 'one');
  const second = createElement(Marker, {title: 'RHEL'}, 'two');
  const children = ['  ', first, null, false, 'stray', second, undefined];
  assert.deepEqual(
    titledChildren(children).map((child) => child.props.title),
    ['Ubuntu', 'RHEL'],
  );
});

test('drops elements a group cannot label', () => {
  const titled = createElement(Marker, {title: 'Ubuntu'});
  const numberTitle = createElement(Marker, {title: 2});
  const noTitle = createElement(Marker, {});
  const paragraph = createElement('p', null, 'not a marker');
  assert.deepEqual(
    titledChildren([titled, numberTitle, noTitle, paragraph]).map((child) => child.props.title),
    ['Ubuntu'],
  );
});

test('returns nothing when no child is a titled element', () => {
  assert.deepEqual(titledChildren(undefined), []);
  assert.deepEqual(titledChildren('just text'), []);
  assert.deepEqual(titledChildren([null, false]), []);
});
