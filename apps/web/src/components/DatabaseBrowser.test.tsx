// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { publicClinicalCatalog } from '@psychsim/content-runtime';

import { DatabaseBrowser } from './DatabaseBrowser';

afterEach(cleanup);

describe('DatabaseBrowser', () => {
  it('defaults to the complete modeled-condition list and exposes compact record details', () => {
    const onBack = vi.fn();
    const { container } = render(
      <DatabaseBrowser projection={publicClinicalCatalog} onBack={onBack} />,
    );

    expect(screen.getByRole('heading', { name: 'Database', level: 1 })).toBeVisible();
    expect(screen.getByRole('button', { name: /Modeled conditions 8/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('8 records shown');
    expect(screen.getByText('Major depressive disorder')).toBeVisible();
    expect(screen.queryByText('Sertraline')).not.toBeInTheDocument();
    expect(
      screen.getByText(/not a comprehensive diagnostic manual or the local authoring/i),
    ).toBeVisible();

    const mddRecord = screen
      .getByText('Major depressive disorder')
      .closest<HTMLDetailsElement>('details');
    expect(mddRecord).not.toBeNull();
    expect(mddRecord).not.toHaveAttribute('open');
    fireEvent.click(within(mddRecord!).getByText('Major depressive disorder'));
    expect(mddRecord).toHaveAttribute('open');
    expect(within(mddRecord!).getByText('Severity branches')).toBeVisible();
    expect(within(mddRecord!).getByText(/catalogs\.conditions\.diagnosis/)).toBeVisible();

    expect(container.textContent).not.toContain('pointDelta');
    expect(container.textContent).not.toContain('classification-term.icd10cm.');
    screen.getByRole('button', { name: 'Back to clinic' }).click();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('searches only the selected public category and handles safe empty results', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);

    screen.getByRole('button', { name: /Medications 13/ }).click();
    const search = screen.getByRole('searchbox', { name: 'Search database' });
    fireEvent.change(search, { target: { value: '  SSRI  ' } });
    expect(screen.getByRole('status')).toHaveTextContent(/matches for “SSRI”/);
    expect(screen.getByText('Sertraline')).toBeVisible();
    expect(screen.queryByText('Lithium')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'medication.bupropion' } });
    expect(screen.getByRole('status')).toHaveTextContent('1 matches');
    expect(screen.getByText('Bupropion')).toBeVisible();

    screen.getByRole('button', { name: /All 102/ }).click();
    fireEvent.change(search, { target: { value: 'ticket.' } });
    expect(screen.getByRole('status')).toHaveTextContent('0 matches');
    expect(screen.getByText(/No catalog records match/)).toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear search' })[0]!);
    expect(search).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('102 records shown');
  });

  it('makes formal bibliography searchable without exposing source-document provenance', () => {
    render(<DatabaseBrowser projection={publicClinicalCatalog} onBack={vi.fn()} />);

    screen.getByRole('button', { name: /Formal references 11/ }).click();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'CANMAT' },
    });
    const guideline = screen
      .getByText('evidence.canmat.mdd-adults.2023-update')
      .closest<HTMLDetailsElement>('details');
    expect(guideline).not.toBeNull();
    fireEvent.click(guideline!.querySelector('summary')!);
    expect(
      within(guideline!).getByRole('link', { name: 'Open source page' }).getAttribute('href'),
    ).toMatch(/^https:\/\//);
    expect(guideline).not.toHaveTextContent('source-document.');
    expect(guideline).not.toHaveTextContent('knownContentHashes');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search database' }), {
      target: { value: 'corrigendum' },
    });
    const correction = screen
      .getByText('evidence.canmat.mdd-adults.2023-update-corrigendum.2025')
      .closest<HTMLDetailsElement>('details');
    expect(correction).not.toBeNull();
    fireEvent.click(correction!.querySelector('summary')!);
    expect(correction).toHaveTextContent('corrects → evidence.canmat.mdd-adults.2023-update');
  });
});
