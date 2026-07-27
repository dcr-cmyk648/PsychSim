import { describe, expect, it } from 'vitest';

import {
  ClinicalTicketExportBundleSchema,
  DeveloperDatabaseKnowledgeProjectionSchema,
} from '@psychsim/schemas';

import {
  buildDeveloperDatabaseDossierBrief,
  buildDeveloperDatabaseDossierReviewTicket,
  databaseDossierTicketId,
  findCurrentDeveloperDatabaseDossierReview,
} from './developer-database-dossier-review';

const directCandidate = {
  id: 'developer-opinion-candidate.synthetic-venlafaxine-fit',
  summary: 'Synthetic venlafaxine fit candidate for deterministic dossier testing.',
  sourceUnitId: 'authored-source-unit-candidate.synthetic-venlafaxine-fit',
  sourceDate: null,
  currentness: 'needs_currentness_review' as const,
  reviewStatus: 'proposed' as const,
  contributionTypes: ['patient_fact', 'medication_fit'] as const,
  resolvedTargets: [
    {
      targetKind: 'medication' as const,
      targetContentId: 'medication.venlafaxine',
      role: 'subject' as const,
    },
  ],
  unresolvedTargets: [],
  evidenceRelations: [],
};

const unresolvedCandidate = {
  id: 'developer-opinion-candidate.synthetic-venlafaxine-comparator',
  summary: 'Synthetic comparison that still needs a venlafaxine target decision.',
  sourceUnitId: 'authored-source-unit-candidate.synthetic-venlafaxine-comparator',
  sourceDate: null,
  currentness: 'needs_currentness_review' as const,
  reviewStatus: 'proposed' as const,
  contributionTypes: ['safety'] as const,
  resolvedTargets: [
    {
      targetKind: 'diagnosis' as const,
      targetContentId: 'diagnosis.bipolar-spectrum-disorder',
      role: 'context' as const,
    },
  ],
  unresolvedTargets: [
    {
      targetKindHint: 'medication' as const,
      searchLabel: 'venlafaxine',
      role: 'comparator' as const,
      reason: 'The source classification did not resolve this medication identity.',
    },
  ],
  evidenceRelations: [],
};

const projection = DeveloperDatabaseKnowledgeProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 2,
  generatedAt: '2026-07-26T12:00:00.000Z',
  catalogContentVersion: '1.0.0',
  inputFingerprint: 'a'.repeat(64),
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
    targetEntries: 2,
    matchedTargetEntries: 0,
    totalLexicalMatches: 0,
    semanticallyClassifiedUnits: 0,
    candidateSummaries: 2,
    acceptedOpinions: 0,
    formalContributions: 0,
    formalSources: 0,
    registeredFormalSources: 0,
  },
  corpusUnits: [],
  records: [
    {
      entryId: 'medication.venlafaxine',
      categoryId: 'medications',
      label: 'Venlafaxine',
      compilationState: 'candidate_material',
      indexedTerms: ['Venlafaxine', 'Effexor'],
      personalSourceUnitCount: 0,
      personalSourceTotalMatches: 0,
      lexicalSignals: [],
      candidateSummaries: [directCandidate],
      unresolvedCandidateMentions: [unresolvedCandidate],
      bibliographicCandidates: [],
      formalContributions: [],
      ruleSummaries: [],
      relatedEntryIds: [],
    },
    {
      entryId: 'diagnosis.bipolar-spectrum-disorder',
      categoryId: 'conditions',
      label: 'Bipolar spectrum disorder',
      compilationState: 'identity_only',
      indexedTerms: ['Bipolar spectrum disorder'],
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
  unmappedCandidateSummaries: [unresolvedCandidate],
  unmappedBibliographicCandidates: [],
  catalogIdentityAudit: {
    identityGaps: [
      {
        id: 'catalog-identity-gap.synthetic-venlafaxine',
        normalizedSearchLabel: 'venlafaxine',
        displayLabel: 'venlafaxine',
        targetKindHint: 'medication',
        status: 'likely_existing_entry',
        candidateEntryIds: ['medication.venlafaxine'],
        occurrences: [
          {
            candidateId: 'developer-opinion-candidate.synthetic-venlafaxine-comparator',
            targetKindHint: 'medication',
            searchLabel: 'venlafaxine',
            role: 'comparator',
            reason: 'The source classification did not resolve this medication identity.',
          },
        ],
        reviewRequired: true,
      },
    ],
    overlappingTerms: [],
  },
  warnings: [],
});

