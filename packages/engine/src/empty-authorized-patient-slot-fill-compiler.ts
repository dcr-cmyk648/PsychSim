import {
  EmptyAuthorizedPatientSlotFillArtifactSchema,
  EmptyAuthorizedPatientSlotFillCompileInputSchema,
  type EmptyAuthorizedPatientSlotFillArtifact,
  type EmptyAuthorizedPatientSlotFillCompileInput,
  type EmptyAuthorizedPatientSlotFillDiagnostic,
  type FrozenGeneratedWaitingSlot,
  type PatientTemplateClinicalResultFindingPipelineOrchestrationArtifact,
  type PatientSlotFillFingerprint,
} from '@psychsim/schemas';

import {
  composeFindingPipelineAudit,
  verifyFindingPipelineAuditContext,
} from './finding-pipeline-audit-composer';
import {
  compileLocationPatientSlotOccupancySnapshot,
  verifyLocationPatientSlotOccupancySnapshotIntegrity,
  verifyPatientSlotFillSeedAuthorityContext,
  verifyPatientSlotFillSeedAuthorityIntegrity,
} from './patient-slot-fill-seed-authority';
import {
  orchestratePatientTemplateClinicalResultFindingPipeline,
  verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity,
} from './patient-template-clinical-result-finding-pipeline-orchestrator';
import { verifyPatientTemplateClinicalResultResourceCoverageIntegrity } from './patient-template-clinical-result-resource-coverage-compiler';

export const EMPTY_AUTHORIZED_PATIENT_SLOT_FILL_COMPILER_VERSION = '3.0.0';

export type EmptyAuthorizedPatientSlotFillCompileResult =
  | { readonly ok: true; readonly value: EmptyAuthorizedPatientSlotFillArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_INPUT'
          | 'INVALID_SEED_AUTHORITY'
          | 'INVALID_RESOURCE_COVERAGE'
          | 'OCCUPANCY_PROPOSAL_FAILED'
          | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type EmptyAuthorizedPatientSlotFillIntegrityResult =
  | { readonly ok: true; readonly value: EmptyAuthorizedPatientSlotFillArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'INVALID_SCHEMA'
          | 'UNSUPPORTED_COMPILER_VERSION'
          | 'UPSTREAM_INTEGRITY_INVALID'
          | 'INPUT_FINGERPRINT_MISMATCH'
          | 'PAYLOAD_FINGERPRINT_MISMATCH';
        readonly message: string;
      };
    };

export type EmptyAuthorizedPatientSlotFillContextResult =
  | { readonly ok: true; readonly value: EmptyAuthorizedPatientSlotFillArtifact }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ARTIFACT' | 'CONTEXT_MISMATCH';
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

