import {
  BackgroundFindingOutcomeArtifactSchema,
  BackgroundFindingOutcomeRequestSchema,
  type BackgroundFindingOutcomeProfile,
  type BackgroundFindingOutcomeRequest,
  type ClinicalRuleReview,
  type ConditionFindingCardinalityProfile,
  type FindingDefinition,
  type PatientTemplate,
  type SharedFindingCompileRequest,
  type TemplateConditionSelectionProfile,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintBackgroundFindingHorizon,
  fingerprintBackgroundFindingOutcomeProfile,
  selectBackgroundFindingOutcomes,
  verifyBackgroundFindingOutcomeContext,
  verifyBackgroundFindingOutcomeIntegrity,
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

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T16:20:00.000Z',
  sourceUseNoteIds: ['source-use.test.background-findings'],
};

const makeDefinition = (id: string, label: string): FindingDefinition => ({
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

const fatigueDefinition = makeDefinition(
  'finding.history.test-background-fatigue',
  'Current fatigue',
);
const sleepDefinition = makeDefinition(
  'finding.history.test-background-sleep-change',
  'Current sleep change',
);

const makeConditionFindingArtifact = () => {
  const template: PatientTemplate = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-template.test.background-findings',
    compilationMode: 'attachment_only.v6',
    careSetting: 'outpatient_psychiatry',
    internalLabel: 'Synthetic background-finding fixture',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
    patientPool: 'starter',
    focusedDecisionId: 'decision.test.background-findings',
    primaryPolicyRef: {
      id: 'decision-policy.test.background-findings',
      contentVersion: '1.0.0',
    },
    decisionActionHorizonId: 'decision-action-horizon.test.background-findings',
    decisionActionHorizonFingerprint:
      'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
    diagnosisSelectionHorizonId: 'diagnosis-horizon.test.background-findings',
    diagnosisSelectionHorizonFingerprint:
      'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
    findingProjectionHorizonId: 'finding-projection-horizon.test.background-findings',
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
        id: 'location.test.background-findings',
        contentVersion: '1.0.0',
      },
    ],
    requiredConditions: [
      {
        schemaVersion: 1,
        id: 'template-condition.test.background-focus',
        diagnosisDefinitionId: 'diagnosis.test.background-focus',
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
      id: 'presentation-richness.test.background-findings',
      modelVersion: 'presentation-richness.v1',
      decisionDriverCategories: ['diagnostic_attribution'],
      priorEffortExpectation: { kind: 'not_required' },
    },
  };
  const conditionProfile: TemplateConditionSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'generation-profile.test.background-condition-selection',
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
    id: 'template-condition-request.test.background-findings',
    template,
    profile: conditionProfile,
    seed: 'background-root-condition-seed',
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
    id: 'condition-finding-profile.test.background-focus',
    modelVersion: 'condition-finding-cardinality.v1',
    conditionScope: {
      diagnosisDefinitionId: 'diagnosis.test.background-focus',
      diagnosisDefinitionContentVersion: '1.0.0',
      clinicalStateId: 'clinical-state.current',
      timeScopeId: 'time-scope.current',
      severity: { kind: 'any' },
      requiredSpecifierIds: [],
    },
    requiredOutcomes: [
      {
        schemaVersion: 1,
        id: 'condition-finding-required.test.background-fatigue',
        findingDefinitionId: fatigueDefinition.id,
        findingDefinitionContentVersion: fatigueDefinition.contentVersion,
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        developerOpinionIds: [],
        review: approvedReview,
      },
    ],
    cardinalityGroups: [
      {
        schemaVersion: 1,
        id: 'condition-finding-group.test.background-optional',
        minimumSelections: 0,
        maximumSelections: 1,
        countWeights: [
          {
            schemaVersion: 1,
            selectionCount: 0,
            gameSelectionWeight: 1,
          },
        ],
        members: [
          {
            schemaVersion: 1,
            id: 'condition-finding-member.test.background-sleep',
            findingDefinitionId: sleepDefinition.id,
            findingDefinitionContentVersion: sleepDefinition.contentVersion,
            proposedValue: { kind: 'outcome', value: 'present' },
            uncertainty: 'none',
            gameSelectionWeight: 1,
            developerOpinionIds: [],
            review: approvedReview,
          },
        ],
        developerOpinionIds: [],
        review: approvedReview,
      },
    ],
  };
  const conditionState = selectedConditions.value.conditionStates[0]!;
  const conditionFinding = selectConditionFindingCardinalityCandidates({
    schemaVersion: 1,
    id: 'condition-finding-request.test.background',
    conditionSource: {
      schemaVersion: 1,
      sourceKind: 'template_condition_selection',
      artifact: selectedConditions.value,
    },
    profiles: [findingProfile],
    conditionProfileBindings: [
      {
        schemaVersion: 1,
        id: 'condition-finding-binding.test.background-focus',
        conditionStateId: conditionState.id,
        profileRef: {
          id: findingProfile.id,
          contentVersion: findingProfile.contentVersion,
        },
        profileFingerprint: fingerprintConditionFindingCardinalityProfile(findingProfile),
      },
    ],
    findingDefinitions: [fatigueDefinition, sleepDefinition],
    seed: 'background-condition-finding-seed',
  });
  if (!conditionFinding.ok) throw new Error(conditionFinding.error.message);
  return conditionFinding.value;
};

