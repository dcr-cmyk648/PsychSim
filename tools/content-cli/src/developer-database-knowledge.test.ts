import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DeveloperDatabaseKnowledgeProjectionSchema,
  DeveloperOpinionCatalogSchema,
  EvidenceSourceDefinitionSchema,
  PersonalKnowledgeAuthoringAliasCatalogSchema,
  PersonalKnowledgeWorkbenchProjectionSchema,
  SourceUseDecisionCatalogSchema,
  type SourceChunk,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';

import sourceUseDecisionsJson from '../../../content/catalogs/evidence/source-use-decisions.json';
import developerOpinionsJson from '../../../content/catalogs/evidence/opinions/developer-opinions.json';
import nimhMentalHealthTopicsJson from '../../../content/catalogs/evidence/formal/nimh-mental-health-topics.evidence.json';
import ombSpd15Json from '../../../content/catalogs/evidence/formal/omb-spd15-2024.evidence.json';
import {
  appleNoteSurfaces,
  buildQueueStateByRevision,
  buildDeveloperDatabaseKnowledgeProjection,
  nonOverlappingTermMatches,
  personalKnowledgeRevisionKey,
  validatePersonalKnowledgeAliasCatalog,
  writeDeveloperDatabaseKnowledgeProjection,
  type DeveloperDatabaseKnowledgeBuildInput,
} from './developer-database-knowledge';

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const aliasCatalog = PersonalKnowledgeAuthoringAliasCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'authoring-aliases.personal-knowledge.synthetic',
  runtimeExcluded: true,
  entries: [
    {
      id: 'authoring-alias.synthetic.bupropion',
      targetCategoryId: 'medications',
      targetContentId: 'medication.bupropion',
      aliases: ['Wellbutrin'],
    },
  ],
});

const buildInput = (
  text = 'Wellbutrin appears in OCR. This unique private sentence must not be serialized.',
): DeveloperDatabaseKnowledgeBuildInput => ({
  units: [
    {
      id: 'knowledge-unit.aaaaaaaaaaaaaaaaaaaaaaaa',
      sourceKind: 'apple_notes',
      sourceRole: 'personal_research_note',
      displayLabel: 'Apple Notes research item 001',
      sourceModifiedAt: '2026-07-20T12:00:00.000Z',
      boundaryState: 'complete',
      accessState: 'fully_indexed',
      semanticState: 'not_semantically_reviewed',
      surfaces: [{ surface: 'attachment_ocr', text }],
    },
  ],
  aliasCatalog,
  workbench: null,
  evidenceSources: [
    ...catalogs.evidenceSources,
    EvidenceSourceDefinitionSchema.parse(nimhMentalHealthTopicsJson),
    EvidenceSourceDefinitionSchema.parse(ombSpd15Json),
  ],
  sourceUseDecisions: SourceUseDecisionCatalogSchema.parse(sourceUseDecisionsJson).decisions,
  developerOpinions: [],
  opinionEvidenceRelationships: [],
  generatedAt: '2026-07-26T12:00:00.000Z',
  appleNotesRevisions: 1,
  appleNotesAttachmentRecords: 1,
  appleNotesOcrCompleted: 1,
  privateDriveDocuments: 0,
});

const emptyWorkbench = PersonalKnowledgeWorkbenchProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 1,
  generatedAt: '2026-07-26T12:00:00.000Z',
  pilotTopicId: 'authoring-pilot.synthetic',
  summary: {
    intakeEligibleSources: 0,
    queuedSources: 0,
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
  warnings: [],
});

const sourceChunk = (ordinal: number, section: string, text: string): SourceChunk => ({
  schemaVersion: 1,
  id: `source-chunk.synthetic-${ordinal}`,
  sourceDocumentId: 'source-document.synthetic',
  ordinal,
  section,
  text,
  textHash: 'a'.repeat(64),
});

