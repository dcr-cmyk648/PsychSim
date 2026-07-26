import { describe, expect, it } from 'vitest';
import { SourceRequestSchema } from '@psychsim/schemas';

import { catalogs } from './content';
import {
  developerCaseBlueprints,
  developerClinicalAuditTickets,
  developerLiteratureSynthesisProposals,
  developerOpinionReferenceNeeds,
  developerSourceRequests,
  developerTicketLiteratureScoutCatalog,
} from './developer-content';
import { validateSourceRequests } from './source-requests';

describe('developer clinical audit queue', () => {
  it('loads the WHO-linked MDD scaffold only in the Developer content pool', () => {
    expect(
      developerCaseBlueprints.find(
        (blueprint) => blueprint.id === 'case.review.who-mhgap-mdd-initial',
      ),
    ).toMatchObject({
      metadata: {
        lifecycle: 'review',
        medicalReviewStatus: 'unreviewed',
        evidenceSourceIds: ['evidence.who.mhgap-mns.2023'],
        sourceDocumentIds: ['source-document.90f1220536d6323b8d84'],
      },
    });
  });

  it('loads unresolved CANMAT and ECG rule-review tickets with stable IDs', () => {
    const byId = new Map(developerClinicalAuditTickets.map((ticket) => [ticket.id, ticket]));
    for (const id of [
      'ticket.source.canmat-mdd.assessment-workup',
      'ticket.source.canmat-mdd.antidepressant-baseline',
      'ticket.source.canmat-mdd.psychotherapy-catalog',
      'ticket.source.canmat-mdd.disposition-severity',
      'ticket.source.who-mhgap.dep1-antidepressant-baseline',
      'ticket.source.who-mhgap.dep2-continuation-patient',
      'ticket.source.who-mhgap.dep3-psychotherapy-catalog',
      'ticket.source.who-mhgap.dep4-treatment-modality',
      'ticket.audit.m2-ecg-workup-weight',
      'ticket.audit.m2-ecg-treatment-path',
      'ticket.audit.m2-ecg-disposition',
    ]) {
      expect(byId.get(id)).toMatchObject({
        status: 'proposed',
        requiresClinicalAcumen: true,
        resolution: null,
      });
    }
    expect(byId.get('ticket.source.canmat-mdd.initial-modality')).toMatchObject({
      status: 'accepted_for_workflow',
      requiresClinicalAcumen: true,
      resolution: null,
    });
    expect(byId.get('ticket.source.canmat-mdd.antidepressant-baseline')).toMatchObject({
      sourceKind: 'source_claim',
      sourceAuthority: 'source_document',
      blueprintId: 'case.first-visit-depression',
    });
    expect(byId.get('ticket.source.who-mhgap.dep4-treatment-modality')).toMatchObject({
      sourceKind: 'source_claim',
      sourceAuthority: 'source_document',
      blueprintId: 'case.review.who-mhgap-mdd-initial',
      priority: 'blocking',
    });
  });

  it('loads a validated source-needed queue linked to exact tickets and content', () => {
    expect(
      validateSourceRequests(
        developerSourceRequests,
        catalogs,
        developerCaseBlueprints,
        developerClinicalAuditTickets,
      ),
    ).toEqual({ valid: true, issues: [] });
    expect(developerSourceRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'source-request.ecg.monitoring-necessity',
          status: 'source_received',
          destination: {
            provider: 'google_drive',
            folderLabel: 'PsychSim documents',
          },
        }),
        expect.objectContaining({ id: 'source-request.mdd.tsh-workup' }),
        expect.objectContaining({ id: 'source-request.mdd.severity-thresholds' }),
        expect.objectContaining({
          id: 'source-request.cyclothymia.duration-discrimination',
          status: 'source_received',
          receivedEvidenceSourceIds: expect.arrayContaining([
            'evidence.nhs.cyclothymia.2023',
            'evidence.va-dod.bipolar.2023',
          ]),
        }),
        expect.objectContaining({
          id: 'source-request.ecg.normal-result-disposition',
          status: 'source_received',
          linkedTicketIds: ['ticket.audit.m2-ecg-disposition'],
        }),
        expect.objectContaining({
          id: 'source-request.bupropion.seizure-history',
          status: 'source_received',
          linkedTicketIds: ['ticket.source.bupropion.seizure-history-nuance'],
        }),
        expect.objectContaining({
          id: 'source-request.medications.regimen-combination-boundaries',
          status: 'needs_source',
          linkedTicketIds: ['ticket.catalog.medications.normalized-regimen-risk-benefit'],
          targetContentIds: expect.arrayContaining([
            'grade.review-mdd.multiple-antidepressant-starts',
            'rule.review-mdd.multiple-antidepressant-starts.safety-cap',
          ]),
        }),
        expect.objectContaining({
          id: 'source-request.mdd.suicide-risk-disposition',
          status: 'source_received',
          receivedEvidenceSourceIds: ['evidence.va-dod.suicide-risk.2024'],
          sourceDocumentIds: ['source-document.3fdd289a235399016d65'],
        }),
      ]),
    );
  });

  it('keeps evidence-synthesis proposals in the Developer-only module', () => {
    expect(developerLiteratureSynthesisProposals).toHaveLength(7);
    expect(developerLiteratureSynthesisProposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'literature-synthesis.mdd.initial-modality.2026-07-24',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.ecg.monitoring.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.bupropion.seizure-history.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
      ]),
    );
  });

  it('keeps ticket literature scouting in the Developer-only module', () => {
    expect(developerTicketLiteratureScoutCatalog).toMatchObject({
      id: 'ticket-literature-scout.psychsim',
      references: expect.arrayContaining([
        expect.objectContaining({
          summaryBasis: 'abstract_only',
          medicalReviewStatus: 'unreviewed',
        }),
      ]),
    });
    expect(developerTicketLiteratureScoutCatalog.attachments).toHaveLength(
      developerClinicalAuditTickets.filter(
        (ticket) => ticket.status !== 'resolved' && ticket.status !== 'rejected',
      ).length,
    );
  });

  it('deduplicates unsourced clinical opinions and links exact existing source requests', () => {
    expect(developerOpinionReferenceNeeds.length).toBeGreaterThan(40);
    expect(
      developerOpinionReferenceNeeds.find(
        (entry) => entry.ruleId === 'modifier.mirtazapine.insomnia-fit-active',
      ),
    ).toMatchObject({
      category: 'medication_fit',
      linkedSourceRequestIds: ['source-request.mdd.antidepressant-fit-dimensions'],
    });
    expect(
      developerOpinionReferenceNeeds.find(
        (entry) => entry.ruleId === 'rule.mdd-outpatient-disposition',
      ),
    ).toMatchObject({
      category: 'safety_disposition',
      linkedSourceRequestIds: ['source-request.mdd.suicide-risk-disposition'],
    });
    expect(
      developerOpinionReferenceNeeds.find(
        (entry) => entry.ruleId === 'objective.mdd-episode-course',
      )?.ownerIds,
    ).toEqual(['case.review.basic-mdd-scaffold', 'case.review.who-mhgap-mdd-initial']);
    expect(
      developerOpinionReferenceNeeds.some(
        (entry) => entry.ruleId === 'objective.ecg-mdd-cardiac-monitoring',
      ),
    ).toBe(false);
  });

  it('loads the recommended-guideline intake as unresolved review tickets', () => {
    const byId = new Map(developerClinicalAuditTickets.map((ticket) => [ticket.id, ticket]));
    for (const id of [
      'ticket.source.va-dod-suicide-risk.2024-intake',
      'ticket.source.nice-self-harm.ng225-access',
      'ticket.source.apa-bpd.2024-access-and-scope',
      'ticket.source.apa-delirium.2025-access-and-scope',
      'ticket.source.canmat-mdd.2025-corrigendum',
      'ticket.source.bap-catatonia.2023-intake',
      'ticket.source.bfcrs.1996-reuse',
      'ticket.source.ace-gad.2025-access-and-scope',
      'ticket.source.asam-benzodiazepine.2025-access-and-scope',
    ]) {
      expect(byId.get(id)).toMatchObject({
        resolution: null,
      });
    }
    expect(byId.get('ticket.source.va-dod-suicide-risk.2024-intake')).toMatchObject({
      status: 'accepted_for_workflow',
    });
    expect(byId.get('ticket.source.bap-catatonia.2023-intake')).toMatchObject({
      status: 'accepted_for_workflow',
    });
    expect(byId.get('ticket.source.bfcrs.1996-reuse')).toMatchObject({
      status: 'proposed',
      sourceKind: 'engine_audit',
      ticketType: 'source_gap',
      requiresClinicalAcumen: false,
    });
    expect(byId.get('ticket.source.nice-self-harm.ng225-access')).toMatchObject({
      sourceKind: 'engine_audit',
      ticketType: 'source_gap',
      requiresClinicalAcumen: false,
    });
  });

  it('queues source-safe medication, therapy, and diagnosis catalog expansion work', () => {
    const byId = new Map(developerClinicalAuditTickets.map((ticket) => [ticket.id, ticket]));
    expect(byId.get('ticket.catalog.medications.psychiatry-allowlist')).toMatchObject({
      status: 'accepted_for_workflow',
      requiresClinicalAcumen: true,
      targetContentIds: expect.arrayContaining(['evidence.nlm.rxnorm-cpc.2026-07-06']),
    });
    expect(byId.get('ticket.catalog.medications.current-rule-provenance')).toMatchObject({
      ticketType: 'source_gap',
      status: 'proposed',
    });
    expect(byId.get('ticket.catalog.medications.normalized-regimen-risk-benefit')).toMatchObject({
      status: 'accepted_for_workflow',
      requiresClinicalAcumen: true,
      dependencyTicketIds: [
        'ticket.catalog.medications.current-rule-provenance',
        'ticket.catalog.medications.psychiatry-allowlist',
      ],
      targetContentIds: expect.arrayContaining([
        'grade.review-mdd.multiple-antidepressant-starts',
        'rule.review-mdd.multiple-antidepressant-starts.safety-cap',
      ]),
    });
    expect(byId.get('ticket.catalog.interventions.identity-and-fidelity')).toMatchObject({
      status: 'accepted_for_workflow',
      requiresClinicalAcumen: true,
    });
    expect(byId.get('ticket.catalog.diagnoses.common-outpatient-coverage')).toMatchObject({
      status: 'proposed',
      requiresClinicalAcumen: true,
    });
  });

  it('rejects source requests that point at nonexistent executable content', () => {
    const invalid = structuredClone(developerSourceRequests);
    invalid[0]!.targetContentIds.push('rule.does-not-exist');
    expect(
      validateSourceRequests(
        invalid,
        catalogs,
        developerCaseBlueprints,
        developerClinicalAuditTickets,
      ).issues,
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'INVALID_SOURCE_REQUEST_TARGET' })]),
    );
  });

  it('does not mistake existing context for newly received evidence', () => {
    const request = structuredClone(
      developerSourceRequests.find(
        (candidate) => candidate.id === 'source-request.mdd.tsh-workup',
      )!,
    );
    request.status = 'source_received';
    expect(request.existingEvidenceSourceIds.length).toBeGreaterThan(0);
    expect(request.receivedEvidenceSourceIds).toEqual([]);
    expect(SourceRequestSchema.safeParse(request).success).toBe(false);
  });
});
