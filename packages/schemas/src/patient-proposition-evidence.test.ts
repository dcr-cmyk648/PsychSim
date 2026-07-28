import { describe, expect, it } from 'vitest';

import {
  BeliefAppraisalSchema,
  LatentPatientPropositionSchema,
  PatientPropositionEvidenceSchema,
  PropositionEvidenceGenerationProfileSchema,
  ResolvedPatientPropositionStateSchema,
} from './index';

const authoredResolution = {
  origin: 'authored',
  ownerId: 'patient-template.test',
  ownerContentVersion: '1.0.0',
} as const;

const deterministicResolution = {
  origin: 'deterministic_generation',
  generationProfileId: 'generation-profile.evidence.test',
  generationProfileContentVersion: '1.0.0',
  resolverVersion: '1.0.0',
  stableDrawId: 'draw.evidence.test',
} as const;

const proposition = {
  schemaVersion: 1,
  id: 'patient-proposition.test.event',
  definitionId: 'proposition.test.event-occurred',
  definitionContentVersion: '1.0.0',
  auditStatement: 'The modeled event occurred.',
  truth: true,
  resolution: authoredResolution,
} as const;

const patientEvidence = {
  schemaVersion: 1,
  id: 'patient-evidence.test.patient-report',
  propositionId: proposition.id,
  assertion: 'opposes',
  relationshipToTruth: 'misaligned',
  source: {
    kind: 'patient_report',
    sourceInstanceId: 'source-instance.test.patient',
  },
  timeScopeId: 'time-scope.current',
  claimOriginId: 'claim-origin.test.patient-report',
  dependencyGroupIds: [],
  resolution: deterministicResolution,
} as const;

const collateralEvidence = {
  schemaVersion: 1,
  id: 'patient-evidence.test.collateral-report',
  propositionId: proposition.id,
  assertion: 'supports',
  relationshipToTruth: 'aligned',
  source: {
    kind: 'collateral_report',
    sourceInstanceId: 'source-instance.test.collateral',
  },
  timeScopeId: 'time-scope.current',
  claimOriginId: 'claim-origin.test.collateral-report',
  dependencyGroupIds: [],
  resolution: authoredResolution,
} as const;

const unresolvedEvidence = {
  schemaVersion: 1,
  id: 'patient-evidence.test.record',
  propositionId: proposition.id,
  assertion: 'uncertain',
  relationshipToTruth: 'indeterminate',
  source: {
    kind: 'record_review',
    sourceInstanceId: 'source-instance.test.record',
  },
  timeScopeId: 'time-scope.historical',
  claimOriginId: 'claim-origin.test.record',
  dependencyGroupIds: [],
  resolution: authoredResolution,
} as const;

const appraisal = {
  schemaVersion: 1,
  id: 'belief-appraisal.test.event',
  propositionId: proposition.id,
  subjectId: 'patient.test',
  beliefPosition: 'holds',
  dimensionValues: [],
  clinicalInterpretations: [],
  resolution: authoredResolution,
} as const;

const state = {
  schemaVersion: 1,
  id: 'patient-proposition-state.test',
  propositions: [proposition],
  evidence: [patientEvidence, collateralEvidence, unresolvedEvidence],
  dependencyGroups: [],
  beliefAppraisals: [appraisal],
} as const;

