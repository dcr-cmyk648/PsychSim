import {
  AdmittedTemplateLocationBindingArtifactSchema,
  LocationOwnedPatientSlotSelectionArtifactSchema,
  LocationTemplateSelectionArtifactSchema,
  ModePatientTemplateHorizonArtifactSchema,
  PatientTemplateLocationAdmissionMatrixArtifactSchema,
  PatientTemplateLocationAdmissionMatrixRequestSchema,
  type ClinicalRuleReview,
  type DecisionActionHorizon,
  type EncounterCareSetting,
  type InformationActionDefinition,
  type LocationDefinition,
  type PatientTemplate,
  type PatientTemplateLocationAdmissionMatrixRequest,
  type LocationTemplateDistributionProfile,
  type LocationTemplateLocalRepeatContext,
  type UniversalActionResultAssemblyRecipe,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import { fingerprintDecisionActionHorizon } from './catalog-instance-compiler';
import {
  compileAdmittedTemplateLocationBinding,
  verifyAdmittedTemplateLocationBindingContext,
  verifyAdmittedTemplateLocationBindingIntegrity,
} from './admitted-template-location-binding-compiler';
import {
  compileLocationOwnedPatientSlotSelection,
  verifyLocationOwnedPatientSlotSelectionContext,
  verifyLocationOwnedPatientSlotSelectionIntegrity,
} from './location-owned-patient-slot-selection-compiler';
import {
  compileLocationTemplateSelection,
  createLocationTemplateSelectionEligibilityOverlay,
  fingerprintLocationTemplateDistributionProfile,
  verifyLocationTemplateSelectionContext,
  verifyLocationTemplateSelectionIntegrity,
} from './location-template-selector';
import { compileModePatientTemplateHorizon } from './mode-patient-template-horizon-compiler';
import {
  compilePatientTemplateLocationAdmissionMatrix,
  fingerprintPatientTemplateLocationAdmissionLocation,
  verifyPatientTemplateLocationAdmissionMatrixContext,
  verifyPatientTemplateLocationAdmissionMatrixIntegrity,
} from './patient-template-location-admission-compiler';
import { fingerprintSelectedLocationUpgradeOwner } from './selected-location-operational-resource-compiler';
import {
  fingerprintInformationActionPayload,
  fingerprintUniversalActionResultAssemblyRecipe,
} from './universal-action-result-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T20:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.location-admission-matrix'],
};

const settings: readonly EncounterCareSetting[] = [
  'outpatient_psychiatry',
  'emergency_department',
  'inpatient_psychiatry',
  'consultation_liaison',
];

const locationId = (setting: EncounterCareSetting): string =>
  `location.test.admission-matrix.${setting.replaceAll('_', '-')}`;

const action: InformationActionDefinition = {
  id: 'info.history.test.admission-matrix',
  label: 'Synthetic focused history',
  searchAliases: [],
  category: 'history',
  soapSection: 'subjective',
  resultSource: 'patient_report',
  description: 'A neutral synthetic action used only for mechanical admission tests.',
  serviceId: 'service.test.admission-matrix.history',
  repeatable: false,
};

const actionHorizon = (): DecisionActionHorizon => ({
  schemaVersion: 1,
  id: 'decision-action-horizon.test.admission-matrix',
  informationActionIds: [action.id],
  startMedicationIds: ['medication.test.admission-matrix'],
  regimenEntryOperations: [],
  interventionIds: [],
  dispositionIds: ['disposition.test.admission-matrix.safe'],
});

const assemblyRecipe = (): UniversalActionResultAssemblyRecipe => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'universal-action-result-assembly.test.admission-matrix',
  modelVersion: 'universal-action-result-assembly.v3',
  actionCatalog: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'information-action-catalog.test.admission-matrix',
    actions: [action],
  },
  instrumentDefinitions: [],
  structuredRevealDefinitions: [],
  targetScopedPatientValueProjectionDefinitions: [],
  measurementDefinitions: [],
  categoricalObservationDefinitions: [],
  testDefinitions: [],
  recipes: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'universal-action-result-recipe.test.admission-matrix',
      modelVersion: 'universal-action-result.v1',
      informationActionId: action.id,
      informationActionPayloadFingerprint: fingerprintInformationActionPayload(action),
      sourceKinds: ['finding_projections'],
      lifecycle: 'approved',
      medicalReviewStatus: 'approved',
    },
  ],
});

const location = (setting: EncounterCareSetting, contentVersion = '1.0.0'): LocationDefinition => ({
  schemaVersion: 1,
  contentVersion,
  id: locationId(setting),
  label: `Synthetic ${setting}`,
  facilityTier: 'integrated_medical_center',
  careSetting: setting,
  ...(setting === 'outpatient_psychiatry'
    ? {}
    : { departmentId: `department.test.${setting.replaceAll('_', '-')}` }),
  capabilities: [],
  formularyId: 'formulary.test.admission-matrix',
  dispositionIds: ['disposition.test.admission-matrix.safe'],
});

const template = (input: {
  readonly setting: EncounterCareSetting;
  readonly actionHorizon: DecisionActionHorizon;
  readonly assembly: UniversalActionResultAssemblyRecipe;
}): PatientTemplate => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: `patient-template.test.admission-matrix.${input.setting.replaceAll('_', '-')}`,
  compilationMode: 'attachment_only.v6',
  internalLabel: `Synthetic ${input.setting} template`,
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  review: approvedReview,
  patientPool: input.setting === 'outpatient_psychiatry' ? 'starter' : 'advanced',
  careSetting: input.setting,
  focusedDecisionId: 'decision.test.admission-matrix.immediate',
  primaryPolicyRef: {
    id: 'decision-policy.test.admission-matrix',
    contentVersion: '1.0.0',
  },
  decisionActionHorizonId: input.actionHorizon.id,
  decisionActionHorizonFingerprint: fingerprintDecisionActionHorizon(input.actionHorizon),
  diagnosisSelectionHorizonId: 'diagnosis-selection-horizon.test.admission-matrix',
  diagnosisSelectionHorizonFingerprint:
    'fingerprint.catalog-instance.diagnosis-horizon.fnv1a64.0000000000000001',
  findingProjectionHorizonId: 'finding-projection-horizon.test.admission-matrix',
  findingProjectionHorizonFingerprint:
    'fingerprint.finding.projection-horizon.fnv1a64.0000000000000002',
  universalActionResultAssemblyRecipeRef: {
    id: input.assembly.id,
    contentVersion: input.assembly.contentVersion,
  },
  universalActionResultAssemblyRecipeFingerprint: fingerprintUniversalActionResultAssemblyRecipe(
    input.assembly,
  ),
  compatibleLocationRefs: [
    {
      id: locationId(input.setting),
      contentVersion: '1.0.0',
    },
  ],
  requiredConditions: [
    {
      schemaVersion: 1,
      id: `template-condition.test.admission-matrix.${input.setting.replaceAll('_', '-')}`,
      diagnosisDefinitionId: 'diagnosis.test.admission-matrix.focus',
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
    id: `presentation-richness.test.admission-matrix.${input.setting.replaceAll('_', '-')}`,
    modelVersion: 'presentation-richness.v1',
    decisionDriverCategories: ['diagnostic_attribution'],
    priorEffortExpectation: { kind: 'not_required' },
  },
});

const expectTemplateHorizon = (
  approvedTemplates: readonly PatientTemplate[],
  mode: 'standard' | 'endgame' | 'developer' = 'endgame',
  explicitReviewTemplates: readonly PatientTemplate[] = [],
) => {
  const result = compileModePatientTemplateHorizon({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `mode-patient-template-horizon-request.test.admission-matrix.${mode}`,
    modelVersion: 'mode-patient-template-horizon.v1',
    mode,
    approvedTemplates,
    explicitReviewTemplates,
  });
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  expect(ModePatientTemplateHorizonArtifactSchema.parse(result.value)).toEqual(result.value);
  return result.value;
};

const requestTemplates = (
  request: PatientTemplateLocationAdmissionMatrixRequest,
): readonly PatientTemplate[] => request.templateHorizonArtifact.templates;

const requestTemplateForSetting = (
  request: PatientTemplateLocationAdmissionMatrixRequest,
  careSetting: EncounterCareSetting,
): PatientTemplate => {
  const result = requestTemplates(request).find((entry) => entry.careSetting === careSetting);
  if (result === undefined) throw new Error(`Missing synthetic ${careSetting} template.`);
  return result;
};

const replaceRequestTemplates = (
  request: PatientTemplateLocationAdmissionMatrixRequest,
  templates: readonly PatientTemplate[],
): void => {
  request.templateHorizonArtifact = expectTemplateHorizon(
    templates,
    request.templateHorizonArtifact.mode,
  );
};

