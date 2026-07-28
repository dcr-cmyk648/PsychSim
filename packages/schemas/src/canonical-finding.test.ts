import { describe, expect, it } from 'vitest';

import {
  CanonicalFindingResolutionEnvelopeSchema,
  FindingDefinitionSchema,
  ResolvedCanonicalFindingSchema,
} from './index';

const definition = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'finding.test.depressed-mood',
  label: 'Depressed mood',
  aliases: ['Low mood', 'Feeling down'],
  semanticKind: 'symptom',
  valueSpecification: {
    kind: 'outcome',
    allowedValues: ['present', 'absent', 'subthreshold'],
  },
  allowedPresentationProjections: ['status'],
  lifecycle: 'review',
  medicalReviewStatus: 'unreviewed',
} as const;

const resolved = {
  schemaVersion: 1,
  id: 'resolved-finding.test-patient.depressed-mood',
  definitionId: definition.id,
  definitionContentVersion: definition.contentVersion,
  value: {
    kind: 'outcome',
    value: 'present',
  },
  resolution: {
    resolverVersion: '1.0.0',
    origin: 'compiled',
    uncertainty: 'none',
    appliedContributionIds: ['finding-contribution.test-template.depressed-mood'],
  },
  contributions: [
    {
      schemaVersion: 1,
      id: 'finding-contribution.test-template.depressed-mood',
      ownerKind: 'patient_template',
      ownerId: 'patient-template.test',
      ownerContentVersion: '1.0.0',
      role: 'constraint',
      provenanceIds: ['source-use-note.test.depressed-mood'],
    },
  ],
} as const;

describe('canonical finding boundary', () => {
  it('parses and JSON-roundtrips one definition and one resolved typed value', () => {
    const parsed = CanonicalFindingResolutionEnvelopeSchema.parse({ definition, resolved });
    expect(
      CanonicalFindingResolutionEnvelopeSchema.parse(JSON.parse(JSON.stringify(parsed))),
    ).toEqual(parsed);
  });

  it('keeps unresolved patient knowledge separate from a known absent outcome', () => {
    const unassessed = ResolvedCanonicalFindingSchema.parse({
      ...resolved,
      value: { kind: 'unresolved', state: 'unassessed' },
    });
    const absent = ResolvedCanonicalFindingSchema.parse({
      ...resolved,
      value: { kind: 'outcome', value: 'absent' },
    });

    expect(unassessed.value).toEqual({ kind: 'unresolved', state: 'unassessed' });
    expect(absent.value).toEqual({ kind: 'outcome', value: 'absent' });
  });

  it('rejects aliases, outcomes, projections, and provenance that are not unique', () => {
    expect(
      FindingDefinitionSchema.safeParse({
        ...definition,
        aliases: ['low mood', 'LOW MOOD'],
      }).success,
    ).toBe(false);
    expect(
      FindingDefinitionSchema.safeParse({
        ...definition,
        valueSpecification: {
          kind: 'outcome',
          allowedValues: ['present', 'present'],
        },
      }).success,
    ).toBe(false);
    expect(
      FindingDefinitionSchema.safeParse({
        ...definition,
        allowedPresentationProjections: ['status', 'status'],
      }).success,
    ).toBe(false);
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        contributions: [
          {
            ...resolved.contributions[0],
            provenanceIds: ['source-use-note.test.one', 'source-use-note.test.one'],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        contributions: [resolved.contributions[0], { ...resolved.contributions[0] }],
      }).success,
    ).toBe(false);
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        resolution: {
          ...resolved.resolution,
          appliedContributionIds: [
            'finding-contribution.test-template.depressed-mood',
            'finding-contribution.test-template.depressed-mood',
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('rejects an untraced contribution and a value outside the definition', () => {
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        value: { kind: 'outcome', value: 7 },
      }).success,
    ).toBe(false);
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        resolution: {
          ...resolved.resolution,
          appliedContributionIds: ['finding-contribution.test.missing'],
        },
      }).success,
    ).toBe(false);
    expect(
      CanonicalFindingResolutionEnvelopeSchema.safeParse({
        definition,
        resolved: {
          ...resolved,
          value: { kind: 'outcome', value: 'normal' },
        },
      }).success,
    ).toBe(false);
  });

  it('requires exact versioned and value-bearing contributor provenance', () => {
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        contributions: [
          {
            ...resolved.contributions[0],
            ownerKind: 'generation_profile',
            ownerContentVersion: null,
            role: 'generated_value',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      ResolvedCanonicalFindingSchema.safeParse({
        ...resolved,
        contributions: [
          {
            ...resolved.contributions[0],
            role: 'identity',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps reveal state, points, and clinical rules outside the strict boundary', () => {
    expect(FindingDefinitionSchema.safeParse({ ...definition, points: 10 }).success).toBe(false);
    expect(FindingDefinitionSchema.safeParse({ ...definition, label: '   ' }).success).toBe(false);
    expect(
      FindingDefinitionSchema.safeParse({
        ...definition,
        semanticKind: 'measurement',
      }).success,
    ).toBe(false);
    expect(ResolvedCanonicalFindingSchema.safeParse({ ...resolved, revealed: true }).success).toBe(
      false,
    );
  });
});
