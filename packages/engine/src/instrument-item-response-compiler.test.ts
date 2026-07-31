import {
  InstrumentDefinitionSchema,
  type ClinicalRuleReview,
  type DecisionActionHorizon,
  type FindingDefinition,
  type FindingProjectionResponseValue,
  type InstrumentDefinition,
  type InstrumentItemResponseCompileRequest,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileInstrumentItemResponses,
  deriveInstrumentInformationActionHorizon,
  verifyInstrumentItemResponseCompilationIntegrity,
} from './instrument-item-response-compiler';
import { compileSharedFindings } from './shared-finding-compiler';

const actionId = 'info.history.test-instrument';
const instrumentId = 'instrument.test.energy';
const instrumentVersion = '1.0.0';
const itemId = 'instrument-item.test.energy';
const responseOptionYes = 'response-option.test.yes';
const responseOptionNo = 'response-option.test.no';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-30T12:00:00.000Z',
  sourceUseNoteIds: ['source-use-note.test.instrument-response'],
};

const findingDefinition: FindingDefinition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.history.test-energy',
  label: 'Current energy',
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
};

const instrumentDefinition = (
  overrides: Partial<InstrumentDefinition> = {},
): InstrumentDefinition => ({
  schemaVersion: 1,
  contentVersion: instrumentVersion,
  id: instrumentId,
  modelVersion: 'instrument-item-response-only.v1',
  rightsBoundaryId: 'rights-boundary.test.public',
  items: [
    {
      id: itemId,
      responseScaleId: 'response-scale.test.binary',
      responseOptionIds: [responseOptionYes, responseOptionNo],
      informationActionId: actionId,
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
  ],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
  ...overrides,
});

interface SharedRequestOptions {
  readonly includeInstrumentTarget?: boolean;
  readonly responses?: readonly FindingProjectionResponseValue[];
  readonly allowedResponses?: readonly FindingProjectionResponseValue[];
  readonly useFindingExpression?: boolean;
}

const makeSharedRequest = ({
  includeInstrumentTarget = true,
  responses = [{ kind: 'response_option', responseOptionId: responseOptionYes }],
  allowedResponses,
  useFindingExpression = false,
}: SharedRequestOptions = {}): SharedFindingCompileRequest => {
  const target = {
    kind: 'instrument_item' as const,
    instrumentDefinitionId: instrumentId,
    instrumentContentVersion: instrumentVersion,
    itemId,
  };
  const projectionResponses =
    allowedResponses !== undefined
      ? [...allowedResponses]
      : [
          { kind: 'response_option' as const, responseOptionId: responseOptionYes },
          { kind: 'response_option' as const, responseOptionId: responseOptionNo },
          ...responses,
        ].filter(
          (response, index, all) =>
            all.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(response)) ===
            index,
        );
  return {
    schemaVersion: 1,
    id: 'finding-compilation-request.test.instrument-response',
    patientStateId: 'resolved-patient-state.test.instrument-response',
    seed: 'seed.test.instrument-response',
    findingDefinitions: [findingDefinition],
    candidates: [
      {
        schemaVersion: 1,
        id: 'finding-candidate.test.energy',
        findingDefinitionId: findingDefinition.id,
        findingDefinitionContentVersion: findingDefinition.contentVersion,
        kind: 'case_critical',
        proposedValue: { kind: 'outcome', value: 'present' },
        uncertainty: 'none',
        contributions: [
          {
            schemaVersion: 1,
            id: 'finding-contribution.test.energy',
            ownerKind: 'patient_template',
            ownerId: 'patient-template.test.instrument-response',
            ownerContentVersion: '1.0.0',
            role: 'constraint',
            provenanceIds: ['provenance.test.instrument-response'],
          },
        ],
        resolution: {
          origin: 'authored',
          ownerId: 'patient-template.test.instrument-response',
          ownerContentVersion: '1.0.0',
        },
        review: approvedReview,
      },
    ],
    propositionState: {
      schemaVersion: 1,
      id: 'resolved-proposition-state.test.instrument-response',
      propositions: [],
      evidence: [],
      dependencyGroups: [],
      beliefAppraisals: [],
    },
    propositionDefinitions: [],
    projections: includeInstrumentTarget
      ? responses.map((response, index) => ({
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: `finding-projection.test.instrument-energy-${index + 1}`,
          sourceMatch: 'all' as const,
          sourceBindings: [
            {
              kind: 'canonical_finding' as const,
              findingDefinitionId: findingDefinition.id,
              findingDefinitionContentVersion: findingDefinition.contentVersion,
              allowedStates: ['present' as const],
            },
          ],
          target,
          response,
          expressionBankId: useFindingExpression
            ? 'finding-expression-bank.test.instrument-energy'
            : null,
          expressionBankContentVersion: useFindingExpression ? '1.0.0' : null,
          review: approvedReview,
        }))
      : [],
    expressionBanks: useFindingExpression
      ? [
          {
            schemaVersion: 1,
            contentVersion: '1.0.0',
            id: 'finding-expression-bank.test.instrument-energy',
            label: 'Instrument energy expression',
            displayChannels: ['patient_history'],
            variants: [
              {
                id: 'finding-expression.test.instrument-energy',
                text: 'Test expression',
              },
              {
                id: 'finding-expression.test.instrument-energy-alternative',
                text: 'Alternative test expression',
              },
            ],
            lifecycle: 'approved',
            medicalReviewStatus: 'approved',
          },
        ]
      : [],
    projectionHorizon: {
      schemaVersion: 1,
      id: 'finding-projection-horizon.test.instrument-response',
      targets: includeInstrumentTarget
        ? [
            {
              target,
              allowedResponses: projectionResponses,
              expressionDisplayChannel: useFindingExpression ? 'patient_history' : null,
            },
          ]
        : [
            {
              target: {
                kind: 'information_action',
                actionId,
              },
              allowedResponses: [{ kind: 'finding_outcome', outcome: 'present' }],
              expressionDisplayChannel: 'patient_history',
            },
          ],
    },
  };
};

