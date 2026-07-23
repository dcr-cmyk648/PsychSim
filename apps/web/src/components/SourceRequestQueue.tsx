import type { SourceRequest } from '@psychsim/schemas';

interface SourceRequestQueueProps {
  requests: readonly SourceRequest[];
}

const statusLabel: Record<SourceRequest['status'], string> = {
  needs_source: 'Source needed',
  source_received: 'Source received · review pending',
  resolved: 'Evidence gap resolved',
};

export function SourceRequestQueue({ requests }: SourceRequestQueueProps) {
  const openRequests = requests.filter((request) => request.status !== 'resolved');
  if (requests.length === 0) return null;

  return (
    <section className="source-request-queue" aria-labelledby="source-request-title">
      <div className="queue-heading">
        <div>
          <p className="eyebrow">Evidence gaps</p>
          <h2 id="source-request-title">Sources needed</h2>
        </div>
        <span className="count-badge">{openRequests.length} open</span>
      </div>
      <p className="ticket-handoff-explanation">
        These questions need primary or authoritative material before their rules can be finalized.
        Put a suitable file in the Google Drive folder <strong>PsychSim documents</strong>, then
        tell Codex to check the folder. Discovery and extraction will create provenance; no source
        automatically changes a clinical rule.
      </p>
      <div className="source-request-list">
        {requests.map((request) => (
          <article className="source-request-card" key={request.id}>
            <header>
              <div>
                <strong>{request.title}</strong>
                <small>{request.id}</small>
              </div>
              <span className={`source-status source-status-${request.status}`}>
                {statusLabel[request.status]}
              </span>
            </header>
            <p className="source-question">{request.question}</p>
            <p>{request.whyNeeded}</p>
            <dl>
              <div>
                <dt>Preferred material</dt>
                <dd>
                  {request.preferredSourceTypes
                    .map((kind) => kind.replaceAll('_', ' '))
                    .join(' · ')}
                </dd>
              </div>
              <div>
                <dt>Existing context</dt>
                <dd>
                  {request.existingEvidenceSourceIds.length > 0
                    ? `${request.existingEvidenceSourceIds.join(', ')} (gap remains open)`
                    : 'No formal source linked yet'}
                </dd>
              </div>
              <div>
                <dt>Newly received evidence</dt>
                <dd>
                  {request.receivedEvidenceSourceIds.length > 0 ||
                  request.sourceDocumentIds.length > 0
                    ? [...request.receivedEvidenceSourceIds, ...request.sourceDocumentIds].join(
                        ', ',
                      )
                    : 'Nothing received yet'}
                </dd>
              </div>
              <div>
                <dt>Drive destination</dt>
                <dd>{request.destination.folderLabel}</dd>
              </div>
            </dl>
            <details>
              <summary>What a useful source must clarify</summary>
              <ul>
                {request.acceptanceCriteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Linked tickets and content IDs</summary>
              <dl>
                <div>
                  <dt>Tickets</dt>
                  <dd>{request.linkedTicketIds.join(', ')}</dd>
                </div>
                <div>
                  <dt>Targets</dt>
                  <dd>{request.targetContentIds.join(', ')}</dd>
                </div>
              </dl>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
