import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  MedicationIdentityDefinitionSchema,
  type MedicationIdentityDefinition,
} from '@psychsim/schemas';
import { z } from 'zod';

import { syncMedicationIdentityIndex } from './sync-medication-identity-index';

const RxNormMedicationIdentityCandidateSchema = z
  .object({
    id: z.string().regex(/^medication\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
    label: z.string().trim().min(1).max(180),
    normalizedIngredientName: z.string().trim().min(1).max(180),
    aliases: z.array(z.string().trim().min(1).max(180)),
    rxcui: z.string().regex(/^\d+$/),
  })
  .strict();

const RxNormMedicationIdentityIntakeManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    id: z.string().min(1),
    rxnormVersion: z.string().min(1),
    rxnormReleaseDate: z.string().date(),
    evidenceSourceId: z.string().min(1),
    sourceUseDecisionId: z.string().min(1),
    verifiedAt: z.string().datetime(),
    sourcePacketIds: z.array(z.string().min(1)),
    scopeNote: z.string().min(1),
    candidates: z.array(RxNormMedicationIdentityCandidateSchema).min(1),
  })
  .strict()
  .superRefine((manifest, context) => {
    const ids = manifest.candidates.map((candidate) => candidate.id);
    const rxcuis = manifest.candidates.map((candidate) => candidate.rxcui);
    const names = manifest.candidates.map((candidate) =>
      candidate.normalizedIngredientName.toLocaleLowerCase('en-US'),
    );
    if (
      new Set(ids).size !== ids.length ||
      new Set(rxcuis).size !== rxcuis.length ||
      new Set(names).size !== names.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['candidates'],
        message: 'RxNorm identity intake candidates require unique IDs, RxCUIs, and names.',
      });
    }
  });

type RxNormMedicationIdentityIntakeManifest = z.infer<
  typeof RxNormMedicationIdentityIntakeManifestSchema
>;
type RxNormMedicationIdentityCandidate = z.infer<typeof RxNormMedicationIdentityCandidateSchema>;

export const DEFAULT_RXNORM_IDENTITY_INTAKE_MANIFEST = resolve(
  'content/catalogs/medications/identity-intake.candidates.json',
);

export interface RxNormMedicationIdentityIntakeOptions {
  manifestPath?: string;
  identityDirectory?: string;
  refresh?: boolean;
  write?: boolean;
  fetchJson?: (url: string) => Promise<unknown>;
}

export interface RxNormMedicationIdentityIntakeResult {
  candidateCount: number;
  createdIds: string[];
  existingIds: string[];
  rxnormRefreshed: boolean;
  indexIdentityCount: number;
  registryContentVersion: string;
}

export const medicationIdentityFromCandidate = (
  manifest: RxNormMedicationIdentityIntakeManifest,
  candidate: RxNormMedicationIdentityCandidate,
): MedicationIdentityDefinition =>
  MedicationIdentityDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: candidate.id,
    label: candidate.label,
    normalizedIngredientName: candidate.normalizedIngredientName,
    aliases: candidate.aliases,
    authoringStatus: 'identity_only',
    runtimeMedicationDefinitionId: null,
    rxnorm: {
      rxcui: candidate.rxcui,
      termType: 'IN',
      suppress: 'N',
      releaseDate: manifest.rxnormReleaseDate,
      evidenceSourceId: manifest.evidenceSourceId,
      sourceUseDecisionId: manifest.sourceUseDecisionId,
      verifiedAt: manifest.verifiedAt,
    },
    medicalReviewStatus: 'unreviewed',
  });

const defaultFetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'PsychSim-RxNorm-identity-intake/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`RxNorm request failed (${response.status}) for ${url}.`);
  }
  return response.json() as Promise<unknown>;
};

const withRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const verifyCandidateWithRxNorm = async (
  candidate: RxNormMedicationIdentityCandidate,
  fetchJson: (url: string) => Promise<unknown>,
): Promise<void> => {
  const propertiesValue = (await withRetry(() =>
    fetchJson(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(candidate.rxcui)}/properties.json`,
    ),
  )) as {
    properties?: {
      rxcui?: unknown;
      name?: unknown;
      tty?: unknown;
      suppress?: unknown;
    };
  };
  const properties = propertiesValue.properties;
  if (
    properties?.rxcui !== candidate.rxcui ||
    properties.name !== candidate.normalizedIngredientName ||
    properties.tty !== 'IN' ||
    properties.suppress !== 'N'
  ) {
    throw new Error(`${candidate.id} does not match exact active RxNorm IN ${candidate.rxcui}.`);
  }
  const searchValue = (await withRetry(() =>
    fetchJson(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(
        candidate.normalizedIngredientName,
      )}&search=2`,
    ),
  )) as {
    idGroup?: { rxnormId?: unknown };
  };
  const ids = Array.isArray(searchValue.idGroup?.rxnormId) ? searchValue.idGroup.rxnormId : [];
  if (!ids.includes(candidate.rxcui)) {
    throw new Error(
      `${candidate.id} exact normalized-name lookup does not include ${candidate.rxcui}.`,
    );
  }
};

