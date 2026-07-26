import type { SourceReviewSnapshot } from '@psychsim/schemas';

import './source-review-snapshot.css';

export function SourceReviewSnapshotView({ snapshot }: { snapshot: SourceReviewSnapshot }) {
  const metadataOnly = snapshot.atomicProposals.every(
    (proposal) => proposal.proposalType === 'no_change',
  );
  return (
    <section className="source-review-snapshot" aria-label="Unreviewed source summary">
      <header>
        <p className="eyebrow">Unreviewed source summary · no gameplay effect</p>
        <span className="source-status">Local packet</span>
      </header>
      <p className="source-review-policy">
        This is an original paraphrase prepared for review. Raw source text, headings, and private
        locators remain outside the browser.
      </p>
      <h4>{metadataOnly ? 'Boundary summary' : 'What this source unit appears to say'}</h4>
      <p>{snapshot.originalSummary}</p>
      <h4>{metadataOnly ? 'Proposed handling' : 'Atomic proposals'}</h4>
      <div className="source-review-proposals">
        {snapshot.atomicProposals.map((proposal) => (
          <article key={proposal.id}>
            <header>
              <strong>{proposal.proposalType.replaceAll('_', ' ')}</strong>
            </header>
            <p>{proposal.summary}</p>
            {proposal.uncertainty.length > 0 ? (
              <p className="source-review-uncertainty">
                <strong>Uncertainty:</strong> {proposal.uncertainty.join(' · ')}
              </p>
            ) : null}
            <details className="ticket-context">
              <summary>Technical mapping</summary>
              <dl>
                <div>
                  <dt>Proposal ID</dt>
                  <dd>{proposal.id}</dd>
                </div>
                <div>
                  <dt>Database targets</dt>
                  <dd>{proposal.publicTargetContentIds.join(', ') || 'None yet'}</dd>
                </div>
                {proposal.unresolvedTargetLabels.length > 0 ? (
                  <div>
                    <dt>Unresolved targets</dt>
                    <dd>{proposal.unresolvedTargetLabels.join(', ')}</dd>
                  </div>
                ) : null}
              </dl>
            </details>
          </article>
        ))}
      </div>
      <dl className="source-review-metadata">
        <div>
          <dt>Currentness</dt>
          <dd>
            {snapshot.currentness.status.replaceAll('_', ' ')}
            {snapshot.currentness.evaluatedThrough
              ? ` through ${snapshot.currentness.evaluatedThrough}`
              : ''}
            {' · '}
            {snapshot.currentness.note}
          </dd>
        </div>
        <div>
          <dt>Use boundary</dt>
          <dd>
            {snapshot.rightsState.status.replaceAll('_', ' ')} · {snapshot.rightsState.note}
          </dd>
        </div>
        <div>
          <dt>Section boundary</dt>
          <dd>
            {snapshot.boundaryState}
            {snapshot.boundaryQuestion ? ` · ${snapshot.boundaryQuestion}` : ''}
          </dd>
        </div>
        {snapshot.uncertainty.length > 0 ? (
          <div>
            <dt>Packet uncertainty</dt>
            <dd>{snapshot.uncertainty.join(' · ')}</dd>
          </div>
        ) : null}
        {snapshot.conflicts.length > 0 ? (
          <div>
            <dt>Conflicts to preserve</dt>
            <dd>{snapshot.conflicts.join(' · ')}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
