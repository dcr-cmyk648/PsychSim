import {
  ResolvedPatientStateSchema,
  StructuredSourceReportSelectionRequestSchema,
  type ClinicalRuleReview,
  type EncounterCareSetting,
  type InformationActionDefinition,
  type PatientTemplate,
  type StructuredPatientStateRevealDefinition,
  type StructuredSourceReportProfile,
  type StructuredSourceReportSelectionHorizon,
  type StructuredSourceReportSelectionProfile,
  type StructuredSourceReportSelectionRequest,
  type UniversalActionResultAssemblyRecipe,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintStructuredSourceReportDefinition,
  fingerprintStructuredSourceReportProfile,
  compileStructuredSourceReports,
} from './structured-source-report-compiler';
import {
  fingerprintStructuredSourceReportSelectionAssembly,
  fingerprintStructuredSourceReportSelectionHorizon,
  getSelectedStructuredSourceReportProfiles,
  selectStructuredSourceReportBehaviors,
  verifyStructuredSourceReportBehaviorSelectionIntegrity,
} from './structured-source-report-behavior-selector';
import {
  fingerprintInformationActionPayload,
  fingerprintUniversalActionResultAssemblyRecipe,
} from './universal-action-result-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T00:00:00.000Z',
  sourceUseNoteIds: [],
};

const makeAction = (suffix: string): InformationActionDefinition => ({
  id: `info.history.test-${suffix}`,
  label: `Test ${suffix}`,
  searchAliases: [],
  category: 'history',
  soapSection: 'subjective',
  resultSource: 'patient_report',
  description: 'Neutral synthetic history action.',
  serviceId: 'service.history.basic',
  repeatable: false,
});

const makeDefinition = (
  suffix: string,
  action: InformationActionDefinition,
  allowedSourceKinds: StructuredPatientStateRevealDefinition['allowedSourceKinds'] = [
    'patient_report',
  ],
): StructuredPatientStateRevealDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `structured-reveal-definition.test.${suffix}`,
  modelVersion: 'structured-patient-state-reveal.v1',
  label: `Test ${suffix}`,
  informationActionId: action.id,
  informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
  allowedSourceKinds,
  lanes: ['medication_trials'],
  singletonFields: [],
  lifecycle: 'approved',
  review: approvedReview,
});

const makeAssembly = (
  definitions: readonly StructuredPatientStateRevealDefinition[],
  actions: readonly InformationActionDefinition[],
): UniversalActionResultAssemblyRecipe => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'universal-action-result-assembly.test.source-report-selection',
  modelVersion: 'universal-action-result-assembly.v3',
  actionCatalog: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'information-action-catalog.test.source-report-selection',
    actions: [...actions],
  },
  instrumentDefinitions: [],
  structuredRevealDefinitions: [...definitions],
  targetScopedPatientValueProjectionDefinitions: [],
  measurementDefinitions: [],
  categoricalObservationDefinitions: [],
  testDefinitions: [],
  recipes: actions.map((action) => ({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `universal-action-result-recipe.${action.id}`,
    modelVersion: 'universal-action-result.v1',
    informationActionId: action.id,
    informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
    sourceKinds: ['structured_state_reveals'],
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
  })),
});

