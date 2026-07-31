import {
  DecisionPolicyCatalogSchema,
  DiagnosisDefinitionSchema,
  MedicationRegimenKnowledgeCatalogSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import mddDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/major-depressive-disorder.diagnosis.json';
import decisionPolicyCatalogJson from '../../../content/catalogs/decision-policies/catalog.json';
import medicationRegimenCatalogJson from '../../../content/catalogs/medications/regimen-knowledge.json';
import { adaptDiagnosisInformationPrerequisite } from './diagnosis-information-prerequisite-adapter';

const diagnosis = DiagnosisDefinitionSchema.parse(mddDiagnosisJson);
const policyCatalog = DecisionPolicyCatalogSchema.parse(decisionPolicyCatalogJson);
const regimenCatalog = MedicationRegimenKnowledgeCatalogSchema.parse(medicationRegimenCatalogJson);
const policy = policyCatalog.policies[0]!;
const primaryRoute = regimenCatalog.focusedRoutes[0]!;

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
    ...overrides,
  });

describe('diagnosis information-prerequisite adapter', () => {
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

  it('rejects the compatibility-tag antidepressant trigger instead of inferring class membership', () => {
    expect(adapt('rule.diagnosis-mdd.antidepressant-mania-history')).toMatchObject({
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
