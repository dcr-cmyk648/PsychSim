import type {
  CaseBlueprint,
  CatalogBundle,
  ClinicalRuleReview,
  ClinicState,
  ScorePredicate,
  TreatmentGrade,
} from '@psychsim/schemas';
import { extractPredicateReferences, resolveServiceFulfillment } from '@psychsim/engine';

export interface AuditReviewState {
  status: ClinicalRuleReview['status'];
  sourceUseNoteIds: readonly string[];
}

export interface InvestigationRuleAudit {
  id: string;
  label: string;
  importance: 'essential' | 'high_yield' | 'optional';
  requiredByDefault: boolean;
  condition: string;
  actionIds: readonly string[];
  actionLabels: readonly string[];
  categoryLabels: readonly string[];
  fulfillment: ReadonlyArray<{
    actionId: string;
    methodLabel: string;
    methodKind: string;
    operatingCost: number;
  }>;
  pointsIfObtained: number;
  pointsIfOmitted: number;
  conditionalEffects: ReadonlyArray<{
    pathwayId: string;
    pathwayLabel: string;
    pointsIfMet: number;
    pointsIfMissing: number;
    safetyCritical: boolean;
  }>;
  review: AuditReviewState;
  relatedContentIds: readonly string[];
}

export interface TreatmentGradeAudit {
  id: string;
  label: string;
  grade: TreatmentGrade;
  baseCarePoints: number;
  condition: string;
  explanation: string;
  review: AuditReviewState;
  relatedContentIds: readonly string[];
}

export interface TreatmentWorkupRequirementAudit {
  id: string;
  objectiveId: string;
  objectiveLabel: string;
  condition: string;
  pointsIfMet: number;
  pointsIfMissing: number;
  safetyCritical: boolean;
  concernLevel: string;
  certaintyLevel: string;
  sourceRuleIds: readonly string[];
  review: AuditReviewState;
  relatedContentIds: readonly string[];
}

export interface MedicationFitAudit {
  id: string;
  medicationId: string;
  medicationLabel: string;
  effect: 'bonus' | 'penalty' | 'contraindication';
  pointDelta: number;
  patientTagIds: readonly string[];
  appliesToCurrentPatient: boolean;
  explanation: string;
  review: AuditReviewState;
  relatedContentIds: readonly string[];
}

export interface TreatmentPathwayAudit {
  id: string;
  label: string;
  grade: TreatmentGrade;
  accepted: boolean;
  condition: string;
  requiredWorkups: ReadonlyArray<{ id: string; label: string }>;
  conditionalRequirements: ReadonlyArray<{
    objectiveId: string;
    objectiveLabel: string;
    pointsIfMet: number;
    pointsIfMissing: number;
    safetyCritical: boolean;
  }>;
  workupCostPar: number;
  explanation: string;
  review: AuditReviewState;
  relatedContentIds: readonly string[];
}

export interface ScoreRuleAudit {
  id: string;
  label: string;
  component: string;
  condition: string;
  pointsIfTrue: number;
  pointsIfFalse: number;
  classificationIfTrue: string;
  classificationIfFalse: string;
  safetyErrorIfTrue: string | null;
  safetyErrorIfFalse: string | null;
  carePointCapIfTrue: number | null;
  carePointCapIfFalse: number | null;
  review: AuditReviewState;
  relatedContentIds: readonly string[];
}

export interface CriticalRuleAudit {
  id: string;
  label: string;
  consequence: string;
  relatedContentIds: readonly string[];
}

export interface CaseRuleAudit {
  blueprintId: string;
  contentVersion: string;
  caseLabel: string;
  databasePlan: {
    carePoints: number;
    workupCostPar: number;
    baseReimbursement: number;
    complexityBonus: number;
    challengeBonus: number;
  };
  investigations: readonly InvestigationRuleAudit[];
  treatmentWorkupRequirements: readonly TreatmentWorkupRequirementAudit[];
  treatmentGrades: readonly TreatmentGradeAudit[];
  medicationFitModifiers: readonly MedicationFitAudit[];
  treatmentPathways: readonly TreatmentPathwayAudit[];
  scoreRules: readonly ScoreRuleAudit[];
  criticalRules: readonly CriticalRuleAudit[];
  availableTreatments: {
    startMedications: readonly string[];
    stopMedications: readonly string[];
    continueMedications: readonly string[];
    interventions: readonly string[];
    dispositions: readonly string[];
  };
  referenceSolutions: ReadonlyArray<{
    id: string;
    label: string;
    kind: string;
    actionCount: number;
    treatmentSummary: string;
  }>;
}

