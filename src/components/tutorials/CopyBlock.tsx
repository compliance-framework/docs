// One copy-pastable snippet: commands, config or file contents, shown as a code block the reader
// can copy in one click. It is Docusaurus's own code block (so it keeps the site's prism
// github/dracula highlighting and its copy button, made always visible in src/css/custom.css) with
// a title row and text that copies exactly as it is shown. src/theme/MDXComponents/index.tsx
// registers it as <CopyBlock>, so tutorial pages use it without an import.
import React, {type ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';

export type CopyBlockProps = {
  /** The snippet. Give this or a plain-text child, not both. */
  code?: string;
  /** The snippet as text children, e.g. a template literal that spans several lines. */
  children?: string | Array<string | number>;
  /** Prism language to highlight the snippet with, such as `sh`, `yaml` or `json`. */
  language?: string;
  /** Label above the snippet: the file it goes in, or what running it does. */
  title?: string;
  /** Classes added to the block. */
  className?: string;
};

/**
 * The text the block shows and copies: the `code` prop, or the children joined. Blank lines at the
 * ends are dropped and the indentation every line shares is removed, so a snippet written as an
 * indented template literal in MDX reads the way the author wrote it and copies what the reader
 * sees.
 */
export function snippetText(code: string | undefined, children: CopyBlockProps['children']): string {
  const raw = code ?? (Array.isArray(children) ? children.join('') : (children ?? ''));
  const lines = raw.replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((line) => line.trim() !== '').map((line) => /^[ \t]*/.exec(line)![0].length);
  const indent = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(indent)).join('\n');
}

export default function CopyBlock({code, children, language, title, className}: CopyBlockProps): ReactNode {
  return (
    <CodeBlock language={language} title={title} className={clsx('ccf-copy-block', className)}>
      {snippetText(code, children)}
    </CodeBlock>
  );
}