const makeRequest = (): PatientTemplateLocationAdmissionMatrixRequest => {
  const horizon = actionHorizon();
  const assembly = assemblyRecipe();
  const locations = settings.map((setting) => location(setting));
  const departmentIds = locations.flatMap((entry) =>
    entry.departmentId === undefined ? [] : [entry.departmentId],
  );
  return {
    schemaVersion: 1,
    id: 'patient-template-location-admission-matrix-request.test.synthetic',
    clinicOperationalContext: {
      schemaVersion: 1,
      modelVersion: 'clinic-operational-context.v1',
      clinicStateId: 'clinic.test.admission-matrix',
      facilityId: 'facility.test.admission-matrix',
      facilityTier: 'integrated_medical_center',
      locationIds: locations.map((entry) => entry.id),
      departmentIds,
      ownedUpgradeIds: [],
      ownedEquipmentIds: [],
      staffConfigurations: [],
      formularyIds: ['formulary.test.admission-matrix'],
    },
    facility: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'facility.test.admission-matrix',
      label: 'Synthetic integrated facility',
      tier: 'integrated_medical_center',
      minimumLifetimePoints: 0,
      patientSlotCount: 4,
      locationIds: locations.map((entry) => entry.id),
      defaultLocationId: locations[0]!.id,
      allowedDepartmentIds: departmentIds,
      allowedUpgradeIds: [],
    },
    locations,
    assignmentHorizon: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'location-resource-assignment-horizon.test.admission-matrix',
      modelVersion: 'clinic-location-resource-assignment-horizon.v1',
      clinicStateId: 'clinic.test.admission-matrix',
      assignments: locations.map((entry) => ({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `location-resource-assignment.test.${entry.careSetting.replaceAll('_', '-')}`,
        modelVersion: 'selected-location-operational-resource-assignment.v1',
        locationRef: { id: entry.id, contentVersion: entry.contentVersion },
        assignedUpgradeRefs: [],
        assignedFormularyRefs: [],
      })),
    },
    upgradeOwners: [],
    formularies: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'formulary.test.admission-matrix',
        label: 'Synthetic baseline formulary',
        medicationIds: ['medication.test.admission-matrix'],
      },
    ],
    templateHorizonArtifact: expectTemplateHorizon(
      settings.map((setting) => template({ setting, actionHorizon: horizon, assembly })),
    ),
    actionHorizons: [horizon],
    universalActionResultAssemblyRecipes: [assembly],
    services: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: action.serviceId,
        fulfillmentMethods: [
          {
            id: 'fulfillment.test.admission-matrix.history',
            requiredCapabilities: [],
          },
        ],
      },
    ],
    medications: [
      {
        id: 'medication.test.admission-matrix',
        contentVersion: '1.0.0',
      },
    ],
    treatments: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'disposition.test.admission-matrix.safe',
        label: 'Synthetic safe disposition',
        searchAliases: [],
        kind: 'disposition',
        category: 'disposition',
        safeReferral: true,
        requiredCapabilities: [],
        fulfillmentServiceId: null,
      },
    ],
  };
};

