// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DeveloperEncounterScratchpad } from '@psychsim/schemas';

import type { EncounterScratchpadRepository } from './persistence';
import { useEncounterScratchpad } from './useEncounterScratchpad';

afterEach(cleanup);

const caseInstance = {
  id: 'case-instance.review-scratchpad',
  blueprintId: 'case.review-scratchpad',
  contentVersion: '1.0.0',
  seed: 'review-scratchpad-seed',
};

const existingScratchpad: DeveloperEncounterScratchpad = {
  schemaVersion: 1,
  id: 'scratchpad.case-instance.review-scratchpad',
  caseInstanceId: caseInstance.id,
  blueprintId: caseInstance.blueprintId,
  caseContentVersion: caseInstance.contentVersion,
  seed: caseInstance.seed,
  reviewerNote: 'Existing thought',
  createdAt: '2026-07-27T12:00:00.000Z',
  updatedAt: '2026-07-27T12:00:00.000Z',
};

const repository = (
  loaded: DeveloperEncounterScratchpad | null,
): EncounterScratchpadRepository => ({
  loadEncounterScratchpad: vi.fn(async () => loaded),
  saveEncounterScratchpad: vi.fn(async () => undefined),
  deleteEncounterScratchpad: vi.fn(async () => undefined),
  saveAndDeleteEncounterScratchpad: vi.fn(async () => undefined),
});

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('useEncounterScratchpad', () => {
  it('loads the exact patient draft and serializes an immediate flush', async () => {
    const storage = repository(existingScratchpad);
    const { result } = renderHook(() =>
      useEncounterScratchpad({
        repository: storage,
        enabled: true,
        caseInstance,
        debounceMs: 60_000,
        now: () => '2026-07-27T12:05:00.000Z',
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(result.current.note).toBe('Existing thought');

    act(() => result.current.updateNote('A more specific thought'));
    await act(async () => {
      await result.current.flush();
    });

    expect(storage.saveEncounterScratchpad).toHaveBeenCalledWith({
      ...existingScratchpad,
      reviewerNote: 'A more specific thought',
      updatedAt: '2026-07-27T12:05:00.000Z',
    });
    expect(result.current.status).toBe('saved');
  });

  it('deletes a blank draft and clears local state after atomic completion', async () => {
    const storage = repository(existingScratchpad);
    const { result } = renderHook(() =>
      useEncounterScratchpad({
        repository: storage,
        enabled: true,
        caseInstance,
        debounceMs: 60_000,
      }),
    );

    await waitFor(() => expect(result.current.note).toBe('Existing thought'));
    act(() => result.current.updateNote('   '));
    await act(async () => {
      await result.current.flush();
    });
    expect(storage.deleteEncounterScratchpad).toHaveBeenCalledWith(caseInstance.id);

    act(() => result.current.clearAfterCompletion());
    expect(result.current.note).toBe('');
    expect(result.current.status).toBe('disabled');
  });

  it('does not let a delayed load overwrite a note entered while loading', async () => {
    const pendingLoad = deferred<DeveloperEncounterScratchpad | null>();
    const storage = repository(null);
    storage.loadEncounterScratchpad = vi.fn(() => pendingLoad.promise);
    const { result } = renderHook(() =>
      useEncounterScratchpad({
        repository: storage,
        enabled: true,
        caseInstance,
        debounceMs: 60_000,
        now: () => '2026-07-27T12:05:00.000Z',
      }),
    );

    expect(result.current.status).toBe('loading');
    act(() => result.current.updateNote('Fresh thought entered immediately'));
    await act(async () => {
      pendingLoad.resolve(existingScratchpad);
      await pendingLoad.promise;
    });

    await waitFor(() => expect(result.current.status).toBe('saved'));
    expect(result.current.note).toBe('Fresh thought entered immediately');
    expect(storage.saveEncounterScratchpad).toHaveBeenCalledWith({
      ...existingScratchpad,
      reviewerNote: 'Fresh thought entered immediately',
      updatedAt: '2026-07-27T12:05:00.000Z',
    });
  });

  it('flushes the latest revision after an older queued save finishes', async () => {
    const firstSave = deferred<void>();
    const storage = repository(existingScratchpad);
    storage.saveEncounterScratchpad = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useEncounterScratchpad({
        repository: storage,
        enabled: true,
        caseInstance,
        debounceMs: 60_000,
        now: () => '2026-07-27T12:05:00.000Z',
      }),
    );

    await waitFor(() => expect(result.current.note).toBe('Existing thought'));
    act(() => result.current.updateNote('Intermediate thought'));
    let flushPromise!: Promise<string>;
    act(() => {
      flushPromise = result.current.flush();
    });
    await waitFor(() => expect(storage.saveEncounterScratchpad).toHaveBeenCalledTimes(1));

    act(() => result.current.updateNote('Existing thought'));
    await act(async () => {
      firstSave.resolve();
      await flushPromise;
    });

    expect(storage.saveEncounterScratchpad).toHaveBeenCalledTimes(2);
    expect(storage.saveEncounterScratchpad).toHaveBeenLastCalledWith({
      ...existingScratchpad,
      reviewerNote: 'Existing thought',
      updatedAt: '2026-07-27T12:05:00.000Z',
    });
    expect(result.current.note).toBe('Existing thought');
    expect(result.current.status).toBe('saved');
  });
});
