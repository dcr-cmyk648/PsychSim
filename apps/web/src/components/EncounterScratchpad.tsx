import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import type { EncounterScratchpadStatus } from '../useEncounterScratchpad';

interface EncounterScratchpadProps {
  patientLabel: string;
  note: string;
  status: EncounterScratchpadStatus;
  error: string | null;
  onChange(note: string): void;
  onFlush(): Promise<string>;
}

const statusLabel = (status: EncounterScratchpadStatus, error: string | null): string => {
  if (status === 'loading') return 'Loading saved note…';
  if (status === 'saving') return 'Saving locally…';
  if (status === 'saved') return 'Saved locally';
  if (status === 'error') return error ? `Not saved: ${error}` : 'Not saved locally';
  return 'Autosaves in this browser';
};

export function EncounterScratchpad({
  patientLabel,
  note,
  status,
  error,
  onChange,
  onFlush,
}: EncounterScratchpadProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const textareaId = useId();
  const statusId = useId();
  const asideRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const closingRef = useRef(false);

  const openScratchpad = (): void => {
    closingRef.current = false;
    setOpen(true);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
      textareaRef.current?.scrollIntoView?.({ block: 'nearest' });
    });
  };

  const closeScratchpad = async (): Promise<void> => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      await onFlush();
      setOpen(false);
      window.requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
    } catch {
      closingRef.current = false;
      window.requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    void closeScratchpad();
  };

  useEffect(() => {
    setOpen(false);
  }, [patientLabel]);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    const aside = asideRef.current;
    if (!visualViewport || !aside) return;

    const synchronizeViewport = (): void => {
      const keyboardInset = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop,
      );
      aside.style.setProperty('--scratchpad-viewport-height', `${visualViewport.height}px`);
      aside.style.setProperty('--scratchpad-keyboard-inset', `${keyboardInset}px`);
    };

    synchronizeViewport();
    visualViewport.addEventListener('resize', synchronizeViewport);
    visualViewport.addEventListener('scroll', synchronizeViewport);
    return () => {
      visualViewport.removeEventListener('resize', synchronizeViewport);
      visualViewport.removeEventListener('scroll', synchronizeViewport);
    };
  }, []);

  return (
    <aside
      ref={asideRef}
      className={`encounter-scratchpad${open ? ' is-open' : ''}`}
      aria-label="Persistent case review notes"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={toggleRef}
        className="encounter-scratchpad-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? void closeScratchpad() : openScratchpad())}
      >
        <span>
          <strong>Case notes</strong>
          <small className={status === 'error' ? 'scratchpad-save-error' : undefined}>
            {status === 'error'
              ? 'Not saved — open to retry'
              : note.trim()
                ? 'Draft in progress'
                : 'Capture thoughts while you work'}
          </small>
        </span>
        <b aria-hidden="true">{open ? '↓' : '↑'}</b>
      </button>

      <div id={panelId} className="encounter-scratchpad-panel" hidden={!open}>
        <div className="encounter-scratchpad-heading">
          <div>
            <p className="panel-kicker">Case review · {patientLabel}</p>
            <h2>Notes while reviewing this patient</h2>
          </div>
          <button className="text-button" type="button" onClick={() => void closeScratchpad()}>
            Close
          </button>
        </div>
        <label htmlFor={textareaId}>
          Record clinical, scoring, content, or general app observations
        </label>
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={note}
          maxLength={8000}
          rows={8}
          disabled={status === 'loading'}
          aria-describedby={statusId}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (!closingRef.current) void onFlush().catch(() => undefined);
          }}
          placeholder="Example: I expected prior mania history to matter for this selection…"
        />
        <div className="encounter-scratchpad-footer">
          <span
            id={statusId}
            className={status === 'error' ? 'scratchpad-save-error' : undefined}
            role="status"
            aria-live="polite"
          >
            {statusLabel(status, error)}
          </span>
          <small>
            On submission, this becomes the editable Case and app experience note attached to the
            exact attempt.
          </small>
        </div>
      </div>
    </aside>
  );
}
