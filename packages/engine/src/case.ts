import {
  CaseInstanceSchema,
  InformationResultSchema,
  type CaseBlueprint,
  type CaseInstance,
  type CatalogBundle,
  type FindingBlueprint,
  type FindingOutcome,
  type InformationResult,
  type InformationResultBlueprint,
  type PatientContextFindingBinding,
  type PatientObservation,
  type PatientRecord,
  type ResolvedPatientClinicalContext,
  type ResolvedFinding,
} from '@psychsim/schemas';

import {
  generateNoncriticalNumericTest,
  resultFromPatientObservations,
  type TestGenerationContext,
} from './labs';
import { hashToHex, resolveVariant, seededUnit } from './rng';

const resolveTemplate = (
  template: string,
  values: Readonly<Record<string, string | number>>,
): string =>
  template.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (match, key: string) =>
    values[key] === undefined ? match : String(values[key]),
  );

const deterministicShuffle = <T>(items: readonly T[], seed: string, key: string): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(seededUnit(seed, `${key}:${index}`) * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
};

const selectVariant = (
  values: readonly string[] | undefined,
  seed: string,
  key: string,
): string | undefined => {
  if (!values?.length) return undefined;
  const index = Math.min(values.length - 1, Math.floor(seededUnit(seed, key) * values.length));
  return values[index];
};

const resolveFindingOutcomes = (
  result: InformationResultBlueprint,
  seed: string,
  actionId: string,
  contextBindings: readonly PatientContextFindingBinding[] = [],
): Map<string, FindingOutcome> => {
  const outcomes = new Map<string, FindingOutcome>();
  for (const finding of result.findings) {
    if (finding.outcome !== 'variable') outcomes.set(finding.id, finding.outcome);
  }
  if (!result.selection) {
    if (contextBindings.length > 0) {
      throw new Error(`${actionId} has clinical-context bindings but no variable selection.`);
    }
    return outcomes;
  }

  for (const id of result.selection.requiredPresentIds) outcomes.set(id, 'present');
  for (const id of result.selection.requiredAbsentIds) outcomes.set(id, 'absent');
  for (const binding of contextBindings) {
    const finding = result.findings.find((candidate) => candidate.id === binding.findingId);
    if (!finding || finding.outcome !== 'variable') {
      throw new Error(
        `${actionId} clinical-context binding targets missing or fixed finding ${binding.findingId}.`,
      );
    }
    const existing = outcomes.get(binding.findingId);
    if (existing && existing !== binding.outcome) {
      throw new Error(
        `${actionId} clinical-context binding conflicts with a required outcome for ${binding.findingId}.`,
      );
    }
    outcomes.set(binding.findingId, binding.outcome);
  }

  const fixedPresentCount = [...outcomes.values()].filter(
    (outcome) => outcome === 'present',
  ).length;
  if (fixedPresentCount > result.selection.maximumPresent) {
    throw new Error(`${actionId} clinical context exceeds the maximum positive findings.`);
  }
  const effectiveMinimum = Math.max(result.selection.minimumPresent, fixedPresentCount);
  const span = result.selection.maximumPresent - effectiveMinimum + 1;
  const desiredPresent =
    effectiveMinimum +
    Math.min(
      Math.max(0, span - 1),
      Math.floor(seededUnit(seed, `${actionId}:present-count`) * span),
    );
  const variable = deterministicShuffle(
    result.findings.filter(
      (finding) => finding.outcome === 'variable' && !outcomes.has(finding.id),
    ),
    seed,
    `${actionId}:finding-selection`,
  );
  const additionalPresent = Math.max(0, desiredPresent - fixedPresentCount);
  variable.forEach((finding, index) =>
    outcomes.set(finding.id, index < additionalPresent ? 'present' : 'absent'),
  );
  return outcomes;
};

