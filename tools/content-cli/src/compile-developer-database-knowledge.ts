import { compileCurrentDeveloperDatabaseKnowledge } from './developer-database-knowledge';

try {
  const projection = await compileCurrentDeveloperDatabaseKnowledge();
  const { summary } = projection;
  console.log(
    [
      'PASS Developer database cross-reference',
      `${summary.personalSourceDocuments} private documents`,
      `${summary.sourceUnits} deterministic source units`,
      `${summary.matchedTargetEntries}/${summary.targetEntries} database entries linked`,
      `${summary.totalLexicalMatches} lexical matches`,
      `${summary.candidateSummaries} semantic candidates`,
      `${summary.formalContributions} formal contributions`,
      `${projection.catalogIdentityAudit.identityGaps.length} identity gaps`,
      `${projection.catalogIdentityAudit.overlappingTerms.length} overlapping catalog terms`,
    ].join(' · '),
  );
  console.log(
    'Every atomized unresolved target is retained for identity review; the private projection remains local-Developer-only and does not change clinical rules, points, or runtime content.',
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : 'Developer database cross-reference compilation failed.',
  );
  process.exitCode = 1;
}
