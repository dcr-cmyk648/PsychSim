import {
  FrozenGeneratedWaitingSlotLauncherPresentationSchema,
  GeneratedWaitingSlotLauncherPresentationAttachmentArtifactSchema,
  GeneratedWaitingSlotLauncherPresentationAttachmentCompileRequestSchema,
  type FrozenGeneratedWaitingSlotLauncherPresentation,
  type GeneratedWaitingSlotLauncherPresentationAttachmentArtifact,
  type GeneratedWaitingSlotLauncherPresentationAttachmentCompileRequest,
  type GeneratedWaitingSlotLauncherPresentationFingerprint,
} from '@psychsim/schemas';

import {
  compileCatalogPatientLauncherPresentationAttachment,
  verifyCatalogPatientLauncherPresentationAttachmentIntegrity,
  type CatalogPatientLauncherPresentationAttachmentErrorCode,
} from './catalog-patient-launcher-presentation-attachment';
import { verifyEmptyAuthorizedPatientSlotFillIntegrity } from './empty-authorized-patient-slot-fill-compiler';

export const GENERATED_WAITING_SLOT_LAUNCHER_PRESENTATION_ATTACHMENT_COMPILER_VERSION = '1.0.0';

export type GeneratedWaitingSlotLauncherPresentationAttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'PATIENT_SLOT_FILL_INVALID'
  | 'PATIENT_SLOT_FILL_NOT_FILLED'
  | `CATALOG_PRESENTATION_${CatalogPatientLauncherPresentationAttachmentErrorCode}`
  | 'CATALOG_PRESENTATION_INVALID'
  | 'INVALID_OUTPUT';

