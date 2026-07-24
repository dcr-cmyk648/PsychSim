import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import {
  CaseBlueprintSchema,
  EvidenceSourceDefinitionSchema,
  SourceUseDecisionCatalogSchema,
  type CaseBlueprint,
} from '@psychsim/schemas';
import { approvedCaseBlueprints, catalogs } from '@psychsim/content-runtime';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';

const reviewDirectory = resolve('content/cases/review');

const reviewBlueprints = await Promise.all(
  (await readdir(reviewDirectory))
    .filter((filename) => filename.endsWith('.case.json'))
    .sort()
    .map(async (filename) =>
      CaseBlueprintSchema.parse(
        JSON.parse(await readFile(join(reviewDirectory, filename), 'utf8')),
      ),
    ),
);

const blueprints: readonly CaseBlueprint[] = [...approvedCaseBlueprints, ...reviewBlueprints];
const evidenceSources = (
  await Promise.all(
    contentRegistry.entries
      .filter((entry) => entry.kind === 'evidence_source')
      .map(async (entry) =>
        EvidenceSourceDefinitionSchema.parse(
          JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
        ),
      ),
  )
).sort((left, right) => left.id.localeCompare(right.id));
const sourceUseDecisionEntry = contentRegistry.entries.find(
  (entry) => entry.kind === 'source_use_decision_catalog',
);
if (!sourceUseDecisionEntry) {
  throw new Error('The content registry does not identify a source-use decision catalog.');
}
const sourceUseDecisions = SourceUseDecisionCatalogSchema.parse(
  JSON.parse(await readFile(resolve(sourceUseDecisionEntry.path), 'utf8')) as unknown,
);
const sourceUseDecisionByEvidenceId = new Map(
  sourceUseDecisions.decisions.map((decision) => [decision.evidenceSourceId, decision]),
);

const caseRuleReviews = (blueprint: CaseBlueprint) => [
  blueprint.patientRecord.treatmentReference.review,
  ...blueprint.patientRecord.treatmentReference.acceptedMedicationTagSets.map(
    (tagSet) => tagSet.review,
  ),
  ...blueprint.workupObjectives.map((objective) => objective.review),
  ...blueprint.treatmentGrades.map((grade) => grade.review),
  ...blueprint.treatmentPathways.flatMap((pathway) => [
    pathway.review,
    ...pathway.conditionalRequirements.map((requirement) => requirement.review),
  ]),
  ...blueprint.scoreRules.map((rule) => rule.review),
];

console.log('PsychSim evidence catalog and contribution audit');
console.log('Catalog presence verifies bibliography only; it does not confer medical approval.');

for (const source of evidenceSources) {
  console.log(`\n${source.id}`);
  console.log(`  ${source.citation}`);
  console.log(`  ${source.url}`);
  console.log(
    `  Access metadata: full text ${source.accessPolicy.fullTextStatus}; reuse ${source.accessPolicy.reuseStatus}; adaptation ${source.accessPolicy.adaptationStatus}; AI ${source.accessPolicy.aiUseStatus}; local extraction ${source.accessPolicy.localExtractionStatus}; commercial ${source.accessPolicy.commercialUseStatus}.`,
  );
  const sourceUseDecision = sourceUseDecisionByEvidenceId.get(source.id);
  if (!sourceUseDecision) {
    console.log('  Source-use decision: MISSING (validation error).');
  } else {
    const permissions = sourceUseDecision.permissions;
    console.log(
      `  Source-use decision: ${sourceUseDecision.decisionStatus} via ${sourceUseDecision.legalBasis}; store ${permissions.localFullTextStorage ? 'yes' : 'no'}; extract ${permissions.localTextExtraction ? 'yes' : 'no'}; index ${permissions.localStructuredIndexing ? 'yes' : 'no'}; AI ${permissions.aiAssistedProcessing ? 'yes' : 'no'}; derive ${permissions.derivedClinicalContent ? 'yes' : 'no'}; runtime ${permissions.runtimeRedistribution ? 'yes' : 'no'}; commercial ${permissions.commercialDistribution ? 'yes' : 'no'}.`,
    );
    if (sourceUseDecision.attributionStatement) {
      console.log(`  Attribution: ${sourceUseDecision.attributionStatement}`);
    }
  }
  for (const relation of source.sourceRelations) {
    console.log(`  Relation: ${relation.relationType} ${relation.sourceId}`);
  }
  const uses = blueprints.flatMap((blueprint) =>
    blueprint.patientRecord.sourceUseNotes
      .filter((note) => note.evidenceSourceIds.includes(source.id))
      .map((note) => ({ ownerId: blueprint.id, note })),
  );
  const medicationUses = catalogs.medications.flatMap((medication) =>
    medication.sourceUseNotes
      .filter((note) => note.evidenceSourceIds.includes(source.id))
      .map((note) => ({ ownerId: medication.id, note })),
  );
  const allUses = [...uses, ...medicationUses];
  if (allUses.length === 0) {
    console.log('  Contribution: none linked; cataloged for future review.');
    continue;
  }
  for (const { ownerId, note } of allUses) {
    console.log(
      `  Contribution to ${ownerId} → ${note.targetContentIds.join(', ')} [${note.contributionTypes.join(', ')}]`,
    );
    console.log(`    ${note.contribution}`);
  }
}

const explicitExpertNotes = [
  ...blueprints.flatMap((blueprint) =>
    blueprint.patientRecord.sourceUseNotes
      .filter((note) => note.authority === 'expert_opinion')
      .map((note) => ({ ownerId: blueprint.id, note })),
  ),
  ...catalogs.medications.flatMap((medication) =>
    medication.sourceUseNotes
      .filter((note) => note.authority === 'expert_opinion')
      .map((note) => ({ ownerId: medication.id, note })),
  ),
];
const implicitExpertRuleCount =
  blueprints.reduce(
    (count, blueprint) =>
      count +
      caseRuleReviews(blueprint).filter((review) => review.sourceUseNoteIds.length === 0).length,
    0,
  ) +
  catalogs.medications.reduce(
    (count, medication) =>
      count +
      [...medication.fitModifiers, ...medication.authorOverrides].filter(
        (modifier) => modifier.sourceUseNoteIds.length === 0,
      ).length,
    0,
  );

console.log('\nExpert opinion');
for (const { ownerId, note } of explicitExpertNotes) {
  console.log(`  ${ownerId} → ${note.targetContentIds.join(', ')}: ${note.contribution}`);
}
console.log(
  `  ${implicitExpertRuleCount} rule(s) have no linked contribution and therefore display as Expert opinion.`,
);
