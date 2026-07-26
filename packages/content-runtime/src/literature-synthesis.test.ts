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
  it('loads unreviewed, point-excluded proposals with exact workflow links', () => {
    expect(developerLiteratureSynthesisProposals).toHaveLength(22);
    expect(developerLiteratureSynthesisProposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'literature-synthesis.mdd.initial-modality.2026-07-24',
          linkedTicketIds: ['ticket.source.canmat-mdd.initial-modality'],
          linkedSourceRequestIds: ['source-request.mdd.severity-thresholds'],
          blueprintIds: ['case.first-visit-depression'],
          pointMagnitudeExcluded: true,
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'literature-synthesis.ecg.disposition.2026-07-26',
          linkedTicketIds: ['ticket.audit.m2-ecg-disposition'],
          linkedSourceRequestIds: ['source-request.ecg.normal-result-disposition'],
          blueprintIds: ['case.medication-check-palpitations'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.bupropion.seizure-history.2026-07-26',
          linkedTicketIds: ['ticket.source.bupropion.seizure-history-nuance'],
          linkedSourceRequestIds: ['source-request.bupropion.seizure-history'],
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.cyclothymia.duration.2026-07-26',
          linkedSourceRequestIds: ['source-request.cyclothymia.duration-discrimination'],
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'literature-synthesis.who-mhgap.dep1-antidepressant-baseline.2026-07-26',
          linkedTicketIds: ['ticket.source.who-mhgap.dep1-antidepressant-baseline'],
          linkedSourceRequestIds: ['source-request.mdd.severity-thresholds'],
          blueprintIds: ['case.review.who-mhgap-mdd-initial'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.who-mhgap.dep2-continuation-snapshot.2026-07-26',
          linkedTicketIds: ['ticket.source.who-mhgap.dep2-continuation-patient'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.who-mhgap.dep3-psychotherapy-catalog.2026-07-26',
          linkedTicketIds: ['ticket.source.who-mhgap.dep3-psychotherapy-catalog'],
          blueprintIds: ['case.review.who-mhgap-mdd-initial'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.who-mhgap.dep4-treatment-modality.2026-07-26',
          linkedTicketIds: ['ticket.source.who-mhgap.dep4-treatment-modality'],
          linkedSourceRequestIds: ['source-request.mdd.severity-thresholds'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.bap-catatonia.snapshot-relevance.2026-07-26',
          linkedTicketIds: ['ticket.source.bap-catatonia.2023-intake'],
          pointMagnitudeExcluded: true,
          medicalReviewStatus: 'unreviewed',
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.severity-generator-policy.2026-07-26',
          linkedTicketIds: ['ticket.source.mdd.severity-generator-policy'],
          linkedSourceRequestIds: ['source-request.mdd.severity-thresholds'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.antidepressant-fit-frame.2026-07-26',
          linkedTicketIds: ['ticket.source.canmat-mdd.antidepressant-baseline'],
          linkedSourceRequestIds: ['source-request.mdd.antidepressant-fit-dimensions'],
          blueprintIds: ['case.first-visit-depression'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.antidepressant-sleep-fit.2026-07-26',
          linkedTicketIds: ['ticket.source.mdd.antidepressant-sleep-fit'],
          linkedSourceRequestIds: ['source-request.mdd.antidepressant-fit-dimensions'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.antidepressant-weight-fit.2026-07-26',
          linkedTicketIds: ['ticket.source.mdd.antidepressant-weight-fit'],
          linkedSourceRequestIds: ['source-request.mdd.antidepressant-fit-dimensions'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.antidepressant-sexual-adherence-fit.2026-07-26',
          linkedTicketIds: ['ticket.source.mdd.antidepressant-sexual-adherence-fit'],
          linkedSourceRequestIds: ['source-request.mdd.antidepressant-fit-dimensions'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.tsh-workup-threshold.2026-07-26',
          linkedTicketIds: ['ticket.source.mdd.tsh-workup-threshold'],
          linkedSourceRequestIds: ['source-request.mdd.tsh-workup'],
          blueprintIds: ['case.first-visit-depression'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.suicide-risk-disposition.2026-07-26',
          linkedTicketIds: [
            'ticket.source.canmat-mdd.disposition-severity',
            'ticket.source.va-dod-suicide-risk.2024-intake',
          ],
          linkedSourceRequestIds: ['source-request.mdd.suicide-risk-disposition'],
          blueprintIds: ['case.first-visit-depression'],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.canmat-mdd.regimen-intent-taxonomy.2026-07-26',
          linkedTicketIds: ['ticket.source.canmat-mdd.regimen-intent-taxonomy'],
          linkedSourceRequestIds: ['source-request.medications.regimen-combination-boundaries'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.canmat-mdd.inadequate-response-route.2026-07-26',
          linkedTicketIds: ['ticket.source.canmat-mdd.inadequate-response-route'],
          linkedSourceRequestIds: ['source-request.medications.regimen-combination-boundaries'],
          blueprintIds: [],
        }),
        expect.objectContaining({
          id: 'literature-synthesis.canmat-mdd.switch-transition-state.2026-07-26',
          linkedTicketIds: ['ticket.source.canmat-mdd.switch-transition-state'],
          linkedSourceRequestIds: ['source-request.medications.regimen-combination-boundaries'],
          blueprintIds: [],
        }),
      ]),
    );
    expect(
      new Set(developerLiteratureSynthesisProposals.flatMap((proposal) => proposal.linkedTicketIds))
        .size,
    ).toBe(
      developerLiteratureSynthesisProposals.flatMap((proposal) => proposal.linkedTicketIds).length,
    );
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

  it('requires WHO source-use clearance for every DEP packet', () => {
    const decisionsWithoutWho = sourceUseDecisions.filter(
      (decision) => decision.evidenceSourceId !== 'evidence.who.mhgap-mns.2023',
    );
    const whoProposals = developerLiteratureSynthesisProposals.filter((proposal) =>
      proposal.id.startsWith('literature-synthesis.who-mhgap.'),
    );
    expect(validate(whoProposals, decisionsWithoutWho).issues).toHaveLength(4);
    expect(validate(whoProposals, decisionsWithoutWho).issues).toEqual(
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
