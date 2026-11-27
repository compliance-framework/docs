// The variants of one tutorial step, shown as tabs so the page stays short: install with npm or
// with yarn, run on Ubuntu or on RHEL. The reader opens the one that matches their setup and
// skips the rest. Clicking a tab switches the panel; on the tab row the arrow keys move the
// selection and Home and End jump to either end. src/theme/MDXComponents/index.tsx registers them
// as <Tabs> and <Tab>, so tutorial pages use them without an import.
import React, {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useId,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import {clampTab, initialTab, nextTab} from './codeGroupTabs.mjs';

export type TabProps = {
  /** The tab's label, such as `Ubuntu` or `Install with yarn`. */
  title: string;
  /** What the tab shows while it is selected. */
  children?: ReactNode;
};

/**
 * One tab of a Tabs group. It only carries its label and its content: the group draws the row of
 * tabs and shows the selected one's children, so a <Tab> left outside a group still reads.
 */
export function Tab({children}: TabProps): ReactNode {
  return <>{children}</>;
}

export type TabsProps = {
  /** The tabs, in tab order: <Tab> elements, anything else is skipped. */
  children?: ReactNode;
  /** Label of the tab to open first; the first tab when it matches none. */
  defaultTab?: string;
  /** Classes added to the group. */
  className?: string;
};

// The <Tab> children, in order, ignoring the text and whitespace MDX leaves between them.
function tabElements(children: ReactNode): ReactElement<TabProps>[] {
  return React.Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> =>
      isValidElement<TabProps>(child) && typeof child.props.title === 'string',
  );
}

export default function Tabs({children, defaultTab, className}: TabsProps): ReactNode {
  const tabs = tabElements(children);
  const group = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState(() =>
    initialTab(
      tabs.map((tab) => ({title: tab.props.title})),
      defaultTab,
    ),
  );
  if (tabs.length === 0) {
    return null;
  }
  const active = clampTab(selected, tabs.length);

  // The same keyboard contract as CodeGroup's tab row, decided in codeGroupTabs.mjs, where
  // `yarn test` covers it.
  function onSelectKey(event: KeyboardEvent<HTMLDivElement>) {
    const moved = nextTab(active, event.key, tabs.length);
    if (moved === undefined) {
      return;
    }
    event.preventDefault();
    setSelected(moved);
    buttons.current[moved]?.focus();
  }

  return (
    <div
      className={clsx(
        'ccf-tabs my-4 overflow-hidden rounded-[var(--ifm-code-border-radius)] border',
        'border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-background-surface-color)]',
        'shadow-[shadow:var(--ifm-global-shadow-lw)]',
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={tabs.map((tab) => tab.props.title).join(', ')}
        onKeyDown={onSelectKey}
        className="flex flex-wrap gap-1 border-b border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-color-emphasis-100)] px-2 pt-2"
      >
        {tabs.map((tab, index) => {
          const isSelected = index === active;
          return (
            <button
              key={`${tab.props.title}:${index}`}
              ref={(button) => {
                buttons.current[index] = button;
              }}
              type="button"
              role="tab"
              id={`${group}-tab-${index}`}
              aria-selected={isSelected}
              aria-controls={`${group}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(index)}
              className={clsx(
                'rounded-t-[var(--ifm-global-radius)] border border-b-0 px-3 py-2 leading-tight',
                isSelected
                  ? 'border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-background-surface-color)] font-semibold'
                  : 'border-transparent bg-transparent text-[var(--ifm-font-color-secondary)]',
                'hover:text-[var(--ifm-font-color-base)]',
              )}
            >
              {tab.props.title}
            </button>
          );
        })}
      </div>
      <div
        id={`${group}-panel`}
        role="tabpanel"
        aria-labelledby={`${group}-tab-${active}`}
        className="ccf-tabs-panel px-4 pt-3"
      >
        {tabs[active].props.children}
      </div>
    </div>
  );
}
