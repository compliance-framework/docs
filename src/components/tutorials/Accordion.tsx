// A question or a detail the reader opens only when they need it: what a flag does, what the
// output looks like. It keeps a tutorial short without hiding anything. Each item opens and
// closes on its own, drawn with the native details element so it works before the page's scripts
// load; AccordionGroup joins several items into one bordered list. src/theme/MDXComponents/index
// .tsx registers them as <Accordion> and <AccordionGroup>, so tutorial pages use them without an
// import. The chevron's turn is styled in src/css/custom.css.
import React, {type ReactNode} from 'react';
import clsx from 'clsx';

export type AccordionProps = {
  /** The headline that stays visible, such as the question the item answers. */
  title: string;
  /** Start open instead of collapsed. */
  defaultOpen?: boolean;
  /** What the reader sees when the item is open. */
  children?: ReactNode;
  /** Classes added to the item. */
  className?: string;
};

export default function Accordion({
  title,
  defaultOpen,
  children,
  className,
}: AccordionProps): ReactNode {
  return (
    <details className={clsx('ccf-accordion', className)} open={defaultOpen || undefined}>
      <summary className="ccf-accordion-summary">
        <span className="min-w-0 font-semibold">{title}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ccf-accordion-chevron h-4 w-4 shrink-0 text-[var(--ifm-font-color-secondary)]"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </summary>
      <div className="ccf-accordion-body">{children}</div>
    </details>
  );
}

export type AccordionGroupProps = {
  /** The items, in reading order: <Accordion> elements. */
  children?: ReactNode;
  /** Classes added to the group. */
  className?: string;
};

export function AccordionGroup({children, className}: AccordionGroupProps): ReactNode {
  return (
    <div className={clsx('ccf-accordion-group my-4', className)}>{children}</div>
  );
}
