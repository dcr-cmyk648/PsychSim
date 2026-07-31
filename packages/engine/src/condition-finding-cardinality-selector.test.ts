import {
  ConditionFindingCardinalityArtifactSchema,
  ConditionFindingCardinalityRequestSchema,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityProfile,
  type ConditionFindingCardinalityRequest,
  type ConditionFindingDimensionProfile,
  type FindingDefinition,
  type PatientTemplate,
  type PatientTemplateConditionConstraint,
  type SharedFindingCompileRequest,
  type TemplateConditionSelectionProfile,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintConditionFindingCardinalityProfile,
  selectConditionFindingCardinalityCandidates,
  verifyConditionFindingCardinalityContext,
  verifyConditionFindingCardinalityIntegrity,
} from './condition-finding-cardinality-selector';
import { compileSharedFindings } from './shared-finding-compiler';
import {
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
} from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T15:40:00.000Z',
  sourceUseNoteIds: ['source-use.test.condition-findings'],
};

const conditionConstraint = (
  id: string,
  diagnosisDefinitionId: string,
  encounterRelevance: 'focus' | 'contributing',
): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id,
  diagnosisDefinitionId,
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance,
  severityId: encounterRelevance === 'focus' ? 'severity.test.moderate' : null,
  specifierIds: [],
});

const makeTemplate = (): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.condition-finding-cardinality',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic condition-finding cardinality fixture',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  focusedDecisionId: 'decision.test.immediate-treatment',
  primaryPolicyRef: {
    id: 'decision-policy.test.synthetic',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.synthetic',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.synthetic',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
  findingProjectionHorizonId: 'finding-projection-horizon.test.synthetic',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000003',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.synthetic',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly-recipe.fnv1a64.0000000000000004',
  compatibleLocationRefs: [
    {
      id: 'location.test.synthetic',
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    conditionConstraint('template-condition.test.focus', 'diagnosis.test.focus', 'focus'),
  ],
  optionalConditionSelectionGroups: [
    {
      schemaVersion: 1,
      id: 'template-condition-group.test.comorbidity',
      minimumSelections: 1,
      maximumSelections: 1,
      candidates: [
        conditionConstraint(
          'template-condition.test.comorbid',
          'diagnosis.test.comorbid',
          'contributing',
        ),
      ],
    },
  ],
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
    id: 'presentation-richness.test.condition-finding-cardinality',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeConditionSelection = () => {
  const template = makeTemplate();
  const profile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.condition-selection',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [
      {
        schemaVersion: 1,
        id: 'generation-profile-group.test.comorbidity',
        groupId: 'template-condition-group.test.comorbidity',
        countWeights: [
          {
            schemaVersion: 1,
            selectionCount: 1,
            gameSelectionWeight: 1,
          },
        ],
        candidateWeights: [
          {
            schemaVersion: 1,
            templateConditionId: 'template-condition.test.comorbid',
            gameSelectionWeight: 1,
          },
        ],
      },
    ],
    incompatibilities: [],
  };
  const result = selectTemplateConditions({
    schemaVersion: 1,
    id: 'template-condition-selection-request.test.condition-findings',
    template,
    profile,
    seed: 'condition-selection-seed',
  });
  if (!result.ok) {
    throw new Error('error' in result ? result.error.message : result.conflict.code);
  }
  return result.value;
};

const findingDefinition = (id: string, label: string): FindingDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  label,
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
});

const fatigueDefinition = findingDefinition('finding.history.test-fatigue', 'Current fatigue');
const anhedoniaDefinition = findingDefinition(
  'finding.history.test-anhedonia',
  'Current anhedonia',
);
const concentrationDefinition = findingDefinition(
  'finding.history.test-concentration',
  'Current concentration difficulty',
);
const sleepDefinition = findingDefinition(
  'finding.history.test-sleep-change',
  'Current sleep change',
);
const selfReportedSlowingDefinition = findingDefinition(
  'finding.history.test-psychomotor-slowing',
  'Current self-reported psychomotor slowing',
);
const observedSlowingDefinition: FindingDefinition = {
  ...findingDefinition(
    'finding.mse.test-observed-psychomotor-slowing',
    'Current observed psychomotor slowing',
  ),
  semanticKind: 'mental_status_exam',
};

