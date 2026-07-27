import { describe, expect, it } from 'vitest';

import developerOpinionsJson from '../../../content/catalogs/evidence/opinions/developer-opinions.json';
import { DeveloperOpinionCatalogSchema, DeveloperOpinionSchema } from './index';

describe('Developer-opinion provenance', () => {
  it('accepts a direct reviewed statement without pretending it came from a private source unit', () => {
    const opinion = DeveloperOpinionCatalogSchema.parse(developerOpinionsJson).opinions[0]!;
    expect(opinion.originKind).toBe('direct_reviewer_statement');
    expect(opinion.originSourceUnitIds).toEqual([]);
    expect(opinion.originCandidateIds).toEqual([]);
    expect(opinion.developerReview.status).toBe('accepted');
  });

  it('still requires a reviewed origin for a private-source opinion', () => {
    const opinion = structuredClone(
      DeveloperOpinionCatalogSchema.parse(developerOpinionsJson).opinions[0]!,
    );
    opinion.originKind = 'private_source';
    expect(DeveloperOpinionSchema.safeParse(opinion).success).toBe(false);
  });

  it('requires every opinion to name exactly its evidence relationships', () => {
    const invalid = structuredClone(developerOpinionsJson);
    invalid.opinions[0]!.evidenceRelationshipIds = [];
    expect(DeveloperOpinionCatalogSchema.safeParse(invalid).success).toBe(false);
  });
});
