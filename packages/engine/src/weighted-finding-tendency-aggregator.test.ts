import {
  WeightedFindingTendencyArtifactSchema,
  WeightedFindingTendencyRequestSchema,
  type BackgroundFindingOutcomeProfile,
  type BackgroundFindingOutcomeRequest,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityProfile,
  type FindingContribution,
  type FindingDefinition,
  type PatientTemplate,
  type SharedFindingCompileRequest,
  type TemplateConditionSelectionProfile,
  type WeightedFindingTendencyProfile,
  type WeightedFindingTendencyRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintBackgroundFindingOutcomeProfile,
  selectBackgroundFindingOutcomes,
} from './background-finding-outcome-selector';
import {
  fingerprintConditionFindingCardinalityProfile,
  selectConditionFindingCardinalityCandidates,
} from './condition-finding-cardinality-selector';
import { compileSharedFindings } from './shared-finding-compiler';
import {
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
} from './template-condition-selector';
import {
  aggregateWeightedFindingTendencies,
  fingerprintWeightedFindingTendencyProfile,
  verifyWeightedFindingTendencyContext,
  verifyWeightedFindingTendencyIntegrity,
} from './weighted-finding-tendency-aggregator';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T17:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.weighted-tendency'],
};

const findingDefinition: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test-weighted-fatigue',
  label: 'Current fatigue',
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
};

