import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

import { ClinicalReviewTicketSchema } from '@psychsim/schemas';
import {
  approvedCaseBlueprints,
  catalogs,
  startingClinic,
  validateCaseBlueprint,
  validateCatalogs,
  validateContentRegistry,
} from '@psychsim/content-runtime';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';
import { milestoneTwoClinicalAuditTickets } from '../../../packages/content-runtime/src/milestone-two-review-tickets';
import {
  developerSourceRequests,
  validateSourceRequests,
} from '../../../packages/content-runtime/src/source-requests';
import { advancedPrototypeCaseBlueprint } from '../../../packages/content-runtime/src/test-content';
import canmatReviewTicketsJson from '../../../content/cases/review/canmat-2023-mdd-source-review.tickets.json';
import scaffoldReviewTicketsJson from '../../../content/cases/review/review-basic-mdd-scaffold.tickets.json';

const checkedInReviewTickets = [
  ...milestoneTwoClinicalAuditTickets,
  ...ClinicalReviewTicketSchema.array().parse(canmatReviewTicketsJson),
  ...ClinicalReviewTicketSchema.array().parse(scaffoldReviewTicketsJson),
];

const missingRegistryPaths = (
  await Promise.all(
    contentRegistry.entries.map(async (entry) => {
      try {
        await access(resolve(entry.path));
        return null;
      } catch {
        return entry.path;
      }
    }),
  )
).filter((path): path is string => path !== null);
const registryValidation = validateContentRegistry(
  contentRegistry,
  catalogs,
  approvedCaseBlueprints,
);
const registryIssues = [
  ...registryValidation.issues,
  ...missingRegistryPaths.map((path) => ({
    severity: 'error' as const,
    code: 'MISSING_REGISTRY_PATH',
    message: path,
  })),
];

const reports = [
  ['catalogs', validateCatalogs(catalogs)],
  [
    'content-registry',
    {
      valid: registryIssues.length === 0,
      issues: registryIssues,
    },
  ],
  [
    'source-needed-requests',
    validateSourceRequests(
      developerSourceRequests,
      catalogs,
      approvedCaseBlueprints,
      checkedInReviewTickets,
    ),
  ],
  ...approvedCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, startingClinic)] as const,
  ),
  [
    advancedPrototypeCaseBlueprint.id,
    validateCaseBlueprint(advancedPrototypeCaseBlueprint, catalogs, startingClinic),
  ],
] as const;

let failureCount = 0;
for (const [name, report] of reports) {
  if (report.valid) {
    console.log(`PASS ${name}`);
  } else {
    console.error(`FAIL ${name}`);
  }
  for (const issue of report.issues) {
    const issuePath = 'path' in issue ? issue.path : undefined;
    console[issue.severity === 'error' ? 'error' : 'warn'](
      `  ${issue.severity.toUpperCase()} ${issue.code}${issuePath ? ` (${issuePath})` : ''}: ${issue.message}`,
    );
    if (issue.severity === 'error') failureCount += 1;
  }
}

if (failureCount > 0) {
  console.error(`Content validation failed with ${failureCount} error(s).`);
  process.exitCode = 1;
} else {
  console.log('Approved prototype bundle is internally consistent.');
}
