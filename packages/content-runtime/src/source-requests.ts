import {
  SourceRequestSchema,
  type CaseBlueprint,
  type CatalogBundle,
  type ClinicalReviewTicket,
  type SourceRequest,
} from '@psychsim/schemas';

import sourceRequestsJson from '../../../content/cases/review/source-needed.requests.json';

export interface SourceRequestValidationIssue {
  severity: 'error';
  code: string;
  message: string;
}

export interface SourceRequestValidationReport {
  valid: boolean;
  issues: SourceRequestValidationIssue[];
}

export const developerSourceRequests: readonly SourceRequest[] =
  SourceRequestSchema.array().parse(sourceRequestsJson);

const duplicateIds = (ids: readonly string[]): string[] => [
  ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
];

const collectReviewableContentIds = (
  catalogs: CatalogBundle,
  blueprints: readonly CaseBlueprint[],
): Set<string> => {
  const ids = new Set<string>();
  for (const collection of [
    catalogs.evidenceSources,
    catalogs.diagnoses,
    catalogs.services,
    catalogs.medications,
    catalogs.formularies,
    catalogs.treatments,
    catalogs.locations,
    catalogs.facilities,
    catalogs.informationActions,
    catalogs.variantPools,
    catalogs.tests,
    catalogs.referenceIntervalSets,
    catalogs.upgrades,
  ]) {
    collection.forEach((item) => ids.add(item.id));
  }
  for (const medication of catalogs.medications) {
    medication.fitModifiers.forEach((modifier) => ids.add(modifier.id));
    medication.authorOverrides.forEach((override) => ids.add(override.id));
    medication.sourceUseNotes.forEach((note) => ids.add(note.id));
  }
  for (const diagnosis of catalogs.diagnoses) {
    diagnosis.baseRules.forEach((rule) => ids.add(rule.id));
    diagnosis.complexityContributions.forEach((contribution) => ids.add(contribution.id));
    diagnosis.sourceUseNotes.forEach((note) => ids.add(note.id));
    if (diagnosis.severityAxis) {
      ids.add(diagnosis.severityAxis.id);
      diagnosis.severityAxis.levels.forEach((level) => {
        ids.add(level.id);
        level.rules.forEach((rule) => ids.add(rule.id));
        level.complexityContributions.forEach((contribution) => ids.add(contribution.id));
      });
    }
    diagnosis.specifiers.forEach((specifier) => {
      ids.add(specifier.id);
      specifier.rules.forEach((rule) => ids.add(rule.id));
      specifier.complexityContributions.forEach((contribution) => ids.add(contribution.id));
    });
  }
  for (const blueprint of blueprints) {
    ids.add(blueprint.id);
    ids.add(blueprint.patientRecord.id);
    blueprint.patientRecord.diagnoses.forEach((diagnosis) => ids.add(diagnosis.id));
    blueprint.patientRecord.clinicalTagIds.forEach((id) => ids.add(id));
    blueprint.patientRecord.observations.forEach((observation) => ids.add(observation.id));
    blueprint.patientRecord.sourceUseNotes.forEach((note) => ids.add(note.id));
    blueprint.informationActions.forEach((action) => {
      ids.add(action.actionId);
      action.result.findings.forEach((finding) => ids.add(finding.id));
      action.result.factsRevealed.forEach((id) => ids.add(id));
    });
    blueprint.workupObjectives.forEach((objective) => ids.add(objective.id));
    blueprint.treatmentGrades.forEach((grade) => ids.add(grade.id));
    blueprint.treatmentPathways.forEach((pathway) => ids.add(pathway.id));
    blueprint.scoreRules.forEach((rule) => ids.add(rule.id));
    if (blueprint.diagnosisRubric) {
      blueprint.diagnosisRubric.groups.forEach((group) => {
        ids.add(group.id);
        ids.add(group.omission.id);
        group.options.forEach((option) => ids.add(option.id));
      });
      blueprint.diagnosisRubric.misclassificationRules.forEach((rule) => ids.add(rule.id));
      ids.add(blueprint.diagnosisRubric.additionalSelectionPolicy.id);
    }
    blueprint.referenceSolutions.forEach((solution) => ids.add(solution.id));
    blueprint.variants.forEach((variant) => ids.add(variant.id));
  }
  return ids;
};

export const validateSourceRequests = (
  requests: readonly SourceRequest[],
  catalogs: CatalogBundle,
  blueprints: readonly CaseBlueprint[],
  tickets: readonly ClinicalReviewTicket[],
): SourceRequestValidationReport => {
  const issues: SourceRequestValidationIssue[] = [];
  for (const id of duplicateIds(requests.map((request) => request.id))) {
    issues.push({ severity: 'error', code: 'DUPLICATE_SOURCE_REQUEST_ID', message: id });
  }
  const contentIds = collectReviewableContentIds(catalogs, blueprints);
  const ticketIds = new Set(tickets.map((ticket) => ticket.id));
  const evidenceIds = new Set(catalogs.evidenceSources.map((source) => source.id));
  for (const request of requests) {
    for (const targetId of request.targetContentIds) {
      if (!contentIds.has(targetId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_SOURCE_REQUEST_TARGET',
          message: `${request.id}: ${targetId}`,
        });
      }
    }
    for (const ticketId of request.linkedTicketIds) {
      if (!ticketIds.has(ticketId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_SOURCE_REQUEST_TICKET',
          message: `${request.id}: ${ticketId}`,
        });
      }
    }
    for (const evidenceId of [
      ...request.existingEvidenceSourceIds,
      ...request.receivedEvidenceSourceIds,
    ]) {
      if (!evidenceIds.has(evidenceId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_SOURCE_REQUEST_EVIDENCE',
          message: `${request.id}: ${evidenceId}`,
        });
      }
    }
    for (const noteId of request.sourceUseNoteIds) {
      if (!contentIds.has(noteId)) {
        issues.push({
          severity: 'error',
          code: 'INVALID_SOURCE_REQUEST_USE_NOTE',
          message: `${request.id}: ${noteId}`,
        });
      }
    }
  }
  return { valid: issues.length === 0, issues };
};
