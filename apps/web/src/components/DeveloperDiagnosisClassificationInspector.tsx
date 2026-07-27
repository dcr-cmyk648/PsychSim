import { useMemo, useState, type SyntheticEvent } from 'react';

import {
  DeveloperDiagnosisClassificationProjectionSchema,
  type DeveloperDiagnosisClassificationProjection,
  type DiagnosisClassificationTerm,
} from '@psychsim/schemas';

const ENDPOINT = '/__psychsim/developer-diagnosis-classification';
const PAGE_SIZE = 50;

export const loadDeveloperDiagnosisClassification =
  async (): Promise<DeveloperDiagnosisClassificationProjection | null> => {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
      throw new Error(
        typeof body?.error === 'string'
          ? body.error
          : 'The local diagnosis classification could not be loaded.',
      );
    }
    return DeveloperDiagnosisClassificationProjectionSchema.parse(await response.json());
  };

const termMatches = (term: DiagnosisClassificationTerm, normalizedQuery: string): boolean =>
  [term.code, term.shortDescription, term.longDescription].some((value) =>
    value.toLocaleLowerCase('en-US').includes(normalizedQuery),
  );

export function DeveloperDiagnosisClassificationInspector({
  loadProjection = loadDeveloperDiagnosisClassification,
}: {
  loadProjection?: () => Promise<DeveloperDiagnosisClassificationProjection | null>;
}) {
  const [projection, setProjection] = useState<DeveloperDiagnosisClassificationProjection | null>(
    null,
  );
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>(
    'idle',
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedTerm, setSelectedTerm] = useState<DiagnosisClassificationTerm | null>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  const filteredTerms = useMemo(
    () =>
      projection?.catalog.terms.filter(
        (term) => normalizedQuery.length === 0 || termMatches(term, normalizedQuery),
      ) ?? [],
    [normalizedQuery, projection],
  );
  const visibleTerms = filteredTerms.slice(0, visibleCount);

  const loadWhenOpened = (event: SyntheticEvent<HTMLDetailsElement>): void => {
    if (!event.currentTarget.open || loadState !== 'idle') return;
    setLoadState('loading');
    void loadProjection()
      .then((loaded) => {
        if (!loaded) {
          setLoadState('missing');
          return;
        }
        setProjection(loaded);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'The local diagnosis classification is quarantined.',
        );
        setLoadState('error');
      });
  };

  return (
    <details
      className="database-scope-note developer-classification-inspector"
      onToggle={loadWhenOpened}
    >
      <summary>
        <span>ICD-10-CM authoring classification index</span>
        <span className="count-badge">Local only · lazy loaded</span>
      </summary>
      <div className="developer-classification-body">
        {loadState === 'loading' ? (
          <p role="status">Loading the local classification index…</p>
        ) : null}
        {loadState === 'missing' ? (
          <p role="status">
            The local classification cache is unavailable. Run{' '}
            <code>pnpm content:diagnoses:import</code> on this Mac.
          </p>
        ) : null}
        {loadState === 'error' ? (
          <p role="alert">{loadError ?? 'The local diagnosis classification is quarantined.'}</p>
        ) : null}
        {projection ? (
          <>
            <p className="eyebrow">Standardized identity index</p>
            <h2>
              {projection.release.system} · {projection.release.versionLabel}
            </h2>
            <p className="database-knowledge-boundary">{projection.warnings[0]}</p>
            <p>
              {projection.catalog.terms.length.toLocaleString('en-US')} local terms from{' '}
              {projection.release.scopeLabel}. This separate authoring index does not increase the
              public set of diagnosis families modeled for gameplay.
            </p>

            <details className="database-knowledge-lane">
              <summary>Rights, provenance, and local-use boundary</summary>
              <p>{projection.sourceUse.attributionStatement}</p>
              <p>
                Decision: {projection.sourceUse.id} · reviewed{' '}
                {new Date(projection.sourceUse.reviewedAt).toLocaleDateString()}
              </p>
              <ul>
                {projection.warnings.slice(1).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
                {projection.sourceUse.requiredNotices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </details>

            {selectedTerm ? (
              <article
                className="developer-classification-reader"
                aria-labelledby="classification-term-title"
              >
                <button type="button" className="text-button" onClick={() => setSelectedTerm(null)}>
                  ← Back to classification results
                </button>
                <p className="eyebrow">
                  {selectedTerm.billable ? 'Billable code' : 'Category code'} · source order{' '}
                  {selectedTerm.sourceOrder}
                </p>
                <h3 id="classification-term-title">
                  {selectedTerm.code} · {selectedTerm.shortDescription}
                </h3>
                <dl className="database-entry-facts">
                  <div>
                    <dt>Long description</dt>
                    <dd>{selectedTerm.longDescription}</dd>
                  </div>
                  <div>
                    <dt>Parent code</dt>
                    <dd>{selectedTerm.parentCode ?? 'None in the imported F01–F99 set'}</dd>
                  </div>
                  <div>
                    <dt>Release</dt>
                    <dd>
                      {projection.release.versionLabel} · effective{' '}
                      {projection.release.effectiveFrom} through{' '}
                      {projection.release.effectiveThrough}
                    </dd>
                  </div>
                  <div>
                    <dt>Stable local identity</dt>
                    <dd>{selectedTerm.id}</dd>
                  </div>
                </dl>
              </article>
            ) : (
              <>
                <label className="database-search-label" htmlFor="developer-classification-search">
                  Search code or description
                </label>
                <input
                  id="developer-classification-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Try F32, anxiety, substance…"
                />
                <p role="status">
                  {filteredTerms.length.toLocaleString('en-US')} classification term
                  {filteredTerms.length === 1 ? '' : 's'} match
                </p>
                <ol className="developer-classification-results">
                  {visibleTerms.map((term) => (
                    <li key={term.id}>
                      <button type="button" onClick={() => setSelectedTerm(term)}>
                        <strong>{term.code}</strong>
                        <span>{term.longDescription}</span>
                        <small>{term.billable ? 'Billable code' : 'Category code'}</small>
                      </button>
                    </li>
                  ))}
                </ol>
                {visibleCount < filteredTerms.length ? (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    Load {Math.min(PAGE_SIZE, filteredTerms.length - visibleCount)} more
                  </button>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>
    </details>
  );
}