const makeConditionFindingArtifact = () => {
  const template: PatientTemplate = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-template.test.weighted-tendency',
    compilationMode: 'attachment_only.v6',
    careSetting: 'outpatient_psychiatry',
    internalLabel: 'Synthetic weighted-tendency fixture',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
    patientPool: 'starter',
    focusedDecisionId: 'decision.test.weighted-tendency',
    primaryPolicyRef: {
      id: 'decision-policy.test.weighted-tendency',
      contentVersion: '1.0.0',
    },
    decisionActionHorizonId: 'decision-action-horizon.test.weighted-tendency',
    decisionActionHorizonFingerprint:
      'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
    diagnosisSelectionHorizonId: 'diagnosis-horizon.test.weighted-tendency',
    diagnosisSelectionHorizonFingerprint:
      'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
    findingProjectionHorizonId: 'finding-projection-horizon.test.weighted-tendency',
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
        id: 'location.test.weighted-tendency',
        contentVersion: '1.0.0',
      },
    ],
    requiredConditions: [
      {
        schemaVersion: 1,
        id: 'template-condition.test.weighted-focus',
        diagnosisDefinitionId: 'diagnosis.test.weighted-focus',
        diagnosisDefinitionContentVersion: '1.0.0',
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
      id: 'presentation-richness.test.weighted-tendency',
      modelVersion: 'presentation-richness.v1',
      decisionDriverCategories: ['diagnostic_attribution'],
      priorEffortExpectation: { kind: 'not_required' },
    },
  };
  const conditionSelectionProfile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.weighted-condition-selection',
    modelVersion: 'weighted-template-condition-selection.v1',
    templateRef: {
      id: template.id,
      contentVersion: template.contentVersion,
    },
    templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
    groupProfiles: [],
    incompatibilities: [],
  };
  const selectedConditions = selectTemplateConditions({
    schemaVersion: 1,
    id: 'template-condition-request.test.weighted-tendency',
    template,
    profile: conditionSelectionProfile,
    seed: 'weighted-condition-seed',
  });
  if (!selectedConditions.ok) {
    throw new Error(
      'error' in selectedConditions
        ? selectedConditions.error.message
        : selectedConditions.conflict.code,
    );
  }
  const findingProfile: ConditionFindingCardinalityProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'condition-finding-profile.test.weighted-focus',
    modelVersion: 'condition-finding-cardinality.v1',
    conditionScope: {
      diagnosisDefinitionId: 'diagnosis.test.weighted-focus',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: { kind: 'any' },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [
      {
        schemaVersion: 1,
        id: 'condition-finding-required.test.weighted-fatigue',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        developerOpinionIds: [],
        review: approvedReview,
      },
    ],
    cardinalityGroups: [],
  };
  const conditionState = selectedConditions.value.conditionStates[0]!;
  const result = selectConditionFindingCardinalityCandidates({
    schemaVersion: 1,
    id: 'condition-finding-request.test.weighted',
    conditionSource: {
      schemaVersion: 1,
      sourceKind: 'template_condition_selection',
      artifact: selectedConditions.value,
    },
    profiles: [findingProfile],
    conditionProfileBindings: [
      {
        schemaVersion: 1,
        id: 'condition-finding-binding.test.weighted-focus',
        conditionStateId: conditionState.id,
        profileRef: {
          id: findingProfile.id,
          contentVersion: findingProfile.contentVersion,
        },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(findingProfile),
      },
    ],
    findingDefinitions: [findingDefinition],
    seed: 'weighted-condition-finding-seed',
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const makeBackgroundRequest = (
  seed = 'weighted-tendency-seed-42',
  scale = 1,
): BackgroundFindingOutcomeRequest => {
  const profile: BackgroundFindingOutcomeProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'background-finding-profile.test.weighted-fatigue',
    modelVersion: 'weighted-background-finding.v1',
    findingDefinitionId: findingDefinition.id,
    findingDefinitionContentVersion: findingDefinition.contentVersion,
    outcomes: [
      {
        schemaVersion: 1,
        id: 'background-finding-outcome.test.weighted-fatigue.absent',
        proposedValue: { kind: 'outcome', value: 'absent' },
        uncertainty: 'none',
        gameGenerationWeight: 6 * scale,
      },
      {
        schemaVersion: 1,
        id: 'background-finding-outcome.test.weighted-fatigue.subthreshold',
        proposedValue: { kind: 'outcome', value: 'subthreshold' },
        uncertainty: 'none',
        gameGenerationWeight: 3 * scale,
      },
      {
        schemaVersion: 1,
        id: 'background-finding-outcome.test.weighted-fatigue.present',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        gameGenerationWeight: scale,
      },
    ],
    developerOpinionIds: [],
    review: approvedReview,
  };
  const horizon = {
    schemaVersion: 1 as const,
    id: 'background-finding-horizon.test.weighted',
    targets: [
      {
        schemaVersion: 1 as const,
        id: 'background-finding-target.test.weighted-fatigue',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
      },
    ],
  };
  return {
    schemaVersion: 1,
    id: 'background-finding-request.test.weighted',
    conditionFindingArtifact: makeConditionFindingArtifact(),
    horizon,
    profiles: [profile],
    profileBindings: [
      {
        schemaVersion: 1,
        id: 'background-finding-binding.test.weighted-fatigue',
        horizonTargetId: horizon.targets[0]!.id,
        profileRef: {
          id: profile.id,
          contentVersion: profile.contentVersion,
        },
        profileFingerprint: fingerprintBackgroundFindingOutcomeProfile(profile),
      },
    ],
    findingDefinitions: [findingDefinition],
    seed,
  };
};

const profile = (
  suffix: string,
  weights: {
    readonly absent: number;
    readonly subthreshold: number;
    readonly present: number;
  },
  scale = 1,
): WeightedFindingTendencyProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `weighted-finding-tendency-profile.test.${suffix}`,
  modelVersion: 'additive-categorical-finding-tendency.v1',
  findingDefinitionId: findingDefinition.id,
  findingDefinitionContentVersion: findingDefinition.contentVersion,
  outcomeSetSemantics: 'mutually_exclusive_exhaustive',
  allocations: [
    {
      schemaVersion: 1,
      proposedValue: { kind: 'outcome', value: 'absent' },
      addedGameGenerationWeight: weights.absent * scale,
    },
    {
      schemaVersion: 1,
      proposedValue: { kind: 'outcome', value: 'subthreshold' },
      addedGameGenerationWeight: weights.subthreshold * scale,
    },
    {
      schemaVersion: 1,
      proposedValue: { kind: 'outcome', value: 'present' },
      addedGameGenerationWeight: weights.present * scale,
    },
  ],
  developerOpinionIds: [],
  review: approvedReview,
});

const applicability = (
  suffix: string,
  ownerKind: FindingContribution['ownerKind'],
): FindingContribution => ({
  schemaVersion: 1,
  id: `finding-contribution.test.weighted-applicability.${suffix}`,
  ownerKind,
  ownerId: `${ownerKind}.test.${suffix}`,
  ownerContentVersion: ownerKind === 'condition_state' ? null : '1.0.0',
  role: 'constraint',
  provenanceIds: [`source-use.test.weighted-${suffix}`],
});

