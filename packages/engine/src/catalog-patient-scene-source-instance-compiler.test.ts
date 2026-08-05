import {
  CatalogPatientSceneSourceInstanceCompilationArtifactSchema,
  type CatalogPatientSceneSourceInstanceCompilationRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compilePatientSceneSourceInstancesFromCatalog,
  verifyCatalogPatientSceneSourceInstanceCompilationIntegrity,
} from './catalog-patient-scene-source-instance-compiler';

const sourceDefinitionCatalog: CatalogPatientSceneSourceInstanceCompilationRequest['sourceDefinitionCatalog'] =
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'registry.catalog.test.patient-scene-source-definitions',
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.laboratory-result',
        kind: 'laboratory_result',
      },
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'patient-scene-source-definition.test.patient-report',
        kind: 'patient_report',
      },
    ],
  };

const request = (
  overrides: Partial<CatalogPatientSceneSourceInstanceCompilationRequest> = {},
): CatalogPatientSceneSourceInstanceCompilationRequest => ({
  schemaVersion: 1,
  id: 'catalog-patient-scene-source-instance-request.test',
  patientStateId: 'resolved-patient-state.test.catalog-source-horizon',
  sourceDefinitionCatalog,
  ...overrides,
});

const expectCompilation = (input: unknown) => {
  const result = compilePatientSceneSourceInstancesFromCatalog(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-305 catalog-backed patient-scene source-instance compilation', () => {
  it('derives one exact D-291 horizon from the versioned source-role catalog', () => {
    const artifact = expectCompilation(request());

    expect(artifact.patientStateId).toBe(request().patientStateId);
    expect(artifact.sourceDefinitionCatalogRef).toMatchObject({
      id: sourceDefinitionCatalog.id,
      contentVersion: sourceDefinitionCatalog.contentVersion,
    });
    expect(artifact.sourceInstanceCompilation.compileRequest.definitions).toEqual(
      sourceDefinitionCatalog.definitions,
    );
    expect(artifact.sourceInstanceCompilation.sourceInstances).toHaveLength(2);
    expect(CatalogPatientSceneSourceInstanceCompilationArtifactSchema.parse(artifact)).toEqual(
      artifact,
    );
    expect(verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(artifact).not.toHaveProperty('credibility');
    expect(artifact).not.toHaveProperty('accuracy');
    expect(artifact).not.toHaveProperty('informationActionIds');
    expect(artifact).not.toHaveProperty('points');
  });

  it('reuses role identities while preserving different patient-bound horizons', () => {
    const first = expectCompilation(request());
    const second = expectCompilation(
      request({
        patientStateId: 'resolved-patient-state.test.catalog-source-horizon.other',
      }),
    );

    expect(second.sourceInstanceCompilation.sourceInstances.map((instance) => instance.id)).toEqual(
      first.sourceInstanceCompilation.sourceInstances.map((instance) => instance.id),
    );
    expect(second.patientStateId).not.toBe(first.patientStateId);
    expect(second.id).not.toBe(first.id);
    expect(second.sourceInstanceCompilation.id).not.toBe(first.sourceInstanceCompilation.id);
  });

  it('rejects an invalid catalog instead of independently repairing its definition horizon', () => {
    const duplicateCatalog = structuredClone(sourceDefinitionCatalog);
    duplicateCatalog.definitions[1]!.id = duplicateCatalog.definitions[0]!.id;

    expect(
      compilePatientSceneSourceInstancesFromCatalog(
        request({ sourceDefinitionCatalog: duplicateCatalog }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('detects catalog, nested D-291, request, and payload tampering', () => {
    const artifact = expectCompilation(request());

    const catalogTamper = structuredClone(artifact);
    catalogTamper.sourceDefinitionCatalogRef.fingerprint =
      'fingerprint.catalog-patient-scene-source-instance-compilation.source-catalog.fnv1a64.0000000000000000';
    expect(
      verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(catalogTamper),
    ).toMatchObject({
      ok: false,
      error: { code: 'CATALOG_FINGERPRINT_MISMATCH' },
    });

    const nestedTamper = structuredClone(artifact);
    nestedTamper.sourceInstanceCompilation.inputFingerprint =
      'fingerprint.patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(nestedTamper)).toMatchObject(
      {
        ok: false,
        error: { code: 'SOURCE_INSTANCE_COMPILATION_INVALID' },
      },
    );

    const inputTamper = structuredClone(artifact);
    inputTamper.inputFingerprint =
      'fingerprint.catalog-patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(inputTamper)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });

    const payloadTamper = structuredClone(artifact);
    payloadTamper.payloadFingerprint =
      'fingerprint.catalog-patient-scene-source-instance-compilation.payload.fnv1a64.0000000000000000';
    payloadTamper.id = 'catalog-patient-scene-source-instance-compilation.0000000000000000';
    expect(
      verifyCatalogPatientSceneSourceInstanceCompilationIntegrity(payloadTamper),
    ).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });
  });
});
