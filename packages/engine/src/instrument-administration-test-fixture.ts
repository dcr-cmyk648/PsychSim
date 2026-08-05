import {
  InstrumentDefinitionSchema,
  type ClinicalRuleReview,
  type FindingDefinition,
  type InstrumentAdministrationCompilationArtifact,
  type InstrumentAdministrationCompileRequest,
  type InstrumentAdministrationDefinition,
  type InstrumentAdministrationSourceValidationArtifact,
  type InstrumentItemResponseCompilationArtifact,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';

import { compileInstrumentAdministration } from './instrument-administration-compiler';
import { validateInstrumentAdministrationSource } from './instrument-administration-source-validation';
import { compileInstrumentItemResponses } from './instrument-item-response-compiler';
import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';
import { compileSharedFindings } from './shared-finding-compiler';

export const testInstrumentActionId = 'info.testing.test-two-item-instrument';
export const testInstrumentId = 'instrument.test.two-item';
export const testInstrumentVersion = '1.0.0';
export const testInstrumentFirstItemId = 'instrument-item.test.one';
export const testInstrumentSecondItemId = 'instrument-item.test.two';
export const testInstrumentYesOptionId = 'response-option.test.yes';
export const testInstrumentNoOptionId = 'response-option.test.no';
export const testInstrumentOtherOptionId = 'response-option.test.other';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-08-03T12:00:00.000Z',
  sourceUseNoteIds: ['source-use-note.test.instrument-administration'],
};

const findingDefinitions: FindingDefinition[] = [
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'finding.test.instrument-one',
    label: 'Instrument item one source',
    aliases: [],
    semanticKind: 'history',
    valueSpecification: {
      kind: 'outcome',
      allowedValues: ['present', 'absent'],
    },
    allowedPresentationProjections: ['status'],
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'finding.test.instrument-two',
    label: 'Instrument item two source',
    aliases: [],
    semanticKind: 'history',
    valueSpecification: {
      kind: 'outcome',
      allowedValues: ['present', 'absent'],
    },
    allowedPresentationProjections: ['status'],
    lifecycle: 'approved',
    medicalReviewStatus: 'approved',
  },
];

export const testInstrumentDefinition = InstrumentDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: testInstrumentVersion,
  id: testInstrumentId,
  modelVersion: 'instrument-item-response-only.v1',
  rightsBoundaryId: 'rights-boundary.test.instrument-administration',
  items: [
    {
      id: testInstrumentFirstItemId,
      responseScaleId: 'response-scale.test.binary',
      responseOptionIds: [testInstrumentYesOptionId, testInstrumentNoOptionId],
      informationActionId: testInstrumentActionId,
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
    {
      id: testInstrumentSecondItemId,
      responseScaleId: 'response-scale.test.binary',
      responseOptionIds: [testInstrumentYesOptionId, testInstrumentNoOptionId],
      informationActionId: testInstrumentActionId,
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
  ],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
});

interface TestD220Options {
  readonly respondedItemIds?: readonly string[];
  readonly secondResponseOptionId?: string;
  readonly secondHorizonOptionIds?: readonly string[];
}

