import {
  DecisionActionHorizonSchema,
  DecisionPolicyCatalogSchema,
  DiagnosisDefinitionSchema,
  MedicationRegimenKnowledgeCatalogSchema,
  ResolvedPatientStateSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import mddDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/major-depressive-disorder.diagnosis.json';
import decisionPolicyCatalogJson from '../../../content/catalogs/decision-policies/catalog.json';
import medicationRegimenCatalogJson from '../../../content/catalogs/medications/regimen-knowledge.json';
import { compileDecisionPolicy } from './decision-policy';
import {
  adaptFocusedMedicationRegimenRoute,
  evaluateMedicationRegimenTransition,
} from './medication-regimen-route-adapter';

const diagnosis = DiagnosisDefinitionSchema.parse(mddDiagnosisJson);
const regimenCatalog = MedicationRegimenKnowledgeCatalogSchema.parse(medicationRegimenCatalogJson);
const policyCatalog = DecisionPolicyCatalogSchema.parse(decisionPolicyCatalogJson);
const route = regimenCatalog.focusedRoutes[0]!;
const policy = policyCatalog.policies[0]!;

const reviewedMedicationIds = [
  'medication.bupropion',
  'medication.escitalopram',
  'medication.fluoxetine',
  'medication.mirtazapine',
  'medication.sertraline',
];

const makePatientState = () =>
  ResolvedPatientStateSchema.parse({
    schemaVersion: 1,
    id: 'resolved-patient-state.test.real-mdd-route',
    demographics: {
      recordVersion: 2,
      ageYears: 42,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    },
    conditionStates: [
      {
        schemaVersion: 1,
        id: 'condition-state.test.real-mdd-route',
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
          ownerId: 'patient-template.test.real-mdd-route',
          ownerContentVersion: '1.0.0',
        },
      },
    ],
    diagnosisRecordEntries: [],
    medicationRegimenEntries: [],
    exposureInventory: {
      schemaVersion: 1,
      id: 'resolved-exposure-inventory.test.real-mdd-route',
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
      id: 'resolved-proposition-state.test.real-mdd-route',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    clinicalTagIds: ['clinical-tag.must-not-drive-real-mdd-route'],
    reportedSafetyPlanningAbility: 'unassessed',
  });

describe('real MDD regimen route adapter', () => {
  it('adapts the reviewed catalog route without interpreting compatibility tags', () => {
    const adapted = adaptFocusedMedicationRegimenRoute({
      route,
      diagnosis,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
    });
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;

    expect(adapted.value.ruleRef).toEqual(policy.primaryRouteRef);
    expect(adapted.value.stance).toBe('acceptable');
    expect(adapted.value.concernLevel).toBe('major');
    expect(adapted.value.certaintyLevel).toBe('strong');
    expect(adapted.value.balanceRef).toBeNull();
    expect(adapted.value.actionWhen).toEqual({
      match: 'any',
      targets: reviewedMedicationIds.map((medicationIdentityId) => ({
        kind: 'medication_start',
        medicationIdentityId,
      })),
    });
    expect(JSON.stringify(adapted.value)).not.toContain('medicationTagId');
    expect(JSON.stringify(adapted.value)).not.toContain('clinicalTagId');
  });

  it('evaluates the complete route cardinality separately from its discovery anchor', () => {
    const evaluate = (startMedicationIds: string[]) =>
      evaluateMedicationRegimenTransition({
        route,
        currentRegimen: [],
        selection: {
          selectionVersion: 2,
          startMedicationIds,
          adjustments: [],
        },
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
      });

    const oneReviewed = evaluate(['medication.sertraline']);
    expect(oneReviewed.ok && oneReviewed.value.matched).toBe(true);

    const nonmember = evaluate(['medication.citalopram']);
    expect(nonmember.ok && nonmember.value.matched).toBe(false);

    const twoReviewed = evaluate(['medication.sertraline', 'medication.fluoxetine']);
    expect(twoReviewed.ok && twoReviewed.value.matched).toBe(false);

    const none = evaluate([]);
    expect(none.ok && none.value.matched).toBe(false);
  });

  it('compiles the real route and policy against exact typed MDD state', () => {
    const adapted = adaptFocusedMedicationRegimenRoute({
      route,
      diagnosis,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
    });
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;

    const actionHorizon = DecisionActionHorizonSchema.parse({
      schemaVersion: 1,
      id: 'decision-action-horizon.test.real-mdd-route',
      informationActionIds: [],
      startMedicationIds: reviewedMedicationIds,
      regimenEntryOperations: [],
      interventionIds: [],
      dispositionIds: [],
    });
    const compiled = compileDecisionPolicy({
      policy,
      patientState: makePatientState(),
      actionHorizon,
      rules: [adapted.value],
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.value.primaryRouteRef).toEqual(policy.primaryRouteRef);
    expect(compiled.value.includedRules).toHaveLength(1);
    expect(compiled.value.includedRules[0]?.matchedActionTargets).toEqual(
      reviewedMedicationIds.map((medicationIdentityId) => ({
        kind: 'medication_start',
        medicationIdentityId,
      })),
    );
    expect(compiled.value.coverageDiagnostics).toEqual([]);
  });

  it('rejects a stale or unreviewed explicit class instead of falling back to tags', () => {
    const staleRoute = {
      ...route,
      transitionMatch: {
        type: 'startCount' as const,
        target: {
          kind: 'class' as const,
          medicationClassId: regimenCatalog.medicationClasses[0]!.id,
          medicationClassContentVersion: '9.9.9',
        },
        minimumCount: 1,
        maximumCount: 1,
      },
    };
    const adapted = adaptFocusedMedicationRegimenRoute({
      route: staleRoute,
      diagnosis,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
    });
    expect(adapted).toMatchObject({
      ok: false,
      error: { code: 'MEDICATION_CLASS_STALE' },
    });
  });
});
