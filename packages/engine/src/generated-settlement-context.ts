import {
  GeneratedEncounterSettlementContextSnapshotSchema,
  GeneratedEncounterSettlementContextSourceSchema,
  type ClinicOperationalContext,
  type GeneratedEncounterAttemptFingerprint,
  type GeneratedEncounterSettlementContextSnapshot,
  type GeneratedEncounterSettlementContextSource,
  type PatientTemplate,
  type PatientTemplateLocationAdmissionMatrixFingerprint,
} from '@psychsim/schemas';

import { fingerprintPatientTemplateLocationAdmissionTemplate } from './patient-template-location-admission-compiler';
import { projectClinicOperationalContext } from './selected-location-operational-resource-compiler';
import { calculateSatisfactionState } from './satisfaction';

export const NATIVE_GENERATED_SETTLEMENT_CONTEXT_COMPILER_VERSION = '1.0.0';

export type GeneratedSettlementContextCompileResult =
  | { readonly ok: true; readonly value: GeneratedEncounterSettlementContextSnapshot }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SOURCE' | 'CONTEXT_MISMATCH' | 'INVALID_OUTPUT';
        readonly message: string;
        readonly contentIds: readonly string[];
      };
    };

export type GeneratedSettlementContextIntegrityResult =
  | { readonly ok: true; readonly value: GeneratedEncounterSettlementContextSnapshot }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'UNSUPPORTED_COMPILER_VERSION' | 'REPLAY_MISMATCH';
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

const fingerprint = (scope: string, value: unknown): GeneratedEncounterAttemptFingerprint =>
  `fingerprint.generated-encounter-attempt.${scope}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(value)),
  )}`;

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

const fail = (
  code: 'INVALID_SOURCE' | 'CONTEXT_MISMATCH' | 'INVALID_OUTPUT',
  message: string,
  contentIds: readonly string[],
): GeneratedSettlementContextCompileResult => ({
  ok: false,
  error: {
    code,
    message,
    contentIds: [...new Set(contentIds)].sort(compareStrings),
  },
});

const snapshotPayload = (
  snapshot: Omit<GeneratedEncounterSettlementContextSnapshot, 'id' | 'payloadFingerprint'>,
): unknown => snapshot;

const verifySourceContext = (input: {
  readonly source: GeneratedEncounterSettlementContextSource;
  readonly template: PatientTemplate;
  readonly templateFingerprint: PatientTemplateLocationAdmissionMatrixFingerprint;
  readonly clinicOperationalContext: ClinicOperationalContext;
}): string | null => {
  const { source, template, templateFingerprint, clinicOperationalContext } = input;
  const policy = source.economyPolicy;
  if (
    policy.templateRef.id !== template.id ||
    policy.templateRef.contentVersion !== template.contentVersion ||
    policy.templateFingerprint !== templateFingerprint ||
    fingerprintPatientTemplateLocationAdmissionTemplate(template) !== templateFingerprint
  ) {
    return 'The generated economy policy must pin the exact waiting-patient template and fingerprint.';
  }
  if (
    !sameCanonicalValue(
      projectClinicOperationalContext(source.clinicState),
      clinicOperationalContext,
    )
  ) {
    return 'The generated clinic economy state must project to the exact operational clinic context that admitted the waiting patient.';
  }
  const satisfaction = calculateSatisfactionState(
    source.clinicState.satisfaction,
    source.satisfactionConfigurationOwner.configuration,
  );
  if (satisfaction.multiplier !== source.clinicState.satisfactionMultiplier) {
    return 'The stored clinic satisfaction multiplier must equal the exact versioned satisfaction-curve result.';
  }
  return null;
};

