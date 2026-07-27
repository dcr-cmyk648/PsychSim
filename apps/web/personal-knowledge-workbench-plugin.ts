import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DeveloperDiagnosisClassificationProjectionSchema,
  DeveloperDatabaseKnowledgeProjectionSchema,
  PersonalKnowledgeWorkbenchProjectionSchema,
  SourceUseDecisionCatalogSchema,
  type DeveloperDiagnosisClassificationProjection,
  type DeveloperDatabaseKnowledgeProjection,
  type PersonalKnowledgeWorkbenchProjection,
} from '@psychsim/schemas';
import type { Plugin } from 'vite';

import sourceUseDecisionCatalogJson from '../../content/catalogs/evidence/source-use-decisions.json';
import {
  readDiagnosisClassification,
  validateDiagnosisClassification,
} from '../../tools/content-cli/src/diagnosis-classification';

export const PERSONAL_KNOWLEDGE_WORKBENCH_ENDPOINT = '/__psychsim/personal-knowledge-workbench';
export const DEVELOPER_DATABASE_KNOWLEDGE_ENDPOINT = '/__psychsim/developer-database-knowledge';
export const DEVELOPER_DIAGNOSIS_CLASSIFICATION_ENDPOINT =
  '/__psychsim/developer-diagnosis-classification';
const MAX_PROJECTION_BYTES = 2_000_000;
const MAX_CLASSIFICATION_RELEASE_BYTES = 64_000;
const MAX_CLASSIFICATION_TERMS_BYTES = 1_000_000;
const PERSONAL_KNOWLEDGE_GENERATED_ROOT = fileURLToPath(
  new URL('../../content/generated/personal-knowledge/', import.meta.url),
);
const PROJECTION_FILE_NAME =
  process.env.PSYCHSIM_E2E === '1' ? 'workbench.e2e.json' : 'workbench.json';
const DATABASE_PROJECTION_FILE_NAME =
  process.env.PSYCHSIM_E2E === '1'
    ? 'database-cross-reference.e2e.json'
    : 'database-cross-reference.json';
const DEFAULT_PROJECTION_PATH = fileURLToPath(
  new URL(`../../content/generated/personal-knowledge/${PROJECTION_FILE_NAME}`, import.meta.url),
);
const DEFAULT_DATABASE_PROJECTION_PATH = fileURLToPath(
  new URL(
    `../../content/generated/personal-knowledge/${DATABASE_PROJECTION_FILE_NAME}`,
    import.meta.url,
  ),
);
export const E2E_DEVELOPER_DATABASE_KNOWLEDGE_PROJECTION =
  DeveloperDatabaseKnowledgeProjectionSchema.parse({
    schemaVersion: 1,
    projectionVersion: 2,
    generatedAt: '2026-07-26T12:00:00.000Z',
    catalogContentVersion: '1.0.0',
    inputFingerprint: 'e'.repeat(64),
    summary: {
      personalSourceDocuments: 0,
      appleNotesRevisions: 0,
      appleNotesAttachmentRecords: 0,
      appleNotesOcrCompleted: 0,
      privateDriveDocuments: 0,
      userAuthoredArchiveUnits: 0,
      sourceUnits: 0,
      fullyIndexedUnits: 0,
      partiallyIndexedUnits: 0,
      quarantinedUnits: 0,
      unitsWithTargetMatches: 0,
      unitsWithoutTargetMatches: 0,
      targetEntries: 1,
      matchedTargetEntries: 0,
      totalLexicalMatches: 0,
      semanticallyClassifiedUnits: 0,
      candidateSummaries: 0,
      acceptedOpinions: 0,
      formalContributions: 0,
      formalSources: 0,
      registeredFormalSources: 0,
    },
    corpusUnits: [],
    records: [
      {
        entryId: 'medication.sertraline',
        categoryId: 'medications',
        label: 'Sertraline',
        compilationState: 'no_personal_match',
        indexedTerms: ['Sertraline'],
        personalSourceUnitCount: 0,
        personalSourceTotalMatches: 0,
        lexicalSignals: [],
        candidateSummaries: [],
        unresolvedCandidateMentions: [],
        bibliographicCandidates: [],
        formalContributions: [],
        ruleSummaries: [],
        relatedEntryIds: [],
      },
    ],
    formalSourceRegistry: [],
    unmappedCandidateSummaries: [],
    unmappedBibliographicCandidates: [],
    catalogIdentityAudit: {
      identityGaps: [],
      overlappingTerms: [],
    },
    warnings: ['Synthetic browser-test dossier with no clinical or private-source content.'],
  });
const DIAGNOSIS_CLASSIFICATION_ROOT = fileURLToPath(
  new URL('../../content/catalogs/diagnoses/classifications/icd-10-cm/2026/', import.meta.url),
);
const DEFAULT_DIAGNOSIS_CLASSIFICATION_RELEASE_PATH = fileURLToPath(
  new URL(
    '../../content/catalogs/diagnoses/classifications/icd-10-cm/2026/release.json',
    import.meta.url,
  ),
);
const DEFAULT_DIAGNOSIS_CLASSIFICATION_TERMS_PATH = fileURLToPath(
  new URL(
    '../../content/catalogs/diagnoses/classifications/icd-10-cm/2026/terms.json',
    import.meta.url,
  ),
);

