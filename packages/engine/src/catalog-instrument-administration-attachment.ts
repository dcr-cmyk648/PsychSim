import {
  CatalogInstrumentAdministrationAttachmentArtifactSchema,
  CatalogInstrumentAdministrationAttachmentCompileRequestSchema,
  type CatalogCompiledInstanceSnapshot,
  type CatalogInstrumentAdministrationAttachmentArtifact,
  type CatalogInstrumentAdministrationAttachmentCompileRequest,
  type CatalogInstrumentAdministrationAttachmentFingerprint,
} from '@psychsim/schemas';

import { verifyCatalogCompiledInstanceIntegrity } from './catalog-instance-compiler';
import {
  compileInstrumentAdministrationAttachment,
  type InstrumentAdministrationAttachmentErrorCode,
} from './instrument-administration-attachment';
import { verifyInstrumentAdministrationSourceValidationIntegrity } from './instrument-administration-source-validation';

export const CATALOG_INSTRUMENT_ADMINISTRATION_ATTACHMENT_COMPILER_VERSION = '2.0.0';

export type CatalogInstrumentAdministrationAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'CATALOG_SNAPSHOT_INVALID'
  | 'ADMINISTRATION_SOURCE_VALIDATION_INVALID'
  | 'ITEM_RESPONSE_COMPILATION_MISMATCH'
  | `ATTACHMENT_${InstrumentAdministrationAttachmentErrorCode}`
  | 'INVALID_OUTPUT';

export type CatalogInstrumentAdministrationAttachmentResult =
  | { readonly ok: true; readonly value: CatalogInstrumentAdministrationAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: CatalogInstrumentAdministrationAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type CatalogInstrumentAdministrationAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: CatalogInstrumentAdministrationAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'REPLAY_FAILED'
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

const fingerprint = (
  scope: string,
  value: unknown,
): CatalogInstrumentAdministrationAttachmentFingerprint =>
  `fingerprint.catalog-instrument-administration-attachment.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const stableId = (prefix: string, value: unknown): string =>
  `${prefix}.${hashToHex64(JSON.stringify(canonicalizeObjectKeys(value)))}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: CatalogInstrumentAdministrationAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): CatalogInstrumentAdministrationAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const deriveAttachmentContext = (snapshot: CatalogCompiledInstanceSnapshot) => ({
  schemaVersion: 1 as const,
  id: stableId('instrument-administration-attachment-context', {
    catalogSnapshotId: snapshot.id,
    catalogSnapshotPayloadFingerprint: snapshot.payloadFingerprint,
  }),
  patientStateId: snapshot.patientInstance.patientState.id,
  informationActionIds: [
    ...snapshot.encounterInstance.decisionActionHorizon.informationActionIds,
  ].sort(compareStrings),
  instrumentItemResponses: [...snapshot.patientInstance.instrumentItemResponses].sort(
    (left, right) => compareStrings(left.id, right.id),
  ),
});

const artifactPayload = (
  artifact: Omit<CatalogInstrumentAdministrationAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

export const compileCatalogInstrumentAdministrationAttachment = (
  input: unknown,
): CatalogInstrumentAdministrationAttachmentResult => {
  const parsed = CatalogInstrumentAdministrationAttachmentCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }

  const verifiedSnapshot = verifyCatalogCompiledInstanceIntegrity(parsed.data.catalogSnapshot);
  if (!verifiedSnapshot.ok) {
    return fail('CATALOG_SNAPSHOT_INVALID', verifiedSnapshot.error.message, [
      parsed.data.catalogSnapshot.id,
    ]);
  }
  const verifiedSourceValidation = verifyInstrumentAdministrationSourceValidationIntegrity(
    parsed.data.administrationSourceValidation,
  );
  if (!verifiedSourceValidation.ok) {
    return fail(
      'ADMINISTRATION_SOURCE_VALIDATION_INVALID',
      verifiedSourceValidation.error.message,
      [parsed.data.administrationSourceValidation.id],
    );
  }
  const verifiedAdministration =
    verifiedSourceValidation.value.compileRequest.administrationCompilation;
  if (
    !sameExactValue(
      verifiedAdministration.compileRequest.instrumentItemResponseCompilation,
      verifiedSnapshot.value.instrumentItemResponseCompilation,
    )
  ) {
    return fail(
      'ITEM_RESPONSE_COMPILATION_MISMATCH',
      `${verifiedAdministration.id} does not embed the exact D-220 artifact retained by ${verifiedSnapshot.value.id}.`,
      [
        verifiedAdministration.id,
        verifiedAdministration.instrumentItemResponseCompilationRef.id,
        verifiedSnapshot.value.id,
        verifiedSnapshot.value.instrumentItemResponseCompilation.id,
      ],
    );
  }

  const request: CatalogInstrumentAdministrationAttachmentCompileRequest = {
    ...parsed.data,
    catalogSnapshot: verifiedSnapshot.value,
    administrationSourceValidation: verifiedSourceValidation.value,
  };
  const context = deriveAttachmentContext(verifiedSnapshot.value);
  const administrationAttachment = compileInstrumentAdministrationAttachment({
    schemaVersion: 1,
    id: stableId('instrument-administration-attachment-request', {
      catalogSnapshotId: verifiedSnapshot.value.id,
      administrationSourceValidationId: verifiedSourceValidation.value.id,
    }),
    attachmentContext: context,
    administrationSourceValidation: verifiedSourceValidation.value,
  });
  if (!administrationAttachment.ok) {
    return fail(
      `ATTACHMENT_${administrationAttachment.error.code}`,
      administrationAttachment.error.message,
      [
        verifiedSnapshot.value.id,
        verifiedSourceValidation.value.id,
        ...administrationAttachment.error.contentIds,
      ],
    );
  }

  const inputFingerprint = fingerprint('input', request);
  const payload: Omit<
    CatalogInstrumentAdministrationAttachmentArtifact,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    compilerVersion: CATALOG_INSTRUMENT_ADMINISTRATION_ATTACHMENT_COMPILER_VERSION,
    requestId: request.id,
    status: 'complete',
    catalogSnapshotRef: {
      id: verifiedSnapshot.value.id,
      payloadFingerprint: verifiedSnapshot.value.payloadFingerprint,
    },
    administrationSourceValidationRef: {
      id: verifiedSourceValidation.value.id,
      payloadFingerprint: verifiedSourceValidation.value.payloadFingerprint,
    },
    administrationAttachment: administrationAttachment.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('compiler-output', artifactPayload(payload));
  const artifact = CatalogInstrumentAdministrationAttachmentArtifactSchema.safeParse({
    ...payload,
    id: `catalog-instrument-administration-attachment.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      request.id,
      verifiedSnapshot.value.id,
      verifiedSourceValidation.value.id,
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyCatalogInstrumentAdministrationAttachmentIntegrity = (
  value: unknown,
): CatalogInstrumentAdministrationAttachmentIntegrityResult => {
  const parsed = CatalogInstrumentAdministrationAttachmentArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  if (
    parsed.data.compilerVersion !== CATALOG_INSTRUMENT_ADMINISTRATION_ATTACHMENT_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported catalog administration-attachment compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileCatalogInstrumentAdministrationAttachment(parsed.data.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: replay.error.message,
      },
    };
  }
  if (!sameExactValue(replay.value, parsed.data)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: `${parsed.data.id} does not match deterministic replay of its exact catalog attachment request.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
