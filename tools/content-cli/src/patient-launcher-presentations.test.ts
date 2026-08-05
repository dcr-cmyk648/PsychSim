import {
  PatientLauncherPresentationCatalogSchema,
  VariantPoolDefinitionSchema,
} from '@psychsim/schemas';
import {
  resolvePatientLauncherPresentation,
  verifyPatientLauncherPresentationResolutionIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import variantPoolsJson from '../../../content/catalogs/demographics/variant-pools.json';
import launcherPresentationsJson from '../../../content/catalogs/presentations/launcher-presentations.json';

const catalog = PatientLauncherPresentationCatalogSchema.parse(launcherPresentationsJson);
const variantPools = VariantPoolDefinitionSchema.array().parse(variantPoolsJson);
const profile = catalog.profiles[0]!;
const firstNamePool = variantPools.find((pool) => pool.id === profile.firstNamePoolRef.id)!;
const lastNamePool = variantPools.find((pool) => pool.id === profile.lastNamePoolRef.id)!;

const resolveCheckedInPresentation = (seed: string) => {
  const result = resolvePatientLauncherPresentation({
    schemaVersion: 1,
    id: `patient-launcher-presentation-request.checked-in.${seed}`,
    patientStateId: 'resolved-patient-state.checked-in.launcher-presentation',
    seed,
    profile,
    firstNamePool,
    lastNamePool,
    complaintBanks: catalog.complaintBanks,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  expect(verifyPatientLauncherPresentationResolutionIntegrity(result.value).ok).toBe(true);
  return result.value;
};

describe('checked-in patient launcher presentation content', () => {
  it('parses as a reusable cosmetic catalog with broad concise complaint variation', () => {
    expect(catalog).toMatchObject({
      id: 'registry.catalog.patient-launcher-presentations',
      contentVersion: '1.0.0',
    });
    expect(catalog.complaintBanks).toHaveLength(3);
    expect(catalog.complaintBanks.flatMap((bank) => bank.variants)).toHaveLength(48);
    expect(
      catalog.complaintBanks
        .flatMap((bank) => bank.variants)
        .every((variant) => variant.text.length <= 40),
    ).toBe(true);
    expect(firstNamePool.values.length).toBeGreaterThanOrEqual(80);
    expect(lastNamePool.values.length).toBeGreaterThanOrEqual(80);
    expect(profile.middleInitialProbability).toEqual({ numerator: 1, denominator: 4 });
    expect(
      new Set(profile.complaintBankBindings.map((binding) => binding.specificityPriority)),
    ).toEqual(new Set([100]));
    expect(JSON.stringify(catalog)).not.toMatch(
      /diagnosisDefinition|findingDefinition|clinicalRule|pointValue|treatmentPathway|optimal plan/i,
    );
  });

  it('resolves deterministically while varying names, middle initials, banks, and complaints', () => {
    const first = resolveCheckedInPresentation('seed.checked-in.launcher.17');
    expect(resolveCheckedInPresentation('seed.checked-in.launcher.17')).toEqual(first);

    const resolutions = Array.from(
      { length: 512 },
      (_, index) =>
        resolveCheckedInPresentation(`seed.checked-in.launcher.${index}`).resolvedPresentation,
    );
    expect(new Set(resolutions.map((value) => value.fictionalName.firstName)).size).toBeGreaterThan(
      60,
    );
    expect(new Set(resolutions.map((value) => value.fictionalName.lastName)).size).toBeGreaterThan(
      60,
    );
    expect(new Set(resolutions.map((value) => value.chiefComplaint.bankRef.id))).toEqual(
      new Set(catalog.complaintBanks.map((bank) => bank.id)),
    );
    expect(
      new Set(resolutions.map((value) => value.chiefComplaint.variantId)).size,
    ).toBeGreaterThan(40);
    expect(resolutions.some((value) => value.fictionalName.middleInitial === null)).toBe(true);
    expect(resolutions.some((value) => value.fictionalName.middleInitial !== null)).toBe(true);
    expect(
      resolutions.every(
        (value) =>
          !('seed' in value) &&
          !('diagnosisId' in value) &&
          !('pointValue' in value) &&
          !('ruleId' in value),
      ),
    ).toBe(true);
  }, 15_000);

  it('rejects duplicate complaint text and clinical fields smuggled into the catalog', () => {
    const duplicate = structuredClone(launcherPresentationsJson);
    duplicate.complaintBanks[0]!.variants[1]!.text = duplicate.complaintBanks[0]!.variants[0]!.text;
    expect(PatientLauncherPresentationCatalogSchema.safeParse(duplicate).success).toBe(false);

    const clinicalLeak = structuredClone(
      launcherPresentationsJson,
    ) as typeof launcherPresentationsJson & {
      diagnosisDefinitionId?: string;
    };
    clinicalLeak.diagnosisDefinitionId = 'diagnosis.major-depressive-disorder';
    expect(PatientLauncherPresentationCatalogSchema.safeParse(clinicalLeak).success).toBe(false);
  });
});
