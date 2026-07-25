import {
  LiteratureSynthesisProposalSchema,
  type CaseBlueprint,
  type ClinicalReviewTicket,
  type EvidenceSourceDefinition,
  type LiteratureSynthesisProposal,
  type SourceRequest,
  type SourceUseDecision,
} from '@psychsim/schemas';

import proposalsJson from '../../../content/cases/review/literature-synthesis.proposals.json';

export interface LiteratureSynthesisValidationIssue {
  severity: 'error';
  code: string;
  message: string;
}

export interface LiteratureSynthesisValidationReport {
  valid: boolean;
  issues: LiteratureSynthesisValidationIssue[];
}

export const developerLiteratureSynthesisProposals: readonly LiteratureSynthesisProposal[] =
  LiteratureSynthesisProposalSchema.array().parse(proposalsJson);

const duplicateIds = (ids: readonly string[]): string[] => [
  ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
];

const normalizeNullable = (value: string | null | undefined): string | null => value ?? null;

export const validateLiteratureSynthesisProposals = (
  proposals: readonly LiteratureSynthesisProposal[],
  evidenceSources: readonly EvidenceSourceDefinition[],
  sourceUseDecisions: readonly SourceUseDecision[],
  blueprints: readonly CaseBlueprint[],
  tickets: readonly ClinicalReviewTicket[],
  sourceRequests: readonly SourceRequest[],
): LiteratureSynthesisValidationReport => {
  const issues: LiteratureSynthesisValidationIssue[] = [];
  const add = (code: string, message: string): void => {
    issues.push({ severity: 'error', code, message });
  };
  const ticketsById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const requestsById = new Map(sourceRequests.map((request) => [request.id, request]));
  const blueprintIds = new Set(blueprints.map((blueprint) => blueprint.id));
  const evidenceById = new Map(evidenceSources.map((source) => [source.id, source]));
  const decisionsByEvidenceId = new Map(
    sourceUseDecisions.map((decision) => [decision.evidenceSourceId, decision]),
  );

  for (const id of duplicateIds(proposals.map((proposal) => proposal.id))) {
    add('DUPLICATE_LITERATURE_SYNTHESIS_ID', id);
  }

  for (const proposal of proposals) {
    for (const sourceId of duplicateIds(proposal.sources.map((source) => source.id))) {
      add('DUPLICATE_LITERATURE_SYNTHESIS_SOURCE_ID', `${proposal.id}: ${sourceId}`);
    }
    if (!proposal.sources.some((source) => source.supportsProposedDirection)) {
      add(
        'LITERATURE_SYNTHESIS_MISSING_SUPPORT',
        `${proposal.id} has no source-cleared support for its proposed direction.`,
      );
    }

    for (const ticketId of proposal.linkedTicketIds) {
      if (!ticketsById.has(ticketId)) {
        add('INVALID_LITERATURE_SYNTHESIS_TICKET', `${proposal.id}: ${ticketId}`);
      }
    }
    for (const requestId of proposal.linkedSourceRequestIds) {
      const request = requestsById.get(requestId);
      if (!request) {
        add('INVALID_LITERATURE_SYNTHESIS_SOURCE_REQUEST', `${proposal.id}: ${requestId}`);
        continue;
      }
      if (
        !proposal.linkedTicketIds.some((ticketId) => request.linkedTicketIds.includes(ticketId))
      ) {
        add(
          'LITERATURE_SYNTHESIS_REQUEST_TICKET_MISMATCH',
          `${proposal.id}: ${requestId} is not linked to any proposal ticket.`,
        );
      }
    }
    for (const blueprintId of proposal.blueprintIds) {
      if (!blueprintIds.has(blueprintId)) {
        add('INVALID_LITERATURE_SYNTHESIS_BLUEPRINT', `${proposal.id}: ${blueprintId}`);
      }
    }
    for (const ticketId of proposal.linkedTicketIds) {
      const ticket = ticketsById.get(ticketId);
      if (
        ticket?.blueprintId &&
        proposal.blueprintIds.length > 0 &&
        !proposal.blueprintIds.includes(ticket.blueprintId)
      ) {
        add(
          'LITERATURE_SYNTHESIS_TICKET_BLUEPRINT_MISMATCH',
          `${proposal.id}: ${ticketId} targets ${ticket.blueprintId}.`,
        );
      }
    }

    for (const source of proposal.sources) {
      if (source.supportsProposedDirection && source.findingRole !== 'supports') {
        add(
          'LITERATURE_SYNTHESIS_SUPPORT_ROLE_MISMATCH',
          `${proposal.id}: ${source.id} is marked as support without a supporting role.`,
        );
      }
      if (source.accessStatus !== 'cataloged_and_cleared') continue;
      const evidence = source.evidenceSourceId
        ? evidenceById.get(source.evidenceSourceId)
        : undefined;
      if (!evidence) {
        add(
          'INVALID_LITERATURE_SYNTHESIS_EVIDENCE',
          `${proposal.id}: ${source.evidenceSourceId ?? source.id}`,
        );
        continue;
      }
      const decision = decisionsByEvidenceId.get(evidence.id);
      if (
        !decision ||
        decision.decisionStatus !== 'permitted_with_conditions' ||
        !decision.permissions.aiAssistedProcessing ||
        !decision.permissions.derivedClinicalContent
      ) {
        add(
          'LITERATURE_SYNTHESIS_SOURCE_NOT_CLEARED',
          `${proposal.id}: ${evidence.id} lacks a source-use decision that permits synthesis.`,
        );
      }
      const metadataMatches =
        source.title === evidence.title &&
        source.publicationYear === evidence.publicationYear &&
        normalizeNullable(source.doi) === normalizeNullable(evidence.doi) &&
        normalizeNullable(source.pmid) === normalizeNullable(evidence.pmid) &&
        source.url === evidence.url;
      if (!metadataMatches) {
        add(
          'LITERATURE_SYNTHESIS_EVIDENCE_METADATA_DRIFT',
          `${proposal.id}: ${source.id} no longer matches ${evidence.id}.`,
        );
      }
    }
  }

  return { valid: issues.length === 0, issues };
};
