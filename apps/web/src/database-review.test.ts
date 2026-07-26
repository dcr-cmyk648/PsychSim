import { describe, expect, it } from 'vitest';

import { publicClinicalCatalog } from '@psychsim/content-runtime';

import { buildDatabaseEntryReview } from './database-review';

describe('database entry reviews', () => {
  it('freezes the exact public entry snapshot without accepting private catalog fields', () => {
    const entry = publicClinicalCatalog.entries.find(
      (candidate) => candidate.id === 'medication.bupropion',
    );
    if (!entry) throw new Error('Expected the bupropion public catalog entry.');

    const review = buildDatabaseEntryReview({
      entry,
      projection: publicClinicalCatalog,
      reviewerNote: '  Add a clearer neutral mechanism summary for review.  ',
      timestamp: '2026-07-25T20:00:00.000Z',
    });

    expect(review).toMatchObject({
      id: 'database-review.medication.bupropion',
      entryId: 'medication.bupropion',
      reviewerNote: 'Add a clearer neutral mechanism summary for review.',
      entrySnapshot: entry,
    });
    expect(JSON.stringify(review)).not.toContain('pointDelta');
    expect(JSON.stringify(review)).not.toContain('sourceDocumentId');
  });

  it('preserves the original creation time when a comment is edited', () => {
    const entry = publicClinicalCatalog.entries[0]!;
    const first = buildDatabaseEntryReview({
      entry,
      projection: publicClinicalCatalog,
      reviewerNote: 'First note.',
      timestamp: '2026-07-25T20:00:00.000Z',
    });
    const edited = buildDatabaseEntryReview({
      entry,
      projection: publicClinicalCatalog,
      reviewerNote: 'Revised note.',
      timestamp: '2026-07-25T21:00:00.000Z',
      existingReview: first,
    });

    expect(edited.createdAt).toBe(first.createdAt);
    expect(edited.updatedAt).toBe('2026-07-25T21:00:00.000Z');
    expect(edited.reviewerNote).toBe('Revised note.');
  });
});
