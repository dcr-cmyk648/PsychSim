// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { publicClinicalCatalog } from '@psychsim/content-runtime';

import { buildDatabaseEntryReview } from '../database-review';
import { DatabaseBrowser } from './DatabaseBrowser';

afterEach(cleanup);

describe('DatabaseBrowser', () => {
  it('opens a modeled condition in a dedicated full reader and restores list focus', async () => {
    const onBack = vi.fn();
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={onBack} />);

    expect(screen.getByRole('heading', { name: 'Database', level: 1 })).toBeVisible();
    expect(screen.getByRole('button', { name: /Modeled conditions 8/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('8 records shown');
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

    screen.getByRole('button', { name: /Medications 33/ }).click();
    const search = screen.getByRole('searchbox', { name: 'Search database' });
    fireEvent.change(search, { target: { value: '  SSRI  ' } });
    expect(screen.getByRole('status')).toHaveTextContent(/matches for “SSRI”/);
    expect(screen.getByText('Sertraline')).toBeVisible();
    expect(screen.queryByText('Lithium')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'medication.bupropion' } });
    expect(screen.getByRole('status')).toHaveTextContent('1 matches');
    expect(screen.getByText('Bupropion')).toBeVisible();

    screen.getByRole('button', { name: /All 123/ }).click();
    fireEvent.change(search, { target: { value: 'ticket.' } });
    expect(screen.getByRole('status')).toHaveTextContent('0 matches');
    expect(screen.getByText(/No catalog records match/)).toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear search' })[0]!);
    expect(search).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('123 records shown');
  });

  it('shows every review-safe bibliography field in the reader', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);

    screen.getByRole('button', { name: /Formal references 12/ }).click();
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

    screen.getByRole('button', { name: /Medications 33/ }).click();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'bupropion' },
    });
    expect(screen.getByText('Comment saved')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open full entry' }));

    const textarea = screen.getByRole('textbox', { name: 'Comment for Codex' });
    expect(textarea).toHaveValue('Existing database note.');
    fireEvent.change(textarea, { target: { value: 'Please add provenance detail.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update comment' }));
    await waitFor(() =>
      expect(onSaveReview).toHaveBeenCalledWith(entry, 'Please add provenance detail.'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export all saved feedback' }));
    expect(onExportReviews).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Remove saved comment' }));
    await waitFor(() => expect(onSaveReview).toHaveBeenLastCalledWith(entry, ''));
  });

  it('keeps comment controls out of the ordinary Player reader', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Open full entry' })[0]!);
    expect(screen.queryByRole('textbox', { name: 'Comment for Codex' })).not.toBeInTheDocument();
  });
});
