import type { ClinicalReviewTicket, SourceRequest } from '@psychsim/schemas';
import type { CaseRuleAudit } from '@psychsim/content-runtime';
import { LazyDisclosure } from './LazyDisclosure';

interface SourceRequestQueueProps {
  requests: readonly SourceRequest[];
  tickets: readonly ClinicalReviewTicket[];
  caseRuleAudits: readonly CaseRuleAudit[];
}

const statusLabel: Record<SourceRequest['status'], string> = {
  needs_source: 'Source needed',
  source_received: 'Source received · review pending',
  resolved: 'Evidence gap resolved',
};

export function SourceRequestQueue({ requests, tickets, caseRuleAudits }: SourceRequestQueueProps) {
  const openRequests = requests.filter((request) => request.status !== 'resolved');
  if (requests.length === 0) return null;

  return (
    <LazyDisclosure
      className="source-request-queue developer-major-disclosure"
      summary={
        <>
          <span>
            <small>Evidence gaps</small>
            <strong id="source-request-title">Sources needed</strong>
          </span>
          <span className="count-badge">{openRequests.length} open</span>
        </>
      }
    >
      {() => (
        <div className="developer-disclosure-body">
          <p className="ticket-handoff-explanation">
            These questions need primary or authoritative material before their rules can be
            finalized. Put a suitable file in the Google Drive folder{' '}
            <strong>PsychSim documents</strong>, then tell Codex to check the folder. Discovery and
            extraction will create provenance; no source automatically changes a clinical rule.
          </p>
          <div className="source-request-list">
            {requests.map((request) => {
              const linkedTickets = tickets.filter((ticket) =>
                request.linkedTicketIds.includes(ticket.id),
              );
              const linkedPatientLabels = [
                ...new Set(
                  linkedTickets.flatMap((ticket) => {
                    if (!ticket.blueprintId) return [];
                    const audit = caseRuleAudits.find(
                      (candidate) => candidate.blueprintId === ticket.blueprintId,
                    );
                    return [audit?.caseLabel ?? ticket.blueprintId];
                  }),
                ),
              ];
              return (
                <LazyDisclosure
                  className="source-request-card"
                  key={request.id}
                  summary={
                    <>
                      <span>
                        <strong>{request.title}</strong>
                        <small>{request.question}</small>
                      </span>
                      <span className={`source-status source-status-${request.status}`}>
                        {statusLabel[request.status]}
                      </span>
                    </>
                  }
                >
                  {() => (
                    <div className="developer-question-body">
                      <h4>Decision needed</h4>
                      <p className="source-question">{request.question}</p>
                      <h4>Why this question exists</h4>
                      <p>{request.whyNeeded}</p>
                      <dl>
                        <div>
                          <dt>Linked patients</dt>
                          <dd>
                            {linkedPatientLabels.join(' · ') || 'No focused patient linked yet'}
                          </dd>
                        </div>
                        <div>
                          <dt>Linked review questions</dt>
                          <dd>
                            {linkedTickets.length > 0
                              ? linkedTickets
                                  .map((ticket) => `${ticket.title}: ${ticket.guidance}`)
                                  .join(' · ')
                              : 'No patient-specific ticket linked'}
                          </dd>
                        </div>
                      </dl>
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
                              ? [
                                  ...request.receivedEvidenceSourceIds,
                                  ...request.sourceDocumentIds,
                                ].join(', ')
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
                    </div>
                  )}
                </LazyDisclosure>
              );
            })}
          </div>
        </div>
      )}
    </LazyDisclosure>
  );
}