const expectMatrix = (request: unknown) => {
  const result = compilePatientTemplateLocationAdmissionMatrix(request);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

const expectSlotSelection = (input: {
  readonly request: PatientTemplateLocationAdmissionMatrixRequest;
  readonly matrix: ReturnType<typeof expectMatrix>;
  readonly location: LocationDefinition;
  readonly selectedAdmissionEvaluationId: string;
  readonly id?: string;
}) => {
  const result = compileLocationOwnedPatientSlotSelection({
    schemaVersion: 1,
    id: input.id ?? `location-owned-slot-selection-request.test.${input.location.careSetting}`,
    slotCoordinate: {
      schemaVersion: 1,
      id: `patient-slot.test.${input.location.id}`,
      locationRef: {
        id: input.location.id,
        contentVersion: input.location.contentVersion,
      },
    },
    admissionMatrixArtifact: input.matrix,
    currentAdmissionMatrixRequest: input.request,
    selectedAdmissionEvaluationId: input.selectedAdmissionEvaluationId,
  });
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

const distributionProfile = (input: {
  readonly matrix: ReturnType<typeof expectMatrix>;
  readonly location: LocationDefinition;
  readonly weights?: Readonly<Record<string, number>>;
  readonly activeMultiplierBasisPoints?: number;
  readonly recentMultiplierBasisPoints?: number;
  readonly recentCompletionWindowSize?: number;
}): LocationTemplateDistributionProfile => {
  const candidates = input.matrix.admissionEvaluations.filter(
    (entry) =>
      entry.locationRef.id === input.location.id &&
      entry.locationRef.contentVersion === input.location.contentVersion &&
      entry.status === 'admitted',
  );
  return {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `location-template-distribution.test.${input.location.id}`,
    modelVersion: 'location-template-distribution.v1',
    locationRef: {
      id: input.location.id,
      contentVersion: input.location.contentVersion,
    },
    locationFingerprint: fingerprintPatientTemplateLocationAdmissionLocation(input.location),
    templateWeights: candidates.map((candidate) => ({
      templateRef: candidate.templateRef,
      templateFingerprint: candidate.templateFingerprint,
      gameSelectionWeight: input.weights?.[candidate.templateRef.id] ?? 8,
    })),
    repeatSuppression: {
      activeWaitingMultiplierBasisPoints: input.activeMultiplierBasisPoints ?? 2_500,
      recentCompletionMultiplierBasisPoints: input.recentMultiplierBasisPoints ?? 5_000,
      recentCompletionWindowSize: input.recentCompletionWindowSize ?? 8,
    },
  };
};

const repeatContext = (input: {
  readonly location: LocationDefinition;
  readonly active?: LocationTemplateLocalRepeatContext['activeWaitingAssignments'];
  readonly recent?: readonly string[];
}): LocationTemplateLocalRepeatContext => ({
  schemaVersion: 1,
  id: `location-template-repeat-context.test.${input.location.id}`,
  locationRef: {
    id: input.location.id,
    contentVersion: input.location.contentVersion,
  },
  activeWaitingAssignments: input.active ? [...input.active] : [],
  recentCompletedTemplateIdsNewestFirst: input.recent ? [...input.recent] : [],
});

const allAdmittedEligibilityOverlay = (input: {
  readonly matrix: ReturnType<typeof expectMatrix>;
  readonly location: LocationDefinition;
}) =>
  createLocationTemplateSelectionEligibilityOverlay({
    mode: 'endgame',
    basis: 'all_admitted',
    sourceRunHistoryRef: null,
    eligibleTemplates: input.matrix.admissionEvaluations.flatMap((evaluation) =>
      evaluation.status === 'admitted' &&
      evaluation.locationRef.id === input.location.id &&
      evaluation.locationRef.contentVersion === input.location.contentVersion
        ? [
            {
              templateRef: evaluation.templateRef,
              templateFingerprint: evaluation.templateFingerprint,
            },
          ]
        : [],
    ),
  });

const expectTemplateSelection = (input: {
  readonly request: PatientTemplateLocationAdmissionMatrixRequest;
  readonly matrix: ReturnType<typeof expectMatrix>;
  readonly location: LocationDefinition;
  readonly profile?: LocationTemplateDistributionProfile;
  readonly repeats?: LocationTemplateLocalRepeatContext;
  readonly seed?: string;
  readonly id?: string;
  readonly slotCoordinateId?: string;
}) => {
  const result = compileLocationTemplateSelection({
    schemaVersion: 1,
    id: input.id ?? `location-template-selection-request.test.${input.location.careSetting}`,
    seed: input.seed ?? 'location-template-selection-seed.test',
    slotCoordinate: {
      schemaVersion: 1,
      id: input.slotCoordinateId ?? `patient-slot.test.d230.${input.location.id}`,
      locationRef: {
        id: input.location.id,
        contentVersion: input.location.contentVersion,
      },
    },
    admissionMatrixArtifact: input.matrix,
    currentAdmissionMatrixRequest: input.request,
    distributionProfile:
      input.profile ?? distributionProfile({ matrix: input.matrix, location: input.location }),
    localRepeatContext: input.repeats ?? repeatContext({ location: input.location }),
    eligibilityOverlay: allAdmittedEligibilityOverlay({
      matrix: input.matrix,
      location: input.location,
    }),
  });
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
};

describe('patient-template location-admission matrix compiler', () => {
  it('compiles the exact four-setting diagonal with one D-222 per built location', () => {
    const request = makeRequest();
    expect(PatientTemplateLocationAdmissionMatrixRequestSchema.parse(request)).toEqual(request);
    const artifact = expectMatrix(request);
    expect(PatientTemplateLocationAdmissionMatrixArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.compilerVersion).toBe('3.0.0');
    expect(artifact.locationResourceEvaluations).toHaveLength(4);
    expect(artifact.locationResourceEvaluations.every((entry) => entry.status === 'complete')).toBe(
      true,
    );
    expect(
      new Set(artifact.locationResourceEvaluations.map((entry) => entry.artifact?.id)).size,
    ).toBe(4);
    expect(artifact.admissionEvaluations).toHaveLength(16);
    const admitted = artifact.admissionEvaluations.filter(
      (evaluation) => evaluation.status === 'admitted',
    );
    expect(admitted).toHaveLength(4);
    expect(admitted.map((evaluation) => evaluation.templateCareSetting).sort()).toEqual(
      [...settings].sort(),
    );
    for (const evaluation of admitted) {
      expect(evaluation.templateCareSetting).toBe(evaluation.locationCareSetting);
      expect(evaluation.operationalAdmissionArtifact?.status).toBe('complete');
      expect(evaluation.diagnostics).toEqual([]);
    }
    expect(
      artifact.admissionEvaluations.filter(
        (evaluation) => evaluation.status === 'not_declared_compatible',
      ),
    ).toHaveLength(12);
    expect(verifyPatientTemplateLocationAdmissionMatrixIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(verifyPatientTemplateLocationAdmissionMatrixContext({ artifact, request })).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('is deterministic, order-invariant at catalog boundaries, and immutable', () => {
    const request = makeRequest();
    const before = structuredClone(request);
    const first = expectMatrix(request);
    expect(request).toEqual(before);
    const reordered = structuredClone(request);
    reordered.locations.reverse();
    replaceRequestTemplates(reordered, [...requestTemplates(reordered)].reverse());
    reordered.assignmentHorizon.assignments.reverse();
    reordered.facility.locationIds.reverse();
    reordered.clinicOperationalContext.locationIds.reverse();
    expect(expectMatrix(reordered)).toEqual(first);
  });

  it('accepts only the verified D-231 horizon and rejects the legacy free-template seam', () => {
    const request = makeRequest();
    const withLegacyTemplates = {
      ...structuredClone(request),
      templates: structuredClone(requestTemplates(request)),
    };
    expect(compilePatientTemplateLocationAdmissionMatrix(withLegacyTemplates)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const tamperedHorizon = structuredClone(request);
    tamperedHorizon.templateHorizonArtifact.templates[0]!.internalLabel =
      'Same identity, divergent D-231 template payload';
    expect(compilePatientTemplateLocationAdmissionMatrix(tamperedHorizon)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TEMPLATE_HORIZON' },
    });
  });

  it('does not let Endgame mode grant locations or resources that are absent from the concrete clinic context', () => {
    const request = makeRequest();
    const outpatient = request.locations.find(
      (location) => location.careSetting === 'outpatient_psychiatry',
    )!;
    request.locations = [outpatient];
    request.clinicOperationalContext.locationIds = [outpatient.id];
    request.clinicOperationalContext.departmentIds = [];
    request.facility.locationIds = [outpatient.id];
    request.facility.defaultLocationId = outpatient.id;
    request.assignmentHorizon.assignments = request.assignmentHorizon.assignments.filter(
      (assignment) => assignment.locationRef.id === outpatient.id,
    );

    const artifact = expectMatrix(request);
    expect(request.templateHorizonArtifact.mode).toBe('endgame');
    expect(artifact.locationResourceEvaluations).toHaveLength(1);
    expect(artifact.admissionEvaluations).toHaveLength(4);
    expect(
      artifact.admissionEvaluations.filter((evaluation) => evaluation.status === 'admitted'),
    ).toHaveLength(1);
    expect(
      artifact.admissionEvaluations
        .filter((evaluation) => evaluation.status === 'admitted')
        .map((evaluation) => evaluation.templateCareSetting),
    ).toEqual(['outpatient_psychiatry']);
  });

  it('admits an explicit Developer review template only through D-231 and still requires its real matching context', () => {
    const request = makeRequest();
    const reviewTemplate = structuredClone(
      requestTemplateForSetting(request, 'outpatient_psychiatry'),
    );
    reviewTemplate.id = 'patient-template.test.admission-matrix.developer-review';
    reviewTemplate.internalLabel = 'Synthetic explicit Developer review template';
    reviewTemplate.lifecycle = 'review';
    reviewTemplate.medicalReviewStatus = 'unreviewed';
    reviewTemplate.review = {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    reviewTemplate.requiredConditions[0]!.id =
      'template-condition.test.admission-matrix.developer-review';
    reviewTemplate.presentationRichnessEnvelope.id =
      'presentation-richness.test.admission-matrix.developer-review';
    request.templateHorizonArtifact = expectTemplateHorizon(
      requestTemplates(request),
      'developer',
      [reviewTemplate],
    );

    const artifact = expectMatrix(request);
    expect(
      artifact.admissionEvaluations.find(
        (evaluation) =>
          evaluation.templateRef.id === reviewTemplate.id &&
          evaluation.locationCareSetting === 'outpatient_psychiatry',
      ),
    ).toMatchObject({
      status: 'admitted',
      templateCareSetting: 'outpatient_psychiatry',
      diagnostics: [],
    });
    expect(
      artifact.admissionEvaluations
        .filter(
          (evaluation) =>
            evaluation.templateRef.id === reviewTemplate.id &&
            evaluation.locationCareSetting !== 'outpatient_psychiatry',
        )
        .every((evaluation) => evaluation.status === 'not_declared_compatible'),
    ).toBe(true);
  });

  it('treats a stale exact location reference as coverage, never an implicit upgrade', () => {
    const request = makeRequest();
    const templates = [...structuredClone(requestTemplates(request))];
    const outpatientTemplate = templates.find(
      (entry) => entry.careSetting === 'outpatient_psychiatry',
    )!;
    outpatientTemplate.compatibleLocationRefs[0]!.contentVersion = '0.9.0';
    replaceRequestTemplates(request, templates);
    const artifact = expectMatrix(request);
    const evaluation = artifact.admissionEvaluations.find(
      (entry) =>
        entry.templateRef.id === outpatientTemplate.id &&
        entry.locationRef.id === request.locations[0]!.id,
    );
    expect(evaluation).toMatchObject({
      status: 'stale_location_reference',
      operationalAdmissionArtifact: null,
      diagnostics: [{ code: 'stale_location_reference' }],
    });
    expect(
      artifact.admissionEvaluations.filter((entry) => entry.status === 'admitted'),
    ).toHaveLength(3);
  });

  it('uses the exact compatible-location reference when two built locations share one setting', () => {
    const request = makeRequest();
    const originalLocation = request.locations[0]!;
    const secondLocation = {
      ...structuredClone(originalLocation),
      id: 'location.test.admission-matrix.outpatient-psychiatry.second',
      label: 'Synthetic second outpatient location',
    };
    request.locations.push(secondLocation);
    request.clinicOperationalContext.locationIds.push(secondLocation.id);
    request.facility.locationIds.push(secondLocation.id);
    request.assignmentHorizon.assignments.push({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'location-resource-assignment.test.outpatient-psychiatry.second',
      modelVersion: 'selected-location-operational-resource-assignment.v1',
      locationRef: {
        id: secondLocation.id,
        contentVersion: secondLocation.contentVersion,
      },
      assignedUpgradeRefs: [],
      assignedFormularyRefs: [],
    });

    const artifact = expectMatrix(request);
    const outpatientTemplate = requestTemplates(request).find(
      (candidate) => candidate.careSetting === 'outpatient_psychiatry',
    )!;
    expect(
      artifact.admissionEvaluations.find(
        (evaluation) =>
          evaluation.templateRef.id === outpatientTemplate.id &&
          evaluation.locationRef.id === originalLocation.id,
      )?.status,
    ).toBe('admitted');
    expect(
      artifact.admissionEvaluations.find(
        (evaluation) =>
          evaluation.templateRef.id === outpatientTemplate.id &&
          evaluation.locationRef.id === secondLocation.id,
      )?.status,
    ).toBe('not_declared_compatible');
  });

  it('treats an exact compatible but currently unbuilt location as neutral', () => {
    const request = makeRequest();
    const unbuiltLocationId = 'location.test.admission-matrix.unbuilt-consult';
    const templates = [...structuredClone(requestTemplates(request))];
    templates
      .find((entry) => entry.careSetting === 'outpatient_psychiatry')!
      .compatibleLocationRefs.push({
        id: unbuiltLocationId,
        contentVersion: '1.0.0',
      });
    replaceRequestTemplates(request, templates);

    const artifact = expectMatrix(request);
    expect(
      artifact.admissionEvaluations.some(
        (evaluation) => evaluation.locationRef.id === unbuiltLocationId,
      ),
    ).toBe(false);
    expect(
      artifact.locationResourceEvaluations.some(
        (evaluation) => evaluation.locationRef.id === unbuiltLocationId,
      ),
    ).toBe(false);
    expect(
      artifact.admissionEvaluations.filter((evaluation) => evaluation.status === 'admitted'),
    ).toHaveLength(4);
    expect(
      artifact.admissionEvaluations
        .flatMap((evaluation) => evaluation.diagnostics)
        .every((entry) => !entry.contentIds.includes(unbuiltLocationId)),
    ).toBe(true);
  });

  it('does not select or spend any template complexity while checking admission', () => {
    const request = makeRequest();
    const before = requestTemplates(request).map((entry) =>
      structuredClone(entry.complexityProfile),
    );
    const artifact = expectMatrix(request);
    expect(
      artifact.compileRequest.templateHorizonArtifact.templates.map(
        (entry) => entry.complexityProfile,
      ),
    ).toEqual(before);
    expect(
      artifact.compileRequest.templateHorizonArtifact.templates.every(
        (entry) =>
          entry.complexityProfile.selectedModules.length === 0 &&
          entry.complexityProfile.additionalFeatureBudget === 3,
      ),
    ).toBe(true);
    expect(JSON.stringify(artifact.admissionEvaluations)).not.toMatch(
      /totalSpent|remainingBudget|selectionOrdinal|stableDraw/,
    );
  });

  it('does not treat a care-setting label or excluded clinic-global capability as a grant', () => {
    const request = makeRequest();
    request.services[0]!.fulfillmentMethods[0]!.requiredCapabilities = [
      'capability.test.global-only',
    ];
    const artifact = expectMatrix(request);
    const declared = artifact.admissionEvaluations.filter(
      (evaluation) =>
        evaluation.templateRef.id.replace(
          'patient-template.test.admission-matrix.',
          'location.test.admission-matrix.',
        ) === evaluation.locationRef.id,
    );
    expect(declared).toHaveLength(4);
    expect(
      declared.every((evaluation) => evaluation.status === 'operational_coverage_incomplete'),
    ).toBe(true);
    for (const evaluation of declared) {
      expect(
        evaluation.operationalAdmissionArtifact?.informationActionEvaluations[0]?.availability,
      ).toBe('unavailable');
      expect(
        evaluation.operationalAdmissionArtifact?.informationActionEvaluations[0]
          ?.fulfillmentMethods[0]?.missingCapabilityIds,
      ).toEqual(['capability.test.global-only']);
    }
  });

  it('retains incomplete selected-location resources without deleting other contexts', () => {
    const request = makeRequest();
    const missingLocationId = request.locations[1]!.id;
    request.locations[1]!.formularyId = 'formulary.test.admission-matrix.missing';
    const artifact = expectMatrix(request);
    const resource = artifact.locationResourceEvaluations.find(
      (evaluation) => evaluation.locationRef.id === missingLocationId,
    );
    expect(resource).toMatchObject({
      status: 'incomplete_coverage',
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: 'location_resource_incomplete' }),
      ]),
    });
    const declaredCell = artifact.admissionEvaluations.find(
      (evaluation) =>
        evaluation.locationRef.id === missingLocationId &&
        evaluation.templateCareSetting === 'emergency_department',
    );
    expect(declaredCell).toMatchObject({
      status: 'location_resource_incomplete',
      operationalAdmissionArtifact: null,
    });
    expect(
      artifact.admissionEvaluations.filter((evaluation) => evaluation.status === 'admitted'),
    ).toHaveLength(3);
  });

  it('preserves duplicate automatic actions so D-222 diagnoses the malformed staff configuration', () => {
    const request = makeRequest();
    const selectedLocation = request.locations[0]!;
    const staffOwner = {
      schemaVersion: 1 as const,
      contentVersion: '1.0.0',
      id: 'upgrade.test.admission-matrix.staff',
      kind: 'staff' as const,
      locationAssignmentMode: 'exclusive_location' as const,
      allowedFacilityTiers: ['integrated_medical_center' as const],
      requiredDepartmentId: null,
      grantsCapabilities: [],
      grantsFormularyIds: [],
      staffAutomation: {
        eligibleInformationActionIds: [action.id],
        maximumAutomaticActions: 1,
      },
    };
    request.upgradeOwners.push(staffOwner);
    request.clinicOperationalContext.ownedUpgradeIds.push(staffOwner.id);
    request.facility.allowedUpgradeIds.push(staffOwner.id);
    request.clinicOperationalContext.staffConfigurations.push({
      staffUpgradeId: staffOwner.id,
      automaticInformationActionIds: [action.id, action.id],
    });
    request.assignmentHorizon.assignments[0]!.assignedUpgradeRefs.push({
      id: staffOwner.id,
      contentVersion: staffOwner.contentVersion,
      kind: staffOwner.kind,
      fingerprint: fingerprintSelectedLocationUpgradeOwner(staffOwner),
    });

    const artifact = expectMatrix(request);
    const resource = artifact.locationResourceEvaluations.find(
      (evaluation) => evaluation.locationRef.id === selectedLocation.id,
    );
    expect(resource).toMatchObject({ status: 'incomplete_coverage' });
    expect(
      resource?.artifact?.diagnostics.some((entry) => entry.code === 'staff_configuration_invalid'),
    ).toBe(true);
    expect(
      artifact.admissionEvaluations.find(
        (evaluation) =>
          evaluation.locationRef.id === selectedLocation.id &&
          evaluation.templateCareSetting === selectedLocation.careSetting,
      )?.status,
    ).toBe('location_resource_incomplete');
  });

  it('preserves duplicate formulary membership so D-222 rejects the malformed resource owner', () => {
    const request = makeRequest();
    request.formularies[0]!.medicationIds.push('medication.test.admission-matrix');

    const artifact = expectMatrix(request);
    expect(
      artifact.locationResourceEvaluations.every(
        (evaluation) => evaluation.status === 'compile_failed',
      ),
    ).toBe(true);
    const declaredPairs = artifact.admissionEvaluations.filter(
      (evaluation) => evaluation.templateCareSetting === evaluation.locationCareSetting,
    );
    expect(declaredPairs).toHaveLength(4);
    expect(
      declaredPairs.every((evaluation) => evaluation.status === 'location_resource_incomplete'),
    ).toBe(true);
    expect(
      declaredPairs.every((evaluation) =>
        evaluation.diagnostics.some((entry) => entry.code === 'location_resource_incomplete'),
      ),
    ).toBe(true);
  });

  it('uses exact effective-formulary membership and retains D-219 itemized coverage', () => {
    const request = makeRequest();
    request.formularies[0]!.medicationIds = [];
    const artifact = expectMatrix(request);
    const admittedPairs = artifact.admissionEvaluations.filter(
      (evaluation) =>
        evaluation.templateCareSetting === evaluation.locationCareSetting &&
        evaluation.templateRef.id.endsWith(evaluation.locationCareSetting.replaceAll('_', '-')),
    );
    expect(
      admittedPairs.every((evaluation) => evaluation.status === 'operational_coverage_incomplete'),
    ).toBe(true);
    for (const evaluation of admittedPairs) {
      expect(
        evaluation.operationalAdmissionArtifact?.startMedicationEvaluations[0]?.availability,
      ).toBe('unavailable');
      expect(
        evaluation.operationalAdmissionArtifact?.diagnostics.some(
          (entry) => entry.code === 'start_medication_not_in_effective_formulary',
        ),
      ).toBe(true);
    }
  });

  it('diagnoses missing template dependencies without construing them as patient invalidity', () => {
    const request = makeRequest();
    request.universalActionResultAssemblyRecipes = [];
    const artifact = expectMatrix(request);
    const declaredPairs = artifact.admissionEvaluations.filter(
      (evaluation) => evaluation.templateCareSetting === evaluation.locationCareSetting,
    );
    expect(declaredPairs).toHaveLength(4);
    expect(
      declaredPairs.every((evaluation) => evaluation.status === 'template_dependency_invalid'),
    ).toBe(true);
    expect(
      declaredPairs.every(
        (evaluation) => evaluation.diagnostics[0]?.code === 'assembly_recipe_missing',
      ),
    ).toBe(true);
  });

  it('rejects malformed context, nested tampering, obsolete versions, and stale context', () => {
    const malformed = makeRequest();
    malformed.locations.pop();
    expect(compilePatientTemplateLocationAdmissionMatrix(malformed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const request = makeRequest();
    const artifact = expectMatrix(request);
    const tampered = structuredClone(artifact);
    tampered.admissionEvaluations[0]!.patientPool =
      tampered.admissionEvaluations[0]!.patientPool === 'starter' ? 'advanced' : 'starter';
    expect(verifyPatientTemplateLocationAdmissionMatrixIntegrity(tampered).ok).toBe(false);

    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyPatientTemplateLocationAdmissionMatrixIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });

    const currentChanged = structuredClone(request);
    currentChanged.clinicOperationalContext.formularyIds.push(
      'formulary.test.admission-matrix.current-change',
    );
    expect(
      verifyPatientTemplateLocationAdmissionMatrixContext({
        artifact,
        request: currentChanged,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'CONTEXT_MISMATCH' },
    });
  });
});

describe('admitted template/location binding compiler', () => {
  it('binds each caller-named admitted cell across all four settings without selecting or spending complexity', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    const admitted = matrix.admissionEvaluations.filter(
      (evaluation) => evaluation.status === 'admitted',
    );
    expect(admitted).toHaveLength(4);

    for (const cell of admitted) {
      const before = structuredClone(
        matrix.compileRequest.templateHorizonArtifact.templates.find(
          (entry) => entry.id === cell.templateRef.id,
        )!.complexityProfile,
      );
      const result = compileAdmittedTemplateLocationBinding({
        schemaVersion: 1,
        id: `admitted-template-location-binding-request.test.${cell.templateCareSetting}`,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        admissionEvaluationId: cell.id,
      });
      if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
      const artifact = result.value;
      expect(AdmittedTemplateLocationBindingArtifactSchema.parse(artifact)).toEqual(artifact);
      expect(artifact.compilerVersion).toBe('2.0.0');
      expect(artifact.careSetting).toBe(cell.templateCareSetting);
      expect(artifact.patientPool).toBe(cell.patientPool);
      expect(artifact.operationalAdmissionArtifact).toEqual(cell.operationalAdmissionArtifact);
      expect(Object.hasOwn(artifact, 'admissionMatrixArtifact')).toBe(false);
      expect(Object.hasOwn(artifact.bindingRequest, 'admissionMatrixArtifact')).toBe(false);
      expect(artifact.template.complexityProfile).toEqual(before);
      expect(verifyAdmittedTemplateLocationBindingIntegrity(artifact)).toEqual({
        ok: true,
        value: artifact,
      });
      expect(
        verifyAdmittedTemplateLocationBindingContext({
          artifact,
          admissionMatrixArtifact: matrix,
          currentAdmissionMatrixRequest: request,
        }),
      ).toEqual({ ok: true, value: artifact });
    }
  });

  it('rejects unknown, nonadmitted, resource-incomplete, and operationally incomplete cells', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    expect(
      compileAdmittedTemplateLocationBinding({
        schemaVersion: 1,
        id: 'admitted-template-location-binding-request.test.unknown',
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        admissionEvaluationId: 'admission-cell.test.unknown',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'ADMISSION_CELL_NOT_FOUND' },
    });

    const offDiagonal = matrix.admissionEvaluations.find(
      (evaluation) => evaluation.status === 'not_declared_compatible',
    )!;
    expect(
      compileAdmittedTemplateLocationBinding({
        schemaVersion: 1,
        id: 'admitted-template-location-binding-request.test.off-diagonal',
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        admissionEvaluationId: offDiagonal.id,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'ADMISSION_CELL_NOT_ADMITTED' },
    });

    const resourceIncompleteRequest = makeRequest();
    resourceIncompleteRequest.assignmentHorizon.assignments.shift();
    const resourceIncompleteMatrix = expectMatrix(resourceIncompleteRequest);
    const resourceIncompleteCell = resourceIncompleteMatrix.admissionEvaluations.find(
      (evaluation) =>
        evaluation.templateCareSetting === evaluation.locationCareSetting &&
        evaluation.status !== 'admitted',
    )!;
    expect(resourceIncompleteCell).toBeDefined();
    expect(
      compileAdmittedTemplateLocationBinding({
        schemaVersion: 1,
        id: 'admitted-template-location-binding-request.test.resource-incomplete',
        admissionMatrixArtifact: resourceIncompleteMatrix,
        currentAdmissionMatrixRequest: resourceIncompleteRequest,
        admissionEvaluationId: resourceIncompleteCell.id,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'ADMISSION_CELL_NOT_ADMITTED' },
    });

    const operationallyIncompleteRequest = makeRequest();
    operationallyIncompleteRequest.formularies[0]!.medicationIds = [];
    const operationallyIncompleteMatrix = expectMatrix(operationallyIncompleteRequest);
    const operationallyIncompleteCell = operationallyIncompleteMatrix.admissionEvaluations.find(
      (evaluation) => evaluation.status === 'operational_coverage_incomplete',
    )!;
    expect(
      compileAdmittedTemplateLocationBinding({
        schemaVersion: 1,
        id: 'admitted-template-location-binding-request.test.operationally-incomplete',
        admissionMatrixArtifact: operationallyIncompleteMatrix,
        currentAdmissionMatrixRequest: operationallyIncompleteRequest,
        admissionEvaluationId: operationallyIncompleteCell.id,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'ADMISSION_CELL_NOT_ADMITTED' },
    });
  });

  it('rejects crossed current context, forbidden selection fields, and intrinsic tampering', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    const cell = matrix.admissionEvaluations.find(
      (evaluation) => evaluation.status === 'admitted',
    )!;
    const compiled = compileAdmittedTemplateLocationBinding({
      schemaVersion: 1,
      id: 'admitted-template-location-binding-request.test.integrity',
      admissionMatrixArtifact: matrix,
      currentAdmissionMatrixRequest: request,
      admissionEvaluationId: cell.id,
    });
    if (!compiled.ok) throw new Error(compiled.error.message);
    const artifact = compiled.value;

    const changedContext = structuredClone(request);
    changedContext.clinicOperationalContext.formularyIds.push(
      'formulary.test.admission-matrix.changed',
    );
    expect(
      verifyAdmittedTemplateLocationBindingContext({
        artifact,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: changedContext,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'MATRIX_CONTEXT_MISMATCH' },
    });

    expect(
      compileAdmittedTemplateLocationBinding({
        schemaVersion: 1,
        id: 'admitted-template-location-binding-request.test.forbidden',
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        admissionEvaluationId: cell.id,
        seed: 'forbidden',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });

    const tamperedPool = structuredClone(artifact);
    tamperedPool.patientPool = tamperedPool.patientPool === 'starter' ? 'advanced' : 'starter';
    expect(verifyAdmittedTemplateLocationBindingIntegrity(tamperedPool).ok).toBe(false);

    const tamperedTemplate = structuredClone(artifact);
    tamperedTemplate.template.internalLabel = 'Same identity, divergent template payload';
    expect(verifyAdmittedTemplateLocationBindingIntegrity(tamperedTemplate).ok).toBe(false);

    const tamperedLocation = structuredClone(artifact);
    tamperedLocation.location.label = 'Same identity, divergent location payload';
    expect(verifyAdmittedTemplateLocationBindingIntegrity(tamperedLocation).ok).toBe(false);

    const tamperedOperational = structuredClone(artifact);
    tamperedOperational.operationalAdmissionArtifact.informationActionEvaluations[0]!.availability =
      'unavailable';
    expect(verifyAdmittedTemplateLocationBindingIntegrity(tamperedOperational).ok).toBe(false);

    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyAdmittedTemplateLocationBindingIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });
  });
});

