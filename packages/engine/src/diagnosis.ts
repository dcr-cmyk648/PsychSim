import type {
  ComplexityContribution,
  ComplexityDimension,
  DiagnosisDefinition,
  DiagnosisRecommendationRule,
  PatientContextPredicate,
  PatientDiagnosisRole,
  RecommendationStance,
} from '@psychsim/schemas';

export interface DiagnosisContextSelection {
  diagnosisId: string;
  role: PatientDiagnosisRole;
  severityId: string | null;
  specifierIds: readonly string[];
}

export interface DiagnosisCompositionInput {
  diagnoses: readonly DiagnosisContextSelection[];
  clinicalTagIds: readonly string[];
}

export interface ComposedDiagnosisRule {
  rule: DiagnosisRecommendationRule;
  sourceDiagnosisId: string;
  sourceScope: 'base' | 'severity' | 'specifier';
  sourceScopeId: string;
}

export interface DiagnosisCompositionConflict {
  code:
    | 'MISSING_DIAGNOSIS_DEFINITION'
    | 'DUPLICATE_ACTIVE_DIAGNOSIS'
    | 'UNKNOWN_DIAGNOSIS_SEVERITY'
    | 'SEVERITY_PENDING_SOURCE'
    | 'UNKNOWN_DIAGNOSIS_SPECIFIER'
    | 'MUTUALLY_EXCLUSIVE_SPECIFIERS'
    | 'MUTUALLY_EXCLUSIVE_DIAGNOSES'
    | 'RULE_STANCE_CONFLICT';
  message: string;
  diagnosisIds: readonly string[];
  ruleIds: readonly string[];
  targetId: string | null;
}

export interface DiagnosisCompositionReport {
  valid: boolean;
  activeDiagnosisIds: readonly string[];
  resolvedClinicalTagIds: readonly string[];
  activeRules: readonly ComposedDiagnosisRule[];
  complexityContributions: readonly ComplexityContribution[];
  complexityByDimension: Readonly<Record<ComplexityDimension, number>>;
  conflicts: readonly DiagnosisCompositionConflict[];
}

const ACTIVE_ROLES = new Set<PatientDiagnosisRole>(['primary', 'contributing']);
const POSITIVE_STANCES = new Set<RecommendationStance>(['required', 'preferred', 'acceptable']);
const NEGATIVE_STANCES = new Set<RecommendationStance>(['discouraged', 'avoid', 'contraindicated']);

const emptyComplexityVector = (): Record<ComplexityDimension, number> => ({
  diagnostic: 0,
  pharmacologic: 0,
  workup: 0,
  safety_disposition: 0,
  information: 0,
});

export const evaluatePatientContextPredicate = (
  predicate: PatientContextPredicate,
  context: {
    diagnoses: readonly DiagnosisContextSelection[];
    clinicalTagIds: ReadonlySet<string>;
  },
): boolean => {
  switch (predicate.type) {
    case 'diagnosisPresent':
      return context.diagnoses.some(
        (diagnosis) =>
          diagnosis.diagnosisId === predicate.diagnosisId &&
          predicate.roles.includes(diagnosis.role),
      );
    case 'diagnosisSeverity':
      return context.diagnoses.some(
        (diagnosis) =>
          diagnosis.diagnosisId === predicate.diagnosisId &&
          diagnosis.severityId === predicate.severityId,
      );
    case 'diagnosisSpecifier':
      return context.diagnoses.some(
        (diagnosis) =>
          diagnosis.diagnosisId === predicate.diagnosisId &&
          diagnosis.specifierIds.includes(predicate.specifierId),
      );
    case 'clinicalTagPresent':
      return context.clinicalTagIds.has(predicate.clinicalTagId);
    case 'any':
      return predicate.predicates.some((child) => evaluatePatientContextPredicate(child, context));
    case 'all':
      return predicate.predicates.every((child) => evaluatePatientContextPredicate(child, context));
    case 'not':
      return !evaluatePatientContextPredicate(predicate.predicate, context);
  }
};