const makeTemplate = (
  assembly: UniversalActionResultAssemblyRecipe,
  careSetting: EncounterCareSetting = 'outpatient_psychiatry',
): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `patient-template.test.source-report-selection.${careSetting}`,
  compilationMode: 'attachment_only.v6',
  internalLabel: 'Synthetic source-report selection template',
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: 'starter',
  careSetting,
  focusedDecisionId: 'decision.test.immediate-treatment',
  primaryPolicyRef: {
    id: 'decision-policy.test.immediate-treatment',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: 'decision-action-horizon.test.source-report-selection',
  decisionActionHorizonFingerprint:
    'fingerprint.catalog-instance.action-horizon.fnv1a64.0123456789abcdef',
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.source-report-selection',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0123456789abcdef',
  findingProjectionHorizonId: 'finding-projection-horizon.test.source-report-selection',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0123456789abcdef',
  universalActionResultAssemblyRecipeRef: {
    id: assembly.id,
    contentVersion: assembly.contentVersion,
  },
  universalActionResultAssemblyRecipeFingerprint:
    fingerprintUniversalActionResultAssemblyRecipe(assembly),
  compatibleLocationRefs: [
    {
      id: `location.test.${careSetting}`,
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: 'template-condition.test.source-report-selection',
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
    additionalFeatureBudget: 0,
    maximumSelectedModules: 0,
    selectedModules: [],
    targetEnvelope: null,
  },
  presentationRichnessEnvelope: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'presentation-richness.test.source-report-selection',
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const makeProfile = (
  definition: StructuredPatientStateRevealDefinition,
  suffix: string,
  behavior: 'report_all' | 'none_reported' | 'unassessed' | 'unable_to_assess',
  source: StructuredSourceReportProfile['source'] = {
    kind: 'patient_report',
    sourceInstanceId: 'source-instance.test.patient',
  },
): StructuredSourceReportProfile => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `source-report-profile.test.${suffix}`,
  modelVersion: 'structured-source-report-profile.v1',
  label: `Test ${suffix}`,
  definitionRef: {
    id: definition.id,
    contentVersion: definition.contentVersion,
  },
  definitionFingerprint: fingerprintStructuredSourceReportDefinition(definition),
  source,
  timeScopeId: 'time-scope.longitudinal',
  claimOriginId: `claim-origin.test.${source.sourceInstanceId}`,
  dependencyGroupIds: [],
  laneBehaviors: [{ lane: 'medication_trials', behavior }],
  singletonBehaviors: [],
  developerOpinionIds: ['developer-opinion.test.source-report-selection'],
  lifecycle: 'approved',
  review: approvedReview,
});

type SlotFixture = {
  readonly id: string;
  readonly definition: StructuredPatientStateRevealDefinition;
  readonly source: StructuredSourceReportProfile['source'];
  readonly profiles: readonly StructuredSourceReportProfile[];
  readonly mode: 'fixed' | 'weighted';
  readonly weights?: readonly number[];
};

const makeRequest = (input: {
  readonly slots: readonly SlotFixture[];
  readonly actions: readonly InformationActionDefinition[];
  readonly seed?: string;
  readonly careSetting?: EncounterCareSetting;
  readonly horizonId?: string;
  readonly selectionProfileId?: string;
}): StructuredSourceReportSelectionRequest => {
  const definitions = [
    ...new Map(input.slots.map((slot) => [slot.definition.id, slot.definition])).values(),
  ];
  const assembly = makeAssembly(definitions, input.actions);
  const horizon: StructuredSourceReportSelectionHorizon = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: input.horizonId ?? 'source-report-selection-horizon.test',
    modelVersion: 'structured-source-report-selection.v1',
    assemblyRecipeRef: {
      id: assembly.id,
      contentVersion: assembly.contentVersion,
    },
    assemblyRecipeFingerprint: fingerprintStructuredSourceReportSelectionAssembly(assembly),
    pools: input.slots.map((slot) => ({
      id: slot.id,
      definitionRef: {
        id: slot.definition.id,
        contentVersion: slot.definition.contentVersion,
      },
      definitionFingerprint: fingerprintStructuredSourceReportDefinition(slot.definition),
      source: slot.source,
      timeScopeId: slot.profiles[0]!.timeScopeId,
      claimOriginId: slot.profiles[0]!.claimOriginId,
      dependencyGroupIds: [...slot.profiles[0]!.dependencyGroupIds],
    })),
    lifecycle: 'approved',
  };
  const selectionProfile: StructuredSourceReportSelectionProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: input.selectionProfileId ?? 'source-report-selection-profile.test',
    modelVersion: 'structured-source-report-selection-profile.v1',
    horizonRef: {
      id: horizon.id,
      contentVersion: horizon.contentVersion,
    },
    horizonFingerprint: fingerprintStructuredSourceReportSelectionHorizon(horizon),
    careSetting: input.careSetting ?? 'outpatient_psychiatry',
    policies: input.slots.map((slot) =>
      slot.mode === 'fixed'
        ? {
            slotId: slot.id,
            mode: 'fixed' as const,
            candidate: {
              profileRef: {
                id: slot.profiles[0]!.id,
                contentVersion: slot.profiles[0]!.contentVersion,
              },
              profileFingerprint: fingerprintStructuredSourceReportProfile(slot.profiles[0]!),
            },
          }
        : {
            slotId: slot.id,
            mode: 'weighted' as const,
            candidates: slot.profiles.map((profile, index) => ({
              profileRef: {
                id: profile.id,
                contentVersion: profile.contentVersion,
              },
              profileFingerprint: fingerprintStructuredSourceReportProfile(profile),
              gameGenerationWeight: slot.weights?.[index] ?? 1,
            })),
          },
    ),
    developerOpinionIds: ['developer-opinion.test.source-report-selection'],
    lifecycle: 'approved',
    review: approvedReview,
  };
  return StructuredSourceReportSelectionRequestSchema.parse({
    schemaVersion: 1,
    id: 'source-report-selection-request.test',
    seed: input.seed ?? 'source-report-selection-seed',
    template: makeTemplate(assembly, input.careSetting),
    assemblyRecipe: assembly,
    horizon,
    selectionProfile,
    profiles: input.slots.flatMap((slot) => slot.profiles),
  });
};