const makeRequest = (
  seed = 'weighted-tendency-seed-42',
  scale = 1,
): WeightedFindingTendencyRequest => {
  const background = selectBackgroundFindingOutcomes(makeBackgroundRequest(seed, scale));
  if (!background.ok) throw new Error(background.error.message);
  const profiles = [
    profile('medication', { absent: 0, subthreshold: 2, present: 6 }, scale),
    profile('context', { absent: 4, subthreshold: 1, present: 0 }, scale),
    profile('condition', { absent: 0, subthreshold: 5, present: 0 }, scale),
  ];
  return {
    schemaVersion: 1,
    id: 'weighted-finding-tendency-request.test.synthetic',
    backgroundArtifact: background.value,
    profiles,
    contributorBindings: [
      {
        schemaVersion: 1,
        id: 'weighted-finding-tendency-binding.test.medication',
        backgroundSelectionBindingId: 'background-finding-binding.test.weighted-fatigue',
        profileRef: {
          id: profiles[0]!.id,
          contentVersion: profiles[0]!.contentVersion,
        },
        profileFingerprint: fingerprintWeightedFindingTendencyProfile(profiles[0]!),
        applicabilityContributions: [applicability('medication', 'medication')],
      },
      {
        schemaVersion: 1,
        id: 'weighted-finding-tendency-binding.test.context',
        backgroundSelectionBindingId: 'background-finding-binding.test.weighted-fatigue',
        profileRef: {
          id: profiles[1]!.id,
          contentVersion: profiles[1]!.contentVersion,
        },
        profileFingerprint: fingerprintWeightedFindingTendencyProfile(profiles[1]!),
        applicabilityContributions: [applicability('context', 'clinical_context')],
      },
      {
        schemaVersion: 1,
        id: 'weighted-finding-tendency-binding.test.condition',
        backgroundSelectionBindingId: 'background-finding-binding.test.weighted-fatigue',
        profileRef: {
          id: profiles[2]!.id,
          contentVersion: profiles[2]!.contentVersion,
        },
        profileFingerprint: fingerprintWeightedFindingTendencyProfile(profiles[2]!),
        applicabilityContributions: [applicability('condition', 'condition_state')],
      },
    ],
    findingDefinitions: [findingDefinition],
  };
};

