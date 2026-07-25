import { useMemo, useState } from 'react';

import type {
  PublicClinicalCatalogCategoryId,
  PublicClinicalCatalogEntry,
  PublicClinicalCatalogProjection,
} from '@psychsim/schemas';

type CategoryFilter = 'all' | PublicClinicalCatalogCategoryId;

interface DatabaseBrowserProps {
  projection: PublicClinicalCatalogProjection;
  onBack: () => void;
}

const humanize = (value: string): string => value.replaceAll('_', ' ').replaceAll('-', ' ');

const medicalReviewLabel = (entry: PublicClinicalCatalogEntry): string =>
  entry.medicalReviewStatus
    ? `Medical review: ${humanize(entry.medicalReviewStatus)}`
    : 'Identity record · clinical review is rule-specific';

const searchableEntryText = (entry: PublicClinicalCatalogEntry): string =>
  JSON.stringify(entry).toLocaleLowerCase('en-US');

const EntryDetails = ({ entry }: { entry: PublicClinicalCatalogEntry }) => {
  switch (entry.kind) {
    case 'condition':
      return (
        <>
          <p>{entry.description}</p>
          <dl className="database-record-fields">
            <div>
              <dt>Severity branches</dt>
              <dd>
                {entry.severityLevels.length === 0
                  ? 'None modeled'
                  : entry.severityLevels.map((level) => level.label).join(' · ')}
              </dd>
            </div>
            <div>
              <dt>Specifiers</dt>
              <dd>
                {entry.specifierLabels.length > 0
                  ? entry.specifierLabels.join(' · ')
                  : 'None modeled'}
              </dd>
            </div>
          </dl>
        </>
      );
    case 'medication':
      return (
        <dl className="database-record-fields">
          <div>
            <dt>Classes</dt>
            <dd>{entry.classes.join(' · ')}</dd>
          </div>
        </dl>
      );
    case 'intervention':
    case 'disposition':
      return (
        <dl className="database-record-fields">
          <div>
            <dt>Type</dt>
            <dd>{humanize(entry.treatmentCategory)}</dd>
          </div>
          <div>
            <dt>Capability gates</dt>
            <dd>{entry.requiredCapabilityCount}</dd>
          </div>
        </dl>
      );
    case 'investigation':
      return (
        <>
          <p>{entry.description}</p>
          <dl className="database-record-fields">
            <div>
              <dt>Menu section</dt>
              <dd>{humanize(entry.investigationCategory)}</dd>
            </div>
            <div>
              <dt>SOAP source</dt>
              <dd>
                {humanize(entry.soapSection)} · {humanize(entry.resultSource)}
              </dd>
            </div>
            <div>
              <dt>Repeatable</dt>
              <dd>{entry.repeatable ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </>
      );
    case 'test':
      return (
        <dl className="database-record-fields">
          <div>
            <dt>Type</dt>
            <dd>
              {humanize(entry.testCategory)} · {humanize(entry.generatorKind)}
            </dd>
          </div>
          <div>
            <dt>Investigation link</dt>
            <dd>
              <code>{entry.relatedActionId}</code>
            </dd>
          </div>
          <div>
            <dt>Components</dt>
            <dd>
              {entry.components.length > 0
                ? entry.components
                    .map((component) => `${component.label} (${component.unit})`)
                    .join(' · ')
                : 'Patient-authored result; no generic numeric components'}
            </dd>
          </div>
        </dl>
      );
    case 'reference':
      return (
        <>
          <p className="database-citation">{entry.citation}</p>
          <dl className="database-record-fields">
            <div>
              <dt>Source</dt>
              <dd>
                {entry.organization ?? entry.authors.join(', ')} · {entry.publicationDate}
              </dd>
            </div>
            <div>
              <dt>Publication</dt>
              <dd>
                {[entry.containerTitle, entry.versionLabel].filter(Boolean).join(' · ') ||
                  'No additional publication label'}
              </dd>
            </div>
            <div>
              <dt>Identifiers</dt>
              <dd>
                {[entry.doi ? `DOI ${entry.doi}` : null, entry.pmid ? `PMID ${entry.pmid}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'No DOI or PMID recorded'}
              </dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>
                {[...entry.populations, ...entry.settings, ...entry.jurisdictions].join(' · ') ||
                  'No scope metadata recorded'}
              </dd>
            </div>
            <div>
              <dt>Bibliography</dt>
              <dd>{humanize(entry.bibliographicStatus)}</dd>
            </div>
            {entry.sourceRelations.length > 0 ? (
              <div>
                <dt>Relationships</dt>
                <dd>
                  {entry.sourceRelations
                    .map((relation) => `${humanize(relation.relationType)} → ${relation.sourceId}`)
                    .join(' · ')}
                </dd>
              </div>
            ) : null}
          </dl>
          <a href={entry.url} target="_blank" rel="noreferrer">
            Open source page
          </a>
        </>
      );
  }
};

export function DatabaseBrowser({ projection, onBack }: DatabaseBrowserProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('conditions');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  const category =
    categoryFilter === 'all'
      ? null
      : (projection.categories.find((candidate) => candidate.id === categoryFilter) ?? null);
  const entries = useMemo(
    () =>
      projection.entries.filter(
        (entry) =>
          (categoryFilter === 'all' || entry.categoryId === categoryFilter) &&
          (normalizedQuery.length === 0 || searchableEntryText(entry).includes(normalizedQuery)),
      ),
    [categoryFilter, normalizedQuery, projection.entries],
  );

  return (
    <main className="database-shell" id="main-content">
      <header className="database-header">
        <div>
          <p className="eyebrow">Read-only catalog</p>
          <h1 id="database-title" tabIndex={-1}>
            Database
          </h1>
          <p>
            Browse the public-safe clinical catalog compiled into this exact build. This is a
            database view—not access to the device or Mac filesystem.
          </p>
        </div>
        <button className="secondary-button database-back-button" type="button" onClick={onBack}>
          Back to clinic
        </button>
      </header>

      <section className="database-scope-note" aria-labelledby="database-scope-title">
        <div>
          <h2 id="database-scope-title">What this view includes</h2>
          <p>
            {projection.totalEntryCount} identities and neutral metadata across the runtime catalog.
            Patient records, case solutions, scoring predicates, point values, private notes, review
            tickets, and authoring-only classification files are excluded.
          </p>
        </div>
        <span className="count-badge">Catalog {projection.catalogContentVersion}</span>
      </section>

      <nav className="database-category-strip" aria-label="Database categories">
        <button
          className="database-category-button"
          type="button"
          aria-pressed={categoryFilter === 'all'}
          onClick={() => setCategoryFilter('all')}
        >
          <span>All</span>
          <small>{projection.totalEntryCount}</small>
        </button>
        {projection.categories.map((candidate) => (
          <button
            className="database-category-button"
            type="button"
            key={candidate.id}
            aria-pressed={categoryFilter === candidate.id}
            onClick={() => setCategoryFilter(candidate.id)}
          >
            <span>{candidate.label}</span>
            <small>{candidate.entryCount}</small>
          </button>
        ))}
      </nav>

      <section className="database-browser-panel" aria-labelledby="database-results-title">
        <div className="database-search-row">
          <label htmlFor="database-search">
            Search database
            <input
              id="database-search"
              type="search"
              value={query}
              placeholder="Name, stable ID, class, category, or citation"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {query ? (
            <button className="small-button" type="button" onClick={() => setQuery('')}>
              Clear search
            </button>
          ) : null}
        </div>
        <div className="database-results-heading">
          <div>
            <p className="eyebrow">
              {categoryFilter === 'all' ? 'All categories' : category?.label}
            </p>
            <h2 id="database-results-title">
              {entries.length} {entries.length === 1 ? 'record' : 'records'}
            </h2>
          </div>
          <p aria-live="polite" role="status">
            {normalizedQuery
              ? `${entries.length} matches for “${query.trim()}”`
              : `${entries.length} records shown`}
          </p>
        </div>
        {category ? <p className="database-category-description">{category.description}</p> : null}

        {entries.length > 0 ? (
          <div className="database-record-list">
            {entries.map((entry) => (
              <details className="database-record" key={`${entry.categoryId}.${entry.id}`}>
                <summary>
                  <span>
                    <strong>{entry.label}</strong>
                    <code>{entry.id}</code>
                  </span>
                  <span className="database-record-summary-meta">
                    <small>{medicalReviewLabel(entry)}</small>
                    <span aria-hidden="true">＋</span>
                  </span>
                </summary>
                <div className="database-record-body">
                  <dl className="database-record-identity">
                    <div>
                      <dt>Logical catalog path</dt>
                      <dd>
                        <code>{entry.logicalPath}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Content version</dt>
                      <dd>{entry.contentVersion ?? 'Collection-owned version'}</dd>
                    </div>
                    <div>
                      <dt>Review status</dt>
                      <dd>{medicalReviewLabel(entry)}</dd>
                    </div>
                  </dl>
                  <EntryDetails entry={entry} />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="database-empty-state">
            <p>No catalog records match this search and category.</p>
            <button className="secondary-button" type="button" onClick={() => setQuery('')}>
              Clear search
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
