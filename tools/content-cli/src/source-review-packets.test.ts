import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AppleNotesCodexReviewAcknowledgementSchema,
  AppleNotesLocalAcknowledgementSchema,
  ClinicalTicketExportBundleSchema,
  SourceReviewTicketFeedSchema,
  type SourceChunk,
} from '@psychsim/schemas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareAppleNotesCodexReviewPacket } from './apple-notes-codex-review';
import {
  loadAppleNotesIntakeManifestMetadata,
  syncAppleNotesFolder,
  type AppleNotesFolderAudit,
  type AppleNotesProvider,
} from './apple-notes-provider';
import { calculateSourceChunkProvenanceHash } from './source-pipeline';
import {
  prepareSourceReviewPackets,
  preparePersonalKnowledgeSourceReviewPacket,
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

interface PersonalKnowledgeFixture {
  sourceRoot: string;
  generatedRoot: string;
  feedPath: string;
  locatorPath: string;
  workspacePath: string;
  auditPath: string;
  privateTitle: string;
  privatePlaintext: string;
}

const createPersonalKnowledgeFixture = async (): Promise<PersonalKnowledgeFixture> => {
  const root = await mkdtemp(join(tmpdir(), 'psychsim-personal-source-review-'));
  temporaryDirectories.push(root);
  const sourceRoot = join(root, 'source-docs');
  const privateTitle = 'PRIVATE_NOTE_TITLE_SENTINEL';
  const privatePlaintext = 'PRIVATE_NOTE_PLAINTEXT_SENTINEL about depression and bupropion.';
  const folderAudit: AppleNotesFolderAudit = {
    providerAccountId: 'account.synthetic',
    providerFolderId: 'folder.synthetic',
    folderName: 'Psych research',
    folderShared: false,
    notes: [
      {
        providerNoteId: 'note.synthetic',
        createdAtProvider: '2026-07-25T00:00:00.000Z',
        modifiedAtProvider: '2026-07-25T01:00:00.000Z',
        locked: false,
        shared: false,
        attachmentMetadata: [],
      },
    ],
  };
  const provider: AppleNotesProvider = {
    auditFolder: vi.fn().mockResolvedValue(folderAudit),
    exportNote: vi.fn(async ({ destinationDirectory }) => {
      await Promise.all([
        writeFile(join(destinationDirectory, 'title.txt'), privateTitle),
        writeFile(join(destinationDirectory, 'plaintext.txt'), privatePlaintext),
        writeFile(join(destinationDirectory, 'body.html'), 'PRIVATE_HTML_SENTINEL'),
      ]);
      return {
        providerNoteId: 'note.synthetic',
        modifiedAtProvider: '2026-07-25T01:00:00.000Z',
        attachmentMetadata: [],
      };
    }),
  };
  await syncAppleNotesFolder({
    folderName: 'Psych research',
    sourceRoot,
    provider,
    acknowledgement: AppleNotesLocalAcknowledgementSchema.parse({
      schemaVersion: 1,
      noIdentifiablePatientInformation: true,
      authorizedForLocalProcessing: true,
      sharedMaterialRightsAcknowledged: true,
      acknowledgedAt: '2026-07-25T02:00:00.000Z',
      acknowledgedBy: 'Synthetic reviewer',
    }),
    ocr: false,
    now: () => '2026-07-25T02:00:00.000Z',
  });
  const packetReport = await prepareAppleNotesCodexReviewPacket({
    selector: { kind: 'next' },
    acknowledgement: AppleNotesCodexReviewAcknowledgementSchema.parse({
      schemaVersion: 1,
      contentScope: 'apple_notes_title_plaintext_only',
      noIdentifiablePatientInformation: true,
      authorizedForExternalAiProcessing: true,
      titlePlaintextTransmissionRightsAcknowledged: true,
      sharedMaterialRightsAcknowledged: true,
      appropriateToTransmitToOpenAiCodex: true,
      provider: 'openai_codex',
      modelIdentifier: 'gpt-5.6-sol-test',
      acknowledgedAt: '2026-07-25T03:00:00.000Z',
      acknowledgedBy: 'Synthetic reviewer',
    }),
    sourceRoot,
    now: () => '2026-07-25T03:00:00.000Z',
  });
  const intake = await loadAppleNotesIntakeManifestMetadata(sourceRoot);
  const note = intake?.notes[0];
  if (!note?.sourceDocumentId || !note.titleHash || !note.plaintextHash) {
    throw new Error('Synthetic Apple Notes intake did not produce a complete note revision.');
  }
  const semanticDirectory = join(sourceRoot, 'extracted', 'apple-notes-private', 'semantic-review');
  await mkdir(semanticDirectory, { recursive: true, mode: 0o700 });
  await chmod(semanticDirectory, 0o700);
  const profileId = 'authoring-pilot.initial-mdd-antidepressant-selection';
  const queueEntryId = 'personal-knowledge-queue-entry.synthetic';
  const runId = 'personal-knowledge-run.synthetic';
  const sourceUnitId = 'authored-source-unit-candidate.synthetic';
  const sourceLocator = {
    kind: 'apple_notes_packet',
    sourceDocumentId: note.sourceDocumentId,
    packetId: packetReport.packetId,
    segmentOrdinal: 0,
    segmentHash: note.plaintextHash,
  } as const;
  const queue = {
    schemaVersion: 1,
    queueVersion: 1,
    profileId,
    contentScope: 'apple_notes_title_plaintext_only',
    generatedAt: '2026-07-25T04:00:00.000Z',
    entries: [
      {
        schemaVersion: 1,
        id: queueEntryId,
        profileId,
        noteRecordId: note.id,
        sourceDocumentId: note.sourceDocumentId,
        titleHash: note.titleHash,
        plaintextHash: note.plaintextHash,
        sourceModifiedAtProvider: note.modifiedAtProvider,
        matchedRequiredGroupIds: [
          'authoring-term-group.mdd',
          'authoring-term-group.antidepressant-selection',
        ],
        matchedTargetMatcherIds: ['authoring-target.mdd', 'authoring-target.bupropion'],
        matchedTargetContentIds: ['diagnosis.major-depressive-disorder', 'medication.bupropion'],
        distinctSignalCount: 2,
        totalMatchCount: 2,
        state: 'classified',
        expectedSegmentCount: 1,
        releasedPacketIds: [packetReport.packetId],
        releasedSegmentOrdinals: [0],
        classifiedSegmentOrdinals: [0],
      },
    ],
  };
  const candidateTargets = [
    {
      resolution: 'resolved',
      targetKind: 'diagnosis',
      targetContentId: 'diagnosis.major-depressive-disorder',
      role: 'context',
      rationale: 'Synthetic diagnosis target.',
    },
    {
      resolution: 'resolved',
      targetKind: 'medication',
      targetContentId: 'medication.bupropion',
      role: 'subject',
      rationale: 'Synthetic medication target.',
    },
  ] as const;
  const bibliographyCandidates = Array.from({ length: 3 }, (_, index) => ({
    schemaVersion: 1,
    candidateVersion: 1,
    id: `bibliographic-candidate.synthetic-${index + 1}`,
    sourceUnitCandidateIds: [sourceUnitId],
    sourceUnitIds: [],
    sourceLocators: [sourceLocator],
    citationRole: 'mentioned_source',
    title: `PRIVATE_BIBLIOGRAPHY_TITLE_${index + 1}`,
    authors: [],
    organization: null,
    year: null,
    doi: null,
    pmid: null,
    url: null,
    citationText: null,
    targets: candidateTargets,
    verificationStatus: 'unverified',
    matchedEvidenceSourceId: null,
    semanticRunId: runId,
    reviewStatus: 'proposed',
  }));
  const opinionCandidates = Array.from({ length: 7 }, (_, index) => ({
    schemaVersion: 1,
    candidateVersion: 1,
    id: `developer-opinion-candidate.synthetic-${index + 1}`,
    sourceUnitCandidateIds: [sourceUnitId],
    sourceUnitIds: [],
    sourceLocators: [sourceLocator],
    summary: `Synthetic concise Developer-opinion candidate ${index + 1}.`,
    contributionTypes: ['medication_fit'],
    asOfDate: null,
    asOfDateBasis: 'unknown',
    currentness: 'needs_currentness_review',
    targets: candidateTargets,
    nearbyBibliographicCandidateIds: bibliographyCandidates.map((candidate) => candidate.id),
    semanticRunId: runId,
    reviewStatus: 'proposed',
    medicalReviewStatus: 'unreviewed',
    needsHumanReview: true,
  }));
  const workspace = {
    schemaVersion: 1,
    workspaceVersion: 1,
    updatedAt: '2026-07-25T04:00:00.000Z',
    contentScope: 'apple_notes_title_plaintext_only',
    semanticRuns: [
      {
        schemaVersion: 1,
        id: runId,
        profileId,
        packetId: packetReport.packetId,
        packetSha256: packetReport.packetSha256,
        modelIdentifier: 'gpt-5.6-sol-test',
        promptVersion: 'personal-knowledge-classifier-1',
        classifiedAt: '2026-07-25T04:00:00.000Z',
        outputSha256: 'e'.repeat(64),
      },
    ],
    sourceUnitCandidates: [
      {
        schemaVersion: 1,
        candidateVersion: 1,
        id: sourceUnitId,
        sourceLocators: [sourceLocator],
        unitKind: 'personal_takeaway',
        boundaryState: 'complete',
        title: 'PRIVATE_SOURCE_UNIT_TITLE',
        byline: null,
        venue: null,
        url: null,
        originalDate: null,
        revisedDate: null,
        assertedAuthorship: 'user_authored',
        rightsState: 'private_processing_only',
        currentness: 'needs_currentness_review',
        excludedMaterialKinds: [],
        targets: candidateTargets,
        semanticRunId: runId,
        reviewStatus: 'proposed',
      },
    ],
    sourceUnits: [],
    bibliographicCandidates: bibliographyCandidates,
    opinionCandidates,
    opinions: [],
    opinionEvidenceRelationships: [],
  };
  const queuePath = join(semanticDirectory, `${profileId}.queue.json`);
  const workspacePath = join(semanticDirectory, 'workspace.json');
  await Promise.all([
    writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, { mode: 0o600 }),
    writeFile(workspacePath, `${JSON.stringify(workspace, null, 2)}\n`, { mode: 0o600 }),
  ]);
  await Promise.all([chmod(queuePath, 0o600), chmod(workspacePath, 0o600)]);
  const generatedRoot = join(root, 'generated', 'source-review');
  return {
    sourceRoot,
    generatedRoot,
    feedPath: join(generatedRoot, 'tickets.json'),
    locatorPath: join(sourceRoot, 'manifests', 'source-review-units.json'),
    workspacePath,
    auditPath: packetReport.auditPath,
    privateTitle,
    privatePlaintext,
  };
};

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
  it('adapts one classified private revision into seven immutable local opinion proposals', async () => {
    const fixture = await createPersonalKnowledgeFixture();
    const options = {
      sourceRoot: fixture.sourceRoot,
      generatedRoot: fixture.generatedRoot,
      feedPath: fixture.feedPath,
      locatorPath: fixture.locatorPath,
      publicTargetIds: ['diagnosis.major-depressive-disorder', 'medication.bupropion'],
    };
    const first = await preparePersonalKnowledgeSourceReviewPacket(options);
    const second = await preparePersonalKnowledgeSourceReviewPacket(options);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ tickets: 1, sourceUnits: 1 });
    await expect(validateSourceReviewPrivateState(options)).resolves.toEqual(first);

    const feedText = await readFile(fixture.feedPath, 'utf8');
    const feed = SourceReviewTicketFeedSchema.parse(JSON.parse(feedText) as unknown);
    expect(feed.tickets[0]?.sourceReviewSnapshot?.atomicProposals).toHaveLength(7);
    expect(
      feed.tickets[0]?.sourceReviewSnapshot?.atomicProposals.every(
        (proposal) => proposal.proposalType === 'developer_opinion',
      ),
    ).toBe(true);
    for (const forbidden of [
      fixture.privateTitle,
      fixture.privatePlaintext,
      'PRIVATE_SOURCE_UNIT_TITLE',
      'PRIVATE_BIBLIOGRAPHY_TITLE_1',
      'personal-knowledge-queue-entry.synthetic',
      'personal-knowledge-run.synthetic',
      'developer-opinion-candidate.synthetic-1',
    ]) {
      expect(feedText).not.toContain(forbidden);
    }

    const locator = JSON.parse(await readFile(fixture.locatorPath, 'utf8')) as {
      entries: Array<{
        locatorKind: string;
        opinionCandidates: Array<{ safeProposalId: string }>;
      }>;
    };
    expect(locator.entries[0]?.locatorKind).toBe('personal_knowledge_classification');
    expect(locator.entries[0]?.opinionCandidates).toHaveLength(7);
    expect(
      locator.entries[0]?.opinionCandidates.every((candidate) => candidate.safeProposalId),
    ).toBe(true);
  });

  it('quarantines a personal packet when its exact opinion candidate drifts', async () => {
    const fixture = await createPersonalKnowledgeFixture();
    const options = {
      sourceRoot: fixture.sourceRoot,
      generatedRoot: fixture.generatedRoot,
      feedPath: fixture.feedPath,
      locatorPath: fixture.locatorPath,
      publicTargetIds: ['diagnosis.major-depressive-disorder', 'medication.bupropion'],
    };
    await preparePersonalKnowledgeSourceReviewPacket(options);
    const workspace = JSON.parse(await readFile(fixture.workspacePath, 'utf8')) as {
      opinionCandidates: Array<{ summary: string }>;
    };
    workspace.opinionCandidates[0]!.summary = 'Mutated independently worded candidate.';
    await writeFile(fixture.workspacePath, `${JSON.stringify(workspace, null, 2)}\n`, {
      mode: 0o600,
    });
    await chmod(fixture.workspacePath, 0o600);

    await expect(validateSourceReviewPrivateState(options)).rejects.toThrow(
      'no longer matches its personal-knowledge classification',
    );
  });

  it('quarantines a personal packet when its exact classification audit entry drifts', async () => {
    const fixture = await createPersonalKnowledgeFixture();
    const options = {
      sourceRoot: fixture.sourceRoot,
      generatedRoot: fixture.generatedRoot,
      feedPath: fixture.feedPath,
      locatorPath: fixture.locatorPath,
      publicTargetIds: ['diagnosis.major-depressive-disorder', 'medication.bupropion'],
    };
    await preparePersonalKnowledgeSourceReviewPacket(options);
    const audit = JSON.parse(await readFile(fixture.auditPath, 'utf8')) as {
      entries: Array<{ acknowledgement: { acknowledgedBy: string } }>;
    };
    audit.entries[0]!.acknowledgement.acknowledgedBy = 'Changed synthetic reviewer';
    await writeFile(fixture.auditPath, `${JSON.stringify(audit, null, 2)}\n`, { mode: 0o600 });
    await chmod(fixture.auditPath, 0o600);

    await expect(validateSourceReviewPrivateState(options)).rejects.toThrow(
      'no longer matches its personal-knowledge classification',
    );
  });

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

  it('allows an authorized local Developer-opinion candidate without granting source rights', async () => {
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

    await expect(prepareSourceReviewPackets(optionsFor(fixture))).resolves.toMatchObject({
      tickets: 1,
      sourceUnits: 1,
    });
  });

  it('does not let private-processing authorization create a clinical-rule candidate', async () => {
    const fixture = await createFixture();
    const draft = JSON.parse(await readFile(fixture.draftPath, 'utf8')) as {
      units: Array<{
        rightsState: Record<string, unknown>;
        atomicProposals: Array<Record<string, unknown>>;
      }>;
    };
    draft.units[0]!.rightsState = {
      status: 'private_processing_only',
      sourceUseDecisionId: null,
      portableReviewAllowed: false,
      note: 'Local preservation and review only.',
    };
    draft.units[0]!.atomicProposals[0]!.proposalType = 'clinical_rule_candidate';
    await writeFile(fixture.draftPath, JSON.stringify(draft), { mode: 0o600 });
    await chmod(fixture.draftPath, 0o600);

    await expect(prepareSourceReviewPackets(optionsFor(fixture))).rejects.toThrow(
      'local Developer-opinion candidates',
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
