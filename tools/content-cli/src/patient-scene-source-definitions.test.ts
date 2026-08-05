import {
  CatalogPatientSceneSourceInstanceCompilationArtifactSchema,
  PatientSceneSourceDefinitionCatalogSchema,
} from '@psychsim/schemas';
import {
  compilePatientSceneSourceInstancesFromCatalog,
  validatePatientStateScopedSource,
  verifyCatalogPatientSceneSourceInstanceCompilationIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import sourceDefinitionsJson from '../../../content/catalogs/patient-scene-sources/definitions.json';

const catalog = PatientSceneSourceDefinitionCatalogSchema.parse(sourceDefinitionsJson);

const compileForPatient = (patientStateId: string) => {
  const result = compilePatientSceneSourceInstancesFromCatalog({
    schemaVersion: 1,
    id: `catalog-patient-scene-source-instance-request.checked-in.${patientStateId}`,
    patientStateId,
    sourceDefinitionCatalog: catalog,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('checked-in patient-scene source-role definitions', () => {
  it('covers every closed source kind without reliability or scoring semantics', () => {
    expect(catalog).toMatchObject({
      id: 'registry.catalog.patient-scene-source-definitions',
      contentVersion: '1.0.0',
    });
    expect(new Set(catalog.definitions.map((definition) => definition.kind))).toEqual(
      new Set([
        'patient_report',
        'collateral_report',
        'record_review',
        'clinician_observation',
        'instrument_response',
        'measurement',
        'laboratory_result',
        'diagnostic_study_result',
      ]),
    );
    expect(JSON.stringify(catalog)).not.toMatch(
      /credibility|accuracy|reliability|probability|weight|points?|informationAction|wording/i,
    );
  });

  it('keeps reusable role identities stable while preserving exact patient ownership', () => {
    const first = compileForPatient('resolved-patient-state.checked-in.source-role.first');
    const second = compileForPatient('resolved-patient-state.checked-in.source-role.second');
    const firstHorizon = first.sourceInstanceCompilation;
    const secondHorizon = second.sourceInstanceCompilation;

    expect(firstHorizon.sourceInstances.map((instance) => instance.id)).toEqual(
      secondHorizon.sourceInstances.map((instance) => instance.id),
    );
    expect(
      firstHorizon.sourceInstances.every(
        (instance) => instance.patientStateId === first.patientStateId,
      ),
    ).toBe(true);
    expect(
      secondHorizon.sourceInstances.every(
        (instance) => instance.patientStateId === second.patientStateId,
      ),
    ).toBe(true);
    expect(CatalogPatientSceneSourceInstanceCompilationArtifactSchema.parse(first)).toEqual(first);
    expect(verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(first).ok).toBe(true);
    expect(verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(second).ok).toBe(true);

    const patientReport = firstHorizon.sourceInstances.find(
      (instance) => instance.kind === 'patient_report',
    )!;
    expect(
      validatePatientStateScopedSource(
        {
          kind: patientReport.kind,
          sourceInstanceId: patientReport.id,
        },
        first.patientStateId,
        firstHorizon,
      ),
    ).toMatchObject({ ok: true });
    expect(
      validatePatientStateScopedSource(
        {
          kind: patientReport.kind,
          sourceInstanceId: patientReport.id,
        },
        second.patientStateId,
        firstHorizon,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_MISMATCH' },
    });
  });

  it('rejects duplicate or unstably ordered source-role identities', () => {
    const duplicate = structuredClone(sourceDefinitionsJson);
    duplicate.definitions[1]!.id = duplicate.definitions[0]!.id;
    expect(PatientSceneSourceDefinitionCatalogSchema.safeParse(duplicate).success).toBe(false);

    const unsorted = structuredClone(sourceDefinitionsJson);
    unsorted.definitions.reverse();
    expect(PatientSceneSourceDefinitionCatalogSchema.safeParse(unsorted).success).toBe(false);
  });
});
