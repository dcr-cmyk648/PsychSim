import { afterEach, describe, expect, it } from 'vitest';
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PersonalKnowledgeWorkbenchProjectionSchema } from '@psychsim/schemas';

import {
  loadPersonalKnowledgeWorkbenchProjection,
  personalKnowledgeWorkbenchBridge,
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

const createPrivateProjection = async (
  value: unknown = projection,
  mode = 0o600,
): Promise<{ root: string; path: string }> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-knowledge-plugin-'));
  temporaryDirectories.push(root);
  const nested = join(root, 'personal-knowledge');
  await mkdir(nested, { mode: 0o700 });
  const path = join(nested, 'workbench.json');
  await writeFile(path, JSON.stringify(value), { mode });
  await chmod(path, mode);
  return { root, path };
};

describe('personal knowledge Vite bridge', () => {
  it('loads one strict private projection under the allowed root', async () => {
    const fixture = await createPrivateProjection();
    await expect(
      loadPersonalKnowledgeWorkbenchProjection(fixture.path, fixture.root),
    ).resolves.toEqual(projection);
  });

  it('rejects raw fields and permissive file modes', async () => {
    const raw = await createPrivateProjection({ ...projection, rawText: 'must not pass' });
    await expect(loadPersonalKnowledgeWorkbenchProjection(raw.path, raw.root)).resolves.toBeNull();
    const publicFile = await createPrivateProjection(projection, 0o644);
    await expect(
      loadPersonalKnowledgeWorkbenchProjection(publicFile.path, publicFile.root),
    ).resolves.toBeNull();
    const executableFile = await createPrivateProjection(projection, 0o700);
    await expect(
      loadPersonalKnowledgeWorkbenchProjection(executableFile.path, executableFile.root),
    ).resolves.toBeNull();
  });

  it('rejects a symlinked projection', async () => {
    const fixture = await createPrivateProjection();
    const link = join(fixture.root, 'personal-knowledge', 'linked.json');
    await symlink(fixture.path, link);
    await expect(loadPersonalKnowledgeWorkbenchProjection(link, fixture.root)).resolves.toBeNull();
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
});
