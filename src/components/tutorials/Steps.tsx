// A tutorial task broken into numbered stages, read top to bottom. The circle numbers each step
// and the line joins the circles, so the reader sees how far they have come. The content of a
// step is ordinary Markdown, so a step can hold commands (CopyBlock), prose or a callout.
// src/theme/MDXComponents/index.tsx registers them as <Steps> and <Step>, so tutorial pages use
// them without an import. The circle and the connecting line are drawn in src/css/custom.css.
import React, {type ReactElement, type ReactNode} from 'react';
import clsx from 'clsx';
import {titledChildren} from './titledChildren.mjs';

export type StepProps = {
  /** The step's headline, in a few words: what the reader does in this step. */
  title: string;
  /** What the step asks the reader to do. */
  children?: ReactNode;
};

/**
 * One step of a Steps list. It only carries its headline and its content: the list draws the
 * number and the connecting line, so a <Step> left outside a list still reads.
 */
export function Step({title, children}: StepProps): ReactNode {
  return (
    <>
      <div className="font-semibold">{title}</div>
      {children}
    </>
  );
}

export type StepsProps = {
  /** The steps, in reading order: <Step> elements, anything else is skipped. */
  children?: ReactNode;
  /** Classes added to the list. */
  className?: string;
};

export default function Steps({children, className}: StepsProps): ReactNode {
  // The <Step> children, in order; titledChildren skips the text and whitespace MDX leaves
  // between them, and what no number could be given to.
  const steps = titledChildren(children) as ReactElement<StepProps>[];
  if (steps.length === 0) {
    return null;
  }
  return (
    <ol className={clsx('ccf-steps my-6 list-none p-0', className)}>
      {steps.map((step, index) => (
        <li key={`${step.props.title}:${index}`} className="ccf-step relative flex gap-4 pb-6">
          <span
            aria-hidden="true"
            className={clsx(
              'ccf-step-number relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center',
              'rounded-full border-2 border-[var(--ifm-color-primary)]',
              'bg-[var(--ifm-background-surface-color)] font-semibold',
            )}
          >
            {index + 1}
          </span>
          <div className="ccf-step-body min-w-0 flex-1">
            <div className="font-semibold leading-7">{step.props.title}</div>
            {step.props.children}
          </div>
        </li>
      ))}
    </ol>
  );
}