const verifyRxNormVersion = async (
  manifest: RxNormMedicationIdentityIntakeManifest,
  fetchJson: (url: string) => Promise<unknown>,
): Promise<void> => {
  const value = (await withRetry(() =>
    fetchJson('https://rxnav.nlm.nih.gov/REST/version.json'),
  )) as {
    version?: unknown;
  };
  if (value.version !== manifest.rxnormVersion) {
    throw new Error(
      `RxNorm current version ${String(value.version)} does not match pinned ${manifest.rxnormVersion}.`,
    );
  }
};

const readOptionalIdentity = async (path: string): Promise<MedicationIdentityDefinition | null> => {
  try {
    return MedicationIdentityDefinitionSchema.parse(
      JSON.parse(await readFile(path, 'utf8')) as unknown,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
};

export const intakeRxNormMedicationIdentities = async (
  options: RxNormMedicationIdentityIntakeOptions = {},
): Promise<RxNormMedicationIdentityIntakeResult> => {
  const manifestPath = resolve(options.manifestPath ?? DEFAULT_RXNORM_IDENTITY_INTAKE_MANIFEST);
  const identityDirectory = resolve(
    options.identityDirectory ?? 'content/catalogs/medications/identities',
  );
  const manifest = RxNormMedicationIdentityIntakeManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, 'utf8')) as unknown,
  );
  if (options.write && !options.refresh) {
    throw new Error('--write requires --refresh so new identity files are not created stale.');
  }
  const fetchJson = options.fetchJson ?? defaultFetchJson;
  if (options.refresh) {
    await verifyRxNormVersion(manifest, fetchJson);
    for (let index = 0; index < manifest.candidates.length; index += 8) {
      await Promise.all(
        manifest.candidates
          .slice(index, index + 8)
          .map((candidate) => verifyCandidateWithRxNorm(candidate, fetchJson)),
      );
    }
  }

  const createdIds: string[] = [];
  const existingIds: string[] = [];
  for (const candidate of manifest.candidates) {
    const expected = medicationIdentityFromCandidate(manifest, candidate);
    const filePath = resolve(
      identityDirectory,
      `${candidate.id.replace(/^medication\./, '')}.identity.json`,
    );
    const existing = await readOptionalIdentity(filePath);
    if (existing === null) {
      if (!options.write) {
        throw new Error(
          `Missing ${candidate.id}; run pnpm content:medications:intake -- --refresh --write.`,
        );
      }
      await writeFile(filePath, `${JSON.stringify(expected, null, 2)}\n`, 'utf8');
      createdIds.push(candidate.id);
      continue;
    }
    if (JSON.stringify(existing) !== JSON.stringify(expected)) {
      throw new Error(
        `${candidate.id} already exists with content that differs from the pinned intake manifest.`,
      );
    }
    existingIds.push(candidate.id);
  }

  const index = await syncMedicationIdentityIndex({ write: options.write });
  return {
    candidateCount: manifest.candidates.length,
    createdIds,
    existingIds,
    rxnormRefreshed: options.refresh === true,
    indexIdentityCount: index.identityCount,
    registryContentVersion: index.registryContentVersion,
  };
};

export const runRxNormMedicationIdentityIntakeCli = async (
  args: readonly string[],
): Promise<void> => {
  const normalizedArgs = args.filter((argument) => argument !== '--');
  let refresh = false;
  let write = false;
  let manifestPath: string | undefined;
  for (let index = 0; index < normalizedArgs.length; index += 1) {
    const argument = normalizedArgs[index]!;
    if (argument === '--refresh') {
      refresh = true;
      continue;
    }
    if (argument === '--write') {
      write = true;
      continue;
    }
    if (argument === '--manifest') {
      const value = normalizedArgs[index + 1];
      if (!value) throw new Error('--manifest requires a path.');
      manifestPath = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown RxNorm medication-identity intake argument: ${argument}`);
  }
  const result = await intakeRxNormMedicationIdentities({
    manifestPath,
    refresh,
    write,
  });
  console.log(
    `PASS RxNorm medication identity intake: ${result.candidateCount} pinned candidates; ${result.createdIds.length} created; ${result.existingIds.length} existing; ${result.indexIdentityCount} total identities; registry ${result.registryContentVersion}; ${
      result.rxnormRefreshed ? 'official current-version refresh passed' : 'offline pins passed'
    }.`,
  );
};

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await runRxNormMedicationIdentityIntakeCli(process.argv.slice(2));
}