describe('location-owned patient-slot selection compiler', () => {
  it('certifies one exact local candidate across all four settings without selecting or spending complexity', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    const admitted = matrix.admissionEvaluations.filter((entry) => entry.status === 'admitted');
    expect(admitted).toHaveLength(4);

    for (const cell of admitted) {
      const selectedLocation = request.locations.find((entry) => entry.id === cell.locationRef.id)!;
      const before = structuredClone(
        requestTemplates(request).find((entry) => entry.id === cell.templateRef.id)!
          .complexityProfile,
      );
      const artifact = expectSlotSelection({
        request,
        matrix,
        location: selectedLocation,
        selectedAdmissionEvaluationId: cell.id,
      });
      expect(LocationOwnedPatientSlotSelectionArtifactSchema.parse(artifact)).toEqual(artifact);
      expect(artifact.compilerVersion).toBe('2.0.0');
      expect(artifact.slotCoordinate).toMatchObject({
        locationRef: cell.locationRef,
        careSetting: cell.locationCareSetting,
      });
      expect(artifact.mechanicallyAdmittedCandidates).toEqual([
        {
          schemaVersion: 1,
          admissionEvaluationId: cell.id,
          templateRef: cell.templateRef,
          templateFingerprint: cell.templateFingerprint,
          patientPool: cell.patientPool,
          careSetting: cell.templateCareSetting,
        },
      ]);
      expect(artifact.admittedTemplateLocationBindingArtifact.admissionEvaluationId).toBe(cell.id);
      expect(artifact.admittedTemplateLocationBindingArtifact.template.complexityProfile).toEqual(
        before,
      );
      expect(Object.hasOwn(artifact, 'admissionMatrixArtifact')).toBe(false);
      expect(Object.hasOwn(artifact.selectionRequest, 'admissionMatrixArtifact')).toBe(false);
      expect(JSON.stringify(artifact)).not.toMatch(
        /totalSpent|remainingBudget|selectionOrdinal|stableDraw/,
      );
      expect(verifyLocationOwnedPatientSlotSelectionIntegrity(artifact)).toEqual({
        ok: true,
        value: artifact,
      });
      expect(
        verifyLocationOwnedPatientSlotSelectionContext({
          artifact,
          admissionMatrixArtifact: matrix,
          currentAdmissionMatrixRequest: request,
        }),
      ).toEqual({ ok: true, value: artifact });
    }
  });

  it('retains the complete sorted local admitted horizon and is deterministic', () => {
    const request = makeRequest();
    const selectedLocation = request.locations[0]!;
    const templates = [...structuredClone(requestTemplates(request))];
    const alternative = structuredClone(
      templates.find((entry) => entry.careSetting === 'outpatient_psychiatry')!,
    );
    alternative.id = 'patient-template.test.admission-matrix.outpatient-psychiatry.alternative';
    alternative.internalLabel = 'Synthetic alternative outpatient template';
    alternative.patientPool = 'transitional';
    alternative.requiredConditions[0]!.id =
      'template-condition.test.admission-matrix.outpatient-psychiatry.alternative';
    alternative.presentationRichnessEnvelope.id =
      'presentation-richness.test.admission-matrix.outpatient-psychiatry.alternative';
    templates.push(alternative);
    replaceRequestTemplates(request, templates);
    const matrix = expectMatrix(request);
    const localAdmitted = matrix.admissionEvaluations.filter(
      (entry) => entry.locationRef.id === selectedLocation.id && entry.status === 'admitted',
    );
    expect(localAdmitted).toHaveLength(2);
    const selected = localAdmitted.find((entry) => entry.templateRef.id === alternative.id)!;
    const before = structuredClone({ request, matrix });
    const first = expectSlotSelection({
      request,
      matrix,
      location: selectedLocation,
      selectedAdmissionEvaluationId: selected.id,
      id: 'location-owned-slot-selection-request.test.exhaustive',
    });
    const second = expectSlotSelection({
      request,
      matrix,
      location: selectedLocation,
      selectedAdmissionEvaluationId: selected.id,
      id: 'location-owned-slot-selection-request.test.exhaustive',
    });
    expect(first).toEqual(second);
    expect({ request, matrix }).toEqual(before);
    expect(first.mechanicallyAdmittedCandidates.map((entry) => entry.templateRef.id)).toEqual(
      [...localAdmitted]
        .sort((left, right) => {
          const leftKey = `${left.templateRef.id}@${left.templateRef.contentVersion}\u0000${left.id}`;
          const rightKey = `${right.templateRef.id}@${right.templateRef.contentVersion}\u0000${right.id}`;
          return leftKey === rightKey ? 0 : leftKey < rightKey ? -1 : 1;
        })
        .map((entry) => entry.templateRef.id),
    );
    expect(first.admittedTemplateLocationBindingArtifact.template.id).toBe(alternative.id);
    expect(first.admittedTemplateLocationBindingArtifact.patientPool).toBe('transitional');
  });

  it('isolates two same-setting physical locations and never selects across them', () => {
    const request = makeRequest();
    const firstLocation = request.locations[0]!;
    const secondLocation = {
      ...structuredClone(firstLocation),
      id: 'location.test.admission-matrix.outpatient-psychiatry.second',
      label: 'Synthetic second outpatient location',
    };
    request.locations.push(secondLocation);
    request.clinicOperationalContext.locationIds.push(secondLocation.id);
    request.facility.locationIds.push(secondLocation.id);
    request.assignmentHorizon.assignments.push({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'location-resource-assignment.test.outpatient-psychiatry.second',
      modelVersion: 'selected-location-operational-resource-assignment.v1',
      locationRef: { id: secondLocation.id, contentVersion: secondLocation.contentVersion },
      assignedUpgradeRefs: [],
      assignedFormularyRefs: [],
    });
    const templates = [...structuredClone(requestTemplates(request))];
    const firstTemplate = templates.find((entry) => entry.careSetting === 'outpatient_psychiatry')!;
    const secondTemplate = structuredClone(firstTemplate);
    secondTemplate.id = 'patient-template.test.admission-matrix.outpatient-psychiatry.second';
    secondTemplate.internalLabel = 'Synthetic second-location outpatient template';
    secondTemplate.compatibleLocationRefs = [
      { id: secondLocation.id, contentVersion: secondLocation.contentVersion },
    ];
    secondTemplate.requiredConditions[0]!.id =
      'template-condition.test.admission-matrix.outpatient-psychiatry.second';
    secondTemplate.presentationRichnessEnvelope.id =
      'presentation-richness.test.admission-matrix.outpatient-psychiatry.second';
    templates.push(secondTemplate);
    replaceRequestTemplates(request, templates);
    const matrix = expectMatrix(request);
    const firstCell = matrix.admissionEvaluations.find(
      (entry) =>
        entry.locationRef.id === firstLocation.id &&
        entry.templateRef.id === firstTemplate.id &&
        entry.status === 'admitted',
    )!;
    const secondCell = matrix.admissionEvaluations.find(
      (entry) =>
        entry.locationRef.id === secondLocation.id &&
        entry.templateRef.id === secondTemplate.id &&
        entry.status === 'admitted',
    )!;
    expect(
      compileLocationOwnedPatientSlotSelection({
        schemaVersion: 1,
        id: 'location-owned-slot-selection-request.test.cross-location',
        slotCoordinate: {
          schemaVersion: 1,
          id: 'patient-slot.test.first-outpatient',
          locationRef: { id: firstLocation.id, contentVersion: firstLocation.contentVersion },
        },
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        selectedAdmissionEvaluationId: secondCell.id,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SELECTED_ADMISSION_NOT_ELIGIBLE_FOR_LOCATION' },
    });
    const first = expectSlotSelection({
      request,
      matrix,
      location: firstLocation,
      selectedAdmissionEvaluationId: firstCell.id,
    });
    const second = expectSlotSelection({
      request,
      matrix,
      location: secondLocation,
      selectedAdmissionEvaluationId: secondCell.id,
    });
    expect(first.mechanicallyAdmittedCandidates.map((entry) => entry.templateRef.id)).toEqual([
      firstTemplate.id,
    ]);
    expect(second.mechanicallyAdmittedCandidates.map((entry) => entry.templateRef.id)).toEqual([
      secondTemplate.id,
    ]);
  });

  it('rejects off-location, nonadmitted, missing-location, and empty-location selections without global fallback', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    const selectedLocation = request.locations[0]!;
    const offLocation = matrix.admissionEvaluations.find(
      (entry) => entry.status === 'admitted' && entry.locationRef.id !== selectedLocation.id,
    )!;
    const nonadmitted = matrix.admissionEvaluations.find(
      (entry) => entry.locationRef.id === selectedLocation.id && entry.status !== 'admitted',
    )!;
    const base = {
      schemaVersion: 1 as const,
      id: 'location-owned-slot-selection-request.test.rejected',
      slotCoordinate: {
        schemaVersion: 1 as const,
        id: 'patient-slot.test.rejected',
        locationRef: { id: selectedLocation.id, contentVersion: selectedLocation.contentVersion },
      },
      admissionMatrixArtifact: matrix,
      currentAdmissionMatrixRequest: request,
    };
    for (const selectedAdmissionEvaluationId of [offLocation.id, nonadmitted.id]) {
      expect(
        compileLocationOwnedPatientSlotSelection({ ...base, selectedAdmissionEvaluationId }),
      ).toMatchObject({
        ok: false,
        error: { code: 'SELECTED_ADMISSION_NOT_ELIGIBLE_FOR_LOCATION' },
      });
    }
    expect(
      compileLocationOwnedPatientSlotSelection({
        ...base,
        slotCoordinate: {
          schemaVersion: 1,
          id: 'patient-slot.test.missing-location',
          locationRef: { id: 'location.test.missing', contentVersion: '1.0.0' },
        },
        selectedAdmissionEvaluationId: offLocation.id,
      }),
    ).toMatchObject({ ok: false, error: { code: 'SLOT_LOCATION_NOT_FOUND' } });

    const emptyRequest = makeRequest();
    emptyRequest.locations[0]!.formularyId = 'formulary.test.admission-matrix.missing';
    const emptyMatrix = expectMatrix(emptyRequest);
    const emptyLocation = emptyRequest.locations[0]!;
    const targetCell = emptyMatrix.admissionEvaluations.find(
      (entry) => entry.locationRef.id === emptyLocation.id,
    )!;
    expect(emptyMatrix.admissionEvaluations.some((entry) => entry.status === 'admitted')).toBe(
      true,
    );
    expect(
      compileLocationOwnedPatientSlotSelection({
        schemaVersion: 1,
        id: 'location-owned-slot-selection-request.test.empty',
        slotCoordinate: {
          schemaVersion: 1,
          id: 'patient-slot.test.empty',
          locationRef: { id: emptyLocation.id, contentVersion: emptyLocation.contentVersion },
        },
        admissionMatrixArtifact: emptyMatrix,
        currentAdmissionMatrixRequest: emptyRequest,
        selectedAdmissionEvaluationId: targetCell.id,
      }),
    ).toMatchObject({ ok: false, error: { code: 'NO_ADMITTED_CANDIDATES' } });
  });

  it('rejects stale context, forbidden queue authority, changed local horizons, and intrinsic tampering', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    const selectedLocation = request.locations[0]!;
    const cell = matrix.admissionEvaluations.find(
      (entry) => entry.locationRef.id === selectedLocation.id && entry.status === 'admitted',
    )!;
    const artifact = expectSlotSelection({
      request,
      matrix,
      location: selectedLocation,
      selectedAdmissionEvaluationId: cell.id,
      id: 'location-owned-slot-selection-request.test.integrity',
    });
    const maximumLengthRequestId = `d229.${'x'.repeat(115)}`;
    expect(maximumLengthRequestId).toHaveLength(120);
    expect(
      compileLocationOwnedPatientSlotSelection({
        schemaVersion: 1,
        id: maximumLengthRequestId,
        slotCoordinate: artifact.selectionRequest.slotCoordinate,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        selectedAdmissionEvaluationId: cell.id,
      }).ok,
    ).toBe(true);
    const changedContext = structuredClone(request);
    changedContext.clinicOperationalContext.formularyIds.push(
      'formulary.test.admission-matrix.changed',
    );
    expect(
      compileLocationOwnedPatientSlotSelection({
        schemaVersion: 1,
        id: 'location-owned-slot-selection-request.test.stale',
        slotCoordinate: artifact.selectionRequest.slotCoordinate,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: changedContext,
        selectedAdmissionEvaluationId: cell.id,
      }),
    ).toMatchObject({ ok: false, error: { code: 'MATRIX_CONTEXT_MISMATCH' } });
    expect(
      verifyLocationOwnedPatientSlotSelectionContext({
        artifact,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: changedContext,
      }),
    ).toMatchObject({ ok: false, error: { code: 'MATRIX_CONTEXT_MISMATCH' } });
    expect(
      compileLocationOwnedPatientSlotSelection({
        schemaVersion: 1,
        id: 'location-owned-slot-selection-request.test.forbidden',
        slotCoordinate: artifact.selectionRequest.slotCoordinate,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        selectedAdmissionEvaluationId: cell.id,
        mode: 'endgame',
        seed: 'forbidden',
        weight: 1,
        refill: true,
        persistedSlot: {},
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });

    const expandedRequest = makeRequest();
    const templates = [...structuredClone(requestTemplates(expandedRequest))];
    const alternative = structuredClone(
      templates.find((entry) => entry.careSetting === 'outpatient_psychiatry')!,
    );
    alternative.id = 'patient-template.test.admission-matrix.outpatient-psychiatry.later';
    alternative.internalLabel = 'Synthetic later outpatient template';
    alternative.requiredConditions[0]!.id =
      'template-condition.test.admission-matrix.outpatient-psychiatry.later';
    alternative.presentationRichnessEnvelope.id =
      'presentation-richness.test.admission-matrix.outpatient-psychiatry.later';
    templates.push(alternative);
    replaceRequestTemplates(expandedRequest, templates);
    const expandedMatrix = expectMatrix(expandedRequest);
    expect(
      verifyLocationOwnedPatientSlotSelectionContext({
        artifact,
        admissionMatrixArtifact: expandedMatrix,
        currentAdmissionMatrixRequest: expandedRequest,
      }),
    ).toMatchObject({ ok: false, error: { code: 'SELECTION_MISMATCH' } });

    const tamperedCandidate = structuredClone(artifact);
    tamperedCandidate.mechanicallyAdmittedCandidates[0]!.patientPool =
      tamperedCandidate.mechanicallyAdmittedCandidates[0]!.patientPool === 'starter'
        ? 'advanced'
        : 'starter';
    expect(verifyLocationOwnedPatientSlotSelectionIntegrity(tamperedCandidate).ok).toBe(false);
    const tamperedCoordinate = structuredClone(artifact);
    const oldFingerprint = tamperedCoordinate.slotCoordinate.locationFingerprint;
    tamperedCoordinate.slotCoordinate.locationFingerprint = `${oldFingerprint.slice(0, -1)}${
      oldFingerprint.endsWith('0') ? '1' : '0'
    }`;
    expect(verifyLocationOwnedPatientSlotSelectionIntegrity(tamperedCoordinate).ok).toBe(false);
    const tamperedBinding = structuredClone(artifact);
    tamperedBinding.admittedTemplateLocationBindingArtifact.template.internalLabel =
      'Same identity, divergent nested D-228 template';
    expect(verifyLocationOwnedPatientSlotSelectionIntegrity(tamperedBinding).ok).toBe(false);
    const tamperedPayload = structuredClone(artifact);
    tamperedPayload.payloadFingerprint = `${tamperedPayload.payloadFingerprint.slice(0, -1)}${
      tamperedPayload.payloadFingerprint.endsWith('0') ? '1' : '0'
    }`;
    expect(verifyLocationOwnedPatientSlotSelectionIntegrity(tamperedPayload).ok).toBe(false);
    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyLocationOwnedPatientSlotSelectionIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });
  });
});

