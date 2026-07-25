import type { TicketLiteratureScoutCatalog, TicketLiteratureScoutProfile } from '@psychsim/schemas';

interface TicketLiteratureScoutViewProps {
  catalog: TicketLiteratureScoutCatalog;
  ticketId: string;
}

const synthesisLabel: Record<
  TicketLiteratureScoutCatalog['references'][number]['synthesisKind'],
  string
> = {
  meta_analysis: 'Meta-analysis',
  network_meta_analysis: 'Network meta-analysis',
  individual_participant_data_meta_analysis: 'Individual-participant-data meta-analysis',
};

export function TicketLiteratureScoutView({ catalog, ticketId }: TicketLiteratureScoutViewProps) {
  const attachment = catalog.attachments.find((candidate) => candidate.ticketId === ticketId);
  if (!attachment) return null;

  return (
    <section className="literature-proposal ticket-literature-scout">
      <div className="literature-proposal-heading">
        <div>
          <small>Automated literature scout · psychiatrist review required</small>
          <h4>Recent meta-analysis context</h4>
        </div>
        <span className="source-status">Unreviewed</span>
      </div>
      {attachment.exemptionReason ? (
        <div className="literature-proposed-direction">
          <strong>Meta-analysis not applicable to this ticket</strong>
          <p>{attachment.exemptionReason}</p>
        </div>
      ) : (
        attachment.profileIds.map((profileId) => {
          const profile = catalog.profiles.find((candidate) => candidate.id === profileId);
          return profile ? (
            <LiteratureScoutProfile key={profile.id} catalog={catalog} profile={profile} />
          ) : null;
        })
      )}
      <p className="audit-disclaimer">
        Discovery context only. This scout cannot approve a clinical claim, choose point magnitude,
        or change a ticket, source request, rule, citation, or review status.
      </p>
    </section>
  );
}

function LiteratureScoutProfile({
  catalog,
  profile,
}: {
  catalog: TicketLiteratureScoutCatalog;
  profile: TicketLiteratureScoutProfile;
}) {
  const reference = profile.selectedReferenceId
    ? catalog.references.find((candidate) => candidate.id === profile.selectedReferenceId)
    : null;

  return (
    <article className="ticket-literature-scout-profile">
      <div>
        <h5>Question searched</h5>
        <p>{profile.clinicalQuestion}</p>
      </div>
      {reference ? (
        <div className="ticket-literature-scout-result">
          <p className="source-status">Recent meta-analysis selected</p>
          <a href={reference.url} target="_blank" rel="noreferrer">
            {reference.title}
          </a>
          <small>
            {reference.authorLabel} · {reference.publicationYear} ·{' '}
            {synthesisLabel[reference.synthesisKind]}
          </small>
          <h5>Abstract-only summary</h5>
          <p>{reference.abstractSummary}</p>
          <dl className="developer-question-context">
            <div>
              <dt>Citation snapshot</dt>
              <dd>
                Europe PMC cited by {reference.citationMetric.count.toLocaleString()} · checked{' '}
                {reference.citationMetric.asOf.slice(0, 10)}
              </dd>
            </div>
            <div>
              <dt>Relevance to this ticket</dt>
              <dd>{profile.relevanceNote}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="literature-proposed-direction">
          <strong>No suitable recent meta-analysis found in the recorded 10-year search</strong>
          <p>{profile.relevanceNote}</p>
        </div>
      )}
      <details className="ticket-context">
        <summary>Search method and limitations</summary>
        <dl>
          <div>
            <dt>Window</dt>
            <dd>
              {profile.searchPlan
                ? `${profile.searchPlan.windowStart} through ${profile.searchPlan.windowEnd}`
                : 'A meta-analysis search was not applicable.'}
            </dd>
          </div>
          {profile.searchRun ? (
            <>
              <div>
                <dt>Results screened</dt>
                <dd>
                  {profile.searchRun.screenedResultCount} eligible result
                  {profile.searchRun.screenedResultCount === 1 ? '' : 's'}
                  {profile.searchRun.selectedRank
                    ? ` · selected rank ${profile.searchRun.selectedRank}`
                    : ''}
                </dd>
              </div>
              <div>
                <dt>Selection</dt>
                <dd>{profile.searchRun.selectionNote}</dd>
              </div>
            </>
          ) : null}
          {profile.searchPlan ? (
            <div>
              <dt>Exact topic query</dt>
              <dd>
                <code>{profile.searchPlan.topicQuery}</code>
              </dd>
            </div>
          ) : null}
        </dl>
        <h5>Limitations</h5>
        <ul>
          {profile.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