const makeCompileRequest = (
  sharedOptions: SharedRequestOptions = {},
  definitions: InstrumentDefinition[] = [instrumentDefinition()],
): InstrumentItemResponseCompileRequest => {
  const sharedRequest = makeSharedRequest(sharedOptions);
  const compiled = compileSharedFindings(sharedRequest);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return {
    schemaVersion: 1,
    id: 'instrument-response-request.test.energy',
    sharedFindingCompilation: compiled.value,
    findingProjectionHorizon: sharedRequest.projectionHorizon,
    actionCatalog: {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'information-action-catalog.test.instrument-response',
      actions: [
        {
          id: actionId,
          label: 'Test instrument',
          searchAliases: ['energy scale'],
          category: 'history',
          soapSection: 'subjective',
          resultSource: 'patient_report',
          description: 'Administer a test instrument.',
          serviceId: 'service.history.test-instrument',
          repeatable: false,
        },
      ],
    },
    actionHorizon: {
      schemaVersion: 1,
      id: 'decision-action-horizon.test.instrument-response',
      informationActionIds: [actionId],
    },
    instrumentDefinitions: definitions,
  };
};

const expectSuccess = (request: InstrumentItemResponseCompileRequest) => {
  const result = compileInstrumentItemResponses(request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('instrument item-response compiler', () => {
  it('derives a minimized action horizon that ignores unrelated treatment choices', () => {
    const fullHorizon: DecisionActionHorizon = {
      schemaVersion: 1,
      id: 'decision-action-horizon.test.instrument-response-full',
      informationActionIds: [actionId, 'info.history.test-other'],
      startMedicationIds: ['medication.test.one'],
      regimenEntryOperations: [
        {
          regimenEntryId: 'regimen-entry.test.one',
          medicationIdentityId: 'medication.test.one',
          operations: ['continue'],
        },
      ],
      interventionIds: ['intervention.test.one'],
      dispositionIds: ['disposition.test.one'],
    };
    const treatmentChanged: DecisionActionHorizon = {
      ...fullHorizon,
      startMedicationIds: ['medication.test.two'],
      regimenEntryOperations: [],
      interventionIds: ['intervention.test.two'],
      dispositionIds: ['disposition.test.two'],
    };

    expect(deriveInstrumentInformationActionHorizon(treatmentChanged)).toEqual(
      deriveInstrumentInformationActionHorizon(fullHorizon),
    );
    expect(deriveInstrumentInformationActionHorizon(fullHorizon)).toEqual({
      schemaVersion: 1,
      id: expect.stringMatching(/^instrument-information-action-horizon\.[a-f0-9]{16}$/),
      informationActionIds: [actionId, 'info.history.test-other'],
    });
  });

  it('freezes one exact response with source, rights, scale, action, and time metadata', () => {
    const artifact = expectSuccess(makeCompileRequest());

    expect(artifact.status).toBe('complete');
    expect(artifact.evaluations).toHaveLength(1);
    expect(artifact.responses).toEqual([
      expect.objectContaining({
        instrumentDefinitionId: instrumentId,
        instrumentContentVersion: instrumentVersion,
        itemId,
        responseScaleId: 'response-scale.test.binary',
        responseOptionId: responseOptionYes,
        timeScopeId: 'time-scope.current',
        respondentSourceKind: 'patient_report',
        rightsBoundaryId: 'rights-boundary.test.public',
        interpretationIds: [],
        contributingResolvedFindingIds: [
          artifact.compileRequest.sharedFindingCompilation.findings[0]!.id,
        ],
        propositionIds: [],
        evidenceIds: [],
      }),
    ]);
    expect(artifact.evaluations[0]).toMatchObject({
      status: 'complete',
      informationActionId: actionId,
      responseId: artifact.responses[0]!.id,
      diagnosticIds: [],
    });
    expect(JSON.stringify(artifact.responses[0])).not.toMatch(
      /wording|score|threshold|interpretationText|points/,
    );
    expect(verifyInstrumentItemResponseCompilationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('returns a complete empty artifact when the frozen horizon contains no instrument items', () => {
    const artifact = expectSuccess(makeCompileRequest({ includeInstrumentTarget: false }, []));

    expect(artifact).toMatchObject({
      status: 'complete',
      evaluations: [],
      responses: [],
      diagnostics: [],
    });
  });

  it('retains missing or stale instrument ownership as incomplete coverage', () => {
    const missing = expectSuccess(makeCompileRequest({}, []));
    expect(missing.status).toBe('incomplete_coverage');
    expect(missing.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'instrument_definition_missing',
    ]);

    const stale = expectSuccess(
      makeCompileRequest({}, [instrumentDefinition({ contentVersion: '2.0.0' })]),
    );
    expect(stale.status).toBe('incomplete_coverage');
    expect(stale.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'instrument_definition_missing',
    ]);
  });

  it('requires an approved exact item owner without promoting review metadata into a score', () => {
    const unapproved = expectSuccess(
      makeCompileRequest({}, [
        instrumentDefinition({
          lifecycle: 'review',
          medicalReviewStatus: 'unreviewed',
        }),
      ]),
    );
    expect(unapproved.status).toBe('incomplete_coverage');
    expect(unapproved.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'instrument_definition_not_approved',
    );

    const missingItem = expectSuccess(
      makeCompileRequest({}, [
        instrumentDefinition({
          items: [
            {
              ...instrumentDefinition().items[0]!,
              id: 'instrument-item.test.other',
            },
          ],
        }),
      ]),
    );
    expect(missingItem.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'item_definition_missing',
    ]);
  });

  it('requires the owning information action in the exact catalog and focused horizon', () => {
    const missingActionRequest = makeCompileRequest();
    missingActionRequest.actionCatalog.actions = [
      {
        ...missingActionRequest.actionCatalog.actions[0]!,
        id: 'info.history.test-other',
      },
    ];
    missingActionRequest.actionHorizon.informationActionIds = [];
    const missingAction = expectSuccess(missingActionRequest);
    expect(missingAction.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'information_action_missing',
    );

    const outsideRequest = makeCompileRequest();
    outsideRequest.actionHorizon.informationActionIds = [];
    const outside = expectSuccess(outsideRequest);
    expect(outside.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'information_action_outside_horizon',
    );

    const wrongSourceRequest = makeCompileRequest();
    wrongSourceRequest.actionCatalog.actions[0]!.resultSource = 'collateral_report';
    const wrongSource = expectSuccess(wrongSourceRequest);
    expect(wrongSource.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'information_action_source_mismatch',
    );
  });

  it('requires exact item response options and instrument-owned presentation', () => {
    const incompleteScale = expectSuccess(
      makeCompileRequest({
        allowedResponses: [{ kind: 'response_option', responseOptionId: responseOptionYes }],
      }),
    );
    expect(incompleteScale.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'instrument_target_response_options_invalid',
    );

    const expression = expectSuccess(makeCompileRequest({ useFindingExpression: true }));
    expect(expression.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        'instrument_target_display_channel_not_null',
        'instrument_projection_expression_present',
      ]),
    );
  });

  it('rejects divergent option sets that claim the same response-scale identity', () => {
    const definition = instrumentDefinition({
      items: [
        instrumentDefinition().items[0]!,
        {
          ...instrumentDefinition().items[0]!,
          id: 'instrument-item.test.energy-second',
          responseOptionIds: [responseOptionYes],
        },
      ],
    });

    expect(InstrumentDefinitionSchema.safeParse(definition).success).toBe(false);
  });

  it.each([
    {
      label: 'no frozen response',
      options: { responses: [] },
      expectedCode: 'response_not_resolved',
    },
    {
      label: 'multiple frozen responses',
      options: {
        responses: [
          { kind: 'response_option', responseOptionId: responseOptionYes },
          { kind: 'response_option', responseOptionId: responseOptionYes },
        ],
      },
      expectedCode: 'multiple_responses_resolved',
    },
    {
      label: 'a finding outcome instead of a response option',
      options: {
        responses: [{ kind: 'finding_outcome', outcome: 'present' }],
      },
      expectedCode: 'response_option_required',
    },
    {
      label: 'a response outside the exact item scale',
      options: {
        responses: [
          {
            kind: 'response_option',
            responseOptionId: 'response-option.test.unowned',
          },
        ],
      },
      expectedCode: 'response_option_not_allowed',
    },
  ] as const)('does not guess or deduplicate $label', ({ options, expectedCode }) => {
    const artifact = expectSuccess(makeCompileRequest(options));
    expect(artifact.status).toBe('incomplete_coverage');
    expect(artifact.responses).toEqual([]);
    expect(artifact.diagnostics.map((diagnostic) => diagnostic.code)).toContain(expectedCode);
  });

  it('normalizes set-like authoring inputs for byte-identical deterministic replay', () => {
    const request = makeCompileRequest();
    request.actionCatalog.actions.push({
      ...request.actionCatalog.actions[0]!,
      id: 'info.history.test-unused',
      searchAliases: ['unused b', 'unused a'],
      serviceId: 'service.history.test-unused',
    });
    request.instrumentDefinitions.push(
      instrumentDefinition({
        id: 'instrument.test.unused',
        items: [
          {
            ...instrumentDefinition().items[0]!,
            id: 'instrument-item.test.unused',
            responseOptionIds: [responseOptionNo, responseOptionYes],
          },
        ],
      }),
    );
    const permuted = structuredClone(request);
    permuted.actionCatalog.actions.reverse();
    permuted.instrumentDefinitions.reverse();
    permuted.instrumentDefinitions.forEach((definition) => {
      definition.items.reverse();
      definition.items.forEach((item) => item.responseOptionIds.reverse());
    });

    expect(expectSuccess(permuted)).toEqual(expectSuccess(request));
  });

  it('rejects a compiled-finding artifact paired with a different projection horizon', () => {
    const request = makeCompileRequest();
    request.findingProjectionHorizon.id =
      'finding-projection-horizon.test.instrument-response-other';

    expect(compileInstrumentItemResponses(request)).toMatchObject({
      ok: false,
      error: { code: 'COMPILED_FINDING_CONTEXT_INVALID' },
    });
  });

  it('detects tampering by replaying the complete frozen compile request', () => {
    const artifact = expectSuccess(makeCompileRequest());
    const tampered = structuredClone(artifact);
    tampered.responses[0]!.rightsBoundaryId = 'rights-boundary.test.changed';

    expect(verifyInstrumentItemResponseCompilationIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
  });

  it('rejects scoring, interpretation, and arbitrary executable extensions', () => {
    const request = {
      ...makeCompileRequest(),
      points: 10,
    };

    expect(compileInstrumentItemResponses(request)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(
      InstrumentDefinitionSchema.safeParse({
        ...instrumentDefinition(),
        totalScoreFormula: 'sum(items)',
      }).success,
    ).toBe(false);
    expect(
      InstrumentDefinitionSchema.safeParse({
        ...instrumentDefinition(),
        items: [
          {
            ...instrumentDefinition().items[0]!,
            wording: 'Copyrighted item wording does not belong here.',
            points: 2,
            interpretation: 'Positive',
          },
        ],
      }).success,
    ).toBe(false);
  });
});
