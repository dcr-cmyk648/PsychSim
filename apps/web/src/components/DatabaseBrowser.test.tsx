// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { publicClinicalCatalog } from '@psychsim/content-runtime';
import { DeveloperDatabaseKnowledgeProjectionSchema } from '@psychsim/schemas';

import { buildDatabaseEntryReview } from '../database-review';
import { DatabaseBrowser } from './DatabaseBrowser';

afterEach(cleanup);

const developerKnowledge = DeveloperDatabaseKnowledgeProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 2,
  generatedAt: '2026-07-26T12:00:00.000Z',
  catalogContentVersion: publicClinicalCatalog.catalogContentVersion,
  inputFingerprint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  summary: {
    personalSourceDocuments: 1,
    appleNotesRevisions: 1,
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
    targetEntries: 1,
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
  records: [
    {
      entryId: 'medication.bupropion',
      categoryId: 'medications',
      label: 'Bupropion',
      compilationState: 'identity_only',
      indexedTerms: ['private-alias'],
      personalSourceUnitCount: 0,
      personalSourceTotalMatches: 0,
      lexicalSignals: [],
      candidateSummaries: [],
      bibliographicCandidates: [],
      formalContributions: [],
      ruleSummaries: [],
      relatedEntryIds: [],
    },
  ],
  formalSourceRegistry: [],
  unmappedCandidateSummaries: [],
  unmappedBibliographicCandidates: [],
  catalogIdentityAudit: {
    identityGaps: [],
    overlappingTerms: [],
  },
  warnings: ['Synthetic fixture.'],
});

