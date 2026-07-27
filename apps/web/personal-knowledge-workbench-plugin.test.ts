import { afterEach, describe, expect, it } from 'vitest';
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DeveloperDiagnosisClassificationProjectionSchema,
  DeveloperDatabaseKnowledgeProjectionSchema,
  DiagnosisClassificationReleaseSchema,
  DiagnosisClassificationTermsSchema,
  PersonalKnowledgeWorkbenchProjectionSchema,
} from '@psychsim/schemas';
import { normalizedDiagnosisTermsSha256 } from '../../tools/content-cli/src/diagnosis-classification';

import {
  loadDeveloperDiagnosisClassificationProjection,
  loadDeveloperDatabaseKnowledgeProjection,
  loadPersonalKnowledgeWorkbenchProjection,
  personalKnowledgeWorkbenchBridge,
  respondToDeveloperDiagnosisClassificationRequest,
  respondToDeveloperDatabaseKnowledgeRequest,
  respondToPersonalKnowledgeWorkbenchRequest,
} from './personal-knowledge-workbench-plugin';

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const projection = PersonalKnowledgeWorkbenchProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 1,
  generatedAt: '2026-07-25T12:00:00.000Z',
  pilotTopicId: 'authoring-pilot.synthetic',
  summary: {
    intakeEligibleSources: 1,
    queuedSources: 1,
    releasedSources: 0,
    partiallyClassifiedSources: 0,
    classifiedSources: 0,
    sourceUnits: 0,
    opinionCandidates: 0,
    mappedCandidates: 0,
    unmappedCandidates: 0,
    needsCurrentnessReview: 0,
    bibliographicCandidates: 0,
    verifiedBibliography: 0,
    acceptedOpinions: 0,
    evidenceLinkedOpinions: 0,
    ocrAttachmentsOutsideSemanticScope: 0,
  },
  dossiers: [],
  sourceUnitCandidates: [],
  unmappedCandidates: [],
  unmappedBibliographicCandidates: [],
  warnings: ['Synthetic fixture.'],
});
const databaseProjection = DeveloperDatabaseKnowledgeProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 2,
  generatedAt: '2026-07-25T12:00:00.000Z',
  catalogContentVersion: '1.0.0',
  inputFingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
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
    targetEntries: 0,
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
  records: [],
  formalSourceRegistry: [],
  unmappedCandidateSummaries: [],
  unmappedBibliographicCandidates: [],
  catalogIdentityAudit: {
    identityGaps: [],
    overlappingTerms: [],
  },
  warnings: ['Synthetic fixture.'],
});

const classificationCatalog = DiagnosisClassificationTermsSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  releaseId: 'classification.icd10cm.synthetic',
  terms: [
    {
      schemaVersion: 1,
      id: 'classification-term.icd10cm.f32',
      releaseId: 'classification.icd10cm.synthetic',
      code: 'F32',
      parentCode: null,
      shortDescription: 'Depressive episode',
      longDescription: 'Depressive episode',
      billable: false,
      sourceOrder: 1,
    },
  ],
});
const classificationRelease = DiagnosisClassificationReleaseSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: classificationCatalog.releaseId,
  system: 'ICD-10-CM',
  versionLabel: 'Synthetic release',
  publishedDate: '2026-01-01',
  effectiveFrom: '2026-01-01',
  effectiveThrough: '2026-12-31',
  scopeLabel: 'Synthetic F scope',
  includedCodePrefixes: ['F'],
  evidenceSourceId: 'evidence.cdc-nchs.icd10cm.2026',
  sourceArtifact: {
    url: 'https://example.org/icd.zip',
    sha256: 'a'.repeat(64),
    memberPath: 'terms.txt',
    memberSha256: 'b'.repeat(64),
  },
  verificationArtifacts: [],
  importerVersion: 'synthetic-importer-1',
  termCount: classificationCatalog.terms.length,
  normalizedTermsSha256: normalizedDiagnosisTermsSha256(classificationCatalog),
  medicalReviewStatus: 'unreviewed',
});

const createPrivateProjection = async (
  value: unknown = projection,
  mode = 0o600,
  fileName = 'workbench.json',
): Promise<{ root: string; path: string }> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-knowledge-plugin-'));
  temporaryDirectories.push(root);
  const nested = join(root, 'personal-knowledge');
  await mkdir(nested, { mode: 0o700 });
  const path = join(nested, fileName);
  await writeFile(path, JSON.stringify(value), { mode });
  await chmod(path, mode);
  return { root, path };
};

const createClassificationFiles = async (
  release: unknown = classificationRelease,
  catalog: unknown = classificationCatalog,
): Promise<{ root: string; releasePath: string; termsPath: string }> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-classification-plugin-'));
  temporaryDirectories.push(root);
  const releasePath = join(root, 'release.json');
  const termsPath = join(root, 'terms.json');
  await Promise.all([
    writeFile(releasePath, JSON.stringify(release), { mode: 0o644 }),
    writeFile(termsPath, JSON.stringify(catalog), { mode: 0o644 }),
  ]);
  return { root, releasePath, termsPath };
};

