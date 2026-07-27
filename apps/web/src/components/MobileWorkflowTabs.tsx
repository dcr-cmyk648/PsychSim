import { useEffect, useRef, type KeyboardEvent } from 'react';

export type MobileWorkflowPane = 'patient' | 'revealed' | 'investigate' | 'treatment' | 'results';

const ENCOUNTER_PANES: ReadonlyArray<{
  id: Exclude<MobileWorkflowPane, 'results'>;
  label: string;
}> = [
  { id: 'patient', label: 'Patient' },
  { id: 'revealed', label: 'Revealed' },
  { id: 'investigate', label: 'Investigate' },
  { id: 'treatment', label: 'Plan' },
];
const RECEIPT_PANES: ReadonlyArray<{ id: MobileWorkflowPane; label: string }> = [
  ...ENCOUNTER_PANES,
  { id: 'results', label: 'Results / review' },
];

interface MobileWorkflowTabsProps {
  activePane: MobileWorkflowPane;
  includeResults: boolean;
  onChange: (pane: MobileWorkflowPane) => void;
}

export function MobileWorkflowTabs({
  activePane,
  includeResults,
  onChange,
}: MobileWorkflowTabsProps) {
  const tabScrollerRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panes = includeResults ? RECEIPT_PANES : ENCOUNTER_PANES;

  useEffect(() => {
    const activeIndex = panes.findIndex((pane) => pane.id === activePane);
    const activeButton = buttonRefs.current[activeIndex];
    const tabScroller = tabScrollerRef.current;
    if (!activeButton || !tabScroller) return;

    const buttonBounds = activeButton.getBoundingClientRect();
    const scrollerBounds = tabScroller.getBoundingClientRect();
    if (buttonBounds.left < scrollerBounds.left) {
      tabScroller.scrollLeft += buttonBounds.left - scrollerBounds.left;
    } else if (buttonBounds.right > scrollerBounds.right) {
      tabScroller.scrollLeft += buttonBounds.right - scrollerBounds.right;
    }
  }, [activePane, panes]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % panes.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + panes.length) % panes.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = panes.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextPane = panes[nextIndex]!;
    onChange(nextPane.id);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <nav ref={tabScrollerRef} className="mobile-workflow-tabs" aria-label="Case workspace">
      <div role="tablist" aria-label="Case workspace panes">
        {panes.map((pane, index) => (
          <button
            key={pane.id}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            id={`mobile-tab-${pane.id}`}
            type="button"
            role="tab"
            aria-controls={`mobile-panel-${pane.id}`}
            aria-selected={activePane === pane.id}
            tabIndex={activePane === pane.id ? 0 : -1}
            className={activePane === pane.id ? 'active' : undefined}
            onClick={() => onChange(pane.id)}
            onKeyDown={(event) => moveFocus(event, index)}
          >
            {pane.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
