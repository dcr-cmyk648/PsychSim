import { describe, expect, it } from 'vitest';
import { SourceRequestSchema } from '@psychsim/schemas';

import { catalogs } from './content';
import {
  developerCaseBlueprints,
  developerClinicalAuditTickets,
  developerSourceRequests,
} from './developer-content';
import { validateSourceRequests } from './source-requests';

describe('developer clinical audit queue', () => {
  it('loads unresolved CANMAT and ECG rule-review tickets with stable IDs', () => {
    const byId = new Map(developerClinicalAuditTickets.map((ticket) => [ticket.id, ticket]));
    for (const id of [
      'ticket.source.canmat-mdd.assessment-workup',
      'ticket.source.canmat-mdd.initial-modality',
      'ticket.source.canmat-mdd.antidepressant-baseline',
      'ticket.source.canmat-mdd.psychotherapy-catalog',
      'ticket.source.canmat-mdd.disposition-severity',
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
      sourceKind: 'source_claim',
      sourceAuthority: 'source_document',
      blueprintId: 'case.first-visit-depression',
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
          status: 'needs_source',
          destination: {
            provider: 'google_drive',
            folderLabel: 'PsychSim documents',
          },
        }),
        expect.objectContaining({ id: 'source-request.mdd.tsh-workup' }),
        expect.objectContaining({ id: 'source-request.mdd.severity-thresholds' }),
        expect.objectContaining({ id: 'source-request.mdd.suicide-risk-disposition' }),
      ]),
    );
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
    const request = structuredClone(developerSourceRequests[0]!);
    request.status = 'source_received';
    expect(request.existingEvidenceSourceIds.length).toBeGreaterThan(0);
    expect(request.receivedEvidenceSourceIds).toEqual([]);
    expect(SourceRequestSchema.safeParse(request).success).toBe(false);
  });
});
