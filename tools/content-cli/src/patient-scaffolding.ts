import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import {
  CaseBlueprintSchema,
  GenerationProvenanceSchema,
  PatientScaffoldRequestSchema,
  ClinicalReviewTicketSchema,
  SourceChunkSchema,
  SourceDocumentSchema,
  type CaseBlueprint,
  type CatalogBundle,
  type ClinicalRuleReview,
  type ClinicalReviewTicket,
  type GenerationProvenance,
  type PatientScaffoldRequest,
  type SourceChunk,
  type SourceDocument,
} from '@psychsim/schemas';
import { startingClinic, validateCaseBlueprint } from '@psychsim/content-runtime';

import { listExtractedSourceArtifacts } from './source-pipeline';

const UNREVIEWED_RULE: ClinicalRuleReview = {
  status: 'unreviewed',
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

interface ExtractedArtifact {
  document: SourceDocument;
  chunks: SourceChunk[];
}

export interface CompilePatientScaffoldOptions {
  sourceRoot?: string;
  reviewDirectory?: string;
  provenanceDirectory?: string;
  now?: () => string;
  force?: boolean;
}

export interface CompiledPatientScaffold {
  blueprint: CaseBlueprint;
  provenance: GenerationProvenance;
  auditTickets: readonly ClinicalReviewTicket[];
  blueprintPath: string;
  provenancePath: string;
  auditTicketsPath: string;
}

const writeJsonAtomic = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryPath, path);
};

const caseToken = (blueprintId: string): string =>
  blueprintId
    .replace(/^case[._-]/, '')
    .replaceAll('.', '-')
    .slice(0, 80);

const outputFilename = (blueprintId: string): string => `${caseToken(blueprintId)}.case.json`;
const uniqueIds = (ids: readonly string[]): string[] => [...new Set(ids)];

const resetRuleReview = (blueprint: CaseBlueprint): void => {
  blueprint.patientRecord.treatmentReference.review = { ...UNREVIEWED_RULE };
  for (const tagSet of blueprint.patientRecord.treatmentReference.acceptedMedicationTagSets) {
    tagSet.review = { ...UNREVIEWED_RULE };
  }
  if (blueprint.diagnosisRubric) {
    for (const group of blueprint.diagnosisRubric.groups) {
      for (const option of group.options) option.review = { ...UNREVIEWED_RULE };
      group.omission.review = { ...UNREVIEWED_RULE };
    }
    for (const rule of blueprint.diagnosisRubric.misclassificationRules) {
      rule.review = { ...UNREVIEWED_RULE };
    }
    blueprint.diagnosisRubric.additionalSelectionPolicy.review = { ...UNREVIEWED_RULE };
  }
  for (const objective of blueprint.workupObjectives) objective.review = { ...UNREVIEWED_RULE };
  for (const requirement of blueprint.treatmentWorkupRequirements) {
    requirement.review = { ...UNREVIEWED_RULE };
  }
  for (const grade of blueprint.treatmentGrades) grade.review = { ...UNREVIEWED_RULE };
  for (const pathway of blueprint.treatmentPathways) {
    pathway.review = { ...UNREVIEWED_RULE };
    for (const requirement of pathway.conditionalRequirements) {
      requirement.review = { ...UNREVIEWED_RULE };
    }
  }
  for (const rule of blueprint.scoreRules) rule.review = { ...UNREVIEWED_RULE };
};

export const buildPatientScaffold = (
  requestInput: unknown,
  template: CaseBlueprint,
  catalogs: CatalogBundle,
): CaseBlueprint => {
  const request = PatientScaffoldRequestSchema.parse(requestInput);
  if (request.templateBlueprintId !== template.id) {
    throw new Error(
      `Request template ${request.templateBlueprintId} does not match loaded template ${template.id}.`,
    );
  }
  if (request.blueprintId === template.id) {
    throw new Error('A scaffold must use a new blueprint ID rather than overwrite its template.');
  }
  if (new Set(request.chiefComplaintChoices.map((value) => value.toLocaleLowerCase())).size < 10) {
    throw new Error('A scaffold requires at least 10 distinct chief complaints.');
  }

  const candidate = structuredClone(template);
  candidate.id = request.blueprintId;
  candidate.contentVersion = '1.0.0';
  candidate.metadata = {
    ...candidate.metadata,
    title: request.internalTitle,
    fictional: true,
    synthetic: true,
    medicalReviewStatus: 'unreviewed',
    lifecycle: 'review',
    prototype: true,
    disclaimer:
      'Fictional, synthetic, medically unreviewed developer scaffold; not authoritative treatment guidance.',
    sourceDocumentIds: uniqueIds(request.sourceUses.map((sourceUse) => sourceUse.sourceDocumentId)),
    evidenceSourceIds: uniqueIds(
      request.sourceUses.flatMap((sourceUse) => sourceUse.evidenceSourceIds),
    ),
  };
  candidate.patientRecord.id = `patient-record.${caseToken(request.blueprintId)}`;
  candidate.patientRecord.sourceUseNotes = request.sourceUses.map((sourceUse, index) => ({
    id: `source-use.${caseToken(request.blueprintId)}.${index + 1}`,
    authority: sourceUse.authority,
    evidenceSourceIds: sourceUse.evidenceSourceIds,
    sourceDocumentId: sourceUse.sourceDocumentId,
    sourceChunkIds: sourceUse.sourceChunkIds,
    targetContentIds: [request.blueprintId],
    contributionTypes: sourceUse.contributionTypes,
    contribution: sourceUse.summary,
    generatedBy: request.createdBy === 'human' ? 'human' : 'ai',
    medicalReviewStatus: 'unreviewed',
  }));

  const chiefComplaint = candidate.variants.find(
    (variant) => variant.target === 'patient.chiefComplaint',
  );
  if (!chiefComplaint || chiefComplaint.generator.type !== 'choice') {
    throw new Error('The template does not expose a choice-based patient.chiefComplaint variant.');
  }
  chiefComplaint.generator.values = [...request.chiefComplaintChoices];

  const age = candidate.variants.find((variant) => variant.target === 'patient.age');
  if (!age || age.generator.type !== 'integerRange') {
    throw new Error('The template does not expose an integerRange patient.age variant.');
  }
  age.generator.min = request.ageRange.minimum;
  age.generator.max = request.ageRange.maximum;
  resetRuleReview(candidate);

  return CaseBlueprintSchema.parse(candidate, { path: [request.id, catalogs.contentVersion] });
};

