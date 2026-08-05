import {
  FrozenConditionFunctionalImpairmentProjectionSchema,
  type FrozenConditionFunctionalImpairmentProjection,
} from '@psychsim/schemas';

import { verifyConditionFunctionalImpairmentAttachmentIntegrity } from './condition-functional-impairment-attachment';

export type ConditionFunctionalImpairmentProjectionResult =
  | { readonly ok: true; readonly value: FrozenConditionFunctionalImpairmentProjection }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID' | 'INVALID_OUTPUT';
        readonly message: string;
      };
    };

export type ConditionFunctionalImpairmentProjectionIntegrityResult =
  | { readonly ok: true; readonly value: FrozenConditionFunctionalImpairmentProjection }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | 'FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID'
          | 'INVALID_PROJECTION'
          | 'PROJECTION_MISMATCH';
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

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

export const projectConditionFunctionalImpairmentAttachment = (
  input: unknown,
): ConditionFunctionalImpairmentProjectionResult => {
  const verified = verifyConditionFunctionalImpairmentAttachmentIntegrity(input);
  if (!verified.ok) {
    return {
      ok: false,
      error: {
        code: 'FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID',
        message: verified.error.message,
      },
    };
  }
  const attachment = verified.value;
  const projected = FrozenConditionFunctionalImpairmentProjectionSchema.safeParse({
    schemaVersion: 1,
    id: `condition-functional-impairment-projection.${attachment.payloadFingerprint.slice(-16)}`,
    patientStateId: attachment.basePatientStateRef.id,
    functionalImpairments: attachment.attachedFunctionalImpairments
      .map((impairment) => ({
        schemaVersion: 1 as const,
        id: impairment.id,
        level: impairment.level,
        sourceKind: impairment.source.kind,
        timeScopeId: impairment.timeScopeId,
      }))
      .sort((left, right) => compareStrings(left.id, right.id)),
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

export const verifyConditionFunctionalImpairmentProjection = (
  attachment: unknown,
  projection: unknown,
): ConditionFunctionalImpairmentProjectionIntegrityResult => {
  const parsedProjection =
    FrozenConditionFunctionalImpairmentProjectionSchema.safeParse(projection);
  if (!parsedProjection.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PROJECTION',
        message: issuesText(parsedProjection.error.issues),
      },
    };
  }
  const replay = projectConditionFunctionalImpairmentAttachment(attachment);
  if (!replay.ok) {
    return {
      ok: false,
      error: {
        code: 'FUNCTIONAL_IMPAIRMENT_ATTACHMENT_INVALID',
        message: replay.error.message,
      },
    };
  }
  if (!sameExactValue(replay.value, parsedProjection.data)) {
    return {
      ok: false,
      error: {
        code: 'PROJECTION_MISMATCH',
        message: `${parsedProjection.data.id} is not the exact target-redacted projection of the supplied D-289 attachment.`,
      },
    };
  }
  return { ok: true, value: parsedProjection.data };
};