describe('location-local template distribution selector', () => {
  it('uses the same location-local algorithm across all four care settings without spending complexity', () => {
    const request = makeRequest();
    const matrix = expectMatrix(request);
    for (const selectedLocation of request.locations) {
      const sourceTemplate = requestTemplates(request).find(
        (entry) => entry.careSetting === selectedLocation.careSetting,
      )!;
      const complexityBefore = structuredClone(sourceTemplate.complexityProfile);
      const artifact = expectTemplateSelection({
        request,
        matrix,
        location: selectedLocation,
        seed: `all-settings.${selectedLocation.careSetting}`,
      });
      expect(artifact.slotCoordinate.careSetting).toBe(selectedLocation.careSetting);
      expect(artifact.candidateEvaluations).toHaveLength(1);
      expect(artifact.candidateEvaluations[0]!.candidate.careSetting).toBe(
        selectedLocation.careSetting,
      );
      expect(
        artifact.locationOwnedPatientSlotSelectionArtifact.admittedTemplateLocationBindingArtifact
          .template.complexityProfile,
      ).toEqual(complexityBefore);
      expect(artifact.selectionRequest.eligibilityOverlay).toMatchObject({
        mode: 'endgame',
        basis: 'all_admitted',
        sourceRunHistoryRef: null,
      });
      expect(JSON.stringify(artifact.selectionRequest)).not.toMatch(
        /"(?:progression|capacity|refill|difficulty|complexity|points|reimbursement|patientSeed)"\s*:/,
      );
    }
  });

  it('normalizes exact positive local mass, applies each repeat class once, and nests the selected D-229 proof', () => {
    const request = makeRequest();
    const selectedLocation = request.locations[0]!;
    const templates = [...structuredClone(requestTemplates(request))];
    for (const suffix of ['b', 'c', 'd']) {
      const alternative = structuredClone(
        templates.find((entry) => entry.careSetting === 'outpatient_psychiatry')!,
      );
      alternative.id = `patient-template.test.admission-matrix.outpatient-psychiatry.${suffix}`;
      alternative.internalLabel = `Synthetic outpatient alternative ${suffix}`;
      alternative.requiredConditions[0]!.id = `template-condition.test.admission-matrix.outpatient-psychiatry.${suffix}`;
      alternative.presentationRichnessEnvelope.id = `presentation-richness.test.admission-matrix.outpatient-psychiatry.${suffix}`;
      templates.push(alternative);
    }
    replaceRequestTemplates(request, templates);
    const matrix = expectMatrix(request);
    const local = matrix.admissionEvaluations
      .filter(
        (entry) => entry.locationRef.id === selectedLocation.id && entry.status === 'admitted',
      )
      .sort((left, right) =>
        left.templateRef.id === right.templateRef.id
          ? 0
          : left.templateRef.id < right.templateRef.id
            ? -1
            : 1,
      );
    expect(local).toHaveLength(4);
    const repeats = repeatContext({
      location: selectedLocation,
      active: [
        { slotCoordinateId: 'patient-slot.test.active.1', templateId: local[1]!.templateRef.id },
        { slotCoordinateId: 'patient-slot.test.active.2', templateId: local[1]!.templateRef.id },
        { slotCoordinateId: 'patient-slot.test.active.3', templateId: local[3]!.templateRef.id },
      ],
      recent: [local[2]!.templateRef.id, local[2]!.templateRef.id, local[3]!.templateRef.id],
    });
    const before = structuredClone({ request, matrix, repeats });
    const artifact = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      repeats,
    });
    expect({ request, matrix, repeats }).toEqual(before);
    expect(LocationTemplateSelectionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.compilerVersion).toBe('3.0.0');
    expect(artifact.candidateEvaluations).toHaveLength(4);
    const byTemplate = new Map(
      artifact.candidateEvaluations.map((evaluation) => [
        evaluation.candidate.templateRef.id,
        evaluation,
      ]),
    );
    const expectedRatios = [8, 2, 4, 1];
    local.forEach((candidate, index) => {
      const evaluation = byTemplate.get(candidate.templateRef.id)!;
      expect(evaluation.normalizedDrawProbability.decimal).toBeCloseTo(expectedRatios[index]! / 15);
      expect(evaluation.normalizedDrawProbability.numerator).toBe(
        expectedRatios[index]! * 100_000_000,
      );
      expect(evaluation.normalizedDrawProbability.denominator).toBe(1_500_000_000);
    });
    expect(byTemplate.get(local[1]!.templateRef.id)!.suppressionFactors).toMatchObject([
      { kind: 'active_waiting', matched: true, matchCount: 2 },
      { kind: 'recent_completion', matched: false, matchCount: 0 },
    ]);
    expect(byTemplate.get(local[2]!.templateRef.id)!.suppressionFactors).toMatchObject([
      { kind: 'active_waiting', matched: false, matchCount: 0 },
      { kind: 'recent_completion', matched: true, matchCount: 2 },
    ]);
    expect(byTemplate.get(local[3]!.templateRef.id)!.suppressionFactors).toMatchObject([
      { kind: 'active_waiting', matched: true, matchCount: 1 },
      { kind: 'recent_completion', matched: true, matchCount: 1 },
    ]);
    const selected = artifact.candidateEvaluations.filter((evaluation) => evaluation.selected);
    expect(selected).toHaveLength(1);
    expect(artifact.selectedAdmissionEvaluationId).toBe(
      selected[0]!.candidate.admissionEvaluationId,
    );
    expect(artifact.locationOwnedPatientSlotSelectionArtifact.selectedAdmissionEvaluationId).toBe(
      artifact.selectedAdmissionEvaluationId,
    );
    expect(
      artifact.locationOwnedPatientSlotSelectionArtifact.mechanicallyAdmittedCandidates,
    ).toEqual(artifact.candidateEvaluations.map((evaluation) => evaluation.candidate));
    expect(Object.hasOwn(artifact, 'admissionMatrixArtifact')).toBe(false);
    expect(Object.hasOwn(artifact.selectionRequest, 'admissionMatrixArtifact')).toBe(false);
    expect(verifyLocationTemplateSelectionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(
      verifyLocationTemplateSelectionContext({
        artifact,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
      }),
    ).toEqual({ ok: true, value: artifact });
  });

  it('is deterministic and order-invariant while keeping stable substreams independent of request IDs and weight magnitudes', () => {
    const request = makeRequest();
    const selectedLocation = request.locations[0]!;
    const templates = [...structuredClone(requestTemplates(request))];
    const alternative = structuredClone(
      templates.find((entry) => entry.careSetting === 'outpatient_psychiatry')!,
    );
    alternative.id = 'patient-template.test.admission-matrix.outpatient-psychiatry.weighted';
    alternative.internalLabel = 'Synthetic weighted outpatient alternative';
    alternative.requiredConditions[0]!.id =
      'template-condition.test.admission-matrix.outpatient-psychiatry.weighted';
    alternative.presentationRichnessEnvelope.id =
      'presentation-richness.test.admission-matrix.outpatient-psychiatry.weighted';
    templates.push(alternative);
    replaceRequestTemplates(request, templates);
    const matrix = expectMatrix(request);
    const profile = distributionProfile({ matrix, location: selectedLocation });
    const repeats = repeatContext({
      location: selectedLocation,
      active: [
        {
          slotCoordinateId: 'patient-slot.test.waiting.z',
          templateId: alternative.id,
        },
        {
          slotCoordinateId: 'patient-slot.test.waiting.a',
          templateId: requestTemplateForSetting(request, 'outpatient_psychiatry').id,
        },
      ],
    });
    const first = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      profile,
      repeats,
      seed: 'stable-local-draw',
      id: 'location-template-selection-request.test.first',
      slotCoordinateId: 'patient-slot.test.stable-substream',
    });
    const reorderedProfile = structuredClone(profile);
    reorderedProfile.templateWeights.reverse();
    const reorderedRepeats = structuredClone(repeats);
    reorderedRepeats.activeWaitingAssignments.reverse();
    const reordered = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      profile: reorderedProfile,
      repeats: reorderedRepeats,
      seed: 'stable-local-draw',
      id: 'location-template-selection-request.test.first',
      slotCoordinateId: 'patient-slot.test.stable-substream',
    });
    expect(reordered).toEqual(first);

    const renamedRequest = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      profile,
      repeats,
      seed: 'stable-local-draw',
      id: 'location-template-selection-request.test.renamed',
      slotCoordinateId: 'patient-slot.test.stable-substream',
    });
    expect(renamedRequest.stableDrawId).toBe(first.stableDrawId);
    expect(renamedRequest.stableDrawValueHex).toBe(first.stableDrawValueHex);
    expect(renamedRequest.stableDrawUnit).toBe(first.stableDrawUnit);
    expect(renamedRequest.selectedAdmissionEvaluationId).toBe(first.selectedAdmissionEvaluationId);

    const scaledProfile = structuredClone(profile);
    scaledProfile.templateWeights.forEach((entry) => {
      entry.gameSelectionWeight *= 2;
    });
    const scaled = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      profile: scaledProfile,
      repeats,
      seed: 'stable-local-draw',
      id: 'location-template-selection-request.test.scaled',
      slotCoordinateId: 'patient-slot.test.stable-substream',
    });
    expect(scaled.stableDrawValueHex).toBe(first.stableDrawValueHex);
    expect(
      scaled.candidateEvaluations.map((evaluation) => evaluation.normalizedDrawProbability.decimal),
    ).toEqual(
      first.candidateEvaluations.map((evaluation) => evaluation.normalizedDrawProbability.decimal),
    );
    expect(scaled.selectedAdmissionEvaluationId).toBe(first.selectedAdmissionEvaluationId);
    const anotherSlot = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      profile,
      repeats,
      seed: 'stable-local-draw',
      slotCoordinateId: 'patient-slot.test.other-substream',
    });
    expect(anotherSlot.stableDrawId).not.toBe(first.stableDrawId);
    expect(fingerprintLocationTemplateDistributionProfile(reorderedProfile)).toBe(
      fingerprintLocationTemplateDistributionProfile(profile),
    );
  });

  it('keeps suppression positive, exact-location-only, and based solely on stable template ID', () => {
    const request = makeRequest();
    const selectedLocation = request.locations[0]!;
    const matrix = expectMatrix(request);
    const onlyTemplateId = requestTemplateForSetting(request, 'outpatient_psychiatry').id;
    const artifact = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      repeats: repeatContext({
        location: selectedLocation,
        active: [
          {
            slotCoordinateId: 'patient-slot.test.waiting.same-template',
            templateId: onlyTemplateId,
          },
        ],
        recent: [onlyTemplateId, onlyTemplateId],
      }),
    });
    expect(artifact.candidateEvaluations).toHaveLength(1);
    expect(artifact.candidateEvaluations[0]).toMatchObject({
      selected: true,
      normalizedDrawProbability: { decimal: 1 },
      suppressionFactors: [
        { kind: 'active_waiting', matched: true, matchCount: 1 },
        { kind: 'recent_completion', matched: true, matchCount: 2 },
      ],
    });
    expect(artifact.candidateEvaluations[0]!.effectiveGameSelectionMass).toBeGreaterThan(0);

    const anotherLocation = request.locations[1]!;
    expect(
      compileLocationTemplateSelection({
        schemaVersion: 1,
        id: 'location-template-selection-request.test.cross-location-history',
        seed: 'cross-location-history',
        slotCoordinate: artifact.selectionRequest.slotCoordinate,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        distributionProfile: artifact.selectionRequest.distributionProfile,
        localRepeatContext: repeatContext({
          location: anotherLocation,
          active: [
            {
              slotCoordinateId: 'patient-slot.test.other-location',
              templateId: onlyTemplateId,
            },
          ],
        }),
        eligibilityOverlay: artifact.selectionRequest.eligibilityOverlay,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'LOCAL_REPEAT_CONTEXT_MISMATCH' },
    });
    expect(
      compileLocationTemplateSelection({
        schemaVersion: 1,
        id: 'location-template-selection-request.test.current-slot-repeat',
        seed: 'current-slot-repeat',
        slotCoordinate: artifact.selectionRequest.slotCoordinate,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: request,
        distributionProfile: artifact.selectionRequest.distributionProfile,
        localRepeatContext: repeatContext({
          location: selectedLocation,
          active: [
            {
              slotCoordinateId: artifact.selectionRequest.slotCoordinate.id,
              templateId: onlyTemplateId,
            },
          ],
        }),
        eligibilityOverlay: artifact.selectionRequest.eligibilityOverlay,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'LOCAL_REPEAT_CONTEXT_MISMATCH' },
    });
  });

  it('rejects incomplete distribution coverage, forbidden authority, stale context, and intrinsic tampering', () => {
    const request = makeRequest();
    const selectedLocation = request.locations[0]!;
    const templates = [...structuredClone(requestTemplates(request))];
    const alternative = structuredClone(
      templates.find((entry) => entry.careSetting === 'outpatient_psychiatry')!,
    );
    alternative.id = 'patient-template.test.admission-matrix.outpatient-psychiatry.coverage';
    alternative.internalLabel = 'Synthetic coverage alternative';
    alternative.requiredConditions[0]!.id =
      'template-condition.test.admission-matrix.outpatient-psychiatry.coverage';
    alternative.presentationRichnessEnvelope.id =
      'presentation-richness.test.admission-matrix.outpatient-psychiatry.coverage';
    templates.push(alternative);
    replaceRequestTemplates(request, templates);
    const matrix = expectMatrix(request);
    const profile = distributionProfile({ matrix, location: selectedLocation });
    const base = {
      schemaVersion: 1 as const,
      id: 'location-template-selection-request.test.rejected',
      seed: 'rejected-selection',
      slotCoordinate: {
        schemaVersion: 1 as const,
        id: 'patient-slot.test.d230.rejected',
        locationRef: {
          id: selectedLocation.id,
          contentVersion: selectedLocation.contentVersion,
        },
      },
      admissionMatrixArtifact: matrix,
      currentAdmissionMatrixRequest: request,
      localRepeatContext: repeatContext({ location: selectedLocation }),
      eligibilityOverlay: allAdmittedEligibilityOverlay({
        matrix,
        location: selectedLocation,
      }),
    };
    const incomplete = structuredClone(profile);
    incomplete.templateWeights.pop();
    expect(
      compileLocationTemplateSelection({ ...base, distributionProfile: incomplete }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DISTRIBUTION_WEIGHT_COVERAGE_MISMATCH' },
    });
    const staleFingerprint = structuredClone(profile);
    staleFingerprint.templateWeights[0]!.templateFingerprint =
      'fingerprint.patient-template-location-admission-matrix.template.fnv1a64.0000000000000000';
    expect(
      compileLocationTemplateSelection({ ...base, distributionProfile: staleFingerprint }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DISTRIBUTION_WEIGHT_COVERAGE_MISMATCH' },
    });
    expect(
      compileLocationTemplateSelection({
        ...base,
        distributionProfile: profile,
        mode: 'endgame',
        capacity: 4,
        refill: true,
        patientSeed: 'forbidden',
        points: 10,
        complexityBudget: 3,
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });

    const artifact = expectTemplateSelection({
      request,
      matrix,
      location: selectedLocation,
      profile,
      id: 'location-template-selection-request.test.integrity',
    });
    const changedContext = structuredClone(request);
    changedContext.clinicOperationalContext.formularyIds.push(
      'formulary.test.admission-matrix.changed-d230',
    );
    expect(
      verifyLocationTemplateSelectionContext({
        artifact,
        admissionMatrixArtifact: matrix,
        currentAdmissionMatrixRequest: changedContext,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'MATRIX_CONTEXT_MISMATCH' },
    });
    const tamperedMass = structuredClone(artifact);
    tamperedMass.candidateEvaluations[0]!.effectiveGameSelectionMass += 1;
    expect(verifyLocationTemplateSelectionIntegrity(tamperedMass).ok).toBe(false);
    const tamperedDraw = structuredClone(artifact);
    tamperedDraw.stableDrawValueHex = '0000000000000000';
    expect(verifyLocationTemplateSelectionIntegrity(tamperedDraw)).toMatchObject({
      ok: false,
      error: { code: 'DRAW_MISMATCH' },
    });
    const tamperedNested = structuredClone(artifact);
    tamperedNested.locationOwnedPatientSlotSelectionArtifact.admittedTemplateLocationBindingArtifact.template.internalLabel =
      'Divergent nested template payload';
    expect(verifyLocationTemplateSelectionIntegrity(tamperedNested)).toMatchObject({
      ok: false,
      error: { code: 'NESTED_SLOT_SELECTION_INVALID' },
    });
    const obsolete = structuredClone(artifact);
    obsolete.compilerVersion = '99.0.0';
    expect(verifyLocationTemplateSelectionIntegrity(obsolete)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_SELECTOR_VERSION' },
    });
  });
});
