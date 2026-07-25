import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DeveloperOpinionCandidateSchema,
  PersonalKnowledgeClassificationResultSchema,
  PersonalKnowledgePilotProfileSchema,
  PersonalKnowledgeWorkspaceSchema,
} from '@psychsim/schemas';

import {
  buildPersonalKnowledgePilotQueueFromSnapshots,
  nextPersonalKnowledgePilotQueueEntry,
  nextPersonalKnowledgePilotReviewSelection,
  readPrivateClassificationResultBytes,
  reconcilePersonalKnowledgeQueueClassification,
  validatePersonalKnowledgePilotProfile,
  validatePersonalKnowledgeWorkspace,
  type PersonalKnowledgeSnapshot,
} from './personal-knowledge-workspace';

const profile = PersonalKnowledgePilotProfileSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'authoring-pilot.test-mdd',
  label: 'Test MDD pilot',
  description: 'Synthetic unit-test profile.',
  contentScope: 'apple_notes_title_plaintext_only',
  requiredTermGroups: [
    { id: 'term-group.depression', label: 'Depression', terms: ['depression'] },
    {
      id: 'term-group.medication',
      label: 'Medication',
      terms: ['bupropion', 'mirtazapine'],
    },
  ],
  targetMatchers: [
    {
      id: 'target.mdd',
      target: {
        resolution: 'resolved',
        targetKind: 'diagnosis',
        targetContentId: 'diagnosis.major-depressive-disorder',
        role: 'context',
        rationale: 'Synthetic test mapping.',
      },
      terms: ['depression'],
    },
    {
      id: 'target.bupropion',
      target: {
        resolution: 'resolved',
        targetKind: 'medication',
        targetContentId: 'medication.bupropion',
        role: 'subject',
        rationale: 'Synthetic test mapping.',
      },
      terms: ['bupropion'],
    },
  ],
});

const snapshots: PersonalKnowledgeSnapshot[] = [
  {
    noteRecordId: 'apple-note.synthetic-a',
    sourceDocumentId: 'source-document.synthetic-a',
    titleHash: 'a'.repeat(64),
    plaintextHash: 'b'.repeat(64),
    sourceModifiedAtProvider: '2026-07-25T12:00:00.000Z',
    title: 'Synthetic depression note',
    plaintext: 'A private phrase about bupropion should never enter the queue.',
  },
  {
    noteRecordId: 'apple-note.synthetic-b',
    sourceDocumentId: 'source-document.synthetic-b',
    titleHash: 'c'.repeat(64),
    plaintextHash: 'd'.repeat(64),
    sourceModifiedAtProvider: '2026-07-25T12:00:00.000Z',
    title: 'Synthetic depression note',
    plaintext: 'This item does not contain the second required term group.',
  },
];

