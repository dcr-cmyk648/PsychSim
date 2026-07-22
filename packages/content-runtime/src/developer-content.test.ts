import { describe, expect, it } from 'vitest';

import { developerClinicalAuditTickets } from './developer-content';

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
});