const profileFor = (definition: FindingDefinition): BackgroundFindingOutcomeProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `background-finding-profile.test.${definition.id.split('.').at(-1)}`,
  modelVersion: 'weighted-background-finding.v1',
  findingDefinitionId: definition.id,
  findingDefinitionContentVersion: definition.contentVersion,
  outcomes: [
    {
      schemaVersion: 1,
      id: `background-finding-outcome.test.${definition.id.split('.').at(-1)}.absent`,
      proposedValue: { kind: 'outcome', value: 'absent' },
      uncertainty: 'none',
      gameGenerationWeight: 3,
    },
    {
      schemaVersion: 1,
      id: `background-finding-outcome.test.${definition.id.split('.').at(-1)}.present`,
      proposedValue: { kind: 'outcome', value: 'present' },
      uncertainty: 'none',
      gameGenerationWeight: 1,
    },
  ],
  developerOpinionIds: [],
  review: { ...approvedReview, sourceUseNoteIds: [...approvedReview.sourceUseNoteIds] },
});

const makeRequest = (seed = 'background-finding-seed-42'): BackgroundFindingOutcomeRequest => {
  const definitions = [fatigueDefinition, sleepDefinition];
  const profiles = definitions.map(profileFor);
  const horizon = {
    schemaVersion: 1 as const,
    id: 'background-finding-horizon.test.synthetic',
    targets: definitions.map((definition) => ({
      schemaVersion: 1 as const,
      id: `background-finding-target.test.${definition.id.split('.').at(-1)}`,
      findingDefinitionId: definition.id,
      findingDefinitionContentVersion: definition.contentVersion,
    })),
  };
  return {
    schemaVersion: 1,
    id: 'background-finding-request.test.synthetic',
    conditionFindingArtifact: makeConditionFindingArtifact(),
    horizon,
    profiles,
    profileBindings: profiles.map((profile, index) => ({
      schemaVersion: 1,
      id: `background-finding-binding.test.${index + 1}`,
      horizonTargetId: horizon.targets[index]!.id,
      profileRef: {
        id: profile.id,
        contentVersion: profile.contentVersion,
      },
      profileFingerprint: fingerprintBackgroundFindingOutcomeProfile(profile),
    })),
    findingDefinitions: definitions,
    seed,
  };
};

