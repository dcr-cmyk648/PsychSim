import { validateCurrentDeveloperDatabaseKnowledge } from './developer-database-knowledge';

try {
  const projection = await validateCurrentDeveloperDatabaseKnowledge();
  console.log(
    `PASS Developer database cross-reference is current (${projection.summary.personalSourceDocuments} documents; ${projection.summary.sourceUnits} units; ${projection.summary.partiallyIndexedUnits} partial; ${projection.catalogIdentityAudit.identityGaps.length} identity gaps; ${projection.catalogIdentityAudit.overlappingTerms.length} overlapping terms).`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : 'Developer database cross-reference validation failed.',
  );
  process.exitCode = 1;
}
