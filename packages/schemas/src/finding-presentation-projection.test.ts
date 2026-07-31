import { describe, expect, it } from 'vitest';

import expressionBankCatalogJson from '../../../content/catalogs/findings/expression-banks.json';
import {
  FindingExpressionBankCatalogSchema,
  FindingExpressionBankSchema,
  FindingProjectionResolutionEnvelopeSchema,
  FindingRevealProjectionSchema,
  InstrumentItemResponseSchema,
  ResolvedFindingProjectionSchema,
} from './index';

const bank = FindingExpressionBankCatalogSchema.parse(expressionBankCatalogJson).banks[0]!;

const projection = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding-projection.history.energy',
  sourceMatch: 'any',
  sourceBindings: [
    {
      kind: 'canonical_finding',
      findingDefinitionId: 'finding.history.current-fatigue-low-energy',
      findingDefinitionContentVersion: '1.0.0',
      allowedStates: ['present', 'subthreshold'],
    },
    {
      kind: 'proposition_evidence',
      propositionDefinitionId: 'proposition.test.energy-limitation',
      propositionDefinitionContentVersion: '1.0.0',
      allowedAssertions: ['supports'],
      sourceKinds: ['patient_report'],
      timeScopeIds: ['time-scope.current'],
    },
  ],
  target: {
    kind: 'information_action',
    actionId: 'info.history.depressive-symptoms',
  },
  response: {
    kind: 'response_option',
    responseOptionId: 'response.energy.present',
  },
  expressionBankId: bank.id,
  expressionBankContentVersion: bank.contentVersion,
  review: {
    status: 'unreviewed',
    reviewerId: null,
    reviewedAt: null,
    sourceUseNoteIds: [],
  },
} as const;

const resolved = {
  schemaVersion: 1,
  id: 'resolved-finding-projection.test.energy',
  projectionId: projection.id,
  projectionContentVersion: projection.contentVersion,
  target: projection.target,
  response: projection.response,
  selectedExpression: {
    bankId: bank.id,
    bankContentVersion: bank.contentVersion,
    variantId: bank.variants[0]!.id,
  },
  contributingResolvedFindingIds: ['resolved-finding.test.energy'],
  propositionIds: ['patient-proposition.test.energy-limitation'],
  evidenceIds: ['patient-evidence.test.energy-report'],
  resolution: {
    origin: 'compiled',
    compilerVersion: '1.0.0',
    inputFingerprint: 'fingerprint.finding.input.fnv1a64.0123456789abcdef',
    stableDrawId: 'draw.projection.test.energy',
  },
} as const;

describe('finding presentation projection boundary', () => {
  it('parses the tracked expression-bank catalog and keeps wording separate from aliases', () => {
    const parsed = FindingExpressionBankCatalogSchema.parse(expressionBankCatalogJson);
    expect(parsed.id).toBe('registry.catalog.finding-expression-banks');
    expect(parsed.banks[0]?.variants.map((variant) => variant.text)).toEqual([
      'Tired',
      'Fatigued',
      'Low energy',
      'Worn out',
    ]);
    expect(
      FindingExpressionBankSchema.safeParse({ ...bank, aliases: ['Energy loss'] }).success,
    ).toBe(false);
  });

  it('round-trips an explicit many-to-many projection with proposition evidence', () => {
    const parsed = FindingProjectionResolutionEnvelopeSchema.parse({
      projection,
      resolved,
      expressionBank: bank,
    });
    expect(
      FindingProjectionResolutionEnvelopeSchema.parse(JSON.parse(JSON.stringify(parsed))),
    ).toEqual(parsed);
    expect(parsed.resolved.contributingResolvedFindingIds).toEqual([
      'resolved-finding.test.energy',
    ]);
    expect(parsed.resolved.evidenceIds).toEqual(['patient-evidence.test.energy-report']);
  });

  it('does not infer a projection from aliases or wording', () => {
    expect(
      FindingRevealProjectionSchema.safeParse({
        ...projection,
        sourceBindings: [],
        phraseMatch: 'tired',
      }).success,
    ).toBe(false);
    expect(
      FindingRevealProjectionSchema.safeParse({
        ...projection,
        sourceBindings: [projection.sourceBindings[0], { ...projection.sourceBindings[0] }],
      }).success,
    ).toBe(false);
  });

  it('requires a frozen result to retain exact projection, target, response, and wording version', () => {
    expect(
      FindingProjectionResolutionEnvelopeSchema.safeParse({
        projection,
        resolved: { ...resolved, projectionContentVersion: '2.0.0' },
        expressionBank: bank,
      }).success,
    ).toBe(false);
    expect(
      FindingProjectionResolutionEnvelopeSchema.safeParse({
        projection,
        resolved: {
          ...resolved,
          selectedExpression: {
            ...resolved.selectedExpression,
            variantId: 'finding-expression.energy.missing',
          },
        },
        expressionBank: bank,
      }).success,
    ).toBe(false);
    expect(
      FindingProjectionResolutionEnvelopeSchema.safeParse({
        projection,
        resolved: {
          ...resolved,
          response: {
            kind: 'response_option',
            responseOptionId: 'response.energy.absent',
          },
        },
        expressionBank: bank,
      }).success,
    ).toBe(false);
  });

  it('allows a standardized item without an unstructured expression bank', () => {
    const instrumentProjection = {
      ...projection,
      id: 'finding-projection.instrument.energy',
      target: {
        kind: 'instrument_item',
        instrumentDefinitionId: 'instrument.test.energy',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.energy',
      },
      expressionBankId: null,
      expressionBankContentVersion: null,
    } as const;
    const instrumentResolved = {
      ...resolved,
      id: 'resolved-finding-projection.test.instrument-energy',
      projectionId: instrumentProjection.id,
      target: instrumentProjection.target,
      selectedExpression: null,
    } as const;
    expect(
      FindingProjectionResolutionEnvelopeSchema.safeParse({
        projection: instrumentProjection,
        resolved: instrumentResolved,
        expressionBank: null,
      }).success,
    ).toBe(true);
  });

  it('keeps standardized item response metadata and contributor IDs explicit', () => {
    expect(
      InstrumentItemResponseSchema.safeParse({
        schemaVersion: 1,
        id: 'instrument-response.test.energy',
        instrumentDefinitionId: 'instrument.test.energy',
        instrumentContentVersion: '1.0.0',
        itemId: 'instrument-item.test.energy',
        responseScaleId: 'response-scale.test.binary',
        responseOptionId: 'response-option.test.yes',
        timeScopeId: 'time-scope.current',
        respondentSourceKind: 'patient_report',
        rightsBoundaryId: 'rights-boundary.test.public',
        interpretationIds: [],
        contributingResolvedFindingIds: ['resolved-finding.test.energy'],
        propositionIds: [],
        evidenceIds: [],
        projectionId: 'finding-projection.instrument.energy',
        projectionContentVersion: '1.0.0',
      }).success,
    ).toBe(true);
  });

  it('rejects points, scoring predicates, and reveal state from projection schemas', () => {
    expect(FindingRevealProjectionSchema.safeParse({ ...projection, points: 10 }).success).toBe(
      false,
    );
    expect(
      ResolvedFindingProjectionSchema.safeParse({
        ...resolved,
        revealed: true,
      }).success,
    ).toBe(false);
    expect(
      ResolvedFindingProjectionSchema.safeParse({
        ...resolved,
        scorePredicate: { type: 'factKnown', factId: 'fact.test' },
      }).success,
    ).toBe(false);
  });
});
