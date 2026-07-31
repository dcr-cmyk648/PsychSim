import {
  GeneratedEncounterCompletionProofSchema,
  PatientSlotLifecycleTransitionArtifactSchema,
  PatientSlotLifecycleTransitionCompileInputSchema,
  PatientSlotRefillReconciliationArtifactSchema,
  PatientSlotRefillReconciliationCompileInputSchema,
  type DeveloperPatientTemplateRunHistoryEntry,
  type EmptyAuthorizedPatientSlotFillArtifact,
  type GeneratedCompletedEncounterAttempt,
  type GeneratedEncounterCompletionProof,
  type LocationPatientSlotCompletionHistoryState,
  type LocationPatientSlotOccupancySnapshotCompileInput,
  type LocationTemplateSelectionEligibilityMember,
  type PatientSlotCompletionHistoryEntry,
  type PatientSlotLifecycleFingerprint,
  type PatientSlotLifecycleTransitionArtifact,
  type PatientSlotLifecycleTransitionCompileInput,
  type PatientSlotRefillReconciliationArtifact,
  type PatientSlotRefillReconciliationCompileInput,
  type PatientSlotSkippedWaitingRecord,
} from '@psychsim/schemas';

import {
  compileEmptyAuthorizedPatientSlotFill,
  verifyEmptyAuthorizedPatientSlotFillContext,
} from './empty-authorized-patient-slot-fill-compiler';
import { verifyFindingPipelineAuditIntegrity } from './finding-pipeline-audit-composer';
import {
  verifyGeneratedCompletedEncounterAttemptContext,
  verifyGeneratedCompletedEncounterAttemptIntegrity,
} from './generated-completed-attempt-compiler';
import {
  compileLocationPatientSlotOccupancySnapshot,
  fingerprintPatientSlotGenerationRoot,
  getFirstEmptyLocationPatientSlotCoordinateId,
  verifyLocationPatientSlotOccupancySnapshotContext,
} from './patient-slot-fill-seed-authority';
import { enumerateLocationOwnedPatientSlotCandidates } from './location-owned-patient-slot-selection-compiler';
import {
  createLocationTemplateSelectionEligibilityOverlay,
  fingerprintLocationTemplateEligibilitySource,
  verifyLocationTemplateSelectionEligibilityOverlay,
} from './location-template-selector';
import { verifyPatientTemplateLocationAdmissionMatrixContext } from './patient-template-location-admission-compiler';

export const PATIENT_SLOT_LIFECYCLE_TRANSITION_COMPILER_VERSION = '2.0.0';
export const PATIENT_SLOT_REFILL_RECONCILIATION_COMPILER_VERSION = '2.0.0';

type LifecycleCompileErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_OCCUPANCY'
  | 'INVALID_COMPLETION_PROOF'
  | 'CONTEXT_MISMATCH'
  | 'TARGET_SLOT_NOT_OCCUPIED'
  | 'DEVELOPER_TEMPLATE_ALREADY_RUN'
  | 'REFILL_SEQUENCE_MISMATCH'
  | 'REFILL_SEQUENCE_INCOMPLETE'
  | 'REFILL_AFTER_BLOCKER'
  | 'REFILL_COMPILATION_FAILED'
  | 'INVALID_OUTPUT';

export type PatientSlotLifecycleTransitionCompileResult =
  | { readonly ok: true; readonly value: PatientSlotLifecycleTransitionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LifecycleCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type PatientSlotRefillReconciliationCompileResult =
  | { readonly ok: true; readonly value: PatientSlotRefillReconciliationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LifecycleCompileErrorCode;
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

type LifecycleIntegrityErrorCode =
  | 'INVALID_SCHEMA'
  | 'UNSUPPORTED_COMPILER_VERSION'
  | 'REPLAY_FAILED'
  | 'REPLAY_MISMATCH'
  | 'PAYLOAD_FINGERPRINT_MISMATCH';

export type PatientSlotLifecycleTransitionIntegrityResult =
  | { readonly ok: true; readonly value: PatientSlotLifecycleTransitionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LifecycleIntegrityErrorCode;
        readonly message: string;
      };
    };

export type PatientSlotRefillReconciliationIntegrityResult =
  | { readonly ok: true; readonly value: PatientSlotRefillReconciliationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LifecycleIntegrityErrorCode;
        readonly message: string;
      };
    };

type LifecycleContextErrorCode = 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';

export type PatientSlotLifecycleTransitionContextResult =
  | { readonly ok: true; readonly value: PatientSlotLifecycleTransitionArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LifecycleContextErrorCode;
        readonly message: string;
      };
    };

