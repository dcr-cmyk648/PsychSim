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
const depressiveActionId = 'info.history.depressive-symptoms';
const safetyActionId = 'info.history.suicide-safety';
const maniaActionId = 'info.history.mania';
const presentingProblemActionId = 'info.history.presenting-problem';
const depressiveOpinionId =
  'developer-opinion.mdd-depressive-symptom-assessment-horizon.2026-08-03';
const safetyOpinionId = 'developer-opinion.suicide-self-harm-assessment-horizon.2026-07-25';
const maniaOpinionId = 'developer-opinion.mania-history-source-time-result-boundary.2026-07-28';
const presentingProblemOpinionId =
  'developer-opinion.mdd-presenting-problem-functional-impact-result-boundary.2026-07-27';

const approvedReview: ClinicalRuleReview = {
  status: 'approved',
  reviewerId: 'reviewer.dustin-rowland',
  reviewedAt: '2026-08-03T13:50:00.000Z',
  sourceUseNoteIds: [],
};

const depressiveProjections = catalog.projections.filter(
  (projection) =>
    projection.target.kind === 'information_action' &&
    projection.target.actionId === depressiveActionId,
);
const safetyProjections = catalog.projections.filter(
  (projection) =>
    projection.target.kind === 'information_action' &&
    projection.target.actionId === safetyActionId,
);
const maniaProjections = catalog.projections.filter(
  (projection) =>
    projection.target.kind === 'information_action' && projection.target.actionId === maniaActionId,
);
const presentingProblemProjections = catalog.projections.filter(
  (projection) =>
    projection.target.kind === 'information_action' &&
    projection.target.actionId === presentingProblemActionId,
);
const depressiveFindingIds = new Set(
  depressiveProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const safetyFindingIds = new Set(
  safetyProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const maniaFindingIds = new Set(
  maniaProjections.flatMap((projection) =>
    projection.sourceBindings.flatMap((binding) =>
      binding.kind === 'canonical_finding' ? [binding.findingDefinitionId] : [],
    ),
  ),
);
const findingDefinitions = catalogs.findings.filter((finding) =>
  depressiveFindingIds.has(finding.id),
);
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
  projections: depressiveProjections,
  expressionBanks: [],
  projectionHorizon: {
    schemaVersion: 1,
    id: 'finding-projection-horizon.test.checked-in-depressive-symptoms',
    targets: [
      {
        target: { kind: 'information_action', actionId: depressiveActionId },
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
    expect(catalog.projections).toHaveLength(113);
    expect(depressiveProjections).toHaveLength(49);
    expect(depressiveFindingIds.size).toBe(17);
    expect(findingDefinitions).toHaveLength(17);
    expect(
      depressiveProjections.every(
        (projection) =>
          projection.target.kind === 'information_action' &&
          projection.target.actionId === depressiveActionId &&
          projection.review.status === 'approved' &&
          projection.developerOpinionIds?.includes(depressiveOpinionId),
      ),
    ).toBe(true);

    const sourceStates = depressiveProjections.map((projection) => {
      const binding = projection.sourceBindings[0]!;
      if (binding.kind !== 'canonical_finding') throw new Error('Unexpected proposition binding.');
      return binding.allowedStates[0]!;
    });
    expect(sourceStates.filter((state) => state === 'present')).toHaveLength(17);
    expect(sourceStates.filter((state) => state === 'absent')).toHaveLength(17);
    expect(sourceStates.filter((state) => state === 'subthreshold')).toHaveLength(15);
    expect(
      depressiveProjections.filter((projection) => projection.deriveAbsentWhenNoCandidate === true),
    ).toHaveLength(17);
  });

  it('projects broad current functional impact without replacing attributed impairment', () => {
    expect(presentingProblemProjections).toHaveLength(2);
    expect(
      presentingProblemProjections.map((projection) => ({
        allowedStates:
          projection.sourceBindings[0]?.kind === 'canonical_finding'
            ? projection.sourceBindings[0].allowedStates
            : [],
        deriveAbsentWhenNoCandidate: projection.deriveAbsentWhenNoCandidate ?? false,
        response: projection.response,
      })),
    ).toEqual([
      {
        allowedStates: ['present', 'subthreshold'],
        deriveAbsentWhenNoCandidate: false,
        response: { kind: 'finding_outcome', outcome: 'present' },
      },
      {
        allowedStates: ['absent'],
        deriveAbsentWhenNoCandidate: true,
        response: { kind: 'finding_outcome', outcome: 'absent' },
      },
    ]);
    expect(
      presentingProblemProjections.every(
        (projection) =>
          projection.developerOpinionIds?.includes(presentingProblemOpinionId) &&
          projection.sourceBindings.every(
            (binding) =>
              binding.kind === 'canonical_finding' &&
              binding.findingDefinitionId === 'finding.function.self-reported-current-impact',
          ),
      ),
    ).toBe(true);
  });

  it('includes brief sleep and suicidality without importing detailed risk-assessment items', () => {
    expect([...depressiveFindingIds]).toEqual(
      expect.arrayContaining([
        'finding.sleep.current-insomnia',
        'finding.sleep.current-hypersomnia',
        'finding.safety.current-passive-death-wish',
        'finding.safety.current-active-suicidal-ideation',
      ]),
    );
    expect([...depressiveFindingIds]).not.toEqual(
      expect.arrayContaining([
        'finding.safety.suicide-attempt-history',
        'finding.safety.suicide-preparatory-behavior-history',
        'finding.safety.current-suicide-preparatory-behavior',
        'finding.safety.current-self-reported-weapon-access',
      ]),
    );
  });

  it('keeps the nine detailed safety facts separate without creating a risk conclusion', () => {
    expect(safetyProjections).toHaveLength(18);
    expect([...safetyFindingIds].sort()).toEqual(
      [
        'finding.safety.current-active-suicidal-ideation',
        'finding.safety.current-passive-death-wish',
        'finding.safety.current-self-reported-access-to-suicide-means',
        'finding.safety.current-specific-suicide-plan',
        'finding.safety.current-suicidal-intent',
        'finding.safety.current-suicide-preparatory-behavior',
        'finding.safety.recent-suicide-attempt',
        'finding.safety.suicide-attempt-history',
        'finding.safety.suicide-preparatory-behavior-history',
      ].sort(),
    );
    expect(
      safetyProjections.every(
        (projection) =>
          projection.target.kind === 'information_action' &&
          projection.target.actionId === safetyActionId &&
          projection.review.status === 'approved' &&
          projection.developerOpinionIds?.includes(safetyOpinionId),
      ),
    ).toBe(true);
    expect(
      safetyProjections.filter(
        (projection) =>
          projection.response.kind === 'finding_outcome' &&
          projection.response.outcome === 'present',
      ),
    ).toHaveLength(9);
    expect(
      safetyProjections.filter(
        (projection) =>
          projection.response.kind === 'finding_outcome' &&
          projection.response.outcome === 'absent' &&
          projection.deriveAbsentWhenNoCandidate === true,
      ),
    ).toHaveLength(9);
    expect(JSON.stringify(safetyProjections)).not.toMatch(
      /low risk|high risk|outpatient appropriate|emergency transfer|disposition|point|score/i,
    );
  });

  it('keeps current and past mania-history findings separate without inferring an episode', () => {
    expect(maniaProjections).toHaveLength(32);
    expect(maniaFindingIds.size).toBe(16);
    expect([...maniaFindingIds].filter((id) => id.includes('.current-'))).toHaveLength(8);
    expect([...maniaFindingIds].filter((id) => id.includes('.past-episodic-'))).toHaveLength(8);
    expect([...maniaFindingIds]).toEqual(
      expect.arrayContaining([
        'finding.history.current-grandiosity',
        'finding.history.past-episodic-grandiosity',
        'finding.history.current-decreased-sleep-need',
        'finding.history.past-episodic-decreased-sleep-need',
      ]),
    );
    expect([...maniaFindingIds]).not.toContain('finding.mse.current-observed-grandiosity');
    expect(
      maniaProjections.every(
        (projection) =>
          projection.target.kind === 'information_action' &&
          projection.target.actionId === maniaActionId &&
          projection.review.status === 'approved' &&
          projection.developerOpinionIds?.includes(maniaOpinionId),
      ),
    ).toBe(true);
    expect(
      maniaProjections.filter((projection) => projection.deriveAbsentWhenNoCandidate === true),
    ).toHaveLength(16);
    expect(JSON.stringify(maniaProjections)).not.toMatch(
      /bipolar diagnosis|manic episode|hypomanic episode|point|score|treatment implication/i,
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
