import {
  ClinicalReviewTicketSchema,
  type ClinicalReviewTicket,
  type DeveloperDatabaseKnowledgeProjection,
} from '@psychsim/schemas';

type DeveloperDatabaseRecord = DeveloperDatabaseKnowledgeProjection['records'][number];

export interface DeveloperDatabaseDossierSection {
  label: string;
  items: readonly string[];
}

export interface DeveloperDatabaseDossierBrief {
  entryId: string;
  projectionFingerprint: string;
  dossierFingerprint: string;
  overview: string;
  sections: readonly DeveloperDatabaseDossierSection[];
  gaps: readonly string[];
  reviewPrompt: string;
  guidance: string;
}

const humanize = (value: string): string => value.replaceAll('_', ' ').replaceAll('-', ' ');

const deterministicDigest = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  return [
    0x811c9dc5, 0x9e3779b1, 0x85ebca77, 0xc2b2ae3d, 0x27d4eb2f, 0x165667b1, 0xd3a2646c, 0xfd7046c5,
  ]
    .map((seed) => {
      let hash = seed;
      for (const byte of bytes) {
        hash ^= byte;
        hash = Math.imul(hash, 0x01000193);
      }
      return (hash >>> 0).toString(16).padStart(8, '0');
    })
    .join('');
};

const summarize = (items: readonly string[], limit: number): string[] => {
  const shown = items.slice(0, limit);
  const remaining = items.length - shown.length;
  return remaining > 0 ? [...shown, `…and ${remaining} more in the detailed lane below.`] : shown;
};

const sourceCoverage = (
  knowledge: DeveloperDatabaseKnowledgeProjection,
  record: DeveloperDatabaseRecord,
) => {
  const unitsById = new Map(knowledge.corpusUnits.map((unit) => [unit.id, unit]));
  const linkedUnits = record.lexicalSignals.flatMap((signal) => {
    const unit = unitsById.get(signal.unitId);
    return unit ? [unit] : [];
  });
  return {
    notSemanticallyReviewed: linkedUnits.filter((unit) =>
      ['not_semantically_reviewed', 'queued', 'partially_classified'].includes(unit.semanticState),
    ).length,
    partialOrQuarantined: linkedUnits.filter(
      (unit) => unit.accessState !== 'fully_indexed' || unit.boundaryState !== 'complete',
    ).length,
  };
};

const ticketTypeFor = (
  categoryId: DeveloperDatabaseRecord['categoryId'],
): ClinicalReviewTicket['ticketType'] => {
  switch (categoryId) {
    case 'medications':
      return 'medication_fit';
    case 'supplements':
      return 'source_gap';
    case 'conditions':
    case 'interventions':
    case 'dispositions':
      return 'treatment_pathway';
    case 'tests':
    case 'investigations':
      return 'test_generation';
    case 'references':
      return 'source_gap';
  }
};

export const databaseDossierTicketId = (entryId: string, dossierFingerprint: string): string => {
  const readableEntry = entryId.slice(0, 56);
  const entryDigest = deterministicDigest(entryId).slice(0, 8);
  return `ticket.database-dossier.${readableEntry}.${entryDigest}.${dossierFingerprint.slice(0, 16)}`;
};

