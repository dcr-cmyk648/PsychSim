import {
  OptionalFindingTextureBridgeArtifactSchema,
  OptionalFindingTextureBridgeRequestSchema,
  type ClinicalRuleReview,
  type FindingDefinition,
  type FindingResolutionCandidate,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type OptionalFindingTextureBridgeProfile,
  type OptionalFindingTextureBridgeRequest,
  type PatientOptionalFeatureModuleDefinition,
  type PatientTemplate,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  bridgeOptionalFindingTextureFromBudget,
  fingerprintOptionalFindingTextureBridgeProfile,
  fingerprintOptionalFindingTextureReferenceHorizon,
  verifyOptionalFindingTextureBridgeContext,
  verifyOptionalFindingTextureBridgeIntegrity,
} from './optional-finding-texture-bridge';
import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import { compileSharedFindings } from './shared-finding-compiler';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-31T14:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.optional-finding-texture'],
};

const findingDefinition: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test-optional-texture',
  label: 'Synthetic optional texture',
  aliases: ['Synthetic texture complaint'],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
};

const makeTemplate = (): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.optional-finding-texture',
  compilationMode: 'attachment_only.v6',
  careSetting: 'outpatient_psychiatry',
  internalLabel: 'Synthetic optional finding-texture fixture',
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
    {
      schemaVersion: 1,
      id: 'template-condition.test.focus',
      diagnosisDefinitionId: 'diagnosis.test.focus',
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
    additionalFeatureBudget: 1,
    maximumSelectedModules: 1,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.optional-finding-texture',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const moduleDefinition = (): PatientOptionalFeatureModuleDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'optional-feature.test.finding-texture',
  label: 'Synthetic subthreshold texture',
  moduleKind: 'finding_texture',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
});

const makeOptionalRequest = (seed: string): OptionalFeatureBudgetSelectionRequest => {
  const template = makeTemplate();
  const definition = moduleDefinition();
  return {
    schemaVersion: 1,
    id: 'optional-feature-budget-request.test.finding-texture',
    template,
    moduleDefinitions: [definition],
    profile: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.finding-texture',
      modelVersion: 'weighted-optional-feature-budget-selection.v1',
      templateRef: {
        id: template.id,
        contentVersion: template.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(template),
      countWeights: [
        { schemaVersion: 1, selectionCount: 0, gameSelectionWeight: 1 },
        { schemaVersion: 1, selectionCount: 1, gameSelectionWeight: 1 },
      ],
      candidateBindings: [
        {
          schemaVersion: 1,
          id: 'optional-feature-binding.test.finding-texture',
          moduleRef: {
            id: definition.id,
            contentVersion: definition.contentVersion,
          },
          moduleFingerprint: fingerprintOptionalFeatureModuleDefinition(definition),
          selectedModuleId: 'patient-optional-feature.test.finding-texture',
          cost: 1,
          impact: 'background',
          complexityContributions: [
            {
              id: 'complexity-contribution.test.finding-texture',
              label: 'Synthetic optional symptom texture',
              dimension: 'diagnostic',
              weight: 1,
              review: approvedReview,
            },
          ],
          gameSelectionWeight: 1,
          review: approvedReview,
        },
      ],
      incompatibilities: [],
      review: approvedReview,
    },
    seed,
  };
};

const findOptionalArtifact = (selected: boolean): OptionalFeatureBudgetSelectionArtifact => {
  for (let index = 0; index < 2_000; index += 1) {
    const result = selectOptionalFeaturesWithinBudget(
      makeOptionalRequest(`seed.optional-finding-texture.${selected}.${index}`),
    );
    if (result.ok && (result.value.selectedCount === 1) === selected) return result.value;
  }
  throw new Error(`Could not find a deterministic optional-texture seed (${selected}).`);
};

