import {
  PatientTemplateClinicalResultMaterializationContextArtifactSchema,
  PatientTemplateClinicalResultMaterializationContextRequestSchema,
  type NumericStructuredTestGenerationContext,
  type PatientTemplate,
  type PatientTemplateClinicalResultMaterializationContextArtifact,
  type PatientTemplateClinicalResultMaterializationContextFingerprint,
  type PatientTemplateClinicalResultMaterializationContextRequest,
} from '@psychsim/schemas';

import {
  compilePatientSceneSourceInstancesFromCatalog,
  verifyCatalogPatientSceneSourceInstanceCompilationIntegrity,
} from './catalog-patient-scene-source-instance-compiler';
import { fingerprintModePatientTemplateHorizonTemplate } from './mode-patient-template-horizon-compiler';
import { verifyPatientSlotFillSeedAuthorityIntegrity } from './patient-slot-fill-seed-authority';
import {
  resolvePatientTemplateClinicalResultRecipeFromHorizon,
  verifyPatientTemplateClinicalResultRecipeHorizonIntegrity,
} from './patient-template-clinical-result-recipe-horizon-compiler';
import { verifyPatientTemplateClinicalResultResourceCoverageIntegrity } from './patient-template-clinical-result-resource-coverage-compiler';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

export const PATIENT_TEMPLATE_CLINICAL_RESULT_MATERIALIZATION_CONTEXT_COMPILER_VERSION = '1.0.0';

