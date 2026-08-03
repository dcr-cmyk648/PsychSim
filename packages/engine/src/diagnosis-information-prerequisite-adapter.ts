import {
  DecisionRuleCandidateDefinitionSchema,
  type DecisionPolicyDefinition,
  type DecisionRuleCandidateDefinition,
  type DiagnosisDefinition,
  type FocusedMedicationRegimenRoute,
  type MedicationClassDefinition,
  type MedicationClassMembership,
} from '@psychsim/schemas';

import { adaptFocusedMedicationRegimenRoute } from './medication-regimen-route-adapter';

export const DIAGNOSIS_INFORMATION_PREREQUISITE_ADAPTER_VERSION = '1.0.0';

export type DiagnosisInformationPrerequisiteAdapterErrorCode =
  | 'DIAGNOSIS_RULE_MISSING'
  | 'DIAGNOSIS_RULE_UNREVIEWED'
  | 'POLICY_UNAPPROVED'
  | 'PRIMARY_ROUTE_INVALID'
  | 'PRIMARY_ROUTE_MISMATCH'
  | 'UNSUPPORTED_TARGET'
  | 'UNSUPPORTED_PATIENT_SCOPE'
  | 'UNSUPPORTED_SELECTION_TRIGGER'
  | 'UNSUPPORTED_STANCE'
  | 'CANDIDATE_INVALID';

export interface DiagnosisInformationPrerequisiteAdapterError {
  readonly code: DiagnosisInformationPrerequisiteAdapterErrorCode;
  readonly message: string;
  readonly contentIds: readonly string[];
}

export type DiagnosisInformationPrerequisiteAdapterResult =
  | { readonly ok: true; readonly value: DecisionRuleCandidateDefinition }
  | { readonly ok: false; readonly error: DiagnosisInformationPrerequisiteAdapterError };

export interface AdaptDiagnosisInformationPrerequisiteInput {
  readonly diagnosis: DiagnosisDefinition;
  readonly diagnosisRuleId: string;
  readonly policy: DecisionPolicyDefinition;
  readonly primaryRoute: FocusedMedicationRegimenRoute;
  readonly medicationClasses: readonly MedicationClassDefinition[];
  readonly classMemberships: readonly MedicationClassMembership[];
}

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: DiagnosisInformationPrerequisiteAdapterErrorCode,
  message: string,
  contentIds: readonly string[],
): DiagnosisInformationPrerequisiteAdapterResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const diagnosisRules = (diagnosis: DiagnosisDefinition) => [
  ...diagnosis.baseRules,
  ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
  ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
];

const referenceKey = (reference: {
  readonly kind: string;
  readonly id: string;
  readonly contentVersion: string;
  readonly ownerId: string;
  readonly ownerContentVersion: string;
}): string =>
  [
    reference.kind,
    reference.id,
    reference.contentVersion,
    reference.ownerId,
    reference.ownerContentVersion,
  ].join('\0');

/**
 * Losslessly adapts an already-approved diagnosis-owned information
 * prerequisite whose trigger is any medication start. Compatibility tags are
 * checked only to prove policy scope and never enter the compiled predicate.
 */
