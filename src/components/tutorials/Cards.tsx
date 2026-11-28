// A link shown as a clickable card: the "what to do next" at the end of a tutorial step, or the
// links between tutorials. CardGroup lays several cards out in a responsive grid. An internal
// href (starting with a single /) links through Docusaurus's Link, so navigating does not reload
// the site; any other href opens in a new tab. src/theme/MDXComponents/index.tsx registers them
// as <Card> and <CardGroup>, so tutorial pages use them without an import.
import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import {isInternalHref} from './cardLink.mjs';

export type CardProps = {
  /** The card's headline: where the link leads. */
  title: string;
  /** Where the card links. Omit it for a card that only holds text. */
  href?: string;
  /** A short glyph before the title, such as an emoji. The site has no icon set to draw from. */
  icon?: string;
  /** One or two lines saying what the reader finds there. */
  children?: ReactNode;
  /** Classes added to the card. */
  className?: string;
};

const cardBox = clsx(
  'ccf-card group block rounded-[var(--ifm-global-radius)] border p-4 no-underline',
  'border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-background-surface-color)]',
  'text-[var(--ifm-font-color-base)] transition-[border-color]',
  'hover:border-[var(--ifm-color-primary)] hover:no-underline',
);

export default function Card({title, href, icon, children, className}: CardProps): ReactNode {
  const heading = (
    <span className="flex items-center gap-2 font-semibold text-[var(--ifm-heading-color)]">
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">{title}</span>
      {href ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto h-4 w-4 shrink-0 text-[var(--ifm-font-color-secondary)] transition-transform group-hover:translate-x-0.5"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      ) : null}
    </span>
  );
  const body = (
    <>
      {heading}
      {children ? (
        // A div, not a span: MDX hands the children as <p> elements, and a <p> may not sit
        // inside a phrasing-only <span>.
        <div className="mt-1 text-[var(--ifm-font-color-secondary)]">{children}</div>
      ) : null}
    </>
  );
  if (href && isInternalHref(href)) {
    return (
      <Link to={href} className={clsx(cardBox, className)}>
        {body}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clsx(cardBox, className)}>
        {body}
      </a>
    );
  }
  return <div className={clsx(cardBox, className)}>{body}</div>;
}

export type CardGroupProps = {
  /** How many columns a wide screen shows; 2 by default. Cards stack into one column below. */
  cols?: 1 | 2 | 3 | 4;
  /** The cards, in reading order. */
  children?: ReactNode;
  /** Classes added to the group. */
  className?: string;
};

// Written out so Tailwind can see each class: a class name built at runtime would be purged.
const gridCols: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function CardGroup({cols = 2, children, className}: CardGroupProps): ReactNode {
  return (
    <div
      className={clsx(
        'ccf-card-group my-4 grid grid-cols-1 gap-4',
        gridCols[cols] ?? gridCols[2],
        className,
      )}
    >
      {children}
    </div>
  );
}
