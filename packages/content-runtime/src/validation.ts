import {
  CaseBlueprintSchema,
  type CaseBlueprint,
  type CatalogBundle,
  type ClinicState,
  type ContentRegistry,
  type EvidenceSourceDefinition,
  type MedicationIdentityDefinition,
  type PatientContextPredicate,
  type PlayerDiagnosisSelection,
  type ScorePredicate,
  type SupplementIdentityDefinition,
  type TreatmentSelection,
} from '@psychsim/schemas';
import {
  evaluateCaseEligibility,
  extractPredicateReferences,
  getPurchasableUpgradeDefinitions,
  instantiateCase,
  composeDiagnosisGuidance,
  resolveClinicForFacility,
  resolveClinicForProgressionMode,
  resolveServiceFulfillment,
} from '@psychsim/engine';
import { medicationIdentities } from './medication-identities';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
}

export interface ContentValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

const duplicateIds = (ids: readonly string[]): string[] => [
  ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
];

interface CombinationRuleCandidate {
  id: string;
  effectId: string | null;
  specificityPriority: number;
}

const validateCombinationRulePriorities = (
  candidates: readonly CombinationRuleCandidate[],
  issues: ValidationIssue[],
  path: string,
): void => {
  const ownerByEffectAndPriority = new Map<string, string>();
  for (const candidate of candidates) {
    if (candidate.effectId === null) continue;
    const key = `${candidate.effectId}\u0000${candidate.specificityPriority}`;
    const existingId = ownerByEffectAndPriority.get(key);
    if (existingId) {
      issues.push({
        severity: 'error',
        code: 'AMBIGUOUS_RULE_EFFECT_SPECIFICITY',
        message: `${candidate.effectId} gives ${existingId} and ${candidate.id} the same specificity priority ${candidate.specificityPriority}.`,
        path,
      });
      continue;
    }
    ownerByEffectAndPriority.set(key, candidate.id);
  }
};

interface PatientContextReferences {
  diagnosisIds: string[];
  severities: Array<{ diagnosisId: string; severityId: string }>;
  specifiers: Array<{ diagnosisId: string; specifierId: string }>;
  clinicalTagIds: string[];
}

const extractPatientContextReferences = (
  predicate: PatientContextPredicate,
): PatientContextReferences => {
  const references: PatientContextReferences = {
    diagnosisIds: [],
    severities: [],
    specifiers: [],
    clinicalTagIds: [],
  };
  const visit = (node: PatientContextPredicate): void => {
    switch (node.type) {
      case 'diagnosisPresent':
        references.diagnosisIds.push(node.diagnosisId);
        return;
      case 'diagnosisSeverity':
        references.diagnosisIds.push(node.diagnosisId);
        references.severities.push({
          diagnosisId: node.diagnosisId,
          severityId: node.severityId,
        });
        return;
      case 'diagnosisSpecifier':
        references.diagnosisIds.push(node.diagnosisId);
        references.specifiers.push({
          diagnosisId: node.diagnosisId,
          specifierId: node.specifierId,
        });
        return;
      case 'clinicalTagPresent':
        references.clinicalTagIds.push(node.clinicalTagId);
        return;
      case 'any':
      case 'all':
        node.predicates.forEach(visit);
        return;
      case 'not':
        visit(node.predicate);
        return;
    }
  };
  visit(predicate);
  return references;
};

const PRE_SUBMISSION_INFERENCE_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  ['LEVEL_OF_CARE_CONCLUSION', /can participate in (?:outpatient|inpatient) care/i],
  ['TREATMENT_CONCLUSION', /appropriate for (?:the |a )?(?:selected )?treatment/i],
  ['DIAGNOSTIC_CONCLUSION', /(?:consistent with|characteristic of|supports? (?:a|the)) diagnosis/i],
  ['PLAN_CONCLUSION', /(?:does not |does )?change(?:s)? (?:the |a )?(?:plan|pathway)/i],
  ['ACTION_CLASSIFICATION', /\b(?:wasteful|defensible|low-value|high-yield|essential)\b/i],
];

const presentationVariantCardinality = (
  blueprint: CaseBlueprint,
  catalogs: CatalogBundle,
): number => {
  const templates = [
    blueprint.opening.titleTemplate,
    blueprint.opening.chiefComplaintTemplate,
    blueprint.opening.summaryTemplate,
    blueprint.opening.contextTemplate,
  ].join(' ');
  return blueprint.variants
    .filter((variant) => templates.includes(`{{${variant.target}}}`))
    .reduce((product, variant) => {
      const generator = variant.generator;
      let cardinality = 1;
      if (generator.type === 'choice') cardinality = generator.values.length;
      if (generator.type === 'weightedChoice') cardinality = generator.options.length;
      if (generator.type === 'catalogChoice') {
        cardinality =
          catalogs.variantPools.find((pool) => pool.id === generator.poolId)?.values.length ?? 0;
      }
      if (generator.type === 'fictionalName') {
        const firstNames =
          catalogs.variantPools.find((pool) => pool.id === generator.firstNamePoolId)?.values
            .length ?? 0;
        const lastNames =
          catalogs.variantPools.find((pool) => pool.id === generator.lastNamePoolId)?.values
            .length ?? 0;
        cardinality = firstNames * lastNames * (generator.middleInitialProbability > 0 ? 27 : 1);
      }
      if (generator.type === 'integerRange') cardinality = generator.max - generator.min + 1;
      if (generator.type === 'decimalRange') {
        cardinality = Math.floor((generator.max - generator.min) * 10 ** generator.decimals) + 1;
      }
      if (generator.type === 'textTemplate') {
        cardinality = Object.values(generator.variables).reduce(
          (count, values) => count * values.length,
          1,
        );
      }
      return Math.min(1_000_000_000, product * Math.max(0, cardinality));
    }, 1);
};

const validatePredicateReferences = (
  predicate: ScorePredicate,
  blueprint: CaseBlueprint,
  catalogs: CatalogBundle,
  path: string,
  issues: ValidationIssue[],
): void => {
  const refs = extractPredicateReferences(predicate);
  const validateCountBounds = (node: ScorePredicate): void => {
    if (node.type === 'treatmentStartedWithTag' && node.minimumCount > node.maximumCount) {
      issues.push({
        severity: 'error',
        code: 'INVALID_MEDICATION_TAG_COUNT',
        message: `${node.medicationTagId}: minimum exceeds maximum`,
        path,
      });
    }
    if (node.type === 'any' || node.type === 'all') node.predicates.forEach(validateCountBounds);
    if (node.type === 'not') validateCountBounds(node.predicate);
  };
  validateCountBounds(predicate);
  const actionIds = new Set(blueprint.informationActions.map((action) => action.actionId));
  const factIds = new Set(
    blueprint.informationActions.flatMap((action) => action.result.factsRevealed),
  );
  const medicationIds = new Set(catalogs.medications.map((medication) => medication.id));
  const medicationTagIds = new Set(catalogs.medications.flatMap((medication) => medication.tags));
  const treatmentIds = new Set(catalogs.treatments.map((treatment) => treatment.id));
  for (const actionId of refs.actionIds) {
    if (!actionIds.has(actionId)) {
      issues.push({ severity: 'error', code: 'INVALID_ACTION_REF', message: actionId, path });
    }
  }
  for (const factId of refs.factIds) {
    if (!factIds.has(factId)) {
      issues.push({ severity: 'error', code: 'INVALID_FACT_REF', message: factId, path });
    }
  }
  for (const medicationId of refs.medicationIds) {
    if (!medicationIds.has(medicationId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_MEDICATION_REF',
        message: medicationId,
        path,
      });
    }
  }
  for (const medicationTagId of refs.medicationTagIds) {
    if (!medicationTagIds.has(medicationTagId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_MEDICATION_TAG_REF',
        message: medicationTagId,
        path,
      });
    }
  }
  for (const treatmentId of [...refs.interventionIds, ...refs.dispositionIds]) {
    if (!treatmentIds.has(treatmentId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TREATMENT_REF',
        message: treatmentId,
        path,
      });
    }
  }
};

const selectionReferencesAreValid = (
  selection: TreatmentSelection,
  blueprint: CaseBlueprint,
): boolean => {
  const available = blueprint.availableTreatments;
  return (
    selection.startMedicationIds.every((id) => available.startMedicationIds.includes(id)) &&
    selection.stopMedicationIds.every((id) => available.stopMedicationIds.includes(id)) &&
    selection.continueMedicationIds.every((id) => available.continueMedicationIds.includes(id)) &&
    selection.interventionIds.every((id) => available.interventionIds.includes(id)) &&
    (selection.dispositionId === null || available.dispositionIds.includes(selection.dispositionId))
  );
};

const diagnosisSelectionReferenceIsValid = (
  selection: PlayerDiagnosisSelection,
  catalogs: CatalogBundle,
): boolean => {
  const definition = catalogs.diagnoses.find(
    (diagnosis) => diagnosis.id === selection.diagnosisId && diagnosis.selectableInGameplay,
  );
  if (!definition) return false;
  if (
    selection.severityId !== null &&
    !definition.severityAxis?.levels.some((level) => level.id === selection.severityId)
  ) {
    return false;
  }
  if (
    selection.severityId !== null &&
    definition.severityAxis?.playerSelectionMode === 'family_only'
  ) {
    return false;
  }
  return selection.specifierIds.every((specifierId) =>
    definition.specifiers.some(
      (specifier) => specifier.id === specifierId && specifier.playerSelectable,
    ),
  );
};

const isFamilyOnlyDiagnosisSelection = (selection: PlayerDiagnosisSelection): boolean =>
  selection.severityId === null && selection.specifierIds.length === 0;

