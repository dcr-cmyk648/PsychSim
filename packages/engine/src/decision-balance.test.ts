import {
  CompiledRubricRuleSchema,
  DecisionActionHorizonSchema,
  DecisionBalanceCatalogSchema,
  DecisionBalanceCatalogSnapshotSchema,
  DecisionPolicyCatalogSchema,
  DecisionRuleCandidateDefinitionSchema,
  DiagnosisDefinitionSchema,
  FindingDefinitionSchema,
  GeneratedEncounterDecisionSelectionSchema,
  GeneratedEncounterPointReportInputSchema,
  MedicationRegimenEntryV2Schema,
  MedicationRegimenKnowledgeCatalogSchema,
  ResolvedPatientStateSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import mddDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/major-depressive-disorder.diagnosis.json';
import balanceCatalogJson from '../../../content/catalogs/decision-policies/balances.json';
import decisionPolicyCatalogJson from '../../../content/catalogs/decision-policies/catalog.json';
import passiveDeathWishFindingJson from '../../../content/catalogs/findings/definitions/current-passive-death-wish.finding.json';
import medicationRegimenCatalogJson from '../../../content/catalogs/medications/regimen-knowledge.json';
import { compileDecisionPolicy } from './decision-policy';
import {
  attachDecisionBalance,
  compileDecisionBalanceCatalogSnapshot,
  compileNativeDecisionPointReport,
  deriveNativeSelectedRuleTargets,
  verifyDecisionBalanceCatalogSnapshotIntegrity,
} from './decision-balance';
import {
  adaptDiagnosisInformationPrerequisite,
  adaptDiagnosisInformationRecommendation,
  adaptDiagnosisInformationRequirement,
} from './diagnosis-information-prerequisite-adapter';
import { adaptFocusedMedicationRegimenRoute } from './medication-regimen-route-adapter';

const diagnosis = DiagnosisDefinitionSchema.parse(mddDiagnosisJson);
const balanceCatalog = DecisionBalanceCatalogSchema.parse(balanceCatalogJson);
const regimenCatalog = MedicationRegimenKnowledgeCatalogSchema.parse(medicationRegimenCatalogJson);
const policyCatalog = DecisionPolicyCatalogSchema.parse(decisionPolicyCatalogJson);
const route = regimenCatalog.focusedRoutes[0]!;
const policy = policyCatalog.policies[0]!;
const findingDefinitions = [FindingDefinitionSchema.parse(passiveDeathWishFindingJson)];
const routeBalance = balanceCatalog.balances.find((balance) => !('balanceKind' in balance));
const reconciliationBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-any-medication-reconciliation',
);
const reactionHistoryBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-any-medication-reaction-history',
);
const maniaHistoryBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-antidepressant-mania-history',
);
const passiveDeathWishSafetyBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-passive-death-wish-safety-assessment',
);
const episodeCourseBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-initial-episode-course-assessment',
);
const depressiveSyndromeBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-initial-depressive-syndrome-assessment',
);
const substanceHistoryBalance = balanceCatalog.balances.find(
  (balance) => balance.id === 'balance.mdd-substance-history',
);
if (
  routeBalance === undefined ||
  'balanceKind' in routeBalance ||
  reconciliationBalance === undefined ||
  !('balanceKind' in reconciliationBalance) ||
  reconciliationBalance.balanceKind !== 'triggered_information_prerequisite' ||
  reactionHistoryBalance === undefined ||
  !('balanceKind' in reactionHistoryBalance) ||
  reactionHistoryBalance.balanceKind !== 'triggered_information_prerequisite' ||
  maniaHistoryBalance === undefined ||
  !('balanceKind' in maniaHistoryBalance) ||
  maniaHistoryBalance.balanceKind !== 'triggered_information_prerequisite' ||
  passiveDeathWishSafetyBalance === undefined ||
  !('balanceKind' in passiveDeathWishSafetyBalance) ||
  passiveDeathWishSafetyBalance.balanceKind !== 'information_requirement' ||
  episodeCourseBalance === undefined ||
  !('balanceKind' in episodeCourseBalance) ||
  episodeCourseBalance.balanceKind !== 'information_requirement' ||
  depressiveSyndromeBalance === undefined ||
  !('balanceKind' in depressiveSyndromeBalance) ||
  depressiveSyndromeBalance.balanceKind !== 'information_requirement' ||
  substanceHistoryBalance === undefined ||
  'balanceKind' in substanceHistoryBalance
) {
  throw new Error('The native MDD balance fixture is incomplete.');
}
const primaryOnlyBalanceCatalog = DecisionBalanceCatalogSchema.parse({
  ...balanceCatalog,
  balances: [routeBalance],
});
const reviewedMedicationIds = [
  'medication.bupropion',
  'medication.escitalopram',
  'medication.fluoxetine',
  'medication.mirtazapine',
  'medication.sertraline',
];

