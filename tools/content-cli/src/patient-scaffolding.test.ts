import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  catalogs,
  prototypeCaseBlueprint,
  validateCaseBlueprint,
  startingClinic,
} from '@psychsim/content-runtime';

import { compilePatientScaffold } from './patient-scaffolding';
import {
  extractDiscoveredSources,
  listExtractedSourceArtifacts,
  scanSourceInbox,
} from './source-pipeline';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const makeFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-patient-scaffold-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'sources', 'inbox'), { recursive: true });
  await writeFile(
    join(root, 'sources', 'inbox', 'source.md'),
    '# Review note\n\nA concise synthetic source fixture used only to test provenance wiring.',
  );
  const now = () => '2026-07-22T12:00:00.000Z';
  await scanSourceInbox({ root: join(root, 'sources'), now });
  await extractDiscoveredSources({ root: join(root, 'sources'), now });
  const [artifactPath] = await listExtractedSourceArtifacts(join(root, 'sources'));
  const artifact = JSON.parse(await readFile(artifactPath!, 'utf8')) as {
    document: { id: string };
    chunks: Array<{ id: string }>;
  };
  return { root, now, artifact };
};

const complaints = [
  'Low mood',
  'Loss of interest',
  'No motivation',
  'Always tired',
  'Cannot focus',
  'Feeling empty',
  'No energy',
  'Sleeping poorly',
  'Hard to function',
  'Not feeling like myself',
];

describe('patient scaffolding', () => {
  it('creates a source-linked, unreviewed, playable Developer package with audit tickets', async () => {
    const { root, now, artifact } = await makeFixture();
    const compiled = await compilePatientScaffold(
      {
        schemaVersion: 1,
        requestVersion: 1,
        id: 'patient-scaffold.test-mdd-source',
        blueprintId: 'case.generated.mdd-source-test',
        templateBlueprintId: prototypeCaseBlueprint.id,
        internalTitle: 'Generated MDD source test',
        sourceUses: [
          {
            authority: 'expert_opinion',
            evidenceSourceIds: [],
            sourceDocumentId: artifact.document.id,
            sourceChunkIds: artifact.chunks.map((chunk) => chunk.id),
            proposedImpactContentIds: ['diagnosis.major-depressive-disorder'],
            contributionTypes: ['context_only'],
            summary:
              'Synthetic test-only takeaway proving that concise source use and chunk provenance remain attached.',
          },
        ],
        chiefComplaintChoices: complaints,
        ageRange: { minimum: 30, maximum: 45 },
        createdBy: 'mock',
      },
      [prototypeCaseBlueprint],
      catalogs,
      {
        sourceRoot: join(root, 'sources'),
        reviewDirectory: join(root, 'review'),
        provenanceDirectory: join(root, 'provenance'),
        now,
      },
    );

    expect(compiled.blueprint).toMatchObject({
      id: 'case.generated.mdd-source-test',
      contentVersion: '1.0.0',
      metadata: {
        lifecycle: 'review',
        medicalReviewStatus: 'unreviewed',
        sourceDocumentIds: [artifact.document.id],
        evidenceSourceIds: [],
      },
    });
    expect(compiled.blueprint.patientRecord.sourceUseNotes[0]).toMatchObject({
      authority: 'expert_opinion',
      evidenceSourceIds: [],
      sourceDocumentId: artifact.document.id,
      targetContentIds: ['case.generated.mdd-source-test'],
      contributionTypes: ['context_only'],
      medicalReviewStatus: 'unreviewed',
    });
    expect(compiled.provenance.evidenceSourceIds).toEqual([]);
    expect(
      compiled.blueprint.workupObjectives.every((rule) => rule.review.status === 'unreviewed'),
    ).toBe(true);
    expect(validateCaseBlueprint(compiled.blueprint, catalogs, startingClinic).valid).toBe(true);
    expect(compiled.auditTickets).toHaveLength(2);
    expect(compiled.auditTickets.every((ticket) => ticket.requiresClinicalAcumen)).toBe(true);
    expect(compiled.auditTickets[0]).toMatchObject({ status: 'proposed', priority: 'blocking' });
    expect(compiled.auditTickets[1]!.targetContentIds).toEqual(
      expect.arrayContaining([
        artifact.document.id,
        artifact.chunks[0]!.id,
        'diagnosis.major-depressive-disorder',
      ]),
    );
    await expect(readFile(compiled.blueprintPath, 'utf8')).resolves.toContain(
      'case.generated.mdd-source-test',
    );
    await expect(readFile(compiled.provenancePath, 'utf8')).resolves.toContain(
      'deterministic-mock-scaffold',
    );
    await expect(readFile(compiled.auditTicketsPath, 'utf8')).resolves.toContain(
      'template-inheritance',
    );
  });

  it('rejects unresolved source provenance before writing a patient', async () => {
    const root = await mkdtemp(join(tmpdir(), 'psychsim-patient-scaffold-'));
    temporaryRoots.push(root);
    await expect(
      compilePatientScaffold(
        {
          schemaVersion: 1,
          requestVersion: 1,
          id: 'patient-scaffold.missing-source',
          blueprintId: 'case.generated.missing-source',
          templateBlueprintId: prototypeCaseBlueprint.id,
          internalTitle: 'Missing source',
          sourceUses: [
            {
              authority: 'expert_opinion',
              evidenceSourceIds: [],
              sourceDocumentId: 'source-document.missing',
              sourceChunkIds: ['source-chunk.missing.1'],
              contributionTypes: ['context_only'],
              summary:
                'This intentionally unresolved source must prevent the patient from compiling.',
            },
          ],
          chiefComplaintChoices: complaints,
          ageRange: { minimum: 30, maximum: 45 },
          createdBy: 'mock',
        },
        [prototypeCaseBlueprint],
        catalogs,
        {
          sourceRoot: join(root, 'sources'),
          reviewDirectory: join(root, 'review'),
          provenanceDirectory: join(root, 'provenance'),
        },
      ),
    ).rejects.toThrow('Missing extracted source document');
  });

  it('rejects a formal source use until its article has an evidence-catalog entry', async () => {
    const { root, artifact } = await makeFixture();
    await expect(
      compilePatientScaffold(
        {
          schemaVersion: 1,
          requestVersion: 1,
          id: 'patient-scaffold.uncataloged-article',
          blueprintId: 'case.generated.uncataloged-article',
          templateBlueprintId: prototypeCaseBlueprint.id,
          internalTitle: 'Uncataloged article source',
          sourceUses: [
            {
              authority: 'formal_publication',
              evidenceSourceIds: ['evidence.article.missing'],
              sourceDocumentId: artifact.document.id,
              sourceChunkIds: artifact.chunks.map((chunk) => chunk.id),
              contributionTypes: ['treatment'],
              summary:
                'This formal source is intentionally missing its required evidence-catalog entry.',
            },
          ],
          chiefComplaintChoices: complaints,
          ageRange: { minimum: 30, maximum: 45 },
          createdBy: 'mock',
        },
        [prototypeCaseBlueprint],
        catalogs,
        {
          sourceRoot: join(root, 'sources'),
          reviewDirectory: join(root, 'review'),
          provenanceDirectory: join(root, 'provenance'),
        },
      ),
    ).rejects.toThrow('Formal source use references uncataloged evidence');
  });
});