export interface FocusedCaseRuleAudit {
  mode: 'targeted' | 'complete';
  investigations: readonly InvestigationRuleAudit[];
  treatmentWorkupRequirements: readonly TreatmentWorkupRequirementAudit[];
  treatmentGrades: readonly TreatmentGradeAudit[];
  medicationFitModifiers: readonly MedicationFitAudit[];
  treatmentPathways: readonly TreatmentPathwayAudit[];
  scoreRules: readonly ScoreRuleAudit[];
  criticalRules: readonly CriticalRuleAudit[];
}

const unique = (values: readonly string[]): string[] => [...new Set(values)].sort();

const reviewState = (
  review: ClinicalRuleReview,
  additionalSourceUseNoteIds: readonly string[] = [],
): AuditReviewState => ({
  status: review.status,
  sourceUseNoteIds: unique([...review.sourceUseNoteIds, ...additionalSourceUseNoteIds]),
});

const predicateReferenceIds = (predicate: ScorePredicate): string[] => {
  const refs = extractPredicateReferences(predicate);
  return unique([
    ...refs.actionIds,
    ...refs.factIds,
    ...refs.medicationIds,
    ...refs.medicationTagIds,
    ...refs.interventionIds,
    ...refs.dispositionIds,
    ...refs.capabilityIds,
  ]);
};

const createLabelResolver = (catalogs: CatalogBundle) => {
  const labels = new Map<string, string>();
  for (const item of [
    ...catalogs.informationActions,
    ...catalogs.diagnoses,
    ...catalogs.medications,
    ...catalogs.treatments,
    ...catalogs.services,
    ...catalogs.tests,
  ]) {
    labels.set(item.id, item.label);
  }
  return (id: string): string => labels.get(id) ?? id;
};

export const describeScorePredicate = (
  predicate: ScorePredicate,
  catalogs: CatalogBundle,
): string => {
  const label = createLabelResolver(catalogs);
  const visit = (node: ScorePredicate): string => {
    switch (node.type) {
      case 'actionPurchased':
        return `purchase ${label(node.actionId)}`;
      case 'factKnown':
        return `know ${label(node.factId)}`;
      case 'anyMedicationStarted':
        return 'start any medication';
      case 'treatmentStarted':
        return `start ${label(node.medicationId)}`;
      case 'treatmentStartedWithTag':
        return `start ${node.minimumCount}–${node.maximumCount} medication(s) tagged ${node.medicationTagId}`;
      case 'treatmentStopped':
        return `stop ${label(node.medicationId)}`;
      case 'treatmentContinued':
        return `continue ${label(node.medicationId)}`;
      case 'interventionSelected':
        return `select ${label(node.interventionId)}`;
      case 'dispositionSelected':
        return `select ${label(node.dispositionId)}`;
      case 'serviceCapabilityAvailable':
        return `have capability ${node.capabilityId}`;
      case 'any':
        return `ANY(${node.predicates.map(visit).join('; ')})`;
      case 'all':
        return `ALL(${node.predicates.map(visit).join('; ')})`;
      case 'not':
        return `NOT(${visit(node.predicate)})`;
    }
  };
  return visit(predicate);
};

const treatmentSelectionSummary = (
  blueprint: CaseBlueprint,
  catalogs: CatalogBundle,
  referenceId: string,
): string => {
  const reference = blueprint.referenceSolutions.find((candidate) => candidate.id === referenceId);
  if (!reference) return '';
  const label = createLabelResolver(catalogs);
  const selections = [
    ...reference.diagnosisSelections.map((selection) => `diagnose ${label(selection.diagnosisId)}`),
    ...reference.selections.startMedicationIds.map((id) => `start ${label(id)}`),
    ...reference.selections.stopMedicationIds.map((id) => `stop ${label(id)}`),
    ...reference.selections.continueMedicationIds.map((id) => `continue ${label(id)}`),
    ...reference.selections.interventionIds.map((id) => label(id)),
    ...(reference.selections.dispositionId ? [label(reference.selections.dispositionId)] : []),
  ];
  return selections.join(' · ');
};

