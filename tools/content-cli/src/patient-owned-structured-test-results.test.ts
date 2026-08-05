import {
  PatientOwnedStructuredTestResultProfileSchema,
  PatientSceneSourceDefinitionCatalogSchema,
  TestDefinitionSchema,
  type PatientOwnedStructuredTestResultPayload,
  type TestDefinition,
} from '@psychsim/schemas';
import {
  compilePatientOwnedStructuredTestResult,
  compilePatientSceneSourceInstancesFromCatalog,
  verifyPatientOwnedStructuredTestResultCompilationIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import brainMriTestJson from '../../../content/catalogs/tests/definitions/brain-mri.test.json';
import ecgTestJson from '../../../content/catalogs/tests/definitions/ecg.test.json';
import eegTestJson from '../../../content/catalogs/tests/definitions/eeg.test.json';
import headCtTestJson from '../../../content/catalogs/tests/definitions/head-ct.test.json';
import medicationLevelTestJson from '../../../content/catalogs/tests/definitions/medication-level.test.json';
import pharmacogenomicsTestJson from '../../../content/catalogs/tests/definitions/pharmacogenomics.test.json';
import pregnancyTestJson from '../../../content/catalogs/tests/definitions/pregnancy.test.json';
import urineToxicologyTestJson from '../../../content/catalogs/tests/definitions/urine-toxicology.test.json';
import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';

const patientOwnedDefinitions = [
  brainMriTestJson,
  ecgTestJson,
  eegTestJson,
  headCtTestJson,
  medicationLevelTestJson,
  pharmacogenomicsTestJson,
  pregnancyTestJson,
  urineToxicologyTestJson,
].map((definition) => TestDefinitionSchema.parse(definition));

const sourceDefinitionCatalog =
  PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);
const patientStateId = 'resolved-patient-state.checked-in.patient-owned-test-results';
const sourceCompilationResult = compilePatientSceneSourceInstancesFromCatalog({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.checked-in.patient-owned-test-results',
  patientStateId,
  sourceDefinitionCatalog,
});
if (!sourceCompilationResult.ok) {
  throw new Error(sourceCompilationResult.error.message);
}
const sourceInstanceCompilation = sourceCompilationResult.value;

const syntheticPayloadFor = (
  definition: TestDefinition,
): PatientOwnedStructuredTestResultPayload => {
  const contract = definition.resultContract;
  switch (contract.kind) {
    case 'numeric_panel':
      return {
        kind: 'numeric_panel',
        components: [
          {
            componentDefinitionId: `test-component.synthetic.${definition.id}`,
            value: 1,
            displayValue: '1',
            unit: '1',
            ucumCode: '1',
            referenceInterval: {
              low: 0,
              high: 2,
              unit: '1',
              ucumCode: '1',
              display: '0–2',
              populationDefinitionId: 'reference-interval.synthetic.contract-fixture',
              sourceUseNoteIds: [],
            },
            interpretation: 'normal',
          },
        ],
      };
    case 'categorical_panel':
      return {
        kind: 'categorical_panel',
        components: [
          {
            componentDefinitionId: `test-component.synthetic.${definition.id}`,
            valueId: 'test-value.synthetic.contract-fixture',
            displayValue: 'Synthetic contract fixture',
            interpretationIds: [],
          },
        ],
      };
    case 'binary':
      return {
        kind: 'binary',
        outcome: contract.allowedOutcomes.includes('negative')
          ? 'negative'
          : contract.allowedOutcomes[0]!,
        displayValue: 'Synthetic contract fixture',
        interpretationIds: [],
      };
    case 'structured_findings':
      return {
        kind: 'structured_findings',
        resultDomain: contract.resultDomain,
        findings: [
          {
            findingId: `finding.synthetic.${definition.id}`,
            outcome: 'indeterminate',
            displayValue: 'Synthetic contract fixture',
          },
        ],
        overallInterpretationId: null,
      };
  }
};

describe('checked-in patient-owned structured-test result contracts', () => {
  it('admit every current patient-owned test through an exact authored profile and source role', () => {
    expect(patientOwnedDefinitions.map((definition) => definition.id)).toEqual([
      'test.diagnostic.brain-mri',
      'test.diagnostic.ecg',
      'test.diagnostic.eeg',
      'test.diagnostic.head-ct',
      'test.lab.medication-level',
      'test.lab.pharmacogenomics',
      'test.lab.pregnancy',
      'test.lab.urine-toxicology',
    ]);

    for (const testDefinition of patientOwnedDefinitions) {
      const resultProfile = PatientOwnedStructuredTestResultProfileSchema.parse({
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-owned-test-result-profile.checked-in.${testDefinition.id}`,
        testDefinitionRef: {
          id: testDefinition.id,
          contentVersion: testDefinition.contentVersion,
        },
        payload: syntheticPayloadFor(testDefinition),
        sourceUseNoteIds: [],
        medicalReviewStatus: 'unreviewed',
        review: {
          status: 'unreviewed',
          reviewerId: null,
          reviewedAt: null,
          sourceUseNoteIds: [],
        },
      });
      const request = {
        schemaVersion: 1 as const,
        id: `patient-owned-structured-test-result-request.checked-in.${testDefinition.id}`,
        patientStateId,
        testDefinition,
        resultProfile,
        sourceDefinitionRef: {
          id:
            testDefinition.category === 'laboratory'
              ? 'patient-scene-source-role.laboratory.result'
              : 'patient-scene-source-role.diagnostic-study.result',
          contentVersion: '1.0.0',
        },
        sourceInstanceCompilation,
        timeScopeId: 'time-scope.current',
      };

      const first = compilePatientOwnedStructuredTestResult(request);
      const replay = compilePatientOwnedStructuredTestResult(request);
      expect(first.ok).toBe(true);
      expect(replay).toEqual(first);
      if (!first.ok) throw new Error(first.error.message);

      expect(first.value.result).toMatchObject({
        testDefinitionId: testDefinition.id,
        testDefinitionContentVersion: testDefinition.contentVersion,
        kind: testDefinition.resultContract.kind,
        resolution: {
          origin: 'authored',
          ownerId: resultProfile.id,
          ownerContentVersion: resultProfile.contentVersion,
        },
      });
      expect(first.value.sourceInstanceRef.kind).toBe(
        testDefinition.category === 'laboratory' ? 'laboratory_result' : 'diagnostic_study_result',
      );
      expect(verifyPatientOwnedStructuredTestResultCompilationIntegrity(first.value).ok).toBe(true);
      expect(testDefinition.generator.type).toBe('patient_owned');
      expect(testDefinition.medicalReviewStatus).toBe('unreviewed');
      expect(JSON.stringify(first.value)).not.toMatch(/points?|score|clinical correctness/i);
    }
  });
});