export type PatientSlotRefillReconciliationContextResult =
  | { readonly ok: true; readonly value: PatientSlotRefillReconciliationArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: LifecycleContextErrorCode;
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

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
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

const fingerprint = (scope: string, value: unknown): PatientSlotLifecycleFingerprint =>
  `fingerprint.patient-slot-lifecycle.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const failTransition = (
  code: LifecycleCompileErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): PatientSlotLifecycleTransitionCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const failReconciliation = (
  code: LifecycleCompileErrorCode,
  message: string,
  contentIds: readonly string[] = [],
): PatientSlotRefillReconciliationCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const completionProofPayload = (
  proof: Omit<GeneratedEncounterCompletionProof, 'id' | 'proofFingerprint'>,
): unknown => ({
  schemaVersion: proof.schemaVersion,
  modelVersion: proof.modelVersion,
  attemptRef: proof.attemptRef,
  attemptSnapshot: proof.attemptSnapshot,
  completionEventId: proof.completionEventId,
  waitingSlotId: proof.waitingSlotId,
  patientInstanceRef: proof.patientInstanceRef,
  templateRef: proof.templateRef,
  templateFingerprint: proof.templateFingerprint,
});

export const createGeneratedEncounterCompletionProof = (input: {
  readonly attempt: GeneratedCompletedEncounterAttempt;
  readonly frozenWaitingSlot: PatientSlotCompletionHistoryEntry['frozenWaitingSlot'];
}): GeneratedEncounterCompletionProof => {
  const attemptContext = verifyGeneratedCompletedEncounterAttemptContext({
    attempt: input.attempt,
    frozenWaitingSlot: input.frozenWaitingSlot,
  });
  if (!attemptContext.ok) {
    throw new Error(
      `A completion proof requires the exact native generated attempt for its waiting patient: ${attemptContext.error.message}`,
    );
  }
  const attempt = attemptContext.value;
  const audit = input.frozenWaitingSlot.findingPipelineAuditArtifact;
  if (audit.status !== 'compiled' || audit.catalogSnapshot === null) {
    throw new Error('A completion proof requires one completely compiled waiting patient.');
  }
  const authority = audit.patientSlotFillSeedAuthorityArtifact;
  const patientInstanceRef = {
    id: audit.catalogSnapshot.patientInstance.id,
    payloadFingerprint: audit.catalogSnapshot.patientInstance.payloadFingerprint,
  };
  const withoutIdentity = {
    schemaVersion: 1 as const,
    modelVersion: 'generated-encounter-completion-proof.v2' as const,
    attemptRef: {
      id: attempt.id,
      payloadFingerprint: attempt.payloadFingerprint,
    },
    attemptSnapshot: attempt,
    completionEventId: attempt.terminalCompletionEventId,
    waitingSlotId: input.frozenWaitingSlot.id,
    patientInstanceRef,
    templateRef: authority.selectedTemplateRef,
    templateFingerprint: authority.selectedTemplateFingerprint,
  };
  const proofFingerprint = fingerprint('completion-proof', completionProofPayload(withoutIdentity));
  return GeneratedEncounterCompletionProofSchema.parse({
    ...withoutIdentity,
    id: `generated-encounter-completion-proof.${proofFingerprint.slice(-16)}`,
    proofFingerprint,
  });
};

export const verifyGeneratedEncounterCompletionProof = (
  value: unknown,
):
  | { readonly ok: true; readonly value: GeneratedEncounterCompletionProof }
  | {
      readonly ok: false;
      readonly error: { readonly code: 'INVALID_SCHEMA' | 'FINGERPRINT_MISMATCH'; message: string };
    } => {
  const parsed = GeneratedEncounterCompletionProofSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const proof = parsed.data;
  const attemptIntegrity = verifyGeneratedCompletedEncounterAttemptIntegrity(proof.attemptSnapshot);
  const expectedFingerprint = fingerprint('completion-proof', completionProofPayload(proof));
  const expectedId = `generated-encounter-completion-proof.${expectedFingerprint.slice(-16)}`;
  if (
    !attemptIntegrity.ok ||
    proof.proofFingerprint !== expectedFingerprint ||
    proof.id !== expectedId ||
    proof.attemptRef.id !== proof.attemptSnapshot.id ||
    proof.attemptRef.payloadFingerprint !== proof.attemptSnapshot.payloadFingerprint ||
    proof.completionEventId !== proof.attemptSnapshot.terminalCompletionEventId
  ) {
    return {
      ok: false,
      error: {
        code: 'FINGERPRINT_MISMATCH',
        message: `${proof.id} does not match its generated encounter completion proof payload.`,
      },
    };
  }
  return { ok: true, value: proof };
};

const normalizeTransitionInput = (
  input: PatientSlotLifecycleTransitionCompileInput,
): PatientSlotLifecycleTransitionCompileInput =>
  input.operation === 'refresh_waiting_slots'
    ? {
        ...input,
        targetSlotCoordinateIds: [...input.targetSlotCoordinateIds].sort(compareStrings),
      }
    : input;

const transitionTargetIds = (
  input: PatientSlotLifecycleTransitionCompileInput,
): readonly string[] =>
  input.operation === 'refresh_waiting_slots'
    ? input.targetSlotCoordinateIds
    : [input.targetSlotCoordinateId];

const templateKey = (input: {
  readonly templateRef: { readonly id: string; readonly contentVersion: string };
  readonly templateFingerprint: string;
}): string =>
  `${input.templateRef.id}\u0000${input.templateRef.contentVersion}\u0000${input.templateFingerprint}`;

const templateVersionKey = (input: {
  readonly templateRef: { readonly id: string; readonly contentVersion: string };
}): string => `${input.templateRef.id}\u0000${input.templateRef.contentVersion}`;

export const fingerprintDeveloperPatientTemplateRunHistoryState = (
  state: NonNullable<PatientSlotLifecycleTransitionCompileInput['developerRunHistoryState']>,
) => fingerprintLocationTemplateEligibilitySource(state);

export const createPatientSlotTemplateEligibilityOverlay = (input: {
  readonly mode: PatientSlotLifecycleTransitionArtifact['mode'];
  readonly admittedTemplates: readonly LocationTemplateSelectionEligibilityMember[];
  readonly developerRunHistoryState: PatientSlotLifecycleTransitionArtifact['proposedDeveloperRunHistoryState'];
  readonly sameTemplateConstraint?: PatientSlotLifecycleTransitionArtifact['sameTemplateRefillConstraint'];
  readonly activeWaitingTemplates?: readonly LocationTemplateSelectionEligibilityMember[];
}) => {
  if (input.mode !== 'developer') {
    return createLocationTemplateSelectionEligibilityOverlay({
      mode: input.mode,
      basis: 'all_admitted',
      sourceRunHistoryRef: null,
      eligibleTemplates: input.admittedTemplates,
    });
  }
  if (input.developerRunHistoryState === null) {
    throw new Error('Developer template eligibility requires exact Developer run history.');
  }
  const sourceRunHistoryRef = {
    id: input.developerRunHistoryState.id,
    payloadFingerprint: fingerprintDeveloperPatientTemplateRunHistoryState(
      input.developerRunHistoryState,
    ),
  };
  if (input.sameTemplateConstraint !== undefined && input.sameTemplateConstraint !== null) {
    if (
      !input.admittedTemplates.some(
        (candidate) => templateKey(candidate) === templateKey(input.sameTemplateConstraint!),
      )
    ) {
      throw new Error(
        'Developer same-template rerandomization requires that exact template version and fingerprint in the current admitted horizon.',
      );
    }
    return createLocationTemplateSelectionEligibilityOverlay({
      mode: 'developer',
      basis: 'developer_same_template',
      sourceRunHistoryRef,
      eligibleTemplates: [
        {
          templateRef: input.sameTemplateConstraint.templateRef,
          templateFingerprint: input.sameTemplateConstraint.templateFingerprint,
        },
      ],
    });
  }
  const admittedByVersion = new Map(
    input.admittedTemplates.map((candidate) => [templateVersionKey(candidate), candidate]),
  );
  for (const entry of [
    ...input.developerRunHistoryState.entries,
    ...(input.activeWaitingTemplates ?? []),
  ]) {
    const admitted = admittedByVersion.get(templateVersionKey(entry));
    if (admitted !== undefined && admitted.templateFingerprint !== entry.templateFingerprint) {
      throw new Error(
        `Template ${entry.templateRef.id}@${entry.templateRef.contentVersion} changed fingerprint without a content-version change.`,
      );
    }
  }
  const unavailableVersionKeys = new Set([
    ...input.developerRunHistoryState.entries.map(templateVersionKey),
    ...(input.activeWaitingTemplates ?? []).map(templateVersionKey),
  ]);
  return createLocationTemplateSelectionEligibilityOverlay({
    mode: 'developer',
    basis: 'developer_unrun',
    sourceRunHistoryRef,
    eligibleTemplates: input.admittedTemplates.filter(
      (candidate) => !unavailableVersionKeys.has(templateVersionKey(candidate)),
    ),
  });
};

const updateDeveloperRunHistory = (
  input: NonNullable<PatientSlotLifecycleTransitionCompileInput['developerRunHistoryState']>,
  completion: PatientSlotCompletionHistoryEntry,
): NonNullable<PatientSlotLifecycleTransitionArtifact['proposedDeveloperRunHistoryState']> => {
  const key = templateVersionKey(completion);
  const existing = input.entries.find((entry) => templateVersionKey(entry) === key);
  if (existing !== undefined && existing.templateFingerprint !== completion.templateFingerprint) {
    throw new Error(
      `Template ${completion.templateRef.id}@${completion.templateRef.contentVersion} changed fingerprint without a content-version change.`,
    );
  }
  const entries: DeveloperPatientTemplateRunHistoryEntry[] =
    existing === undefined
      ? [
          ...input.entries,
          {
            schemaVersion: 1,
            templateRef: completion.templateRef,
            templateFingerprint: completion.templateFingerprint,
            firstCompletionRecordId: completion.id,
            latestCompletionRecordId: completion.id,
            completionCount: 1,
          },
        ]
      : input.entries.map((entry) =>
          templateVersionKey(entry) === key
            ? {
                ...entry,
                latestCompletionRecordId: completion.id,
                completionCount: entry.completionCount + 1,
              }
            : entry,
        );
  return {
    ...input,
    entries: entries.sort((left, right) =>
      compareStrings(templateVersionKey(left), templateVersionKey(right)),
    ),
  };
};

const transitionInputPayload = (input: PatientSlotLifecycleTransitionCompileInput): unknown =>
  input;

const transitionArtifactPayload = (
  artifact: Omit<PatientSlotLifecycleTransitionArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  operation: artifact.operation,
  mode: artifact.mode,
  locationRef: artifact.locationRef,
  vacatedSlotCoordinateIds: artifact.vacatedSlotCoordinateIds,
  completionRecord: artifact.completionRecord,
  skippedWaitingRecords: artifact.skippedWaitingRecords,
  proposedOccupancyInput: artifact.proposedOccupancyInput,
  proposedOccupancySnapshotArtifact: artifact.proposedOccupancySnapshotArtifact,
  proposedCompletionHistoryState: artifact.proposedCompletionHistoryState,
  proposedRecentCompletionContext: artifact.proposedRecentCompletionContext,
  proposedDeveloperRunHistoryState: artifact.proposedDeveloperRunHistoryState,
  sameTemplateRefillConstraint: artifact.sameTemplateRefillConstraint,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

const validateLifecycleHistoryIntegrity = (
  input: PatientSlotLifecycleTransitionCompileInput,
):
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string; readonly ids: string[] } => {
  for (const entry of input.completionHistoryState.entriesNewestFirst) {
    const proof = verifyGeneratedEncounterCompletionProof(entry.completionProof);
    if (!proof.ok) {
      return {
        ok: false,
        message: `${proof.error.code}: ${proof.error.message}`,
        ids: [entry.id, entry.completionProof.id],
      };
    }
    const patient = verifyFindingPipelineAuditIntegrity(
      entry.frozenWaitingSlot.findingPipelineAuditArtifact,
    );
    if (!patient.ok) {
      return {
        ok: false,
        message: `${patient.error.code}: ${patient.error.message}`,
        ids: [entry.id, entry.frozenWaitingSlot.findingPipelineAuditArtifact.id],
      };
    }
    const attemptContext = verifyGeneratedCompletedEncounterAttemptContext({
      attempt: proof.value.attemptSnapshot,
      frozenWaitingSlot: entry.frozenWaitingSlot,
    });
    if (!attemptContext.ok) {
      return {
        ok: false,
        message: `${attemptContext.error.code}: ${attemptContext.error.message}`,
        ids: [entry.id, proof.value.attemptRef.id, entry.frozenWaitingSlot.id],
      };
    }
  }
  const activeWaitingSlots = input.currentOccupancyInput.entries.flatMap((entry) =>
    entry.frozenWaitingSlot === null ? [] : [entry.frozenWaitingSlot],
  );
  const retainedWaitingIds = new Set(
    input.completionHistoryState.entriesNewestFirst.map((entry) => entry.frozenWaitingSlot.id),
  );
  const retainedPatientIds = new Set(
    input.completionHistoryState.entriesNewestFirst.map(
      (entry) => entry.completionProof.patientInstanceRef.id,
    ),
  );
  const overlappingActive = activeWaitingSlots.find((waitingSlot) => {
    const patient = waitingSlot.findingPipelineAuditArtifact.catalogSnapshot?.patientInstance;
    return (
      retainedWaitingIds.has(waitingSlot.id) ||
      (patient !== undefined && retainedPatientIds.has(patient.id))
    );
  });
  if (overlappingActive !== undefined) {
    return {
      ok: false,
      message:
        'A patient retained in completion history cannot simultaneously remain in the current waiting occupancy.',
      ids: [input.completionHistoryState.id, overlappingActive.id],
    };
  }
  if (input.mode !== 'developer') return { ok: true };
  const runHistory = input.developerRunHistoryState;
  if (runHistory === null) {
    return {
      ok: false,
      message: 'Developer lifecycle history requires one exact run-history state.',
      ids: [input.completionHistoryState.id],
    };
  }
  const runByVersion = new Map(
    runHistory.entries.map((entry) => [templateVersionKey(entry), entry]),
  );
  const retainedCounts = new Map<string, number>();
  for (const completion of input.completionHistoryState.entriesNewestFirst) {
    const key = templateVersionKey(completion);
    retainedCounts.set(key, (retainedCounts.get(key) ?? 0) + 1);
    const run = runByVersion.get(key);
    if (
      run === undefined ||
      run.templateFingerprint !== completion.templateFingerprint ||
      run.completionCount < retainedCounts.get(key)!
    ) {
      return {
        ok: false,
        message:
          'Every retained Developer completion must be covered by the exact same-version run-history entry and count.',
        ids: [completion.id, completion.templateRef.id, runHistory.id],
      };
    }
  }
  for (const run of runHistory.entries) {
    if (
      (run.completionCount === 1) !==
      (run.firstCompletionRecordId === run.latestCompletionRecordId)
    ) {
      return {
        ok: false,
        message:
          'A one-completion Developer run must have one first/latest record ID; a repeated run must have distinct first/latest records.',
        ids: [runHistory.id, run.templateRef.id],
      };
    }
    const latestRetained = input.completionHistoryState.entriesNewestFirst.find(
      (completion) => templateVersionKey(completion) === templateVersionKey(run),
    );
    if (latestRetained !== undefined && latestRetained.id !== run.latestCompletionRecordId) {
      return {
        ok: false,
        message:
          'The newest retained completion for a Developer template must equal its run-history latest record.',
        ids: [runHistory.id, run.latestCompletionRecordId, latestRetained.id],
      };
    }
  }
  return { ok: true };
};

export const compilePatientSlotLifecycleTransition = (
  value: unknown,
): PatientSlotLifecycleTransitionCompileResult => {
  const parsed = PatientSlotLifecycleTransitionCompileInputSchema.safeParse(value);
  if (!parsed.success) return failTransition('INVALID_INPUT', issuesText(parsed.error.issues));
  const input = normalizeTransitionInput(parsed.data);
  const occupancy = verifyLocationPatientSlotOccupancySnapshotContext({
    artifact: input.occupancySnapshotArtifact,
    currentInput: input.currentOccupancyInput,
  });
  if (!occupancy.ok) {
    return failTransition(
      'INVALID_OCCUPANCY',
      `${occupancy.error.code}: ${occupancy.error.message}`,
      [input.occupancySnapshotArtifact.id],
    );
  }
  const locationRef = occupancy.value.locationRef;
  if (
    input.mode !== occupancy.value.mode ||
    input.completionHistoryState.mode !== input.mode ||
    input.completionHistoryState.locationRef.id !== locationRef.id ||
    input.completionHistoryState.locationRef.contentVersion !== locationRef.contentVersion ||
    input.distributionProfile.locationRef.id !== locationRef.id ||
    input.distributionProfile.locationRef.contentVersion !== locationRef.contentVersion ||
    input.distributionProfile.locationFingerprint !== occupancy.value.locationFingerprint
  ) {
    return failTransition(
      'CONTEXT_MISMATCH',
      'Lifecycle mode, location completion history, distribution policy, and current occupancy must describe one exact location.',
      [
        input.completionHistoryState.id,
        input.distributionProfile.id,
        input.occupancySnapshotArtifact.id,
      ],
    );
  }
  if (
    input.completionHistoryState.occupancySnapshotRef.id !== occupancy.value.id ||
    input.completionHistoryState.occupancySnapshotRef.payloadFingerprint !==
      occupancy.value.payloadFingerprint
  ) {
    return failTransition(
      'CONTEXT_MISMATCH',
      'Lifecycle completion history must name the exact current occupancy snapshot before a transition can be applied.',
      [input.completionHistoryState.id, occupancy.value.id],
    );
  }
  const historyIntegrity = validateLifecycleHistoryIntegrity(input);
  if (!historyIntegrity.ok) {
    return failTransition('CONTEXT_MISMATCH', historyIntegrity.message, historyIntegrity.ids);
  }

  const targetIds = transitionTargetIds(input);
  const waitingByCoordinateId = new Map(
    input.currentOccupancyInput.entries.flatMap((entry) =>
      entry.frozenWaitingSlot === null
        ? []
        : [[entry.slotCoordinateId, entry.frozenWaitingSlot] as const],
    ),
  );
  const targetWaitingSlots = targetIds.flatMap((coordinateId) => {
    const waiting = waitingByCoordinateId.get(coordinateId);
    return waiting === undefined ? [] : [{ coordinateId, waiting }];
  });
  if (targetWaitingSlots.length !== targetIds.length) {
    return failTransition(
      'TARGET_SLOT_NOT_OCCUPIED',
      'Every completion, refresh, or rerandomization target must be an exact occupied coordinate.',
      targetIds,
    );
  }
  let completionRecord: PatientSlotCompletionHistoryEntry | null = null;
  let proposedCompletionHistoryState: LocationPatientSlotCompletionHistoryState =
    input.completionHistoryState;
  let proposedDeveloperRunHistoryState = input.developerRunHistoryState;
  if (input.operation === 'complete_encounter') {
    const proof = verifyGeneratedEncounterCompletionProof(input.completionProof);
    if (!proof.ok) {
      return failTransition(
        'INVALID_COMPLETION_PROOF',
        `${proof.error.code}: ${proof.error.message}`,
        [input.completionProof.id],
      );
    }
    const target = targetWaitingSlots[0]!;
    const audit = target.waiting.findingPipelineAuditArtifact;
    const patient = audit.catalogSnapshot?.patientInstance;
    const authority = audit.patientSlotFillSeedAuthorityArtifact;
    const attemptContext = verifyGeneratedCompletedEncounterAttemptContext({
      attempt: proof.value.attemptSnapshot,
      frozenWaitingSlot: target.waiting,
    });
    if (
      !attemptContext.ok ||
      patient === undefined ||
      proof.value.waitingSlotId !== target.waiting.id ||
      proof.value.patientInstanceRef.id !== patient.id ||
      proof.value.patientInstanceRef.payloadFingerprint !== patient.payloadFingerprint ||
      proof.value.templateRef.id !== authority.selectedTemplateRef.id ||
      proof.value.templateRef.contentVersion !== authority.selectedTemplateRef.contentVersion ||
      proof.value.templateFingerprint !== authority.selectedTemplateFingerprint
    ) {
      return failTransition(
        'INVALID_COMPLETION_PROOF',
        attemptContext.ok
          ? 'The completion proof does not name the exact frozen waiting patient and selected template occupying the target coordinate.'
          : attemptContext.error.message,
        [proof.value.id, target.waiting.id, target.coordinateId],
      );
    }
    const alreadyCompleted = input.completionHistoryState.entriesNewestFirst.some(
      (entry) =>
        entry.frozenWaitingSlot.id === target.waiting.id ||
        entry.completionProof.patientInstanceRef.id === proof.value.patientInstanceRef.id ||
        entry.completionProof.attemptRef.id === proof.value.attemptRef.id ||
        entry.completionProof.completionEventId === proof.value.completionEventId ||
        entry.completionProof.proofFingerprint === proof.value.proofFingerprint,
    );
    if (alreadyCompleted) {
      return failTransition(
        'INVALID_COMPLETION_PROOF',
        'A retained waiting patient, patient instance, attempt, completion event, or completion proof cannot be completed again.',
        [proof.value.id, target.waiting.id, proof.value.attemptRef.id],
      );
    }
    const completionOrdinal = input.completionHistoryState.nextCompletionOrdinal;
    const completionIdentity = {
      completionOrdinal,
      mode: input.mode,
      locationRef,
      slotCoordinateId: target.coordinateId,
      waitingSlotId: target.waiting.id,
      attemptRef: proof.value.attemptRef,
    };
    completionRecord = {
      schemaVersion: 1,
      id: `patient-slot-completion-history-entry.${hashToHex64(
        JSON.stringify(canonicalizeObjectKeys(completionIdentity)),
      )}`,
      completionOrdinal,
      mode: input.mode,
      locationRef,
      slotCoordinateId: target.coordinateId,
      frozenWaitingSlot: target.waiting,
      completionProof: proof.value,
      templateRef: authority.selectedTemplateRef,
      templateFingerprint: authority.selectedTemplateFingerprint,
    };
    proposedCompletionHistoryState = {
      ...input.completionHistoryState,
      nextCompletionOrdinal: completionOrdinal + 1,
      entriesNewestFirst: [
        completionRecord,
        ...input.completionHistoryState.entriesNewestFirst,
      ].slice(0, input.distributionProfile.repeatSuppression.recentCompletionWindowSize),
    };
    if (input.mode === 'developer' && input.developerRunHistoryState !== null) {
      try {
        proposedDeveloperRunHistoryState = updateDeveloperRunHistory(
          input.developerRunHistoryState,
          completionRecord,
        );
      } catch (error) {
        return failTransition(
          'CONTEXT_MISMATCH',
          error instanceof Error ? error.message : 'Invalid Developer run-history state.',
          [input.developerRunHistoryState.id, completionRecord.id],
        );
      }
    }
  }

  const skippedWaitingRecords: PatientSlotSkippedWaitingRecord[] =
    input.operation === 'complete_encounter'
      ? []
      : targetWaitingSlots.map(({ coordinateId, waiting }) => {
          const reason =
            input.operation === 'rerandomize_same_template'
              ? ('developer_rerandomize' as const)
              : input.mode === 'endgame'
                ? ('endgame_refresh' as const)
                : ('developer_replace' as const);
          return {
            schemaVersion: 1,
            id: `patient-slot-skipped-waiting-record.${hashToHex64(
              JSON.stringify(
                canonicalizeObjectKeys({
                  requestId: input.id,
                  reason,
                  coordinateId,
                  waitingSlotId: waiting.id,
                }),
              ),
            )}`,
            reason,
            slotCoordinateId: coordinateId,
            frozenWaitingSlot: waiting,
          };
        });

  const proposedOccupancyInput: LocationPatientSlotOccupancySnapshotCompileInput = {
    ...structuredClone(input.currentOccupancyInput),
    id: `location-patient-slot-occupancy-request.d234.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          requestId: input.id,
          operation: input.operation,
          targetIds,
        }),
      ),
    )}`,
    entries: input.currentOccupancyInput.entries.map((entry) =>
      targetIds.includes(entry.slotCoordinateId) ? { ...entry, frozenWaitingSlot: null } : entry,
    ),
  };
  const proposedOccupancy = compileLocationPatientSlotOccupancySnapshot(proposedOccupancyInput);
  if (!proposedOccupancy.ok) {
    return failTransition(
      'INVALID_OCCUPANCY',
      `${proposedOccupancy.error.code}: ${proposedOccupancy.error.message}`,
      proposedOccupancy.error.contentIds,
    );
  }
  proposedCompletionHistoryState = {
    ...proposedCompletionHistoryState,
    occupancySnapshotRef: {
      id: proposedOccupancy.value.id,
      payloadFingerprint: proposedOccupancy.value.payloadFingerprint,
    },
  };
  if (
    input.operation === 'rerandomize_same_template' &&
    getFirstEmptyLocationPatientSlotCoordinateId(proposedOccupancy.value) !==
      input.targetSlotCoordinateId
  ) {
    return failTransition(
      'CONTEXT_MISMATCH',
      'Developer same-template rerandomization must target the canonical first vacancy after its patient is removed; reconcile an earlier vacancy first.',
      [proposedOccupancy.value.id, input.targetSlotCoordinateId],
    );
  }
  const recentTemplateIds = proposedCompletionHistoryState.entriesNewestFirst.map(
    (entry) => entry.templateRef.id,
  );
  const proposedRecentCompletionContext = {
    schemaVersion: 1 as const,
    id: `location-template-recent-completion-context.d234.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          mode: input.mode,
          locationRef,
          recentTemplateIds,
        }),
      ),
    )}`,
    mode: input.mode,
    locationRef,
    recentCompletedTemplateIdsNewestFirst: recentTemplateIds,
  };
  const sameTemplateRefillConstraint =
    input.operation === 'rerandomize_same_template'
      ? {
          slotCoordinateId: targetWaitingSlots[0]!.coordinateId,
          templateRef:
            targetWaitingSlots[0]!.waiting.findingPipelineAuditArtifact
              .patientSlotFillSeedAuthorityArtifact.selectedTemplateRef,
          templateFingerprint:
            targetWaitingSlots[0]!.waiting.findingPipelineAuditArtifact
              .patientSlotFillSeedAuthorityArtifact.selectedTemplateFingerprint,
        }
      : null;
  const inputFingerprint = fingerprint('transition-input', transitionInputPayload(input));
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_SLOT_LIFECYCLE_TRANSITION_COMPILER_VERSION,
    requestId: input.id,
    operation: input.operation,
    mode: input.mode,
    locationRef,
    vacatedSlotCoordinateIds: [...targetIds],
    completionRecord,
    skippedWaitingRecords,
    proposedOccupancyInput,
    proposedOccupancySnapshotArtifact: proposedOccupancy.value,
    proposedCompletionHistoryState,
    proposedRecentCompletionContext,
    proposedDeveloperRunHistoryState,
    sameTemplateRefillConstraint,
    compileRequest: input,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'transition-payload',
    transitionArtifactPayload(withoutIdentity),
  );
  const output = PatientSlotLifecycleTransitionArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-slot-lifecycle-transition.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return failTransition('INVALID_OUTPUT', issuesText(output.error.issues), [
      input.id,
      input.occupancySnapshotArtifact.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientSlotLifecycleTransitionIntegrity = (
  value: unknown,
): PatientSlotLifecycleTransitionIntegrityResult => {
  const parsed = PatientSlotLifecycleTransitionArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== PATIENT_SLOT_LIFECYCLE_TRANSITION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported patient-slot lifecycle compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const replay = compilePatientSlotLifecycleTransition(artifact.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message: 'The retained lifecycle request does not reproduce the exact transition artifact.',
      },
    };
  }
  const expectedPayload = fingerprint('transition-payload', transitionArtifactPayload(artifact));
  if (artifact.payloadFingerprint !== expectedPayload) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its lifecycle transition payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyPatientSlotLifecycleTransitionContext = (input: {
  readonly artifact: unknown;
  readonly currentInput: unknown;
}): PatientSlotLifecycleTransitionContextResult => {
  const integrity = verifyPatientSlotLifecycleTransitionIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = compilePatientSlotLifecycleTransition(input.currentInput);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: expected.ok
          ? 'The lifecycle artifact does not match the exact current transition input.'
          : `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};