const resolveFinding = (
  finding: FindingBlueprint,
  outcome: FindingOutcome,
  seed: string,
  actionId: string,
): ResolvedFinding => {
  const durationProfile = finding.durationProfile;
  const durationOption = durationProfile
    ? durationProfile.options[
        Math.min(
          durationProfile.options.length - 1,
          Math.floor(
            seededUnit(seed, `${actionId}:${finding.id}:duration-option`) *
              durationProfile.options.length,
          ),
        )
      ]
    : undefined;
  const durationDisplay = durationOption
    ? selectVariant(
        durationOption.displayValueVariants,
        seed,
        `${actionId}:${finding.id}:${durationOption.id}:duration-display`,
      )
    : undefined;
  const valueTemplate = selectVariant(
    finding.valueTextVariants,
    seed,
    `${actionId}:${finding.id}:value-text`,
  );
  return {
    id: finding.id,
    groupLabel: finding.groupLabel,
    label:
      selectVariant(finding.labelVariants, seed, `${actionId}:${finding.id}:label`) ??
      finding.labelVariants[0]!,
    outcome,
    outcomeDisplay: finding.outcomeDisplay,
    valueText:
      durationDisplay && valueTemplate
        ? valueTemplate.replaceAll('{{duration}}', durationDisplay)
        : valueTemplate,
    durationMeasurement:
      durationProfile && durationOption
        ? {
            profileId: durationProfile.id,
            profileContentVersion: durationProfile.contentVersion,
            optionId: durationOption.id,
            value: durationOption.value,
            unit: durationOption.unit,
            relatedDiagnosisId: durationProfile.relatedDiagnosisId,
            interpretation: durationProfile.interpretation,
            criterionId: durationProfile.criterionId,
          }
        : undefined,
    origin: 'authored',
  };
};

export const resolveInformationResult = (
  result: InformationResultBlueprint,
  seed: string,
  actionId: string,
  contextBindings: readonly PatientContextFindingBinding[] = [],
): InformationResult => {
  const outcomes = resolveFindingOutcomes(result, seed, actionId, contextBindings);
  const resolved = result.findings.map((finding) => {
    const outcome = outcomes.get(finding.id);
    if (!outcome) {
      throw new Error(`${actionId} leaves ${finding.id} unresolved.`);
    }
    return resolveFinding(finding, outcome, seed, actionId);
  });
  return InformationResultSchema.parse({
    kind: 'finding_set',
    findings: result.shuffle
      ? deterministicShuffle(resolved, seed, `${actionId}:finding-order`)
      : resolved,
    factsRevealed: result.factsRevealed,
  });
};

const testContextFor = (
  blueprint: CaseBlueprint,
  patientRecord: PatientRecord,
  resolvedVariants: Readonly<Record<string, string | number>>,
): TestGenerationContext => {
  const context = patientRecord.testGenerationContext;
  const ageValue = resolvedVariants[context.ageYearsVariantTarget];
  if (typeof ageValue !== 'number') {
    throw new Error(
      `${blueprint.id} must resolve numeric ${context.ageYearsVariantTarget} for test generation.`,
    );
  }
  return {
    ageYears: ageValue,
    sexForReference: context.sexForReference,
    diagnosisIds: patientRecord.diagnoses.map((diagnosis) => diagnosis.id),
    clinicalTagIds: patientRecord.clinicalTagIds,
  };
};

export const resolvePatientClinicalContext = (
  patientRecord: PatientRecord,
  seed: string,
): readonly ResolvedPatientClinicalContext[] =>
  patientRecord.clinicalContextDimensions.map((dimension) => {
    const totalWeight = dimension.options.reduce(
      (sum, option) => sum + option.gameSelectionWeight,
      0,
    );
    let cursor = seededUnit(seed, `clinical-context:${dimension.id}`) * totalWeight;
    let selected = dimension.options.at(-1)!;
    for (const option of dimension.options) {
      cursor -= option.gameSelectionWeight;
      if (cursor < 0) {
        selected = option;
        break;
      }
    }
    return {
      dimensionId: dimension.id,
      optionId: selected.id,
      addedClinicalTagIds: selected.addedClinicalTagIds,
      findingBindings: selected.findingBindings,
    };
  });