export const adaptDiagnosisInformationPrerequisite = (
  input: AdaptDiagnosisInformationPrerequisiteInput,
): DiagnosisInformationPrerequisiteAdapterResult => {
  const { diagnosis, policy } = input;
  if (policy.review.status !== 'approved') {
    return fail(
      'POLICY_UNAPPROVED',
      `${policy.id} is not approved for diagnosis-prerequisite adaptation.`,
      [policy.id],
    );
  }

  const primaryCandidate = adaptFocusedMedicationRegimenRoute({
    route: input.primaryRoute,
    diagnosis,
    medicationClasses: input.medicationClasses,
    classMemberships: input.classMemberships,
  });
  if (!primaryCandidate.ok) {
    return fail(
      'PRIMARY_ROUTE_INVALID',
      primaryCandidate.error.message,
      primaryCandidate.error.contentIds,
    );
  }
  if (referenceKey(primaryCandidate.value.ruleRef) !== referenceKey(policy.primaryRouteRef)) {
    return fail(
      'PRIMARY_ROUTE_MISMATCH',
      `${policy.id} does not pin ${input.primaryRoute.id}@${input.primaryRoute.contentVersion}.`,
      [policy.id, input.primaryRoute.id],
    );
  }
  if (primaryCandidate.value.patientWhen === null) {
    return fail(
      'PRIMARY_ROUTE_INVALID',
      `${input.primaryRoute.id} has no exact patient-state predicate to preserve on its prerequisite.`,
      [policy.id, input.primaryRoute.id],
    );
  }

  const rule = diagnosisRules(diagnosis).find(
    (candidate) => candidate.id === input.diagnosisRuleId,
  );
  if (!rule) {
    return fail(
      'DIAGNOSIS_RULE_MISSING',
      `${diagnosis.id} does not own diagnosis rule ${input.diagnosisRuleId}.`,
      [diagnosis.id, input.diagnosisRuleId],
    );
  }
  if (rule.review.status !== 'approved') {
    return fail('DIAGNOSIS_RULE_UNREVIEWED', `${rule.id} is not approved for compilation.`, [
      diagnosis.id,
      rule.id,
    ]);
  }
  if (rule.target.kind !== 'information_action') {
    return fail('UNSUPPORTED_TARGET', `${rule.id} does not target one exact information action.`, [
      rule.id,
      rule.target.id,
    ]);
  }
  if (rule.stance !== 'required') {
    return fail('UNSUPPORTED_STANCE', `${rule.id} is not a required information prerequisite.`, [
      rule.id,
    ]);
  }
  if (
    rule.patientWhen?.type !== 'clinicalTagPresent' ||
    rule.patientWhen.clinicalTagId !== policy.focusedDecisionId
  ) {
    return fail(
      'UNSUPPORTED_PATIENT_SCOPE',
      `${rule.id} does not pin the exact focused decision owned by ${policy.id}.`,
      [rule.id, policy.id],
    );
  }
  if (rule.selectionWhen?.type !== 'anyMedicationStarted') {
    return fail(
      'UNSUPPORTED_SELECTION_TRIGGER',
      `${rule.id} does not use the supported exact any-medication-start trigger.`,
      [rule.id],
    );
  }

  const fulfillmentWhen = {
    match: 'any' as const,
    targets: [
      {
        kind: 'information_action' as const,
        informationActionId: rule.target.id,
      },
    ],
  };
  const parsed = DecisionRuleCandidateDefinitionSchema.safeParse({
    schemaVersion: 1,
    ruleRef: {
      kind: 'diagnosis_rule',
      id: rule.id,
      contentVersion: diagnosis.contentVersion,
      ownerId: diagnosis.id,
      ownerContentVersion: diagnosis.contentVersion,
    },
    label: rule.label,
    ruleKind: 'prerequisite',
    discoveryLane: 'automatic_guardrail',
    patientWhen: primaryCandidate.value.patientWhen,
    actionWhen: fulfillmentWhen,
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
      fulfillmentWhen,
    },
    stance: rule.stance,
    concernLevel: rule.concernLevel,
    certaintyLevel: rule.certaintyLevel,
    effectId: null,
    issueId: null,
    specificityPriority: 0,
    rationale: rule.rationale,
    balanceRef: null,
    developerOpinionIds: [],
    review: rule.review,
  });
  if (!parsed.success) {
    return fail(
      'CANDIDATE_INVALID',
      parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
      [diagnosis.id, rule.id, policy.id],
    );
  }
  return { ok: true, value: parsed.data };
};

/**
 * Losslessly adapts an already-approved diagnosis-owned information
 * requirement that applies whenever the exact focused patient/policy scope is
 * active. Unlike a treatment-triggered prerequisite, this rule has no
 * treatment trigger: the selected decision later resolves its information
 * predicate as fulfilled or omitted.
 */