export type PatientTemplateClinicalResultMaterializationContextCompilationResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultMaterializationContextArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_REQUEST'
          | 'SEED_AUTHORITY_INVALID'
          | 'PATIENT_STATE_COMPOSITION_INVALID'
          | 'PATIENT_STATE_NOT_COMPOSED'
          | 'RESOURCE_COVERAGE_INVALID'
          | 'TEMPLATE_CONTEXT_MISMATCH'
          | 'RECIPE_NOT_AVAILABLE'
          | 'RESOURCE_COVERAGE_INCOMPLETE'
          | 'SOURCE_INSTANCE_COMPILATION_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientTemplateClinicalResultMaterializationContextIntegrityResult =
  | {
      readonly ok: true;
      readonly value: PatientTemplateClinicalResultMaterializationContextArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
          | 'SOURCE_INSTANCE_COMPILATION_INVALID'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH'
          | 'REPLAY_MISMATCH';
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

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

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
): PatientTemplateClinicalResultMaterializationContextFingerprint =>
  `fingerprint.patient-template-clinical-result-materialization-context.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    PatientTemplateClinicalResultMaterializationContextCompilationResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): PatientTemplateClinicalResultMaterializationContextCompilationResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const selectedTemplate = (
  request: PatientTemplateClinicalResultMaterializationContextRequest,
): PatientTemplate =>
  request.patientSlotFillSeedAuthorityArtifact.locationTemplateSelectionArtifact
    .locationOwnedPatientSlotSelectionArtifact.admittedTemplateLocationBindingArtifact.template;

const generationContext = (
  patientState: NonNullable<
    PatientTemplateClinicalResultMaterializationContextRequest['patientStateCompositionArtifact']['composedPatientState']
  >,
): NumericStructuredTestGenerationContext => ({
  ageYears: patientState.demographics.ageYears,
  sexForReference: patientState.demographics.sexForReference,
  diagnosisIds: uniqueSorted(
    patientState.conditionStates.map((condition) => condition.diagnosisDefinitionId),
  ),
  clinicalTagIds: [...patientState.clinicalTagIds].sort(compareStrings),
});

const sourceCompilationRequestId = (
  request: PatientTemplateClinicalResultMaterializationContextRequest,
  patientStateId: string,
): string =>
  `catalog-patient-scene-source-instance-request.materialization-context.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        requestId: request.id,
        patientStateId,
        resourceCoverageId: request.resourceCoverageArtifact.id,
        sourceCatalogId:
          request.resourceCoverageArtifact.compileRequest.resourceSet.sourceDefinitionCatalog.id,
      }),
    ),
  )}`;

const artifactPayload = (
  artifact: Omit<
    PatientTemplateClinicalResultMaterializationContextArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateId: artifact.patientStateId,
  templateRef: artifact.templateRef,
  templateFingerprint: artifact.templateFingerprint,
  patientGenerationSeed: artifact.patientGenerationSeed,
  generationContext: artifact.generationContext,
  recipeRef: artifact.recipeRef,
  resourceCoverageRef: artifact.resourceCoverageRef,
  sourceInstanceCompilationRef: artifact.sourceInstanceCompilationRef,
  sourceInstanceCompilation: artifact.sourceInstanceCompilation,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientTemplateClinicalResultMaterializationContext = (
  input: unknown,
): PatientTemplateClinicalResultMaterializationContextCompilationResult => {
  const parsed = PatientTemplateClinicalResultMaterializationContextRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues));
  }
  const request = parsed.data;
  const seedAuthority = verifyPatientSlotFillSeedAuthorityIntegrity(
    request.patientSlotFillSeedAuthorityArtifact,
  );
  if (!seedAuthority.ok) {
    return fail(
      'SEED_AUTHORITY_INVALID',
      `${seedAuthority.error.code}: ${seedAuthority.error.message}`,
      [request.patientSlotFillSeedAuthorityArtifact.id],
    );
  }
  const composition = verifyResolvedPatientStateCompositionIntegrity(
    request.patientStateCompositionArtifact,
  );
  if (!composition.ok) {
    return fail(
      'PATIENT_STATE_COMPOSITION_INVALID',
      `${composition.error.code}: ${composition.error.message}`,
      [request.patientStateCompositionArtifact.id],
    );
  }
  if (
    composition.value.status !== 'composed' ||
    composition.value.composedPatientState === null ||
    composition.value.composedPatientStateFingerprint === null
  ) {
    return fail(
      'PATIENT_STATE_NOT_COMPOSED',
      'Clinical-result materialization requires one completed D-208 patient state.',
      [composition.value.id],
    );
  }
  const coverage = verifyPatientTemplateClinicalResultResourceCoverageIntegrity(
    request.resourceCoverageArtifact,
  );
  if (!coverage.ok) {
    return fail('RESOURCE_COVERAGE_INVALID', `${coverage.error.code}: ${coverage.error.message}`, [
      request.resourceCoverageArtifact.id,
    ]);
  }
  const template = selectedTemplate(request);
  const compositionTemplate =
    composition.value.compositionRequest.optionalFeatureArtifact.selectionRequest.template;
  const templateFingerprint = fingerprintModePatientTemplateHorizonTemplate(template);
  if (
    !sameExactValue(template, compositionTemplate) ||
    seedAuthority.value.selectedTemplateRef.id !== template.id ||
    seedAuthority.value.selectedTemplateRef.contentVersion !== template.contentVersion ||
    composition.value.templateRef.id !== template.id ||
    composition.value.templateRef.contentVersion !== template.contentVersion ||
    composition.value.templateFingerprint !==
      fingerprintTemplateConditionSelectionTemplate(template) ||
    composition.value.compositionRequest.optionalFeatureArtifact.seed !==
      seedAuthority.value.patientGenerationSeed
  ) {
    return fail(
      'TEMPLATE_CONTEXT_MISMATCH',
      'D-325 requires D-233, D-208, and D-324 to name the same exact selected patient template.',
      [seedAuthority.value.id, composition.value.id, coverage.value.id, template.id],
    );
  }
  const templateCoverage = coverage.value.templateCoverage.find(
    (candidate) =>
      candidate.templateRef.id === template.id &&
      candidate.templateRef.contentVersion === template.contentVersion &&
      candidate.templateFingerprint === templateFingerprint,
  );
  if (templateCoverage === undefined || templateCoverage.recipeRef === null) {
    return fail(
      'RECIPE_NOT_AVAILABLE',
      `${template.id}@${template.contentVersion} has no exact clinical-result recipe in D-324.`,
      [coverage.value.id, template.id],
    );
  }
  if (templateCoverage.coverageStatus !== 'complete') {
    const missingIds = templateCoverage.memberCoverage.flatMap((member) =>
      member.requirements
        .filter((requirement) => requirement.status === 'missing')
        .map((requirement) => requirement.requestedId),
    );
    return fail(
      'RESOURCE_COVERAGE_INCOMPLETE',
      `${template.id}@${template.contentVersion} has incomplete clinical-result resources.`,
      [coverage.value.id, template.id, ...missingIds],
    );
  }
  const recipeHorizon = coverage.value.compileRequest.recipeHorizonArtifact;
  const recipeHorizonIntegrity =
    verifyPatientTemplateClinicalResultRecipeHorizonIntegrity(recipeHorizon);
  if (!recipeHorizonIntegrity.ok) {
    return fail(
      'RESOURCE_COVERAGE_INVALID',
      `${recipeHorizonIntegrity.error.code}: ${recipeHorizonIntegrity.error.message}`,
      [coverage.value.id, recipeHorizon.id],
    );
  }
  const recipeResolution = resolvePatientTemplateClinicalResultRecipeFromHorizon({
    artifact: recipeHorizonIntegrity.value,
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint,
  });
  if (
    !recipeResolution.ok ||
    recipeResolution.value.member.recipeRef === null ||
    recipeResolution.value.member.recipeRef.id !== templateCoverage.recipeRef.id ||
    recipeResolution.value.member.recipeRef.contentVersion !==
      templateCoverage.recipeRef.contentVersion
  ) {
    return fail(
      'RECIPE_NOT_AVAILABLE',
      recipeResolution.ok
        ? 'The D-324 template coverage and D-322 recipe resolution do not agree.'
        : recipeResolution.error.message,
      [coverage.value.id, template.id],
    );
  }
  const patientState = composition.value.composedPatientState;
  const sourceInstanceCompilation = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: sourceCompilationRequestId(request, patientState.id),
    patientStateId: patientState.id,
    sourceDefinitionCatalog: coverage.value.compileRequest.resourceSet.sourceDefinitionCatalog,
  });
  if (!sourceInstanceCompilation.ok) {
    return fail(
      'SOURCE_INSTANCE_COMPILATION_FAILED',
      `${sourceInstanceCompilation.error.code}: ${sourceInstanceCompilation.error.message}`,
      [coverage.value.compileRequest.resourceSet.sourceDefinitionCatalog.id, patientState.id],
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_TEMPLATE_CLINICAL_RESULT_MATERIALIZATION_CONTEXT_COMPILER_VERSION,
    requestId: request.id,
    patientStateId: patientState.id,
    templateRef: { id: template.id, contentVersion: template.contentVersion },
    templateFingerprint,
    patientGenerationSeed: seedAuthority.value.patientGenerationSeed,
    generationContext: generationContext(patientState),
    recipeRef: recipeResolution.value.member.recipeRef,
    resourceCoverageRef: {
      id: coverage.value.id,
      inputFingerprint: coverage.value.inputFingerprint,
      payloadFingerprint: coverage.value.payloadFingerprint,
    },
    sourceInstanceCompilationRef: {
      id: sourceInstanceCompilation.value.id,
      payloadFingerprint: sourceInstanceCompilation.value.payloadFingerprint,
    },
    sourceInstanceCompilation: sourceInstanceCompilation.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
  const output = PatientTemplateClinicalResultMaterializationContextArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-template-clinical-result-materialization-context.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      request.id,
      template.id,
      patientState.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientTemplateClinicalResultMaterializationContextIntegrity = (
  input: unknown,
): PatientTemplateClinicalResultMaterializationContextIntegrityResult => {
  const parsed = PatientTemplateClinicalResultMaterializationContextArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (
    artifact.compilerVersion !==
    PATIENT_TEMPLATE_CLINICAL_RESULT_MATERIALIZATION_CONTEXT_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported result-materialization context compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const seedAuthority = verifyPatientSlotFillSeedAuthorityIntegrity(
    artifact.compileRequest.patientSlotFillSeedAuthorityArtifact,
  );
  const composition = verifyResolvedPatientStateCompositionIntegrity(
    artifact.compileRequest.patientStateCompositionArtifact,
  );
  const coverage = verifyPatientTemplateClinicalResultResourceCoverageIntegrity(
    artifact.compileRequest.resourceCoverageArtifact,
  );
  if (!seedAuthority.ok || !composition.ok || !coverage.ok) {
    let message: string;
    if (!seedAuthority.ok) {
      message = `${seedAuthority.error.code}: ${seedAuthority.error.message}`;
    } else if (!composition.ok) {
      message = `${composition.error.code}: ${composition.error.message}`;
    } else if (!coverage.ok) {
      message = `${coverage.error.code}: ${coverage.error.message}`;
    } else {
      message = 'An upstream materialization-context artifact failed integrity.';
    }
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message,
      },
    };
  }
  const sourceCompilation = verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(
    artifact.sourceInstanceCompilation,
  );
  if (!sourceCompilation.ok) {
    return {
      ok: false,
      error: {
        code: 'SOURCE_INSTANCE_COMPILATION_INVALID',
        message: `${sourceCompilation.error.code}: ${sourceCompilation.error.message}`,
      },
    };
  }
  if (artifact.inputFingerprint !== fingerprint('input', artifact.compileRequest)) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact D-233/D-208/D-324 request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !==
      `patient-template-clinical-result-materialization-context.${expectedPayloadFingerprint.slice(
        -16,
      )}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen materialization context.`,
      },
    };
  }
  const replay = compilePatientTemplateClinicalResultMaterializationContext(
    artifact.compileRequest,
  );
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: replay.ok
          ? `${artifact.id} does not equal deterministic materialization-context replay.`
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: artifact };
};
