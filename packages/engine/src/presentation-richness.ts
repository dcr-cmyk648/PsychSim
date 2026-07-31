import {
  CatalogInstanceVersionedReferenceSchema,
  PRESENTATION_RICHNESS_RECORD_DOMAINS,
  PresentationRichnessEnvelopeSchema,
  PresentationRichnessEvaluationSchema,
  ResolvedPatientStateSchema,
  type CatalogInstanceVersionedReference,
  type PresentationPriorEffortContribution,
  type PresentationPriorEffortEvaluation,
  type PresentationRichnessDiagnostic,
  type PresentationRichnessDomainCount,
  type PresentationRichnessEnvelope,
  type PresentationRichnessEvaluation,
  type PresentationRichnessFingerprint,
  type PresentationRichnessRecordDomain,
  type ResolvedPatientState,
} from '@psychsim/schemas';

import { fingerprintDecisionPatientState } from './decision-policy';

export const PRESENTATION_RICHNESS_EVALUATOR_VERSION = '1.0.0';

export interface PresentationRichnessEvaluationInput {
  readonly templateRef: CatalogInstanceVersionedReference;
  readonly envelope: PresentationRichnessEnvelope;
  readonly patientState: ResolvedPatientState;
}

export type PresentationRichnessEvaluationResult =
  | { readonly ok: true; readonly value: PresentationRichnessEvaluation }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_INPUT' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type PresentationRichnessIntegrityResult =
  | { readonly ok: true; readonly value: PresentationRichnessEvaluation }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_EVALUATOR_VERSION'
          | 'ENVELOPE_FINGERPRINT_MISMATCH'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type PresentationRichnessContextResult =
  | { readonly ok: true; readonly value: PresentationRichnessEvaluation }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_EVALUATION' | 'CONTEXT_MISMATCH';
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

