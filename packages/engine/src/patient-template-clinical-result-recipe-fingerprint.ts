import type {
  PatientTemplateClinicalResultRecipe,
  PatientTemplateClinicalResultRecipeCompilationFingerprint,
} from '@psychsim/schemas';

const compareStrings = (left: string, right: string): number =>
  left === right ? 0 : left < right ? -1 : 1;

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, canonicalizeObjectKeys(child)]),
    );
  }
  return value;
};

const hashToHex64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
};

export const normalizePatientTemplateClinicalResultRecipe = (
  recipe: PatientTemplateClinicalResultRecipe,
): PatientTemplateClinicalResultRecipe => ({
  ...recipe,
  directMembers: recipe.directMembers
    .map((member) =>
      member.kind === 'generated_measurement' || member.kind === 'generated_categorical_observation'
        ? {
            ...member,
            generationProfileRefs: [...member.generationProfileRefs].sort(
              (left, right) =>
                compareStrings(left.id, right.id) ||
                compareStrings(left.contentVersion, right.contentVersion),
            ),
          }
        : member,
    )
    .sort((left, right) => compareStrings(left.id, right.id)),
  derivedMeasurements: [...recipe.derivedMeasurements].sort((left, right) =>
    compareStrings(left.id, right.id),
  ),
  review: {
    ...recipe.review,
    sourceUseNoteIds: [...new Set(recipe.review.sourceUseNoteIds)].sort(compareStrings),
  },
});

export const fingerprintPatientTemplateClinicalResultRecipe = (
  recipe: PatientTemplateClinicalResultRecipe,
): PatientTemplateClinicalResultRecipeCompilationFingerprint =>
  `fingerprint.patient-template-clinical-result-recipe-compilation.recipe.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(normalizePatientTemplateClinicalResultRecipe(recipe))),
  )}`;
