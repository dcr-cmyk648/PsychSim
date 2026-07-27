import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DeveloperEncounterScratchpadSchema,
  type CaseInstance,
  type DeveloperEncounterScratchpad,
} from '@psychsim/schemas';

import type { EncounterScratchpadRepository } from './persistence';

export type EncounterScratchpadStatus =
  | 'disabled'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'saved'
  | 'error';

const currentTimestamp = (): string => new Date().toISOString();

interface UseEncounterScratchpadInput {
  repository: EncounterScratchpadRepository;
  enabled: boolean;
  caseInstance: Pick<CaseInstance, 'id' | 'blueprintId' | 'contentVersion' | 'seed'> | null;
  debounceMs?: number;
  now?: () => string;
}

interface UseEncounterScratchpadResult {
  note: string;
  status: EncounterScratchpadStatus;
  error: string | null;
  updateNote(note: string): void;
  flush(): Promise<string>;
  clearAfterCompletion(): void;
}

const scratchpadIdFor = (caseInstanceId: string): string => caseInstanceId;

export const useEncounterScratchpad = ({
  repository,
  enabled,
  caseInstance,
  debounceMs = 450,
  now = currentTimestamp,
}: UseEncounterScratchpadInput): UseEncounterScratchpadResult => {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<EncounterScratchpadStatus>('disabled');
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef('');
  const savedNoteRef = useRef('');
  const scratchpadRef = useRef<DeveloperEncounterScratchpad | null>(null);
  const activeCaseInstanceRef = useRef(caseInstance);
  const enabledRef = useRef(enabled);
  const nowRef = useRef(now);
  const timerRef = useRef<number | null>(null);
  const operationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const loadPromiseRef = useRef<Promise<void>>(Promise.resolve());
  const flushPromiseRef = useRef<Promise<string> | null>(null);
  const loadTokenRef = useRef(0);
  const editRevisionRef = useRef(0);
  const loadingRef = useRef(false);

  activeCaseInstanceRef.current = caseInstance;
  enabledRef.current = enabled;
  nowRef.current = now;

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const enqueue = useCallback((operation: () => Promise<void>): Promise<void> => {
    const pending = operationQueueRef.current.catch(() => undefined).then(operation);
    operationQueueRef.current = pending.catch(() => undefined);
    return pending;
  }, []);

  const persistNote = useCallback(
    async (
      value: string,
      target: Pick<CaseInstance, 'id' | 'blueprintId' | 'contentVersion' | 'seed'>,
    ): Promise<void> => {
      setStatus('saving');
      setError(null);
      try {
        await enqueue(async () => {
          if (!value.trim()) {
            await repository.deleteEncounterScratchpad(target.id);
            if (activeCaseInstanceRef.current?.id === target.id) {
              scratchpadRef.current = null;
              savedNoteRef.current = value;
            }
            return;
          }

          const timestamp = nowRef.current();
          const current =
            scratchpadRef.current?.caseInstanceId === target.id ? scratchpadRef.current : null;
          const scratchpad = DeveloperEncounterScratchpadSchema.parse({
            schemaVersion: 1,
            id: current?.id ?? scratchpadIdFor(target.id),
            caseInstanceId: target.id,
            blueprintId: target.blueprintId,
            caseContentVersion: target.contentVersion,
            seed: target.seed,
            reviewerNote: value,
            createdAt: current?.createdAt ?? timestamp,
            updatedAt: timestamp,
          });
          await repository.saveEncounterScratchpad(scratchpad);
          if (activeCaseInstanceRef.current?.id === target.id) {
            scratchpadRef.current = scratchpad;
            savedNoteRef.current = value;
          }
        });
        if (
          enabledRef.current &&
          activeCaseInstanceRef.current?.id === target.id &&
          noteRef.current === value
        ) {
          setStatus('saved');
        }
      } catch (caught) {
        if (activeCaseInstanceRef.current?.id === target.id) {
          setStatus('error');
          setError(
            caught instanceof Error ? caught.message : 'The case note could not be saved locally.',
          );
        }
        throw caught;
      }
    },
    [enqueue, repository],
  );

  const flush = useCallback((): Promise<string> => {
    if (flushPromiseRef.current) return flushPromiseRef.current;

    const pending = (async (): Promise<string> => {
      clearTimer();
      await loadPromiseRef.current.catch(() => undefined);

      while (enabledRef.current && activeCaseInstanceRef.current) {
        await operationQueueRef.current.catch(() => undefined);
        clearTimer();
        const target = activeCaseInstanceRef.current;
        const value = noteRef.current;
        if (value === savedNoteRef.current) return value;
        await persistNote(value, target);
      }

      await operationQueueRef.current.catch(() => undefined);
      return noteRef.current;
    })();
    flushPromiseRef.current = pending;
    const clearPendingFlush = (): void => {
      if (flushPromiseRef.current === pending) {
        flushPromiseRef.current = null;
      }
    };
    void pending.then(clearPendingFlush, clearPendingFlush);
    return pending;
  }, [clearTimer, persistNote]);

  const updateNote = useCallback(
    (value: string): void => {
      const boundedValue = value.slice(0, 8000);
      editRevisionRef.current += 1;
      noteRef.current = boundedValue;
      setNote(boundedValue);
      setError(null);
      if (!enabledRef.current || !activeCaseInstanceRef.current) return;
      setStatus('saving');
      clearTimer();
      if (loadingRef.current) return;
      const target = activeCaseInstanceRef.current;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void persistNote(noteRef.current, target).catch(() => undefined);
      }, debounceMs);
    },
    [clearTimer, debounceMs, persistNote],
  );

  const clearAfterCompletion = useCallback((): void => {
    clearTimer();
    loadTokenRef.current += 1;
    editRevisionRef.current += 1;
    loadingRef.current = false;
    loadPromiseRef.current = Promise.resolve();
    noteRef.current = '';
    savedNoteRef.current = '';
    scratchpadRef.current = null;
    setNote('');
    setStatus('disabled');
    setError(null);
  }, [clearTimer]);

  useEffect(() => {
    clearTimer();
    const loadToken = ++loadTokenRef.current;
    const loadEditRevision = ++editRevisionRef.current;
    if (!enabled || !caseInstance) {
      loadingRef.current = false;
      loadPromiseRef.current = Promise.resolve();
      noteRef.current = '';
      savedNoteRef.current = '';
      scratchpadRef.current = null;
      setNote('');
      setStatus('disabled');
      setError(null);
      return;
    }

    noteRef.current = '';
    savedNoteRef.current = '';
    scratchpadRef.current = null;
    loadingRef.current = true;
    setNote('');
    setStatus('loading');
    setError(null);

    const loadPromise = operationQueueRef.current
      .catch(() => undefined)
      .then(() => repository.loadEncounterScratchpad(caseInstance.id))
      .then(async (scratchpad) => {
        if (
          loadTokenRef.current !== loadToken ||
          activeCaseInstanceRef.current?.id !== caseInstance.id
        ) {
          return;
        }
        loadingRef.current = false;
        scratchpadRef.current = scratchpad;
        const loadedNote = scratchpad?.reviewerNote ?? '';
        savedNoteRef.current = loadedNote;
        if (editRevisionRef.current !== loadEditRevision) {
          setStatus('saving');
          await persistNote(noteRef.current, caseInstance);
          return;
        }
        noteRef.current = loadedNote;
        setNote(loadedNote);
        setStatus(scratchpad ? 'saved' : 'ready');
      })
      .catch((caught: unknown) => {
        if (
          loadTokenRef.current !== loadToken ||
          activeCaseInstanceRef.current?.id !== caseInstance.id
        ) {
          return;
        }
        loadingRef.current = false;
        setStatus('error');
        setError(
          caught instanceof Error ? caught.message : 'The saved case note could not be loaded.',
        );
      });
    loadPromiseRef.current = loadPromise;
    void loadPromise;
  }, [caseInstance?.id, clearTimer, enabled, persistNote, repository]);

  useEffect(() => {
    const flushBeforeBackgrounding = (): void => {
      if (document.visibilityState === 'hidden') {
        void flush().catch(() => undefined);
      }
    };
    const flushBeforePageHide = (): void => {
      void flush().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', flushBeforeBackgrounding);
    window.addEventListener('pagehide', flushBeforePageHide);
    return () => {
      document.removeEventListener('visibilitychange', flushBeforeBackgrounding);
      window.removeEventListener('pagehide', flushBeforePageHide);
    };
  }, [flush]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    note,
    status,
    error,
    updateNote,
    flush,
    clearAfterCompletion,
  };
};
