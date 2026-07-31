import {
  CompiledSharedFindingSetSchema,
  SharedFindingCompileRequestSchema,
  type ClinicalRuleReview,
  type FindingDefinition,
  type FindingExpressionBank,
  type FindingProjectionSourceBinding,
  type FindingResolutionCandidate,
  type FindingRevealProjection,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileSharedFindings,
  verifyCompiledSharedFindingContext,
  verifyCompiledSharedFindingIntegrity,
  verifyCompiledSharedFindingSeedContext,
} from './shared-finding-compiler';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-07-29T12:00:00.000Z',
  sourceUseNoteIds: ['source-use-note.test.alpha', 'source-use-note.test.beta'],
};

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test',
  ownerContentVersion: '1.0.0',
} as const;

const makeDefinition = (id: string, label: string): FindingDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  label,
  aliases: [],
  semanticKind: 'history',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'approved',
  medicalReviewStatus: 'unreviewed',
});

const fatigueDefinition = makeDefinition('finding.history.test-current-fatigue', 'Current fatigue');
const concentrationDefinition = makeDefinition(
  'finding.history.test-current-concentration',
  'Current concentration difficulty',
);

const makeCandidate = (
  id: string,
  definition: FindingDefinition,
  kind: FindingResolutionCandidate['kind'],
  value: 'present' | 'absent' | 'subthreshold' | null,
  options: {
    reviewStatus?: 'approved' | 'unreviewed';
    uncertainty?: 'none' | 'reported_uncertain' | 'conflicting_sources';
  } = {},
): FindingResolutionCandidate => ({
  schemaVersion: 1,
  id,
  findingDefinitionId: definition.id,
  findingDefinitionContentVersion: definition.contentVersion,
  kind,
  proposedValue: value === null ? null : { kind: 'outcome', value },
  uncertainty: value === null ? null : (options.uncertainty ?? 'none'),
  contributions: [
    {
      schemaVersion: 1,
      id: `finding-contribution.${id}`,
      ownerKind: 'patient_template',
      ownerId: 'patient-template.test',
      ownerContentVersion: '1.0.0',
      role:
        kind === 'patient_override'
          ? 'override'
          : kind === 'weighted_tendency' || kind === 'background_variation'
            ? 'generated_value'
            : 'constraint',
      provenanceIds: ['provenance.test.alpha', 'provenance.test.beta'],
    },
  ],
  resolution: value === null ? null : authoredResolution,
  review:
    options.reviewStatus === 'unreviewed'
      ? {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        }
      : { ...approvedReview, sourceUseNoteIds: [...approvedReview.sourceUseNoteIds] },
});

const expressionBank: FindingExpressionBank = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding-expression-bank.test.energy',
  label: 'Energy wording',
  displayChannels: ['patient_history'],
  variants: [
    { id: 'finding-expression.test.energy-low', text: 'Low energy' },
    { id: 'finding-expression.test.energy-tired', text: 'Tired' },
    { id: 'finding-expression.test.energy-worn-out', text: 'Worn out' },
  ],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
};

const makeProjection = (
  id: string,
  sourceBindings: FindingRevealProjection['sourceBindings'],
  options: {
    sourceMatch?: 'all' | 'any';
    actionId?: string;
    reviewStatus?: 'approved' | 'unreviewed';
  } = {},
): FindingRevealProjection => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id,
  sourceMatch: options.sourceMatch ?? 'any',
  sourceBindings,
  target: {
    kind: 'information_action',
    actionId: options.actionId ?? 'info.history.test-depressive-symptoms',
  },
  response: { kind: 'finding_outcome', outcome: 'present' },
  expressionBankId: expressionBank.id,
  expressionBankContentVersion: expressionBank.contentVersion,
  review:
    options.reviewStatus === 'unreviewed'
      ? {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        }
      : approvedReview,
});

