import { describe, expect, it } from 'vitest';

import {
  PatientSceneSourceDefinitionCatalogSchema,
  ReferenceIntervalSetDefinitionSchema,
  TestDefinitionSchema,
  type CatalogPatientSceneSourceInstanceCompilationArtifact,
  type NumericStructuredTestResultCompilationRequest,
  type ReferenceIntervalSetDefinition,
  type TestDefinition,
} from '@psychsim/schemas';

import { compilePatientSceneSourceInstancesFromCatalog } from './catalog-patient-scene-source-instance-compiler';
import {
  compileNumericStructuredTestResult,
  verifyNumericStructuredTestResultCompilationIntegrity,
} from './numeric-structured-test-result-compiler';

const patientStateId = 'resolved-patient-state.test.numeric-structured-test';

const sourceDefinitionCatalog = PatientSceneSourceDefinitionCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'registry.catalog.patient-scene-source-definitions.test.numeric',
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
    id: `catalog-patient-scene-source-instance-request.test.numeric.${targetPatientStateId
      .split('.')
      .at(-1)}`,
    patientStateId: targetPatientStateId,
    sourceDefinitionCatalog,
  });
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

const referenceIntervalSet: ReferenceIntervalSetDefinition =
  ReferenceIntervalSetDefinitionSchema.parse({
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'reference-interval.test.adult-general',
    label: 'Synthetic adult reference interval',
    jurisdiction: 'Test jurisdiction',
    reportingConvention: 'Synthetic test convention',
    unitConvention: 'UCUM',
    referenceIntervalPolicy: 'Synthetic test-only interval owner',
    numericRangeAuthority: 'prototype_unreviewed',
    medicalReviewStatus: 'unreviewed',
    sourceUrls: ['https://example.com/reference-interval'],
    sourceUseNoteIds: ['source-use-note.test.reference-interval'],
  });

const testDefinition: TestDefinition = TestDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'test.lab.numeric-structured-test',
  actionId: 'info.labs.numeric-structured-test',
  label: 'Synthetic numeric panel',
  category: 'laboratory',
  contextInputs: ['age_years', 'sex_for_reference', 'diagnosis_ids', 'clinical_tag_ids'],
  medicalReviewStatus: 'unreviewed',
  sourceUseNoteIds: ['source-use-note.test.numeric-panel'],
  resultContract: {
    kind: 'numeric_panel',
    componentPolicy: 'fixed',
    componentDefinitionIds: ['lab-component.test.alpha', 'lab-component.test.beta'],
  },
  generator: {
    type: 'numeric_panel',
    profiles: [
      {
        id: 'test-profile.numeric.general',
        priority: 0,
        when: {
          anyDiagnosisIds: [],
          allClinicalTagIds: [],
        },
        referenceIntervalSetId: referenceIntervalSet.id,
        referenceIntervalLabel: referenceIntervalSet.label,
        incidentalAbnormalProbability: 0.25,
        components: [
          {
            id: 'lab-component.test.alpha',
            label: 'Alpha',
            unit: 'mg/dL',
            ucumCode: 'mg/dL',
            decimals: 1,
            referenceRange: { minimum: 10, maximum: 20 },
            normalGenerationRange: { minimum: 12, maximum: 18 },
            mildAbnormalRanges: [
              { flag: 'low', minimum: 8, maximum: 9.9, weight: 1 },
              { flag: 'high', minimum: 20.1, maximum: 22, weight: 1 },
            ],
          },
          {
            id: 'lab-component.test.beta',
            label: 'Beta',
            unit: 'mmol/L',
            ucumCode: 'mmol/L',
            decimals: 2,
            referenceRange: { minimum: 1, maximum: 2 },
            normalGenerationRange: { minimum: 1.2, maximum: 1.8 },
            mildAbnormalRanges: [
              { flag: 'low', minimum: 0.8, maximum: 0.99, weight: 1 },
              { flag: 'high', minimum: 2.01, maximum: 2.2, weight: 1 },
            ],
          },
        ],
      },
      {
        id: 'test-profile.numeric.special-diagnosis',
        priority: 10,
        when: {
          anyDiagnosisIds: ['diagnosis.test.special'],
          allClinicalTagIds: ['clinical-tag.test.profile-eligible'],
        },
        referenceIntervalSetId: referenceIntervalSet.id,
        referenceIntervalLabel: referenceIntervalSet.label,
        incidentalAbnormalProbability: 0.5,
        components: [
          {
            id: 'lab-component.test.alpha',
            label: 'Alpha',
            unit: 'mg/dL',
            ucumCode: 'mg/dL',
            decimals: 1,
            referenceRange: { minimum: 10, maximum: 20 },
            normalGenerationRange: { minimum: 13, maximum: 17 },
            mildAbnormalRanges: [
              { flag: 'low', minimum: 8, maximum: 9.9, weight: 1 },
              { flag: 'high', minimum: 20.1, maximum: 22, weight: 1 },
            ],
          },
          {
            id: 'lab-component.test.beta',
            label: 'Beta',
            unit: 'mmol/L',
            ucumCode: 'mmol/L',
            decimals: 2,
            referenceRange: { minimum: 1, maximum: 2 },
            normalGenerationRange: { minimum: 1.3, maximum: 1.7 },
            mildAbnormalRanges: [
              { flag: 'low', minimum: 0.8, maximum: 0.99, weight: 1 },
              { flag: 'high', minimum: 2.01, maximum: 2.2, weight: 1 },
            ],
          },
        ],
      },
    ],
  },
});