describe('latent proposition and patient-scene evidence boundary', () => {
  it('round-trips conflicting evidence without changing the frozen truth', () => {
    const parsed = ResolvedPatientPropositionStateSchema.parse(state);
    expect(ResolvedPatientPropositionStateSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(
      parsed,
    );
    expect(parsed.propositions[0]?.truth).toBe(true);
    expect(parsed.evidence.map((evidence) => evidence.assertion)).toEqual([
      'opposes',
      'supports',
      'uncertain',
    ]);
  });

  it('allows collectively misleading evidence and does not require convergence', () => {
    const misleading = {
      ...state,
      evidence: [
        patientEvidence,
        {
          ...collateralEvidence,
          assertion: 'opposes',
          relationshipToTruth: 'misaligned',
        },
        {
          ...unresolvedEvidence,
          assertion: 'opposes',
          relationshipToTruth: 'misaligned',
        },
      ],
    };
    expect(ResolvedPatientPropositionStateSchema.safeParse(misleading).success).toBe(true);
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        evidence: [],
      }).success,
    ).toBe(true);
  });

  it('keeps falsity, belief, and clinical interpretation separate', () => {
    const falseProposition = { ...proposition, truth: false };
    const falseState = {
      ...state,
      propositions: [falseProposition],
      evidence: [
        {
          ...patientEvidence,
          assertion: 'supports',
          relationshipToTruth: 'misaligned',
        },
      ],
      beliefAppraisals: [appraisal],
    };
    const parsed = ResolvedPatientPropositionStateSchema.parse(falseState);
    expect(parsed.propositions[0]?.truth).toBe(false);
    expect(parsed.beliefAppraisals[0]?.beliefPosition).toBe('holds');
    expect(parsed.beliefAppraisals[0]?.clinicalInterpretations).toEqual([]);
  });

  it('requires mechanically correct evidence-to-truth relations', () => {
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        evidence: [{ ...patientEvidence, relationshipToTruth: 'aligned' }],
      }).success,
    ).toBe(false);
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        propositions: [{ ...proposition, truth: false }],
        evidence: [
          {
            ...patientEvidence,
            assertion: 'opposes',
            relationshipToTruth: 'aligned',
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('validates exact shared origins and bidirectional dependency membership', () => {
    const copyGroupId = 'evidence-dependency-group.test.shared-origin';
    const copiedEvidence = {
      ...patientEvidence,
      id: 'patient-evidence.test.patient-report-copy',
      dependencyGroupIds: [copyGroupId],
    };
    const originalEvidence = {
      ...patientEvidence,
      dependencyGroupIds: [copyGroupId],
    };
    const sharedOriginState = {
      ...state,
      evidence: [originalEvidence, copiedEvidence],
      dependencyGroups: [
        {
          schemaVersion: 1,
          id: copyGroupId,
          kind: 'shared_origin',
          basisId: patientEvidence.claimOriginId,
          evidenceIds: [originalEvidence.id, copiedEvidence.id],
        },
      ],
    };
    expect(ResolvedPatientPropositionStateSchema.safeParse(sharedOriginState).success).toBe(true);
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...sharedOriginState,
        dependencyGroups: [
          {
            ...sharedOriginState.dependencyGroups[0],
            basisId: 'claim-origin.test.other',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...sharedOriginState,
        evidence: [{ ...originalEvidence, dependencyGroupIds: [] }, copiedEvidence],
      }).success,
    ).toBe(false);
  });

  it('allows known correlation across distinct claim origins', () => {
    const groupId = 'evidence-dependency-group.test.correlated';
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        evidence: [
          { ...patientEvidence, dependencyGroupIds: [groupId] },
          { ...collateralEvidence, dependencyGroupIds: [groupId] },
        ],
        dependencyGroups: [
          {
            schemaVersion: 1,
            id: groupId,
            kind: 'known_correlated',
            basisId: 'dependency-basis.test.shared-event',
            evidenceIds: [patientEvidence.id, collateralEvidence.id],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects missing references and duplicate record IDs', () => {
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        evidence: [{ ...patientEvidence, propositionId: 'patient-proposition.test.missing' }],
      }).success,
    ).toBe(false);
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        evidence: [patientEvidence, { ...patientEvidence }],
      }).success,
    ).toBe(false);
    expect(
      ResolvedPatientPropositionStateSchema.safeParse({
        ...state,
        beliefAppraisals: [{ ...appraisal, propositionId: 'patient-proposition.test.missing' }],
      }).success,
    ).toBe(false);
  });

  it('keeps generation profiles structural and probability-free', () => {
    const profile = {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'generation-profile.evidence.test',
      sourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
      propositionDefinitionIds: [proposition.definitionId],
      allowedAssertions: ['supports', 'opposes', 'uncertain', 'unable_to_assess'],
      review: {
        status: 'unreviewed',
        reviewerId: null,
        reviewedAt: null,
        sourceUseNoteIds: [],
      },
    } as const;
    expect(PropositionEvidenceGenerationProfileSchema.safeParse(profile).success).toBe(true);
    expect(
      PropositionEvidenceGenerationProfileSchema.safeParse({
        ...profile,
        probability: 0.9,
      }).success,
    ).toBe(false);
    expect(
      PropositionEvidenceGenerationProfileSchema.safeParse({
        ...profile,
        credibilityScore: 90,
      }).success,
    ).toBe(false);
  });

  it('rejects UI, scoring, diagnosis, motive, and formal-source fields', () => {
    expect(LatentPatientPropositionSchema.safeParse({ ...proposition, points: 10 }).success).toBe(
      false,
    );
    expect(
      PatientPropositionEvidenceSchema.safeParse({
        ...patientEvidence,
        revealed: true,
      }).success,
    ).toBe(false);
    expect(
      PatientPropositionEvidenceSchema.safeParse({
        ...patientEvidence,
        diagnosisId: 'diagnosis.delusional-disorder',
      }).success,
    ).toBe(false);
    expect(
      PatientPropositionEvidenceSchema.safeParse({
        ...patientEvidence,
        motive: 'secondary_gain',
      }).success,
    ).toBe(false);
    expect(
      PatientPropositionEvidenceSchema.safeParse({
        ...patientEvidence,
        evidenceSourceIds: ['evidence.example'],
      }).success,
    ).toBe(false);
    expect(BeliefAppraisalSchema.safeParse({ ...appraisal, delusional: true }).success).toBe(false);
  });

  it('requires deterministic trace provenance and forbids it on authored records', () => {
    expect(
      PatientPropositionEvidenceSchema.safeParse({
        ...patientEvidence,
        resolution: {
          origin: 'deterministic_generation',
          generationProfileId: 'generation-profile.evidence.test',
          generationProfileContentVersion: '1.0.0',
          resolverVersion: '1.0.0',
        },
      }).success,
    ).toBe(false);
    expect(
      PatientPropositionEvidenceSchema.safeParse({
        ...patientEvidence,
        resolution: {
          ...authoredResolution,
          stableDrawId: 'draw.evidence.test',
        },
      }).success,
    ).toBe(false);
  });
});
