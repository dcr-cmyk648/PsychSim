import {
  LiteratureSynthesisProposalSchema,
  SourceUseDecisionCatalogSchema,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import sourceUseDecisionsJson from '../../../content/catalogs/evidence/source-use-decisions.json';
import { catalogs } from './content';
import {
  developerCaseBlueprints,
  developerClinicalAuditTickets,
  developerSourceRequests,
} from './developer-content';
import {
  developerLiteratureSynthesisProposals,
  validateLiteratureSynthesisProposals,
} from './literature-synthesis';

const sourceUseDecisions = SourceUseDecisionCatalogSchema.parse(sourceUseDecisionsJson).decisions;

const validate = (
  proposals = developerLiteratureSynthesisProposals,
  decisions = sourceUseDecisions,
) =>
  validateLiteratureSynthesisProposals(
    proposals,
    catalogs.evidenceSources,
    decisions,
    developerCaseBlueprints,
    developerClinicalAuditTickets,
    developerSourceRequests,
  );

describe('developer literature synthesis proposals', () => {
  it('loads one unreviewed, point-excluded proposal with exact workflow links', () => {
    expect(developerLiteratureSynthesisProposals).toEqual([
      expect.objectContaining({
        id: 'literature-synthesis.mdd.initial-modality.2026-07-24',
        linkedTicketIds: ['ticket.source.canmat-mdd.initial-modality'],
        linkedSourceRequestIds: ['source-request.mdd.severity-thresholds'],
        blueprintIds: ['case.first-visit-depression'],
        pointMagnitudeExcluded: true,
        medicalReviewStatus: 'unreviewed',
      }),
    ]);
    expect(validate()).toEqual({ valid: true, issues: [] });
  });

  it('prevents metadata-only sources from supporting the proposed direction', () => {
    for (const sourceId of [
      'literature-source.acp-mdd-update-alert-4.2026',
      'literature-source.cohen-ipt-antidepressant-ipd-meta-analysis.2024',
    ]) {
      const invalid = structuredClone(developerLiteratureSynthesisProposals[0]!);
      const source = invalid.sources.find((candidate) => candidate.id === sourceId)!;
      source.supportsProposedDirection = true;
      source.findingRole = 'supports';
      expect(LiteratureSynthesisProposalSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it('requires source-use clearance for the cataloged supporting record', () => {
    const decisionsWithoutCanmat = sourceUseDecisions.filter(
      (decision) => decision.evidenceSourceId !== 'evidence.canmat.mdd-adults.2023-update',
    );
    expect(validate(developerLiteratureSynthesisProposals, decisionsWithoutCanmat).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'LITERATURE_SYNTHESIS_SOURCE_NOT_CLEARED' }),
      ]),
    );
  });

  it('rejects request/ticket mismatches, unknown blueprints, and catalog metadata drift', () => {
    const mismatch = structuredClone(developerLiteratureSynthesisProposals[0]!);
    mismatch.linkedSourceRequestIds = ['source-request.ecg.monitoring-necessity'];
    mismatch.blueprintIds = ['case.does-not-exist'];
    const support = mismatch.sources.find((source) => source.supportsProposedDirection)!;
    support.title = 'Drifted title';

    expect(validate([mismatch]).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'LITERATURE_SYNTHESIS_REQUEST_TICKET_MISMATCH' }),
        expect.objectContaining({ code: 'INVALID_LITERATURE_SYNTHESIS_BLUEPRINT' }),
        expect.objectContaining({ code: 'LITERATURE_SYNTHESIS_TICKET_BLUEPRINT_MISMATCH' }),
        expect.objectContaining({ code: 'LITERATURE_SYNTHESIS_EVIDENCE_METADATA_DRIFT' }),
      ]),
    );
  });
});