const pathInside = (parent: string, child: string): boolean => {
  const relativePath = relative(parent, child);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
};

export const isPersonalKnowledgeWorkbenchLoopback = (address: string | undefined): boolean =>
  address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

export const loadPersonalKnowledgeWorkbenchProjection = async (
  path = DEFAULT_PROJECTION_PATH,
  allowedRoot = PERSONAL_KNOWLEDGE_GENERATED_ROOT,
): Promise<PersonalKnowledgeWorkbenchProjection | null> => {
  let stat: Awaited<ReturnType<typeof lstat>>;
  try {
    stat = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size > MAX_PROJECTION_BYTES ||
    (stat.mode & 0o777) !== 0o600
  ) {
    throw new Error('Personal knowledge workbench projection failed its private-file boundary.');
  }
  const [resolvedPath, resolvedRoot] = await Promise.all([realpath(path), realpath(allowedRoot)]);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Personal knowledge workbench projection escaped its private root.');
  }
  return PersonalKnowledgeWorkbenchProjectionSchema.parse(
    JSON.parse(await readFile(resolvedPath, 'utf8')) as unknown,
  );
};

export const loadDeveloperDatabaseKnowledgeProjection = async (
  path = DEFAULT_DATABASE_PROJECTION_PATH,
  allowedRoot = PERSONAL_KNOWLEDGE_GENERATED_ROOT,
): Promise<DeveloperDatabaseKnowledgeProjection | null> => {
  let stat: Awaited<ReturnType<typeof lstat>>;
  try {
    stat = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size > MAX_PROJECTION_BYTES ||
    (stat.mode & 0o777) !== 0o600
  ) {
    throw new Error('Developer database knowledge projection failed its private-file boundary.');
  }
  const [resolvedPath, resolvedRoot] = await Promise.all([realpath(path), realpath(allowedRoot)]);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Developer database knowledge projection escaped its private root.');
  }
  return DeveloperDatabaseKnowledgeProjectionSchema.parse(
    JSON.parse(await readFile(resolvedPath, 'utf8')) as unknown,
  );
};

const assertClassificationFile = async (
  path: string,
  allowedRoot: string,
  maximumBytes: number,
): Promise<string | null> => {
  let stat: Awaited<ReturnType<typeof lstat>>;
  try {
    stat = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximumBytes) {
    throw new Error('Developer diagnosis classification failed its local-file boundary.');
  }
  const [resolvedPath, resolvedRoot] = await Promise.all([realpath(path), realpath(allowedRoot)]);
  if (!pathInside(resolvedRoot, resolvedPath)) {
    throw new Error('Developer diagnosis classification escaped its local authoring root.');
  }
  return resolvedPath;
};

export const loadDeveloperDiagnosisClassificationProjection = async (
  releasePath = DEFAULT_DIAGNOSIS_CLASSIFICATION_RELEASE_PATH,
  termsPath = DEFAULT_DIAGNOSIS_CLASSIFICATION_TERMS_PATH,
  allowedRoot = DIAGNOSIS_CLASSIFICATION_ROOT,
  rawSourceUseCatalog: unknown = sourceUseDecisionCatalogJson,
): Promise<DeveloperDiagnosisClassificationProjection | null> => {
  const [resolvedReleasePath, resolvedTermsPath] = await Promise.all([
    assertClassificationFile(releasePath, allowedRoot, MAX_CLASSIFICATION_RELEASE_BYTES),
    assertClassificationFile(termsPath, allowedRoot, MAX_CLASSIFICATION_TERMS_BYTES),
  ]);
  if (!resolvedReleasePath || !resolvedTermsPath) return null;

  const { release, catalog } = await readDiagnosisClassification(
    resolvedReleasePath,
    resolvedTermsPath,
  );
  const validation = validateDiagnosisClassification(release, catalog);
  if (!validation.valid) {
    throw new Error(
      `Developer diagnosis classification failed validation: ${validation.issues
        .map((issue) => issue.code)
        .join(', ')}`,
    );
  }
  const sourceUseCatalog = SourceUseDecisionCatalogSchema.parse(rawSourceUseCatalog);
  const decision = sourceUseCatalog.decisions.find(
    (candidate) => candidate.evidenceSourceId === release.evidenceSourceId,
  );
  if (!decision) {
    throw new Error('Developer diagnosis classification has no source-use decision.');
  }

  return DeveloperDiagnosisClassificationProjectionSchema.parse({
    schemaVersion: 1,
    projectionVersion: 1,
    release,
    catalog,
    sourceUse: {
      id: decision.id,
      evidenceSourceId: decision.evidenceSourceId,
      decisionStatus: decision.decisionStatus,
      legalBasis: decision.legalBasis,
      permissions: decision.permissions,
      territories: decision.territories,
      attributionStatement: decision.attributionStatement,
      requiredNotices: decision.requiredNotices,
      nonCommercialOnly: decision.nonCommercialOnly,
      reviewedAt: decision.reviewedAt,
    },
    warnings: [
      'Local authoring classification identities only—not diagnostic criteria, diagnosis rules, treatment guidance, scoring, or medical approval.',
      'This cache is private, noncommercial, runtime-excluded, and unavailable to Player, portable Reviewer, exports, Git, or Pages.',
      'ICD-10 is owned by the World Health Organization; do not imply CDC, NCHS, WHO, or U.S. government endorsement.',
    ],
  });
};

