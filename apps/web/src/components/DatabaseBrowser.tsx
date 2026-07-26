import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  DatabaseEntryReview,
  PublicClinicalCatalogCategoryId,
  PublicClinicalCatalogEntry,
  PublicClinicalCatalogProjection,
} from '@psychsim/schemas';

type CategoryFilter = 'all' | PublicClinicalCatalogCategoryId;

interface DatabaseBrowserProps {
  projection: PublicClinicalCatalogProjection;
  reviews?: readonly DatabaseEntryReview[];
  reviewToolsEnabled?: boolean;
  reviewStatusMessage?: string | null;
  exportAvailable?: boolean;
  onSaveReview?: (entry: PublicClinicalCatalogEntry, reviewerNote: string) => Promise<boolean>;
  onExportReviews?: () => void;
  onBack: () => void;
}

const humanize = (value: string): string => value.replaceAll('_', ' ').replaceAll('-', ' ');

const medicalReviewLabel = (entry: PublicClinicalCatalogEntry): string =>
  entry.medicalReviewStatus
    ? `Medical review: ${humanize(entry.medicalReviewStatus)}`
    : 'Identity record · clinical review is rule-specific';

const searchableEntryText = (entry: PublicClinicalCatalogEntry): string =>
  JSON.stringify(entry).toLocaleLowerCase('en-US');

const entryButtonId = (entry: PublicClinicalCatalogEntry): string =>
  `database-open-${entry.categoryId}-${entry.id}`;

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
                  : entry.severityLevels.map((level) => `${level.label} (${level.id})`).join(' · ')}
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
            <dt>Normalized ingredient</dt>
            <dd>{entry.normalizedIngredientName}</dd>
          </div>
          <div>
            <dt>Aliases</dt>
            <dd>{entry.aliases.length > 0 ? entry.aliases.join(' · ') : 'None recorded'}</dd>
          </div>
          <div>
            <dt>Classes</dt>
            <dd>
              {entry.classes.length > 0
                ? entry.classes.join(' · ')
                : 'Identity only · no gameplay class modeled'}
            </dd>
          </div>
          <div>
            <dt>Authoring scope</dt>
            <dd>
              {entry.authoringStatus === 'runtime_compatibility'
                ? 'Runtime compatibility record'
                : 'Identity-only authoring record · not available for treatment'}
            </dd>
          </div>
          <div>
            <dt>RxNorm identity</dt>
            <dd>
              RxCUI {entry.rxnormRxcui} · <code>{entry.identityEvidenceSourceId}</code>
            </dd>
          </div>
          <div>
            <dt>Identity snapshot</dt>
            <dd>{entry.identityScopeNotice}</dd>
          </div>
          <div>
            <dt>Attribution</dt>
            <dd>{entry.identityAttribution}</dd>
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
                    .map((component) => `${component.label} (${component.unit}; ${component.id})`)
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

const DatabaseEntryReader = ({
  entry,
  projection,
  review,
  reviewToolsEnabled,
  reviewStatusMessage,
  exportAvailable,
  onBack,
  onSaveReview,
  onExportReviews,
}: {
  entry: PublicClinicalCatalogEntry;
  projection: PublicClinicalCatalogProjection;
  review: DatabaseEntryReview | undefined;
  reviewToolsEnabled: boolean;
  reviewStatusMessage: string | null;
  exportAvailable: boolean;
  onBack: () => void;
  onSaveReview?: (entry: PublicClinicalCatalogEntry, reviewerNote: string) => Promise<boolean>;
  onExportReviews?: () => void;
}) => {
  const [reviewerNote, setReviewerNote] = useState(review?.reviewerNote ?? '');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setReviewerNote(review?.reviewerNote ?? ''), [entry.id, review?.reviewerNote]);
  useEffect(() => titleRef.current?.focus(), [entry.id]);

  const save = async (note: string): Promise<void> => {
    if (!onSaveReview) return;
    setSaving(true);
    try {
      await onSaveReview(entry, note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="database-shell database-reader-shell" id="main-content">
      <header className="database-reader-header">
        <button className="secondary-button" type="button" onClick={onBack}>
          Back to database
        </button>
        <div>
          <p className="eyebrow">Database entry · {humanize(entry.categoryId)}</p>
          <h1 ref={titleRef} tabIndex={-1}>
            {entry.label}
          </h1>
          <code>{entry.id}</code>
        </div>
      </header>

      <article className="database-reader-card">
        <section aria-labelledby="database-entry-identity-title">
          <h2 id="database-entry-identity-title">Record identity</h2>
          <dl className="database-record-identity">
            <div>
              <dt>Logical catalog path</dt>
              <dd>
                <code>{entry.logicalPath}</code>
              </dd>
            </div>
            <div>
              <dt>Entry content version</dt>
              <dd>{entry.contentVersion ?? 'Collection-owned version'}</dd>
            </div>
            <div>
              <dt>Catalog content version</dt>
              <dd>{projection.catalogContentVersion}</dd>
            </div>
            <div>
              <dt>Review status</dt>
              <dd>{medicalReviewLabel(entry)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="database-entry-content-title">
          <h2 id="database-entry-content-title">Entry content</h2>
          <div className="database-record-body database-reader-content">
            <EntryDetails entry={entry} />
          </div>
        </section>

        <details className="database-structured-record">
          <summary>Complete structured record</summary>
          <p>
            This is every field in the review-safe record compiled into this build. Private source
            text, case answers, predicates, and point rules are not part of this projection.
          </p>
          <pre>{JSON.stringify(entry, null, 2)}</pre>
        </details>

        {reviewToolsEnabled ? (
          <section className="database-review-panel" aria-labelledby="database-review-title">
            <div>
              <p className="eyebrow">Reviewer feedback</p>
              <h2 id="database-review-title">Comment on this entry</h2>
              <p>
                General, clinical, provenance, and data-structure comments are welcome. Saving a
                comment does not edit this record or approve clinical content. The exact review-safe
                entry snapshot is saved with your note.
              </p>
            </div>
            <label htmlFor="database-review-note">
              Comment for Codex
              <textarea
                id="database-review-note"
                value={reviewerNote}
                maxLength={8000}
                placeholder="What should be added, corrected, sourced, clarified, or reconsidered?"
                onChange={(event) => setReviewerNote(event.target.value)}
              />
            </label>
            <div className="database-review-actions">
              {review ? (
                <button
                  className="secondary-button"
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setReviewerNote('');
                    void save('');
                  }}
                >
                  Remove saved comment
                </button>
              ) : null}
              <button
                className="primary-button"
                type="button"
                disabled={saving || !reviewerNote.trim()}
                onClick={() => void save(reviewerNote)}
              >
                {saving ? 'Saving…' : review ? 'Update comment' : 'Save comment'}
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={!exportAvailable}
                onClick={onExportReviews}
              >
                Export all saved feedback
              </button>
            </div>
            {review ? (
              <p className="database-review-saved">
                Saved locally · last updated {new Date(review.updatedAt).toLocaleString()}
              </p>
            ) : null}
            {reviewStatusMessage ? (
              <p className="success-message" role="status">
                {reviewStatusMessage}
              </p>
            ) : null}
          </section>
        ) : null}
      </article>
    </main>
  );
};