const reviewedOutcome = (
  id: string,
  definition: FindingDefinition,
  value: 'present' | 'absent' | 'subthreshold' = 'present',
) => ({
  schemaVersion: 1 as const,
  id,
  findingDefinitionId: definition.id,
  findingDefinitionContentVersion: definition.contentVersion,
  proposedValue: { kind: 'outcome' as const, value },
  uncertainty: 'none' as const,
  developerOpinionIds: [] as string[],
  review: { ...approvedReview, sourceUseNoteIds: [...approvedReview.sourceUseNoteIds] },
});

const makeProfiles = (): ConditionFindingCardinalityProfile[] => [
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-finding-profile.test.focus',
    modelVersion: 'condition-finding-cardinality.v1',
    conditionScope: {
      diagnosisDefinitionId: 'diagnosis.test.focus',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: { kind: 'exact', severityId: 'severity.test.moderate' },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [
      reviewedOutcome('condition-finding-requirement.test.focus-fatigue', fatigueDefinition),
    ],
    cardinalityGroups: [
      {
        schemaVersion: 1,
        id: 'condition-finding-group.test.focus-symptoms',
        minimumSelections: 1,
        maximumSelections: 2,
        countWeights: [
          { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 2 },
          { schemaVersion: 1, selectionCount: 2, gameSelectionWeight: 1 },
        ],
        members: [
          {
            ...reviewedOutcome('condition-finding-member.test.anhedonia', anhedoniaDefinition),
            gameSelectionWeight: 5,
          },
          {
            ...reviewedOutcome(
              'condition-finding-member.test.concentration',
              concentrationDefinition,
            ),
            gameSelectionWeight: 3,
          },
          {
            ...reviewedOutcome('condition-finding-member.test.sleep', sleepDefinition),
            gameSelectionWeight: 1,
          },
        ],
        developerOpinionIds: [],
        review: {
          ...approvedReview,
          sourceUseNoteIds: [...approvedReview.sourceUseNoteIds],
        },
      },
    ],
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-finding-profile.test.comorbid',
    modelVersion: 'condition-finding-cardinality.v1',
    conditionScope: {
      diagnosisDefinitionId: 'diagnosis.test.comorbid',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: { kind: 'any' },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [
      reviewedOutcome('condition-finding-requirement.test.comorbid-fatigue', fatigueDefinition),
    ],
    cardinalityGroups: [],
  },
];

const makeRequest = (
  seed = 'condition-finding-cardinality-seed-42',
): ConditionFindingCardinalityRequest => {
  const conditionSelectionArtifact = makeConditionSelection();
  const profiles = makeProfiles();
  const stateByDiagnosisId = new Map(
    conditionSelectionArtifact.conditionStates.map((state) => [state.diagnosisDefinitionId, state]),
  );
  return {
    schemaVersion: 1,
    id: 'condition-finding-cardinality-request.test.synthetic',
    conditionSource: {
      schemaVersion: 1,
      sourceKind: 'template_condition_selection',
      artifact: conditionSelectionArtifact,
    },
    profiles,
    conditionProfileBindings: profiles.map((profile) => ({
      schemaVersion: 1,
      id: `condition-finding-binding.test.${profile.id}`,
      conditionStateId: stateByDiagnosisId.get(profile.conditionScope.diagnosisDefinitionId)!.id,
      profileRef: {
        id: profile.id,
        contentVersion: profile.contentVersion,
      },
      profileFingerprint: fingerprintConditionFindingCardinalityProfile(profile),
    })),
    findingDefinitions: [
      fatigueDefinition,
      anhedoniaDefinition,
      concentrationDefinition,
      sleepDefinition,
    ],
    seed,
  };
};

const makeDimensionRequest = (): ConditionFindingCardinalityRequest => {
  const request = makeRequest('condition-finding-dimension-seed-42');
  const comorbidProfile = request.profiles.find(
    (profile) => profile.id === 'condition-finding-profile.test.comorbid',
  )!;
  const dimensionProfile: ConditionFindingDimensionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-finding-profile.test.focus-dimensions',
    modelVersion: 'condition-finding-dimensions.v1',
    conditionScope: {
      diagnosisDefinitionId: 'diagnosis.test.focus',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: { kind: 'exact', severityId: 'severity.test.moderate' },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [],
    minimumSelectedDimensions: 2,
    maximumSelectedDimensions: 2,
    dimensionCountWeights: [
      {
        schemaVersion: 1,
        selectionCount: 2,
        gameSelectionWeight: 1,
      },
    ],
    dimensions: [
      {
        schemaVersion: 1,
        id: 'condition-finding-dimension.test.core-interest',
        gameSelectionWeight: 1,
        minimumManifestations: 1,
        maximumManifestations: 1,
        manifestationCountWeights: [
          {
            schemaVersion: 1,
            selectionCount: 1,
            gameSelectionWeight: 1,
          },
        ],
        manifestations: [
          {
            ...reviewedOutcome(
              'condition-finding-manifestation.test.anhedonia',
              anhedoniaDefinition,
            ),
            gameSelectionWeight: 1,
          },
        ],
        developerOpinionIds: [],
        review: {
          ...approvedReview,
          sourceUseNoteIds: [...approvedReview.sourceUseNoteIds],
        },
      },
      {
        schemaVersion: 1,
        id: 'condition-finding-dimension.test.psychomotor',
        gameSelectionWeight: 1,
        minimumManifestations: 2,
        maximumManifestations: 2,
        manifestationCountWeights: [
          {
            schemaVersion: 1,
            selectionCount: 2,
            gameSelectionWeight: 1,
          },
        ],
        manifestations: [
          {
            ...reviewedOutcome(
              'condition-finding-manifestation.test.self-reported-slowing',
              selfReportedSlowingDefinition,
            ),
            gameSelectionWeight: 1,
          },
          {
            ...reviewedOutcome(
              'condition-finding-manifestation.test.observed-slowing',
              observedSlowingDefinition,
            ),
            gameSelectionWeight: 1,
          },
        ],
        developerOpinionIds: [],
        review: {
          ...approvedReview,
          sourceUseNoteIds: [...approvedReview.sourceUseNoteIds],
        },
      },
    ],
    selectionRequirements: [
      {
        schemaVersion: 1,
        id: 'condition-finding-dimension-requirement.test.core',
        dimensionIds: ['condition-finding-dimension.test.core-interest'],
        minimumSelections: 1,
        maximumSelections: 1,
        developerOpinionIds: [],
        review: {
          ...approvedReview,
          sourceUseNoteIds: [...approvedReview.sourceUseNoteIds],
        },
      },
    ],
    developerOpinionIds: [],
    review: {
      ...approvedReview,
      sourceUseNoteIds: [...approvedReview.sourceUseNoteIds],
    },
  };
  request.profiles = [dimensionProfile, comorbidProfile];
  request.conditionProfileBindings = request.conditionProfileBindings.map((binding) =>
    binding.profileRef.id === 'condition-finding-profile.test.focus'
      ? {
          ...binding,
          profileRef: {
            id: dimensionProfile.id,
            contentVersion: dimensionProfile.contentVersion,
          },
          profileFingerprint: fingerprintConditionFindingCardinalityProfile(dimensionProfile),
        }
      : binding,
  );
  request.findingDefinitions = [
    fatigueDefinition,
    anhedoniaDefinition,
    selfReportedSlowingDefinition,
    observedSlowingDefinition,
  ];
  return request;
};

const expectSelected = (request: unknown) => {
  const result = selectConditionFindingCardinalityCandidates(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const sharedFindingRequest = (
  request: ConditionFindingCardinalityRequest,
  candidates = expectSelected(request).candidates,
): SharedFindingCompileRequest => {
  const selectedDefinitionIds = new Set(
    candidates.map((candidate) => candidate.findingDefinitionId),
  );
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.condition-cardinality',
    patientStateId: 'resolved-patient-state.test.condition-cardinality',
    seed: request.seed,
    findingDefinitions: request.findingDefinitions.filter((definition) =>
      selectedDefinitionIds.has(definition.id),
    ),
    candidates,
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.condition-cardinality',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections: [],
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.condition-cardinality',
      targets: [],
    },
  };
};

describe('condition finding cardinality selector', () => {
  it('counts selected dimensions once while preserving every selected manifestation', () => {
    const request = makeDimensionRequest();
    expect(ConditionFindingCardinalityRequestSchema.parse(request)).toEqual(request);
    const artifact = expectSelected(request);

    expect(artifact.groupSelections).toEqual([]);
    expect(artifact.dimensionSelections).toHaveLength(1);
    const selection = artifact.dimensionSelections[0]!;
    expect(selection.selectedDimensionCount).toBe(2);
    expect(selection.requirementEvaluations).toEqual([
      expect.objectContaining({
        requirementId: 'condition-finding-dimension-requirement.test.core',
        selectedCount: 1,
        satisfied: true,
      }),
    ]);
    const psychomotor = selection.dimensionEvaluations.find(
      (dimension) => dimension.dimensionId === 'condition-finding-dimension.test.psychomotor',
    )!;
    expect(psychomotor).toMatchObject({
      selected: true,
      selectedManifestationCount: 2,
    });
    expect(
      psychomotor.manifestationEvaluations.filter((manifestation) => manifestation.selected),
    ).toHaveLength(2);
    expect(
      artifact.candidates.filter(
        (candidate) => candidate.contributions[0]?.ownerId === selection.conditionStateId,
      ),
    ).toHaveLength(3);
    expect(verifyConditionFindingCardinalityIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    const crossedRequirementCount = structuredClone(artifact);
    crossedRequirementCount.dimensionSelections[0]!.requirementEvaluations[0]!.selectedCount = 0;
    expect(
      ConditionFindingCardinalityArtifactSchema.safeParse(crossedRequirementCount).success,
    ).toBe(false);

    const reordered = structuredClone(request);
    reordered.profiles.reverse();
    reordered.conditionProfileBindings.reverse();
    reordered.findingDefinitions.reverse();
    const reorderedProfile = reordered.profiles.find(
      (entry): entry is ConditionFindingDimensionProfile =>
        entry.modelVersion === 'condition-finding-dimensions.v1',
    )!;
    reorderedProfile.dimensions.reverse();
    reorderedProfile.selectionRequirements.reverse();
    reorderedProfile.dimensionCountWeights.reverse();
    reorderedProfile.dimensions.forEach((dimension) => {
      dimension.manifestations.reverse();
      dimension.manifestationCountWeights.reverse();
    });
    expect(expectSelected(reordered)).toEqual(artifact);
  });

  it('rejects overlapping dimension requirements and impossible count envelopes', () => {
    const overlapping = makeDimensionRequest();
    const profile = overlapping.profiles.find(
      (entry): entry is ConditionFindingDimensionProfile =>
        entry.modelVersion === 'condition-finding-dimensions.v1',
    )!;
    profile.selectionRequirements.push({
      schemaVersion: 1,
      id: 'condition-finding-dimension-requirement.test.overlap',
      dimensionIds: ['condition-finding-dimension.test.core-interest'],
      minimumSelections: 1,
      maximumSelections: 1,
      developerOpinionIds: [],
      review: {
        ...approvedReview,
        sourceUseNoteIds: [...approvedReview.sourceUseNoteIds],
      },
    });
    expect(ConditionFindingCardinalityRequestSchema.safeParse(overlapping).success).toBe(false);

    const impossible = makeDimensionRequest();
    const impossibleProfile = impossible.profiles.find(
      (entry): entry is ConditionFindingDimensionProfile =>
        entry.modelVersion === 'condition-finding-dimensions.v1',
    )!;
    impossibleProfile.minimumSelectedDimensions = 1;
    impossibleProfile.maximumSelectedDimensions = 1;
    impossibleProfile.dimensionCountWeights = [
      {
        schemaVersion: 1,
        selectionCount: 1,
        gameSelectionWeight: 1,
      },
    ];
    impossibleProfile.selectionRequirements[0]!.dimensionIds.push(
      'condition-finding-dimension.test.psychomotor',
    );
    impossibleProfile.selectionRequirements[0]!.minimumSelections = 2;
    impossibleProfile.selectionRequirements[0]!.maximumSelections = 2;
    expect(ConditionFindingCardinalityRequestSchema.safeParse(impossible).success).toBe(false);
  });

  it('strictly parses, is deterministic and order-invariant, and does not mutate input', () => {
    const request = makeRequest();
    expect(ConditionFindingCardinalityRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const first = expectSelected(request);
    expect(JSON.stringify(request)).toBe(before);

    const reordered = structuredClone(request);
    reordered.profiles.reverse();
    reordered.conditionProfileBindings.reverse();
    reordered.findingDefinitions.reverse();
    for (const profile of reordered.profiles) {
      profile.conditionScope.requiredSpecifierIds.reverse();
      profile.requiredOutcomes.reverse();
      if (profile.modelVersion !== 'condition-finding-cardinality.v1') continue;
      profile.cardinalityGroups.reverse();
      for (const requirement of profile.requiredOutcomes) {
        requirement.review.sourceUseNoteIds.reverse();
      }
      for (const group of profile.cardinalityGroups) {
        group.countWeights.reverse();
        group.members.reverse();
        group.review.sourceUseNoteIds.reverse();
        for (const member of group.members) {
          member.review.sourceUseNoteIds.reverse();
        }
      }
    }
    expect(expectSelected(reordered)).toEqual(first);
  });

  it('varies only within reviewed bounds and never emits an unselected member as absent', () => {
    const request = makeRequest();
    const signatures = new Set<string>();
    for (let index = 0; index < 80; index += 1) {
      request.seed = `condition-finding-seed-${index}`;
      const artifact = expectSelected(request);
      const group = artifact.groupSelections[0]!;
      signatures.add(group.selectionDraws.map((draw) => draw.selectedMemberId).join(','));
      expect(group.selectedCount).toBeGreaterThanOrEqual(1);
      expect(group.selectedCount).toBeLessThanOrEqual(2);
      expect(new Set(group.selectionDraws.map((draw) => draw.selectedMemberId)).size).toBe(
        group.selectedCount,
      );
      for (const member of group.memberEvaluations) {
        const emitted = artifact.candidates.find(
          (candidate) => candidate.id === member.candidateId,
        );
        if (member.selected) {
          expect(emitted).toMatchObject({
            kind: 'cardinality_requirement',
            proposedValue: member.proposedValue,
          });
        } else {
          expect(member.candidateId).toBeNull();
          expect(emitted).toBeUndefined();
          expect(member.proposedValue).toEqual({ kind: 'outcome', value: 'present' });
        }
      }
    }
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('preserves overlapping condition contributions, exact profiles, draws, and provenance', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);
    expect(ConditionFindingCardinalityArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.conditionSource).toEqual(request.conditionSource);
    expect(artifact.conditionSourceRef).toMatchObject({
      sourceKind: 'template_condition_selection',
      id: request.conditionSource.artifact.id,
      payloadFingerprint: request.conditionSource.artifact.payloadFingerprint,
    });
    expect(verifyConditionFindingCardinalityIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const fatigueCandidates = artifact.candidates.filter(
      (candidate) => candidate.findingDefinitionId === fatigueDefinition.id,
    );
    expect(fatigueCandidates).toHaveLength(2);
    expect(
      new Set(
        fatigueCandidates.map(
          (candidate) =>
            candidate.contributions.find(
              (contribution) => contribution.ownerKind === 'condition_state',
            )!.ownerId,
        ),
      ).size,
    ).toBe(2);
    for (const candidate of artifact.candidates) {
      expect(candidate.resolution).toMatchObject({
        origin: 'deterministic_generation',
        resolverVersion: '3.0.0',
      });
      expect(candidate.contributions.map((contribution) => contribution.ownerKind)).toEqual([
        'condition_state',
        'generation_profile',
      ]);
    }
  });

  it('keeps selected conditions without a bound finding profile visible as nonblocking coverage', () => {
    const request = makeRequest();
    request.profiles = request.profiles.filter(
      (profile) => profile.id === 'condition-finding-profile.test.focus',
    );
    request.conditionProfileBindings = request.conditionProfileBindings.filter(
      (binding) => binding.profileRef.id === 'condition-finding-profile.test.focus',
    );
    const artifact = expectSelected(request);

    expect(artifact.unboundConditionStateIds).toHaveLength(1);
    expect(artifact.candidates.every((candidate) => candidate.kind !== 'no_opinion')).toBe(true);

    const missingPartitionState = structuredClone(artifact);
    missingPartitionState.unboundConditionStateIds = [];
    expect(ConditionFindingCardinalityArtifactSchema.safeParse(missingPartitionState).success).toBe(
      false,
    );
  });

  it('allows composable base and severity profiles to bind the same condition state', () => {
    const request = makeRequest();
    const focusProfile = request.profiles[0]!;
    const focusBinding = request.conditionProfileBindings[0]!;
    const appetiteDefinition = findingDefinition(
      'finding.history.test-appetite-change',
      'Current appetite change',
    );
    const severityProfile: ConditionFindingCardinalityProfile = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'condition-finding-profile.test.focus-severity',
      modelVersion: 'condition-finding-cardinality.v1',
      conditionScope: structuredClone(focusProfile.conditionScope),
      requiredOutcomes: [
        reviewedOutcome(
          'condition-finding-requirement.test.focus-severity-appetite',
          appetiteDefinition,
        ),
      ],
      cardinalityGroups: [],
    };
    request.findingDefinitions.push(appetiteDefinition);
    request.profiles.push(severityProfile);
    request.conditionProfileBindings.push({
      schemaVersion: 1,
      id: 'condition-finding-binding.test.focus-severity',
      conditionStateId: focusBinding.conditionStateId,
      profileRef: {
        id: severityProfile.id,
        contentVersion: severityProfile.contentVersion,
      },
      profileFingerprint: fingerprintConditionFindingCardinalityProfile(severityProfile),
    });

    const artifact = expectSelected(request);
    expect(
      artifact.conditionProfileBindings.filter(
        (binding) => binding.conditionStateId === focusBinding.conditionStateId,
      ),
    ).toHaveLength(2);
    expect(
      artifact.candidates.some(
        (candidate) => candidate.findingDefinitionId === appetiteDefinition.id,
      ),
    ).toBe(true);
  });

  it('rejects stale profiles, scope mismatches, unreviewed mappings, and invalid values', () => {
    const stale = makeRequest();
    stale.conditionProfileBindings[0]!.profileFingerprint =
      'fingerprint.condition-finding-cardinality.profile.fnv1a64.0000000000000000';
    expect(selectConditionFindingCardinalityCandidates(stale)).toMatchObject({
      ok: false,
      error: { code: 'STALE_PROFILE_FINGERPRINT' },
    });

    const scopeMismatch = makeRequest();
    scopeMismatch.profiles[0]!.conditionScope.diagnosisDefinitionId = 'diagnosis.test.wrong';
    scopeMismatch.conditionProfileBindings[0]!.profileFingerprint =
      fingerprintConditionFindingCardinalityProfile(scopeMismatch.profiles[0]!);
    expect(ConditionFindingCardinalityRequestSchema.safeParse(scopeMismatch).success).toBe(false);

    const unreviewed = makeRequest();
    unreviewed.profiles[0]!.requiredOutcomes[0]!.review = {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    expect(ConditionFindingCardinalityRequestSchema.safeParse(unreviewed).success).toBe(false);

    const invalidValue = makeRequest();
    invalidValue.profiles[0]!.requiredOutcomes[0]!.proposedValue = {
      kind: 'outcome',
      value: 'high',
    };
    invalidValue.conditionProfileBindings[0]!.profileFingerprint =
      fingerprintConditionFindingCardinalityProfile(invalidValue.profiles[0]!);
    expect(selectConditionFindingCardinalityCandidates(invalidValue)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_FINDING_VALUE' },
    });
  });

  it('rejects multiple versions of one stable profile or finding-definition identity', () => {
    const profileVersions = makeRequest();
    const secondProfile = profileVersions.profiles[1]!;
    const firstProfile = profileVersions.profiles[0]!;
    secondProfile.id = firstProfile.id;
    secondProfile.contentVersion = '2.0.0';
    const secondBinding = profileVersions.conditionProfileBindings[1]!;
    secondBinding.profileRef = {
      id: secondProfile.id,
      contentVersion: secondProfile.contentVersion,
    };
    secondBinding.profileFingerprint = fingerprintConditionFindingCardinalityProfile(secondProfile);
    expect(ConditionFindingCardinalityRequestSchema.safeParse(profileVersions).success).toBe(false);

    const findingVersions = makeRequest();
    const versionedSleep = {
      ...structuredClone(sleepDefinition),
      contentVersion: '2.0.0',
    };
    findingVersions.findingDefinitions.push(versionedSleep);
    const comorbidProfile = findingVersions.profiles[1]!;
    comorbidProfile.requiredOutcomes.push(
      reviewedOutcome('condition-finding-requirement.test.comorbid-sleep-v2', versionedSleep),
    );
    findingVersions.conditionProfileBindings[1]!.profileFingerprint =
      fingerprintConditionFindingCardinalityProfile(comorbidProfile);
    expect(ConditionFindingCardinalityRequestSchema.safeParse(findingVersions).success).toBe(false);
  });

  it('rejects draw, provenance, payload, and exact-context tampering', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);

    const drawChanged = structuredClone(artifact);
    drawChanged.groupSelections[0]!.countStableDrawId =
      'stable-draw.condition-finding.count.0000000000000000';
    expect(verifyConditionFindingCardinalityIntegrity(drawChanged)).toMatchObject({
      ok: false,
      error: { code: 'DRAW_CONTEXT_MISMATCH' },
    });

    const provenanceChanged = structuredClone(artifact);
    const candidate = provenanceChanged.candidates[0]!;
    if (candidate.resolution?.origin === 'deterministic_generation') {
      candidate.resolution.generationProfileId = 'condition-finding-profile.test.changed';
    }
    expect(verifyConditionFindingCardinalityIntegrity(provenanceChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROVENANCE_MISMATCH' },
    });

    const candidateChanged = structuredClone(artifact);
    candidateChanged.candidates[0]!.kind = 'background_variation';
    expect(verifyConditionFindingCardinalityIntegrity(candidateChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROVENANCE_MISMATCH' },
    });

    const boundAndUnbound = structuredClone(artifact);
    boundAndUnbound.unboundConditionStateIds.push(
      boundAndUnbound.conditionProfileBindings[0]!.conditionStateId,
    );
    expect(ConditionFindingCardinalityArtifactSchema.safeParse(boundAndUnbound).success).toBe(
      false,
    );

    const payloadChanged = structuredClone(artifact);
    payloadChanged.requestId = 'condition-finding-cardinality-request.test.changed';
    expect(verifyConditionFindingCardinalityIntegrity(payloadChanged)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const sourceChanged = structuredClone(artifact);
    if (sourceChanged.conditionSource.sourceKind !== 'template_condition_selection') {
      throw new Error('Expected the D-196 source branch to remain discriminated.');
    }
    sourceChanged.conditionSource.artifact.seed = 'tampered-condition-source-seed';
    expect(verifyConditionFindingCardinalityIntegrity(sourceChanged)).toMatchObject({
      ok: false,
      error: { code: 'CONDITION_SOURCE_INTEGRITY_MISMATCH' },
    });

    const crossedSourceReference = structuredClone(artifact);
    crossedSourceReference.conditionSourceRef.id = 'template-condition-selection.test.crossed';
    expect(
      ConditionFindingCardinalityArtifactSchema.safeParse(crossedSourceReference).success,
    ).toBe(false);

    const contextChanged = structuredClone(request);
    contextChanged.seed = 'condition-finding-cardinality-seed-changed';
    expect(
      verifyConditionFindingCardinalityContext({
        artifact,
        request: contextChanged,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('feeds agreeing diagnostic/cardinality candidates directly into D-193', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);
    const result = compileSharedFindings(sharedFindingRequest(request, artifact.candidates));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    expect(
      result.value.candidateEvaluations
        .filter((evaluation) => evaluation.findingDefinitionId === fatigueDefinition.id)
        .map((evaluation) => evaluation.disposition),
    ).toEqual(['applied', 'applied']);
    expect(
      result.value.findings.find((finding) => finding.definitionId === fatigueDefinition.id)?.value,
    ).toEqual({ kind: 'outcome', value: 'present' });
  });

  it('lets D-193, not this selector, report incompatible hard outcomes', () => {
    const request = makeRequest();
    const comorbidProfile = request.profiles.find(
      (profile) => profile.id === 'condition-finding-profile.test.comorbid',
    )!;
    comorbidProfile.requiredOutcomes[0]!.proposedValue = {
      kind: 'outcome',
      value: 'absent',
    };
    const binding = request.conditionProfileBindings.find(
      (entry) => entry.profileRef.id === comorbidProfile.id,
    )!;
    binding.profileFingerprint = fingerprintConditionFindingCardinalityProfile(comorbidProfile);
    const artifact = expectSelected(request);
    const result = compileSharedFindings(sharedFindingRequest(request, artifact.candidates));

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'LITERAL_SAME_SCOPE_CONTRADICTION',
        disposition: 'retry_or_quarantine',
      },
    });
  });

  it('does not expose probabilities, points, diagnosis inference, or runtime state', () => {
    const artifact = expectSelected(makeRequest());
    const serialized = JSON.stringify(artifact);
    for (const forbidden of [
      '"probability"',
      '"prevalence"',
      '"points"',
      '"score"',
      '"diagnosisInference"',
      '"payout"',
      '"queue"',
      '"save"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