export const buildDeveloperDatabaseDossierBrief = (
  knowledge: DeveloperDatabaseKnowledgeProjection,
  record: DeveloperDatabaseRecord,
): DeveloperDatabaseDossierBrief => {
  if (!knowledge.records.some((candidate) => candidate === record)) {
    const current = knowledge.records.find((candidate) => candidate.entryId === record.entryId);
    if (!current || JSON.stringify(current) !== JSON.stringify(record)) {
      throw new Error(`${record.entryId} is not part of this Developer database projection.`);
    }
  }

  const coverage = sourceCoverage(knowledge, record);
  const directCandidateSummaries = record.candidateSummaries.map(
    (candidate) =>
      `${candidate.summary} [${humanize(candidate.reviewStatus)}; ${
        candidate.contributionTypes.map(humanize).join(', ') || 'type not yet classified'
      }]`,
  );
  const unresolvedMentionSummaries = record.unresolvedCandidateMentions.map(
    (candidate) =>
      `${candidate.summary} [unresolved link to this entry; ${
        candidate.resolvedTargets
          .map((target) => `${humanize(target.role)}: ${target.targetContentId}`)
          .join(', ') || 'no resolved co-target'
      }]`,
  );
  const bibliographySummaries = record.bibliographicCandidates.map(
    (candidate) => `${candidate.displayCitation} [${humanize(candidate.verificationStatus)}]`,
  );
  const formalContributionSummaries = record.formalContributions.map(
    (contribution) =>
      `${contribution.summary} [${humanize(contribution.authority)}; ${humanize(
        contribution.medicalReviewStatus,
      )}]`,
  );
  const developerOpinionSummaries = record.developerOpinions.map(
    (opinion) =>
      `${opinion.summary} [Developer opinion; ${humanize(opinion.reviewStatus)}; ${
        opinion.evidenceRelationships.length
      } evidence relationship(s)]`,
  );
  const currentRuleSummaries = record.ruleSummaries.map(
    (rule) =>
      `${rule.summary} [${
        rule.pointDelta === null
          ? 'no point magnitude'
          : `${rule.pointDelta >= 0 ? '+' : ''}${rule.pointDelta} points`
      }; ${humanize(rule.medicalReviewStatus)}]`,
  );
  const potentialPatientFacts = [
    ...record.candidateSummaries,
    ...record.unresolvedCandidateMentions,
  ]
    .filter((candidate) => candidate.contributionTypes.includes('patient_fact'))
    .map((candidate) => candidate.summary);
  const relatedEntries = record.relatedEntryIds.map((entryId) => {
    const related = knowledge.records.find((candidate) => candidate.entryId === entryId);
    return related ? `${related.label} (${entryId})` : entryId;
  });

  const sections: DeveloperDatabaseDossierSection[] = [
    {
      label: 'Candidate knowledge',
      items:
        directCandidateSummaries.length > 0
          ? summarize(directCandidateSummaries, 5)
          : ['No semantic candidate is directly mapped to this entry.'],
    },
    {
      label: 'Unresolved cross-target material',
      items:
        unresolvedMentionSummaries.length > 0
          ? summarize(unresolvedMentionSummaries, 5)
          : ['No atomized candidate currently names this entry as an unresolved target.'],
    },
    {
      label: 'Bibliography and formal support',
      items: [
        ...(bibliographySummaries.length > 0
          ? summarize(bibliographySummaries, 3)
          : ['No bibliographic lead is attached.']),
        ...(formalContributionSummaries.length > 0
          ? summarize(formalContributionSummaries, 4)
          : ['No source-use-cleared formal contribution is attached.']),
      ],
    },
    {
      label: 'Accepted Developer interpretation',
      items:
        developerOpinionSummaries.length > 0
          ? summarize(developerOpinionSummaries, 3)
          : ['No accepted Developer opinion is attached.'],
    },
    {
      label: 'Shared entry-level gameplay implementation',
      items:
        currentRuleSummaries.length > 0
          ? summarize(currentRuleSummaries, 6)
          : [
              'No shared diagnosis, medication-fit, author-override, or point rule is compiled for this entry. Case-owned combination and safety rules are outside this lane.',
            ],
    },
    {
      label: 'Potential patient/randomization inputs',
      items:
        potentialPatientFacts.length > 0
          ? [
              ...summarize(potentialPatientFacts, 5),
              'These remain review candidates only. Lexical matches never become randomization inputs.',
            ]
          : [
              'No semantically classified patient-fact candidate is attached. Lexical matches never become randomization inputs.',
            ],
    },
    {
      label: 'Related database entries',
      items: relatedEntries.length > 0 ? summarize(relatedEntries, 6) : ['None currently linked.'],
    },
  ];

  const gaps = [
    ...(coverage.notSemanticallyReviewed > 0
      ? [
          `${coverage.notSemanticallyReviewed} linked personal-source unit(s) still need semantic review.`,
        ]
      : []),
    ...(coverage.partialOrQuarantined > 0
      ? [
          `${coverage.partialOrQuarantined} linked source unit(s) have partial access, a boundary warning, or quarantine state.`,
        ]
      : []),
    ...(record.unresolvedCandidateMentions.length > 0
      ? [
          `${record.unresolvedCandidateMentions.length} atomized candidate(s) name this entry but are not yet resolved to it.`,
        ]
      : []),
    ...(record.bibliographicCandidates.some(
      (candidate) => candidate.verificationStatus !== 'verified_match',
    )
      ? ['One or more bibliography leads remain unverified.']
      : []),
    ...(record.formalContributions.length === 0
      ? ['No formal contribution currently supports an entry-level clinical statement.']
      : []),
    ...(record.ruleSummaries.length === 0
      ? ['No entry-level executable or proposed gameplay rule is compiled.']
      : []),
    'No entry-level randomization rule is compiled. Any patient-generation implication requires a separate typed, deterministic proposal and validation.',
  ];

  const overview = [
    `${record.label} is currently ${humanize(record.compilationState)}.`,
    `${record.personalSourceUnitCount} personal-source unit(s) produced ${record.personalSourceTotalMatches} lexical match(es).`,
    `${record.candidateSummaries.length} direct semantic candidate(s), ${record.unresolvedCandidateMentions.length} unresolved cross-target candidate(s), ${record.formalContributions.length} formal contribution(s), ${record.developerOpinions.length} accepted or historical Developer opinion(s), and ${record.ruleSummaries.length} modeled rule(s) are visible in separate authority lanes.`,
  ].join(' ');
  const reviewPrompt =
    'Give your interpretation of this entry. Note any patient features that should affect fit, important safety or interaction concerns, possible patient-generation inputs, and whether a point direction or magnitude should be considered. Saving this review creates no rule or score change.';
  const guidance = [
    `Knowledge dossier decision brief: ${record.label} (${record.entryId})`,
    '',
    overview,
    '',
    ...sections.flatMap((section) => [
      `${section.label}:`,
      ...section.items.map((item) => `- ${item}`),
      '',
    ]),
    'Known gaps:',
    ...gaps.map((gap) => `- ${gap}`),
    '',
    `Decision requested: ${reviewPrompt}`,
  ].join('\n');
  if (guidance.length > 4000) {
    throw new Error(`${record.entryId} produced an oversized dossier decision brief.`);
  }
  const dossierFingerprint = deterministicDigest(guidance);

  return {
    entryId: record.entryId,
    projectionFingerprint: knowledge.inputFingerprint,
    dossierFingerprint,
    overview,
    sections,
    gaps,
    reviewPrompt,
    guidance,
  };
};