const stancesConflict = (left: RecommendationStance, right: RecommendationStance): boolean =>
  (POSITIVE_STANCES.has(left) && NEGATIVE_STANCES.has(right)) ||
  (NEGATIVE_STANCES.has(left) && POSITIVE_STANCES.has(right));

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

/**
 * Composes diagnosis-owned qualitative guidance for one resolved patient.
 *
 * The function deliberately does not choose a winner or assign points. Any
 * incompatible active guidance is returned as a blocking conflict so authoring
 * can create a review ticket or a patient-specific, sourced override.
 */
export const composeDiagnosisGuidance = (
  definitions: readonly DiagnosisDefinition[],
  input: DiagnosisCompositionInput,
): DiagnosisCompositionReport => {
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const activeDiagnoses = input.diagnoses.filter((diagnosis) => ACTIVE_ROLES.has(diagnosis.role));
  const conflicts: DiagnosisCompositionConflict[] = [];
  const activeRules: ComposedDiagnosisRule[] = [];
  const complexityContributions: ComplexityContribution[] = [];
  const clinicalTagIds = new Set(input.clinicalTagIds);

  for (const diagnosisId of unique(activeDiagnoses.map((diagnosis) => diagnosis.diagnosisId))) {
    if (activeDiagnoses.filter((diagnosis) => diagnosis.diagnosisId === diagnosisId).length > 1) {
      conflicts.push({
        code: 'DUPLICATE_ACTIVE_DIAGNOSIS',
        message: `${diagnosisId} appears more than once as an active diagnosis.`,
        diagnosisIds: [diagnosisId],
        ruleIds: [],
        targetId: null,
      });
    }
  }

  for (const selection of activeDiagnoses) {
    const definition = definitionById.get(selection.diagnosisId);
    if (!definition) {
      conflicts.push({
        code: 'MISSING_DIAGNOSIS_DEFINITION',
        message: `No diagnosis definition exists for ${selection.diagnosisId}.`,
        diagnosisIds: [selection.diagnosisId],
        ruleIds: [],
        targetId: null,
      });
      continue;
    }
    definition.baseClinicalTagIds.forEach((id) => clinicalTagIds.add(id));
    complexityContributions.push(...definition.complexityContributions);
    activeRules.push(
      ...definition.baseRules.map((rule) => ({
        rule,
        sourceDiagnosisId: definition.id,
        sourceScope: 'base' as const,
        sourceScopeId: definition.id,
      })),
    );

    if (selection.severityId) {
      const severity = definition.severityAxis?.levels.find(
        (candidate) => candidate.id === selection.severityId,
      );
      if (!severity) {
        conflicts.push({
          code: 'UNKNOWN_DIAGNOSIS_SEVERITY',
          message: `${selection.severityId} is not defined by ${definition.id}.`,
          diagnosisIds: [definition.id],
          ruleIds: [],
          targetId: selection.severityId,
        });
      } else {
        if (severity.generationStatus === 'disabled_pending_source') {
          conflicts.push({
            code: 'SEVERITY_PENDING_SOURCE',
            message: `${severity.id} cannot be generated until its constraints are sourced and enabled.`,
            diagnosisIds: [definition.id],
            ruleIds: [],
            targetId: severity.id,
          });
        }
        severity.addedClinicalTagIds.forEach((id) => clinicalTagIds.add(id));
        complexityContributions.push(...severity.complexityContributions);
        activeRules.push(
          ...severity.rules.map((rule) => ({
            rule,
            sourceDiagnosisId: definition.id,
            sourceScope: 'severity' as const,
            sourceScopeId: severity.id,
          })),
        );
      }
    }

    const selectedSpecifiers = selection.specifierIds.flatMap((specifierId) => {
      const specifier = definition.specifiers.find((candidate) => candidate.id === specifierId);
      if (!specifier) {
        conflicts.push({
          code: 'UNKNOWN_DIAGNOSIS_SPECIFIER',
          message: `${specifierId} is not defined by ${definition.id}.`,
          diagnosisIds: [definition.id],
          ruleIds: [],
          targetId: specifierId,
        });
        return [];
      }
      return [specifier];
    });
    const selectedExclusiveGroups = selectedSpecifiers.flatMap((specifier) =>
      specifier.exclusiveGroupId ? [specifier.exclusiveGroupId] : [],
    );
    for (const groupId of unique(selectedExclusiveGroups)) {
      const members = selectedSpecifiers.filter(
        (specifier) => specifier.exclusiveGroupId === groupId,
      );
      if (members.length > 1) {
        conflicts.push({
          code: 'MUTUALLY_EXCLUSIVE_SPECIFIERS',
          message: `${definition.id} selected multiple specifiers from ${groupId}: ${members
            .map((specifier) => specifier.id)
            .join(', ')}.`,
          diagnosisIds: [definition.id],
          ruleIds: [],
          targetId: groupId,
        });
      }
    }
    for (const specifier of selectedSpecifiers) {
      specifier.addedClinicalTagIds.forEach((id) => clinicalTagIds.add(id));
      complexityContributions.push(...specifier.complexityContributions);
      activeRules.push(
        ...specifier.rules.map((rule) => ({
          rule,
          sourceDiagnosisId: definition.id,
          sourceScope: 'specifier' as const,
          sourceScopeId: specifier.id,
        })),
      );
    }
  }

  const activeDiagnosisIds = unique(activeDiagnoses.map((diagnosis) => diagnosis.diagnosisId));
  for (const diagnosisId of activeDiagnosisIds) {
    const definition = definitionById.get(diagnosisId);
    if (!definition) continue;
    for (const relationship of definition.comorbidityRelationships) {
      if (
        relationship.relationship === 'mutually_exclusive' &&
        activeDiagnosisIds.includes(relationship.diagnosisId)
      ) {
        const pair = [diagnosisId, relationship.diagnosisId].sort();
        if (
          !conflicts.some(
            (conflict) =>
              conflict.code === 'MUTUALLY_EXCLUSIVE_DIAGNOSES' &&
              conflict.diagnosisIds.join('|') === pair.join('|'),
          )
        ) {
          conflicts.push({
            code: 'MUTUALLY_EXCLUSIVE_DIAGNOSES',
            message: `${pair[0]} and ${pair[1]} are marked mutually exclusive.`,
            diagnosisIds: pair,
            ruleIds: [],
            targetId: null,
          });
        }
      }
    }
  }

  const predicateContext = { diagnoses: activeDiagnoses, clinicalTagIds };
  const applicableRules = activeRules.filter(
    ({ rule }) =>
      rule.patientWhen === null ||
      evaluatePatientContextPredicate(rule.patientWhen, predicateContext),
  );
  for (let leftIndex = 0; leftIndex < applicableRules.length; leftIndex += 1) {
    const left = applicableRules[leftIndex]!;
    for (let rightIndex = leftIndex + 1; rightIndex < applicableRules.length; rightIndex += 1) {
      const right = applicableRules[rightIndex]!;
      if (
        left.rule.domain !== right.rule.domain ||
        left.rule.target.kind !== right.rule.target.kind ||
        left.rule.target.id !== right.rule.target.id ||
        !stancesConflict(left.rule.stance, right.rule.stance)
      ) {
        continue;
      }
      conflicts.push({
        code: 'RULE_STANCE_CONFLICT',
        message: `${left.rule.id} (${left.rule.stance}) conflicts with ${right.rule.id} (${right.rule.stance}) for ${left.rule.target.id}.`,
        diagnosisIds: unique([left.sourceDiagnosisId, right.sourceDiagnosisId]).sort(),
        ruleIds: [left.rule.id, right.rule.id].sort(),
        targetId: left.rule.target.id,
      });
    }
  }

  const complexityByDimension = emptyComplexityVector();
  for (const contribution of complexityContributions) {
    complexityByDimension[contribution.dimension] += contribution.weight;
  }

  return {
    valid: conflicts.length === 0,
    activeDiagnosisIds,
    resolvedClinicalTagIds: [...clinicalTagIds].sort(),
    activeRules: applicableRules,
    complexityContributions,
    complexityByDimension,
    conflicts,
  };
};
