import {
  PatientClinicalResultAttachmentArtifactSchema,
  PatientClinicalResultAttachmentRequestSchema,
  ResolvedPatientStateSchema,
  type PatientClinicalResultAttachmentArtifact,
  type PatientClinicalResultAttachmentFingerprint,
  type PatientClinicalResultAttachmentRequest,
  type PatientTemplateClinicalResultRecipeCompilationArtifact,
  type ResolvedPatientState,
} from '@psychsim/schemas';

import { fingerprintModePatientTemplateHorizonTemplate } from './mode-patient-template-horizon-compiler';
import { verifyPatientTemplateClinicalResultRecipeCompilationIntegrity } from './patient-template-clinical-result-recipe-compiler';
import { verifyResolvedPatientStateCompositionIntegrity } from './resolved-patient-state-composer';
import { fingerprintTemplateConditionSelectionTemplate } from './template-condition-selector';

export const PATIENT_CLINICAL_RESULT_ATTACHMENT_COMPILER_VERSION = '3.0.0';

export type PatientClinicalResultAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'PATIENT_STATE_COMPOSITION_INVALID'
  | 'PATIENT_STATE_NOT_COMPOSED'
  | 'TEMPLATE_CLINICAL_RESULT_RECIPE_INVALID'
  | 'TEMPLATE_CONTEXT_MISMATCH'
  | 'DUPLICATE_RESULT_RECORD'
  | 'RESULT_LANE_CAPACITY_EXCEEDED'
  | 'PATIENT_STATE_CONTEXT_MISMATCH'
  | 'PREEXISTING_RESULT_LANE'
  | 'INVALID_OUTPUT';

export type PatientClinicalResultAttachmentResult =
  | { readonly ok: true; readonly value: PatientClinicalResultAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: PatientClinicalResultAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientClinicalResultAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: PatientClinicalResultAttachmentArtifact }
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

