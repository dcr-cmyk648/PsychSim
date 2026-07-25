import { useMemo, useState } from 'react';

import {
  PersonalKnowledgeWorkbenchProjectionSchema,
  type PersonalKnowledgeWorkbenchProjection,
} from '@psychsim/schemas';

import { LazyDisclosure } from './LazyDisclosure';

const WORKBENCH_ENDPOINT = '/__psychsim/personal-knowledge-workbench';

export const loadPersonalKnowledgeWorkbench =
  async (): Promise<PersonalKnowledgeWorkbenchProjection | null> => {
    try {
      const response = await fetch(WORKBENCH_ENDPOINT, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      return PersonalKnowledgeWorkbenchProjectionSchema.parse(await response.json());
    } catch {
      return null;
    }
  };

export interface PersonalKnowledgeWorkbenchProps {
  projection: PersonalKnowledgeWorkbenchProjection | null;
}

export function PersonalKnowledgeWorkbench({ projection }: PersonalKnowledgeWorkbenchProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const dossiers = useMemo(
    () =>
      !projection
        ? []
        : projection.dossiers.filter(
            (dossier) =>
              !normalizedQuery ||
              [
                dossier.label,
                dossier.targetId,
                dossier.targetKind,
                ...dossier.candidates.map((candidate) => candidate.summary),
                ...dossier.bibliographicCandidates.map((candidate) => candidate.displayCitation),
              ]
                .join(' ')
                .toLocaleLowerCase()
                .includes(normalizedQuery),
          ),
    [normalizedQuery, projection],
  );

  return (
    <LazyDisclosure
      className="personal-knowledge-workbench developer-major-disclosure"
      summary={
        <>
          <span>
            <small>Private source authoring</small>
            <strong id="personal-knowledge-title">Personal knowledge workbench</strong>
          </span>
          <span className="count-badge">
            {projection
              ? `${projection.summary.mappedCandidates}/${projection.summary.opinionCandidates} mapped`
              : 'Not prepared'}
          </span>
        </>
      }
    >
      {() => (
        <div className="developer-disclosure-body">
          <p className="ticket-handoff-explanation">
            <strong>Candidate material only — no gameplay effect.</strong> This local projection
            contains concise derived annotations and opaque provenance IDs. Raw Notes text, OCR,
            source chunks, and private file paths remain outside the browser.
          </p>
          {!projection ? (
            <p className="no-results">
              No bounded personal-knowledge projection is available yet. Prepare and classify the
              next pilot item from the command line.
            </p>
          ) : (
            <>
              <div
                className="personal-knowledge-summary"
                aria-label="Personal knowledge processing coverage"
              >
                {[
                  ['Eligible sources', projection.summary.intakeEligibleSources],
                  ['Queued', projection.summary.queuedSources],
                  ['Released', projection.summary.releasedSources],
                  ['Partially classified', projection.summary.partiallyClassifiedSources],
                  ['Classified', projection.summary.classifiedSources],
                  ['Authored units', projection.summary.sourceUnits],
                  ['Opinion candidates', projection.summary.opinionCandidates],
                  ['Bibliography leads', projection.summary.bibliographicCandidates],
                  ['Mapped', projection.summary.mappedCandidates],
                  ['Needs currentness review', projection.summary.needsCurrentnessReview],
                ].map(([label, value]) => (
                  <span key={String(label)}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </span>
                ))}
              </div>
              <label className="opinion-search" htmlFor="personal-knowledge-search">
                Search medications, conditions, candidate summaries, or stable IDs
                <input
                  id="personal-knowledge-search"
                  className="search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="For example: bupropion, sleep, weight, MDD…"
                />
              </label>
              <p className="opinion-result-count" role="status">
                Showing {dossiers.length} of {projection.dossiers.length} dossiers
              </p>
              {projection.sourceUnitCandidates.length > 0 ? (
                <LazyDisclosure
                  className="personal-knowledge-source-units"
                  summary={`Authored source units · ${projection.sourceUnitCandidates.length}`}
                >
                  {() => (
                    <ul>
                      {projection.sourceUnitCandidates.map((candidate) => (
                        <li key={candidate.id}>
                          <strong>{candidate.id}</strong> ·{' '}
                          {candidate.unitKind.replaceAll('_', ' ')}
                          {' · '}
                          {candidate.boundaryState} · {candidate.reviewStatus.replaceAll('_', ' ')}
                          <small>
                            Resolved targets: {candidate.resolvedTargetIds.join(', ') || 'none'}
                            {candidate.unresolvedTargetLabels.length > 0
                              ? ` · unresolved: ${candidate.unresolvedTargetLabels.join(', ')}`
                              : ''}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </LazyDisclosure>
              ) : null}
              <div className="personal-knowledge-dossiers">
                {dossiers.map((dossier) => (
                  <LazyDisclosure
                    key={dossier.targetId}
                    className="personal-knowledge-dossier"
                    summary={
                      <>
                        <span>
                          <strong>{dossier.label}</strong>
                          <small>
                            {dossier.targetKind} · {dossier.targetId}
                          </small>
                        </span>
                        <span className="count-badge">{dossier.candidates.length} candidates</span>
                      </>
                    }
                  >
                    {() => (
                      <div className="personal-knowledge-dossier-body">
                        <dl>
                          <div>
                            <dt>Queued sources</dt>
                            <dd>{dossier.queuedSourceCount}</dd>
                          </div>
                          <div>
                            <dt>Source units</dt>
                            <dd>{dossier.sourceUnitCount}</dd>
                          </div>
                          <div>
                            <dt>Formal evidence</dt>
                            <dd>{dossier.formalEvidenceSourceIds.join(', ') || 'None linked'}</dd>
                          </div>
                          <div>
                            <dt>Current rules</dt>
                            <dd>{dossier.currentRuleIds.join(', ') || 'None'}</dd>
                          </div>
                        </dl>
                        {dossier.balanceEntries.length > 0 ? (
                          <details>
                            <summary>Separate game-balance entries</summary>
                            <ul>
                              {dossier.balanceEntries.map((entry) => (
                                <li key={entry.id}>
                                  <strong>
                                    {entry.pointDelta > 0 ? '+' : ''}
                                    {entry.pointDelta} points
                                  </strong>{' '}
                                  · {entry.summary} · {entry.reviewStatus.replaceAll('_', ' ')}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                        {dossier.bibliographicCandidates.length > 0 ? (
                          <details>
                            <summary>
                              Bibliography leads · {dossier.bibliographicCandidates.length}
                            </summary>
                            <ul>
                              {dossier.bibliographicCandidates.map((candidate) => (
                                <li key={candidate.id}>
                                  <strong>{candidate.displayCitation}</strong> ·{' '}
                                  {candidate.verificationStatus.replaceAll('_', ' ')}
                                  {candidate.matchedEvidenceSourceId
                                    ? ` · ${candidate.matchedEvidenceSourceId}`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                        <div className="personal-knowledge-candidates">
                          {dossier.candidates.map((candidate) => (
                            <article key={candidate.id}>
                              <div>
                                <strong>{candidate.summary}</strong>
                                <span className="status-chip">
                                  {candidate.reviewStatus.replaceAll('_', ' ')}
                                </span>
                              </div>
                              <small>
                                Source unit {candidate.sourceUnitId} ·{' '}
                                {candidate.sourceDate ?? 'date unknown'} ·{' '}
                                {candidate.currentness.replaceAll('_', ' ')}
                              </small>
                              {candidate.unresolvedTargets.length > 0 ? (
                                <details>
                                  <summary>
                                    Unresolved targets · {candidate.unresolvedTargets.length}
                                  </summary>
                                  <ul>
                                    {candidate.unresolvedTargets.map((target) => (
                                      <li key={`${target.role}.${target.searchLabel}`}>
                                        <strong>{target.searchLabel}</strong> · {target.role}
                                        {target.targetKindHint
                                          ? ` · ${target.targetKindHint}`
                                          : ''}{' '}
                                        — {target.reason}
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              ) : null}
                              {candidate.evidenceRelations.length > 0 ? (
                                <ul>
                                  {candidate.evidenceRelations.map((relation) => (
                                    <li
                                      key={`${relation.evidenceSourceId}.${relation.relationship}`}
                                    >
                                      {relation.relationship.replaceAll('_', ' ')} ·{' '}
                                      {relation.evidenceSourceId} ·{' '}
                                      {relation.reviewStatus.replaceAll('_', ' ')}
                                      {relation.stillExpertBridge
                                        ? ' · Developer-opinion bridge retained'
                                        : ''}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No formal evidence relationship reviewed yet.</p>
                              )}
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </LazyDisclosure>
                ))}
              </div>
              {dossiers.length === 0 ? (
                <p className="no-results">No dossier matches this search.</p>
              ) : null}
              {projection.unmappedCandidates.length > 0 ? (
                <LazyDisclosure
                  className="personal-knowledge-unmapped"
                  summary={`Unmapped candidates · ${projection.unmappedCandidates.length}`}
                >
                  {() => (
                    <ul>
                      {projection.unmappedCandidates.map((candidate) => (
                        <li key={candidate.id}>
                          <strong>{candidate.summary}</strong>
                          <small>
                            {candidate.sourceUnitId} · {candidate.currentness.replaceAll('_', ' ')}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                </LazyDisclosure>
              ) : null}
              {projection.unmappedBibliographicCandidates.length > 0 ? (
                <LazyDisclosure
                  className="personal-knowledge-unmapped-bibliography"
                  summary={`Unmapped bibliography leads · ${projection.unmappedBibliographicCandidates.length}`}
                >
                  {() => (
                    <ul>
                      {projection.unmappedBibliographicCandidates.map((candidate) => (
                        <li key={candidate.id}>
                          <strong>{candidate.displayCitation}</strong> ·{' '}
                          {candidate.verificationStatus.replaceAll('_', ' ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </LazyDisclosure>
              ) : null}
              {projection.warnings.length > 0 ? (
                <details>
                  <summary>Processing warnings · {projection.warnings.length}</summary>
                  <ul>
                    {projection.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          )}
        </div>
      )}
    </LazyDisclosure>
  );
}