const expectAggregated = (request: unknown) => {
  const result = aggregateWeightedFindingTendencies(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const sharedFindingRequest = (
  request: WeightedFindingTendencyRequest,
  candidates = expectAggregated(request).candidates,
): SharedFindingCompileRequest => ({
  schemaVersion: 1,
  id: 'shared-finding-request.test.weighted',
  patientStateId: 'resolved-patient-state.test.weighted',
  seed: request.backgroundArtifact.seed,
  findingDefinitions: [findingDefinition],
  candidates,
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.weighted',
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
    id: 'finding-projection-horizon.test.weighted',
    targets: [],
  },
});

const selectedValue = (artifact: ReturnType<typeof expectAggregated>): string =>
  artifact.aggregations[0]!.outcomeEvaluations.find((outcome) => outcome.selected)!.proposedValue
    .value;

describe('weighted finding tendency aggregator', () => {
  it('strictly parses, is deterministic and order-invariant, and does not mutate input', () => {
    const request = makeRequest();
    expect(WeightedFindingTendencyRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectAggregated(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(WeightedFindingTendencyArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(verifyWeightedFindingTendencyIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const reordered = structuredClone(request);
    reordered.profiles.reverse();
    reordered.contributorBindings.reverse();
    reordered.findingDefinitions.reverse();
    for (const tendencyProfile of reordered.profiles) {
      tendencyProfile.allocations.reverse();
      tendencyProfile.review.sourceUseNoteIds.reverse();
    }
    for (const binding of reordered.contributorBindings) {
      binding.applicabilityContributions.reverse();
      for (const contribution of binding.applicabilityContributions) {
        contribution.provenanceIds.reverse();
      }
    }
    expect(expectAggregated(reordered)).toEqual(artifact);
  });

  it('pools exact nonnegative categorical mass and exposes normalized game probabilities', () => {
    const artifact = expectAggregated(makeRequest());
    const aggregation = artifact.aggregations[0]!;
    expect(aggregation.totalPooledGameGenerationWeight).toBe(28);
    expect(
      Object.fromEntries(
        aggregation.outcomeEvaluations.map((outcome) => [
          outcome.proposedValue.value,
          {
            baseline: outcome.baselineGameGenerationWeight,
            contributor: outcome.contributorGameGenerationWeight,
            pooled: outcome.pooledGameGenerationWeight,
            probability: outcome.normalizedGameSelectionProbability,
          },
        ]),
      ),
    ).toEqual({
      absent: {
        baseline: 6,
        contributor: 4,
        pooled: 10,
        probability: { numerator: 10, denominator: 28, decimal: 10 / 28 },
      },
      present: {
        baseline: 1,
        contributor: 6,
        pooled: 7,
        probability: { numerator: 7, denominator: 28, decimal: 7 / 28 },
      },
      subthreshold: {
        baseline: 3,
        contributor: 8,
        pooled: 11,
        probability: { numerator: 11, denominator: 28, decimal: 11 / 28 },
      },
    });
    expect(aggregation.contributorEvaluations).toHaveLength(3);
    expect(artifact.candidates).toHaveLength(1);
    expect(artifact.candidates[0]!.kind).toBe('weighted_tendency');
    expect(
      artifact.candidates[0]!.contributions.map((contribution) => contribution.ownerKind).sort(),
    ).toEqual([
      'catalog_definition',
      'clinical_context',
      'condition_state',
      'generation_profile',
      'generation_profile',
      'generation_profile',
      'generation_profile',
      'medication',
    ]);
  });

  it('uses its own target-stable draw, redraws the pooled distribution, and is common-scale invariant', () => {
    const base = expectAggregated(makeRequest('weighted-scale-seed', 1));
    const scaled = expectAggregated(makeRequest('weighted-scale-seed', 2));
    expect(selectedValue(scaled)).toBe(selectedValue(base));
    expect(scaled.aggregations[0]!.stableDrawId).toBe(base.aggregations[0]!.stableDrawId);
    expect(
      scaled.aggregations[0]!.outcomeEvaluations.map(
        (outcome) => outcome.normalizedGameSelectionProbability.decimal,
      ),
    ).toEqual(
      base.aggregations[0]!.outcomeEvaluations.map(
        (outcome) => outcome.normalizedGameSelectionProbability.decimal,
      ),
    );
    expect(scaled.inputFingerprint).not.toBe(base.inputFingerprint);

    const renamedRequest = makeRequest('weighted-scale-seed', 1);
    const renamedBackgroundRequest = makeBackgroundRequest('weighted-scale-seed', 1);
    renamedBackgroundRequest.profileBindings[0]!.id =
      'background-finding-binding.test.weighted-fatigue-renamed';
    const renamedBackground = selectBackgroundFindingOutcomes(renamedBackgroundRequest);
    if (!renamedBackground.ok) throw new Error(renamedBackground.error.message);
    renamedRequest.backgroundArtifact = renamedBackground.value;
    for (const binding of renamedRequest.contributorBindings) {
      binding.backgroundSelectionBindingId =
        'background-finding-binding.test.weighted-fatigue-renamed';
    }
    const renamed = expectAggregated(renamedRequest);
    expect(renamed.aggregations[0]!.stableDrawId).toBe(base.aggregations[0]!.stableDrawId);
    expect(selectedValue(renamed)).toBe(selectedValue(base));

    let foundRedraw = false;
    for (let index = 0; index < 100; index += 1) {
      const artifact = expectAggregated(makeRequest(`weighted-redraw-${index}`));
      const backgroundSelected = artifact.backgroundRef.id
        ? makeRequest(
            `weighted-redraw-${index}`,
          ).backgroundArtifact.selections[0]!.outcomeEvaluations.find(
            (outcome) => outcome.selected,
          )!.proposedValue.value
        : '';
      if (backgroundSelected !== selectedValue(artifact)) {
        foundRedraw = true;
        break;
      }
    }
    expect(foundRedraw).toBe(true);
  });

  it('rejects incomplete, negative, all-zero, stale, duplicate, unreviewed, and malformed inputs', () => {
    const incomplete = makeRequest();
    incomplete.profiles[0]!.allocations.pop();
    incomplete.contributorBindings[0]!.profileFingerprint =
      fingerprintWeightedFindingTendencyProfile(incomplete.profiles[0]!);
    expect(WeightedFindingTendencyRequestSchema.safeParse(incomplete).success).toBe(false);

    const negative = makeRequest();
    negative.profiles[0]!.allocations[0]!.addedGameGenerationWeight = -1;
    expect(WeightedFindingTendencyRequestSchema.safeParse(negative).success).toBe(false);

    const allZero = makeRequest();
    for (const allocation of allZero.profiles[0]!.allocations) {
      allocation.addedGameGenerationWeight = 0;
    }
    expect(WeightedFindingTendencyRequestSchema.safeParse(allZero).success).toBe(false);

    const stale = makeRequest();
    stale.contributorBindings[0]!.profileFingerprint =
      'fingerprint.weighted-finding-tendency.profile.fnv1a64.0000000000000000';
    expect(aggregateWeightedFindingTendencies(stale)).toMatchObject({
      ok: false,
      error: { code: 'STALE_PROFILE_FINGERPRINT' },
    });

    const duplicate = makeRequest();
    duplicate.contributorBindings[1]!.applicabilityContributions[0]!.id =
      duplicate.contributorBindings[0]!.applicabilityContributions[0]!.id;
    expect(WeightedFindingTendencyRequestSchema.safeParse(duplicate).success).toBe(false);

    const upstreamCollision = makeRequest();
    upstreamCollision.contributorBindings[0]!.applicabilityContributions[0]!.id =
      upstreamCollision.backgroundArtifact.candidates[0]!.contributions[0]!.id;
    expect(WeightedFindingTendencyRequestSchema.safeParse(upstreamCollision).success).toBe(false);

    const tooMany = makeRequest();
    tooMany.profiles = Array.from({ length: 65 }, (_, index) =>
      profile(`cap-${index}`, { absent: 1, subthreshold: 1, present: 1 }),
    );
    tooMany.contributorBindings = tooMany.profiles.map((entry, index) => ({
      schemaVersion: 1,
      id: `weighted-finding-tendency-binding.test.cap-${index}`,
      backgroundSelectionBindingId: 'background-finding-binding.test.weighted-fatigue',
      profileRef: { id: entry.id, contentVersion: entry.contentVersion },
      profileFingerprint: fingerprintWeightedFindingTendencyProfile(entry),
      applicabilityContributions: [applicability(`cap-${index}`, 'clinical_context')],
    }));
    expect(WeightedFindingTendencyRequestSchema.safeParse(tooMany).success).toBe(false);

    const unreviewed = makeRequest();
    unreviewed.profiles[0]!.review = {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    expect(WeightedFindingTendencyRequestSchema.safeParse(unreviewed).success).toBe(false);

    const noContributors = makeRequest();
    noContributors.profiles = [];
    noContributors.contributorBindings = [];
    expect(WeightedFindingTendencyRequestSchema.safeParse(noContributors).success).toBe(false);

    const badBackground = makeRequest();
    badBackground.backgroundArtifact.requestId = 'background-finding-request.test.tampered';
    expect(aggregateWeightedFindingTendencies(badBackground)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_BACKGROUND_ARTIFACT' },
    });
  });

  it('detects profile, mass, draw, candidate, payload, and exact-context tampering', () => {
    const request = makeRequest();
    const artifact = expectAggregated(request);

    const profileChanged = structuredClone(artifact);
    profileChanged.aggregations[0]!.contributorEvaluations[0]!.allocations[0]!.addedGameGenerationWeight += 1;
    expect(verifyWeightedFindingTendencyIntegrity(profileChanged)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const drawChanged = structuredClone(artifact);
    drawChanged.aggregations[0]!.stableDrawId =
      'stable-draw.weighted-finding-tendency.0000000000000000';
    expect(verifyWeightedFindingTendencyIntegrity(drawChanged)).toMatchObject({
      ok: false,
      error: { code: 'DRAW_CONTEXT_MISMATCH' },
    });

    const candidateChanged = structuredClone(artifact);
    candidateChanged.candidates[0]!.kind = 'background_variation';
    expect(verifyWeightedFindingTendencyIntegrity(candidateChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROVENANCE_MISMATCH' },
    });

    const payloadChanged = structuredClone(artifact);
    payloadChanged.requestId = 'weighted-finding-tendency-request.test.changed';
    expect(verifyWeightedFindingTendencyIntegrity(payloadChanged)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const contextChanged = makeRequest('weighted-context-changed');
    expect(
      verifyWeightedFindingTendencyContext({
        artifact,
        request: contextChanged,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('lets one pooled soft candidate outrank background while D-197 hard truth still prevails', () => {
    const request = makeRequest();
    const weighted = expectAggregated(request);
    const softCandidates = [...request.backgroundArtifact.candidates, ...weighted.candidates];
    const soft = compileSharedFindings(sharedFindingRequest(request, softCandidates));
    expect(soft.ok).toBe(true);
    if (!soft.ok) throw new Error(soft.error.message);
    expect(soft.value.findings[0]!.value).toEqual(weighted.candidates[0]!.proposedValue);
    expect(
      soft.value.candidateEvaluations.find(
        (evaluation) => evaluation.candidateId === weighted.candidates[0]!.id,
      )?.disposition,
    ).toBe('applied');

    const hardCandidates = [
      ...request.backgroundArtifact.candidates,
      ...weighted.candidates,
      ...makeConditionFindingArtifact().candidates,
    ];
    const hard = compileSharedFindings(sharedFindingRequest(request, hardCandidates));
    expect(hard.ok).toBe(true);
    if (!hard.ok) throw new Error(hard.error.message);
    expect(hard.value.findings[0]!.value).toEqual({
      kind: 'outcome',
      value: 'present',
    });
    expect(
      hard.value.candidateEvaluations.find(
        (evaluation) => evaluation.candidateId === weighted.candidates[0]!.id,
      )?.disposition,
    ).toMatch(/required_value_prevailed|compatible_not_decisive/);
  });
});