export const validateCaseBlueprint = (
  rawBlueprint: unknown,
  catalogs: CatalogBundle,
  clinicState: ClinicState,
): ContentValidationReport => {
  const issues: ValidationIssue[] = [];
  const parsed = CaseBlueprintSchema.safeParse(rawBlueprint);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        severity: 'error',
        code: 'SCHEMA_INVALID',
        message: issue.message,
        path: issue.path.join('.'),
      })),
    };
  }
  const blueprint = parsed.data;
  const idCollections = [
    ['informationActions', blueprint.informationActions.map((item) => item.actionId)],
    ['workupObjectives', blueprint.workupObjectives.map((item) => item.id)],
    ['treatmentGrades', blueprint.treatmentGrades.map((item) => item.id)],
    ['treatmentPathways', blueprint.treatmentPathways.map((item) => item.id)],
    ['scoreRules', blueprint.scoreRules.map((item) => item.id)],
    ['referenceSolutions', blueprint.referenceSolutions.map((item) => item.id)],
    ['variants', blueprint.variants.map((item) => item.id)],
  ] as const;
  for (const [path, ids] of idCollections) {
    for (const duplicate of duplicateIds(ids)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_ID',
        message: `Duplicate ID: ${duplicate}`,
        path,
      });
    }
  }

  validateCombinationRulePriorities(
    [
      ...blueprint.workupObjectives,
      ...blueprint.treatmentWorkupRequirements,
      ...blueprint.treatmentGrades,
      ...blueprint.scoreRules,
      ...blueprint.treatmentPathways.flatMap((pathway) =>
        pathway.conditionalRequirements.map((requirement) => ({
          ...requirement,
          id: `conditional.${pathway.id}.${requirement.objectiveId}`,
        })),
      ),
      ...catalogs.medications
        .filter((medication) =>
          blueprint.availableTreatments.startMedicationIds.includes(medication.id),
        )
        .flatMap((medication) => medication.fitModifiers),
    ],
    issues,
    'ruleCombination',
  );

  for (const action of blueprint.informationActions) {
    const findingIds = action.result.findings.map((finding) => finding.id);
    for (const duplicate of duplicateIds(findingIds)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_FINDING_ID',
        message: `${action.actionId} repeats ${duplicate}.`,
      });
    }
    const variableFindingIds = new Set(
      action.result.findings
        .filter((finding) => finding.outcome === 'variable')
        .map((finding) => finding.id),
    );
    const fixedPresentCount = action.result.findings.filter(
      (finding) => finding.outcome === 'present',
    ).length;
    for (const finding of action.result.findings) {
      const profile = finding.durationProfile;
      if (!profile) continue;
      if (
        profile.relatedDiagnosisId &&
        !blueprint.patientRecord.diagnoses.some(
          (diagnosis) => diagnosis.id === profile.relatedDiagnosisId,
        )
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_DURATION_DIAGNOSIS_REF',
          message: `${action.actionId}/${finding.id} references ${profile.relatedDiagnosisId}.`,
        });
      }
    }
    if (variableFindingIds.size > 0 && !action.result.selection) {
      issues.push({
        severity: 'error',
        code: 'UNCONSTRAINED_VARIABLE_FINDING',
        message: `${action.actionId} contains variable findings without selection constraints.`,
      });
    }
    if (action.result.selection) {
      const selection = action.result.selection;
      const selectedIds = [...selection.requiredPresentIds, ...selection.requiredAbsentIds];
      for (const selectedId of selectedIds) {
        if (!variableFindingIds.has(selectedId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_FINDING_SELECTION_REF',
            message: `${action.actionId} constrains nonvariable finding ${selectedId}.`,
          });
        }
      }
      if (
        selection.requiredPresentIds.some((id) => selection.requiredAbsentIds.includes(id)) ||
        selection.maximumPresent < fixedPresentCount + selection.requiredPresentIds.length ||
        selection.minimumPresent > fixedPresentCount + variableFindingIds.size ||
        selection.maximumPresent > fixedPresentCount + variableFindingIds.size
      ) {
        issues.push({
          severity: 'error',
          code: 'IMPOSSIBLE_FINDING_SELECTION',
          message: `${action.actionId} has inconsistent positive/negative finding constraints.`,
        });
      }
    }
    const preSubmissionText = action.result.findings
      .flatMap((finding) => [...finding.labelVariants, ...(finding.valueTextVariants ?? [])])
      .join(' ');
    for (const [code, pattern] of PRE_SUBMISSION_INFERENCE_PATTERNS) {
      if (pattern.test(preSubmissionText)) {
        issues.push({
          severity: 'error',
          code: `PRE_SUBMISSION_${code}`,
          message: `${action.actionId} contains assessment, plan, or scoring language.`,
        });
      }
    }
  }
  const caseActionIds = new Set(blueprint.informationActions.map((action) => action.actionId));
  const catalogActionIds = new Set(catalogs.informationActions.map((action) => action.id));
  for (const actionId of catalogActionIds) {
    if (!caseActionIds.has(actionId)) {
      issues.push({
        severity: 'error',
        code: 'MISSING_UNIVERSAL_ACTION_RESULT',
        message: `${blueprint.id} has no result for universal action ${actionId}.`,
      });
    }
  }
  for (const actionId of caseActionIds) {
    if (!catalogActionIds.has(actionId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_ACTION_REF',
        message: `${blueprint.id} references noncatalog action ${actionId}.`,
      });
    }
  }

  blueprint.workupObjectives.forEach((objective, index) =>
    validatePredicateReferences(
      objective.satisfaction,
      blueprint,
      catalogs,
      `workupObjectives.${index}.satisfaction`,
      issues,
    ),
  );
  blueprint.treatmentWorkupRequirements.forEach((requirement, index) =>
    validatePredicateReferences(
      requirement.appliesWhen,
      blueprint,
      catalogs,
      `treatmentWorkupRequirements.${index}.appliesWhen`,
      issues,
    ),
  );
  blueprint.treatmentGrades.forEach((grade, index) =>
    validatePredicateReferences(
      grade.predicate,
      blueprint,
      catalogs,
      `treatmentGrades.${index}.predicate`,
      issues,
    ),
  );
  blueprint.treatmentPathways.forEach((pathway, index) =>
    validatePredicateReferences(
      pathway.match,
      blueprint,
      catalogs,
      `treatmentPathways.${index}.match`,
      issues,
    ),
  );
  blueprint.scoreRules.forEach((rule, index) =>
    validatePredicateReferences(
      rule.predicate,
      blueprint,
      catalogs,
      `scoreRules.${index}.predicate`,
      issues,
    ),
  );

  const objectiveIds = new Set(blueprint.workupObjectives.map((objective) => objective.id));
  const diagnosisRulesById = new Map(
    catalogs.diagnoses
      .flatMap((diagnosis) => [
        ...diagnosis.baseRules,
        ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
        ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
      ])
      .map((rule) => [rule.id, rule]),
  );
  for (const requirement of blueprint.treatmentWorkupRequirements) {
    const objective = blueprint.workupObjectives.find(
      (candidate) => candidate.id === requirement.objectiveId,
    );
    if (!objective) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TREATMENT_WORKUP_OBJECTIVE',
        message: `${requirement.id} references ${requirement.objectiveId}`,
      });
    }
    for (const sourceRuleId of requirement.sourceRuleIds) {
      const sourceRule = diagnosisRulesById.get(sourceRuleId);
      if (!sourceRule) {
        issues.push({
          severity: 'error',
          code: 'INVALID_TREATMENT_WORKUP_SOURCE_RULE',
          message: `${requirement.id} references ${sourceRuleId}`,
        });
        continue;
      }
      const objectiveActionIds = objective
        ? extractPredicateReferences(objective.satisfaction).actionIds
        : [];
      if (
        sourceRule.target.kind !== 'information_action' ||
        !objectiveActionIds.includes(sourceRule.target.id)
      ) {
        issues.push({
          severity: 'error',
          code: 'TREATMENT_WORKUP_SOURCE_TARGET_MISMATCH',
          message: `${requirement.id} does not preserve the target of ${sourceRuleId}`,
        });
      }
      if (
        sourceRule.selectionWhen === null ||
        JSON.stringify(sourceRule.selectionWhen) !== JSON.stringify(requirement.appliesWhen)
      ) {
        issues.push({
          severity: 'error',
          code: 'TREATMENT_WORKUP_SOURCE_TRIGGER_MISMATCH',
          message: `${requirement.id} does not preserve the selection trigger of ${sourceRuleId}`,
        });
      }
      if (
        sourceRule.concernLevel !== requirement.concernLevel ||
        sourceRule.certaintyLevel !== requirement.certaintyLevel
      ) {
        issues.push({
          severity: 'error',
          code: 'TREATMENT_WORKUP_SOURCE_WEIGHT_MISMATCH',
          message: `${requirement.id} does not preserve the concern/certainty of ${sourceRuleId}`,
        });
      }
    }
  }
  for (const pathway of blueprint.treatmentPathways) {
    if (pathway.workupCostPar < 0) {
      issues.push({ severity: 'error', code: 'INVALID_PAR', message: pathway.id });
    }
    for (const objectiveId of [
      ...pathway.requiredWorkupObjectiveIds,
      ...pathway.conditionalRequirements.map((requirement) => requirement.objectiveId),
    ]) {
      if (!objectiveIds.has(objectiveId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_PATH_OBJECTIVE',
          message: `${pathway.id} references ${objectiveId}`,
        });
      }
    }
  }
  const patientRecord = blueprint.patientRecord;
  const diagnosisById = new Map(catalogs.diagnoses.map((diagnosis) => [diagnosis.id, diagnosis]));
  const medicationById = new Map(
    catalogs.medications.map((medication) => [medication.id, medication]),
  );
  const nonMedicationReactionTriggerById = new Map(
    catalogs.reactionConcepts.nonMedicationTriggers.map((trigger) => [trigger.id, trigger]),
  );
  const reactionManifestationIds = new Set(
    catalogs.reactionConcepts.manifestations.map((manifestation) => manifestation.id),
  );
  for (const duplicate of duplicateIds(patientRecord.diagnoses.map((diagnosis) => diagnosis.id))) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_PATIENT_DIAGNOSIS',
      message: `${patientRecord.id} repeats ${duplicate}.`,
    });
  }
  for (const patientDiagnosis of patientRecord.diagnoses) {
    const definition = diagnosisById.get(patientDiagnosis.id);
    if (!definition) {
      issues.push({
        severity: 'error',
        code: 'INVALID_PATIENT_DIAGNOSIS_REF',
        message: `${patientRecord.id} references ${patientDiagnosis.id}.`,
      });
      continue;
    }
    if (
      patientDiagnosis.severityId &&
      !definition.severityAxis?.levels.some(
        (severity) => severity.id === patientDiagnosis.severityId,
      )
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_PATIENT_DIAGNOSIS_SEVERITY',
        message: `${patientRecord.id}: ${patientDiagnosis.severityId} is not a ${definition.id} severity.`,
      });
    }
    for (const specifierId of patientDiagnosis.specifierIds) {
      if (!definition.specifiers.some((specifier) => specifier.id === specifierId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_PATIENT_DIAGNOSIS_SPECIFIER',
          message: `${patientRecord.id}: ${specifierId} is not a ${definition.id} specifier.`,
        });
      }
    }
    if (
      ['excluded', 'reference_only'].includes(patientDiagnosis.role) &&
      (patientDiagnosis.severityId !== null || patientDiagnosis.specifierIds.length > 0)
    ) {
      issues.push({
        severity: 'error',
        code: 'INACTIVE_DIAGNOSIS_HAS_ACTIVE_QUALIFIERS',
        message: `${patientRecord.id}: ${patientDiagnosis.id} is ${patientDiagnosis.role} but has an active severity or specifier.`,
      });
    }
  }
  if (blueprint.diagnosisRubric) {
    const activeDiagnosisIds = new Set(
      patientRecord.diagnoses
        .filter((diagnosis) => ['primary', 'contributing'].includes(diagnosis.role))
        .map((diagnosis) => diagnosis.id),
    );
    for (const group of blueprint.diagnosisRubric.groups) {
      if (!isFamilyOnlyDiagnosisSelection(group.canonicalSelection)) {
        issues.push({
          severity: 'error',
          code: 'UNSUPPORTED_DIAGNOSIS_QUALIFIER_UI',
          message: `${group.id} requires a severity or specifier, but the current player UI supports diagnosis-family answers only.`,
        });
      }
      if (!diagnosisSelectionReferenceIsValid(group.canonicalSelection, catalogs)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_DIAGNOSIS_RUBRIC_CANONICAL_REF',
          message: `${group.id} references an unavailable canonical diagnosis.`,
        });
      }
      if (!activeDiagnosisIds.has(group.canonicalSelection.diagnosisId)) {
        issues.push({
          severity: 'error',
          code: 'DIAGNOSIS_RUBRIC_CANONICAL_NOT_PATIENT_TRUTH',
          message: `${group.id} canonical diagnosis is not an active authored patient diagnosis.`,
        });
      }
      for (const option of group.options) {
        if (
          option.match.qualifierMode !== 'family' ||
          option.match.severityId !== null ||
          option.match.specifierIds.length > 0
        ) {
          issues.push({
            severity: 'error',
            code: 'UNSUPPORTED_DIAGNOSIS_QUALIFIER_UI',
            message: `${option.id} requires qualifier matching, but the current player UI supports diagnosis-family answers only.`,
          });
        }
        if (
          !diagnosisSelectionReferenceIsValid(
            {
              diagnosisId: option.match.diagnosisId,
              severityId: option.match.severityId,
              specifierIds: option.match.specifierIds,
            },
            catalogs,
          )
        ) {
          issues.push({
            severity: 'error',
            code: 'INVALID_DIAGNOSIS_RUBRIC_OPTION_REF',
            message: `${option.id} references an unavailable diagnosis or qualifier.`,
          });
        }
      }
    }
    for (const rule of blueprint.diagnosisRubric.misclassificationRules) {
      if (
        rule.match.qualifierMode !== 'family' ||
        rule.match.severityId !== null ||
        rule.match.specifierIds.length > 0
      ) {
        issues.push({
          severity: 'error',
          code: 'UNSUPPORTED_DIAGNOSIS_QUALIFIER_UI',
          message: `${rule.id} requires qualifier matching, but the current player UI supports diagnosis-family answers only.`,
        });
      }
      if (
        !diagnosisSelectionReferenceIsValid(
          {
            diagnosisId: rule.match.diagnosisId,
            severityId: rule.match.severityId,
            specifierIds: rule.match.specifierIds,
          },
          catalogs,
        )
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_DIAGNOSIS_MISCLASSIFICATION_REF',
          message: `${rule.id} references an unavailable diagnosis or qualifier.`,
        });
      }
    }
  }
  const fixedDiagnosisComposition = composeDiagnosisGuidance(catalogs.diagnoses, {
    diagnoses: patientRecord.diagnoses.map((diagnosis) => ({
      diagnosisId: diagnosis.id,
      role: diagnosis.role,
      severityId: diagnosis.severityId,
      specifierIds: diagnosis.specifierIds,
    })),
    clinicalTagIds: patientRecord.clinicalTagIds,
  });
  for (const conflict of fixedDiagnosisComposition.conflicts) {
    issues.push({
      severity: 'error',
      code: `PATIENT_${conflict.code}`,
      message: `${patientRecord.id}: ${conflict.message}`,
    });
  }
  if (patientRecord.reactionHistory.status === 'unassessed') {
    issues.push({
      severity: 'error',
      code: 'UNASSESSED_PATIENT_REACTION_HISTORY',
      message: `${patientRecord.id} must explicitly author known-none or reported allergy/adverse-reaction history.`,
    });
  }
  if (patientRecord.reactionHistory.medicationAssessmentStatus === 'unassessed') {
    issues.push({
      severity: 'error',
      code: 'UNASSESSED_PATIENT_MEDICATION_REACTION_HISTORY',
      message: `${patientRecord.id} must explicitly author known-none or reported medication reactions.`,
    });
  }
  for (const record of patientRecord.reactionHistory.records) {
    if (record.trigger.kind === 'medication' && !medicationById.has(record.trigger.medicationId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_REACTION_MEDICATION_REF',
        message: `${record.id} references ${record.trigger.medicationId}.`,
      });
    }
    if (
      record.trigger.kind === 'nonmedication' &&
      !nonMedicationReactionTriggerById.has(record.trigger.triggerId)
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_REACTION_TRIGGER_REF',
        message: `${record.id} references ${record.trigger.triggerId}.`,
      });
    }
    for (const manifestationId of record.manifestationIds) {
      if (!reactionManifestationIds.has(manifestationId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_REACTION_MANIFESTATION_REF',
          message: `${record.id} references ${manifestationId}.`,
        });
      }
    }
  }
  const reactionAction = blueprint.informationActions.find(
    (action) => action.actionId === 'info.history.allergies-adverse-reactions',
  );
  if (!reactionAction) {
    issues.push({
      severity: 'error',
      code: 'MISSING_REACTION_HISTORY_ACTION',
      message: `${patientRecord.id} has no allergies/adverse-reactions history action.`,
    });
  } else {
    const findingMatches = (label: string, outcome: string): boolean =>
      reactionAction.result.findings.some(
        (finding) => finding.outcome === outcome && finding.labelVariants.includes(label),
      );
    for (const record of patientRecord.reactionHistory.records) {
      const label =
        record.trigger.kind === 'medication'
          ? medicationById.get(record.trigger.medicationId)?.label
          : nonMedicationReactionTriggerById.get(record.trigger.triggerId)?.label;
      if (label && !findingMatches(label, 'present')) {
        issues.push({
          severity: 'error',
          code: 'REACTION_HISTORY_DISPLAY_MISMATCH',
          message: `${patientRecord.id} does not reveal reaction record ${record.id} as a present finding.`,
        });
      }
    }
    if (
      patientRecord.reactionHistory.status === 'documented_none' &&
      !findingMatches('Reported allergies or adverse reactions', 'absent')
    ) {
      issues.push({
        severity: 'error',
        code: 'REACTION_HISTORY_DISPLAY_MISMATCH',
        message: `${patientRecord.id} does not reveal its documented-none reaction history.`,
      });
    }
    if (
      patientRecord.reactionHistory.medicationAssessmentStatus === 'documented_none' &&
      patientRecord.reactionHistory.status !== 'documented_none' &&
      !findingMatches('Medication allergies or adverse reactions', 'absent')
    ) {
      issues.push({
        severity: 'error',
        code: 'REACTION_HISTORY_DISPLAY_MISMATCH',
        message: `${patientRecord.id} does not reveal its documented-none medication reaction history.`,
      });
    }
  }
  const safetyPlanningAction = blueprint.informationActions.find(
    (action) => action.actionId === 'info.history.existing-safety-plan',
  );
  if (patientRecord.reportedSafetyPlanningAbility === 'unassessed') {
    issues.push({
      severity: 'error',
      code: 'UNASSESSED_SAFETY_PLANNING_ABILITY',
      message: `${patientRecord.id} must explicitly author the patient's reported safety-planning ability.`,
    });
  }
  if (!safetyPlanningAction) {
    issues.push({
      severity: 'error',
      code: 'MISSING_SAFETY_PLANNING_ABILITY_ACTION',
      message: `${patientRecord.id} has no safety-planning ability history action.`,
    });
  } else if (patientRecord.reportedSafetyPlanningAbility !== 'unassessed') {
    const expectedOutcome =
      patientRecord.reportedSafetyPlanningAbility === 'reports_able'
        ? 'present'
        : patientRecord.reportedSafetyPlanningAbility === 'reports_unable'
          ? 'absent'
          : 'not_applicable';
    const expectedFactSuffix =
      patientRecord.reportedSafetyPlanningAbility === 'reports_able'
        ? 'reports-able'
        : patientRecord.reportedSafetyPlanningAbility === 'reports_unable'
          ? 'reports-unable'
          : 'uncertain';
    const abilityFinding = safetyPlanningAction.result.findings.find((finding) =>
      finding.labelVariants.includes('Feels able to participate in safety planning'),
    );
    if (
      abilityFinding?.outcome !== expectedOutcome ||
      !safetyPlanningAction.result.factsRevealed.some((factId) =>
        factId.endsWith(`safety-planning-ability.${expectedFactSuffix}`),
      )
    ) {
      issues.push({
        severity: 'error',
        code: 'SAFETY_PLANNING_ABILITY_DISPLAY_MISMATCH',
        message: `${patientRecord.id} does not reveal its authored safety-planning response as a matching structured fact.`,
      });
    }
  }
  if (patientRecord.complexityProfile.selectedModules.length > 0) {
    issues.push({
      severity: 'error',
      code: 'OPTIONAL_FEATURE_MODULE_COMPILER_NOT_IMPLEMENTED',
      message: `${patientRecord.id} selects optional complexity modules before the module catalog/compiler exists.`,
    });
  }
  if (
    patientRecord.complexityProfile.measurementStatus === 'authored_envelope' &&
    patientRecord.complexityProfile.targetEnvelope
  ) {
    const measured = { ...fixedDiagnosisComposition.complexityByDimension };
    for (const module of patientRecord.complexityProfile.selectedModules) {
      for (const contribution of module.complexityContributions) {
        measured[contribution.dimension] += contribution.weight;
      }
    }
    for (const [dimension, range] of Object.entries(
      patientRecord.complexityProfile.targetEnvelope,
    )) {
      const value = measured[dimension as keyof typeof measured];
      if (value < range.min || value > range.max) {
        issues.push({
          severity: 'error',
          code: 'PATIENT_COMPLEXITY_OUTSIDE_TARGET_ENVELOPE',
          message: `${patientRecord.id} ${dimension} complexity ${value} is outside ${range.min}–${range.max}.`,
        });
      }
    }
  }
  for (const duplicate of duplicateIds(patientRecord.medicationRegimen.map((entry) => entry.id))) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_MEDICATION_REGIMEN_ENTRY',
      message: `${patientRecord.id} repeats regimen entry ${duplicate}.`,
    });
  }
  for (const entry of patientRecord.medicationRegimen) {
    if (!medicationById.has(entry.medicationId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_REGIMEN_MEDICATION_REF',
        message: `${entry.id} references ${entry.medicationId}.`,
      });
    }
    if (entry.prescribedForDiagnosisId && !diagnosisById.has(entry.prescribedForDiagnosisId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_REGIMEN_DIAGNOSIS_REF',
        message: `${entry.id} references ${entry.prescribedForDiagnosisId}.`,
      });
    }
    if (entry.status === 'active' && entry.adherence === 'not_taking') {
      issues.push({
        severity: 'error',
        code: 'CONFLICTING_REGIMEN_STATUS',
        message: `${entry.id} cannot be active while adherence is not_taking.`,
      });
    }
  }
  for (const duplicate of duplicateIds(
    patientRecord.priorMedicationTrials.map((trial) => trial.id),
  )) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_MEDICATION_TRIAL',
      message: `${patientRecord.id} repeats trial ${duplicate}.`,
    });
  }
  for (const trial of patientRecord.priorMedicationTrials) {
    if (!medicationById.has(trial.medicationId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TRIAL_MEDICATION_REF',
        message: `${trial.id} references ${trial.medicationId}.`,
      });
    }
    if (
      trial.adequacy === 'adequate' &&
      trial.adherence !== 'consistent' &&
      !['outside_record', 'prescriber_record'].includes(trial.source)
    ) {
      issues.push({
        severity: 'warning',
        code: 'TRIAL_ADEQUACY_NEEDS_REVIEW',
        message: `${trial.id} is marked adequate despite ${trial.adherence} adherence.`,
      });
    }
  }

  if (patientRecord.diagnosisComposition) {
    const composition = patientRecord.diagnosisComposition;
    const fixedActiveCount = patientRecord.diagnoses.filter((diagnosis) =>
      ['primary', 'contributing'].includes(diagnosis.role),
    ).length;
    if (composition.maximumActiveDiagnoses < fixedActiveCount) {
      issues.push({
        severity: 'error',
        code: 'INVALID_MAXIMUM_ACTIVE_DIAGNOSES',
        message: `${patientRecord.id} already has ${fixedActiveCount} active diagnoses, above its declared maximum of ${composition.maximumActiveDiagnoses}.`,
      });
    }
    for (const duplicate of duplicateIds(
      composition.optionalComorbidities.map((candidate) => candidate.id),
    )) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_OPTIONAL_COMORBIDITY_ID',
        message: `${patientRecord.id} repeats ${duplicate}.`,
      });
    }
    for (const duplicate of duplicateIds(
      composition.optionalComorbidities.map((candidate) => candidate.diagnosisId),
    )) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_OPTIONAL_COMORBIDITY_DIAGNOSIS',
        message: `${patientRecord.id} repeats optional diagnosis ${duplicate}.`,
      });
    }
    const fixedDiagnosisIds = new Set(patientRecord.diagnoses.map((diagnosis) => diagnosis.id));
    for (const candidate of composition.optionalComorbidities) {
      const definition = diagnosisById.get(candidate.diagnosisId);
      if (!definition) {
        issues.push({
          severity: 'error',
          code: 'INVALID_OPTIONAL_COMORBIDITY_REF',
          message: `${candidate.id} references ${candidate.diagnosisId}.`,
        });
        continue;
      }
      if (fixedDiagnosisIds.has(candidate.diagnosisId)) {
        issues.push({
          severity: 'error',
          code: 'OPTIONAL_COMORBIDITY_ALREADY_FIXED',
          message: `${candidate.id} duplicates a fixed patient diagnosis.`,
        });
      }
      for (const severityId of candidate.allowedSeverityIds) {
        const severity = definition.severityAxis?.levels.find((level) => level.id === severityId);
        if (!severity) {
          issues.push({
            severity: 'error',
            code: 'INVALID_OPTIONAL_COMORBIDITY_SEVERITY',
            message: `${candidate.id} references ${severityId}.`,
          });
        } else if (severity.generationStatus !== 'enabled') {
          issues.push({
            severity: 'error',
            code: 'OPTIONAL_COMORBIDITY_SEVERITY_DISABLED',
            message: `${candidate.id} cannot generate ${severityId} while it is pending source review.`,
          });
        }
      }
      for (const specifierId of candidate.allowedSpecifierIds) {
        if (!definition.specifiers.some((specifier) => specifier.id === specifierId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_OPTIONAL_COMORBIDITY_SPECIFIER',
            message: `${candidate.id} references ${specifierId}.`,
          });
        }
      }
      const candidateComposition = composeDiagnosisGuidance(catalogs.diagnoses, {
        diagnoses: [
          ...patientRecord.diagnoses.map((diagnosis) => ({
            diagnosisId: diagnosis.id,
            role: diagnosis.role,
            severityId: diagnosis.severityId,
            specifierIds: diagnosis.specifierIds,
          })),
          {
            diagnosisId: candidate.diagnosisId,
            role: candidate.role,
            severityId: null,
            specifierIds: [],
          },
        ],
        clinicalTagIds: patientRecord.clinicalTagIds,
      });
      for (const conflict of candidateComposition.conflicts) {
        issues.push({
          severity: 'error',
          code: `OPTIONAL_${conflict.code}`,
          message: `${candidate.id}: ${conflict.message}`,
        });
      }
    }
  }

  const contextDimensionIds = patientRecord.clinicalContextDimensions.map(
    (dimension) => dimension.id,
  );
  const contextOptionIds = patientRecord.clinicalContextDimensions.flatMap((dimension) =>
    dimension.options.map((option) => option.id),
  );
  for (const duplicate of duplicateIds([...contextDimensionIds, ...contextOptionIds])) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_CLINICAL_CONTEXT_ID',
      message: `${patientRecord.id} repeats ${duplicate}.`,
    });
  }
  const boundFindingDimensions = new Map<string, string>();
  for (const dimension of patientRecord.clinicalContextDimensions) {
    const expectedTargets = dimension.options[0]!.findingBindings.map(
      (binding) => `${binding.actionId}/${binding.findingId}`,
    ).sort();
    for (const option of dimension.options) {
      const targets = option.findingBindings
        .map((binding) => `${binding.actionId}/${binding.findingId}`)
        .sort();
      if (
        targets.length !== expectedTargets.length ||
        targets.some((target, index) => target !== expectedTargets[index])
      ) {
        issues.push({
          severity: 'error',
          code: 'INCONSISTENT_CLINICAL_CONTEXT_BINDINGS',
          message: `${dimension.id}: every option must resolve the same finding targets.`,
        });
      }
      for (const duplicate of duplicateIds(targets)) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_CLINICAL_CONTEXT_BINDING',
          message: `${option.id} repeats ${duplicate}.`,
        });
      }
      for (const binding of option.findingBindings) {
        const action = blueprint.informationActions.find(
          (candidate) => candidate.actionId === binding.actionId,
        );
        const finding = action?.result.findings.find(
          (candidate) => candidate.id === binding.findingId,
        );
        if (!action || !finding || finding.outcome !== 'variable' || !action.result.selection) {
          issues.push({
            severity: 'error',
            code: 'INVALID_CLINICAL_CONTEXT_BINDING',
            message: `${option.id} must target a variable finding with selection constraints: ${binding.actionId}/${binding.findingId}.`,
          });
          continue;
        }
        if (
          action.result.selection.requiredAbsentIds.includes(binding.findingId) ||
          action.result.selection.requiredPresentIds.includes(binding.findingId)
        ) {
          issues.push({
            severity: 'error',
            code: 'CONFLICTING_CLINICAL_CONTEXT_BINDING',
            message: `${option.id} cannot control required finding ${binding.findingId}.`,
          });
        }
      }
    }
    for (const target of expectedTargets) {
      const owner = boundFindingDimensions.get(target);
      if (owner && owner !== dimension.id) {
        issues.push({
          severity: 'error',
          code: 'OVERLAPPING_CLINICAL_CONTEXT_DIMENSIONS',
          message: `${dimension.id} and ${owner} both control ${target}.`,
        });
      } else {
        boundFindingDimensions.set(target, dimension.id);
      }
    }
  }
  for (const action of blueprint.informationActions.filter(
    (candidate) => candidate.result.selection,
  )) {
    const selection = action.result.selection!;
    const maximumContextPositives = patientRecord.clinicalContextDimensions.reduce(
      (total, dimension) =>
        total +
        Math.max(
          ...dimension.options.map(
            (option) =>
              option.findingBindings.filter(
                (binding) => binding.actionId === action.actionId && binding.outcome === 'present',
              ).length,
          ),
        ),
      0,
    );
    if (selection.requiredPresentIds.length + maximumContextPositives > selection.maximumPresent) {
      issues.push({
        severity: 'error',
        code: 'CLINICAL_CONTEXT_EXCEEDS_FINDING_MAXIMUM',
        message: `${action.actionId} can receive more context-bound positive findings than its declared maximum.`,
      });
    }
  }

  const treatmentReference = patientRecord.treatmentReference;
  const authoredPathwayIds = treatmentReference.primaryAuthoredPathwayId
    ? [
        treatmentReference.primaryAuthoredPathwayId,
        ...treatmentReference.additionalAuthoredPathwayIds,
        ...treatmentReference.safetyFallbackPathwayIds,
      ]
    : (treatmentReference.authoredPathwayIds ?? []);
  for (const pathwayId of authoredPathwayIds) {
    if (!blueprint.treatmentPathways.some((pathway) => pathway.id === pathwayId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_PATIENT_PATHWAY_REF',
        message: `${patientRecord.id} references ${pathwayId}`,
      });
    }
  }
  for (const observation of patientRecord.observations) {
    if (!caseActionIds.has(observation.actionId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_PATIENT_OBSERVATION_REF',
        message: `${observation.id} references ${observation.actionId}`,
      });
    }
  }
  const sourceUseNoteIds = new Set(patientRecord.sourceUseNotes.map((note) => note.id));
  const caseContentIds = new Set([
    blueprint.id,
    patientRecord.id,
    treatmentReference.id,
    ...blueprint.workupObjectives.map((item) => item.id),
    ...blueprint.treatmentWorkupRequirements.map((item) => item.id),
    ...blueprint.treatmentGrades.map((item) => item.id),
    ...blueprint.treatmentPathways.map((item) => item.id),
    ...blueprint.scoreRules.map((item) => item.id),
    ...(blueprint.diagnosisRubric
      ? [
          ...blueprint.diagnosisRubric.groups.flatMap((group) => [
            group.id,
            group.omission.id,
            ...group.options.map((option) => option.id),
          ]),
          ...blueprint.diagnosisRubric.misclassificationRules.map((rule) => rule.id),
          blueprint.diagnosisRubric.additionalSelectionPolicy.id,
        ]
      : []),
    ...treatmentReference.acceptedMedicationTagSets.map((item) => item.id),
    ...contextDimensionIds,
    ...contextOptionIds,
    ...(patientRecord.diagnosisComposition?.optionalComorbidities.map(
      (candidate) => candidate.id,
    ) ?? []),
  ]);
  const ruleReviews = [
    patientRecord.treatmentReference.review,
    ...patientRecord.treatmentReference.acceptedMedicationTagSets.map((tagSet) => tagSet.review),
    ...blueprint.workupObjectives.map((objective) => objective.review),
    ...blueprint.treatmentWorkupRequirements.map((requirement) => requirement.review),
    ...blueprint.treatmentGrades.map((grade) => grade.review),
    ...blueprint.treatmentPathways.flatMap((pathway) => [
      pathway.review,
      ...pathway.conditionalRequirements.map((requirement) => requirement.review),
    ]),
    ...blueprint.scoreRules.map((rule) => rule.review),
    ...(blueprint.diagnosisRubric
      ? [
          ...blueprint.diagnosisRubric.groups.flatMap((group) => [
            group.omission.review,
            ...group.options.map((option) => option.review),
          ]),
          ...blueprint.diagnosisRubric.misclassificationRules.map((rule) => rule.review),
          blueprint.diagnosisRubric.additionalSelectionPolicy.review,
        ]
      : []),
    ...patientRecord.clinicalContextDimensions.flatMap((dimension) => [
      dimension.review,
      ...dimension.options.map((option) => option.review),
    ]),
    ...(patientRecord.diagnosisComposition?.optionalComorbidities.map(
      (candidate) => candidate.review,
    ) ?? []),
  ];
  for (const review of ruleReviews) {
    if (review.status === 'approved' && review.sourceUseNoteIds.length === 0) {
      issues.push({
        severity: 'error',
        code: 'APPROVED_RULE_WITHOUT_EVIDENCE_ATTRIBUTION',
        message: `${patientRecord.id} contains an approved rule without a formal-source or expert-opinion contribution.`,
      });
    }
    for (const sourceUseNoteId of review.sourceUseNoteIds) {
      if (!sourceUseNoteIds.has(sourceUseNoteId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_RULE_SOURCE_NOTE_REF',
          message: `${patientRecord.id} rule review references ${sourceUseNoteId}`,
        });
      }
    }
  }
  const catalogEvidenceSourceIds = new Set(catalogs.evidenceSources.map((source) => source.id));
  const declaredEvidenceSourceIds = new Set(blueprint.metadata.evidenceSourceIds);
  for (const evidenceSourceId of declaredEvidenceSourceIds) {
    if (!catalogEvidenceSourceIds.has(evidenceSourceId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_CASE_EVIDENCE_SOURCE_REF',
        message: `${blueprint.id} references uncataloged formal source ${evidenceSourceId}`,
      });
    }
  }
  const medicationTags = new Set(catalogs.medications.flatMap((medication) => medication.tags));
  for (const tagSet of treatmentReference.acceptedMedicationTagSets) {
    for (const tagId of tagSet.allOfTagIds) {
      if (!medicationTags.has(tagId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_MEDICATION_TAG_REF',
          message: `${tagSet.id} references ${tagId}`,
        });
      }
    }
  }
  const declaredSourceIds = new Set(blueprint.metadata.sourceDocumentIds);
  for (const sourceUseNote of patientRecord.sourceUseNotes) {
    if (sourceUseNote.sourceDocumentId && !declaredSourceIds.has(sourceUseNote.sourceDocumentId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_SOURCE_USE_NOTE_REF',
        message: `${sourceUseNote.id} references undeclared source ${sourceUseNote.sourceDocumentId}`,
      });
    }
    for (const evidenceSourceId of sourceUseNote.evidenceSourceIds) {
      if (!catalogEvidenceSourceIds.has(evidenceSourceId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_EVIDENCE_SOURCE_REF',
          message: `${sourceUseNote.id} references uncataloged formal source ${evidenceSourceId}`,
        });
      }
      if (!declaredEvidenceSourceIds.has(evidenceSourceId)) {
        issues.push({
          severity: 'error',
          code: 'UNDECLARED_CASE_EVIDENCE_SOURCE',
          message: `${sourceUseNote.id} uses ${evidenceSourceId}, which is absent from case metadata.`,
        });
      }
    }
    for (const targetContentId of sourceUseNote.targetContentIds) {
      if (!caseContentIds.has(targetContentId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_EVIDENCE_CONTRIBUTION_TARGET',
          message: `${sourceUseNote.id} targets missing case content ${targetContentId}`,
        });
      }
    }
    if (sourceUseNote.medicalReviewStatus === 'approved') {
      issues.push({
        severity: 'error',
        code: 'PROTOTYPE_SOURCE_NOTE_APPROVAL',
        message: `${sourceUseNote.id} cannot self-claim medical approval.`,
      });
    }
  }
  if (blueprint.scoring.databasePlanWorkupCost <= 0) {
    issues.push({
      severity: 'error',
      code: 'INVALID_PAR',
      message: 'Database-plan workup cost must be positive.',
    });
  }
  if (
    !blueprint.treatmentPathways.some(
      (pathway) =>
        pathway.accepted && ['optimal', 'strong_alternative', 'acceptable'].includes(pathway.grade),
    )
  ) {
    issues.push({
      severity: 'error',
      code: 'NO_ACCEPTABLE_PATH',
      message: 'At least one acceptable treatment pathway is required.',
    });
  }

  const catalogMedicationIds = new Set(catalogs.medications.map((medication) => medication.id));
  const catalogTreatmentIds = new Set(catalogs.treatments.map((treatment) => treatment.id));
  for (const medicationId of [
    ...blueprint.opening.knownMedicationIds,
    ...blueprint.availableTreatments.startMedicationIds,
    ...blueprint.availableTreatments.stopMedicationIds,
    ...blueprint.availableTreatments.continueMedicationIds,
  ]) {
    if (!catalogMedicationIds.has(medicationId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_MEDICATION_REF',
        message: medicationId,
      });
    }
  }
  for (const treatmentId of [
    ...blueprint.availableTreatments.interventionIds,
    ...blueprint.availableTreatments.dispositionIds,
  ]) {
    if (!catalogTreatmentIds.has(treatmentId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TREATMENT_REF',
        message: treatmentId,
      });
    }
  }
  if (
    blueprint.opening.medicationListStatus === 'provided' &&
    blueprint.opening.knownMedicationIds.length === 0
  ) {
    issues.push({
      severity: 'error',
      code: 'INVALID_OPENING_MEDICATION_STATUS',
      message: `${blueprint.id} marks an empty medication list as provided.`,
    });
  }
  if (
    blueprint.opening.medicationListStatus !== 'provided' &&
    blueprint.opening.knownMedicationIds.length > 0
  ) {
    issues.push({
      severity: 'error',
      code: 'INVALID_OPENING_MEDICATION_STATUS',
      message: `${blueprint.id} exposes medications without a provided-list status.`,
    });
  }
  const treatmentHistory = blueprint.patientRecord.treatmentHistory;
  const legacyTrialIds = new Set(
    blueprint.patientRecord.priorMedicationTrials.map((trial) => trial.id),
  );
  for (const trial of treatmentHistory.medicationTrials) {
    if (legacyTrialIds.has(trial.id)) {
      const legacy = blueprint.patientRecord.priorMedicationTrials.find(
        (candidate) => candidate.id === trial.id,
      );
      if (JSON.stringify(legacy) !== JSON.stringify(trial)) {
        issues.push({
          severity: 'error',
          code: 'CONFLICTING_TREATMENT_HISTORY',
          message: `${blueprint.id} defines conflicting medication trial ${trial.id}.`,
        });
      }
    }
    if (!catalogMedicationIds.has(trial.medicationId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TREATMENT_HISTORY_MEDICATION_REF',
        message: `${trial.id} references ${trial.medicationId}.`,
      });
    }
  }
  for (const trial of treatmentHistory.psychotherapyTrials) {
    if (
      !catalogs.treatments.some(
        (treatment) => treatment.id === trial.interventionId && treatment.kind === 'nonmedication',
      )
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TREATMENT_HISTORY_INTERVENTION_REF',
        message: `${trial.id} references ${trial.interventionId}.`,
      });
    }
  }
  for (const duplicate of duplicateIds([
    ...treatmentHistory.medicationTrials.map((entry) => entry.id),
    ...treatmentHistory.psychotherapyTrials.map((entry) => entry.id),
    ...treatmentHistory.currentProviders.map((entry) => entry.id),
    ...treatmentHistory.priorLevelsOfCare.map((entry) => entry.id),
  ])) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_TREATMENT_HISTORY_ID',
      message: `${blueprint.id}: ${duplicate}`,
    });
  }

  for (const solution of blueprint.referenceSolutions) {
    if (
      solution.actionIds.some(
        (actionId) => !blueprint.informationActions.some((action) => action.actionId === actionId),
      ) ||
      !selectionReferencesAreValid(solution.selections, blueprint)
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_REFERENCE_SOLUTION',
        message: `${solution.id} uses an unavailable action or treatment.`,
      });
    }
    if (
      solution.diagnosisSelections.some(
        (selection) => !diagnosisSelectionReferenceIsValid(selection, catalogs),
      )
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_REFERENCE_DIAGNOSIS_SELECTION',
        message: `${solution.id} uses an unavailable diagnosis or qualifier.`,
      });
    }
    if (
      solution.diagnosisSelections.some((selection) => !isFamilyOnlyDiagnosisSelection(selection))
    ) {
      issues.push({
        severity: 'error',
        code: 'UNSUPPORTED_REFERENCE_DIAGNOSIS_QUALIFIER_UI',
        message: `${solution.id} uses a severity or specifier that the current player UI cannot select.`,
      });
    }
  }
  if (blueprint.diagnosisRubric) {
    const databasePlan = blueprint.referenceSolutions.find(
      (solution) => solution.kind === 'database_plan',
    );
    const missingCanonical = blueprint.diagnosisRubric.groups.filter(
      (group) =>
        !databasePlan?.diagnosisSelections.some(
          (selection) =>
            selection.diagnosisId === group.canonicalSelection.diagnosisId &&
            selection.severityId === group.canonicalSelection.severityId &&
            [...selection.specifierIds].sort().join('|') ===
              [...group.canonicalSelection.specifierIds].sort().join('|'),
        ),
    );
    if (!databasePlan || missingCanonical.length > 0) {
      issues.push({
        severity: 'error',
        code: 'REFERENCE_PLAN_MISSING_CANONICAL_DIAGNOSIS',
        message: `${blueprint.id} database plan omits a canonical diagnostic answer.`,
      });
    }
  }

  const hasSafeDisposition = blueprint.availableTreatments.dispositionIds.some((id) =>
    catalogs.treatments.some(
      (treatment) =>
        treatment.id === id && treatment.kind === 'disposition' && treatment.safeReferral,
    ),
  );
  if (!hasSafeDisposition) {
    issues.push({
      severity: 'error',
      code: 'NO_SAFE_DISPOSITION',
      message: 'At least one safe referral or transfer path is required.',
    });
  }

  if (
    !blueprint.metadata.fictional ||
    !blueprint.metadata.synthetic ||
    blueprint.metadata.medicalReviewStatus === 'approved' ||
    !blueprint.metadata.disclaimer.toLowerCase().includes('medically unreviewed')
  ) {
    issues.push({
      severity: 'error',
      code: 'PROTOTYPE_MEDICAL_CLAIM',
      message: 'Prototype content must remain fictional, synthetic, and medically unreviewed.',
    });
  }
  for (const variant of blueprint.variants) {
    const generator = variant.generator;
    if (
      blueprint.protectedVariantTargets.some(
        (protectedTarget) =>
          variant.target === protectedTarget || variant.target.startsWith(`${protectedTarget}.`),
      )
    ) {
      issues.push({
        severity: 'error',
        code: 'VARIANT_TOUCHES_CRITICAL_FACT',
        message: `${variant.id} targets protected field ${variant.target}.`,
      });
    }
    if (
      (generator.type === 'integerRange' || generator.type === 'decimalRange') &&
      generator.min > generator.max
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_VARIANT_RANGE',
        message: `${variant.id} has an inverted range.`,
      });
    }
    if (
      generator.type === 'catalogChoice' &&
      !catalogs.variantPools.some((pool) => pool.id === generator.poolId)
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_VARIANT_POOL_REF',
        message: `${variant.id} references ${generator.poolId}.`,
      });
    }
    if (generator.type === 'fictionalName') {
      const firstPool = catalogs.variantPools.find((pool) => pool.id === generator.firstNamePoolId);
      const lastPool = catalogs.variantPools.find((pool) => pool.id === generator.lastNamePoolId);
      if (!firstPool || firstPool.kind !== 'fictional_first_name') {
        issues.push({
          severity: 'error',
          code: 'INVALID_FIRST_NAME_POOL_REF',
          message: `${variant.id} references ${generator.firstNamePoolId}.`,
        });
      }
      if (!lastPool || lastPool.kind !== 'fictional_last_name') {
        issues.push({
          severity: 'error',
          code: 'INVALID_LAST_NAME_POOL_REF',
          message: `${variant.id} references ${generator.lastNamePoolId}.`,
        });
      }
    }
  }

  const presentationVariants = presentationVariantCardinality(blueprint, catalogs);
  if (presentationVariants < patientRecord.generationPolicy.minimumPresentationVariants) {
    issues.push({
      severity: 'error',
      code: 'INSUFFICIENT_PRESENTATION_VARIATION',
      message: `${blueprint.id} exposes approximately ${presentationVariants} presentation variants; ${patientRecord.generationPolicy.minimumPresentationVariants} are required.`,
    });
  }

  let instance;
  try {
    instance = instantiateCase(blueprint, 'content-validation', catalogs);
  } catch (error) {
    issues.push({
      severity: 'error',
      code: 'CASE_INSTANTIATION_FAILED',
      message: error instanceof Error ? error.message : 'Case instantiation failed.',
    });
    return { valid: false, issues };
  }
  const validationContexts = blueprint.metadata.compatibleLocationIds.flatMap((locationId) => {
    const location = catalogs.locations.find((candidate) => candidate.id === locationId);
    const facility = catalogs.facilities.find((candidate) =>
      candidate.locationIds.includes(locationId),
    );
    if (!location || !facility) {
      issues.push({
        severity: 'error',
        code: 'CASE_LOCATION_UNAVAILABLE',
        message: `${blueprint.id} references ${locationId}, which no facility can host.`,
      });
      return [];
    }
    if (facility.tier === 'behavioral_health_system') {
      return [
        {
          locationId,
          clinic: resolveClinicForProgressionMode(clinicState, 'endgame', catalogs),
        },
      ];
    }
    const resolved = resolveClinicForFacility(clinicState, facility.id, catalogs);
    if (resolved.ok) {
      return [
        {
          locationId,
          clinic: {
            ...resolved.value,
            lifetimePointsEarned: Math.max(
              resolved.value.lifetimePointsEarned,
              facility.minimumLifetimePoints,
            ),
          },
        },
      ];
    }
    issues.push({
      severity: 'error',
      code: 'CASE_LOCATION_UNAVAILABLE',
      message: `${blueprint.id} references ${locationId}: ${resolved.error.message}`,
    });
    return [];
  });
  for (const context of validationContexts) {
    const eligibility = evaluateCaseEligibility(
      instance,
      context.clinic,
      context.locationId,
      catalogs,
    );
    for (const reason of eligibility.reasons) {
      issues.push({
        severity: 'error',
        code: 'CASE_INELIGIBLE',
        message: `${context.locationId}: ${reason}`,
      });
    }
  }

  for (const context of validationContexts) {
    for (const objective of blueprint.workupObjectives.filter((item) => item.requiredByDefault)) {
      const refs = extractPredicateReferences(objective.satisfaction);
      const anyReachable = refs.actionIds.some((actionId) => {
        const action = catalogs.informationActions.find((candidate) => candidate.id === actionId);
        if (!action) return false;
        return resolveServiceFulfillment(
          action.serviceId,
          context.clinic,
          context.locationId,
          catalogs.services,
          catalogs.locations,
        ).ok;
      });
      if (!anyReachable) {
        issues.push({
          severity: 'error',
          code: 'REQUIRED_ACTION_INACCESSIBLE',
          message: `${context.locationId}: ${objective.label}`,
        });
      }
    }

    for (const objective of blueprint.workupObjectives) {
      const refs = extractPredicateReferences(objective.satisfaction);
      if (refs.actionIds.length !== 1) continue;
      const actionId = refs.actionIds[0]!;
      const action = catalogs.informationActions.find((candidate) => candidate.id === actionId);
      if (!action) continue;
      const fulfillment = resolveServiceFulfillment(
        action.serviceId,
        context.clinic,
        context.locationId,
        catalogs.services,
        catalogs.locations,
      );
      if (!fulfillment.ok) continue;
      const conditionalRewards = blueprint.treatmentPathways.flatMap((pathway) =>
        pathway.conditionalRequirements
          .filter((requirement) => requirement.objectiveId === objective.id)
          .map((requirement) => requirement.pointsIfMet),
      );
      conditionalRewards.push(
        ...blueprint.treatmentWorkupRequirements
          .filter((requirement) => requirement.objectiveId === objective.id)
          .map((requirement) => requirement.pointsIfMet),
      );
      const earnedWhenIndicated =
        objective.points + (conditionalRewards.length > 0 ? Math.max(...conditionalRewards) : 0);
      const isIndicated =
        objective.requiredByDefault ||
        conditionalRewards.length > 0 ||
        objective.importance === 'essential';
      if (isIndicated && earnedWhenIndicated <= fulfillment.value.method.operatingCost) {
        issues.push({
          severity: 'error',
          code: 'INDICATED_ACTION_REWARD_NOT_ABOVE_COST',
          message: `${context.locationId}: ${actionId} costs ${fulfillment.value.method.operatingCost} points but earns only ${earnedWhenIndicated}.`,
        });
      }
    }
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues };
};