export const instantiateCase = (
  blueprint: CaseBlueprint,
  seed: string,
  catalogs: CatalogBundle,
): CaseInstance => {
  const resolvedVariants: Record<string, string | number> = {};
  for (const variant of blueprint.variants) {
    resolvedVariants[variant.target] = resolveVariant(
      variant.generator,
      seed,
      variant.id,
      catalogs.variantPools,
    );
  }

  const resolvedClinicalContext = resolvePatientClinicalContext(blueprint.patientRecord, seed);
  const patientRecord: PatientRecord = {
    ...blueprint.patientRecord,
    clinicalTagIds: [
      ...new Set([
        ...blueprint.patientRecord.clinicalTagIds,
        ...resolvedClinicalContext.flatMap((context) => context.addedClinicalTagIds),
      ]),
    ],
  };
  const generatedObservations: PatientObservation[] = [];
  const context = testContextFor(blueprint, patientRecord, resolvedVariants);
  const informationActions = blueprint.informationActions.map((action) => {
    const contextBindings = resolvedClinicalContext.flatMap((resolved) =>
      resolved.findingBindings.filter((binding) => binding.actionId === action.actionId),
    );
    const baseResult = resolveInformationResult(
      action.result,
      seed,
      action.actionId,
      contextBindings,
    );
    const test = catalogs.tests.find((candidate) => candidate.actionId === action.actionId);
    if (!test) return { ...action, result: baseResult };

    const explicitObservations = blueprint.patientRecord.observations.filter(
      (observation) => observation.actionId === action.actionId,
    );
    if (explicitObservations.length > 0) {
      return {
        ...action,
        result: resultFromPatientObservations(explicitObservations, action.result.factsRevealed),
      };
    }
    if (
      blueprint.patientRecord.generationPolicy.incidentalAbnormalities !== 'bounded_by_test_catalog'
    ) {
      return { ...action, result: baseResult };
    }
    const generated = generateNoncriticalNumericTest(
      test,
      context,
      seed,
      action.result.factsRevealed,
    );
    if (!generated) return { ...action, result: baseResult };
    generatedObservations.push(...generated.observations);
    return { ...action, result: generated.result };
  });

  return CaseInstanceSchema.parse({
    schemaVersion: 1,
    contentVersion: blueprint.contentVersion,
    id: `instance.${blueprint.id.replace(/^case\./, '')}.${hashToHex(`${blueprint.id}:${seed}`)}`,
    blueprintId: blueprint.id,
    seed,
    resolvedVariants,
    resolvedClinicalContext,
    resolvedObservations: [...blueprint.patientRecord.observations, ...generatedObservations],
    metadata: blueprint.metadata,
    patientRecord,
    diagnosisRubric: blueprint.diagnosisRubric,
    criticalFacts: blueprint.criticalFacts,
    opening: {
      title: resolveTemplate(blueprint.opening.titleTemplate, resolvedVariants),
      chiefComplaint: resolveTemplate(blueprint.opening.chiefComplaintTemplate, resolvedVariants),
      summary: resolveTemplate(blueprint.opening.summaryTemplate, resolvedVariants),
      context: resolveTemplate(blueprint.opening.contextTemplate, resolvedVariants),
      knownMedicationIds: blueprint.opening.knownMedicationIds,
      medicationListStatus: blueprint.opening.medicationListStatus,
      knownHistory: blueprint.opening.knownHistory,
      basicVitals: blueprint.opening.basicVitals,
    },
    informationActions,
    workupObjectives: blueprint.workupObjectives,
    treatmentWorkupRequirements: blueprint.treatmentWorkupRequirements,
    availableTreatments: blueprint.availableTreatments,
    treatmentGrades: blueprint.treatmentGrades,
    treatmentPathways: blueprint.treatmentPathways,
    scoreRules: blueprint.scoreRules,
    scoring: blueprint.scoring,
    economy: blueprint.economy,
    referenceSolutions: blueprint.referenceSolutions,
  });
};
