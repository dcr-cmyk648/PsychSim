import {
  DatabaseEntryReviewSchema,
  type DatabaseEntryReview,
  type PublicClinicalCatalogEntry,
  type PublicClinicalCatalogProjection,
} from '@psychsim/schemas';

export const buildDatabaseEntryReview = (input: {
  entry: PublicClinicalCatalogEntry;
  projection: PublicClinicalCatalogProjection;
  reviewerNote: string;
  timestamp: string;
  existingReview?: DatabaseEntryReview;
}): DatabaseEntryReview =>
  DatabaseEntryReviewSchema.parse({
    schemaVersion: 1,
    id: `database-review.${input.entry.id}`,
    entryId: input.entry.id,
    categoryId: input.entry.categoryId,
    catalogContentVersion: input.projection.catalogContentVersion,
    projectionVersion: input.projection.projectionVersion,
    entrySnapshot: structuredClone(input.entry),
    reviewerNote: input.reviewerNote.trim(),
    createdAt: input.existingReview?.createdAt ?? input.timestamp,
    updatedAt: input.timestamp,
  });