const fingerprint = (scope: string, value: unknown): PatientClinicalResultAttachmentFingerprint =>
  `fingerprint.patient-clinical-result-attachment.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: PatientClinicalResultAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): PatientClinicalResultAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

interface VerifiedAttachmentInputs {
  readonly request: PatientClinicalResultAttachmentRequest;
  readonly basePatientState: ResolvedPatientState;
}

const recipeInputs = (
  recipeCompilation: PatientTemplateClinicalResultRecipeCompilationArtifact,
) => ({
  collection: recipeCompilation.compileRequest.resultCollectionCompilation,
  materializations: recipeCompilation.compileRequest.derivedMeasurementMaterializations,
});

const verifyInputs = (
  request: PatientClinicalResultAttachmentRequest,
):
  | { readonly ok: true; readonly value: VerifiedAttachmentInputs }
  | { readonly ok: false; readonly result: PatientClinicalResultAttachmentResult } => {
  const compositionIntegrity = verifyResolvedPatientStateCompositionIntegrity(
    request.patientStateCompositionArtifact,
  );
  if (!compositionIntegrity.ok) {
    return {
      ok: false,
      result: fail(
        'PATIENT_STATE_COMPOSITION_INVALID',
        `${compositionIntegrity.error.code}: ${compositionIntegrity.error.message}`,
        [request.patientStateCompositionArtifact.id],
      ),
    };
  }
  const composition = compositionIntegrity.value;
  if (
    composition.status !== 'composed' ||
    composition.composedPatientState === null ||
    composition.composedPatientStateFingerprint === null
  ) {
    return {
      ok: false,
      result: fail(
        'PATIENT_STATE_NOT_COMPOSED',
        'Clinical results require one completed D-208 patient-state composition.',
        [composition.id],
      ),
    };
  }

  const recipeIntegrity = verifyPatientTemplateClinicalResultRecipeCompilationIntegrity(
    request.templateClinicalResultRecipeCompilation,
  );
  if (!recipeIntegrity.ok) {
    return {
      ok: false,
      result: fail(
        'TEMPLATE_CLINICAL_RESULT_RECIPE_INVALID',
        `${recipeIntegrity.error.code}: ${recipeIntegrity.error.message}`,
        [request.templateClinicalResultRecipeCompilation.id],
      ),
    };
  }
  const recipeCompilation = recipeIntegrity.value;
  const { collection, materializations } = recipeInputs(recipeCompilation);
  const recipeTemplate = recipeCompilation.compileRequest.template;
  const compositionTemplate =
    composition.compositionRequest.optionalFeatureArtifact.selectionRequest.template;
  if (
    composition.templateRef.id !== recipeCompilation.templateRef.id ||
    composition.templateRef.contentVersion !== recipeCompilation.templateRef.contentVersion ||
    composition.templateFingerprint !==
      fingerprintTemplateConditionSelectionTemplate(recipeTemplate) ||
    recipeCompilation.templateRef.fingerprint !==
      fingerprintModePatientTemplateHorizonTemplate(compositionTemplate)
  ) {
    return {
      ok: false,
      result: fail(
        'TEMPLATE_CONTEXT_MISMATCH',
        'D-311 requires the D-208 composition and D-320 result recipe to retain the same exact patient template.',
        [
          composition.id,
          composition.templateRef.id,
          recipeCompilation.id,
          recipeCompilation.templateRef.id,
        ],
      ),
    };
  }
  const materializationIds = materializations.map((materialization) => materialization.id);
  const measurementIds = [
    ...collection.measurements.map((measurement) => measurement.id),
    ...materializations.map((materialization) => materialization.resolvedMeasurement.id),
  ];
  if (
    new Set(materializationIds).size !== materializationIds.length ||
    new Set(measurementIds).size !== measurementIds.length
  ) {
    return {
      ok: false,
      result: fail(
        'DUPLICATE_RESULT_RECORD',
        'D-311 cannot attach a repeated D-317 artifact or a derived measurement that collides with another result record.',
        [...materializationIds, ...measurementIds],
      ),
    };
  }
  if (measurementIds.length > 128) {
    return {
      ok: false,
      result: fail(
        'RESULT_LANE_CAPACITY_EXCEEDED',
        'D-311 cannot attach more than 128 total measurement records.',
        measurementIds,
      ),
    };
  }
  const basePatientState = composition.composedPatientState;
  if (collection.patientStateId !== basePatientState.id) {
    return {
      ok: false,
      result: fail(
        'PATIENT_STATE_CONTEXT_MISMATCH',
        `${collection.id} targets ${collection.patientStateId}, not composed patient state ${basePatientState.id}.`,
        [composition.id, collection.id, collection.patientStateId, basePatientState.id],
      ),
    };
  }
  if (
    basePatientState.measurements.length > 0 ||
    basePatientState.categoricalObservations.length > 0 ||
    basePatientState.structuredTestResults.length > 0
  ) {
    return {
      ok: false,
      result: fail(
        'PREEXISTING_RESULT_LANE',
        'D-311 requires empty D-208 result lanes so D-310 remains their only auditable owner.',
        [
          composition.id,
          basePatientState.id,
          ...basePatientState.measurements.map((record) => record.id),
          ...basePatientState.categoricalObservations.map((record) => record.id),
          ...basePatientState.structuredTestResults.map((record) => record.id),
        ],
      ),
    };
  }
  return {
    ok: true,
    value: {
      request: {
        ...request,
        patientStateCompositionArtifact: composition,
        templateClinicalResultRecipeCompilation: recipeCompilation,
      },
      basePatientState,
    },
  };
};

const attachedRecordIds = (
  request: PatientClinicalResultAttachmentRequest,
): PatientClinicalResultAttachmentArtifact['attachedRecordIds'] => {
  const { collection, materializations } = recipeInputs(
    request.templateClinicalResultRecipeCompilation,
  );
  return {
    measurementIds: [
      ...collection.measurements,
      ...materializations.map((materialization) => materialization.resolvedMeasurement),
    ]
      .map((record) => record.id)
      .sort(compareStrings),
    categoricalObservationIds: collection.categoricalObservations.map((record) => record.id),
    structuredTestResultIds: collection.structuredTestResults.map((record) => record.id),
  };
};

const buildAttachedPatientState = (
  request: PatientClinicalResultAttachmentRequest,
  basePatientState: ResolvedPatientState,
): {
  readonly state: ResolvedPatientState;
  readonly fingerprint: PatientClinicalResultAttachmentFingerprint;
} => {
  const { collection, materializations } = recipeInputs(
    request.templateClinicalResultRecipeCompilation,
  );
  const measurements = [
    ...collection.measurements,
    ...materializations.map((materialization) => materialization.resolvedMeasurement),
  ].sort((left, right) => compareStrings(left.id, right.id));
  const stateWithoutId: Omit<ResolvedPatientState, 'id'> = {
    ...basePatientState,
    measurements,
    categoricalObservations: collection.categoricalObservations,
    structuredTestResults: collection.structuredTestResults,
  };
  const stateFingerprint = fingerprint('patient-state', {
    basePatientStateRef: {
      id: basePatientState.id,
      fingerprint: request.patientStateCompositionArtifact.composedPatientStateFingerprint,
    },
    resultCollectionRef: {
      id: collection.id,
      inputFingerprint: collection.inputFingerprint,
      payloadFingerprint: collection.payloadFingerprint,
    },
    templateClinicalResultRecipeCompilationRef: {
      id: request.templateClinicalResultRecipeCompilation.id,
      payloadFingerprint: request.templateClinicalResultRecipeCompilation.payloadFingerprint,
    },
    derivedMeasurementMaterializationRefs: materializations.map((materialization) => ({
      id: materialization.id,
      payloadFingerprint: materialization.payloadFingerprint,
      resolvedMeasurementId: materialization.resolvedMeasurement.id,
    })),
    patientStateBody: stateWithoutId,
  });
  return {
    state: ResolvedPatientStateSchema.parse({
      ...stateWithoutId,
      id: `resolved-patient-state.clinical-results.${stateFingerprint.slice(-16)}`,
    }),
    fingerprint: stateFingerprint,
  };
};

const artifactPayload = (
  artifact: Omit<PatientClinicalResultAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  patientStateCompositionRef: artifact.patientStateCompositionRef,
  basePatientStateRef: artifact.basePatientStateRef,
  templateClinicalResultRecipeCompilationRef: artifact.templateClinicalResultRecipeCompilationRef,
  resultCollectionRef: artifact.resultCollectionRef,
  derivedMeasurementMaterializationRefs: artifact.derivedMeasurementMaterializationRefs,
  attachedRecordIds: artifact.attachedRecordIds,
  composedPatientState: artifact.composedPatientState,
  composedPatientStateFingerprint: artifact.composedPatientStateFingerprint,
  attachmentRequest: artifact.attachmentRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const attachPatientClinicalResults = (
  input: unknown,
): PatientClinicalResultAttachmentResult => {
  const parsed = PatientClinicalResultAttachmentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }
  const verified = verifyInputs(parsed.data);
  if (!verified.ok) return verified.result;
  const { request, basePatientState } = verified.value;

  try {
    const attached = buildAttachedPatientState(request, basePatientState);
    const composition = request.patientStateCompositionArtifact;
    const recipeCompilation = request.templateClinicalResultRecipeCompilation;
    const { collection, materializations } = recipeInputs(recipeCompilation);
    const inputFingerprint = fingerprint('input', request);
    const withoutIdentity = {
      schemaVersion: 1 as const,
      compilerVersion: PATIENT_CLINICAL_RESULT_ATTACHMENT_COMPILER_VERSION,
      requestId: request.id,
      patientStateCompositionRef: {
        id: composition.id,
        payloadFingerprint: composition.payloadFingerprint,
        composedPatientStateFingerprint: composition.composedPatientStateFingerprint!,
      },
      basePatientStateRef: {
        id: basePatientState.id,
        fingerprint: composition.composedPatientStateFingerprint!,
      },
      templateClinicalResultRecipeCompilationRef: {
        id: recipeCompilation.id,
        payloadFingerprint: recipeCompilation.payloadFingerprint,
        templateRef: recipeCompilation.templateRef,
        recipeRef: recipeCompilation.recipeRef,
      },
      resultCollectionRef: {
        id: collection.id,
        inputFingerprint: collection.inputFingerprint,
        payloadFingerprint: collection.payloadFingerprint,
      },
      derivedMeasurementMaterializationRefs: materializations.map((materialization) => ({
        id: materialization.id,
        payloadFingerprint: materialization.payloadFingerprint,
        resolvedMeasurementId: materialization.resolvedMeasurement.id,
      })),
      attachedRecordIds: attachedRecordIds(request),
      composedPatientState: attached.state,
      composedPatientStateFingerprint: attached.fingerprint,
      attachmentRequest: request,
      inputFingerprint,
    };
    const payloadFingerprint = fingerprint('payload', artifactPayload(withoutIdentity));
    const output = PatientClinicalResultAttachmentArtifactSchema.safeParse({
      ...withoutIdentity,
      id: `patient-clinical-result-attachment.${payloadFingerprint.slice(-16)}`,
      payloadFingerprint,
    });
    if (!output.success) {
      return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
        request.id,
        basePatientState.id,
        recipeCompilation.id,
        collection.id,
        ...materializations.map((materialization) => materialization.id),
      ]);
    }
    return { ok: true, value: output.data };
  } catch (error) {
    return fail('INVALID_OUTPUT', error instanceof Error ? error.message : String(error), [
      request.id,
      basePatientState.id,
      request.templateClinicalResultRecipeCompilation.id,
    ]);
  }
};

export const verifyPatientClinicalResultAttachmentIntegrity = (
  input: unknown,
): PatientClinicalResultAttachmentIntegrityResult => {
  const parsed = PatientClinicalResultAttachmentArtifactSchema.safeParse(input);
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
  if (artifact.compilerVersion !== PATIENT_CLINICAL_RESULT_ATTACHMENT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${artifact.id} uses unsupported patient clinical-result attachment compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', artifact.attachmentRequest);
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not retain its exact attachment request.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('payload', artifactPayload(artifact));
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `patient-clinical-result-attachment.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its frozen attachment payload.`,
      },
    };
  }
  const replay = attachPatientClinicalResults(artifact.attachmentRequest);
  if (!replay.ok || !sameExactValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained D-208 composition, D-310 collection, and D-317 materializations do not reproduce the exact attached state.',
      },
    };
  }
  return { ok: true, value: artifact };
};
