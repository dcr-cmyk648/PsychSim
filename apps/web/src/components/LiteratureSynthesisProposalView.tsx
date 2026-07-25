import type { LiteratureSynthesisProposal } from '@psychsim/schemas';

interface LiteratureSynthesisProposalViewProps {
  proposal: LiteratureSynthesisProposal;
}

const accessLabel: Record<LiteratureSynthesisProposal['sources'][number]['accessStatus'], string> =
  {
    cataloged_and_cleared: 'Cataloged and source-use cleared',
    metadata_or_abstract_only: 'Metadata/abstract context only',
    inaccessible: 'Inaccessible · metadata only',
  };

export function LiteratureSynthesisProposalView({
  proposal,
}: LiteratureSynthesisProposalViewProps) {
  const supporting = proposal.sources.filter((source) => source.supportsProposedDirection);
  const qualifying = proposal.sources.filter((source) => !source.supportsProposedDirection);

  return (
    <section className="literature-proposal" aria-labelledby={`${proposal.id}-title`}>
      <div className="literature-proposal-heading">
        <div>
          <small>Automated literature prep · psychiatrist review required</small>
          <h4 id={`${proposal.id}-title`}>Proposed evidence answer</h4>
        </div>
        <span className="source-status">Unreviewed</span>
      </div>
      <p className="literature-focused-decision">{proposal.focusedDecision}</p>
      <div className="literature-proposed-direction">
        <strong>Proposed direction</strong>
        <p>{proposal.proposedDirection}</p>
      </div>
      <div className="literature-summary-grid">
        <div>
          <h5>Eligible support</h5>
          <p>{proposal.supportingSummary}</p>
          <LiteratureSourceList sources={supporting} />
        </div>
        <div>
          <h5>Opposing or qualifying context</h5>
          <p>{proposal.opposingOrQualifyingSummary}</p>
          <LiteratureSourceList sources={qualifying} />
        </div>
      </div>
      <details>
        <summary>Search method, limitations, and unresolved questions</summary>
        <dl>
          <div>
            <dt>Searched</dt>
            <dd>
              {proposal.searchStrategy.searchedAt.slice(0, 10)} ·{' '}
              {proposal.searchStrategy.databases.join(' · ')}
            </dd>
          </div>
          <div>
            <dt>Recent-evidence window</dt>
            <dd>{proposal.searchStrategy.rollingWindowStartYear} onward</dd>
          </div>
          <div>
            <dt>Selection boundary</dt>
            <dd>{proposal.searchStrategy.selectionNote}</dd>
          </div>
        </dl>
        <h5>Limitations</h5>
        <ul>
          {proposal.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
        {proposal.unresolvedQuestions.length > 0 ? (
          <>
            <h5>Still unresolved</h5>
            <ul>
              {proposal.unresolvedQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </>
        ) : null}
      </details>
      <p className="audit-disclaimer">
        This packet cannot alter a patient, rule, source request, or point value. Your response
        below remains the decision.
      </p>
    </section>
  );
}

function LiteratureSourceList({
  sources,
}: {
  sources: readonly LiteratureSynthesisProposal['sources'][number][];
}) {
  if (sources.length === 0) {
    return <p className="no-results">No source in this review set.</p>;
  }
  return (
    <ul className="literature-source-list">
      {sources.map((source) => (
        <li key={source.id}>
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.title}
          </a>
          <small>
            {source.publicationYear} · {source.sourceKind.replaceAll('_', ' ')} ·{' '}
            {accessLabel[source.accessStatus]}
          </small>
          <p>{source.conciseFinding}</p>
          {source.accessStatus !== 'cataloged_and_cleared' ? (
            <em>Cannot support an executable rule until independently cataloged and cleared.</em>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