const findingBinding = (
  definition: FindingDefinition,
  allowedStates: Array<'present' | 'absent' | 'subthreshold' | 'unknown' | 'unassessed'> = [
    'present',
  ],
): FindingProjectionSourceBinding => ({
  kind: 'canonical_finding',
  findingDefinitionId: definition.id,
  findingDefinitionContentVersion: definition.contentVersion,
  allowedStates,
});

const propositionBinding = (
  sourceKinds: Array<'patient_report' | 'collateral_report'> = [
    'patient_report',
    'collateral_report',
  ],
): FindingProjectionSourceBinding => ({
  kind: 'proposition_evidence',
  propositionDefinitionId: 'proposition.test.job-loss',
  propositionDefinitionContentVersion: '1.0.0',
  allowedAssertions: ['supports', 'opposes'],
  sourceKinds,
  timeScopeIds: ['time-scope.current'],
});

const baseRequest = (): SharedFindingCompileRequest => ({
  schemaVersion: 1,
  id: 'finding-compilation-request.test',
  patientStateId: 'resolved-patient-state.test',
  seed: 'test-seed-42',
  findingDefinitions: [fatigueDefinition, concentrationDefinition],
  candidates: [
    makeCandidate(
      'finding-candidate.test.fatigue-required',
      fatigueDefinition,
      'case_critical',
      'present',
    ),
    makeCandidate(
      'finding-candidate.test.fatigue-compatible',
      fatigueDefinition,
      'weighted_tendency',
      'present',
    ),
    makeCandidate(
      'finding-candidate.test.concentration-background',
      concentrationDefinition,
      'background_variation',
      'absent',
    ),
  ],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test',
    propositions: [
      {
        schemaVersion: 1,
        id: 'patient-proposition.test.job-loss',
        definitionId: 'proposition.test.job-loss',
        definitionContentVersion: '1.0.0',
        auditStatement: 'The patient lost a job.',
        truth: true,
        resolution: authoredResolution,
      },
    ],
    evidence: [
      {
        schemaVersion: 1,
        id: 'patient-evidence.test.patient-job-loss',
        propositionId: 'patient-proposition.test.job-loss',
        assertion: 'supports',
        relationshipToTruth: 'aligned',
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.test.patient-history',
        },
        timeScopeId: 'time-scope.current',
        claimOriginId: 'claim-origin.test.patient',
        dependencyGroupIds: ['evidence-dependency.test.job-loss'],
        resolution: authoredResolution,
      },
      {
        schemaVersion: 1,
        id: 'patient-evidence.test.collateral-job-loss',
        propositionId: 'patient-proposition.test.job-loss',
        assertion: 'opposes',
        relationshipToTruth: 'misaligned',
        source: {
          kind: 'collateral_report',
          sourceInstanceId: 'source-instance.test.collateral-history',
        },
        timeScopeId: 'time-scope.current',
        claimOriginId: 'claim-origin.test.collateral',
        dependencyGroupIds: ['evidence-dependency.test.job-loss'],
        resolution: authoredResolution,
      },
    ],
    dependencyGroups: [
      {
        schemaVersion: 1,
        id: 'evidence-dependency.test.job-loss',
        kind: 'known_correlated',
        basisId: 'dependency-basis.test.shared-context',
        evidenceIds: [
          'patient-evidence.test.patient-job-loss',
          'patient-evidence.test.collateral-job-loss',
        ],
      },
    ],
    beliefAppraisals: [],
  },
  propositionDefinitions: [{ id: 'proposition.test.job-loss', contentVersion: '1.0.0' }],
  projections: [
    makeProjection('finding-projection.test.fatigue-depression', [
      findingBinding(fatigueDefinition),
    ]),
    makeProjection('finding-projection.test.fatigue-anxiety', [findingBinding(fatigueDefinition)], {
      actionId: 'info.history.test-anxiety-symptoms',
    }),
    makeProjection(
      'finding-projection.test.energy-any',
      [findingBinding(fatigueDefinition), findingBinding(concentrationDefinition)],
      { sourceMatch: 'any' },
    ),
    makeProjection('finding-projection.test.job-loss-evidence', [propositionBinding()], {
      actionId: 'info.history.test-social-context',
    }),
  ],
  expressionBanks: [
    {
      ...expressionBank,
      displayChannels: [...expressionBank.displayChannels],
      variants: expressionBank.variants.map((variant) => ({ ...variant })),
    },
  ],
  projectionHorizon: {
    schemaVersion: 1,
    id: 'finding-projection-horizon.test',
    targets: [
      'info.history.test-anxiety-symptoms',
      'info.history.test-depressive-symptoms',
      'info.history.test-social-context',
    ].map((actionId) => ({
      target: { kind: 'information_action' as const, actionId },
      allowedResponses: [{ kind: 'finding_outcome' as const, outcome: 'present' as const }],
      expressionDisplayChannel: 'patient_history' as const,
    })),
  },
});

