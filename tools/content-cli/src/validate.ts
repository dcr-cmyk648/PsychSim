import { access, readFile, readdir } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

import {
  CaseBlueprintSchema,
  ClinicalDurationProfileCatalogSchema,
  ClinicalReviewTicketSchema,
  ConditionFindingProfileCatalogSchema,
  DecisionBalanceCatalogSchema,
  DecisionPolicyCatalogSchema,
  DeveloperOpinionCatalogSchema,
  DiagnosisClassificationReleaseSchema,
  EvidenceContributionSchema,
  EvidenceSourceDefinitionSchema,
  ExposureCatalogSchema,
  FindingExpressionBankCatalogSchema,
  FindingProjectionCatalogSchema,
  FindingProjectionHorizonCatalogSchema,
  MeasurementCatalogSchema,
  MedicationIdentityDefinitionSchema,
  MedicationRegimenKnowledgeCatalogSchema,
  PersonalKnowledgeAuthoringAliasCatalogSchema,
  PersonalKnowledgePilotProfileSchema,
  PersonalKnowledgePrivateSourceCatalogSchema,
  RaceEthnicityCatalogSchema,
  SourceUseDecisionCatalogSchema,
  SupplementIdentityDefinitionSchema,
  UniversalActionResultAssemblyCatalogSchema,
  type ClinicalDurationProfileCatalog,
  type ConditionFindingProfileCatalog,
  type FindingExpressionBankCatalog,
  type FindingProjectionCatalog,
  type FindingProjectionHorizonCatalog,
  type RaceEthnicityCatalog,
  type UniversalActionResultAssemblyCatalog,
} from '@psychsim/schemas';
import {
  approvedCaseBlueprints,
  catalogs,
  medicationIdentities,
  startingClinic,
  validateCaseBlueprint,
  validateCatalogs,
  validateContentRegistry,
  validateMedicationIdentities,
  validateSupplementIdentities,
} from '@psychsim/content-runtime';
import { reviewerCaseBlueprints } from '@psychsim/content-runtime/reviewer';
import { resolveClinicForProgressionMode } from '@psychsim/engine';
import {
  adaptFocusedMedicationRegimenRoute,
  fingerprintInformationActionPayload,
} from '@psychsim/engine/authoring';
import { contentRegistry } from '../../../packages/content-runtime/src/registry';
import { supplementIdentities } from '../../../packages/content-runtime/src/supplement-identities';
import {
  developerLiteratureSynthesisProposals,
  validateLiteratureSynthesisProposals,
} from '../../../packages/content-runtime/src/literature-synthesis';
import { milestoneTwoClinicalAuditTickets } from '../../../packages/content-runtime/src/milestone-two-review-tickets';
import {
  developerSourceRequests,
  validateSourceRequests,
} from '../../../packages/content-runtime/src/source-requests';
import {
  developerTicketLiteratureScoutCatalog,
  validateTicketLiteratureScoutCatalog,
} from '../../../packages/content-runtime/src/ticket-literature-scout';
import {
  getSingleDiagnosisClassificationRegistryEntry,
  readDiagnosisClassification,
  validateDiagnosisClassification,
  validateDiagnosisClassificationBindings,
} from './diagnosis-classification';
import { validatePersonalKnowledgeAliasCatalog } from './developer-database-knowledge';
import { validatePersonalKnowledgePilotProfile } from './personal-knowledge-workspace';

const reviewCaseDirectory = resolve('content/cases/review');
const checkedInReviewTicketFiles = (await readdir(reviewCaseDirectory))
  .filter((fileName) => fileName.endsWith('.tickets.json'))
  .sort();
const checkedInReviewTickets = [
  ...milestoneTwoClinicalAuditTickets,
  ...(
    await Promise.all(
      checkedInReviewTicketFiles.map(async (fileName) =>
        ClinicalReviewTicketSchema.array().parse(
          JSON.parse(await readFile(resolve(reviewCaseDirectory, fileName), 'utf8')) as unknown,
        ),
      ),
    )
  ).flat(),
];

const reviewCaseBlueprints = await Promise.all(
  (await readdir(reviewCaseDirectory))
    .filter((fileName) => fileName.endsWith('.case.json'))
    .sort()
    .map(async (fileName) =>
      CaseBlueprintSchema.parse(
        JSON.parse(await readFile(resolve(reviewCaseDirectory, fileName), 'utf8')) as unknown,
      ),
    ),
);
const allReviewBlueprints = [...reviewCaseBlueprints, ...reviewerCaseBlueprints];

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
const registryValidation = validateContentRegistry(contentRegistry, catalogs, [
  ...approvedCaseBlueprints,
  ...allReviewBlueprints,
]);
const reviewerClinic = resolveClinicForProgressionMode(startingClinic, 'endgame', catalogs);
const registryIssues = [
  ...registryValidation.issues,
  ...missingRegistryPaths.map((path) => ({
    severity: 'error' as const,
    code: 'MISSING_REGISTRY_PATH',
    message: path,
  })),
];

const findingExpressionBankIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let findingExpressionBankCatalogForValidation: FindingExpressionBankCatalog | null = null;
const findingExpressionBankEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'finding_expression_bank_catalog',
);
if (findingExpressionBankEntries.length !== 1) {
  findingExpressionBankIssues.push({
    severity: 'error',
    code: 'FINDING_EXPRESSION_BANK_CATALOG_COUNT',
    message: `Expected one finding expression-bank catalog; found ${findingExpressionBankEntries.length}.`,
  });
} else {
  try {
    const entry = findingExpressionBankEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Expression banks remain outside the ordinary runtime until generated encounters consume reviewed frozen projections.',
      );
    }
    const catalog = FindingExpressionBankCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    findingExpressionBankCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.banks.map((bank) => bank.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error('Expression-bank registry membership must exactly match its catalog.');
    }
  } catch (error) {
    findingExpressionBankIssues.push({
      severity: 'error',
      code: 'INVALID_FINDING_EXPRESSION_BANK_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Finding expression-bank catalog validation failed.',
    });
  }
}

const findingProjectionIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let findingProjectionCatalogForValidation: FindingProjectionCatalog | null = null;
const findingProjectionEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'finding_projection_catalog',
);
if (findingProjectionEntries.length !== 1) {
  findingProjectionIssues.push({
    severity: 'error',
    code: 'FINDING_PROJECTION_CATALOG_COUNT',
    message: `Expected one finding-projection catalog; found ${findingProjectionEntries.length}.`,
  });
} else {
  try {
    const entry = findingProjectionEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Finding projections must remain outside the ordinary runtime until a generated encounter freezes their minimized results.',
      );
    }
    const catalog = FindingProjectionCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    findingProjectionCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.projections.map((projection) => projection.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error('Finding-projection registry membership must exactly match its catalog.');
    }
    const findingsById = new Map(catalogs.findings.map((finding) => [finding.id, finding]));
    const informationActionIds = new Set(catalogs.informationActions.map((action) => action.id));
    const expressionBanksByKey = new Map(
      (findingExpressionBankCatalogForValidation?.banks ?? []).map((bank) => [
        `${bank.id}\u0000${bank.contentVersion}`,
        bank,
      ]),
    );
    const mappingKeys = new Set<string>();
    for (const projection of catalog.projections) {
      if (projection.review.status !== 'approved') {
        throw new Error(`${projection.id} is not approved.`);
      }
      if (
        (projection.developerOpinionIds?.length ?? 0) === 0 &&
        projection.review.sourceUseNoteIds.length === 0
      ) {
        throw new Error(`${projection.id} has no reviewed provenance owner.`);
      }
      for (const binding of projection.sourceBindings) {
        if (binding.kind === 'proposition_evidence') {
          throw new Error(
            `${projection.id} uses proposition evidence before a proposition-definition catalog owner exists.`,
          );
        }
        const finding = findingsById.get(binding.findingDefinitionId);
        if (!finding) {
          throw new Error(
            `${projection.id} references unknown finding ${binding.findingDefinitionId}.`,
          );
        }
        if (finding.contentVersion !== binding.findingDefinitionContentVersion) {
          throw new Error(
            `${projection.id} pins ${finding.id}@${binding.findingDefinitionContentVersion}, current is ${finding.contentVersion}.`,
          );
        }
        if (finding.valueSpecification.kind !== 'outcome') {
          throw new Error(
            `${projection.id} uses outcome states for non-outcome finding ${finding.id}.`,
          );
        }
        const allowedStates = new Set([
          ...finding.valueSpecification.allowedValues,
          'unknown',
          'unassessed',
        ]);
        for (const state of binding.allowedStates) {
          if (!allowedStates.has(state)) {
            throw new Error(`${projection.id} uses unavailable state ${state} for ${finding.id}.`);
          }
        }
      }
      if (projection.target.kind === 'information_action') {
        if (!informationActionIds.has(projection.target.actionId)) {
          throw new Error(
            `${projection.id} references unknown information action ${projection.target.actionId}.`,
          );
        }
      } else {
        throw new Error(
          `${projection.id} targets an instrument item before an instrument-definition catalog owner exists.`,
        );
      }
      if (
        projection.expressionBankId !== null &&
        !expressionBanksByKey.has(
          `${projection.expressionBankId}\u0000${projection.expressionBankContentVersion}`,
        )
      ) {
        throw new Error(
          `${projection.id} references unknown expression bank ${projection.expressionBankId}@${projection.expressionBankContentVersion}.`,
        );
      }
      const mappingKey = JSON.stringify({
        sourceMatch: projection.sourceMatch,
        sourceBindings: projection.sourceBindings,
        target: projection.target,
      });
      if (mappingKeys.has(mappingKey)) {
        throw new Error(`${projection.id} duplicates an existing source-to-target mapping.`);
      }
      mappingKeys.add(mappingKey);
    }
  } catch (error) {
    findingProjectionIssues.push({
      severity: 'error',
      code: 'INVALID_FINDING_PROJECTION_CATALOG',
      message:
        error instanceof Error ? error.message : 'Finding-projection catalog validation failed.',
    });
  }
}

const findingProjectionHorizonIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let findingProjectionHorizonCatalogForValidation: FindingProjectionHorizonCatalog | null = null;
const findingProjectionHorizonEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'finding_projection_horizon_catalog',
);
if (findingProjectionHorizonEntries.length !== 1) {
  findingProjectionHorizonIssues.push({
    severity: 'error',
    code: 'FINDING_PROJECTION_HORIZON_CATALOG_COUNT',
    message: `Expected one finding-projection horizon catalog; found ${findingProjectionHorizonEntries.length}.`,
  });
} else {
  try {
    const entry = findingProjectionHorizonEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Finding-projection horizons must remain outside the ordinary runtime until an exact generated encounter freezes one.',
      );
    }
    const catalog = FindingProjectionHorizonCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    findingProjectionHorizonCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.horizons.map((horizon) => horizon.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error(
        'Finding-projection horizon registry membership must exactly match its catalog.',
      );
    }
    if (!findingProjectionCatalogForValidation) {
      throw new Error('Finding-projection horizons require a valid finding-projection catalog.');
    }
    const projectionById = new Map(
      findingProjectionCatalogForValidation.projections.map((projection) => [
        projection.id,
        projection,
      ]),
    );
    const referencedProjectionIds = new Set<string>();
    for (const definition of catalog.horizons) {
      if (definition.review.status !== 'approved') {
        throw new Error(`${definition.id} is not approved.`);
      }
      const horizonTargetKeys = new Set(
        definition.horizon.targets.map((availability) => JSON.stringify(availability.target)),
      );
      const usedTargetKeys = new Set<string>();
      for (const reference of definition.projectionRefs) {
        const projection = projectionById.get(reference.id);
        if (!projection) {
          throw new Error(`${definition.id} references unknown projection ${reference.id}.`);
        }
        if (projection.contentVersion !== reference.contentVersion) {
          throw new Error(
            `${definition.id} pins ${projection.id}@${reference.contentVersion}, current is ${projection.contentVersion}.`,
          );
        }
        referencedProjectionIds.add(projection.id);
        const targetKey = JSON.stringify(projection.target);
        const availability = definition.horizon.targets.find(
          (candidate) => JSON.stringify(candidate.target) === targetKey,
        );
        if (!availability) {
          throw new Error(
            `${definition.id} does not make projection target ${targetKey} available.`,
          );
        }
        if (
          !availability.allowedResponses.some(
            (response) => JSON.stringify(response) === JSON.stringify(projection.response),
          )
        ) {
          throw new Error(
            `${definition.id} does not allow response ${JSON.stringify(projection.response)} for ${projection.id}.`,
          );
        }
        usedTargetKeys.add(targetKey);
      }
      if (
        horizonTargetKeys.size !== usedTargetKeys.size ||
        [...horizonTargetKeys].some((targetKey) => !usedTargetKeys.has(targetKey))
      ) {
        throw new Error(`${definition.id} contains a target with no exact projection owner.`);
      }
    }
    const approvedProjectionIds = new Set(
      findingProjectionCatalogForValidation.projections
        .filter((projection) => projection.review.status === 'approved')
        .map((projection) => projection.id),
    );
    if (
      approvedProjectionIds.size !== referencedProjectionIds.size ||
      [...approvedProjectionIds].some((projectionId) => !referencedProjectionIds.has(projectionId))
    ) {
      throw new Error(
        'Every approved checked-in finding projection must belong to at least one exact horizon.',
      );
    }
  } catch (error) {
    findingProjectionHorizonIssues.push({
      severity: 'error',
      code: 'INVALID_FINDING_PROJECTION_HORIZON_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Finding-projection horizon catalog validation failed.',
    });
  }
}

const clinicalDurationProfileIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let clinicalDurationProfileCatalogForValidation: ClinicalDurationProfileCatalog | null = null;
const clinicalDurationProfileEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'clinical_duration_profile_catalog',
);
if (clinicalDurationProfileEntries.length !== 1) {
  clinicalDurationProfileIssues.push({
    severity: 'error',
    code: 'CLINICAL_DURATION_PROFILE_CATALOG_COUNT',
    message: `Expected one clinical-duration profile catalog; found ${clinicalDurationProfileEntries.length}.`,
  });
} else {
  try {
    const entry = clinicalDurationProfileEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Clinical-duration profiles must remain outside the ordinary runtime until an exact generated encounter freezes one.',
      );
    }
    const catalog = ClinicalDurationProfileCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    clinicalDurationProfileCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.profiles.map((profile) => profile.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error(
        'Clinical-duration profile registry membership must exactly match its catalog.',
      );
    }
    const diagnosesById = new Map(catalogs.diagnoses.map((diagnosis) => [diagnosis.id, diagnosis]));
    const knownSourceUseNoteIds = new Set(
      catalogs.diagnoses.flatMap((diagnosis) =>
        diagnosis.sourceUseNotes.map((sourceUseNote) => sourceUseNote.id),
      ),
    );
    for (const profile of catalog.profiles) {
      if (profile.review.status !== 'approved') {
        throw new Error(`${profile.id} is not approved.`);
      }
      if (
        (profile.developerOpinionIds?.length ?? 0) === 0 &&
        profile.review.sourceUseNoteIds.length === 0
      ) {
        throw new Error(`${profile.id} has no reviewed provenance owner.`);
      }
      for (const sourceUseNoteId of profile.review.sourceUseNoteIds) {
        if (!knownSourceUseNoteIds.has(sourceUseNoteId)) {
          throw new Error(`${profile.id} references unknown source-use note ${sourceUseNoteId}.`);
        }
      }
      if (profile.relatedDiagnosisId !== null && !diagnosesById.has(profile.relatedDiagnosisId)) {
        throw new Error(
          `${profile.id} references unknown related diagnosis ${profile.relatedDiagnosisId}.`,
        );
      }
      if (profile.id === 'duration-profile.mdd.current-episode') {
        if (
          profile.relatedDiagnosisId !== 'diagnosis.major-depressive-disorder' ||
          profile.interpretation !== 'supports_authored_state' ||
          profile.criterionId !== null ||
          profile.options.some((option) => option.unit !== 'week' || option.value < 2)
        ) {
          throw new Error(
            `${profile.id} must remain a within-state current-MDD profile with week values at or above two and no inferred criterion.`,
          );
        }
      }
    }
  } catch (error) {
    clinicalDurationProfileIssues.push({
      severity: 'error',
      code: 'INVALID_CLINICAL_DURATION_PROFILE_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Clinical-duration profile catalog validation failed.',
    });
  }
}

const universalActionResultAssemblyIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let universalActionResultAssemblyCatalogForValidation: UniversalActionResultAssemblyCatalog | null =
  null;
const universalActionResultAssemblyEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'universal_action_result_assembly_catalog',
);
if (universalActionResultAssemblyEntries.length !== 1) {
  universalActionResultAssemblyIssues.push({
    severity: 'error',
    code: 'UNIVERSAL_ACTION_RESULT_ASSEMBLY_CATALOG_COUNT',
    message: `Expected one universal action-result assembly catalog; found ${universalActionResultAssemblyEntries.length}.`,
  });
} else {
  try {
    const entry = universalActionResultAssemblyEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Universal action-result assemblies must remain outside the ordinary runtime until a generated template freezes one.',
      );
    }
    const catalog = UniversalActionResultAssemblyCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    universalActionResultAssemblyCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.assemblies.map((assembly) => assembly.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error(
        'Universal action-result assembly registry membership must exactly match its catalog.',
      );
    }
    const actionsById = new Map(catalogs.informationActions.map((action) => [action.id, action]));
    const durationProfilesByKey = new Map(
      (clinicalDurationProfileCatalogForValidation?.profiles ?? []).map((profile) => [
        `${profile.id}\u0000${profile.contentVersion}`,
        profile,
      ]),
    );
    const knownSourceUseNoteIds = new Set(
      catalogs.diagnoses.flatMap((diagnosis) =>
        diagnosis.sourceUseNotes.map((sourceUseNote) => sourceUseNote.id),
      ),
    );
    const findingProjectionActionIds = new Set(
      (findingProjectionHorizonCatalogForValidation?.horizons ?? []).flatMap((definition) =>
        definition.horizon.targets.flatMap((availability) =>
          availability.target.kind === 'information_action' ? [availability.target.actionId] : [],
        ),
      ),
    );
    const assembledFindingProjectionActionIds = new Set<string>();
    const referencedDurationProfileKeys = new Set<string>();
    for (const assembly of catalog.assemblies) {
      for (const action of assembly.actionCatalog.actions) {
        const canonicalAction = actionsById.get(action.id);
        if (!canonicalAction) {
          throw new Error(`${assembly.id} embeds unknown information action ${action.id}.`);
        }
        if (
          fingerprintInformationActionPayload(action) !==
          fingerprintInformationActionPayload(canonicalAction)
        ) {
          throw new Error(`${assembly.id} embeds stale information action ${action.id}.`);
        }
      }
      for (const definition of assembly.targetScopedPatientValueProjectionDefinitions) {
        const action = actionsById.get(definition.informationActionId);
        if (!action) {
          throw new Error(
            `${definition.id} references unknown action ${definition.informationActionId}.`,
          );
        }
        if (
          definition.informationActionPayloadFingerprint !==
          fingerprintInformationActionPayload(action)
        ) {
          throw new Error(`${definition.id} has a stale information-action fingerprint.`);
        }
        if (definition.review.status !== 'approved') {
          throw new Error(`${definition.id} is not approved.`);
        }
        if (
          (definition.developerOpinionIds?.length ?? 0) === 0 &&
          definition.review.sourceUseNoteIds.length === 0
        ) {
          throw new Error(`${definition.id} has no reviewed provenance owner.`);
        }
        for (const sourceUseNoteId of definition.review.sourceUseNoteIds) {
          if (!knownSourceUseNoteIds.has(sourceUseNoteId)) {
            throw new Error(
              `${definition.id} references unknown source-use note ${sourceUseNoteId}.`,
            );
          }
        }
        if (definition.valueKind === 'clinical_duration') {
          const profileKey = `${definition.durationProfileId}\u0000${definition.durationProfileContentVersion}`;
          const profile = durationProfilesByKey.get(profileKey);
          if (!profile) {
            throw new Error(
              `${definition.id} references unknown clinical-duration profile ${definition.durationProfileId}@${definition.durationProfileContentVersion}.`,
            );
          }
          if (
            definition.targetSelector.kind === 'condition_definition' &&
            profile.relatedDiagnosisId !== null &&
            profile.relatedDiagnosisId !== definition.targetSelector.diagnosisDefinitionId
          ) {
            throw new Error(
              `${definition.id} crosses duration profile ${profile.id} to unrelated diagnosis ${definition.targetSelector.diagnosisDefinitionId}.`,
            );
          }
          referencedDurationProfileKeys.add(profileKey);
        }
      }
      for (const recipe of assembly.recipes) {
        const action = actionsById.get(recipe.informationActionId);
        if (!action) {
          throw new Error(`${recipe.id} references unknown action ${recipe.informationActionId}.`);
        }
        if (
          recipe.informationActionPayloadFingerprint !== fingerprintInformationActionPayload(action)
        ) {
          throw new Error(`${recipe.id} has a stale information-action fingerprint.`);
        }
        if (recipe.sourceKinds.includes('finding_projections')) {
          if (!findingProjectionActionIds.has(recipe.informationActionId)) {
            throw new Error(
              `${recipe.id} declares finding projections without an exact checked-in horizon.`,
            );
          }
          assembledFindingProjectionActionIds.add(recipe.informationActionId);
        }
        if (recipe.sourceKinds.includes('target_scoped_patient_value_reveals')) {
          if (
            !assembly.targetScopedPatientValueProjectionDefinitions.some(
              (definition) => definition.informationActionId === recipe.informationActionId,
            )
          ) {
            throw new Error(
              `${recipe.id} declares target-scoped patient values without an exact checked-in definition.`,
            );
          }
        }
      }
    }
    if (
      findingProjectionActionIds.size !== assembledFindingProjectionActionIds.size ||
      [...findingProjectionActionIds].some(
        (actionId) => !assembledFindingProjectionActionIds.has(actionId),
      )
    ) {
      throw new Error(
        'Every checked-in finding-projection action requires a static universal result recipe.',
      );
    }
    const approvedDurationProfileKeys = new Set(
      (clinicalDurationProfileCatalogForValidation?.profiles ?? [])
        .filter((profile) => profile.review.status === 'approved')
        .map((profile) => `${profile.id}\u0000${profile.contentVersion}`),
    );
    if (
      approvedDurationProfileKeys.size !== referencedDurationProfileKeys.size ||
      [...approvedDurationProfileKeys].some(
        (profileKey) => !referencedDurationProfileKeys.has(profileKey),
      )
    ) {
      throw new Error(
        'Every approved checked-in clinical-duration profile requires an exact D-240 projection definition.',
      );
    }
  } catch (error) {
    universalActionResultAssemblyIssues.push({
      severity: 'error',
      code: 'INVALID_UNIVERSAL_ACTION_RESULT_ASSEMBLY_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Universal action-result assembly catalog validation failed.',
    });
  }
}

const conditionFindingProfileIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let conditionFindingProfileCatalogForValidation: ConditionFindingProfileCatalog | null = null;
const conditionFindingProfileEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'condition_finding_profile_catalog',
);
if (conditionFindingProfileEntries.length !== 1) {
  conditionFindingProfileIssues.push({
    severity: 'error',
    code: 'CONDITION_FINDING_PROFILE_CATALOG_COUNT',
    message: `Expected one condition-finding profile catalog; found ${conditionFindingProfileEntries.length}.`,
  });
} else {
  try {
    const entry = conditionFindingProfileEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Condition-finding profiles must remain authoring-only until an exact patient template binds them.',
      );
    }
    const catalog = ConditionFindingProfileCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    conditionFindingProfileCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.profiles.map((profile) => profile.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error(
        'Condition-finding profile registry membership must exactly match its catalog.',
      );
    }
    const diagnosesById = new Map(catalogs.diagnoses.map((diagnosis) => [diagnosis.id, diagnosis]));
    const findingsById = new Map(catalogs.findings.map((finding) => [finding.id, finding]));
    const knownSourceUseNoteIds = new Set(
      catalogs.diagnoses.flatMap((diagnosis) =>
        diagnosis.sourceUseNotes.map((sourceUseNote) => sourceUseNote.id),
      ),
    );
    for (const profile of catalog.profiles) {
      const diagnosis = diagnosesById.get(profile.conditionScope.diagnosisDefinitionId);
      if (!diagnosis) {
        throw new Error(
          `${profile.id} references unknown diagnosis ${profile.conditionScope.diagnosisDefinitionId}.`,
        );
      }
      if (diagnosis.contentVersion !== profile.conditionScope.diagnosisDefinitionContentVersion) {
        throw new Error(
          `${profile.id} pins ${diagnosis.id}@${profile.conditionScope.diagnosisDefinitionContentVersion}, current is ${diagnosis.contentVersion}.`,
        );
      }
      const reviewedMappings =
        profile.modelVersion === 'condition-finding-dimensions.v1'
          ? [
              profile,
              ...profile.requiredOutcomes,
              ...profile.dimensions,
              ...profile.dimensions.flatMap((dimension) => dimension.manifestations),
              ...profile.selectionRequirements,
            ]
          : [
              ...profile.requiredOutcomes,
              ...profile.cardinalityGroups,
              ...profile.cardinalityGroups.flatMap((group) => group.members),
            ];
      for (const mapping of reviewedMappings) {
        for (const sourceUseNoteId of mapping.review.sourceUseNoteIds) {
          if (!knownSourceUseNoteIds.has(sourceUseNoteId)) {
            throw new Error(
              `${mapping.id} references unknown diagnosis source-use note ${sourceUseNoteId}.`,
            );
          }
        }
      }
      const findingMappings =
        profile.modelVersion === 'condition-finding-dimensions.v1'
          ? [
              ...profile.requiredOutcomes,
              ...profile.dimensions.flatMap((dimension) => dimension.manifestations),
            ]
          : [
              ...profile.requiredOutcomes,
              ...profile.cardinalityGroups.flatMap((group) => group.members),
            ];
      for (const mapping of findingMappings) {
        const finding = findingsById.get(mapping.findingDefinitionId);
        if (!finding) {
          throw new Error(
            `${mapping.id} references unknown finding ${mapping.findingDefinitionId}.`,
          );
        }
        if (finding.contentVersion !== mapping.findingDefinitionContentVersion) {
          throw new Error(
            `${mapping.id} pins ${finding.id}@${mapping.findingDefinitionContentVersion}, current is ${finding.contentVersion}.`,
          );
        }
        if (
          finding.valueSpecification.kind !== 'outcome' ||
          !finding.valueSpecification.allowedValues.includes(mapping.proposedValue.value)
        ) {
          throw new Error(
            `${mapping.id} proposes invalid value ${mapping.proposedValue.value} for ${finding.id}.`,
          );
        }
      }
    }
  } catch (error) {
    conditionFindingProfileIssues.push({
      severity: 'error',
      code: 'INVALID_CONDITION_FINDING_PROFILE_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Condition-finding profile catalog validation failed.',
    });
  }
}

const measurementCatalogIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const measurementCatalogEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'measurement_catalog',
);
if (measurementCatalogEntries.length !== 1) {
  measurementCatalogIssues.push({
    severity: 'error',
    code: 'MEASUREMENT_CATALOG_COUNT',
    message: `Expected one measurement catalog; found ${measurementCatalogEntries.length}.`,
  });
} else {
  try {
    const entry = measurementCatalogEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Target measurements remain outside the ordinary runtime until the patient compiler exists.',
      );
    }
    const catalog = MeasurementCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = [
      ...catalog.measurements.map((definition) => definition.id),
      ...catalog.categoricalObservations.map((definition) => definition.id),
    ].sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error('Measurement registry membership must exactly match its catalog.');
    }
    const informationActionIds = new Set(catalogs.informationActions.map((action) => action.id));
    for (const definition of [...catalog.measurements, ...catalog.categoricalObservations]) {
      for (const actionId of definition.availableThroughActionIds) {
        if (!informationActionIds.has(actionId)) {
          throw new Error(`${definition.id} references unknown information action ${actionId}.`);
        }
      }
    }
  } catch (error) {
    measurementCatalogIssues.push({
      severity: 'error',
      code: 'INVALID_MEASUREMENT_CATALOG',
      message: error instanceof Error ? error.message : 'Measurement catalog validation failed.',
    });
  }
}

const authoringEvidenceEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'evidence_source' && !entry.runtimeIncluded,
);
const authoringEvidenceSources = await Promise.all(
  authoringEvidenceEntries.map(async (entry) =>
    EvidenceSourceDefinitionSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    ),
  ),
);
const authoringEvidenceIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = authoringEvidenceSources.flatMap((source, index) => {
  const entry = authoringEvidenceEntries[index]!;
  return source.id === entry.id
    ? []
    : [
        {
          severity: 'error' as const,
          code: 'AUTHORING_EVIDENCE_REGISTRY_MISMATCH',
          message: `${entry.id} resolves to ${source.id}.`,
        },
      ];
});
const duplicateEvidenceIds = [
  ...catalogs.evidenceSources.map((source) => source.id),
  ...authoringEvidenceSources.map((source) => source.id),
].filter((id, index, ids) => ids.indexOf(id) !== index);
for (const duplicate of new Set(duplicateEvidenceIds)) {
  authoringEvidenceIssues.push({
    severity: 'error',
    code: 'DUPLICATE_RUNTIME_AUTHORING_EVIDENCE_ID',
    message: duplicate,
  });
}

const sourceUseDecisionEntry = contentRegistry.entries.find(
  (entry) => entry.kind === 'source_use_decision_catalog',
);
const sourceUseDecisionCatalog = SourceUseDecisionCatalogSchema.parse(
  JSON.parse(
    await readFile(resolve(sourceUseDecisionEntry?.path ?? 'missing-source-use-catalog'), 'utf8'),
  ) as unknown,
);
const allEvidenceSourceIds = new Set([
  ...catalogs.evidenceSources.map((source) => source.id),
  ...authoringEvidenceSources.map((source) => source.id),
]);
const allEvidenceSourcesById = new Map(
  [...catalogs.evidenceSources, ...authoringEvidenceSources].map((source) => [source.id, source]),
);
const sourceUseDecisionIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const seenSourceUseDecisionIds = new Set<string>();
const seenSourceUseEvidenceIds = new Set<string>();
for (const decision of sourceUseDecisionCatalog.decisions) {
  if (seenSourceUseDecisionIds.has(decision.id)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'DUPLICATE_SOURCE_USE_DECISION_ID',
      message: decision.id,
    });
  }
  if (seenSourceUseEvidenceIds.has(decision.evidenceSourceId)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'DUPLICATE_SOURCE_USE_EVIDENCE_DECISION',
      message: decision.evidenceSourceId,
    });
  }
  if (!allEvidenceSourceIds.has(decision.evidenceSourceId)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'UNKNOWN_SOURCE_USE_EVIDENCE_SOURCE',
      message: decision.evidenceSourceId,
    });
  }
  const source = allEvidenceSourcesById.get(decision.evidenceSourceId);
  if (source) {
    const policyOverride =
      decision.legalBasis === 'written_permission' || decision.legalBasis === 'fair_use';
    if (
      !policyOverride &&
      decision.permissions.localFullTextStorage &&
      source.accessPolicy.fullTextStatus !== 'public'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_FULL_TEXT_ACCESS',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.localTextExtraction &&
      source.accessPolicy.localExtractionStatus !== 'allowed'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_EXTRACTION_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.aiAssistedProcessing &&
      source.accessPolicy.aiUseStatus !== 'permitted'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_AI_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      (decision.permissions.localStructuredIndexing ||
        decision.permissions.derivedClinicalContent) &&
      source.accessPolicy.adaptationStatus !== 'permitted'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_ADAPTATION_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.runtimeRedistribution &&
      !['public_domain', 'open_license'].includes(source.accessPolicy.reuseStatus)
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_REUSE_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (
      !policyOverride &&
      decision.permissions.commercialDistribution &&
      source.accessPolicy.commercialUseStatus !== 'permitted'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_EXCEEDS_COMMERCIAL_POLICY',
        message: decision.evidenceSourceId,
      });
    }
    if (decision.permissions.commercialDistribution && decision.nonCommercialOnly) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_COMMERCIAL_NONCOMMERCIAL_CONFLICT',
        message: decision.evidenceSourceId,
      });
    }
    if (
      decision.legalBasis === 'public_domain' &&
      source.accessPolicy.reuseStatus !== 'public_domain'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_PUBLIC_DOMAIN_MISMATCH',
        message: decision.evidenceSourceId,
      });
    }
    if (
      decision.legalBasis === 'open_license' &&
      source.accessPolicy.reuseStatus !== 'open_license'
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_OPEN_LICENSE_MISMATCH',
        message: decision.evidenceSourceId,
      });
    }
  }
  seenSourceUseDecisionIds.add(decision.id);
  seenSourceUseEvidenceIds.add(decision.evidenceSourceId);
}
for (const source of allEvidenceSourcesById.values()) {
  if (!seenSourceUseEvidenceIds.has(source.id)) {
    sourceUseDecisionIssues.push({
      severity: 'error',
      code: 'EVIDENCE_SOURCE_WITHOUT_USE_DECISION',
      message: source.id,
    });
  }
}

const raceEthnicityCatalogIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let raceEthnicityCatalogForValidation: RaceEthnicityCatalog | null = null;
const raceEthnicityEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'race_ethnicity_catalog',
);
if (raceEthnicityEntries.length !== 1) {
  raceEthnicityCatalogIssues.push({
    severity: 'error',
    code: 'RACE_ETHNICITY_CATALOG_COUNT',
    message: `Expected one race/ethnicity authoring catalog; found ${raceEthnicityEntries.length}.`,
  });
} else {
  try {
    const entry = raceEthnicityEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Race/ethnicity identity content must remain outside ordinary runtime until generated-patient activation is reviewed.',
      );
    }
    if (entry.dependsOnIds.includes('registry.catalog.variant-pools')) {
      throw new Error(
        'Race/ethnicity identity must never be inferred from fictional name or other cosmetic variant pools.',
      );
    }
    const catalog = RaceEthnicityCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    raceEthnicityCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.categories.map((category) => category.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error('Race/ethnicity registry membership must exactly match its catalog.');
    }
    const expectedCategories = new Map([
      ['race-ethnicity.american-indian-or-alaska-native', 'American Indian or Alaska Native'],
      ['race-ethnicity.asian', 'Asian'],
      ['race-ethnicity.black-or-african-american', 'Black or African American'],
      ['race-ethnicity.hispanic-or-latino', 'Hispanic or Latino'],
      ['race-ethnicity.middle-eastern-or-north-african', 'Middle Eastern or North African'],
      ['race-ethnicity.native-hawaiian-or-pacific-islander', 'Native Hawaiian or Pacific Islander'],
      ['race-ethnicity.white', 'White'],
    ]);
    if (
      catalog.categories.length !== expectedCategories.size ||
      catalog.categories.some((category) => expectedCategories.get(category.id) !== category.label)
    ) {
      throw new Error(
        'The first race/ethnicity catalog must contain exactly the seven 2024 OMB minimum categories.',
      );
    }
    const source = allEvidenceSourcesById.get(catalog.standard.evidenceSourceId);
    const sourceUse = sourceUseDecisionCatalog.decisions.find(
      (decision) => decision.id === catalog.standard.sourceUseDecisionId,
    );
    if (
      source?.id !== 'evidence.omb.spd15.2024' ||
      sourceUse?.evidenceSourceId !== source.id ||
      sourceUse.decisionStatus !== 'permitted_with_conditions' ||
      !sourceUse.permissions.derivedClinicalContent ||
      !sourceUse.allowedContributionTypes.includes('classification_mapping')
    ) {
      throw new Error(
        'The race/ethnicity catalog requires the exact source-cleared 2024 OMB classification mapping.',
      );
    }
  } catch (error) {
    raceEthnicityCatalogIssues.push({
      severity: 'error',
      code: 'INVALID_RACE_ETHNICITY_CATALOG',
      message: error instanceof Error ? error.message : 'Race/ethnicity catalog validation failed.',
    });
  }
}

const medicationIdentityIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const medicationIdentityRegistryEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'medication_identity_catalog',
);
if (
  medicationIdentityRegistryEntries.length !== 1 ||
  medicationIdentityRegistryEntries[0]?.runtimeIncluded !== true
) {
  medicationIdentityIssues.push({
    severity: 'error',
    code: 'INVALID_MEDICATION_IDENTITY_CATALOG_REGISTRATION',
    message: `Expected one runtime-included medication identity catalog; found ${medicationIdentityRegistryEntries.length}.`,
  });
} else {
  const entry = medicationIdentityRegistryEntries[0]!;
  const registeredIdentityIds = [...entry.categoryIds].sort();
  const importedIdentityIds = medicationIdentities.map((identity) => identity.id).sort();
  if (JSON.stringify(registeredIdentityIds) !== JSON.stringify(importedIdentityIds)) {
    medicationIdentityIssues.push({
      severity: 'error',
      code: 'MEDICATION_IDENTITY_REGISTRY_MEMBER_MISMATCH',
      message: 'The medication identity registry member list must exactly match static imports.',
    });
  }
  const identityFiles = (await readdir(resolve(entry.path)))
    .filter((fileName) => fileName.endsWith('.identity.json'))
    .sort();
  const diskIdentities = await Promise.all(
    identityFiles.map(async (fileName) =>
      MedicationIdentityDefinitionSchema.parse(
        JSON.parse(await readFile(resolve(entry.path, fileName), 'utf8')) as unknown,
      ),
    ),
  );
  const importedById = new Map(medicationIdentities.map((identity) => [identity.id, identity]));
  const diskById = new Map(diskIdentities.map((identity) => [identity.id, identity]));
  medicationIdentityIssues.push(
    ...validateMedicationIdentities(diskIdentities, catalogs).issues.map((issue) => ({
      severity: 'error' as const,
      code: `DISK_${issue.code}`,
      message: issue.message,
    })),
  );
  diskIdentities.forEach((identity, index) => {
    const expectedFileName = `${identity.id.replace(/^medication\./, '')}.identity.json`;
    if (identityFiles[index] !== expectedFileName) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'MEDICATION_IDENTITY_FILENAME_MISMATCH',
        message: `${identityFiles[index]} resolves to ${identity.id}; expected ${expectedFileName}.`,
      });
    }
  });
  for (const identity of diskIdentities) {
    const imported = importedById.get(identity.id);
    if (!imported) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'UNIMPORTED_MEDICATION_IDENTITY_FILE',
        message: identity.id,
      });
    } else if (JSON.stringify(imported) !== JSON.stringify(identity)) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'MEDICATION_IDENTITY_IMPORT_MISMATCH',
        message: identity.id,
      });
    }
  }
  for (const identity of medicationIdentities) {
    if (!diskById.has(identity.id)) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'MISSING_MEDICATION_IDENTITY_FILE',
        message: identity.id,
      });
    }
    const decision = sourceUseDecisionCatalog.decisions.find(
      (candidate) => candidate.id === identity.rxnorm.sourceUseDecisionId,
    );
    if (
      !decision ||
      decision.evidenceSourceId !== identity.rxnorm.evidenceSourceId ||
      !decision.permissions.localStructuredIndexing ||
      !decision.permissions.runtimeRedistribution
    ) {
      medicationIdentityIssues.push({
        severity: 'error',
        code: 'INVALID_MEDICATION_IDENTITY_SOURCE_USE',
        message: `${identity.id}: ${identity.rxnorm.sourceUseDecisionId}`,
      });
    }
  }
  medicationIdentityIssues.push(
    ...validateMedicationIdentities(medicationIdentities, catalogs).issues.map((issue) => ({
      severity: 'error' as const,
      code: issue.code,
      message: issue.message,
    })),
  );
}

const medicationRegimenKnowledgeIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let medicationRegimenKnowledgeCatalogForValidation: ReturnType<
  typeof MedicationRegimenKnowledgeCatalogSchema.parse
> | null = null;
const medicationRegimenKnowledgeEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'medication_regimen_knowledge_catalog',
);
if (medicationRegimenKnowledgeEntries.length !== 1) {
  medicationRegimenKnowledgeIssues.push({
    severity: 'error',
    code: 'MEDICATION_REGIMEN_KNOWLEDGE_CATALOG_COUNT',
    message: `Expected one medication-regimen knowledge catalog; found ${medicationRegimenKnowledgeEntries.length}.`,
  });
} else {
  try {
    const entry = medicationRegimenKnowledgeEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Medication-regimen knowledge remains outside the ordinary runtime until the decision-policy compiler exists.',
      );
    }
    const catalog = MedicationRegimenKnowledgeCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    medicationRegimenKnowledgeCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = [
      ...catalog.medicationClasses,
      ...catalog.classMemberships,
      ...catalog.focusedRoutes,
      ...catalog.contributors,
    ]
      .map((record) => record.id)
      .sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error(
        'Medication-regimen registry membership must exactly match its owned records.',
      );
    }

    const medicationIdentityVersions = new Map(
      medicationIdentities.map((identity) => [identity.id, identity.contentVersion]),
    );
    const medicationClassVersions = new Map(
      catalog.medicationClasses.map((definition) => [definition.id, definition.contentVersion]),
    );
    for (const membership of catalog.classMemberships) {
      const identityVersion = medicationIdentityVersions.get(membership.medicationIdentityId);
      if (!identityVersion) {
        throw new Error(
          `${membership.id} references unknown medication identity ${membership.medicationIdentityId}.`,
        );
      }
      if (identityVersion !== membership.medicationIdentityContentVersion) {
        throw new Error(
          `${membership.id} pins ${membership.medicationIdentityId}@${membership.medicationIdentityContentVersion}; expected ${identityVersion}.`,
        );
      }
      const medicationClassVersion = medicationClassVersions.get(membership.medicationClassId);
      if (
        !medicationClassVersion ||
        medicationClassVersion !== membership.medicationClassContentVersion
      ) {
        throw new Error(
          `${membership.id} references unknown or mismatched medication class ${membership.medicationClassId}@${membership.medicationClassContentVersion}.`,
        );
      }
    }

    const validateTarget = (
      target:
        | { kind: 'any_medication' }
        | {
            kind: 'medication';
            medicationIdentityId: string;
            medicationIdentityContentVersion: string;
          }
        | {
            kind: 'class';
            medicationClassId: string;
            medicationClassContentVersion: string;
          },
      ownerId: string,
    ): void => {
      if (target.kind === 'any_medication') return;
      if (target.kind === 'medication') {
        const version = medicationIdentityVersions.get(target.medicationIdentityId);
        if (!version || version !== target.medicationIdentityContentVersion) {
          throw new Error(
            `${ownerId} references unknown or mismatched medication ${target.medicationIdentityId}@${target.medicationIdentityContentVersion}.`,
          );
        }
        return;
      }
      const version = medicationClassVersions.get(target.medicationClassId);
      if (!version || version !== target.medicationClassContentVersion) {
        throw new Error(
          `${ownerId} references unknown or mismatched medication class ${target.medicationClassId}@${target.medicationClassContentVersion}.`,
        );
      }
    };

    const validateTransitionPredicateTargets = (
      predicate: ReturnType<
        typeof MedicationRegimenKnowledgeCatalogSchema.parse
      >['focusedRoutes'][number]['transitionMatch'],
      ownerId: string,
    ): void => {
      if (predicate.type === 'any' || predicate.type === 'all') {
        predicate.predicates.forEach((child) => validateTransitionPredicateTargets(child, ownerId));
        return;
      }
      if (predicate.type === 'not') {
        validateTransitionPredicateTargets(predicate.predicate, ownerId);
        return;
      }
      validateTarget(predicate.target, ownerId);
    };

    for (const route of catalog.focusedRoutes) {
      validateTransitionPredicateTargets(route.transitionMatch, route.id);
      if (route.qualitativeDiagnosisRuleRef) {
        const diagnosis = catalogs.diagnoses.find(
          (candidate) => candidate.id === route.qualitativeDiagnosisRuleRef!.ownerId,
        );
        const diagnosisRules = diagnosis
          ? [
              ...diagnosis.baseRules,
              ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
              ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
            ]
          : [];
        const qualitativeRule = diagnosisRules.find(
          (candidate) => candidate.id === route.qualitativeDiagnosisRuleRef!.id,
        );
        if (
          !diagnosis ||
          diagnosis.contentVersion !== route.qualitativeDiagnosisRuleRef.ownerContentVersion ||
          route.qualitativeDiagnosisRuleRef.contentVersion !== diagnosis.contentVersion ||
          !qualitativeRule
        ) {
          throw new Error(
            `${route.id} references unknown or mismatched qualitative diagnosis rule ${route.qualitativeDiagnosisRuleRef.id}@${route.qualitativeDiagnosisRuleRef.contentVersion} owned by ${route.qualitativeDiagnosisRuleRef.ownerId}@${route.qualitativeDiagnosisRuleRef.ownerContentVersion}.`,
          );
        }
        const adapted = adaptFocusedMedicationRegimenRoute({
          route,
          diagnosis,
          medicationClasses: catalog.medicationClasses,
          classMemberships: catalog.classMemberships,
        });
        if (!adapted.ok) {
          throw new Error(
            `${route.id} cannot compile into a decision-rule candidate: ${adapted.error.code}: ${adapted.error.message}`,
          );
        }
      }
    }
    for (const contributor of catalog.contributors) {
      validateTransitionPredicateTargets(contributor.transitionWhen, contributor.id);
    }
    for (const sourceUse of catalog.sourceUseNotes) {
      for (const evidenceSourceId of sourceUse.evidenceSourceIds) {
        if (!allEvidenceSourceIds.has(evidenceSourceId)) {
          throw new Error(
            `${sourceUse.id} references unknown evidence source ${evidenceSourceId}.`,
          );
        }
      }
    }
  } catch (error) {
    medicationRegimenKnowledgeIssues.push({
      severity: 'error',
      code: 'INVALID_MEDICATION_REGIMEN_KNOWLEDGE_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Medication-regimen knowledge catalog validation failed.',
    });
  }
}

const decisionPolicyIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let decisionPolicyCatalogForValidation: ReturnType<
  typeof DecisionPolicyCatalogSchema.parse
> | null = null;
const decisionPolicyEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'decision_policy_catalog',
);
if (decisionPolicyEntries.length !== 1) {
  decisionPolicyIssues.push({
    severity: 'error',
    code: 'DECISION_POLICY_CATALOG_COUNT',
    message: `Expected one decision-policy catalog; found ${decisionPolicyEntries.length}.`,
  });
} else {
  try {
    const entry = decisionPolicyEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Decision policies remain outside the ordinary runtime until generated encounters consume compiled rubrics.',
      );
    }
    const catalog = DecisionPolicyCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    decisionPolicyCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.policies.map((policy) => policy.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error('Decision-policy registry membership must exactly match its policies.');
    }

    const referenceTargets = new Map<
      string,
      {
        contentVersion: string;
        ownerId: string;
        ownerContentVersion: string;
      }
    >();
    const registerReferenceTarget = (
      kind: string,
      id: string,
      contentVersion: string,
      ownerId: string,
      ownerContentVersion: string,
    ): void => {
      const key = `${kind}:${id}`;
      if (referenceTargets.has(key)) {
        throw new Error(`More than one decision-rule owner claims ${key}.`);
      }
      referenceTargets.set(key, { contentVersion, ownerId, ownerContentVersion });
    };
    for (const diagnosis of catalogs.diagnoses) {
      const diagnosisRules = [
        ...diagnosis.baseRules,
        ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
        ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
      ];
      for (const rule of diagnosisRules) {
        registerReferenceTarget(
          'diagnosis_rule',
          rule.id,
          diagnosis.contentVersion,
          diagnosis.id,
          diagnosis.contentVersion,
        );
      }
    }
    for (const route of medicationRegimenKnowledgeCatalogForValidation?.focusedRoutes ?? []) {
      registerReferenceTarget(
        'medication_regimen_route',
        route.id,
        route.contentVersion,
        route.owner.id,
        route.owner.contentVersion,
      );
    }
    for (const contributor of medicationRegimenKnowledgeCatalogForValidation?.contributors ?? []) {
      registerReferenceTarget(
        'medication_regimen_contributor',
        contributor.id,
        contributor.contentVersion,
        contributor.owner.id,
        contributor.owner.contentVersion,
      );
    }

    const policyVersions = new Map(
      catalog.policies.map((policy) => [policy.id, policy.contentVersion] as const),
    );
    const diagnosisVersions = new Map(
      catalogs.diagnoses.map((diagnosis) => [diagnosis.id, diagnosis.contentVersion] as const),
    );
    const medicationIdentityVersions = new Map(
      medicationIdentities.map((identity) => [identity.id, identity.contentVersion] as const),
    );
    const findingVersions = new Map(
      catalogs.findings.map((finding) => [finding.id, finding.contentVersion] as const),
    );
    const reactionVersions = new Map(
      [
        ...catalogs.reactionConcepts.nonMedicationTriggers,
        ...catalogs.reactionConcepts.manifestations,
        ...catalogs.reactionConcepts.medicationSelectionPolicies,
      ].map((record) => [record.id, record.contentVersion] as const),
    );
    const validateOwner = (
      ownerKind:
        | 'diagnosis_route'
        | 'decision_policy'
        | 'medication'
        | 'reaction'
        | 'finding'
        | 'diagnosis',
      ownerId: string,
      ownerContentVersion: string,
      recordId: string,
    ): void => {
      const version =
        ownerKind === 'diagnosis_route' || ownerKind === 'diagnosis'
          ? diagnosisVersions.get(ownerId)
          : ownerKind === 'decision_policy'
            ? policyVersions.get(ownerId)
            : ownerKind === 'medication'
              ? medicationIdentityVersions.get(ownerId)
              : ownerKind === 'reaction'
                ? reactionVersions.get(ownerId)
                : ownerKind === 'finding'
                  ? findingVersions.get(ownerId)
                  : undefined;
      if (!version || version !== ownerContentVersion) {
        throw new Error(
          `${recordId} pins unknown or mismatched ${ownerKind} owner ${ownerId}@${ownerContentVersion}.`,
        );
      }
    };
    for (const route of medicationRegimenKnowledgeCatalogForValidation?.focusedRoutes ?? []) {
      validateOwner(route.owner.kind, route.owner.id, route.owner.contentVersion, route.id);
    }
    for (const contributor of medicationRegimenKnowledgeCatalogForValidation?.contributors ?? []) {
      validateOwner(
        contributor.owner.kind,
        contributor.owner.id,
        contributor.owner.contentVersion,
        contributor.id,
      );
    }

    for (const policy of catalog.policies) {
      const references = [policy.primaryRouteRef, ...policy.explicitSupportingRuleRefs];
      for (const reference of references) {
        const target = referenceTargets.get(`${reference.kind}:${reference.id}`);
        if (
          !target ||
          target.contentVersion !== reference.contentVersion ||
          target.ownerId !== reference.ownerId ||
          target.ownerContentVersion !== reference.ownerContentVersion
        ) {
          throw new Error(
            `${policy.id} pins unknown or mismatched ${reference.kind} ${reference.id}@${reference.contentVersion} owned by ${reference.ownerId}@${reference.ownerContentVersion}.`,
          );
        }
      }
    }
    for (const sourceUse of catalog.sourceUseNotes) {
      for (const evidenceSourceId of sourceUse.evidenceSourceIds) {
        if (!allEvidenceSourceIds.has(evidenceSourceId)) {
          throw new Error(
            `${sourceUse.id} references unknown evidence source ${evidenceSourceId}.`,
          );
        }
      }
    }
  } catch (error) {
    decisionPolicyIssues.push({
      severity: 'error',
      code: 'INVALID_DECISION_POLICY_CATALOG',
      message:
        error instanceof Error ? error.message : 'Decision-policy catalog validation failed.',
    });
  }
}

const decisionBalanceIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let decisionBalanceCatalogForValidation: ReturnType<
  typeof DecisionBalanceCatalogSchema.parse
> | null = null;
const decisionBalanceEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'decision_balance_catalog',
);
if (decisionBalanceEntries.length !== 1) {
  decisionBalanceIssues.push({
    severity: 'error',
    code: 'DECISION_BALANCE_CATALOG_COUNT',
    message: `Expected one decision-balance catalog; found ${decisionBalanceEntries.length}.`,
  });
} else {
  try {
    const entry = decisionBalanceEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Decision balances must remain outside Player and portable Reviewer runtimes.',
      );
    }
    const catalog = DecisionBalanceCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    decisionBalanceCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    if (
      JSON.stringify([...entry.categoryIds].sort()) !==
      JSON.stringify(catalog.balances.map((balance) => balance.id).sort())
    ) {
      throw new Error('Decision-balance registry membership must exactly match its balances.');
    }

    const diagnosisRuleOwners = new Map<
      string,
      {
        contentVersion: string;
        ownerId: string;
        ownerContentVersion: string;
        reviewStatus: string;
        requiredBalanceKind:
          | 'matched_rule'
          | 'triggered_information_prerequisite'
          | 'information_requirement';
      }
    >();
    for (const diagnosis of catalogs.diagnoses) {
      for (const rule of [
        ...diagnosis.baseRules,
        ...(diagnosis.severityAxis?.levels.flatMap((level) => level.rules) ?? []),
        ...diagnosis.specifiers.flatMap((specifier) => specifier.rules),
      ]) {
        diagnosisRuleOwners.set(rule.id, {
          contentVersion: diagnosis.contentVersion,
          ownerId: diagnosis.id,
          ownerContentVersion: diagnosis.contentVersion,
          reviewStatus: rule.review.status,
          requiredBalanceKind:
            rule.target.kind === 'information_action' &&
            rule.stance === 'required' &&
            rule.selectionWhen?.type === 'anyMedicationStarted' &&
            rule.patientWhen?.type === 'clinicalTagPresent'
              ? 'triggered_information_prerequisite'
              : rule.target.kind === 'information_action' &&
                  rule.stance === 'required' &&
                  rule.selectionWhen === null &&
                  rule.patientWhen?.type === 'clinicalTagPresent'
                ? 'information_requirement'
                : 'matched_rule',
        });
      }
    }
    const regimenRuleOwners = new Map([
      ...(medicationRegimenKnowledgeCatalogForValidation?.focusedRoutes ?? []).map(
        (route) =>
          [
            `medication_regimen_route:${route.id}`,
            {
              contentVersion: route.contentVersion,
              ownerId: route.owner.id,
              ownerContentVersion: route.owner.contentVersion,
              reviewStatus: route.review.status,
              requiredBalanceKind: 'matched_rule' as const,
            },
          ] as const,
      ),
      ...(medicationRegimenKnowledgeCatalogForValidation?.contributors ?? []).map(
        (contributor) =>
          [
            `medication_regimen_contributor:${contributor.id}`,
            {
              contentVersion: contributor.contentVersion,
              ownerId: contributor.owner.id,
              ownerContentVersion: contributor.owner.contentVersion,
              reviewStatus: contributor.review.status,
              requiredBalanceKind: 'matched_rule' as const,
            },
          ] as const,
      ),
    ]);
    for (const balance of catalog.balances) {
      const target =
        balance.ruleRef.kind === 'diagnosis_rule'
          ? diagnosisRuleOwners.get(balance.ruleRef.id)
          : regimenRuleOwners.get(`${balance.ruleRef.kind}:${balance.ruleRef.id}`);
      if (
        !target ||
        target.contentVersion !== balance.ruleRef.contentVersion ||
        target.ownerId !== balance.ruleRef.ownerId ||
        target.ownerContentVersion !== balance.ruleRef.ownerContentVersion
      ) {
        throw new Error(
          `${balance.id} pins unknown or stale ${balance.ruleRef.kind} ${balance.ruleRef.id}@${balance.ruleRef.contentVersion} owned by ${balance.ruleRef.ownerId}@${balance.ruleRef.ownerContentVersion}.`,
        );
      }
      if (target.reviewStatus !== 'approved') {
        throw new Error(
          `${balance.id} cannot assign points to ${target.reviewStatus} qualitative rule ${balance.ruleRef.id}.`,
        );
      }
      const actualBalanceKind =
        'balanceKind' in balance ? balance.balanceKind : ('matched_rule' as const);
      if (actualBalanceKind !== target.requiredBalanceKind) {
        throw new Error(
          `${balance.id} does not use the balance shape required by ${balance.ruleRef.id}.`,
        );
      }
    }
  } catch (error) {
    decisionBalanceIssues.push({
      severity: 'error',
      code: 'INVALID_DECISION_BALANCE_CATALOG',
      message:
        error instanceof Error ? error.message : 'Decision-balance catalog validation failed.',
    });
  }
}

const supplementIdentityIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const supplementIdentityRegistryEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'supplement_identity_catalog',
);
if (
  supplementIdentityRegistryEntries.length !== 1 ||
  supplementIdentityRegistryEntries[0]?.runtimeIncluded !== true
) {
  supplementIdentityIssues.push({
    severity: 'error',
    code: 'INVALID_SUPPLEMENT_IDENTITY_CATALOG_REGISTRATION',
    message: `Expected one runtime-included supplement identity catalog; found ${supplementIdentityRegistryEntries.length}.`,
  });
} else {
  const entry = supplementIdentityRegistryEntries[0]!;
  const registeredIds = [...entry.categoryIds].sort();
  const importedIds = supplementIdentities.map((identity) => identity.id).sort();
  if (JSON.stringify(registeredIds) !== JSON.stringify(importedIds)) {
    supplementIdentityIssues.push({
      severity: 'error',
      code: 'SUPPLEMENT_IDENTITY_REGISTRY_MEMBER_MISMATCH',
      message: 'The supplement identity registry member list must exactly match static imports.',
    });
  }
  const identityFiles = (await readdir(resolve(entry.path)))
    .filter((fileName) => fileName.endsWith('.identity.json'))
    .sort();
  const diskIdentities = await Promise.all(
    identityFiles.map(async (fileName) =>
      SupplementIdentityDefinitionSchema.parse(
        JSON.parse(await readFile(resolve(entry.path, fileName), 'utf8')) as unknown,
      ),
    ),
  );
  const importedById = new Map(supplementIdentities.map((identity) => [identity.id, identity]));
  const diskById = new Map(diskIdentities.map((identity) => [identity.id, identity]));
  diskIdentities.forEach((identity, index) => {
    const expectedFileName = `${identity.id.replace(/^supplement\./, '')}.identity.json`;
    if (identityFiles[index] !== expectedFileName) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'SUPPLEMENT_IDENTITY_FILENAME_MISMATCH',
        message: `${identityFiles[index]} resolves to ${identity.id}; expected ${expectedFileName}.`,
      });
    }
    const imported = importedById.get(identity.id);
    if (!imported) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'UNIMPORTED_SUPPLEMENT_IDENTITY_FILE',
        message: identity.id,
      });
    } else if (JSON.stringify(imported) !== JSON.stringify(identity)) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'SUPPLEMENT_IDENTITY_IMPORT_MISMATCH',
        message: identity.id,
      });
    }
  });
  for (const identity of supplementIdentities) {
    if (!diskById.has(identity.id)) {
      supplementIdentityIssues.push({
        severity: 'error',
        code: 'MISSING_SUPPLEMENT_IDENTITY_FILE',
        message: identity.id,
      });
    }
    for (const identifier of identity.identifiers) {
      const decision = sourceUseDecisionCatalog.decisions.find(
        (candidate) => candidate.id === identifier.sourceUseDecisionId,
      );
      if (
        !decision ||
        decision.evidenceSourceId !== identifier.evidenceSourceId ||
        !decision.permissions.localStructuredIndexing ||
        !decision.permissions.runtimeRedistribution ||
        !decision.allowedContributionTypes.includes('classification_mapping')
      ) {
        supplementIdentityIssues.push({
          severity: 'error',
          code: 'INVALID_SUPPLEMENT_IDENTITY_SOURCE_USE',
          message: `${identity.id}: ${identifier.sourceUseDecisionId}`,
        });
      }
    }
  }
  supplementIdentityIssues.push(
    ...validateSupplementIdentities(
      diskIdentities,
      [...catalogs.evidenceSources, ...authoringEvidenceSources],
      medicationIdentities.map((identity) => identity.id),
    ).issues.map((issue) => ({
      severity: 'error' as const,
      code: `DISK_${issue.code}`,
      message: issue.message,
    })),
    ...validateSupplementIdentities(
      supplementIdentities,
      [...catalogs.evidenceSources, ...authoringEvidenceSources],
      medicationIdentities.map((identity) => identity.id),
    ).issues.map((issue) => ({
      severity: 'error' as const,
      code: issue.code,
      message: issue.message,
    })),
  );
}

const exposureCatalogIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
let exposureCatalogForValidation: ReturnType<typeof ExposureCatalogSchema.parse> | null = null;
const exposureCatalogEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'exposure_catalog',
);
if (exposureCatalogEntries.length !== 1) {
  exposureCatalogIssues.push({
    severity: 'error',
    code: 'EXPOSURE_CATALOG_COUNT',
    message: `Expected one exposure catalog; found ${exposureCatalogEntries.length}.`,
  });
} else {
  try {
    const entry = exposureCatalogEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error(
        'Exposure identities and generation priors remain outside the ordinary runtime until the patient compiler exists.',
      );
    }
    const catalog = ExposureCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    exposureCatalogForValidation = catalog;
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const registeredIds = [...entry.categoryIds].sort();
    const catalogIds = catalog.otherSubstanceIdentities.map((identity) => identity.id).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(catalogIds)) {
      throw new Error('Exposure registry membership must exactly match its owned identities.');
    }

    const identityVersionsByKind = {
      medication: new Map(
        medicationIdentities.map((identity) => [identity.id, identity.contentVersion]),
      ),
      supplement: new Map(
        supplementIdentities.map((identity) => [identity.id, identity.contentVersion]),
      ),
      other_substance: new Map(
        catalog.otherSubstanceIdentities.map((identity) => [identity.id, identity.contentVersion]),
      ),
    };
    for (const prior of catalog.misuseGenerationPriors) {
      const actualVersion = identityVersionsByKind[prior.agent.kind].get(prior.agent.identityId);
      if (!actualVersion) {
        throw new Error(
          `${prior.id} references unknown ${prior.agent.kind} identity ${prior.agent.identityId}.`,
        );
      }
      if (actualVersion !== prior.agent.identityContentVersion) {
        throw new Error(
          `${prior.id} pins ${prior.agent.identityId}@${prior.agent.identityContentVersion}; expected ${actualVersion}.`,
        );
      }
    }
    for (const sourceUse of catalog.sourceUseNotes) {
      for (const evidenceSourceId of sourceUse.evidenceSourceIds) {
        if (!allEvidenceSourceIds.has(evidenceSourceId)) {
          throw new Error(
            `${sourceUse.id} references unknown evidence source ${evidenceSourceId}.`,
          );
        }
      }
    }
  } catch (error) {
    exposureCatalogIssues.push({
      severity: 'error',
      code: 'INVALID_EXPOSURE_CATALOG',
      message: error instanceof Error ? error.message : 'Exposure catalog validation failed.',
    });
  }
}

interface ContributionUse {
  contribution: ReturnType<typeof EvidenceContributionSchema.parse>;
  owner: string;
  runtimeIncluded: boolean;
}

const collectContributionUses = (
  value: unknown,
  owner: string,
  runtimeIncluded: boolean,
  target: ContributionUse[],
): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectContributionUses(item, owner, runtimeIncluded, target));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (
    ['formal_publication', 'expert_opinion'].includes(String(record.authority)) &&
    Array.isArray(record.evidenceSourceIds) &&
    typeof record.contribution === 'string' &&
    typeof record.generatedBy === 'string'
  ) {
    const parsed = EvidenceContributionSchema.safeParse(record);
    if (parsed.success) {
      target.push({ contribution: parsed.data, owner, runtimeIncluded });
    }
  }
  Object.values(record).forEach((item) =>
    collectContributionUses(item, owner, runtimeIncluded, target),
  );
};

const contributionUses: ContributionUse[] = [];
collectContributionUses(catalogs, 'runtime catalogs', true, contributionUses);
approvedCaseBlueprints.forEach((blueprint) =>
  collectContributionUses(blueprint, blueprint.id, true, contributionUses),
);
allReviewBlueprints.forEach((blueprint) =>
  collectContributionUses(blueprint, blueprint.id, false, contributionUses),
);
if (exposureCatalogForValidation) {
  collectContributionUses(
    exposureCatalogForValidation,
    exposureCatalogForValidation.id,
    false,
    contributionUses,
  );
}
if (medicationRegimenKnowledgeCatalogForValidation) {
  collectContributionUses(
    medicationRegimenKnowledgeCatalogForValidation,
    medicationRegimenKnowledgeCatalogForValidation.id,
    false,
    contributionUses,
  );
}
if (decisionPolicyCatalogForValidation) {
  collectContributionUses(
    decisionPolicyCatalogForValidation,
    decisionPolicyCatalogForValidation.id,
    false,
    contributionUses,
  );
}
const sourceUseDecisionByEvidenceId = new Map(
  sourceUseDecisionCatalog.decisions.map((decision) => [decision.evidenceSourceId, decision]),
);
for (const use of contributionUses) {
  if (use.contribution.authority !== 'formal_publication') continue;
  for (const evidenceSourceId of use.contribution.evidenceSourceIds) {
    const decision = sourceUseDecisionByEvidenceId.get(evidenceSourceId);
    if (!decision) continue;
    if (!decision.permissions.derivedClinicalContent) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_DERIVED_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
    const disallowedContributionTypes = use.contribution.contributionTypes.filter(
      (contributionType) => !decision.allowedContributionTypes.includes(contributionType),
    );
    if (disallowedContributionTypes.length > 0) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_CONTRIBUTION_TYPE',
        message: `${use.owner}: ${evidenceSourceId} does not allow ${disallowedContributionTypes.join(', ')}`,
      });
    }
    if (use.contribution.generatedBy === 'ai' && !decision.permissions.aiAssistedProcessing) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_AI_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
    if (
      (use.contribution.sourceDocumentId !== null || use.contribution.sourceChunkIds.length > 0) &&
      !decision.permissions.localTextExtraction
    ) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_EXTRACTED_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
    if (use.runtimeIncluded && !decision.permissions.runtimeRedistribution) {
      sourceUseDecisionIssues.push({
        severity: 'error',
        code: 'SOURCE_USE_DISALLOWS_RUNTIME_CONTRIBUTION',
        message: `${use.owner}: ${evidenceSourceId}`,
      });
    }
  }
}

