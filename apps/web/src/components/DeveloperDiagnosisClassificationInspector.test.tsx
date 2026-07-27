// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeveloperDiagnosisClassificationProjectionSchema } from '@psychsim/schemas';

import { DeveloperDiagnosisClassificationInspector } from './DeveloperDiagnosisClassificationInspector';

afterEach(cleanup);

const projection = DeveloperDiagnosisClassificationProjectionSchema.parse({
  schemaVersion: 1,
  projectionVersion: 1,
  release: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'classification.icd10cm.synthetic',
    system: 'ICD-10-CM',
    versionLabel: 'Synthetic release',
    publishedDate: '2026-01-01',
    effectiveFrom: '2026-01-01',
    effectiveThrough: '2026-12-31',
    scopeLabel: 'Synthetic mental-disorder terms',
    includedCodePrefixes: ['F'],
    evidenceSourceId: 'evidence.synthetic.icd',
    sourceArtifact: {
      url: 'https://example.org/icd.zip',
      sha256: 'a'.repeat(64),
      memberPath: 'terms.txt',
      memberSha256: 'b'.repeat(64),
    },
    verificationArtifacts: [],
    importerVersion: 'synthetic-importer-1',
    termCount: 2,
    normalizedTermsSha256: 'c'.repeat(64),
    medicalReviewStatus: 'unreviewed',
  },
  catalog: {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    releaseId: 'classification.icd10cm.synthetic',
    terms: [
      {
        schemaVersion: 1,
        id: 'classification-term.synthetic.f32',
        releaseId: 'classification.icd10cm.synthetic',
        code: 'F32',
        parentCode: null,
        shortDescription: 'Depressive episode',
        longDescription: 'Depressive episode',
        billable: false,
        sourceOrder: 1,
      },
      {
        schemaVersion: 1,
        id: 'classification-term.synthetic.f32a',
        releaseId: 'classification.icd10cm.synthetic',
        code: 'F32.A',
        parentCode: 'F32',
        shortDescription: 'Depression, unspecified',
        longDescription: 'Depression, unspecified depression type',
        billable: true,
        sourceOrder: 2,
      },
    ],
  },
  sourceUse: {
    id: 'source-use.synthetic.icd',
    evidenceSourceId: 'evidence.synthetic.icd',
    decisionStatus: 'permitted_with_conditions',
    legalBasis: 'fair_use',
    permissions: {
      bibliographicMetadata: true,
      localFullTextStorage: true,
      localTextExtraction: true,
      localStructuredIndexing: true,
      aiAssistedProcessing: false,
      derivedClinicalContent: false,
      runtimeRedistribution: false,
      commercialDistribution: false,
    },
    territories: ['United States'],
    attributionStatement: 'Synthetic NCHS attribution.',
    requiredNotices: ['Synthetic local-only notice.'],
    nonCommercialOnly: true,
    reviewedAt: '2026-07-26T12:00:00.000Z',
  },
  warnings: [
    'Local authoring classification identities only—not diagnostic criteria.',
    'Local only.',
  ],
});

const toggle = (details: HTMLDetailsElement, open: boolean): void => {
  details.open = open;
  fireEvent(details, new Event('toggle'));
};

describe('Developer diagnosis classification inspector', () => {
  it('loads only after expansion and provides a searchable full reader', async () => {
    const loader = vi.fn(async () => projection);
    const { container } = render(
      <DeveloperDiagnosisClassificationInspector loadProjection={loader} />,
    );

    expect(loader).not.toHaveBeenCalled();
    const details = container.querySelector('details');
    expect(details).toBeInstanceOf(HTMLDetailsElement);
    toggle(details as HTMLDetailsElement, true);
    await waitFor(() => expect(loader).toHaveBeenCalledOnce());

    expect(await screen.findByText(/2 local terms/)).toBeVisible();
    expect(
      screen.getByText(/does not increase the public set of diagnosis families/),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('Search code or description'), {
      target: { value: 'unspecified depression' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('1 classification term match');
    fireEvent.click(screen.getByRole('button', { name: /F32\.A/ }));
    expect(screen.getByText('Billable code · source order 2')).toBeVisible();
    expect(screen.getByText('Depression, unspecified depression type')).toBeVisible();
    expect(screen.getByText('classification-term.synthetic.f32a')).toBeVisible();
    expect(screen.queryByRole('textbox', { name: /comment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
  });

  it('surfaces a missing local cache without exposing a false empty index', async () => {
    const { container } = render(
      <DeveloperDiagnosisClassificationInspector loadProjection={async () => null} />,
    );
    toggle(container.querySelector('details') as HTMLDetailsElement, true);
    expect(await screen.findByText(/local classification cache is unavailable/i)).toBeVisible();
  });
});
