// Where a Card's href leads. Plain ESM with JSDoc types, like snippetText.mjs, so `yarn test` can
// cover the internal-versus-external decision without a browser.

/**
 * Whether a card's href names a page of this site: root-relative (so Docusaurus's Link navigates
 * in place), and not protocol-relative: `//example.com/x` looks root-relative but a browser reads
 * it as the host example.com, so it stays an external link opening in a new tab.
 *
 * @param {string | undefined} href The card's href, if it has one.
 * @returns {boolean} True when the card should link through Link.
 */
export function isInternalHref(href) {
  return href !== undefined && href.startsWith('/') && !href.startsWith('//');
}
