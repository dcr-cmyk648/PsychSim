// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PersonalKnowledgeWorkbenchProjectionSchema } from '@psychsim/schemas';

import {
  loadPersonalKnowledgeWorkbench,
  PersonalKnowledgeWorkbench,
} from './PersonalKnowledgeWorkbench';

const projection = PersonalKnowledgeWorkbenchProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 1,
  generatedAt: '2026-07-25T12:00:00.000Z',
  pilotTopicId: 'authoring-pilot.synthetic',
  summary: {
    intakeEligibleSources: 10,
    queuedSources: 4,
    releasedSources: 1,
    partiallyClassifiedSources: 0,
    classifiedSources: 1,
    sourceUnits: 1,
    opinionCandidates: 1,
    mappedCandidates: 1,
    unmappedCandidates: 0,
    needsCurrentnessReview: 1,
    bibliographicCandidates: 1,
    verifiedBibliography: 0,
    acceptedOpinions: 0,
    evidenceLinkedOpinions: 0,
    ocrAttachmentsOutsideSemanticScope: 3,
  },
  dossiers: [
    {
      targetId: 'diagnosis.major-depressive-disorder',
      targetKind: 'diagnosis',
      label: 'Major depressive disorder',
      queuedSourceCount: 4,
      sourceUnitCount: 1,
      formalEvidenceSourceIds: [],
      currentRuleIds: [],
      balanceEntries: [],
      bibliographicCandidates: [],
      candidates: [],
    },
    {
      targetId: 'medication.bupropion',
      targetKind: 'medication',
      label: 'Bupropion',
      queuedSourceCount: 2,
      sourceUnitCount: 1,
      formalEvidenceSourceIds: ['evidence.synthetic'],
      currentRuleIds: ['modifier.bupropion.synthetic'],
      balanceEntries: [
        {
          id: 'modifier.bupropion.synthetic',
          summary: 'Synthetic separate balance entry.',
          pointDelta: 35,
          reviewStatus: 'unreviewed',
        },
      ],
      bibliographicCandidates: [
        {
          id: 'bibliographic-candidate.synthetic',
          displayCitation: 'Synthetic article lead',
          verificationStatus: 'unverified',
          matchedEvidenceSourceId: null,
        },
      ],
      candidates: [
        {
          id: 'developer-opinion-candidate.synthetic',
          summary: 'Synthetic opinion candidate.',
          sourceUnitId: 'authored-source-unit-candidate.synthetic',
          sourceDate: '2025',
          currentness: 'needs_currentness_review',
          reviewStatus: 'proposed',
          unresolvedTargets: [
            {
              targetKindHint: 'clinical_tag',
              searchLabel: 'sleep symptoms',
              role: 'context',
              reason: 'Synthetic unresolved mapping.',
            },
          ],
          evidenceRelations: [
            {
              evidenceSourceId: 'evidence.synthetic',
              relationship: 'partially_supports',
              stillExpertBridge: true,
              reviewStatus: 'unreviewed',
            },
          ],
        },
      ],
    },
  ],
  sourceUnitCandidates: [
    {
      id: 'authored-source-unit-candidate.synthetic',
      unitKind: 'personal_takeaway',
      boundaryState: 'complete',
      currentness: 'needs_currentness_review',
      reviewStatus: 'proposed',
      resolvedTargetIds: ['medication.bupropion'],
      unresolvedTargetLabels: [],
    },
  ],
  unmappedCandidates: [],
  unmappedBibliographicCandidates: [],
  warnings: ['Synthetic warning.'],
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const toggle = (details: HTMLDetailsElement, open: boolean): void => {
  details.open = open;
  fireEvent(details, new Event('toggle'));
};

describe('PersonalKnowledgeWorkbench', () => {
  it('is collapsed by default and keeps candidate reasoning separate from balance', () => {
    render(<PersonalKnowledgeWorkbench projection={projection} />);
    expect(screen.getByText('Personal knowledge workbench')).toBeInTheDocument();
    expect(screen.queryByText(/Candidate material only/)).not.toBeInTheDocument();

    toggle(screen.getByText('Personal knowledge workbench').closest('details')!, true);
    expect(screen.getByText(/Candidate material only/)).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole('searchbox', {
        name: /Search medications, conditions, candidate summaries, or stable IDs/i,
      }),
      { target: { value: 'bupropion' } },
    );
    expect(screen.getByText('Bupropion')).toBeInTheDocument();
    expect(screen.queryByText('Major depressive disorder')).not.toBeInTheDocument();
    toggle(screen.getByText('Bupropion').closest('details')!, true);
    expect(screen.getByText('Synthetic opinion candidate.')).toBeInTheDocument();
    expect(screen.getByText(/partially supports/)).toBeInTheDocument();
    expect(screen.getByText(/35 points/)).toBeInTheDocument();
    expect(screen.getByText(/Separate game-balance entries/)).toBeInTheDocument();
    expect(screen.getByText(/Bibliography leads · 1/)).toBeInTheDocument();
    expect(screen.getByText(/Unresolved targets · 1/)).toBeInTheDocument();
    expect(screen.getByText(/Developer-opinion bridge retained/)).toBeInTheDocument();
  });

  it('shows an unavailable state without inventing content', () => {
    render(<PersonalKnowledgeWorkbench projection={null} />);
    toggle(screen.getByText('Personal knowledge workbench').closest('details')!, true);
    expect(screen.getByText(/No bounded personal-knowledge projection/)).toBeInTheDocument();
  });

  it('loads only a valid strict projection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => projection,
      }),
    );
    await expect(loadPersonalKnowledgeWorkbench()).resolves.toEqual(projection);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...projection, rawText: 'not allowed' }),
      }),
    );
    await expect(loadPersonalKnowledgeWorkbench()).resolves.toBeNull();
  });
});