describe('personal knowledge Vite bridge', () => {
  it('loads one strict private projection under the allowed root', async () => {
    const fixture = await createPrivateProjection();
    await expect(
      loadPersonalKnowledgeWorkbenchProjection(fixture.path, fixture.root),
    ).resolves.toEqual(projection);
  });

  it('quarantines raw fields and permissive file modes', async () => {
    const raw = await createPrivateProjection({ ...projection, rawText: 'must not pass' });
    await expect(loadPersonalKnowledgeWorkbenchProjection(raw.path, raw.root)).rejects.toThrow();
    const publicFile = await createPrivateProjection(projection, 0o644);
    await expect(
      loadPersonalKnowledgeWorkbenchProjection(publicFile.path, publicFile.root),
    ).rejects.toThrow();
    const executableFile = await createPrivateProjection(projection, 0o700);
    await expect(
      loadPersonalKnowledgeWorkbenchProjection(executableFile.path, executableFile.root),
    ).rejects.toThrow();
  });

  it('rejects a symlinked projection', async () => {
    const fixture = await createPrivateProjection();
    const link = join(fixture.root, 'personal-knowledge', 'linked.json');
    await symlink(fixture.path, link);
    await expect(loadPersonalKnowledgeWorkbenchProjection(link, fixture.root)).rejects.toThrow();
  });

  it('exists only as a serve-time plugin', () => {
    expect(personalKnowledgeWorkbenchBridge().apply).toBe('serve');
  });

  it('serves only GET requests arriving over loopback', async () => {
    const response = {
      statusCode: 0,
      headers: new Map<string, string>(),
      body: '',
      setHeader(name: string, value: string) {
        this.headers.set(name, value);
      },
      end(body = '') {
        this.body = body;
      },
    };
    await respondToPersonalKnowledgeWorkbenchRequest(
      { method: 'GET', socket: { remoteAddress: '127.0.0.1' } },
      response,
      async () => projection,
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(projection);
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const remoteResponse = { ...response, statusCode: 0, body: '' };
    await respondToPersonalKnowledgeWorkbenchRequest(
      { method: 'GET', socket: { remoteAddress: '192.0.2.10' } },
      remoteResponse,
      async () => {
        throw new Error('A non-loopback request must not load the projection.');
      },
    );
    expect(remoteResponse.statusCode).toBe(404);

    const methodResponse = { ...response, statusCode: 0, body: '' };
    await respondToPersonalKnowledgeWorkbenchRequest(
      { method: 'POST', socket: { remoteAddress: '::1' } },
      methodResponse,
      async () => projection,
    );
    expect(methodResponse.statusCode).toBe(405);
  });

  it('loads and serves the separate Developer database projection only over loopback', async () => {
    const fixture = await createPrivateProjection(
      databaseProjection,
      0o600,
      'database-cross-reference.json',
    );
    await expect(
      loadDeveloperDatabaseKnowledgeProjection(fixture.path, fixture.root),
    ).resolves.toEqual(databaseProjection);
    const response = {
      statusCode: 0,
      headers: new Map<string, string>(),
      body: '',
      setHeader(name: string, value: string) {
        this.headers.set(name, value);
      },
      end(body = '') {
        this.body = body;
      },
    };
    await respondToDeveloperDatabaseKnowledgeRequest(
      { method: 'GET', socket: { remoteAddress: '::1' } },
      response,
      async () => databaseProjection,
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(databaseProjection);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const remoteResponse = { ...response, statusCode: 0, body: '' };
    await respondToDeveloperDatabaseKnowledgeRequest(
      { method: 'GET', socket: { remoteAddress: '192.0.2.10' } },
      remoteResponse,
      async () => {
        throw new Error('A remote request must not load private data.');
      },
    );
    expect(remoteResponse.statusCode).toBe(404);

    const mappedLoopback = { ...response, statusCode: 0, body: '' };
    await respondToDeveloperDatabaseKnowledgeRequest(
      { method: 'GET', socket: { remoteAddress: '::ffff:127.0.0.1' } },
      mappedLoopback,
      async () => databaseProjection,
    );
    expect(mappedLoopback.statusCode).toBe(200);

    const methodResponse = { ...response, statusCode: 0, body: '' };
    await respondToDeveloperDatabaseKnowledgeRequest(
      { method: 'POST', socket: { remoteAddress: '127.0.0.1' } },
      methodResponse,
      async () => databaseProjection,
    );
    expect(methodResponse.statusCode).toBe(405);
  });

  it('rejects oversized database projections and paths outside the private root', async () => {
    const oversized = await createPrivateProjection(
      'x'.repeat(2_000_001),
      0o600,
      'database-cross-reference.json',
    );
    await expect(
      loadDeveloperDatabaseKnowledgeProjection(oversized.path, oversized.root),
    ).rejects.toThrow(/private-file boundary/);

    const valid = await createPrivateProjection(
      databaseProjection,
      0o600,
      'database-cross-reference.json',
    );
    await expect(
      loadDeveloperDatabaseKnowledgeProjection(valid.path, join(valid.root, 'unrelated-root')),
    ).rejects.toThrow();
  });

  it('distinguishes an absent projection from a quarantined projection', async () => {
    const response = {
      statusCode: 0,
      body: '',
      setHeader() {},
      end(body = '') {
        this.body = body;
      },
    };
    await respondToDeveloperDatabaseKnowledgeRequest(
      { method: 'GET', socket: { remoteAddress: '127.0.0.1' } },
      response,
      async () => null,
    );
    expect(response.statusCode).toBe(404);

    const quarantined = { ...response, statusCode: 0, body: '' };
    await respondToDeveloperDatabaseKnowledgeRequest(
      { method: 'GET', socket: { remoteAddress: '127.0.0.1' } },
      quarantined,
      async () => {
        throw new Error('invalid projection');
      },
    );
    expect(quarantined.statusCode).toBe(500);
    expect(quarantined.body).toContain('quarantined');
  });

  it('loads and serves the rights-gated diagnosis classification only over loopback', async () => {
    const fixture = await createClassificationFiles();
    const loaded = await loadDeveloperDiagnosisClassificationProjection(
      fixture.releasePath,
      fixture.termsPath,
      fixture.root,
    );
    expect(DeveloperDiagnosisClassificationProjectionSchema.parse(loaded)).toMatchObject({
      release: { id: classificationRelease.id },
      catalog: { terms: [{ code: 'F32' }] },
      sourceUse: {
        id: 'source-use.cdc-nchs.icd10cm.2026',
        permissions: {
          localStructuredIndexing: true,
          aiAssistedProcessing: false,
          derivedClinicalContent: false,
          runtimeRedistribution: false,
        },
      },
    });

    const response = {
      statusCode: 0,
      headers: new Map<string, string>(),
      body: '',
      setHeader(name: string, value: string) {
        this.headers.set(name, value);
      },
      end(body = '') {
        this.body = body;
      },
    };
    await respondToDeveloperDiagnosisClassificationRequest(
      { method: 'GET', socket: { remoteAddress: '127.0.0.1' } },
      response,
      async () => loaded,
    );
    expect(response.statusCode).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(JSON.parse(response.body)).toEqual(loaded);

    const remoteResponse = { ...response, statusCode: 0, body: '' };
    await respondToDeveloperDiagnosisClassificationRequest(
      { method: 'GET', socket: { remoteAddress: '192.0.2.10' } },
      remoteResponse,
      async () => {
        throw new Error('A remote request must not load the local classification.');
      },
    );
    expect(remoteResponse.statusCode).toBe(404);

    const methodResponse = { ...response, statusCode: 0, body: '' };
    await respondToDeveloperDiagnosisClassificationRequest(
      { method: 'POST', socket: { remoteAddress: '::1' } },
      methodResponse,
      async () => loaded,
    );
    expect(methodResponse.statusCode).toBe(405);
  });

  it('quarantines classification drift, symlinks, and widened source-use permissions', async () => {
    const drifted = await createClassificationFiles({
      ...classificationRelease,
      normalizedTermsSha256: 'f'.repeat(64),
    });
    await expect(
      loadDeveloperDiagnosisClassificationProjection(
        drifted.releasePath,
        drifted.termsPath,
        drifted.root,
      ),
    ).rejects.toThrow(/failed validation/);

    const linked = await createClassificationFiles();
    const symlinkPath = join(linked.root, 'linked-terms.json');
    await symlink(linked.termsPath, symlinkPath);
    await expect(
      loadDeveloperDiagnosisClassificationProjection(linked.releasePath, symlinkPath, linked.root),
    ).rejects.toThrow(/local-file boundary/);

    const sourceUseCatalog = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'source-use-decisions.synthetic',
      decisions: [
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'source-use.synthetic.icd',
          evidenceSourceId: classificationRelease.evidenceSourceId,
          decisionStatus: 'permitted_with_conditions',
          legalBasis: 'public_domain',
          permissions: {
            bibliographicMetadata: true,
            localFullTextStorage: true,
            localTextExtraction: true,
            localStructuredIndexing: true,
            aiAssistedProcessing: true,
            derivedClinicalContent: true,
            runtimeRedistribution: true,
            commercialDistribution: true,
          },
          allowedContributionTypes: ['classification_mapping'],
          territories: ['United States'],
          attributionStatement: 'Synthetic.',
          requiredNotices: [],
          nonCommercialOnly: false,
          shareAlikeRequired: false,
          thirdPartyMaterialPolicy: 'not_applicable',
          fairUseAssessment: null,
          permissionEvidence: null,
          reviewBasis: 'engineering_risk_assessment',
          reviewedBy: 'reviewer.synthetic',
          reviewedAt: '2026-07-26T12:00:00.000Z',
          notes: 'Synthetic widened permission fixture.',
        },
      ],
    };
    const valid = await createClassificationFiles();
    await expect(
      loadDeveloperDiagnosisClassificationProjection(
        valid.releasePath,
        valid.termsPath,
        valid.root,
        sourceUseCatalog,
      ),
    ).rejects.toThrow(/fair_use|local classification inspector/i);
  });
});
