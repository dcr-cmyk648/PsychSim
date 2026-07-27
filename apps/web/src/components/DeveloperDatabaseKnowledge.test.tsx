// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeveloperDatabaseKnowledgeProjectionSchema } from '@psychsim/schemas';

import {
  DeveloperDatabaseKnowledgePanel,
  DeveloperDatabaseKnowledgeScope,
} from './DeveloperDatabaseKnowledge';

afterEach(cleanup);

const projection = DeveloperDatabaseKnowledgeProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 2,
  generatedAt: '2026-07-26T12:00:00.000Z',
  catalogContentVersion: '1.0.0',
  inputFingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  summary: {
    personalSourceDocuments: 3,
    appleNotesRevisions: 2,
    appleNotesAttachmentRecords: 1,
    appleNotesOcrCompleted: 1,
    privateDriveDocuments: 1,
    userAuthoredArchiveUnits: 1,
    sourceUnits: 2,
    fullyIndexedUnits: 2,
    partiallyIndexedUnits: 0,
    quarantinedUnits: 0,
    unitsWithTargetMatches: 1,
    unitsWithoutTargetMatches: 1,
    targetEntries: 1,
    matchedTargetEntries: 1,
    totalLexicalMatches: 2,
    semanticallyClassifiedUnits: 1,
    candidateSummaries: 1,
    acceptedOpinions: 0,
    formalContributions: 1,
    formalSources: 1,
    registeredFormalSources: 1,
  },
  corpusUnits: [
    {
      id: 'knowledge-unit.aaaaaaaaaaaaaaaaaaaaaaaa',
      sourceKind: 'apple_notes',
      sourceRole: 'personal_research_note',
      displayLabel: 'Apple Notes research item 001',
      sourceModifiedAt: '2026-07-20T12:00:00.000Z',
      surfaces: ['note_plaintext', 'attachment_ocr'],
      boundaryState: 'complete',
      accessState: 'fully_indexed',
      semanticState: 'candidate_created',
      semanticDisposition: 'candidate_material',
      semanticSummary: 'Synthetic candidate material is ready for review.',
      targetEntryIds: ['medication.bupropion'],
      totalMatches: 2,
    },
    {
      id: 'knowledge-unit.bbbbbbbbbbbbbbbbbbbbbbbb',
      sourceKind: 'user_authored_archive',
      sourceRole: 'user_authored_article',
      displayLabel: 'User-authored archive unit 01',
      sourceModifiedAt: null,
      surfaces: ['structured_document'],
      boundaryState: 'complete',
      accessState: 'fully_indexed',
      semanticState: 'not_semantically_reviewed',
      semanticDisposition: null,
      semanticSummary: null,
      targetEntryIds: [],
      totalMatches: 0,
    },
  ],
  records: [
    {
      entryId: 'medication.bupropion',
      categoryId: 'medications',
      label: 'Bupropion',
      compilationState: 'candidate_material',
      indexedTerms: ['Bupropion', 'Wellbutrin'],
      personalSourceUnitCount: 1,
      personalSourceTotalMatches: 2,
      lexicalSignals: [
        {
          unitId: 'knowledge-unit.aaaaaaaaaaaaaaaaaaaaaaaa',
          sourceKind: 'apple_notes',
          sourceRole: 'personal_research_note',
          sourceModifiedAt: '2026-07-20T12:00:00.000Z',
          surfaces: ['note_plaintext', 'attachment_ocr'],
          semanticState: 'candidate_created',
          totalMatches: 2,
          matchedTerms: [
            {
              term: 'Bupropion',
              count: 2,
              surfaces: ['note_plaintext', 'attachment_ocr'],
            },
          ],
        },
      ],
      candidateSummaries: [
        {
          id: 'opinion-candidate.bupropion.synthetic',
          summary: 'Synthetic Developer-opinion candidate for UI testing.',
          sourceUnitId: 'authored-source-unit.synthetic',
          sourceDate: null,
          currentness: 'needs_currentness_review',
          reviewStatus: 'proposed',
          contributionTypes: ['patient_fact', 'medication_fit'],
          resolvedTargets: [
            {
              targetKind: 'medication',
              targetContentId: 'medication.bupropion',
              role: 'subject',
            },
          ],
          unresolvedTargets: [
            {
              targetKindHint: 'clinical_rule',
              searchLabel: 'Seizure-risk fit rule',
              role: 'affected_rule',
              reason: 'The corpus candidate requires a separate rule identity.',
            },
          ],
          evidenceRelations: [],
        },
      ],
      bibliographicCandidates: [],
      formalContributions: [
        {
          id: 'evidence-contribution.synthetic',
          authority: 'formal_publication',
          summary: 'Synthetic formal-source contribution.',
          contributionTypes: ['treatment'],
          evidenceSources: [
            {
              id: 'evidence.synthetic',
              title: 'Synthetic source',
              citation: 'Synthetic citation.',
              url: 'https://example.org/source',
              sourceUseDecisionId: 'source-use.synthetic',
              sourceUseStatus: 'permitted_with_conditions',
              derivedClinicalContentPermitted: true,
              runtimeRedistributionPermitted: true,
              attributionStatement: 'Synthetic attribution.',
              requiredNotices: ['Synthetic notice.'],
              sourceUseReviewedAt: '2026-07-25T12:00:00.000Z',
              medicalReviewStatus: 'unreviewed',
            },
          ],
          generatedBy: 'human',
          medicalReviewStatus: 'unreviewed',
        },
      ],
      ruleSummaries: [
        {
          id: 'fit.synthetic',
          ruleKind: 'active_medication_fit',
          summary: 'Synthetic fit rule.',
          pointDelta: 6,
          stance: null,
          medicalReviewStatus: 'unreviewed',
          sourceUseNoteIds: [],
        },
      ],
      relatedEntryIds: [],
    },
  ],
  formalSourceRegistry: [
    {
      id: 'evidence.synthetic',
      title: 'Synthetic source',
      citation: 'Synthetic citation.',
      url: 'https://example.org/source',
      sourceUseDecisionId: 'source-use.synthetic',
      sourceUseStatus: 'permitted_with_conditions',
      derivedClinicalContentPermitted: true,
      runtimeRedistributionPermitted: true,
      attributionStatement: 'Synthetic attribution.',
      requiredNotices: ['Synthetic notice.'],
      sourceUseReviewedAt: '2026-07-25T12:00:00.000Z',
      medicalReviewStatus: 'unreviewed',
    },
  ],
  unmappedCandidateSummaries: [],
  unmappedBibliographicCandidates: [],
  catalogIdentityAudit: {
    identityGaps: [
      {
        id: 'catalog-identity-gap.synthetic-rule',
        normalizedSearchLabel: 'seizure-risk fit rule',
        displayLabel: 'Seizure-risk fit rule',
        targetKindHint: 'clinical_rule',
        status: 'non_catalog_target',
        candidateEntryIds: [],
        occurrences: [
          {
            candidateId: 'opinion-candidate.bupropion.synthetic',
            targetKindHint: 'clinical_rule',
            searchLabel: 'Seizure-risk fit rule',
            role: 'affected_rule',
            reason: 'The corpus candidate requires a separate rule identity.',
          },
        ],
        reviewRequired: true,
      },
    ],
    overlappingTerms: [],
  },
  warnings: ['Synthetic fixture.'],
});

