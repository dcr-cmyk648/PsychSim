import {
  FindingProjectionCatalogSchema,
  type ClinicalRuleReview,
  type FindingResolutionCandidate,
  type SharedFindingCompileRequest,
} from '@psychsim/schemas';
import { catalogs } from '@psychsim/content-runtime';
import {
  compileSharedFindings,
  verifyCompiledSharedFindingIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import findingProjectionsJson from '../../../content/catalogs/findings/projections.json';

const catalog = FindingProjectionCatalogSchema.parse(findingProjectionsJson);
const actionId = 'info.history.depressive-symptoms';
const opinionId = 'developer-opinion.mdd-depressive-symptom-assessment-horizon.2026-08-03';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.dustin-rowland',
  reviewedAt: '2026-08-03T13:50:00.000Z',
  sourceUseNoteIds: [],
};

const findingIds = new Set(
  catalog.projections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const findingDefinitions = catalogs.findings.filter((finding) => findingIds.has(finding.id));
const findingById = new Map(findingDefinitions.map((finding) => [finding.id, finding]));

const makeCandidate = (
  suffix: string,
  findingDefinitionId: string,
  value: 'present' | 'subthreshold',
): FindingResolutionCandidate => {
  const definition = findingById.get(findingDefinitionId);
  if (!definition) throw new Error(`Missing fixture finding ${findingDefinitionId}.`);
  return {
    schemaVersion: 1,
    id: `finding-candidate.test.depressive-symptoms.${suffix}`,
    findingDefinitionId,
    findingDefinitionContentVersion: definition.contentVersion,
    kind: 'case_critical',
    proposedValue: { kind: 'outcome', value },
    uncertainty: 'none',
    contributions: [
      {
        schemaVersion: 1,
        id: `finding-contribution.test.depressive-symptoms.${suffix}`,
        ownerKind: 'patient_template',
        ownerId: 'patient-template.test.depressive-symptoms',
        ownerContentVersion: '1.0.0',
        role: 'constraint',
        provenanceIds: ['provenance.test.depressive-symptoms'],
      },
    ],
    resolution: {
      origin: 'authored',
      ownerId: 'patient-template.test.depressive-symptoms',
      ownerContentVersion: '1.0.0',
    },
    review: approvedReview,
  };
};

const compileRequest = (): SharedFindingCompileRequest => ({
  schemaVersion: 1,
  id: 'finding-compilation-request.test.checked-in-depressive-symptoms',
  patientStateId: 'resolved-patient-state.test.checked-in-depressive-symptoms',
  seed: 'seed.test.checked-in-depressive-symptoms',
  findingDefinitions,
  candidates: [
    makeCandidate('depressed-mood', 'finding.depressive.depressed-mood', 'present'),
    makeCandidate('insomnia', 'finding.sleep.current-insomnia', 'present'),
    makeCandidate(
      'fatigue-subthreshold',
      'finding.history.current-fatigue-low-energy',
      'subthreshold',
    ),
    makeCandidate('passive-death-wish', 'finding.safety.current-passive-death-wish', 'present'),
  ],
  propositionState: {
    schemaVersion: 1,
    id: 'resolved-proposition-state.test.checked-in-depressive-symptoms',
    propositions: [],
    evidence: [],
    dependencyGroups: [],
    beliefAppraisals: [],
  },
  propositionDefinitions: [],
  projections: catalog.projections,
  expressionBanks: [],
  projectionHorizon: {
    schemaVersion: 1,
    id: 'finding-projection-horizon.test.checked-in-depressive-symptoms',
    targets: [
      {
        target: { kind: 'information_action', actionId },
        allowedResponses: [
          { kind: 'finding_outcome', outcome: 'present' },
          { kind: 'finding_outcome', outcome: 'absent' },
        ],
        expressionDisplayChannel: null,
      },
    ],
  },
});

describe('checked-in finding projections', () => {
  it('owns the exact approved 17-item depressive-symptom history horizon', () => {
    expect(catalog.id).toBe('registry.catalog.finding-projections');
    expect(catalog.projections).toHaveLength(49);
    expect(findingIds.size).toBe(17);
    expect(findingDefinitions).toHaveLength(17);
    expect(
      catalog.projections.every(
        (projection) =>
          projection.target.kind === 'information_action' &&
          projection.target.actionId === actionId &&
          projection.review.status === 'approved' &&
          projection.developerOpinionIds?.includes(opinionId),
      ),
    ).toBe(true);

    const sourceStates = catalog.projections.map((projection) => {
      const binding = projection.sourceBindings[0]!;
      if (binding.kind !== 'canonical_finding') throw new Error('Unexpected proposition binding.');
      return binding.allowedStates[0]!;
    });
    expect(sourceStates.filter((state) => state === 'present')).toHaveLength(17);
    expect(sourceStates.filter((state) => state === 'absent')).toHaveLength(17);
    expect(sourceStates.filter((state) => state === 'subthreshold')).toHaveLength(15);
    expect(
      catalog.projections.filter((projection) => projection.deriveAbsentWhenNoCandidate === true),
    ).toHaveLength(17);
  });

  it('includes brief sleep and suicidality without importing detailed risk-assessment items', () => {
    expect([...findingIds]).toEqual(
      expect.arrayContaining([
        'finding.sleep.current-insomnia',
        'finding.sleep.current-hypersomnia',
        'finding.safety.current-passive-death-wish',
        'finding.safety.current-active-suicidal-ideation',
      ]),
    );
    expect([...findingIds]).not.toEqual(
      expect.arrayContaining([
        'finding.safety.suicide-attempt-history',
        'finding.safety.suicide-preparatory-behavior-history',
        'finding.safety.current-suicide-preparatory-behavior',
        'finding.safety.current-self-reported-weapon-access',
      ]),
    );
  });

  it('rejects duplicate projection IDs and malformed closed negatives', () => {
    const duplicate = structuredClone(findingProjectionsJson);
    duplicate.projections.push(structuredClone(duplicate.projections[0]!));
    expect(FindingProjectionCatalogSchema.safeParse(duplicate).success).toBe(false);

    const malformed = structuredClone(findingProjectionsJson);
    const absent = malformed.projections.find(
      (projection) => projection.deriveAbsentWhenNoCandidate === true,
    )!;
    absent.sourceBindings[0]!.allowedStates = ['present', 'absent'];
    expect(FindingProjectionCatalogSchema.safeParse(malformed).success).toBe(false);
  });

  it('compiles positive, subthreshold, and derived-negative results without changing hidden truth', () => {
    const result = compileSharedFindings(compileRequest());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);

    expect(result.value.findings).toHaveLength(17);
    expect(result.value.projections).toHaveLength(17);
    expect(
      result.value.findings.find(
        (finding) => finding.definitionId === 'finding.history.current-fatigue-low-energy',
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'subthreshold' });
    expect(
      result.value.projections.find(
        (projection) =>
          projection.projectionId ===
          'finding-projection.history.depressive-symptoms.fatigue-low-energy.subthreshold',
      )?.response,
    ).toEqual({ kind: 'finding_outcome', outcome: 'present' });
    expect(
      result.value.findings.find(
        (finding) => finding.definitionId === 'finding.history.current-anhedonia',
      )?.value,
    ).toEqual({ kind: 'outcome', value: 'absent' });
    expect(
      result.value.projections.find(
        (projection) =>
          projection.projectionId ===
          'finding-projection.history.depressive-symptoms.anhedonia.absent',
      )?.response,
    ).toEqual({ kind: 'finding_outcome', outcome: 'absent' });
    expect(verifyCompiledSharedFindingIntegrity(result.value)).toEqual({
      ok: true,
      value: result.value,
    });
  });
});
