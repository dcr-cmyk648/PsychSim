import {
  DecisionRuleCandidateDefinitionSchema,
  type DecisionPatientPredicate,
  type DecisionPolicyDefinition,
  type DecisionRuleCandidateDefinition,
  type DiagnosisDefinition,
  type DiagnosisRecommendationRule,
  type FindingDefinition,
  type FocusedMedicationRegimenRoute,
  type MedicationClassDefinition,
  type MedicationClassMembership,
} from '@psychsim/schemas';

import { adaptFocusedMedicationRegimenRoute } from './medication-regimen-route-adapter';

export const DIAGNOSIS_INFORMATION_PREREQUISITE_ADAPTER_VERSION = '3.0.0';

export type DiagnosisInformationPrerequisiteAdapterErrorCode =
  | 'DIAGNOSIS_RULE_MISSING'
  | 'DIAGNOSIS_RULE_UNREVIEWED'
  | 'FINDING_DEFINITION_INACTIVE'
  | 'FINDING_DEFINITION_MISSING'
  | 'FINDING_DEFINITION_OUTCOME_UNSUPPORTED'
  | 'FINDING_DEFINITION_VERSION_MISMATCH'
  | 'MEDICATION_CLASS_MISSING'
  | 'MEDICATION_CLASS_VERSION_MISMATCH'
  | 'MEDICATION_CLASS_UNREVIEWED'
  | 'MEDICATION_CLASS_MEMBERSHIP_MISSING'
  | 'MEDICATION_CLASS_MEMBERSHIP_UNREVIEWED'
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
  readonly findingDefinitions: readonly FindingDefinition[];
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

type NativePatientScopeResult =
  | { readonly ok: true; readonly value: DecisionPatientPredicate }
  | { readonly ok: false; readonly error: DiagnosisInformationPrerequisiteAdapterError };

