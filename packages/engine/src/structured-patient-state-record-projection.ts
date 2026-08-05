import {
  FrozenStructuredPatientStateRecordProjectionSchema,
  StructuredPatientStateRevealProjectionEnvelopeSchema,
  type FrozenStructuredPatientStateRecord,
  type FrozenStructuredPatientStateRecordProjection,
  type ResolvedPatientState,
  type StructuredPatientStateRecordProjectionFingerprint,
  type StructuredPatientStateRevealLane,
  type StructuredPatientStateRevealProjectionEnvelope,
} from '@psychsim/schemas';

export const STRUCTURED_PATIENT_STATE_RECORD_PROJECTION_VERSION = '1.0.0';

export type StructuredPatientStateRecordProjectionResult =
  | { readonly ok: true; readonly value: FrozenStructuredPatientStateRecordProjection }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_ENVELOPE' | 'RECORD_PROJECTION_FAILED' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type StructuredPatientStateRecordProjectionIntegrityResult =
  | { readonly ok: true; readonly value: FrozenStructuredPatientStateRecordProjection }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_PROJECTION' | 'ENVELOPE_INVALID' | 'PROJECTION_MISMATCH';
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

const fingerprint = (value: unknown): StructuredPatientStateRecordProjectionFingerprint =>
  `fingerprint.structured-patient-state-record-projection.payload.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort(compareStrings);

const fail = (
  code: Extract<
    StructuredPatientStateRecordProjectionResult,
    { readonly ok: false }
  >['error']['code'],
  message: string,
  contentIds: readonly string[],
): StructuredPatientStateRecordProjectionResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: uniqueSorted(contentIds),
  },
});

const findById = <Value extends { readonly id: string }>(
  values: readonly Value[],
  id: string,
): Value | undefined => values.find((value) => value.id === id);

type StructuredRevealSingletonStatement =
  StructuredPatientStateRevealProjectionEnvelope['resolved']['singletonStatements'][number];

const projectSingletonStatement = (
  statement: StructuredRevealSingletonStatement,
): FrozenStructuredPatientStateRecordProjection['singletonStatements'][number] => {
  switch (statement.field) {
    case 'reaction_history_status':
      return {
        field: statement.field,
        presentedValue: statement.presentedValue,
      };
    case 'medication_reaction_assessment_status':
      return {
        field: statement.field,
        presentedValue: statement.presentedValue,
      };
    case 'reported_safety_planning_ability':
      return {
        field: statement.field,
        presentedValue: statement.presentedValue,
      };
  }
};

const projectRecord = (
  patientState: ResolvedPatientState,
  lane: StructuredPatientStateRevealLane,
  recordId: string,
): FrozenStructuredPatientStateRecord | null => {
  switch (lane) {
    case 'diagnosis_record_entries': {
      const record = findById(patientState.diagnosisRecordEntries, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        recordedLabel: record.recordedLabel,
        assertion: record.assertion,
      };
    }
    case 'medication_regimen_entries': {
      const record = findById(patientState.medicationRegimenEntries, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        medicationIdentityId: record.medicationIdentityId,
        status: record.status,
        adherence: record.adherence,
      };
    }
    case 'exposure_use_entries': {
      const record = findById(patientState.exposureInventory.useEntries, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        agent: { ...record.agent },
        mostRecentUse: { ...record.mostRecentUse },
        currentAmount: record.currentAmount === null ? null : { ...record.currentAmount },
        prescriptionRelationship: record.prescriptionRelationship,
      };
    }
    case 'medication_trials': {
      const record = findById(patientState.treatmentHistory.medicationTrials, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        medicationId: record.medicationId,
        duration:
          record.exposure?.duration === null || record.exposure?.duration === undefined
            ? null
            : { ...record.exposure.duration },
        highestReportedDose:
          record.exposure?.maximumDose === null || record.exposure?.maximumDose === undefined
            ? null
            : { ...record.exposure.maximumDose },
        adherence: record.adherence,
        response: record.response,
        tolerability: record.tolerability,
      };
    }
    case 'psychotherapy_trials': {
      const record = findById(patientState.treatmentHistory.psychotherapyTrials, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        interventionId: record.interventionId,
        status: record.status,
        response: record.response,
      };
    }
    case 'current_treatment_providers': {
      const record = findById(patientState.treatmentHistory.currentProviders, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        providerType: record.providerType,
        active: record.active,
      };
    }
    case 'prior_levels_of_care': {
      const record = findById(patientState.treatmentHistory.priorLevelsOfCare, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        level: record.level,
        occurrenceCount: record.occurrenceCount,
      };
    }
    case 'medication_tolerability_findings': {
      const record = findById(patientState.medicationTolerabilityFindings, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        subject: { ...record.subject },
        domain: record.domain,
        findingStatus: record.findingStatus,
        manifestationIds: [...record.manifestationIds],
      };
    }
    case 'current_medication_reported_benefits': {
      const record = findById(patientState.currentMedicationReportedBenefits, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        subject: { ...record.subject },
        reportedBenefit: record.reportedBenefit,
      };
    }
    case 'current_medication_dose_positions': {
      const record = findById(patientState.currentMedicationDosePositions, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        subject: { ...record.subject },
        position: record.position,
      };
    }
    case 'medication_change_temporal_relationships': {
      const record = findById(patientState.medicationChangeTemporalRelationships, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        subject: { ...record.subject },
        changeKind: record.changeKind,
        target: { ...record.target },
        relationship: record.relationship,
      };
    }
    case 'reaction_records': {
      const record = findById(patientState.reactionHistory.records, recordId);
      if (record === undefined) return null;
      return {
        schemaVersion: 1,
        lane,
        recordId: record.id,
        trigger: { ...record.trigger },
        recordedAs: record.recordedAs,
        manifestationIds: [...record.manifestationIds],
        reportedSeverity: record.reportedSeverity,
        status: record.status,
      };
    }
  }
};

const projectionPayload = (
  projection: Omit<FrozenStructuredPatientStateRecordProjection, 'id' | 'payloadFingerprint'>,
): unknown => projection;

/**
 * Projects one exact D-212 source view into a minimized record payload. It
 * performs no source selection, clinical interpretation, generation, result
 * attachment, reveal, scoring, persistence, or UI work.
 */
export const projectStructuredPatientStateRecords = (
  input: unknown,
): StructuredPatientStateRecordProjectionResult => {
  const parsed = StructuredPatientStateRevealProjectionEnvelopeSchema.safeParse(input);
  if (!parsed.success) {
    return fail('INVALID_ENVELOPE', issuesText(parsed.error.issues), []);
  }
  const envelope: StructuredPatientStateRevealProjectionEnvelope = parsed.data;
  const laneStatements: FrozenStructuredPatientStateRecordProjection['laneStatements'] = [];

  for (const statement of envelope.resolved.laneStatements) {
    const records: FrozenStructuredPatientStateRecord[] = [];
    for (const recordId of statement.includedTruthRecordIds) {
      const projected = projectRecord(envelope.patientState, statement.lane, recordId);
      if (projected === null) {
        return fail(
          'RECORD_PROJECTION_FAILED',
          `${recordId} is not an exact ${statement.lane} record in ${envelope.patientState.id}.`,
          [envelope.resolved.id, envelope.patientState.id, recordId],
        );
      }
      records.push(projected);
    }
    laneStatements.push({
      lane: statement.lane,
      presentationStatus: statement.presentationStatus,
      records: records.sort((left, right) => compareStrings(left.recordId, right.recordId)),
    });
  }

  const withoutIdentity: Omit<
    FrozenStructuredPatientStateRecordProjection,
    'id' | 'payloadFingerprint'
  > = {
    schemaVersion: 1,
    resolvedStructuredRevealId: envelope.resolved.id,
    definitionId: envelope.definition.id,
    definitionContentVersion: envelope.definition.contentVersion,
    informationActionId: envelope.definition.informationActionId,
    informationActionPayloadFingerprint: envelope.definition.informationActionPayloadFingerprint,
    patientStateId: envelope.patientState.id,
    source: { ...envelope.resolved.source },
    timeScopeId: envelope.resolved.timeScopeId,
    laneStatements: laneStatements.sort((left, right) => compareStrings(left.lane, right.lane)),
    singletonStatements: envelope.resolved.singletonStatements
      .map(projectSingletonStatement)
      .sort((left, right) => compareStrings(left.field, right.field)),
  };
  const payloadFingerprint = fingerprint(projectionPayload(withoutIdentity));
  const output = FrozenStructuredPatientStateRecordProjectionSchema.safeParse({
    ...withoutIdentity,
    id: `structured-patient-state-record-projection.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  if (!output.success) {
    return fail('INVALID_OUTPUT', issuesText(output.error.issues), [
      envelope.resolved.id,
      envelope.patientState.id,
    ]);
  }
  return { ok: true, value: output.data };
};

export const verifyStructuredPatientStateRecordProjection = (
  envelope: unknown,
  projection: unknown,
): StructuredPatientStateRecordProjectionIntegrityResult => {
  const parsedProjection = FrozenStructuredPatientStateRecordProjectionSchema.safeParse(projection);
  if (!parsedProjection.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PROJECTION',
        message: issuesText(parsedProjection.error.issues),
      },
    };
  }
  const replay = projectStructuredPatientStateRecords(envelope);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'ENVELOPE_INVALID',
        message: `${replay.error.code}: ${replay.error.message}`,
      },
    };
  }
  if (!sameExactValue(replay.value, parsedProjection.data)) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_MISMATCH',
        message: `${parsedProjection.data.id} is not the exact minimized projection of the supplied D-212 source view.`,
      },
    };
  }
  return { ok: true, value: parsedProjection.data };
};
