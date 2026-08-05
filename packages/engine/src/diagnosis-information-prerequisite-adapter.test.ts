import {
  CaseTreatmentSelectionPredicateSchema,
  DecisionPolicyCatalogSchema,
  DiagnosisDefinitionSchema,
  FindingDefinitionSchema,
  MedicationRegimenKnowledgeCatalogSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import mddDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/major-depressive-disorder.diagnosis.json';
import decisionPolicyCatalogJson from '../../../content/catalogs/decision-policies/catalog.json';
import passiveDeathWishFindingJson from '../../../content/catalogs/findings/definitions/current-passive-death-wish.finding.json';
import medicationRegimenCatalogJson from '../../../content/catalogs/medications/regimen-knowledge.json';
import {
  adaptDiagnosisInformationPrerequisite,
  adaptDiagnosisInformationRecommendation,
  adaptDiagnosisInformationRequirement,
} from './diagnosis-information-prerequisite-adapter';

const diagnosis = DiagnosisDefinitionSchema.parse(mddDiagnosisJson);
const policyCatalog = DecisionPolicyCatalogSchema.parse(decisionPolicyCatalogJson);
const regimenCatalog = MedicationRegimenKnowledgeCatalogSchema.parse(medicationRegimenCatalogJson);
const policy = policyCatalog.policies[0]!;
const primaryRoute = regimenCatalog.focusedRoutes[0]!;
const findingDefinitions = [FindingDefinitionSchema.parse(passiveDeathWishFindingJson)];
const reviewedMedicationIds = [
  'medication.bupropion',
  'medication.escitalopram',
  'medication.fluoxetine',
  'medication.mirtazapine',
  'medication.sertraline',
];

const adapt = (
  diagnosisRuleId: string,
  overrides: Partial<Parameters<typeof adaptDiagnosisInformationPrerequisite>[0]> = {},
) =>
  adaptDiagnosisInformationPrerequisite({
    diagnosis,
    diagnosisRuleId,
    policy,
    primaryRoute,
    medicationClasses: regimenCatalog.medicationClasses,
    classMemberships: regimenCatalog.classMemberships,
    findingDefinitions,
    ...overrides,
  });

describe('diagnosis information-prerequisite adapter', () => {
  it('keeps exact-class predicates out of compatibility-case workup evaluation', () => {
    expect(
      CaseTreatmentSelectionPredicateSchema.safeParse({
        type: 'treatmentStartedInClass',
        medicationClassId: 'medication-class.mdd-initial-first-line-antidepressant',
        medicationClassContentVersion: '1.0.0',
        minimumCount: 1,
        maximumCount: 5,
      }).success,
    ).toBe(false);
  });

  it('losslessly adapts both approved direct MDD information requirements', () => {
    for (const [ruleId, informationActionId] of [
      ['rule.diagnosis-mdd.initial-episode-course-assessment', 'info.history.presenting-problem'],
      [
        'rule.diagnosis-mdd.initial-depressive-syndrome-assessment',
        'info.history.depressive-symptoms',
      ],
    ] as const) {
      const adapted = adaptDiagnosisInformationRequirement({
        diagnosis,
        diagnosisRuleId: ruleId,
        policy,
        primaryRoute,
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
        findingDefinitions,
      });
      expect(adapted.ok).toBe(true);
      if (!adapted.ok) continue;
      expect(adapted.value).toMatchObject({
        ruleRef: {
          kind: 'diagnosis_rule',
          id: ruleId,
          contentVersion: diagnosis.contentVersion,
          ownerId: diagnosis.id,
          ownerContentVersion: diagnosis.contentVersion,
        },
        ruleKind: 'prerequisite',
        discoveryLane: 'automatic_guardrail',
        actionWhen: {
          match: 'any',
          targets: [{ kind: 'information_action', informationActionId }],
        },
        triggeredInformationPrerequisite: null,
        balanceRef: null,
      });
      expect(adapted.value.patientWhen).toEqual(primaryRoute.patientWhen);
      expect(JSON.stringify(adapted.value)).not.toContain('clinicalTagPresent');
    }
  });

  it('adapts the approved preferred substance history without inventing an omission trigger', () => {
    const adapted = adaptDiagnosisInformationRecommendation({
      diagnosis,
      diagnosisRuleId: 'rule.diagnosis-mdd.substance-history',
      policy,
      primaryRoute,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
      findingDefinitions,
    });
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;
    expect(adapted.value).toMatchObject({
      ruleRef: {
        kind: 'diagnosis_rule',
        id: 'rule.diagnosis-mdd.substance-history',
      },
      ruleKind: 'prerequisite',
      stance: 'preferred',
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.substance-use',
          },
        ],
      },
      triggeredInformationPrerequisite: null,
      balanceRef: null,
    });
  });

  it('refines the passive-death-wish requirement with one exact canonical patient fact', () => {
    const adapted = adaptDiagnosisInformationRequirement({
      diagnosis,
      diagnosisRuleId: 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
      policy,
      primaryRoute,
      medicationClasses: regimenCatalog.medicationClasses,
      classMemberships: regimenCatalog.classMemberships,
      findingDefinitions,
    });
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;
    expect(adapted.value).toMatchObject({
      ruleRef: {
        kind: 'diagnosis_rule',
        id: 'rule.diagnosis-mdd.passive-death-wish-safety-assessment',
        contentVersion: diagnosis.contentVersion,
        ownerId: diagnosis.id,
        ownerContentVersion: diagnosis.contentVersion,
      },
      ruleKind: 'prerequisite',
      patientWhen: {
        type: 'all',
        predicates: [
          primaryRoute.patientWhen,
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
      },
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.suicide-safety',
          },
        ],
      },
      triggeredInformationPrerequisite: null,
      balanceRef: null,
    });
    expect(JSON.stringify(adapted.value)).not.toContain('clinicalTagPresent');
    expect(JSON.stringify(adapted.value)).not.toContain('safety.passive-death-wish-without-intent');
  });

  it('rejects missing, stale, inactive, or outcome-incompatible native findings', () => {
    const ruleId = 'rule.diagnosis-mdd.passive-death-wish-safety-assessment';
    expect(
      adaptDiagnosisInformationRequirement({
        diagnosis,
        diagnosisRuleId: ruleId,
        policy,
        primaryRoute,
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
        findingDefinitions: [],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINDING_DEFINITION_MISSING' },
    });

    expect(
      adaptDiagnosisInformationRequirement({
        diagnosis,
        diagnosisRuleId: ruleId,
        policy,
        primaryRoute,
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
        findingDefinitions: findingDefinitions.map((finding) => ({
          ...finding,
          contentVersion: '9.9.9',
        })),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINDING_DEFINITION_VERSION_MISMATCH' },
    });

    expect(
      adaptDiagnosisInformationRequirement({
        diagnosis,
        diagnosisRuleId: ruleId,
        policy,
        primaryRoute,
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
        findingDefinitions: findingDefinitions.map((finding) => ({
          ...finding,
          lifecycle: 'draft' as const,
        })),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINDING_DEFINITION_INACTIVE' },
    });

    const incompatibleOutcomeDiagnosis = DiagnosisDefinitionSchema.parse({
      ...diagnosis,
      baseRules: diagnosis.baseRules.map((rule) =>
        rule.id === ruleId && rule.nativePatientWhen
          ? {
              ...rule,
              nativePatientWhen: {
                ...rule.nativePatientWhen,
                outcome: 'positive',
              },
            }
          : rule,
      ),
    });
    expect(
      adaptDiagnosisInformationRequirement({
        diagnosis: incompatibleOutcomeDiagnosis,
        diagnosisRuleId: ruleId,
        policy,
        primaryRoute,
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
        findingDefinitions,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINDING_DEFINITION_OUTCOME_UNSUPPORTED' },
    });
  });

  it('losslessly adapts both approved any-medication-start MDD prerequisites', () => {
    for (const [ruleId, informationActionId] of [
      [
        'rule.diagnosis-mdd.any-medication-reconciliation',
        'info.history.medication-reconciliation',
      ],
      [
        'rule.diagnosis-mdd.any-medication-reaction-history',
        'info.history.allergies-adverse-reactions',
      ],
    ] as const) {
      const adapted = adapt(ruleId);
      expect(adapted.ok).toBe(true);
      if (!adapted.ok) continue;
      expect(adapted.value).toMatchObject({
        ruleRef: {
          kind: 'diagnosis_rule',
          id: ruleId,
          contentVersion: diagnosis.contentVersion,
          ownerId: diagnosis.id,
          ownerContentVersion: diagnosis.contentVersion,
        },
        ruleKind: 'prerequisite',
        discoveryLane: 'automatic_guardrail',
        actionWhen: {
          match: 'any',
          targets: [{ kind: 'information_action', informationActionId }],
        },
        triggeredInformationPrerequisite: {
          schemaVersion: 1,
          policyScope: {
            policyRef: {
              id: policy.id,
              contentVersion: policy.contentVersion,
            },
            focusedDecisionId: policy.focusedDecisionId,
          },
          triggerWhen: {
            match: 'any',
            targets: [{ kind: 'any_medication_start' }],
          },
          fulfillmentWhen: {
            match: 'any',
            targets: [{ kind: 'information_action', informationActionId }],
          },
        },
        balanceRef: null,
      });
      expect(adapted.value.patientWhen).toEqual(primaryRoute.patientWhen);
      expect(JSON.stringify(adapted.value)).not.toContain('clinicalTagPresent');
      expect(JSON.stringify(adapted.value)).not.toContain('anyMedicationStarted');
    }
  });

  it('losslessly expands the approved class-targeted antidepressant prerequisite', () => {
    const adapted = adapt('rule.diagnosis-mdd.initial-route-antidepressant-mania-history');
    expect(adapted.ok).toBe(true);
    if (!adapted.ok) return;
    expect(adapted.value).toMatchObject({
      ruleRef: {
        kind: 'diagnosis_rule',
        id: 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history',
        contentVersion: diagnosis.contentVersion,
        ownerId: diagnosis.id,
        ownerContentVersion: diagnosis.contentVersion,
      },
      actionWhen: {
        match: 'any',
        targets: [
          {
            kind: 'information_action',
            informationActionId: 'info.history.mania',
          },
        ],
      },
      triggeredInformationPrerequisite: {
        triggerWhen: {
          match: 'any',
          targets: reviewedMedicationIds.map((medicationIdentityId) => ({
            kind: 'medication_start',
            medicationIdentityId,
          })),
        },
        fulfillmentWhen: {
          match: 'any',
          targets: [
            {
              kind: 'information_action',
              informationActionId: 'info.history.mania',
            },
          ],
        },
      },
    });
    expect(JSON.stringify(adapted.value)).not.toContain('medicationTagId');
    expect(JSON.stringify(adapted.value)).not.toContain('medicationClassId');
  });

  it('still rejects legacy medication tags and lossy or unreviewed class mappings', () => {
    expect(adapt('rule.diagnosis-mdd.antidepressant-mania-history')).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_SELECTION_TRIGGER' },
    });

    const staleClassDiagnosis = DiagnosisDefinitionSchema.parse({
      ...diagnosis,
      baseRules: diagnosis.baseRules.map((rule) =>
        rule.id === 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history' &&
        rule.selectionWhen?.type === 'treatmentStartedInClass'
          ? {
              ...rule,
              selectionWhen: {
                ...rule.selectionWhen,
                medicationClassContentVersion: '9.9.9',
              },
            }
          : rule,
      ),
    });
    expect(
      adapt('rule.diagnosis-mdd.initial-route-antidepressant-mania-history', {
        diagnosis: staleClassDiagnosis,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'MEDICATION_CLASS_VERSION_MISMATCH' },
    });

    expect(
      adapt('rule.diagnosis-mdd.initial-route-antidepressant-mania-history', {
        classMemberships: regimenCatalog.classMemberships.map((membership, index) =>
          index === 0
            ? {
                ...membership,
                review: {
                  status: 'unreviewed',
                  reviewerId: null,
                  reviewedAt: null,
                  sourceUseNoteIds: [],
                },
              }
            : membership,
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PRIMARY_ROUTE_INVALID' },
    });

    const lossyCardinalityDiagnosis = DiagnosisDefinitionSchema.parse({
      ...diagnosis,
      baseRules: diagnosis.baseRules.map((rule) =>
        rule.id === 'rule.diagnosis-mdd.initial-route-antidepressant-mania-history' &&
        rule.selectionWhen?.type === 'treatmentStartedInClass'
          ? {
              ...rule,
              selectionWhen: {
                ...rule.selectionWhen,
                maximumCount: 1,
              },
            }
          : rule,
      ),
    });
    expect(
      adapt('rule.diagnosis-mdd.initial-route-antidepressant-mania-history', {
        diagnosis: lossyCardinalityDiagnosis,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_SELECTION_TRIGGER' },
    });
  });

  it('rejects treatment-triggered rules as direct information requirements', () => {
    expect(
      adaptDiagnosisInformationRequirement({
        diagnosis,
        diagnosisRuleId: 'rule.diagnosis-mdd.any-medication-reconciliation',
        policy,
        primaryRoute,
        medicationClasses: regimenCatalog.medicationClasses,
        classMemberships: regimenCatalog.classMemberships,
        findingDefinitions,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_SELECTION_TRIGGER' },
    });
  });

  it('fails closed for a crossed primary policy or an unreviewed diagnosis rule', () => {
    expect(
      adapt('rule.diagnosis-mdd.any-medication-reconciliation', {
        policy: {
          ...policy,
          primaryRouteRef: {
            ...policy.primaryRouteRef,
            id: 'route.test.crossed',
          },
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PRIMARY_ROUTE_MISMATCH' },
    });

    const unreviewedDiagnosis = DiagnosisDefinitionSchema.parse({
      ...diagnosis,
      baseRules: diagnosis.baseRules.map((rule) =>
        rule.id === 'rule.diagnosis-mdd.any-medication-reconciliation'
          ? {
              ...rule,
              review: {
                status: 'unreviewed',
                reviewerId: null,
                reviewedAt: null,
                sourceUseNoteIds: [],
              },
            }
          : rule,
      ),
    });
    expect(
      adapt('rule.diagnosis-mdd.any-medication-reconciliation', {
        diagnosis: unreviewedDiagnosis,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIAGNOSIS_RULE_UNREVIEWED' },
    });

    expect(
      adapt('rule.diagnosis-mdd.any-medication-reconciliation', {
        primaryRoute: {
          ...primaryRoute,
          patientWhen: null,
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PRIMARY_ROUTE_INVALID' },
    });
  });
});
