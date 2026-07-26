import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ClinicalTicketExportBundleSchema,
  SourceReviewTicketFeedSchema,
  type SourceChunk,
} from '@psychsim/schemas';
import { afterEach, describe, expect, it } from 'vitest';
import { calculateSourceChunkProvenanceHash } from './source-pipeline';
import {
  prepareSourceReviewPackets,
  validateSourceReviewPrivateState,
} from './source-review-packets';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

interface Fixture {
  sourceRoot: string;
  draftPath: string;
  generatedRoot: string;
  feedPath: string;
  locatorPath: string;
  artifactPath: string;
}

const createFixture = async (): Promise<Fixture> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-source-review-'));
  temporaryDirectories.push(root);
  const sourceRoot = join(root, 'source-docs');
  const manifests = join(sourceRoot, 'manifests');
  const extracted = join(sourceRoot, 'extracted');
  const generatedRoot = join(root, 'generated', 'source-review');
  await Promise.all([
    mkdir(manifests, { recursive: true, mode: 0o700 }),
    mkdir(extracted, { recursive: true, mode: 0o700 }),
  ]);
  const documentId = 'source-document.aaaaaaaaaaaaaaaaaaaa';
  const createChunk = (ordinal: number, text: string, sectionInstance: number): SourceChunk => {
    const chunkWithoutProvenance = {
      schemaVersion: 1 as const,
      id: `source-chunk.aaaaaaaaaaaaaaaaaaaa.${ordinal + 1}`,
      sourceDocumentId: documentId,
      ordinal,
      section: 'Private heading',
      sectionPath: ['Private heading'],
      sectionInstance,
      text,
      textHash: sha256(text),
    };
    return {
      ...chunkWithoutProvenance,
      provenanceHash: calculateSourceChunkProvenanceHash(chunkWithoutProvenance),
    };
  };
  const chunks = [
    createChunk(0, 'Private source sentence one.', 1),
    createChunk(1, 'Private source sentence two.', 1),
  ];
  const artifact = {
    schemaVersion: 1,
    document: {
      schemaVersion: 1,
      id: documentId,
      sourceManifestEntryId: 'source-manifest.aaaaaaaaaaaaaaaaaaaa.bbbbbbbb',
      mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extractedTextHash: sha256(chunks.map((chunk) => chunk.text).join('\n\n')),
      parserVersion: 'psychsim-source-parser-5',
      extractionWarnings: ["Unrecognised paragraph style: 'Title'"],
      extractionWarningCount: 1,
      processedAt: '2026-07-25T12:00:00.000Z',
    },
    chunks,
  };
  const artifactPath = join(extracted, `${documentId}.json`);
  await writeFile(artifactPath, JSON.stringify(artifact), { mode: 0o600 });
  await chmod(artifactPath, 0o600);

  const draft = {
    schemaVersion: 1,
    draftVersion: 1,
    generatedAt: '2026-07-25T13:00:00.000Z',
    units: [
      {
        schemaVersion: 1,
        id: 'source-review-draft.synthetic-medication',
        documentId,
        selector: { kind: 'section_instance', sectionInstance: 1 },
        sourceHeadingExcluded: true,
        boundaryEvidenceStatus: 'unresolved_extraction_warning',
        derivedDisplayTitle: 'Review one imported medication summary',
        ticketType: 'medication_fit',
        priority: 'high',
        requiresClinicalAcumen: true,
        proposedRouting: 'Keep every proposal unreviewed until evidence review.',
        decisionQuestion: 'Which candidate takeaways should proceed to evidence review?',
        publicTargetContentIds: ['medication.bupropion'],
        unresolvedTargetLabels: [],
        dependencyTicketIds: [],
        conflictContentIds: [],
        originalSummary: 'An imported author note contains candidate medication-fit judgments.',
        atomicProposals: [
          {
            schemaVersion: 1,
            id: 'source-proposal.synthetic.fit',
            proposalType: 'developer_opinion',
            summary: 'Consider one fit modifier after evidence and clinical review.',
            publicTargetContentIds: ['medication.bupropion'],
            unresolvedTargetLabels: [],
            uncertainty: ['Point magnitude remains undecided.'],
          },
        ],
        uncertainty: ['A document-level heading warning remains unresolved.'],
        conflicts: [],
        currentness: {
          status: 'needs_currentness_review',
          evaluatedThrough: null,
          note: 'No currentness review has been completed.',
        },
        rightsState: {
          status: 'source_use_decision',
          sourceUseDecisionId: 'source-use-decision.synthetic',
          portableReviewAllowed: false,
          note: 'Local private review only.',
        },
        boundaryState: 'uncertain',
        boundaryQuestion: 'Confirm the imported section boundary before atomization.',
        resurfacingTrigger: 'Resurface after boundary confirmation or new evidence.',
        createdAt: '2026-07-25T13:00:00.000Z',
        updatedAt: '2026-07-25T13:00:00.000Z',
      },
    ],
  };
  const draftPath = join(manifests, 'source-review-drafts.json');
  await writeFile(draftPath, JSON.stringify(draft), { mode: 0o600 });
  await chmod(draftPath, 0o600);
  return {
    sourceRoot,
    draftPath,
    generatedRoot,
    feedPath: join(generatedRoot, 'tickets.json'),
    locatorPath: join(manifests, 'source-review-units.json'),
    artifactPath,
  };
};

const optionsFor = (fixture: Fixture) => ({
  ...fixture,
  publicTargetIds: ['medication.bupropion'],
});