const expectSelected = (request: unknown) => {
  const result = selectBackgroundFindingOutcomes(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const sharedFindingRequest = (
  request: BackgroundFindingOutcomeRequest,
  candidates = expectSelected(request).candidates,
): SharedFindingCompileRequest => {
  const candidateDefinitionIds = new Set(
    candidates.map((candidate) => candidate.findingDefinitionId),
  );
  return {
    schemaVersion: 1,
    id: 'shared-finding-request.test.background',
    patientStateId: 'resolved-patient-state.test.background',
    seed: request.seed,
    findingDefinitions: request.findingDefinitions.filter((definition) =>
      candidateDefinitionIds.has(definition.id),
    ),
    candidates,
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.background',
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
      id: 'finding-projection-horizon.test.background',
      targets: [],
    },
  };
};

describe('background finding outcome selector', () => {
  it('strictly parses, is deterministic and order-invariant, and does not mutate input', () => {
    const request = makeRequest();
    expect(BackgroundFindingOutcomeRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectSelected(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(BackgroundFindingOutcomeArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(verifyBackgroundFindingOutcomeIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const reordered = structuredClone(request);
    reordered.horizon.targets.reverse();
    reordered.profiles.reverse();
    reordered.profileBindings.reverse();
    reordered.findingDefinitions.reverse();
    for (const profile of reordered.profiles) {
      profile.outcomes.reverse();
      profile.review.sourceUseNoteIds.reverse();
    }
    expect(expectSelected(reordered)).toEqual(artifact);
  });

  it('varies by seed only among the explicitly weighted lawful outcomes', () => {
    const signatures = new Set<string>();
    for (let index = 0; index < 80; index += 1) {
      const request = makeRequest(`background-seed-${index}`);
      const artifact = expectSelected(request);
      signatures.add(
        artifact.selections
          .map(
            (selection) =>
              selection.outcomeEvaluations.find((outcome) => outcome.selected)!.proposedValue.value,
          )
          .join('|'),
      );
      for (const selection of artifact.selections) {
        expect(selection.outcomeEvaluations).toHaveLength(2);
        expect(selection.outcomeEvaluations.filter((outcome) => outcome.selected)).toHaveLength(1);
        expect(
          selection.outcomeEvaluations.every((outcome) =>
            ['present', 'absent'].includes(outcome.proposedValue.value),
          ),
        ).toBe(true);
      }
    }
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('retains every offered outcome, exact draw, review, provenance, and profile pin', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);
    expect(artifact.horizonRef).toEqual({
      id: request.horizon.id,
      fingerprint: fingerprintBackgroundFindingHorizon(request.horizon),
    });
    expect(artifact.selections).toHaveLength(request.horizon.targets.length);
    for (const selection of artifact.selections) {
      expect(selection.outcomeEvaluations).toHaveLength(2);
      const selected = selection.outcomeEvaluations.find((outcome) => outcome.selected)!;
      const candidate = artifact.candidates.find((entry) => entry.id === selected.candidateId)!;
      expect(candidate.kind).toBe('background_variation');
      expect(candidate.contributions.map((contribution) => contribution.ownerKind)).toEqual([
        'catalog_definition',
        'generation_profile',
      ]);
      expect(candidate.contributions[1]!.provenanceIds).toEqual(approvedReview.sourceUseNoteIds);
      expect(candidate.review.status).toBe('approved');
    }
  });

  it('rejects stale, missing, duplicate, unreviewed, and invalid profile content', () => {
    const stale = makeRequest();
    stale.profileBindings[0]!.profileFingerprint =
      'fingerprint.background-finding.profile.fnv1a64.0000000000000000';
    expect(selectBackgroundFindingOutcomes(stale)).toMatchObject({
      ok: false,
      error: { code: 'STALE_PROFILE_FINGERPRINT' },
    });

    const missing = makeRequest();
    missing.profileBindings.pop();
    expect(BackgroundFindingOutcomeRequestSchema.safeParse(missing).success).toBe(false);

    const duplicate = makeRequest();
    duplicate.findingDefinitions.push({
      ...structuredClone(duplicate.findingDefinitions[0]!),
      contentVersion: '2.0.0',
    });
    expect(BackgroundFindingOutcomeRequestSchema.safeParse(duplicate).success).toBe(false);

    const upstreamVersionMismatch = makeRequest();
    const sleepTarget = upstreamVersionMismatch.horizon.targets.find(
      (target) => target.findingDefinitionId === sleepDefinition.id,
    )!;
    const sleepProfile = upstreamVersionMismatch.profiles.find(
      (profile) => profile.findingDefinitionId === sleepDefinition.id,
    )!;
    const sleepBinding = upstreamVersionMismatch.profileBindings.find(
      (binding) => binding.profileRef.id === sleepProfile.id,
    )!;
    const sleepDefinitionV2 = upstreamVersionMismatch.findingDefinitions.find(
      (definition) => definition.id === sleepDefinition.id,
    )!;
    sleepTarget.findingDefinitionContentVersion = '2.0.0';
    sleepProfile.findingDefinitionContentVersion = '2.0.0';
    sleepDefinitionV2.contentVersion = '2.0.0';
    sleepBinding.profileFingerprint = fingerprintBackgroundFindingOutcomeProfile(sleepProfile);
    expect(BackgroundFindingOutcomeRequestSchema.safeParse(upstreamVersionMismatch).success).toBe(
      false,
    );

    const unreviewed = makeRequest();
    unreviewed.profiles[0]!.review = {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    expect(BackgroundFindingOutcomeRequestSchema.safeParse(unreviewed).success).toBe(false);

    const invalid = makeRequest();
    invalid.profiles[0]!.outcomes[0]!.proposedValue = {
      kind: 'outcome',
      value: 'high',
    };
    invalid.profileBindings[0]!.profileFingerprint = fingerprintBackgroundFindingOutcomeProfile(
      invalid.profiles[0]!,
    );
    expect(selectBackgroundFindingOutcomes(invalid)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_FINDING_VALUE' },
    });

    const upstreamChanged = makeRequest();
    upstreamChanged.conditionFindingArtifact.requestId = 'condition-finding-request.test.tampered';
    expect(selectBackgroundFindingOutcomes(upstreamChanged)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_CONDITION_FINDING_ARTIFACT' },
    });
  });

  it('rejects draw, candidate, graph, payload, and exact-context tampering', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);

    const drawChanged = structuredClone(artifact);
    drawChanged.selections[0]!.stableDrawId =
      'stable-draw.background-finding.outcome.0000000000000000';
    expect(verifyBackgroundFindingOutcomeIntegrity(drawChanged)).toMatchObject({
      ok: false,
      error: { code: 'DRAW_CONTEXT_MISMATCH' },
    });

    const selectedOutcomeChanged = structuredClone(artifact);
    const selection = selectedOutcomeChanged.selections[0]!;
    const originallySelected = selection.outcomeEvaluations.find((outcome) => outcome.selected)!;
    const originallyUnselected = selection.outcomeEvaluations.find((outcome) => !outcome.selected)!;
    originallyUnselected.selected = true;
    originallyUnselected.candidateId = originallySelected.candidateId;
    originallySelected.selected = false;
    originallySelected.candidateId = null;
    expect(verifyBackgroundFindingOutcomeIntegrity(selectedOutcomeChanged)).toMatchObject({
      ok: false,
      error: { code: 'DRAW_CONTEXT_MISMATCH' },
    });

    const profilePayloadChanged = structuredClone(artifact);
    for (const outcome of profilePayloadChanged.selections[0]!.outcomeEvaluations) {
      outcome.gameGenerationWeight *= 2;
    }
    expect(verifyBackgroundFindingOutcomeIntegrity(profilePayloadChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROVENANCE_MISMATCH' },
    });

    const candidateChanged = structuredClone(artifact);
    candidateChanged.candidates[0]!.kind = 'weighted_tendency';
    expect(verifyBackgroundFindingOutcomeIntegrity(candidateChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROVENANCE_MISMATCH' },
    });

    const graphChanged = structuredClone(artifact);
    graphChanged.profileReferences[0]!.id = 'background-finding-profile.test.unrelated';
    expect(BackgroundFindingOutcomeArtifactSchema.safeParse(graphChanged).success).toBe(false);

    const payloadChanged = structuredClone(artifact);
    payloadChanged.requestId = 'background-finding-request.test.changed';
    expect(verifyBackgroundFindingOutcomeIntegrity(payloadChanged)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const contextChanged = structuredClone(request);
    contextChanged.seed = 'background-finding-context-changed';
    expect(
      verifyBackgroundFindingOutcomeContext({
        artifact,
        request: contextChanged,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('lets D-197 hard findings prevail while retaining the background trace in D-193', () => {
    const request = makeRequest();
    for (const profile of request.profiles) {
      profile.outcomes = [
        profile.outcomes.find((outcome) => outcome.proposedValue.value === 'absent')!,
      ];
      const binding = request.profileBindings.find((entry) => entry.profileRef.id === profile.id)!;
      binding.profileFingerprint = fingerprintBackgroundFindingOutcomeProfile(profile);
    }
    const background = expectSelected(request);
    const candidates = [...request.conditionFindingArtifact.candidates, ...background.candidates];
    const result = compileSharedFindings(sharedFindingRequest(request, candidates));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    expect(
      result.value.findings.find((finding) => finding.definitionId === fatigueDefinition.id)?.value,
    ).toEqual({ kind: 'outcome', value: 'present' });
    expect(
      result.value.findings.find((finding) => finding.definitionId === sleepDefinition.id)?.value,
    ).toEqual({ kind: 'outcome', value: 'absent' });
    expect(
      result.value.candidateEvaluations.find(
        (evaluation) =>
          evaluation.findingDefinitionId === fatigueDefinition.id &&
          evaluation.kind === 'background_variation',
      )?.disposition,
    ).toBe('required_value_prevailed');
  });

  it('fills an otherwise uncovered finding with one background candidate', () => {
    const request = makeRequest();
    const background = expectSelected(request);
    const sleepCandidate = background.candidates.find(
      (candidate) => candidate.findingDefinitionId === sleepDefinition.id,
    )!;
    const result = compileSharedFindings(sharedFindingRequest(request, [sleepCandidate]));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.findings).toHaveLength(1);
    expect(result.value.findings[0]!.value).toEqual(sleepCandidate.proposedValue);
  });

  it('contains no probability, point, inference, runtime, or real clinical-content fields', () => {
    const serialized = JSON.stringify(expectSelected(makeRequest()));
    for (const forbidden of [
      '"probability"',
      '"prevalence"',
      '"points"',
      '"score"',
      '"diagnosisInference"',
      '"demographic"',
      '"medication"',
      '"queue"',
      '"save"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
