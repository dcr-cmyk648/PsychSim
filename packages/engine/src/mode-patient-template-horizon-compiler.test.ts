import {
  ModePatientTemplateHorizonArtifactSchema,
  ModePatientTemplateHorizonRequestSchema,
  type EncounterCareSetting,
  type PatientTemplate,
  type ProgressionMode,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileModePatientTemplateHorizon,
  verifyModePatientTemplateHorizonContext,
  verifyModePatientTemplateHorizonIntegrity,
} from './mode-patient-template-horizon-compiler';

const settings: readonly EncounterCareSetting[] = [
  'outpatient_psychiatry',
  'emergency_department',
  'inpatient_psychiatry',
  'consultation_liaison',
];

const template = (input: {
  readonly id: string;
  readonly lifecycle?: PatientTemplate['lifecycle'];
  readonly contentVersion?: string;
  readonly careSetting?: EncounterCareSetting;
  readonly patientPool?: PatientTemplate['patientPool'];
}): PatientTemplate => {
  const lifecycle = input.lifecycle ?? 'approved';
  const careSetting = input.careSetting ?? 'outpatient_psychiatry';
  return {
    schemaVersion: 1,
    contentVersion: input.contentVersion ?? '1.0.0',
    id: input.id,
    compilationMode: 'attachment_only.v6',
    internalLabel: `Synthetic ${input.id}`,
    lifecycle,
    medicalReviewStatus: 'unreviewed',
    review: {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    },
    patientPool: input.patientPool ?? 'starter',
    careSetting,
    focusedDecisionId: 'decision.test.mode-horizon',
    primaryPolicyRef: {
      id: 'decision-policy.test.mode-horizon',
      contentVersion: '1.0.0',
    },
    decisionActionHorizonId: 'decision-action-horizon.test.mode-horizon',
    decisionActionHorizonFingerprint:
      'fingerprint.catalog-instance.action-horizon.fnv1a64.0000000000000001',
    diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.mode-horizon',
    diagnosisSelectionHorizonFingerprint:
      'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000002',
    findingProjectionHorizonId: 'finding-projection-horizon.test.mode-horizon',
    findingProjectionHorizonFingerprint:
      'fingerprint.finding.projection-horizon.fnv1a64.0000000000000003',
    universalActionResultAssemblyRecipeRef: {
      id: 'universal-action-result-assembly.test.mode-horizon',
      contentVersion: '1.0.0',
    },
    universalActionResultAssemblyRecipeFingerprint:
      'fingerprint.universal-action-result.assembly-recipe.fnv1a64.0000000000000004',
    compatibleLocationRefs: [
      {
        id: `location.test.mode-horizon.${careSetting.replaceAll('_', '-')}`,
        contentVersion: '1.0.0',
      },
    ],
    requiredConditions: [
      {
        schemaVersion: 1,
        id: `template-condition.${input.id}`,
        diagnosisDefinitionId: 'diagnosis.test.mode-horizon',
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
      additionalFeatureBudget: 3,
      maximumSelectedModules: 3,
      selectedModules: [],
      targetEnvelope: null,
    },
    presentationRichnessEnvelope: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: `presentation-richness.${input.id}`,
      modelVersion: 'presentation-richness.v1',
      decisionDriverCategories: ['diagnostic_attribution'],
      priorEffortExpectation: { kind: 'not_required' },
    },
  };
};

const approvedTemplates = (): PatientTemplate[] =>
  settings.map((careSetting) =>
    template({
      id: `patient-template.test.mode-horizon.${careSetting.replaceAll('_', '-')}`,
      careSetting,
      patientPool: careSetting === 'outpatient_psychiatry' ? 'starter' : 'advanced',
    }),
  );

const request = (
  mode: ProgressionMode,
  approved: readonly PatientTemplate[] = approvedTemplates(),
  review: readonly PatientTemplate[] = [],
) => ({
  schemaVersion: 1 as const,
  contentVersion: '1.0.0',
  id: `mode-patient-template-horizon-request.test.${mode}`,
  modelVersion: 'mode-patient-template-horizon.v1' as const,
  mode,
  approvedTemplates: approved,
  explicitReviewTemplates: review,
});

