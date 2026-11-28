// The titled children of a Tabs or Steps group. Plain ESM with JSDoc types, like snippetText.mjs,
// so `yarn test` can cover what counts as a titled child without a browser.
import {Children, isValidElement} from 'react';

/**
 * The children that are elements carrying a string title, in order. MDX leaves text and
 * whitespace between the elements, and an element without a usable title (a mistyped name, a
 * title given as a number) cannot be labelled, so both are skipped: the group shows the children
 * it can label rather than half-rendering the others.
 *
 * @param {import('react').ReactNode} children The group's children.
 * @returns {Array<{props: {title: string}}>} The titled children, in order.
 */
export function titledChildren(children) {
  return Children.toArray(children).filter(
    (child) => isValidElement(child) && typeof child.props?.title === 'string',
  );
}
