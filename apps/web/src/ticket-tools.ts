import type { ClinicalTicketExportBundle } from '@psychsim/schemas';

export { buildClinicalTicketExportBundle, downloadClinicalTicketBundle } from './review-export';

export const LOCAL_TICKET_WRITER_ENDPOINT = '/__psychsim/local-review-tickets';

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