const loadExtractedArtifacts = async (sourceRoot?: string): Promise<ExtractedArtifact[]> =>
  Promise.all(
    (await listExtractedSourceArtifacts(sourceRoot)).map(async (path) => {
      const raw = JSON.parse(await readFile(path, 'utf8')) as {
        document?: unknown;
        chunks?: unknown;
      };
      return {
        document: SourceDocumentSchema.parse(raw.document),
        chunks: SourceChunkSchema.array().parse(raw.chunks),
      };
    }),
  );

const verifySourceUses = (
  request: PatientScaffoldRequest,
  artifacts: readonly ExtractedArtifact[],
  catalogs: CatalogBundle,
): void => {
  const documents = new Map(artifacts.map((artifact) => [artifact.document.id, artifact]));
  const evidenceSourceIds = new Set(catalogs.evidenceSources.map((source) => source.id));
  for (const sourceUse of request.sourceUses) {
    const artifact = documents.get(sourceUse.sourceDocumentId);
    if (!artifact) {
      throw new Error(`Missing extracted source document: ${sourceUse.sourceDocumentId}`);
    }
    const chunkIds = new Set(artifact.chunks.map((chunk) => chunk.id));
    const missing = sourceUse.sourceChunkIds.filter((id) => !chunkIds.has(id));
    if (missing.length > 0) {
      throw new Error(
        `Source chunks do not belong to ${sourceUse.sourceDocumentId}: ${missing.join(', ')}`,
      );
    }
    const missingEvidenceSources = sourceUse.evidenceSourceIds.filter(
      (id) => !evidenceSourceIds.has(id),
    );
    if (missingEvidenceSources.length > 0) {
      throw new Error(
        `Formal source use references uncataloged evidence: ${missingEvidenceSources.join(', ')}`,
      );
    }
  }
};

