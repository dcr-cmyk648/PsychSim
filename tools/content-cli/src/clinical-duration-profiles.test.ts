import { ClinicalDurationProfileCatalogSchema } from '@psychsim/schemas';
import {
  resolveConditionClinicalDuration,
  verifyConditionClinicalDurationResolutionIntegrity,
} from '@psychsim/engine/authoring';
import { describe, expect, it } from 'vitest';

import clinicalDurationProfilesJson from '../../../content/catalogs/durations/profiles.json';

const catalog = ClinicalDurationProfileCatalogSchema.parse(clinicalDurationProfilesJson);
const profile = catalog.profiles[0]!;

describe('checked-in clinical-duration profiles', () => {
  it('defines one exact reviewed current-MDD within-state profile', () => {
    expect(catalog).toMatchObject({
      id: 'registry.catalog.clinical-duration-profiles',
      contentVersion: '1.0.0',
    });
    expect(catalog.profiles).toHaveLength(1);
    expect(profile).toMatchObject({
      id: 'duration-profile.mdd.current-episode',
      contentVersion: '1.0.0',
      relatedDiagnosisId: 'diagnosis.major-depressive-disorder',
      interpretation: 'supports_authored_state',
      criterionId: null,
      developerOpinionIds: ['developer-opinion.mdd-current-episode-duration-profile.2026-08-03'],
      review: {
        status: 'approved',
        sourceUseNoteIds: [],
      },
    });
  });

  it('varies only at or above two weeks without encoding probability or points', () => {
    expect(profile.options).toHaveLength(13);
    expect(profile.options.every((option) => option.unit === 'week' && option.value >= 2)).toBe(
      true,
    );
    expect(profile.options.map((option) => option.value)).toEqual([
      2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 26, 39, 52,
    ]);
    const serialized = JSON.stringify(profile);
    expect(serialized).not.toMatch(/probability|prevalence|point|severity|impairment/i);
  });

  it('rejects duplicate profile and option identities', () => {
    const duplicateProfile = structuredClone(clinicalDurationProfilesJson);
    duplicateProfile.profiles.push(structuredClone(duplicateProfile.profiles[0]!));
    expect(ClinicalDurationProfileCatalogSchema.safeParse(duplicateProfile).success).toBe(false);

    const duplicateOption = structuredClone(clinicalDurationProfilesJson);
    duplicateOption.profiles[0]!.options[1]!.id = duplicateOption.profiles[0]!.options[0]!.id;
    expect(ClinicalDurationProfileCatalogSchema.safeParse(duplicateOption).success).toBe(false);
  });

  it('resolves only exact checked-in options and replays every sampled seed', () => {
    const allowedOptionIds = new Set(profile.options.map((option) => option.id));
    const selectedOptionIds = new Set<string>();
    for (let index = 0; index < 512; index += 1) {
      const result = resolveConditionClinicalDuration({
        schemaVersion: 1,
        id: 'condition-duration-request.checked-in.mdd-current-episode',
        patientStateId: 'resolved-patient-state.checked-in.mdd-current-episode',
        conditionState: {
          schemaVersion: 1,
          id: 'condition-state.checked-in.mdd-current-episode',
          diagnosisDefinitionId: 'diagnosis.major-depressive-disorder',
          diagnosisDefinitionContentVersion: '1.3.0',
          clinicalStateId: 'clinical-state.current-episode',
          timeScopeId: 'time-scope.current',
          encounterRelevance: 'focus',
          severityId: null,
          specifierIds: [],
          origin: 'authored',
          resolution: {
            origin: 'authored',
            ownerId: 'patient-template.checked-in.mdd-current-episode',
            ownerContentVersion: '1.0.0',
          },
        },
        profile,
        source: {
          kind: 'patient_report',
          sourceInstanceId: 'source-instance.patient.checked-in.mdd-current-episode',
        },
        timeScopeId: 'time-scope.current',
        seed: `seed.checked-in.mdd-current-episode.${index}`,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error.message);
      expect(allowedOptionIds.has(result.value.resolvedDuration.durationOptionId)).toBe(true);
      expect(result.value.resolvedDuration.value).toBeGreaterThanOrEqual(2);
      expect(verifyConditionClinicalDurationResolutionIntegrity(result.value).ok).toBe(true);
      selectedOptionIds.add(result.value.resolvedDuration.durationOptionId);
    }
    expect(selectedOptionIds).toEqual(allowedOptionIds);
  });
});
