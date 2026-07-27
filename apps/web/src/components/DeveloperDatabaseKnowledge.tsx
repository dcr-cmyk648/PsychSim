import type {
  DeveloperDatabaseCrossReferenceRecordSchema,
  DeveloperDatabaseKnowledgeProjection,
} from '@psychsim/schemas';
import type { z } from 'zod';

import { buildDeveloperDatabaseDossierBrief } from '../developer-database-dossier-review';

type DeveloperDatabaseRecord = z.infer<typeof DeveloperDatabaseCrossReferenceRecordSchema>;

const humanize = (value: string): string => value.replaceAll('_', ' ').replaceAll('-', ' ');

const personalSourceLabel = (
  sourceKind: DeveloperDatabaseRecord['lexicalSignals'][number]['sourceKind'],
): string => {
  switch (sourceKind) {
    case 'apple_notes':
      return 'Apple Notes research';
    case 'user_authored_archive':
      return 'SharePoint / residency articles written by the developer';
    case 'private_drive_notes':
      return 'Other private Drive notes';
  }
};

const compilationStateLabel = (state: DeveloperDatabaseRecord['compilationState']): string => {
  switch (state) {
    case 'identity_only':
      return 'Identity only';
    case 'no_personal_match':
      return 'No current personal-corpus match';
    case 'lexically_linked':
      return 'Personal corpus indexed';
    case 'candidate_material':
      return 'Semantic candidates awaiting review';
    case 'reviewed_knowledge':
      return 'Reviewed personal knowledge';
  }
};

