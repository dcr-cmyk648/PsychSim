import {
  InformationResultSchema,
  PatientObservationSchema,
  type InformationResult,
  type LabMildAbnormalRange,
  type NumericTestGenerationProfile,
  type PatientObservation,
  type TestDefinition,
} from '@psychsim/schemas';

import { seededUnit } from './rng';

export interface TestGenerationContext {
  ageYears: number;
  sexForReference: 'female' | 'male' | 'intersex' | 'unspecified';
  diagnosisIds: readonly string[];
  clinicalTagIds: readonly string[];
}

export interface GeneratedTestResult {
  observations: PatientObservation[];
  result: InformationResult;
  profileId: string;
}

const roundTo = (value: number, decimals: number): number => {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
};

const within = (minimum: number, maximum: number, unit: number, decimals: number): number =>
  roundTo(minimum + unit * (maximum - minimum), decimals);

const formatNumber = (value: number, decimals: number): string => value.toFixed(decimals);

const profileMatches = (
  profile: NumericTestGenerationProfile,
  context: TestGenerationContext,
): boolean => {
  const { when } = profile;
  return (
    (when.minimumAgeYears === undefined || context.ageYears >= when.minimumAgeYears) &&
    (when.maximumAgeYears === undefined || context.ageYears <= when.maximumAgeYears) &&
    (when.sexForReference === undefined || context.sexForReference === when.sexForReference) &&
    (when.anyDiagnosisIds.length === 0 ||
      when.anyDiagnosisIds.some((id) => context.diagnosisIds.includes(id))) &&
    when.allClinicalTagIds.every((id) => context.clinicalTagIds.includes(id))
  );
};

export const resolveNumericTestProfile = (
  test: TestDefinition,
  context: TestGenerationContext,
): NumericTestGenerationProfile | null => {
  if (test.generator.type !== 'numeric_panel') return null;
  return (
    [...test.generator.profiles]
      .filter((profile) => profileMatches(profile, context))
      .sort(
        (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
      )[0] ?? null
  );
};

const selectAbnormalCandidate = (
  test: TestDefinition,
  profile: NumericTestGenerationProfile,
  seed: string,
): { componentIndex: number; range: LabMildAbnormalRange } | null => {
  const candidates = profile.components.flatMap((component, componentIndex) =>
    component.mildAbnormalRanges.map((range) => ({ componentIndex, range })),
  );
  if (candidates.length === 0) return null;
  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.range.weight, 0);
  let cursor = seededUnit(seed, `${test.id}:${profile.id}:abnormal-candidate`) * totalWeight;
  for (const candidate of candidates) {
    cursor -= candidate.range.weight;
    if (cursor < 0) return candidate;
  }
  return candidates.at(-1) ?? null;
};

export const resultFromPatientObservations = (
  observations: readonly PatientObservation[],
  factsRevealed: readonly string[],
): InformationResult =>
  InformationResultSchema.parse({
    kind: 'finding_set',
    findings: observations.map((observation) => {
      const isStructuredNumeric =
        typeof observation.value === 'number' &&
        observation.unit !== undefined &&
        observation.ucumCode !== undefined &&
        observation.referenceInterval !== undefined;
      return {
        id: observation.id,
        label: observation.label,
        outcome: observation.flag,
        valueText: isStructuredNumeric
          ? undefined
          : `${String(observation.value)}${observation.unit ? ` ${observation.unit}` : ''}${
              observation.referenceRangeText ? ` · reference ${observation.referenceRangeText}` : ''
            }`,
        numericMeasurement: isStructuredNumeric
          ? {
              value: observation.value,
              displayValue: observation.displayValue ?? String(observation.value),
              unit: observation.unit,
              ucumCode: observation.ucumCode,
              referenceInterval: observation.referenceInterval,
            }
          : undefined,
        origin: observation.origin,
      };
    }),
    factsRevealed: [...factsRevealed],
  });

export const generateNoncriticalNumericTest = (
  test: TestDefinition,
  context: TestGenerationContext,
  seed: string,
  factsRevealed: readonly string[],
): GeneratedTestResult | null => {
  const profile = resolveNumericTestProfile(test, context);
  if (!profile) return null;
  const shouldFlag =
    seededUnit(seed, `${test.id}:${profile.id}:incidental-abnormal`) <
    profile.incidentalAbnormalProbability;
  const selected = shouldFlag ? selectAbnormalCandidate(test, profile, seed) : null;

  const observations = profile.components.map((component, componentIndex) => {
    const selectedRange = selected?.componentIndex === componentIndex ? selected.range : null;
    const sourceRange = selectedRange ?? component.normalGenerationRange;
    const value = within(
      sourceRange.minimum,
      sourceRange.maximum,
      seededUnit(seed, `${test.id}:${profile.id}:${component.id}:value`),
      component.decimals,
    );
    const flag = selectedRange?.flag ?? 'normal';
    return PatientObservationSchema.parse({
      id: `observation.generated.${test.id.replace('test.', '')}.${component.id.replace(
        'lab-component.',
        '',
      )}`,
      actionId: test.actionId,
      label: component.label,
      dataType: 'scalar',
      value,
      displayValue: formatNumber(value, component.decimals),
      unit: component.unit,
      ucumCode: component.ucumCode,
      referenceInterval: {
        low: component.referenceRange.minimum,
        high: component.referenceRange.maximum,
        unit: component.unit,
        ucumCode: component.ucumCode,
        display: `${formatNumber(
          component.referenceRange.minimum,
          component.decimals,
        )}–${formatNumber(component.referenceRange.maximum, component.decimals)} ${component.unit}`,
        applicablePopulation: profile.referenceIntervalLabel,
        sourceId: profile.referenceIntervalSetId,
      },
      flag,
      clinicallyCritical: false,
      origin: selectedRange ? 'generated_incidental' : 'generated_normal',
      notCaseDefining: true,
    });
  });

  return {
    observations,
    result: resultFromPatientObservations(observations, factsRevealed),
    profileId: profile.id,
  };
};
