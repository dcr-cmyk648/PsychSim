import { useMemo, useState } from 'react';
import type {
  DeveloperOpinionCategory,
  DeveloperOpinionReferenceNeed,
} from '@psychsim/content-runtime';
import { DEVELOPER_OPINION_CATEGORY_LABELS } from '@psychsim/content-runtime';

interface DeveloperOpinionQueueProps {
  entries: readonly DeveloperOpinionReferenceNeed[];
}

const CATEGORY_ORDER: readonly DeveloperOpinionCategory[] = [
  'safety_disposition',
  'treatment',
  'medication_fit',
  'workup',
  'diagnosis',
  'test_reference',
];

const searchableText = (entry: DeveloperOpinionReferenceNeed): string =>
  [
    entry.ruleId,
    entry.summary,
    entry.evidenceQuestion,
    ...entry.details,
    ...entry.ownerIds,
    ...entry.linkedSourceRequestIds,
  ]
    .join(' ')
    .toLowerCase();

export function DeveloperOpinionQueue({ entries }: DeveloperOpinionQueueProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      normalizedQuery
        ? entries.filter((entry) => searchableText(entry).includes(normalizedQuery))
        : entries,
    [entries, normalizedQuery],
  );
  const uncoveredCount = entries.filter(
    (entry) => entry.linkedSourceRequestIds.length === 0,
  ).length;

  if (entries.length === 0) return null;

  return (
    <section className="opinion-source-queue" aria-labelledby="opinion-source-title">
      <div className="queue-heading">
        <div>
          <p className="eyebrow">Developer provenance audit</p>
          <h2 id="opinion-source-title">Opinions needing references</h2>
        </div>
        <span className="count-badge">{entries.length} unique claims</span>
      </div>
      <p className="ticket-handoff-explanation">
        This inventory combines repeated copies of the same unsourced clinical rule. A publication
        should support the clinical direction; exact point sizes, game-selection weights, and
        economy values remain Developer balance decisions. Existing source requests are linked
        below. An uncovered claim can become a focused source request when you decide it is worth
        researching.
      </p>
      <div className="opinion-source-summary" aria-label="Reference coverage summary">
        <span>{entries.length - uncoveredCount} linked to an existing source request</span>
        <span>{uncoveredCount} not yet ticketed</span>
      </div>
      <label className="opinion-search" htmlFor="opinion-source-search">
        Search opinions, rule IDs, medications, tests, or source requests
        <input
          id="opinion-source-search"
          className="search-input"
          type="search"
          value={query}
          placeholder="For example: mirtazapine, suicide, TSH, mania…"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="opinion-result-count" role="status">
        Showing {filtered.length} of {entries.length} unique claims
      </p>
      <div className="opinion-category-list">
        {CATEGORY_ORDER.map((category) => {
          const categoryEntries = filtered.filter((entry) => entry.category === category);
          if (categoryEntries.length === 0) return null;
          return (
            <details
              className="opinion-category"
              key={category}
              open={Boolean(normalizedQuery) || category === 'safety_disposition'}
            >
              <summary>
                <span>{DEVELOPER_OPINION_CATEGORY_LABELS[category]}</span>
                <b>{categoryEntries.length}</b>
              </summary>
              <div className="opinion-card-list">
                {categoryEntries.map((entry) => (
                  <article className="opinion-card" key={entry.id}>
                    <header>
                      <div>
                        <strong>{entry.summary}</strong>
                        <small>{entry.ruleId}</small>
                      </div>
                      <span
                        className={
                          entry.linkedSourceRequestIds.length > 0
                            ? 'source-status source-status-source_received'
                            : 'source-status source-status-needs_source'
                        }
                      >
                        {entry.linkedSourceRequestIds.length > 0
                          ? 'Source request exists'
                          : 'Needs source ticket'}
                      </span>
                    </header>
                    <p className="source-question">{entry.evidenceQuestion}</p>
                    <details>
                      <summary>Current opinion, owners, and source routing</summary>
                      <ul>
                        {entry.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                      <dl>
                        <div>
                          <dt>Affected owners</dt>
                          <dd>{entry.ownerIds.join(', ')}</dd>
                        </div>
                        <div>
                          <dt>Rule review</dt>
                          <dd>{entry.reviewStatuses.join(', ').replaceAll('_', ' ')}</dd>
                        </div>
                        <div>
                          <dt>Existing source requests</dt>
                          <dd>
                            {entry.linkedSourceRequestIds.length > 0
                              ? entry.linkedSourceRequestIds.join(', ')
                              : 'None yet'}
                          </dd>
                        </div>
                      </dl>
                    </details>
                  </article>
                ))}
              </div>
            </details>
          );
        })}
      </div>
      {filtered.length === 0 ? <p className="no-results">No opinion matches this search.</p> : null}
    </section>
  );
}