describe('Developer database dossier review', () => {
  it('builds one deterministic authority-separated brief without private source identifiers', () => {
    const record = projection.records[0]!;
    const first = buildDeveloperDatabaseDossierBrief(projection, record);
    const second = buildDeveloperDatabaseDossierBrief(projection, record);

    expect(second).toEqual(first);
    expect(first.guidance).toContain('Synthetic venlafaxine fit candidate');
    expect(first.guidance).toContain('unresolved cross-target candidate');
    expect(first.guidance).toContain('Potential patient/randomization inputs');
    expect(first.guidance).toContain('Lexical matches never become randomization inputs');
    expect(first.guidance).toContain('No entry-level randomization rule is compiled');
    expect(first.guidance).not.toContain('authored-source-unit');
    expect(first.guidance).not.toContain('source-document.');
    expect(first.guidance).not.toContain('source-chunk.');
    expect(first.guidance.length).toBeLessThanOrEqual(4000);
  });

  it('preserves the exact brief and fingerprint while keeping reviewer prose non-executable', () => {
    const record = projection.records[0]!;
    const first = buildDeveloperDatabaseDossierReviewTicket({
      knowledge: projection,
      record,
      reviewerNotes:
        'Consider renal function as a patient fact and route any point magnitude separately.',
      timestamp: '2026-07-26T13:00:00.000Z',
    });
    const edited = buildDeveloperDatabaseDossierReviewTicket({
      knowledge: projection,
      record,
      reviewerNotes: 'Revised interpretation; create separate generation and balance proposals.',
      timestamp: '2026-07-26T14:00:00.000Z',
      existingTicket: first,
    });

    const brief = buildDeveloperDatabaseDossierBrief(projection, record);
    expect(first.id).toBe(databaseDossierTicketId(record.entryId, brief.dossierFingerprint));
    expect(first.resurfacingTrigger).toContain(brief.dossierFingerprint);
    expect(first.guidance).toBe(buildDeveloperDatabaseDossierBrief(projection, record).guidance);
    expect(first.resurfacingTrigger).toContain(projection.inputFingerprint);
    expect(first.targetContentIds).toEqual(['medication.venlafaxine']);
    expect(first.sourceReviewSnapshot).toBeNull();
    expect(first.resolution).toBeNull();
    expect(edited.createdAt).toBe(first.createdAt);
    expect(edited.guidance).toBe(first.guidance);
    expect(findCurrentDeveloperDatabaseDossierReview(projection, record.entryId, [edited])).toBe(
      edited,
    );
    expect(JSON.stringify(projection)).not.toContain('Revised interpretation');
  });

  it('ignores an unrelated projection fingerprint change but versions a changed entry brief', () => {
    const record = projection.records[0]!;
    const unrelatedProjectionChange = DeveloperDatabaseKnowledgeProjectionSchema.parse({
      ...projection,
      inputFingerprint: 'b'.repeat(64),
    });
    const first = buildDeveloperDatabaseDossierReviewTicket({
      knowledge: projection,
      record,
      reviewerNotes: 'First dossier opinion.',
      timestamp: '2026-07-26T13:00:00.000Z',
    });
    expect(
      findCurrentDeveloperDatabaseDossierReview(unrelatedProjectionChange, record.entryId, [first]),
    ).toBe(first);

    const changed = DeveloperDatabaseKnowledgeProjectionSchema.parse({
      ...unrelatedProjectionChange,
      records: unrelatedProjectionChange.records.map((candidate) =>
        candidate.entryId === record.entryId
          ? {
              ...candidate,
              candidateSummaries: candidate.candidateSummaries.map((summary) => ({
                ...summary,
                summary: `${summary.summary} Materially revised.`,
              })),
            }
          : candidate,
      ),
    });
    const next = buildDeveloperDatabaseDossierReviewTicket({
      knowledge: changed,
      record: changed.records[0]!,
      reviewerNotes: 'Opinion after source compilation changed.',
      timestamp: '2026-07-26T15:00:00.000Z',
    });

    expect(next.id).not.toBe(first.id);
    expect(findCurrentDeveloperDatabaseDossierReview(changed, record.entryId, [first, next])).toBe(
      next,
    );
  });

  it('rejects local dossier reviews from a portable Reviewer export', () => {
    const ticket = buildDeveloperDatabaseDossierReviewTicket({
      knowledge: projection,
      record: projection.records[0]!,
      reviewerNotes: 'Local-only opinion.',
      timestamp: '2026-07-26T13:00:00.000Z',
    });

    expect(() =>
      ClinicalTicketExportBundleSchema.parse({
        schemaVersion: 1,
        exportVersion: 7,
        bundleId: 'review-bundle.synthetic-portable',
        buildKind: 'portable_reviewer',
        assignmentId: 'reviewer-assignment.synthetic',
        exportedAt: '2026-07-26T13:00:00.000Z',
        engineVersion: 'test',
        profileId: 'profile.synthetic',
        tickets: [ticket],
        attemptReviews: [],
        databaseEntryReviews: [],
        flags: [],
        completedAttempts: [],
      }),
    ).toThrow(/cannot contain local Developer dossier reviews/);
  });
});
