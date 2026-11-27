// The files of one tutorial step, shown as tabs so the page stays short: the reader opens the file
// they need and copies it. Each tab shows one CopyBlock, so every file keeps its own copy button.
// src/theme/MDXComponents/index.tsx registers it as <CodeGroup>, so tutorial pages use it without
// an import.
import React, {type KeyboardEvent, type ReactNode, useId, useRef, useState} from 'react';
import clsx from 'clsx';
import CopyBlock from './CopyBlock';

export type CodeGroupItem = {
  /** The tab's label: the file the snippet belongs to, such as `compliance.yaml`. */
  title: string;
  /** The file's text: what the tab shows, and what its copy button copies. */
  code: string;
  /** Prism language to highlight the file with, such as `sh`, `yaml` or `json`. */
  language?: string;
};

export type CodeGroupProps = {
  /** The files, in tab order. */
  items: CodeGroupItem[];
  /** Label of the file to open first; the first file when it matches none. */
  defaultTab?: string;
  /** Classes added to the group. */
  className?: string;
};

export default function CodeGroup({items, defaultTab, className}: CodeGroupProps): ReactNode {
  const group = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState(Math.max(0, items.findIndex((item) => item.title === defaultTab)));
  if (items.length === 0) {
    return null;
  }
  // items can shrink below the selected index only in a hot reload, so clamp instead of crashing.
  const active = Math.min(selected, items.length - 1);

  // The tablist moves the selection with the arrow keys, and to either end with Home and End.
  function onSelectKey(event: KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1;
    const moved =
      event.key === 'ArrowRight' ? (active + 1) % items.length
      : event.key === 'ArrowLeft' ? (active - 1 + items.length) % items.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : undefined;
    if (moved === undefined) {
      return;
    }
    event.preventDefault();
    setSelected(moved);
    tabs.current[moved]?.focus();
  }

  return (
    <div
      className={clsx(
        'ccf-code-group my-4 overflow-hidden rounded-[var(--ifm-code-border-radius)] border',
        'border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-background-surface-color)]',
        'shadow-[var(--ifm-global-shadow-lw)]',
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={items.map((item) => item.title).join(', ')}
        onKeyDown={onSelectKey}
        className="flex flex-wrap gap-1 border-b border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-color-emphasis-100)] px-2 pt-2"
      >
        {items.map((item, index) => {
          const isSelected = index === active;
          return (
            <button
              key={`${item.title}:${index}`}
              ref={(tab) => {
                tabs.current[index] = tab;
              }}
              type="button"
              role="tab"
              id={`${group}-tab-${index}`}
              aria-selected={isSelected}
              aria-controls={`${group}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(index)}
              className={clsx(
                'rounded-t-[var(--ifm-global-radius)] border border-b-0 px-3 py-2 font-mono leading-tight',
                'text-[length:var(--ifm-code-font-size)]',
                isSelected
                  ? 'border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-background-surface-color)] font-semibold'
                  : 'border-transparent bg-transparent text-[var(--ifm-font-color-secondary)]',
                'hover:text-[var(--ifm-font-color-base)]',
              )}
            >
              {item.title}
            </button>
          );
        })}
      </div>
      <div id={`${group}-panel`} role="tabpanel" aria-labelledby={`${group}-tab-${active}`}>
        {/* No title: the tab above the file already names it. */}
        <CopyBlock code={items[active].code} language={items[active].language} />
      </div>
    </div>
  );
}