export const validateCatalogs = (catalogs: CatalogBundle): ContentValidationReport => {
  const issues: ValidationIssue[] = [];
  for (const [name, ids] of [
    ['evidenceSources', catalogs.evidenceSources.map((item) => item.id)],
    ['diagnoses', catalogs.diagnoses.map((item) => item.id)],
    ['findings', catalogs.findings.map((item) => item.id)],
    ['services', catalogs.services.map((item) => item.id)],
    ['medications', catalogs.medications.map((item) => item.id)],
    ['formularies', catalogs.formularies.map((item) => item.id)],
    ['treatments', catalogs.treatments.map((item) => item.id)],
    ['locations', catalogs.locations.map((item) => item.id)],
    ['facilities', catalogs.facilities.map((item) => item.id)],
    ['informationActions', catalogs.informationActions.map((item) => item.id)],
    ['variantPools', catalogs.variantPools.map((item) => item.id)],
    ['tests', catalogs.tests.map((item) => item.id)],
    ['testActions', catalogs.tests.map((item) => item.actionId)],
    ['referenceIntervalSets', catalogs.referenceIntervalSets.map((item) => item.id)],
    [
      'nonMedicationReactionTriggers',
      catalogs.reactionConcepts.nonMedicationTriggers.map((item) => item.id),
    ],
    ['reactionManifestations', catalogs.reactionConcepts.manifestations.map((item) => item.id)],
    ['upgrades', catalogs.upgrades.map((item) => item.id)],
    ['decor', catalogs.decor.items.map((item) => item.id)],
  ] as const) {
    for (const duplicate of duplicateIds(ids)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_CATALOG_ID',
        message: `${name}: ${duplicate}`,
      });
    }
  }
  const normalizedFindingTermOwners = new Map<string, string>();
  for (const definition of catalogs.findings) {
    if (definition.lifecycle !== 'approved') {
      issues.push({
        severity: 'error',
        code: 'NON_APPROVED_RUNTIME_FINDING',
        message: `${definition.id}: ${definition.lifecycle}`,
      });
    }
    for (const term of [definition.label, ...definition.aliases]) {
      const normalized = term.normalize('NFKC').trim().toLocaleLowerCase('en-US');
      if (!normalized) {
        issues.push({
          severity: 'error',
          code: 'EMPTY_FINDING_TERM',
          message: definition.id,
        });
        continue;
      }
      const previousOwner = normalizedFindingTermOwners.get(normalized);
      if (previousOwner) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_FINDING_TERM',
          message: `${term}: ${previousOwner} and ${definition.id}`,
        });
      } else {
        normalizedFindingTermOwners.set(normalized, definition.id);
      }
    }
    for (const duplicate of duplicateIds(definition.valueSpecification.allowedValues)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_FINDING_ALLOWED_VALUE',
        message: `${definition.id}: ${duplicate}`,
      });
    }
    for (const duplicate of duplicateIds(definition.allowedPresentationProjections)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_FINDING_PRESENTATION_PROJECTION',
        message: `${definition.id}: ${duplicate}`,
      });
    }
  }
  for (const duplicate of duplicateIds(
    catalogs.evidenceSources.flatMap((source) => source.knownContentHashes),
  )) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_EVIDENCE_CONTENT_HASH',
      message: duplicate,
    });
  }
  for (const duplicate of duplicateIds(
    catalogs.evidenceSources.flatMap((source) => (source.doi ? [source.doi.toLowerCase()] : [])),
  )) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_EVIDENCE_DOI',
      message: duplicate,
    });
  }
  const evidenceSourceIds = new Set(catalogs.evidenceSources.map((source) => source.id));
  for (const source of catalogs.evidenceSources) {
    const relationKeys = source.sourceRelations.map(
      (relation) => `${relation.relationType}:${relation.sourceId}`,
    );
    for (const duplicate of duplicateIds(relationKeys)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_EVIDENCE_SOURCE_RELATION',
        message: `${source.id}: ${duplicate}`,
      });
    }
    for (const relation of source.sourceRelations) {
      if (relation.sourceId === source.id) {
        issues.push({
          severity: 'error',
          code: 'SELF_REFERENTIAL_EVIDENCE_SOURCE_RELATION',
          message: `${source.id}: ${relation.relationType}`,
        });
      } else if (!evidenceSourceIds.has(relation.sourceId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_EVIDENCE_SOURCE_RELATION',
          message: `${source.id}: ${relation.relationType} ${relation.sourceId}`,
        });
      }
    }
  }
  const diagnosisById = new Map(catalogs.diagnoses.map((diagnosis) => [diagnosis.id, diagnosis]));
  const medicationIds = new Set(catalogs.medications.map((medication) => medication.id));
  const medicationTagIds = new Set(catalogs.medications.flatMap((medication) => medication.tags));
  const informationActionIds = new Set(catalogs.informationActions.map((action) => action.id));
  const treatmentById = new Map(catalogs.treatments.map((treatment) => [treatment.id, treatment]));
  const serviceIds = new Set(catalogs.services.map((service) => service.id));
  const formularyIds = new Set(catalogs.formularies.map((formulary) => formulary.id));

  for (const treatment of catalogs.treatments) {
    if (treatment.fulfillmentServiceId && !serviceIds.has(treatment.fulfillmentServiceId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TREATMENT_SERVICE_REF',
        message: `${treatment.id} references ${treatment.fulfillmentServiceId}`,
      });
    }
  }
  for (const action of catalogs.informationActions) {
    if (
      /\b(?:when appropriate|when clinically relevant|if indicated)\b/i.test(action.description)
    ) {
      issues.push({
        severity: 'error',
        code: 'PRE_SUBMISSION_ACTION_HINT',
        message: `${action.id} contains answer-hint wording.`,
      });
    }
  }

  const diagnosisNestedIds = catalogs.diagnoses.flatMap((diagnosis) => [
    diagnosis.id,
    ...diagnosis.baseRules.map((rule) => rule.id),
    ...diagnosis.complexityContributions.map((contribution) => contribution.id),
    ...diagnosis.classificationBindings.map((binding) => binding.id),
    ...diagnosis.sourceUseNotes.map((note) => note.id),
    ...(diagnosis.severityAxis
      ? [
          diagnosis.severityAxis.id,
          ...(diagnosis.severityAxis.derivationPolicy
            ? [diagnosis.severityAxis.derivationPolicy.id]
            : []),
          ...diagnosis.severityAxis.levels.flatMap((level) => [
            level.id,
            ...level.rules.map((rule) => rule.id),
            ...level.complexityContributions.map((contribution) => contribution.id),
          ]),
        ]
      : []),
    ...diagnosis.specifiers.flatMap((specifier) => [
      specifier.id,
      ...specifier.rules.map((rule) => rule.id),
      ...specifier.complexityContributions.map((contribution) => contribution.id),
    ]),
  ]);
  for (const duplicate of duplicateIds(diagnosisNestedIds)) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_DIAGNOSIS_CONTENT_ID',
      message: duplicate,
    });
  }
  const evidenceTargetContentIds = new Set([
    ...diagnosisNestedIds,
    ...catalogs.medications.flatMap((medication) => [
      medication.id,
      ...medication.fitModifiers.map((modifier) => modifier.id),
      ...medication.authorOverrides.map((modifier) => modifier.id),
    ]),
    ...medicationIdentities.map((identity) => identity.id),
    ...catalogs.findings.map((finding) => finding.id),
    ...catalogs.treatments.map((treatment) => treatment.id),
    ...catalogs.informationActions.map((action) => action.id),
    ...catalogs.tests.map((test) => test.id),
  ]);

  for (const diagnosis of catalogs.diagnoses) {
    const sourceUseNoteIds = new Set(diagnosis.sourceUseNotes.map((note) => note.id));
    if (diagnosis.severityAxis) {
      for (const duplicate of duplicateIds(
        diagnosis.severityAxis.levels.map((level) => String(level.rank)),
      )) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_DIAGNOSIS_SEVERITY_RANK',
          message: `${diagnosis.id}: ${duplicate}`,
        });
      }
    }
    for (const duplicate of duplicateIds(
      diagnosis.comorbidityRelationships.map((relationship) => relationship.diagnosisId),
    )) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_DIAGNOSIS_RELATIONSHIP',
        message: `${diagnosis.id}: ${duplicate}`,
      });
    }
    for (const relationship of diagnosis.comorbidityRelationships) {
      if (
        relationship.diagnosisId === diagnosis.id ||
        !diagnosisById.has(relationship.diagnosisId)
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_DIAGNOSIS_RELATIONSHIP_REF',
          message: `${diagnosis.id}: ${relationship.diagnosisId}`,
        });
      }
      if (
        relationship.relationship === 'mutually_exclusive' &&
        relationship.gameGenerationWeight !== null
      ) {
        issues.push({
          severity: 'error',
          code: 'MUTUALLY_EXCLUSIVE_DIAGNOSIS_HAS_GENERATION_WEIGHT',
          message: `${diagnosis.id}: ${relationship.diagnosisId}`,
        });
      }
    }

    const rules = [
      ...diagnosis.baseRules,
      ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
      ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
    ];
    const complexityContributions = [
      ...diagnosis.complexityContributions,
      ...(diagnosis.severityAxis?.levels.flatMap((level) => level.complexityContributions) ?? []),
      ...diagnosis.specifiers.flatMap((specifier) => specifier.complexityContributions),
    ];
    const nestedReviews = [
      ...rules.map((rule) => rule.review),
      ...complexityContributions.map((contribution) => contribution.review),
      ...(diagnosis.severityAxis?.derivationPolicy
        ? [diagnosis.severityAxis.derivationPolicy.review]
        : []),
      ...(diagnosis.severityAxis?.levels.map((level) => level.review) ?? []),
      ...diagnosis.specifiers.map((specifier) => specifier.review),
      ...diagnosis.comorbidityRelationships.map((relationship) => relationship.review),
      ...diagnosis.classificationBindings.map((binding) => binding.review),
    ];
    for (const review of nestedReviews) {
      if (review.status === 'approved' && review.sourceUseNoteIds.length === 0) {
        issues.push({
          severity: 'error',
          code: 'APPROVED_DIAGNOSIS_RULE_WITHOUT_EVIDENCE_ATTRIBUTION',
          message: diagnosis.id,
        });
      }
      for (const sourceUseNoteId of review.sourceUseNoteIds) {
        if (!sourceUseNoteIds.has(sourceUseNoteId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_DIAGNOSIS_SOURCE_NOTE_REF',
            message: `${diagnosis.id}: ${sourceUseNoteId}`,
          });
        }
      }
    }
    for (const level of diagnosis.severityAxis?.levels ?? []) {
      if (level.generationStatus === 'enabled' && level.review.status !== 'approved') {
        issues.push({
          severity: 'error',
          code: 'UNREVIEWED_DIAGNOSIS_SEVERITY_ENABLED',
          message: `${diagnosis.id}: ${level.id}`,
        });
      }
    }
    for (const note of diagnosis.sourceUseNotes) {
      for (const evidenceSourceId of note.evidenceSourceIds) {
        if (!evidenceSourceIds.has(evidenceSourceId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_DIAGNOSIS_EVIDENCE_SOURCE_REF',
            message: `${diagnosis.id}: ${note.id} references ${evidenceSourceId}`,
          });
        }
      }
      for (const targetContentId of note.targetContentIds) {
        if (!evidenceTargetContentIds.has(targetContentId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_DIAGNOSIS_EVIDENCE_TARGET',
            message: `${diagnosis.id}: ${note.id} targets ${targetContentId}`,
          });
        }
      }
    }
    for (const rule of rules) {
      if (rule.patientWhen) {
        const references = extractPatientContextReferences(rule.patientWhen);
        for (const diagnosisId of references.diagnosisIds) {
          if (!diagnosisById.has(diagnosisId)) {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_CONTEXT_REF',
              message: `${rule.id}: ${diagnosisId}`,
            });
          }
        }
        for (const reference of references.severities) {
          if (
            !diagnosisById
              .get(reference.diagnosisId)
              ?.severityAxis?.levels.some((level) => level.id === reference.severityId)
          ) {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_SEVERITY_REF',
              message: `${rule.id}: ${reference.diagnosisId}/${reference.severityId}`,
            });
          }
        }
        for (const reference of references.specifiers) {
          if (
            !diagnosisById
              .get(reference.diagnosisId)
              ?.specifiers.some((specifier) => specifier.id === reference.specifierId)
          ) {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_SPECIFIER_REF',
              message: `${rule.id}: ${reference.diagnosisId}/${reference.specifierId}`,
            });
          }
        }
      }
      if (rule.selectionWhen) {
        const validateCountBounds = (predicate: ScorePredicate): void => {
          if (
            predicate.type === 'treatmentStartedWithTag' &&
            predicate.minimumCount > predicate.maximumCount
          ) {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_MEDICATION_TAG_COUNT',
              message: `${rule.id}: ${predicate.medicationTagId}`,
            });
          }
          if (predicate.type === 'any' || predicate.type === 'all') {
            predicate.predicates.forEach(validateCountBounds);
          }
          if (predicate.type === 'not') validateCountBounds(predicate.predicate);
        };
        validateCountBounds(rule.selectionWhen);
        const references = extractPredicateReferences(rule.selectionWhen);
        for (const medicationId of references.medicationIds) {
          if (!medicationIds.has(medicationId)) {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_MEDICATION_REF',
              message: `${rule.id}: ${medicationId}`,
            });
          }
        }
        for (const medicationTagId of references.medicationTagIds) {
          if (!medicationTagIds.has(medicationTagId)) {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_MEDICATION_TAG_REF',
              message: `${rule.id}: ${medicationTagId}`,
            });
          }
        }
        for (const interventionId of references.interventionIds) {
          if (treatmentById.get(interventionId)?.kind !== 'nonmedication') {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_INTERVENTION_REF',
              message: `${rule.id}: ${interventionId}`,
            });
          }
        }
        for (const dispositionId of references.dispositionIds) {
          if (treatmentById.get(dispositionId)?.kind !== 'disposition') {
            issues.push({
              severity: 'error',
              code: 'INVALID_DIAGNOSIS_RULE_DISPOSITION_REF',
              message: `${rule.id}: ${dispositionId}`,
            });
          }
        }
      }
      const target = rule.target;
      const targetIsValid =
        (target.kind === 'medication' && medicationIds.has(target.id)) ||
        (target.kind === 'medication_tag' && medicationTagIds.has(target.id)) ||
        (target.kind === 'information_action' && informationActionIds.has(target.id)) ||
        (target.kind === 'intervention' &&
          treatmentById.get(target.id)?.kind === 'nonmedication') ||
        (target.kind === 'disposition' && treatmentById.get(target.id)?.kind === 'disposition');
      if (!targetIsValid) {
        issues.push({
          severity: 'error',
          code: 'INVALID_DIAGNOSIS_RULE_TARGET',
          message: `${rule.id}: ${target.kind}/${target.id}`,
        });
      }
    }
  }

  const purchaseDefinitions = getPurchasableUpgradeDefinitions(catalogs);
  for (const duplicate of duplicateIds(purchaseDefinitions.map((item) => item.id))) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_PURCHASE_ID',
      message: duplicate,
    });
  }
  const upgradeIds = new Set(purchaseDefinitions.map((upgrade) => upgrade.id));
  const locationIds = new Set(catalogs.locations.map((location) => location.id));
  for (const facility of catalogs.facilities) {
    for (const locationId of facility.locationIds) {
      const location = catalogs.locations.find((candidate) => candidate.id === locationId);
      if (!locationIds.has(locationId) || location?.facilityTier !== facility.tier) {
        issues.push({
          severity: 'error',
          code: 'INVALID_FACILITY_LOCATION_REF',
          message: `${facility.id} references ${locationId}`,
        });
      }
    }
  }
  for (const facility of catalogs.facilities) {
    for (const upgradeId of facility.allowedUpgradeIds) {
      if (!upgradeIds.has(upgradeId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_FACILITY_UPGRADE_REF',
          message: `${facility.id} references ${upgradeId}`,
        });
      }
    }
  }
  for (const upgrade of purchaseDefinitions) {
    if ((upgrade.kind === 'staff') !== (upgrade.staffAutomation !== undefined)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_STAFF_UPGRADE_SHAPE',
        message: `${upgrade.id} has inconsistent staff automation metadata.`,
      });
    }
    if (
      upgrade.staffAutomation &&
      (duplicateIds(upgrade.staffAutomation.eligibleInformationActionIds).length > 0 ||
        upgrade.staffAutomation.maximumAutomaticActions >
          upgrade.staffAutomation.eligibleInformationActionIds.length)
    ) {
      issues.push({
        severity: 'error',
        code: 'INVALID_STAFF_AUTOMATION_LIMIT',
        message: upgrade.id,
      });
    }
    if (upgrade.purchaseCost <= 0) {
      issues.push({
        severity: 'error',
        code: 'INVALID_UPGRADE_COST',
        message: upgrade.id,
      });
    }
    for (const prerequisiteId of upgrade.prerequisiteUpgradeIds) {
      if (!upgradeIds.has(prerequisiteId) || prerequisiteId === upgrade.id) {
        issues.push({
          severity: 'error',
          code: 'INVALID_UPGRADE_PREREQUISITE',
          message: `${upgrade.id} references ${prerequisiteId}`,
        });
      }
    }
    for (const serviceId of upgrade.serviceIds) {
      if (!serviceIds.has(serviceId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_UPGRADE_SERVICE_REF',
          message: `${upgrade.id} references ${serviceId}`,
        });
      }
    }
    for (const formularyId of upgrade.grantsFormularyIds) {
      if (!formularyIds.has(formularyId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_UPGRADE_FORMULARY_REF',
          message: `${upgrade.id} references ${formularyId}`,
        });
      }
    }
    if (upgrade.kind === 'equipment') {
      if (upgrade.serviceIds.length === 0 || upgrade.inHousePerUseCost === undefined) {
        issues.push({
          severity: 'error',
          code: 'INCOMPLETE_EQUIPMENT_UPGRADE',
          message: upgrade.id,
        });
      }
      for (const serviceId of upgrade.serviceIds) {
        const service = catalogs.services.find((candidate) => candidate.id === serviceId);
        const matchingMethod = service?.fulfillmentMethods.find(
          (method) =>
            method.kind === 'in_house' &&
            method.operatingCost === upgrade.inHousePerUseCost &&
            method.requiredCapabilities.every((capability) =>
              upgrade.grantsCapabilities.includes(capability),
            ),
        );
        if (!matchingMethod) {
          issues.push({
            severity: 'error',
            code: 'EQUIPMENT_SERVICE_METHOD_MISMATCH',
            message: `${upgrade.id} does not match an in-house method for ${serviceId}`,
          });
        }
      }
    }
    if (upgrade.kind === 'staff' && upgrade.staffAutomation) {
      for (const actionId of upgrade.staffAutomation.eligibleInformationActionIds) {
        const action = catalogs.informationActions.find((candidate) => candidate.id === actionId);
        const service = action
          ? catalogs.services.find((candidate) => candidate.id === action.serviceId)
          : undefined;
        const delegatedMethod = service?.fulfillmentMethods.find(
          (method) => method.requiredStaffUpgradeId === upgrade.id,
        );
        const ordinaryCost = service?.fulfillmentMethods
          .filter((method) => method.requiredStaffUpgradeId === undefined)
          .reduce<
            number | null
          >((lowest, method) => (lowest === null ? method.operatingCost : Math.min(lowest, method.operatingCost)), null);
        if (
          !action ||
          !service ||
          !delegatedMethod ||
          delegatedMethod.operatingCost <= 0 ||
          ordinaryCost === null ||
          ordinaryCost === undefined ||
          delegatedMethod.operatingCost >= ordinaryCost
        ) {
          issues.push({
            severity: 'error',
            code: 'INVALID_STAFF_AUTOMATION_ACTION',
            message: `${upgrade.id} cannot delegate ${actionId} at a nonzero discounted cost.`,
          });
        }
      }
    }
    if (upgrade.kind === 'formulary' && upgrade.grantsFormularyIds.length === 0) {
      issues.push({
        severity: 'error',
        code: 'FORMULARY_UPGRADE_WITHOUT_FORMULARY',
        message: upgrade.id,
      });
    }
    if (upgrade.kind === 'facility') {
      const target = upgrade.targetFacilityId
        ? catalogs.facilities.find((facility) => facility.id === upgrade.targetFacilityId)
        : undefined;
      if (!target || target.minimumLifetimePoints !== upgrade.minimumLifetimePoints) {
        issues.push({
          severity: 'error',
          code: 'INVALID_FACILITY_UPGRADE_TARGET',
          message: upgrade.id,
        });
      }
    }
    if (
      upgrade.kind === 'decor' &&
      (upgrade.satisfactionPoints === undefined ||
        upgrade.satisfactionPoints <= 0 ||
        !upgrade.displaySlotType ||
        !upgrade.visualToken)
    ) {
      issues.push({
        severity: 'error',
        code: 'INCOMPLETE_DECOR_UPGRADE',
        message: upgrade.id,
      });
    }
  }
  for (const duplicate of duplicateIds(
    catalogs.services.flatMap((service) => service.fulfillmentMethods.map((method) => method.id)),
  )) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_SERVICE_FULFILLMENT_METHOD_ID',
      message: duplicate,
    });
  }
  for (const service of catalogs.services) {
    for (const method of service.fulfillmentMethods) {
      if (
        duplicateIds(method.requiredCapabilities).length > 0 ||
        (method.allowedLocationIds && duplicateIds(method.allowedLocationIds).length > 0)
      ) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_SERVICE_METHOD_REQUIREMENT',
          message: `${service.id}/${method.id}`,
        });
      }
      for (const allowedLocationId of method.allowedLocationIds ?? []) {
        if (!locationIds.has(allowedLocationId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_SERVICE_LOCATION_REF',
            message: `${service.id}/${method.id} references ${allowedLocationId}.`,
          });
        }
      }
      if (!method.requiredStaffUpgradeId) continue;
      const staffUpgrade = catalogs.upgrades.find(
        (upgrade) => upgrade.id === method.requiredStaffUpgradeId,
      );
      if (!staffUpgrade || staffUpgrade.kind !== 'staff' || !staffUpgrade.staffAutomation) {
        issues.push({
          severity: 'error',
          code: 'INVALID_SERVICE_STAFF_REF',
          message: `${service.id}/${method.id} references ${method.requiredStaffUpgradeId}.`,
        });
      }
    }
  }
  const modifierIds = catalogs.medications.flatMap((medication) => [
    ...medication.fitModifiers.map((modifier) => modifier.id),
    ...medication.authorOverrides.map((modifier) => modifier.id),
  ]);
  for (const duplicate of duplicateIds(modifierIds)) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_MEDICATION_MODIFIER_ID',
      message: duplicate,
    });
  }
  for (const medication of catalogs.medications) {
    const medicationSourceUseNoteIds = new Set(medication.sourceUseNotes.map((note) => note.id));
    validateCombinationRulePriorities(
      medication.fitModifiers,
      issues,
      `${medication.id}.fitModifiers`,
    );
    for (const note of medication.sourceUseNotes) {
      for (const sourceId of note.evidenceSourceIds) {
        if (!evidenceSourceIds.has(sourceId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_MEDICATION_EVIDENCE_SOURCE_REF',
            message: `${medication.id}: ${note.id} references ${sourceId}`,
          });
        }
      }
      for (const targetContentId of note.targetContentIds) {
        if (!evidenceTargetContentIds.has(targetContentId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_MEDICATION_EVIDENCE_TARGET',
            message: `${medication.id}: ${note.id} targets ${targetContentId}`,
          });
        }
      }
    }
    for (const modifier of [...medication.fitModifiers, ...medication.authorOverrides]) {
      for (const sourceUseNoteId of modifier.sourceUseNoteIds) {
        if (!medicationSourceUseNoteIds.has(sourceUseNoteId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_MEDICATION_SOURCE_NOTE_REF',
            message: `${medication.id}: ${modifier.id} references ${sourceUseNoteId}`,
          });
        }
      }
      if (modifier.medicalReviewStatus === 'approved' && modifier.sourceUseNoteIds.length === 0) {
        issues.push({
          severity: 'error',
          code: 'UNSOURCED_APPROVED_MEDICATION_MODIFIER',
          message: `${medication.id}: ${modifier.id}`,
        });
      }
    }
  }
  for (const action of catalogs.informationActions) {
    if (!serviceIds.has(action.serviceId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_SERVICE_REF',
        message: `${action.id} references ${action.serviceId}`,
      });
    }
    const expectedSection = action.category === 'history' ? 'subjective' : 'objective';
    const recordReviewException =
      action.resultSource === 'record_review' && action.soapSection === 'objective';
    if (action.soapSection !== expectedSection && !recordReviewException) {
      issues.push({
        severity: 'error',
        code: 'SOAP_SECTION_MISMATCH',
        message: `${action.id} is ${action.category} but marked ${action.soapSection}.`,
      });
    }
    if (action.category === 'labs' && action.resultSource !== 'laboratory') {
      issues.push({
        severity: 'error',
        code: 'RESULT_SOURCE_MISMATCH',
        message: `${action.id} must use a laboratory result source.`,
      });
    }
    if (action.category === 'imaging' && action.resultSource !== 'diagnostic_study') {
      issues.push({
        severity: 'error',
        code: 'RESULT_SOURCE_MISMATCH',
        message: `${action.id} must use a diagnostic-study result source.`,
      });
    }
  }
  const informationActions = new Map(
    catalogs.informationActions.map((action) => [action.id, action]),
  );
  const testActionIds = new Set(catalogs.tests.map((test) => test.actionId));
  const referenceIntervalSetIds = new Set(
    catalogs.referenceIntervalSets.map((intervalSet) => intervalSet.id),
  );
  for (const intervalSet of catalogs.referenceIntervalSets) {
    if (intervalSet.sourceUrls.length === 0) {
      issues.push({
        severity: 'error',
        code: 'REFERENCE_INTERVAL_SET_WITHOUT_POLICY_SOURCE',
        message: intervalSet.id,
      });
    }
    if (
      intervalSet.medicalReviewStatus === 'approved' &&
      intervalSet.numericRangeAuthority === 'prototype_unreviewed'
    ) {
      issues.push({
        severity: 'error',
        code: 'APPROVED_PROTOTYPE_REFERENCE_INTERVAL',
        message: intervalSet.id,
      });
    }
  }
  for (const action of catalogs.informationActions.filter(
    (candidate) => candidate.category === 'labs' || candidate.category === 'imaging',
  )) {
    if (!testActionIds.has(action.id)) {
      issues.push({
        severity: 'error',
        code: 'MISSING_TEST_DEFINITION',
        message: `${action.id} has no per-test definition.`,
      });
    }
  }
  for (const test of catalogs.tests) {
    const action = informationActions.get(test.actionId);
    const expectedCategory = test.category === 'laboratory' ? 'labs' : 'imaging';
    if (!action || action.category !== expectedCategory) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TEST_ACTION_REF',
        message: `${test.id} references ${test.actionId}`,
      });
    }
    if (test.medicalReviewStatus === 'approved' && test.sourceUseNoteIds.length === 0) {
      issues.push({
        severity: 'error',
        code: 'UNSOURCED_APPROVED_TEST_GENERATOR',
        message: test.id,
      });
    }
    if (test.generator.type !== 'numeric_panel') continue;
    if (
      !test.generator.profiles.some(
        (profile) =>
          profile.when.minimumAgeYears === undefined &&
          profile.when.maximumAgeYears === undefined &&
          profile.when.sexForReference === undefined &&
          profile.when.anyDiagnosisIds.length === 0 &&
          profile.when.allClinicalTagIds.length === 0,
      )
    ) {
      issues.push({
        severity: 'error',
        code: 'TEST_GENERATOR_WITHOUT_FALLBACK',
        message: `${test.id} has no context-independent fallback profile.`,
      });
    }
    for (const profile of test.generator.profiles) {
      for (const diagnosisId of profile.when.anyDiagnosisIds) {
        if (!diagnosisById.has(diagnosisId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_TEST_DIAGNOSIS_REF',
            message: `${test.id}/${profile.id}: ${diagnosisId}`,
          });
        }
      }
      if (!referenceIntervalSetIds.has(profile.referenceIntervalSetId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_REFERENCE_INTERVAL_SET_REF',
          message: `${test.id}/${profile.id}: ${profile.referenceIntervalSetId}`,
        });
      }
      for (const duplicate of duplicateIds(profile.components.map((component) => component.id))) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_TEST_COMPONENT_ID',
          message: `${test.id}/${profile.id}: ${duplicate}`,
        });
      }
      for (const component of profile.components) {
        const { referenceRange, normalGenerationRange } = component;
        if (
          normalGenerationRange.minimum < referenceRange.minimum ||
          normalGenerationRange.maximum > referenceRange.maximum
        ) {
          issues.push({
            severity: 'error',
            code: 'NORMAL_TEST_GENERATION_OUTSIDE_REFERENCE',
            message: `${test.id}/${profile.id}: ${component.id}`,
          });
        }
        const referenceWidth = referenceRange.maximum - referenceRange.minimum;
        for (const range of component.mildAbnormalRanges) {
          const correctlyOutside =
            range.flag === 'low'
              ? range.maximum < referenceRange.minimum
              : range.minimum > referenceRange.maximum;
          const maximumDeviation =
            range.flag === 'low'
              ? referenceRange.minimum - range.minimum
              : range.maximum - referenceRange.maximum;
          if (
            !correctlyOutside ||
            referenceWidth <= 0 ||
            maximumDeviation > referenceWidth * 0.25
          ) {
            issues.push({
              severity: 'error',
              code: 'INCIDENTAL_TEST_RANGE_NOT_MILD',
              message: `${test.id}/${profile.id}: ${component.id} ${range.flag}`,
            });
          }
        }
      }
    }
  }
  return { valid: issues.length === 0, issues };
};