const fingerprint = (scope: string, value: unknown): PresentationRichnessFingerprint =>
  `fingerprint.presentation-richness.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const normalizeEnvelope = (envelope: PresentationRichnessEnvelope): PresentationRichnessEnvelope =>
  PresentationRichnessEnvelopeSchema.parse({
    ...envelope,
    decisionDriverCategories: [...envelope.decisionDriverCategories].sort(compareStrings),
  });

const domainIds = (
  patientState: ResolvedPatientState,
  domain: PresentationRichnessRecordDomain,
): string[] => {
  switch (domain) {
    case 'internal_condition':
      return patientState.conditionStates.map((record) => record.id);
    case 'chart_diagnosis':
      return patientState.diagnosisRecordEntries.map((record) => record.id);
    case 'current_regimen_entry':
      return patientState.medicationRegimenEntries.map((record) => record.id);
    case 'exposure':
      return patientState.exposureInventory.useEntries.map((record) => record.id);
    case 'medication_trial':
      return patientState.treatmentHistory.medicationTrials.map((record) => record.id);
    case 'psychotherapy_trial':
      return patientState.treatmentHistory.psychotherapyTrials.map((record) => record.id);
    case 'current_provider':
      return patientState.treatmentHistory.currentProviders.map((record) => record.id);
    case 'prior_level_of_care':
      return patientState.treatmentHistory.priorLevelsOfCare.map((record) => record.id);
    case 'reaction_record':
      return patientState.reactionHistory.records.map((record) => record.id);
    case 'canonical_finding':
      return patientState.canonicalFindings.map((record) => record.id);
  }
};

const collectDomainCounts = (
  patientState: ResolvedPatientState,
): PresentationRichnessDomainCount[] =>
  PRESENTATION_RICHNESS_RECORD_DOMAINS.map((domain) => {
    const recordIds = uniqueSorted(domainIds(patientState, domain));
    return {
      domain,
      recordCount: recordIds.length,
      recordIds,
    };
  });

const collectPriorEffortContributions = (
  patientState: ResolvedPatientState,
): PresentationPriorEffortContribution[] =>
  [
    ...patientState.treatmentHistory.medicationTrials.map((record) => ({
      kind: 'medication_trial' as const,
      recordId: record.id,
      effortUnits: 1,
    })),
    ...patientState.treatmentHistory.psychotherapyTrials.map((record) => ({
      kind: 'psychotherapy_trial' as const,
      recordId: record.id,
      effortUnits: 1,
    })),
    ...patientState.treatmentHistory.currentProviders.map((record) => ({
      kind: 'current_provider' as const,
      recordId: record.id,
      effortUnits: 1,
    })),
    ...patientState.treatmentHistory.priorLevelsOfCare.map((record) => ({
      kind: 'prior_level_of_care' as const,
      recordId: record.id,
      effortUnits: record.occurrenceCount,
    })),
  ].sort((left, right) =>
    compareStrings(`${left.kind}\u0000${left.recordId}`, `${right.kind}\u0000${right.recordId}`),
  );

const evaluatePriorEffort = (
  envelope: PresentationRichnessEnvelope,
  patientState: ResolvedPatientState,
): {
  readonly evaluation: PresentationPriorEffortEvaluation;
  readonly diagnostics: PresentationRichnessDiagnostic[];
} => {
  const contributions = collectPriorEffortContributions(patientState);
  const totalEffortUnits = contributions.reduce(
    (total, contribution) => total + contribution.effortUnits,
    0,
  );
  const expectation = envelope.priorEffortExpectation;
  const status: PresentationPriorEffortEvaluation['status'] =
    expectation.kind === 'not_required'
      ? 'not_required'
      : expectation.kind === 'multiple_expected'
        ? totalEffortUnits >= expectation.minimumEffortUnits
          ? 'met'
          : 'unmet'
        : totalEffortUnits === 0
          ? 'exception_applied'
          : 'exception_inconsistent';
  const diagnostics: PresentationRichnessDiagnostic[] =
    status === 'unmet'
      ? [
          {
            code: 'prior_effort_expectation_unmet',
            impact: 'nonblocking',
            contentIds: uniqueSorted([
              envelope.id,
              ...contributions.map((contribution) => contribution.recordId),
            ]),
            message: `The template expected at least ${expectation.kind === 'multiple_expected' ? expectation.minimumEffortUnits : 0} structured prior-effort units, but the frozen patient contains ${totalEffortUnits}.`,
          },
        ]
      : status === 'exception_inconsistent'
        ? [
            {
              code: 'treatment_naive_exception_has_prior_efforts',
              impact: 'nonblocking',
              contentIds: uniqueSorted([
                envelope.id,
                ...contributions.map((contribution) => contribution.recordId),
              ]),
              message: `The treatment-naive exception is retained for review, but the frozen patient contains ${totalEffortUnits} structured prior-effort units.`,
            },
          ]
        : [];
  return {
    evaluation: {
      expectation,
      status,
      totalEffortUnits,
      contributions,
    },
    diagnostics,
  };
};

const inputFingerprintPayload = (evaluation: {
  readonly templateRef: CatalogInstanceVersionedReference;
  readonly envelopeFingerprint: PresentationRichnessFingerprint;
  readonly patientStateId: string;
  readonly patientStateFingerprint: PresentationRichnessEvaluation['patientStateFingerprint'];
}): unknown => ({
  templateRef: evaluation.templateRef,
  envelopeFingerprint: evaluation.envelopeFingerprint,
  patientStateId: evaluation.patientStateId,
  patientStateFingerprint: evaluation.patientStateFingerprint,
});

const payloadFingerprintPayload = (
  evaluation: Omit<PresentationRichnessEvaluation, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: evaluation.schemaVersion,
  evaluatorVersion: evaluation.evaluatorVersion,
  templateRef: evaluation.templateRef,
  envelope: evaluation.envelope,
  envelopeFingerprint: evaluation.envelopeFingerprint,
  patientStateId: evaluation.patientStateId,
  patientStateFingerprint: evaluation.patientStateFingerprint,
  domainCounts: evaluation.domainCounts,
  priorEffort: evaluation.priorEffort,
  diagnostics: evaluation.diagnostics,
  inputFingerprint: evaluation.inputFingerprint,
});

export const evaluatePresentationRichness = (
  input: PresentationRichnessEvaluationInput,
): PresentationRichnessEvaluationResult => {
  const templateRefResult = CatalogInstanceVersionedReferenceSchema.safeParse(input.templateRef);
  const envelopeResult = PresentationRichnessEnvelopeSchema.safeParse(input.envelope);
  const patientStateResult = ResolvedPatientStateSchema.safeParse(input.patientState);
  if (!templateRefResult.success || !envelopeResult.success || !patientStateResult.success) {
    const errors = [
      ...(templateRefResult.success ? [] : templateRefResult.error.issues),
      ...(envelopeResult.success ? [] : envelopeResult.error.issues),
      ...(patientStateResult.success ? [] : patientStateResult.error.issues),
    ];
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: issuesText(errors),
      },
    };
  }

  const templateRef = templateRefResult.data;
  const envelope = normalizeEnvelope(envelopeResult.data);
  const patientState = patientStateResult.data;
  const envelopeFingerprint = fingerprint('envelope', envelope);
  const patientStateFingerprint = fingerprintDecisionPatientState(patientState);
  const priorEffortResult = evaluatePriorEffort(envelope, patientState);
  const inputFingerprint = fingerprint(
    'input',
    inputFingerprintPayload({
      templateRef,
      envelopeFingerprint,
      patientStateId: patientState.id,
      patientStateFingerprint,
    }),
  );
  const evaluationWithoutIdentity = {
    schemaVersion: 1 as const,
    evaluatorVersion: PRESENTATION_RICHNESS_EVALUATOR_VERSION,
    templateRef,
    envelope,
    envelopeFingerprint,
    patientStateId: patientState.id,
    patientStateFingerprint,
    domainCounts: collectDomainCounts(patientState),
    priorEffort: priorEffortResult.evaluation,
    diagnostics: priorEffortResult.diagnostics,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'output',
    payloadFingerprintPayload(evaluationWithoutIdentity),
  );
  const parsed = PresentationRichnessEvaluationSchema.safeParse({
    ...evaluationWithoutIdentity,
    id: `presentation-richness-evaluation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  return { ok: true, value: parsed.data };
};

