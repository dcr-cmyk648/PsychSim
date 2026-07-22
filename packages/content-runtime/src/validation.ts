import {
  CaseBlueprintSchema,
  type CaseBlueprint,
  type CatalogBundle,
  type ClinicState,
  type ContentRegistry,
  type ScorePredicate,
  type TreatmentSelection,
} from '@psychsim/schemas';
import {
  evaluateCaseEligibility,
  extractPredicateReferences,
  instantiateCase,
  resolveClinicForProgressionMode,
  resolveServiceFulfillment,
} from '@psychsim/engine';

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
        selection.minimumPresent < selection.requiredPresentIds.length ||
        selection.maximumPresent > variableFindingIds.size
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
  const ruleReviews = [
    patientRecord.treatmentReference.review,
    ...patientRecord.treatmentReference.acceptedMedicationTagSets.map((tagSet) => tagSet.review),
    ...blueprint.workupObjectives.map((objective) => objective.review),
    ...blueprint.treatmentGrades.map((grade) => grade.review),
    ...blueprint.treatmentPathways.flatMap((pathway) => [
      pathway.review,
      ...pathway.conditionalRequirements.map((requirement) => requirement.review),
    ]),
    ...blueprint.scoreRules.map((rule) => rule.review),
  ];
  for (const review of ruleReviews) {
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
    if (!declaredSourceIds.has(sourceUseNote.sourceDocumentId)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_SOURCE_USE_NOTE_REF',
        message: `${sourceUseNote.id} references undeclared source ${sourceUseNote.sourceDocumentId}`,
      });
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
  const endgameClinic = resolveClinicForProgressionMode(clinicState, 'endgame', catalogs);
  const validationContexts = blueprint.metadata.compatibleLocationIds.flatMap((locationId) => {
    if (clinicState.locationIds.includes(locationId)) return [{ locationId, clinic: clinicState }];
    if (endgameClinic.locationIds.includes(locationId))
      return [{ locationId, clinic: endgameClinic }];
    issues.push({
      severity: 'error',
      code: 'CASE_LOCATION_UNAVAILABLE',
      message: `${blueprint.id} references ${locationId}, which no validation clinic can host.`,
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
    ['upgrades', catalogs.upgrades.map((item) => item.id)],
  ] as const) {
    for (const duplicate of duplicateIds(ids)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_CATALOG_ID',
        message: `${name}: ${duplicate}`,
      });
    }
  }
  const serviceIds = new Set(catalogs.services.map((service) => service.id));
  const formularyIds = new Set(catalogs.formularies.map((formulary) => formulary.id));
  const upgradeIds = new Set(catalogs.upgrades.map((upgrade) => upgrade.id));
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
  for (const upgrade of catalogs.upgrades) {
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
    if (upgrade.kind === 'formulary' && upgrade.grantsFormularyIds.length === 0) {
      issues.push({
        severity: 'error',
        code: 'FORMULARY_UPGRADE_WITHOUT_FORMULARY',
        message: upgrade.id,
      });
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
    for (const modifier of [...medication.fitModifiers, ...medication.authorOverrides]) {
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