export const buildDeveloperDatabaseDossierReviewTicket = (input: {
  knowledge: DeveloperDatabaseKnowledgeProjection;
  record: DeveloperDatabaseRecord;
  reviewerNotes: string;
  timestamp: string;
  existingTicket?: ClinicalReviewTicket;
}): ClinicalReviewTicket => {
  const brief = buildDeveloperDatabaseDossierBrief(input.knowledge, input.record);
  const id = databaseDossierTicketId(input.record.entryId, brief.dossierFingerprint);
  if (
    input.existingTicket &&
    (input.existingTicket.id !== id ||
      input.existingTicket.guidance !== brief.guidance ||
      input.existingTicket.targetContentIds.join('|') !== input.record.entryId)
  ) {
    throw new Error('An existing dossier review does not match the current immutable brief.');
  }
  const reviewerNotes = input.reviewerNotes.trim();
  if (!reviewerNotes) {
    throw new Error('A dossier review ticket requires reviewer prose.');
  }
  return ClinicalReviewTicketSchema.parse({
    schemaVersion: 1,
    id,
    title: `Review ${input.record.label} knowledge dossier`,
    sourceKind: 'engine_audit',
    sourceAuthority: 'developer_observation',
    ticketType: ticketTypeFor(input.record.categoryId),
    priority: 'medium',
    status: 'in_review',
    requiresClinicalAcumen: true,
    attemptId: null,
    blueprintId: null,
    caseContentVersion: null,
    receiptItemId: null,
    receiptItemSnapshot: null,
    targetContentIds: [input.record.entryId],
    dependencyTicketIds: [],
    conflictContentIds: [],
    proposedRouting:
      'Codex must atomize this prose into separate evidence/opinion, patient-fact or generation, clinical-rule, safety/interaction, and balance proposals. Do not activate any rule, randomizer input, or point value from this review alone.',
    guidance: brief.guidance,
    sourceReviewSnapshot: null,
    reviewerNotes,
    reviewerNotesUpdatedAt:
      input.existingTicket?.reviewerNotes === reviewerNotes
        ? input.existingTicket.reviewerNotesUpdatedAt
        : input.timestamp,
    resurfacingTrigger: `Re-review when entry dossier fingerprint changes from ${brief.dossierFingerprint}. Complete source projection at review: ${input.knowledge.inputFingerprint}.`,
    resolution: null,
    createdAt: input.existingTicket?.createdAt ?? input.timestamp,
    updatedAt: input.timestamp,
  });
};

export const findCurrentDeveloperDatabaseDossierReview = (
  knowledge: DeveloperDatabaseKnowledgeProjection,
  entryId: string,
  tickets: readonly ClinicalReviewTicket[],
): ClinicalReviewTicket | undefined => {
  const record = knowledge.records.find((candidate) => candidate.entryId === entryId);
  if (!record) return undefined;
  const id = databaseDossierTicketId(
    entryId,
    buildDeveloperDatabaseDossierBrief(knowledge, record).dossierFingerprint,
  );
  return tickets.find((ticket) => ticket.id === id);
};