export const validateContentRegistry = (
  registry: ContentRegistry,
  catalogs: CatalogBundle,
  blueprints: readonly CaseBlueprint[],
): ContentValidationReport => {
  const issues: ValidationIssue[] = [];
  for (const duplicate of duplicateIds(registry.entries.map((entry) => entry.id))) {
    issues.push({ severity: 'error', code: 'DUPLICATE_REGISTRY_ID', message: duplicate });
  }
  for (const duplicate of duplicateIds(registry.entries.map((entry) => entry.path))) {
    issues.push({ severity: 'error', code: 'DUPLICATE_REGISTRY_PATH', message: duplicate });
  }
  const registryIds = new Set(registry.entries.map((entry) => entry.id));
  for (const entry of registry.entries) {
    for (const dependencyId of entry.dependsOnIds) {
      if (!registryIds.has(dependencyId) || dependencyId === entry.id) {
        issues.push({
          severity: 'error',
          code: 'INVALID_REGISTRY_DEPENDENCY',
          message: `${entry.id} depends on ${dependencyId}`,
        });
      }
    }
  }
  const registeredMedicationIds = new Set(
    registry.entries.filter((entry) => entry.kind === 'medication').map((entry) => entry.id),
  );
  const registeredPatientIds = new Set(
    registry.entries.filter((entry) => entry.kind === 'patient').map((entry) => entry.id),
  );
  const registeredEvidenceSourceIds = new Set(
    registry.entries.filter((entry) => entry.kind === 'evidence_source').map((entry) => entry.id),
  );
  const diagnosisCatalogEntries = registry.entries.filter(
    (entry) => entry.kind === 'diagnosis_catalog',
  );
  if (
    diagnosisCatalogEntries.length !== 1 ||
    diagnosisCatalogEntries[0]?.runtimeIncluded !== true
  ) {
    issues.push({
      severity: 'error',
      code: 'INVALID_DIAGNOSIS_CATALOG_REGISTRATION',
      message: 'Exactly one runtime diagnosis catalog must be registered.',
    });
  }
  const findingCatalogEntries = registry.entries.filter(
    (entry) => entry.kind === 'finding_catalog',
  );
  if (findingCatalogEntries.length !== 1 || findingCatalogEntries[0]?.runtimeIncluded !== true) {
    issues.push({
      severity: 'error',
      code: 'INVALID_FINDING_CATALOG_REGISTRATION',
      message: 'Exactly one runtime finding catalog must be registered.',
    });
  } else {
    const registeredFindingIds = findingCatalogEntries[0].categoryIds;
    const expectedFindingIds = catalogs.findings.map((finding) => finding.id);
    const registeredSorted = [...registeredFindingIds].sort();
    const expectedSorted = [...expectedFindingIds].sort();
    if (
      new Set(registeredFindingIds).size !== registeredFindingIds.length ||
      registeredSorted.length !== expectedSorted.length ||
      registeredSorted.some((id, index) => id !== expectedSorted[index])
    ) {
      issues.push({
        severity: 'error',
        code: 'FINDING_CATALOG_MEMBERSHIP_MISMATCH',
        message: 'The runtime finding catalog registry membership must exactly match the catalog.',
      });
    }
  }
  const treatmentCatalogEntries = registry.entries.filter(
    (entry) => entry.kind === 'treatment_catalog',
  );
  if (
    treatmentCatalogEntries.length !== 1 ||
    treatmentCatalogEntries[0]?.runtimeIncluded !== true
  ) {
    issues.push({
      severity: 'error',
      code: 'INVALID_TREATMENT_CATALOG_REGISTRATION',
      message: 'Exactly one runtime treatment catalog must be registered.',
    });
  } else {
    const registeredTreatmentIds = treatmentCatalogEntries[0].categoryIds;
    const expectedTreatmentIds = catalogs.treatments.map((treatment) => treatment.id);
    const registeredSorted = [...registeredTreatmentIds].sort();
    const expectedSorted = [...expectedTreatmentIds].sort();
    if (
      new Set(registeredTreatmentIds).size !== registeredTreatmentIds.length ||
      registeredSorted.length !== expectedSorted.length ||
      registeredSorted.some((id, index) => id !== expectedSorted[index])
    ) {
      issues.push({
        severity: 'error',
        code: 'TREATMENT_CATALOG_MEMBERSHIP_MISMATCH',
        message:
          'The runtime treatment catalog registry membership must exactly match the catalog.',
      });
    }
  }
  const medicationIdentityCatalogEntries = registry.entries.filter(
    (entry) => entry.kind === 'medication_identity_catalog',
  );
  if (
    medicationIdentityCatalogEntries.length !== 1 ||
    medicationIdentityCatalogEntries[0]?.runtimeIncluded !== true
  ) {
    issues.push({
      severity: 'error',
      code: 'INVALID_MEDICATION_IDENTITY_CATALOG_REGISTRATION',
      message: 'Exactly one runtime medication identity catalog must be registered.',
    });
  }
  for (const source of catalogs.evidenceSources) {
    if (!registeredEvidenceSourceIds.has(source.id)) {
      issues.push({
        severity: 'error',
        code: 'UNREGISTERED_EVIDENCE_SOURCE',
        message: source.id,
      });
    }
  }
  for (const medication of catalogs.medications) {
    if (!registeredMedicationIds.has(medication.id)) {
      issues.push({
        severity: 'error',
        code: 'UNREGISTERED_MEDICATION',
        message: medication.id,
      });
    }
  }
  for (const blueprint of blueprints) {
    if (!registeredPatientIds.has(blueprint.id)) {
      issues.push({
        severity: 'error',
        code: 'UNREGISTERED_PATIENT',
        message: blueprint.id,
      });
    }
  }
  for (const entry of registry.entries.filter((item) => item.runtimeIncluded)) {
    if (
      entry.kind === 'evidence_source' &&
      !catalogs.evidenceSources.some((item) => item.id === entry.id)
    ) {
      issues.push({
        severity: 'error',
        code: 'STALE_REGISTRY_EVIDENCE_SOURCE',
        message: entry.id,
      });
    }
    if (entry.kind === 'medication' && !catalogs.medications.some((item) => item.id === entry.id)) {
      issues.push({
        severity: 'error',
        code: 'STALE_REGISTRY_MEDICATION',
        message: entry.id,
      });
    }
    if (entry.kind === 'patient' && !blueprints.some((item) => item.id === entry.id)) {
      issues.push({
        severity: 'error',
        code: 'STALE_REGISTRY_PATIENT',
        message: entry.id,
      });
    }
  }
  return { valid: issues.length === 0, issues };
};