const failPatientScope = (
  code: DiagnosisInformationPrerequisiteAdapterErrorCode,
  message: string,
  contentIds: readonly string[],
): NativePatientScopeResult => ({
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
 * Preserves the exact primary-route patient scope and, when explicitly
 * authored, refines it with one exact canonical finding outcome. The
 * compatibility clinical tag remains in diagnosis content for the old scorer
 * and audit only; it never enters the native candidate.
 */
const adaptNativePatientScope = (
  input: AdaptDiagnosisInformationPrerequisiteInput,
  rule: DiagnosisRecommendationRule,
  primaryPatientWhen: DecisionPatientPredicate,
): NativePatientScopeResult => {
  if (rule.nativePatientWhen === undefined) {
    if (
      rule.patientWhen?.type !== 'clinicalTagPresent' ||
      rule.patientWhen.clinicalTagId !== input.policy.focusedDecisionId
    ) {
      return failPatientScope(
        'UNSUPPORTED_PATIENT_SCOPE',
        `${rule.id} does not pin the exact focused decision owned by ${input.policy.id}.`,
        [rule.id, input.policy.id],
      );
    }
    return { ok: true, value: primaryPatientWhen };
  }

  if (rule.patientWhen?.type !== 'clinicalTagPresent') {
    return failPatientScope(
      'UNSUPPORTED_PATIENT_SCOPE',
      `${rule.id} must retain one explicit compatibility clinical-tag scope beside its native patient fact.`,
      [rule.id, input.policy.id],
    );
  }
  const nativePredicate = rule.nativePatientWhen;
  const finding = input.findingDefinitions.find(
    (candidate) => candidate.id === nativePredicate.findingDefinitionId,
  );
  if (finding === undefined) {
    return failPatientScope(
      'FINDING_DEFINITION_MISSING',
      `${rule.id} references missing canonical finding ${nativePredicate.findingDefinitionId}.`,
      [rule.id, nativePredicate.findingDefinitionId],
    );
  }
  if (finding.contentVersion !== nativePredicate.findingDefinitionContentVersion) {
    return failPatientScope(
      'FINDING_DEFINITION_VERSION_MISMATCH',
      `${rule.id} pins ${finding.id}@${nativePredicate.findingDefinitionContentVersion}; current content is ${finding.contentVersion}.`,
      [rule.id, finding.id],
    );
  }
  if (finding.lifecycle !== 'approved') {
    return failPatientScope(
      'FINDING_DEFINITION_INACTIVE',
      `${rule.id} cannot compile through non-approved canonical finding ${finding.id}.`,
      [rule.id, finding.id],
    );
  }
  if (!finding.valueSpecification.allowedValues.includes(nativePredicate.outcome)) {
    return failPatientScope(
      'FINDING_DEFINITION_OUTCOME_UNSUPPORTED',
      `${rule.id} requires ${nativePredicate.outcome}, which ${finding.id} does not allow.`,
      [rule.id, finding.id],
    );
  }

  return {
    ok: true,
    value: {
      type: 'all',
      predicates: [
        primaryPatientWhen,
        {
          type: 'fact',
          fact: {
            recordKind: 'canonical_finding',
            identityId: finding.id,
            identityContentVersion: finding.contentVersion,
            attributeId: 'finding.outcome',
            valueId: `finding-outcome.${nativePredicate.outcome}`,
          },
        },
      ],
    },
  };
};

/**
 * Losslessly adapts an already-approved diagnosis-owned information
 * prerequisite whose trigger is either any medication start or one exact,
 * reviewed medication class. Compatibility tags are never interpreted as
 * class membership.
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
  const patientScope = adaptNativePatientScope(input, rule, primaryCandidate.value.patientWhen);
  if (!patientScope.ok) return { ok: false, error: patientScope.error };
  let triggerWhen:
    | {
        readonly match: 'any';
        readonly targets: readonly (
          | { readonly kind: 'any_medication_start' }
          | { readonly kind: 'medication_start'; readonly medicationIdentityId: string }
        )[];
      }
    | undefined;
  if (rule.selectionWhen?.type === 'anyMedicationStarted') {
    triggerWhen = {
      match: 'any',
      targets: [{ kind: 'any_medication_start' }],
    };
  } else if (rule.selectionWhen?.type === 'treatmentStartedInClass') {
    const selection = rule.selectionWhen;
    const medicationClass = input.medicationClasses.find(
      (candidate) => candidate.id === selection.medicationClassId,
    );
    if (medicationClass === undefined) {
      return fail(
        'MEDICATION_CLASS_MISSING',
        `${rule.id} references missing medication class ${selection.medicationClassId}.`,
        [rule.id, selection.medicationClassId],
      );
    }
    if (medicationClass.contentVersion !== selection.medicationClassContentVersion) {
      return fail(
        'MEDICATION_CLASS_VERSION_MISMATCH',
        `${rule.id} pins ${selection.medicationClassId}@${selection.medicationClassContentVersion}; current content is ${medicationClass.contentVersion}.`,
        [rule.id, selection.medicationClassId],
      );
    }
    if (medicationClass.review.status !== 'approved') {
      return fail(
        'MEDICATION_CLASS_UNREVIEWED',
        `${rule.id} cannot compile through unreviewed medication class ${medicationClass.id}.`,
        [rule.id, medicationClass.id],
      );
    }
    const memberships = input.classMemberships
      .filter(
        (membership) =>
          membership.medicationClassId === medicationClass.id &&
          membership.medicationClassContentVersion === medicationClass.contentVersion,
      )
      .sort((left, right) => compareStrings(left.medicationIdentityId, right.medicationIdentityId));
    if (memberships.length === 0) {
      return fail(
        'MEDICATION_CLASS_MEMBERSHIP_MISSING',
        `${rule.id} references medication class ${medicationClass.id} with no exact members.`,
        [rule.id, medicationClass.id],
      );
    }
    const unreviewedMembership = memberships.find(
      (membership) => membership.review.status !== 'approved',
    );
    if (unreviewedMembership !== undefined) {
      return fail(
        'MEDICATION_CLASS_MEMBERSHIP_UNREVIEWED',
        `${rule.id} cannot compile through unreviewed medication-class membership ${unreviewedMembership.id}.`,
        [rule.id, medicationClass.id, unreviewedMembership.id],
      );
    }
    const medicationIdentityIds = uniqueSorted(
      memberships.map((membership) => membership.medicationIdentityId),
    );
    if (selection.minimumCount !== 1 || selection.maximumCount < medicationIdentityIds.length) {
      return fail(
        'UNSUPPORTED_SELECTION_TRIGGER',
        `${rule.id} uses class-start cardinality that cannot be represented losslessly by the closed prerequisite trigger.`,
        [rule.id, medicationClass.id],
      );
    }
    triggerWhen = {
      match: 'any',
      targets: medicationIdentityIds.map((medicationIdentityId) => ({
        kind: 'medication_start',
        medicationIdentityId,
      })),
    };
  } else {
    return fail(
      'UNSUPPORTED_SELECTION_TRIGGER',
      `${rule.id} does not use a supported exact medication-start trigger.`,
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
    patientWhen: patientScope.value,
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
      triggerWhen,
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
  const patientScope = adaptNativePatientScope(input, rule, primaryCandidate.value.patientWhen);
  if (!patientScope.ok) return { ok: false, error: patientScope.error };
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
    patientWhen: patientScope.value,
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
