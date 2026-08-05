import {
  PatientTemplateClinicalResultRecipeHorizonArtifactSchema,
  PatientTemplateClinicalResultRecipeHorizonRequestSchema,
  type ModePatientTemplateHorizonMember,
  type PatientTemplateClinicalResultRecipe,
  type PatientTemplateClinicalResultRecipeHorizonArtifact,
  type PatientTemplateClinicalResultRecipeHorizonFingerprint,
  type PatientTemplateClinicalResultRecipeHorizonMember,
  type PatientTemplateClinicalResultRecipeHorizonRequest,
} from '@psychsim/schemas';

import { verifyModePatientTemplateHorizonIntegrity } from './mode-patient-template-horizon-compiler';
import {
  fingerprintPatientTemplateClinicalResultRecipe,
  normalizePatientTemplateClinicalResultRecipe,
} from './patient-template-clinical-result-recipe-fingerprint';

export const PATIENT_TEMPLATE_CLINICAL_RESULT_RECIPE_HORIZON_COMPILER_VERSION = '1.0.0';

export type PatientTemplateClinicalResultRecipeHorizonCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultRecipeHorizonArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'TEMPLATE_HORIZON_INVALID'
          | 'RECIPE_TEMPLATE_MISMATCH'
          | 'DUPLICATE_TEMPLATE_RECIPE'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateClinicalResultRecipeHorizonIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultRecipeHorizonArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'REPLAY_MISMATCH';
        readonly message: string;
      };
    };

export type PatientTemplateClinicalResultRecipeHorizonResolutionResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly member: PatientTemplateClinicalResultRecipeHorizonMember;
        readonly recipe: PatientTemplateClinicalResultRecipe;
      };
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_HORIZON' | 'TEMPLATE_NOT_FOUND' | 'RECIPE_MISSING';
        readonly message: string;
      };
    };

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