const makeBridgeRequest = (
  optionalFeatureArtifact: OptionalFeatureBudgetSelectionArtifact,
): OptionalFindingTextureBridgeRequest => {
  const referenceHorizon = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'finding-texture-horizon.test.synthetic',
    findingDefinitionRefs: [
      {
        id: findingDefinition.id,
        contentVersion: findingDefinition.contentVersion,
      },
    ],
  };
  const binding = optionalFeatureArtifact.selectionRequest.profile.candidateBindings[0]!;
  const profileWithoutFingerprint = {
    schemaVersion: 1 as const,
    contentVersion: '1.0.0',
    id: 'finding-texture-profile.test.synthetic',
    modelVersion: 'selected-optional-finding-texture.v1' as const,
    templateRef: optionalFeatureArtifact.templateRef,
    templateFingerprint: optionalFeatureArtifact.templateFingerprint,
    optionalFeatureProfileRef: optionalFeatureArtifact.profileRef,
    optionalFeatureProfileFingerprint: optionalFeatureArtifact.profileFingerprint,
    referenceHorizonRef: {
      id: referenceHorizon.id,
      contentVersion: referenceHorizon.contentVersion,
    },
    referenceHorizonFingerprint:
      'fingerprint.optional-finding-texture-bridge.reference-horizon.fnv1a64.0000000000000000',
    mappings: [
      {
        schemaVersion: 1 as const,
        id: 'finding-texture-mapping.test.synthetic',
        moduleRef: binding.moduleRef,
        moduleFingerprint: binding.moduleFingerprint,
        optionalFeatureBindingId: binding.id,
        selectedModuleId: binding.selectedModuleId,
        outcomes: [
          {
            schemaVersion: 1 as const,
            id: 'finding-texture-outcome.test.subthreshold',
            findingDefinitionId: findingDefinition.id,
            findingDefinitionContentVersion: findingDefinition.contentVersion,
            proposedValue: { kind: 'outcome' as const, value: 'subthreshold' as const },
            uncertainty: 'none' as const,
            developerOpinionIds: ['developer-opinion.test.optional-finding-texture'],
            review: approvedReview,
          },
        ],
      },
    ],
    review: approvedReview,
  };
  const bridgeProfile: OptionalFindingTextureBridgeProfile = {
    ...profileWithoutFingerprint,
    referenceHorizonFingerprint:
      fingerprintOptionalFindingTextureReferenceHorizon(referenceHorizon),
  };
  return {
    schemaVersion: 1,
    id: 'optional-finding-texture-bridge-request.test.synthetic',
    optionalFeatureArtifact,
    referenceHorizon,
    findingDefinitions: [findingDefinition],
    bridgeProfile,
  };
};