describe('source-review packet preparation', () => {
  it('creates a deterministic safe packet and a separate immutable private locator', async () => {
    const fixture = await createFixture();
    const first = await prepareSourceReviewPackets(optionsFor(fixture));
    const second = await prepareSourceReviewPackets(optionsFor(fixture));
    expect(first.tickets).toBe(1);
    expect(second.tickets).toBe(1);
    await expect(validateSourceReviewPrivateState(optionsFor(fixture))).resolves.toEqual(second);

    const feed = SourceReviewTicketFeedSchema.parse(
      JSON.parse(await readFile(fixture.feedPath, 'utf8')) as unknown,
    );
    const serializedFeed = JSON.stringify(feed);
    expect(serializedFeed).not.toContain('source-document.');
    expect(serializedFeed).not.toContain('source-chunk.');
    expect(serializedFeed).not.toContain('Private heading');
    expect(serializedFeed).not.toContain('Private source sentence');
    expect(feed.tickets[0]?.sourceReviewSnapshot?.runtimeEffect).toBe(false);

    const locator = JSON.parse(await readFile(fixture.locatorPath, 'utf8')) as {
      entries: Array<{ documentId: string; chunks: Array<{ id: string }> }>;
    };
    expect(locator.entries).toHaveLength(1);
    expect(locator.entries[0]?.documentId).toContain('source-document.');
    expect(locator.entries[0]?.chunks).toHaveLength(2);
  });

  it('rejects targets outside the public clinical catalog allowlist', async () => {
    const fixture = await createFixture();
    await expect(
      prepareSourceReviewPackets({
        ...optionsFor(fixture),
        publicTargetIds: ['medication.sertraline'],
      }),
    ).rejects.toThrow('outside the public clinical catalog');
  });

  it('requires explicit supersession instead of silently redrafting one source unit', async () => {
    const fixture = await createFixture();
    await prepareSourceReviewPackets(optionsFor(fixture));
    const draft = JSON.parse(await readFile(fixture.draftPath, 'utf8')) as {
      units: Array<Record<string, unknown>>;
    };
    draft.units[0]!.originalSummary = 'A revised paraphrase of the same private unit.';
    await writeFile(fixture.draftPath, JSON.stringify(draft), { mode: 0o600 });
    await chmod(fixture.draftPath, 0o600);

    await expect(prepareSourceReviewPackets(optionsFor(fixture))).rejects.toThrow(
      'explicit supersession',
    );
  });

  it('requires unresolved parser warnings to remain visible as a boundary question', async () => {
    const fixture = await createFixture();
    const draft = JSON.parse(await readFile(fixture.draftPath, 'utf8')) as {
      units: Array<Record<string, unknown>>;
    };
    draft.units[0]!.boundaryState = 'confirmed';
    draft.units[0]!.boundaryQuestion = null;
    await writeFile(fixture.draftPath, JSON.stringify(draft), { mode: 0o600 });
    await chmod(fixture.draftPath, 0o600);

    await expect(prepareSourceReviewPackets(optionsFor(fixture))).rejects.toThrow(
      'requires an uncertain boundary',
    );
  });

  it('keeps source material metadata-only until an explicit source-use decision exists', async () => {
    const fixture = await createFixture();
    const draft = JSON.parse(await readFile(fixture.draftPath, 'utf8')) as {
      units: Array<Record<string, unknown>>;
    };
    draft.units[0]!.rightsState = {
      status: 'private_processing_only',
      sourceUseDecisionId: null,
      portableReviewAllowed: false,
      note: 'Local preservation and extraction only.',
    };
    await writeFile(fixture.draftPath, JSON.stringify(draft), { mode: 0o600 });
    await chmod(fixture.draftPath, 0o600);

    await expect(prepareSourceReviewPackets(optionsFor(fixture))).rejects.toThrow(
      'metadata no-change packet',
    );
  });

  it('revalidates the extraction artifact rather than trusting paired locator files', async () => {
    const fixture = await createFixture();
    await prepareSourceReviewPackets(optionsFor(fixture));
    const artifact = JSON.parse(await readFile(fixture.artifactPath, 'utf8')) as {
      document: { extractedTextHash: string };
      chunks: Array<SourceChunk>;
    };
    artifact.chunks[0]!.text = 'Coherently changed private source sentence.';
    artifact.chunks[0]!.textHash = sha256(artifact.chunks[0]!.text);
    artifact.chunks[0]!.provenanceHash = calculateSourceChunkProvenanceHash(artifact.chunks[0]!);
    artifact.document.extractedTextHash = sha256(
      artifact.chunks.map((chunk) => chunk.text).join('\n\n'),
    );
    await writeFile(fixture.artifactPath, JSON.stringify(artifact), { mode: 0o600 });
    await chmod(fixture.artifactPath, 0o600);

    await expect(validateSourceReviewPrivateState(optionsFor(fixture))).rejects.toThrow(
      'no longer matches its source artifact',
    );
  });

  it('keeps private source packets out of portable Reviewer exports', async () => {
    const fixture = await createFixture();
    await prepareSourceReviewPackets(optionsFor(fixture));
    const feed = SourceReviewTicketFeedSchema.parse(
      JSON.parse(await readFile(fixture.feedPath, 'utf8')) as unknown,
    );
    expect(() =>
      ClinicalTicketExportBundleSchema.parse({
        schemaVersion: 1,
        exportVersion: 7,
        bundleId: 'review-bundle.synthetic',
        buildKind: 'portable_reviewer',
        assignmentId: 'reviewer-assignment.synthetic',
        exportedAt: '2026-07-25T14:00:00.000Z',
        engineVersion: 'test',
        profileId: 'profile.synthetic',
        tickets: feed.tickets,
        attemptReviews: [],
        databaseEntryReviews: [],
        flags: [],
        completedAttempts: [],
      }),
    ).toThrow('Portable Reviewer exports cannot contain private source-review snapshots.');
  });
});