const fingerprint = (
  scope: string,
  value: unknown,
): PatientTemplateClinicalResultRecipeHorizonFingerprint =>
  `fingerprint.patient-template-clinical-result-recipe-horizon.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    PatientTemplateClinicalResultRecipeHorizonCompilationResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[],
): PatientTemplateClinicalResultRecipeHorizonCompilationResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const recipeSortKey = (recipe: PatientTemplateClinicalResultRecipe): string =>
  `${recipe.templateRef.id}\u0000${recipe.templateRef.contentVersion}\u0000${recipe.id}`;

const normalizeRequest = (
  request: PatientTemplateClinicalResultRecipeHorizonRequest,
): PatientTemplateClinicalResultRecipeHorizonRequest =>
  PatientTemplateClinicalResultRecipeHorizonRequestSchema.parse({
    ...request,
    recipes: request.recipes
      .map(normalizePatientTemplateClinicalResultRecipe)
      .sort((left, right) => compareStrings(recipeSortKey(left), recipeSortKey(right))),
  });

const exactTemplateKey = (input: {
  readonly templateRef: { readonly id: string; readonly contentVersion: string };
  readonly templateFingerprint: string;
}): string =>
  `${input.templateRef.id}\u0000${input.templateRef.contentVersion}\u0000${input.templateFingerprint}`;

const memberFor = (
  horizonMember: ModePatientTemplateHorizonMember,
  recipe: PatientTemplateClinicalResultRecipe | null,
): PatientTemplateClinicalResultRecipeHorizonMember => {
  const recipeFingerprint =
    recipe === null ? null : fingerprintPatientTemplateClinicalResultRecipe(recipe);
  return {
    schemaVersion: 1,
    id: `patient-template-clinical-result-recipe-horizon-member.${hashToHex64(
      `${horizonMember.id}\u0000${recipe?.id ?? 'missing'}\u0000${recipeFingerprint ?? 'missing'}`,
    )}`,
    templateHorizonMemberId: horizonMember.id,
    templateRef: horizonMember.templateRef,
    templateFingerprint: horizonMember.templateFingerprint,
    inclusionBasis: horizonMember.inclusionBasis,
    templateMedicalReviewStatus: horizonMember.medicalReviewStatus,
    coverageStatus: recipe === null ? 'missing_recipe' : 'bound',
    recipeRef:
      recipe === null
        ? null
        : {
            id: recipe.id,
            contentVersion: recipe.contentVersion,
            fingerprint: recipeFingerprint!,
          },
    recipeMedicalReviewStatus: recipe?.medicalReviewStatus ?? null,
  };
};

const artifactPayload = (
  artifact: Omit<PatientTemplateClinicalResultRecipeHorizonArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  mode: artifact.mode,
  sourceBoundary: artifact.sourceBoundary,
  coverageStatus: artifact.coverageStatus,
  templateHorizonRef: artifact.templateHorizonRef,
  members: artifact.members,
  recipes: artifact.recipes,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientTemplateClinicalResultRecipeHorizon = (
  input: unknown,
): PatientTemplateClinicalResultRecipeHorizonCompilationResult => {
  const parsed = PatientTemplateClinicalResultRecipeHorizonRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const request = normalizeRequest(parsed.data);
  const horizonIntegrity = verifyModePatientTemplateHorizonIntegrity(
    request.templateHorizonArtifact,
  );
  if (!horizonIntegrity.ok) {
    return fail(
      'TEMPLATE_HORIZON_INVALID',
      `${horizonIntegrity.error.code}: ${horizonIntegrity.error.message}`,
      [request.templateHorizonArtifact.id],
    );
  }
  const horizon = horizonIntegrity.value;
  const horizonMemberByKey = new Map(
    horizon.members.map((member) => [exactTemplateKey(member), member] as const),
  );
  const recipeByTemplateKey = new Map<string, PatientTemplateClinicalResultRecipe>();
  for (const recipe of request.recipes) {
    const key = exactTemplateKey(recipe);
    const horizonMember = horizonMemberByKey.get(key);
    if (horizonMember === undefined) {
      return fail(
        'RECIPE_TEMPLATE_MISMATCH',
        `${recipe.id} does not target one exact template in the supplied mode horizon.`,
        [recipe.id, recipe.templateRef.id, horizon.id],
      );
    }
    const existing = recipeByTemplateKey.get(key);
    if (existing !== undefined) {
      return fail(
        'DUPLICATE_TEMPLATE_RECIPE',
        `${existing.id} and ${recipe.id} both claim the same exact patient template.`,
        [existing.id, recipe.id, recipe.templateRef.id],
      );
    }
    recipeByTemplateKey.set(key, recipe);
  }
  const members = horizon.members
    .map((member) => memberFor(member, recipeByTemplateKey.get(exactTemplateKey(member)) ?? null))
    .sort((left, right) => compareStrings(exactTemplateKey(left), exactTemplateKey(right)));
  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_RECIPE_HORIZON_COMPILER_VERSION,
    requestId: request.id,
    mode: horizon.mode,
    sourceBoundary: horizon.sourceBoundary,
    coverageStatus: members.some((member) => member.coverageStatus === 'missing_recipe')
      ? ('incomplete' as const)
      : ('complete' as const),
    templateHorizonRef: {
      id: horizon.id,
      inputFingerprint: horizon.inputFingerprint,
      payloadFingerprint: horizon.payloadFingerprint,
    },
    members,
    recipes: request.recipes,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateClinicalResultRecipeHorizonArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-clinical-result-recipe-horizon.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      horizon.id,
      ...request.recipes.map((recipe) => recipe.id),
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplateClinicalResultRecipeHorizonIntegrity = (
  input: unknown,
): PatientTemplateClinicalResultRecipeHorizonIntegrityResult => {
  const parsed = PatientTemplateClinicalResultRecipeHorizonArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !== PATIENT_TEMPLATE_CLINICAL_RESULT_RECIPE_HORIZON_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported recipe-horizon compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact normalized recipe-horizon request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-clinical-result-recipe-horizon.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its exact recipe-horizon payload.`,
      },
    };
  }
  const replay = compilePatientTemplateClinicalResultRecipeHorizon(artifact.compileRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not equal deterministic recipe-horizon replay.`
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const resolvePatientTemplateClinicalResultRecipeFromHorizon = (input: {
  readonly artifact: unknown;
  readonly templateRef: { readonly id: string; readonly contentVersion: string };
  readonly templateFingerprint: string;
}): PatientTemplateClinicalResultRecipeHorizonResolutionResult => {
  const integrity = verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_HORIZON',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const artifact = integrity.value;
  const key = exactTemplateKey(input);
  const member = artifact.members.find((candidate) => exactTemplateKey(candidate) === key);
  if (member === undefined) {
    return {
      ok: false,
      error: {
        code: 'TEMPLATE_NOT_FOUND',
        message: 'The requested exact template is not present in this recipe horizon.',
      },
    };
  }
  if (member.recipeRef === null) {
    return {
      ok: false,
      error: {
        code: 'RECIPE_MISSING',
        message: `${member.templateRef.id} has no clinical-result recipe in this authoring horizon.`,
      },
    };
  }
  const recipe = artifact.recipes.find(
    (candidate) =>
      candidate.id === member.recipeRef!.id &&
      candidate.contentVersion === member.recipeRef!.contentVersion &&
      fingerprintPatientTemplateClinicalResultRecipe(candidate) === member.recipeRef!.fingerprint,
  );
  if (recipe === undefined) {
    return {
      ok: false,
      error: {
        code: 'INVALID_HORIZON',
        message: `${member.id} does not retain its exact bound recipe payload.`,
      },
    };
  }
  return { ok: true, value: { member, recipe } };
};