export const buildCaseRuleAudit = (
  blueprint: CaseBlueprint,
  catalogs: CatalogBundle,
  clinic: ClinicState,
): CaseRuleAudit => {
  const label = createLabelResolver(catalogs);
  const locationId = blueprint.metadata.compatibleLocationIds[0] ?? clinic.activeLocationId;
  const objectivesById = new Map(
    blueprint.workupObjectives.map((objective) => [objective.id, objective]),
  );

  const investigations = blueprint.workupObjectives.map<InvestigationRuleAudit>((objective) => {
    const refs = extractPredicateReferences(objective.satisfaction);
    const actionDefinitions = refs.actionIds.flatMap((actionId) => {
      const action = catalogs.informationActions.find((candidate) => candidate.id === actionId);
      return action ? [action] : [];
    });
    const fulfillment = actionDefinitions.flatMap((action) => {
      const resolved = resolveServiceFulfillment(
        action.serviceId,
        clinic,
        locationId,
        catalogs.services,
        catalogs.locations,
      );
      return resolved.ok
        ? [
            {
              actionId: action.id,
              methodLabel: resolved.value.method.label,
              methodKind: resolved.value.method.kind,
              operatingCost: resolved.value.method.operatingCost,
            },
          ]
        : [];
    });
    const conditionalEffects = blueprint.treatmentPathways.flatMap((pathway) =>
      pathway.conditionalRequirements
        .filter((requirement) => requirement.objectiveId === objective.id)
        .map((requirement) => ({
          pathwayId: pathway.id,
          pathwayLabel: pathway.label,
          pointsIfMet: requirement.pointsIfMet,
          pointsIfMissing: requirement.pointsIfMissing,
          safetyCritical: requirement.safetyCritical,
        })),
    );
    return {
      id: objective.id,
      label: objective.label,
      importance: objective.importance,
      requiredByDefault: objective.requiredByDefault,
      condition: describeScorePredicate(objective.satisfaction, catalogs),
      actionIds: [...refs.actionIds],
      actionLabels: actionDefinitions.map((action) => action.label),
      categoryLabels: unique(actionDefinitions.map((action) => action.category)),
      fulfillment,
      pointsIfObtained: objective.points,
      pointsIfOmitted: objective.omissionPenalty,
      conditionalEffects,
      review: reviewState(objective.review),
      relatedContentIds: unique([
        objective.id,
        ...predicateReferenceIds(objective.satisfaction),
        ...objective.review.sourceUseNoteIds,
        ...conditionalEffects.map((effect) => effect.pathwayId),
      ]),
    };
  });

  const treatmentGrades = blueprint.treatmentGrades.map<TreatmentGradeAudit>((grade) => ({
    id: grade.id,
    label: grade.label,
    grade: grade.grade,
    baseCarePoints: grade.baseCarePoints,
    condition: describeScorePredicate(grade.predicate, catalogs),
    explanation: grade.explanation,
    review: reviewState(grade.review),
    relatedContentIds: unique([
      grade.id,
      ...predicateReferenceIds(grade.predicate),
      ...grade.review.sourceUseNoteIds,
    ]),
  }));

  const treatmentWorkupRequirements =
    blueprint.treatmentWorkupRequirements.map<TreatmentWorkupRequirementAudit>((requirement) => ({
      id: requirement.id,
      objectiveId: requirement.objectiveId,
      objectiveLabel: objectivesById.get(requirement.objectiveId)?.label ?? requirement.objectiveId,
      condition: describeScorePredicate(requirement.appliesWhen, catalogs),
      pointsIfMet: requirement.pointsIfMet,
      pointsIfMissing: requirement.pointsIfMissing,
      safetyCritical: requirement.safetyCritical,
      concernLevel: requirement.concernLevel,
      certaintyLevel: requirement.certaintyLevel,
      sourceRuleIds: [...requirement.sourceRuleIds],
      review: reviewState(requirement.review),
      relatedContentIds: unique([
        requirement.id,
        requirement.objectiveId,
        ...requirement.sourceRuleIds,
        ...predicateReferenceIds(requirement.appliesWhen),
        ...requirement.review.sourceUseNoteIds,
      ]),
    }));

  const availableMedicationIds = new Set(blueprint.availableTreatments.startMedicationIds);
  const patientTagIds = new Set(blueprint.patientRecord.clinicalTagIds);
  const medicationFitModifiers = catalogs.medications
    .filter((medication) => availableMedicationIds.has(medication.id))
    .flatMap<MedicationFitAudit>((medication) =>
      medication.fitModifiers.map((modifier) => ({
        id: modifier.id,
        medicationId: medication.id,
        medicationLabel: medication.label,
        effect: modifier.effect,
        pointDelta: modifier.pointDelta,
        patientTagIds: [...modifier.patientTagIds],
        appliesToCurrentPatient: modifier.patientTagIds.every((tag) => patientTagIds.has(tag)),
        explanation: modifier.explanation,
        review: reviewState(modifier.review, modifier.sourceUseNoteIds),
        relatedContentIds: unique([
          modifier.id,
          medication.id,
          ...modifier.patientTagIds,
          ...modifier.sourceUseNoteIds,
          ...modifier.review.sourceUseNoteIds,
        ]),
      })),
    );

  const treatmentPathways = blueprint.treatmentPathways.map<TreatmentPathwayAudit>((pathway) => ({
    id: pathway.id,
    label: pathway.label,
    grade: pathway.grade,
    accepted: pathway.accepted,
    condition: describeScorePredicate(pathway.match, catalogs),
    requiredWorkups: pathway.requiredWorkupObjectiveIds.map((objectiveId) => ({
      id: objectiveId,
      label: objectivesById.get(objectiveId)?.label ?? objectiveId,
    })),
    conditionalRequirements: pathway.conditionalRequirements.map((requirement) => ({
      objectiveId: requirement.objectiveId,
      objectiveLabel: objectivesById.get(requirement.objectiveId)?.label ?? requirement.objectiveId,
      pointsIfMet: requirement.pointsIfMet,
      pointsIfMissing: requirement.pointsIfMissing,
      safetyCritical: requirement.safetyCritical,
    })),
    workupCostPar: pathway.workupCostPar,
    explanation: pathway.explanation,
    review: reviewState(pathway.review),
    relatedContentIds: unique([
      pathway.id,
      ...predicateReferenceIds(pathway.match),
      ...pathway.requiredWorkupObjectiveIds,
      ...pathway.conditionalRequirements.map((requirement) => requirement.objectiveId),
      ...pathway.review.sourceUseNoteIds,
    ]),
  }));

  const scoreRules = blueprint.scoreRules.map<ScoreRuleAudit>((rule) => ({
    id: rule.id,
    label: rule.label,
    component: rule.component,
    condition: describeScorePredicate(rule.predicate, catalogs),
    pointsIfTrue: rule.pointsIfTrue,
    pointsIfFalse: rule.pointsIfFalse,
    classificationIfTrue: rule.classificationIfTrue,
    classificationIfFalse: rule.classificationIfFalse,
    safetyErrorIfTrue: rule.safetyErrorIfTrue ?? null,
    safetyErrorIfFalse: rule.safetyErrorIfFalse ?? null,
    carePointCapIfTrue: rule.carePointCapIfTrue ?? null,
    carePointCapIfFalse: rule.carePointCapIfFalse ?? null,
    review: reviewState(rule.review),
    relatedContentIds: unique([
      rule.id,
      ...predicateReferenceIds(rule.predicate),
      ...rule.review.sourceUseNoteIds,
    ]),
  }));

  const criticalRules: CriticalRuleAudit[] = [
    ...investigations
      .filter(
        (objective) =>
          (objective.requiredByDefault && objective.pointsIfOmitted < 0) ||
          objective.conditionalEffects.some((effect) => effect.safetyCritical),
      )
      .map((objective) => ({
        id: objective.id,
        label: objective.label,
        consequence: [
          objective.requiredByDefault && objective.pointsIfOmitted < 0
            ? `omission ${objective.pointsIfOmitted} points`
            : null,
          ...objective.conditionalEffects
            .filter((effect) => effect.safetyCritical)
            .map(
              (effect) =>
                `${effect.pathwayLabel}: ${effect.pointsIfMissing} if missing (safety-critical)`,
            ),
        ]
          .filter((value): value is string => Boolean(value))
          .join(' · '),
        relatedContentIds: objective.relatedContentIds,
      })),
    ...treatmentWorkupRequirements
      .filter((requirement) => requirement.safetyCritical)
      .map((requirement) => ({
        id: requirement.id,
        label: requirement.objectiveLabel,
        consequence: `${requirement.pointsIfMissing} if missing when ${requirement.condition} (safety-critical)`,
        relatedContentIds: requirement.relatedContentIds,
      })),
    ...scoreRules
      .filter(
        (rule) =>
          rule.safetyErrorIfTrue ||
          rule.safetyErrorIfFalse ||
          rule.carePointCapIfTrue !== null ||
          rule.carePointCapIfFalse !== null,
      )
      .map((rule) => ({
        id: rule.id,
        label: rule.label,
        consequence: [
          rule.safetyErrorIfTrue,
          rule.safetyErrorIfFalse,
          rule.carePointCapIfTrue === null
            ? null
            : `care-point cap ${rule.carePointCapIfTrue} when true`,
          rule.carePointCapIfFalse === null
            ? null
            : `care-point cap ${rule.carePointCapIfFalse} when false`,
          `true ${rule.pointsIfTrue >= 0 ? '+' : ''}${rule.pointsIfTrue}; false ${rule.pointsIfFalse >= 0 ? '+' : ''}${rule.pointsIfFalse}`,
        ]
          .filter((value): value is string => Boolean(value))
          .join(' · '),
        relatedContentIds: rule.relatedContentIds,
      })),
  ];

  const medicationLabels = (ids: readonly string[]): string[] => ids.map(label);
  return {
    blueprintId: blueprint.id,
    contentVersion: blueprint.contentVersion,
    caseLabel: blueprint.metadata.title,
    databasePlan: {
      carePoints: blueprint.scoring.databasePlanCarePoints,
      workupCostPar: blueprint.scoring.databasePlanWorkupCost,
      baseReimbursement: blueprint.economy.baseReimbursement,
      complexityBonus: blueprint.economy.complexityBonus,
      challengeBonus: blueprint.economy.challengeBonus,
    },
    investigations,
    treatmentWorkupRequirements,
    treatmentGrades,
    medicationFitModifiers,
    treatmentPathways,
    scoreRules,
    criticalRules,
    availableTreatments: {
      startMedications: medicationLabels(blueprint.availableTreatments.startMedicationIds),
      stopMedications: medicationLabels(blueprint.availableTreatments.stopMedicationIds),
      continueMedications: medicationLabels(blueprint.availableTreatments.continueMedicationIds),
      interventions: medicationLabels(blueprint.availableTreatments.interventionIds),
      dispositions: medicationLabels(blueprint.availableTreatments.dispositionIds),
    },
    referenceSolutions: blueprint.referenceSolutions.map((reference) => ({
      id: reference.id,
      label: reference.label,
      kind: reference.kind,
      actionCount: reference.actionIds.length,
      treatmentSummary: treatmentSelectionSummary(blueprint, catalogs, reference.id),
    })),
  };
};

