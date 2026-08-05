import {
  PatientSceneSourceDefinitionCatalogSchema,
  ReferenceIntervalSetDefinitionSchema,
  TestDefinitionSchema,
} from '@psychsim/schemas';
import {
  compileNumericStructuredTestResult,
  compilePatientSceneSourceInstancesFromCatalog,
  verifyNumericStructuredTestResultCompilationIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import a1cTestJson from '../../../content/catalogs/tests/definitions/a1c.test.json';
import b12FolateTestJson from '../../../content/catalogs/tests/definitions/b12-folate.test.json';
import cbcTestJson from '../../../content/catalogs/tests/definitions/cbc.test.json';
import cmpTestJson from '../../../content/catalogs/tests/definitions/cmp.test.json';
import lipidsTestJson from '../../../content/catalogs/tests/definitions/lipids.test.json';
import tshTestJson from '../../../content/catalogs/tests/definitions/tsh.test.json';
import referenceIntervalSetsJson from '../../../content/catalogs/tests/reference-interval-sets.json';
import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';

const numericTestDefinitions = [
  a1cTestJson,
  b12FolateTestJson,
  cbcTestJson,
  cmpTestJson,
  lipidsTestJson,
  tshTestJson,
].map((definition) => TestDefinitionSchema.parse(definition));

const referenceIntervalSets =
  ReferenceIntervalSetDefinitionSchema.array().parse(referenceIntervalSetsJson);
const sourceDefinitionCatalog =
  PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);
const patientStateId = 'resolved-patient-state.checked-in.numeric-test-results';

const sourceCompilationResult = compilePatientSceneSourceInstancesFromCatalog({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.checked-in.numeric-test-results',
  patientStateId,
  sourceDefinitionCatalog,
});
if (!sourceCompilationResult.ok) {
  throw new Error(sourceCompilationResult.error.message);
}
const sourceInstanceCompilation = sourceCompilationResult.value;

describe('checked-in numeric structured-test result generation', () => {
  it('compiles every current numeric test through the exact catalog-backed source horizon', () => {
    expect(numericTestDefinitions.map((definition) => definition.id)).toEqual([
      'test.lab.a1c',
      'test.lab.b12-folate',
      'test.lab.cbc',
      'test.lab.cmp',
      'test.lab.lipids',
      'test.lab.tsh',
    ]);

    for (const testDefinition of numericTestDefinitions) {
      const request = {
        schemaVersion: 1 as const,
        id: `numeric-structured-test-result-request.checked-in.${testDefinition.id}`,
        patientStateId,
        seed: `seed.checked-in.${testDefinition.id}`,
        testDefinition,
        generationContext: {
          ageYears: 42,
          sexForReference: 'female' as const,
          diagnosisIds: [],
          clinicalTagIds: [],
        },
        referenceIntervalSets,
        sourceDefinitionRef: {
          id: 'patient-scene-source-role.laboratory.result',
          contentVersion: '1.0.0',
        },
        sourceInstanceCompilation,
        timeScopeId: 'time-scope.current',
      };

      const first = compileNumericStructuredTestResult(request);
      const replay = compileNumericStructuredTestResult(request);
      expect(first.ok).toBe(true);
      expect(replay).toEqual(first);
      if (!first.ok) throw new Error(first.error.message);

      expect(first.value.result).toMatchObject({
        testDefinitionId: testDefinition.id,
        testDefinitionContentVersion: testDefinition.contentVersion,
        kind: 'numeric_panel',
        source: {
          kind: 'laboratory_result',
        },
      });
      expect(first.value.result.kind).toBe('numeric_panel');
      if (first.value.result.kind !== 'numeric_panel') {
        throw new Error(`Expected ${testDefinition.id} to compile a numeric panel.`);
      }
      if (testDefinition.resultContract.kind !== 'numeric_panel') {
        throw new Error(`Expected ${testDefinition.id} to declare a numeric-panel contract.`);
      }
      expect(first.value.result.components).toHaveLength(
        testDefinition.resultContract.componentDefinitionIds.length,
      );
      expect(
        first.value.result.components.every(
          (component) =>
            component.referenceInterval.populationDefinitionId ===
            'reference-interval.prototype-adult-general',
        ),
      ).toBe(true);
      expect(verifyNumericStructuredTestResultCompilationIntegrity(first.value).ok).toBe(true);
      expect(testDefinition.medicalReviewStatus).toBe('unreviewed');
      expect(JSON.stringify(first.value)).not.toMatch(/points?|score|clinical correctness/i);
    }
  });
});