const adaptDiagnosisInformationAction = (
  input: AdaptDiagnosisInformationPrerequisiteInput,
  expectedStance: 'required' | 'preferred',
): DiagnosisInformationPrerequisiteAdapterResult => {
  const { diagnosis, policy } = input;
  if (policy.review.status !== 'approved') {
    return fail(
      'POLICY_UNAPPROVED',
      `${policy.id} is not approved for diagnosis-information requirement adaptation.`,
      [policy.id],
    );
  }

  const primaryCandidate = adaptFocusedMedicationRegimenRoute({
    route: input.primaryRoute,
    diagnosis,
    medicationClasses: input.medicationClasses,
    classMemberships: input.classMemberships,
  });
  if (!primaryCandidate.ok) {
    return fail(
      'PRIMARY_ROUTE_INVALID',
      primaryCandidate.error.message,
      primaryCandidate.error.contentIds,
    );
  }
  if (referenceKey(primaryCandidate.value.ruleRef) !== referenceKey(policy.primaryRouteRef)) {
    return fail(
      'PRIMARY_ROUTE_MISMATCH',
      `${policy.id} does not pin ${input.primaryRoute.id}@${input.primaryRoute.contentVersion}.`,
      [policy.id, input.primaryRoute.id],
    );
  }
  if (primaryCandidate.value.patientWhen === null) {
    return fail(
      'PRIMARY_ROUTE_INVALID',
      `${input.primaryRoute.id} has no exact patient-state predicate to preserve on its information requirement.`,
      [policy.id, input.primaryRoute.id],
    );
  }

  const rule = diagnosisRules(diagnosis).find(
    (candidate) => candidate.id === input.diagnosisRuleId,
  );
  if (!rule) {
    return fail(
      'DIAGNOSIS_RULE_MISSING',
      `${diagnosis.id} does not own diagnosis rule ${input.diagnosisRuleId}.`,
      [diagnosis.id, input.diagnosisRuleId],
    );
  }
  if (rule.review.status !== 'approved') {
    return fail('DIAGNOSIS_RULE_UNREVIEWED', `${rule.id} is not approved for compilation.`, [
      diagnosis.id,
      rule.id,
    ]);
  }
  if (rule.target.kind !== 'information_action') {
    return fail('UNSUPPORTED_TARGET', `${rule.id} does not target one exact information action.`, [
      rule.id,
      rule.target.id,
    ]);
  }
  if (rule.stance !== expectedStance) {
    return fail(
      'UNSUPPORTED_STANCE',
      `${rule.id} is not a ${expectedStance} direct information action.`,
      [rule.id],
    );
  }
  if (
    rule.patientWhen?.type !== 'clinicalTagPresent' ||
    rule.patientWhen.clinicalTagId !== policy.focusedDecisionId
  ) {
    return fail(
      'UNSUPPORTED_PATIENT_SCOPE',
      `${rule.id} does not pin the exact focused decision owned by ${policy.id}.`,
      [rule.id, policy.id],
    );
  }
  if (rule.selectionWhen !== null) {
    return fail(
      'UNSUPPORTED_SELECTION_TRIGGER',
      `${rule.id} has a treatment trigger and is not a direct information requirement.`,
      [rule.id],
    );
  }

  const actionWhen = {
    match: 'any' as const,
    targets: [
      {
        kind: 'information_action' as const,
        informationActionId: rule.target.id,
      },
    ],
  };
  const parsed = DecisionRuleCandidateDefinitionSchema.safeParse({
    schemaVersion: 1,
    ruleRef: {
      kind: 'diagnosis_rule',
      id: rule.id,
      contentVersion: diagnosis.contentVersion,
      ownerId: diagnosis.id,
      ownerContentVersion: diagnosis.contentVersion,
    },
    label: rule.label,
    ruleKind: 'prerequisite',
    discoveryLane: 'automatic_guardrail',
    patientWhen: primaryCandidate.value.patientWhen,
    actionWhen,
    triggeredInformationPrerequisite: null,
    stance: rule.stance,
    concernLevel: rule.concernLevel,
    certaintyLevel: rule.certaintyLevel,
    effectId: null,
    issueId: null,
    specificityPriority: 0,
    rationale: rule.rationale,
    balanceRef: null,
    developerOpinionIds: [],
    review: rule.review,
  });
  if (!parsed.success) {
    return fail(
      'CANDIDATE_INVALID',
      parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; '),
      [diagnosis.id, rule.id, policy.id],
    );
  }
  return { ok: true, value: parsed.data };
};

export const adaptDiagnosisInformationRequirement = (
  input: AdaptDiagnosisInformationPrerequisiteInput,
): DiagnosisInformationPrerequisiteAdapterResult =>
  adaptDiagnosisInformationAction(input, 'required');

export const adaptDiagnosisInformationRecommendation = (
  input: AdaptDiagnosisInformationPrerequisiteInput,
): DiagnosisInformationPrerequisiteAdapterResult =>
  adaptDiagnosisInformationAction(input, 'preferred');