export type GeneratedWaitingSlotLauncherPresentationAttachmentResult =
  | {
      readonly ok: true;
      readonly value: GeneratedWaitingSlotLauncherPresentationAttachmentArtifact;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: GeneratedWaitingSlotLauncherPresentationAttachmentErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type GeneratedWaitingSlotLauncherPresentationAttachmentIntegrityResult =
  | {
      readonly ok: true;
      readonly value: GeneratedWaitingSlotLauncherPresentationAttachmentArtifact;
    }
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
): GeneratedWaitingSlotLauncherPresentationFingerprint =>
  `fingerprint.generated-waiting-slot-launcher-presentation.${scope}.fnv1a64.${hashToHex64(
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
  code: GeneratedWaitingSlotLauncherPresentationAttachmentErrorCode,
  message: string,
  contentIds: readonly string[],
): GeneratedWaitingSlotLauncherPresentationAttachmentResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const frozenPresentationPayload = (
  value: Omit<FrozenGeneratedWaitingSlotLauncherPresentation, 'id' | 'payloadFingerprint'>,
): unknown => value;

const artifactPayload = (
  value: Omit<
    GeneratedWaitingSlotLauncherPresentationAttachmentArtifact,
    'id' | 'payloadFingerprint'
  >,
): unknown => value;

export const compileGeneratedWaitingSlotLauncherPresentationAttachment = (
  input: unknown,
): GeneratedWaitingSlotLauncherPresentationAttachmentResult => {
  const parsed =
    GeneratedWaitingSlotLauncherPresentationAttachmentCompileRequestSchema.safeParse(input);
  if (!parsed.success) return fail('INVALID_REQUEST', issuesText(parsed.error.issues), []);

  const verifiedFill = verifyEmptyAuthorizedPatientSlotFillIntegrity(
    parsed.data.patientSlotFillArtifact,
  );
  if (!verifiedFill.ok) {
    return fail('PATIENT_SLOT_FILL_INVALID', verifiedFill.error.message, [
      parsed.data.patientSlotFillArtifact.id,
    ]);
  }
  const fill = verifiedFill.value;
  const waitingSlot = fill.frozenWaitingSlotProposal;
  const catalogSnapshot = fill.findingPipelineAuditArtifact?.catalogSnapshot ?? null;
  if (fill.status !== 'filled' || waitingSlot === null || catalogSnapshot === null) {
    return fail(
      'PATIENT_SLOT_FILL_NOT_FILLED',
      `${fill.id} does not contain one complete frozen waiting patient.`,
      [fill.id, ...fill.diagnostics.flatMap((diagnostic) => diagnostic.contentIds)],
    );
  }

  const catalogPresentation = compileCatalogPatientLauncherPresentationAttachment({
    schemaVersion: 1,
    id: stableId('catalog-patient-launcher-presentation-request.d333', {
      requestId: parsed.data.id,
      fillArtifactId: fill.id,
      fillArtifactPayloadFingerprint: fill.payloadFingerprint,
      waitingSlotId: waitingSlot.id,
      presentationProfileRef: {
        id: parsed.data.presentationProfile.id,
        contentVersion: parsed.data.presentationProfile.contentVersion,
      },
    }),
    catalogSnapshot,
    presentationProfile: parsed.data.presentationProfile,
    firstNamePool: parsed.data.firstNamePool,
    lastNamePool: parsed.data.lastNamePool,
    complaintBanks: parsed.data.complaintBanks,
  });
  if (!catalogPresentation.ok) {
    return fail(
      `CATALOG_PRESENTATION_${catalogPresentation.error.code}`,
      catalogPresentation.error.message,
      [fill.id, waitingSlot.id, ...catalogPresentation.error.contentIds],
    );
  }
  const verifiedCatalogPresentation = verifyCatalogPatientLauncherPresentationAttachmentIntegrity(
    catalogPresentation.value,
  );
  if (!verifiedCatalogPresentation.ok) {
    return fail('CATALOG_PRESENTATION_INVALID', verifiedCatalogPresentation.error.message, [
      fill.id,
      waitingSlot.id,
      catalogPresentation.value.id,
    ]);
  }

  const normalizedD287Request = verifiedCatalogPresentation.value.compileRequest;
  const request: GeneratedWaitingSlotLauncherPresentationAttachmentCompileRequest = {
    schemaVersion: 1,
    id: parsed.data.id,
    patientSlotFillArtifact: fill,
    presentationProfile: normalizedD287Request.presentationProfile,
    firstNamePool: normalizedD287Request.firstNamePool,
    lastNamePool: normalizedD287Request.lastNamePool,
    complaintBanks: normalizedD287Request.complaintBanks,
  };
  const inputFingerprint = fingerprint('input', request);
  const patientInstance = catalogSnapshot.patientInstance;
  const frozenWithoutIdentity = {
    schemaVersion: 1 as const,
    waitingSlotRef: {
      id: waitingSlot.id,
    },
    patientInstanceRef: {
      id: patientInstance.id,
      payloadFingerprint: patientInstance.payloadFingerprint,
    },
    resolvedPresentation:
      verifiedCatalogPresentation.value.presentationResolution.resolvedPresentation,
  };
  const frozenPayloadFingerprint = fingerprint(
    'frozen-presentation',
    frozenPresentationPayload(frozenWithoutIdentity),
  );
  const frozenPresentation = FrozenGeneratedWaitingSlotLauncherPresentationSchema.safeParse({
    ...frozenWithoutIdentity,
    id: `frozen-generated-waiting-slot-launcher-presentation.${frozenPayloadFingerprint.slice(-16)}`,
    payloadFingerprint: frozenPayloadFingerprint,
  });
  if (!frozenPresentation.success) {
    return fail('INVALID_OUTPUT', issuesText(frozenPresentation.error.issues), [
      fill.id,
      waitingSlot.id,
      verifiedCatalogPresentation.value.id,
    ]);
  }

  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: GENERATED_WAITING_SLOT_LAUNCHER_PRESENTATION_ATTACHMENT_COMPILER_VERSION,
    requestId: request.id,
    status: 'complete' as const,
    patientSlotFillArtifactRef: {
      id: fill.id,
      inputFingerprint: fill.inputFingerprint,
      payloadFingerprint: fill.payloadFingerprint,
    },
    catalogPresentationAttachmentRef: {
      id: verifiedCatalogPresentation.value.id,
      payloadFingerprint: verifiedCatalogPresentation.value.payloadFingerprint,
    },
    catalogPresentationAttachment: verifiedCatalogPresentation.value,
    frozenPresentation: frozenPresentation.data,
    compileRequest: request,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint('compiler-output', artifactPayload(withoutIdentity));
  const artifact = GeneratedWaitingSlotLauncherPresentationAttachmentArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `generated-waiting-slot-launcher-presentation-attachment.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!artifact.success) {
    return fail('INVALID_OUTPUT', issuesText(artifact.error.issues), [
      fill.id,
      waitingSlot.id,
      verifiedCatalogPresentation.value.id,
      frozenPresentation.data.id,
    ]);
  }
  return { ok: true, value: artifact.data };
};

export const verifyGeneratedWaitingSlotLauncherPresentationAttachmentIntegrity = (
  value: unknown,
): GeneratedWaitingSlotLauncherPresentationAttachmentIntegrityResult => {
  const parsed = GeneratedWaitingSlotLauncherPresentationAttachmentArtifactSchema.safeParse(value);
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
    GENERATED_WAITING_SLOT_LAUNCHER_PRESENTATION_ATTACHMENT_COMPILER_VERSION
  ) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `${parsed.data.id} uses unsupported waiting-slot launcher-presentation attachment compiler ${parsed.data.compilerVersion}.`,
      },
    };
  }
  const replay = compileGeneratedWaitingSlotLauncherPresentationAttachment(
    parsed.data.compileRequest,
  );
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
        message: `${parsed.data.id} does not match deterministic replay of its exact D-331/D-287 request.`,
      },
    };
  }
  return { ok: true, value: parsed.data };
};
