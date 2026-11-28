// The tab selection decisions of CodeGroup. Plain ESM with JSDoc types, like snippetText.mjs, so
// `yarn test` can cover the lookup, the clamping and the keyboard wrap-around without a browser.

/**
 * The tab to open first: the index of the item titled defaultTab, or 0 when it matches none, so
 * the group opens the first file.
 *
 * @param {{title: string}[]} items The files, in tab order.
 * @param {string | undefined} defaultTab The label of the file to open first.
 * @returns {number}
 */
export function initialTab(items, defaultTab) {
  return Math.max(0, items.findIndex((item) => item.title === defaultTab));
}

/**
 * The tab the selected index must show, clamped to the last item so items shrinking below the
 * selected index, which only happens in a hot reload, cannot crash the group.
 *
 * @param {number} selected The index selected with clicks or the keyboard.
 * @param {number} count The number of items.
 * @returns {number}
 */
export function clampTab(selected, count) {
  return Math.min(selected, count - 1);
}

/**
 * The tab a key on the tablist moves to, wrapping around at both ends, or undefined for a key the
 * tablist does not handle.
 *
 * @param {number} active The tab currently shown.
 * @param {string} key The key pressed.
 * @param {number} count The number of tabs.
 * @returns {number | undefined}
 */
export function nextTab(active, key, count) {
  switch (key) {
    case 'ArrowRight':
      return (active + 1) % count;
    case 'ArrowLeft':
      return (active - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}