const request = (
  overrides: Partial<NumericStructuredTestResultCompilationRequest> = {},
): NumericStructuredTestResultCompilationRequest => ({
  schemaVersion: 1,
  id: 'numeric-structured-test-result-request.test.base',
  patientStateId,
  seed: 'seed.test.numeric-structured-test',
  testDefinition,
  generationContext: {
    ageYears: 42,
    sexForReference: 'female',
    diagnosisIds: [],
    clinicalTagIds: [],
  },
  referenceIntervalSets: [referenceIntervalSet],
  sourceDefinitionRef: {
    id: 'patient-scene-source-role.test.laboratory-result',
    contentVersion: '1.0.0',
  },
  sourceInstanceCompilation: compileSourceHorizon(),
  timeScopeId: 'time-scope.current',
  ...overrides,
});

const compileOrThrow = (input: NumericStructuredTestResultCompilationRequest) => {
  const compiled = compileNumericStructuredTestResult(input);
  if (!compiled.ok) throw new Error(compiled.error.message);
  return compiled.value;
};

describe('numeric structured-test result compiler', () => {
  it('freezes one typed numeric panel with exact profile, interval, source, and replay provenance', () => {
    const artifact = compileOrThrow(request());

    expect(artifact.selectedProfileRef.id).toBe('test-profile.numeric.general');
    expect(artifact.sourceInstanceRef).toMatchObject({
      kind: 'laboratory_result',
      definitionRef: {
        id: 'patient-scene-source-role.test.laboratory-result',
        contentVersion: '1.0.0',
      },
    });
    expect(artifact.result).toMatchObject({
      kind: 'numeric_panel',
      testDefinitionId: testDefinition.id,
      testDefinitionContentVersion: testDefinition.contentVersion,
      timeScopeId: 'time-scope.current',
      resolution: {
        origin: 'deterministic_generation',
        generationProfileId: 'test-profile.numeric.general',
      },
    });
    if (artifact.result.kind !== 'numeric_panel') throw new Error('Expected numeric panel.');
    expect(artifact.result.components).toHaveLength(2);
    expect(
      artifact.result.components.every(
        (component) =>
          component.referenceInterval.populationDefinitionId === referenceIntervalSet.id &&
          component.referenceInterval.sourceUseNoteIds.includes(
            'source-use-note.test.numeric-panel',
          ) &&
          component.referenceInterval.sourceUseNoteIds.includes(
            'source-use-note.test.reference-interval',
          ),
      ),
    ).toBe(true);
    expect(verifyNumericStructuredTestResultCompilationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('is deterministic, normalizes set-like context order, and varies only inside authored ranges', () => {
    const first = compileOrThrow(
      request({
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.test.zeta', 'diagnosis.test.alpha'],
          clinicalTagIds: ['clinical-tag.test.zeta', 'clinical-tag.test.alpha'],
        },
      }),
    );
    const reordered = compileOrThrow(
      request({
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.test.alpha', 'diagnosis.test.zeta'],
          clinicalTagIds: ['clinical-tag.test.alpha', 'clinical-tag.test.zeta'],
        },
      }),
    );
    expect(reordered).toEqual(first);

    const sampled = Array.from({ length: 120 }, (_, index) =>
      compileOrThrow(request({ seed: `seed.test.numeric-structured-test.${index}` })),
    );
    const interpretations = new Set(
      sampled.flatMap((artifact) =>
        artifact.result.kind === 'numeric_panel'
          ? artifact.result.components.map((component) => component.interpretation)
          : [],
      ),
    );
    expect(interpretations.has('normal')).toBe(true);
    expect(interpretations.has('low') || interpretations.has('high')).toBe(true);
    for (const artifact of sampled) {
      if (artifact.result.kind !== 'numeric_panel') throw new Error('Expected numeric panel.');
      expect(
        artifact.result.components.filter((component) => component.interpretation !== 'normal'),
      ).toHaveLength(
        artifact.result.components.some((component) => component.interpretation !== 'normal')
          ? 1
          : 0,
      );
    }
  });

  it('selects the highest-priority matching profile without treating its weight as a point value', () => {
    const artifact = compileOrThrow(
      request({
        generationContext: {
          ageYears: 42,
          sexForReference: 'female',
          diagnosisIds: ['diagnosis.test.special'],
          clinicalTagIds: ['clinical-tag.test.profile-eligible'],
        },
      }),
    );

    expect(artifact.selectedProfileRef.id).toBe('test-profile.numeric.special-diagnosis');
    expect(JSON.stringify(artifact)).not.toContain('point');
  });

  it('rejects patient-owned tests, crossed source horizons, and wrong source-role kinds', () => {
    const patientOwned = structuredClone(testDefinition);
    patientOwned.resultContract = {
      kind: 'binary',
      allowedOutcomes: ['positive', 'negative'],
    };
    patientOwned.generator = {
      type: 'patient_owned',
      reason: 'Synthetic exact patient-owned result.',
    };
    expect(
      compileNumericStructuredTestResult(
        request({
          testDefinition: patientOwned,
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compileNumericStructuredTestResult(
        request({
          sourceInstanceCompilation: compileSourceHorizon(
            'resolved-patient-state.test.numeric-structured-test.other',
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });

    expect(
      compileNumericStructuredTestResult(
        request({
          sourceDefinitionRef: {
            id: 'patient-scene-source-role.test.diagnostic-result',
            contentVersion: '1.0.0',
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('rejects missing profile context and detects exact output or upstream tampering', () => {
    const noGeneralProfile = structuredClone(testDefinition);
    if (noGeneralProfile.generator.type !== 'numeric_panel') {
      throw new Error('Expected numeric generator.');
    }
    noGeneralProfile.generator.profiles = noGeneralProfile.generator.profiles.filter(
      (profile) => profile.id !== 'test-profile.numeric.general',
    );
    expect(
      compileNumericStructuredTestResult(
        request({
          testDefinition: noGeneralProfile,
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'NO_MATCHING_PROFILE' } });

    const artifact = compileOrThrow(request());
    const changedResult = structuredClone(artifact);
    if (changedResult.result.kind !== 'numeric_panel') throw new Error('Expected numeric panel.');
    changedResult.result.components[0]!.value += 0.1;
    expect(verifyNumericStructuredTestResultCompilationIntegrity(changedResult)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const changedSourceCatalog = structuredClone(artifact);
    changedSourceCatalog.compileRequest.sourceInstanceCompilation.compileRequest.sourceDefinitionCatalog.contentVersion =
      '2.0.0';
    expect(
      verifyNumericStructuredTestResultCompilationIntegrity(changedSourceCatalog),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