export function DatabaseBrowser({
  projection,
  reviews = [],
  reviewToolsEnabled = false,
  reviewStatusMessage = null,
  exportAvailable = false,
  onSaveReview,
  onExportReviews,
  onBack,
}: DatabaseBrowserProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('conditions');
  const [query, setQuery] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const returnFocusId = useRef<string | null>(null);
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
  const activeEntry = projection.entries.find((entry) => entry.id === activeEntryId) ?? null;

  const closeReader = (): void => {
    const focusId = returnFocusId.current;
    setActiveEntryId(null);
    window.setTimeout(() => {
      if (focusId) document.getElementById(focusId)?.focus();
    }, 0);
  };

  if (activeEntry) {
    return (
      <DatabaseEntryReader
        entry={activeEntry}
        projection={projection}
        review={reviews.find((candidate) => candidate.entryId === activeEntry.id)}
        reviewToolsEnabled={reviewToolsEnabled}
        reviewStatusMessage={reviewStatusMessage}
        exportAvailable={exportAvailable}
        onBack={closeReader}
        onSaveReview={onSaveReview}
        onExportReviews={onExportReviews}
      />
    );
  }

  return (
    <main className="database-shell" id="main-content">
      <header className="database-header">
        <div>
          <p className="eyebrow">Catalog reader</p>
          <h1 id="database-title" tabIndex={-1}>
            Database
          </h1>
          <p>
            Search the clinical catalog compiled into this build, then open any entry in a dedicated
            reader. This is a database view—not access to the device or Mac filesystem.
          </p>
        </div>
        <button className="secondary-button database-back-button" type="button" onClick={onBack}>
          Back to clinic
        </button>
      </header>

      <section className="database-scope-note" aria-labelledby="database-scope-title">
        <div>
          <h2 id="database-scope-title">Review-safe database scope</h2>
          <p>
            {projection.totalEntryCount} identities and neutral metadata across this review-safe
            catalog. Each reader shows the complete structured review-safe entry. Patient records,
            case solutions, scoring predicates, point values, raw private notes, and authoring-only
            classification files remain excluded.
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
            {entries.map((entry) => {
              const hasComment = reviews.some((candidate) => candidate.entryId === entry.id);
              return (
                <article className="database-record database-record-launcher" key={entry.id}>
                  <div>
                    <strong>{entry.label}</strong>
                    <code>{entry.id}</code>
                    <small>{medicalReviewLabel(entry)}</small>
                  </div>
                  <div>
                    {hasComment ? <span className="status-chip">Comment saved</span> : null}
                    <button
                      id={entryButtonId(entry)}
                      className="small-button"
                      type="button"
                      onClick={() => {
                        returnFocusId.current = entryButtonId(entry);
                        setActiveEntryId(entry.id);
                      }}
                    >
                      Open full entry
                    </button>
                  </div>
                </article>
              );
            })}
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
