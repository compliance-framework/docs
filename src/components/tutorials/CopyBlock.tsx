// One copy-pastable snippet: commands, config or file contents, shown as a code block the reader
// can copy in one click. It is Docusaurus's own code block (so it keeps the site's prism
// github/dracula highlighting and its copy button, made always visible in src/css/custom.css) with
// a title row and text that copies exactly as it is shown. src/theme/MDXComponents/index.tsx
// registers it as <CopyBlock>, so tutorial pages use it without an import.
import React, {type ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import {snippetText} from './snippetText.mjs';

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

export default function CopyBlock({code, children, language, title, className}: CopyBlockProps): ReactNode {
  return (
    <CodeBlock language={language} title={title} className={clsx('ccf-copy-block', className)}>
      {snippetText(code, children)}
    </CodeBlock>
  );
}