export const verifyPresentationRichnessIntegrity = (
  value: unknown,
): PresentationRichnessIntegrityResult => {
  const parsed = PresentationRichnessEvaluationSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const evaluation = parsed.data;
  if (evaluation.evaluatorVersion !== PRESENTATION_RICHNESS_EVALUATOR_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_EVALUATOR_VERSION',
        message: `${evaluation.id} uses unsupported presentation-richness evaluator ${evaluation.evaluatorVersion}.`,
      },
    };
  }
  const expectedEnvelopeFingerprint = fingerprint('envelope', evaluation.envelope);
  if (evaluation.envelopeFingerprint !== expectedEnvelopeFingerprint) {
    return {
      ok: false,
      error: {
        code: 'ENVELOPE_FINGERPRINT_MISMATCH',
        message: `${evaluation.envelope.id} does not match its frozen richness-envelope fingerprint.`,
      },
    };
  }
  const expectedInputFingerprint = fingerprint('input', inputFingerprintPayload(evaluation));
  if (evaluation.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${evaluation.id} does not match its exact template, envelope, and patient-state input context.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint('output', payloadFingerprintPayload(evaluation));
  if (
    evaluation.payloadFingerprint !== expectedPayloadFingerprint ||
    evaluation.id !== `presentation-richness-evaluation.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${evaluation.id} does not match its frozen presentation-richness payload.`,
      },
    };
  }
  return { ok: true, value: evaluation };
};

export const verifyPresentationRichnessContext = (input: {
  readonly evaluation: unknown;
  readonly templateRef: CatalogInstanceVersionedReference;
  readonly envelope: PresentationRichnessEnvelope;
  readonly patientState: ResolvedPatientState;
}): PresentationRichnessContextResult => {
  const integrity = verifyPresentationRichnessIntegrity(input.evaluation);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_EVALUATION',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = evaluatePresentationRichness({
    templateRef: input.templateRef,
    envelope: input.envelope,
    patientState: input.patientState,
  });
  if (!expected.ok) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  if (
    JSON.stringify(canonicalizeObjectKeys(integrity.value)) !==
    JSON.stringify(canonicalizeObjectKeys(expected.value))
  ) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: `${integrity.value.id} does not match a deterministic evaluation of its exact template envelope and patient state.`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