const rowMatches = (
  relatedContentIds: readonly string[],
  targetIds: ReadonlySet<string>,
): boolean => relatedContentIds.some((id) => targetIds.has(id));

export const focusCaseRuleAudit = (
  audit: CaseRuleAudit,
  targetContentIds: readonly string[],
): FocusedCaseRuleAudit => {
  const targetIds = new Set(targetContentIds.filter((id) => id !== audit.blueprintId));
  const targeted = {
    investigations: audit.investigations.filter((row) =>
      rowMatches(row.relatedContentIds, targetIds),
    ),
    treatmentWorkupRequirements: audit.treatmentWorkupRequirements.filter((row) =>
      rowMatches(row.relatedContentIds, targetIds),
    ),
    treatmentGrades: audit.treatmentGrades.filter((row) =>
      rowMatches(row.relatedContentIds, targetIds),
    ),
    medicationFitModifiers: audit.medicationFitModifiers.filter((row) =>
      rowMatches(row.relatedContentIds, targetIds),
    ),
    treatmentPathways: audit.treatmentPathways.filter((row) =>
      rowMatches(row.relatedContentIds, targetIds),
    ),
    scoreRules: audit.scoreRules.filter((row) => rowMatches(row.relatedContentIds, targetIds)),
    criticalRules: audit.criticalRules.filter((row) =>
      rowMatches(row.relatedContentIds, targetIds),
    ),
  };
  const matchCount = Object.values(targeted).reduce((total, rows) => total + rows.length, 0);
  return matchCount > 0
    ? { mode: 'targeted', ...targeted }
    : {
        mode: 'complete',
        investigations: audit.investigations,
        treatmentWorkupRequirements: audit.treatmentWorkupRequirements,
        treatmentGrades: audit.treatmentGrades,
        medicationFitModifiers: audit.medicationFitModifiers,
        treatmentPathways: audit.treatmentPathways,
        scoreRules: audit.scoreRules,
        criticalRules: audit.criticalRules,
      };
};