describe('personal knowledge workflow', () => {
  it('accepts only private regular classifier-result files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'psychsim-personal-knowledge-'));
    const path = join(directory, 'classification.json');
    try {
      await writeFile(path, '{}', { mode: 0o600 });
      expect(Buffer.from(await readPrivateClassificationResultBytes(path)).toString('utf8')).toBe(
        '{}',
      );
      await chmod(path, 0o644);
      await expect(readPrivateClassificationResultBytes(path)).rejects.toThrow(
        'private 0600 regular file',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('builds a deterministic queue without retaining private prose', () => {
    validatePersonalKnowledgePilotProfile(profile);
    const first = buildPersonalKnowledgePilotQueueFromSnapshots(
      profile,
      snapshots,
      null,
      '2026-07-25T13:00:00.000Z',
    );
    const second = buildPersonalKnowledgePilotQueueFromSnapshots(
      profile,
      snapshots,
      null,
      '2026-07-25T13:00:00.000Z',
    );
    expect(first).toEqual(second);
    expect(first.entries).toHaveLength(1);
    expect(first.entries[0]?.matchedTargetContentIds).toEqual([
      'diagnosis.major-depressive-disorder',
      'medication.bupropion',
    ]);
    expect(JSON.stringify(first)).not.toContain('private phrase');
    expect(nextPersonalKnowledgePilotQueueEntry(first)?.noteRecordId).toBe(
      'apple-note.synthetic-a',
    );
  });

  it('preserves review state and stales a changed revision', () => {
    const initial = buildPersonalKnowledgePilotQueueFromSnapshots(
      profile,
      snapshots,
      null,
      '2026-07-25T13:00:00.000Z',
    );
    const released = {
      ...initial,
      entries: initial.entries.map((entry) => ({
        ...entry,
        state: 'released' as const,
        expectedSegmentCount: 1,
        releasedPacketIds: ['apple-notes-codex-packet.synthetic'],
        releasedSegmentOrdinals: [0],
      })),
    };
    expect(
      buildPersonalKnowledgePilotQueueFromSnapshots(
        profile,
        snapshots,
        released,
        '2026-07-25T14:00:00.000Z',
      ).entries[0]?.state,
    ).toBe('released');
    expect(
      buildPersonalKnowledgePilotQueueFromSnapshots(
        profile,
        [{ ...snapshots[0]!, plaintextHash: 'e'.repeat(64) }],
        released,
        '2026-07-25T15:00:00.000Z',
      ).entries.map((entry) => entry.state),
    ).toEqual(['queued', 'stale']);
  });

  it('queues every segment of a long note before claiming full classification', () => {
    const initial = buildPersonalKnowledgePilotQueueFromSnapshots(
      profile,
      snapshots,
      null,
      '2026-07-25T13:00:00.000Z',
    );
    const partial = {
      ...initial,
      entries: initial.entries.map((entry) => ({
        ...entry,
        state: 'partially_classified' as const,
        expectedSegmentCount: 2,
        releasedPacketIds: ['apple-notes-codex-packet.segment-1'],
        releasedSegmentOrdinals: [0],
        classifiedSegmentOrdinals: [0],
      })),
    };
    expect(nextPersonalKnowledgePilotReviewSelection(partial)).toMatchObject({
      segmentOrdinal: 1,
      entry: { state: 'partially_classified' },
    });
    const releasedSecond = {
      ...partial,
      entries: partial.entries.map((entry) => ({
        ...entry,
        state: 'released' as const,
        releasedPacketIds: [...entry.releasedPacketIds, 'apple-notes-codex-packet.segment-2'],
        releasedSegmentOrdinals: [0, 1],
      })),
    };
    const classified = reconcilePersonalKnowledgeQueueClassification(releasedSecond, {
      id: 'apple-notes-codex-packet.segment-2',
      noteRecordId: 'apple-note.synthetic-a',
      relatedSourceDocumentId: 'source-document.synthetic-a',
      titleHash: 'a'.repeat(64),
      plaintextHash: 'b'.repeat(64),
      segmentOrdinal: 1,
      segmentCount: 2,
    });
    expect(classified.entries[0]).toMatchObject({
      state: 'classified',
      classifiedSegmentOrdinals: [0, 1],
    });
    expect(
      reconcilePersonalKnowledgeQueueClassification(classified, {
        id: 'apple-notes-codex-packet.segment-2',
        noteRecordId: 'apple-note.synthetic-a',
        relatedSourceDocumentId: 'source-document.synthetic-a',
        titleHash: 'a'.repeat(64),
        plaintextHash: 'b'.repeat(64),
        segmentOrdinal: 1,
        segmentCount: 2,
      }),
    ).toEqual(classified);
    expect(() =>
      reconcilePersonalKnowledgeQueueClassification(releasedSecond, {
        id: 'apple-notes-codex-packet.segment-2',
        noteRecordId: 'apple-note.synthetic-a',
        relatedSourceDocumentId: 'source-document.synthetic-a',
        titleHash: 'a'.repeat(64),
        plaintextHash: '9'.repeat(64),
        segmentOrdinal: 1,
        segmentCount: 2,
      }),
    ).toThrow('not released');
    expect(() =>
      nextPersonalKnowledgePilotReviewSelection({
        ...initial,
        entries: initial.entries.map((entry) => ({
          ...entry,
          state: 'released' as const,
          expectedSegmentCount: 2,
          releasedPacketIds: ['apple-notes-codex-packet.segment-1'],
          releasedSegmentOrdinals: [0],
          classifiedSegmentOrdinals: [],
        })),
      }),
    ).toThrow('Import the currently released pilot packet');
  });

  it('keeps opinion candidates non-executable and point-free', () => {
    const candidate = {
      schemaVersion: 1,
      candidateVersion: 1,
      id: 'developer-opinion-candidate.synthetic',
      sourceUnitCandidateIds: ['authored-source-unit-candidate.synthetic'],
      sourceUnitIds: [],
      sourceLocators: [
        {
          kind: 'apple_notes_packet',
          sourceDocumentId: 'source-document.synthetic',
          packetId: 'apple-notes-codex-packet.synthetic',
          segmentOrdinal: 0,
          segmentHash: 'f'.repeat(64),
        },
      ],
      summary: 'Synthetic independently worded opinion.',
      contributionTypes: ['treatment'],
      asOfDate: '2025',
      asOfDateBasis: 'note_date',
      currentness: 'needs_currentness_review',
      targets: [
        {
          resolution: 'resolved',
          targetKind: 'medication',
          targetContentId: 'medication.bupropion',
          role: 'subject',
          rationale: 'Synthetic mapping.',
        },
      ],
      nearbyBibliographicCandidateIds: [],
      semanticRunId: 'personal-knowledge-run.synthetic',
      reviewStatus: 'proposed',
      medicalReviewStatus: 'unreviewed',
      needsHumanReview: true,
    };
    expect(DeveloperOpinionCandidateSchema.parse(candidate)).toEqual(candidate);
    expect(
      DeveloperOpinionCandidateSchema.safeParse({ ...candidate, pointDelta: 35 }).success,
    ).toBe(false);
    expect(
      DeveloperOpinionCandidateSchema.safeParse({
        ...candidate,
        executablePredicate: { type: 'always' },
      }).success,
    ).toBe(false);
    expect(
      PersonalKnowledgeClassificationResultSchema.safeParse({
        schemaVersion: 1,
        classificationVersion: 1,
        id: 'personal-knowledge-run.synthetic',
        profileId: 'authoring-pilot.test-mdd',
        packetId: 'apple-notes-codex-packet.synthetic',
        packetSha256: 'a'.repeat(64),
        modelIdentifier: 'gpt-5.6-sol',
        promptVersion: 'personal-knowledge-classifier-1',
        classifiedAt: '2026-07-25T13:00:00.000Z',
        disposition: 'candidate_material',
        dispositionSummary: 'Synthetic classifier result.',
        sourceUnitCandidates: [],
        bibliographicCandidates: [],
        opinionCandidates: [{ ...candidate, reviewStatus: 'accepted' }],
      }).success,
    ).toBe(false);
  });

  it('rejects source units that bypass their semantic run', () => {
    const empty = PersonalKnowledgeWorkspaceSchema.parse({
      schemaVersion: 1,
      workspaceVersion: 1,
      updatedAt: '2026-07-25T13:00:00.000Z',
      contentScope: 'apple_notes_title_plaintext_only',
      semanticRuns: [],
      sourceUnitCandidates: [],
      sourceUnits: [],
      bibliographicCandidates: [],
      opinionCandidates: [],
      opinions: [],
      opinionEvidenceRelationships: [],
    });
    expect(() => validatePersonalKnowledgeWorkspace(empty)).not.toThrow();
    expect(() =>
      validatePersonalKnowledgeWorkspace({
        ...empty,
        sourceUnitCandidates: [
          {
            schemaVersion: 1,
            candidateVersion: 1,
            id: 'authored-source-unit-candidate.synthetic',
            sourceLocators: [
              {
                kind: 'apple_notes_packet',
                sourceDocumentId: 'source-document.synthetic',
                packetId: 'apple-notes-codex-packet.synthetic',
                segmentOrdinal: 0,
                segmentHash: 'f'.repeat(64),
              },
            ],
            unitKind: 'personal_takeaway',
            boundaryState: 'complete',
            title: null,
            byline: null,
            venue: null,
            url: null,
            originalDate: null,
            revisedDate: null,
            assertedAuthorship: 'user_authored',
            rightsState: 'private_processing_only',
            currentness: 'needs_currentness_review',
            excludedMaterialKinds: [],
            targets: [],
            semanticRunId: 'personal-knowledge-run.missing',
            reviewStatus: 'proposed',
          },
        ],
      }),
    ).toThrow('unknown semantic run');
  });
});