export const validateMedicationIdentities = (
  identities: readonly MedicationIdentityDefinition[],
  catalogs: CatalogBundle,
): ContentValidationReport => {
  const issues: ValidationIssue[] = [];
  for (const duplicate of duplicateIds(identities.map((identity) => identity.id))) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_MEDICATION_IDENTITY_ID',
      message: duplicate,
    });
  }
  for (const duplicate of duplicateIds(identities.map((identity) => identity.rxnorm.rxcui))) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_MEDICATION_IDENTITY_RXCUI',
      message: duplicate,
    });
  }

  const normalizedTermOwners = new Map<string, string>();
  for (const identity of identities) {
    for (const term of [identity.normalizedIngredientName, ...identity.aliases]) {
      const normalized = term.normalize('NFKC').toLocaleLowerCase('en-US');
      const previousOwner = normalizedTermOwners.get(normalized);
      if (previousOwner && previousOwner !== identity.id) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_MEDICATION_IDENTITY_TERM',
          message: `${term}: ${previousOwner}, ${identity.id}`,
        });
      } else {
        normalizedTermOwners.set(normalized, identity.id);
      }
    }
  }

  const runtimeById = new Map(
    catalogs.medications.map((medication) => [medication.id, medication]),
  );
  const compatibleIdentityById = new Map(
    identities
      .filter((identity) => identity.authoringStatus === 'runtime_compatibility')
      .map((identity) => [identity.id, identity]),
  );
  const formularyMedicationIds = new Set(
    catalogs.formularies.flatMap((formulary) => formulary.medicationIds),
  );
  const evidenceSourceById = new Map(catalogs.evidenceSources.map((source) => [source.id, source]));

  for (const medication of catalogs.medications) {
    if (!compatibleIdentityById.has(medication.id)) {
      issues.push({
        severity: 'error',
        code: 'MISSING_RUNTIME_MEDICATION_IDENTITY',
        message: medication.id,
      });
    }
  }
  for (const identity of identities) {
    const runtimeMedication = runtimeById.get(identity.id);
    if (identity.authoringStatus === 'runtime_compatibility') {
      if (!runtimeMedication) {
        issues.push({
          severity: 'error',
          code: 'MISSING_RUNTIME_MEDICATION_DEFINITION',
          message: identity.id,
        });
      } else if (runtimeMedication.label !== identity.label) {
        issues.push({
          severity: 'error',
          code: 'MEDICATION_IDENTITY_LABEL_MISMATCH',
          message: `${identity.id}: ${identity.label} != ${runtimeMedication.label}`,
        });
      }
    } else if (runtimeMedication || formularyMedicationIds.has(identity.id)) {
      issues.push({
        severity: 'error',
        code: 'IDENTITY_ONLY_MEDICATION_LEAKED_TO_GAMEPLAY',
        message: identity.id,
      });
    }

    const evidenceSource = evidenceSourceById.get(identity.rxnorm.evidenceSourceId);
    if (!evidenceSource) {
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_MEDICATION_IDENTITY_EVIDENCE_SOURCE',
        message: `${identity.id}: ${identity.rxnorm.evidenceSourceId}`,
      });
    } else {
      if (evidenceSource.sourceType !== 'structured_database') {
        issues.push({
          severity: 'error',
          code: 'INVALID_MEDICATION_IDENTITY_EVIDENCE_TYPE',
          message: `${identity.id}: ${evidenceSource.id}`,
        });
      }
      if (evidenceSource.publicationDate !== identity.rxnorm.releaseDate) {
        issues.push({
          severity: 'error',
          code: 'MEDICATION_IDENTITY_RELEASE_MISMATCH',
          message: `${identity.id}: ${identity.rxnorm.releaseDate} != ${evidenceSource.publicationDate}`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
};

export const validateSupplementIdentities = (
  identities: readonly SupplementIdentityDefinition[],
  evidenceSources: readonly EvidenceSourceDefinition[],
  reservedIdentityIds: readonly string[] = [],
): ContentValidationReport => {
  const issues: ValidationIssue[] = [];
  for (const duplicate of duplicateIds(identities.map((identity) => identity.id))) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_SUPPLEMENT_IDENTITY_ID',
      message: duplicate,
    });
  }
  const reservedIds = new Set(reservedIdentityIds);
  const evidenceById = new Map(evidenceSources.map((source) => [source.id, source]));
  const normalizedTermOwners = new Map<string, string>();
  for (const identity of identities) {
    if (reservedIds.has(identity.id)) {
      issues.push({
        severity: 'error',
        code: 'SUPPLEMENT_IDENTITY_ID_COLLISION',
        message: identity.id,
      });
    }
    for (const term of [identity.normalizedName, ...identity.aliases]) {
      const normalized = term.normalize('NFKC').toLocaleLowerCase('en-US');
      const priorOwner = normalizedTermOwners.get(normalized);
      if (priorOwner && priorOwner !== identity.id) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_SUPPLEMENT_IDENTITY_TERM',
          message: `${term}: ${priorOwner}, ${identity.id}`,
        });
      } else {
        normalizedTermOwners.set(normalized, identity.id);
      }
    }
    for (const identifier of identity.identifiers) {
      const evidence = evidenceById.get(identifier.evidenceSourceId);
      if (!evidence) {
        issues.push({
          severity: 'error',
          code: 'UNKNOWN_SUPPLEMENT_IDENTITY_EVIDENCE_SOURCE',
          message: `${identity.id}: ${identifier.evidenceSourceId}`,
        });
      } else if (
        (identifier.system === 'rxnorm' && evidence.sourceType !== 'structured_database') ||
        (identifier.system !== 'rxnorm' && evidence.sourceType !== 'classification_standard')
      ) {
        issues.push({
          severity: 'error',
          code: 'INVALID_SUPPLEMENT_IDENTITY_EVIDENCE_TYPE',
          message: `${identity.id}: ${identifier.system} via ${identifier.evidenceSourceId}`,
        });
      }
    }
  }
  return { valid: issues.length === 0, issues };
};
