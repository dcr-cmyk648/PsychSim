import { useState, type ReactNode } from 'react';

interface LazyDisclosureProps {
  summary: ReactNode;
  children: () => ReactNode;
  className?: string;
  summaryClassName?: string;
  initiallyOpen?: boolean;
}

/**
 * A disclosure whose body is not mounted until it is open. Developer mode uses
 * this instead of cosmetic hiding so large rule audits do not slow the page
 * before the reviewer asks to see them.
 */
export function LazyDisclosure({
  summary,
  children,
  className,
  summaryClassName,
  initiallyOpen = false,
}: LazyDisclosureProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const [hasOpened, setHasOpened] = useState(initiallyOpen);
  return (
    <details
      className={className}
      open={open}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setOpen(nextOpen);
        if (nextOpen) setHasOpened(true);
      }}
    >
      <summary className={summaryClassName}>{summary}</summary>
      {hasOpened ? children() : null}
    </details>
  );
}