const compileOrThrow = (request: StructuredSourceReportSelectionRequest) => {
  const result = selectStructuredSourceReportBehaviors(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const makeBasicFixture = (seed = 'source-report-selection-seed') => {
  const action = makeAction('treatment-history');
  const definition = makeDefinition('treatment-history', action);
  const profiles = [
    makeProfile(definition, 'history.report-all', 'report_all'),
    makeProfile(definition, 'history.none-reported', 'none_reported'),
  ];
  return makeRequest({
    actions: [action],
    slots: [
      {
        id: 'source-view-slot.test.treatment-history',
        definition,
        source: profiles[0]!.source,
        profiles,
        mode: 'weighted',
        weights: [3, 1],
      },
    ],
    seed,
  });
};

const makePatientState = () =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: 'resolved-patient-state.test.source-report-selection',
    demographics: {
      recordVersion: 2,
      ageYears: 40,
      reviewedAgeBandId: 'age-band.adult',
      sexForReference: 'female',
    },
    conditionStates: [],
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test.source-report-selection',
      useEntries: [],
    },
    treatmentHistory: {
      medicationTrials: [],
      psychotherapyTrials: [],
      currentProviders: [],
      priorLevelsOfCare: [],
    },
    medicationTolerabilityFindings: [],
    reactionHistory: {
      status: 'unassessed',
      medicationAssessmentStatus: 'unassessed',
      records: [],
    },
    canonicalFindings: [],
    measurements: [],
    categoricalObservations: [],
    structuredTestResults: [],
    clinicalContexts: [],
    clinicalDurations: [],
    subjectiveBurdenRecords: [],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.source-report-selection',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: [],
    reportedSafetyPlanningAbility: 'unassessed',
  });