const occupancyInputAfterFill = (
  attemptInput: PatientSlotRefillReconciliationCompileInput['fillAttempts'][number],
  artifact: EmptyAuthorizedPatientSlotFillArtifact,
): LocationPatientSlotOccupancySnapshotCompileInput => ({
  ...structuredClone(attemptInput.seedAuthorityCompileInput.currentOccupancyInput),
  id: artifact.proposedOccupancySnapshotArtifact.requestId,
  entries: attemptInput.seedAuthorityCompileInput.currentOccupancyInput.entries.map((entry) =>
    entry.slotCoordinateId === artifact.slotCoordinate.id
      ? {
          ...entry,
          nextFillOrdinal: artifact.nextFillOrdinal,
          frozenWaitingSlot: artifact.frozenWaitingSlotProposal,
        }
      : entry,
  ),
});

const reconciliationArtifactPayload = (
  artifact: Omit<PatientSlotRefillReconciliationArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  mode: artifact.mode,
  locationRef: artifact.locationRef,
  transitionArtifact: artifact.transitionArtifact,
  fillAttempts: artifact.fillAttempts,
  finalOccupancyInput: artifact.finalOccupancyInput,
  finalOccupancySnapshotArtifact: artifact.finalOccupancySnapshotArtifact,
  compileRequest: artifact.compileRequest,
  inputFingerprint: artifact.inputFingerprint,
});