const expectSuccess = (request: unknown) => {
  const result = compileSharedFindings(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('shared finding compiler', () => {
  it('parses the strict request and emits one canonical finding per definition', () => {
    expect(SharedFindingCompileRequestSchema.safeParse(baseRequest()).success).toBe(true);
    const compiled = expectSuccess(baseRequest());
    expect(CompiledSharedFindingSetSchema.parse(compiled)).toEqual(compiled);
    expect(compiled.findings.map((finding) => finding.definitionId)).toEqual([
      concentrationDefinition.id,
      fatigueDefinition.id,
    ]);
    expect(
      compiled.findings.find((finding) => finding.definitionId === fatigueDefinition.id)
        ?.contributions,
    ).toHaveLength(2);
  });

  it('is deterministic and invariant to every semantically unordered input array', () => {
    const first = expectSuccess(baseRequest());
    const reordered = baseRequest();
    reordered.findingDefinitions.reverse();
    reordered.candidates.reverse();
    reordered.projections.reverse();
    reordered.expressionBanks[0]!.variants.reverse();
    reordered.propositionState.evidence.reverse();
    reordered.propositionState.dependencyGroups[0]!.evidenceIds.reverse();
    reordered.projectionHorizon.targets.reverse();
    reordered.candidates[0]!.contributions[0]!.provenanceIds.reverse();
    reordered.candidates[0]!.review.sourceUseNoteIds.reverse();

    expect(expectSuccess(reordered)).toEqual(first);
  });

  it('applies agreeing hard candidates and preserves a compatible soft contributor', () => {
    const request = baseRequest();
    request.candidates.push(
      makeCandidate(
        'finding-candidate.test.fatigue-diagnostic',
        fatigueDefinition,
        'diagnostic_requirement',
        'present',
      ),
    );
    const compiled = expectSuccess(request);
    const evaluations = compiled.candidateEvaluations.filter(
      (entry) => entry.findingDefinitionId === fatigueDefinition.id,
    );
    expect(evaluations.map((entry) => [entry.candidateId, entry.disposition])).toEqual([
      ['finding-candidate.test.fatigue-compatible', 'compatible_not_decisive'],
      ['finding-candidate.test.fatigue-diagnostic', 'applied'],
      ['finding-candidate.test.fatigue-required', 'applied'],
    ]);
  });

  it('aggregates uncertainty without treating the same literal hard value as a contradiction', () => {
    const request = baseRequest();
    request.candidates.push(
      makeCandidate(
        'finding-candidate.test.fatigue-uncertain-diagnostic',
        fatigueDefinition,
        'diagnostic_requirement',
        'present',
        { uncertainty: 'conflicting_sources' },
      ),
    );

    const compiled = expectSuccess(request);
    const fatigue = compiled.findings.find(
      (finding) => finding.definitionId === fatigueDefinition.id,
    )!;
    expect(fatigue.value).toEqual({ kind: 'outcome', value: 'present' });
    expect(fatigue.resolution.uncertainty).toBe('conflicting_sources');
    expect(
      compiled.candidateEvaluations
        .filter(
          (evaluation) =>
            evaluation.findingDefinitionId === fatigueDefinition.id &&
            evaluation.kind !== 'weighted_tendency',
        )
        .map((evaluation) => evaluation.disposition),
    ).toEqual(['applied', 'applied']);
  });

  it('lets one explicit patient override control while retaining displaced candidates', () => {
    const request = baseRequest();
    request.candidates.push(
      makeCandidate(
        'finding-candidate.test.fatigue-override',
        fatigueDefinition,
        'patient_override',
        'absent',
      ),
    );
    const compiled = expectSuccess(request);
    const finding = compiled.findings.find((entry) => entry.definitionId === fatigueDefinition.id)!;
    expect(finding.value).toEqual({ kind: 'outcome', value: 'absent' });
    expect(
      compiled.candidateEvaluations
        .filter((entry) => entry.findingDefinitionId === fatigueDefinition.id)
        .map((entry) => [entry.candidateId, entry.disposition]),
    ).toEqual([
      ['finding-candidate.test.fatigue-compatible', 'superseded_by_override'],
      ['finding-candidate.test.fatigue-override', 'applied'],
      ['finding-candidate.test.fatigue-required', 'superseded_by_override'],
    ]);
  });

  it('returns a stable quarantine-eligible conflict for incompatible hard values', () => {
    const request = baseRequest();
    request.candidates.push(
      makeCandidate(
        'finding-candidate.test.fatigue-conflict',
        fatigueDefinition,
        'diagnostic_requirement',
        'absent',
      ),
    );
    const first = compileSharedFindings(request);
    const second = compileSharedFindings({
      ...request,
      candidates: request.candidates
        .map((candidate) => ({
          ...candidate,
          contributions: candidate.contributions
            .map((contribution) => ({
              ...contribution,
              provenanceIds: [...contribution.provenanceIds].reverse(),
            }))
            .reverse(),
          review: {
            ...candidate.review,
            sourceUseNoteIds: [...candidate.review.sourceUseNoteIds].reverse(),
          },
        }))
        .reverse(),
    });
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      ok: false,
      error: {
        code: 'LITERAL_SAME_SCOPE_CONTRADICTION',
        disposition: 'retry_or_quarantine',
        inputFingerprint: expect.stringMatching(/^fingerprint\.finding\.input\./),
        conflictingCandidates: expect.arrayContaining([
          expect.objectContaining({
            id: 'finding-candidate.test.fatigue-conflict',
            proposedValue: { kind: 'outcome', value: 'absent' },
          }),
        ]),
      },
    });

    const changed = {
      ...request,
      candidates: request.candidates.map((candidate) =>
        candidate.id === 'finding-candidate.test.fatigue-conflict'
          ? {
              ...candidate,
              proposedValue: {
                kind: 'outcome' as const,
                value: 'subthreshold' as const,
              },
            }
          : candidate,
      ),
    };
    const changedResult = compileSharedFindings(changed);
    expect(changedResult.ok).toBe(false);
    if (first.ok || changedResult.ok) throw new Error('Expected hard conflicts.');
    expect(changedResult.error.conflictId).not.toBe(first.error.conflictId);
  });

  it('refuses to invent a winner for unaggregated soft candidates', () => {
    const request = baseRequest();
    request.candidates = request.candidates.filter(
      (candidate) => candidate.findingDefinitionId !== concentrationDefinition.id,
    );
    request.candidates.push(
      makeCandidate(
        'finding-candidate.test.concentration-soft-present',
        concentrationDefinition,
        'weighted_tendency',
        'present',
      ),
      makeCandidate(
        'finding-candidate.test.concentration-soft-absent',
        concentrationDefinition,
        'weighted_tendency',
        'absent',
      ),
    );
    expect(compileSharedFindings(request)).toMatchObject({
      ok: false,
      error: {
        code: 'UNAGGREGATED_SOFT_CANDIDATES',
        disposition: 'invalid_input',
      },
    });
  });

  it('keeps unknown and unassessed separate from an explicit absent result', () => {
    const request = baseRequest();
    request.candidates = request.candidates.map((candidate) =>
      candidate.findingDefinitionId === concentrationDefinition.id
        ? {
            ...candidate,
            proposedValue: { kind: 'unresolved' as const, state: 'unassessed' as const },
          }
        : candidate,
    );
    request.projections.push(
      makeProjection(
        'finding-projection.test.concentration-unassessed',
        [findingBinding(concentrationDefinition, ['unassessed'])],
        { actionId: 'info.history.test-anxiety-symptoms' },
      ),
      makeProjection(
        'finding-projection.test.concentration-absent',
        [findingBinding(concentrationDefinition, ['absent'])],
        { actionId: 'info.history.test-anxiety-symptoms' },
      ),
    );
    const compiled = expectSuccess(request);
    expect(compiled.projections.map((projection) => projection.projectionId)).toContain(
      'finding-projection.test.concentration-unassessed',
    );
    expect(compiled.projections.map((projection) => projection.projectionId)).not.toContain(
      'finding-projection.test.concentration-absent',
    );
  });

  it('supports one-to-many and many-to-one projections without double-resolving facts', () => {
    const compiled = expectSuccess(baseRequest());
    const fatigueId = compiled.findings.find(
      (finding) => finding.definitionId === fatigueDefinition.id,
    )!.id;
    const fatigueViews = compiled.projections.filter((projection) =>
      projection.contributingResolvedFindingIds.includes(fatigueId),
    );
    expect(fatigueViews.map((projection) => projection.projectionId)).toEqual([
      'finding-projection.test.energy-any',
      'finding-projection.test.fatigue-anxiety',
      'finding-projection.test.fatigue-depression',
    ]);
    expect(new Set(compiled.findings.map((finding) => finding.definitionId)).size).toBe(2);
  });

  it('implements all/any matching over exact sources', () => {
    const request = baseRequest();
    request.projections.push(
      makeProjection(
        'finding-projection.test.energy-all',
        [findingBinding(fatigueDefinition), findingBinding(concentrationDefinition)],
        { sourceMatch: 'all' },
      ),
    );
    let compiled = expectSuccess(request);
    expect(compiled.projections.map((projection) => projection.projectionId)).not.toContain(
      'finding-projection.test.energy-all',
    );

    request.candidates = request.candidates.map((candidate) =>
      candidate.findingDefinitionId === concentrationDefinition.id
        ? { ...candidate, proposedValue: { kind: 'outcome' as const, value: 'present' as const } }
        : candidate,
    );
    compiled = expectSuccess(request);
    expect(
      compiled.projections.find(
        (projection) => projection.projectionId === 'finding-projection.test.energy-all',
      )?.contributingResolvedFindingIds,
    ).toHaveLength(2);
  });

  it('preserves conflicting proposition evidence and applies exact source filters', () => {
    const request = baseRequest();
    request.projections.push(
      makeProjection(
        'finding-projection.test.patient-only-job-loss',
        [propositionBinding(['patient_report'])],
        { actionId: 'info.history.test-social-context' },
      ),
    );
    const compiled = expectSuccess(request);
    expect(
      compiled.projections.find(
        (projection) => projection.projectionId === 'finding-projection.test.job-loss-evidence',
      ),
    ).toMatchObject({
      propositionIds: ['patient-proposition.test.job-loss'],
      evidenceIds: [
        'patient-evidence.test.collateral-job-loss',
        'patient-evidence.test.patient-job-loss',
      ],
    });
    expect(
      compiled.projections.find(
        (projection) => projection.projectionId === 'finding-projection.test.patient-only-job-loss',
      )?.evidenceIds,
    ).toEqual(['patient-evidence.test.patient-job-loss']);
  });

  it('selects wording deterministically without relying on bank array order', () => {
    const firstRequest = baseRequest();
    const secondRequest = baseRequest();
    secondRequest.expressionBanks[0]!.variants.reverse();
    const first = expectSuccess(firstRequest);
    const second = expectSuccess(secondRequest);
    expect(second).toEqual(first);
    expect(
      first.projections.every(
        (projection) =>
          projection.selectedExpression !== null && projection.resolution.stableDrawId !== null,
      ),
    ).toBe(true);
  });

  it('binds each stable wording draw to the exact seed-derived input fingerprint', () => {
    const first = expectSuccess(baseRequest());
    const secondRequest = baseRequest();
    secondRequest.seed = 'test-seed-43';
    const second = expectSuccess(secondRequest);

    expect(second.inputFingerprint).not.toBe(first.inputFingerprint);
    expect(second.projections[0]!.resolution.stableDrawId).not.toBe(
      first.projections[0]!.resolution.stableDrawId,
    );
  });

  it('does not reroll wording when unrelated request material changes', () => {
    const first = expectSuccess(baseRequest());
    const secondRequest = baseRequest();
    secondRequest.expressionBanks.push({
      ...expressionBank,
      id: 'finding-expression-bank.test.unused',
      variants: expressionBank.variants.map((variant) => ({
        ...variant,
        id: `${variant.id}-unused`,
      })),
    });
    const second = expectSuccess(secondRequest);

    expect(second.inputFingerprint).not.toBe(first.inputFingerprint);
    expect(
      second.projections.map((projection) => ({
        id: projection.id,
        expression: projection.selectedExpression,
        drawId: projection.resolution.stableDrawId,
      })),
    ).toEqual(
      first.projections.map((projection) => ({
        id: projection.id,
        expression: projection.selectedExpression,
        drawId: projection.resolution.stableDrawId,
      })),
    );
  });

  it('compiles an exact instrument target only when the frozen horizon admits it', () => {
    const request = baseRequest();
    request.projectionHorizon.targets.push({
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.energy',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.energy',
      },
      allowedResponses: [{ kind: 'response_option', responseOptionId: 'response-option.test.yes' }],
      expressionDisplayChannel: null,
    });
    request.projections.push({
      ...makeProjection('finding-projection.test.instrument-energy', [
        findingBinding(fatigueDefinition),
      ]),
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.energy',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.energy',
      },
      response: {
        kind: 'response_option',
        responseOptionId: 'response-option.test.yes',
      },
      expressionBankId: null,
      expressionBankContentVersion: null,
    });
    const compiled = expectSuccess(request);
    expect(compiled.projectionHorizonId).toBe(request.projectionHorizon.id);
    expect(
      verifyCompiledSharedFindingContext({
        compiled,
        projectionHorizon: request.projectionHorizon,
      }),
    ).toEqual({ ok: true, value: compiled });
    expect(
      compiled.projections.find(
        (projection) => projection.projectionId === 'finding-projection.test.instrument-energy',
      ),
    ).toMatchObject({
      target: { kind: 'instrument_item', itemId: 'instrument-item.test.energy' },
      selectedExpression: null,
      resolution: { stableDrawId: null },
    });

    request.projectionHorizon.targets.pop();
    expect(compileSharedFindings(request)).toMatchObject({
      ok: false,
      error: { code: 'UNKNOWN_PROJECTION_TARGET' },
    });
  });

  it('rejects a changed projection-horizon payload even when its stable ID is reused', () => {
    const request = baseRequest();
    const compiled = expectSuccess(request);
    expect(
      verifyCompiledSharedFindingContext({
        compiled,
        projectionHorizon: {
          ...request.projectionHorizon,
          targets: request.projectionHorizon.targets.slice(1),
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_HORIZON_FINGERPRINT_MISMATCH' },
    });
  });

  it('attaches every frozen wording draw to the saved seed', () => {
    const request = baseRequest();
    const compiled = expectSuccess(request);
    expect(
      verifyCompiledSharedFindingSeedContext({
        compiled,
        seed: request.seed,
      }),
    ).toEqual({ ok: true, value: compiled });
    expect(
      verifyCompiledSharedFindingSeedContext({
        compiled,
        seed: 'different-seed',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_SEED_CONTEXT_MISMATCH' },
    });
  });

  it('keeps unreviewed candidates and projections inert but auditable', () => {
    const request = baseRequest();
    request.candidates.push(
      makeCandidate(
        'finding-candidate.test.fatigue-unreviewed',
        fatigueDefinition,
        'patient_override',
        'absent',
        { reviewStatus: 'unreviewed' },
      ),
    );
    request.projections.push(
      makeProjection('finding-projection.test.unreviewed', [findingBinding(fatigueDefinition)], {
        reviewStatus: 'unreviewed',
      }),
    );
    const compiled = expectSuccess(request);
    expect(
      compiled.candidateEvaluations.find(
        (entry) => entry.candidateId === 'finding-candidate.test.fatigue-unreviewed',
      ),
    ).toMatchObject({
      disposition: 'not_reviewed',
      review: { status: 'unreviewed', reviewerId: null, reviewedAt: null },
    });
    expect(compiled.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'candidate_not_approved',
      'projection_not_approved',
    ]);
    expect(compiled.projections.map((projection) => projection.projectionId)).not.toContain(
      'finding-projection.test.unreviewed',
    );
  });

  it('does not resolve or cross-reference an unreviewed projection', () => {
    const request = baseRequest();
    request.projections.push({
      ...makeProjection(
        'finding-projection.test.unreviewed-stale',
        [findingBinding(fatigueDefinition)],
        { reviewStatus: 'unreviewed' },
      ),
      sourceBindings: [
        {
          kind: 'canonical_finding',
          findingDefinitionId: fatigueDefinition.id,
          findingDefinitionContentVersion: '9.0.0',
          allowedStates: ['present'],
        },
      ],
      target: {
        kind: 'information_action',
        actionId: 'info.history.test-not-in-horizon',
      },
      expressionBankId: 'finding-expression-bank.test.not-supplied',
      expressionBankContentVersion: '1.0.0',
    });

    const compiled = expectSuccess(request);
    expect(compiled.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'projection_not_approved',
        contentIds: ['finding-projection.test.unreviewed-stale'],
      }),
    );
  });

  it('rejects stale source, target, response, and expression-bank references', () => {
    const staleFinding = baseRequest();
    staleFinding.projections[0] = {
      ...staleFinding.projections[0]!,
      sourceBindings: [
        {
          ...staleFinding.projections[0]!.sourceBindings[0]!,
          findingDefinitionContentVersion: '9.0.0',
        } as (typeof staleFinding.projections)[number]['sourceBindings'][number],
      ],
    };
    expect(compileSharedFindings(staleFinding)).toMatchObject({
      ok: false,
      error: { code: 'STALE_PROJECTION_SOURCE' },
    });

    const staleBank = baseRequest();
    staleBank.projections[0] = {
      ...staleBank.projections[0]!,
      expressionBankContentVersion: '9.0.0',
    };
    expect(compileSharedFindings(staleBank)).toMatchObject({
      ok: false,
      error: { code: 'STALE_EXPRESSION_BANK' },
    });

    const badResponse = baseRequest();
    badResponse.projections[0] = {
      ...badResponse.projections[0]!,
      response: { kind: 'finding_outcome', outcome: 'absent' },
    };
    expect(compileSharedFindings(badResponse)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_PROJECTION_RESPONSE' },
    });
  });

  it('does not mutate its input and verifies the frozen output fingerprint', () => {
    const request = baseRequest();
    const before = JSON.stringify(request);
    const compiled = expectSuccess(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(verifyCompiledSharedFindingIntegrity(compiled)).toEqual({
      ok: true,
      value: compiled,
    });
    expect(
      verifyCompiledSharedFindingIntegrity({
        ...compiled,
        patientStateId: 'resolved-patient-state.test.tampered',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'FINGERPRINT_MISMATCH' },
    });
  });

  it('rejects a schema-valid unsupported shared-finding compiler version before fingerprint validation', () => {
    const compiled = expectSuccess(baseRequest());
    const unsupported = {
      ...compiled,
      compilerVersion: '9.0.0',
      findings: compiled.findings.map((finding) => ({
        ...finding,
        resolution: {
          ...finding.resolution,
          resolverVersion: '9.0.0',
        },
      })),
      projections: compiled.projections.map((projection) => ({
        ...projection,
        resolution: {
          ...projection.resolution,
          compilerVersion: '9.0.0',
        },
      })),
    };
    expect(CompiledSharedFindingSetSchema.safeParse(unsupported).success).toBe(true);
    expect(verifyCompiledSharedFindingIntegrity(unsupported)).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_COMPILER_VERSION' },
    });
  });

  it('rejects duplicate contribution IDs and no-opinion values at the schema boundary', () => {
    const duplicate = baseRequest();
    duplicate.candidates[1] = {
      ...duplicate.candidates[1]!,
      contributions: duplicate.candidates[0]!.contributions,
    };
    expect(SharedFindingCompileRequestSchema.safeParse(duplicate).success).toBe(false);

    const noOpinion = makeCandidate(
      'finding-candidate.test.no-opinion',
      fatigueDefinition,
      'no_opinion',
      null,
    );
    expect(
      SharedFindingCompileRequestSchema.safeParse({
        ...baseRequest(),
        candidates: [
          ...baseRequest().candidates,
          { ...noOpinion, proposedValue: { kind: 'outcome', value: 'present' } },
        ],
      }).success,
    ).toBe(false);

    const identityOnly = baseRequest();
    identityOnly.candidates[0] = {
      ...identityOnly.candidates[0]!,
      contributions: identityOnly.candidates[0]!.contributions.map((contribution) => ({
        ...contribution,
        role: 'identity' as const,
      })),
    };
    expect(SharedFindingCompileRequestSchema.safeParse(identityOnly).success).toBe(false);
  });

  it('rejects recomputed compiled snapshots with incomplete or cross-linked audit graphs', () => {
    const compiled = expectSuccess(baseRequest());
    const missingEvaluation = {
      ...compiled,
      candidateEvaluations: compiled.candidateEvaluations.filter(
        (evaluation) => evaluation.findingDefinitionId !== concentrationDefinition.id,
      ),
    };
    expect(CompiledSharedFindingSetSchema.safeParse(missingEvaluation).success).toBe(false);

    const duplicateProjectionDefinition = {
      ...compiled,
      projections: [
        ...compiled.projections,
        {
          ...compiled.projections[0]!,
          id: 'resolved-finding-projection.test-duplicate-definition',
        },
      ],
    };
    expect(CompiledSharedFindingSetSchema.safeParse(duplicateProjectionDefinition).success).toBe(
      false,
    );

    const orphanProjectionFinding = {
      ...compiled,
      projections: [
        {
          ...compiled.projections[0]!,
          contributingResolvedFindingIds: ['resolved-finding.test-not-in-set'],
        },
        ...compiled.projections.slice(1),
      ],
    };
    expect(CompiledSharedFindingSetSchema.safeParse(orphanProjectionFinding).success).toBe(false);

    const staleProjectionTrace = {
      ...compiled,
      projections: [
        {
          ...compiled.projections[0]!,
          resolution: {
            ...compiled.projections[0]!.resolution,
            inputFingerprint: 'fingerprint.finding.input.fnv1a64.0000000000000000' as const,
          },
        },
        ...compiled.projections.slice(1),
      ],
    };
    expect(CompiledSharedFindingSetSchema.safeParse(staleProjectionTrace).success).toBe(false);
  });
});