export const compileGeneratedEncounterSettlementContext = (input: {
  readonly source: unknown;
  readonly template: PatientTemplate;
  readonly templateFingerprint: PatientTemplateLocationAdmissionMatrixFingerprint;
  readonly clinicOperationalContext: ClinicOperationalContext;
}): GeneratedSettlementContextCompileResult => {
  const parsed = GeneratedEncounterSettlementContextSourceSchema.safeParse(input.source);
  if (!parsed.success) {
    return fail('INVALID_SOURCE', issuesText(parsed.error.issues), []);
  }
  const source = parsed.data;
  const mismatch = verifySourceContext({
    source,
    template: input.template,
    templateFingerprint: input.templateFingerprint,
    clinicOperationalContext: input.clinicOperationalContext,
  });
  if (mismatch !== null) {
    return fail('CONTEXT_MISMATCH', mismatch, [
      source.economyPolicy.id,
      source.clinicState.id,
      input.template.id,
    ]);
  }
  const economyPolicyOwnerFingerprint = fingerprint('economy-policy-owner', source.economyPolicy);
  const clinicStateOwnerFingerprint = fingerprint('clinic-state-owner', source.clinicState);
  const satisfactionConfigurationOwnerFingerprint = fingerprint(
    'satisfaction-configuration-owner',
    source.satisfactionConfigurationOwner,
  );
  const derivedSatisfactionMultiplier = calculateSatisfactionState(
    source.clinicState.satisfaction,
    source.satisfactionConfigurationOwner.configuration,
  ).multiplier;
  const withoutIdentity = {
    schemaVersion: 1 as const,
    compilerVersion: NATIVE_GENERATED_SETTLEMENT_CONTEXT_COMPILER_VERSION,
    modelVersion: 'generated-encounter-settlement-context.v1' as const,
    economyPolicy: source.economyPolicy,
    economyPolicyOwnerFingerprint,
    clinicState: source.clinicState,
    clinicStateOwnerFingerprint,
    clinicOperationalContext: input.clinicOperationalContext,
    satisfactionConfigurationOwner: source.satisfactionConfigurationOwner,
    satisfactionConfigurationOwnerFingerprint,
    derivedSatisfactionMultiplier,
  };
  const payloadFingerprint = fingerprint('settlement-context', snapshotPayload(withoutIdentity));
  const parsedOutput = GeneratedEncounterSettlementContextSnapshotSchema.safeParse({
    ...withoutIdentity,
    id: `generated-encounter-settlement-context.${payloadFingerprint.slice(-16)}`,
    payloadFingerprint,
  });
  return parsedOutput.success
    ? { ok: true, value: parsedOutput.data }
    : fail('INVALID_OUTPUT', issuesText(parsedOutput.error.issues), [
        source.economyPolicy.id,
        source.clinicState.id,
      ]);
};

export const verifyGeneratedEncounterSettlementContextIntegrity = (
  value: unknown,
): GeneratedSettlementContextIntegrityResult => {
  const parsed = GeneratedEncounterSettlementContextSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'INVALID_SCHEMA', message: issuesText(parsed.error.issues) },
    };
  }
  const snapshot = parsed.data;
  if (snapshot.compilerVersion !== NATIVE_GENERATED_SETTLEMENT_CONTEXT_COMPILER_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_COMPILER_VERSION',
        message: `Unsupported generated settlement-context compiler ${snapshot.compilerVersion}.`,
      },
    };
  }
  const satisfaction = calculateSatisfactionState(
    snapshot.clinicState.satisfaction,
    snapshot.satisfactionConfigurationOwner.configuration,
  );
  const withoutIdentity = {
    schemaVersion: snapshot.schemaVersion,
    compilerVersion: snapshot.compilerVersion,
    modelVersion: snapshot.modelVersion,
    economyPolicy: snapshot.economyPolicy,
    economyPolicyOwnerFingerprint: snapshot.economyPolicyOwnerFingerprint,
    clinicState: snapshot.clinicState,
    clinicStateOwnerFingerprint: snapshot.clinicStateOwnerFingerprint,
    clinicOperationalContext: snapshot.clinicOperationalContext,
    satisfactionConfigurationOwner: snapshot.satisfactionConfigurationOwner,
    satisfactionConfigurationOwnerFingerprint: snapshot.satisfactionConfigurationOwnerFingerprint,
    derivedSatisfactionMultiplier: snapshot.derivedSatisfactionMultiplier,
  };
  const expectedPayloadFingerprint = fingerprint(
    'settlement-context',
    snapshotPayload(withoutIdentity),
  );
  const expectedId = `generated-encounter-settlement-context.${expectedPayloadFingerprint.slice(
    -16,
  )}`;
  if (
    snapshot.economyPolicyOwnerFingerprint !==
      fingerprint('economy-policy-owner', snapshot.economyPolicy) ||
    snapshot.clinicStateOwnerFingerprint !==
      fingerprint('clinic-state-owner', snapshot.clinicState) ||
    snapshot.satisfactionConfigurationOwnerFingerprint !==
      fingerprint('satisfaction-configuration-owner', snapshot.satisfactionConfigurationOwner) ||
    !sameCanonicalValue(
      projectClinicOperationalContext(snapshot.clinicState),
      snapshot.clinicOperationalContext,
    ) ||
    satisfaction.multiplier !== snapshot.clinicState.satisfactionMultiplier ||
    satisfaction.multiplier !== snapshot.derivedSatisfactionMultiplier ||
    snapshot.payloadFingerprint !== expectedPayloadFingerprint ||
    snapshot.id !== expectedId
  ) {
    return {
      ok: false,
      error: {
        code: 'REPLAY_MISMATCH',
        message:
          'The generated settlement context does not equal its exact economy-policy, clinic-state, operational-context, and satisfaction replay.',
      },
    };
  }
  return { ok: true, value: snapshot };
};