export const compileTestInstrumentItemResponses = ({
  respondedItemIds = [testInstrumentFirstItemId, testInstrumentSecondItemId],
  secondResponseOptionId = testInstrumentNoOptionId,
  secondHorizonOptionIds = [testInstrumentYesOptionId, testInstrumentNoOptionId],
}: TestD220Options = {}): InstrumentItemResponseCompilationArtifact => {
  const itemConfigs = [
    {
      itemId: testInstrumentFirstItemId,
      finding: findingDefinitions[0]!,
      responseOptionId: testInstrumentYesOptionId,
      horizonOptionIds: [testInstrumentYesOptionId, testInstrumentNoOptionId],
    },
    {
      itemId: testInstrumentSecondItemId,
      finding: findingDefinitions[1]!,
      responseOptionId: secondResponseOptionId,
      horizonOptionIds: [...secondHorizonOptionIds],
    },
  ];
  const sharedRequest: SharedFindingCompileRequest = {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.instrument-administration',
    patientStateId: 'resolved-patient-state.test.instrument-administration',
    seed: 'seed.test.instrument-administration',
    findingDefinitions,
    candidates: itemConfigs.map(({ finding }, index) => ({
      schemaVersion: 1,
      id: `finding-candidate.test.instrument-administration-${index + 1}`,
      findingDefinitionId: finding.id,
      findingDefinitionContentVersion: finding.contentVersion,
      kind: 'case_critical',
      proposedValue: { kind: 'outcome', value: 'present' },
      uncertainty: 'none',
      contributions: [
        {
          schemaVersion: 1,
          id: `finding-contribution.test.instrument-administration-${index + 1}`,
          ownerKind: 'patient_template',
          ownerId: 'patient-template.test.instrument-administration',
          ownerContentVersion: '1.0.0',
          role: 'constraint',
          provenanceIds: ['provenance.test.instrument-administration'],
        },
      ],
      resolution: {
        origin: 'authored',
        ownerId: 'patient-template.test.instrument-administration',
        ownerContentVersion: '1.0.0',
      },
      review: approvedReview,
    })),
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.instrument-administration',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections: itemConfigs.flatMap(({ itemId, finding, responseOptionId }, index) =>
      respondedItemIds.includes(itemId)
        ? [
            {
              schemaVersion: 1 as const,
              contentVersion: '1.0.0',
              id: `finding-projection.test.instrument-administration-${index + 1}`,
              sourceMatch: 'all' as const,
              sourceBindings: [
                {
                  kind: 'canonical_finding' as const,
                  findingDefinitionId: finding.id,
                  findingDefinitionContentVersion: finding.contentVersion,
                  allowedStates: ['present' as const],
                },
              ],
              target: {
                kind: 'instrument_item' as const,
                instrumentDefinitionId: testInstrumentId,
                instrumentContentVersion: testInstrumentVersion,
                itemId,
              },
              response: {
                kind: 'response_option' as const,
                responseOptionId,
              },
              expressionBankId: null,
              expressionBankContentVersion: null,
              review: approvedReview,
            },
          ]
        : [],
    ),
    expressionBanks: [],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.instrument-administration',
      targets: itemConfigs.map(({ itemId, horizonOptionIds }) => ({
        target: {
          kind: 'instrument_item' as const,
          instrumentDefinitionId: testInstrumentId,
          instrumentContentVersion: testInstrumentVersion,
          itemId,
        },
        allowedResponses: horizonOptionIds.map((responseOptionId) => ({
          kind: 'response_option' as const,
          responseOptionId,
        })),
        expressionDisplayChannel: null,
      })),
    },
  };
  const shared = compileSharedFindings(sharedRequest);
  if (!shared.ok) throw new Error(shared.error.message);
  const compiled = compileInstrumentItemResponses({
    schemaVersion: 1,
    id: 'instrument-response-request.test.administration',
    sharedFindingCompilation: shared.value,
    findingProjectionHorizon: sharedRequest.projectionHorizon,
    actionCatalog: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'information-action-catalog.test.instrument-administration',
      actions: [
        {
          id: testInstrumentActionId,
          label: 'Test two-item instrument',
          searchAliases: ['test scale'],
          category: 'history',
          soapSection: 'subjective',
          resultSource: 'patient_report',
          description: 'Administer a synthetic test instrument.',
          serviceId: 'service.testing.test-instrument',
          repeatable: false,
        },
      ],
    },
    actionHorizon: {
      schemaVersion: 1,
      id: 'instrument-information-action-horizon.test.administration',
      informationActionIds: [testInstrumentActionId],
    },
    instrumentDefinitions: [testInstrumentDefinition],
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

export const testInstrumentAdministrationDefinition = (
  overrides: Partial<InstrumentAdministrationDefinition> = {},
): InstrumentAdministrationDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'instrument-administration-definition.test.two-item',
  modelVersion: 'instrument-administration.v1',
  instrumentDefinitionId: testInstrumentId,
  instrumentContentVersion: testInstrumentVersion,
  informationActionId: testInstrumentActionId,
  respondentSourceKind: 'patient_report',
  timeScopeId: 'time-scope.current',
  rightsBoundaryId: testInstrumentDefinition.rightsBoundaryId,
  itemIds: [testInstrumentFirstItemId, testInstrumentSecondItemId],
  rawTotalRange: {
    minimum: 0,
    maximum: 6,
  },
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  ...overrides,
});

export const testInstrumentAdministrationRequest = (
  itemResponses: InstrumentItemResponseCompilationArtifact,
  overrides: Partial<InstrumentAdministrationCompileRequest> = {},
): InstrumentAdministrationCompileRequest => ({
  schemaVersion: 1,
  id: 'instrument-administration-request.test.two-item',
  instrumentItemResponseCompilation: itemResponses,
  administrationDefinition: testInstrumentAdministrationDefinition(),
  sourceInstanceId: 'source-instance.test.patient',
  includedItemResponseIds: itemResponses.responses.map((response) => response.id),
  missingItemIds: [],
  rawTotal: {
    status: 'calculated',
    value: 3,
  },
  ...overrides,
});

export const compileTestInstrumentAdministration = (
  request: InstrumentAdministrationCompileRequest = testInstrumentAdministrationRequest(
    compileTestInstrumentItemResponses(),
  ),
): InstrumentAdministrationCompilationArtifact => {
  const result = compileInstrumentAdministration(request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

export const compileTestSourceValidatedInstrumentAdministration = ({
  itemResponses = compileTestInstrumentItemResponses(),
  administrationOverrides = {},
}: {
  readonly itemResponses?: InstrumentItemResponseCompilationArtifact;
  readonly administrationOverrides?: Partial<InstrumentAdministrationCompileRequest>;
} = {}): InstrumentAdministrationSourceValidationArtifact => {
  const administrationDefinition =
    administrationOverrides.administrationDefinition ?? testInstrumentAdministrationDefinition();
  const sourceHorizon = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: 'patient-scene-source-instance-request.test.instrument-administration',
    patientStateId: itemResponses.patientStateId,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.instrument-administration-respondent',
        kind: administrationDefinition.respondentSourceKind,
      },
    ],
  });
  if (!sourceHorizon.ok) throw new Error(sourceHorizon.error.message);
  const sourceInstance = sourceHorizon.value.sourceInstances[0];
  if (sourceInstance === undefined) {
    throw new Error('Expected one test instrument respondent source instance.');
  }
  const administration = compileTestInstrumentAdministration(
    testInstrumentAdministrationRequest(itemResponses, {
      ...administrationOverrides,
      administrationDefinition,
      sourceInstanceId: sourceInstance.id,
    }),
  );
  const sourceValidation = validateInstrumentAdministrationSource({
    schemaVersion: 1,
    id: 'instrument-administration-source-validation-request.test.fixture',
    administrationCompilation: administration,
    sourceInstanceCompilation: sourceHorizon.value,
  });
  if (!sourceValidation.ok) throw new Error(sourceValidation.error.message);
  return sourceValidation.value;
};