const patientState = ResolvedPatientStateSchema.parse({
  schemaVersion: 1,
  id: 'resolved-patient-state.test.native-mdd-balance',
  demographics: {
    recordVersion: 2,
    ageYears: 42,
    reviewedAgeBandId: 'age-band.middle-adult',
    sexForReference: 'female',
  },
  conditionStates: [
    {
      schemaVersion: 1,
      id: 'condition-state.test.native-mdd-balance',
      diagnosisDefinitionId: diagnosis.id,
      diagnosisDefinitionContentVersion: diagnosis.contentVersion,
      clinicalStateId: 'clinical-state.current-episode',
      timeScopeId: 'time-scope.current',
      encounterRelevance: 'focus',
      severityId: null,
      specifierIds: [],
      origin: 'authored',
      resolution: {
        origin: 'authored',
        ownerId: 'patient-template.test.native-mdd-balance',
        ownerContentVersion: '1.0.0',
      },
    },
  ],
  diagnosisRecordEntries: [],
  medicationRegimenEntries: [],
  exposureInventory: {
    schemaVersion: 1,
    id: 'resolved-exposure-inventory.test.native-mdd-balance',
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
    id: 'resolved-proposition-state.test.native-mdd-balance',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  clinicalTagIds: ['clinical-tag.must-not-drive-native-mdd-balance'],
  reportedSafetyPlanningAbility: 'unassessed',
});

const patientStateWithPassiveDeathWish = ResolvedPatientStateSchema.parse({
  ...patientState,
  id: 'resolved-patient-state.test.native-mdd-balance.passive-death-wish',
  canonicalFindings: [
    {
      schemaVersion: 1,
      id: 'resolved-finding.test.passive-death-wish',
      definitionId: 'finding.safety.current-passive-death-wish',
      definitionContentVersion: '1.0.0',
      value: { kind: 'outcome', value: 'present' },
      resolution: {
        resolverVersion: '1.0.0',
        origin: 'authored',
        uncertainty: 'none',
        appliedContributionIds: ['finding-contribution.test.passive-death-wish'],
      },
      contributions: [
        {
          schemaVersion: 1,
          id: 'finding-contribution.test.passive-death-wish',
          ownerKind: 'patient_state',
          ownerId: 'resolved-patient-state.test.native-mdd-balance.passive-death-wish',
          ownerContentVersion: null,
          role: 'authored_value',
          provenanceIds: [],
        },
      ],
    },
  ],
});

const actionHorizon = DecisionActionHorizonSchema.parse({
  schemaVersion: 1,
  id: 'decision-action-horizon.test.native-mdd-balance',
  informationActionIds: [
    'info.history.allergies-adverse-reactions',
    'info.history.depressive-symptoms',
    'info.history.mania',
    'info.history.medication-reconciliation',
    'info.history.presenting-problem',
    'info.history.substance-use',
    'info.history.suicide-safety',
  ],
  startMedicationIds: [...reviewedMedicationIds, 'medication.citalopram'].sort(),
  regimenEntryOperations: [],
  interventionIds: [],
  dispositionIds: [],
});

const emptyTreatment = {
  schemaVersion: 1 as const,
  selectionVersion: 2 as const,
  medicationTransition: {
    selectionVersion: 2 as const,
    startMedicationIds: [] as string[],
    adjustments: [],
  },
  interventionIds: [],
  dispositionId: null,
};

const treatmentStarting = (startMedicationIds: string[]) => ({
  ...emptyTreatment,
  medicationTransition: {
    ...emptyTreatment.medicationTransition,
    startMedicationIds,
  },
});

const decisionSelecting = (
  treatmentSelection: ReturnType<typeof treatmentStarting>,
  informationActionIds: string[] = [],
) => ({
  schemaVersion: 1 as const,
  selectionVersion: 1 as const,
  informationActionIds,
  diagnosisSelections: [],
  treatmentSelection,
});

const compileRubric = (state = patientState) => {
  const adapted = adaptFocusedMedicationRegimenRoute({
    route,
    diagnosis,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
  });
  if (!adapted.ok) throw new Error(adapted.error.message);
  const attached = attachDecisionBalance({
    candidate: adapted.value,
    balanceCatalog,
  });
  if (!attached.ok) throw new Error(attached.error.message);
  const compiled = compileDecisionPolicy({
    policy,
    patientState: state,
    actionHorizon,
    rules: [attached.value],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return { adapted: adapted.value, attached: attached.value, rubric: compiled.value };
};

const compileRubricWithPrerequisites = (
  prerequisiteBalanceCatalog = balanceCatalog,
  state = patientState,
) => {
  const primary = compileRubric(state);
  const adaptedPrerequisites = [
    'rule.diagnosis-mdd.any-medication-reconciliation',
    'rule.diagnosis-mdd.any-medication-reaction-history',
  ].map((diagnosisRuleId) =>
    adaptDiagnosisInformationPrerequisite({
      diagnosis,
      diagnosisRuleId,
      policy,
      primaryRoute: route,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
      findingDefinitions,
    }),
  );
  for (const prerequisite of adaptedPrerequisites) {
    if (!prerequisite.ok) throw new Error(prerequisite.error.message);
  }
  const prerequisites = adaptedPrerequisites.map((prerequisite) => {
    if (!prerequisite.ok) throw new Error(prerequisite.error.message);
    return prerequisite.value;
  });
  const attachedPrerequisites = prerequisites.map((prerequisite) => {
    const attached = attachDecisionBalance({
      candidate: prerequisite,
      balanceCatalog: prerequisiteBalanceCatalog,
    });
    if (!attached.ok) throw new Error(attached.error.message);
    return attached.value;
  });
  const compiled = compileDecisionPolicy({
    policy,
    patientState: state,
    actionHorizon,
    rules: [primary.attached, ...attachedPrerequisites],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return {
    rubric: compiled.value,
    prerequisites,
    attachedPrerequisites,
  };
};

const compileRubricWithManiaPrerequisite = () => {
  const primary = compileRubric();
  const adapted = adaptDiagnosisInformationPrerequisite({
    diagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
    policy,
    primaryRoute: route,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
    findingDefinitions,
  });
  if (!adapted.ok) throw new Error(adapted.error.message);
  const attached = attachDecisionBalance({
    candidate: adapted.value,
    balanceCatalog,
  });
  if (!attached.ok) throw new Error(attached.error.message);
  const compiled = compileDecisionPolicy({
    policy,
    patientState,
    actionHorizon,
    rules: [primary.attached, attached.value],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return {
    rubric: compiled.value,
    prerequisite: adapted.value,
    attachedPrerequisite: attached.value,
  };
};

const compileRubricWithAllInformationRequirements = (state = patientState) => {
  const primary = compileRubric(state);
  const triggered = compileRubricWithPrerequisites(balanceCatalog, state);
  const maniaHistory = adaptDiagnosisInformationPrerequisite({
    diagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
    policy,
    primaryRoute: route,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
    findingDefinitions,
  });
  if (!maniaHistory.ok) throw new Error(maniaHistory.error.message);
  const attachedManiaHistory = attachDecisionBalance({
    candidate: maniaHistory.value,
    balanceCatalog,
  });
  if (!attachedManiaHistory.ok) throw new Error(attachedManiaHistory.error.message);
  const directRequirements = [
    'rule.diagnosis-mdd.initial-episode-course-assessment',
    'rule.diagnosis-mdd.initial-depressive-syndrome-assessment',
  ].map((diagnosisRuleId) =>
    adaptDiagnosisInformationRequirement({
      diagnosis,
      diagnosisRuleId,
      policy,
      primaryRoute: route,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
      findingDefinitions,
    }),
  );
  for (const requirement of directRequirements) {
    if (!requirement.ok) throw new Error(requirement.error.message);
  }
  const attachedRequirements = directRequirements.map((requirement) => {
    if (!requirement.ok) throw new Error(requirement.error.message);
    const attached = attachDecisionBalance({
      candidate: requirement.value,
      balanceCatalog,
    });
    if (!attached.ok) throw new Error(attached.error.message);
    return attached.value;
  });
  const substanceHistory = adaptDiagnosisInformationRecommendation({
    diagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.substance-history',
    policy,
    primaryRoute: route,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
    findingDefinitions,
  });
  if (!substanceHistory.ok) throw new Error(substanceHistory.error.message);
  const attachedSubstanceHistory = attachDecisionBalance({
    candidate: substanceHistory.value,
    balanceCatalog,
  });
  if (!attachedSubstanceHistory.ok) {
    throw new Error(attachedSubstanceHistory.error.message);
  }
  const passiveDeathWishSafety = adaptDiagnosisInformationRequirement({
    diagnosis,
    diagnosisRuleId: 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
    policy,
    primaryRoute: route,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
    findingDefinitions,
  });
  if (!passiveDeathWishSafety.ok) {
    throw new Error(passiveDeathWishSafety.error.message);
  }
  const attachedPassiveDeathWishSafety = attachDecisionBalance({
    candidate: passiveDeathWishSafety.value,
    balanceCatalog,
  });
  if (!attachedPassiveDeathWishSafety.ok) {
    throw new Error(attachedPassiveDeathWishSafety.error.message);
  }
  const compiled = compileDecisionPolicy({
    policy,
    patientState: state,
    actionHorizon,
    rules: [
      primary.attached,
      ...triggered.attachedPrerequisites,
      attachedManiaHistory.value,
      ...attachedRequirements,
      attachedSubstanceHistory.value,
      attachedPassiveDeathWishSafety.value,
    ],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return {
    rubric: compiled.value,
    maniaHistory: maniaHistory.value,
    attachedManiaHistory: attachedManiaHistory.value,
    directRequirements: directRequirements.map((requirement) => {
      if (!requirement.ok) throw new Error(requirement.error.message);
      return requirement.value;
    }),
    attachedRequirements,
    substanceHistory: substanceHistory.value,
    attachedSubstanceHistory: attachedSubstanceHistory.value,
    passiveDeathWishSafety: passiveDeathWishSafety.value,
    attachedPassiveDeathWishSafety: attachedPassiveDeathWishSafety.value,
  };
};

describe('native decision balance', () => {
  it('rejects invalid matched and three-outcome balance mappings at the schema boundary', () => {
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [{ ...routeBalance, pointsWhenMatched: 0 }],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          routeBalance,
          {
            ...routeBalance,
            id: 'balance.test.duplicate-exact-route-owner',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...reconciliationBalance,
            outcomes: {
              ...reconciliationBalance.outcomes,
              notTriggered: {
                ...reconciliationBalance.outcomes.notTriggered,
                points: 1,
              },
            },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...reconciliationBalance,
            outcomes: {
              ...reconciliationBalance.outcomes,
              fulfilled: {
                ...reconciliationBalance.outcomes.fulfilled,
                points: 0,
              },
            },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...reconciliationBalance,
            outcomes: {
              ...reconciliationBalance.outcomes,
              omitted: {
                ...reconciliationBalance.outcomes.omitted,
                points: 1,
              },
            },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...reconciliationBalance,
            ruleRef: {
              ...reconciliationBalance.ruleRef,
              kind: 'medication_regimen_route',
            },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [{ ...reconciliationBalance, schemaVersion: 2 }],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...reconciliationBalance,
            developerOpinionIds: [
              reconciliationBalance.developerOpinionIds[0],
              reconciliationBalance.developerOpinionIds[0],
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...episodeCourseBalance,
            outcomes: {
              ...episodeCourseBalance.outcomes,
              fulfilled: {
                ...episodeCourseBalance.outcomes.fulfilled,
                points: 0,
              },
            },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      DecisionBalanceCatalogSchema.safeParse({
        ...balanceCatalog,
        balances: [
          {
            ...episodeCourseBalance,
            outcomes: {
              ...episodeCourseBalance.outcomes,
              omitted: {
                ...episodeCourseBalance.outcomes.omitted,
                points: 1,
              },
            },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps the route point-free and attaches one exact separate provisional balance', () => {
    const { adapted, attached, rubric } = compileRubric();
    expect(adapted.balanceRef).toBeNull();
    expect(attached.balanceRef).toEqual({
      id: 'balance.mdd-initial-one-first-line-antidepressant',
      contentVersion: '1.3.0',
    });
    expect(rubric.includedRules[0]?.balanceRef).toEqual(attached.balanceRef);
    expect(balanceCatalog.balances[0]).toMatchObject({
      balanceStatus: 'provisional_balance',
      impactBand: 'dominant_primary_route',
      component: 'medication_selection',
      pointsWhenMatched: 200,
    });
  });

  it('cannot attach a provisional balance to an unreviewed qualitative rule', () => {
    const adapted = adaptFocusedMedicationRegimenRoute({
      route,
      diagnosis,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
    });
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;

    const preliminaryCandidate = DecisionRuleCandidateDefinitionSchema.parse({
      ...adapted.value,
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    });

    expect(
      attachDecisionBalance({
        candidate: preliminaryCandidate,
        balanceCatalog,
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'UNREVIEWED_RULE',
        contentIds: [
          'balance.mdd-initial-one-first-line-antidepressant',
          preliminaryCandidate.ruleRef.id,
        ],
      },
    });
  });

  it('freezes only exact referenced balances and fingerprints same-version retuning', () => {
    const { rubric } = compileRubricWithPrerequisites();
    const frozen = compileDecisionBalanceCatalogSnapshot({
      compiledRubric: rubric,
      balanceCatalog,
    });
    expect(frozen.ok).toBe(true);
    if (!frozen.ok) return;
    expect(DecisionBalanceCatalogSnapshotSchema.parse(frozen.value)).toEqual(frozen.value);
    expect(verifyDecisionBalanceCatalogSnapshotIntegrity(frozen.value, rubric)).toEqual({
      ok: true,
      value: frozen.value,
    });
    expect(frozen.value.balances).toHaveLength(3);
    expect(frozen.value.balances[0]).not.toHaveProperty('developerOpinionIds');
    expect(frozen.value.balances[0]).not.toHaveProperty('rationale');

    const reordered = compileDecisionBalanceCatalogSnapshot({
      compiledRubric: rubric,
      balanceCatalog: {
        ...balanceCatalog,
        balances: [...balanceCatalog.balances].reverse(),
      },
    });
    expect(reordered).toEqual(frozen);

    const retuned = compileDecisionBalanceCatalogSnapshot({
      compiledRubric: rubric,
      balanceCatalog: {
        ...balanceCatalog,
        balances: balanceCatalog.balances.map((balance) =>
          balance.id === routeBalance.id && !('balanceKind' in balance)
            ? { ...balance, pointsWhenMatched: balance.pointsWhenMatched + 1 }
            : balance,
        ),
      },
    });
    expect(retuned.ok).toBe(true);
    if (!retuned.ok) return;
    expect(retuned.value.sourceCatalogRef).toEqual(frozen.value.sourceCatalogRef);
    expect(retuned.value.sourceCatalogFingerprint).not.toBe(frozen.value.sourceCatalogFingerprint);
    expect(retuned.value.payloadFingerprint).not.toBe(frozen.value.payloadFingerprint);
    expect(retuned.value.balances.find((balance) => balance.id === routeBalance.id)).toMatchObject({
      balanceKind: 'matched_rule',
      pointsWhenMatched: routeBalance.pointsWhenMatched + 1,
    });

    const tampered = structuredClone(frozen.value);
    const matched = tampered.balances.find((balance) => balance.balanceKind === 'matched_rule');
    if (matched === undefined || matched.balanceKind !== 'matched_rule') {
      throw new Error('Expected one frozen matched-rule balance.');
    }
    matched.pointsWhenMatched += 1;
    expect(verifyDecisionBalanceCatalogSnapshotIntegrity(tampered, rubric)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_MISMATCH' },
    });
  });

  it('normalizes broad starts and regimen operations to exact selected action targets', () => {
    const currentRegimen = [
      MedicationRegimenEntryV2Schema.parse({
        recordVersion: 2,
        id: 'regimen-entry.test.native-target-normalization',
        medicationIdentityId: 'medication.lithium',
        clinicalRole: 'psychiatric',
        status: 'active',
        adherence: 'consistent',
        prescribedForDiagnosisId: diagnosis.id,
        source: 'prescriber_record',
        knownAtOpening: true,
        impactClassification: 'fit_relevant',
      }),
    ];
    const rule = CompiledRubricRuleSchema.parse({
      ...compileRubric().rubric.includedRules[0]!,
      actionWhen: {
        match: 'any',
        targets: [
          { kind: 'any_medication_start' },
          { kind: 'any_regimen_operation', operation: 'increase' },
          {
            kind: 'regimen_medication_operation',
            medicationIdentityId: 'medication.lithium',
            operation: 'increase',
          },
        ],
      },
      matchedActionTargets: [
        { kind: 'any_medication_start' },
        { kind: 'any_regimen_operation', operation: 'increase' },
        {
          kind: 'regimen_medication_operation',
          medicationIdentityId: 'medication.lithium',
          operation: 'increase',
        },
      ],
    });
    const decision = GeneratedEncounterDecisionSelectionSchema.parse({
      ...decisionSelecting(treatmentStarting(['medication.sertraline'])),
      treatmentSelection: {
        ...emptyTreatment,
        medicationTransition: {
          selectionVersion: 2,
          startMedicationIds: ['medication.sertraline'],
          adjustments: [
            {
              selectionVersion: 2,
              regimenEntryId: currentRegimen[0]!.id,
              operation: 'increase',
            },
          ],
        },
      },
    });

    expect(deriveNativeSelectedRuleTargets(rule, decision, currentRegimen)).toEqual([
      { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
      {
        kind: 'regimen_entry_operation',
        regimenEntryId: currentRegimen[0]!.id,
        operation: 'increase',
      },
    ]);
  });

  it('attaches the exact three-outcome balances to both approved MDD prerequisites', () => {
    const { rubric, prerequisites, attachedPrerequisites } = compileRubricWithPrerequisites();

    expect(prerequisites.map((prerequisite) => prerequisite.balanceRef)).toEqual([null, null]);
    expect(attachedPrerequisites.map((prerequisite) => prerequisite.balanceRef)).toEqual([
      {
        id: 'balance.mdd-any-medication-reconciliation',
        contentVersion: '1.3.0',
      },
      {
        id: 'balance.mdd-any-medication-reaction-history',
        contentVersion: '1.3.0',
      },
    ]);
    expect(rubric.includedRules.map((rule) => rule.balanceRef)).toEqual(
      expect.arrayContaining([
        {
          id: 'balance.mdd-initial-one-first-line-antidepressant',
          contentVersion: '1.3.0',
        },
        {
          id: 'balance.mdd-any-medication-reconciliation',
          contentVersion: '1.3.0',
        },
        {
          id: 'balance.mdd-any-medication-reaction-history',
          contentVersion: '1.3.0',
        },
      ]),
    );
    expect(reconciliationBalance).toMatchObject({
      component: 'workup',
      outcomes: {
        notTriggered: { points: 0 },
        fulfilled: { impactBand: 'major', points: 35 },
        omitted: { impactBand: 'moderate', points: -25 },
      },
    });
    expect(reactionHistoryBalance).toMatchObject({
      component: 'workup',
      outcomes: {
        notTriggered: { points: 0 },
        fulfilled: { impactBand: 'moderate', points: 30 },
        omitted: { impactBand: 'major', points: -40 },
      },
    });
  });

  it('scores the exact reviewed antidepressant-class mania prerequisite without tag inference', () => {
    const { rubric, prerequisite, attachedPrerequisite } = compileRubricWithManiaPrerequisite();
    expect(prerequisite.balanceRef).toBeNull();
    expect(attachedPrerequisite.balanceRef).toEqual({
      id: 'balance.mdd-antidepressant-mania-history',
      contentVersion: '1.1.0',
    });
    expect(maniaHistoryBalance).toMatchObject({
      component: 'workup',
      outcomes: {
        notTriggered: { points: 0 },
        fulfilled: { impactBand: 'major', points: 35 },
        omitted: { impactBand: 'major', points: -50 },
      },
    });

    for (const scenario of [
      {
        name: 'reviewed antidepressant with mania history',
        startMedicationIds: ['medication.sertraline'],
        informationActionIds: ['info.history.mania'],
        expectedPoints: 235,
        expectedStatus: 'fulfilled',
      },
      {
        name: 'reviewed antidepressant without mania history',
        startMedicationIds: ['medication.sertraline'],
        informationActionIds: [],
        expectedPoints: 150,
        expectedStatus: 'omitted',
      },
      {
        name: 'nonmember medication without mania history',
        startMedicationIds: ['medication.citalopram'],
        informationActionIds: [],
        expectedPoints: 0,
        expectedStatus: 'not_triggered',
      },
    ] as const) {
      const decision = GeneratedEncounterDecisionSelectionSchema.parse(
        decisionSelecting(treatmentStarting([...scenario.startMedicationIds]), [
          ...scenario.informationActionIds,
        ]),
      );
      const result = compileNativeDecisionPointReport({
        compiledRubric: rubric,
        playerDecision: decision,
        databasePlanDecision: decision,
        currentRegimen: [],
        medicationRegimenKnowledgeCatalog: regimenCatalog,
        balanceCatalog,
      });
      if (!result.ok) {
        throw new Error(`${scenario.name}: ${result.error.code}: ${result.error.message}`);
      }
      expect(
        result.value.playerRuleMatches.reduce(
          (total, evaluation) => total + evaluation.appliedPoints,
          0,
        ),
        scenario.name,
      ).toBe(scenario.expectedPoints);
      const maniaRow = result.value.report.ruleTrace.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' &&
          row.source.ruleRef.id === 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
      );
      expect(maniaRow, scenario.name).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-antidepressant-mania-history',
          contentVersion: '1.1.0',
        },
        component: 'workup',
        triggeredInformationPrerequisiteEvaluation: {
          status: scenario.expectedStatus,
          triggerSelected: scenario.expectedStatus !== 'not_triggered',
          fulfillmentSelected: scenario.expectedStatus === 'fulfilled',
        },
      });
      expect(JSON.stringify(maniaRow)).not.toContain('medicationTagId');
      expect(JSON.stringify(maniaRow)).not.toContain('medicationClassId');
    }
  });

  it('attaches exact two-outcome balances to both direct MDD history requirements', () => {
    const {
      rubric,
      directRequirements,
      attachedRequirements,
      substanceHistory,
      attachedSubstanceHistory,
    } = compileRubricWithAllInformationRequirements();

    expect(directRequirements.map((requirement) => requirement.balanceRef)).toEqual([null, null]);
    expect(attachedRequirements.map((requirement) => requirement.balanceRef)).toEqual([
      {
        id: 'balance.mdd-initial-episode-course-assessment',
        contentVersion: '1.3.0',
      },
      {
        id: 'balance.mdd-initial-depressive-syndrome-assessment',
        contentVersion: '1.3.0',
      },
    ]);
    expect(substanceHistory.balanceRef).toBeNull();
    expect(attachedSubstanceHistory.balanceRef).toEqual({
      id: 'balance.mdd-substance-history',
      contentVersion: '1.3.0',
    });
    expect(rubric.includedRules).toHaveLength(7);
    expect(episodeCourseBalance).toMatchObject({
      balanceKind: 'information_requirement',
      component: 'workup',
      outcomes: {
        fulfilled: { impactBand: 'major', points: 35 },
        omitted: { impactBand: 'major', points: -35 },
      },
    });
    expect(depressiveSyndromeBalance).toMatchObject({
      balanceKind: 'information_requirement',
      component: 'workup',
      outcomes: {
        fulfilled: { impactBand: 'major', points: 50 },
        omitted: { impactBand: 'major', points: -50 },
      },
    });
    expect(substanceHistoryBalance).toMatchObject({
      impactBand: 'moderate',
      component: 'workup',
      pointsWhenMatched: 30,
      unmatchedBehavior: 'not_triggered_zero',
    });

    const frozen = compileDecisionBalanceCatalogSnapshot({
      compiledRubric: rubric,
      balanceCatalog,
    });
    expect(frozen.ok).toBe(true);
    if (!frozen.ok) return;
    expect(frozen.value.modelVersion).toBe('decision-balance-catalog-snapshot.v2');
    expect(frozen.value.balances).toHaveLength(7);
    expect(
      frozen.value.balances.filter((balance) => balance.balanceKind === 'information_requirement'),
    ).toHaveLength(2);
  });

  it('scores the detailed safety assessment only when the exact passive-death-wish fact is present', () => {
    const absent = compileRubricWithAllInformationRequirements();
    expect(
      absent.rubric.includedRules.some(
        (rule) => rule.ruleRef.id === 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
      ),
    ).toBe(false);
    expect(absent.rubric.includedRules).toHaveLength(7);

    const { rubric, passiveDeathWishSafety, attachedPassiveDeathWishSafety } =
      compileRubricWithAllInformationRequirements(patientStateWithPassiveDeathWish);
    expect(rubric.includedRules).toHaveLength(8);
    expect(passiveDeathWishSafety.balanceRef).toBeNull();
    expect(attachedPassiveDeathWishSafety.balanceRef).toEqual({
      id: 'balance.mdd-passive-death-wish-safety-assessment',
      contentVersion: '1.0.0',
    });
    expect(passiveDeathWishSafety.patientWhen).toEqual({
      type: 'all',
      predicates: [
        route.patientWhen,
        {
          type: 'fact',
          fact: {
            recordKind: 'canonical_finding',
            identityId: 'finding.safety.current-passive-death-wish',
            identityContentVersion: '1.0.0',
            attributeId: 'finding.outcome',
            valueId: 'finding-outcome.present',
          },
        },
      ],
    });
    expect(JSON.stringify(passiveDeathWishSafety)).not.toContain('clinicalTagPresent');
    expect(passiveDeathWishSafetyBalance).toMatchObject({
      balanceKind: 'information_requirement',
      component: 'workup',
      outcomes: {
        fulfilled: { impactBand: 'major', points: 50 },
        omitted: { impactBand: 'major', points: -80 },
      },
    });

    const allOtherInformationActionIds = [
      'info.history.allergies-adverse-reactions',
      'info.history.depressive-symptoms',
      'info.history.mania',
      'info.history.medication-reconciliation',
      'info.history.presenting-problem',
      'info.history.substance-use',
    ];
    const databasePlanDecision = decisionSelecting(treatmentStarting(['medication.sertraline']), [
      ...allOtherInformationActionIds,
      'info.history.suicide-safety',
    ]);
    for (const scenario of [
      {
        name: 'detailed assessment obtained',
        informationActionIds: [...allOtherInformationActionIds, 'info.history.suicide-safety'],
        expectedPoints: 465,
        expectedSafetyPoints: 50,
      },
      {
        name: 'detailed assessment omitted',
        informationActionIds: allOtherInformationActionIds,
        expectedPoints: 335,
        expectedSafetyPoints: -80,
      },
    ] as const) {
      const request = {
        compiledRubric: rubric,
        currentRegimen: [],
        playerDecision: decisionSelecting(treatmentStarting(['medication.sertraline']), [
          ...scenario.informationActionIds,
        ]),
        databasePlanDecision,
        balanceCatalog,
        medicationRegimenKnowledgeCatalog: regimenCatalog,
      };
      const result = compileNativeDecisionPointReport(request);
      expect(compileNativeDecisionPointReport(request), `${scenario.name}: replay`).toEqual(result);
      expect(result.ok, scenario.name).toBe(true);
      if (!result.ok) continue;
      expect(result.value.report.databasePlanPoints).toBe(465);
      expect(
        result.value.playerRuleMatches.reduce(
          (total, evaluation) => total + evaluation.appliedPoints,
          0,
        ),
      ).toBe(scenario.expectedPoints);
      expect(
        result.value.report.ruleTrace.find(
          (row) =>
            row.source.kind === 'compiled_decision_rule' &&
            row.source.ruleRef.id === 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
        ),
      ).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-passive-death-wish-safety-assessment',
          contentVersion: '1.0.0',
        },
        component: 'workup',
        matched: true,
        status: 'applied',
        pointsBeforeCombination: scenario.expectedSafetyPoints,
        appliedPoints: scenario.expectedSafetyPoints,
        triggeredInformationPrerequisiteEvaluation: null,
        relatedSelectedActionTargets:
          scenario.expectedSafetyPoints > 0
            ? [
                {
                  kind: 'information_action',
                  informationActionId: 'info.history.suicide-safety',
                },
              ]
            : [],
      });
    }
  });

  it('scores obtained and omitted direct histories without a treatment trigger', () => {
    const { rubric } = compileRubricWithAllInformationRequirements();
    const allInformationActionIds = [
      'info.history.allergies-adverse-reactions',
      'info.history.depressive-symptoms',
      'info.history.mania',
      'info.history.medication-reconciliation',
      'info.history.presenting-problem',
      'info.history.substance-use',
    ];
    const databasePlanDecision = decisionSelecting(
      treatmentStarting(['medication.sertraline']),
      allInformationActionIds,
    );
    const scenarios = [
      {
        name: 'all histories and one reviewed medication',
        starts: ['medication.sertraline'],
        informationActionIds: allInformationActionIds,
        expectedPoints: 415,
        episodePoints: 35,
        syndromePoints: 50,
      },
      {
        name: 'preferred substance history without medication',
        starts: [] as string[],
        informationActionIds: ['info.history.substance-use'],
        expectedPoints: -55,
        episodePoints: -35,
        syndromePoints: -50,
      },
      {
        name: 'direct histories without medication',
        starts: [] as string[],
        informationActionIds: [
          'info.history.depressive-symptoms',
          'info.history.presenting-problem',
        ],
        expectedPoints: 85,
        episodePoints: 35,
        syndromePoints: 50,
      },
      {
        name: 'medication with treatment-triggered histories but no focused histories',
        starts: ['medication.sertraline'],
        informationActionIds: [
          'info.history.allergies-adverse-reactions',
          'info.history.medication-reconciliation',
        ],
        expectedPoints: 130,
        episodePoints: -35,
        syndromePoints: -50,
      },
      {
        name: 'medication without any history',
        starts: ['medication.sertraline'],
        informationActionIds: [] as string[],
        expectedPoints: 0,
        episodePoints: -35,
        syndromePoints: -50,
      },
    ] as const;

    for (const scenario of scenarios) {
      const result = compileNativeDecisionPointReport({
        compiledRubric: rubric,
        currentRegimen: [],
        playerDecision: decisionSelecting(treatmentStarting([...scenario.starts]), [
          ...scenario.informationActionIds,
        ]),
        databasePlanDecision,
        balanceCatalog,
        medicationRegimenKnowledgeCatalog: regimenCatalog,
      });
      expect(result.ok, scenario.name).toBe(true);
      if (!result.ok) continue;
      expect(result.value.report.databasePlanPoints).toBe(415);
      expect(
        result.value.playerRuleMatches.reduce(
          (total, evaluation) => total + evaluation.appliedPoints,
          0,
        ),
      ).toBe(scenario.expectedPoints);

      for (const [ruleId, balanceId, expectedPoints, informationActionId] of [
        [
          'rule.diagnosis-mdd.initial-episode-course-assessment',
          'balance.mdd-initial-episode-course-assessment',
          scenario.episodePoints,
          'info.history.presenting-problem',
        ],
        [
          'rule.diagnosis-mdd.initial-depressive-syndrome-assessment',
          'balance.mdd-initial-depressive-syndrome-assessment',
          scenario.syndromePoints,
          'info.history.depressive-symptoms',
        ],
      ] as const) {
        const row = result.value.report.ruleTrace.find(
          (candidate) =>
            candidate.source.kind === 'compiled_decision_rule' &&
            candidate.source.ruleRef.id === ruleId,
        );
        const fulfilled = scenario.informationActionIds.some(
          (selectedInformationActionId) => selectedInformationActionId === informationActionId,
        );
        expect(row, `${scenario.name}: ${ruleId}`).toMatchObject({
          balanceRef: { id: balanceId, contentVersion: '1.3.0' },
          component: 'workup',
          matched: true,
          status: 'applied',
          pointsBeforeCombination: expectedPoints,
          appliedPoints: expectedPoints,
          triggeredInformationPrerequisiteEvaluation: null,
          relatedSelectedActionTargets: fulfilled
            ? [{ kind: 'information_action', informationActionId }]
            : [],
        });
      }

      const substanceHistoryRow = result.value.report.ruleTrace.find(
        (candidate) =>
          candidate.source.kind === 'compiled_decision_rule' &&
          candidate.source.ruleRef.id === 'rule.diagnosis-mdd.substance-history',
      );
      const substanceHistorySelected = scenario.informationActionIds.some(
        (informationActionId) => informationActionId === 'info.history.substance-use',
      );
      expect(substanceHistoryRow, `${scenario.name}: substance history`).toMatchObject({
        balanceRef: {
          id: 'balance.mdd-substance-history',
          contentVersion: '1.3.0',
        },
        component: 'workup',
        matched: substanceHistorySelected,
        status: substanceHistorySelected ? 'applied' : 'not_triggered',
        pointsBeforeCombination: substanceHistorySelected ? 30 : 0,
        appliedPoints: substanceHistorySelected ? 30 : 0,
        triggeredInformationPrerequisiteEvaluation: null,
      });
    }
  });

  it('rejects a schema-valid matched balance crossed onto a triggered prerequisite', () => {
    const { prerequisites } = compileRubricWithPrerequisites(primaryOnlyBalanceCatalog);
    const reconciliationPrerequisite = prerequisites.find(
      (candidate) => candidate.ruleRef.id === 'rule.diagnosis-mdd.any-medication-reconciliation',
    );
    if (reconciliationPrerequisite === undefined) {
      throw new Error('The reconciliation prerequisite fixture is missing.');
    }
    const crossedCatalog = DecisionBalanceCatalogSchema.parse({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'decision-balance-catalog.test.shape-crossing',
      balances: [
        {
          ...routeBalance,
          id: 'balance.test.matched-shape-on-prerequisite',
          ruleRef: reconciliationPrerequisite.ruleRef,
        },
      ],
    });

    expect(
      attachDecisionBalance({
        candidate: reconciliationPrerequisite,
        balanceCatalog: crossedCatalog,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'BALANCE_SHAPE_MISMATCH' },
    });
  });

  it('rejects a schema-valid matched balance crossed onto a direct information requirement', () => {
    const { directRequirements } = compileRubricWithAllInformationRequirements();
    const episodeRequirement = directRequirements.find(
      (candidate) =>
        candidate.ruleRef.id === 'rule.diagnosis-mdd.initial-episode-course-assessment',
    );
    if (episodeRequirement === undefined) {
      throw new Error('The direct episode-course requirement fixture is missing.');
    }
    const crossedCatalog = DecisionBalanceCatalogSchema.parse({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'decision-balance-catalog.test.direct-shape-crossing',
      balances: [
        {
          ...routeBalance,
          id: 'balance.test.matched-shape-on-direct-information-requirement',
          ruleRef: episodeRequirement.ruleRef,
        },
      ],
    });

    expect(
      attachDecisionBalance({
        candidate: episodeRequirement,
        balanceCatalog: crossedCatalog,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'BALANCE_SHAPE_MISMATCH' },
    });
  });

  it('derives +200 only from the complete one-eligible-and-one-total-start route', () => {
    const { rubric } = compileRubric();
    const compile = (startMedicationIds: string[]) =>
      compileNativeDecisionPointReport({
        compiledRubric: rubric,
        currentRegimen: patientState.medicationRegimenEntries,
        playerDecision: decisionSelecting(treatmentStarting(startMedicationIds)),
        databasePlanDecision: decisionSelecting(treatmentStarting(['medication.sertraline'])),
        balanceCatalog,
        medicationRegimenKnowledgeCatalog: regimenCatalog,
      });

    const one = compile(['medication.sertraline']);
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    expect(GeneratedEncounterPointReportInputSchema.parse(one.value.report)).toEqual(
      one.value.report,
    );
    expect(one.value.report).toMatchObject({
      databasePlanPoints: 200,
      playerDecision: {
        informationActionIds: [],
        diagnosisSelections: [],
        treatmentSelection: treatmentStarting(['medication.sertraline']),
      },
      databasePlanDecision: {
        informationActionIds: [],
        diagnosisSelections: [],
        treatmentSelection: treatmentStarting(['medication.sertraline']),
      },
      ruleTrace: [
        {
          matched: true,
          status: 'applied',
          pointsBeforeCombination: 200,
          appliedPoints: 200,
          component: 'medication_selection',
        },
      ],
    });
    const { databasePlanDecision, ...withoutDatabasePlanDecision } = one.value.report;
    expect(
      GeneratedEncounterPointReportInputSchema.safeParse({
        ...withoutDatabasePlanDecision,
        databasePlanTreatment: databasePlanDecision.treatmentSelection,
      }).success,
    ).toBe(false);

    for (const starts of [
      [],
      ['medication.citalopram'],
      ['medication.sertraline', 'medication.fluoxetine'],
    ]) {
      const result = compile(starts);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.report.databasePlanPoints).toBe(200);
      expect(result.value.report.ruleTrace[0]).toMatchObject({
        matched: false,
        status: 'not_triggered',
        pointsBeforeCombination: 0,
        appliedPoints: 0,
      });
    }
  });

  it('is independent of membership input order and never consults free tags or complexity', () => {
    const { rubric } = compileRubricWithPrerequisites();
    const playerDecision = decisionSelecting(treatmentStarting(['medication.bupropion']), [
      'info.history.medication-reconciliation',
    ]);
    const databasePlanDecision = decisionSelecting(treatmentStarting(['medication.sertraline']), [
      'info.history.allergies-adverse-reactions',
      'info.history.medication-reconciliation',
    ]);
    const normal = compileNativeDecisionPointReport({
      compiledRubric: rubric,
      currentRegimen: [],
      playerDecision,
      databasePlanDecision,
      balanceCatalog,
      medicationRegimenKnowledgeCatalog: regimenCatalog,
    });
    const reordered = compileNativeDecisionPointReport({
      compiledRubric: rubric,
      currentRegimen: [],
      playerDecision,
      databasePlanDecision,
      balanceCatalog: {
        ...balanceCatalog,
        balances: [...balanceCatalog.balances].reverse(),
      },
      medicationRegimenKnowledgeCatalog: {
        ...regimenCatalog,
        classMemberships: [...regimenCatalog.classMemberships].reverse(),
      },
    });
    expect(normal).toEqual(reordered);
    expect(JSON.stringify(normal)).not.toContain('clinical-tag.must-not-drive');
    expect(JSON.stringify(normal)).not.toContain('complexity');
  });

  it('scores all three prerequisite outcomes and preserves exact database-plan arithmetic', () => {
    const { rubric } = compileRubricWithPrerequisites();
    expect(rubric.includedRules).toHaveLength(3);
    const databasePlanDecision = decisionSelecting(treatmentStarting(['medication.sertraline']), [
      'info.history.allergies-adverse-reactions',
      'info.history.medication-reconciliation',
    ]);
    const scenarios = [
      {
        name: 'information without medication',
        starts: [] as string[],
        informationActionIds: [
          'info.history.allergies-adverse-reactions',
          'info.history.medication-reconciliation',
        ],
        expectedPoints: 0,
        reconciliation: {
          status: 'not_triggered',
          triggerSelected: false,
          fulfillmentSelected: true,
          points: 0,
        },
        reaction: {
          status: 'not_triggered',
          triggerSelected: false,
          fulfillmentSelected: true,
          points: 0,
        },
      },
      {
        name: 'medication without either history',
        starts: ['medication.sertraline'],
        informationActionIds: [] as string[],
        expectedPoints: 135,
        reconciliation: {
          status: 'omitted',
          triggerSelected: true,
          fulfillmentSelected: false,
          points: -25,
        },
        reaction: {
          status: 'omitted',
          triggerSelected: true,
          fulfillmentSelected: false,
          points: -40,
        },
      },
      {
        name: 'medication with reconciliation only',
        starts: ['medication.sertraline'],
        informationActionIds: ['info.history.medication-reconciliation'],
        expectedPoints: 195,
        reconciliation: {
          status: 'fulfilled',
          triggerSelected: true,
          fulfillmentSelected: true,
          points: 35,
        },
        reaction: {
          status: 'omitted',
          triggerSelected: true,
          fulfillmentSelected: false,
          points: -40,
        },
      },
      {
        name: 'medication with reaction history only',
        starts: ['medication.sertraline'],
        informationActionIds: ['info.history.allergies-adverse-reactions'],
        expectedPoints: 205,
        reconciliation: {
          status: 'omitted',
          triggerSelected: true,
          fulfillmentSelected: false,
          points: -25,
        },
        reaction: {
          status: 'fulfilled',
          triggerSelected: true,
          fulfillmentSelected: true,
          points: 30,
        },
      },
      {
        name: 'medication with both histories',
        starts: ['medication.sertraline'],
        informationActionIds: [
          'info.history.allergies-adverse-reactions',
          'info.history.medication-reconciliation',
        ],
        expectedPoints: 265,
        reconciliation: {
          status: 'fulfilled',
          triggerSelected: true,
          fulfillmentSelected: true,
          points: 35,
        },
        reaction: {
          status: 'fulfilled',
          triggerSelected: true,
          fulfillmentSelected: true,
          points: 30,
        },
      },
    ] as const;

    for (const scenario of scenarios) {
      const result = compileNativeDecisionPointReport({
        compiledRubric: rubric,
        currentRegimen: [],
        playerDecision: decisionSelecting(treatmentStarting([...scenario.starts]), [
          ...scenario.informationActionIds,
        ]),
        databasePlanDecision,
        balanceCatalog,
        medicationRegimenKnowledgeCatalog: regimenCatalog,
      });
      expect(result.ok, scenario.name).toBe(true);
      if (!result.ok) continue;
      expect(GeneratedEncounterPointReportInputSchema.parse(result.value.report)).toEqual(
        result.value.report,
      );
      expect(result.value.report.databasePlanPoints).toBe(265);
      expect(
        result.value.playerRuleMatches.reduce(
          (total, evaluation) => total + evaluation.appliedPoints,
          0,
        ),
      ).toBe(scenario.expectedPoints);

      for (const [ruleId, expected, balanceId] of [
        [
          'rule.diagnosis-mdd.any-medication-reconciliation',
          scenario.reconciliation,
          'balance.mdd-any-medication-reconciliation',
        ],
        [
          'rule.diagnosis-mdd.any-medication-reaction-history',
          scenario.reaction,
          'balance.mdd-any-medication-reaction-history',
        ],
      ] as const) {
        const row = result.value.report.ruleTrace.find(
          (candidate) =>
            candidate.source.kind === 'compiled_decision_rule' &&
            candidate.source.ruleRef.id === ruleId,
        );
        expect(row, `${scenario.name}: ${ruleId}`).toMatchObject({
          balanceRef: { id: balanceId, contentVersion: '1.3.0' },
          component: 'workup',
          matched: expected.triggerSelected,
          status: expected.triggerSelected ? 'applied' : 'not_triggered',
          pointsBeforeCombination: expected.points,
          appliedPoints: expected.points,
          triggeredInformationPrerequisiteEvaluation: {
            status: expected.status,
            triggerSelected: expected.triggerSelected,
            fulfillmentSelected: expected.fulfillmentSelected,
          },
        });
      }
    }
  });

  it('activates any-medication prerequisites even when duplicate starts fail the primary route', () => {
    const { rubric } = compileRubricWithPrerequisites();
    const result = compileNativeDecisionPointReport({
      compiledRubric: rubric,
      currentRegimen: [],
      playerDecision: decisionSelecting(
        treatmentStarting(['medication.sertraline', 'medication.fluoxetine']),
      ),
      databasePlanDecision: decisionSelecting(treatmentStarting(['medication.sertraline']), [
        'info.history.allergies-adverse-reactions',
        'info.history.medication-reconciliation',
      ]),
      balanceCatalog,
      medicationRegimenKnowledgeCatalog: regimenCatalog,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.databasePlanPoints).toBe(265);
    expect(
      result.value.playerRuleMatches.reduce(
        (total, evaluation) => total + evaluation.appliedPoints,
        0,
      ),
    ).toBe(-65);
    expect(
      result.value.report.ruleTrace.find(
        (row) => row.source.kind === 'compiled_decision_rule' && row.source.ruleRef.id === route.id,
      ),
    ).toMatchObject({ matched: false, status: 'not_triggered', appliedPoints: 0 });
    for (const ruleId of [
      'rule.diagnosis-mdd.any-medication-reconciliation',
      'rule.diagnosis-mdd.any-medication-reaction-history',
    ]) {
      expect(
        result.value.report.ruleTrace.find(
          (row) => row.source.kind === 'compiled_decision_rule' && row.source.ruleRef.id === ruleId,
        ),
      ).toMatchObject({
        matched: true,
        status: 'applied',
        triggeredInformationPrerequisiteEvaluation: {
          status: 'omitted',
          triggerSelected: true,
          fulfillmentSelected: false,
        },
        relatedSelectedActionTargets: [{ kind: 'any_medication_start' }],
      });
    }
  });

  it('retains exact prerequisite state when a qualitative rule is still unbalanced', () => {
    const { rubric } = compileRubricWithPrerequisites(primaryOnlyBalanceCatalog);
    const result = compileNativeDecisionPointReport({
      compiledRubric: rubric,
      currentRegimen: [],
      playerDecision: decisionSelecting(treatmentStarting(['medication.sertraline'])),
      databasePlanDecision: decisionSelecting(treatmentStarting(['medication.sertraline']), [
        'info.history.allergies-adverse-reactions',
        'info.history.medication-reconciliation',
      ]),
      balanceCatalog: primaryOnlyBalanceCatalog,
      medicationRegimenKnowledgeCatalog: regimenCatalog,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.databasePlanPoints).toBe(200);
    const playerPrerequisites = result.value.report.ruleTrace.filter(
      (row) =>
        row.source.kind === 'compiled_decision_rule' &&
        row.source.ruleRef.kind === 'diagnosis_rule',
    );
    expect(playerPrerequisites).toHaveLength(2);
    for (const row of playerPrerequisites) {
      expect(row).toMatchObject({
        balanceRef: null,
        matched: true,
        status: 'unbalanced',
        pointsBeforeCombination: null,
        appliedPoints: 0,
        triggeredInformationPrerequisiteEvaluation: {
          status: 'omitted',
          triggerSelected: true,
          fulfillmentSelected: false,
        },
        relatedSelectedActionTargets: [{ kind: 'any_medication_start' }],
      });
    }
    for (const audit of result.value.databasePlanRuleMatches.filter(
      (row) => row.ruleRef.kind === 'diagnosis_rule',
    )) {
      expect(audit).toMatchObject({
        balanceRef: null,
        matched: true,
        appliedPoints: 0,
        triggeredInformationPrerequisiteEvaluation: {
          status: 'fulfilled',
          triggerSelected: true,
          fulfillmentSelected: true,
        },
      });
    }
  });

  it('applies native combination semantics after evaluating exact secondary rules', () => {
    const primary = compileRubric();
    if (primary.adapted.patientWhen === null) {
      throw new Error('The synthetic secondary-rule test requires the reviewed MDD patient scope.');
    }
    const shared = {
      schemaVersion: 1 as const,
      patientWhen: primary.adapted.patientWhen,
      actionWhen: {
        match: 'all' as const,
        targets: [
          {
            kind: 'medication_start' as const,
            medicationIdentityId: 'medication.sertraline',
          },
        ],
      },
      triggeredInformationPrerequisite: null,
      certaintyLevel: 'moderate' as const,
      balanceRef: null,
      developerOpinionIds: primary.adapted.developerOpinionIds,
      review: primary.adapted.review,
    };
    const fit = DecisionRuleCandidateDefinitionSchema.parse({
      ...shared,
      ruleRef: {
        kind: 'medication_regimen_contributor',
        id: 'medication-regimen-contributor.test.sertraline-fit',
        contentVersion: '1.0.0',
        ownerId: diagnosis.id,
        ownerContentVersion: diagnosis.contentVersion,
      },
      label: 'Synthetic exact sertraline fit',
      ruleKind: 'fit',
      discoveryLane: 'full_state_modifier',
      stance: 'acceptable',
      concernLevel: 'moderate',
      effectId: 'effect.test.sertraline-fit',
      issueId: null,
      specificityPriority: 10,
      rationale: 'Synthetic D-245 scorer integration fixture.',
    });
    const contraindication = DecisionRuleCandidateDefinitionSchema.parse({
      ...shared,
      ruleRef: {
        kind: 'medication_regimen_contributor',
        id: 'medication-regimen-contributor.test.sertraline-contraindication',
        contentVersion: '1.0.0',
        ownerId: diagnosis.id,
        ownerContentVersion: diagnosis.contentVersion,
      },
      label: 'Synthetic exact sertraline contraindication',
      ruleKind: 'contraindication',
      discoveryLane: 'automatic_guardrail',
      stance: 'contraindicated',
      concernLevel: 'critical',
      effectId: null,
      issueId: 'issue.test.sertraline-contraindication',
      specificityPriority: 100,
      rationale: 'Synthetic D-245 scorer integration fixture.',
    });
    const syntheticBalanceCatalog = DecisionBalanceCatalogSchema.parse({
      ...balanceCatalog,
      id: 'registry.catalog.decision-balances.test.native-combination',
      balances: [
        routeBalance,
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'balance.test.sertraline-fit',
          ruleRef: fit.ruleRef,
          balanceStatus: 'provisional_balance',
          impactBand: 'major',
          component: 'medication_selection',
          pointsWhenMatched: 35,
          unmatchedBehavior: 'not_triggered_zero',
          matchedExplanation: 'Synthetic fit matched.',
          unmatchedExplanation: 'Synthetic fit did not match.',
          rationale: 'Synthetic D-245 scorer integration fixture.',
          developerOpinionIds: fit.developerOpinionIds,
        },
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'balance.test.sertraline-contraindication',
          ruleRef: contraindication.ruleRef,
          balanceStatus: 'provisional_balance',
          impactBand: 'critical',
          component: 'safety',
          pointsWhenMatched: -150,
          unmatchedBehavior: 'not_triggered_zero',
          matchedExplanation: 'Synthetic contraindication matched.',
          unmatchedExplanation: 'Synthetic contraindication did not match.',
          rationale: 'Synthetic D-245 scorer integration fixture.',
          developerOpinionIds: contraindication.developerOpinionIds,
        },
      ],
    });
    const attachedFit = attachDecisionBalance({
      candidate: fit,
      balanceCatalog: syntheticBalanceCatalog,
    });
    const attachedContraindication = attachDecisionBalance({
      candidate: contraindication,
      balanceCatalog: syntheticBalanceCatalog,
    });
    if (!attachedFit.ok) throw new Error(attachedFit.error.message);
    if (!attachedContraindication.ok) {
      throw new Error(attachedContraindication.error.message);
    }
    const compiled = compileDecisionPolicy({
      policy,
      patientState,
      actionHorizon,
      rules: [primary.attached, attachedFit.value, attachedContraindication.value],
    });
    if (!compiled.ok) throw new Error(compiled.error.message);

    const result = compileNativeDecisionPointReport({
      compiledRubric: compiled.value,
      currentRegimen: [],
      playerDecision: decisionSelecting(treatmentStarting(['medication.sertraline'])),
      databasePlanDecision: decisionSelecting(treatmentStarting(['medication.bupropion'])),
      balanceCatalog: syntheticBalanceCatalog,
      medicationRegimenKnowledgeCatalog: regimenCatalog,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.databasePlanPoints).toBe(200);
    expect(result.value.report.ruleTrace.reduce((total, row) => total + row.appliedPoints, 0)).toBe(
      -150,
    );

    const byRuleId = new Map(
      result.value.report.ruleTrace.flatMap((row) =>
        row.source.kind === 'compiled_decision_rule' ? [[row.source.ruleRef.id, row] as const] : [],
      ),
    );
    const contraindicationRow = byRuleId.get(contraindication.ruleRef.id);
    expect(contraindicationRow).toMatchObject({
      status: 'applied',
      pointsBeforeCombination: -150,
      appliedPoints: -150,
      relatedSelectedActionTargets: [
        { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
      ],
    });
    for (const ruleId of [route.id, fit.ruleRef.id]) {
      expect(byRuleId.get(ruleId)).toMatchObject({
        status: 'suppressed',
        appliedPoints: 0,
        resolvedByTraceId: contraindicationRow?.id,
        combinationExplanation: expect.stringContaining('hard contraindication'),
      });
    }

    const unbalancedFit = attachDecisionBalance({
      candidate: fit,
      balanceCatalog: primaryOnlyBalanceCatalog,
    });
    if (!unbalancedFit.ok) throw new Error(unbalancedFit.error.message);
    const unbalancedRubric = compileDecisionPolicy({
      policy,
      patientState,
      actionHorizon,
      rules: [primary.attached, unbalancedFit.value],
    });
    if (!unbalancedRubric.ok) throw new Error(unbalancedRubric.error.message);
    const unbalancedResult = compileNativeDecisionPointReport({
      compiledRubric: unbalancedRubric.value,
      currentRegimen: [],
      playerDecision: decisionSelecting(treatmentStarting(['medication.sertraline'])),
      databasePlanDecision: decisionSelecting(treatmentStarting(['medication.bupropion'])),
      balanceCatalog: primaryOnlyBalanceCatalog,
      medicationRegimenKnowledgeCatalog: regimenCatalog,
    });
    expect(unbalancedResult.ok).toBe(true);
    if (!unbalancedResult.ok) return;
    expect(
      unbalancedResult.value.report.ruleTrace.find(
        (row) =>
          row.source.kind === 'compiled_decision_rule' && row.source.ruleRef.id === fit.ruleRef.id,
      ),
    ).toMatchObject({
      status: 'unbalanced',
      matched: true,
      appliedPoints: 0,
      relatedSelectedActionTargets: [
        { kind: 'medication_start', medicationIdentityId: 'medication.sertraline' },
      ],
    });
  });

  it('fails closed for stale attachment targets and missing exact balance owners', () => {
    const adapted = adaptFocusedMedicationRegimenRoute({
      route,
      diagnosis,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
    });
    if (!adapted.ok) throw new Error(adapted.error.message);
    const staleCatalog = DecisionBalanceCatalogSchema.parse({
      ...primaryOnlyBalanceCatalog,
      balances: [
        {
          ...routeBalance,
          ruleRef: { ...routeBalance.ruleRef, contentVersion: '9.9.9' },
        },
      ],
    });
    expect(
      attachDecisionBalance({ candidate: adapted.value, balanceCatalog: staleCatalog }),
    ).toMatchObject({ ok: false, error: { code: 'BALANCE_TARGET_STALE' } });
    expect(
      attachDecisionBalance({
        candidate: {
          ...adapted.value,
          balanceRef: {
            id: 'balance.test.missing-owner',
            contentVersion: '1.0.0',
          },
        },
        balanceCatalog: {
          ...primaryOnlyBalanceCatalog,
          balances: [],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: 'BALANCE_REFERENCE_MISSING' } });

    const { rubric } = compileRubricWithPrerequisites();
    expect(
      compileNativeDecisionPointReport({
        compiledRubric: rubric,
        currentRegimen: [],
        playerDecision: decisionSelecting(treatmentStarting(['medication.sertraline'])),
        databasePlanDecision: decisionSelecting(treatmentStarting(['medication.sertraline']), [
          'info.history.allergies-adverse-reactions',
          'info.history.medication-reconciliation',
        ]),
        balanceCatalog: {
          ...balanceCatalog,
          balances: balanceCatalog.balances.filter(
            (balance) => balance.id !== reconciliationBalance.id,
          ),
        },
        medicationRegimenKnowledgeCatalog: regimenCatalog,
      }),
    ).toMatchObject({ ok: false, error: { code: 'BALANCE_REFERENCE_MISSING' } });
  });
});
