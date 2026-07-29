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
      'ticket.source.canmat-mdd.psychotherapy-catalog',
      'ticket.source.canmat-mdd.disposition-severity',
      'ticket.source.mdd.severity-generator-policy',
      'ticket.source.mdd.antidepressant-sleep-fit',
      'ticket.source.mdd.tsh-workup-threshold',
      'ticket.source.mdd.antidepressant-weight-fit',
      'ticket.source.canmat-mdd.inadequate-response-route',
      'ticket.source.canmat-mdd.switch-transition-state',
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
    expect(byId.get('ticket.source.canmat-mdd.antidepressant-baseline')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: true,
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.source.canmat-mdd.assessment-workup')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: true,
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.source.canmat-mdd.initial-modality')).toMatchObject({
      status: 'accepted_for_workflow',
      requiresClinicalAcumen: true,
      resolution: null,
    });
    expect(byId.get('ticket.source.mdd.antidepressant-sexual-adherence-fit')).toMatchObject({
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

  it('records finding-scope resolutions and queues the latent-proposition foundation', () => {
    const byId = new Map(developerClinicalAuditTickets.map((ticket) => [ticket.id, ticket]));
    expect(byId.get('ticket.catalog.findings.grandiosity-time-scope-boundary')).toMatchObject({
      status: 'resolved',
      targetContentIds: expect.arrayContaining([
        'finding.history.current-grandiosity',
        'finding.history.past-episodic-grandiosity',
        'finding.mse.current-observed-grandiosity',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    for (const id of [
      'ticket.catalog.findings.impulsivity-risk-behavior-boundary',
      'ticket.catalog.findings.suicide-preparatory-behavior-time-scope',
      'ticket.catalog.findings.weapon-access-concern-boundary',
      'ticket.catalog.findings.thought-disorganization-source-boundary',
      'ticket.catalog.findings.duration-value-owner-routing',
      'ticket.catalog.findings.subjective-burden-value-owner-routing',
    ]) {
      expect(byId.get(id)).toMatchObject({
        status: 'resolved',
        requiresClinicalAcumen: false,
        resolution: { disposition: 'applied' },
      });
    }
    expect(byId.get('ticket.catalog.findings.paranoia-persecution-boundary')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: true,
      targetContentIds: expect.arrayContaining([
        'finding.history.current-self-reported-suspiciousness',
        'finding.history.current-self-reported-ideas-of-reference',
        'finding.history.current-self-reported-persecutory-ideation',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(
      byId.get('ticket.catalog.findings.paranoia-persecution-boundary')?.targetContentIds,
    ).not.toContain('schema.belief-appraisal');
    expect(
      byId.get('ticket.schema.patient-state.latent-proposition-evidence-foundation'),
    ).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      targetContentIds: expect.arrayContaining([
        'schema.latent-patient-proposition',
        'schema.patient-proposition-evidence',
        'schema.proposition-evidence-generation-profile',
        'schema.evidence-dependency-group',
        'schema.belief-appraisal',
        'schema.resolved-patient-proposition-state',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(
      byId.get('ticket.schema.patient-state.latent-proposition-evidence-foundation')?.guidance,
    ).toMatch(/not required to converge.*not a retry, cleanup, quarantine/s);
    expect(
      byId.get('ticket.catalog.findings.subjective-presentation-projection-foundation'),
    ).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.catalog.measurements.vitals-exam-foundation')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.catalog.tests.structured-result-foundation')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      targetContentIds: expect.arrayContaining([
        'schema.structured-test-result-contract',
        'schema.structured-test-reference-interval',
        'schema.structured-test-result',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.schema.patient-state.resolved-record-foundation')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      targetContentIds: expect.arrayContaining([
        'schema.condition-state',
        'schema.diagnosis-record-entry',
        'schema.resolved-clinical-duration',
        'schema.subjective-burden-record',
        'schema.resolved-patient-state',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.catalog.exposures.substance-use-foundation')).toMatchObject({
      status: 'resolved',
      targetContentIds: expect.arrayContaining([
        'registry.catalog.exposures',
        'schema.agent-misuse-generation-prior',
        'schema.resolved-exposure-use-entry',
        'schema.resolved-exposure-inventory',
        'schema.resolved-patient-state',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    for (const id of [
      'ticket.engine.patient-generation.general-dependency-gate',
      'ticket.schema.patient-state.resolved-record-foundation',
      'ticket.engine.patient-generation.shared-finding-compiler',
    ]) {
      expect(byId.get(id)?.dependencyTicketIds).toContain(
        'ticket.schema.patient-state.latent-proposition-evidence-foundation',
      );
    }
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
          linkedTicketIds: [
            'ticket.source.canmat-mdd.regimen-intent-taxonomy',
            'ticket.source.canmat-mdd.inadequate-response-route',
            'ticket.source.canmat-mdd.switch-transition-state',
          ],
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
    expect(developerLiteratureSynthesisProposals).toHaveLength(22);
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
        expect.objectContaining({
          id: 'literature-synthesis.who-mhgap.dep4-treatment-modality.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.bap-catatonia.snapshot-relevance.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.severity-generator-policy.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.antidepressant-fit-frame.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.tsh-workup-threshold.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.mdd.suicide-risk-disposition.2026-07-26',
          medicalReviewStatus: 'unreviewed',
          pointMagnitudeExcluded: true,
        }),
        expect.objectContaining({
          id: 'literature-synthesis.canmat-mdd.switch-transition-state.2026-07-26',
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
    const attachmentsByTicket = new Map(
      developerTicketLiteratureScoutCatalog.attachments.map((attachment) => [
        attachment.ticketId,
        attachment,
      ]),
    );
    for (const ticket of developerClinicalAuditTickets.filter(
      (candidate) => candidate.status !== 'resolved' && candidate.status !== 'rejected',
    )) {
      expect(attachmentsByTicket.has(ticket.id)).toBe(true);
    }
    expect(attachmentsByTicket.has('ticket.source.canmat-mdd.antidepressant-baseline')).toBe(true);
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
    expect(byId.get('ticket.source.canmat-mdd.2025-corrigendum')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      resolution: {
        disposition: 'no_change',
      },
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
      status: 'resolved',
      requiresClinicalAcumen: true,
      dependencyTicketIds: [],
      targetContentIds: expect.arrayContaining([
        'registry.catalog.medication-regimen-knowledge',
        'schema.focused-medication-regimen-route',
        'schema.medication-regimen-contributor',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.engine.decision-policy.catalog-compiler')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: false,
      targetContentIds: expect.arrayContaining([
        'registry.catalog.decision-policies',
        'schema.decision-policy-definition',
        'schema.compiled-rubric',
        'engine.decision-policy-compiler',
      ]),
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.source.canmat-mdd.regimen-intent-taxonomy')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: true,
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
    });
    expect(byId.get('ticket.catalog.interventions.identity-and-fidelity')).toMatchObject({
      status: 'resolved',
      requiresClinicalAcumen: true,
      resolution: {
        disposition: 'applied',
        resolvedBy: 'reviewer.dustin-rowland',
      },
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
