// Registers the tutorial components on every page's MDX scope, so a tutorial page writes
// <CopyBlock>, <CodeGroup>, <Tabs>/<Tab>, <Card>/<CardGroup>, <Steps>/<Step>, the callouts
// (<Note>, <Tip>, <Info>, <Warning>, <Danger>, or <Callout type=...>) and <Accordion>/
// <AccordionGroup> without importing them. Docusaurus reads the MDX component scope from this
// module, and the wrapper keeps the theme's own mappings (code, a, ul, admonition...).
import MDXComponents from '@theme-original/MDXComponents';
import CopyBlock from '@site/src/components/tutorials/CopyBlock';
import CodeGroup from '@site/src/components/tutorials/CodeGroup';
import Tabs, {Tab} from '@site/src/components/tutorials/Tabs';
import Card, {CardGroup} from '@site/src/components/tutorials/Cards';
import Steps, {Step} from '@site/src/components/tutorials/Steps';
import Callout, {Danger, Info, Note, Tip, Warning} from '@site/src/components/tutorials/Callout';
import Accordion, {AccordionGroup} from '@site/src/components/tutorials/Accordion';

export default {
  ...MDXComponents,
  CopyBlock,
  CodeGroup,
  Tabs,
  Tab,
  Card,
  CardGroup,
  Steps,
  Step,
  Callout,
  Note,
  Tip,
  Info,
  Warning,
  Danger,
  Accordion,
  AccordionGroup,
};
