import {
  SharedFindingSourceValidationArtifactSchema,
  type ClinicalRuleReview,
  type FindingDefinition,
  type FindingRevealProjection,
  type OptionalFeatureBudgetSelectionArtifact,
  type OptionalFeatureBudgetSelectionRequest,
  type PatientOptionalFeatureModuleDefinition,
  type PatientSceneSourceInstanceDefinition,
  type PatientTemplate,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintOptionalFeatureModuleDefinition,
  selectOptionalFeaturesWithinBudget,
} from './optional-feature-budget-selector';
import {
  compilePatientSceneSourceInstances,
  derivePatientSceneSourceInstanceId,
} from './patient-scene-source-instance-compiler';
import {
  compileSharedFindings,
  verifyCompiledSharedFindingIntegrity,
} from './shared-finding-compiler';
import {
  validateSharedFindingSources,
  verifySharedFindingSourceValidationIntegrity,
} from './shared-finding-source-validation';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-08-03T00:00:00.000Z',
  sourceUseNoteIds: [],
};

const template = (): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-template.test.finding-source-report',
  compilationMode: 'attachment_only.v6',
  internalLabel: 'Synthetic finding source-report template',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  careSetting: 'outpatient_psychiatry',
  focusedDecisionId: 'decision.test.finding-source-report',
  primaryPolicyRef: {
    id: 'decision-policy.test.finding-source-report',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.finding-source-report',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0123456789abcdef',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.finding-source-report',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0123456789abcdef',
  findingProjectionHorizonId: 'finding-projection-horizon.test.finding-source-report',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0123456789abcdef',
  universalActionResultAssemblyRecipeRef: {
    id: 'universal-action-result-assembly.test.finding-source-report',
    contentVersion: '1.0.0',
  },
  universalActionResultAssemblyRecipeFingerprint:
    'fingerprint.universal-action-result.assembly.fnv1a64.0123456789abcdef',
  compatibleLocationRefs: [
    {
      id: 'location.test.outpatient',
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.finding-source-report',
      diagnosisDefinitionId: 'diagnosis.test.depression',
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
    id: 'presentation-richness.test.finding-source-report',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const optionalArtifact = (selected: boolean): OptionalFeatureBudgetSelectionArtifact => {
  const patientTemplate = template();
  const definition: PatientOptionalFeatureModuleDefinition = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'optional-feature.test.source-report.minimizes-fatigue',
    label: 'Synthetic minimization of fatigue',
    moduleKind: 'source_report',
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
    review: approvedReview,
  };
  const moduleFingerprint = fingerprintOptionalFeatureModuleDefinition(definition);
  const base = {
    schemaVersion: 1 as const,
    id: 'optional-feature-budget-request.test.finding-source-report',
    template: patientTemplate,
    moduleDefinitions: [definition],
    profile: {
      schemaVersion: 1 as const,
      contentVersion: '1.0.0',
      id: 'optional-feature-profile.test.finding-source-report',
      modelVersion: 'weighted-optional-feature-budget-selection.v1' as const,
      templateRef: {
        id: patientTemplate.id,
        contentVersion: patientTemplate.contentVersion,
      },
      templateFingerprint: fingerprintTemplateConditionSelectionTemplate(patientTemplate),
      countWeights: [0, 1].map((selectionCount) => ({
        schemaVersion: 1 as const,
        selectionCount,
        gameSelectionWeight: 1,
      })),
      candidateBindings: [
        {
          schemaVersion: 1 as const,
          id: 'optional-feature-binding.test.source-report.minimizes-fatigue',
          moduleRef: {
            id: definition.id,
            contentVersion: definition.contentVersion,
          },
          moduleFingerprint,
          selectedModuleId: 'patient-optional-feature.test.source-report.minimizes-fatigue',
          cost: 1,
          impact: 'fit_modifier' as const,
          complexityContributions: [
            {
              id: 'complexity-contribution.test.source-report.minimizes-fatigue',
              label: 'Inaccurate fatigue self-report',
              dimension: 'information' as const,
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
    seed: '',
  } satisfies OptionalFeatureBudgetSelectionRequest;

  for (let index = 0; index < 512; index += 1) {
    const result = selectOptionalFeaturesWithinBudget({
      ...base,
      seed: `finding-source-report-seed-${index}`,
    });
    if (result.ok && (result.value.selectedCount === 1) === selected) return result.value;
  }
  throw new Error(`Could not resolve a ${selected ? 'selected' : 'base'} D-201 fixture.`);
};

const findingDefinition: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test-current-fatigue-source-report',
  label: 'Current fatigue',
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
};

const projection = (id: string, response: 'present' | 'absent'): FindingRevealProjection => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  sourceMatch: 'all',
  sourceBindings: [
    {
      kind: 'canonical_finding',
      findingDefinitionId: findingDefinition.id,
      findingDefinitionContentVersion: findingDefinition.contentVersion,
      allowedStates: ['present'],
    },
  ],
  target: {
    kind: 'information_action',
    actionId: 'info.history.test-depressive-symptoms',
  },
  response: { kind: 'finding_outcome', outcome: response },
  expressionBankId: null,
  expressionBankContentVersion: null,
  review: approvedReview,
});

const findingReportSourceDefinition: PatientSceneSourceInstanceDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'patient-scene-source-definition.test.finding-source-report.patient',
  kind: 'patient_report',
};

const request = (selected: boolean): SharedFindingCompileRequest => {
  const artifact = optionalArtifact(selected);
  const binding = artifact.selectionRequest.profile.candidateBindings[0]!;
  const baseProjection = projection(
    'finding-projection.test.fatigue-self-report.accurate',
    'present',
  );
  const inaccurateProjection = projection(
    'finding-projection.test.fatigue-self-report.minimized',
    'absent',
  );
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.finding-source-report',
    patientStateId: 'resolved-patient-state.test.finding-source-report',
    seed: artifact.seed,
    findingDefinitions: [findingDefinition],
    candidates: [
      {
        schemaVersion: 1,
        id: 'finding-candidate.test.fatigue-source-report-present',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
        kind: 'case_critical',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        contributions: [
          {
            schemaVersion: 1,
            id: 'finding-contribution.test.fatigue-source-report-present',
            ownerKind: 'patient_template',
            ownerId: artifact.templateRef.id,
            ownerContentVersion: artifact.templateRef.contentVersion,
            role: 'constraint',
            provenanceIds: ['provenance.test.finding-source-report'],
          },
        ],
        resolution: {
          origin: 'authored',
          ownerId: artifact.templateRef.id,
          ownerContentVersion: artifact.templateRef.contentVersion,
        },
        review: approvedReview,
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.finding-source-report',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections: [baseProjection, inaccurateProjection],
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.finding-source-report',
      targets: [
        {
          target: {
            kind: 'information_action',
            actionId: 'info.history.test-depressive-symptoms',
          },
          allowedResponses: [
            { kind: 'finding_outcome', outcome: 'present' },
            { kind: 'finding_outcome', outcome: 'absent' },
          ],
          expressionDisplayChannel: null,
        },
      ],
    },
    findingSourceReportProjectionPolicy: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'finding-source-report-policy.test.fatigue',
      modelVersion: 'finding-source-report-projection.v1',
      optionalFeatureArtifact: artifact,
      slots: [
        {
          schemaVersion: 1,
          id: 'finding-source-report-slot.test.fatigue-present',
          source: {
            kind: 'patient_report',
            sourceInstanceId: derivePatientSceneSourceInstanceId(findingReportSourceDefinition),
          },
          timeScopeId: 'time-scope.current',
          claimOriginId: 'claim-origin.test.patient',
          dependencyGroupIds: [],
          baseProjectionRef: {
            id: baseProjection.id,
            contentVersion: baseProjection.contentVersion,
          },
          modifiers: [
            {
              moduleRef: { ...binding.moduleRef },
              moduleFingerprint: binding.moduleFingerprint,
              optionalFeatureBindingId: binding.id,
              selectedModuleId: binding.selectedModuleId,
              projectionRef: {
                id: inaccurateProjection.id,
                contentVersion: inaccurateProjection.contentVersion,
              },
            },
          ],
        },
      ],
      developerOpinionIds: ['developer-opinion.test.finding-source-report'],
      lifecycle: 'approved',
      review: approvedReview,
    },
  };
};

const compile = (selected: boolean) => {
  const input = request(selected);
  const result = compileSharedFindings(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return { input, compiled: result.value };
};

describe('D-258 finding source-report complexity projection', () => {
  it('uses the accurate projection when D-201 selects no source-report modifier', () => {
    const { input, compiled } = compile(false);
    expect(input.findingSourceReportProjectionPolicy?.optionalFeatureArtifact.totalSpent).toBe(0);
    expect(compiled.findings[0]!.value).toEqual({ kind: 'outcome', value: 'present' });
    expect(compiled.projections).toHaveLength(1);
    expect(compiled.projections[0]).toMatchObject({
      projectionId: 'finding-projection.test.fatigue-self-report.accurate',
      response: { kind: 'finding_outcome', outcome: 'present' },
      resolution: {
        sourceReportSelection: {
          slotId: 'finding-source-report-slot.test.fatigue-present',
          complexityModule: null,
        },
      },
    });
  });

  it('uses one inaccurate projection without changing truth or charging D-201 again', () => {
    const { input, compiled } = compile(true);
    const artifact = input.findingSourceReportProjectionPolicy!.optionalFeatureArtifact;
    const evaluation = artifact.candidateEvaluations[0]!;
    expect(artifact.totalSpent).toBe(1);
    expect(compiled.findings[0]!.value).toEqual({ kind: 'outcome', value: 'present' });
    expect(compiled.projections).toHaveLength(1);
    expect(compiled.projections[0]).toMatchObject({
      projectionId: 'finding-projection.test.fatigue-self-report.minimized',
      response: { kind: 'finding_outcome', outcome: 'absent' },
      resolution: {
        sourceReportSelection: {
          source: { kind: 'patient_report' },
          complexityModule: {
            cost: 1,
            selectionOrdinal: evaluation.selectionOrdinal,
            stableDrawId: evaluation.stableDrawId,
          },
        },
      },
    });
    expect(verifyCompiledSharedFindingIntegrity(compiled)).toEqual({
      ok: true,
      value: compiled,
    });
  });

  it('lets only the active report projection participate in closed-assessment absence derivation', () => {
    const input = request(true);
    input.candidates = input.candidates.map((candidate) => ({
      ...candidate,
      kind: 'no_opinion',
      proposedValue: null,
      uncertainty: null,
      resolution: null,
    }));
    for (const candidateProjection of input.projections) {
      candidateProjection.sourceBindings[0] = {
        kind: 'canonical_finding',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
        allowedStates: ['absent'],
      };
      candidateProjection.deriveAbsentWhenNoCandidate = true;
    }
    input.projections[0]!.response = { kind: 'finding_outcome', outcome: 'absent' };
    input.projections[1]!.response = { kind: 'finding_outcome', outcome: 'present' };

    const result = compileSharedFindings(input);
    if (!result.ok) throw new Error(JSON.stringify(result.error));

    expect(result.value.findings[0]!.value).toEqual({ kind: 'outcome', value: 'absent' });
    expect(result.value.projections).toHaveLength(1);
    expect(result.value.projections[0]).toMatchObject({
      projectionId: 'finding-projection.test.fatigue-self-report.minimized',
      response: { kind: 'finding_outcome', outcome: 'present' },
    });
    expect(
      result.value.candidateEvaluations.filter((evaluation) =>
        evaluation.candidateId.startsWith('candidate.closed-assessment-absence.'),
      ),
    ).toHaveLength(1);
  });

  it('rejects crossed D-201 provenance and a modifier that changes hidden-source semantics', () => {
    const crossed = request(true);
    crossed.findingSourceReportProjectionPolicy!.optionalFeatureArtifact = optionalArtifact(false);
    expect(compileSharedFindings(crossed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const changedSource = request(true);
    changedSource.projections[1]!.sourceBindings[0] = {
      kind: 'canonical_finding',
      findingDefinitionId: findingDefinition.id,
      findingDefinitionContentVersion: findingDefinition.contentVersion,
      allowedStates: ['absent'],
    };
    expect(compileSharedFindings(changedSource)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });
});

const expectFindingSourceHorizon = (
  patientStateId: string,
  definitions: readonly PatientSceneSourceInstanceDefinition[],
) => {
  const result = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: 'patient-scene-source-instance-request.test.finding-source-report',
    patientStateId,
    definitions,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-302 shared-finding source validation', () => {
  it.each([
    ['base', false],
    ['complexity-modified', true],
  ] as const)('validates the %s finding-report projection source', (_label, selected) => {
    const { input, compiled } = compile(selected);
    const sourceHorizon = expectFindingSourceHorizon(input.patientStateId, [
      findingReportSourceDefinition,
    ]);
    const result = validateSharedFindingSources({
      schemaVersion: 1,
      id: `shared-finding-source-validation-request.test.${selected ? 'modified' : 'base'}`,
      sharedFindingRequest: input,
      sharedFindingCompilation: compiled,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toHaveLength(1);
    expect(result.value.validatedSourceBindings[0]).toMatchObject({
      resolvedProjectionId: compiled.projections[0]!.id,
      projectionId: compiled.projections[0]!.projectionId,
      sourceReportSelection: {
        slotId: 'finding-source-report-slot.test.fatigue-present',
        source: {
          kind: 'patient_report',
          sourceInstanceId: derivePatientSceneSourceInstanceId(findingReportSourceDefinition),
        },
      },
      sourceDefinitionId: findingReportSourceDefinition.id,
      sourceDefinitionContentVersion: findingReportSourceDefinition.contentVersion,
    });
    expect(
      result.value.validatedSourceBindings[0]!.sourceReportSelection.complexityModule === null,
    ).toBe(!selected);
    expect(SharedFindingSourceValidationArtifactSchema.parse(result.value)).toEqual(result.value);
    expect(verifySharedFindingSourceValidationIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });
    expect(result.value).not.toHaveProperty('credibility');
    expect(result.value).not.toHaveProperty('points');
  });

  it('accepts a compiled finding set with no direct source-report selection', () => {
    const input = request(false);
    delete input.findingSourceReportProjectionPolicy;
    input.projections = [input.projections[0]!];
    const compiled = compileSharedFindings(input);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) throw new Error(compiled.error.message);
    const sourceHorizon = expectFindingSourceHorizon(input.patientStateId, []);
    const result = validateSharedFindingSources({
      schemaVersion: 1,
      id: 'shared-finding-source-validation-request.test.empty',
      sharedFindingRequest: input,
      sharedFindingCompilation: compiled.value,
      sourceInstanceCompilation: sourceHorizon,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.validatedSourceBindings).toEqual([]);
  });

  it('rejects crossed patient, missing source, crossed kind, and request/output mismatch', () => {
    const { input, compiled } = compile(true);
    expect(
      validateSharedFindingSources({
        schemaVersion: 1,
        id: 'shared-finding-source-validation-request.test.crossed-patient',
        sharedFindingRequest: input,
        sharedFindingCompilation: compiled,
        sourceInstanceCompilation: expectFindingSourceHorizon(
          'resolved-patient-state.test.crossed',
          [findingReportSourceDefinition],
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });
    expect(
      validateSharedFindingSources({
        schemaVersion: 1,
        id: 'shared-finding-source-validation-request.test.missing-source',
        sharedFindingRequest: input,
        sharedFindingCompilation: compiled,
        sourceInstanceCompilation: expectFindingSourceHorizon(input.patientStateId, []),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const crossedKindDefinition: PatientSceneSourceInstanceDefinition = {
      ...findingReportSourceDefinition,
      id: 'patient-scene-source-definition.test.finding-source-report.record',
      kind: 'record_review',
    };
    const crossedKindInput = request(true);
    crossedKindInput.findingSourceReportProjectionPolicy!.slots[0]!.source.sourceInstanceId =
      derivePatientSceneSourceInstanceId(crossedKindDefinition);
    const crossedKindCompiled = compileSharedFindings(crossedKindInput);
    expect(crossedKindCompiled.ok).toBe(true);
    if (!crossedKindCompiled.ok) throw new Error(crossedKindCompiled.error.message);
    expect(
      validateSharedFindingSources({
        schemaVersion: 1,
        id: 'shared-finding-source-validation-request.test.crossed-kind',
        sharedFindingRequest: crossedKindInput,
        sharedFindingCompilation: crossedKindCompiled.value,
        sourceInstanceCompilation: expectFindingSourceHorizon(crossedKindInput.patientStateId, [
          crossedKindDefinition,
        ]),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const mismatchedRequest = request(false);
    expect(
      validateSharedFindingSources({
        schemaVersion: 1,
        id: 'shared-finding-source-validation-request.test.replay-mismatch',
        sharedFindingRequest: mismatchedRequest,
        sharedFindingCompilation: compiled,
        sourceInstanceCompilation: expectFindingSourceHorizon(input.patientStateId, [
          findingReportSourceDefinition,
        ]),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SHARED_FINDING_REPLAY_MISMATCH' },
    });
  });

  it('detects retained-artifact tampering', () => {
    const { input, compiled } = compile(true);
    const result = validateSharedFindingSources({
      schemaVersion: 1,
      id: 'shared-finding-source-validation-request.test.tamper',
      sharedFindingRequest: input,
      sharedFindingCompilation: compiled,
      sourceInstanceCompilation: expectFindingSourceHorizon(input.patientStateId, [
        findingReportSourceDefinition,
      ]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    const tampered = structuredClone(result.value);
    tampered.inputFingerprint =
      'fingerprint.shared-finding-source-validation.input.fnv1a64.0000000000000000';
    expect(verifySharedFindingSourceValidationIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});
