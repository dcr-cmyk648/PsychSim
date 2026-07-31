import {
  type InformationActionDefinition,
  type InformationActionPayloadFingerprint,
} from '@psychsim/schemas';

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

export const normalizeInformationActionForFingerprint = (
  action: InformationActionDefinition,
): InformationActionDefinition => ({
  ...action,
  searchAliases: [...new Set(action.searchAliases)].sort(compareStrings),
});

/**
 * Shared exact action-payload authority for detached authoring compilers.
 * Keeping it neutral prevents a D-213 ↔ D-240 runtime import cycle.
 */
export const fingerprintInformationActionPayload = (
  action: InformationActionDefinition,
): InformationActionPayloadFingerprint =>
  `fingerprint.information-action.${action.id}.fnv1a64.${hashToHex64(
    JSON.stringify(canonicalizeObjectKeys(normalizeInformationActionForFingerprint(action))),
  )}`;
