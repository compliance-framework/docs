// The text a tutorial block shows and copies, shared by CopyBlock and CodeGroup. Plain ESM with
// JSDoc types, like the scripts/ the site builds from, so `yarn test` can cover the trimming and
// dedent it does without a browser.

/**
 * The text of a snippet: the code, or the children joined. Blank lines at the ends are dropped and
 * the indentation every line shares is removed, so a snippet written in MDX as an indented template
 * literal reads the way its author wrote it, and copies exactly what the reader sees.
 *
 * @param {string | undefined} code The snippet, when it is given as the code prop.
 * @param {string | Array<string | number> | undefined} children The snippet, when it is given as
 *   text children.
 * @returns {string}
 */
export function snippetText(code, children) {
  const raw = code ?? (Array.isArray(children) ? children.join('') : (children ?? ''));
  const lines = raw.replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((line) => line.trim() !== '').map((line) => /^[ \t]*/.exec(line)[0].length);
  const indent = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(indent)).join('\n');
}
