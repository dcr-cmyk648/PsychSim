import { describe, expect, it } from 'vitest';

import {
  PatientOwnedStructuredTestResultProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  TestDefinitionSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type PatientOwnedStructuredTestResultCompilationRequest,
  type PatientOwnedStructuredTestResultPayload,
  type TestDefinition,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  compilePatientOwnedStructuredTestResult,
  verifyPatientOwnedStructuredTestResultCompilationIntegrity,
} from './patient-owned-structured-test-result-compiler';

const patientStateId = 'resolved-patient-state.test.patient-owned-structured-test';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.patient-owned-result',
  definitions: [
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.diagnostic-result',
      kind: 'diagnostic_study_result',
    },
    {
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'patient-scene-source-role.test.laboratory-result',
      kind: 'laboratory_result',
    },
  ],
});

const compileSourceHorizon = (
  targetPatientStateId = patientStateId,
): CatalogPatientSceneSourceInstanceCompilationArtifact => {
  const compiled = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.test.patient-owned.${targetPatientStateId
      .split('.')
      .at(-1)}`,
    patientStateId: targetPatientStateId,
    sourceDefinitionCatalog,
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const unreviewed = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [],
};

const definition = (
  id: string,
  category: 'laboratory' | 'diagnostic_study',
  resultContract: TestDefinition['resultContract'],
): TestDefinition =>
  TestDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id,
    actionId: `info.${id}`,
    label: `Synthetic ${id}`,
    category,
    contextInputs: [],
    medicalReviewStatus: 'unreviewed',
    sourceUseNoteIds: [],
    resultContract,
    generator: {
      type: 'patient_owned',
      reason: 'Synthetic test-only authored result.',
    },
  });

const definitions = {
  numeric: definition('test.lab.patient-owned.numeric', 'laboratory', {
    kind: 'numeric_panel',
    componentPolicy: 'patient_defined',
    componentDefinitionIds: [],
  }),
  categorical: definition('test.lab.patient-owned.categorical', 'laboratory', {
    kind: 'categorical_panel',
    componentPolicy: 'patient_defined',
    componentDefinitionIds: [],
  }),
  binary: definition('test.lab.patient-owned.binary', 'laboratory', {
    kind: 'binary',
    allowedOutcomes: ['positive', 'negative', 'indeterminate'],
  }),
  structured: definition('test.diagnostic.patient-owned.imaging', 'diagnostic_study', {
    kind: 'structured_findings',
    resultDomain: 'imaging',
    findingPolicy: 'patient_defined',
  }),
} as const;

const payloads = {
  numeric: {
    kind: 'numeric_panel',
    components: [
      {
        componentDefinitionId: 'lab-component.test.patient-owned',
        value: 1.5,
        displayValue: '1.5',
        unit: 'mg/L',
        ucumCode: 'mg/L',
        referenceInterval: {
          low: 1,
          high: 2,
          unit: 'mg/L',
          ucumCode: 'mg/L',
          display: '1–2 mg/L',
          populationDefinitionId: 'reference-interval.test.patient-owned',
          sourceUseNoteIds: [],
        },
        interpretation: 'normal',
      },
    ],
  },
  categorical: {
    kind: 'categorical_panel',
    components: [
      {
        componentDefinitionId: 'test-component.test.patient-owned',
        valueId: 'test-value.test.negative',
        displayValue: 'Synthetic negative',
        interpretationIds: [],
      },
    ],
  },
  binary: {
    kind: 'binary',
    outcome: 'negative',
    displayValue: 'Synthetic negative',
    interpretationIds: [],
  },
  structured: {
    kind: 'structured_findings',
    resultDomain: 'imaging',
    findings: [
      {
        findingId: 'finding.test.patient-owned.no-acute-change',
        outcome: 'absent',
        displayValue: 'Synthetic test-only finding',
      },
    ],
    overallInterpretationId: null,
  },
} as const satisfies Record<string, PatientOwnedStructuredTestResultPayload>;

type DefinitionKey = keyof typeof definitions;

const request = (
  key: DefinitionKey,
  overrides: Partial<PatientOwnedStructuredTestResultCompilationRequest> = {},
): PatientOwnedStructuredTestResultCompilationRequest => {
  const testDefinition = definitions[key];
  const resultProfile = PatientOwnedStructuredTestResultProfileSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `patient-owned-test-result-profile.test.${key}`,
    testDefinitionRef: {
      id: testDefinition.id,
      contentVersion: testDefinition.contentVersion,
    },
    payload: payloads[key],
    sourceUseNoteIds: [],
    medicalReviewStatus: 'unreviewed',
    review: unreviewed,
  });
  return {
    schemaVersion: 1,
    id: `patient-owned-structured-test-result-request.test.${key}`,
    patientStateId,
    testDefinition,
    resultProfile,
    sourceDefinitionRef: {
      id:
        testDefinition.category === 'laboratory'
          ? 'patient-scene-source-role.test.laboratory-result'
          : 'patient-scene-source-role.test.diagnostic-result',
      contentVersion: '1.0.0',
    },
    sourceInstanceCompilation: compileSourceHorizon(),
    timeScopeId: 'time-scope.current',
    ...overrides,
  };
};

const compileOrThrow = (input: PatientOwnedStructuredTestResultCompilationRequest) => {
  const compiled = compilePatientOwnedStructuredTestResult(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('patient-owned structured-test result compiler', () => {
  it.each<DefinitionKey>(['numeric', 'categorical', 'binary', 'structured'])(
    'freezes one exact authored %s result with source and owner replay',
    (key) => {
      const artifact = compileOrThrow(request(key));
      expect(artifact.result).toMatchObject({
        testDefinitionId: definitions[key].id,
        kind: payloads[key].kind,
        resolution: {
          origin: 'authored',
          ownerId: `patient-owned-test-result-profile.test.${key}`,
        },
      });
      expect(artifact.sourceInstanceRef.kind).toBe(
        definitions[key].category === 'laboratory'
          ? 'laboratory_result'
          : 'diagnostic_study_result',
      );
      expect(verifyPatientOwnedStructuredTestResultCompilationIntegrity(artifact).ok).toBe(true);
      expect(compilePatientOwnedStructuredTestResult(request(key))).toEqual({
        ok: true,
        value: artifact,
      });
      expect(JSON.stringify(artifact)).not.toMatch(/points?|score|clinical correctness/i);
    },
  );

  it('rejects generated tests, crossed profiles, invalid result contracts, and wrong sources', () => {
    const generated = structuredClone(definitions.numeric);
    generated.resultContract = {
      kind: 'numeric_panel',
      componentPolicy: 'fixed',
      componentDefinitionIds: ['lab-component.test.generated'],
    };
    generated.generator = {
      type: 'numeric_panel',
      profiles: [
        {
          id: 'test-profile.test.generated',
          priority: 0,
          when: { anyDiagnosisIds: [], allClinicalTagIds: [] },
          referenceIntervalSetId: 'reference-interval.test.generated',
          referenceIntervalLabel: 'Synthetic',
          incidentalAbnormalProbability: 0,
          components: [
            {
              id: 'lab-component.test.generated',
              label: 'Synthetic',
              unit: 'mg/L',
              ucumCode: 'mg/L',
              decimals: 1,
              referenceRange: { minimum: 1, maximum: 2 },
              normalGenerationRange: { minimum: 1.2, maximum: 1.8 },
              mildAbnormalRanges: [],
              review: unreviewed,
            },
          ],
          review: unreviewed,
        },
      ],
    };
    expect(
      compilePatientOwnedStructuredTestResult(
        request('numeric', { testDefinition: TestDefinitionSchema.parse(generated) }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const crossedProfile = structuredClone(request('binary').resultProfile);
    crossedProfile.testDefinitionRef.id = definitions.categorical.id;
    expect(
      compilePatientOwnedStructuredTestResult(
        request('binary', {
          resultProfile: crossedProfile,
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    const disallowedOutcome = structuredClone(request('binary').resultProfile);
    if (disallowedOutcome.payload.kind !== 'binary') throw new Error('Expected binary payload.');
    disallowedOutcome.payload.outcome = 'indeterminate';
    const binaryWithoutIndeterminate = structuredClone(definitions.binary);
    if (binaryWithoutIndeterminate.resultContract.kind !== 'binary') {
      throw new Error('Expected binary contract.');
    }
    binaryWithoutIndeterminate.resultContract.allowedOutcomes = ['positive', 'negative'];
    expect(
      compilePatientOwnedStructuredTestResult(
        request('binary', {
          testDefinition: binaryWithoutIndeterminate,
          resultProfile: disallowedOutcome,
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'RESULT_CONTRACT_MISMATCH' } });

    expect(
      compilePatientOwnedStructuredTestResult(
        request('structured', {
          sourceDefinitionRef: {
            id: 'patient-scene-source-role.test.laboratory-result',
            contentVersion: '1.0.0',
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compilePatientOwnedStructuredTestResult(
        request('binary', {
          sourceInstanceCompilation: compileSourceHorizon(
            'resolved-patient-state.test.patient-owned.other',
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('detects exact result, profile, and upstream source tampering', () => {
    const artifact = compileOrThrow(request('binary'));

    const changedResult = structuredClone(artifact);
    if (changedResult.result.kind !== 'binary') throw new Error('Expected binary result.');
    changedResult.result.displayValue = 'Changed';
    expect(verifyPatientOwnedStructuredTestResultCompilationIntegrity(changedResult)).toMatchObject(
      {
        ok: false,
        error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
      },
    );

    const changedProfile = structuredClone(artifact);
    changedProfile.compileRequest.resultProfile.sourceUseNoteIds = ['source-use-note.test.changed'];
    expect(
      verifyPatientOwnedStructuredTestResultCompilationIntegrity(changedProfile),
    ).toMatchObject({
      ok: false,
      error: { code: 'RESULT_PROFILE_FINGERPRINT_MISMATCH' },
    });

    const changedSourceCatalog = structuredClone(artifact);
    changedSourceCatalog.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog.contentVersion =
      '2.0.0';
    expect(
      verifyPatientOwnedStructuredTestResultCompilationIntegrity(changedSourceCatalog),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