export function DeveloperDatabaseKnowledgeScope({
  knowledge,
}: {
  knowledge: DeveloperDatabaseKnowledgeProjection;
}) {
  const { summary } = knowledge;
  const semanticStateCounts = knowledge.corpusUnits.reduce(
    (counts, unit) => {
      counts[unit.semanticState] += 1;
      return counts;
    },
    {
      not_semantically_reviewed: 0,
      queued: 0,
      partially_classified: 0,
      classified_no_candidate: 0,
      candidate_created: 0,
      reviewed_no_change: 0,
      incorporated: 0,
    },
  );
  const classifiedUnits = knowledge.corpusUnits.filter((unit) => unit.semanticDisposition !== null);
  const entryLabelById = new Map(
    knowledge.records.map((record) => [record.entryId, record.label] as const),
  );
  return (
    <details className="database-scope-note database-local-knowledge-scope">
      <summary>
        <span>
          Local personal-corpus compilation · {summary.sourceUnits} units ·{' '}
          {summary.semanticallyClassifiedUnits} semantically classified
        </span>
        <span className="count-badge">
          {summary.fullyIndexedUnits} full · {summary.partiallyIndexedUnits} partial
        </span>
      </summary>
      <div className="database-local-knowledge-body">
        <p className="eyebrow">Local Developer overlay</p>
        <h2>Full personal-corpus cross-reference</h2>
        <p>
          {summary.personalSourceDocuments} private documents are represented as{' '}
          {summary.sourceUnits} deterministic units: {summary.appleNotesRevisions} Apple Notes
          revisions and {summary.privateDriveDocuments} enrolled private Drive document
          {summary.privateDriveDocuments === 1 ? '' : 's'}. Attachment OCR was available for{' '}
          {summary.appleNotesOcrCompleted} of {summary.appleNotesAttachmentRecords} attachment
          records. The user-authored SharePoint/residency archive contributes{' '}
          {summary.userAuthoredArchiveUnits} independently reviewable units.
        </p>
        <p>
          {summary.matchedTargetEntries} of {summary.targetEntries} current database entries have at
          least one lexical source link ({summary.totalLexicalMatches} matches). Only{' '}
          {summary.semanticallyClassifiedUnits} source unit
          {summary.semanticallyClassifiedUnits === 1 ? ' has' : 's have'} completed semantic
          classification; {summary.candidateSummaries} atomized candidate
          {summary.candidateSummaries === 1 ? ' is' : 's are'} visible. Indexing is not clinical
          incorporation.
        </p>
        <dl className="database-knowledge-metrics">
          <div>
            <dt>Not reviewed</dt>
            <dd>{semanticStateCounts.not_semantically_reviewed}</dd>
          </div>
          <div>
            <dt>Queued / partial</dt>
            <dd>{semanticStateCounts.queued + semanticStateCounts.partially_classified}</dd>
          </div>
          <div>
            <dt>Candidates</dt>
            <dd>{semanticStateCounts.candidate_created}</dd>
          </div>
          <div>
            <dt>Classified, no candidate</dt>
            <dd>
              {semanticStateCounts.classified_no_candidate + semanticStateCounts.reviewed_no_change}
            </dd>
          </div>
          <div>
            <dt>Incorporated</dt>
            <dd>{semanticStateCounts.incorporated}</dd>
          </div>
        </dl>
        {classifiedUnits.length > 0 ? (
          <details className="database-knowledge-lane">
            <summary>Private-corpus classification decisions · {classifiedUnits.length}</summary>
            <ol className="database-source-signal-list">
              {classifiedUnits.map((unit) => (
                <li key={unit.id}>
                  <strong>{unit.displayLabel}</strong>
                  <p>
                    {humanize(unit.semanticDisposition ?? '')} · {unit.semanticSummary}
                  </p>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
        <details className="database-knowledge-lane">
          <summary>
            Catalog landing audit · {knowledge.catalogIdentityAudit.identityGaps.length} identity
            gaps · {knowledge.catalogIdentityAudit.overlappingTerms.length} overlapping terms
          </summary>
          <p>
            Every unresolved medication, condition, intervention, test, rule, tag, or template
            mention from atomized material appears here. A likely match still requires review; an
            ambiguous match is never merged automatically; a novel catalog label remains an explicit
            proposed entry.
          </p>
          {knowledge.catalogIdentityAudit.identityGaps.length > 0 ? (
            <ul className="database-knowledge-card-list">
              {knowledge.catalogIdentityAudit.identityGaps.map((gap) => (
                <li key={gap.id}>
                  <strong>{gap.displayLabel}</strong>
                  <small>
                    {humanize(gap.status)} ·{' '}
                    {gap.targetKindHint ? humanize(gap.targetKindHint) : 'kind not yet resolved'} ·{' '}
                    {gap.occurrences.length} source candidate
                    {gap.occurrences.length === 1 ? '' : 's'}
                  </small>
                  {gap.candidateEntryIds.length > 0 ? (
                    <p>
                      Candidate entries:{' '}
                      {gap.candidateEntryIds
                        .map((entryId) => entryLabelById.get(entryId) ?? entryId)
                        .join(', ')}
                    </p>
                  ) : (
                    <p>No existing catalog entry was assigned.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No atomized unresolved targets are waiting for catalog identity review.</p>
          )}
          {knowledge.catalogIdentityAudit.overlappingTerms.length > 0 ? (
            <details>
              <summary>
                Potential duplicate or overlapping catalog terms ·{' '}
                {knowledge.catalogIdentityAudit.overlappingTerms.length}
              </summary>
              <ul>
                {knowledge.catalogIdentityAudit.overlappingTerms.map((overlap) => (
                  <li key={overlap.id}>
                    <strong>{overlap.normalizedTerm}</strong> ·{' '}
                    {overlap.entryIds
                      .map((entryId) => entryLabelById.get(entryId) ?? entryId)
                      .join(', ')}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </details>
        {knowledge.unmappedCandidateSummaries.length > 0 ||
        knowledge.unmappedBibliographicCandidates.length > 0 ? (
          <details className="database-knowledge-lane">
            <summary>
              Unmapped semantic material · {knowledge.unmappedCandidateSummaries.length} opinion
              candidates · {knowledge.unmappedBibliographicCandidates.length} bibliography leads
            </summary>
            {knowledge.unmappedCandidateSummaries.length > 0 ? (
              <ul className="database-knowledge-card-list">
                {knowledge.unmappedCandidateSummaries.map((candidate) => (
                  <li key={candidate.id}>
                    <strong>{candidate.summary}</strong>
                    <small>
                      {humanize(candidate.reviewStatus)} · {humanize(candidate.currentness)}
                    </small>
                    {candidate.unresolvedTargets.length > 0 ? (
                      <ul>
                        {candidate.unresolvedTargets.map((target) => (
                          <li key={`${candidate.id}-${target.searchLabel}`}>
                            {target.searchLabel} · {humanize(target.role)} · {target.reason}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {knowledge.unmappedBibliographicCandidates.length > 0 ? (
              <ul>
                {knowledge.unmappedBibliographicCandidates.map((candidate) => (
                  <li key={candidate.id}>
                    {candidate.displayCitation} · {humanize(candidate.verificationStatus)}
                  </li>
                ))}
              </ul>
            ) : null}
          </details>
        ) : null}
        <details className="database-knowledge-lane">
          <summary>
            Formal source registry · {summary.registeredFormalSources} cataloged source
            {summary.registeredFormalSources === 1 ? '' : 's'}
          </summary>
          <p>
            Cataloging makes a source auditable; it does not attach that source to a clinical
            statement or approve a rule.
          </p>
          <ul className="database-knowledge-card-list">
            {knowledge.formalSourceRegistry.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  <strong>{source.title}</strong>
                </a>
                <small>
                  {humanize(source.sourceUseStatus)} ·{' '}
                  {source.derivedClinicalContentPermitted
                    ? 'derived authoring permitted'
                    : 'metadata only'}{' '}
                  ·{' '}
                  {source.runtimeRedistributionPermitted
                    ? 'runtime redistribution permitted'
                    : 'runtime redistribution blocked'}
                </small>
                <p>{source.citation}</p>
                {source.sourceUseDecisionId ? (
                  <small>
                    Decision: {source.sourceUseDecisionId}
                    {source.sourceUseReviewedAt
                      ? ` · reviewed ${new Date(source.sourceUseReviewedAt).toLocaleDateString()}`
                      : ''}
                  </small>
                ) : (
                  <small>No source-use decision recorded.</small>
                )}
              </li>
            ))}
          </ul>
        </details>
        <details className="database-knowledge-lane">
          <summary>Compilation boundaries and warnings · {knowledge.warnings.length}</summary>
          <ul>
            {knowledge.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      </div>
    </details>
  );
}

export function DeveloperDatabaseKnowledgePanel({
  knowledge,
  record,
  onOpenRelated,
}: {
  knowledge: DeveloperDatabaseKnowledgeProjection;
  record: DeveloperDatabaseRecord;
  onOpenRelated: (entryId: string) => void;
}) {
  const corpusUnitById = new Map(knowledge.corpusUnits.map((unit) => [unit.id, unit]));
  const sourceCounts = record.lexicalSignals.reduce(
    (counts, signal) => {
      counts[signal.sourceKind] += 1;
      return counts;
    },
    { apple_notes: 0, user_authored_archive: 0, private_drive_notes: 0 },
  );
  const dossierBrief = buildDeveloperDatabaseDossierBrief(knowledge, record);
  const potentialPatientFacts = [
    ...record.candidateSummaries,
    ...record.unresolvedCandidateMentions,
  ].filter((candidate) => candidate.contributionTypes.includes('patient_fact'));

  return (
    <section className="database-knowledge-panel" aria-labelledby="database-entry-knowledge-title">
      <div className="database-knowledge-heading">
        <div>
          <p className="eyebrow">Local Developer compilation</p>
          <h2 id="database-entry-knowledge-title">Cross-referenced knowledge</h2>
        </div>
        <span className={`knowledge-state-chip state-${record.compilationState}`}>
          {compilationStateLabel(record.compilationState)}
        </span>
      </div>
      <p className="database-knowledge-boundary">
        Personal-corpus matches are retrieval links, not clinical claims. Semantic candidates,
        formal-source contributions, executable rules, and point values are shown in separate lanes
        so their authority cannot be confused.
      </p>
      <section className="database-dossier-brief" aria-labelledby="database-dossier-brief-title">
        <p className="eyebrow">One-entry decision support</p>
        <h3 id="database-dossier-brief-title">Knowledge dossier brief</h3>
        <p>
          This exact concise brief, its entry revision fingerprint, and the complete source
          projection fingerprint will be preserved if you save an opinion below. Detailed lanes
          remain available for audit.
        </p>
        <pre>{dossierBrief.guidance}</pre>
      </section>
      <dl className="database-knowledge-metrics">
        <div>
          <dt>Personal source units</dt>
          <dd>{record.personalSourceUnitCount}</dd>
        </div>
        <div>
          <dt>Term matches</dt>
          <dd>{record.personalSourceTotalMatches}</dd>
        </div>
        <div>
          <dt>Semantic candidates</dt>
          <dd>{record.candidateSummaries.length}</dd>
        </div>
        <div>
          <dt>Formal contributions</dt>
          <dd>{record.formalContributions.length}</dd>
        </div>
        <div>
          <dt>Accepted Developer opinions</dt>
          <dd>
            {
              record.developerOpinions.filter((opinion) => opinion.reviewStatus === 'accepted')
                .length
            }
          </dd>
        </div>
        <div>
          <dt>Modeled rules</dt>
          <dd>{record.ruleSummaries.length}</dd>
        </div>
      </dl>

      <details className="database-knowledge-lane">
        <summary>
          Personal corpus index · {record.personalSourceUnitCount} linked unit
          {record.personalSourceUnitCount === 1 ? '' : 's'}
        </summary>
        <p>
          Apple Notes: {sourceCounts.apple_notes} · SharePoint/residency writing:{' '}
          {sourceCounts.user_authored_archive} · other private Drive notes:{' '}
          {sourceCounts.private_drive_notes}
        </p>
        {record.lexicalSignals.length > 0 ? (
          <ol className="database-source-signal-list">
            {record.lexicalSignals.map((signal) => {
              const unit = corpusUnitById.get(signal.unitId);
              return (
                <li key={signal.unitId}>
                  <div>
                    <strong>{unit?.displayLabel ?? personalSourceLabel(signal.sourceKind)}</strong>
                    <span>{personalSourceLabel(signal.sourceKind)}</span>
                  </div>
                  <p>
                    {signal.totalMatches} match{signal.totalMatches === 1 ? '' : 'es'} ·{' '}
                    {signal.matchedTerms
                      .map((match) => `${match.term} (${match.count})`)
                      .join(' · ')}
                  </p>
                  <small>
                    Surfaces: {signal.surfaces.map(humanize).join(' · ')} · semantic state:{' '}
                    {humanize(signal.semanticState)}
                    {signal.sourceModifiedAt
                      ? ` · source updated ${new Date(signal.sourceModifiedAt).toLocaleDateString()}`
                      : ''}
                  </small>
                </li>
              );
            })}
          </ol>
        ) : (
          <p>No current personal-corpus unit matched this entry’s indexed names or aliases.</p>
        )}
      </details>

      <details className="database-knowledge-lane">
        <summary>Developer-opinion candidates · {record.candidateSummaries.length}</summary>
        {record.candidateSummaries.length > 0 ? (
          <ul className="database-knowledge-card-list">
            {record.candidateSummaries.map((candidate) => (
              <li key={candidate.id}>
                <strong>{candidate.summary}</strong>
                <small>
                  {humanize(candidate.reviewStatus)} · {humanize(candidate.currentness)} ·{' '}
                  {candidate.contributionTypes.map(humanize).join(' · ') ||
                    'contribution type not yet classified'}
                </small>
                {candidate.resolvedTargets.length > 0 ? (
                  <p>
                    Resolved relationships:{' '}
                    {candidate.resolvedTargets
                      .map(
                        (target) =>
                          `${humanize(target.role)} ${target.targetContentId} (${humanize(
                            target.targetKind,
                          )})`,
                      )
                      .join(' · ')}
                  </p>
                ) : null}
                {candidate.evidenceRelations.length > 0 ? (
                  <p>
                    Evidence links:{' '}
                    {candidate.evidenceRelations
                      .map(
                        (relation) =>
                          `${humanize(relation.relationship)} ${relation.evidenceSourceId}${
                            relation.stillExpertBridge ? ' + developer opinion' : ''
                          }`,
                      )
                      .join(' · ')}
                  </p>
                ) : (
                  <p>No formal evidence is attached; this remains Developer opinion.</p>
                )}
                {candidate.unresolvedTargets.length > 0 ? (
                  <details className="database-source-use-details">
                    <summary>
                      Unresolved database identities · {candidate.unresolvedTargets.length}
                    </summary>
                    <ul>
                      {candidate.unresolvedTargets.map((target) => (
                        <li key={`${candidate.id}-${target.searchLabel}`}>
                          <strong>{target.searchLabel}</strong> · {humanize(target.role)}
                          {target.targetKindHint
                            ? ` · expected ${humanize(target.targetKindHint)}`
                            : ''}
                          <p>{target.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No personal-corpus statement has yet been atomized into a semantic candidate for this
            entry.
          </p>
        )}
        {record.bibliographicCandidates.length > 0 ? (
          <div className="database-bibliography-candidates">
            <h3>Bibliographic leads from the personal corpus</h3>
            <ul>
              {record.bibliographicCandidates.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.displayCitation} · {humanize(candidate.verificationStatus)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </details>

      <details className="database-knowledge-lane">
        <summary>Accepted Developer opinions · {record.developerOpinions.length}</summary>
        {record.developerOpinions.length > 0 ? (
          <ul className="database-knowledge-card-list">
            {record.developerOpinions.map((opinion) => (
              <li key={opinion.id}>
                <strong>{opinion.summary}</strong>
                <small>
                  {humanize(opinion.reviewStatus)} · reviewed{' '}
                  {new Date(opinion.reviewedAt).toLocaleDateString()} ·{' '}
                  {opinion.contributionTypes.map(humanize).join(' · ')}
                </small>
                <p>{opinion.reviewNote}</p>
                {opinion.evidenceRelationships.length > 0 ? (
                  <ul>
                    {opinion.evidenceRelationships.map((relationship) => (
                      <li key={relationship.id}>
                        <strong>
                          {humanize(relationship.relationType)} ·{' '}
                          {relationship.evidenceSource.title}
                        </strong>
                        <p>{relationship.relationshipSummary}</p>
                        <small>
                          {relationship.stillExpertBridge
                            ? 'Source relationship + Developer opinion'
                            : 'Source relationship'}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No formal evidence relationship is attached; this remains Developer opinion.
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No accepted Developer opinion is attached to this entry.</p>
        )}
      </details>

      <details className="database-knowledge-lane">
        <summary>
          Unresolved cross-target material · {record.unresolvedCandidateMentions.length}
        </summary>
        <p>
          These atomized candidates name this database entry, but the target relationship has not
          been resolved. They are visible for review and have no rule or point effect.
        </p>
        {record.unresolvedCandidateMentions.length > 0 ? (
          <ul className="database-knowledge-card-list">
            {record.unresolvedCandidateMentions.map((candidate) => (
              <li key={candidate.id}>
                <strong>{candidate.summary}</strong>
                <small>
                  {candidate.contributionTypes.map(humanize).join(' · ') ||
                    'contribution type not yet classified'}
                </small>
                {candidate.resolvedTargets.length > 0 ? (
                  <p>
                    Existing resolved relationships:{' '}
                    {candidate.resolvedTargets
                      .map((target) => `${humanize(target.role)} ${target.targetContentId}`)
                      .join(' · ')}
                  </p>
                ) : null}
                <ul>
                  {candidate.unresolvedTargets
                    .filter((target) =>
                      record.indexedTerms.some(
                        (term) =>
                          term.trim().toLocaleLowerCase('en-US') ===
                          target.searchLabel.trim().toLocaleLowerCase('en-US'),
                      ),
                    )
                    .map((target) => (
                      <li key={`${candidate.id}-${target.searchLabel}`}>
                        {target.searchLabel} · {humanize(target.role)} · {target.reason}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>No unresolved atomized candidate currently names this entry.</p>
        )}
      </details>

      <details className="database-knowledge-lane">
        <summary>Potential patient/randomization inputs · {potentialPatientFacts.length}</summary>
        <p>
          Only semantically classified <code>patient_fact</code> candidates appear here. They are
          review prompts—not generated facts, weights, tags, rules, or points.
        </p>
        {potentialPatientFacts.length > 0 ? (
          <ul className="database-knowledge-card-list">
            {potentialPatientFacts.map((candidate) => (
              <li key={candidate.id}>
                <strong>{candidate.summary}</strong>
                <small>
                  Proposed patient-fact material · runtime effect: none · medical review: unreviewed
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No semantically classified patient-fact candidate is attached. Lexical matches are never
            promoted into randomization inputs.
          </p>
        )}
      </details>

      <details className="database-knowledge-lane">
        <summary>Formal-source contributions · {record.formalContributions.length}</summary>
        {record.formalContributions.length > 0 ? (
          <ul className="database-knowledge-card-list">
            {record.formalContributions.map((contribution) => (
              <li key={contribution.id}>
                <strong>{contribution.summary}</strong>
                <small>
                  {humanize(contribution.authority)} · medical review{' '}
                  {humanize(contribution.medicalReviewStatus)}
                </small>
                <ul>
                  {contribution.evidenceSources.map((source) => (
                    <li key={source.id}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      <span>
                        {' '}
                        · {humanize(source.sourceUseStatus)} ·{' '}
                        {source.derivedClinicalContentPermitted
                          ? 'derived use permitted'
                          : 'metadata only'}{' '}
                        ·{' '}
                        {source.runtimeRedistributionPermitted
                          ? 'runtime redistribution permitted'
                          : 'runtime redistribution blocked'}
                      </span>
                      {source.sourceUseReviewedAt ? (
                        <small>
                          Source-use review:{' '}
                          {new Date(source.sourceUseReviewedAt).toLocaleDateString()}
                          {source.sourceUseDecisionId
                            ? ` · decision ${source.sourceUseDecisionId}`
                            : ''}
                        </small>
                      ) : null}
                      {source.attributionStatement || source.requiredNotices.length > 0 ? (
                        <details className="database-source-use-details">
                          <summary>Source-use attribution and notices</summary>
                          {source.attributionStatement ? (
                            <p>{source.attributionStatement}</p>
                          ) : null}
                          {source.requiredNotices.length > 0 ? (
                            <ul>
                              {source.requiredNotices.map((notice) => (
                                <li key={notice}>{notice}</li>
                              ))}
                            </ul>
                          ) : null}
                        </details>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>No formal clinical contribution is attached to this entry yet.</p>
        )}
      </details>

      <details className="database-knowledge-lane">
        <summary>Executable and proposed rule lane · {record.ruleSummaries.length}</summary>
        {record.ruleSummaries.length > 0 ? (
          <ul className="database-knowledge-card-list">
            {record.ruleSummaries.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.summary}</strong>
                <small>
                  {humanize(rule.ruleKind)} · medical review {humanize(rule.medicalReviewStatus)}
                  {rule.pointDelta === null
                    ? ''
                    : ` · ${rule.pointDelta >= 0 ? '+' : ''}${rule.pointDelta} points`}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No diagnosis or medication-fit rule is currently compiled for this entry.</p>
        )}
      </details>

      {record.relatedEntryIds.length > 0 ? (
        <div className="database-related-entries">
          <h3>Related database entries</h3>
          <div>
            {record.relatedEntryIds.map((entryId) => {
              const related = knowledge.records.find((candidate) => candidate.entryId === entryId);
              return (
                <button
                  className="small-button"
                  type="button"
                  key={entryId}
                  onClick={() => onOpenRelated(entryId)}
                >
                  {related?.label ?? entryId}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