const fingerprint = (scope: string, value: unknown): PatientSlotFillFingerprint =>
  `fingerprint.patient-slot-fill.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Exclude<
    EmptyAuthorizedPatientSlotFillCompileResult,
    { readonly ok: true }
  >['error']['code'],
  message: string,
  contentIds: readonly string[] = [],
): EmptyAuthorizedPatientSlotFillCompileResult => ({
  ok: false,
  error: { code, message, contentIds: uniqueSorted(contentIds) },
});

const diagnostic = (input: {
  readonly code: EmptyAuthorizedPatientSlotFillDiagnostic['code'];
  readonly message: string;
  readonly contentIds: readonly string[];
}): EmptyAuthorizedPatientSlotFillDiagnostic => ({
  schemaVersion: 1,
  id: `empty-authorized-patient-slot-fill-diagnostic.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(input)),
  )}`,
  code: input.code,
  message: input.message,
  contentIds: uniqueSorted(input.contentIds),
});

const inputPayload = (
  input: Pick<
    EmptyAuthorizedPatientSlotFillArtifact,
    | 'requestId'
    | 'seedAuthorityArtifact'
    | 'findingPipelineAuditRequest'
    | 'clinicalResultResourceCoverageArtifact'
  >,
): unknown => ({
  requestId: input.requestId,
  seedAuthorityRef: {
    id: input.seedAuthorityArtifact.id,
    inputFingerprint: input.seedAuthorityArtifact.inputFingerprint,
    payloadFingerprint: input.seedAuthorityArtifact.payloadFingerprint,
  },
  findingPipelineAuditRequest: input.findingPipelineAuditRequest,
  clinicalResultResourceCoverageRef:
    input.clinicalResultResourceCoverageArtifact === null
      ? null
      : {
          id: input.clinicalResultResourceCoverageArtifact.id,
          inputFingerprint: input.clinicalResultResourceCoverageArtifact.inputFingerprint,
          payloadFingerprint: input.clinicalResultResourceCoverageArtifact.payloadFingerprint,
        },
});

const artifactPayload = (
  artifact: Omit<EmptyAuthorizedPatientSlotFillArtifact, 'id' | 'payloadFingerprint'>,
): unknown => ({
  schemaVersion: artifact.schemaVersion,
  compilerVersion: artifact.compilerVersion,
  requestId: artifact.requestId,
  status: artifact.status,
  mode: artifact.mode,
  slotCoordinate: artifact.slotCoordinate,
  attemptedFillOrdinal: artifact.attemptedFillOrdinal,
  nextFillOrdinal: artifact.nextFillOrdinal,
  seedAuthorityArtifact: artifact.seedAuthorityArtifact,
  findingPipelineAuditRequest: artifact.findingPipelineAuditRequest,
  clinicalResultResourceCoverageArtifact: artifact.clinicalResultResourceCoverageArtifact,
  clinicalResultFindingPipelineOrchestrationArtifact:
    artifact.clinicalResultFindingPipelineOrchestrationArtifact,
  findingPipelineAuditArtifact: artifact.findingPipelineAuditArtifact,
  frozenWaitingSlotProposal: artifact.frozenWaitingSlotProposal,
  proposedOccupancySnapshotArtifact: artifact.proposedOccupancySnapshotArtifact,
  diagnostics: artifact.diagnostics,
  inputFingerprint: artifact.inputFingerprint,
});

/**
 * Finalizes one already-authorized D-233 empty-slot attempt. The function
 * never mutates queue state. It returns one atomic proposal that consumes the
 * coordinate ordinal whether D-200 compiles a complete patient or records a
 * deterministic blocker; occupied coordinates are rejected earlier by the
 * seed-authority compiler and are never overwritten.
 */
export const compileEmptyAuthorizedPatientSlotFill = (
  value: unknown,
): EmptyAuthorizedPatientSlotFillCompileResult => {
  const parsed = EmptyAuthorizedPatientSlotFillCompileInputSchema.safeParse(value);
  if (!parsed.success) return fail('INVALID_INPUT', issuesText(parsed.error.issues));
  const input: EmptyAuthorizedPatientSlotFillCompileInput = parsed.data;
  const seedAuthority = verifyPatientSlotFillSeedAuthorityContext({
    artifact: input.seedAuthorityArtifact,
    currentInput: input.seedAuthorityCompileInput,
  });
  if (!seedAuthority.ok) {
    return fail(
      'INVALID_SEED_AUTHORITY',
      `${seedAuthority.error.code}: ${seedAuthority.error.message}`,
      [input.seedAuthorityArtifact.id],
    );
  }

  if (input.clinicalResultResourceCoverageArtifact !== null) {
    const coverage = verifyPatientTemplateClinicalResultResourceCoverageIntegrity(
      input.clinicalResultResourceCoverageArtifact,
    );
    if (!coverage.ok) {
      return fail(
        'INVALID_RESOURCE_COVERAGE',
        `${coverage.error.code}: ${coverage.error.message}`,
        [input.clinicalResultResourceCoverageArtifact.id],
      );
    }
  }

  let clinicalResultFindingPipelineOrchestrationArtifact: PatientTemplateClinicalResultFindingPipelineOrchestrationArtifact | null =
    null;
  const d200 =
    input.clinicalResultResourceCoverageArtifact === null
      ? composeFindingPipelineAudit(input.findingPipelineAuditRequest)
      : (() => {
          const orchestration = orchestratePatientTemplateClinicalResultFindingPipeline({
            schemaVersion: 1,
            id: `patient-template-clinical-result-finding-pipeline-orchestration-request.d331.${hashToHex64(
              input.id,
            )}`,
            baseFindingPipelineAuditRequest: input.findingPipelineAuditRequest,
            resourceCoverageArtifact: input.clinicalResultResourceCoverageArtifact,
          });
          if (!orchestration.ok) return orchestration;
          clinicalResultFindingPipelineOrchestrationArtifact = orchestration.value;
          return {
            ok: true as const,
            value: orchestration.value.findingPipelineAuditArtifact,
          };
        })();
  let findingPipelineAuditArtifact: EmptyAuthorizedPatientSlotFillArtifact['findingPipelineAuditArtifact'] =
    null;
  let frozenWaitingSlotProposal: FrozenGeneratedWaitingSlot | null = null;
  const diagnostics: EmptyAuthorizedPatientSlotFillDiagnostic[] = [];
  if (!d200.ok) {
    diagnostics.push(
      diagnostic({
        code: 'patient_compilation_failed',
        message: `${d200.error.code}: ${d200.error.message}`,
        contentIds: [seedAuthority.value.id, ...d200.error.contentIds],
      }),
    );
  } else if (d200.value.status === 'literal_finding_conflict') {
    findingPipelineAuditArtifact = d200.value;
    diagnostics.push(
      diagnostic({
        code: 'literal_finding_conflict',
        message:
          d200.value.sharedFindingConflict?.message ??
          'The deterministic D-193/D-194 compile retained a literal same-scope finding conflict.',
        contentIds: [d200.value.id, ...(d200.value.sharedFindingConflict?.contentIds ?? [])],
      }),
    );
  } else {
    findingPipelineAuditArtifact = d200.value;
    const waitingSlotId = `frozen-generated-waiting-slot.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          seedAuthorityId: seedAuthority.value.id,
          findingPipelineAuditId: d200.value.id,
        }),
      ),
    )}`;
    frozenWaitingSlotProposal = {
      schemaVersion: 1,
      id: waitingSlotId,
      findingPipelineAuditArtifact: d200.value,
    };
  }

  const attemptedFillOrdinal = seedAuthority.value.coordinates.fillOrdinal;
  const nextFillOrdinal = attemptedFillOrdinal + 1;
  const targetSlotCoordinateId = seedAuthority.value.coordinates.slotCoordinateId;
  const nextOccupancyInput = {
    ...structuredClone(input.seedAuthorityCompileInput.currentOccupancyInput),
    id: `location-patient-slot-occupancy-request.d233.${hashToHex64(
      JSON.stringify(
        canonicalizeObjectKeys({
          fillRequestId: input.id,
          targetSlotCoordinateId,
          nextFillOrdinal,
          waitingSlotId: frozenWaitingSlotProposal?.id ?? null,
        }),
      ),
    )}`,
    entries: input.seedAuthorityCompileInput.currentOccupancyInput.entries.map((entry) =>
      entry.slotCoordinateId === targetSlotCoordinateId
        ? {
            ...entry,
            nextFillOrdinal,
            frozenWaitingSlot: frozenWaitingSlotProposal,
          }
        : entry,
    ),
  };
  const occupancy = compileLocationPatientSlotOccupancySnapshot(nextOccupancyInput);
  if (!occupancy.ok) {
    return fail(
      'OCCUPANCY_PROPOSAL_FAILED',
      `${occupancy.error.code}: ${occupancy.error.message}`,
      occupancy.error.contentIds,
    );
  }

  const inputFingerprint = fingerprint(
    'authorized-fill-input',
    inputPayload({
      requestId: input.id,
      seedAuthorityArtifact: seedAuthority.value,
      findingPipelineAuditRequest: input.findingPipelineAuditRequest,
      clinicalResultResourceCoverageArtifact: input.clinicalResultResourceCoverageArtifact,
    }),
  );
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: EMPTY_AUTHORIZED_PATIENT_SLOT_FILL_COMPILER_VERSION,
    requestId: input.id,
    status: diagnostics.length === 0 ? ('filled' as const) : ('blocked' as const),
    mode: seedAuthority.value.coordinates.mode,
    slotCoordinate: seedAuthority.value.capacityBoundSlotCertificateArtifact.slotCoordinate,
    attemptedFillOrdinal,
    nextFillOrdinal,
    seedAuthorityArtifact: seedAuthority.value,
    findingPipelineAuditRequest: input.findingPipelineAuditRequest,
    clinicalResultResourceCoverageArtifact: input.clinicalResultResourceCoverageArtifact,
    clinicalResultFindingPipelineOrchestrationArtifact,
    findingPipelineAuditArtifact,
    frozenWaitingSlotProposal,
    proposedOccupancySnapshotArtifact: occupancy.value,
    diagnostics,
    inputFingerprint,
  };
  const payloadFingerprint = fingerprint(
    'authorized-fill-payload',
    artifactPayload(withoutIdentity),
  );
  const output = EmptyAuthorizedPatientSlotFillArtifactSchema.safeParse({
    ...withoutIdentity,
    id: `empty-authorized-patient-slot-fill.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      seedAuthority.value.id,
      ...(input.clinicalResultResourceCoverageArtifact === null
        ? []
        : [input.clinicalResultResourceCoverageArtifact.id]),
      ...(clinicalResultFindingPipelineOrchestrationArtifact === null
        ? []
        : [clinicalResultFindingPipelineOrchestrationArtifact.id]),
      ...(findingPipelineAuditArtifact === null ? [] : [findingPipelineAuditArtifact.id]),
      occupancy.value.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyEmptyAuthorizedPatientSlotFillIntegrity = (
  value: unknown,
): EmptyAuthorizedPatientSlotFillIntegrityResult => {
  const parsed = EmptyAuthorizedPatientSlotFillArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const artifact = parsed.data;
  if (artifact.compilerVersion !== EMPTY_AUTHORIZED_PATIENT_SLOT_FILL_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported empty-slot fill compiler ${artifact.compilerVersion}.`,
      },
    };
  }
  const seedAuthority = verifyPatientSlotFillSeedAuthorityIntegrity(artifact.seedAuthorityArtifact);
  const occupancy = verifyLocationPatientSlotOccupancySnapshotIntegrity(
    artifact.proposedOccupancySnapshotArtifact,
  );
  if (!seedAuthority.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: seedAuthority.error.message,
      },
    };
  }
  if (!occupancy.ok) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message: occupancy.error.message,
      },
    };
  }
  if (artifact.clinicalResultResourceCoverageArtifact !== null) {
    const coverage = verifyPatientTemplateClinicalResultResourceCoverageIntegrity(
      artifact.clinicalResultResourceCoverageArtifact,
    );
    if (!coverage.ok) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_INTEGRITY_INVALID',
          message: coverage.error.message,
        },
      };
    }
  }
  const replayedResultOrchestration =
    artifact.clinicalResultResourceCoverageArtifact === null
      ? null
      : orchestratePatientTemplateClinicalResultFindingPipeline({
          schemaVersion: 1,
          id: `patient-template-clinical-result-finding-pipeline-orchestration-request.d331.${hashToHex64(
            artifact.requestId,
          )}`,
          baseFindingPipelineAuditRequest: artifact.findingPipelineAuditRequest,
          resourceCoverageArtifact: artifact.clinicalResultResourceCoverageArtifact,
        });
  const replayedPipeline =
    replayedResultOrchestration === null
      ? composeFindingPipelineAudit(artifact.findingPipelineAuditRequest)
      : replayedResultOrchestration.ok
        ? {
            ok: true as const,
            value: replayedResultOrchestration.value.findingPipelineAuditArtifact,
          }
        : replayedResultOrchestration;
  const expectedResultOrchestration =
    replayedResultOrchestration?.ok === true ? replayedResultOrchestration.value : null;
  let expectedPipelineArtifact: EmptyAuthorizedPatientSlotFillArtifact['findingPipelineAuditArtifact'] =
    null;
  let expectedFrozenWaitingSlot: FrozenGeneratedWaitingSlot | null = null;
  let expectedDiagnostics: EmptyAuthorizedPatientSlotFillDiagnostic[] = [];
  if (!replayedPipeline.ok) {
    expectedDiagnostics = [
      diagnostic({
        code: 'patient_compilation_failed',
        message: `${replayedPipeline.error.code}: ${replayedPipeline.error.message}`,
        contentIds: [seedAuthority.value.id, ...replayedPipeline.error.contentIds],
      }),
    ];
  } else if (replayedPipeline.value.status === 'literal_finding_conflict') {
    expectedPipelineArtifact = replayedPipeline.value;
    expectedDiagnostics = [
      diagnostic({
        code: 'literal_finding_conflict',
        message:
          replayedPipeline.value.sharedFindingConflict?.message ??
          'The deterministic D-193/D-194 compile retained a literal same-scope finding conflict.',
        contentIds: [
          replayedPipeline.value.id,
          ...(replayedPipeline.value.sharedFindingConflict?.contentIds ?? []),
        ],
      }),
    ];
  } else {
    expectedPipelineArtifact = replayedPipeline.value;
    expectedFrozenWaitingSlot = {
      schemaVersion: 1,
      id: `frozen-generated-waiting-slot.${hashToHex64(
        JSON.stringify(
          canonicalizeObjectKeys({
            seedAuthorityId: seedAuthority.value.id,
            findingPipelineAuditId: replayedPipeline.value.id,
          }),
        ),
      )}`,
      findingPipelineAuditArtifact: replayedPipeline.value,
    };
  }
  if (
    !sameCanonicalValue(
      artifact.clinicalResultFindingPipelineOrchestrationArtifact,
      expectedResultOrchestration,
    ) ||
    !sameCanonicalValue(artifact.findingPipelineAuditArtifact, expectedPipelineArtifact) ||
    !sameCanonicalValue(artifact.frozenWaitingSlotProposal, expectedFrozenWaitingSlot) ||
    !sameCanonicalValue(artifact.diagnostics, expectedDiagnostics)
  ) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message:
          'The retained fill outcome does not exactly match deterministic D-200 replay, its blocker trace, or its frozen waiting-slot proposal.',
      },
    };
  }
  if (artifact.clinicalResultFindingPipelineOrchestrationArtifact !== null) {
    const orchestrationIntegrity =
      verifyPatientTemplateClinicalResultFindingPipelineOrchestrationIntegrity(
        artifact.clinicalResultFindingPipelineOrchestrationArtifact,
      );
    if (!orchestrationIntegrity.ok) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_INTEGRITY_INVALID',
          message: orchestrationIntegrity.error.message,
        },
      };
    }
  }
  if (artifact.findingPipelineAuditArtifact !== null) {
    if (artifact.clinicalResultFindingPipelineOrchestrationArtifact === null) {
      const context = verifyFindingPipelineAuditContext({
        artifact: artifact.findingPipelineAuditArtifact,
        request: artifact.findingPipelineAuditRequest,
      });
      if (!context.ok) {
        return {
          ok: false,
          error: {
            code: 'UPSTREAM_INTEGRITY_INVALID',
            message: context.error.message,
          },
        };
      }
    }
  }

  const priorOccupancy = seedAuthority.value.occupancySnapshotArtifact;
  const proposedOccupancy = occupancy.value;
  const targetCoordinateId = seedAuthority.value.coordinates.slotCoordinateId;
  const expectedOccupancyRequestId = `location-patient-slot-occupancy-request.d233.${hashToHex64(
    JSON.stringify(
      canonicalizeObjectKeys({
        fillRequestId: artifact.requestId,
        targetSlotCoordinateId: targetCoordinateId,
        nextFillOrdinal: artifact.nextFillOrdinal,
        waitingSlotId: expectedFrozenWaitingSlot?.id ?? null,
      }),
    ),
  )}`;
  const priorByCoordinateId = new Map(
    priorOccupancy.entries.map((entry) => [entry.capacityCoordinate.slotCoordinate.id, entry]),
  );
  const proposedByCoordinateId = new Map(
    proposedOccupancy.entries.map((entry) => [entry.capacityCoordinate.slotCoordinate.id, entry]),
  );
  const unchangedEnvelope =
    proposedOccupancy.requestId === expectedOccupancyRequestId &&
    proposedOccupancy.mode === priorOccupancy.mode &&
    proposedOccupancy.careSetting === priorOccupancy.careSetting &&
    sameCanonicalValue(proposedOccupancy.locationRef, priorOccupancy.locationRef) &&
    proposedOccupancy.locationFingerprint === priorOccupancy.locationFingerprint &&
    sameCanonicalValue(proposedOccupancy.capacityArtifactRef, priorOccupancy.capacityArtifactRef) &&
    proposedOccupancy.entries.length === priorOccupancy.entries.length;
  const unrelatedEntriesUnchanged = priorOccupancy.entries.every((entry) => {
    const coordinateId = entry.capacityCoordinate.slotCoordinate.id;
    if (coordinateId === targetCoordinateId) return true;
    return sameCanonicalValue(entry, proposedByCoordinateId.get(coordinateId));
  });
  const priorTarget = priorByCoordinateId.get(targetCoordinateId);
  const proposedTarget = proposedByCoordinateId.get(targetCoordinateId);
  let targetTransitionIsExact = false;
  if (
    priorTarget?.status === 'empty' &&
    proposedTarget !== undefined &&
    sameCanonicalValue(proposedTarget.capacityCoordinate, priorTarget.capacityCoordinate) &&
    proposedTarget.nextFillOrdinal === artifact.nextFillOrdinal
  ) {
    if (artifact.status === 'blocked') {
      targetTransitionIsExact =
        proposedTarget.status === 'empty' && proposedTarget.occupiedAssignment === null;
    } else if (
      proposedTarget.status === 'occupied' &&
      expectedPipelineArtifact?.status === 'compiled' &&
      expectedPipelineArtifact.catalogSnapshot !== null &&
      expectedFrozenWaitingSlot !== null
    ) {
      targetTransitionIsExact = sameCanonicalValue(proposedTarget.occupiedAssignment, {
        waitingSlotId: expectedFrozenWaitingSlot.id,
        fillOrdinal: artifact.attemptedFillOrdinal,
        findingPipelineAuditRef: {
          id: expectedPipelineArtifact.id,
          payloadFingerprint: expectedPipelineArtifact.payloadFingerprint,
        },
        patientInstanceRef: {
          id: expectedPipelineArtifact.catalogSnapshot.patientInstance.id,
          payloadFingerprint:
            expectedPipelineArtifact.catalogSnapshot.patientInstance.payloadFingerprint,
        },
        templateRef: seedAuthority.value.selectedTemplateRef,
        templateFingerprint: seedAuthority.value.selectedTemplateFingerprint,
        patientSlotFillSeedAuthorityRef: {
          id: seedAuthority.value.id,
          inputFingerprint: seedAuthority.value.inputFingerprint,
          payloadFingerprint: seedAuthority.value.payloadFingerprint,
        },
      });
    }
  }
  if (!unchangedEnvelope || !unrelatedEntriesUnchanged || !targetTransitionIsExact) {
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_INTEGRITY_INVALID',
        message:
          'The proposed occupancy must preserve every unrelated coordinate and apply exactly one audited empty-to-filled or empty-to-empty ordinal transition at the authorized target.',
      },
    };
  }
  const expectedInputFingerprint = fingerprint('authorized-fill-input', inputPayload(artifact));
  if (artifact.inputFingerprint !== expectedInputFingerprint) {
    return {
      ok: false,
      error: {
        code: 'INPUT_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its compact authorized-fill input.`,
      },
    };
  }
  const expectedPayloadFingerprint = fingerprint(
    'authorized-fill-payload',
    artifactPayload(artifact),
  );
  if (
    artifact.payloadFingerprint !== expectedPayloadFingerprint ||
    artifact.id !== `empty-authorized-patient-slot-fill.${expectedPayloadFingerprint.slice(-16)}`
  ) {
    return {
      ok: false,
      error: {
        code: 'PAYLOAD_FINGERPRINT_MISMATCH',
        message: `${artifact.id} does not match its atomic fill payload.`,
      },
    };
  }
  return { ok: true, value: artifact };
};

export const verifyEmptyAuthorizedPatientSlotFillContext = (input: {
  readonly artifact: unknown;
  readonly currentInput: unknown;
}): EmptyAuthorizedPatientSlotFillContextResult => {
  const integrity = verifyEmptyAuthorizedPatientSlotFillIntegrity(input.artifact);
  if (!integrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARTIFACT',
        message: `${integrity.error.code}: ${integrity.error.message}`,
      },
    };
  }
  const replay = compileEmptyAuthorizedPatientSlotFill(input.currentInput);
  if (!replay.ok || !sameCanonicalValue(replay.value, integrity.value)) {
    return {
      ok: false,
      error: {
        code: 'CONTEXT_MISMATCH',
        message: replay.ok
          ? 'The atomic fill artifact does not match deterministic replay from the exact current empty-slot attempt.'
          : `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  return { ok: true, value: integrity.value };
};