const expectBridge = (request: unknown) => {
  const result = bridgeOptionalFindingTextureFromBudget(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const hardCandidate = (): FindingResolutionCandidate => ({
  schemaVersion: 1,
  id: 'finding-candidate.test.hard-diagnosis',
  findingDefinitionId: findingDefinition.id,
  findingDefinitionContentVersion: findingDefinition.contentVersion,
  kind: 'diagnostic_requirement',
  proposedValue: { kind: 'outcome', value: 'present' },
  uncertainty: 'none',
  contributions: [
    {
      schemaVersion: 1,
      id: 'finding-contribution.test.hard-diagnosis',
      ownerKind: 'condition',
      ownerId: 'diagnosis.test.focus',
      ownerContentVersion: '1.0.0',
      role: 'constraint',
      provenanceIds: ['source-use.test.hard-diagnosis'],
    },
  ],
  resolution: {
    origin: 'authored',
    ownerId: 'diagnosis.test.focus',
    ownerContentVersion: '1.0.0',
  },
  review: approvedReview,
});

const compile = (candidates: FindingResolutionCandidate[]) =>
  compileSharedFindings({
    schemaVersion: 1,
    id: 'shared-finding-request.test.optional-texture',
    patientStateId: 'patient-state.test.optional-texture',
    seed: 'seed.shared-finding.optional-texture',
    findingDefinitions: [findingDefinition],
    candidates,
    propositionState: {
      schemaVersion: 1,
      id: 'proposition-state.test.optional-texture',
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
      id: 'finding-projection-horizon.test.optional-texture',
      targets: [],
    },
  });

describe('optional finding-texture budget bridge', () => {
  it('emits selected subthreshold texture from the original D-201 draw without another charge', () => {
    const optionalArtifact = findOptionalArtifact(true);
    const request = makeBridgeRequest(optionalArtifact);
    expect(OptionalFindingTextureBridgeRequestSchema.parse(request)).toEqual(request);
    const before = JSON.stringify(request);
    const artifact = expectBridge(request);

    expect(JSON.stringify(request)).toBe(before);
    expect(OptionalFindingTextureBridgeArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.optionalFeatureSelectedCount).toBe(optionalArtifact.selectedCount);
    expect(artifact.optionalFeatureTotalSpent).toBe(optionalArtifact.totalSpent);
    expect(artifact.optionalFeatureRemainingBudget).toBe(optionalArtifact.remainingBudget);
    expect(artifact.candidates).toHaveLength(1);
    expect(artifact.candidates[0]?.kind).toBe('background_variation');
    expect(artifact.candidates[0]?.proposedValue).toEqual({
      kind: 'outcome',
      value: 'subthreshold',
    });
    const resolution = artifact.candidates[0]?.resolution;
    expect(resolution?.origin).toBe('deterministic_generation');
    expect(resolution?.origin === 'deterministic_generation' ? resolution.stableDrawId : null).toBe(
      optionalArtifact.selectionDraws[0]?.stableDrawId,
    );
    expect(verifyOptionalFindingTextureBridgeIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyOptionalFindingTextureBridgeContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
    expect(expectBridge(structuredClone(request))).toEqual(artifact);
    expect(fingerprintOptionalFindingTextureBridgeProfile(request.bridgeProfile)).toBe(
      artifact.bridgeProfileFingerprint,
    );

    const serialized = JSON.stringify(artifact);
    expect(serialized).not.toMatch(/probability|prevalence|points|gameGenerationWeight/);
  });

  it('contributes nothing when D-201 leaves the texture module unselected', () => {
    const optionalArtifact = findOptionalArtifact(false);
    const artifact = expectBridge(makeBridgeRequest(optionalArtifact));
    expect(artifact.optionalFeatureSelectedCount).toBe(0);
    expect(artifact.optionalFeatureTotalSpent).toBe(0);
    expect(artifact.optionalFeatureRemainingBudget).toBe(1);
    expect(artifact.candidates).toEqual([]);
    expect(artifact.replacedBackgroundFindingDefinitionIds).toEqual([]);
    expect(artifact.candidateEvaluations[0]?.disposition).toBe('not_selected');
  });

  it('enters D-193 at background priority and never overrides a hard diagnosis-owned fact', () => {
    const texture = expectBridge(makeBridgeRequest(findOptionalArtifact(true))).candidates[0]!;
    const textureOnly = compile([texture]);
    expect(textureOnly.ok).toBe(true);
    if (!textureOnly.ok) throw new Error(textureOnly.error.message);
    expect(textureOnly.value.findings[0]?.value).toEqual({
      kind: 'outcome',
      value: 'subthreshold',
    });

    const withHard = compile([texture, hardCandidate()]);
    expect(withHard.ok).toBe(true);
    if (!withHard.ok) throw new Error(withHard.error.message);
    expect(withHard.value.findings[0]?.value).toEqual({
      kind: 'outcome',
      value: 'present',
    });
    expect(
      withHard.value.candidateEvaluations.find(
        (evaluation) => evaluation.candidateId === texture.id,
      )?.disposition,
    ).toBe('required_value_prevailed');
  });

  it('rejects stale horizons, illegal values, and frozen artifact tampering', () => {
    const request = makeBridgeRequest(findOptionalArtifact(true));
    const stale = structuredClone(request);
    stale.referenceHorizon.contentVersion = '2.0.0';
    expect(bridgeOptionalFindingTextureFromBudget(stale).ok).toBe(false);

    const illegal = structuredClone(request);
    illegal.bridgeProfile.mappings[0]!.outcomes[0]!.proposedValue.value = 'high';
    expect(bridgeOptionalFindingTextureFromBudget(illegal).ok).toBe(false);

    const artifact = expectBridge(request);
    const changed = structuredClone(artifact);
    changed.optionalFeatureTotalSpent = 0;
    expect(verifyOptionalFindingTextureBridgeIntegrity(changed).ok).toBe(false);
    expect(
      verifyOptionalFindingTextureBridgeContext({
        artifact,
        request: makeBridgeRequest(findOptionalArtifact(false)),
      }).ok,
    ).toBe(false);
  });
});
