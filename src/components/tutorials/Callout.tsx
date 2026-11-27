// The notes a tutorial makes beside its steps: a caveat before a destructive command, a shortcut
// worth knowing. The type picks the accent colour and the icon, following the five admonitions
// Docusaurus itself ships (note, tip, info, warning, danger). <Note>, <Tip>, <Info>, <Warning>
// and <Danger> are <Callout> with the type already set. src/theme/MDXComponents/index.tsx
// registers all six, so tutorial pages use them without an import. The accent colours live in
// src/css/custom.css, in the site's Infima palette.
import React, {type ReactNode} from 'react';
import clsx from 'clsx';

export type CalloutType = 'note' | 'tip' | 'info' | 'warning' | 'danger';

export type CalloutProps = {
  /** The kind of note: picks the accent colour and the icon. `note` by default. */
  type?: CalloutType;
  /** A bold line before the text, such as the command the caveat is about. */
  title?: string;
  /** What the reader needs to know. */
  children?: ReactNode;
  /** Classes added to the callout. */
  className?: string;
};

const strokeWidth = 2;
const iconProps = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-5 w-5',
} as const;

const icons: Record<CalloutType, ReactNode> = {
  note: (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  tip: (
    <svg {...iconProps}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.5 1 1.4 1 2.5h6c0-1.1.4-2 1-2.5A6 6 0 0 0 12 3Z" />
    </svg>
  ),
  info: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  warning: (
    <svg {...iconProps}>
      <path d="m10.29 3.86-8.18 14A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.72-3.14l-8.18-14a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  danger: (
    <svg {...iconProps}>
      <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
};

export function Callout({type = 'note', title, children, className}: CalloutProps): ReactNode {
  return (
    <div
      className={clsx(
        'ccf-callout',
        `ccf-callout--${type}`,
        'my-4 flex gap-3 rounded-r-[var(--ifm-global-radius)] border-l-4 px-4 py-3',
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 text-[var(--ccf-callout-accent)]">{icons[type]}</span>
      <div className="ccf-callout-body min-w-0">
        {title ? <div className="font-semibold text-[var(--ifm-heading-color)]">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

export default Callout;

type CalloutContentProps = Omit<CalloutProps, 'type'>;

/** A side note that does not change what the reader does. */
export function Note(props: CalloutContentProps): ReactNode {
  return <Callout type="note" {...props} />;
}

/** A shortcut or trick worth knowing. */
export function Tip(props: CalloutContentProps): ReactNode {
  return <Callout type="tip" {...props} />;
}

/** Background that helps the reader understand the step. */
export function Info(props: CalloutContentProps): ReactNode {
  return <Callout type="info" {...props} />;
}

/** Something easy to get wrong; the step still works if the reader heeds it. */
export function Warning(props: CalloutContentProps): ReactNode {
  return <Callout type="warning" {...props} />;
}

/** Harm if ignored: lost data, a revoked credential, a broken deployment. */
export function Danger(props: CalloutContentProps): ReactNode {
  return <Callout type="danger" {...props} />;
}