const classificationDirectory = resolve(
  getSingleDiagnosisClassificationRegistryEntry(contentRegistry).path,
);
const diagnosisClassificationReleasePath = resolve(classificationDirectory, 'release.json');
const diagnosisClassificationTermsPath = resolve(classificationDirectory, 'terms.json');
const diagnosisClassificationRelease = DiagnosisClassificationReleaseSchema.parse(
  JSON.parse(await readFile(diagnosisClassificationReleasePath, 'utf8')) as unknown,
);
let diagnosisClassificationMaterialized = false;
const diagnosisClassificationIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
try {
  await access(diagnosisClassificationTermsPath);
  const { catalog: diagnosisClassificationCatalog } = await readDiagnosisClassification(
    diagnosisClassificationReleasePath,
    diagnosisClassificationTermsPath,
  );
  diagnosisClassificationMaterialized = true;
  diagnosisClassificationIssues.push(
    ...validateDiagnosisClassification(
      diagnosisClassificationRelease,
      diagnosisClassificationCatalog,
    ).issues.map((issue) => ({
      severity: 'error' as const,
      ...issue,
    })),
  );
  diagnosisClassificationIssues.push(
    ...validateDiagnosisClassificationBindings(
      catalogs.diagnoses,
      diagnosisClassificationRelease,
      diagnosisClassificationCatalog,
    ).issues.map((issue) => ({
      severity: 'error' as const,
      ...issue,
    })),
  );
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
if (!diagnosisClassificationMaterialized) {
  diagnosisClassificationIssues.push(
    ...validateDiagnosisClassificationBindings(
      catalogs.diagnoses,
      diagnosisClassificationRelease,
      null,
    ).issues.map((issue) => ({
      severity: 'error' as const,
      ...issue,
    })),
  );
}
if (
  !authoringEvidenceSources.some(
    (source) => source.id === diagnosisClassificationRelease.evidenceSourceId,
  )
) {
  diagnosisClassificationIssues.push({
    severity: 'error',
    code: 'MISSING_CLASSIFICATION_EVIDENCE_SOURCE',
    message: diagnosisClassificationRelease.evidenceSourceId,
  });
}

const personalKnowledgeProfileIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const personalKnowledgeProfileEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'personal_knowledge_pilot_profile',
);
if (personalKnowledgeProfileEntries.length !== 1) {
  personalKnowledgeProfileIssues.push({
    severity: 'error',
    code: 'PERSONAL_KNOWLEDGE_PROFILE_COUNT',
    message: `Expected one bounded pilot profile; found ${personalKnowledgeProfileEntries.length}.`,
  });
} else {
  const entry = personalKnowledgeProfileEntries[0]!;
  try {
    const profile = PersonalKnowledgePilotProfileSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    if (profile.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${profile.id}.`);
    }
    validatePersonalKnowledgePilotProfile(profile);
  } catch (error) {
    personalKnowledgeProfileIssues.push({
      severity: 'error',
      code: 'INVALID_PERSONAL_KNOWLEDGE_PROFILE',
      message: error instanceof Error ? error.message : 'Pilot profile validation failed.',
    });
  }
}

const personalKnowledgeCatalogIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const personalKnowledgeCatalogRoot = resolve('content/catalogs/authoring/personal-knowledge');
const validatePersonalKnowledgeCatalogPath = (path: string): void => {
  const relation = relative(personalKnowledgeCatalogRoot, resolve(path));
  if (relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error(`${path} escapes the personal-knowledge authoring catalog.`);
  }
};
const aliasCatalogEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'personal_knowledge_alias_catalog',
);
const privateSourceCatalogEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'personal_knowledge_source_catalog',
);
if (aliasCatalogEntries.length !== 1 || privateSourceCatalogEntries.length !== 1) {
  personalKnowledgeCatalogIssues.push({
    severity: 'error',
    code: 'PERSONAL_KNOWLEDGE_CATALOG_COUNT',
    message: `Expected one alias catalog and one private-source catalog; found ${aliasCatalogEntries.length} and ${privateSourceCatalogEntries.length}.`,
  });
} else {
  try {
    const aliasEntry = aliasCatalogEntries[0]!;
    const privateSourceEntry = privateSourceCatalogEntries[0]!;
    if (aliasEntry.runtimeIncluded || privateSourceEntry.runtimeIncluded) {
      throw new Error('Personal-knowledge authoring catalogs must remain runtime excluded.');
    }
    validatePersonalKnowledgeCatalogPath(aliasEntry.path);
    validatePersonalKnowledgeCatalogPath(privateSourceEntry.path);
    const aliasCatalog = PersonalKnowledgeAuthoringAliasCatalogSchema.parse(
      JSON.parse(await readFile(resolve(aliasEntry.path), 'utf8')) as unknown,
    );
    const privateSourceCatalog = PersonalKnowledgePrivateSourceCatalogSchema.parse(
      JSON.parse(await readFile(resolve(privateSourceEntry.path), 'utf8')) as unknown,
    );
    if (aliasCatalog.id !== aliasEntry.id || privateSourceCatalog.id !== privateSourceEntry.id) {
      throw new Error('Personal-knowledge registry IDs do not match their tracked catalogs.');
    }
    validatePersonalKnowledgeAliasCatalog(aliasCatalog);
    const sourceIds = privateSourceCatalog.entries.map((entry) => entry.id);
    const sourceHashes = privateSourceCatalog.entries.map((entry) => entry.expectedSha256);
    if (
      new Set(sourceIds).size !== sourceIds.length ||
      new Set(sourceHashes).size !== sourceHashes.length
    ) {
      throw new Error('Private personal-source IDs and SHA-256 values must be unique.');
    }
  } catch (error) {
    personalKnowledgeCatalogIssues.push({
      severity: 'error',
      code: 'INVALID_PERSONAL_KNOWLEDGE_CATALOG',
      message:
        error instanceof Error
          ? error.message
          : 'Personal-knowledge authoring catalog validation failed.',
    });
  }
}

const developerOpinionIssues: Array<{
  severity: 'error';
  code: string;
  message: string;
}> = [];
const developerOpinionEntries = contentRegistry.entries.filter(
  (entry) => entry.kind === 'developer_opinion_catalog',
);
if (developerOpinionEntries.length !== 1) {
  developerOpinionIssues.push({
    severity: 'error',
    code: 'DEVELOPER_OPINION_CATALOG_COUNT',
    message: `Expected one Developer-opinion catalog; found ${developerOpinionEntries.length}.`,
  });
} else {
  try {
    const entry = developerOpinionEntries[0]!;
    if (entry.runtimeIncluded) {
      throw new Error('Developer opinions must remain outside the gameplay runtime bundle.');
    }
    const catalog = DeveloperOpinionCatalogSchema.parse(
      JSON.parse(await readFile(resolve(entry.path), 'utf8')) as unknown,
    );
    if (catalog.id !== entry.id) {
      throw new Error(`${entry.id} resolves to ${catalog.id}.`);
    }
    const targetKindById = new Map<string, string>([
      ...catalogs.diagnoses.map((diagnosis) => [diagnosis.id, 'diagnosis'] as const),
      ...catalogs.diagnoses.flatMap((diagnosis) =>
        diagnosis.severityAxis?.derivationPolicy
          ? [[diagnosis.severityAxis.derivationPolicy.id, 'clinical_rule'] as const]
          : [],
      ),
      ...catalogs.diagnoses.flatMap((diagnosis) =>
        diagnosis.specifiers.map((specifier) => [specifier.id, 'clinical_rule'] as const),
      ),
      ...medicationIdentities.map((medication) => [medication.id, 'medication'] as const),
      ...catalogs.treatments
        .filter((treatment) => treatment.kind === 'nonmedication')
        .map((treatment) => [treatment.id, 'intervention'] as const),
      ...catalogs.tests.map((test) => [test.id, 'test'] as const),
      ...(exposureCatalogForValidation?.misuseGenerationPriors.map(
        (prior) => [prior.id, 'clinical_rule'] as const,
      ) ?? []),
      ...(medicationRegimenKnowledgeCatalogForValidation
        ? [
            ...medicationRegimenKnowledgeCatalogForValidation.medicationClasses,
            ...medicationRegimenKnowledgeCatalogForValidation.classMemberships,
            ...medicationRegimenKnowledgeCatalogForValidation.focusedRoutes,
            ...medicationRegimenKnowledgeCatalogForValidation.contributors,
          ].map((record) => [record.id, 'clinical_rule'] as const)
        : []),
      ...(decisionPolicyCatalogForValidation?.policies.map(
        (policy) => [policy.id, 'clinical_rule'] as const,
      ) ?? []),
      ...(decisionBalanceCatalogForValidation?.balances.map(
        (balance) => [balance.id, 'clinical_rule'] as const,
      ) ?? []),
      ...(conditionFindingProfileCatalogForValidation?.profiles.map(
        (profile) => [profile.id, 'clinical_rule'] as const,
      ) ?? []),
      ...(findingProjectionCatalogForValidation
        ? [[findingProjectionCatalogForValidation.id, 'clinical_rule'] as const]
        : []),
      ...(findingProjectionHorizonCatalogForValidation?.horizons.map(
        (horizon) => [horizon.id, 'clinical_rule'] as const,
      ) ?? []),
      ...(clinicalDurationProfileCatalogForValidation?.profiles.map(
        (profile) => [profile.id, 'clinical_rule'] as const,
      ) ?? []),
      ...(universalActionResultAssemblyCatalogForValidation?.assemblies.flatMap((assembly) =>
        assembly.targetScopedPatientValueProjectionDefinitions.map(
          (definition) => [definition.id, 'clinical_rule'] as const,
        ),
      ) ?? []),
      ...(raceEthnicityCatalogForValidation
        ? [[raceEthnicityCatalogForValidation.id, 'clinical_rule'] as const]
        : []),
    ]);
    for (const opinion of catalog.opinions) {
      for (const target of opinion.targets) {
        const actualKind = targetKindById.get(target.targetContentId);
        if (actualKind !== target.targetKind) {
          throw new Error(
            `${opinion.id} targets ${target.targetKind} ${target.targetContentId}, resolved as ${actualKind ?? 'unknown'}.`,
          );
        }
      }
    }
    const developerOpinionIds = new Set(catalog.opinions.map((opinion) => opinion.id));
    for (const policy of catalogs.reactionConcepts.medicationSelectionPolicies) {
      if (!developerOpinionIds.has(policy.developerOpinionId)) {
        throw new Error(
          `${policy.id} references unknown Developer opinion ${policy.developerOpinionId}.`,
        );
      }
    }
    const developerOpinionById = new Map(catalog.opinions.map((opinion) => [opinion.id, opinion]));
    if (raceEthnicityCatalogForValidation) {
      const opinion = developerOpinionById.get(
        raceEthnicityCatalogForValidation.authoringReview.developerOpinionId,
      );
      if (
        !opinion ||
        opinion.developerReview.status !== 'accepted' ||
        !opinion.targets.some(
          (target) =>
            target.targetKind === 'clinical_rule' &&
            target.targetContentId === raceEthnicityCatalogForValidation?.id,
        )
      ) {
        throw new Error(
          `${raceEthnicityCatalogForValidation.id} lacks its exact accepted Developer-opinion guardrail.`,
        );
      }
    }
    for (const profile of clinicalDurationProfileCatalogForValidation?.profiles ?? []) {
      for (const developerOpinionId of profile.developerOpinionIds ?? []) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${profile.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === profile.id,
          )
        ) {
          throw new Error(
            `${developerOpinionId} does not target clinical-duration profile ${profile.id}.`,
          );
        }
        if (opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${profile.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    for (const definition of (
      universalActionResultAssemblyCatalogForValidation?.assemblies ?? []
    ).flatMap((assembly) => assembly.targetScopedPatientValueProjectionDefinitions)) {
      for (const developerOpinionId of definition.developerOpinionIds ?? []) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${definition.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === definition.id,
          )
        ) {
          throw new Error(
            `${developerOpinionId} does not target target-scoped projection ${definition.id}.`,
          );
        }
        if (opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${definition.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    for (const horizon of findingProjectionHorizonCatalogForValidation?.horizons ?? []) {
      for (const developerOpinionId of horizon.developerOpinionIds) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${horizon.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === horizon.id,
          )
        ) {
          throw new Error(
            `${developerOpinionId} does not target finding-projection horizon ${horizon.id}.`,
          );
        }
        if (opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${horizon.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    for (const projection of findingProjectionCatalogForValidation?.projections ?? []) {
      for (const developerOpinionId of projection.developerOpinionIds ?? []) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${projection.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' &&
              target.targetContentId === findingProjectionCatalogForValidation?.id,
          )
        ) {
          throw new Error(
            `${developerOpinionId} does not target finding-projection catalog ${findingProjectionCatalogForValidation?.id}.`,
          );
        }
        if (opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${projection.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    for (const profile of conditionFindingProfileCatalogForValidation?.profiles ?? []) {
      const reviewedMappings =
        profile.modelVersion === 'condition-finding-dimensions.v1'
          ? [
              profile,
              ...profile.requiredOutcomes,
              ...profile.dimensions,
              ...profile.dimensions.flatMap((dimension) => dimension.manifestations),
              ...profile.selectionRequirements,
            ]
          : [
              ...profile.requiredOutcomes,
              ...profile.cardinalityGroups,
              ...profile.cardinalityGroups.flatMap((group) => group.members),
            ];
      for (const mapping of reviewedMappings) {
        for (const developerOpinionId of mapping.developerOpinionIds) {
          const opinion = developerOpinionById.get(developerOpinionId);
          if (!opinion) {
            throw new Error(
              `${mapping.id} references unknown Developer opinion ${developerOpinionId}.`,
            );
          }
          if (
            !opinion.targets.some(
              (target) =>
                target.targetKind === 'clinical_rule' && target.targetContentId === profile.id,
            )
          ) {
            throw new Error(
              `${developerOpinionId} does not target condition-finding profile ${profile.id}.`,
            );
          }
          if (opinion.developerReview.status !== 'accepted') {
            throw new Error(
              `${mapping.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
            );
          }
        }
      }
    }
    for (const prior of exposureCatalogForValidation?.misuseGenerationPriors ?? []) {
      for (const developerOpinionId of prior.developerOpinionIds) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${prior.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === prior.id,
          )
        ) {
          throw new Error(
            `${developerOpinionId} does not target misuse generation prior ${prior.id}.`,
          );
        }
      }
    }
    for (const record of medicationRegimenKnowledgeCatalogForValidation
      ? [
          ...medicationRegimenKnowledgeCatalogForValidation.medicationClasses,
          ...medicationRegimenKnowledgeCatalogForValidation.classMemberships,
          ...medicationRegimenKnowledgeCatalogForValidation.focusedRoutes,
          ...medicationRegimenKnowledgeCatalogForValidation.contributors,
        ]
      : []) {
      for (const developerOpinionId of record.developerOpinionIds) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${record.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === record.id,
          )
        ) {
          throw new Error(
            `${developerOpinionId} does not target medication-regimen record ${record.id}.`,
          );
        }
        if (record.review.status === 'approved' && opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${record.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    for (const policy of decisionPolicyCatalogForValidation?.policies ?? []) {
      for (const developerOpinionId of policy.developerOpinionIds) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${policy.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === policy.id,
          )
        ) {
          throw new Error(`${developerOpinionId} does not target decision policy ${policy.id}.`);
        }
        if (policy.review.status === 'approved' && opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${policy.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    for (const balance of decisionBalanceCatalogForValidation?.balances ?? []) {
      for (const developerOpinionId of balance.developerOpinionIds) {
        const opinion = developerOpinionById.get(developerOpinionId);
        if (!opinion) {
          throw new Error(
            `${balance.id} references unknown Developer opinion ${developerOpinionId}.`,
          );
        }
        if (
          !opinion.targets.some(
            (target) =>
              target.targetKind === 'clinical_rule' && target.targetContentId === balance.id,
          )
        ) {
          throw new Error(`${developerOpinionId} does not target decision balance ${balance.id}.`);
        }
        if (opinion.developerReview.status !== 'accepted') {
          throw new Error(
            `${balance.id} cannot rely on ${opinion.developerReview.status} Developer opinion ${developerOpinionId}.`,
          );
        }
      }
    }
    const sourceUseById = new Map(
      sourceUseDecisionCatalog.decisions.map((decision) => [decision.id, decision]),
    );
    for (const relationship of catalog.evidenceRelationships) {
      if (!allEvidenceSourceIds.has(relationship.evidenceSourceId)) {
        throw new Error(
          `${relationship.id} references unknown evidence ${relationship.evidenceSourceId}.`,
        );
      }
      const decision = sourceUseById.get(relationship.sourceUseDecisionId);
      if (
        !decision ||
        decision.evidenceSourceId !== relationship.evidenceSourceId ||
        decision.decisionStatus !== 'permitted_with_conditions' ||
        !decision.permissions.derivedClinicalContent
      ) {
        throw new Error(
          `${relationship.id} lacks a matching derived-content-cleared source-use decision.`,
        );
      }
    }
  } catch (error) {
    developerOpinionIssues.push({
      severity: 'error',
      code: 'INVALID_DEVELOPER_OPINION_CATALOG',
      message:
        error instanceof Error ? error.message : 'Developer-opinion catalog validation failed.',
    });
  }
}

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
    'finding-expression-banks',
    {
      valid: findingExpressionBankIssues.length === 0,
      issues: findingExpressionBankIssues,
    },
  ],
  [
    'finding-projections',
    {
      valid: findingProjectionIssues.length === 0,
      issues: findingProjectionIssues,
    },
  ],
  [
    'finding-projection-horizons',
    {
      valid: findingProjectionHorizonIssues.length === 0,
      issues: findingProjectionHorizonIssues,
    },
  ],
  [
    'clinical-duration-profiles',
    {
      valid: clinicalDurationProfileIssues.length === 0,
      issues: clinicalDurationProfileIssues,
    },
  ],
  [
    'universal-action-result-assemblies',
    {
      valid: universalActionResultAssemblyIssues.length === 0,
      issues: universalActionResultAssemblyIssues,
    },
  ],
  [
    'condition-finding-profiles',
    {
      valid: conditionFindingProfileIssues.length === 0,
      issues: conditionFindingProfileIssues,
    },
  ],
  [
    'measurements',
    {
      valid: measurementCatalogIssues.length === 0,
      issues: measurementCatalogIssues,
    },
  ],
  [
    'authoring-evidence',
    {
      valid: authoringEvidenceIssues.length === 0,
      issues: authoringEvidenceIssues,
    },
  ],
  [
    'source-use-decisions',
    {
      valid: sourceUseDecisionIssues.length === 0,
      issues: sourceUseDecisionIssues,
    },
  ],
  [
    'race-ethnicity',
    {
      valid: raceEthnicityCatalogIssues.length === 0,
      issues: raceEthnicityCatalogIssues,
    },
  ],
  [
    'medication-identities',
    {
      valid: medicationIdentityIssues.length === 0,
      issues: medicationIdentityIssues,
    },
  ],
  [
    'medication-regimen-knowledge',
    {
      valid: medicationRegimenKnowledgeIssues.length === 0,
      issues: medicationRegimenKnowledgeIssues,
    },
  ],
  [
    'decision-policies',
    {
      valid: decisionPolicyIssues.length === 0,
      issues: decisionPolicyIssues,
    },
  ],
  [
    'decision-balances',
    {
      valid: decisionBalanceIssues.length === 0,
      issues: decisionBalanceIssues,
    },
  ],
  [
    'supplement-identities',
    {
      valid: supplementIdentityIssues.length === 0,
      issues: supplementIdentityIssues,
    },
  ],
  [
    'exposures',
    {
      valid: exposureCatalogIssues.length === 0,
      issues: exposureCatalogIssues,
    },
  ],
  [
    diagnosisClassificationMaterialized
      ? 'diagnosis-classification'
      : 'diagnosis-classification-manifest (local cache not materialized)',
    {
      valid: diagnosisClassificationIssues.length === 0,
      issues: diagnosisClassificationIssues,
    },
  ],
  [
    'personal-knowledge-pilot-profile',
    {
      valid: personalKnowledgeProfileIssues.length === 0,
      issues: personalKnowledgeProfileIssues,
    },
  ],
  [
    'personal-knowledge-cross-reference-catalogs',
    {
      valid: personalKnowledgeCatalogIssues.length === 0,
      issues: personalKnowledgeCatalogIssues,
    },
  ],
  [
    'developer-opinions',
    {
      valid: developerOpinionIssues.length === 0,
      issues: developerOpinionIssues,
    },
  ],
  [
    'source-needed-requests',
    validateSourceRequests(
      developerSourceRequests,
      catalogs,
      [...approvedCaseBlueprints, ...allReviewBlueprints],
      checkedInReviewTickets,
      authoringEvidenceSources.map((source) => source.id),
    ),
  ],
  [
    'literature-synthesis-proposals',
    validateLiteratureSynthesisProposals(
      developerLiteratureSynthesisProposals,
      [...catalogs.evidenceSources, ...authoringEvidenceSources],
      sourceUseDecisionCatalog.decisions,
      [...approvedCaseBlueprints, ...allReviewBlueprints],
      checkedInReviewTickets,
      developerSourceRequests,
    ),
  ],
  [
    'ticket-literature-scout',
    validateTicketLiteratureScoutCatalog(
      developerTicketLiteratureScoutCatalog,
      checkedInReviewTickets,
      developerSourceRequests,
    ),
  ],
  ...approvedCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, startingClinic)] as const,
  ),
  ...reviewCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, startingClinic)] as const,
  ),
  ...reviewerCaseBlueprints.map(
    (blueprint) =>
      [blueprint.id, validateCaseBlueprint(blueprint, catalogs, reviewerClinic)] as const,
  ),
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