describe('D-217 structured source-report behavior selector', () => {
  it('keeps fixed selection seed-independent and makes no draw', () => {
    const action = makeAction('fixed');
    const definition = makeDefinition('fixed', action);
    const profile = makeProfile(definition, 'fixed', 'report_all');
    const base = {
      actions: [action],
      slots: [
        {
          id: 'source-view-slot.test.fixed',
          definition,
          source: profile.source,
          profiles: [profile],
          mode: 'fixed' as const,
        },
      ],
    };
    const first = compileOrThrow(makeRequest({ ...base, seed: 'first-seed' }));
    const second = compileOrThrow(makeRequest({ ...base, seed: 'second-seed' }));

    expect(first.selections[0]!.stableDrawId).toBeNull();
    expect(second.selections[0]!.stableDrawId).toBeNull();
    expect(first.selections[0]!.selectedProfileRef).toEqual(
      second.selections[0]!.selectedProfileRef,
    );
  });

  it('replays the same weighted request deterministically', () => {
    const request = makeBasicFixture();
    const first = compileOrThrow(request);
    const second = compileOrThrow(structuredClone(request));

    expect(second).toEqual(first);
    expect(verifyStructuredSourceReportBehaviorSelectionIntegrity(first)).toEqual({
      ok: true,
      value: first,
    });
  });

  it('varies only among reviewed alternatives across many seeds', () => {
    const selected = new Set(
      Array.from(
        { length: 256 },
        (_, index) =>
          compileOrThrow(makeBasicFixture(`seed-${index}`)).selections[0]!.selectedProfileRef.id,
      ),
    );

    expect(selected).toEqual(
      new Set([
        'source-report-profile.test.history.none-reported',
        'source-report-profile.test.history.report-all',
      ]),
    );
  });

  it('supports fixed and weighted slots in one care-setting profile', () => {
    const fixedAction = makeAction('fixed-combined');
    const weightedAction = makeAction('weighted-combined');
    const fixedDefinition = makeDefinition('fixed-combined', fixedAction);
    const weightedDefinition = makeDefinition('weighted-combined', weightedAction);
    const fixedProfile = makeProfile(fixedDefinition, 'fixed-combined', 'report_all');
    const weightedProfiles = [
      makeProfile(weightedDefinition, 'weighted-combined.report-all', 'report_all'),
      makeProfile(weightedDefinition, 'weighted-combined.unassessed', 'unassessed'),
    ];
    const artifact = compileOrThrow(
      makeRequest({
        actions: [fixedAction, weightedAction],
        slots: [
          {
            id: 'source-view-slot.test.fixed-combined',
            definition: fixedDefinition,
            source: fixedProfile.source,
            profiles: [fixedProfile],
            mode: 'fixed',
          },
          {
            id: 'source-view-slot.test.weighted-combined',
            definition: weightedDefinition,
            source: weightedProfiles[0]!.source,
            profiles: weightedProfiles,
            mode: 'weighted',
          },
        ],
      }),
    );

    expect(artifact.selections.map((selection) => selection.mode)).toEqual(['fixed', 'weighted']);
  });

  it('keeps distinct patient and collateral source views for one definition', () => {
    const action = makeAction('multi-source');
    const definition = makeDefinition('multi-source', action, [
      'patient_report',
      'collateral_report',
    ]);
    const patientProfile = makeProfile(definition, 'multi-source.patient', 'report_all', {
      kind: 'patient_report',
      sourceInstanceId: 'source-instance.test.patient',
    });
    const collateralProfile = makeProfile(definition, 'multi-source.collateral', 'none_reported', {
      kind: 'collateral_report',
      sourceInstanceId: 'source-instance.test.collateral',
    });
    const artifact = compileOrThrow(
      makeRequest({
        actions: [action],
        slots: [
          {
            id: 'source-view-slot.test.patient',
            definition,
            source: patientProfile.source,
            profiles: [patientProfile],
            mode: 'fixed',
          },
          {
            id: 'source-view-slot.test.collateral',
            definition,
            source: collateralProfile.source,
            profiles: [collateralProfile],
            mode: 'fixed',
          },
        ],
      }),
    );

    expect(artifact.selections).toHaveLength(2);
    expect(artifact.selections.map((selection) => selection.source.kind)).toEqual([
      'collateral_report',
      'patient_report',
    ]);
  });

  it('is invariant to candidate order', () => {
    const request = makeBasicFixture();
    const reversed = structuredClone(request);
    const policy = reversed.selectionProfile.policies[0]!;
    if (policy.mode !== 'weighted') throw new Error('Expected weighted fixture.');
    policy.candidates.reverse();

    expect(compileOrThrow(reversed)).toEqual(compileOrThrow(request));
  });

  it('does not perturb an existing slot when an unrelated slot is added', () => {
    const base = makeBasicFixture('stable-substream-seed');
    const action = makeAction('unrelated');
    const definition = makeDefinition('unrelated', action);
    const profile = makeProfile(definition, 'unrelated', 'report_all');
    const expanded = makeRequest({
      seed: base.seed,
      actions: [...base.assemblyRecipe.actionCatalog.actions, action],
      slots: [
        {
          id: base.horizon.pools[0]!.id,
          definition: base.assemblyRecipe.structuredRevealDefinitions[0]!,
          source: base.profiles[0]!.source,
          profiles: base.profiles,
          mode: 'weighted',
          weights: [3, 1],
        },
        {
          id: 'source-view-slot.test.unrelated',
          definition,
          source: profile.source,
          profiles: [profile],
          mode: 'fixed',
        },
      ],
      horizonId: base.horizon.id,
      selectionProfileId: base.selectionProfile.id,
    });

    const originalSelection = compileOrThrow(base).selections.find(
      (selection) => selection.poolId === base.horizon.pools[0]!.id,
    );
    const expandedSelection = compileOrThrow(expanded).selections.find(
      (selection) => selection.poolId === base.horizon.pools[0]!.id,
    );
    expect(expandedSelection?.selectedProfileRef).toEqual(originalSelection?.selectedProfileRef);
    expect(expandedSelection?.stableDrawId).toEqual(originalSelection?.stableDrawId);
  });

  it.each([
    'outpatient_psychiatry',
    'emergency_department',
    'inpatient_psychiatry',
    'consultation_liaison',
  ] as const)('freezes selection under the exact %s context', (careSetting) => {
    const request = makeBasicFixture();
    request.template.careSetting = careSetting;
    request.selectionProfile.careSetting = careSetting;

    expect(compileOrThrow(request).careSetting).toBe(careSetting);
  });

  it('rejects a crossed care-setting profile', () => {
    const request = makeBasicFixture();
    request.selectionProfile.careSetting = 'emergency_department';

    const result = selectStructuredSourceReportBehaviors(request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects source kinds and behavior coverage that D-215 cannot compile', () => {
    const sourceAction = makeAction('disallowed-source');
    const sourceDefinition = makeDefinition('disallowed-source', sourceAction);
    const sourceProfile = makeProfile(sourceDefinition, 'disallowed-source', 'report_all', {
      kind: 'collateral_report',
      sourceInstanceId: 'source-instance.test.disallowed-collateral',
    });
    expect(
      selectStructuredSourceReportBehaviors(
        makeRequest({
          actions: [sourceAction],
          slots: [
            {
              id: 'source-view-slot.test.disallowed-source',
              definition: sourceDefinition,
              source: sourceProfile.source,
              profiles: [sourceProfile],
              mode: 'fixed',
            },
          ],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_KIND_NOT_ALLOWED' },
    });

    const coverageAction = makeAction('incomplete-coverage');
    const coverageDefinition = makeDefinition('incomplete-coverage', coverageAction);
    const coverageProfile = makeProfile(coverageDefinition, 'incomplete-coverage', 'report_all');
    coverageProfile.laneBehaviors = [{ lane: 'psychotherapy_trials', behavior: 'report_all' }];
    expect(
      selectStructuredSourceReportBehaviors(
        makeRequest({
          actions: [coverageAction],
          slots: [
            {
              id: 'source-view-slot.test.incomplete-coverage',
              definition: coverageDefinition,
              source: coverageProfile.source,
              profiles: [coverageProfile],
              mode: 'fixed',
            },
          ],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'PROFILE_BEHAVIOR_COVERAGE_MISMATCH' },
    });
  });

  it('rejects two content versions of one stable behavior-profile ID', () => {
    const action = makeAction('duplicate-profile-id');
    const definition = makeDefinition('duplicate-profile-id', action);
    const first = makeProfile(definition, 'duplicate-profile-id', 'report_all');
    const second = {
      ...makeProfile(definition, 'duplicate-profile-id', 'none_reported'),
      contentVersion: '2.0.0',
    };

    expect(() =>
      makeRequest({
        actions: [action],
        slots: [
          {
            id: 'source-view-slot.test.duplicate-profile-id',
            definition,
            source: first.source,
            profiles: [first, second],
            mode: 'weighted',
          },
        ],
      }),
    ).toThrow();
  });

  it('keeps weighted slot selection independent of the template complexity envelope', () => {
    const base = makeBasicFixture('complexity-independent-seed');
    const changed = structuredClone(base);
    changed.template.complexityProfile.additionalFeatureBudget = 6;

    const first = compileOrThrow(base).selections[0]!;
    const second = compileOrThrow(changed).selections[0]!;
    expect(second.selectedProfileRef).toEqual(first.selectedProfileRef);
    expect(second.stableDrawId).toEqual(first.stableDrawId);
  });

  it('rejects stale assembly, definition, and profile fingerprints', () => {
    const staleAssembly = structuredClone(makeBasicFixture());
    staleAssembly.horizon.assemblyRecipeFingerprint =
      'fingerprint.structured-source-report-selection.assembly.fnv1a64.0000000000000000';
    staleAssembly.selectionProfile.horizonFingerprint =
      fingerprintStructuredSourceReportSelectionHorizon(staleAssembly.horizon);
    expect(selectStructuredSourceReportBehaviors(staleAssembly)).toMatchObject({
      ok: false,
      error: { code: 'STALE_ASSEMBLY_FINGERPRINT' },
    });

    const staleDefinition = structuredClone(makeBasicFixture());
    staleDefinition.horizon.pools[0]!.definitionFingerprint =
      'fingerprint.structured-source-report.definition.fnv1a64.0000000000000000';
    staleDefinition.profiles.forEach((profile) => {
      profile.definitionFingerprint = staleDefinition.horizon.pools[0]!.definitionFingerprint;
    });
    const definitionPolicy = staleDefinition.selectionProfile.policies[0]!;
    if (definitionPolicy.mode !== 'weighted') throw new Error('Expected weighted fixture.');
    definitionPolicy.candidates.forEach((candidate, index) => {
      candidate.profileFingerprint = fingerprintStructuredSourceReportProfile(
        staleDefinition.profiles[index]!,
      );
    });
    staleDefinition.selectionProfile.horizonFingerprint =
      fingerprintStructuredSourceReportSelectionHorizon(staleDefinition.horizon);
    expect(selectStructuredSourceReportBehaviors(staleDefinition)).toMatchObject({
      ok: false,
      error: { code: 'STALE_DEFINITION_FINGERPRINT' },
    });

    const staleProfile = structuredClone(makeBasicFixture());
    const profilePolicy = staleProfile.selectionProfile.policies[0]!;
    if (profilePolicy.mode !== 'weighted') throw new Error('Expected weighted fixture.');
    profilePolicy.candidates[0]!.profileFingerprint =
      'fingerprint.structured-source-report.profile.fnv1a64.0000000000000000';
    expect(selectStructuredSourceReportBehaviors(staleProfile)).toMatchObject({
      ok: false,
      error: { code: 'STALE_PROFILE_FINGERPRINT' },
    });
  });

  it('rejects incomplete membership, source mismatch, and generation lookalike fields', () => {
    const missingProfile = structuredClone(makeBasicFixture()) as unknown as Record<
      string,
      unknown
    >;
    (missingProfile.profiles as unknown[]).pop();
    expect(selectStructuredSourceReportBehaviors(missingProfile)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const sourceMismatch = structuredClone(makeBasicFixture());
    sourceMismatch.profiles[0]!.source.sourceInstanceId = 'source-instance.test.crossed';
    expect(selectStructuredSourceReportBehaviors(sourceMismatch)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const illegal = structuredClone(makeBasicFixture()) as unknown as Record<string, unknown>;
    const illegalPolicy = (
      illegal.selectionProfile as {
        policies: Array<Record<string, unknown>>;
      }
    ).policies[0]!;
    illegalPolicy.probability = 0.5;
    illegalPolicy.points = 10;
    illegalPolicy.complexityCost = 1;
    illegalPolicy.partialRecordIds = [];
    expect(selectStructuredSourceReportBehaviors(illegal)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('hands the selected complete profiles to D-215 once patient truth is frozen', () => {
    const selection = compileOrThrow(makeBasicFixture());
    const selectedProfiles = getSelectedStructuredSourceReportProfiles(selection);
    expect(selectedProfiles.ok).toBe(true);
    if (!selectedProfiles.ok) return;
    const result = compileStructuredSourceReports({
      schemaVersion: 1,
      id: 'structured-source-report-request.test.from-selection',
      patientState: makePatientState(),
      definitions: selection.request.assemblyRecipe.structuredRevealDefinitions,
      profiles: selectedProfiles.value,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.profileReferences).toHaveLength(1);
  });

  it('detects artifact tampering on deterministic replay', () => {
    const artifact = structuredClone(compileOrThrow(makeBasicFixture()));
    artifact.selections[0]!.candidateEvaluations[0]!.selected =
      !artifact.selections[0]!.candidateEvaluations[0]!.selected;

    expect(verifyStructuredSourceReportBehaviorSelectionIntegrity(artifact)).toMatchObject({
      ok: false,
    });
  });

  it('rejects tampered per-slot weight normalization', () => {
    const artifact = structuredClone(compileOrThrow(makeBasicFixture()));
    artifact.selections[0]!.candidateEvaluations[0]!.normalizedGameSelectionProbability = {
      numerator: 1,
      denominator: 5,
      decimal: 0.2,
    };

    expect(verifyStructuredSourceReportBehaviorSelectionIntegrity(artifact)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('contains no D-201 accounting or player-facing point fields', () => {
    const artifact = compileOrThrow(makeBasicFixture());
    const serialized = JSON.stringify({
      selections: artifact.selections,
      selectedProfileRefs: artifact.selectedProfileRefs,
      horizon: artifact.request.horizon,
      selectionProfile: artifact.request.selectionProfile,
    });
    for (const forbidden of [
      'additionalFeatureBudget',
      'selectedModules',
      'totalSpent',
      'remainingBudget',
      'carePoints',
      'informationActionCost',
      'settlement',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
