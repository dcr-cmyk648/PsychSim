import {
  CatalogPatientLauncherPresentationAttachmentArtifactSchema,
  CatalogPatientLauncherPresentationAttachmentCompileRequestSchema,
  type CatalogPatientLauncherPresentationAttachmentArtifact,
  type CatalogPatientLauncherPresentationAttachmentCompileRequest,
  type CatalogPatientLauncherPresentationAttachmentFingerprint,
} from '@psychsim/schemas';

import { verifyCatalogCompiledInstanceIntegrity } from './catalog-instance-compiler';
import {
  resolvePatientLauncherPresentation,
  verifyPatientLauncherPresentationResolutionIntegrity,
  type PatientLauncherPresentationResolutionResult,
} from './patient-launcher-presentation-resolver';

export const CATALOG_PATIENT_LAUNCHER_PRESENTATION_ATTACHMENT_COMPILER_VERSION = '1.0.0';

type PresentationResolutionErrorCode = Extract<
  PatientLauncherPresentationResolutionResult,
  { ok: false }
>['error']['code'];

export type CatalogPatientLauncherPresentationAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'CATALOG_SNAPSHOT_INVALID'
  | `PRESENTATION_${PresentationResolutionErrorCode}`
  | 'INVALID_OUTPUT';

export type CatalogPatientLauncherPresentationAttachmentResult =
  | { readonly ok: true; readonly value: CatalogPatientLauncherPresentationAttachmentArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: CatalogPatientLauncherPresentationAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type CatalogPatientLauncherPresentationAttachmentIntegrityResult =
  | { readonly ok: true; readonly value: CatalogPatientLauncherPresentationAttachmentArtifact }
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
): CatalogPatientLauncherPresentationAttachmentFingerprint =>
  `fingerprint.catalog-patient-launcher-presentation-attachment.${scope}.fnv1a64.${hashToHex64(
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
  code: CatalogPatientLauncherPresentationAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): CatalogPatientLauncherPresentationAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const artifactPayload = (
  artifact: Omit<CatalogPatientLauncherPresentationAttachmentArtifact, 'id' | 'payloadFingerprint'>,
): unknown => artifact;

export const compileCatalogPatientLauncherPresentationAttachment = (
  input: unknown,
): CatalogPatientLauncherPresentationAttachmentResult => {
  const parsed = CatalogPatientLauncherPresentationAttachmentCompileRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);
  }

  const verifiedSnapshot = verifyCatalogCompiledInstanceIntegrity(parsed.data.catalogSnapshot);
  if (!verifiedSnapshot.ok) {
    return fail('CATALOG_SNAPSHOT_INVALID', verifiedSnapshot.error.message, [
      parsed.data.catalogSnapshot.id,
    ]);
  }

  const presentationResolution = resolvePatientLauncherPresentation({
    schemaVersion: 1,
    id: stableId('patient-launcher-presentation-request', {
      attachmentRequestId: parsed.data.id,
      catalogSnapshotId: verifiedSnapshot.value.id,
      catalogSnapshotPayloadFingerprint: verifiedSnapshot.value.payloadFingerprint,
      presentationProfileRef: {
        id: parsed.data.presentationProfile.id,
        contentVersion: parsed.data.presentationProfile.contentVersion,
      },
    }),
    patientStateId: verifiedSnapshot.value.patientInstance.patientState.id,
    seed: verifiedSnapshot.value.patientInstance.seed,
    profile: parsed.data.presentationProfile,
    firstNamePool: parsed.data.firstNamePool,
    lastNamePool: parsed.data.lastNamePool,
    complaintBanks: parsed.data.complaintBanks,
  });
  if (!presentationResolution.ok) {
    return fail(
      `PRESENTATION_${presentationResolution.error.code}`,
      presentationResolution.error.message,
      [
        verifiedSnapshot.value.id,
        parsed.data.presentationProfile.id,
        parsed.data.firstNamePool.id,
        parsed.data.lastNamePool.id,
        ...parsed.data.complaintBanks.map((bank) => bank.id),
      ],
    );
  }
  const verifiedPresentation = verifyPatientLauncherPresentationResolutionIntegrity(
    presentationResolution.value,
  );
  if (!verifiedPresentation.ok) {
    return fail('PRESENTATION_INVALID_OUTPUT', verifiedPresentation.error.message, [
      verifiedSnapshot.value.id,
      presentationResolution.value.id,
    ]);
  }

  const normalizedPresentationRequest = verifiedPresentation.value.resolutionRequest;
  const request: CatalogPatientLauncherPresentationAttachmentCompileRequest = {
    schemaVersion: 1,
    id: parsed.data.id,
    catalogSnapshot: verifiedSnapshot.value,
    presentationProfile: normalizedPresentationRequest.profile,
    firstNamePool: normalizedPresentationRequest.firstNamePool,
    lastNamePool: normalizedPresentationRequest.lastNamePool,
    complaintBanks: normalizedPresentationRequest.complaintBanks,
  };
  const inputFingerprint = fingerprint('input', request);
  const payload: Omit<
    CatalogPatientLauncherPresentationAttachmentArtifact,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    compilerVersion: CATALOG_PATIENT_LAUNCHER_PRESENTATION_ATTACHMENT_COMPILER_VERSION,
    requestId: request.id,
    status: 'complete',
    catalogSnapshotRef: {
      id: verifiedSnapshot.value.id,
      payloadFingerprint: verifiedSnapshot.value.payloadFingerprint,
    },
    presentationResolutionRef: {
      id: verifiedPresentation.value.id,
      payloadFingerprint: verifiedPresentation.value.payloadFingerprint,
    },
    presentationResolution: verifiedPresentation.value,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('compiler-output', artifactPayload(payload));
  const artifact = CatalogPatientLauncherPresentationAttachmentArtifactSchema.safeParse({
    ...payload,
    id: `catalog-patient-launcher-presentation-attachment.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      request.id,
      verifiedSnapshot.value.id,
      verifiedPresentation.value.id,
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyCatalogPatientLauncherPresentationAttachmentIntegrity = (
  value: unknown,
): CatalogPatientLauncherPresentationAttachmentIntegrityResult => {
  const parsed = CatalogPatientLauncherPresentationAttachmentArtifactSchema.safeParse(value);
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
    parsed.data.compilerVersion !==
    CATALOG_PATIENT_LAUNCHER_PRESENTATION_ATTACHMENT_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported catalog launcher-presentation attachment compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileCatalogPatientLauncherPresentationAttachment(parsed.data.compileRequest);
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
        message: `${parsed.data.id} does not match deterministic replay of its exact catalog launcher-presentation request.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
