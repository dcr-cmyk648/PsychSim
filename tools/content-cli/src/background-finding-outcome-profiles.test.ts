import {
  BackgroundFindingOutcomeProfileCatalogSchema,
  DeveloperOpinionCatalogSchema,
  EvidenceSourceDefinitionSchema,
  FindingDefinitionSchema,
  SourceUseDecisionCatalogSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import sourceUseDecisionsJson from '../../../content/catalogs/evidence/source-use-decisions.json';
import nhanesEvidenceJson from '../../../content/catalogs/evidence/formal/cdc-nchs-nhanes-2021-2023-depression-screener.evidence.json';
import developerOpinionsJson from '../../../content/catalogs/evidence/opinions/developer-opinions.json';
import backgroundProfilesJson from '../../../content/catalogs/findings/background-outcome-profiles.json';
import functionalImpactFindingJson from '../../../content/catalogs/findings/definitions/self-reported-current-functional-impact.finding.json';
import { fingerprintBackgroundFindingOutcomeProfile } from '../../../packages/engine/src/background-finding-outcome-selector';

const catalog = BackgroundFindingOutcomeProfileCatalogSchema.parse(backgroundProfilesJson);
const profile = catalog.profiles.find(
  (candidate) =>
    candidate.id === 'background-finding-profile.mdd-outpatient.current-functional-impact',
)!;
const finding = FindingDefinitionSchema.parse(functionalImpactFindingJson);
const source = EvidenceSourceDefinitionSchema.parse(nhanesEvidenceJson);
const sourceUse = SourceUseDecisionCatalogSchema.parse(sourceUseDecisionsJson).decisions.find(
  (decision) => decision.id === 'source-use.cdc-nchs.nhanes-2021-2023-depression-screener',
)!;
const opinions = DeveloperOpinionCatalogSchema.parse(developerOpinionsJson);
const opinion = opinions.opinions.find(
  (candidate) =>
    candidate.id ===
    'developer-opinion.mdd-outpatient-current-functional-impact-generation.2026-08-05',
)!;
const relationship = opinions.evidenceRelationships.find(
  (candidate) =>
    candidate.id === 'opinion-evidence.mdd-outpatient-current-functional-impact.nhanes-2021-2023',
)!;

describe('checked-in background-finding outcome profiles', () => {
  it('retains the approved coarse NHANES-derived broad-impact mapping and its limitations', () => {
    expect(profile.findingDefinitionId).toBe(finding.id);
    expect(profile.findingDefinitionContentVersion).toBe(finding.contentVersion);
    expect(
      profile.outcomes.map((outcome) => ({
        value: outcome.proposedValue.value,
        weight: outcome.gameGenerationWeight,
      })),
    ).toEqual([
      { value: 'absent', weight: 1244 },
      { value: 'present', weight: 8756 },
    ]);
    expect(profile.outcomes.reduce((sum, outcome) => sum + outcome.gameGenerationWeight, 0)).toBe(
      10_000,
    );
    expect(profile.review).toMatchObject({
      status: 'approved',
      reviewerId: 'reviewer.dustin-rowland',
      sourceUseNoteIds: [sourceUse.id],
    });
    expect(profile.developerOpinionIds).toEqual([opinion.id]);
    expect(fingerprintBackgroundFindingOutcomeProfile(profile)).toMatch(
      /^fingerprint\.background-finding\.profile\.fnv1a64\.[a-f0-9]{16}$/,
    );

    expect(source.id).toBe(sourceUse.evidenceSourceId);
    expect(source.knownContentHashes).toHaveLength(2);
    expect(sourceUse).toMatchObject({
      decisionStatus: 'permitted_with_conditions',
      legalBasis: 'public_domain',
      permissions: {
        derivedClinicalContent: true,
        runtimeRedistribution: true,
      },
    });
    expect(sourceUse.allowedContributionTypes).toContain('patient_fact');

    expect(opinion.developerReview.status).toBe('accepted');
    expect(opinion.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetKind: 'clinical_rule',
          targetContentId: profile.id,
          role: 'affected_rule',
        }),
      ]),
    );
    expect(relationship).toMatchObject({
      opinionId: opinion.id,
      evidenceSourceId: source.id,
      sourceUseDecisionId: sourceUse.id,
      stillExpertBridge: true,
      review: {
        status: 'accepted',
      },
    });
    expect(relationship.applicabilityLimitations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('screening subgroup'),
        expect.stringContaining('not a psychiatric-clinic cohort'),
      ]),
    );
  });

  it('rejects duplicate profile IDs and a partial executable outcome horizon', () => {
    const duplicate = structuredClone(backgroundProfilesJson);
    duplicate.profiles.push(structuredClone(duplicate.profiles[0]!));
    expect(BackgroundFindingOutcomeProfileCatalogSchema.safeParse(duplicate).success).toBe(false);

    const duplicateOutcome = structuredClone(backgroundProfilesJson);
    duplicateOutcome.profiles[0]!.outcomes[1]!.proposedValue =
      duplicateOutcome.profiles[0]!.outcomes[0]!.proposedValue;
    expect(BackgroundFindingOutcomeProfileCatalogSchema.safeParse(duplicateOutcome).success).toBe(
      false,
    );
  });
});
