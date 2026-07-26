import { ClinicalReviewTicketSchema, type ClinicalReviewTicket } from '@psychsim/schemas';

const milestoneTwoTicket = (
  value: Omit<
    ClinicalReviewTicket,
    | 'schemaVersion'
    | 'status'
    | 'sourceKind'
    | 'sourceAuthority'
    | 'requiresClinicalAcumen'
    | 'attemptId'
    | 'caseContentVersion'
    | 'receiptItemId'
    | 'receiptItemSnapshot'
    | 'dependencyTicketIds'
    | 'conflictContentIds'
    | 'sourceReviewSnapshot'
    | 'reviewerNotes'
    | 'reviewerNotesUpdatedAt'
    | 'resurfacingTrigger'
    | 'resolution'
    | 'createdAt'
    | 'updatedAt'
  >,
): ClinicalReviewTicket =>
  ClinicalReviewTicketSchema.parse({
    schemaVersion: 1,
    status: 'proposed',
    sourceKind: 'engine_audit',
    sourceAuthority: 'developer_observation',
    requiresClinicalAcumen: true,
    attemptId: null,
    caseContentVersion: '3.0.0',
    receiptItemId: null,
    receiptItemSnapshot: null,
    dependencyTicketIds: [],
    conflictContentIds: [],
    sourceReviewSnapshot: null,
    resurfacingTrigger: null,
    resolution: null,
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    ...value,
  });

/**
 * Proposed clinical judgments introduced for the Milestone 2 ECG prototype.
 * This module has no Vite-only imports so CLI validation can share the IDs.
 */
export const milestoneTwoClinicalAuditTickets: readonly ClinicalReviewTicket[] = [
  milestoneTwoTicket({
    id: 'ticket.audit.m2-ecg-workup-weight',
    title: 'Audit ECG necessity and point weight',
    blueprintId: 'case.medication-check-palpitations',
    ticketType: 'scoring',
    priority: 'high',
    targetContentIds: [
      'case.medication-check-palpitations',
      'objective.ecg-mdd-cardiac-monitoring',
      'info.imaging.ecg',
      'test.diagnostic.ecg',
    ],
    proposedRouting:
      'Review the patient-owned facts, ECG objective, FDA-label source-use note, and game-economy weight before approving or changing the rule.',
    guidance:
      'Decide whether a 12-lead ECG should be essential for this constructed presentation of intermittent palpitations during existing citalopram treatment, and whether the +560 obtained / -350 omitted values are proportionate. The source note is context, not automatic approval.',
  }),
  milestoneTwoTicket({
    id: 'ticket.audit.m2-ecg-treatment-path',
    title: 'Audit continue-versus-switch treatment grading',
    blueprintId: 'case.medication-check-palpitations',
    ticketType: 'treatment_pathway',
    priority: 'high',
    targetContentIds: [
      'case.medication-check-palpitations',
      'path.ecg-mdd-monitored-outpatient-medication',
      'grade.ecg-mdd-continue-after-monitoring',
      'grade.ecg-mdd-strong-sertraline-switch',
      'grade.ecg-mdd-strong-escitalopram',
      'medication.citalopram',
      'medication.sertraline',
    ],
    proposedRouting:
      'Review the broad patient pathway, medication files, authored normal ECG result, and missing decision-relevant facts before assigning final grades.',
    guidance:
      'Decide whether continuing citalopram after the normal ECG should be the 100-point database route and stopping citalopram plus starting sertraline a 95-point strong alternative, or whether the patient needs different facts or grading.',
  }),
  milestoneTwoTicket({
    id: 'ticket.audit.m2-ecg-disposition',
    title: 'Audit escalation and disposition penalties',
    blueprintId: 'case.medication-check-palpitations',
    ticketType: 'scoring',
    priority: 'high',
    targetContentIds: [
      'case.medication-check-palpitations',
      'rule.ecg-mdd-outpatient-disposition',
      'rule.ecg-mdd-urgent-escalation',
      'rule.ecg-mdd-emergency-escalation',
    ],
    proposedRouting:
      'Review the authored symptoms, normal ECG, outpatient/urgent/emergency disposition rules, and safety caps together.',
    guidance:
      'Decide whether the current outpatient reward and urgent or emergency escalation penalties are proportionate after a normal ECG with no authored syncope, dizziness, or chest pain.',
  }),
];