describe('Developer database knowledge compiler', () => {
  it('fans a formal contribution out to every explicitly targeted database entry', () => {
    const projection = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    const aripiprazole = projection.records.find(
      (record) => record.entryId === 'medication.aripiprazole',
    )!;
    const clozapine = projection.records.find(
      (record) => record.entryId === 'medication.clozapine',
    )!;
    const memantine = projection.records.find(
      (record) => record.entryId === 'medication.memantine',
    )!;
    expect(aripiprazole.formalContributions.map((contribution) => contribution.id)).toContain(
      'source-use.diagnosis-schizophrenia.roerig-2019-clozapine-augmentation',
    );
    expect(clozapine.formalContributions.map((contribution) => contribution.id)).toContain(
      'source-use.medication-aripiprazole.tiihonen-2019-clozapine-combination',
    );
    expect(memantine.formalContributions.map((contribution) => contribution.id)).toContain(
      'source-use.diagnosis-schizophrenia.mishra-2024-memantine-mirtazapine-signals',
    );
  });

  it('projects accepted Developer opinions separately from formal contributions', () => {
    const opinionCatalog = DeveloperOpinionCatalogSchema.parse(developerOpinionsJson);
    const projection = buildDeveloperDatabaseKnowledgeProjection({
      ...buildInput(),
      developerOpinions: opinionCatalog.opinions,
      opinionEvidenceRelationships: opinionCatalog.evidenceRelationships,
    });
    const aripiprazole = projection.records.find(
      (record) => record.entryId === 'medication.aripiprazole',
    )!;
    expect(aripiprazole.compilationState).toBe('reviewed_knowledge');
    expect(aripiprazole.developerOpinions.map((opinion) => opinion.id)).toEqual(
      expect.arrayContaining([
        'developer-opinion.clozapine-aripiprazole-routine-augmentation.2026-07-27',
        'developer-opinion.clozapine-ect-practicality-and-law.2026-07-27',
      ]),
    );
    expect(
      aripiprazole.developerOpinions.flatMap((opinion) =>
        opinion.evidenceRelationships.map((relationship) => relationship.evidenceSource.id),
      ),
    ).toContain('evidence.fda.abilify-maintena-label.2025-01');
    expect(projection.summary.acceptedOpinions).toBe(
      new Set(
        projection.records.flatMap((record) =>
          record.developerOpinions.map((opinion) => opinion.id),
        ),
      ).size,
    );
    expect(projection.summary.acceptedOpinions).toBeGreaterThanOrEqual(4);
    expect(
      projection.records
        .find((record) => record.entryId === 'diagnosis.major-depressive-disorder')
        ?.developerOpinions.map((opinion) => opinion.id),
    ).toEqual(
      expect.arrayContaining([
        'developer-opinion.mdd-initial-first-line-antidepressant-baseline.2026-07-27',
        'developer-opinion.treatment-triggered-history-and-prior-reactions.2026-07-27',
      ]),
    );
    const initialMddOpinion = projection.records
      .find((record) => record.entryId === 'diagnosis.major-depressive-disorder')
      ?.developerOpinions.find(
        (opinion) =>
          opinion.id ===
          'developer-opinion.mdd-initial-first-line-antidepressant-baseline.2026-07-27',
      );
    expect(initialMddOpinion?.targetEntryIds).toContain('diagnosis.major-depressive-disorder');
    expect(initialMddOpinion?.targetEntryIds).not.toContain(
      'medication-regimen-route.mdd-initial-one-first-line-antidepressant',
    );
  });

  it('rejects an unknown authoring-only clinical-rule target', () => {
    const opinionCatalog = DeveloperOpinionCatalogSchema.parse(developerOpinionsJson);
    const tamperedOpinions = opinionCatalog.opinions.map((opinion) => ({
      ...opinion,
      targets: opinion.targets.map((target) =>
        target.targetKind === 'clinical_rule'
          ? { ...target, targetContentId: 'clinical-rule.unknown' }
          : target,
      ),
    }));
    expect(() =>
      buildDeveloperDatabaseKnowledgeProjection({
        ...buildInput(),
        developerOpinions: tamperedOpinions,
        opinionEvidenceRelationships: opinionCatalog.evidenceRelationships,
      }),
    ).toThrow(/unknown authoring-only clinical rule/);
  });

  it('deterministically links OCR without serializing private prose', () => {
    const first = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    const second = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    expect(second).toEqual(first);
    const bupropion = first.records.find((record) => record.entryId === 'medication.bupropion')!;
    expect(bupropion.personalSourceUnitCount).toBe(1);
    expect(bupropion.lexicalSignals[0]?.surfaces).toEqual(['attachment_ocr']);
    expect(bupropion.lexicalSignals[0]?.matchedTerms).toEqual([
      { term: 'Wellbutrin', count: 1, surfaces: ['attachment_ocr'] },
    ]);
    expect(first.summary).toMatchObject({
      personalSourceDocuments: 1,
      sourceUnits: 1,
      fullyIndexedUnits: 1,
      partiallyIndexedUnits: 0,
      quarantinedUnits: 0,
      unitsWithTargetMatches: 1,
    });
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain('This unique private sentence');
    expect(serialized).not.toContain('source-document.');
    expect(serialized).not.toContain('source-chunk.');
  });

  it('changes its aggregate fingerprint when any indexed private surface changes', () => {
    const first = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    const second = buildDeveloperDatabaseKnowledgeProjection(
      buildInput('Wellbutrin appears in OCR with changed private context.'),
    );
    expect(second.inputFingerprint).not.toBe(first.inputFingerprint);
  });

  it('does not churn its fingerprint for a workbench generation timestamp alone', () => {
    const first = buildDeveloperDatabaseKnowledgeProjection({
      ...buildInput(),
      workbench: emptyWorkbench,
    });
    const second = buildDeveloperDatabaseKnowledgeProjection({
      ...buildInput(),
      workbench: {
        ...emptyWorkbench,
        generatedAt: '2026-07-27T12:00:00.000Z',
      },
    });

    expect(second.records).toEqual(first.records);
    expect(second.inputFingerprint).toBe(first.inputFingerprint);
  });

  it('rejects projection aggregates and compilation states that drift from their lanes', () => {
    const projection = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    const recordIndex = projection.records.findIndex(
      (record) => record.entryId === 'medication.bupropion',
    );
    const bupropion = projection.records[recordIndex]!;
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        records: projection.records.map((record, index) =>
          index === recordIndex
            ? {
                ...bupropion,
                compilationState: 'no_personal_match',
              }
            : record,
        ),
      }),
    ).toThrow(/compilation state/);
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        records: projection.records.map((record, index) =>
          index === recordIndex
            ? {
                ...bupropion,
                lexicalSignals: bupropion.lexicalSignals.map((signal) => ({
                  ...signal,
                  totalMatches: signal.totalMatches + 1,
                })),
                personalSourceTotalMatches: bupropion.personalSourceTotalMatches + 1,
              }
            : record,
        ),
        summary: {
          ...projection.summary,
          totalLexicalMatches: projection.summary.totalLexicalMatches + 1,
        },
      }),
    ).toThrow(/internally consistent/);
  });

  it('prefers the longest overlapping alias and preserves boundary-aware distinct mentions', () => {
    expect(
      nonOverlappingTermMatches(
        [
          {
            surface: 'note_plaintext',
            text: 'Major depression, then depression. Hypomania and Romania are not mania.',
          },
        ],
        ['depression', 'major depression', 'mania'],
      ),
    ).toEqual([
      { term: 'depression', count: 1, surfaces: ['note_plaintext'] },
      { term: 'major depression', count: 1, surfaces: ['note_plaintext'] },
      { term: 'mania', count: 1, surfaces: ['note_plaintext'] },
    ]);
    expect(
      nonOverlappingTermMatches(
        [{ surface: 'note_title', text: 'ＳＳＲＩ considerations' }],
        ['SSRI'],
      ),
    ).toEqual([{ term: 'SSRI', count: 1, surfaces: ['note_title'] }]);
  });

  it('resets Apple composite classification at every unfamiliar section', () => {
    expect(
      appleNoteSurfaces([
        sourceChunk(0, 'Note title', 'Title'),
        sourceChunk(1, 'Unfamiliar section', 'Must not inherit the title surface'),
        sourceChunk(2, 'Note text', 'Takeaway'),
        sourceChunk(3, 'Attachment 1', 'Attachment metadata'),
        sourceChunk(4, 'Attachment 1 OCR', 'OCR content'),
      ]),
    ).toEqual([
      { surface: 'note_title', text: 'Title' },
      { surface: 'note_plaintext', text: 'Takeaway' },
      { surface: 'attachment_ocr', text: 'OCR content' },
    ]);
  });

  it('keeps stale and current revisions distinct for the same Apple Note', () => {
    const shared = {
      noteRecordId: 'apple-note.synthetic',
      titleHash: 'a'.repeat(64),
      plaintextHash: 'b'.repeat(64),
    };
    const stale = {
      ...shared,
      id: 'personal-knowledge-queue-entry.stale',
      sourceDocumentId: 'source-document.stale',
      sourceModifiedAtProvider: '2026-07-01T12:00:00.000Z',
      state: 'stale',
    };
    const current = {
      ...shared,
      id: 'personal-knowledge-queue-entry.current',
      sourceDocumentId: 'source-document.current',
      sourceModifiedAtProvider: '2026-07-26T12:00:00.000Z',
      state: 'classified',
    };
    const states = buildQueueStateByRevision([current, stale]);
    expect(states.get(personalKnowledgeRevisionKey(current))).toBe('classified');
    expect(states.get(personalKnowledgeRevisionKey(stale))).toBe('stale');
  });

  it('quarantines a workbench dossier that cannot map to the public database', () => {
    expect(() =>
      buildDeveloperDatabaseKnowledgeProjection({
        ...buildInput(),
        workbench: {
          ...emptyWorkbench,
          dossiers: [
            {
              targetId: 'medication.not-in-database',
              targetKind: 'medication',
              label: 'Missing',
              queuedSourceCount: 1,
              sourceUnitCount: 0,
              formalEvidenceSourceIds: [],
              currentRuleIds: [],
              balanceEntries: [],
              bibliographicCandidates: [],
              candidates: [],
            },
          ],
        },
      }),
    ).toThrow(/unknown database entry/);
  });

  it('preserves semantically unmapped candidates instead of silently dropping them', () => {
    const projection = buildDeveloperDatabaseKnowledgeProjection({
      ...buildInput(),
      workbench: {
        ...emptyWorkbench,
        unmappedCandidates: [
          {
            id: 'developer-opinion-candidate.synthetic-unmapped',
            summary: 'Synthetic decision-capacity opinion without a public target identity.',
            sourceUnitId: 'authored-source-unit-candidate.synthetic-unmapped',
            sourceDate: null,
            currentness: 'needs_currentness_review',
            reviewStatus: 'proposed',
            contributionTypes: ['context_only'],
            resolvedTargets: [],
            unresolvedTargets: [
              {
                targetKindHint: 'test',
                searchLabel: 'Decision-making capacity assessment',
                role: 'subject',
                reason: 'The public database does not yet have this assessment identity.',
              },
            ],
            evidenceRelations: [],
          },
        ],
      },
    });
    expect(projection.unmappedCandidateSummaries).toHaveLength(1);
    expect(projection.summary.candidateSummaries).toBe(1);
    expect(projection.unmappedCandidateSummaries[0]?.unresolvedTargets[0]?.searchLabel).toBe(
      'Decision-making capacity assessment',
    );
    expect(projection.catalogIdentityAudit.identityGaps).toEqual([
      expect.objectContaining({
        normalizedSearchLabel: 'decision-making capacity assessment',
        targetKindHint: 'test',
        status: 'proposed_new_catalog_entry',
        candidateEntryIds: [],
        occurrences: [
          expect.objectContaining({
            candidateId: 'developer-opinion-candidate.synthetic-unmapped',
          }),
        ],
      }),
    ]);
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        catalogIdentityAudit: {
          ...projection.catalogIdentityAudit,
          identityGaps: [],
        },
      }),
    ).toThrow(/Every unresolved semantic target/);
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        records: projection.records.map((record) =>
          record.entryId === 'medication.bupropion'
            ? {
                ...record,
                candidateSummaries: [
                  ...record.candidateSummaries,
                  projection.unmappedCandidateSummaries[0],
                ],
              }
            : record,
        ),
      }),
    ).toThrow(/distinct stable IDs/);
  });

  it('surfaces unresolved target mentions without promoting them into mapped knowledge', () => {
    const unresolvedCandidate = {
      id: 'developer-opinion-candidate.synthetic-wellbutrin-mention',
      summary: 'Synthetic comparison that names Wellbutrin without resolving the target.',
      sourceUnitId: 'authored-source-unit-candidate.synthetic-wellbutrin-mention',
      sourceDate: null,
      currentness: 'needs_currentness_review' as const,
      reviewStatus: 'proposed' as const,
      contributionTypes: ['patient_fact', 'medication_fit'] as Array<
        'patient_fact' | 'medication_fit'
      >,
      resolvedTargets: [
        {
          targetKind: 'diagnosis' as const,
          targetContentId: 'diagnosis.major-depressive-disorder',
          role: 'context' as const,
        },
      ],
      unresolvedTargets: [
        {
          targetKindHint: 'medication' as const,
          searchLabel: 'Wellbutrin',
          role: 'comparator' as const,
          reason: 'The synthetic source did not resolve its comparator identity.',
        },
      ],
      evidenceRelations: [],
    };
    const projection = buildDeveloperDatabaseKnowledgeProjection({
      ...buildInput(),
      workbench: {
        ...emptyWorkbench,
        unmappedCandidates: [unresolvedCandidate],
      },
    });
    const bupropion = projection.records.find(
      (record) => record.entryId === 'medication.bupropion',
    )!;

    expect(bupropion.candidateSummaries).toHaveLength(0);
    expect(bupropion.unresolvedCandidateMentions).toEqual([unresolvedCandidate]);
    expect(projection.unmappedCandidateSummaries).toEqual([unresolvedCandidate]);
    expect(bupropion.compilationState).toBe('lexically_linked');
    expect(projection.catalogIdentityAudit.identityGaps).toEqual([
      expect.objectContaining({
        normalizedSearchLabel: 'wellbutrin',
        targetKindHint: 'medication',
        status: 'likely_existing_entry',
        candidateEntryIds: ['medication.bupropion'],
      }),
    ]);
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        records: projection.records.map((record) =>
          record.entryId === 'medication.bupropion'
            ? {
                ...record,
                unresolvedCandidateMentions: record.unresolvedCandidateMentions.map(
                  (candidate) => ({
                    ...candidate,
                    unresolvedTargets: candidate.unresolvedTargets.map((target) => ({
                      ...target,
                      searchLabel: 'Not an indexed bupropion term',
                    })),
                  }),
                ),
              }
            : record,
        ),
      }),
    ).toThrow(/must match an indexed term/);
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        unmappedCandidateSummaries: projection.unmappedCandidateSummaries.map((candidate) => ({
          ...candidate,
          resolvedTargets: candidate.resolvedTargets.map((target) => ({
            ...target,
            targetContentId: 'condition.missing',
          })),
        })),
      }),
    ).toThrow(/unknown database entry/);
    expect(() =>
      DeveloperDatabaseKnowledgeProjectionSchema.parse({
        ...projection,
        unmappedCandidateSummaries: projection.unmappedCandidateSummaries.map((candidate) => ({
          ...candidate,
          resolvedTargets: candidate.resolvedTargets.map((target) => ({
            ...target,
            targetKind: 'medication',
          })),
        })),
      }),
    ).toThrow(/does not match database category/);
  });

  it('surfaces normalized catalog-term overlap for developer review without auto-merging entries', () => {
    const projection = buildDeveloperDatabaseKnowledgeProjection({
      ...buildInput(),
      aliasCatalog: PersonalKnowledgeAuthoringAliasCatalogSchema.parse({
        ...aliasCatalog,
        entries: [
          {
            id: 'authoring-alias.synthetic.bupropion',
            targetCategoryId: 'medications',
            targetContentId: 'medication.bupropion',
            aliases: ['Wellbutrin', 'Sertraline'],
          },
        ],
      }),
    });

    expect(projection.catalogIdentityAudit.overlappingTerms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          normalizedTerm: 'sertraline',
          entryIds: ['medication.bupropion', 'medication.sertraline'],
          reviewStatus: 'needs_developer_review',
        }),
      ]),
    );
  });

  it('rejects unknown, wrong-category, and cross-target ambiguous aliases', () => {
    expect(() =>
      validatePersonalKnowledgeAliasCatalog({
        ...aliasCatalog,
        entries: [
          {
            id: 'authoring-alias.synthetic.unknown',
            targetCategoryId: 'medications',
            targetContentId: 'medication.unknown',
            aliases: ['Unknown medicine'],
          },
        ],
      }),
    ).toThrow(/unknown database entry/);
    expect(() =>
      validatePersonalKnowledgeAliasCatalog({
        ...aliasCatalog,
        entries: [
          {
            id: 'authoring-alias.synthetic.wrong-category',
            targetCategoryId: 'conditions',
            targetContentId: 'medication.bupropion',
            aliases: ['Wellbutrin'],
          },
        ],
      }),
    ).toThrow(/not medications/);
    expect(() =>
      validatePersonalKnowledgeAliasCatalog({
        ...aliasCatalog,
        entries: [
          ...aliasCatalog.entries,
          {
            id: 'authoring-alias.synthetic.sertraline',
            targetCategoryId: 'medications',
            targetContentId: 'medication.sertraline',
            aliases: ['wellbutrin'],
          },
        ],
      }),
    ).toThrow(/ambiguously targets/);
  });

  it('writes only below the protected root as a private regular file', async () => {
    const projection = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    const root = await mkdtemp(join(tmpdir(), 'psychsim-database-knowledge-'));
    temporaryDirectories.push(root);
    const output = join(root, 'nested', 'database-cross-reference.json');
    await writeDeveloperDatabaseKnowledgeProjection(projection, output, root);
    const stat = await lstat(output);
    expect(stat.isFile()).toBe(true);
    expect(stat.isSymbolicLink()).toBe(false);
    expect(stat.mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(output, 'utf8'))).toEqual(projection);
    await expect(
      writeDeveloperDatabaseKnowledgeProjection(projection, join(root, '..', 'escaped.json'), root),
    ).rejects.toThrow(/escaped its protected root/);
  });

  it('rejects protected-root, nested-directory, and output symlinks before writing', async () => {
    const projection = buildDeveloperDatabaseKnowledgeProjection(buildInput());
    const base = await mkdtemp(join(tmpdir(), 'psychsim-database-symlink-'));
    const outside = await mkdtemp(join(tmpdir(), 'psychsim-database-outside-'));
    temporaryDirectories.push(base, outside);

    const rootTarget = join(base, 'root-target');
    const rootLink = join(base, 'root-link');
    await mkdir(rootTarget);
    await symlink(rootTarget, rootLink);
    await expect(
      writeDeveloperDatabaseKnowledgeProjection(
        projection,
        join(rootLink, 'database-cross-reference.json'),
        rootLink,
      ),
    ).rejects.toThrow(/root must be a private regular directory/);

    const protectedRoot = join(base, 'protected');
    await mkdir(protectedRoot);
    const nestedLink = join(protectedRoot, 'nested');
    await symlink(outside, nestedLink);
    await expect(
      writeDeveloperDatabaseKnowledgeProjection(
        projection,
        join(nestedLink, 'database-cross-reference.json'),
        protectedRoot,
      ),
    ).rejects.toThrow(/directory escaped its protected root/);

    const externalFile = join(outside, 'external.json');
    const outputLink = join(protectedRoot, 'database-cross-reference.json');
    await writeFile(externalFile, 'preserve me', 'utf8');
    await symlink(externalFile, outputLink);
    await expect(
      writeDeveloperDatabaseKnowledgeProjection(projection, outputLink, protectedRoot),
    ).rejects.toThrow(/output must be a regular file/);
    expect(await readFile(externalFile, 'utf8')).toBe('preserve me');
  });
});
