import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadSourceReviewTickets, SOURCE_REVIEW_TICKETS_ENDPOINT } from './source-review-tickets';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('source-review ticket loader', () => {
  it('loads a strict local feed without caching', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        schemaVersion: 1,
        projectionVersion: 1,
        generatedAt: '2026-07-25T12:00:00.000Z',
        tickets: [],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadSourceReviewTickets()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(SOURCE_REVIEW_TICKETS_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
  });

  it('treats a missing local feed as an empty queue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
      })),
    );
    await expect(loadSourceReviewTickets()).resolves.toEqual([]);
  });

  it('rejects an invalid or failed feed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ tickets: [], rawText: 'private' }),
      })),
    );
    await expect(loadSourceReviewTickets()).rejects.toThrow();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
      })),
    );
    await expect(loadSourceReviewTickets()).rejects.toThrow('status 500');
  });
});
