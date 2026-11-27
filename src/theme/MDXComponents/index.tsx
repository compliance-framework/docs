// Registers the tutorial components on every page's MDX scope, so a tutorial page writes
// <CopyBlock> and <CodeGroup> without importing them. Docusaurus reads the MDX component scope
// from this module, and the wrapper keeps the theme's own mappings (code, a, ul, admonition...).
import MDXComponents from '@theme-original/MDXComponents';
import CopyBlock from '@site/src/components/tutorials/CopyBlock';
import CodeGroup from '@site/src/components/tutorials/CodeGroup';

export default {
  ...MDXComponents,
  CopyBlock,
  CodeGroup,
};
