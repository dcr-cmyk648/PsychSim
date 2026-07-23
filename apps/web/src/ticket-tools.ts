import {
  ClinicalTicketExportBundleSchema,
  type ClinicalReviewTicket,
  type ClinicalTicketExportBundle,
} from '@psychsim/schemas';

export const LOCAL_TICKET_WRITER_ENDPOINT = '/__psychsim/local-review-tickets';

export const buildClinicalTicketExportBundle = (input: {
  exportedAt: string;
  engineVersion: string;
  profileId: string;
  tickets: readonly ClinicalReviewTicket[];
}): ClinicalTicketExportBundle =>
  ClinicalTicketExportBundleSchema.parse({
    schemaVersion: 1,
    exportVersion: 2,
    exportedAt: input.exportedAt,
    engineVersion: input.engineVersion,
    profileId: input.profileId,
    tickets: [...input.tickets],
  });

export const downloadClinicalTicketBundle = (bundle: ClinicalTicketExportBundle): void => {
  const blob = new Blob([`${JSON.stringify(bundle, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `psychsim-clinical-tickets-${bundle.exportedAt.slice(0, 10)}.review-bundle.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
};

export const writeClinicalTicketBundleToWorkspace = async (
  bundle: ClinicalTicketExportBundle,
): Promise<string> => {
  const response = await fetch(LOCAL_TICKET_WRITER_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundle),
  });
  const payload = (await response.json()) as { ok?: boolean; path?: string; error?: string };
  if (!response.ok || !payload.ok || !payload.path) {
    throw new Error(payload.error ?? 'The local ticket writer rejected the bundle.');
  }
  return payload.path;
};
