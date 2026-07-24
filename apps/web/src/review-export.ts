import {
  ClinicalTicketExportBundleSchema,
  type ClinicalReviewTicket,
  type ClinicalTicketExportBundle,
  type CompletedAttempt,
  type ContentFlag,
  type DeveloperAttemptReview,
} from '@psychsim/schemas';

export const buildClinicalTicketExportBundle = (input: {
  exportedAt: string;
  engineVersion: string;
  profileId: string;
  buildKind: 'local_developer' | 'portable_reviewer';
  assignmentId: string | null;
  tickets: readonly ClinicalReviewTicket[];
  attemptReviews: readonly DeveloperAttemptReview[];
  flags: readonly ContentFlag[];
  completedAttempts: readonly CompletedAttempt[];
}): ClinicalTicketExportBundle =>
  ClinicalTicketExportBundleSchema.parse({
    schemaVersion: 1,
    exportVersion: 5,
    bundleId: `review-bundle.${input.exportedAt.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
    buildKind: input.buildKind,
    assignmentId: input.assignmentId,
    exportedAt: input.exportedAt,
    engineVersion: input.engineVersion,
    profileId: input.profileId,
    tickets: [...input.tickets],
    attemptReviews: [...input.attemptReviews],
    flags: [...input.flags],
    completedAttempts: [...input.completedAttempts],
  });

export const downloadClinicalTicketBundle = (bundle: ClinicalTicketExportBundle): void => {
  const blob = new Blob([`${JSON.stringify(bundle, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `psychsim-reviewer-feedback-${bundle.exportedAt.replaceAll(/[:.]/g, '-')}.review-bundle.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
};