describe('Developer database knowledge view', () => {
  it('summarizes the complete enrolled corpus without claiming semantic incorporation', () => {
    render(<DeveloperDatabaseKnowledgeScope knowledge={projection} />);
    fireEvent.click(screen.getByText(/Local personal-corpus compilation/));
    expect(screen.getByText('Full personal-corpus cross-reference')).toBeVisible();
    expect(screen.getByText(/3 private documents/)).toBeVisible();
    expect(screen.getByText(/Indexing is not clinical incorporation/)).toBeVisible();
    fireEvent.click(screen.getByText(/Private-corpus classification decisions · 1/));
    expect(screen.getByText(/Synthetic candidate material is ready for review/)).toBeVisible();
    fireEvent.click(screen.getByText(/Catalog landing audit · 1 identity gap/));
    expect(screen.getByText('Seizure-risk fit rule')).toBeVisible();
    expect(screen.getByText(/non catalog target/)).toBeVisible();
    fireEvent.click(screen.getByText(/Formal source registry · 1 cataloged source/));
    expect(screen.getByText(/runtime redistribution permitted/)).toBeVisible();
    expect(screen.getByText(/Decision: source-use.synthetic/)).toBeVisible();
    fireEvent.click(screen.getByText(/Compilation boundaries and warnings · 1/));
    expect(screen.getByText('Synthetic fixture.')).toBeVisible();
  });

  it('separates retrieval, opinion, formal evidence, and rule lanes', () => {
    const onOpenRelated = vi.fn();
    render(
      <DeveloperDatabaseKnowledgePanel
        knowledge={projection}
        record={projection.records[0]!}
        onOpenRelated={onOpenRelated}
      />,
    );
    expect(screen.getByText('Cross-referenced knowledge')).toBeVisible();
    expect(screen.getByText('Knowledge dossier brief')).toBeVisible();
    expect(screen.getByText(/retrieval links, not clinical claims/i)).toBeVisible();
    expect(screen.getByText(/Potential patient\/randomization inputs · 1/)).toBeVisible();
    expect(screen.getByText(/Developer-opinion candidates · 1/)).toBeVisible();
    fireEvent.click(screen.getByText(/Developer-opinion candidates · 1/));
    expect(
      screen.getAllByText('Synthetic Developer-opinion candidate for UI testing.'),
    ).toHaveLength(2);
    fireEvent.click(screen.getByText(/Unresolved database identities · 1/));
    expect(screen.getByText('Seizure-risk fit rule')).toBeVisible();
    fireEvent.click(screen.getByText(/Formal-source contributions · 1/));
    expect(screen.getByText('Synthetic formal-source contribution.')).toBeVisible();
    fireEvent.click(screen.getByText(/Executable and proposed rule lane · 1/));
    expect(screen.getByText('Synthetic fit rule.')).toBeVisible();
    expect(
      screen.getByText(
        (content, element) => element?.tagName === 'SMALL' && content.includes('+6 points'),
      ),
    ).toBeVisible();

    const retrievalLane = screen
      .getByText(/Personal corpus index · 1 linked unit/)
      .closest('details');
    expect(retrievalLane).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText(/Personal corpus index · 1 linked unit/));
    expect(screen.getByText('Apple Notes research item 001')).toBeVisible();
    expect(document.body.textContent).not.toContain('source-document.');
  });
});