export const compilePatientScaffold = async (
  requestInput: unknown,
  templates: readonly CaseBlueprint[],
  catalogs: CatalogBundle,
  options: CompilePatientScaffoldOptions = {},
): Promise<CompiledPatientScaffold> => {
  const request = PatientScaffoldRequestSchema.parse(requestInput);
  const template = templates.find((candidate) => candidate.id === request.templateBlueprintId);
  if (!template)
    throw new Error(`Unknown patient scaffold template: ${request.templateBlueprintId}`);
  const artifacts = await loadExtractedArtifacts(options.sourceRoot);
  verifySourceUses(request, artifacts, catalogs);
  const blueprint = buildPatientScaffold(request, template, catalogs);
  const validation = validateCaseBlueprint(
    blueprint,
    catalogs,
    // The template already declares its compatible locations. Semantic validation
    // uses the starter clinic to reject an inaccessible scaffold.
    startingClinic,
  );
  if (!validation.valid) {
    throw new Error(
      `Scaffold semantic validation failed: ${validation.issues
        .filter((issue) => issue.severity === 'error')
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  const generatedAt = options.now?.() ?? new Date().toISOString();
  const provenance = GenerationProvenanceSchema.parse({
    schemaVersion: 1,
    modelIdentifier:
      request.createdBy === 'human'
        ? 'local-human-scaffold'
        : request.createdBy === 'codex'
          ? 'codex-assisted-scaffold'
          : 'deterministic-mock-scaffold',
    promptVersion: 'patient-scaffold-request-v1',
    generatedAt,
    sourceDocumentIds: uniqueIds(request.sourceUses.map((sourceUse) => sourceUse.sourceDocumentId)),
    sourceChunkIds: uniqueIds(request.sourceUses.flatMap((sourceUse) => sourceUse.sourceChunkIds)),
    evidenceSourceIds: uniqueIds(
      request.sourceUses.flatMap((sourceUse) => sourceUse.evidenceSourceIds),
    ),
    blueprintId: blueprint.id,
    generatorVersion: 'psychsim-patient-scaffolder-1',
    validationResults: [
      'Zod case schema passed',
      'Source document/chunk relationships passed',
      'Semantic case validation passed',
    ],
    criticFindings: [
      'Clinical facts and executable rules are inherited from the selected template, not inferred from source text.',
      'Every inherited clinical rule was reset to medically unreviewed.',
      'Case-local rule and finding IDs inherited from the template require review before promotion.',
    ],
    repairHistory: [],
    medicalReviewStatus: 'unreviewed',
  });
  const reviewDirectory = options.reviewDirectory ?? resolve('content/cases/review');
  const provenanceDirectory = options.provenanceDirectory ?? resolve('content/generated/authoring');
  const blueprintPath = join(reviewDirectory, outputFilename(blueprint.id));
  const provenancePath = join(provenanceDirectory, `${caseToken(blueprint.id)}.provenance.json`);
  const auditTicketsPath = join(reviewDirectory, `${caseToken(blueprint.id)}.tickets.json`);
  if (!options.force) {
    const existingNames = await readdir(reviewDirectory).catch(() => [] as string[]);
    if (existingNames.includes(basename(blueprintPath))) {
      throw new Error(
        `Review patient already exists: ${blueprintPath}. Use --force to replace it.`,
      );
    }
  }
  const auditTickets: readonly ClinicalReviewTicket[] = [
    ClinicalReviewTicketSchema.parse({
      schemaVersion: 1,
      id: `ticket.audit.${caseToken(blueprint.id)}.template-inheritance`,
      title: `Audit inherited rules for ${request.internalTitle}`,
      sourceKind: 'engine_audit',
      sourceAuthority: 'developer_observation',
      ticketType: 'case_construction',
      priority: 'blocking',
      status: 'proposed',
      requiresClinicalAcumen: true,
      attemptId: null,
      blueprintId: blueprint.id,
      caseContentVersion: blueprint.contentVersion,
      receiptItemId: null,
      receiptItemSnapshot: null,
      targetContentIds: [blueprint.id],
      dependencyTicketIds: [],
      conflictContentIds: [],
      proposedRouting:
        'Review every inherited fact, workup objective, treatment grade, pathway, score rule, and reference policy before promotion.',
      guidance:
        'This playable scaffold inherited executable clinical logic from its template. Decide which rules truly apply to the new patient and create versioned edits; do not approve the case merely because it runs.',
      resurfacingTrigger: 'Whenever the template or any source-backed claim changes.',
      resolution: null,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    }),
    ClinicalReviewTicketSchema.parse({
      schemaVersion: 1,
      id: `ticket.audit.${caseToken(blueprint.id)}.source-application`,
      title: `Audit source application for ${request.internalTitle}`,
      sourceKind: 'source_claim',
      sourceAuthority: 'source_document',
      ticketType: 'clinical_conflict',
      priority: 'high',
      status: 'proposed',
      requiresClinicalAcumen: true,
      attemptId: null,
      blueprintId: blueprint.id,
      caseContentVersion: blueprint.contentVersion,
      receiptItemId: null,
      receiptItemSnapshot: null,
      targetContentIds: uniqueIds([
        blueprint.id,
        ...request.sourceUses.map((sourceUse) => sourceUse.sourceDocumentId),
        ...request.sourceUses.flatMap((sourceUse) => sourceUse.evidenceSourceIds),
        ...request.sourceUses.flatMap((sourceUse) => sourceUse.sourceChunkIds),
        ...request.sourceUses.flatMap((sourceUse) => sourceUse.proposedImpactContentIds),
      ]),
      dependencyTicketIds: [`ticket.audit.${caseToken(blueprint.id)}.template-inheritance`],
      conflictContentIds: [],
      proposedRouting:
        'Compare each concise source-use summary with the cited local chunks, then decide whether it supports a patient fact, medication rule, pathway, or no change.',
      guidance:
        request.sourceUses.length > 0
          ? 'No source summary has been propagated into scoring. Review the cited chunks and explicitly accept, narrow, reject, or defer each proposed application.'
          : 'This scaffold has no source backing. Decide whether it should remain a synthetic mechanics fixture or receive source provenance before further clinical editing.',
      resurfacingTrigger:
        'Whenever cited source chunks, claims, or affected catalog entries change.',
      resolution: null,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    }),
  ];
  await writeJsonAtomic(provenancePath, provenance);
  await writeJsonAtomic(auditTicketsPath, auditTickets);
  // Publish the case last so a development reload cannot observe a half-written package.
  await writeJsonAtomic(blueprintPath, blueprint);
  return {
    blueprint,
    provenance,
    auditTickets,
    blueprintPath,
    provenancePath,
    auditTicketsPath,
  };
};
