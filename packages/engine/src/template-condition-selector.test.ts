import {
  TemplateConditionSelectionArtifactSchema,
  TemplateConditionSelectionRequestSchema,
  type ClinicalRuleReview,
  type PatientTemplate,
  type PatientTemplateConditionConstraint,
  type TemplateConditionSelectionProfile,
  type TemplateConditionSelectionRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintTemplateConditionSelectionTemplate,
  selectTemplateConditions,
  verifyTemplateConditionSelectionContext,
  verifyTemplateConditionSelectionIntegrity,
} from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T15:10:00.000Z',
  sourceUseNoteIds: ['source-use.test.one', 'source-use.test.two'],
};

const constraint = (
  id: string,
  diagnosisDefinitionId: string,
  encounterRelevance: 'focus' | 'contributing' | 'background',
): PatientTemplateConditionConstraint => ({
  schemaVersion: 1,
  id,
  diagnosisDefinitionId,
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current',
  timeScopeId: 'time-scope.current',
  encounterRelevance,
  severityId: null,
  specifierIds: ['specifier.test.two', 'specifier.test.one'],
});

const makeTemplate = (): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.condition-selector',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic condition-selector fixture',
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
    constraint('template-condition.test.focus', 'diagnosis.test.focus', 'focus'),
  ],
  optionalConditionSelectionGroups: [
    {
      schemaVersion: 1,
      id: 'template-condition-group.test.comorbid',
      minimumSelections: 1,
      maximumSelections: 2,
      candidates: [
        constraint(
          'template-condition.test.comorbid-a',
          'diagnosis.test.comorbid-a',
          'contributing',
        ),
        constraint(
          'template-condition.test.comorbid-b',
          'diagnosis.test.comorbid-b',
          'contributing',
        ),
        constraint(
          'template-condition.test.comorbid-c',
          'diagnosis.test.comorbid-c',
          'contributing',
        ),
      ],
    },
    {
      schemaVersion: 1,
      id: 'template-condition-group.test.background',
      minimumSelections: 0,
      maximumSelections: 1,
      candidates: [
        constraint(
          'template-condition.test.background-a',
          'diagnosis.test.background-a',
          'background',
        ),
        constraint(
          'template-condition.test.background-b',
          'diagnosis.test.background-b',
          'background',
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
    id: 'presentation-richness.test.condition-selector',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['comorbidity_fit', 'diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeProfile = (template: PatientTemplate): TemplateConditionSelectionProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'generation-profile.test.template-conditions',
  modelVersion: 'weighted-template-condition-selection.v1',
  templateRef: {
    id: template.id,
    contentVersion: template.contentVersion,
  },
  templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
  groupProfiles: [
    {
      schemaVersion: 1,
      id: 'generation-profile-group.test.comorbid',
      groupId: 'template-condition-group.test.comorbid',
      countWeights: [
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 3 },
        { schemaVersion: 1, selectionCount: 2, gameSelectionWeight: 1 },
      ],
      candidateWeights: [
        {
          schemaVersion: 1,
          templateConditionId: 'template-condition.test.comorbid-a',
          gameSelectionWeight: 6,
        },
        {
          schemaVersion: 1,
          templateConditionId: 'template-condition.test.comorbid-b',
          gameSelectionWeight: 3,
        },
        {
          schemaVersion: 1,
          templateConditionId: 'template-condition.test.comorbid-c',
          gameSelectionWeight: 1,
        },
      ],
    },
    {
      schemaVersion: 1,
      id: 'generation-profile-group.test.background',
      groupId: 'template-condition-group.test.background',
      countWeights: [
        { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 1 },
      ],
      candidateWeights: [
        {
          schemaVersion: 1,
          templateConditionId: 'template-condition.test.background-a',
          gameSelectionWeight: 4,
        },
        {
          schemaVersion: 1,
          templateConditionId: 'template-condition.test.background-b',
          gameSelectionWeight: 1,
        },
      ],
    },
  ],
  incompatibilities: [],
});

const makeRequest = (seed = 'template-condition-seed-42'): TemplateConditionSelectionRequest => {
  const template = makeTemplate();
  return {
    schemaVersion: 1,
    id: 'template-condition-selection-request.test.synthetic',
    template,
    profile: makeProfile(template),
    seed,
  };
};

const expectSelected = (request: unknown) => {
  const result = selectTemplateConditions(request);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('error' in result ? result.error.message : result.conflict.code);
  }
  return result.value;
};

const expectConflict = (request: unknown) => {
  const result = selectTemplateConditions(request);
  expect(result.ok).toBe(false);
  if (result.ok || 'error' in result) {
    throw new Error(result.ok ? 'Expected conflict' : result.error.message);
  }
  return result.conflict;
};

describe('template condition selector', () => {
  it('is deterministic, order-invariant, and leaves its input unchanged', () => {
    const request = makeRequest();
    const before = JSON.stringify(request);
    const first = expectSelected(request);
    expect(JSON.stringify(request)).toBe(before);

    const reordered = structuredClone(request);
    reordered.template.review.sourceUseNoteIds.reverse();
    reordered.template.requiredConditions.reverse();
    reordered.template.optionalConditionSelectionGroups.reverse();
    for (const group of reordered.template.optionalConditionSelectionGroups) {
      group.candidates.reverse();
      for (const candidate of group.candidates) candidate.specifierIds.reverse();
    }
    reordered.template.presentationRichnessEnvelope.decisionDriverCategories.reverse();
    reordered.profile.groupProfiles.reverse();
    for (const group of reordered.profile.groupProfiles) {
      group.countWeights.reverse();
      group.candidateWeights.reverse();
    }
    expect(expectSelected(reordered)).toEqual(first);
  });

  it('varies only within exact authored counts and candidates across seeds', () => {
    const request = makeRequest();
    const signatures = new Set<string>();
    for (let index = 0; index < 80; index += 1) {
      request.seed = `template-condition-seed-${index}`;
      const artifact = expectSelected(request);
      signatures.add(
        artifact.groupSelections
          .map(
            (group) =>
              `${group.groupId}:${group.selectionDraws
                .map((draw) => draw.selectedTemplateConditionId)
                .join(',')}`,
          )
          .join('|'),
      );
      for (const groupSelection of artifact.groupSelections) {
        const group = request.template.optionalConditionSelectionGroups.find(
          (candidate) => candidate.id === groupSelection.groupId,
        )!;
        const groupProfile = request.profile.groupProfiles.find(
          (candidate) => candidate.groupId === groupSelection.groupId,
        )!;
        expect(groupSelection.selectedCount).toBeGreaterThanOrEqual(group.minimumSelections);
        expect(groupSelection.selectedCount).toBeLessThanOrEqual(group.maximumSelections);
        expect(groupProfile.countWeights.map((weight) => weight.selectionCount)).toContain(
          groupSelection.selectedCount,
        );
        expect(
          new Set(groupSelection.selectionDraws.map((draw) => draw.selectedTemplateConditionId))
            .size,
        ).toBe(groupSelection.selectedCount);
      }
    }
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('preserves exact count/candidate weights, draws, bindings, and provenance', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);
    expect(TemplateConditionSelectionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(verifyTemplateConditionSelectionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const requiredBinding = artifact.conditionBindings.find(
      (binding) => binding.kind === 'required',
    )!;
    const requiredState = artifact.conditionStates.find(
      (state) => state.id === requiredBinding.conditionStateId,
    )!;
    expect(requiredState).toMatchObject({
      origin: 'authored',
      resolution: {
        origin: 'authored',
        ownerId: request.template.id,
        ownerContentVersion: request.template.contentVersion,
      },
    });

    for (const groupSelection of artifact.groupSelections) {
      const groupProfile = request.profile.groupProfiles.find(
        (candidate) => candidate.groupId === groupSelection.groupId,
      )!;
      expect(groupSelection.selectedCountGameWeight).toBe(
        groupProfile.countWeights.find(
          (entry) => entry.selectionCount === groupSelection.selectedCount,
        )!.gameSelectionWeight,
      );
      const selectedTrace = new Map(
        groupSelection.selectionDraws.map((draw) => [draw.selectedTemplateConditionId, draw]),
      );
      for (const candidate of groupSelection.candidateEvaluations) {
        expect(candidate.gameSelectionWeight).toBe(
          groupProfile.candidateWeights.find(
            (entry) => entry.templateConditionId === candidate.templateConditionId,
          )!.gameSelectionWeight,
        );
        expect(candidate.selected).toBe(selectedTrace.has(candidate.templateConditionId));
        if (candidate.selected) {
          const draw = selectedTrace.get(candidate.templateConditionId)!;
          expect(candidate.selectionOrdinal).toBe(draw.selectionOrdinal);
          expect(candidate.stableDrawId).toBe(draw.stableDrawId);
        }
      }
    }

    const optionalBindings = artifact.conditionBindings.filter(
      (binding) => binding.kind === 'optional_group',
    );
    const selectedTemplateConditionIds = artifact.groupSelections.flatMap((group) =>
      group.selectionDraws.map((draw) => draw.selectedTemplateConditionId),
    );
    expect(optionalBindings.map((binding) => binding.templateConditionId).sort()).toEqual(
      selectedTemplateConditionIds.sort(),
    );
    for (const binding of optionalBindings) {
      const state = artifact.conditionStates.find(
        (candidate) => candidate.id === binding.conditionStateId,
      )!;
      const draw = artifact.groupSelections
        .flatMap((group) => group.selectionDraws)
        .find(
          (candidate) => candidate.selectedTemplateConditionId === binding.templateConditionId,
        )!;
      expect(state).toMatchObject({
        origin: 'generated_optional',
        resolution: {
          origin: 'deterministic_generation',
          generationProfileId: request.profile.id,
          generationProfileContentVersion: request.profile.contentVersion,
          resolverVersion: '1.0.0',
          stableDrawId: draw.stableDrawId,
        },
      });
    }
  });

  it('returns a full reproducible conflict only for an explicitly approved selected pair', () => {
    const request = makeRequest('template-condition-conflict-seed');
    const comorbidGroup = request.template.optionalConditionSelectionGroups.find(
      (group) => group.id === 'template-condition-group.test.comorbid',
    )!;
    comorbidGroup.maximumSelections = 3;
    const comorbidProfile = request.profile.groupProfiles.find(
      (group) => group.groupId === comorbidGroup.id,
    )!;
    comorbidProfile.countWeights = [
      { schemaVersion: 1, selectionCount: 3, gameSelectionWeight: 1 },
    ];
    request.profile.templateFingerprint = fingerprintTemplateConditionSelectionTemplate(
      request.template,
    );
    request.profile.incompatibilities = [
      {
        schemaVersion: 1,
        id: 'condition-incompatibility.test.focus-comorbid-a',
        leftTemplateConditionId: 'template-condition.test.comorbid-a',
        rightTemplateConditionId: 'template-condition.test.focus',
        reason: 'Synthetic literal incompatibility used only for selector testing.',
        review: approvedReview,
      },
    ];

    const first = expectConflict(request);
    expect(first).toMatchObject({
      code: 'LITERAL_CONDITION_INCOMPATIBILITY',
      disposition: 'retry_or_quarantine',
      artifact: {
        status: 'literal_condition_incompatibility',
        conflicts: [
          {
            incompatibilityId: 'condition-incompatibility.test.focus-comorbid-a',
          },
        ],
      },
    });
    expect(expectConflict(request)).toEqual(first);
    expect(verifyTemplateConditionSelectionIntegrity(first.artifact).ok).toBe(true);
  });

  it('does not activate an incompatibility whose optional endpoint is unselected', () => {
    const request = makeRequest('template-condition-unselected-seed');
    const backgroundGroup = request.template.optionalConditionSelectionGroups.find(
      (group) => group.id === 'template-condition-group.test.background',
    )!;
    backgroundGroup.minimumSelections = 0;
    const backgroundProfile = request.profile.groupProfiles.find(
      (group) => group.groupId === backgroundGroup.id,
    )!;
    backgroundProfile.countWeights = [
      { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
    ];
    request.profile.incompatibilities = [
      {
        schemaVersion: 1,
        id: 'condition-incompatibility.test.focus-background-a',
        leftTemplateConditionId: 'template-condition.test.background-a',
        rightTemplateConditionId: 'template-condition.test.focus',
        reason: 'Synthetic unselected-pair test.',
        review: approvedReview,
      },
    ];

    const artifact = expectSelected(request);
    expect(
      artifact.groupSelections.find((group) => group.groupId === backgroundGroup.id),
    ).toMatchObject({
      selectedCount: 0,
      selectionDraws: [],
      candidateEvaluations: [
        expect.objectContaining({ selected: false }),
        expect.objectContaining({ selected: false }),
      ],
    });
    expect(artifact.conflicts).toEqual([]);
  });

  it('rejects stale, incomplete, impossible, and unreviewed profiles', () => {
    const staleTemplate = makeRequest();
    staleTemplate.profile.templateFingerprint =
      'fingerprint.template-condition-selector.template.fnv1a64.0000000000000000';
    expect(selectTemplateConditions(staleTemplate)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const missingGroup = makeRequest();
    missingGroup.profile.groupProfiles.pop();
    expect(TemplateConditionSelectionRequestSchema.safeParse(missingGroup).success).toBe(false);

    const missingCandidate = makeRequest();
    missingCandidate.profile.groupProfiles[0]!.candidateWeights.pop();
    expect(TemplateConditionSelectionRequestSchema.safeParse(missingCandidate).success).toBe(false);

    const outOfBoundsCount = makeRequest();
    outOfBoundsCount.profile.groupProfiles[0]!.countWeights = [
      { schemaVersion: 1, selectionCount: 3, gameSelectionWeight: 1 },
    ];
    expect(TemplateConditionSelectionRequestSchema.safeParse(outOfBoundsCount).success).toBe(false);

    const requiredPair = makeRequest();
    requiredPair.template.requiredConditions.push(
      constraint(
        'template-condition.test.required-two',
        'diagnosis.test.required-two',
        'contributing',
      ),
    );
    requiredPair.profile.templateFingerprint = fingerprintTemplateConditionSelectionTemplate(
      requiredPair.template,
    );
    requiredPair.profile.incompatibilities = [
      {
        schemaVersion: 1,
        id: 'condition-incompatibility.test.required-pair',
        leftTemplateConditionId: 'template-condition.test.focus',
        rightTemplateConditionId: 'template-condition.test.required-two',
        reason: 'Synthetic impossible required pair.',
        review: approvedReview,
      },
    ];
    expect(TemplateConditionSelectionRequestSchema.safeParse(requiredPair).success).toBe(false);

    const unreviewed = makeRequest();
    unreviewed.profile.incompatibilities = [
      {
        schemaVersion: 1,
        id: 'condition-incompatibility.test.unreviewed',
        leftTemplateConditionId: 'template-condition.test.comorbid-a',
        rightTemplateConditionId: 'template-condition.test.focus',
        reason: 'Synthetic unreviewed pair.',
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      },
    ];
    expect(TemplateConditionSelectionRequestSchema.safeParse(unreviewed).success).toBe(false);
  });

  it('rejects schema-valid draw, provenance, payload, and context tampering', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);

    const resolverChanged = structuredClone(artifact);
    resolverChanged.resolverVersion = '9.0.0';
    expect(verifyTemplateConditionSelectionIntegrity(resolverChanged)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_RESOLVER_VERSION' },
    });

    const drawChanged = structuredClone(artifact);
    drawChanged.groupSelections[0]!.countStableDrawId =
      'stable-draw.template-condition.count.0000000000000000';
    expect(verifyTemplateConditionSelectionIntegrity(drawChanged)).toMatchObject({
      ok: false,
      error: { code: 'DRAW_CONTEXT_MISMATCH' },
    });

    const optionalBinding = artifact.conditionBindings.find(
      (binding) => binding.kind === 'optional_group',
    )!;
    const bindingGroupChanged = structuredClone(artifact);
    const changedBinding = bindingGroupChanged.conditionBindings.find(
      (binding) => binding.id === optionalBinding.id,
    )!;
    if (changedBinding.kind === 'optional_group') {
      changedBinding.groupId = 'template-condition-group.test.changed';
    }
    expect(verifyTemplateConditionSelectionIntegrity(bindingGroupChanged)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });

    const provenanceChanged = structuredClone(artifact);
    const optionalState = provenanceChanged.conditionStates.find(
      (state) => state.id === optionalBinding.conditionStateId,
    )!;
    if (optionalState.resolution.origin === 'deterministic_generation') {
      optionalState.resolution.generationProfileId = 'generation-profile.test.changed';
    }
    expect(verifyTemplateConditionSelectionIntegrity(provenanceChanged)).toMatchObject({
      ok: false,
      error: { code: 'PROVENANCE_MISMATCH' },
    });

    const payloadChanged = structuredClone(artifact);
    payloadChanged.requestId = 'template-condition-selection-request.test.changed';
    expect(verifyTemplateConditionSelectionIntegrity(payloadChanged)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const changedRequest = structuredClone(request);
    changedRequest.seed = 'template-condition-seed-changed';
    expect(
      verifyTemplateConditionSelectionContext({
        artifact,
        request: changedRequest,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });

  it('does not infer diagnoses or expose points, clinical probabilities, or runtime state', () => {
    const request = makeRequest();
    const artifact = expectSelected(request);
    const allowableConditionIds = new Set([
      ...request.template.requiredConditions.map((condition) => condition.id),
      ...request.template.optionalConditionSelectionGroups.flatMap((group) =>
        group.candidates.map((condition) => condition.id),
      ),
    ]);
    expect(
      artifact.conditionBindings.every((binding) =>
        allowableConditionIds.has(binding.templateConditionId),
      ),
    ).toBe(true);

    const serialized = JSON.stringify(artifact);
    for (const forbidden of [
      '"points"',
      '"score"',
      '"clinicalProbability"',
      '"prevalence"',
      '"diagnosisInference"',
      '"finding"',
      '"payout"',
      '"difficultyTier"',
      '"queue"',
      '"save"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
