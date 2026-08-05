import {
  ConditionFindingProfileCatalogSchema,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityRequest,
  type PatientTemplate,
  type TemplateConditionSelectionProfile,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';
import {
  fingerprintConditionFindingCardinalityProfile,
  fingerprintTemplateConditionSelectionTemplate,
  selectConditionFindingCardinalityCandidates,
  selectTemplateConditions,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import conditionFindingProfilesJson from '../../../content/catalogs/diagnoses/condition-finding-profiles.json';

const mddDiagnosis = catalogs.diagnoses.find(
  (diagnosis) => diagnosis.id === 'diagnosis.major-depressive-disorder',
);
if (mddDiagnosis === undefined) {
  throw new Error('Expected the checked-in MDD diagnosis definition.');
}

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-31T21:06:04.000Z',
  sourceUseNoteIds: ['source-use.test.mdd-profile'],
};

const template: PatientTemplate = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.real-mdd-profile',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Real MDD profile authoring test',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  focusedDecisionId: 'decision.test.mdd-profile',
  primaryPolicyRef: {
    id: 'decision-policy.test.mdd-profile',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.mdd-profile',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.mdd-profile',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
  findingProjectionHorizonId: 'finding-projection-horizon.test.mdd-profile',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000003',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.mdd-profile',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly-recipe.fnv1a64.0000000000000004',
  compatibleLocationRefs: [
    {
      id: 'location.test.mdd-profile',
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.mdd-current',
      diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
      diagnosisDefinitionContentVersion: mddDiagnosis.contentVersion,
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: null,
      specifierIds: [],
    },
  ],
  optionalConditionSelectionGroups: [],
  complexityProfile: {
    modelVersion: 'additional-feature-budget.v1',
    measurementStatus: 'budget_only',
    additionalFeatureBudget: 0,
    maximumSelectedModules: 0,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.mdd-profile',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
};

const conditionProfile: TemplateConditionSelectionProfile = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'generation-profile.test.mdd-profile',
  modelVersion: 'weighted-template-condition-selection.v1',
  templateRef: {
    id: template.id,
    contentVersion: template.contentVersion,
  },
  templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
  groupProfiles: [],
  incompatibilities: [],
};

const conditionSelection = selectTemplateConditions({
  schemaVersion: 1,
  id: 'template-condition-selection-request.test.mdd-profile',
  template,
  profile: conditionProfile,
  seed: 'mdd-profile-condition-seed',
});
if (!conditionSelection.ok) {
  throw new Error(
    'error' in conditionSelection
      ? conditionSelection.error.message
      : conditionSelection.conflict.code,
  );
}

const catalog = ConditionFindingProfileCatalogSchema.parse(conditionFindingProfilesJson);
const mddProfile = catalog.profiles[0]!;
const referencedFindingIds = new Set([
  ...mddProfile.requiredOutcomes.map((outcome) => outcome.findingDefinitionId),
  ...(mddProfile.modelVersion === 'condition-finding-dimensions.v1'
    ? mddProfile.dimensions.flatMap((dimension) =>
        dimension.manifestations.map((manifestation) => manifestation.findingDefinitionId),
      )
    : mddProfile.cardinalityGroups.flatMap((group) =>
        group.members.map((member) => member.findingDefinitionId),
      )),
]);

const compile = (seed: string) => {
  const conditionState = conditionSelection.value.conditionStates[0]!;
  const request: ConditionFindingCardinalityRequest = {
    schemaVersion: 1,
    id: 'condition-finding-cardinality-request.test.real-mdd-profile',
    conditionSource: {
      schemaVersion: 1,
      sourceKind: 'template_condition_selection',
      artifact: conditionSelection.value,
    },
    profiles: [mddProfile],
    conditionProfileBindings: [
      {
        schemaVersion: 1,
        id: 'condition-finding-binding.test.real-mdd-profile',
        conditionStateId: conditionState.id,
        profileRef: {
          id: mddProfile.id,
          contentVersion: mddProfile.contentVersion,
        },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(mddProfile),
      },
    ],
    findingDefinitions: catalogs.findings.filter((finding) => referencedFindingIds.has(finding.id)),
    seed,
  };
  const result = selectConditionFindingCardinalityCandidates(request);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
};

describe('checked-in condition-finding profiles', () => {
  it('parses the approved point-free adult MDD dimension profile', () => {
    expect(catalog.id).toBe('registry.catalog.condition-finding-profiles');
    expect(catalog.profiles).toHaveLength(1);
    expect(mddProfile).toMatchObject({
      id: 'condition-finding-profile.mdd.current-episode',
      modelVersion: 'condition-finding-dimensions.v1',
      minimumSelectedDimensions: 5,
      maximumSelectedDimensions: 9,
    });
    if (mddProfile.modelVersion !== 'condition-finding-dimensions.v1') {
      throw new Error('Expected a dimension profile.');
    }
    expect(mddProfile.dimensions).toHaveLength(9);
    expect(mddProfile.selectionRequirements).toEqual([
      expect.objectContaining({
        dimensionIds: [
          'condition-finding-dimension.mdd.current-episode.depressed-mood',
          'condition-finding-dimension.mdd.current-episode.anhedonia',
        ],
        minimumSelections: 1,
        maximumSelections: 2,
      }),
    ]);
    expect(
      mddProfile.dimensions.flatMap((dimension) =>
        dimension.manifestations.map((manifestation) => manifestation.findingDefinitionId),
      ),
    ).not.toContain('finding.history.current-pessimism');
    expect(JSON.stringify(mddProfile)).not.toMatch(/"points"|"balance"/);
  });

  it('rejects an impossible MDD dimension count', () => {
    const invalid = structuredClone(conditionFindingProfilesJson);
    invalid.profiles[0]!.minimumSelectedDimensions = 10;
    expect(ConditionFindingProfileCatalogSchema.safeParse(invalid).success).toBe(false);
  });

  it('deterministically emits five through nine dimensions with a core symptom', () => {
    const signatures = new Set<string>();
    for (let index = 0; index < 128; index += 1) {
      const seed = `real-mdd-profile-seed-${index}`;
      const first = compile(seed);
      const replay = compile(seed);
      expect(replay).toEqual(first);
      expect(first.dimensionSelections).toHaveLength(1);
      const selection = first.dimensionSelections[0]!;
      expect(selection.selectedDimensionCount).toBeGreaterThanOrEqual(5);
      expect(selection.selectedDimensionCount).toBeLessThanOrEqual(9);
      const selected = selection.dimensionEvaluations.filter((dimension) => dimension.selected);
      const selectedIds = new Set(selected.map((dimension) => dimension.dimensionId));
      expect(
        selectedIds.has('condition-finding-dimension.mdd.current-episode.depressed-mood') ||
          selectedIds.has('condition-finding-dimension.mdd.current-episode.anhedonia'),
      ).toBe(true);
      expect(
        selected.every(
          (dimension) =>
            dimension.selectedManifestationCount === 1 &&
            dimension.manifestationEvaluations.filter((manifestation) => manifestation.selected)
              .length === 1,
        ),
      ).toBe(true);
      expect(first.candidates).toHaveLength(selection.selectedDimensionCount);
      expect(first.candidates.map((candidate) => candidate.findingDefinitionId)).not.toContain(
        'finding.history.current-pessimism',
      );
      signatures.add(
        selected
          .map((dimension) => dimension.dimensionId)
          .sort()
          .join('|'),
      );
    }
    expect(signatures.size).toBeGreaterThan(1);
  });
});