export const compilePatientSlotRefillReconciliation = (
  value: unknown,
): PatientSlotRefillReconciliationCompileResult => {
  const parsed = PatientSlotRefillReconciliationCompileInputSchema.safeParse(value);
  if (!parsed.success) return failReconciliation('INVALID_INPUT', issuesText(parsed.error.issues));
  const input = parsed.data;
  const transition = verifyPatientSlotLifecycleTransitionContext({
    artifact: input.transitionArtifact,
    currentInput: input.currentTransitionInput,
  });
  if (!transition.ok) {
    return failReconciliation(
      'CONTEXT_MISMATCH',
      `${transition.error.code}: ${transition.error.message}`,
      [input.transitionArtifact.id],
    );
  }
  if (
    input.generationRoot.mode !== transition.value.mode ||
    input.fillAttempts.some(
      (attempt) =>
        !sameCanonicalValue(attempt.seedAuthorityCompileInput.generationRoot, input.generationRoot),
    )
  ) {
    return failReconciliation(
      'CONTEXT_MISMATCH',
      'The reconciliation and every explicit attempt must preserve one exact private generation root for this mode.',
      [input.generationRoot.id, transition.value.id],
    );
  }
  const generationRootFingerprint = fingerprintPatientSlotGenerationRoot(input.generationRoot);
  const lifecycleWaitingSlots = [
    ...transition.value.compileRequest.currentOccupancyInput.entries.flatMap((entry) =>
      entry.frozenWaitingSlot === null ? [] : [entry.frozenWaitingSlot],
    ),
    ...transition.value.compileRequest.completionHistoryState.entriesNewestFirst.map(
      (entry) => entry.frozenWaitingSlot,
    ),
  ];
  if (
    lifecycleWaitingSlots.some((waitingSlot) => {
      const rootRef =
        waitingSlot.findingPipelineAuditArtifact.patientSlotFillSeedAuthorityArtifact.coordinates
          .generationRootRef;
      return (
        rootRef.id !== input.generationRoot.id ||
        rootRef.mode !== input.generationRoot.mode ||
        rootRef.seedFingerprint !== generationRootFingerprint
      );
    })
  ) {
    return failReconciliation(
      'CONTEXT_MISMATCH',
      'The refill root must be the exact caller-supplied mode root that generated every patient in the pre-transition location occupancy.',
      [input.generationRoot.id, ...lifecycleWaitingSlots.map((slot) => slot.id)],
    );
  }
  let currentOccupancyInput = structuredClone(transition.value.proposedOccupancyInput);
  let currentOccupancy = transition.value.proposedOccupancySnapshotArtifact;
  let blocked = false;
  const fillAttempts: EmptyAuthorizedPatientSlotFillArtifact[] = [];
  const consumedRetryAuthorizations = new Set<string>();
  const matrixContext = verifyPatientTemplateLocationAdmissionMatrixContext({
    artifact: input.currentAdmissionMatrixArtifact,
    request: input.currentAdmissionMatrixRequest,
  });
  if (!matrixContext.ok) {
    return failReconciliation(
      'CONTEXT_MISMATCH',
      `${matrixContext.error.code}: ${matrixContext.error.message}`,
      [input.currentAdmissionMatrixArtifact.id],
    );
  }
  const exactLocationIsPresent = matrixContext.value.locationResourceEvaluations.some(
    (evaluation) =>
      evaluation.locationRef.id === transition.value.locationRef.id &&
      evaluation.locationRef.contentVersion === transition.value.locationRef.contentVersion &&
      evaluation.locationFingerprint ===
        transition.value.proposedOccupancySnapshotArtifact.locationFingerprint,
  );
  if (!exactLocationIsPresent) {
    return failReconciliation(
      'CONTEXT_MISMATCH',
      'The current admission matrix must contain the transition’s exact location even when no templates are admitted there.',
      [input.currentAdmissionMatrixArtifact.id, transition.value.locationRef.id],
    );
  }
  const initialVacancyCount = transition.value.proposedOccupancySnapshotArtifact.entries.filter(
    (entry) => entry.status === 'empty',
  ).length;
  const currentCandidates = enumerateLocationOwnedPatientSlotCandidates(
    matrixContext.value,
    transition.value.locationRef,
  );
  const admittedTemplates = currentCandidates.map((candidate) => ({
    templateRef: candidate.templateRef,
    templateFingerprint: candidate.templateFingerprint,
  }));
  let sameTemplateConstraint = transition.value.sameTemplateRefillConstraint;

  const currentActiveWaitingTemplates = (): LocationTemplateSelectionEligibilityMember[] =>
    currentOccupancy.entries.flatMap((entry) =>
      entry.status === 'occupied'
        ? [
            {
              templateRef: entry.occupiedAssignment.templateRef,
              templateFingerprint: entry.occupiedAssignment.templateFingerprint,
            },
          ]
        : [],
    );

  const currentEligibility = () => {
    try {
      return {
        ok: true as const,
        value: createPatientSlotTemplateEligibilityOverlay({
          mode: transition.value.mode,
          admittedTemplates,
          developerRunHistoryState: transition.value.proposedDeveloperRunHistoryState,
          sameTemplateConstraint,
          activeWaitingTemplates: currentActiveWaitingTemplates(),
        }),
      };
    } catch (error) {
      return {
        ok: false as const,
        message:
          error instanceof Error
            ? error.message
            : 'The current lifecycle eligibility context is invalid.',
      };
    }
  };

  for (const attemptInput of input.fillAttempts) {
    if (blocked) {
      const priorBlocker = fillAttempts.at(-1)!;
      if (!input.explicitRetryAfterBlockedAttemptIds.includes(priorBlocker.requestId)) {
        return failReconciliation(
          'REFILL_AFTER_BLOCKER',
          'A reconciliation stops after a blocked D-233 attempt unless a later caller explicitly authorizes continuing after that exact blocked request.',
          priorBlocker.diagnostics.flatMap((diagnostic) => diagnostic.contentIds),
        );
      }
      consumedRetryAuthorizations.add(priorBlocker.requestId);
      blocked = false;
    }
    const firstEmptyCoordinateId = getFirstEmptyLocationPatientSlotCoordinateId(currentOccupancy);
    const expectedEligibility = currentEligibility();
    if (!expectedEligibility.ok) {
      return failReconciliation('CONTEXT_MISMATCH', expectedEligibility.message, [
        transition.value.id,
        matrixContext.value.id,
      ]);
    }
    if (
      transition.value.mode === 'developer' &&
      expectedEligibility.value.basis === 'developer_unrun' &&
      expectedEligibility.value.eligibleTemplates.length === 0
    ) {
      return failReconciliation(
        'REFILL_SEQUENCE_MISMATCH',
        'Developer unrun exhaustion consumes no fill ordinal; no further D-233 attempt is permitted.',
        [transition.value.id, expectedEligibility.value.id, attemptInput.id],
      );
    }
    if (
      firstEmptyCoordinateId === null ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.currentOccupancyInput,
        currentOccupancyInput,
      ) ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.occupancySnapshotArtifact,
        currentOccupancy,
      ) ||
      attemptInput.seedAuthorityCompileInput.targetSlotCoordinateId !== firstEmptyCoordinateId ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.recentCompletionContext,
        transition.value.proposedRecentCompletionContext,
      ) ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.admissionMatrixArtifact,
        matrixContext.value,
      ) ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.currentAdmissionMatrixRequest,
        input.currentAdmissionMatrixRequest,
      ) ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.generationRoot,
        input.generationRoot,
      ) ||
      !sameCanonicalValue(
        attemptInput.seedAuthorityCompileInput.distributionProfile,
        transition.value.compileRequest.distributionProfile,
      )
    ) {
      return failReconciliation(
        'REFILL_SEQUENCE_MISMATCH',
        'Every refill attempt must consume the exact prior occupancy, current admission matrix, generation root, distribution profile, recent-completion context, and canonical first empty coordinate.',
        [
          attemptInput.id,
          currentOccupancy.id,
          ...(firstEmptyCoordinateId === null ? [] : [firstEmptyCoordinateId]),
        ],
      );
    }
    const authority = attemptInput.seedAuthorityArtifact;
    const eligibilityIntegrity = verifyLocationTemplateSelectionEligibilityOverlay(
      attemptInput.seedAuthorityCompileInput.templateEligibilityOverlay,
    );
    if (
      !eligibilityIntegrity.ok ||
      !sameCanonicalValue(
        eligibilityIntegrity.ok ? eligibilityIntegrity.value : null,
        expectedEligibility.value,
      )
    ) {
      return failReconciliation(
        'REFILL_SEQUENCE_MISMATCH',
        'Every D-233 attempt must use the dynamically recomputed all-admitted, Developer-unrun, or explicit same-template eligibility overlay for its exact current occupancy.',
        [attemptInput.id, expectedEligibility.value.id],
      );
    }
    if (
      sameTemplateConstraint !== null &&
      (authority.coordinates.slotCoordinateId !== sameTemplateConstraint.slotCoordinateId ||
        authority.selectedTemplateRef.id !== sameTemplateConstraint.templateRef.id ||
        authority.selectedTemplateRef.contentVersion !==
          sameTemplateConstraint.templateRef.contentVersion ||
        authority.selectedTemplateFingerprint !== sameTemplateConstraint.templateFingerprint)
    ) {
      return failReconciliation(
        'REFILL_SEQUENCE_MISMATCH',
        'Developer same-template rerandomization may refill only the exact prior coordinate and template version/fingerprint, without fallback.',
        [authority.id, sameTemplateConstraint.templateRef.id],
      );
    }
    const compiled = compileEmptyAuthorizedPatientSlotFill(attemptInput);
    if (!compiled.ok) {
      return failReconciliation(
        'REFILL_COMPILATION_FAILED',
        `${compiled.error.code}: ${compiled.error.message}`,
        compiled.error.contentIds,
      );
    }
    const context = verifyEmptyAuthorizedPatientSlotFillContext({
      artifact: compiled.value,
      currentInput: attemptInput,
    });
    if (!context.ok) {
      return failReconciliation(
        'REFILL_COMPILATION_FAILED',
        `${context.error.code}: ${context.error.message}`,
        [compiled.value.id],
      );
    }
    fillAttempts.push(compiled.value);
    currentOccupancyInput = occupancyInputAfterFill(attemptInput, compiled.value);
    const occupancyContext = verifyLocationPatientSlotOccupancySnapshotContext({
      artifact: compiled.value.proposedOccupancySnapshotArtifact,
      currentInput: currentOccupancyInput,
    });
    if (!occupancyContext.ok) {
      return failReconciliation(
        'REFILL_SEQUENCE_MISMATCH',
        `${occupancyContext.error.code}: ${occupancyContext.error.message}`,
        [compiled.value.id, compiled.value.proposedOccupancySnapshotArtifact.id],
      );
    }
    currentOccupancy = occupancyContext.value;
    blocked = compiled.value.status === 'blocked';
    if (compiled.value.status === 'filled') sameTemplateConstraint = null;
  }

  const unusedRetryAuthorizations = input.explicitRetryAfterBlockedAttemptIds.filter(
    (attemptId) => !consumedRetryAuthorizations.has(attemptId),
  );
  if (unusedRetryAuthorizations.length > 0) {
    return failReconciliation(
      'REFILL_SEQUENCE_MISMATCH',
      'Every explicit retry authorization must correspond to a non-final blocked attempt in this exact transcript.',
      unusedRetryAuthorizations,
    );
  }
  if (
    input.fillAttempts.length >
    initialVacancyCount + input.explicitRetryAfterBlockedAttemptIds.length
  ) {
    return failReconciliation(
      'REFILL_SEQUENCE_MISMATCH',
      'A refill transcript cannot contain more attempts than initial vacancies plus its explicitly authorized blocked retries.',
      input.fillAttempts.map((attempt) => attempt.id),
    );
  }

  const firstEmptyCoordinateId = getFirstEmptyLocationPatientSlotCoordinateId(currentOccupancy);
  const finalEligibility = currentEligibility();
  if (!finalEligibility.ok) {
    return failReconciliation('CONTEXT_MISMATCH', finalEligibility.message, [
      transition.value.id,
      matrixContext.value.id,
    ]);
  }
  const developerHorizonExhausted =
    firstEmptyCoordinateId !== null &&
    !blocked &&
    transition.value.mode === 'developer' &&
    finalEligibility.value.basis === 'developer_unrun' &&
    finalEligibility.value.eligibleTemplates.length === 0;
  if (firstEmptyCoordinateId !== null && !blocked && !developerHorizonExhausted) {
    return failReconciliation(
      'REFILL_SEQUENCE_INCOMPLETE',
      'A reconciliation with no blocker must continue in canonical order until every authorized coordinate is occupied.',
      [firstEmptyCoordinateId, currentOccupancy.id],
    );
  }
  const status = blocked
    ? ('blocked' as const)
    : developerHorizonExhausted
      ? ('developer_horizon_exhausted' as const)
      : ('full' as const);
  const inputFingerprint = fingerprint('reconciliation-input', input);
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: PATIENT_SLOT_REFILL_RECONCILIATION_COMPILER_VERSION,
    requestId: input.id,
    status,
    mode: transition.value.mode,
    locationRef: transition.value.locationRef,
    transitionArtifact: transition.value,
    fillAttempts,
    finalOccupancyInput: currentOccupancyInput,
    finalOccupancySnapshotArtifact: currentOccupancy,
    compileRequest: input,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'reconciliation-payload',
    reconciliationArtifactPayload(withoutIdentity),
  );
  const output = PatientSlotRefillReconciliationArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `patient-slot-refill-reconciliation.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return failReconciliation('INVALID_OUTPUT', issuesText(output.error.issues), [
      input.id,
      transition.value.id,
      currentOccupancy.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyPatientSlotRefillReconciliationIntegrity = (
  value: unknown,
): PatientSlotRefillReconciliationIntegrityResult => {
  const parsed = PatientSlotRefillReconciliationArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== PATIENT_SLOT_REFILL_RECONCILIATION_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported patient-slot refill compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const replay = compilePatientSlotRefillReconciliation(artifact.compileRequest);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_FAILED',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameCanonicalValue(replay.value, artifact)) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The retained transition and fill-attempt requests do not reproduce the exact reconciliation artifact.',
      },
    };
  }
  const expectedPayload = fingerprint(
    'reconciliation-payload',
    reconciliationArtifactPayload(artifact),
  );
  if (artifact.payloadFingerprint !== expectedPayload) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its refill reconciliation payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyPatientSlotRefillReconciliationContext = (input: {
  readonly artifact: unknown;
  readonly currentInput: unknown;
}): PatientSlotRefillReconciliationContextResult => {
  const integrity = verifyPatientSlotRefillReconciliationIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const expected = compilePatientSlotRefillReconciliation(input.currentInput);
  if (!expected.ok || !sameCanonicalValue(expected.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: expected.ok
          ? 'The refill artifact does not match the exact current reconciliation input.'
          : `${expected.error.code}: ${expected.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
