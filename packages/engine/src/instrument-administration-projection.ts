import {
  FrozenInstrumentAdministrationSchema,
  type FrozenInstrumentAdministration,
} from '@psychsim/schemas';

import { verifyInstrumentAdministrationCompilationIntegrity } from './instrument-administration-compiler';

export type InstrumentAdministrationProjectionResult =
  | { readonly ok: true; readonly value: FrozenInstrumentAdministration }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'ADMINISTRATION_COMPILATION_INVALID' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type InstrumentAdministrationProjectionIntegrityResult =
  | { readonly ok: true; readonly value: FrozenInstrumentAdministration }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'ADMINISTRATION_COMPILATION_INVALID'
          | 'INVALID_PROJECTION'
          | 'PROJECTION_MISMATCH';
        readonly message: string;
      };
    };

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const canonicalizeObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left === right ? 0 : left < right ? -1 : 1))
        .map(([key, child]) => [key, canonicalizeObjectKeys(child)]),
    );
  }
  return value;
};

const sameExactValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeObjectKeys(left)) === JSON.stringify(canonicalizeObjectKeys(right));

export const projectInstrumentAdministration = (
  input: unknown,
): InstrumentAdministrationProjectionResult => {
  const verified = verifyInstrumentAdministrationCompilationIntegrity(input);
  if (!verified.ok) {
    return {
      ok: false,
      error: {
        code: 'ADMINISTRATION_COMPILATION_INVALID',
        message: verified.error.message,
      },
    };
  }
  const { administration, compileRequest } = verified.value;
  const projected = FrozenInstrumentAdministrationSchema.safeParse({
    schemaVersion: 1,
    id: administration.id,
    patientStateId: administration.patientStateId,
    informationActionId: administration.informationActionId,
    administrationDefinitionId: administration.definitionId,
    administrationDefinitionContentVersion: administration.definitionContentVersion,
    instrumentDefinitionId: administration.instrumentDefinitionId,
    instrumentContentVersion: administration.instrumentContentVersion,
    respondentSourceKind: administration.respondentSourceKind,
    timeScopeId: administration.timeScopeId,
    rightsBoundaryId: administration.rightsBoundaryId,
    completionStatus: administration.completionStatus,
    itemCount: compileRequest.administrationDefinition.itemIds.length,
    completedItemCount: administration.includedItemResponseIds.length,
    missingItemCount: administration.missingItemIds.length,
    rawTotal: administration.rawTotal,
  });
  if (!projected.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_OUTPUT',
        message: issuesText(projected.error.issues),
      },
    };
  }
  return { ok: true, value: projected.data };
};

export const verifyInstrumentAdministrationProjection = (
  administrationCompilation: unknown,
  projection: unknown,
): InstrumentAdministrationProjectionIntegrityResult => {
  const projected = FrozenInstrumentAdministrationSchema.safeParse(projection);
  if (!projected.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PROJECTION',
        message: issuesText(projected.error.issues),
      },
    };
  }
  const replay = projectInstrumentAdministration(administrationCompilation);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'ADMINISTRATION_COMPILATION_INVALID',
        message: replay.error.message,
      },
    };
  }
  if (!sameExactValue(replay.value, projected.data)) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_MISMATCH',
        message: `${projected.data.id} is not the exact presentation-safe projection of the supplied D-283 artifact.`,
      },
    };
  }
  return { ok: true, value: projected.data };
};