interface WorkbenchRequest {
  method?: string;
  socket: { remoteAddress?: string };
}

interface WorkbenchResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

export const respondToPersonalKnowledgeWorkbenchRequest = async (
  request: WorkbenchRequest,
  response: WorkbenchResponse,
  loadProjection = loadPersonalKnowledgeWorkbenchProjection,
): Promise<void> => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (!isPersonalKnowledgeWorkbenchLoopback(request.socket.remoteAddress)) {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: 'Not found.' }));
    return;
  }
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: 'Use GET.' }));
    return;
  }
  let projection: PersonalKnowledgeWorkbenchProjection | null;
  try {
    projection = await loadProjection();
  } catch {
    response.statusCode = 500;
    response.end(
      JSON.stringify({
        ok: false,
        error: 'Personal knowledge workbench is quarantined. Run local validation.',
      }),
    );
    return;
  }
  if (!projection) {
    response.statusCode = 404;
    response.end(
      JSON.stringify({
        ok: false,
        error: 'Personal knowledge workbench is unavailable.',
      }),
    );
    return;
  }
  response.statusCode = 200;
  response.end(JSON.stringify(projection));
};

export const respondToDeveloperDatabaseKnowledgeRequest = async (
  request: WorkbenchRequest,
  response: WorkbenchResponse,
  loadProjection = loadDeveloperDatabaseKnowledgeProjection,
): Promise<void> => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (!isPersonalKnowledgeWorkbenchLoopback(request.socket.remoteAddress)) {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: 'Not found.' }));
    return;
  }
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: 'Use GET.' }));
    return;
  }
  let projection: DeveloperDatabaseKnowledgeProjection | null;
  try {
    projection = await loadProjection();
  } catch {
    response.statusCode = 500;
    response.end(
      JSON.stringify({
        ok: false,
        error: 'Developer database knowledge projection is quarantined. Recompile and validate it.',
      }),
    );
    return;
  }
  if (!projection) {
    response.statusCode = 404;
    response.end(
      JSON.stringify({
        ok: false,
        error: 'Developer database knowledge projection is unavailable.',
      }),
    );
    return;
  }
  response.statusCode = 200;
  response.end(JSON.stringify(projection));
};

export const respondToDeveloperDiagnosisClassificationRequest = async (
  request: WorkbenchRequest,
  response: WorkbenchResponse,
  loadProjection = loadDeveloperDiagnosisClassificationProjection,
): Promise<void> => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (!isPersonalKnowledgeWorkbenchLoopback(request.socket.remoteAddress)) {
    response.statusCode = 404;
    response.end(JSON.stringify({ ok: false, error: 'Not found.' }));
    return;
  }
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: 'Use GET.' }));
    return;
  }
  let projection: DeveloperDiagnosisClassificationProjection | null;
  try {
    projection = await loadProjection();
  } catch {
    response.statusCode = 500;
    response.end(
      JSON.stringify({
        ok: false,
        error:
          'Developer diagnosis classification is quarantined. Re-import and validate the local cache.',
      }),
    );
    return;
  }
  if (!projection) {
    response.statusCode = 404;
    response.end(
      JSON.stringify({
        ok: false,
        error:
          'Developer diagnosis classification is unavailable. Run the local diagnosis import command.',
      }),
    );
    return;
  }
  response.statusCode = 200;
  response.end(JSON.stringify(projection));
};

export const personalKnowledgeWorkbenchBridge = (): Plugin => ({
  name: 'psychsim-personal-knowledge-workbench',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(PERSONAL_KNOWLEDGE_WORKBENCH_ENDPOINT, async (request, response) => {
      await respondToPersonalKnowledgeWorkbenchRequest(request, response);
    });
    server.middlewares.use(DEVELOPER_DATABASE_KNOWLEDGE_ENDPOINT, async (request, response) => {
      await respondToDeveloperDatabaseKnowledgeRequest(
        request,
        response,
        process.env.PSYCHSIM_E2E === '1'
          ? async () => E2E_DEVELOPER_DATABASE_KNOWLEDGE_PROJECTION
          : loadDeveloperDatabaseKnowledgeProjection,
      );
    });
    server.middlewares.use(
      DEVELOPER_DIAGNOSIS_CLASSIFICATION_ENDPOINT,
      async (request, response) => {
        await respondToDeveloperDiagnosisClassificationRequest(request, response);
      },
    );
  },
});