const expectCompiled = (input: unknown) => {
  const result = compileModePatientTemplateHorizon(input);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

describe('mode patient-template horizon compiler', () => {
  it('materializes the same approved-only four-setting membership for Standard and Endgame without treating medical review as lifecycle approval', () => {
    const approved = approvedTemplates();
    expect(approved.every((entry) => entry.medicalReviewStatus === 'unreviewed')).toBe(true);
    const standard = expectCompiled(request('standard', approved));
    const endgame = expectCompiled(request('endgame', approved));

    expect(standard.sourceBoundary).toBe('approved_runtime');
    expect(endgame.sourceBoundary).toBe('approved_runtime');
    expect(standard.templates.map((entry) => entry.id)).toEqual(
      endgame.templates.map((entry) => entry.id),
    );
    expect(standard.members.map((member) => member.careSetting).sort()).toEqual(
      [...settings].sort(),
    );
    expect(standard.members.every((member) => member.medicalReviewStatus === 'unreviewed')).toBe(
      true,
    );
    expect(standard.members.every((member) => member.inclusionBasis === 'approved_runtime')).toBe(
      true,
    );
    for (const forbiddenField of [
      'clinicState',
      'locations',
      'resources',
      'weights',
      'probability',
      'points',
      'runHistory',
      'capacity',
      'seed',
    ]) {
      expect(Object.hasOwn(standard, forbiddenField)).toBe(false);
      expect(Object.hasOwn(standard.compileRequest, forbiddenField)).toBe(false);
    }
  });

  it('lets local Developer add only its explicit review lane while retaining setting and pool', () => {
    const approved = [approvedTemplates()[0]!];
    const review = [
      template({
        id: 'patient-template.test.mode-horizon.review-ed',
        lifecycle: 'review',
        careSetting: 'emergency_department',
        patientPool: 'advanced',
      }),
    ];
    const artifact = expectCompiled(request('developer', approved, review));

    expect(artifact.sourceBoundary).toBe('local_developer');
    expect(artifact.templates.map((entry) => entry.id)).toEqual(
      [approved[0]!.id, review[0]!.id].sort(),
    );
    expect(
      artifact.members.find((member) => member.templateRef.id === review[0]!.id),
    ).toMatchObject({
      lifecycle: 'review',
      medicalReviewStatus: 'unreviewed',
      careSetting: 'emergency_department',
      patientPool: 'advanced',
      inclusionBasis: 'developer_review',
    });
  });

  it('rejects review content outside Developer and rejects every template in the wrong lifecycle lane', () => {
    const approved = template({ id: 'patient-template.test.mode-horizon.approved' });
    const review = template({
      id: 'patient-template.test.mode-horizon.review',
      lifecycle: 'review',
    });
    const invalidInputs = [
      request('standard', [approved], [review]),
      request('endgame', [approved], [review]),
      request('developer', [review], []),
      request('developer', [approved], [approved]),
      request(
        'developer',
        [approved],
        [
          template({
            id: 'patient-template.test.mode-horizon.draft',
            lifecycle: 'draft',
          }),
        ],
      ),
      request('standard', [
        template({
          id: 'patient-template.test.mode-horizon.deprecated',
          lifecycle: 'deprecated',
        }),
      ]),
      request(
        'developer',
        [approved],
        [
          template({
            id: 'patient-template.test.mode-horizon.blueprint',
            lifecycle: 'blueprint',
          }),
        ],
      ),
    ];
    for (const input of invalidInputs) {
      expect(compileModePatientTemplateHorizon(input)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_REQUEST' },
      });
    }
  });

  it('rejects duplicate stable template IDs across versions or lanes instead of selecting a newest version', () => {
    const first = template({
      id: 'patient-template.test.mode-horizon.duplicate',
      contentVersion: '1.0.0',
    });
    const later = template({
      id: first.id,
      contentVersion: '2.0.0',
    });
    expect(compileModePatientTemplateHorizon(request('standard', [first, later]))).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const review = template({
      id: first.id,
      contentVersion: '2.0.0',
      lifecycle: 'review',
    });
    expect(
      compileModePatientTemplateHorizon(request('developer', [first], [review])),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('is deterministic, input-order invariant, immutable, and schema parsed', () => {
    const input = request('endgame');
    const before = structuredClone(input);
    const first = expectCompiled(input);
    const reordered = structuredClone(input);
    reordered.approvedTemplates = [...reordered.approvedTemplates].reverse();
    const second = expectCompiled(reordered);

    expect(input).toEqual(before);
    expect(second).toEqual(first);
    expect(ModePatientTemplateHorizonRequestSchema.parse(input)).toEqual(input);
    expect(ModePatientTemplateHorizonArtifactSchema.parse(first)).toEqual(first);
  });

  it('strictly rejects queue, seed, capacity, refill, resource, point, weight, and complexity authority', () => {
    const invalid = {
      ...request('developer', [approvedTemplates()[0]!]),
      seed: 'forbidden',
      runHistory: [],
      activeSlots: [],
      patientSlotCount: 99,
      capacity: 99,
      refill: true,
      reroll: true,
      resources: [],
      weight: 100,
      points: 100,
      complexityBudget: 100,
    };
    expect(compileModePatientTemplateHorizon(invalid)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('replays intrinsically and rejects obsolete or tampered artifacts', () => {
    const artifact = expectCompiled(request('endgame'));
    expect(verifyModePatientTemplateHorizonIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });

    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyModePatientTemplateHorizonIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });

    const templateTampered = structuredClone(artifact);
    templateTampered.templates[0]!.internalLabel = 'Divergent payload';
    expect(verifyModePatientTemplateHorizonIntegrity(templateTampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const memberTampered = structuredClone(artifact);
    memberTampered.members[0]!.careSetting =
      memberTampered.members[0]!.careSetting === 'outpatient_psychiatry'
        ? 'emergency_department'
        : 'outpatient_psychiatry';
    expect(verifyModePatientTemplateHorizonIntegrity(memberTampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });

  it('verifies only the exact current mode and explicit lifecycle lanes', () => {
    const exactRequest = request('endgame');
    const artifact = expectCompiled(exactRequest);
    const reordered = structuredClone(exactRequest);
    reordered.approvedTemplates = [...reordered.approvedTemplates].reverse();
    expect(verifyModePatientTemplateHorizonContext({ artifact, request: reordered })).toEqual({
      ok: true,
      value: artifact,
    });

    const changedMode = { ...structuredClone(exactRequest), mode: 'standard' as const };
    expect(
      verifyModePatientTemplateHorizonContext({ artifact, request: changedMode }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });

    const changedVersion = structuredClone(exactRequest);
    changedVersion.approvedTemplates[0]!.contentVersion = '2.0.0';
    expect(
      verifyModePatientTemplateHorizonContext({ artifact, request: changedVersion }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });

    const changedRequestId = {
      ...structuredClone(exactRequest),
      id: 'mode-patient-template-horizon-request.test.changed',
    };
    expect(
      verifyModePatientTemplateHorizonContext({ artifact, request: changedRequestId }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});