describe('DatabaseBrowser', () => {
  it('opens a modeled condition in a dedicated full reader and restores list focus', async () => {
    const onBack = vi.fn();
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={onBack} />);

    expect(screen.getByRole('heading', { name: 'Database', level: 1 })).toBeVisible();
    expect(screen.getByRole('button', { name: /Modeled conditions 9/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('9 records shown');
    expect(screen.getByText('Major depressive disorder')).toBeVisible();
    expect(screen.queryByText('Sertraline')).not.toBeInTheDocument();
    expect(screen.getByText(/not a comprehensive diagnostic manual/i)).toBeVisible();

    const mddLauncher = screen
      .getByText('Major depressive disorder')
      .closest<HTMLElement>('.database-record-launcher');
    expect(mddLauncher).not.toBeNull();
    const openButton = mddLauncher!.querySelector<HTMLButtonElement>('button')!;
    openButton.focus();
    fireEvent.click(openButton);
    expect(
      screen.getByRole('heading', { name: 'Major depressive disorder', level: 1 }),
    ).toHaveFocus();
    expect(screen.getByText('Severity branches')).toBeVisible();
    expect(
      screen.getByText('catalogs.conditions.diagnosis.major-depressive-disorder', {
        selector: 'code',
      }),
    ).toBeVisible();
    fireEvent.click(screen.getByText('Complete structured record'));
    expect(screen.getByText(/"kind": "condition"/, { selector: 'pre' })).toBeVisible();
    expect(document.body.textContent).not.toContain('pointDelta');
    expect(document.body.textContent).not.toContain('classification-term.icd10cm.');

    fireEvent.click(screen.getByRole('button', { name: 'Back to database' }));
    await waitFor(() => expect(document.getElementById(openButton.id)).toHaveFocus());
    screen.getByRole('button', { name: 'Back to clinic' }).click();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('searches only the selected public category and handles safe empty results', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);

    screen.getByRole('button', { name: /Medications 125/ }).click();
    const search = screen.getByRole('searchbox', { name: 'Search database' });
    fireEvent.change(search, { target: { value: '  SSRI  ' } });
    expect(screen.getByRole('status')).toHaveTextContent(/matches for “SSRI”/);
    expect(screen.getByText('Sertraline')).toBeVisible();
    expect(screen.queryByText('Lithium')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'medication.bupropion' } });
    expect(screen.getByRole('status')).toHaveTextContent('1 matches');
    expect(screen.getByText('Bupropion')).toBeVisible();

    screen.getByRole('button', { name: /All 237/ }).click();
    fireEvent.change(search, { target: { value: 'ticket.' } });
    expect(screen.getByRole('status')).toHaveTextContent('0 matches');
    expect(screen.getByText(/No catalog records match/)).toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear search' })[0]!);
    expect(search).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('237 records shown');
  });

  it('shows every review-safe bibliography field in the reader', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);

    screen.getByRole('button', { name: /Formal references 27/ }).click();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'corrigendum' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open full entry' }));
    expect(screen.getByText('Relationships')).toBeVisible();
    expect(screen.getByText('corrects → evidence.canmat.mdd-adults.2023-update')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open source page' }).getAttribute('href')).toMatch(
      /^https:\/\//,
    );
    expect(document.body).not.toHaveTextContent('source-document.');
    expect(document.body).not.toHaveTextContent('knownContentHashes');
  });

  it('saves, edits, removes, and exports an exact entry-snapshot comment', async () => {
    const entry = publicClinicalCatalog.entries.find(
      (candidate) => candidate.id === 'medication.bupropion',
    )!;
    const existingReview = buildDatabaseEntryReview({
      entry,
      projection: publicClinicalCatalog,
      reviewerNote: 'Existing database note.',
      timestamp: '2026-07-25T20:00:00.000Z',
    });
    const onSaveReview = vi.fn().mockResolvedValue(true);
    const onExportReviews = vi.fn();
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        reviews={[existingReview]}
        reviewToolsEnabled
        exportAvailable
        onSaveReview={onSaveReview}
        onExportReviews={onExportReviews}
        onBack={vi.fn()}
      />,
    );

    screen.getByRole('button', { name: /Medications 125/ }).click();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'bupropion' },
    });
    expect(screen.getByText('Comment saved')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open full entry' }));

    const textarea = screen.getByRole('textbox', {
      name: 'Your interpretation and instructions for Codex',
    });
    expect(textarea).toHaveValue('Existing database note.');
    fireEvent.change(textarea, { target: { value: 'Please add provenance detail.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update comment' }));
    await waitFor(() =>
      expect(onSaveReview).toHaveBeenCalledWith(entry, 'Please add provenance detail.'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export all saved feedback' }));
    expect(onExportReviews).toHaveBeenCalledOnce();
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove saved comment' }));
    await waitFor(() => expect(onSaveReview).toHaveBeenLastCalledWith(entry, ''));
  });

  it('saves a changed comment before moving to the next filtered entry', async () => {
    let finishSave!: (value: boolean) => void;
    const pendingSave = new Promise<boolean>((resolve) => {
      finishSave = resolve;
    });
    const onSaveReview = vi.fn().mockReturnValue(pendingSave);
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        reviewToolsEnabled
        onSaveReview={onSaveReview}
        onBack={vi.fn()}
      />,
    );

    screen.getByRole('button', { name: /Medications 125/ }).click();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('125 records shown'));
    const firstLauncher = screen.getAllByRole('button', { name: 'Open full entry' })[0]!;
    fireEvent.click(firstLauncher);
    expect(screen.getByText('Entry 1 of 125')).toBeVisible();
    const firstTitle = screen.getByRole('heading', { level: 1 }).textContent;

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Your interpretation and instructions for Codex' }),
      {
        target: { value: 'Review this medication entry.' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save comment and next entry' }));

    expect(onSaveReview).toHaveBeenCalledWith(
      expect.objectContaining({ label: firstTitle }),
      'Review this medication entry.',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(firstTitle ?? '');
    finishSave(true);
    expect(await screen.findByText('Entry 2 of 125')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(firstTitle ?? '');
  });

  it('saves dirty prose before using the prominent back-to-database control', async () => {
    const onSaveReview = vi.fn().mockResolvedValue(true);
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        reviewToolsEnabled
        onSaveReview={onSaveReview}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Open full entry' })[0]!);
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Your interpretation and instructions for Codex' }),
      {
        target: { value: 'Preserve this review before leaving.' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save comment and return to database' }));

    await waitFor(() =>
      expect(onSaveReview).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(String) }),
        'Preserve this review before leaving.',
      ),
    );
    expect(screen.getByRole('heading', { name: 'Database', level: 1 })).toBeVisible();
  });

  it('blocks local dossier input until the private projection is ready', () => {
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        developerDossierMode
        developerDossierReady={false}
        reviewToolsEnabled
        reviewStatusMessage="Loading the validated local dossier."
        onSaveReview={vi.fn().mockResolvedValue(true)}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Open full entry' })[0]!);
    expect(screen.getByText('Interpret this knowledge dossier')).toBeVisible();
    expect(
      screen.getByRole('textbox', {
        name: 'Your interpretation and instructions for Codex',
      }),
    ).toBeDisabled();
    expect(screen.getAllByText('Loading the validated local dossier.')[0]).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Save comment' })).not.toBeInTheDocument();
  });

  it('keeps comment controls out of the ordinary Player reader', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Open full entry' })[0]!);
    expect(
      screen.queryByRole('textbox', {
        name: 'Your interpretation and instructions for Codex',
      }),
    ).not.toBeInTheDocument();
  });

  it('uses an optional lazy Developer supplement for search and entry rendering', () => {
    const DeveloperKnowledgeScope = ({ knowledge }: { knowledge: typeof developerKnowledge }) => (
      <div>Developer corpus · {knowledge.summary.personalSourceDocuments} document</div>
    );
    const DeveloperKnowledgePanel = ({
      record,
    }: {
      record: (typeof developerKnowledge.records)[number];
    }) => <section>Developer overlay for {record.label}</section>;
    const DeveloperClassificationInspector = () => (
      <details>
        <summary>Local classification inspector</summary>
      </details>
    );
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        developerKnowledge={developerKnowledge}
        DeveloperKnowledgeScope={DeveloperKnowledgeScope}
        DeveloperKnowledgePanel={DeveloperKnowledgePanel}
        DeveloperClassificationInspector={DeveloperClassificationInspector}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText('Developer corpus · 1 document')).toBeVisible();
    expect(screen.getByText('Local classification inspector')).toBeVisible();
    expect(screen.getByRole('button', { name: /Modeled conditions 9/ })).toBeVisible();
    screen.getByRole('button', { name: /Medications 125/ }).click();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'private-alias' },
    });
    expect(screen.getByText('Bupropion')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open full entry' }));
    expect(screen.getByText('Developer overlay for Bupropion')).toBeVisible();
    expect(screen.getByText(/"kind": "medication"/, { selector: 'pre' })).not.toHaveTextContent(
      'private-alias',
    );
  });

  it('shows the current fingerprint-bound dossier opinion ahead of a public entry comment', () => {
    const entry = publicClinicalCatalog.entries.find(
      (candidate) => candidate.id === 'medication.bupropion',
    )!;
    const publicReview = buildDatabaseEntryReview({
      entry,
      projection: publicClinicalCatalog,
      reviewerNote: 'Older public entry comment.',
      timestamp: '2026-07-25T20:00:00.000Z',
    });
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        developerKnowledge={developerKnowledge}
        developerDossierMode
        developerDossierReady
        reviews={[publicReview]}
        developerDossierReviews={[
          {
            id: 'ticket.database-dossier.medication.bupropion.aaaaaaaaaaaaaaaa',
            entryId: 'medication.bupropion',
            reviewerNote: 'Current dossier interpretation.',
            updatedAt: '2026-07-26T12:00:00.000Z',
            kind: 'developer_dossier',
          },
        ]}
        reviewToolsEnabled
        onSaveReview={vi.fn().mockResolvedValue(true)}
        onBack={vi.fn()}
      />,
    );

    screen.getByRole('button', { name: /Medications 125/ }).click();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'bupropion' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open full entry' }));
    expect(
      screen.getByRole('textbox', {
        name: 'Your interpretation and instructions for Codex',
      }),
    ).toHaveValue('Current dossier interpretation.');
    expect(screen.getByText('Interpret this knowledge dossier')).toBeVisible();
    expect(screen.getByText(/versioned dossier-review ticket/)).toBeVisible();
  });

  it('does not navigate when the persistence callback reports a failed save', async () => {
    const onSaveReview = vi.fn().mockResolvedValue(false);
    render(
      <DatabaseBrowser
        projection={publicClinicalCatalog}
        reviewToolsEnabled
        onSaveReview={onSaveReview}
        onBack={vi.fn()}
      />,
    );
    screen.getByRole('button', { name: /Medications 125/ }).click();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('125 records shown'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Open full entry' })[0]!);
    expect(screen.getByText('Entry 1 of 125')).toBeVisible();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Your interpretation and instructions for Codex' }),
      {
        target: { value: 'Do not lose this.' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save comment and next entry' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not saved/i);
    expect(screen.getByText('Entry 1 of 125')).toBeVisible();
  });
});
